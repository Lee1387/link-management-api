import { type NestFastifyApplication } from '@nestjs/platform-fastify';
import { PrismaService } from './../../src/prisma/prisma.service';
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

describe('Links Create (db e2e)', () => {
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

  it('POST /links should create a short link through the real Prisma-backed flow', async () => {
    app = await createLinksDbApp();
    const email = `alex.${Date.now().toString(36)}@example.com`;
    createdEmails.add(email);

    await registerUser(app, email);
    const loginBody = await loginUser(app, email);
    const body = await createOwnedLink(
      app,
      loginBody.accessToken,
      'https://example.com/articles/clean-architecture',
    );

    expect(typeof body.id).toBe('string');
    expect(body.originalUrl).toBe(
      'https://example.com/articles/clean-architecture',
    );
    expect(typeof body.shortCode).toBe('string');
    expect(body.shortCode).not.toBe('');
    expect(typeof body.createdAt).toBe('string');
    expect(typeof body.updatedAt).toBe('string');

    createdLinkIds.add(body.id);

    const prismaService = app.get(PrismaService);
    const link = await prismaService.link.findUnique({
      where: {
        id: body.id,
      },
    });

    expect(link).not.toBeNull();
    expect(link).toMatchObject({
      originalUrl: 'https://example.com/articles/clean-architecture',
      shortCode: body.shortCode,
      userId: loginBody.user.id,
    });
  });
});
