import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Profile } from './profile.entity';
import { UserToServer } from './userToServer.entity';
import { UserToConversation } from './userToConversation.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ unique: true })
  email: string;

  @Column()
  passwordHash: string;

  @OneToOne(() => Profile, (profile) => profile.ownerId)
  @JoinColumn()
  profile: Profile;

  @OneToMany(() => UserToServer, (userToServer) => userToServer.user, {
    onDelete: 'CASCADE',
  })
  servers: UserToServer[];

  @ManyToOne(
    () => UserToConversation,
    (userToConversation) => userToConversation.user,
  )
  conversations: UserToConversation[];
}
