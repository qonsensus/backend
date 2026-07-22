import {
  OnGatewayConnection,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from '../auth/auth.service';
import { IncomingFriendRequestWsDto } from './dtos/incomingFriendRequest.ws.dto';
import { ChatDto } from '../chat/dtos/chat.dto';
import { ChatMessageDto } from '../chat/dtos/chatMessage.dto';
import { IncomingCallWsDto } from './dtos/incomingCall.ws.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Chat } from '../entities/chat.entity';
import { Repository } from 'typeorm';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class NotificationsGateway implements OnGatewayConnection {
  constructor(
    private readonly authService: AuthService,
    @InjectRepository(Chat) private chatRepository: Repository<Chat>,
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

  notifyNewConversation(recipientIds: string[], payload: ChatDto) {
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

  notifyNewMessage(recipientIds: string[], payload: ChatMessageDto) {
    recipientIds.forEach((recipientId) => {
      const room = `user:${recipientId}`;
      this.server.to(room).emit('newMessage', payload);
    });
  }

  async notifyCall(chatId: string, callerId: string) {
    const chat = await this.chatRepository.findOne({
      where: { id: chatId },
      relations: {
        participants: {
          user: {
            profile: true,
          },
        },
      },
    });
    const participants = chat ? chat.participants.map((p) => p.user.id) : [];
    const filteredParticipants = participants.filter(
      (participant) => participant !== callerId,
    );
    const payload: IncomingCallWsDto = {
      chatId,
      callerAvatarUrl:
        chat?.participants.find((p) => p.user.id === callerId)?.user.profile
          ?.avatarUrl || '',
      callerDisplayName:
        chat?.participants.find((p) => p.user.id === callerId)?.user.profile
          ?.displayName || '',
    };
    for (const participantId of filteredParticipants) {
      const room = `user:${participantId}`;
      this.server.to(room).emit('incomingCall', payload);
    }
  }
}
