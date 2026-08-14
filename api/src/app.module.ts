import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { SensorsModule } from './sensors/sensors.module';
import { GeneratorModule } from './generator/generator.module';
import { LiveDataModule } from './live-data/live-data.module';

@Module({
  imports: [
    PrismaModule,
    SensorsModule,
    ScheduleModule.forRoot(),
    GeneratorModule,
    LiveDataModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
