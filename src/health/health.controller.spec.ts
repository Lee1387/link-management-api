import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { HealthResponse, HealthService } from './health.service';

describe('HealthController', () => {
  let healthController: HealthController;
  let healthService: { check: jest.Mock<Promise<HealthResponse>> };

  beforeEach(async () => {
    healthService = {
      check: jest.fn<Promise<HealthResponse>, []>(),
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

  it('should delegate health checks to the health service', async () => {
    const response: HealthResponse = {
      status: 'ok',
      checks: {
        database: 'up',
      },
    };
    healthService.check.mockResolvedValue(response);

    await expect(healthController.getHealth()).resolves.toEqual(response);
    expect(healthService.check).toHaveBeenCalledTimes(1);
  });
});
