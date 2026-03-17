import { Test, TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { configureApp } from './../src/app.bootstrap';
import { resetValidatedEnvCache } from './../src/config/env.schema';
import { PrismaService } from './../src/prisma/prisma.service';
import { AppModule } from './../src/app.module';

type QueryRawMock = jest.Mock<
  Promise<unknown>,
  [TemplateStringsArray, ...unknown[]]
>;

type PrismaQueryExecutor = {
  $queryRaw: QueryRawMock;
};

describe('Health (e2e)', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalDatabaseUrl = process.env.DATABASE_URL;
  let app: NestFastifyApplication | null = null;

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL =
      'postgresql://postgres:postgres@localhost:5432/link_management_api?schema=public';
    resetValidatedEnvCache();
  });

  afterEach(async () => {
    await app?.close();
    app = null;
  });

  afterAll(() => {
    if (originalNodeEnv === undefined) {
      delete process.env.NODE_ENV;
    } else {
      process.env.NODE_ENV = originalNodeEnv;
    }

    if (originalDatabaseUrl === undefined) {
      delete process.env.DATABASE_URL;
    } else {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }

    resetValidatedEnvCache();
  });

  async function createApp(
    prismaService: PrismaQueryExecutor,
  ): Promise<NestFastifyApplication> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaService)
      .compile();

    const nextApp = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await configureApp(nextApp);
    await nextApp.init();
    await nextApp.getHttpAdapter().getInstance().ready();

    return nextApp;
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
});
