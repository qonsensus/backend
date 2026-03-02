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

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'user',
      password: 'secret',
      database: 'qonsensus',
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
      ],
      synchronize: true,
    }),
    UserModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
