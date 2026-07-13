import { Injectable, Logger } from '@nestjs/common';
import { RoomDto } from './dtos/room.dto';
import { Profile } from '../entities/profile.entity';
import { OtherPeerDto, PeerDto } from './dtos/peer.dto';

@Injectable()
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

  getOtherPeers(room: RoomDto, excludeSocketId: string): OtherPeerDto[] {
    const result: OtherPeerDto[] = [];

    for (const [socketId, peer] of room.peers) {
      if (socketId === excludeSocketId) continue;
      console.log(peer.producers);
      const producerIds: string[] = [];
      for (const producerId of peer.producers.keys()) {
        producerIds.push(producerId);
      }
      result.push({
        producers: producerIds,
        socketId: peer.socketId,
        userProfile: peer.userProfile,
      });
    }

    return result;
  }
}
