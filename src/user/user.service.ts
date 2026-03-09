import { BadRequestException, Injectable } from '@nestjs/common';
import {
  adjectives,
  animals,
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
import { RegistrationResponseDto } from '../auth/dtos/registrationResponse.dto';
import { LoginDto } from '../auth/dtos/login.dto';
import { AuthService } from '../auth/auth.service';
import { TokenPair } from '../auth/dtos/tokenPair.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    private readonly authService: AuthService,
  ) {}

  /**
   * Registers a new user with the provided email and password. A random display name is generated for the user's profile.
   * @param dto - The data transfer object containing the user's email and password.
   * @returns The newly created user entity.
   * @throws BadRequestException if the password and confirmation do not match or if the email is already in use.
   */
  async registerUser(dto: RegisterUserDto): Promise<RegistrationResponseDto> {
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
    userProfile.handle = this.generateRandomHandle();
    await this.profileRepository.save(userProfile);

    // Create a new user and associate it with the profile
    const user = this.userRepository.create();
    user.email = dto.email;
    user.passwordHash = await this.hashPassword(dto.password);
    user.profile = userProfile;

    // Save the user to the database and return the created user entity
    await this.userRepository.save(user);
    const loginData: LoginDto = {
      email: user.email,
      password: dto.password,
    };
    const tokenPair: TokenPair = await this.authService.login(loginData);
    return {
      profile: userProfile,
      tokenPair,
    };
  }

  private async hashPassword(plainPassword: string): Promise<string> {
    // TODO: This should be globally configured and not hardcoded here
    const SALT_ROUNDS = 12;
    return hash(plainPassword, SALT_ROUNDS);
  }

  private generateRandomName(): string {
    const customConfig: Config = {
      dictionaries: [adjectives, colors],
      separator: '-',
      length: 2,
    };
    return uniqueNamesGenerator(customConfig);
  }

  private generateRandomHandle(): string {
    const customConfig: Config = {
      dictionaries: [adjectives, colors, animals],
      separator: '_',
      length: 3,
    };
    const handle = uniqueNamesGenerator(customConfig);
    return `${handle}_${this.generateRandomNumbers(6)}`;
  }

  private generateRandomNumbers(length: number): string {
    let result = '';
    const characters = '0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * charactersLength);
      result += characters.charAt(randomIndex);
    }
    return result;
  }
}
