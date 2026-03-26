import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { Router, RtpCodecCapability, Worker } from 'mediasoup/types';
import * as mediasoup from 'mediasoup';

@Injectable()
export class MediasoupService implements OnModuleInit {
  private readonly logger = new Logger(MediasoupService.name);

  private workers: Worker[] = [];
  private workerIndex = 0;

  private readonly mediaCodecs: RtpCodecCapability[] = [
    {
      kind: 'audio',
      mimeType: 'audio/opus',
      clockRate: 48000,
      channels: 2,
      preferredPayloadType: 96,
    },
    {
      kind: 'video',
      mimeType: 'video/VP8',
      clockRate: 90000,
      preferredPayloadType: 100,
    },
    {
      kind: 'video',
      mimeType: 'video/H264',
      clockRate: 90000,
      preferredPayloadType: 101,
      parameters: {
        'packetization-mode': 1,
        'profile-level-id': '42e01f',
        'level-asymmetry-allowed': 1,
      },
    },
  ];

  async onModuleInit() {
    this.logger.log('Initializing MediasoupService...');
    await this.createWorkers();
    this.logger.log('MediasoupService loaded.');
  }

  private async createWorkers(): Promise<void> {
    // For simplicity: one worker. In production, spawn one per CPU core.
    const numWorkers = 1;

    for (let i = 0; i < numWorkers; i++) {
      const worker = await mediasoup.createWorker({
        logLevel: 'warn',
        logTags: ['rtp', 'srtp', 'rtcp'],
      });

      worker.on('died', (error) => {
        this.logger.error(`Worker ${worker.pid} died`, error);
        // In production: remove from pool and spawn a replacement
        process.exit(1);
      });

      this.workers.push(worker);
      this.logger.log(`Worker ${worker.pid} created`);
    }
  }

  private getNextWorker(): Worker {
    const worker = this.workers[this.workerIndex];
    this.workerIndex = (this.workerIndex + 1) % this.workers.length;
    return worker;
  }

  async createRouter(): Promise<Router> {
    const worker = this.getNextWorker();
    const router = await worker.createRouter({ mediaCodecs: this.mediaCodecs });
    this.logger.log(`Router ${router.id} created on worker ${worker.pid}`);
    return router;
  }
}
