import { DtlsParameters, IceCandidate, IceParameters } from 'mediasoup/types';
import { IceServerCredential } from './ice-server-credential.interface';

export interface TransportOptions {
  id: string;
  iceParameters: IceParameters;
  iceCandidates: IceCandidate[];
  dtlsParameters: DtlsParameters;
  iceServers: IceServerCredential[];
}
