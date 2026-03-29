import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import {
  DtlsParameters,
  MediaKind,
  RtpCapabilities,
  RtpParameters,
} from 'mediasoup/types';
import { RoomService } from './room.service';

// Each message payload is strongly typed — no raw 'any' objects
interface JoinRoomPayload {
  roomId: string;
}

interface ConnectTransportPayload {
  roomId: string;
  transportId: string;
  dtlsParameters: DtlsParameters;
}

interface ProducePayload {
  roomId: string;
  transportId: string;
  kind: MediaKind;
  rtpParameters: RtpParameters;
  appData: Record<string, any>;
}

interface ConsumePayload {
  roomId: string;
  transportId: string;
  producerId: string;
  rtpCapabilities: RtpCapabilities;
}

interface ResumeConsumerPayload {
  roomId: string;
  consumerId: string;
}

interface CloseProducerPayload {
  roomId: string;
  producerId: string;
}

@WebSocketGateway({
  cors: { origin: '*' }, // Lock this down in production
  namespace: '/mediasoup',
})
export class MediasoupGateway implements OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private readonly logger = new Logger(MediasoupGateway.name);

  // Track which room each socket is in so we can clean up on disconnect
  private readonly socketRoomMap = new Map<string, string>();

  constructor(private readonly roomService: RoomService) {}

  // ── Step 1: Client joins a room ─────────────────────────────────────────────
  // Returns the router's RTP capabilities so the client can load its Device.
  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() { roomId }: JoinRoomPayload,
  ) {
    try {
      const room = await this.roomService.getOrCreateRoom(roomId);
      this.roomService.addPeer(room, socket.id);

      // Join the socket.io room so we can broadcast to everyone in it
      await socket.join(roomId);
      this.socketRoomMap.set(socket.id, roomId);

      // Tell the new peer about everyone already streaming
      const existingProducers = this.roomService.getOtherProducers(
        room,
        socket.id,
      );

      return {
        rtpCapabilities: this.roomService.getRtpCapabilities(room),
        existingProducers, // client will immediately try to consume these
      };
    } catch (err) {
      throw new WsException((err as Error).message);
    }
  }

  // ── Step 2: Client requests a transport (call twice — send + receive) ───────
  @SubscribeMessage('createTransport')
  async handleCreateTransport(
    @ConnectedSocket() socket: Socket,
    @MessageBody() { roomId }: { roomId: string },
  ) {
    try {
      const room = this.roomService.getRoom(roomId);
      if (!room) throw new Error(`Room ${roomId} not found`);

      const peer = this.roomService.getPeer(room, socket.id);
      if (!peer) throw new Error(`Peer not found`);

      return await this.roomService.createWebRtcTransport(room, peer);
    } catch (err) {
      throw new WsException((err as Error).message);
    }
  }

  // ── Step 3: Client finalises the DTLS handshake ─────────────────────────────
  @SubscribeMessage('connectTransport')
  async handleConnectTransport(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    { roomId, transportId, dtlsParameters }: ConnectTransportPayload,
  ) {
    try {
      const room = this.roomService.getRoom(roomId);
      if (!room) throw new Error(`Room ${roomId} not found`);

      const peer = this.roomService.getPeer(room, socket.id);
      if (!peer) throw new Error(`Peer not found`);

      await this.roomService.connectTransport(
        peer,
        transportId,
        dtlsParameters,
      );
      return { connected: true };
    } catch (err) {
      throw new WsException((err as Error).message);
    }
  }

  // ── Step 4: Client starts sending their camera/mic ──────────────────────────
  @SubscribeMessage('produce')
  async handleProduce(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    { roomId, transportId, kind, rtpParameters, appData }: ProducePayload,
  ) {
    try {
      const room = this.roomService.getRoom(roomId);
      if (!room) throw new Error(`Room ${roomId} not found`);

      const peer = this.roomService.getPeer(room, socket.id);
      if (!peer) throw new Error(`Peer not found`);

      const producerId = await this.roomService.createProducer(
        peer,
        transportId,
        kind,
        rtpParameters,
        appData,
      );

      // Notify every OTHER peer in the room that a new stream is available
      socket.to(roomId).emit('newProducer', {
        producerId,
        socketId: socket.id,
        kind,
      });

      return { producerId };
    } catch (err) {
      throw new WsException((err as Error).message);
    }
  }

  // ── Step 5: Client wants to watch someone else's stream ─────────────────────
  @SubscribeMessage('consume')
  async handleConsume(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    { roomId, transportId, producerId, rtpCapabilities }: ConsumePayload,
  ) {
    try {
      const room = this.roomService.getRoom(roomId);
      if (!room) throw new Error(`Room ${roomId} not found`);

      const peer = this.roomService.getPeer(room, socket.id);
      if (!peer) throw new Error(`Peer not found`);

      return await this.roomService.createConsumer(
        room,
        peer,
        transportId,
        producerId,
        rtpCapabilities,
      );
    } catch (err) {
      throw new WsException((err as Error).message);
    }
  }

  // ── Step 6: Client's <video> element is ready — unpause the stream ──────────
  @SubscribeMessage('resumeConsumer')
  async handleResumeConsumer(
    @ConnectedSocket() socket: Socket,
    @MessageBody() { roomId, consumerId }: ResumeConsumerPayload,
  ) {
    try {
      const room = this.roomService.getRoom(roomId);
      if (!room) throw new Error(`Room ${roomId} not found`);

      const peer = this.roomService.getPeer(room, socket.id);
      if (!peer) throw new Error(`Peer not found`);

      await this.roomService.resumeConsumer(peer, consumerId);
      return { resumed: true };
    } catch (err) {
      throw new WsException((err as Error).message);
    }
  }

  // ── Step 7: Client stops sending a specific stream (e.g. ends webcam) ──────
  @SubscribeMessage('closeProducer')
  handleCloseProducer(
    @ConnectedSocket() socket: Socket,
    @MessageBody() { roomId, producerId }: CloseProducerPayload,
  ) {
    try {
      const room = this.roomService.getRoom(roomId);
      if (!room) throw new Error(`Room ${roomId} not found`);

      const peer = this.roomService.getPeer(room, socket.id);
      if (!peer) throw new Error(`Peer not found`);

      this.roomService.closeProducer(peer, producerId);

      // Tell every other peer to remove the video/audio element for this producer
      socket.to(roomId).emit('producerClosed', {
        producerId,
        socketId: socket.id,
      });

      return { closed: true };
    } catch (err) {
      throw new WsException((err as Error).message);
    }
  }

  // ── Cleanup on disconnect ────────────────────────────────────────────────────
  handleDisconnect(socket: Socket) {
    const roomId = this.socketRoomMap.get(socket.id);
    if (!roomId) return;

    this.socketRoomMap.delete(socket.id);
    this.roomService.removePeer(roomId, socket.id);

    // Let remaining peers know this person left so they can remove the video element
    this.server.to(roomId).emit('peerLeft', { socketId: socket.id });
    this.logger.log(`Socket ${socket.id} disconnected from room "${roomId}"`);
  }
}
