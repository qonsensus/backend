import {
  Column,
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne
} from 'typeorm';
import { User } from './user.entity';

@Entity({ name: 'userKey' })
export class UserKey {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  public_key: string;

  @Column()
  key_format: string;

  @Column()
  created_at: Date;

  @ManyToOne(() => User, (user) => user.publicKeys)
  user: User
}