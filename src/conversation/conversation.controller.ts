import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ConversationService } from './conversation.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SendMessageDto } from './dtos/sendMessage.dto';
import type { Request } from 'express';
import { CreateConversationDto } from './dtos/createConversation.dto';
import { Conversation } from '../entities/conversation.entity';

@Controller('conversation')
@ApiBearerAuth()
@ApiTags('Conversation')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Get()
  async getConversation(@Req() req: Request): Promise<Conversation[]> {
    const userId = req['user'] as string;
    return await this.conversationService.getAllConversationsForUser(userId);
  }

  @Get(':conversationId/messages')
  async getConversationMessages(
    @Param('conversationId') conversationId: string,
    @Req() req: Request,
  ) {
    const userId = req['user'] as string;
    return await this.conversationService.getConversationMessages(
      userId,
      conversationId,
    );
  }

  @Post()
  async createConversation(
    @Body() payload: CreateConversationDto,
    @Req() req: Request,
  ) {
    const userId = req['user'] as string;
    return await this.conversationService.createConversation(userId, payload);
  }

  @Post(':conversationId/message')
  async sendMessage(
    @Param('conversationId') conversationId: string,
    @Req() req: Request,
    @Body() payload: SendMessageDto,
  ) {
    const userId = req['user'] as string;
    return await this.conversationService.sendMessage(
      conversationId,
      userId,
      payload,
    );
  }
}
