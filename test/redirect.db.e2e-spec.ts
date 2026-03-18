import { Test, TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { configureApp } from './../src/app.bootstrap';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('Redirect (db e2e)', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalDatabaseUrl = process.env.DATABASE_URL;
  const createdShortCodes = new Set<string>();
  let app: NestFastifyApplication | null = null;

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL =
      'postgresql://postgres:postgres@localhost:5432/link_management_api?schema=public';
  });

  afterEach(async () => {
    if (app !== null) {
      const prismaService = app.get(PrismaService);

      if (createdShortCodes.size > 0) {
        await prismaService.link.deleteMany({
          where: {
            shortCode: {
              in: [...createdShortCodes],
            },
          },
        });
      }

      await app.close();
      app = null;
    }

    createdShortCodes.clear();
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

  async function createApp(): Promise<NestFastifyApplication> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    const nextApp = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    await configureApp(nextApp, 'test');
    await nextApp.init();
    await nextApp.getHttpAdapter().getInstance().ready();

    return nextApp;
  }

  it('GET /:shortCode should redirect through the real Prisma-backed lookup', async () => {
    app = await createApp();
    const prismaService = app.get(PrismaService);
    const shortCode = `db${Date.now().toString(36)}x`;
    createdShortCodes.add(shortCode);

    await prismaService.link.create({
      data: {
        originalUrl: 'https://example.com/articles/clean-architecture',
        shortCode,
      },
    });

    const response = await app.inject({
      method: 'GET',
      url: `/${shortCode}`,
    });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe(
      'https://example.com/articles/clean-architecture',
    );
  });
});
