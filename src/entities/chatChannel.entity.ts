import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Community } from './community.entity';
import { ChatChannelMessage } from './chatChannelMessage.entity';
import { UserToChatChannel } from './userToChatChannel.entity';

@Entity({ name: 'chat_channels' })
export class ChatChannel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => Community, (server) => server.chatChannels, {
    onDelete: 'CASCADE',
  })
  community: Community;

  @OneToMany(() => ChatChannelMessage, (message) => message.channel)
  messages: ChatChannelMessage[];

  @OneToMany(
    () => UserToChatChannel,
    (userToChatChannel) => userToChatChannel.chatChannel,
  )
  userStates: UserToChatChannel[];
}
