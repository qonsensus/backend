import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Server } from './server.entity';
import { ChatChannelMessage } from './chatChannelMessage.entity';

@Entity({ name: 'chat_channels' })
export class ChatChannel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Server, (server) => server.chatChannels, {
    onDelete: 'CASCADE',
  })
  server: Server;

  @OneToMany(() => ChatChannelMessage, (message) => message.channel)
  messages: ChatChannelMessage[];
}
