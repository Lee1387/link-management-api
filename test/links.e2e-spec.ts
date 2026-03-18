import { Test, TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { configureApp } from './../src/app.bootstrap';
import { AppModule } from './../src/app.module';
import { CreateLinkUseCase } from './../src/links/application/create-link.use-case';
import { PrismaService } from './../src/prisma/prisma.service';

type PrismaQueryExecutor = {
  $queryRaw: jest.Mock<Promise<unknown>, [TemplateStringsArray, ...unknown[]]>;
  link: {
    create: jest.Mock;
  };
};

describe('Links (e2e)', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalDatabaseUrl = process.env.DATABASE_URL;
  let app: NestFastifyApplication | null = null;
  let createLinkUseCase: {
    execute: jest.Mock<
      Promise<{
        id: string;
        originalUrl: string;
        shortCode: string;
        createdAt: Date;
        updatedAt: Date;
      }>,
      [{ originalUrl: string }]
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
    createLinkUseCase = {
      execute: jest.fn<
        Promise<{
          id: string;
          originalUrl: string;
          shortCode: string;
          createdAt: Date;
          updatedAt: Date;
        }>,
        [{ originalUrl: string }]
      >(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(PrismaService)
      .useValue(prismaService)
      .overrideProvider(CreateLinkUseCase)
      .useValue(createLinkUseCase)
      .compile();

    const nextApp = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await configureApp(nextApp, 'test');
    await nextApp.init();
    await nextApp.getHttpAdapter().getInstance().ready();

    return nextApp;
  }

  it('POST /links should create a short link', async () => {
    app = await createApp({
      $queryRaw: jest.fn<
        Promise<unknown>,
        [TemplateStringsArray, ...unknown[]]
      >(),
      link: {
        create: jest.fn(),
      },
    });
    createLinkUseCase.execute.mockResolvedValue({
      id: 'link_123',
      originalUrl: 'https://example.com/articles/clean-architecture',
      shortCode: 'abc123X',
      createdAt: new Date('2026-03-18T13:10:00.000Z'),
      updatedAt: new Date('2026-03-18T13:10:00.000Z'),
    });

    const response = await app.inject({
      method: 'POST',
      url: '/links',
      payload: {
        originalUrl: 'https://example.com/articles/clean-architecture',
      },
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toEqual({
      id: 'link_123',
      originalUrl: 'https://example.com/articles/clean-architecture',
      shortCode: 'abc123X',
      createdAt: '2026-03-18T13:10:00.000Z',
      updatedAt: '2026-03-18T13:10:00.000Z',
    });
    expect(createLinkUseCase.execute).toHaveBeenCalledWith({
      originalUrl: 'https://example.com/articles/clean-architecture',
    });
  });

  it('POST /links should reject invalid request bodies', async () => {
    app = await createApp({
      $queryRaw: jest.fn<
        Promise<unknown>,
        [TemplateStringsArray, ...unknown[]]
      >(),
      link: {
        create: jest.fn(),
      },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/links',
      payload: {
        originalUrl: 'not-a-url',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      statusCode: 400,
      message: ['originalUrl must be a URL address'],
      error: 'Bad Request',
    });
    expect(createLinkUseCase.execute).not.toHaveBeenCalled();
  });
});
