import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Conversation } from '../entities/conversation.entity';
import { In, LessThan, MoreThan, Repository } from 'typeorm';
import { UserToConversation } from '../entities/userToConversation.entity';
import { User } from '../entities/user.entity';
import { CreateConversationDto } from './dtos/createConversation.dto';
import { ConversationMessage } from '../entities/conversationMessage.entity';
import { SendMessageDto } from './dtos/sendMessage.dto';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class ConversationService {
  constructor(
    @InjectRepository(Conversation)
    private readonly conversationRepository: Repository<Conversation>,
    @InjectRepository(UserToConversation)
    private readonly userToConversationRepository: Repository<UserToConversation>,
    @InjectRepository(User) private readonly userRepository: Repository<User>,
    @InjectRepository(ConversationMessage)
    private readonly conversationMessageRepository: Repository<ConversationMessage>,
    private readonly notificationGateway: NotificationsGateway,
  ) {}

  async sendMessage(
    conversationId: string,
    userId: string,
    payload: SendMessageDto,
  ): Promise<ConversationMessage> {
    // Verify user is part of the conversation
    const userToConversation = await this.userToConversationRepository.findOne({
      where: {
        user: { id: userId },
        conversation: { id: conversationId },
      },
    });
    if (!userToConversation) {
      throw new NotFoundException('Conversation not found or access denied');
    }

    // Create and save the message
    const message = this.conversationMessageRepository.create();
    message.content = payload.message;
    message.conversation = userToConversation.conversation;
    const author = await this.userRepository.findOne({ where: { id: userId } });
    if (!author) throw new NotFoundException('Author not found');
    message.author = author;
    return await this.conversationMessageRepository.save(message);
  }

  async getConversationMessages(
    userId: string,
    conversationId: string,
  ): Promise<ConversationMessage[]> {
    // get the UserToConversation entry to ensure the user has access to the conversation
    const userToConversation = await this.userToConversationRepository.findOne({
      where: {
        user: { id: userId },
        conversation: { id: conversationId },
      },
    });
    if (!userToConversation) {
      throw new NotFoundException('Conversation not found or access denied');
    }

    // Load all conversation messages newer than lastReadAt
    const lastReadAt = userToConversation.lastReadAt;
    const newMessages = await this.conversationMessageRepository.find({
      where: {
        createdAt: MoreThan(lastReadAt || new Date()),
        conversation: { id: conversationId },
      },
      order: { createdAt: 'ASC' },
    });

    // Load 30 messages before the lastReadAt for context
    const oldMessages = await this.conversationMessageRepository.find({
      where: {
        createdAt: LessThan(lastReadAt || new Date()),
        conversation: { id: conversationId },
      },
      order: { createdAt: 'ASC' },
      take: 30,
    });

    // Update lastReadAt to now
    userToConversation.lastReadAt = new Date();
    await this.userToConversationRepository.save(userToConversation);

    // Return combined messages, with new messages first
    return [...oldMessages, ...newMessages];
  }

  async getAllConversationsForUser(userId: string): Promise<Conversation[]> {
    const userToConversations = await this.userToConversationRepository.find({
      where: { user: { id: userId } },
      relations: {
        conversation: {
          participants: {
            user: {
              profile: true,
            },
          },
        },
      },
    });
    return userToConversations.map((utc) => {
      const conversation = utc.conversation;
      if (conversation.participants.length > 2) {
        // Group conversation - return as is
        return conversation;
      } else {
        // Direct message - set name to the other participant's display name
        const otherParticipant = conversation.participants.find(
          (p) => p.user.id !== userId,
        );
        if (otherParticipant) {
          conversation.name = otherParticipant.user.profile.displayName;
        }
        return conversation;
      }
    });
  }

  async createConversation(
    userId: string,
    payload: CreateConversationDto,
  ): Promise<Conversation> {
    payload.participantIds.push(userId); // Ensure the creator is included as a participant
    const participants = await this.userRepository.find({
      where: { id: In(payload.participantIds) },
    });
    if (!participants || participants.length !== payload.participantIds.length)
      throw new NotFoundException('One or more participants not found');

    // Create the conversation
    const conversation = this.conversationRepository.create({
      name: payload.name,
    });
    await this.conversationRepository.save(conversation);

    // Create UserToConversation entries for each participant
    const userToConversations = participants.map((user) =>
      this.userToConversationRepository.create({
        user,
        conversation,
        lastReadAt: new Date(),
      }),
    );
    await this.userToConversationRepository.save(userToConversations);

    // Notify participants of the new conversation
    const recipientIds = participants.map((p) => p.id);
    this.notificationGateway.notifyNewConversation(recipientIds, conversation);

    return conversation;
  }
}
