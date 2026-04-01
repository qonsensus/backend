export class ChatMessageDto {
  id: string;
  content: string;
  chatId: string;
  authorId: string;
  authorProfileId: string;
  authorName: string;
  createdAt: Date;
  authorAvatarUrl?: string;
}
