import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Chat } from '../entities/chat.entity';
import { In, LessThanOrEqual, Repository } from 'typeorm';
import { UserToChat } from '../entities/userToChat.entity';
import { User } from '../entities/user.entity';
import { CreateChatDto } from './dtos/createChat.dto';
import { ChatMessage } from '../entities/chatMessage.entity';
import { SendMessageDto } from './dtos/sendMessage.dto';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { ChatDto } from './dtos/chat.dto';
import { createHash } from 'node:crypto';
import { ChatMessageDto } from './dtos/chatMessage.dto';

@Injectable()
export class ChatService {
  constructor(
    @InjectRepository(Chat)
    private readonly chatRepository: Repository<Chat>,
    @InjectRepository(UserToChat)
    private readonly userToChatRepository: Repository<UserToChat>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(ChatMessage)
    private readonly chatMessageRepository: Repository<ChatMessage>,
    private readonly notificationGateway: NotificationsGateway,
  ) {}

  async sendMessage(
    chatId: string,
    userId: string,
    payload: SendMessageDto,
  ): Promise<ChatMessageDto> {
    // Verify user is part of the conversation
    const userToChat = await this.userToChatRepository.findOne({
      where: {
        userId: userId,
        chatId: chatId,
      },
    });
    if (!userToChat) {
      throw new NotFoundException('Chat not found or access denied');
    }

    // Create and save the message
    const message = this.chatMessageRepository.create();
    message.content = payload.message;
    message.chatId = chatId;
    const author = await this.userRepository.findOne({
      where: { id: userId },
      relations: { profile: true },
    });
    if (!author) throw new NotFoundException('Author not found');
    message.author = author;
    await this.chatMessageRepository.save(message);

    // Cast to ConversationMessageDto for notification
    const messageDto: ChatMessageDto = {
      id: message.id,
      content: message.content,
      conversationId: message.chatId,
      authorId: author.id,
      authorProfileId: author.profile.id,
      authorName: author.profile.displayName,
      createdAt: message.createdAt,
      authorAvatarUrl: author.profile.avatarUrl,
    };

    // get all participants in the conversation to notify them of the new message
    const participants = await this.userToChatRepository.find({
      where: {
        chatId: chatId,
      },
      relations: {
        user: true,
      },
    });
    const recipientIds = participants.map((p) => p.user.id);
    this.notificationGateway.notifyNewMessage(recipientIds, messageDto);

    return messageDto;
  }

  async getMessagesOlderThan(
    userId: string,
    chatId: string,
    timestamp: Date,
    take = 20,
  ): Promise<ChatMessageDto[]> {
    // get the UserToChat entry to ensure the user has access to the chat
    const userToChat = await this.userToChatRepository.findOne({
      where: {
        userId: userId,
        chatId: chatId,
      },
    });
    if (!userToChat) {
      throw new NotFoundException('Chat not found or access denied');
    }

    const messages = await this.chatMessageRepository.find({
      where: {
        chatId: chatId,
        createdAt: LessThanOrEqual(new Date(timestamp)),
      },
      relations: {
        author: { profile: true },
      },
      order: { createdAt: 'DESC' },
      take,
    });

    return messages.map((message) => ({
      id: message.id,
      content: message.content,
      conversationId: message.chatId,
      authorId: message.author.id,
      authorProfileId: message.author.profile.id,
      authorName: message.author.profile.displayName,
      createdAt: message.createdAt,
      authorAvatarUrl: message.author.profile.avatarUrl,
    }));
  }

  async updateLastReadAt(userId: string, chatId: string): Promise<void> {
    const userToChat = await this.userToChatRepository.findOne({
      where: {
        userId: userId,
        chatId: chatId,
      },
    });
    if (!userToChat) {
      throw new NotFoundException('Chat not found or access denied');
    }
    userToChat.lastReadAt = new Date();
    await this.userToChatRepository.save(userToChat);
  }

  async getLatestMessageForChat(
    chatId: string,
  ): Promise<ChatMessageDto | null> {
    const message = await this.chatMessageRepository.findOne({
      where: { chatId },
      relations: { author: { profile: true } },
      order: { createdAt: 'DESC' },
    });
    if (!message) return null;
    return {
      id: message.id,
      content: message.content,
      conversationId: message.chatId,
      authorId: message.author.id,
      authorProfileId: message.author.profile.id,
      authorName: message.author.profile.displayName,
      createdAt: message.createdAt,
      authorAvatarUrl: message.author.profile.avatarUrl,
    };
  }

  async getAllConversationsForUser(userId: string): Promise<ChatDto[]> {
    const userToConversations = await this.userToChatRepository.find({
      where: { user: { id: userId } },
      relations: {
        chat: {
          participants: {
            user: {
              profile: true,
            },
          },
          messages: true,
        },
      },
    });
    return userToConversations.map((utc) => {
      const participants = utc.chat.participants.map((p) => p.user.profile);
      // exclude the current user from the participants list
      const otherParticipants = participants.filter(
        (p) => p.ownerId !== userId,
      );
      const latestMessage = utc.chat.messages.reduce(
        (latest: ChatMessage, message) => {
          return !latest || message.createdAt > latest.createdAt
            ? message
            : latest;
        },
        null,
      );
      return {
        id: utc.chat.id,
        participants: otherParticipants,
        latestMessageContent: latestMessage ? latestMessage.content : null,
        latestMessageCreatedAt: latestMessage ? latestMessage.createdAt : null,
      };
    });
  }

  async createChat(userId: string, payload: CreateChatDto): Promise<ChatDto> {
    // ensure the creator is included in the participant list
    payload.participantIds.push(userId); // Ensure the creator is included as a participant
    const participants = await this.userRepository.find({
      where: { id: In(payload.participantIds) },
      relations: {
        profile: true,
      },
    });
    if (!participants || participants.length !== payload.participantIds.length)
      throw new NotFoundException('One or more participants not found');

    // Generate a hash of the participant IDs to check for existing conversations
    const hash = this.generateParticipantsHash(payload.participantIds);
    const existingConversation = await this.chatRepository.findOne({
      where: { participantsHash: hash },
      relations: {
        participants: {
          user: {
            profile: true,
          },
        },
      },
    });
    if (existingConversation) {
      const latestMessage = await this.getLatestMessageForChat(
        existingConversation.id,
      );
      // If a conversation with the same participants exists, return it
      return {
        id: existingConversation.id,
        participants: existingConversation.participants.map(
          (p) => p.user.profile,
        ),
        latestMessageContent: latestMessage ? latestMessage.content : null,
        latestMessageCreatedAt: latestMessage ? latestMessage.createdAt : null,
      };
    }

    // Create the conversation
    const conversation = this.chatRepository.create({
      participantsHash: participants.length == 2 ? hash : undefined,
    });
    await this.chatRepository.save(conversation);

    // Create UserToConversation entries for each participant
    const userToConversations = participants.map((user) =>
      this.userToChatRepository.create({
        user,
        chat: conversation,
        lastReadAt: new Date(0),
      }),
    );
    await this.userToChatRepository.save(userToConversations);

    // Cast to ChatDto for notification
    const chatDto: ChatDto = {
      id: conversation.id,
      participants: participants.map((p) => p.profile),
      latestMessageContent: null,
      latestMessageCreatedAt: null,
    };

    // Notify participants of the new conversation
    const recipientIds = participants.map((p) => p.id);
    this.notificationGateway.notifyNewConversation(recipientIds, chatDto);

    return chatDto;
  }

  private generateParticipantsHash(participantIds: string[]): string {
    const sortedIds = participantIds.sort();
    return createHash('sha256').update(sortedIds.join(':')).digest('hex');
  }
}
