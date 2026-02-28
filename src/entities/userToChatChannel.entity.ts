import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { ChatChannel } from './chatChannel.entity';
import { User } from './user.entity';

@Entity({ name: 'users_to_chat_channels' })
export class UserToChatChannel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  chatChannelId: string;

  @Column()
  userId: string;

  @Column()
  lastReadAt: Date;

  @ManyToOne(() => ChatChannel, (chatChannel) => chatChannel.userStates, {
    onDelete: 'CASCADE',
  })
  chatChannel: ChatChannel;

  @ManyToOne(() => User, (user) => user.chatChannelStates, {
    onDelete: 'CASCADE',
  })
  user: User;
}
