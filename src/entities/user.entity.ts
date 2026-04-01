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
import { UserToConversation } from './userToConversation.entity';
import { UserToChatChannel } from './userToChatChannel.entity';
import { Friendship } from './friendship.entity';
import { UserKey } from './userKey.entity';

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

  @OneToMany(
    () => UserToConversation,
    (userToConversation) => userToConversation.user,
  )
  conversations: UserToConversation[];

  @OneToMany(
    () => UserToChatChannel,
    (userToChatChannel) => userToChatChannel.user,
  )
  chatChannelStates: UserToChatChannel[];

  @OneToMany(() => Friendship, (friendship) => friendship.requester)
  sentFriendships: Friendship[];

  @OneToMany(() => Friendship, (friendship) => friendship.recipient)
  receivedFriendships: Friendship[];

  @OneToMany(() => UserKey, (userKey) => userKey.user)
  publicKeys: UserKey[]
}
