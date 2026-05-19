import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { MediasoupService } from '../mediasoup/mediasoup.service';
import {
  DtlsParameters,
  MediaKind,
  Producer,
  Router,
  RouterRtpCodecCapability,
  RtpCapabilities,
  RtpParameters,
  Worker,
} from 'mediasoup/types';
import * as mediasoup from 'mediasoup';
import { Room } from '../mediasoup/interfaces/room.interface';
import { Peer } from '../mediasoup/interfaces/peer.interface';
import { TransportOptions } from './interfaces/transport-options.interface';
import { createHmac } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { IceServerCredential } from './interfaces/ice-server-credential.interface';

@Injectable()
export class MediasoupRewriteService implements OnModuleInit {
  private readonly logger = new Logger(MediasoupService.name);

  // region State
  private workers: Worker[] = [];
  private workerIndex = 0;

  private readonly mediaCodecs: RouterRtpCodecCapability[] = [
    {
      kind: 'audio',
      mimeType: 'audio/opus',
      clockRate: 48000,
      channels: 2,
    },
    {
      kind: 'video',
      mimeType: 'video/VP8',
      clockRate: 90000,
    },
    {
      kind: 'video',
      mimeType: 'video/VP9',
      clockRate: 90000,
    },
    {
      kind: 'video',
      mimeType: 'video/H264',
      clockRate: 90000,
      parameters: {
        'packetization-mode': 1,
        'profile-level-id': '42e01f',
        'level-asymmetry-allowed': 1,
      },
    },
  ];

  private readonly rooms = new Map<string, Room>();

  // endregion

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    this.logger.log('Initializing MediasoupService...');
    await this.createWorkers();
    this.logger.log('MediasoupService loaded.');
  }

  // region Workers

  private async createWorkers(): Promise<void> {
    // TODO: Load this from the application config instead of hard-coding
    const numWorkers = 1;

    for (let i = 0; i < numWorkers; i++) {
      const worker = await mediasoup.createWorker({
        logLevel: 'warn',
        logTags: ['rtp', 'srtp', 'rtcp'],
      });

      worker.on('died', (error) => {
        this.logger.error(`Worker ${worker.pid} died`, error);
        // TODO: spawn replacement instead of quitting
        process.exit(1);
      });

      this.workers.push(worker);
      this.logger.log(`Worker ${worker.pid} created`);
    }
  }

  private getNextWorker(): Worker {
    const worker = this.workers[this.workerIndex];
    this.workerIndex = (this.workerIndex + 1) % this.workers.length;
    return worker;
  }

  async createRouter(): Promise<Router> {
    const worker = this.getNextWorker();
    const router = await worker.createRouter({ mediaCodecs: this.mediaCodecs });
    this.logger.log(`Router ${router.id} created on worker ${worker.pid}`);
    return router;
  }

  // endregion

  // region Rooms

  async getOrCreateRoom(roomId: string): Promise<Room> {
    if (this.rooms.has(roomId)) {
      return this.rooms.get(roomId)!;
    }
    const router = await this.createRouter();
    const room: Room = {
      roomId,
      router,
      peers: new Map(),
    };
    this.rooms.set(roomId, room);
    this.logger.log(`Room ${roomId} created with router ${router.id}`);
    return room;
  }

  getRoom(id: string): Room | undefined {
    return this.rooms.get(id);
  }

  // endregion

  // region Peers

  addPeerToRoom(roomId: string, socketId: string): Peer {
    const room = this.getRoom(roomId);
    if (!room) throw new Error(`Room ${roomId} not found`);
    const peer: Peer = {
      socketId,
      transports: new Map(),
      producers: new Map(),
      consumers: new Map(),
    };
    room.peers.set(socketId, peer);
    this.logger.log(`Peer ${socketId} added to room ${roomId}`);
    return peer;
  }

  getPeer(roomId: string, socketId: string): Peer | undefined {
    const room = this.getRoom(roomId);
    if (!room) return undefined;
    return room.peers.get(socketId);
  }

  getProducers(
    roomId: string,
    excludeSocketIds: string[],
  ): Array<{ producerId: string; socketId: string }> {
    const room = this.getRoom(roomId);
    if (!room) return [];
    const producers: Array<{ producerId: string; socketId: string }> = [];
    for (const [socketId, peer] of room.peers) {
      if (excludeSocketIds.includes(socketId)) continue;
      for (const producer of peer.producers.values()) {
        producers.push({ producerId: producer.id, socketId });
      }
    }
    return producers;
  }

  removePeer(roomId: string, socketId: string): void {
    const room = this.getRoom(roomId);
    if (!room) return;
    const peer = room.peers.get(socketId);
    if (!peer) return;

    for (const transport of peer.transports.values()) {
      transport.close();
    }

    room.peers.delete(socketId);
    this.logger.log(`Peer ${peer.socketId} removed from room ${roomId}`);

    if (room.peers.size === 0) {
      room.router.close();
      this.rooms.delete(room.roomId);
      this.logger.log(`Room ${room.roomId} closed due to no remaining peers`);
    }
  }

  // endregion

  // region Transport

  async createTransport(
    roomId: string,
    peerId: string,
  ): Promise<TransportOptions> {
    const room = this.getRoom(roomId);
    if (!room) throw new Error(`Room ${roomId} not found`);

    // TODO: This needs to be resolved through the domain that Qonsensus is hosted at, not hard-coded to localhost
    const announcedIp = '127.0.0.1';

    const iceServers: IceServerCredential[] = [];

    if (this.configService.get<string>('NODE_ENV') === 'production') {
      const turnDomain = this.configService.getOrThrow<string>('TURN_HOST');
      const turnPort = this.configService.getOrThrow<number>('TURN_PORT');
      const turnSecret = this.configService.getOrThrow<string>('TURN_SECRET');

      // Time-limited credential via the TURN shared-secret method (RFC 8489 §9.2)
      const turnUsername = `${Math.floor(Date.now() / 1000) + 3600}`; // valid for 1 hour
      const turnCredential = createHmac('sha1', turnSecret)
        .update(turnUsername)
        .digest('base64');

      iceServers.push({
        url: `turn:${turnDomain}:${turnPort}`,
        username: turnUsername,
        credential: turnCredential,
      });
    }

    const transport = await room.router.createWebRtcTransport({
      listenInfos: [
        {
          protocol: 'udp',
          ip: '0.0.0.0',
          announcedAddress: announcedIp,
          portRange: {
            min: this.configService.getOrThrow<number>('MEDIASOUP_MIN'),
            max: this.configService.getOrThrow<number>('MEDIASOUP_MAX'),
          },
        },
        {
          protocol: 'tcp',
          ip: '0.0.0.0',
          announcedAddress: announcedIp,
          portRange: {
            min: this.configService.getOrThrow<number>('MEDIASOUP_MIN'),
            max: this.configService.getOrThrow<number>('MEDIASOUP_MAX'),
          },
        },
      ],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
    });

    transport.on('dtlsstatechange', (state) => {
      if (state === 'failed' || state === 'closed') {
        this.logger.warn(`Transport ${transport.id} DTLS state: ${state}`);
        transport.close();
      }
    });

    const peer = room.peers.get(peerId);
    if (!peer) throw new Error(`Peer ${peerId} not found in room ${roomId}`);
    peer.transports.set(transport.id, transport);
    this.logger.log(
      `Transport ${transport.id} created for peer ${peerId} in room ${roomId}`,
    );

    return {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
      iceServers,
    };
  }

  async connectTransport(
    roomId: string,
    peerId: string,
    transportId: string,
    dtlsParameters: DtlsParameters,
  ): Promise<void> {
    const room = this.getRoom(roomId);
    if (!room) throw new Error(`Room ${roomId} not found`);
    const peer = room.peers.get(peerId);
    if (!peer) throw new Error(`Peer ${peerId} not found`);
    const transport = peer.transports.get(transportId);
    if (!transport) throw new Error(`Transport ${transportId} not found`);

    await transport.connect({ dtlsParameters });
    this.logger.log(
      `Transport ${transportId} connected for peer ${peerId} in room ${roomId}`,
    );
  }

  // endregion

  // region Producer

  async createProducer(
    roomId: string,
    peerId: string,
    transportId: string,
    kind: MediaKind,
    rtpParameters: RtpParameters,
    appData: Record<string, any>,
  ): Promise<string> {
    const room = this.getRoom(roomId);
    if (!room) throw new Error(`Room ${roomId} not found`);
    const peer = room.peers.get(peerId);
    if (!peer) throw new Error(`Peer ${peerId} not found`);
    const transport = peer.transports.get(transportId);
    if (!transport) throw new Error(`Transport ${transportId} not found`);

    const producer = await transport.produce({ kind, rtpParameters, appData });

    producer.on('transportclose', () => {
      this.logger.log(
        `Producer ${producer.id} transport closed, removing producer`,
      );
      producer.close();
      peer.producers.delete(producer.id);
    });

    peer.producers.set(transport.id, producer);
    this.logger.log(
      `Producer ${producer.id} (${kind}) created for peer ${peerId}`,
    );
    return producer.id;
  }

  getProducerById(roomId: string, producerId: string): Producer | undefined {
    const room = this.getRoom(roomId);
    if (!room) return undefined;
    for (const peer of room.peers.values()) {
      for (const producer of peer.producers.values()) {
        if (producer.id === producerId) {
          return producer;
        }
      }
    }
    return undefined;
  }

  closeProducer(roomId: string, peerId: string, producerId: string): void {
    const room = this.getRoom(roomId);
    if (!room) throw new Error(`Room ${roomId} not found`);
    const peer = room.peers.get(peerId);
    if (!peer) throw new Error(`Peer ${peerId} not found`);
    const producer = this.getProducerById(roomId, producerId);
    if (!producer) {
      this.logger.warn(`Producer ${producerId} not found for closing`);
      return;
    }

    producer.close();
    peer.producers.delete(producer.id);
    this.logger.log(`Producer ${producer.id} closed, removing producer`);
  }

  // endregion

  // region Consumer

  async createConsumer(
    roomId: string,
    consumerPeerId: string,
    transportId: string,
    producerId: string,
    rtpCapabilities: RtpCapabilities,
  ): Promise<{
    consumerId: string;
    producerId: string;
    kind: MediaKind;
    rtpParameters: RtpParameters;
    appData?: Record<string, any>;
  }> {
    const room = this.getRoom(roomId);
    if (!room) throw new Error(`Room ${roomId} not found`);
    const consumerPeer = room.peers.get(consumerPeerId);
    if (!consumerPeer) throw new Error(`Peer ${consumerPeerId} not found`);
    const transport = consumerPeer.transports.get(transportId);
    if (!transport) throw new Error(`Transport ${transportId} not found`);
    const producer = this.getProducerById(roomId, producerId);
    if (!producer) throw new Error(`Producer ${producerId} not found`);

    if (!room.router.canConsume({ producerId, rtpCapabilities })) {
      throw new Error(
        `Peer ${consumerPeerId} cannot consume producer ${producerId} with given RTP capabilities`,
      );
    }

    const consumer = await transport.consume({
      producerId,
      rtpCapabilities,
      paused: true,
      appData: producer.appData,
    });

    consumer.on('transportclose', () => {
      this.logger.log(
        `Consumer ${consumer.id} transport closed, removing consumer`,
      );
      consumer.close();
      consumerPeer.consumers.delete(consumer.id);
    });
    consumer.on('producerclose', () => {
      this.logger.log(
        `Consumer ${consumer.id} producer closed, removing consumer`,
      );
      consumer.close();
      consumerPeer.consumers.delete(consumer.id);
    });

    consumerPeer.consumers.set(consumer.id, consumer);

    return {
      consumerId: consumer.id,
      producerId,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
      appData: consumer.appData,
    };
  }

  async resumeConsumer(
    roomId: string,
    peerId: string,
    consumerId: string,
  ): Promise<void> {
    const room = this.getRoom(roomId);
    if (!room) throw new Error(`Room ${roomId} not found`);
    const peer = room.peers.get(peerId);
    if (!peer) throw new Error(`Peer ${peerId} not found`);
    const consumer = peer.consumers.get(consumerId);
    if (!consumer) throw new Error(`Consumer ${consumerId} not found`);

    await consumer.resume();
    this.logger.log(
      `Consumer ${consumerId} resumed for peer ${peerId} in room ${roomId}`,
    );
  }

  // endregion
}
