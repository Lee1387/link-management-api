import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { HealthService } from './health.service';

describe('HealthService', () => {
  let healthService: HealthService;
  let prismaService: { $queryRaw: jest.Mock<Promise<unknown>> };

  beforeEach(async () => {
    prismaService = {
      $queryRaw: jest.fn<Promise<unknown>, [TemplateStringsArray]>(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        HealthService,
        {
          provide: PrismaService,
          useValue: prismaService,
        },
      ],
    }).compile();

    healthService = module.get<HealthService>(HealthService);
  });

  it('should report healthy when the database query succeeds', async () => {
    prismaService.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);

    await expect(healthService.check()).resolves.toEqual({
      status: 'ok',
      checks: {
        database: 'up',
      },
    });
    expect(prismaService.$queryRaw).toHaveBeenCalledTimes(1);
  });

  it('should report unhealthy when the database query fails', async () => {
    prismaService.$queryRaw.mockRejectedValue(
      new Error('database unavailable'),
    );

    expect.assertions(3);

    try {
      await healthService.check();
    } catch (exception: unknown) {
      expect(exception).toBeInstanceOf(ServiceUnavailableException);

      if (!(exception instanceof ServiceUnavailableException)) {
        throw exception;
      }

      expect(exception.getStatus()).toBe(503);
      expect(exception.getResponse()).toEqual({
        status: 'error',
        checks: {
          database: 'down',
        },
      });
    }
  });
});
