import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Community } from './community.entity';

@Entity({ name: 'users_to_servers' })
export class UserToCommunity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.servers)
  user: User;

  @ManyToOne(() => Community, (server) => server.participants)
  community: Community;
}
