import { IncomingFrienshipRequestDto } from '../../friends/dtos/incomingFrienshipRequest.dto';

export class IncomingFriendRequestWsDto {
  friendshipId: string;
  senderAvatarUrl: string;
  senderDisplayName: string;
  listItem: IncomingFrienshipRequestDto;
}
