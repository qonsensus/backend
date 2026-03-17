import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { IncomingFriendRequestWsDto } from './dtos/incomingFriendRequest.ws.dto';
import { Conversation } from '../entities/conversation.entity';

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
    const user = await this.authService
      .validateToken(authToken)
      .catch(() => null);
    if (!user) {
      client.disconnect();
      return;
    }

    const room = `user:${user.id}`;
    await client.join(room);
  }

  notifyFriendRequest(
    recipientId: string,
    payload: IncomingFriendRequestWsDto,
  ) {
    const room = `user:${recipientId}`;
    this.server.to(room).emit('friendRequest', payload);
  }

  notifyNewConversation(recipientIds: string[], payload: Conversation) {
    recipientIds.forEach((recipientId) => {
      const room = `user:${recipientId}`;
      this.server.to(room).emit('newConversation', payload);
    });
  }
}
