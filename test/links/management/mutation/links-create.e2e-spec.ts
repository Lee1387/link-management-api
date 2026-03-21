import { type NestFastifyApplication } from '@nestjs/platform-fastify';
import { InvalidAccessTokenError } from './../../../../src/auth/domain/auth-user.errors';
import { CreateLinkUseCase } from './../../../../src/links/application/use-cases/mutation/create-link.use-case';
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

describe('Links Create (e2e)', () => {
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

  it('POST /links should create a short link', async () => {
    const createLinkUseCase = {
      execute: jest.fn<
        Promise<MockLinkResult>,
        [{ originalUrl: string; userId: string }]
      >(),
    };
    const mocked = await createMockedLinksApp(
      createMockedLinksPrismaQueryExecutor(),
      (builder) =>
        builder.overrideProvider(CreateLinkUseCase).useValue(createLinkUseCase),
    );
    app = mocked.app;
    mocked.accessTokenVerifier.verify.mockResolvedValue(
      TEST_VERIFIED_ACCESS_TOKEN_PAYLOAD,
    );
    createLinkUseCase.execute.mockResolvedValue({
      id: 'link_123',
      originalUrl: 'https://example.com/articles/clean-architecture',
      shortCode: 'abc123X',
      disabledAt: null,
      expiresAt: null,
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
    expect(mocked.accessTokenVerifier.verify).toHaveBeenCalledWith(
      'signed-jwt-token',
    );
  });

  it('POST /links should reject invalid request bodies', async () => {
    const createLinkUseCase = {
      execute: jest.fn<
        Promise<MockLinkResult>,
        [{ originalUrl: string; userId: string }]
      >(),
    };
    const mocked = await createMockedLinksApp(
      createMockedLinksPrismaQueryExecutor(),
      (builder) =>
        builder.overrideProvider(CreateLinkUseCase).useValue(createLinkUseCase),
    );
    app = mocked.app;
    mocked.accessTokenVerifier.verify.mockResolvedValue(
      TEST_VERIFIED_ACCESS_TOKEN_PAYLOAD,
    );

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
    const createLinkUseCase = {
      execute: jest.fn<
        Promise<MockLinkResult>,
        [{ originalUrl: string; userId: string }]
      >(),
    };
    const mocked = await createMockedLinksApp(
      createMockedLinksPrismaQueryExecutor(),
      (builder) =>
        builder.overrideProvider(CreateLinkUseCase).useValue(createLinkUseCase),
    );
    app = mocked.app;

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
    expect(mocked.accessTokenVerifier.verify).not.toHaveBeenCalled();
    expect(createLinkUseCase.execute).not.toHaveBeenCalled();
  });

  it('POST /links should reject requests with an invalid bearer token', async () => {
    const createLinkUseCase = {
      execute: jest.fn<
        Promise<MockLinkResult>,
        [{ originalUrl: string; userId: string }]
      >(),
    };
    const mocked = await createMockedLinksApp(
      createMockedLinksPrismaQueryExecutor(),
      (builder) =>
        builder.overrideProvider(CreateLinkUseCase).useValue(createLinkUseCase),
    );
    app = mocked.app;
    mocked.accessTokenVerifier.verify.mockRejectedValue(
      new InvalidAccessTokenError(),
    );

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
    expect(mocked.accessTokenVerifier.verify).toHaveBeenCalledWith(
      'invalid-token',
    );
    expect(createLinkUseCase.execute).not.toHaveBeenCalled();
  });
});
