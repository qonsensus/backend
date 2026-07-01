import { Consumer, Producer, WebRtcTransport } from 'mediasoup/types';
import { Profile } from '../../entities/profile.entity';

export interface Peer {
  socketId: string;
  userProfile: Profile;
  transports: Map<string, WebRtcTransport>;
  producers: Map<string, Producer>;
  consumers: Map<string, Consumer>;
}
