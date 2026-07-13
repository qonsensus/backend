import { WebRtcTransport } from 'mediasoup/types';
import { IceCredsDto } from './iceCreds.dto';

export class TransportOptionsDto {
  id: string;
  iceParameters: WebRtcTransport['iceParameters'];
  iceCandidates: WebRtcTransport['iceCandidates'];
  dtlsParameters: WebRtcTransport['dtlsParameters'];
  /** Pass these directly to the mediasoup-client Device / RTCPeerConnection */
  iceServers: IceCredsDto[] | null;
}
