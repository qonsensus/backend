import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Chat } from '../entities/chat.entity';
import { In, LessThanOrEqual, MoreThan, Repository } from 'typeorm';
import { UserToChat } from '../entities/userToChat.entity';
import { User } from '../entities/user.entity';
import { CreateConversationDto } from './dtos/createConversation.dto';
import { ChatMessage } from '../entities/chatMessage.entity';
import { SendMessageDto } from './dtos/sendMessage.dto';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { ConversationDto } from './dtos/conversation.dto';
import { createHash } from 'node:crypto';
import { ConversationMessageDto } from './dtos/conversationMessage.dto';

@Injectable()
export class ConversationService {
  constructor(
    @InjectRepository(Chat)
    private readonly conversationRepository: Repository<Chat>,
    @InjectRepository(UserToChat)
    private readonly userToConversationRepository: Repository<UserToChat>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(ChatMessage)
    private readonly conversationMessageRepository: Repository<ChatMessage>,
    private readonly notificationGateway: NotificationsGateway,
  ) {}

  async sendMessage(
    conversationId: string,
    userId: string,
    payload: SendMessageDto,
  ): Promise<ConversationMessageDto> {
    // Verify user is part of the conversation
    const userToConversation = await this.userToConversationRepository.findOne({
      where: {
        userId: userId,
        chatId: conversationId,
      },
    });
    if (!userToConversation) {
      throw new NotFoundException('Conversation not found or access denied');
    }

    // Create and save the message
    const message = this.conversationMessageRepository.create();
    message.content = payload.message;
    message.conversationId = conversationId;
    const author = await this.userRepository.findOne({
      where: { id: userId },
      relations: { profile: true },
    });
    if (!author) throw new NotFoundException('Author not found');
    message.author = author;
    await this.conversationMessageRepository.save(message);

    // Cast to ConversationMessageDto for notification
    const messageDto: ConversationMessageDto = {
      id: message.id,
      content: message.content,
      conversationId: message.conversationId,
      authorId: author.id,
      authorProfileId: author.profile.id,
      authorName: author.profile.displayName,
      createdAt: message.createdAt,
      authorAvatarUrl: author.profile.avatarUrl,
    };

    // get all participants in the conversation to notify them of the new message
    const participants = await this.userToConversationRepository.find({
      where: {
        chatId: conversationId,
      },
      relations: {
        user: true,
      },
    });
    const recipientIds = participants.map((p) => p.user.id);
    this.notificationGateway.notifyNewMessage(recipientIds, messageDto);

    return messageDto;
  }

  async getConversationMessages(
    userId: string,
    conversationId: string,
  ): Promise<ConversationMessageDto[]> {
    // get the UserToConversation entry to ensure the user has access to the conversation
    const userToConversation = await this.userToConversationRepository.findOne({
      where: {
        userId: userId,
        chatId: conversationId,
      },
    });
    if (!userToConversation) {
      throw new NotFoundException('Conversation not found or access denied');
    }

    // Load all conversation messages newer than lastReadAt
    const lastReadAt = new Date(userToConversation.lastReadAt);

    const newMessages = await this.conversationMessageRepository.find({
      where: {
        conversationId,
        createdAt: MoreThan(lastReadAt),
      },
      relations: {
        author: { profile: true },
      },
    });
    const oldMessages = await this.conversationMessageRepository.find({
      where: {
        conversationId,
        createdAt: LessThanOrEqual(lastReadAt),
      },
      order: {
        createdAt: 'DESC',
      },
      relations: {
        author: { profile: true },
      },
      take: 50,
    });

    // Update lastReadAt to now
    userToConversation.lastReadAt = new Date();
    await this.userToConversationRepository.save(userToConversation);

    // Return combined messages, with new messages first
    const fullMessageList = [...oldMessages.reverse(), ...newMessages];
    return fullMessageList.map((message) => ({
      id: message.id,
      content: message.content,
      conversationId: message.conversationId,
      authorId: message.author.id,
      authorProfileId: message.author.profile.id,
      authorName: message.author.profile.displayName,
      createdAt: message.createdAt,
      authorAvatarUrl: message.author.profile.avatarUrl,
    }));
  }

  async getAllConversationsForUser(userId: string): Promise<ConversationDto[]> {
    const userToConversations = await this.userToConversationRepository.find({
      where: { user: { id: userId } },
      relations: {
        chat: {
          participants: {
            user: {
              profile: true,
            },
          },
        },
      },
    });
    return userToConversations.map((utc) => {
      const participants = utc.chat.participants.map((p) => p.user.profile);
      // exclude the current user from the participants list
      const otherParticipants = participants.filter(
        (p) => p.ownerId !== userId,
      );
      return {
        id: utc.chat.id,
        participants: otherParticipants,
      };
    });
  }

  async createConversation(
    userId: string,
    payload: CreateConversationDto,
  ): Promise<ConversationDto> {
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
    const existingConversation = await this.conversationRepository.findOne({
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
      // If a conversation with the same participants exists, return it
      return {
        id: existingConversation.id,
        participants: existingConversation.participants.map(
          (p) => p.user.profile,
        ),
      };
    }

    // Create the conversation
    const conversation = this.conversationRepository.create({
      participantsHash: participants.length == 2 ? hash : undefined,
    });
    await this.conversationRepository.save(conversation);

    // Create UserToConversation entries for each participant
    const userToConversations = participants.map((user) =>
      this.userToConversationRepository.create({
        user,
        chat: conversation,
        lastReadAt: new Date(0),
      }),
    );
    await this.userToConversationRepository.save(userToConversations);

    // Cast to ConversationDto for notification
    const conversationDto: ConversationDto = {
      id: conversation.id,
      participants: participants.map((p) => p.profile),
    };

    // Notify participants of the new conversation
    const recipientIds = participants.map((p) => p.id);
    this.notificationGateway.notifyNewConversation(
      recipientIds,
      conversationDto,
    );

    return conversationDto;
  }

  private generateParticipantsHash(participantIds: string[]): string {
    const sortedIds = participantIds.sort();
    return createHash('sha256').update(sortedIds.join(':')).digest('hex');
  }
}
