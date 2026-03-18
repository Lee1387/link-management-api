import { Test, TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { configureApp } from './../src/app.bootstrap';
import { setupOpenApi } from './../src/app.openapi';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

type QueryRawMock = jest.Mock<
  Promise<unknown>,
  [TemplateStringsArray, ...unknown[]]
>;

type PrismaQueryExecutor = {
  $queryRaw: QueryRawMock;
};

describe('OpenAPI (e2e)', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalDatabaseUrl = process.env.DATABASE_URL;
  let app: NestFastifyApplication | null = null;

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL =
      'postgresql://postgres:postgres@localhost:5432/link_management_api?schema=public';
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
    setupOpenApi(nextApp);
    await nextApp.init();
    await nextApp.getHttpAdapter().getInstance().ready();

    return nextApp;
  }

  it('/docs (GET) should serve the Swagger UI', async () => {
    app = await createApp({
      $queryRaw: jest.fn<
        Promise<unknown>,
        [TemplateStringsArray, ...unknown[]]
      >(),
    });

    const response = await app.inject({
      method: 'GET',
      url: '/docs',
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('text/html');
    expect(response.body).toContain('id="swagger-ui"');
  });

  it('/docs/json (GET) should expose the OpenAPI document', async () => {
    app = await createApp({
      $queryRaw: jest.fn<
        Promise<unknown>,
        [TemplateStringsArray, ...unknown[]]
      >(),
    });

    const response = await app.inject({
      method: 'GET',
      url: '/docs/json',
    });

    const body: {
      info: {
        title: string;
        description: string;
        version: string;
      };
      paths: Record<string, unknown>;
    } = response.json();

    expect(response.statusCode).toBe(200);
    expect(body.info).toMatchObject({
      title: 'Link Management API',
      description:
        'Backend API for creating, managing, and tracking shortened links.',
      version: '0.0.1',
    });
    expect(body.paths).toHaveProperty('/health');
    expect(body.paths).toHaveProperty('/health/ready');
  });
});
