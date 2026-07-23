import { Module } from '@nestjs/common';
import { WorkerService } from './worker.service';
import { CallGateway } from './call.gateway';
import { RoomService } from './room.service';
import { TransportService } from './transport.service';
import { PeerService } from './peer.service';
import { ProducerService } from './producer.service';
import { ConsumerService } from './consumer.service';
import { AuthModule } from '../auth/auth.module';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [AuthModule, NotificationsModule],
  providers: [
    CallGateway,
    WorkerService,
    RoomService,
    PeerService,
    TransportService,
    ProducerService,
    ConsumerService,
  ],
})
export class CallModule {}
