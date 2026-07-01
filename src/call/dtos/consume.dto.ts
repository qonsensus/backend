import { RtpCapabilities } from 'mediasoup/types';

export class ConsumeDto {
  roomId: string;
  transportId: string;
  producerId: string;
  rtpCapabilities: RtpCapabilities;
}
