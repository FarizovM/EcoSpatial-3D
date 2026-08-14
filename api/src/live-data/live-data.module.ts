import { Module } from '@nestjs/common';
import { LiveDataGateway } from './live-data.gateway';

@Module({
  providers: [LiveDataGateway],
  exports: [LiveDataGateway], // Важливо експортувати, щоб його бачив сервіс-генератор
})
export class LiveDataModule { }
