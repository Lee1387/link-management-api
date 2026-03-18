import { ValidationPipe } from '@nestjs/common';
import helmet from '@fastify/helmet';
import { type NestFastifyApplication } from '@nestjs/platform-fastify';

export async function configureApp(app: NestFastifyApplication): Promise<void> {
  app.enableShutdownHooks();
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );
  await app.register(helmet, {
    global: true,
    // Nest's Swagger UI needs a looser CSP when served through Fastify.
    contentSecurityPolicy: {
      directives: {
        defaultSrc: [`'self'`],
        styleSrc: [`'self'`, `'unsafe-inline'`],
        imgSrc: [`'self'`, 'data:', 'validator.swagger.io'],
        scriptSrc: [`'self'`, `'unsafe-inline'`, 'https:'],
      },
    },
  });
}
