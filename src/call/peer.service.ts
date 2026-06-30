import { Logger } from '@nestjs/common';
import { Room } from './interfaces/room.interface';
import { Peer } from './interfaces/peer.interface';

export class PeerService {
  logger = new Logger(PeerService.name);

  addPeer(room: Room, socketId: string): Peer {
    const peer: Peer = {
      socketId,
      transports: new Map(),
      producers: new Map(),
      consumers: new Map(),
    };
    room.peers.set(socketId, peer);
    this.logger.log(`Peer "${socketId}" joined room "${room.id}"`);
    return peer;
  }

  getPeer(room: Room, socketId: string): Peer | undefined {
    return room.peers.get(socketId);
  }

  // Returns all existing producers in a room, excluding the requesting peer.
  // Used to let a newly joined peer know who they can consume.
  getOtherProducers(
    room: Room,
    excludeSocketId: string,
  ): Array<{ producerId: string; socketId: string }> {
    const result: Array<{ producerId: string; socketId: string }> = [];

    for (const [socketId, peer] of room.peers) {
      if (socketId === excludeSocketId) continue;
      for (const producerId of peer.producers.keys()) {
        result.push({ producerId, socketId });
      }
    }

    return result;
  }
}
