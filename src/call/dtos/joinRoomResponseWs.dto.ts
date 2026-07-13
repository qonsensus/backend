import { RtpCapabilities } from 'mediasoup/types';
import { PeerDto } from './peer.dto';

export class JoinRoomResponseWsDto {
  rtpCapabilities: RtpCapabilities;
  otherPeers: Omit<PeerDto, 'consumers' | 'transports'>[];
}
