// noinspection ExceptionCaughtLocallyJS

import {
  ConnectedSocket,
  MessageBody,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { WorkerService } from './worker.service';
import { RoomService } from './room.service';
import { ConsumerService } from './consumer.service';
import { PeerService } from './peer.service';
import { ProducerService } from './producer.service';
import { TransportService } from './transport.service';
import { RoomQueryDto } from './dtos/roomQuery.dto';
import { AuthService } from '../auth/auth.service';
import { Profile } from '../entities/profile.entity';
import { ConnectTransportDto } from './dtos/connectTransport.dto';
import { ProduceDto } from './dtos/produce.dto';
import { ConsumeDto } from './dtos/consume.dto';
import { ResumeConsumerDto } from './dtos/resumeConsumer.dto';
import { CloseProducerDto } from './dtos/closeProducer.dto';
import { JoinRoomResponseWsDto } from './dtos/joinRoomResponseWs.dto';

@WebSocketGateway({
  cors: { origin: '*' }, // TODO: make this configurable
  namespace: '/call',
})
export class CallGateway implements OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  logger = new Logger(CallGateway.name);

  constructor(
    private readonly consumerService: ConsumerService,
    private readonly peerService: PeerService,
    private readonly producerService: ProducerService,
    private readonly roomService: RoomService,
    private readonly transportService: TransportService,
    private readonly workerService: WorkerService,
    private readonly authService: AuthService,
  ) {}

  async joinSocketRoom(socket: Socket, roomId: string): Promise<Profile> {
    const authToken = socket.handshake.auth.token as string;
    const user = await this.authService
      .validateToken(authToken)
      .catch(() => null);
    if (!user) {
      socket.disconnect();
      throw new WsException('Unauthorized');
    }

    socket.data = { user };
    await socket.join(roomId);
    return user.profile;
  }

  handleDisconnect(socket: Socket) {
    // TODO: cleanup
    this.logger.log(`Socket ${socket.id} disconnected from /call`);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() payload: RoomQueryDto,
  ): Promise<JoinRoomResponseWsDto> {
    try {
      // join socket room to send and recieve messages
      const userProfile = await this.joinSocketRoom(socket, payload.roomId);
      // get or create room
      const room = await this.roomService.getOrCreateRoom(payload.roomId);
      // add peer
      this.peerService.addPeer(room, socket.id, userProfile);

      // get existing producers in the room
      const otherPeers = this.peerService.getOtherPeers(room, socket.id);

      return {
        rtpCapabilities: this.workerService.getRtpCapabilities(),
        otherPeers,
      };
    } catch (err) {
      this.logger.error(`Error in handleJoinRoom: ${(err as Error).message}`);
      throw new WsException((err as Error).message);
    }
  }

  @SubscribeMessage('createTransport')
  async handleCreateTransport(
    @ConnectedSocket() socket: Socket,
    @MessageBody() { roomId }: RoomQueryDto,
  ) {
    try {
      const room = this.roomService.getRoom(roomId);
      if (!room) throw new Error(`Room ${roomId} not found`);

      const peer = this.peerService.getPeer(room, socket.id);
      if (!peer) throw new Error(`Peer not found`);

      return await this.transportService.createWebRtcTransport(room, peer);
    } catch (err) {
      throw new WsException((err as Error).message);
    }
  }

  @SubscribeMessage('connectTransport')
  async handleConnectTransport(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    { roomId, transportId, dtlsParameters }: ConnectTransportDto,
  ) {
    try {
      const room = this.roomService.getRoom(roomId);
      if (!room) throw new Error(`Room ${roomId} not found`);

      const peer = this.peerService.getPeer(room, socket.id);
      if (!peer) throw new Error(`Peer not found`);

      await this.transportService.connectTransport(
        peer,
        transportId,
        dtlsParameters,
      );
      return { connected: true };
    } catch (err) {
      throw new WsException((err as Error).message);
    }
  }

  @SubscribeMessage('produce')
  async handleProduce(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    { roomId, transportId, kind, rtpParameters, appData }: ProduceDto,
  ) {
    try {
      const room = this.roomService.getRoom(roomId);
      if (!room) throw new Error(`Room ${roomId} not found`);

      const peer = this.peerService.getPeer(room, socket.id);
      if (!peer) throw new Error(`Peer not found`);

      const producerId = await this.producerService.createProducer(
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

  @SubscribeMessage('consume')
  async handleConsume(
    @ConnectedSocket() socket: Socket,
    @MessageBody()
    { roomId, transportId, producerId, rtpCapabilities }: ConsumeDto,
  ) {
    try {
      const room = this.roomService.getRoom(roomId);
      if (!room) throw new Error(`Room ${roomId} not found`);

      const peer = this.peerService.getPeer(room, socket.id);
      if (!peer) throw new Error(`Peer not found`);

      return await this.consumerService.createConsumer(
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

  @SubscribeMessage('resumeConsumer')
  async handleResumeConsumer(
    @ConnectedSocket() socket: Socket,
    @MessageBody() { roomId, consumerId }: ResumeConsumerDto,
  ) {
    try {
      const room = this.roomService.getRoom(roomId);
      if (!room) throw new Error(`Room ${roomId} not found`);

      const peer = this.peerService.getPeer(room, socket.id);
      if (!peer) throw new Error(`Peer not found`);

      await this.consumerService.resumeConsumer(peer, consumerId);
      return { resumed: true };
    } catch (err) {
      throw new WsException((err as Error).message);
    }
  }

  @SubscribeMessage('closeProducer')
  handleCloseProducer(
    @ConnectedSocket() socket: Socket,
    @MessageBody() { roomId, producerId }: CloseProducerDto,
  ) {
    try {
      const room = this.roomService.getRoom(roomId);
      if (!room) throw new Error(`Room ${roomId} not found`);

      const peer = this.peerService.getPeer(room, socket.id);
      if (!peer) throw new Error(`Peer not found`);

      this.producerService.closeProducer(peer, producerId);

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
}
