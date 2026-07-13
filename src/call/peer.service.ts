import { Logger } from '@nestjs/common';
import { RoomDto } from './dtos/room.dto';
import { Profile } from '../entities/profile.entity';
import { PeerDto } from './dtos/peer.dto';

export class PeerService {
  logger = new Logger(PeerService.name);

  addPeer(room: RoomDto, socketId: string, userProfile: Profile): PeerDto {
    const peer: PeerDto = {
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

  getPeer(room: RoomDto, socketId: string): PeerDto | undefined {
    return room.peers.get(socketId);
  }

  getOtherPeers(
    room: RoomDto,
    excludeSocketId: string,
  ): Array<Omit<PeerDto, 'consumers' | 'transports'>> {
    const result: Array<Omit<PeerDto, 'consumers' | 'transports'>> = [];

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
