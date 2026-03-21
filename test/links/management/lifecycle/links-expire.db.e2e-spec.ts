import { type NestFastifyApplication } from '@nestjs/platform-fastify';
import { PrismaService } from './../../../../src/prisma/prisma.service';
import {
  cleanupLinksDbState,
  createLinksDbApp,
  createOwnedLink,
  expireOwnedLink,
  loginUser,
  registerUser,
} from './../../support/links-db-test-helpers';
import {
  applyTestEnvironment,
  captureTestEnvironment,
  restoreTestEnvironment,
} from './../../../support/test-environment';

describe('Links Expire (db e2e)', () => {
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

  it('PATCH /links/:id/expire should update the authenticated user owned link expiry', async () => {
    app = await createLinksDbApp();
    const email = `owner.${Date.now().toString(36)}@example.com`;
    const expiresAt = '2026-04-01T12:00:00.000Z';
    createdEmails.add(email);

    await registerUser(app, email);
    const loginBody = await loginUser(app, email);
    const createdLink = await createOwnedLink(
      app,
      loginBody.accessToken,
      'https://example.com/articles/expire-me',
    );
    createdLinkIds.add(createdLink.id);

    const expiredLink = await expireOwnedLink(
      app,
      loginBody.accessToken,
      createdLink.id,
      expiresAt,
    );

    expect(expiredLink.id).toBe(createdLink.id);
    expect(expiredLink.expiresAt).toBe(expiresAt);
    expect(expiredLink.disabledAt).toBeNull();

    const prismaService = app.get(PrismaService);
    const persistedLink = await prismaService.link.findUnique({
      where: {
        id: createdLink.id,
      },
    });

    expect(persistedLink?.expiresAt?.toISOString()).toBe(expiresAt);
  });

  it('PATCH /links/:id/expire should return not found for another user link', async () => {
    app = await createLinksDbApp();
    const ownerEmail = `owner.${Date.now().toString(36)}@example.com`;
    const otherEmail = `other.${Date.now().toString(36)}@example.com`;
    createdEmails.add(ownerEmail);
    createdEmails.add(otherEmail);

    await registerUser(app, ownerEmail);
    await registerUser(app, otherEmail);

    const ownerLoginBody = await loginUser(app, ownerEmail);
    const otherLoginBody = await loginUser(app, otherEmail);

    const ownerLink = await createOwnedLink(
      app,
      ownerLoginBody.accessToken,
      'https://example.com/articles/owner-link',
    );
    createdLinkIds.add(ownerLink.id);

    const response = await app.inject({
      method: 'PATCH',
      url: `/links/${ownerLink.id}/expire`,
      headers: {
        authorization: `Bearer ${otherLoginBody.accessToken}`,
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
  });
});
