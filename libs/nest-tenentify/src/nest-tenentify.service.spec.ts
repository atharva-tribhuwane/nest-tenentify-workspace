import { Test, TestingModule } from '@nestjs/testing';
import { NestTenentifyService } from './nest-tenentify.service';

describe('NestTenentifyService', () => {
  let service: NestTenentifyService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NestTenentifyService],
    }).compile();

    service = module.get<NestTenentifyService>(NestTenentifyService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
