import { Profile } from '../../entities/profile.entity';

export class ConversationDto {
  id: string;
  participants: Profile[];
}
