import { type NestFastifyApplication } from '@nestjs/platform-fastify';
import {
  cleanupLinksDbState,
  createLinksDbApp,
  createOwnedLink,
  loginUser,
  registerUser,
} from './support/links-db-test-helpers';
import {
  applyTestEnvironment,
  captureTestEnvironment,
  restoreTestEnvironment,
} from './../support/test-environment';

describe('Links List (db e2e)', () => {
  const environmentSnapshot = captureTestEnvironment();
  const createdEmails = new Set<string>();
  const createdLinkIds = new Set<string>();
  let app: NestFastifyApplication | null = null;

  beforeAll(() => {
    applyTestEnvironment();
  });

  afterEach(async () => {
    await cleanupLinksDbState(app, createdLinkIds, createdEmails);
    app = null;
    createdLinkIds.clear();
    createdEmails.clear();
  });

  afterAll(() => {
    restoreTestEnvironment(environmentSnapshot);
  });

  it('GET /links should return only the authenticated user owned links', async () => {
    app = await createLinksDbApp();
    const ownerEmail = `owner.${Date.now().toString(36)}@example.com`;
    const otherEmail = `other.${Date.now().toString(36)}@example.com`;
    createdEmails.add(ownerEmail);
    createdEmails.add(otherEmail);

    await registerUser(app, ownerEmail);
    await registerUser(app, otherEmail);

    const ownerLoginBody = await loginUser(app, ownerEmail);
    const otherLoginBody = await loginUser(app, otherEmail);

    const ownerLinkBody = await createOwnedLink(
      app,
      ownerLoginBody.accessToken,
      'https://example.com/articles/owned-link',
    );
    createdLinkIds.add(ownerLinkBody.id);

    const otherLinkBody = await createOwnedLink(
      app,
      otherLoginBody.accessToken,
      'https://example.com/articles/other-link',
    );
    createdLinkIds.add(otherLinkBody.id);

    const response = await app.inject({
      method: 'GET',
      url: '/links',
      headers: {
        authorization: `Bearer ${ownerLoginBody.accessToken}`,
      },
    });
    const body: Array<{
      id: unknown;
      originalUrl: unknown;
      shortCode: unknown;
      createdAt: unknown;
      updatedAt: unknown;
    }> = response.json();

    expect(response.statusCode).toBe(200);
    expect(body).toHaveLength(1);
    expect(body[0]).toMatchObject({
      id: ownerLinkBody.id,
      originalUrl: 'https://example.com/articles/owned-link',
    });
  });
});
