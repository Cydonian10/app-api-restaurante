import { StandardSchemaValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI, defaultVersion: '1' });
  const settings = app.get(ConfigService);

  const origins = (settings.get<string>('CORS_ORIGINS') ?? '')
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);

  app.enableCors({ origin: origins, credentials: true });

  app.useGlobalPipes(new StandardSchemaValidationPipe());

  const swaggerConfig = new DocumentBuilder()
    .setTitle('API Restaurante')
    .setDescription('API de autenticación y gestión del restaurante')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  SwaggerModule.setup(
    'docs',
    app,
    () => SwaggerModule.createDocument(app, swaggerConfig),
    {
      swaggerOptions: { persistAuthorization: true, docExpansion: 'none' },
    },
  );

  const document = SwaggerModule.createDocument(app, swaggerConfig);

  SwaggerModule.setup('docs', app, document);

  await app.listen(process.env.PORT ?? 3000);
}
await bootstrap();
