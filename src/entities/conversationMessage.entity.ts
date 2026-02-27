import {
  CreateDateColumn,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Conversation } from './conversation.entity';
import { User } from './user.entity';

@Entity({ name: 'conversation_messages' })
export class ConversationMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @OneToOne(() => Conversation, { onDelete: 'CASCADE' })
  @JoinColumn()
  conversation: Conversation;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  author: User;
}
