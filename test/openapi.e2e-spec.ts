import { type NestFastifyApplication } from '@nestjs/platform-fastify';
import { PrismaService } from './../src/prisma/prisma.service';
import { createTestApp } from './support/create-test-app';
import {
  applyTestEnvironment,
  captureTestEnvironment,
  restoreTestEnvironment,
} from './support/test-environment';

type QueryRawMock = jest.Mock<
  Promise<unknown>,
  [TemplateStringsArray, ...unknown[]]
>;

type PrismaQueryExecutor = {
  $queryRaw: QueryRawMock;
};

describe('OpenAPI (e2e)', () => {
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
  ): Promise<NestFastifyApplication> {
    return createTestApp({
      setupOpenApi: true,
      configureBuilder: (builder) =>
        builder.overrideProvider(PrismaService).useValue(prismaService),
    });
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
    expect(body.paths).toHaveProperty('/auth/register');
    expect(body.paths).toHaveProperty('/links');
    expect(body.paths).toHaveProperty('/{shortCode}');
  });
});
