import { Module } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Conversation } from '../entities/conversation.entity';
import { UserToConversation } from '../entities/userToConversation.entity';
import { User } from '../entities/user.entity';
import { ConversationMessage } from '../entities/conversationMessage.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Conversation,
      UserToConversation,
      User,
      ConversationMessage,
    ]),
  ],
  providers: [ConversationService],
})
export class ConversationModule {}
