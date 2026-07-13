import { RtpCapabilities } from 'mediasoup/types';
import { OtherPeerDto } from './peer.dto';

export class JoinRoomResponseWsDto {
  rtpCapabilities: RtpCapabilities;
  otherPeers: OtherPeerDto[];
}
