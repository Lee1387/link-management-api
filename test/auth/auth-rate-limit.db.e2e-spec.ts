import { type NestFastifyApplication } from '@nestjs/platform-fastify';
import { PrismaService } from './../../src/prisma/prisma.service';
import {
  AUTH_RATE_LIMIT,
  TOO_MANY_REQUESTS_MESSAGE,
} from './../../src/rate-limit/rate-limit.policies';
import { ScryptPasswordHasher } from './../../src/auth/infrastructure/scrypt-password-hasher';
import { createTestApp } from './../support/create-test-app';
import {
  applyTestEnvironment,
  captureTestEnvironment,
  restoreTestEnvironment,
} from './../support/test-environment';

describe('Auth Rate Limit (db e2e)', () => {
  const environmentSnapshot = captureTestEnvironment();
  const createdEmails = new Set<string>();
  let app: NestFastifyApplication | null = null;

  beforeAll(() => {
    applyTestEnvironment();
  });

  afterEach(async () => {
    if (app !== null) {
      const prismaService = app.get(PrismaService);

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

    createdEmails.clear();
  });

  afterAll(() => {
    restoreTestEnvironment(environmentSnapshot);
  });

  async function createApp(): Promise<NestFastifyApplication> {
    return createTestApp();
  }

  it('POST /auth/register should rate limit repeated account creation attempts', async () => {
    app = await createApp();

    for (
      let attempt = 0;
      attempt < AUTH_RATE_LIMIT.authBurst.limit;
      attempt += 1
    ) {
      const email = `alex.${Date.now().toString(36)}.${attempt}@example.com`;
      createdEmails.add(email);

      const response = await app.inject({
        method: 'POST',
        url: '/auth/register',
        payload: {
          email,
          password: 'my-secure-password',
        },
      });

      expect(response.statusCode).toBe(201);
    }

    const rateLimitedResponse = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: `alex.${Date.now().toString(36)}.blocked@example.com`,
        password: 'my-secure-password',
      },
    });

    expect(rateLimitedResponse.statusCode).toBe(429);
    expect(rateLimitedResponse.json()).toEqual({
      message: TOO_MANY_REQUESTS_MESSAGE,
      statusCode: 429,
    });
  });

  it('POST /auth/login should rate limit repeated invalid credential attempts', async () => {
    app = await createApp();
    const prismaService = app.get(PrismaService);
    const passwordHasher = app.get(ScryptPasswordHasher);
    const email = `alex.${Date.now().toString(36)}@example.com`;
    createdEmails.add(email);

    await prismaService.user.create({
      data: {
        email,
        passwordHash: await passwordHasher.hash('my-secure-password'),
      },
    });

    for (
      let attempt = 0;
      attempt < AUTH_RATE_LIMIT.authBurst.limit;
      attempt += 1
    ) {
      const response = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: {
          email,
          password: 'wrong-password',
        },
      });

      expect(response.statusCode).toBe(401);
    }

    const rateLimitedResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email,
        password: 'wrong-password',
      },
    });

    expect(rateLimitedResponse.statusCode).toBe(429);
    expect(rateLimitedResponse.json()).toEqual({
      message: TOO_MANY_REQUESTS_MESSAGE,
      statusCode: 429,
    });
  });
});
