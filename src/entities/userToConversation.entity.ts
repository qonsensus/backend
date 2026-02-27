import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Conversation } from './conversation.entity';

@Entity({ name: 'users_to_conversations' })
export class UserToConversation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  userId: string;

  @Column()
  conversationId: string;

  @Column()
  lastReadAt: Date;

  @ManyToOne(() => User, (user) => user.userToConversations)
  user: User;

  @ManyToOne(
    () => Conversation,
    (conversation) => conversation.userToConversations,
  )
  conversation: Conversation;
}
