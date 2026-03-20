import { type NestFastifyApplication } from '@nestjs/platform-fastify';
import { PrismaService } from './../../src/prisma/prisma.service';
import { createTestApp } from './../support/create-test-app';
import {
  applyTestEnvironment,
  captureTestEnvironment,
  restoreTestEnvironment,
} from './../support/test-environment';

describe('Redirect (db e2e)', () => {
  const environmentSnapshot = captureTestEnvironment();
  const createdShortCodes = new Set<string>();
  const createdEmails = new Set<string>();
  let app: NestFastifyApplication | null = null;

  beforeAll(() => {
    applyTestEnvironment();
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

      if (createdEmails.size > 0) {
        await prismaService.user.deleteMany({
          where: {
            email: {
              in: [...createdEmails],
            },
          },
        });
      }

      await app.close();
      app = null;
    }

    createdShortCodes.clear();
    createdEmails.clear();
  });

  afterAll(() => {
    restoreTestEnvironment(environmentSnapshot);
  });

  async function createApp(): Promise<NestFastifyApplication> {
    return createTestApp();
  }

  it('GET /:shortCode should redirect through the real Prisma-backed lookup', async () => {
    app = await createApp();
    const prismaService = app.get(PrismaService);
    const email = `redirect.${Date.now().toString(36)}@example.com`;
    const shortCode = `db${Date.now().toString(36)}x`;
    createdEmails.add(email);
    createdShortCodes.add(shortCode);

    const user = await prismaService.user.create({
      data: {
        email,
        passwordHash: 'hashed-password',
      },
    });

    await prismaService.link.create({
      data: {
        originalUrl: 'https://example.com/articles/clean-architecture',
        shortCode,
        userId: user.id,
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

  it('GET /:shortCode should return not found when the link is disabled', async () => {
    app = await createApp();
    const prismaService = app.get(PrismaService);
    const email = `disabled.${Date.now().toString(36)}@example.com`;
    const shortCode = `off${Date.now().toString(36)}x`;
    createdEmails.add(email);
    createdShortCodes.add(shortCode);

    const user = await prismaService.user.create({
      data: {
        email,
        passwordHash: 'hashed-password',
      },
    });

    await prismaService.link.create({
      data: {
        originalUrl: 'https://example.com/articles/disabled-link',
        shortCode,
        disabledAt: new Date('2026-03-20T10:00:00.000Z'),
        userId: user.id,
      },
    });

    const response = await app.inject({
      method: 'GET',
      url: `/${shortCode}`,
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      message: 'Link not found.',
      error: 'Not Found',
      statusCode: 404,
    });
  });
});
