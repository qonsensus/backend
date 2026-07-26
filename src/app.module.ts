import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { FriendsModule } from './friends/friends.module';
import { ProfileModule } from './profile/profile.module';
import { NotificationsModule } from './notifications/notifications.module';
import { ChatModule } from './chat/chat.module';
import { dataSourceOptions } from './database/data-source';
import { ConfigModule } from '@nestjs/config';
import { CallModule } from './call/call.module';
import { ServerModule } from './server/server.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot(dataSourceOptions),
    UserModule,
    AuthModule,
    FriendsModule,
    ProfileModule,
    NotificationsModule,
    ChatModule,
    CallModule,
    ServerModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
