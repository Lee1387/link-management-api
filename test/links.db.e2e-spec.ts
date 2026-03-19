import { type NestFastifyApplication } from '@nestjs/platform-fastify';
import { PrismaService } from './../src/prisma/prisma.service';
import { createTestApp } from './support/create-test-app';
import {
  applyTestEnvironment,
  captureTestEnvironment,
  restoreTestEnvironment,
} from './support/test-environment';

describe('Links (db e2e)', () => {
  const environmentSnapshot = captureTestEnvironment();
  const createdLinkIds = new Set<string>();
  let app: NestFastifyApplication | null = null;

  beforeAll(() => {
    applyTestEnvironment();
  });

  afterEach(async () => {
    if (app !== null) {
      const prismaService = app.get(PrismaService);

      if (createdLinkIds.size > 0) {
        await prismaService.link.deleteMany({
          where: {
            id: {
              in: [...createdLinkIds],
            },
          },
        });
      }

      await app.close();
      app = null;
    }

    createdLinkIds.clear();
  });

  afterAll(() => {
    restoreTestEnvironment(environmentSnapshot);
  });

  async function createApp(): Promise<NestFastifyApplication> {
    return createTestApp();
  }

  it('POST /links should create a short link through the real Prisma-backed flow', async () => {
    app = await createApp();

    const response = await app.inject({
      method: 'POST',
      url: '/links',
      payload: {
        originalUrl: 'https://example.com/articles/clean-architecture',
      },
    });

    const body: {
      id: unknown;
      originalUrl: unknown;
      shortCode: unknown;
      createdAt: unknown;
      updatedAt: unknown;
    } = response.json();

    expect(response.statusCode).toBe(201);
    expect(typeof body.id).toBe('string');
    expect(body.originalUrl).toBe(
      'https://example.com/articles/clean-architecture',
    );
    expect(typeof body.shortCode).toBe('string');
    expect(body.shortCode).not.toBe('');
    expect(typeof body.createdAt).toBe('string');
    expect(typeof body.updatedAt).toBe('string');

    createdLinkIds.add(body.id as string);

    const prismaService = app.get(PrismaService);
    const link = await prismaService.link.findUnique({
      where: {
        id: body.id as string,
      },
    });

    expect(link).not.toBeNull();
    expect(link).toMatchObject({
      originalUrl: 'https://example.com/articles/clean-architecture',
      shortCode: body.shortCode,
    });
  });
});
