import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import { FriendsService } from './friends.service';
import type { Request } from 'express';
import { FriendshipListItemDto } from './dtos/friendshipListItem.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { OutgoingFrienshipRequestDto } from './dtos/outgoingFrienshipRequest.dto';
import { IncomingFrienshipRequestDto } from './dtos/incomingFrienshipRequest.dto';
import { Friendship } from '../entities/friendship.entity';

@ApiTags('Friends')
@Controller('friends')
@ApiBearerAuth()
export class FriendsController {
  constructor(private readonly friendsService: FriendsService) {}

  /**
   * Get the list of friends for the authenticated user with pagination.
   * @remarks This endpoint retrieves a paginated list of friends for the currently authenticated user. The user's ID is extracted from the request object, and the friends are fetched from the database based on that ID. The `top` query parameter specifies the number of friends to return per page (default is 20), and the `page` query parameter specifies the page number to retrieve (default is 1). The response includes an array of friendship list items, each containing information about a friend.
   */
  @Get()
  async getMyFriends(
    @Req() req: Request,
    @Query('top') top: number = 20,
    @Query('page') page: number = 1,
    @Query('getAll') getAll: boolean = false,
  ): Promise<FriendshipListItemDto[]> {
    const userId = req['user'] as string;
    return this.friendsService.getAllFriends(userId, top, page, getAll);
  }

  /**
   * Search for friends by display name for the authenticated user with pagination.
   * @remarks This endpoint allows the authenticated user to search for friends by their display name. The user's ID is extracted from the request object, and the search query is provided as a query parameter. The `top` query parameter specifies the number of friends to return per page (default is 20), and the `page` query parameter specifies the page number to retrieve (default is 1). The response includes an array of friendship list items that match the search query, each containing information about a friend.
   */
  @Get('search')
  async searchFriends(
    @Req() req: Request,
    @Query('query') query: string,
    @Query('top') top: number = 20,
    @Query('page') page: number = 1,
  ): Promise<FriendshipListItemDto[]> {
    const userId = req['user'] as string;
    return this.friendsService.searchFriends(userId, query, top, page);
  }

  /**
   * Get the list of outgoing friend requests for the authenticated user with pagination.
   * @remarks This endpoint retrieves a paginated list of outgoing friend requests for the currently authenticated user. The user's ID is extracted from the request object, and the outgoing friend requests are fetched from the database based on that ID. The `top` query parameter specifies the number of friend requests to return per page (default is 20), and the `page` query parameter specifies the page number to retrieve (default is 1). The response includes an array of outgoing friendship request items, each containing information about the recipient of the friend request.
   */
  @Get('outgoing')
  async getOutgoingFriendRequests(
    @Req() req: Request,
    @Query('top') top: number = 20,
    @Query('page') page: number = 1,
  ): Promise<OutgoingFrienshipRequestDto[]> {
    const userId = req['user'] as string;
    return this.friendsService.getAllOutgoingFriendRequests(userId, top, page);
  }

  /**
   * Get the list of incoming friend requests for the authenticated user with pagination.
   * @remarks This endpoint retrieves a paginated list of incoming friend requests for the currently authenticated user. The user's ID is extracted from the request object, and the incoming friend requests are fetched from the database based on that ID. The `top` query parameter specifies the number of friend requests to return per page (default is 20), and the `page` query parameter specifies the page number to retrieve (default is 1). The response includes an array of incoming friendship request items, each containing information about the requester of the friend request.
   */
  @Get('incoming')
  async getIncomingFriendRequests(
    @Req() req: Request,
    @Query('top') top: number = 20,
    @Query('page') page: number = 1,
  ): Promise<IncomingFrienshipRequestDto[]> {
    const userId = req['user'] as string;
    return this.friendsService.getAllIncomingFriendRequests(userId, top, page);
  }

  /**
   * Decline a friend request by its ID for the authenticated user.
   * @remarks This endpoint allows the authenticated user to decline a specific friend request by providing the request ID as a path parameter. The user's ID is extracted from the request object, and the specified friend request is declined in the database. If the friend request does not exist or does not belong to the user, an appropriate error response is returned. Upon successful decline of the friend request, the updated Friendship entity is returned in the response.
   * @throws {404} if the friend request does not exist or does not belong to the user.
   * @throws {400} if the friend request is not in a pending state.
   */
  @Delete('request/:requestId/decline')
  async declineFriendRequest(
    @Req() req: Request,
    @Param('requestId') requestId: string,
  ): Promise<Friendship> {
    const userId = req['user'] as string;
    return this.friendsService.declineFriendRequest(requestId, userId);
  }

  /**
   * Accept a friend request by its ID for the authenticated user.
   * @remarks This endpoint allows the authenticated user to accept a specific friend request by providing the request ID as a path parameter. The user's ID is extracted from the request object, and the specified friend request is accepted in the database. If the friend request does not exist or does not belong to the user, an appropriate error response is returned. Upon successful acceptance of the friend request, the updated Friendship entity with status ACCEPTED is returned in the response.
   * @throws {404} if the friend request does not exist or does not belong to the user.
   * @throws {400} if the friend request is not in a pending state.
   */
  @Patch('request/:requestId/accept')
  async acceptFriendRequest(
    @Req() req: Request,
    @Param('requestId') requestId: string,
  ): Promise<Friendship> {
    const userId = req['user'] as string;
    return this.friendsService.acceptFriendRequest(requestId, userId);
  }

  /**
   * Send a friend request to another user by their ID.
   * @remarks This endpoint allows the authenticated user to send a friend request to another user by providing the recipient's user ID as a query parameter. The user's ID is extracted from the request object, and a new friend request is created in the database with the status set to PENDING. If the recipient user does not exist or if there is already an existing friend request between the two users, an appropriate error response is returned. Upon successful creation of the friend request, the newly created Friendship entity is returned in the response.
   * @throws {404} if the recipient user does not exist.
   * @throws {400} if there is already an existing friend request between the two users.
   */
  @Post('request')
  async sendFriendRequest(
    @Req() req: Request,
    @Query('recipientId') recipientId: string,
  ): Promise<Friendship> {
    const userId = req['user'] as string;
    return this.friendsService.sendFriendRequest(userId, recipientId);
  }
}
