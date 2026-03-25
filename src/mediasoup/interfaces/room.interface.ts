import { Router } from 'mediasoup/types';
import { Peer } from './peer.interface';

export interface Room {
  roomId: string;
  router: Router;
  peers: Map<string, Peer>;
}
