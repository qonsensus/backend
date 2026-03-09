import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterUserDto } from './dtos/registerUser.dto';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Profile } from '../entities/profile.entity';
import { Public } from '../auth/public.decorator';
import { UpdateProfileDto } from './dtos/updateProfile.dto';
import { RegistrationResponseDto } from '../auth/dtos/registrationResponse.dto';

@Controller('user')
@ApiTags('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  /**
   * Register a new user.
   *
   * @remarks This endpoint allows clients to register a new user by providing an email and password. The password must be confirmed by including a matching password confirmation field. If the registration is successful, the newly created user entity is returned.
   * @throws {400} Bad Request - If the password and confirmation do not match, or if the email is already in use.
   */
  @Post()
  @Public()
  async registerUser(
    @Body() dto: RegisterUserDto,
  ): Promise<RegistrationResponseDto> {
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
