import { Consumer, Producer, WebRtcTransport } from 'mediasoup/types';
import { Profile } from '../../entities/profile.entity';

export class PeerDto {
  socketId: string;
  userProfile: Profile;
  transports: Map<string, WebRtcTransport>;
  producers: Map<string, Producer>;
  consumers: Map<string, Consumer>;
}
