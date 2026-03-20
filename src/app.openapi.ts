import { type NestFastifyApplication } from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function setupOpenApi(app: NestFastifyApplication): void {
  const config = new DocumentBuilder()
    .setTitle('BranchlyAPI')
    .setDescription(
      'Backend API for creating, managing, and tracking shortened links.',
    )
    .setVersion('0.0.1')
    .addTag('auth', 'Authentication and account registration endpoints')
    .addTag('health', 'Operational health and readiness checks')
    .addTag('links', 'Link creation and management endpoints')
    .addTag('redirects', 'Public short-code resolution endpoints')
    .build();

  const documentFactory = () =>
    SwaggerModule.createDocument(app, config, {
      operationIdFactory: (_controllerKey, methodKey) => methodKey,
    });

  SwaggerModule.setup('docs', app, documentFactory, {
    jsonDocumentUrl: 'docs/json',
    customSiteTitle: 'BranchlyAPI Docs',
  });
}
