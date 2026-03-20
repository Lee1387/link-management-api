import { type NestFastifyApplication } from '@nestjs/platform-fastify';
import { PrismaService } from './../../../src/prisma/prisma.service';
import { createTestApp } from './../../support/create-test-app';

export async function createAuthDbApp(): Promise<NestFastifyApplication> {
  return createTestApp();
}

export async function cleanupAuthDbState(
  app: NestFastifyApplication | null,
  createdEmails: Set<string>,
): Promise<void> {
  if (app !== null) {
    const prismaService = app.get(PrismaService);

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

  createdEmails.clear();
}
