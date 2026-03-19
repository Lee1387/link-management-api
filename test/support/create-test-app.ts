import { Test, type TestingModuleBuilder } from '@nestjs/testing';
import {
  FastifyAdapter,
  type NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { configureApp } from '../../src/app.bootstrap';
import { setupOpenApi } from '../../src/app.openapi';
import { AppModule } from '../../src/app.module';

export interface CreateTestAppOptions {
  readonly setupOpenApi?: boolean;
  readonly configureBuilder?: (
    builder: TestingModuleBuilder,
  ) => TestingModuleBuilder;
}

export async function createTestApp(
  options: CreateTestAppOptions = {},
): Promise<NestFastifyApplication> {
  const builder = Test.createTestingModule({
    imports: [AppModule],
  });

  const moduleFixture = await (
    options.configureBuilder?.(builder) ?? builder
  ).compile();

  const app = moduleFixture.createNestApplication<NestFastifyApplication>(
    new FastifyAdapter(),
  );

  await configureApp(app, 'test');

  if (options.setupOpenApi === true) {
    setupOpenApi(app);
  }

  await app.init();
  await app.getHttpAdapter().getInstance().ready();

  return app;
}
