import {
  Column,
  Entity,
  Index,
  JoinColumn,
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
@Index('displayName_trgmidx', { synchronize: false })
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column()
  displayName: string;

  @Column({ unique: true })
  @Index()
  handle: string;

  @Column({ nullable: true })
  bio?: string;

  @Column({ nullable: true })
  motd?: string;

  @Column({
    type: 'enum',
    enum: Status,
    default: Status.DEFAULT,
  })
  status: Status;

  @Column({ nullable: true })
  avatarUrl?: string;

  @Column({ nullable: true })
  bannerUrl?: string;

  @OneToOne(() => User, (user) => user.profile)
  @JoinColumn()
  owner: User;

  @Column({ nullable: true })
  ownerId: string;
}
