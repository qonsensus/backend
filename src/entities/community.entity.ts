import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserToCommunity } from './userToCommunity.entity';
import { ChatChannel } from './chatChannel.entity';

@Entity({ name: 'servers' })
export class Community {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column()
  motd: string;

  @Column()
  avatarUrl: string;

  @Column()
  bannerUrl: string;

  @OneToMany(() => UserToCommunity, (userToServer) => userToServer.community, {
    onDelete: 'CASCADE',
  })
  participants: UserToCommunity[];

  @OneToMany(() => ChatChannel, (chatChannel) => chatChannel.community)
  chatChannels: ChatChannel[];
}
