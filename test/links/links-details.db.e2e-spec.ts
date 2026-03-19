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

describe('Links Details (db e2e)', () => {
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

  it('GET /links/:id should return only the authenticated user owned link details', async () => {
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
      'https://example.com/articles/owned-link-details',
    );
    createdLinkIds.add(ownerLinkBody.id);

    const otherLinkBody = await createOwnedLink(
      app,
      otherLoginBody.accessToken,
      'https://example.com/articles/other-link-details',
    );
    createdLinkIds.add(otherLinkBody.id);

    const response = await app.inject({
      method: 'GET',
      url: `/links/${ownerLinkBody.id}`,
      headers: {
        authorization: `Bearer ${ownerLoginBody.accessToken}`,
      },
    });
    const body: {
      id: unknown;
      originalUrl: unknown;
      shortCode: unknown;
      createdAt: unknown;
      updatedAt: unknown;
    } = response.json();

    expect(response.statusCode).toBe(200);
    expect(body).toMatchObject({
      id: ownerLinkBody.id,
      originalUrl: ownerLinkBody.originalUrl,
    });

    const forbiddenResponse = await app.inject({
      method: 'GET',
      url: `/links/${ownerLinkBody.id}`,
      headers: {
        authorization: `Bearer ${otherLoginBody.accessToken}`,
      },
    });

    expect(forbiddenResponse.statusCode).toBe(404);
    expect(forbiddenResponse.json()).toEqual({
      message: 'Link not found.',
      error: 'Not Found',
      statusCode: 404,
    });
  });
});
