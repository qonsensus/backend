import { Module } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from '../entities/conversation.entity';
import { UserToConversation } from '../entities/userToConversation.entity';
import { User } from '../entities/user.entity';
import { ConversationMessage } from '../entities/conversationMessage.entity';
import { ConversationController } from './conversation.controller';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Conversation,
      UserToConversation,
      User,
      ConversationMessage,
    ]),
    NotificationsModule,
  ],
  providers: [ConversationService],
  controllers: [ConversationController],
})
export class ConversationModule {}
