import { type NestFastifyApplication } from '@nestjs/platform-fastify';
import {
  createMockedLinksApp,
  createMockedLinksPrismaQueryExecutor,
  TEST_VERIFIED_ACCESS_TOKEN_PAYLOAD,
} from './support/create-mocked-links-app';
import {
  applyTestEnvironment,
  captureTestEnvironment,
  restoreTestEnvironment,
} from './../support/test-environment';

describe('Links Details (e2e)', () => {
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

  it('GET /links/:id should return the authenticated user owned link details', async () => {
    const mocked = await createMockedLinksApp(
      createMockedLinksPrismaQueryExecutor(),
    );
    app = mocked.app;
    mocked.accessTokenVerifier.verify.mockResolvedValue(
      TEST_VERIFIED_ACCESS_TOKEN_PAYLOAD,
    );
    mocked.getOwnedLinkDetailsUseCase.execute.mockResolvedValue({
      id: 'link_123',
      originalUrl: 'https://example.com/articles/clean-architecture',
      shortCode: 'abc123X',
      disabledAt: null,
      createdAt: new Date('2026-03-18T13:10:00.000Z'),
      updatedAt: new Date('2026-03-18T13:10:00.000Z'),
    });

    const response = await app.inject({
      method: 'GET',
      url: '/links/link_123',
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
      updatedAt: '2026-03-18T13:10:00.000Z',
    });
    expect(mocked.getOwnedLinkDetailsUseCase.execute).toHaveBeenCalledWith(
      'link_123',
      'user_123',
    );
  });

  it('GET /links/:id should return not found when the owned link does not exist', async () => {
    const mocked = await createMockedLinksApp(
      createMockedLinksPrismaQueryExecutor(),
    );
    app = mocked.app;
    mocked.accessTokenVerifier.verify.mockResolvedValue(
      TEST_VERIFIED_ACCESS_TOKEN_PAYLOAD,
    );
    mocked.getOwnedLinkDetailsUseCase.execute.mockResolvedValue(null);

    const response = await app.inject({
      method: 'GET',
      url: '/links/missing',
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
    expect(mocked.getOwnedLinkDetailsUseCase.execute).toHaveBeenCalledWith(
      'missing',
      'user_123',
    );
  });
});
