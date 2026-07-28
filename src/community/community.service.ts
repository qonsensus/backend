import { Injectable, NotFoundException } from '@nestjs/common';
import { Community } from '../entities/community.entity';
import { In, Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '../entities/user.entity';
import { CreateCommunityDto } from './dtos/createCommunity.dto';
import { UserToCommunity } from '../entities/userToCommunity.entity';
import { EditCommunityDto } from './dtos/editCommunity.dto';

@Injectable()
export class CommunityService {
  constructor(
    @InjectRepository(Community)
    private readonly communityRepository: Repository<Community>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(UserToCommunity)
    private readonly userToCommunityRepository: Repository<UserToCommunity>,
  ) {}

  async createCommunity(
    payload: CreateCommunityDto,
    creatorId: string,
  ): Promise<Community> {
    // ensure creator exists
    const creator = await this.userRepository.findOne({
      where: { id: creatorId },
    });
    if (!creator) throw new NotFoundException('Creator not found');

    // ensure all participants are valid users
    const participants = await this.userRepository.find({
      where: { id: In(payload.participants) },
    });
    if (participants.length !== payload.participants.length) {
      throw new NotFoundException('One or more participants not found');
    }

    // ensure creator is included in the participant list
    const creatorFoundInList = participants.find((p) => p.id === creatorId);
    if (!creatorFoundInList) participants.push(creator);

    // create community entity
    const community = this.communityRepository.create();
    community.name = payload.name;
    community.description = payload.description;
    await this.communityRepository.save(community);

    // create userToCommunity entities
    const userToCommunityEntries = participants.map((participant) =>
      this.userToCommunityRepository.create({
        user: participant,
        community,
      }),
    );
    await this.userToCommunityRepository.save(userToCommunityEntries);

    return community;
  }

  async getCommunityById(id: string, userId: string): Promise<Community> {
    // ensure user is a part of the community
    const userToCommunity = await this.userToCommunityRepository.findOne({
      where: {
        user: { id: userId },
        community: { id },
      },
      relations: {
        user: true,
        community: {
          participants: true,
          chatChannels: true,
        },
      },
    });
    if (!userToCommunity) {
      throw new NotFoundException(
        'Community does not exist or you are not a part of it.',
      );
    }

    return userToCommunity.community;
  }

  async getCommunitiesByUserId(userId: string): Promise<Community[]> {
    // get all communities where the user is a participant
    const userToCommunities = await this.userToCommunityRepository.find({
      where: { user: { id: userId } },
      relations: { community: true, user: true },
    });
    return userToCommunities.map((entry) => entry.community);
  }

  async editCommunity(
    communityId: string,
    payload: EditCommunityDto,
    userId: string,
  ): Promise<Community> {
    // check if the user is a part of the community
    const userToCommunity = await this.userToCommunityRepository.findOne({
      where: {
        user: { id: userId },
        community: { id: communityId },
      },
      relations: {
        community: true,
        user: true,
      },
    });
    // TODO: a stricter check needs to be done -> RBAC or Owner
    if (!userToCommunity)
      throw new NotFoundException(
        'Community does not exist or the user is not a part of it.',
      );

    userToCommunity.community.name = payload.name;
    userToCommunity.community.description = payload.description;

    return await this.communityRepository.save(userToCommunity.community);
  }
}
