import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { configureApp } from './configurar-aplicacion.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const port = Number(configService.get<string>('PORT', '3000'));
  configureApp(app);

  await app.listen(port);
  console.log(`API disponible en http://localhost:${port}/api/v1`);
}

await bootstrap();
