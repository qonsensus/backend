import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserToChat } from './userToChat.entity';
import { ChatMessage } from './conversationMessage.entity';

@Entity({ name: 'chats' })
export class Chat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true })
  @Index()
  participantsHash?: string;

  @OneToMany(
    () => UserToChat,
    (userToConversation) => userToConversation.chat,
    {
      cascade: ['remove'],
    },
  )
  participants: UserToChat[];

  @OneToMany(() => ChatMessage, (message) => message.conversation, {
    cascade: ['remove'],
  })
  messages: ChatMessage[];
}
