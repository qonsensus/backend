import {
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from './user.entity';
import { Server } from './server.entity';

@Entity({ name: 'users_to_servers' })
export class UserToServer {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.servers)
  user: User;

  @ManyToOne(() => Server, (server) => server.participants)
  server: Server;
}
