import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthService } from './health.service';
import { LivenessResponseDto, ReadinessResponseDto } from './health.response';

describe('HealthController', () => {
  let healthController: HealthController;
  let healthService: {
    getLiveness: jest.Mock<LivenessResponseDto>;
    getReadiness: jest.Mock<Promise<ReadinessResponseDto>>;
  };

  beforeEach(async () => {
    healthService = {
      getLiveness: jest.fn<LivenessResponseDto, []>(),
      getReadiness: jest.fn<Promise<ReadinessResponseDto>, []>(),
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
    const response: LivenessResponseDto = {
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
    const response: ReadinessResponseDto = {
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
