import { type NestFastifyApplication } from '@nestjs/platform-fastify';
import { InvalidAccessTokenError } from './../../../../src/auth/domain/auth-user.errors';
import { DisableOwnedLinkUseCase } from './../../../../src/links/application/use-cases/lifecycle/disable-owned-link.use-case';
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

describe('Links Disable (e2e)', () => {
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

  it('PATCH /links/:id/disable should disable the authenticated user owned link', async () => {
    const disableOwnedLinkUseCase = {
      execute: jest.fn<Promise<MockLinkResult | null>, [string, string]>(),
    };
    const mocked = await createMockedLinksApp(
      createMockedLinksPrismaQueryExecutor(),
      (builder) =>
        builder
          .overrideProvider(DisableOwnedLinkUseCase)
          .useValue(disableOwnedLinkUseCase),
    );
    app = mocked.app;
    mocked.accessTokenVerifier.verify.mockResolvedValue(
      TEST_VERIFIED_ACCESS_TOKEN_PAYLOAD,
    );
    disableOwnedLinkUseCase.execute.mockResolvedValue({
      id: 'link_123',
      originalUrl: 'https://example.com/articles/clean-architecture',
      shortCode: 'abc123X',
      disabledAt: new Date('2026-03-20T10:00:00.000Z'),
      expiresAt: null,
      createdAt: new Date('2026-03-18T13:10:00.000Z'),
      updatedAt: new Date('2026-03-20T10:00:00.000Z'),
    });

    const response = await app.inject({
      method: 'PATCH',
      url: '/links/link_123/disable',
      headers: {
        authorization: 'Bearer signed-jwt-token',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      id: 'link_123',
      originalUrl: 'https://example.com/articles/clean-architecture',
      shortCode: 'abc123X',
      disabledAt: '2026-03-20T10:00:00.000Z',
      expiresAt: null,
      createdAt: '2026-03-18T13:10:00.000Z',
      updatedAt: '2026-03-20T10:00:00.000Z',
    });
    expect(disableOwnedLinkUseCase.execute).toHaveBeenCalledWith(
      'link_123',
      'user_123',
    );
  });

  it('PATCH /links/:id/disable should return not found when the owned link does not exist', async () => {
    const disableOwnedLinkUseCase = {
      execute: jest.fn<Promise<MockLinkResult | null>, [string, string]>(),
    };
    const mocked = await createMockedLinksApp(
      createMockedLinksPrismaQueryExecutor(),
      (builder) =>
        builder
          .overrideProvider(DisableOwnedLinkUseCase)
          .useValue(disableOwnedLinkUseCase),
    );
    app = mocked.app;
    mocked.accessTokenVerifier.verify.mockResolvedValue(
      TEST_VERIFIED_ACCESS_TOKEN_PAYLOAD,
    );
    disableOwnedLinkUseCase.execute.mockResolvedValue(null);

    const response = await app.inject({
      method: 'PATCH',
      url: '/links/missing/disable',
      headers: {
        authorization: 'Bearer signed-jwt-token',
      },
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      message: 'Link not found.',
      error: 'Not Found',
      statusCode: 404,
    });
    expect(disableOwnedLinkUseCase.execute).toHaveBeenCalledWith(
      'missing',
      'user_123',
    );
  });

  it('PATCH /links/:id/disable should reject requests without a bearer token', async () => {
    const disableOwnedLinkUseCase = {
      execute: jest.fn<Promise<MockLinkResult | null>, [string, string]>(),
    };
    const mocked = await createMockedLinksApp(
      createMockedLinksPrismaQueryExecutor(),
      (builder) =>
        builder
          .overrideProvider(DisableOwnedLinkUseCase)
          .useValue(disableOwnedLinkUseCase),
    );
    app = mocked.app;

    const response = await app.inject({
      method: 'PATCH',
      url: '/links/link_123/disable',
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      message: 'Authentication token is missing.',
      error: 'Unauthorized',
      statusCode: 401,
    });
    expect(mocked.accessTokenVerifier.verify).not.toHaveBeenCalled();
    expect(disableOwnedLinkUseCase.execute).not.toHaveBeenCalled();
  });

  it('PATCH /links/:id/disable should reject requests with an invalid bearer token', async () => {
    const disableOwnedLinkUseCase = {
      execute: jest.fn<Promise<MockLinkResult | null>, [string, string]>(),
    };
    const mocked = await createMockedLinksApp(
      createMockedLinksPrismaQueryExecutor(),
      (builder) =>
        builder
          .overrideProvider(DisableOwnedLinkUseCase)
          .useValue(disableOwnedLinkUseCase),
    );
    app = mocked.app;
    mocked.accessTokenVerifier.verify.mockRejectedValue(
      new InvalidAccessTokenError(),
    );

    const response = await app.inject({
      method: 'PATCH',
      url: '/links/link_123/disable',
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
    expect(disableOwnedLinkUseCase.execute).not.toHaveBeenCalled();
  });
});
