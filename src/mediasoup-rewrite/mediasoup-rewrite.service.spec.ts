import { Test, TestingModule } from '@nestjs/testing';
import { MediasoupRewriteService } from './mediasoup-rewrite.service';

describe('MediasoupRewriteService', () => {
  let service: MediasoupRewriteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [MediasoupRewriteService],
    }).compile();

    service = module.get<MediasoupRewriteService>(MediasoupRewriteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
