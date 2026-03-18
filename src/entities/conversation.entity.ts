import {
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserToConversation } from './userToConversation.entity';
import { ConversationMessage } from './conversationMessage.entity';

@Entity({ name: 'conversations' })
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(
    () => UserToConversation,
    (userToConversation) => userToConversation.conversation,
    {
      cascade: ['remove'],
    },
  )
  participants: UserToConversation[];

  @OneToMany(() => ConversationMessage, (message) => message.conversation, {
    cascade: ['remove'],
  })
  messages: ConversationMessage[];
}
