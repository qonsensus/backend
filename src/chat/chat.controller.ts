import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { SendMessageDto } from './dtos/sendMessage.dto';
import type { Request } from 'express';
import { CreateChatDto } from './dtos/createChat.dto';
import { ChatDto } from './dtos/chat.dto';
import { ChatMessageDto } from './dtos/chatMessage.dto';

@Controller('conversation')
@ApiBearerAuth()
@ApiTags('Conversation')
export class ChatController {
  constructor(private readonly conversationService: ChatService) {}

  @Get()
  async getConversation(@Req() req: Request): Promise<ChatDto[]> {
    const userId = req['user'] as string;
    return await this.conversationService.getAllConversationsForUser(userId);
  }

  @Get(':conversationId/messages')
  async getConversationMessages(
    @Param('conversationId') conversationId: string,
    @Req() req: Request,
  ): Promise<ChatMessageDto[]> {
    const userId = req['user'] as string;
    return await this.conversationService.getMessagesOlderThan(
      userId,
      conversationId,
    );
  }

  @Post()
  async createConversation(
    @Body() payload: CreateChatDto,
    @Req() req: Request,
  ): Promise<ChatDto> {
    const userId = req['user'] as string;
    return await this.conversationService.createConversation(userId, payload);
  }

  @Post(':conversationId/message')
  async sendMessage(
    @Param('conversationId') conversationId: string,
    @Req() req: Request,
    @Body() payload: SendMessageDto,
  ): Promise<ChatMessageDto> {
    const userId = req['user'] as string;
    return await this.conversationService.sendMessage(
      conversationId,
      userId,
      payload,
    );
  }
}
