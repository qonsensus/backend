import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { IncomingFriendRequestWsDto } from './dtos/incomingFriendRequest.ws.dto';
import { ConversationDto } from '../conversation/dtos/conversation.dto';
import { ConversationMessageDto } from '../conversation/dtos/conversationMessage.dto';

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

  notifyNewConversation(recipientIds: string[], payload: ConversationDto) {
    recipientIds.forEach((recipientId) => {
      const room = `user:${recipientId}`;
      // exclude the recipient from the participants list in the payload
      const filteredParticipants = payload.participants.filter(
        (p) => p.ownerId !== recipientId,
      );
      const modifiedPayload = {
        ...payload,
        participants: filteredParticipants,
      };
      this.server.to(room).emit('newConversation', modifiedPayload);
    });
  }

  notifyNewMessage(recipientIds: string[], payload: ConversationMessageDto) {
    recipientIds.forEach((recipientId) => {
      const room = `user:${recipientId}`;
      this.server.to(room).emit('newMessage', payload);
    });
  }
}
