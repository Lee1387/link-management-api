import { Test, TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { configureApp } from './../src/app.bootstrap';
import { AppModule } from './../src/app.module';
import { ResolveLinkUseCase } from './../src/links/application/resolve-link.use-case';
import { PrismaService } from './../src/prisma/prisma.service';

type PrismaQueryExecutor = {
  $queryRaw: jest.Mock<Promise<unknown>, [TemplateStringsArray, ...unknown[]]>;
};

describe('Redirect (e2e)', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalDatabaseUrl = process.env.DATABASE_URL;
  let app: NestFastifyApplication | null = null;
  let resolveLinkUseCase: {
    execute: jest.Mock<
      Promise<{
        id: string;
        originalUrl: string;
        shortCode: string;
        createdAt: Date;
        updatedAt: Date;
      } | null>,
      [string]
    >;
  };

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
    resolveLinkUseCase = {
      execute: jest.fn<
        Promise<{
          id: string;
          originalUrl: string;
          shortCode: string;
          createdAt: Date;
          updatedAt: Date;
        } | null>,
        [string]
      >(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaService)
      .overrideProvider(ResolveLinkUseCase)
      .useValue(resolveLinkUseCase)
      .compile();

    const nextApp = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await configureApp(nextApp, 'test');
    await nextApp.init();
    await nextApp.getHttpAdapter().getInstance().ready();

    return nextApp;
  }

  it('GET /:shortCode should redirect when the short code exists', async () => {
    app = await createApp({
      $queryRaw: jest.fn<
        Promise<unknown>,
        [TemplateStringsArray, ...unknown[]]
      >(),
    });
    resolveLinkUseCase.execute.mockResolvedValue({
      id: 'link_123',
      originalUrl: 'https://example.com/articles/clean-architecture',
      shortCode: 'abc123X',
      createdAt: new Date('2026-03-18T13:10:00.000Z'),
      updatedAt: new Date('2026-03-18T13:10:00.000Z'),
    });

    const response = await app.inject({
      method: 'GET',
      url: '/abc123X',
    });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe(
      'https://example.com/articles/clean-architecture',
    );
    expect(resolveLinkUseCase.execute).toHaveBeenCalledWith('abc123X');
  });

  it('GET /:shortCode should return not found when the short code does not exist', async () => {
    app = await createApp({
      $queryRaw: jest.fn<
        Promise<unknown>,
        [TemplateStringsArray, ...unknown[]]
      >(),
    });
    resolveLinkUseCase.execute.mockResolvedValue(null);

    const response = await app.inject({
      method: 'GET',
      url: '/missing',
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      message: 'Link not found.',
      error: 'Not Found',
      statusCode: 404,
    });
    expect(resolveLinkUseCase.execute).toHaveBeenCalledWith('missing');
  });
});
