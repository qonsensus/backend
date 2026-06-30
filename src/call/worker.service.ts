import { Injectable, Logger } from '@nestjs/common';
import {
  Router,
  RtpCapabilities,
  RtpCodecCapability,
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
  getRtpCapabilities(): RtpCapabilities {
    const voiceCodecs: RtpCodecCapability[] = [
      {
        kind: 'audio',
        mimeType: 'audio/opus',
        preferredPayloadType: 0,
        clockRate: 48000,
        channels: 2,
        rtcpFeedback: [{ type: 'nack' }, { type: 'transport-cc' }],
      },
    ];
    const videoCodecs: RtpCodecCapability[] = [
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
        preferredPayloadType: 0,
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
        preferredPayloadType: 0,
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

  private getNextWorker(): Worker {
    const worker = this.workers[this.workerIndex];
    this.workerIndex = (this.workerIndex + 1) % this.workers.length;
    return worker;
  }

  async createRouter(): Promise<Router> {
    const worker = this.getNextWorker();
    const router = await worker.createRouter({
      mediaCodecs: this.getRtpCapabilities().codecs,
    });
    this.logger.log(`Router ${router.id} created on worker ${worker.pid}`);
    return router;
  }
}
