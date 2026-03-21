import { type NestFastifyApplication } from '@nestjs/platform-fastify';
import { type TestingModuleBuilder } from '@nestjs/testing';
import {
  ACCESS_TOKEN_VERIFIER,
  type AccessTokenVerifier,
  type VerifiedAccessTokenPayload,
} from './../../../src/auth/application/ports/access-token-verifier';
import { PrismaService } from './../../../src/prisma/prisma.service';
import { createTestApp } from './../../support/create-test-app';

export interface MockLinkResult {
  readonly id: string;
  readonly originalUrl: string;
  readonly shortCode: string;
  readonly disabledAt: Date | null;
  readonly expiresAt: Date | null;
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
  readonly accessTokenVerifier: {
    verify: jest.Mock<Promise<VerifiedAccessTokenPayload>, [string]>;
  };
}

export async function createMockedLinksApp(
  prismaService: PrismaQueryExecutor,
  configureBuilder?: (builder: TestingModuleBuilder) => TestingModuleBuilder,
): Promise<MockedLinksApp> {
  const accessTokenVerifier = {
    verify: jest.fn<Promise<VerifiedAccessTokenPayload>, [string]>(),
  };

  const app = await createTestApp({
    configureBuilder: (builder) => {
      const configuredBuilder = builder
        .overrideProvider(PrismaService)
        .useValue(prismaService)
        .overrideProvider(ACCESS_TOKEN_VERIFIER)
        .useValue(accessTokenVerifier satisfies AccessTokenVerifier);

      return configureBuilder?.(configuredBuilder) ?? configuredBuilder;
    },
  });

  return {
    app,
    accessTokenVerifier,
  };
}
