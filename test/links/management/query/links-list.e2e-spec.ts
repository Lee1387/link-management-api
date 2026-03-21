import { type NestFastifyApplication } from '@nestjs/platform-fastify';
import { InvalidAccessTokenError } from './../../../../src/auth/domain/auth-user.errors';
import { ListOwnedLinksUseCase } from './../../../../src/links/application/use-cases/query/list-owned-links.use-case';
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

describe('Links List (e2e)', () => {
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

  it('GET /links should return the authenticated user owned links', async () => {
    const listOwnedLinksUseCase = {
      execute: jest.fn<
        Promise<MockLinkResult[]>,
        [string, { limit: number; offset: number }]
      >(),
    };
    const mocked = await createMockedLinksApp(
      createMockedLinksPrismaQueryExecutor(),
      (builder) =>
        builder
          .overrideProvider(ListOwnedLinksUseCase)
          .useValue(listOwnedLinksUseCase),
    );
    app = mocked.app;
    mocked.accessTokenVerifier.verify.mockResolvedValue(
      TEST_VERIFIED_ACCESS_TOKEN_PAYLOAD,
    );
    listOwnedLinksUseCase.execute.mockResolvedValue([
      {
        id: 'link_456',
        originalUrl: 'https://example.com/articles/testing',
        shortCode: 'new456X',
        disabledAt: null,
        expiresAt: null,
        createdAt: new Date('2026-03-19T10:00:00.000Z'),
        updatedAt: new Date('2026-03-19T10:00:00.000Z'),
      },
      {
        id: 'link_123',
        originalUrl: 'https://example.com/articles/clean-architecture',
        shortCode: 'abc123X',
        disabledAt: null,
        expiresAt: null,
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
        disabledAt: null,
        expiresAt: null,
        createdAt: '2026-03-19T10:00:00.000Z',
        updatedAt: '2026-03-19T10:00:00.000Z',
      },
      {
        id: 'link_123',
        originalUrl: 'https://example.com/articles/clean-architecture',
        shortCode: 'abc123X',
        disabledAt: null,
        expiresAt: null,
        createdAt: '2026-03-18T13:10:00.000Z',
        updatedAt: '2026-03-18T13:10:00.000Z',
      },
    ]);
    expect(listOwnedLinksUseCase.execute).toHaveBeenCalledWith('user_123', {
      limit: 25,
      offset: 0,
    });
    expect(mocked.accessTokenVerifier.verify).toHaveBeenCalledWith(
      'signed-jwt-token',
    );
  });

  it('GET /links should pass pagination query parameters through to the use case', async () => {
    const listOwnedLinksUseCase = {
      execute: jest.fn<
        Promise<MockLinkResult[]>,
        [string, { limit: number; offset: number }]
      >(),
    };
    const mocked = await createMockedLinksApp(
      createMockedLinksPrismaQueryExecutor(),
      (builder) =>
        builder
          .overrideProvider(ListOwnedLinksUseCase)
          .useValue(listOwnedLinksUseCase),
    );
    app = mocked.app;
    mocked.accessTokenVerifier.verify.mockResolvedValue(
      TEST_VERIFIED_ACCESS_TOKEN_PAYLOAD,
    );
    listOwnedLinksUseCase.execute.mockResolvedValue([]);

    const response = await app.inject({
      method: 'GET',
      url: '/links?limit=10&offset=20',
      headers: {
        authorization: 'Bearer signed-jwt-token',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([]);
    expect(listOwnedLinksUseCase.execute).toHaveBeenCalledWith('user_123', {
      limit: 10,
      offset: 20,
    });
  });

  it('GET /links should reject requests without a bearer token', async () => {
    const listOwnedLinksUseCase = {
      execute: jest.fn<
        Promise<MockLinkResult[]>,
        [string, { limit: number; offset: number }]
      >(),
    };
    const mocked = await createMockedLinksApp(
      createMockedLinksPrismaQueryExecutor(),
      (builder) =>
        builder
          .overrideProvider(ListOwnedLinksUseCase)
          .useValue(listOwnedLinksUseCase),
    );
    app = mocked.app;

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
    expect(mocked.accessTokenVerifier.verify).not.toHaveBeenCalled();
    expect(listOwnedLinksUseCase.execute).not.toHaveBeenCalled();
  });

  it('GET /links should reject requests with an invalid bearer token', async () => {
    const listOwnedLinksUseCase = {
      execute: jest.fn<
        Promise<MockLinkResult[]>,
        [string, { limit: number; offset: number }]
      >(),
    };
    const mocked = await createMockedLinksApp(
      createMockedLinksPrismaQueryExecutor(),
      (builder) =>
        builder
          .overrideProvider(ListOwnedLinksUseCase)
          .useValue(listOwnedLinksUseCase),
    );
    app = mocked.app;
    mocked.accessTokenVerifier.verify.mockRejectedValue(
      new InvalidAccessTokenError(),
    );

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
    expect(mocked.accessTokenVerifier.verify).toHaveBeenCalledWith(
      'invalid-token',
    );
    expect(listOwnedLinksUseCase.execute).not.toHaveBeenCalled();
  });
});
