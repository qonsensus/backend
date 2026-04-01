import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { CreateChatDto } from './dtos/createChat.dto';
import { ChatDto } from './dtos/chat.dto';
import { ChatMessageDto } from './dtos/chatMessage.dto';

@Controller('chat')
@ApiBearerAuth()
@ApiTags('Chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  /**
   * Get all chats the authenticated user is part of, along with the latest message in each chat.
   */
  @Get()
  async getMyChats(@Req() req: Request): Promise<ChatDto[]> {
    const userId = req['user'] as string;
    return await this.chatService.getAllConversationsForUser(userId);
  }

  /**
   * Get messages for a specific chat.
   */
  @Get(':chatId/messages')
  async getChatMessages(
    @Param('chatId') chatId: string,
    @Req() req: Request,
    @Query('before') before: Date,
    @Query('take') take?: number,
  ): Promise<ChatMessageDto[]> {
    const userId = req['user'] as string;
    return await this.chatService.getMessagesOlderThan(
      userId,
      chatId,
      before,
      take,
    );
  }

  /**
   * Create a new conversation with specified participants.
   */
  @Post()
  async createChat(
    @Body() payload: CreateChatDto,
    @Req() req: Request,
  ): Promise<ChatDto> {
    const userId = req['user'] as string;
    return await this.chatService.createChat(userId, payload);
  }
}
