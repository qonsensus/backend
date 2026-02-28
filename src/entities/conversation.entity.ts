import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
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

  @Column()
  name: string;

  @ManyToOne(
    () => UserToConversation,
    (userToConversation) => userToConversation.conversation,
  )
  participants: UserToConversation[];

  @OneToMany(() => ConversationMessage, (message) => message.conversation)
  messages: ConversationMessage[];
}
