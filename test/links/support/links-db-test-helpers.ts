import { type NestFastifyApplication } from '@nestjs/platform-fastify';
import { PrismaService } from './../../../src/prisma/prisma.service';
import { createTestApp } from './../../support/create-test-app';

const DEFAULT_PASSWORD = 'my-secure-password';
type InjectRequest = Parameters<NestFastifyApplication['inject']>[0];
type InjectResponse = Awaited<ReturnType<NestFastifyApplication['inject']>>;

export interface LoginResponseBody {
  readonly accessToken: string;
  readonly tokenType: string;
  readonly user: {
    readonly id: string;
    readonly email: string;
  };
}

export interface CreatedLinkBody {
  readonly id: string;
  readonly originalUrl: string;
  readonly shortCode: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface ManagedOwnedLinkBody extends CreatedLinkBody {
  readonly disabledAt: string | null;
  readonly expiresAt: string | null;
}

export function createLinksDbApp(): Promise<NestFastifyApplication> {
  return createTestApp();
}

function authorizationHeader(accessToken: string): { authorization: string } {
  return {
    authorization: `Bearer ${accessToken}`,
  };
}

async function injectAndExpect(
  app: NestFastifyApplication,
  request: InjectRequest,
  expectedStatusCode: number,
  action: string,
): Promise<InjectResponse> {
  const response = await app.inject(request);

  if (response.statusCode !== expectedStatusCode) {
    throw new Error(
      `Expected ${action} to return ${expectedStatusCode}, received ${response.statusCode}.`,
    );
  }

  return response;
}

async function injectAndExpectJson<T>(
  app: NestFastifyApplication,
  request: InjectRequest,
  expectedStatusCode: number,
  action: string,
): Promise<T> {
  const response = await injectAndExpect(
    app,
    request,
    expectedStatusCode,
    action,
  );

  return response.json();
}

export async function cleanupLinksDbState(
  app: NestFastifyApplication | null,
  createdLinkIds: ReadonlySet<string>,
  createdEmails: ReadonlySet<string>,
): Promise<void> {
  if (app === null) {
    return;
  }

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

  await app.close();
}

export async function registerUser(
  app: NestFastifyApplication,
  email: string,
  password = DEFAULT_PASSWORD,
): Promise<void> {
  await injectAndExpect(
    app,
    {
      method: 'POST',
      url: '/auth/register',
      payload: {
        email,
        password,
      },
    },
    201,
    'register',
  );
}

export async function loginUser(
  app: NestFastifyApplication,
  email: string,
  password = DEFAULT_PASSWORD,
): Promise<LoginResponseBody> {
  return injectAndExpectJson<LoginResponseBody>(
    app,
    {
      method: 'POST',
      url: '/auth/login',
      payload: {
        email,
        password,
      },
    },
    200,
    'login',
  );
}

export async function createOwnedLink(
  app: NestFastifyApplication,
  accessToken: string,
  originalUrl: string,
): Promise<CreatedLinkBody> {
  return injectAndExpectJson<CreatedLinkBody>(
    app,
    {
      method: 'POST',
      url: '/links',
      headers: authorizationHeader(accessToken),
      payload: {
        originalUrl,
      },
    },
    201,
    'link creation',
  );
}

export async function disableOwnedLink(
  app: NestFastifyApplication,
  accessToken: string,
  id: string,
): Promise<ManagedOwnedLinkBody> {
  return injectAndExpectJson<ManagedOwnedLinkBody>(
    app,
    {
      method: 'PATCH',
      url: `/links/${id}/disable`,
      headers: authorizationHeader(accessToken),
    },
    200,
    'link disable',
  );
}

export async function enableOwnedLink(
  app: NestFastifyApplication,
  accessToken: string,
  id: string,
): Promise<ManagedOwnedLinkBody> {
  return injectAndExpectJson<ManagedOwnedLinkBody>(
    app,
    {
      method: 'PATCH',
      url: `/links/${id}/enable`,
      headers: authorizationHeader(accessToken),
    },
    200,
    'link enable',
  );
}

export async function expireOwnedLink(
  app: NestFastifyApplication,
  accessToken: string,
  id: string,
  expiresAt: string,
): Promise<ManagedOwnedLinkBody> {
  return injectAndExpectJson<ManagedOwnedLinkBody>(
    app,
    {
      method: 'PATCH',
      url: `/links/${id}/expire`,
      headers: authorizationHeader(accessToken),
      payload: {
        expiresAt,
      },
    },
    200,
    'link expiry update',
  );
}
