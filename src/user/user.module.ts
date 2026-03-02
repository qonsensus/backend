import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Profile } from '../entities/profile.entity';
import { User } from '../entities/user.entity';
import { UserService } from './user.service';

@Module({
  imports: [TypeOrmModule.forFeature([User, Profile])],
  providers: [UserService],
})
export class UserModule {}
