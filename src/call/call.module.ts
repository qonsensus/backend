import { Module } from '@nestjs/common';
import { CallService } from './call.service';

@Module({
  providers: [CallService],
})
export class CallModule {}
