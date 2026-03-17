import helmet from '@fastify/helmet';
import { type NestFastifyApplication } from '@nestjs/platform-fastify';

export async function configureApp(app: NestFastifyApplication): Promise<void> {
  app.enableShutdownHooks();
  await app.register(helmet, {
    global: true,
  });
}
