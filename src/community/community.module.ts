import { Module } from '@nestjs/common';
import { CommunityService } from './community.service';
import { CommunityController } from './community.controller';
import { User } from '../entities/user.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Community } from '../entities/community.entity';
import { AuthModule } from '../auth/auth.module';
import { UserToCommunity } from '../entities/userToCommunity.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Community, UserToCommunity]),
    AuthModule,
  ],
  controllers: [CommunityController],
  providers: [CommunityService],
})
export class CommunityModule {}
