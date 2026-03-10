import { Profile } from '../../entities/profile.entity';

export class FriendshipListItemDto {
  id: string;
  friendsSince: Date;
  friendId: string;
  friendProfile: Profile;
}
