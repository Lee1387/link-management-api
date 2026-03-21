import { type NestFastifyApplication } from '@nestjs/platform-fastify';
import { PrismaService } from './../../src/prisma/prisma.service';
import { createTestApp } from './../support/create-test-app';
import {
  applyTestEnvironment,
  captureTestEnvironment,
  restoreTestEnvironment,
} from './../support/test-environment';
import environmentConfig, {
  type EnvironmentConfig,
} from './../../src/config/validated-environment';

type QueryRawMock = jest.Mock<
  Promise<unknown>,
  [TemplateStringsArray, ...unknown[]]
>;

type PrismaQueryExecutor = {
  $queryRaw: QueryRawMock;
};

describe('Health (e2e)', () => {
  const environmentSnapshot = captureTestEnvironment();
  let app: NestFastifyApplication | null = null;

  beforeAll(() => {
    applyTestEnvironment();
  });

  afterEach(async () => {
    await app?.close();
    app = null;
  });

  afterAll(() => {
    restoreTestEnvironment(environmentSnapshot);
  });

  async function createApp(
    prismaService: PrismaQueryExecutor,
    configOverrides: Partial<EnvironmentConfig> = {},
  ): Promise<NestFastifyApplication> {
    return createTestApp({
      configureBuilder: (builder) =>
        builder
          .overrideProvider(PrismaService)
          .useValue(prismaService)
          .overrideProvider(environmentConfig.KEY)
          .useValue({
            DATABASE_URL: process.env.DATABASE_URL as string,
            FRONTEND_ORIGIN: undefined,
            JWT_SECRET: 'test-jwt-secret-that-is-long-enough-for-validation',
            JWT_EXPIRES_IN: '15m',
            NODE_ENV: 'test',
            PORT: 3000,
            ...configOverrides,
          } satisfies EnvironmentConfig),
    });
  }

  it('/health (GET) should report alive without querying Postgres', async () => {
    const prismaService = {
      $queryRaw: jest.fn<
        Promise<unknown>,
        [TemplateStringsArray, ...unknown[]]
      >(),
    };
    app = await createApp(prismaService);

    const response = await app.inject({
      method: 'GET',
      url: '/health',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: 'ok',
      checks: {
        application: 'up',
      },
    });
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(prismaService.$queryRaw).not.toHaveBeenCalled();
  });

  it('/health/ready (GET) should report ready when Postgres is reachable', async () => {
    const queryRaw = jest
      .fn<Promise<unknown>, [TemplateStringsArray, ...unknown[]]>()
      .mockResolvedValue([{ '?column?': 1 }]);

    app = await createApp({
      $queryRaw: queryRaw,
    });

    const response = await app.inject({
      method: 'GET',
      url: '/health/ready',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      status: 'ok',
      checks: {
        database: 'up',
      },
    });
  });

  it('/health/ready (GET) should report unhealthy when Postgres is unreachable', async () => {
    const queryRaw = jest
      .fn<Promise<unknown>, [TemplateStringsArray, ...unknown[]]>()
      .mockRejectedValue(new Error('database unavailable'));

    app = await createApp({
      $queryRaw: queryRaw,
    });

    const response = await app.inject({
      method: 'GET',
      url: '/health/ready',
    });

    expect(response.statusCode).toBe(503);
    expect(response.json()).toEqual({
      status: 'error',
      checks: {
        database: 'down',
      },
    });
  });

  it('/health/ready (GET) should return not found when readiness exposure is disabled', async () => {
    const prismaService = {
      $queryRaw: jest.fn<
        Promise<unknown>,
        [TemplateStringsArray, ...unknown[]]
      >(),
    };
    app = await createApp(prismaService, {
      NODE_ENV: 'production',
    });

    const response = await app.inject({
      method: 'GET',
      url: '/health/ready',
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      message: 'Not Found',
      statusCode: 404,
    });
    expect(prismaService.$queryRaw).not.toHaveBeenCalled();
  });
});
