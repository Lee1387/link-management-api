import { Test, TestingModule } from '@nestjs/testing';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { configureApp } from './../src/app.bootstrap';
import { AppModule } from './../src/app.module';
import { PrismaService } from './../src/prisma/prisma.service';

describe('Auth (db e2e)', () => {
  const originalNodeEnv = process.env.NODE_ENV;
  const originalDatabaseUrl = process.env.DATABASE_URL;
  const createdEmails = new Set<string>();
  let app: NestFastifyApplication | null = null;

  beforeAll(() => {
    process.env.NODE_ENV = 'test';
    process.env.DATABASE_URL =
      'postgresql://postgres:postgres@localhost:5432/link_management_api?schema=public';
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

  it('POST /auth/register should register a user through the real Prisma-backed flow', async () => {
    app = await createApp();
    const email = `alex.${Date.now().toString(36)}@example.com`;
    createdEmails.add(email);

    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email,
        password: 'my-secure-password',
      },
    });
    const body: {
      id: unknown;
      email: unknown;
      createdAt: unknown;
      updatedAt: unknown;
    } = response.json();

    expect(response.statusCode).toBe(201);
    expect(body).toMatchObject({
      email,
    });
    expect(typeof body.id).toBe('string');
    expect(body.email).toBe(email);
    expect(typeof body.createdAt).toBe('string');
    expect(typeof body.updatedAt).toBe('string');

    const prismaService = app.get(PrismaService);
    const user = await prismaService.user.findUnique({
      where: {
        email,
      },
    });

    expect(user).not.toBeNull();
    expect(user?.passwordHash).toMatch(/^scrypt\$/);
    expect(user?.passwordHash).not.toBe('my-secure-password');
  });

  it('POST /auth/register should return conflict when the email already exists', async () => {
    app = await createApp();
    const prismaService = app.get(PrismaService);
    const email = `alex.${Date.now().toString(36)}@example.com`;
    createdEmails.add(email);

    await prismaService.user.create({
      data: {
        email,
        passwordHash: 'hashed-password',
      },
    });

    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email,
        password: 'my-secure-password',
      },
    });

    expect(response.statusCode).toBe(409);
    expect(response.json()).toEqual({
      message: 'Email already in use.',
      error: 'Conflict',
      statusCode: 409,
    });
  });

  it('POST /auth/register should reject invalid request bodies', async () => {
    app = await createApp();

    const response = await app.inject({
      method: 'POST',
      url: '/auth/register',
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
