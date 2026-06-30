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
  ) {}

  handleDisconnect(socket: Socket) {
    // TODO: cleanup
    this.logger.log(`Socket ${socket.id} disconnected from /call`);
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() socket: Socket,
    payload: RoomQueryDto,
  ) {
    try {
      // get or create room
      const room = await this.roomService.getOrCreateRoom(payload.roomId);
      // add peer
      this.peerService.addPeer(room, socket.id);

      // join socket room to send and recieve messages
      await socket.join(payload.roomId);

      // get existing producers in the room
      const existingProducers = this.peerService.getOtherProducers(
        room,
        socket.id,
      );

      return {
        rtpCapabilities: this.workerService.getRtpCapabilities(),
        existingProducers,
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
}
