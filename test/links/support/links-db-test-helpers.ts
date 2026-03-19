import { type NestFastifyApplication } from '@nestjs/platform-fastify';
import { PrismaService } from './../../../src/prisma/prisma.service';
import { createTestApp } from './../../support/create-test-app';

const DEFAULT_PASSWORD = 'my-secure-password';

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

export function createLinksDbApp(): Promise<NestFastifyApplication> {
  return createTestApp();
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
  const response = await app.inject({
    method: 'POST',
    url: '/auth/register',
    payload: {
      email,
      password,
    },
  });

  if (response.statusCode !== 201) {
    throw new Error(
      `Expected register to return 201, received ${response.statusCode}.`,
    );
  }
}

export async function loginUser(
  app: NestFastifyApplication,
  email: string,
  password = DEFAULT_PASSWORD,
): Promise<LoginResponseBody> {
  const response = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: {
      email,
      password,
    },
  });

  if (response.statusCode !== 200) {
    throw new Error(
      `Expected login to return 200, received ${response.statusCode}.`,
    );
  }

  return response.json();
}

export async function createOwnedLink(
  app: NestFastifyApplication,
  accessToken: string,
  originalUrl: string,
): Promise<CreatedLinkBody> {
  const response = await app.inject({
    method: 'POST',
    url: '/links',
    headers: {
      authorization: `Bearer ${accessToken}`,
    },
    payload: {
      originalUrl,
    },
  });

  if (response.statusCode !== 201) {
    throw new Error(
      `Expected link creation to return 201, received ${response.statusCode}.`,
    );
  }

  return response.json();
}
