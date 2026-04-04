import { Profile } from '../../entities/profile.entity';

export class ChatDto {
  id: string;
  participants: Profile[];
  latestMessageContent: string | null;
  latestMessageCreatedAt: Date | null;
  unseenMessagesCount: number;
  lastReadAt: Date;
}
