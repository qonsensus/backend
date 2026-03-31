import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Chat } from './chat.entity';

@Entity({ name: 'user_to_chat' })
export class UserToChat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @Column({ type: 'timestamptz' })
  lastReadAt: Date;

  @Column()
  userId: string;

  @Column()
  chatId: string;

  @ManyToOne(() => User, (user) => user.conversations, {
    onDelete: 'CASCADE',
  })
  user: User;

  @ManyToOne(() => Chat, (conversation) => conversation.participants, {
    onDelete: 'CASCADE',
  })
  chat: Chat;
}
