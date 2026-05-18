import { Test, TestingModule } from '@nestjs/testing';
import { MediasoupRewriteGateway } from './mediasoup-rewrite.gateway';

describe('MediasoupRewriteGateway', () => {
  let gateway: MediasoupRewriteGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MediasoupRewriteGateway],
    }).compile();

    gateway = module.get<MediasoupRewriteGateway>(MediasoupRewriteGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
