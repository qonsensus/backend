import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Conversation } from './conversation.entity';

@Entity({ name: 'user_to_conversations' })
export class UserToConversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  lastReadAt: Date;

  @Column()
  userId: string;

  @Column()
  conversationId: string;

  @ManyToOne(() => User, (user) => user.conversations, {
    onDelete: 'CASCADE',
  })
  user: User;

  @ManyToOne(() => Conversation, (conversation) => conversation.participants, {
    onDelete: 'CASCADE',
  })
  conversation: Conversation;
}
