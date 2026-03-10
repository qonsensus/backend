import { Profile } from '../../entities/profile.entity';

export class OutgoingFrienshipRequestDto {
  id: string;
  requestedAt: Date;
  recipientId: string;
  recipientProfile: Profile;
}
