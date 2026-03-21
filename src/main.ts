import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'reflect-metadata';
import {
  DocumentBuilder,
  SwaggerCustomOptions,
  SwaggerModule,
} from '@nestjs/swagger';
import { IncomingFriendRequestWsDto } from './notifications/dtos/incomingFriendRequest.ws.dto';
import { DataSource } from 'typeorm';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const dataSource = app.get(DataSource);
  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }
  await dataSource.runMigrations();

  // region Swagger setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Qonsensus API')
    .setDescription('API documentation for Qonsensus')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  const swaggerUiOptions: SwaggerCustomOptions = {
    swaggerUrl: '/docs',
    jsonDocumentUrl: '/docs/spec',
  };
  const documentFactory = () =>
    SwaggerModule.createDocument(app, swaggerConfig, {
      extraModels: [IncomingFriendRequestWsDto],
    });
  SwaggerModule.setup('/docs', app, documentFactory, swaggerUiOptions);
  // endregion

  app.enableCors({
    origin: ['http://localhost:3001'],
  });

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
