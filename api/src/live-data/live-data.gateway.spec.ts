import { Test, TestingModule } from '@nestjs/testing';
import { LiveDataGateway } from './live-data.gateway';

describe('LiveDataGateway', () => {
  let gateway: LiveDataGateway;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [LiveDataGateway],
    }).compile();

    gateway = module.get<LiveDataGateway>(LiveDataGateway);
  });

  it('should be defined', () => {
    expect(gateway).toBeDefined();
  });
});
