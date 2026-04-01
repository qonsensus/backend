import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from '../entities/chat.entity';
import { UserToChat } from '../entities/userToChat.entity';
import { User } from '../entities/user.entity';
import { ChatMessage } from '../entities/chatMessage.entity';
import { ChatController } from './chat.controller';
import { NotificationsModule } from '../notifications/notifications.module';
import { ChatGateway } from './chat.gateway';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chat, UserToChat, User, ChatMessage]),
    NotificationsModule,
    AuthModule,
  ],
  providers: [ChatService, ChatGateway],
  controllers: [ChatController],
})
export class ChatModule {}
