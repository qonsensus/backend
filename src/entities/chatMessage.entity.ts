import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Chat } from './chat.entity';
import { User } from './user.entity';

@Entity({ name: 'chat_messages' })
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column()
  content: string;

  @Column({ nullable: true })
  conversationId: string;

  @ManyToOne(() => Chat, (conversation) => conversation.messages, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  conversation: Chat;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  author: User;
}
