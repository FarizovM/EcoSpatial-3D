import { Module } from '@nestjs/common';
import { GeneratorService } from './generator.service';
import { LiveDataModule } from '../live-data/live-data.module';

@Module({
  providers: [GeneratorService],
  imports: [LiveDataModule],
})
export class GeneratorModule { }
