import { type NestFastifyApplication } from '@nestjs/platform-fastify';
import {
  ACCESS_TOKEN_VERIFIER,
  type AccessTokenVerifier,
  type VerifiedAccessTokenPayload,
} from './../../src/auth/application/access-token-verifier';
import { InvalidAccessTokenError } from './../../src/auth/domain/auth-user.errors';
import { CreateLinkUseCase } from './../../src/links/application/create-link.use-case';
import { ListOwnedLinksUseCase } from './../../src/links/application/list-owned-links.use-case';
import { PrismaService } from './../../src/prisma/prisma.service';
import { createTestApp } from './../support/create-test-app';
import {
  applyTestEnvironment,
  captureTestEnvironment,
  restoreTestEnvironment,
} from './../support/test-environment';

type PrismaQueryExecutor = {
  $queryRaw: jest.Mock<Promise<unknown>, [TemplateStringsArray, ...unknown[]]>;
  link: {
    create: jest.Mock;
  };
};

describe('Links (e2e)', () => {
  const environmentSnapshot = captureTestEnvironment();
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
      [{ originalUrl: string; userId: string }]
    >;
  };
  let listOwnedLinksUseCase: {
    execute: jest.Mock<
      Promise<
        Array<{
          id: string;
          originalUrl: string;
          shortCode: string;
          createdAt: Date;
          updatedAt: Date;
        }>
      >,
      [string]
    >;
  };
  let accessTokenVerifier: {
    verify: jest.Mock<Promise<VerifiedAccessTokenPayload>, [string]>;
  };

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
    createLinkUseCase = {
      execute: jest.fn<
        Promise<{
          id: string;
          originalUrl: string;
          shortCode: string;
          createdAt: Date;
          updatedAt: Date;
        }>,
        [{ originalUrl: string; userId: string }]
      >(),
    };
    listOwnedLinksUseCase = {
      execute: jest.fn<
        Promise<
          Array<{
            id: string;
            originalUrl: string;
            shortCode: string;
            createdAt: Date;
            updatedAt: Date;
          }>
        >,
        [string]
      >(),
    };
    accessTokenVerifier = {
      verify: jest.fn<Promise<VerifiedAccessTokenPayload>, [string]>(),
    };

    return createTestApp({
      configureBuilder: (builder) =>
        builder
          .overrideProvider(PrismaService)
          .useValue(prismaService)
          .overrideProvider(ACCESS_TOKEN_VERIFIER)
          .useValue(accessTokenVerifier satisfies AccessTokenVerifier)
          .overrideProvider(ListOwnedLinksUseCase)
          .useValue(listOwnedLinksUseCase)
          .overrideProvider(CreateLinkUseCase)
          .useValue(createLinkUseCase),
    });
  }

  it('GET /links should return the authenticated user owned links', async () => {
    app = await createApp({
      $queryRaw: jest.fn<
        Promise<unknown>,
        [TemplateStringsArray, ...unknown[]]
      >(),
      link: {
        create: jest.fn(),
      },
    });
    accessTokenVerifier.verify.mockResolvedValue({
      sub: 'user_123',
      email: 'alex@example.com',
      iat: 1,
      exp: 2,
    });
    listOwnedLinksUseCase.execute.mockResolvedValue([
      {
        id: 'link_456',
        originalUrl: 'https://example.com/articles/testing',
        shortCode: 'new456X',
        createdAt: new Date('2026-03-19T10:00:00.000Z'),
        updatedAt: new Date('2026-03-19T10:00:00.000Z'),
      },
      {
        id: 'link_123',
        originalUrl: 'https://example.com/articles/clean-architecture',
        shortCode: 'abc123X',
        createdAt: new Date('2026-03-18T13:10:00.000Z'),
        updatedAt: new Date('2026-03-18T13:10:00.000Z'),
      },
    ]);

    const response = await app.inject({
      method: 'GET',
      url: '/links',
      headers: {
        authorization: 'Bearer signed-jwt-token',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([
      {
        id: 'link_456',
        originalUrl: 'https://example.com/articles/testing',
        shortCode: 'new456X',
        createdAt: '2026-03-19T10:00:00.000Z',
        updatedAt: '2026-03-19T10:00:00.000Z',
      },
      {
        id: 'link_123',
        originalUrl: 'https://example.com/articles/clean-architecture',
        shortCode: 'abc123X',
        createdAt: '2026-03-18T13:10:00.000Z',
        updatedAt: '2026-03-18T13:10:00.000Z',
      },
    ]);
    expect(listOwnedLinksUseCase.execute).toHaveBeenCalledWith('user_123');
    expect(accessTokenVerifier.verify).toHaveBeenCalledWith('signed-jwt-token');
  });

  it('GET /links should reject requests without a bearer token', async () => {
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
      method: 'GET',
      url: '/links',
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      message: 'Authentication token is missing.',
      error: 'Unauthorized',
      statusCode: 401,
    });
    expect(accessTokenVerifier.verify).not.toHaveBeenCalled();
    expect(listOwnedLinksUseCase.execute).not.toHaveBeenCalled();
  });

  it('GET /links should reject requests with an invalid bearer token', async () => {
    app = await createApp({
      $queryRaw: jest.fn<
        Promise<unknown>,
        [TemplateStringsArray, ...unknown[]]
      >(),
      link: {
        create: jest.fn(),
      },
    });
    accessTokenVerifier.verify.mockRejectedValue(new InvalidAccessTokenError());

    const response = await app.inject({
      method: 'GET',
      url: '/links',
      headers: {
        authorization: 'Bearer invalid-token',
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      message: 'Authentication token is invalid.',
      error: 'Unauthorized',
      statusCode: 401,
    });
    expect(accessTokenVerifier.verify).toHaveBeenCalledWith('invalid-token');
    expect(listOwnedLinksUseCase.execute).not.toHaveBeenCalled();
  });

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
    accessTokenVerifier.verify.mockResolvedValue({
      sub: 'user_123',
      email: 'alex@example.com',
      iat: 1,
      exp: 2,
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
      headers: {
        authorization: 'Bearer signed-jwt-token',
      },
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
      userId: 'user_123',
    });
    expect(accessTokenVerifier.verify).toHaveBeenCalledWith('signed-jwt-token');
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
    accessTokenVerifier.verify.mockResolvedValue({
      sub: 'user_123',
      email: 'alex@example.com',
      iat: 1,
      exp: 2,
    });

    const response = await app.inject({
      method: 'POST',
      url: '/links',
      headers: {
        authorization: 'Bearer signed-jwt-token',
      },
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

  it('POST /links should reject requests without a bearer token', async () => {
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
        originalUrl: 'https://example.com/articles/clean-architecture',
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      message: 'Authentication token is missing.',
      error: 'Unauthorized',
      statusCode: 401,
    });
    expect(accessTokenVerifier.verify).not.toHaveBeenCalled();
    expect(createLinkUseCase.execute).not.toHaveBeenCalled();
  });

  it('POST /links should reject requests with an invalid bearer token', async () => {
    app = await createApp({
      $queryRaw: jest.fn<
        Promise<unknown>,
        [TemplateStringsArray, ...unknown[]]
      >(),
      link: {
        create: jest.fn(),
      },
    });
    accessTokenVerifier.verify.mockRejectedValue(new InvalidAccessTokenError());

    const response = await app.inject({
      method: 'POST',
      url: '/links',
      headers: {
        authorization: 'Bearer invalid-token',
      },
      payload: {
        originalUrl: 'https://example.com/articles/clean-architecture',
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      message: 'Authentication token is invalid.',
      error: 'Unauthorized',
      statusCode: 401,
    });
    expect(accessTokenVerifier.verify).toHaveBeenCalledWith('invalid-token');
    expect(createLinkUseCase.execute).not.toHaveBeenCalled();
  });
});
