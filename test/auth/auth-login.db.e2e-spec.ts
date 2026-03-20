import { type NestFastifyApplication } from '@nestjs/platform-fastify';
import { JwtService } from '@nestjs/jwt';
import { ScryptPasswordHasher } from './../../src/auth/infrastructure/scrypt-password-hasher';
import { PrismaService } from './../../src/prisma/prisma.service';
import {
  createAuthDbApp,
  cleanupAuthDbState,
} from './support/auth-db-test-helpers';
import {
  applyTestEnvironment,
  captureTestEnvironment,
  restoreTestEnvironment,
} from './../support/test-environment';

describe('Auth Login (db e2e)', () => {
  const environmentSnapshot = captureTestEnvironment();
  const createdEmails = new Set<string>();
  let app: NestFastifyApplication | null = null;

  beforeAll(() => {
    applyTestEnvironment();
  });

  afterEach(async () => {
    await cleanupAuthDbState(app, createdEmails);
    app = null;
  });

  afterAll(() => {
    restoreTestEnvironment(environmentSnapshot);
  });

  it('POST /auth/login should authenticate a user through the real Prisma-backed flow', async () => {
    app = await createAuthDbApp();
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

    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email,
        password: 'my-secure-password',
      },
    });

    const body: {
      accessToken: unknown;
      tokenType: unknown;
      user: {
        id: unknown;
        email: unknown;
      };
    } = response.json();

    const jwtService = app.get(JwtService);
    const payload = await jwtService.verifyAsync<{
      sub: string;
      email: string;
      iat: number;
      exp: number;
    }>(body.accessToken as string);

    expect(response.statusCode).toBe(200);
    expect(typeof body.accessToken).toBe('string');
    expect(body.tokenType).toBe('Bearer');
    expect(typeof body.user.id).toBe('string');
    expect(body.user.email).toBe(email);
    expect(payload.sub).toBe(body.user.id);
    expect(payload.email).toBe(email);
  });

  it('POST /auth/login should return unauthorized when the password is invalid', async () => {
    app = await createAuthDbApp();
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

    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email,
        password: 'wrong-password',
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      message: 'Invalid credentials.',
      error: 'Unauthorized',
      statusCode: 401,
    });
  });

  it('POST /auth/login should reject invalid request bodies', async () => {
    app = await createAuthDbApp();

    const response = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: 'not-an-email',
        password: 'short',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      statusCode: 400,
      message: [
        'email must be an email',
        'password must be longer than or equal to 8 characters',
      ],
      error: 'Bad Request',
    });
  });
});
