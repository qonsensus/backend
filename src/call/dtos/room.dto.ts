import { Router } from 'mediasoup/types';
import { PeerDto } from './peer.dto';

export class RoomDto {
  id: string;
  router: Router;
  peers: Map<string, PeerDto>;
}
