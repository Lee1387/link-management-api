import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import {
  LivenessResponse,
  HealthService,
  ReadinessResponse,
} from './health.service';

describe('HealthController', () => {
  let healthController: HealthController;
  let healthService: {
    getLiveness: jest.Mock<LivenessResponse>;
    getReadiness: jest.Mock<Promise<ReadinessResponse>>;
  };

  beforeEach(async () => {
    healthService = {
      getLiveness: jest.fn<LivenessResponse, []>(),
      getReadiness: jest.fn<Promise<ReadinessResponse>, []>(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: healthService,
        },
      ],
    }).compile();

    healthController = module.get<HealthController>(HealthController);
  });

  it('should delegate liveness checks to the health service', () => {
    const response: LivenessResponse = {
      status: 'ok',
      checks: {
        application: 'up',
      },
    };
    healthService.getLiveness.mockReturnValue(response);

    expect(healthController.getLiveness()).toEqual(response);
    expect(healthService.getLiveness).toHaveBeenCalledTimes(1);
  });

  it('should delegate readiness checks to the health service', async () => {
    const response: ReadinessResponse = {
      status: 'ok',
      checks: {
        database: 'up',
      },
    };
    healthService.getReadiness.mockResolvedValue(response);

    await expect(healthController.getReadiness()).resolves.toEqual(response);
    expect(healthService.getReadiness).toHaveBeenCalledTimes(1);
  });
});
