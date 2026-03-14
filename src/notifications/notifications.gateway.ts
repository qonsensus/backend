import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationsGateway implements OnGatewayConnection {
  constructor(private readonly authService: AuthService) {}

  @WebSocketServer()
  server: Server;

  async handleConnection(client: Socket) {
    const authToken = client.handshake.auth.token as string;
    const user = await this.authService.validateToken(authToken);

    const room = `user:${user.id}`;
    await client.join(room);

    console.log(`Client ${client.id} joined ${room}`);
  }

  notifyFriendRequest(recipientId: string, message: string) {
    const room = `user:${recipientId}`;
    this.server.to(room).emit('friendRequest', { message });
  }
}
