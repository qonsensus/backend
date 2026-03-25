import { Injectable, Logger } from '@nestjs/common';
import * as dns from 'dns/promises';
import {
  WebRtcTransport,
  DtlsParameters,
  RtpParameters,
  RtpCapabilities,
  MediaKind,
} from 'mediasoup/types';
import { MediasoupService } from './mediasoup.service';
import { Room } from './interfaces/room.interface';
import { Peer } from './interfaces/peer.interface';

// The shape of data we send back to clients when a transport is created.
// The client needs all four fields to complete the WebRTC handshake.
export interface TransportOptions {
  id: string;
  iceParameters: WebRtcTransport['iceParameters'];
  iceCandidates: WebRtcTransport['iceCandidates'];
  dtlsParameters: WebRtcTransport['dtlsParameters'];
}

@Injectable()
export class RoomService {
  private readonly logger = new Logger(RoomService.name);

  // All active rooms, keyed by room ID
  private readonly rooms = new Map<string, Room>();

  constructor(private readonly mediasoupService: MediasoupService) {}

  // ── Room management ───────────────────────────────────────────────────────

  async getOrCreateRoom(roomId: string): Promise<Room> {
    if (this.rooms.has(roomId)) {
      return this.rooms.get(roomId)!;
    }

    const router = await this.mediasoupService.createRouter();

    const room: Room = {
      roomId: roomId,
      router,
      peers: new Map(),
    };

    this.rooms.set(roomId, room);
    this.logger.log(`Room "${roomId}" created`);
    return room;
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  // ── Peer management ───────────────────────────────────────────────────────

  addPeer(room: Room, socketId: string): Peer {
    const peer: Peer = {
      socketId,
      transports: new Map(),
      producers: new Map(),
      consumers: new Map(),
    };
    room.peers.set(socketId, peer);
    this.logger.log(`Peer "${socketId}" joined room "${room.roomId}"`);
    return peer;
  }

  getPeer(room: Room, socketId: string): Peer | undefined {
    return room.peers.get(socketId);
  }

  // Returns all existing producers in a room, excluding the requesting peer.
  // Used to let a newly joined peer know who they can consume.
  getOtherProducers(
    room: Room,
    excludeSocketId: string,
  ): Array<{ producerId: string; socketId: string }> {
    const result: Array<{ producerId: string; socketId: string }> = [];

    for (const [socketId, peer] of room.peers) {
      if (socketId === excludeSocketId) continue;
      for (const producerId of peer.producers.keys()) {
        result.push({ producerId, socketId });
      }
    }

    return result;
  }

  // ── Transport management ──────────────────────────────────────────────────

  async createWebRtcTransport(
    room: Room,
    peer: Peer,
  ): Promise<TransportOptions> {
    // Re-resolve the domain every time so a dynamic IP is always fresh.
    // In production, replace 'yourdomain.com' with an env variable.
    const announcedIp = await this.resolveAnnouncedIp();

    const transport = await room.router.createWebRtcTransport({
      listenIps: [{ ip: '0.0.0.0', announcedIp }],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
      // If you have coturn running, add it here:
      // iceServers: [
      //   { urls: 'turn:yourdomain.com:3478', username: 'user', credential: 'pass' },
      // ],
    });

    transport.on('dtlsstatechange', (state) => {
      if (state === 'failed' || state === 'closed') {
        this.logger.warn(`Transport ${transport.id} DTLS state: ${state}`);
        transport.close();
      }
    });

    peer.transports.set(transport.id, transport);

    return {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
    };
  }

  async connectTransport(
    peer: Peer,
    transportId: string,
    dtlsParameters: DtlsParameters,
  ): Promise<void> {
    const transport = peer.transports.get(transportId);
    if (!transport) throw new Error(`Transport ${transportId} not found`);
    await transport.connect({ dtlsParameters });
  }

  // ── Producer management ───────────────────────────────────────────────────

  async createProducer(
    peer: Peer,
    transportId: string,
    kind: MediaKind,
    rtpParameters: RtpParameters,
  ): Promise<string> {
    const transport = peer.transports.get(transportId);
    if (!transport) throw new Error(`Transport ${transportId} not found`);

    const producer = await transport.produce({ kind, rtpParameters });

    producer.on('transportclose', () => {
      this.logger.log(`Producer ${producer.id} transport closed`);
      producer.close();
      peer.producers.delete(producer.id);
    });

    peer.producers.set(producer.id, producer);
    this.logger.log(`Producer ${producer.id} (${kind}) created`);
    return producer.id;
  }

  // ── Consumer management ───────────────────────────────────────────────────

  async createConsumer(
    room: Room,
    consumerPeer: Peer,
    transportId: string,
    producerId: string,
    rtpCapabilities: RtpCapabilities,
  ): Promise<{
    consumerId: string;
    producerId: string;
    kind: MediaKind;
    rtpParameters: RtpParameters;
  }> {
    // Guard: can the consumer's browser decode this producer's codec?
    if (!room.router.canConsume({ producerId, rtpCapabilities })) {
      throw new Error(`Peer cannot consume producer ${producerId}`);
    }

    const transport = consumerPeer.transports.get(transportId);
    if (!transport) throw new Error(`Transport ${transportId} not found`);

    // Start paused — the client will call resumeConsumer when its <video> is ready
    const consumer = await transport.consume({
      producerId,
      rtpCapabilities,
      paused: true,
    });

    consumer.on('transportclose', () => {
      consumer.close();
      consumerPeer.consumers.delete(consumer.id);
    });

    consumer.on('producerclose', () => {
      // The producer went away — tell the consumer peer to clean up its video element
      consumer.close();
      consumerPeer.consumers.delete(consumer.id);
    });

    consumerPeer.consumers.set(consumer.id, consumer);

    return {
      consumerId: consumer.id,
      producerId,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
    };
  }

  async resumeConsumer(peer: Peer, consumerId: string): Promise<void> {
    const consumer = peer.consumers.get(consumerId);
    if (!consumer) throw new Error(`Consumer ${consumerId} not found`);
    await consumer.resume();
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────

  removePeer(roomId: string, socketId: string): void {
    const room = this.rooms.get(roomId);
    if (!room) return;

    const peer = room.peers.get(socketId);
    if (!peer) return;

    // Closing a transport automatically closes all its producers and consumers
    for (const transport of peer.transports.values()) {
      transport.close();
    }

    room.peers.delete(socketId);
    this.logger.log(`Peer "${socketId}" removed from room "${roomId}"`);

    // Clean up the room itself if it's now empty
    if (room.peers.size === 0) {
      room.router.close();
      this.rooms.delete(roomId);
      this.logger.log(`Room "${roomId}" closed (empty)`);
    }
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  getRtpCapabilities(room: Room) {
    return room.router.rtpCapabilities;
  }

  private async resolveAnnouncedIp(): Promise<string> {
    // For local development just return 127.0.0.1
    if (process.env.NODE_ENV !== 'production') {
      return '127.0.0.1';
    }

    // In production, resolve your domain name to get the current IP.
    // This handles dynamic home IPs cleanly.
    const domain = process.env.ANNOUNCED_DOMAIN ?? 'yourdomain.com';
    const { address } = await dns.lookup(domain);
    return address;
  }
}
