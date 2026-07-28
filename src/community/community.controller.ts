import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import { CommunityService } from './community.service';
import type { Request } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Community } from '../entities/community.entity';
import { CreateCommunityDto } from './dtos/createCommunity.dto';
import { EditCommunityDto } from './dtos/editCommunity.dto';

@ApiTags('Communities')
@ApiBearerAuth()
@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  /**
   * Get all communities for the currently logged-in user.
   *
   * @remarks This endpoint retrieves all communities that the currently logged-in user is a part of.
   * @return An array of communities.
   * @throws {401} if the user is not authenticated.
   */
  @Get('me')
  getMyCommunities(@Req() request: Request): Promise<Community[]> {
    const userId = request['user'] as string;
    return this.communityService.getCommunitiesByUserId(userId);
  }

  /**
   * Get community by ID.
   *
   * @remarks This endpoint retrieves a community by its ID.
   * @return The community with the specified ID.
   * @throws {404} if the community with the specified ID is not found or the user is not a member of the community.
   */
  @Get(':id')
  getCommunityById(
    @Req() request: Request,
    @Param('id') id: string,
  ): Promise<Community> {
    const userId = request['user'] as string;
    return this.communityService.getCommunityById(id, userId);
  }

  /**
   * Create a Community.
   *
   * @remarks This endpoint creates a new community with the provided values from the request body.
   * @return The created community.
   * @throws {401} if the user is not authenticated.
   * @throws {404} if one or more of the participants are not found.
   */
  @Post()
  createCommunity(
    @Req() request: Request,
    @Body() payload: CreateCommunityDto,
  ): Promise<Community> {
    const userId = request['user'] as string;
    return this.communityService.createCommunity(payload, userId);
  }

  /**
   * Edit an existing community.
   *
   * @remarks This endpoint allows a member of a community to edit its primary proeprties such as name, description, and rules.
   * @return The updated community.
   * @throws {401} if the user is not authenticated.
   * @throws {404} if the community with the specified ID is not found, or the user is not a member of the community.
   */
  @Patch(':id')
  editCommunity(
    @Req() request: Request,
    @Body() payload: EditCommunityDto,
    @Param('id') id: string,
  ): Promise<Community> {
    const userId = request['user'] as string;
    return this.communityService.editCommunity(id, payload, userId);
  }
}
