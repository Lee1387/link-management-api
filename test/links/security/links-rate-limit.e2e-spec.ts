import { type NestFastifyApplication } from '@nestjs/platform-fastify';
import { CreateLinkUseCase } from './../../../src/links/application/use-cases/mutation/create-link.use-case';
import { DisableOwnedLinkUseCase } from './../../../src/links/application/use-cases/lifecycle/disable-owned-link.use-case';
import {
  TOO_MANY_REQUESTS_MESSAGE,
  WRITE_RATE_LIMIT,
} from './../../../src/rate-limit/rate-limit.policies';
import {
  createMockedLinksApp,
  createMockedLinksPrismaQueryExecutor,
  type MockLinkResult,
  TEST_VERIFIED_ACCESS_TOKEN_PAYLOAD,
} from '../support/create-mocked-links-app';
import {
  applyTestEnvironment,
  captureTestEnvironment,
  restoreTestEnvironment,
} from './../../support/test-environment';

describe('Links Rate Limit (e2e)', () => {
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

  it('POST /links should rate limit repeated authenticated creation requests', async () => {
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

    for (
      let attempt = 0;
      attempt < WRITE_RATE_LIMIT.writeBurst.limit;
      attempt += 1
    ) {
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
    }

    const rateLimitedResponse = await app.inject({
      method: 'POST',
      url: '/links',
      headers: {
        authorization: 'Bearer signed-jwt-token',
      },
      payload: {
        originalUrl: 'https://example.com/articles/clean-architecture',
      },
    });

    expect(rateLimitedResponse.statusCode).toBe(429);
    expect(rateLimitedResponse.json()).toEqual({
      message: TOO_MANY_REQUESTS_MESSAGE,
      statusCode: 429,
    });
    expect(createLinkUseCase.execute).toHaveBeenCalledTimes(
      WRITE_RATE_LIMIT.writeBurst.limit,
    );
  });

  it('PATCH /links/:id/disable should rate limit repeated authenticated disable requests', async () => {
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

    for (
      let attempt = 0;
      attempt < WRITE_RATE_LIMIT.writeBurst.limit;
      attempt += 1
    ) {
      const response = await app.inject({
        method: 'PATCH',
        url: '/links/link_123/disable',
        headers: {
          authorization: 'Bearer signed-jwt-token',
        },
      });

      expect(response.statusCode).toBe(200);
    }

    const rateLimitedResponse = await app.inject({
      method: 'PATCH',
      url: '/links/link_123/disable',
      headers: {
        authorization: 'Bearer signed-jwt-token',
      },
    });

    expect(rateLimitedResponse.statusCode).toBe(429);
    expect(rateLimitedResponse.json()).toEqual({
      message: TOO_MANY_REQUESTS_MESSAGE,
      statusCode: 429,
    });
    expect(disableOwnedLinkUseCase.execute).toHaveBeenCalledTimes(
      WRITE_RATE_LIMIT.writeBurst.limit,
    );
  });
});
