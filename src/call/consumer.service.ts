import {
  MediaKind,
  Producer,
  RtpCapabilities,
  RtpParameters,
} from 'mediasoup/types';
import { Peer } from '../mediasoup/interfaces/peer.interface';
import { Room } from './interfaces/room.interface';

export class ConsumerService {
  getProducerById(room: Room, producerId: string): Producer | null {
    for (const peer of room.peers.values()) {
      const producer = peer.producers.get(producerId);
      if (producer) {
        return producer;
      }
    }
    return null;
  }

  async createConsumer(
    room: Room,
    consumerPeer: Peer,
    transportId: string,
    producerId: string,
    rtpCapabilities: RtpCapabilities,
  ): Promise<{
    consumerId: string;
    producerId: string;
    kind: MediaKind;
    rtpParameters: RtpParameters;
    appData?: Record<string, any>;
  }> {
    // Guard: can the consumer's browser decode this producer's codec?
    if (!room.router.canConsume({ producerId, rtpCapabilities })) {
      throw new Error(`Peer cannot consume producer ${producerId}`);
    }

    const transport = consumerPeer.transports.get(transportId);
    if (!transport) throw new Error(`Transport ${transportId} not found`);

    const producer = this.getProducerById(room, producerId);
    if (!producer) throw new Error(`Producer ${producerId} not found`);

    // Start paused — the client will call resumeConsumer when its <video> is ready
    const consumer = await transport.consume({
      producerId,
      rtpCapabilities,
      paused: true,
      appData: producer.appData,
    });

    consumer.on('transportclose', () => {
      consumer.close();
      consumerPeer.consumers.delete(consumer.id);
    });

    consumer.on('producerclose', () => {
      // The producer went away — tell the consumer peer to clean up its video element
      consumer.close();
      consumerPeer.consumers.delete(consumer.id);
    });

    consumerPeer.consumers.set(consumer.id, consumer);

    return {
      consumerId: consumer.id,
      producerId,
      kind: consumer.kind,
      rtpParameters: consumer.rtpParameters,
      appData: consumer.appData,
    };
  }

  async resumeConsumer(peer: Peer, consumerId: string): Promise<void> {
    const consumer = peer.consumers.get(consumerId);
    if (!consumer) throw new Error(`Consumer ${consumerId} not found`);
    await consumer.resume();
  }
}
