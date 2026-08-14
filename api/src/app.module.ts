import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { CacheModule } from '@nestjs/cache-manager';
import KeyvRedis from '@keyv/redis';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { SensorsModule } from './sensors/sensors.module';
import { GeneratorModule } from './generator/generator.module';
import { LiveDataModule } from './live-data/live-data.module';

@Module({
  imports: [
    PrismaModule,
    CacheModule.register({
      isGlobal: true, // Makes CacheModule available everywhere
      stores: [
        new KeyvRedis('redis://localhost:6379')
      ],
      ttl: 600000, // Time-To-Live in milliseconds (e.g., 600000 seconds)
    }),
    EventEmitterModule.forRoot(),
    SensorsModule,
    ScheduleModule.forRoot(),
    GeneratorModule,
    LiveDataModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
