import { Body, Controller, Get, Post, Req } from '@nestjs/common';
import { UserService } from './user.service';
import { RegisterUserDto } from './dtos/registerUser.dto';
import { User } from '../entities/user.entity';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Profile } from '../entities/profile.entity';
import { Public } from '../auth/public.decorator';

@Controller('user')
@ApiTags('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

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
   * Register a new user.
   *
   * @remarks This endpoint allows clients to register a new user by providing an email and password. The password must be confirmed by including a matching password confirmation field. If the registration is successful, the newly created user entity is returned.
   * @throws {400} Bad Request - If the password and confirmation do not match, or if the email is already in use.
   */
  @Post('register')
  @Public()
  async registerUser(@Body() dto: RegisterUserDto): Promise<User> {
    return this.userService.registerUser(dto);
  }
}
