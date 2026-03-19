import { type NestFastifyApplication } from '@nestjs/platform-fastify';
import { PrismaService } from './../../src/prisma/prisma.service';
import { createTestApp } from './../support/create-test-app';
import {
  applyTestEnvironment,
  captureTestEnvironment,
  restoreTestEnvironment,
} from './../support/test-environment';

describe('Links (db e2e)', () => {
  const environmentSnapshot = captureTestEnvironment();
  const createdEmails = new Set<string>();
  const createdLinkIds = new Set<string>();
  let app: NestFastifyApplication | null = null;

  beforeAll(() => {
    applyTestEnvironment();
  });

  afterEach(async () => {
    if (app !== null) {
      const prismaService = app.get(PrismaService);

      if (createdLinkIds.size > 0) {
        await prismaService.link.deleteMany({
          where: {
            id: {
              in: [...createdLinkIds],
            },
          },
        });
      }

      if (createdEmails.size > 0) {
        await prismaService.user.deleteMany({
          where: {
            email: {
              in: [...createdEmails],
            },
          },
        });
      }

      createdEmails.clear();
      await app.close();
      app = null;
    }

    createdLinkIds.clear();
  });

  afterAll(() => {
    restoreTestEnvironment(environmentSnapshot);
  });

  async function createApp(): Promise<NestFastifyApplication> {
    return createTestApp();
  }

  it('POST /links should create a short link through the real Prisma-backed flow', async () => {
    app = await createApp();
    const email = `alex.${Date.now().toString(36)}@example.com`;
    createdEmails.add(email);

    await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email,
        password: 'my-secure-password',
      },
    });

    const loginResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email,
        password: 'my-secure-password',
      },
    });
    const loginBody: {
      accessToken: unknown;
      user: {
        id: unknown;
      };
    } = loginResponse.json();

    const response = await app.inject({
      method: 'POST',
      url: '/links',
      headers: {
        authorization: `Bearer ${loginBody.accessToken as string}`,
      },
      payload: {
        originalUrl: 'https://example.com/articles/clean-architecture',
      },
    });

    const body: {
      id: unknown;
      originalUrl: unknown;
      shortCode: unknown;
      createdAt: unknown;
      updatedAt: unknown;
    } = response.json();

    expect(response.statusCode).toBe(201);
    expect(typeof body.id).toBe('string');
    expect(body.originalUrl).toBe(
      'https://example.com/articles/clean-architecture',
    );
    expect(typeof body.shortCode).toBe('string');
    expect(body.shortCode).not.toBe('');
    expect(typeof body.createdAt).toBe('string');
    expect(typeof body.updatedAt).toBe('string');

    createdLinkIds.add(body.id as string);

    const prismaService = app.get(PrismaService);
    const link = await prismaService.link.findUnique({
      where: {
        id: body.id as string,
      },
    });

    expect(link).not.toBeNull();
    expect(link).toMatchObject({
      originalUrl: 'https://example.com/articles/clean-architecture',
      shortCode: body.shortCode,
      userId: loginBody.user.id,
    });
  });

  it('GET /links should return only the authenticated user owned links', async () => {
    app = await createApp();
    const ownerEmail = `owner.${Date.now().toString(36)}@example.com`;
    const otherEmail = `other.${Date.now().toString(36)}@example.com`;
    createdEmails.add(ownerEmail);
    createdEmails.add(otherEmail);

    await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: ownerEmail,
        password: 'my-secure-password',
      },
    });
    await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: otherEmail,
        password: 'my-secure-password',
      },
    });

    const ownerLoginResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: ownerEmail,
        password: 'my-secure-password',
      },
    });
    const ownerLoginBody: {
      accessToken: string;
    } = ownerLoginResponse.json();

    const otherLoginResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: otherEmail,
        password: 'my-secure-password',
      },
    });
    const otherLoginBody: {
      accessToken: string;
    } = otherLoginResponse.json();

    const ownerCreateResponse = await app.inject({
      method: 'POST',
      url: '/links',
      headers: {
        authorization: `Bearer ${ownerLoginBody.accessToken}`,
      },
      payload: {
        originalUrl: 'https://example.com/articles/owned-link',
      },
    });
    const ownerLinkBody: {
      id: string;
    } = ownerCreateResponse.json();
    createdLinkIds.add(ownerLinkBody.id);

    const otherCreateResponse = await app.inject({
      method: 'POST',
      url: '/links',
      headers: {
        authorization: `Bearer ${otherLoginBody.accessToken}`,
      },
      payload: {
        originalUrl: 'https://example.com/articles/other-link',
      },
    });
    const otherLinkBody: {
      id: string;
    } = otherCreateResponse.json();
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

  it('GET /links/:id should return only the authenticated user owned link details', async () => {
    app = await createApp();
    const ownerEmail = `owner.${Date.now().toString(36)}@example.com`;
    const otherEmail = `other.${Date.now().toString(36)}@example.com`;
    createdEmails.add(ownerEmail);
    createdEmails.add(otherEmail);

    await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: ownerEmail,
        password: 'my-secure-password',
      },
    });
    await app.inject({
      method: 'POST',
      url: '/auth/register',
      payload: {
        email: otherEmail,
        password: 'my-secure-password',
      },
    });

    const ownerLoginResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: ownerEmail,
        password: 'my-secure-password',
      },
    });
    const ownerLoginBody: {
      accessToken: string;
    } = ownerLoginResponse.json();

    const otherLoginResponse = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        email: otherEmail,
        password: 'my-secure-password',
      },
    });
    const otherLoginBody: {
      accessToken: string;
    } = otherLoginResponse.json();

    const ownerCreateResponse = await app.inject({
      method: 'POST',
      url: '/links',
      headers: {
        authorization: `Bearer ${ownerLoginBody.accessToken}`,
      },
      payload: {
        originalUrl: 'https://example.com/articles/owned-link-details',
      },
    });
    const ownerLinkBody: {
      id: string;
      originalUrl: string;
    } = ownerCreateResponse.json();
    createdLinkIds.add(ownerLinkBody.id);

    const otherCreateResponse = await app.inject({
      method: 'POST',
      url: '/links',
      headers: {
        authorization: `Bearer ${otherLoginBody.accessToken}`,
      },
      payload: {
        originalUrl: 'https://example.com/articles/other-link-details',
      },
    });
    const otherLinkBody: {
      id: string;
    } = otherCreateResponse.json();
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
