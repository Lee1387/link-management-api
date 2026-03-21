import { type NestFastifyApplication } from '@nestjs/platform-fastify';
import { InvalidAccessTokenError } from './../../../../src/auth/domain/auth-user.errors';
import { ExpireOwnedLinkUseCase } from './../../../../src/links/application/use-cases/lifecycle/expire-owned-link.use-case';
import {
  createMockedLinksApp,
  createMockedLinksPrismaQueryExecutor,
  type MockLinkResult,
  TEST_VERIFIED_ACCESS_TOKEN_PAYLOAD,
} from './../../support/create-mocked-links-app';
import {
  applyTestEnvironment,
  captureTestEnvironment,
  restoreTestEnvironment,
} from './../../../support/test-environment';

describe('Links Expire (e2e)', () => {
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

  it('PATCH /links/:id/expire should update the authenticated user owned link expiry', async () => {
    const expireOwnedLinkUseCase = {
      execute: jest.fn<
        Promise<MockLinkResult | null>,
        [string, string, Date]
      >(),
    };
    const mocked = await createMockedLinksApp(
      createMockedLinksPrismaQueryExecutor(),
      (builder) =>
        builder
          .overrideProvider(ExpireOwnedLinkUseCase)
          .useValue(expireOwnedLinkUseCase),
    );
    app = mocked.app;
    mocked.accessTokenVerifier.verify.mockResolvedValue(
      TEST_VERIFIED_ACCESS_TOKEN_PAYLOAD,
    );
    expireOwnedLinkUseCase.execute.mockResolvedValue({
      id: 'link_123',
      originalUrl: 'https://example.com/articles/clean-architecture',
      shortCode: 'abc123X',
      disabledAt: null,
      expiresAt: new Date('2026-04-01T12:00:00.000Z'),
      createdAt: new Date('2026-03-18T13:10:00.000Z'),
      updatedAt: new Date('2026-03-21T18:30:00.000Z'),
    });

    const response = await app.inject({
      method: 'PATCH',
      url: '/links/link_123/expire',
      headers: {
        authorization: 'Bearer signed-jwt-token',
      },
      payload: {
        expiresAt: '2026-04-01T12:00:00.000Z',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      id: 'link_123',
      originalUrl: 'https://example.com/articles/clean-architecture',
      shortCode: 'abc123X',
      disabledAt: null,
      expiresAt: '2026-04-01T12:00:00.000Z',
      createdAt: '2026-03-18T13:10:00.000Z',
      updatedAt: '2026-03-21T18:30:00.000Z',
    });
    expect(expireOwnedLinkUseCase.execute).toHaveBeenCalledWith(
      'link_123',
      'user_123',
      new Date('2026-04-01T12:00:00.000Z'),
    );
  });

  it('PATCH /links/:id/expire should reject invalid request bodies', async () => {
    const expireOwnedLinkUseCase = {
      execute: jest.fn<
        Promise<MockLinkResult | null>,
        [string, string, Date]
      >(),
    };
    const mocked = await createMockedLinksApp(
      createMockedLinksPrismaQueryExecutor(),
      (builder) =>
        builder
          .overrideProvider(ExpireOwnedLinkUseCase)
          .useValue(expireOwnedLinkUseCase),
    );
    app = mocked.app;
    mocked.accessTokenVerifier.verify.mockResolvedValue(
      TEST_VERIFIED_ACCESS_TOKEN_PAYLOAD,
    );

    const response = await app.inject({
      method: 'PATCH',
      url: '/links/link_123/expire',
      headers: {
        authorization: 'Bearer signed-jwt-token',
      },
      payload: {
        expiresAt: 'not-a-timestamp',
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toEqual({
      statusCode: 400,
      message: ['expiresAt must be a valid ISO 8601 date string'],
      error: 'Bad Request',
    });
    expect(expireOwnedLinkUseCase.execute).not.toHaveBeenCalled();
  });

  it('PATCH /links/:id/expire should return not found when the owned link does not exist', async () => {
    const expireOwnedLinkUseCase = {
      execute: jest.fn<
        Promise<MockLinkResult | null>,
        [string, string, Date]
      >(),
    };
    const mocked = await createMockedLinksApp(
      createMockedLinksPrismaQueryExecutor(),
      (builder) =>
        builder
          .overrideProvider(ExpireOwnedLinkUseCase)
          .useValue(expireOwnedLinkUseCase),
    );
    app = mocked.app;
    mocked.accessTokenVerifier.verify.mockResolvedValue(
      TEST_VERIFIED_ACCESS_TOKEN_PAYLOAD,
    );
    expireOwnedLinkUseCase.execute.mockResolvedValue(null);

    const response = await app.inject({
      method: 'PATCH',
      url: '/links/missing/expire',
      headers: {
        authorization: 'Bearer signed-jwt-token',
      },
      payload: {
        expiresAt: '2026-04-01T12:00:00.000Z',
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      message: 'Link not found.',
      error: 'Not Found',
      statusCode: 404,
    });
    expect(expireOwnedLinkUseCase.execute).toHaveBeenCalledWith(
      'missing',
      'user_123',
      new Date('2026-04-01T12:00:00.000Z'),
    );
  });

  it('PATCH /links/:id/expire should reject requests without a bearer token', async () => {
    const expireOwnedLinkUseCase = {
      execute: jest.fn<
        Promise<MockLinkResult | null>,
        [string, string, Date]
      >(),
    };
    const mocked = await createMockedLinksApp(
      createMockedLinksPrismaQueryExecutor(),
      (builder) =>
        builder
          .overrideProvider(ExpireOwnedLinkUseCase)
          .useValue(expireOwnedLinkUseCase),
    );
    app = mocked.app;

    const response = await app.inject({
      method: 'PATCH',
      url: '/links/link_123/expire',
      payload: {
        expiresAt: '2026-04-01T12:00:00.000Z',
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      message: 'Authentication token is missing.',
      error: 'Unauthorized',
      statusCode: 401,
    });
    expect(mocked.accessTokenVerifier.verify).not.toHaveBeenCalled();
    expect(expireOwnedLinkUseCase.execute).not.toHaveBeenCalled();
  });

  it('PATCH /links/:id/expire should reject requests with an invalid bearer token', async () => {
    const expireOwnedLinkUseCase = {
      execute: jest.fn<
        Promise<MockLinkResult | null>,
        [string, string, Date]
      >(),
    };
    const mocked = await createMockedLinksApp(
      createMockedLinksPrismaQueryExecutor(),
      (builder) =>
        builder
          .overrideProvider(ExpireOwnedLinkUseCase)
          .useValue(expireOwnedLinkUseCase),
    );
    app = mocked.app;
    mocked.accessTokenVerifier.verify.mockRejectedValue(
      new InvalidAccessTokenError(),
    );

    const response = await app.inject({
      method: 'PATCH',
      url: '/links/link_123/expire',
      headers: {
        authorization: 'Bearer invalid-token',
      },
      payload: {
        expiresAt: '2026-04-01T12:00:00.000Z',
      },
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      message: 'Authentication token is invalid.',
      error: 'Unauthorized',
      statusCode: 401,
    });
    expect(mocked.accessTokenVerifier.verify).toHaveBeenCalledWith(
      'invalid-token',
    );
    expect(expireOwnedLinkUseCase.execute).not.toHaveBeenCalled();
  });
});
