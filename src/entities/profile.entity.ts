import {
  Column,
  Entity,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum Status {
  DEFAULT = 'default',
  SUSPENDED = 'suspended',
  BANNED = 'banned',
}

@Entity({ name: 'profiles' })
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  displayName: string;

  @Column()
  bio: string;

  @Column()
  motd: string;

  @Column({
    type: 'enum',
    enum: Status,
    default: Status.DEFAULT,
  })
  status: Status;

  @Column()
  avatarUrl: string;

  @Column()
  bannerUrl: string;

  @OneToOne(() => User, (user) => user.profile)
  owner: User;
}
