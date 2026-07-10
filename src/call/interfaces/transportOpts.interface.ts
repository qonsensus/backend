import { WebRtcTransport } from 'mediasoup/types';
import { IceCreds } from './iceCreds.interface';

export interface TransportOptions {
  id: string;
  iceParameters: WebRtcTransport['iceParameters'];
  iceCandidates: WebRtcTransport['iceCandidates'];
  dtlsParameters: WebRtcTransport['dtlsParameters'];
  /** Pass these directly to the mediasoup-client Device / RTCPeerConnection */
  iceServers: IceCreds[] | null;
}
