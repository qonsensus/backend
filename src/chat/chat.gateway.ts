import {
  OnGatewayConnection,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { SendMessageWsDto } from './dtos/sendMessage.ws.dto';
import { Server, Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { AuthService } from '../auth/auth.service';
import { User } from '../entities/user.entity';
import { ChatMessageDto } from './dtos/chatMessage.dto';

@WebSocketGateway({
  namespace: 'chat',
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection {
  constructor(
    private readonly chatService: ChatService,
    private readonly authService: AuthService,
  ) {}

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

    client.data = { user };
    const room = `user:${user.id}`;
    await client.join(room);
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    client: Socket,
    payload: SendMessageWsDto,
  ): Promise<ChatMessageDto> {
    const clientData = client.data as { user: User };
    if (!clientData || !clientData.user) {
      throw new WsException('Unauthorized');
    }
    const message = await this.chatService.sendMessage(
      clientData.user.id,
      payload,
    );
    const participants = await this.chatService.getParticipantsForChat(
      payload.chatId,
    );
    const otherParticipants = participants.filter(
      (participant) => participant.ownerId !== clientData.user.id,
    );
    for (const participant of otherParticipants) {
      this.server
        .to(`user:${participant.ownerId}`)
        .emit('newMessage', { chatId: payload.chatId, message });
    }
    return message;
  }

  @SubscribeMessage('typing')
  async handleTyping(client: Socket, payload: { chatId: string }) {
    const clientData = client.data as { user: User };
    if (!clientData || !clientData.user) {
      throw new WsException('Unauthorized');
    }
    const participants = await this.chatService.getParticipantsForChat(
      payload.chatId,
    );
    const otherParticipants = participants.filter(
      (participant) => participant.ownerId !== clientData.user.id,
    );
    for (const participant of otherParticipants) {
      this.server
        .to(`user:${participant.ownerId}`)
        .emit('typing', { chatId: payload.chatId, userId: clientData.user.id });
    }
  }

  @SubscribeMessage('stopTyping')
  async handleStopTyping(client: Socket, payload: { chatId: string }) {
    const clientData = client.data as { user: User };
    if (!clientData || !clientData.user) {
      throw new WsException('Unauthorized');
    }
    const participants = await this.chatService.getParticipantsForChat(
      payload.chatId,
    );
    const otherParticipants = participants.filter(
      (participant) => participant.ownerId !== clientData.user.id,
    );
    for (const participant of otherParticipants) {
      this.server.to(`user:${participant.ownerId}`).emit('stopTyping', {
        chatId: payload.chatId,
        userId: clientData.user.id,
      });
    }
  }

  @SubscribeMessage('readMessages')
  async handleReadMessages(client: Socket, payload: { chatId: string }) {
    const clientData = client.data as { user: User };
    if (!clientData || !clientData.user) {
      throw new WsException('Unauthorized');
    }
    await this.chatService.updateLastReadAt(clientData.user.id, payload.chatId);
    const participants = await this.chatService.getParticipantsForChat(
      payload.chatId,
    );
    const otherParticipants = participants.filter(
      (participant) => participant.ownerId !== clientData.user.id,
    );
    for (const participant of otherParticipants) {
      this.server.to(`user:${participant.ownerId}`).emit('messagesRead', {
        chatId: payload.chatId,
        userId: clientData.user.id,
      });
    }
  }
}
