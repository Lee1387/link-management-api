import { type NestFastifyApplication } from '@nestjs/platform-fastify';
import {
  ACCESS_TOKEN_VERIFIER,
  type AccessTokenVerifier,
  type VerifiedAccessTokenPayload,
} from './../../../src/auth/application/ports/access-token-verifier';
import { CreateLinkUseCase } from './../../../src/links/application/use-cases/mutation/create-link.use-case';
import { DisableOwnedLinkUseCase } from './../../../src/links/application/use-cases/lifecycle/disable-owned-link.use-case';
import { EnableOwnedLinkUseCase } from './../../../src/links/application/use-cases/lifecycle/enable-owned-link.use-case';
import { GetOwnedLinkDetailsUseCase } from './../../../src/links/application/use-cases/query/get-owned-link-details.use-case';
import { ListOwnedLinksUseCase } from './../../../src/links/application/use-cases/query/list-owned-links.use-case';
import { PrismaService } from './../../../src/prisma/prisma.service';
import { createTestApp } from './../../support/create-test-app';

export interface MockLinkResult {
  readonly id: string;
  readonly originalUrl: string;
  readonly shortCode: string;
  readonly disabledAt: Date | null;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

export type PrismaQueryExecutor = {
  $queryRaw: jest.Mock<Promise<unknown>, [TemplateStringsArray, ...unknown[]]>;
  link: {
    create: jest.Mock;
  };
};

export function createMockedLinksPrismaQueryExecutor(): PrismaQueryExecutor {
  return {
    $queryRaw: jest.fn<
      Promise<unknown>,
      [TemplateStringsArray, ...unknown[]]
    >(),
    link: {
      create: jest.fn(),
    },
  };
}

export const TEST_VERIFIED_ACCESS_TOKEN_PAYLOAD: VerifiedAccessTokenPayload = {
  sub: 'user_123',
  email: 'alex@example.com',
  iat: 1,
  exp: 2,
};

export interface MockedLinksApp {
  readonly app: NestFastifyApplication;
  readonly createLinkUseCase: {
    execute: jest.Mock<
      Promise<MockLinkResult>,
      [{ originalUrl: string; userId: string }]
    >;
  };
  readonly disableOwnedLinkUseCase: {
    execute: jest.Mock<Promise<MockLinkResult | null>, [string, string]>;
  };
  readonly enableOwnedLinkUseCase: {
    execute: jest.Mock<Promise<MockLinkResult | null>, [string, string]>;
  };
  readonly getOwnedLinkDetailsUseCase: {
    execute: jest.Mock<Promise<MockLinkResult | null>, [string, string]>;
  };
  readonly listOwnedLinksUseCase: {
    execute: jest.Mock<
      Promise<MockLinkResult[]>,
      [string, { limit: number; offset: number }]
    >;
  };
  readonly accessTokenVerifier: {
    verify: jest.Mock<Promise<VerifiedAccessTokenPayload>, [string]>;
  };
}

export async function createMockedLinksApp(
  prismaService: PrismaQueryExecutor,
): Promise<MockedLinksApp> {
  const createLinkUseCase = {
    execute: jest.fn<
      Promise<MockLinkResult>,
      [{ originalUrl: string; userId: string }]
    >(),
  };
  const disableOwnedLinkUseCase = {
    execute: jest.fn<Promise<MockLinkResult | null>, [string, string]>(),
  };
  const enableOwnedLinkUseCase = {
    execute: jest.fn<Promise<MockLinkResult | null>, [string, string]>(),
  };
  const getOwnedLinkDetailsUseCase = {
    execute: jest.fn<Promise<MockLinkResult | null>, [string, string]>(),
  };
  const listOwnedLinksUseCase = {
    execute: jest.fn<
      Promise<MockLinkResult[]>,
      [string, { limit: number; offset: number }]
    >(),
  };
  const accessTokenVerifier = {
    verify: jest.fn<Promise<VerifiedAccessTokenPayload>, [string]>(),
  };

  const app = await createTestApp({
    configureBuilder: (builder) =>
      builder
        .overrideProvider(PrismaService)
        .useValue(prismaService)
        .overrideProvider(ACCESS_TOKEN_VERIFIER)
        .useValue(accessTokenVerifier satisfies AccessTokenVerifier)
        .overrideProvider(DisableOwnedLinkUseCase)
        .useValue(disableOwnedLinkUseCase)
        .overrideProvider(EnableOwnedLinkUseCase)
        .useValue(enableOwnedLinkUseCase)
        .overrideProvider(GetOwnedLinkDetailsUseCase)
        .useValue(getOwnedLinkDetailsUseCase)
        .overrideProvider(ListOwnedLinksUseCase)
        .useValue(listOwnedLinksUseCase)
        .overrideProvider(CreateLinkUseCase)
        .useValue(createLinkUseCase),
  });

  return {
    app,
    createLinkUseCase,
    disableOwnedLinkUseCase,
    enableOwnedLinkUseCase,
    getOwnedLinkDetailsUseCase,
    listOwnedLinksUseCase,
    accessTokenVerifier,
  };
}
