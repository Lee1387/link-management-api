import { type NestFastifyApplication } from '@nestjs/platform-fastify';
import { PrismaService } from './../../src/prisma/prisma.service';
import {
  cleanupLinksDbState,
  createLinksDbApp,
  createOwnedLink,
  disableOwnedLink,
  loginUser,
  registerUser,
} from './support/links-db-test-helpers';
import {
  applyTestEnvironment,
  captureTestEnvironment,
  restoreTestEnvironment,
} from './../support/test-environment';

describe('Links Disable (db e2e)', () => {
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

  it('PATCH /links/:id/disable should disable the authenticated user owned link', async () => {
    app = await createLinksDbApp();
    const email = `owner.${Date.now().toString(36)}@example.com`;
    createdEmails.add(email);

    await registerUser(app, email);
    const loginBody = await loginUser(app, email);
    const createdLink = await createOwnedLink(
      app,
      loginBody.accessToken,
      'https://example.com/articles/disable-me',
    );
    createdLinkIds.add(createdLink.id);

    const disabledLink = await disableOwnedLink(
      app,
      loginBody.accessToken,
      createdLink.id,
    );

    expect(disabledLink.id).toBe(createdLink.id);
    expect(disabledLink.disabledAt).not.toBeNull();

    const prismaService = app.get(PrismaService);
    const persistedLink = await prismaService.link.findUnique({
      where: {
        id: createdLink.id,
      },
    });

    expect(persistedLink?.disabledAt).not.toBeNull();
  });

  it('PATCH /links/:id/disable should return not found for another user link', async () => {
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
      url: `/links/${ownerLink.id}/disable`,
      headers: {
        authorization: `Bearer ${otherLoginBody.accessToken}`,
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
