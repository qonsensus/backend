import { createHmac } from 'node:crypto';
import { DtlsParameters } from 'mediasoup/types';
import { ConfigService } from '@nestjs/config';
import dns from 'dns/promises';
import { Injectable, Logger } from '@nestjs/common';
import { RoomDto } from './dtos/room.dto';
import { TransportOptionsDto } from './dtos/transportOpts.dto';
import { IceCredsDto } from './dtos/iceCreds.dto';
import { PeerDto } from './dtos/peer.dto';

@Injectable()
export class TransportService {
  logger = new Logger(TransportService.name);

  constructor(private readonly configService: ConfigService) {}

  private async resolveAnnouncedIp(): Promise<string> {
    // For local development just return 127.0.0.1
    if (process.env.NODE_ENV !== 'production') {
      return '127.0.0.1';
    }

    // Resolve IP from the domain name
    const domain = process.env.ANNOUNCED_DOMAIN ?? 'yourdomain.com';
    const { address } = await dns.lookup(domain);
    return address;
  }

  async createWebRtcTransport(
    room: RoomDto,
    peer: PeerDto,
  ): Promise<TransportOptionsDto> {
    // Re-resolve the domain every time so a dynamic IP is always fresh.
    const announcedIp = await this.resolveAnnouncedIp();

    // Build TURN credentials for the CLIENT — mediasoup itself does NOT use
    // iceServers; only the browser's RTCPeerConnection does.
    const iceServers: IceCredsDto[] = [];

    if (this.configService.get<string>('NODE_ENV') === 'production') {
      const turnDomain = this.configService.getOrThrow<string>('TURN_HOST');
      const turnPort = this.configService.getOrThrow<number>('TURN_PORT');
      const turnSecret = this.configService.getOrThrow<string>('TURN_SECRET');

      // Time-limited credential via the TURN shared-secret method (RFC 8489 §9.2)
      const turnUsername = `${Math.floor(Date.now() / 1000) + 3600}`; // valid for 1 hour
      const turnCredential = createHmac('sha1', turnSecret)
        .update(turnUsername)
        .digest('base64');

      iceServers.push({
        urls: `turn:${turnDomain}:${turnPort}`,
        username: turnUsername,
        credential: turnCredential,
      });
    }

    const transport = await room.router.createWebRtcTransport({
      listenInfos: [
        {
          protocol: 'udp',
          ip: '0.0.0.0',
          announcedAddress: announcedIp,
          portRange: {
            min: this.configService.getOrThrow<number>('MEDIASOUP_MIN'),
            max: this.configService.getOrThrow<number>('MEDIASOUP_MAX'),
          },
        },
        {
          protocol: 'tcp',
          ip: '0.0.0.0',
          announcedAddress: announcedIp,
          portRange: {
            min: this.configService.getOrThrow<number>('MEDIASOUP_MIN'),
            max: this.configService.getOrThrow<number>('MEDIASOUP_MAX'),
          },
        },
      ],
      enableUdp: true,
      enableTcp: true,
      preferUdp: true,
    });

    transport.on('dtlsstatechange', (state) => {
      if (state === 'failed' || state === 'closed') {
        this.logger.warn(`Transport ${transport.id} DTLS state: ${state}`);
        transport.close();
      }
    });

    peer.transports.set(transport.id, transport);

    return {
      id: transport.id,
      iceParameters: transport.iceParameters,
      iceCandidates: transport.iceCandidates,
      dtlsParameters: transport.dtlsParameters,
      iceServers: iceServers.length > 0 ? iceServers : null, // forwarded to the client for its RTCPeerConnection
    };
  }

  async connectTransport(
    peer: PeerDto,
    transportId: string,
    dtlsParameters: DtlsParameters,
  ): Promise<void> {
    const transport = peer.transports.get(transportId);
    if (!transport) throw new Error(`Transport ${transportId} not found`);
    await transport.connect({ dtlsParameters });
  }
}
