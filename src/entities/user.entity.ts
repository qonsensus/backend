import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Profile } from './profile.entity';
import { UserToServer } from './userToServer.entity';
import { UserToChat } from './userToChat.entity';
import { UserToChatChannel } from './userToChatChannel.entity';
import { Friendship } from './friendship.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // make index on email for faster lookups and enforce uniqueness
  @Column({ unique: true })
  @Index()
  email: string;

  @Column()
  passwordHash: string;

  @OneToOne(() => Profile, (profile) => profile.owner, { onDelete: 'CASCADE' })
  profile: Profile;

  @OneToMany(() => UserToServer, (userToServer) => userToServer.user, {
    onDelete: 'CASCADE',
  })
  servers: UserToServer[];

  @OneToMany(() => UserToChat, (userToChat) => userToChat.user)
  chats: UserToChat[];

  @OneToMany(
    () => UserToChatChannel,
    (userToChatChannel) => userToChatChannel.user,
  )
  chatChannelStates: UserToChatChannel[];

  @OneToMany(() => Friendship, (friendship) => friendship.requester)
  sentFriendships: Friendship[];

  @OneToMany(() => Friendship, (friendship) => friendship.recipient)
  receivedFriendships: Friendship[];
}
