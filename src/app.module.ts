import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Profile } from './entities/profile.entity';
import { Conversation } from './entities/conversation.entity';
import { ConversationMessage } from './entities/conversationMessage.entity';
import { Server } from './entities/server.entity';
import { UserToServer } from './entities/userToServer.entity';
import { ChatChannel } from './entities/chatChannel.entity';
import { UserToConversation } from './entities/userToConversation.entity';
import { ChatChannelMessage } from './entities/chatChannelMessage.entity';
import { UserToChatChannel } from './entities/userToChatChannel.entity';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { Friendship } from './entities/friendship.entity';
import { FriendsModule } from './friends/friends.module';
import { ProfileModule } from './profile/profile.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ConversationModule } from './conversation/conversation.module';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'user',
      password: 'secret',
      database: 'qonsensus',
      logging: true,
      entities: [
        User,
        Profile,
        Conversation,
        ConversationMessage,
        Server,
        UserToServer,
        ChatChannel,
        UserToConversation,
        ChatChannelMessage,
        UserToChatChannel,
        Friendship,
      ],
      synchronize: true,
    }),
    UserModule,
    AuthModule,
    FriendsModule,
    ProfileModule,
    NotificationsModule,
    ConversationModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
