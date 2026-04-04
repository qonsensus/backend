import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Chat } from '../entities/chat.entity';
import { In, LessThanOrEqual, MoreThan, Repository } from 'typeorm';
import { UserToChat } from '../entities/userToChat.entity';
import { User } from '../entities/user.entity';
import { CreateChatDto } from './dtos/createChat.dto';
import { ChatMessage } from '../entities/chatMessage.entity';
import { SendMessageWsDto } from './dtos/sendMessage.ws.dto';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { ChatDto } from './dtos/chat.dto';
import { createHash } from 'node:crypto';
import { ChatMessageDto } from './dtos/chatMessage.dto';
import { Profile } from '../entities/profile.entity';

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

  async getUnseenMessagesCount(
    userId: string,
    chatId: string,
  ): Promise<number> {
    const userToChat = await this.userToChatRepository.findOne({
      where: {
        userId: userId,
        chatId: chatId,
      },
    });
    if (!userToChat) {
      throw new NotFoundException('Chat not found or access denied');
    }
    return this.chatMessageRepository.count({
      where: {
        chatId: chatId,
        createdAt: MoreThan(userToChat.lastReadAt || new Date(0)),
      },
    });
  }

  async getParticipantsForChat(chatId: string): Promise<Profile[]> {
    const userToChatEntries = await this.userToChatRepository.find({
      where: { chatId },
      relations: { user: { profile: true } },
    });
    return userToChatEntries.map((entry) => entry.user.profile);
  }

  async sendMessage(
    userId: string,
    payload: SendMessageWsDto,
  ): Promise<ChatMessageDto> {
    // Verify user is part of the conversation
    const userToChat = await this.userToChatRepository.findOne({
      where: {
        userId: userId,
        chatId: payload.chatId,
      },
    });
    if (!userToChat) {
      throw new NotFoundException('Chat not found or access denied');
    }

    // Create and save the message
    const message = this.chatMessageRepository.create();
    message.content = payload.message;
    message.chatId = payload.chatId;
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
      chatId: message.chatId,
      authorId: author.id,
      authorProfileId: author.profile.id,
      authorName: author.profile.displayName,
      createdAt: message.createdAt,
      authorAvatarUrl: author.profile.avatarUrl,
    };

    // get all participants in the conversation to notify them of the new message
    const participants = await this.userToChatRepository.find({
      where: {
        chatId: payload.chatId,
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
    take = 100,
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
      chatId: message.chatId,
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
      chatId: message.chatId,
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
      const unseenMessagesCount = utc.chat.messages.filter(
        (message) => message.createdAt > utc.lastReadAt,
      ).length;
      return {
        id: utc.chat.id,
        participants: otherParticipants,
        latestMessageContent: latestMessage ? latestMessage.content : null,
        latestMessageCreatedAt: latestMessage ? latestMessage.createdAt : null,
        unseenMessagesCount,
        lastReadAt: utc.lastReadAt,
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
    const existingChat = await this.chatRepository.findOne({
      where: { participantsHash: hash },
      relations: {
        participants: {
          user: {
            profile: true,
          },
        },
      },
    });
    // If a conversation with the same participants already exists, return it instead of creating a new one
    if (existingChat) {
      return this.getChatById(userId, existingChat.id);
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
      unseenMessagesCount: 0,
      lastReadAt: new Date(0),
    };

    // Notify participants of the new conversation
    const recipientIds = participants.map((p) => p.id);
    this.notificationGateway.notifyNewConversation(recipientIds, chatDto);

    return chatDto;
  }

  async getChatById(userId: string, chatId: string): Promise<ChatDto> {
    const chat = await this.chatRepository.findOne({
      where: { id: chatId },
      relations: {
        participants: {
          user: {
            profile: true,
          },
        },
        messages: true,
      },
    });
    if (!chat) throw new NotFoundException('Chat not found');
    const lastReadAt = (
      await this.userToChatRepository.findOne({
        where: {
          userId: userId,
          chatId: chatId,
        },
      })
    )?.lastReadAt;
    if (!lastReadAt) throw new NotFoundException('Chat not found');
    const unseenMessagesCount = await this.getUnseenMessagesCount(
      userId,
      chatId,
    );
    const latestMessage = await this.getLatestMessageForChat(chatId);
    return {
      id: chat.id,
      participants: chat.participants.map((p) => p.user.profile),
      latestMessageContent: latestMessage ? latestMessage.content : null,
      latestMessageCreatedAt: latestMessage ? latestMessage.createdAt : null,
      unseenMessagesCount,
      lastReadAt,
    };
  }

  private generateParticipantsHash(participantIds: string[]): string {
    const sortedIds = participantIds.sort();
    return createHash('sha256').update(sortedIds.join(':')).digest('hex');
  }
}
