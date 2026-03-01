import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import 'reflect-metadata';
import {
  DocumentBuilder,
  SwaggerCustomOptions,
  SwaggerModule,
} from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // region Swagger setup
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Qonsensus API')
    .setDescription('API documentation for Qonsensus')
    .setVersion('1.0')
    .build();
  const swaggerUiOptions: SwaggerCustomOptions = {
    swaggerUrl: '/docs',
    jsonDocumentUrl: '/docs/spec',
  };
  const documentFactory = () =>
    SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('/docs', app, documentFactory, swaggerUiOptions);
  // endregion

  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
