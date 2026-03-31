import { Profile } from '../../entities/profile.entity';

export class ChatDto {
  id: string;
  participants: Profile[];
}
