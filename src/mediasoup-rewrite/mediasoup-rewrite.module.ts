import { Module } from '@nestjs/common';
import { MediasoupRewriteService } from './mediasoup-rewrite.service';
import { MediasoupRewriteGateway } from './mediasoup-rewrite.gateway';

@Module({
  providers: [MediasoupRewriteService, MediasoupRewriteGateway]
})
export class MediasoupRewriteModule {}
