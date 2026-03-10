import { Profile } from '../../entities/profile.entity';

export class IncomingFrienshipRequestDto {
  id: string;
  requestedAt: Date;
  requesterId: string;
  requesterProfile: Profile;
}
