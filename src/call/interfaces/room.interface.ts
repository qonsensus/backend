import { Router } from 'mediasoup/types';
import { Peer } from './peer.interface';

export interface Room {
  id: string;
  router: Router;
  peers: Map<string, Peer>;
}
