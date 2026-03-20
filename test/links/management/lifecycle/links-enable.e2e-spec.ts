import { type NestFastifyApplication } from '@nestjs/platform-fastify';
import { InvalidAccessTokenError } from './../../../../src/auth/domain/auth-user.errors';
import {
  createMockedLinksApp,
  createMockedLinksPrismaQueryExecutor,
  TEST_VERIFIED_ACCESS_TOKEN_PAYLOAD,
} from './../../support/create-mocked-links-app';
import {
  applyTestEnvironment,
  captureTestEnvironment,
  restoreTestEnvironment,
} from './../../../support/test-environment';

describe('Links Enable (e2e)', () => {
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

  it('PATCH /links/:id/enable should enable the authenticated user owned link', async () => {
    const mocked = await createMockedLinksApp(
      createMockedLinksPrismaQueryExecutor(),
    );
    app = mocked.app;
    mocked.accessTokenVerifier.verify.mockResolvedValue(
      TEST_VERIFIED_ACCESS_TOKEN_PAYLOAD,
    );
    mocked.enableOwnedLinkUseCase.execute.mockResolvedValue({
      id: 'link_123',
      originalUrl: 'https://example.com/articles/clean-architecture',
      shortCode: 'abc123X',
      disabledAt: null,
      createdAt: new Date('2026-03-18T13:10:00.000Z'),
      updatedAt: new Date('2026-03-20T10:00:00.000Z'),
    });

    const response = await app.inject({
      method: 'PATCH',
      url: '/links/link_123/enable',
      headers: {
        authorization: 'Bearer signed-jwt-token',
      },
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual({
      id: 'link_123',
      originalUrl: 'https://example.com/articles/clean-architecture',
      shortCode: 'abc123X',
      disabledAt: null,
      createdAt: '2026-03-18T13:10:00.000Z',
      updatedAt: '2026-03-20T10:00:00.000Z',
    });
    expect(mocked.enableOwnedLinkUseCase.execute).toHaveBeenCalledWith(
      'link_123',
      'user_123',
    );
  });

  it('PATCH /links/:id/enable should return not found when the owned link does not exist', async () => {
    const mocked = await createMockedLinksApp(
      createMockedLinksPrismaQueryExecutor(),
    );
    app = mocked.app;
    mocked.accessTokenVerifier.verify.mockResolvedValue(
      TEST_VERIFIED_ACCESS_TOKEN_PAYLOAD,
    );
    mocked.enableOwnedLinkUseCase.execute.mockResolvedValue(null);

    const response = await app.inject({
      method: 'PATCH',
      url: '/links/missing/enable',
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
    expect(mocked.enableOwnedLinkUseCase.execute).toHaveBeenCalledWith(
      'missing',
      'user_123',
    );
  });

  it('PATCH /links/:id/enable should reject requests without a bearer token', async () => {
    const mocked = await createMockedLinksApp(
      createMockedLinksPrismaQueryExecutor(),
    );
    app = mocked.app;

    const response = await app.inject({
      method: 'PATCH',
      url: '/links/link_123/enable',
    });

    expect(response.statusCode).toBe(401);
    expect(response.json()).toEqual({
      message: 'Authentication token is missing.',
      error: 'Unauthorized',
      statusCode: 401,
    });
    expect(mocked.accessTokenVerifier.verify).not.toHaveBeenCalled();
    expect(mocked.enableOwnedLinkUseCase.execute).not.toHaveBeenCalled();
  });

  it('PATCH /links/:id/enable should reject requests with an invalid bearer token', async () => {
    const mocked = await createMockedLinksApp(
      createMockedLinksPrismaQueryExecutor(),
    );
    app = mocked.app;
    mocked.accessTokenVerifier.verify.mockRejectedValue(
      new InvalidAccessTokenError(),
    );

    const response = await app.inject({
      method: 'PATCH',
      url: '/links/link_123/enable',
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
    expect(mocked.enableOwnedLinkUseCase.execute).not.toHaveBeenCalled();
  });
});
