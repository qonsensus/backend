import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterUserDto } from './dtos/registerUser.dto';
import { User } from '../entities/user.entity';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Profile } from '../entities/profile.entity';
import { Public } from '../auth/public.decorator';
import { UpdateProfileDto } from './dtos/updateProfile.dto';
import { Friendship } from '../entities/friendship.entity';

@Controller('user')
@ApiTags('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Sends a friend request from the currently authenticated user to another user specified by their ID.
   *
   * @remarks This endpoint allows the currently authenticated user to send a friend request to another user by providing the target user's ID as a path parameter. The request must include a valid authentication token to access this endpoint. If the friend request is successfully sent, the newly created friendship entity representing the pending friend request is returned.
   * @throws {400} Bad Request - If the specified friend ID is invalid or if a friend request already exists between the users.
   * @throws {401} Unauthorized - If the user is not authenticated or if the authentication token is invalid.
   * @throws {404} Not Found - If no user exists with the specified friend ID.
   */
  @Post('me/friendship/request/:friendId')
  @ApiBearerAuth()
  async sendFriendRequest(
    @Req() req: Request,
    @Param('friendId') friendId: string,
  ): Promise<Friendship> {
    const userId: string = req['user'] as string;
    return await this.userService.sendFriendRequest(userId, friendId);
  }

  /**
   * Accepts a pending friend request for the currently authenticated user.
   *
   * @remarks This endpoint allows the currently authenticated user to accept a pending friend request by providing the friendship ID as a path parameter. The request must include a valid authentication token to access this endpoint. If the friend request is successfully accepted, the updated friendship entity representing the accepted friendship is returned.
   * @throws {400} Bad Request - If the specified friendship ID is invalid or if the friend request cannot be accepted.
   * @throws {401} Unauthorized - If the user is not authenticated or if the authentication token is invalid.
   * @throws {404} Not Found - If no friendship exists with the specified ID or if the friendship does not belong to the authenticated user.
   */
  @Patch('me/friendship/:friendshipId/accept')
  @ApiBearerAuth()
  async acceptFriendRequest(
    @Req() req: Request,
    @Param('friendshipId') friendshipId: string,
  ): Promise<Friendship> {
    const userId: string = req['user'] as string;
    return await this.userService.acceptFriendRequest(userId, friendshipId);
  }

  /**
   * Rejects a pending friend request for the currently authenticated user.
   *
   * @remarks This endpoint allows the currently authenticated user to reject a pending friend request by providing the friendship ID as a path parameter. The request must include a valid authentication token to access this endpoint. If the friend request is successfully rejected, the updated friendship entity representing the rejected friendship is returned.
   * @throws {400} Bad Request - If the specified friendship ID is invalid or if the friend request cannot be rejected.
   * @throws {401} Unauthorized - If the user is not authenticated or if the authentication token is invalid.
   * @throws {404} Not Found - If no friendship exists with the specified ID or if the friendship does not belong to the authenticated user.
   */
  @Patch('me/friendship/:friendshipId/reject')
  @ApiBearerAuth()
  async rejectFriendRequest(
    @Req() req: Request,
    @Param('friendshipId') friendshipId: string,
  ): Promise<Friendship> {
    const userId: string = req['user'] as string;
    return await this.userService.rejectFriendRequest(userId, friendshipId);
  }

  /**
   * Register a new user.
   *
   * @remarks This endpoint allows clients to register a new user by providing an email and password. The password must be confirmed by including a matching password confirmation field. If the registration is successful, the newly created user entity is returned.
   * @throws {400} Bad Request - If the password and confirmation do not match, or if the email is already in use.
   */
  @Post()
  @Public()
  async registerUser(@Body() dto: RegisterUserDto): Promise<User> {
    return this.userService.registerUser(dto);
  }

  /**
   * Retrieves the profile of the currently authenticated user.
   *
   * @remarks This endpoint allows clients to fetch the profile information of the currently authenticated user. The user's identity is determined from the authentication token included in the request. If the user is successfully authenticated, their profile information is returned.
   * @throws {401} Unauthorized - If the user is not authenticated or if the authentication token is invalid.
   * @throws {404} Not Found - If the user associated with the authentication token does not exist.
   */
  @Get('me/profile')
  @ApiBearerAuth()
  async getMyProfile(@Req() req: Request): Promise<Profile> {
    const userId: string = req['user'] as string;
    return this.userService.getProfileByUserId(userId);
  }

  /**
   * Retrieves the profile of a user by their ID.
   *
   * @remarks This endpoint allows clients to fetch the profile information of a user by providing their unique ID as a path parameter. The request must include a valid authentication token to access this endpoint. If the user with the specified ID exists and the requester is authenticated, the user's profile information is returned.
   * @throws {401} Unauthorized - If the requester is not authenticated or if the authentication token is invalid.
   * @throws {404} Not Found - If no user exists with the specified ID.
   * @param userId
   */
  @Get(':id/profile')
  @ApiBearerAuth()
  async getUserProfile(@Param('id') userId: string): Promise<Profile> {
    return this.userService.getProfileByUserId(userId);
  }

  /**
   * Updates the profile of the currently authenticated user.
   *
   * @remarks This endpoint allows clients to update the profile information of the currently authenticated user. The user's identity is determined from the authentication token included in the request. The request body should contain the new profile information (bio, display name, and MOTD). If the update is successful, the updated profile entity is returned.
   * @throws {400} Bad Request - If the provided profile information is invalid.
   * @throws {401} Unauthorized - If the user is not authenticated or if the authentication token is invalid.
   * @throws {404} Not Found - If the user associated with the authentication token does not exist.
   */
  @Patch('me/profile')
  @ApiBearerAuth()
  async updateMyProfile(
    @Req() req: Request,
    @Body() dto: UpdateProfileDto,
  ): Promise<Profile> {
    const userId: string = req['user'] as string;
    return this.userService.updateProfile(userId, dto);
  }
}
