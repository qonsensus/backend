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
import { UpdateProfileDto } from './dtos/updateProfile.dto';
import { Friendship, FriendshipStatus } from '../entities/friendship.entity';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
    @InjectRepository(Friendship)
    private readonly friendshipRepository: Repository<Friendship>,
  ) {}

  /**
   * Accepts a friend request by updating the status of the specified friendship to ACCEPTED. This method first retrieves the friendship entity from the database using the provided friendship ID and checks if it exists. It then verifies that the recipient of the friend request matches the provided recipient ID. If both checks pass, the status of the friendship is updated to ACCEPTED and saved back to the database. If any of the checks fail, appropriate exceptions are thrown.
   * @throws NotFoundException if the friendship with the specified ID is not found.
   * @throws BadRequestException if the recipient ID does not match the recipient of the friend request.
   * @param friendshipId - The ID of the friendship to be accepted.
   * @param recipientId - The ID of the user accepting the friend request, which must match the recipient of the friend request.
   * @returns A promise that resolves to the updated Friendship entity with the status set to ACCEPTED.
   */
  async acceptFriendRequest(
    friendshipId: string,
    recipientId: string,
  ): Promise<Friendship> {
    const friendship = await this.friendshipRepository.findOne({
      where: { id: friendshipId },
      relations: ['recipient'],
    });
    if (!friendship) throw new NotFoundException('Friend request not found');
    if (friendship.recipient.id !== recipientId)
      throw new BadRequestException(
        'Only the recipient can accept the friend request',
      );
    friendship.status = FriendshipStatus.ACCEPTED;
    await this.friendshipRepository.save(friendship);
    return friendship;
  }

  /**
   * Rejects a friend request by updating the status of the specified friendship to REJECTED. This method first retrieves the friendship entity from the database using the provided friendship ID and checks if it exists. It then verifies that the recipient of the friend request matches the provided recipient ID. If both checks pass, the status of the friendship is updated to REJECTED and saved back to the database. If any of the checks fail, appropriate exceptions are thrown.
   * @throws NotFoundException if the friendship with the specified ID is not found.
   * @throws BadRequestException if the recipient ID does not match the recipient of the friend request.
   * @param friendshipId - The ID of the friendship to be rejected.
   * @param recipientId - The ID of the user rejecting the friend request, which must match the recipient of the friend request.
   * @returns A promise that resolves to the updated Friendship entity with the status set to REJECTED.
   */
  async rejectFriendRequest(
    friendshipId: string,
    recipientId: string,
  ): Promise<Friendship> {
    const friendship = await this.friendshipRepository.findOne({
      where: { id: friendshipId },
      relations: ['recipient'],
    });
    if (!friendship) throw new NotFoundException('Friend request not found');
    if (friendship.recipient.id !== recipientId)
      throw new BadRequestException(
        'Only the recipient can reject the friend request',
      );
    friendship.status = FriendshipStatus.REJECTED;
    await this.friendshipRepository.save(friendship);
    return friendship;
  }

  /**
   * Sends a friend request from one user to another. This method checks if both the sender and recipient users exist, ensures that the sender is not trying to send a friend request to themselves, and verifies that there is no existing friendship or pending friend request between the two users. If all checks pass, a new friendship entity with a status of PENDING is created and saved to the database. The method returns a response indicating the success of the operation along with the ID of the created friendship.
   * @returns A promise that resolves to a FriendRequestResponse object containing the ID of the created friendship and a success flag.
   * @throws NotFoundException if either the sender or recipient user is not found.
   * @throws BadRequestException if the sender is trying to send a friend request to themselves or if there is already an existing friendship or pending friend request between the two users.
   * @param senderId - The ID of the user sending the friend request.
   * @param recipientId - The ID of the user receiving the friend request.
   */
  async sendFriendRequest(
    senderId: string,
    recipientId: string,
  ): Promise<Friendship> {
    // Retrieve the sender and recipient users from the database
    const sender = await this.userRepository.findOne({
      where: { id: senderId },
    });
    const recipient = await this.userRepository.findOne({
      where: { id: recipientId },
    });

    // Validate that both users exist
    if (!recipient) throw new NotFoundException('Recipient user not found');
    if (!sender) throw new NotFoundException('Sender user not found');

    // Ensure that the sender is not trying to send a friend request to themselves
    if (sender.id === recipient.id)
      throw new BadRequestException('Cannot send friend request to yourself');

    // Check for existing friendship or pending friend request between the sender and recipient
    const existingFriendship = await this.friendshipRepository.findOne({
      where: [
        { requester: { id: senderId }, recipient: { id: recipientId } },
        { requester: { id: recipientId }, recipient: { id: senderId } },
      ],
    });
    if (existingFriendship)
      throw new BadRequestException(
        'Friend request already exists or users are already friends',
      );

    // Create a new friendship entity with a status of PENDING and save it to the database
    const friendship = this.friendshipRepository.create({
      requester: sender,
      recipient: recipient,
      status: FriendshipStatus.PENDING,
    });
    await this.friendshipRepository.save(friendship);
    return friendship;
  }

  /**
   * Updates the profile information for a given user. This method retrieves the user by their ID, updates the associated profile with the provided data, and saves the changes to the database. If the user is not found, a NotFoundException is thrown.
   * @param userId - The ID of the user whose profile is to be updated.
   * @param dto - The data transfer object containing the new profile information (bio, display name, and MOTD).
   * @returns A promise that resolves to the updated Profile entity.
   * @throws NotFoundException if the user with the specified ID is not found.
   */
  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<Profile> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['profile'],
    });
    if (!user) throw new NotFoundException('User not found');
    const profile = user.profile;
    profile.bio = dto.bio;
    profile.displayName = dto.displayName;
    profile.motd = dto.motd;
    return this.profileRepository.save(profile);
  }

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
  async registerUser(dto: RegisterUserDto): Promise<Profile> {
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
    await this.userRepository.save(user);
    return userProfile;
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
