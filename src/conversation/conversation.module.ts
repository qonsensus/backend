import { Module } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Chat } from '../entities/chat.entity';
import { UserToChat } from '../entities/userToChat.entity';
import { User } from '../entities/user.entity';
import { ChatMessage } from '../entities/chatMessage.entity';
import { ConversationController } from './conversation.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Chat, UserToChat, User, ChatMessage]),
    NotificationsModule,
  ],
  providers: [ConversationService],
  controllers: [ConversationController],
})
export class ConversationModule {}
