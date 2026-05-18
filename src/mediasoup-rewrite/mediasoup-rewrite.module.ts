import { Module } from '@nestjs/common';
import { MediasoupRewriteService } from './mediasoup-rewrite.service';

@Module({
  providers: [MediasoupRewriteService]
})
export class MediasoupRewriteModule {}
