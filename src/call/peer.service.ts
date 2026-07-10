import { Logger } from '@nestjs/common';
import { Room } from './interfaces/room.interface';
import { Peer } from './interfaces/peer.interface';
import { Profile } from '../entities/profile.entity';

export class PeerService {
  logger = new Logger(PeerService.name);

  addPeer(room: Room, socketId: string, userProfile: Profile): Peer {
    const peer: Peer = {
      socketId,
      userProfile,
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

  getOtherPeers(
    room: Room,
    excludeSocketId: string,
  ): Array<Omit<Peer, 'consumers' | 'transports'>> {
    const result: Array<Omit<Peer, 'consumers' | 'transports'>> = [];

    for (const [socketId, peer] of room.peers) {
      if (socketId === excludeSocketId) continue;
      result.push({
        producers: peer.producers,
        socketId: peer.socketId,
        userProfile: peer.userProfile,
      });
    }

    return result;
  }
}
