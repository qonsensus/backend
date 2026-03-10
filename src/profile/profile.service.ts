import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Profile } from '../entities/profile.entity';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { UpdateProfileDto } from './dtos/updateProfile.dto';

@Injectable()
export class ProfileService {
  constructor(
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Get a user's profile by their user ID
   * @param userId - The ID of the user whose profile is being requested
   * @returns The profile associated with the given user ID
   * @throws NotFoundException if the user or profile is not found
   */
  async getProfileByUserId(userId: string): Promise<Profile> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['profile'],
    });
    if (!user) throw new NotFoundException(`User with id ${userId} not found`);
    return user.profile;
  }

  /**
   * Update a user's profile information
   * @param userId - The ID of the user whose profile is being updated
   * @param payload - An object containing the new profile information (displayName, bio, motd, handle)
   * @returns The updated profile after saving it to the database
   * @throws NotFoundException if the user or profile is not found
   * @throws BadRequestException if the provided handle is already taken by another profile
   */
  async updateProfile(
    userId: string,
    payload: UpdateProfileDto,
  ): Promise<Profile> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['profile'],
    });
    if (!user) throw new NotFoundException(`User with id ${userId} not found`);
    if (
      user.profile.handle !== payload.handle &&
      (await this.handleExists(payload.handle))
    )
      throw new BadRequestException(
        `Handle ${payload.handle} is already taken`,
      );

    user.profile.displayName = payload.displayName;
    user.profile.bio = payload.bio;
    user.profile.motd = payload.motd;
    user.profile.handle = payload.handle;
    return this.profileRepository.save(user.profile);
  }

  /**
   * Check if a given handle already exists in the database
   * @param handle - The handle to check for existence
   * @returns A boolean indicating whether the handle exists (true) or not (false)
   */
  async handleExists(handle: string): Promise<boolean> {
    const profile = await this.profileRepository.findOne({ where: { handle } });
    return !!profile;
  }

  async getProfileByHandle(handle: string): Promise<Profile> {
    const profile = await this.profileRepository.findOne({ where: { handle } });
    if (!profile)
      throw new NotFoundException(`Profile with handle ${handle} not found`);
    return profile;
  }
}
