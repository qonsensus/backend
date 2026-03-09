import { Body, Controller, Get, Patch, Query, Req } from '@nestjs/common';
import { ProfileService } from './profile.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Profile } from '../entities/profile.entity';
import { UpdateProfileDto } from './dtos/updateProfile.dto';
import { HandleExistsResponseDto } from './dtos/handleExistsResponse.dto';

@Controller('profile')
@ApiTags('Profile')
@ApiBearerAuth()
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  /**
   * Get the profile of the currently authenticated user.
   *
   * @remarks This endpoint retrieves the profile information of the user making the request. The user's ID is extracted from the request object, and the corresponding profile is fetched from the database. If the user or profile is not found, an appropriate error response is returned.
   * @return The profile associated with the currently authenticated user.
   * @throws {404} if the user or profile is not found.
   */
  @Get('me')
  getMyProfile(@Req() request: Request): Promise<Profile> {
    const userId = request['user'] as string;
    return this.profileService.getProfileByUserId(userId);
  }

  /**
   * Update the profile of the currently authenticated user.
   *
   * @remarks This endpoint allows the user to update their profile information, such as display name, bio, message of the day (MOTD), and handle. The user's ID is extracted from the request object, and the provided profile data is validated and saved to the database. If the user or profile is not found, or if the provided handle is already taken by another profile, an appropriate error response is returned.
   * @return The updated profile after saving it to the database.
   * @throws {404} if the user or profile is not found.
   * @throws {400} if the provided handle is already taken by another profile.
   */
  @Patch('me')
  updateMyProfile(
    @Req() request: Request,
    @Body() payload: UpdateProfileDto,
  ): Promise<Profile> {
    const userId = request['user'] as string;
    return this.profileService.updateProfile(userId, payload);
  }

  /**
   * Check if a given handle already exists in the system.
   *
   * @remarks This endpoint allows clients to check if a specific handle is already taken by another profile. The handle is provided as a query parameter, and the response indicates whether the handle exists or not. This can be useful for validating handle availability during profile creation or updates.
   * @return An object containing the handle and a boolean indicating whether it exists.
   */
  @Get('handle/exists')
  async handleExists(
    @Query('handle') handle: string,
  ): Promise<HandleExistsResponseDto> {
    return {
      handle: handle,
      exists: await this.profileService.handleExists(handle),
    };
  }
}
