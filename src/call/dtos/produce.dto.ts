import { MediaKind, RtpParameters } from 'mediasoup/types';

export class ProduceDto {
  roomId: string;
  transportId: string;
  kind: MediaKind;
  rtpParameters: RtpParameters;
  appData: Record<string, any>;
}
