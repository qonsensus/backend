import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  adjectives,
  colors,
  Config,
  uniqueNamesGenerator,
} from 'unique-names-generator';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { Repository } from 'typeorm';
import { Profile } from '../entities/profile.entity';
import { RegisterUserDto } from './dtos/registerUser.dto';
import { hash } from 'bcrypt';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
  ) {}

  /**
   * Retrieves the profile associated with a given user ID.
   * @param userId - The ID of the user whose profile is to be retrieved.
   * @returns A promise that resolves to the Profile entity associated with the user.
   * @throws BadRequestException if the user with the specified ID is not found.
   */
  async getProfileByUserId(userId: string): Promise<Profile> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['profile'],
    });
    if (!user) throw new NotFoundException('User not found');
    return user.profile;
  }

  /**
   * Registers a new user with the provided email and password. A random display name is generated for the user's profile.
   * @param dto - The data transfer object containing the user's email and password.
   * @returns The newly created user entity.
   * @throws BadRequestException if the password and confirmation do not match or if the email is already in use.
   */
  async registerUser(dto: RegisterUserDto): Promise<User> {
    // Validate that the password and confirmation match
    if (dto.password !== dto.passwordConfirmation)
      throw new BadRequestException('Passwords and confirmation do not match');

    // Check if the email is already in use
    const existingUser = await this.userRepository.findOne({
      where: { email: dto.email },
    });
    if (existingUser) throw new BadRequestException('Email is already in use');

    // Create a new profile with a random display name
    const userProfile = this.profileRepository.create();
    userProfile.displayName = this.generateRandomName();
    await this.profileRepository.save(userProfile);

    // Create a new user and associate it with the profile
    const user = this.userRepository.create();
    user.email = dto.email;
    user.passwordHash = await this.hashPassword(dto.password);
    user.profile = userProfile;

    // Save the user to the database and return the created user entity
    return this.userRepository.save(user);
  }

  async hashPassword(plainPassword: string): Promise<string> {
    // TODO: This should be globally configured and not hardcoded here
    const SALT_ROUNDS = 12;
    return hash(plainPassword, SALT_ROUNDS);
  }

  generateRandomName(): string {
    const customConfig: Config = {
      dictionaries: [adjectives, colors],
      separator: '-',
      length: 2,
    };
    return uniqueNamesGenerator(customConfig);
  }
}
