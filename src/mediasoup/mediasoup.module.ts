import { Module } from '@nestjs/common';
import { MediasoupService } from './mediasoup.service';
import { RoomService } from './room.service';
import { MediasoupGateway } from './mediasoup.gateway';

@Module({
  providers: [MediasoupService, RoomService, MediasoupGateway],
})
export class MediasoupModule {}
