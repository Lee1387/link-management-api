import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import appConfig from '../config/app.config';
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

    const moduleBuilder = Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: healthService,
        },
        {
          provide: appConfig.KEY,
          useValue: {
            nodeEnv: 'test',
          },
        },
      ],
    });

    const module: TestingModule = await moduleBuilder.compile();

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

  it('should return not found when readiness exposure is disabled', async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [
        {
          provide: HealthService,
          useValue: healthService,
        },
        {
          provide: appConfig.KEY,
          useValue: {
            nodeEnv: 'production',
          },
        },
      ],
    }).compile();

    healthController = module.get<HealthController>(HealthController);

    try {
      void healthController.getReadiness();
      throw new Error('Expected readiness check to throw when disabled.');
    } catch (error) {
      expect(error).toBeInstanceOf(NotFoundException);
      expect((error as NotFoundException).getStatus()).toBe(404);
    }
    expect(healthService.getReadiness).not.toHaveBeenCalled();
  });
});
