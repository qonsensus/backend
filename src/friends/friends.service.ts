import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Friendship, FriendshipStatus } from '../entities/friendship.entity';
import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { FriendshipListItemDto } from './dtos/friendshipListItem.dto';
import { IncomingFrienshipRequestDto } from './dtos/incomingFrienshipRequest.dto';
import { OutgoingFrienshipRequestDto } from './dtos/outgoingFrienshipRequest.dto';

@Injectable()
export class FriendsService {
  constructor(
    @InjectRepository(Friendship)
    private readonly friendshipRepository: Repository<Friendship>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
  ) {}

  /**
   * Sends a friendship request from one user (requester) to another user (recipient) by creating a new Friendship record with status PENDING. Validations are performed to ensure that the requester and recipient exist, that the requester is not sending a request to themselves, and that there is no existing friendship or pending request between the two users.
   * @param requesterId - The ID of the user sending the friendship request (requester).
   * @param recipientId - The ID of the user receiving the friendship request (recipient).
   * @throws BadRequestException if the requester is trying to send a request to themselves or if there is already an existing friendship or pending request between the two users.
   * @throws NotFoundException if either the requester or recipient user does not exist.
   * @returns The created Friendship entity representing the new friendship request with status PENDING.
   */
  async sendFriendRequest(
    requesterId: string,
    recipientId: string,
  ): Promise<Friendship> {
    if (requesterId === recipientId) {
      throw new BadRequestException('Cannot send friend request to yourself');
    }
    const requester = await this.userRepository.findOne({
      where: { id: requesterId },
    });
    const recipient = await this.userRepository.findOne({
      where: { id: recipientId },
    });
    if (!requester || !recipient) {
      throw new NotFoundException('Requester or recipient not found');
    }
    const existingFriendship = await this.friendshipRepository.findOne({
      where: [
        { requesterId, recipientId },
        { requesterId: recipientId, recipientId: requesterId },
      ],
    });
    if (existingFriendship) {
      throw new BadRequestException(
        'Friend request already exists or you are already friends',
      );
    }
    const friendship = this.friendshipRepository.create({
      requester,
      recipient,
      status: FriendshipStatus.PENDING,
    });
    return this.friendshipRepository.save(friendship);
  }

  /**
   * Accepts a friendship request by updating the status to ACCEPTED. Only the recipient of the request can accept it.
   * @param friendshipId - The ID of the friendship request to accept.
   * @param userId - The ID of the user accepting the friendship request (must be the recipient).
   * @throws NotFoundException if the friendship request does not exist or the user is not the recipient.
   * @throws BadRequestException if the friendship request is not in a pending state.
   * @return The updated Friendship entity with status ACCEPTED.
   */
  async acceptFriendRequest(
    friendshipId: string,
    userId: string,
  ): Promise<Friendship> {
    const friendship = await this.friendshipRepository.findOne({
      where: { id: friendshipId, recipientId: userId },
    });
    if (!friendship) {
      throw new NotFoundException('Friendship request not found');
    }
    if (friendship.status !== FriendshipStatus.PENDING) {
      throw new BadRequestException('Friendship request is not pending');
    }
    friendship.status = FriendshipStatus.ACCEPTED;
    return this.friendshipRepository.save(friendship);
  }

  /**
   * Declines a friendship request by removing the corresponding friendship record. Only the recipient of the request can decline it.
   * @param friendshipId - The ID of the friendship request to decline.
   * @param userId - The ID of the user declining the friendship request (must be the recipient).
   * @throws NotFoundException if the friendship request does not exist or the user is not the recipient.
   * @throws BadRequestException if the friendship request is not in a pending state.
   * @returns The removed Friendship entity representing the declined request.
   */
  async declineFriendRequest(
    friendshipId: string,
    userId: string,
  ): Promise<Friendship> {
    const friendship = await this.friendshipRepository.findOne({
      where: { id: friendshipId, recipientId: userId },
    });
    if (!friendship) {
      throw new NotFoundException('Friendship request not found');
    }
    if (friendship.status !== FriendshipStatus.PENDING) {
      throw new BadRequestException('Friendship request is not pending');
    }
    return this.friendshipRepository.remove(friendship);
  }

  /**
   * Retrieves a paginated list of outgoing friendship requests for a given user. Only requests where the user is the requester and the status is PENDING are returned.
   * The results are ordered by the creation date of the friendship request in descending order (most recent first).
   * @param userId - The ID of the user whose outgoing friendship requests are to be retrieved.
   * @param top - The maximum number of friendship requests to return per page.
   * @param page - The current page number for pagination (starting from 1).
   * @returns A list of OutgoingFrienshipRequestDto objects representing the outgoing friendship requests for the specified user.
   */
  async getAllOutgoingFriendRequests(
    userId: string,
    top: number,
    page: number,
  ): Promise<OutgoingFrienshipRequestDto[]> {
    const friendships = await this.friendshipRepository.find({
      where: { requesterId: userId, status: FriendshipStatus.PENDING },
      order: { createdAt: 'DESC' },
      take: top,
      skip: (page - 1) * top,
      relations: ['recipient', 'recipient.profile'],
    });
    const outgoingRequests: OutgoingFrienshipRequestDto[] = [];
    friendships.forEach((f) => {
      outgoingRequests.push({
        id: f.id,
        requestedAt: f.createdAt,
        recipientId: f.recipientId,
        recipientProfile: f.recipient.profile,
      });
    });
    return outgoingRequests;
  }

  /**
   * Retrieves a paginated list of incoming friendship requests for a given user. Only requests where the user is the recipient and the status is PENDING are returned.
   * The results are ordered by the creation date of the friendship request in descending order (most recent first).
   * @param userId - The ID of the user whose incoming friendship requests are to be retrieved.
   * @param top - The maximum number of friendship requests to return per page.
   * @param page - The current page number for pagination (starting from 1).
   * @returns A list of IncomingFrienshipRequestDto objects representing the incoming friendship requests for the specified user.
   */
  async getAllIncomingFriendRequests(
    userId: string,
    top: number,
    page: number,
  ): Promise<IncomingFrienshipRequestDto[]> {
    const friendships = await this.friendshipRepository.find({
      where: { recipientId: userId, status: FriendshipStatus.PENDING },
      order: { createdAt: 'DESC' },
      take: top,
      skip: (page - 1) * top,
      relations: ['requester', 'requester.profile'],
    });
    const incomingRequests: IncomingFrienshipRequestDto[] = [];
    friendships.forEach((f) => {
      incomingRequests.push({
        id: f.id,
        requestedAt: f.createdAt,
        requesterId: f.requesterId,
        requesterProfile: f.requester.profile,
      });
    });
    return incomingRequests;
  }

  /**
   * Retrieves a paginated list of all friends for a given user. Only friendships where the status is ACCEPTED are returned, regardless of whether the user is the requester or recipient.
   * The results are ordered by the date the friendship was accepted (updatedAt) in descending order (most recent first).
   * @param userId - The ID of the user whose friends are to be retrieved.
   * @param top - The maximum number of friends to return per page.
   * @param page - The current page number for pagination (starting from 1).
   * @returns A list of FriendshipListItemDto objects representing the friends of the specified user, including the date they became friends and the friend's profile information.
   */
  async getAllFriends(
    userId: string,
    top: number,
    page: number,
  ): Promise<FriendshipListItemDto[]> {
    const friendships = await this.friendshipRepository.find({
      where: [
        { requesterId: userId, status: FriendshipStatus.ACCEPTED },
        { recipientId: userId, status: FriendshipStatus.ACCEPTED },
      ],
      order: { updatedAt: 'DESC' },
      take: top,
      skip: (page - 1) * top,
      relations: [
        'recipient',
        'requester',
        'requester.profile',
        'recipient.profile',
      ],
    });
    const recipientFriendships = friendships.filter(
      (f) => f.requesterId === userId,
    );
    const requesterFriendships = friendships.filter(
      (f) => f.recipientId === userId,
    );
    const finalList: FriendshipListItemDto[] = [];
    recipientFriendships.forEach((f) => {
      finalList.push({
        id: f.id,
        friendsSince: f.updatedAt,
        friendId: f.recipientId,
        friendProfile: f.recipient.profile,
      });
    });
    requesterFriendships.forEach((f) => {
      finalList.push({
        id: f.id,
        friendsSince: f.updatedAt,
        friendId: f.requesterId,
        friendProfile: f.requester.profile,
      });
    });
    return finalList;
  }
}
