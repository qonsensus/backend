import { MediaKind, RtpParameters } from 'mediasoup/types';
import { Injectable, Logger } from '@nestjs/common';
import { PeerDto } from './dtos/peer.dto';

@Injectable()
export class ProducerService {
  logger = new Logger(ProducerService.name);

  async createProducer(
    peer: PeerDto,
    transportId: string,
    kind: MediaKind,
    rtpParameters: RtpParameters,
    appData: Record<string, any>,
  ): Promise<string> {
    const transport = peer.transports.get(transportId);
    if (!transport) throw new Error(`Transport ${transportId} not found`);

    const producer = await transport.produce({ kind, rtpParameters, appData });

    producer.on('transportclose', () => {
      this.logger.log(`Producer ${producer.id} transport closed`);
      producer.close();
      peer.producers.delete(producer.id);
    });

    peer.producers.set(producer.id, producer);
    this.logger.log(`Producer ${producer.id} (${kind}) created`);
    return producer.id;
  }

  closeProducer(peer: PeerDto, producerId: string): void {
    const producer = peer.producers.get(producerId);
    if (!producer) throw new Error(`Producer ${producerId} not found`);

    producer.close();
    peer.producers.delete(producerId);
    this.logger.log(`Producer ${producerId} closed by peer "${peer.socketId}"`);
  }
}
