import { DtlsParameters } from 'mediasoup/types';

export class ConnectTransportDto {
  roomId: string;
  transportId: string;
  dtlsParameters: DtlsParameters;
}
