import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { User } from './user.entity';
import { ChatChannel } from './chatChannel.entity';

@Entity({ name: 'chat_channel_messages' })
export class ChatChannelMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => ChatChannel, (channel) => channel.messages)
  @JoinColumn()
  channel: ChatChannel;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  author: User;

  @Column()
  content: string;
}
