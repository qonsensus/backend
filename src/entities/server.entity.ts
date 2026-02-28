import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserToServer } from './userToServer.entity';
import { ChatChannel } from './chatChannel.entity';

@Entity({ name: 'servers' })
export class Server {
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

  @OneToMany(() => UserToServer, (userToServer) => userToServer.server, {
    onDelete: 'CASCADE',
  })
  participants: UserToServer[];

  @OneToMany(() => ChatChannel, (chatChannel) => chatChannel.server)
  chatChannels: ChatChannel[];
}
