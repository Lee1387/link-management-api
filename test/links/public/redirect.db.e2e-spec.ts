import { type NestFastifyApplication } from '@nestjs/platform-fastify';
import { PrismaService } from './../../../src/prisma/prisma.service';
import {
  cleanupLinksDbState,
  createLinksDbApp,
  createOwnedLink,
  disableOwnedLink,
  enableOwnedLink,
  loginUser,
  registerUser,
} from '../support/links-db-test-helpers';
import {
  applyTestEnvironment,
  captureTestEnvironment,
  restoreTestEnvironment,
} from './../../support/test-environment';

describe('Redirect (db e2e)', () => {
  const environmentSnapshot = captureTestEnvironment();
  const createdLinkIds = new Set<string>();
  const createdEmails = new Set<string>();
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

  function createApp(): Promise<NestFastifyApplication> {
    return createLinksDbApp();
  }

  it('GET /:shortCode should redirect through the real Prisma-backed lookup', async () => {
    app = await createApp();
    const prismaService = app.get(PrismaService);
    const email = `redirect.${Date.now().toString(36)}@example.com`;
    const shortCode = `db${Date.now().toString(36)}x`;
    createdEmails.add(email);

    const user = await prismaService.user.create({
      data: {
        email,
        passwordHash: 'hashed-password',
      },
    });

    const link = await prismaService.link.create({
      data: {
        originalUrl: 'https://example.com/articles/clean-architecture',
        shortCode,
        userId: user.id,
      },
    });
    createdLinkIds.add(link.id);

    const response = await app.inject({
      method: 'GET',
      url: `/${shortCode}`,
    });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe(
      'https://example.com/articles/clean-architecture',
    );
  });

  it('GET /:shortCode should return not found when the link is disabled', async () => {
    app = await createApp();
    const prismaService = app.get(PrismaService);
    const email = `disabled.${Date.now().toString(36)}@example.com`;
    const shortCode = `off${Date.now().toString(36)}x`;
    createdEmails.add(email);

    const user = await prismaService.user.create({
      data: {
        email,
        passwordHash: 'hashed-password',
      },
    });

    const link = await prismaService.link.create({
      data: {
        originalUrl: 'https://example.com/articles/disabled-link',
        shortCode,
        disabledAt: new Date('2026-03-20T10:00:00.000Z'),
        userId: user.id,
      },
    });
    createdLinkIds.add(link.id);

    const response = await app.inject({
      method: 'GET',
      url: `/${shortCode}`,
    });

    expect(response.statusCode).toBe(404);
    expect(response.json()).toEqual({
      message: 'Link not found.',
      error: 'Not Found',
      statusCode: 404,
    });
  });

  it('GET /:shortCode should redirect again after the owned link is re-enabled', async () => {
    app = await createApp();
    const email = `reenable.${Date.now().toString(36)}@example.com`;
    createdEmails.add(email);

    await registerUser(app, email);
    const loginBody = await loginUser(app, email);
    const createdLink = await createOwnedLink(
      app,
      loginBody.accessToken,
      'https://example.com/articles/re-enabled-link',
    );
    createdLinkIds.add(createdLink.id);

    await disableOwnedLink(app, loginBody.accessToken, createdLink.id);
    await enableOwnedLink(app, loginBody.accessToken, createdLink.id);

    const response = await app.inject({
      method: 'GET',
      url: `/${createdLink.shortCode}`,
    });

    expect(response.statusCode).toBe(302);
    expect(response.headers.location).toBe(
      'https://example.com/articles/re-enabled-link',
    );
  });
});
