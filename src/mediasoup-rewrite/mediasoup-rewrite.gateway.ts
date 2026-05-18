import {
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { RoomService } from '../mediasoup/room.service';

@WebSocketGateway({
  cors: { origin: '*' }, // Lock this down in production
  namespace: '/mediasoup',
})
export class MediasoupRewriteGateway implements OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(private readonly roomService: RoomService) {}

  handleDisconnect() {
    throw new Error('Method not implemented.');
  }
}
