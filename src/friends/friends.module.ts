import { Module } from '@nestjs/common';
import { FriendsService } from './friends.service';
import { FriendsController } from './friends.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Friendship } from '../entities/friendship.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Friendship])],
  providers: [FriendsService],
  controllers: [FriendsController],
})
export class FriendsModule {}
