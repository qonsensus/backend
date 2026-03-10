import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum FriendshipStatus {
  PENDING = 'pending',
  ACCEPTED = 'accepted',
  REJECTED = 'rejected',
}

@Entity({ name: 'friendships' })
export class Friendship {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({
    type: 'enum',
    enum: FriendshipStatus,
  })
  @Index()
  status: FriendshipStatus;

  @Column()
  requesterId: string;

  @Column()
  recipientId: string;

  @ManyToOne(() => User, (user) => user.sentFriendships)
  requester: User;

  @ManyToOne(() => User, (user) => user.receivedFriendships)
  recipient: User;
}
