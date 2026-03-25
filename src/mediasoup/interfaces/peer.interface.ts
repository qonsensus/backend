import { Consumer, Producer, WebRtcTransport } from 'mediasoup/types';

export interface Peer {
  socketId: string;
  transports: Map<string, WebRtcTransport>;
  producers: Map<string, Producer>;
  consumers: Map<string, Consumer>;
}
