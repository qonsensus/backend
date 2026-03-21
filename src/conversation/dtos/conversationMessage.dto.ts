export class ConversationMessageDto {
  id: string;
  content: string;
  conversationId: string;
  authorId: string;
  authorProfileId: string;
  authorName: string;
  createdAt: Date;
  authorAvatarUrl?: string;
}
