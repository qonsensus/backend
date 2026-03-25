import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { FriendsModule } from './friends/friends.module';
import { ProfileModule } from './profile/profile.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ConversationModule } from './conversation/conversation.module';
import { dataSourceOptions } from './database/data-source';
import { MediasoupModule } from './mediasoup/mediasoup.module';

@Module({
  imports: [
    TypeOrmModule.forRoot(dataSourceOptions),
    UserModule,
    AuthModule,
    FriendsModule,
    ProfileModule,
    NotificationsModule,
    ConversationModule,
    MediasoupModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
