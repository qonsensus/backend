import { RtpCapabilities } from 'mediasoup/types';
import { Peer } from '../interfaces/peer.interface';

export class JoinRoomResponseWsDto {
  rtpCapabilities: RtpCapabilities;
  otherPeers: Omit<Peer, 'consumers' | 'transports'>[];
}
