import { Injectable, Logger } from '@nestjs/common';
import {
  Router,
  RouterRtpCapabilities,
  RouterRtpCodecCapability,
  Worker,
} from 'mediasoup/types';
import * as mediasoup from 'mediasoup';

@Injectable()
export class WorkerService {
  private logger = new Logger(WorkerService.name);
  private workers: Worker[] = [];
  private workerIndex = 0;

  /**
   * Get the RTP Capabilities.
   */
  getRtpCapabilities(): RouterRtpCapabilities {
    const voiceCodecs: RouterRtpCodecCapability[] = [
      {
        kind: 'audio',
        mimeType: 'audio/opus',
        clockRate: 48000,
        channels: 2,
        rtcpFeedback: [{ type: 'nack' }, { type: 'transport-cc' }],
      },
    ];
    const videoCodecs: RouterRtpCodecCapability[] = [
      {
        kind: 'video',
        mimeType: 'video/VP9',
        clockRate: 90000,
        rtcpFeedback: [
          { type: 'nack' },
          { type: 'nack', parameter: 'pli' },
          { type: 'ccm', parameter: 'fir' },
          { type: 'goog-remb' },
          { type: 'transport-cc' },
        ],
      },
      {
        kind: 'video',
        mimeType: 'video/VP8',
        clockRate: 90000,
        rtcpFeedback: [
          { type: 'nack' },
          { type: 'nack', parameter: 'pli' },
          { type: 'ccm', parameter: 'fir' },
          { type: 'goog-remb' },
          { type: 'transport-cc' },
        ],
      },
    ];
    return {
      codecs: [...voiceCodecs, ...videoCodecs],
    };
  }

  private async createWorkers(): Promise<void> {
    // TODO: let config control this
    const numWorkers = 1;

    for (let i = 0; i < numWorkers; i++) {
      const worker = await mediasoup.createWorker({
        logLevel: 'warn',
        logTags: ['rtp', 'srtp', 'rtcp'],
      });

      worker.on('died', (error) => {
        this.logger.error(`Worker ${worker.pid} died`, error);
        // TODO: remove from pool and spawn a replacement
        process.exit(1);
      });

      this.workers.push(worker);
      this.logger.log(`Worker ${worker.pid} created`);
    }
  }

  private async getNextWorker(): Promise<Worker> {
    if (this.workers.length === 0) {
      await this.createWorkers();
    }
    const worker = this.workers[this.workerIndex];
    this.workerIndex = (this.workerIndex + 1) % this.workers.length;
    return worker;
  }

  async createRouter(): Promise<Router> {
    const worker = await this.getNextWorker();
    const router = await worker.createRouter({
      mediaCodecs: this.getRtpCapabilities().codecs,
    });
    this.logger.log(`Router ${router.id} created on worker ${worker.pid}`);
    return router;
  }
}
