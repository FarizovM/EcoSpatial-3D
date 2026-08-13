import { Global, Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Global() // Робимо модуль глобальним, щоб не імпортувати його в кожному іншому модулі
@Module({
  providers: [PrismaService],
  exports: [PrismaService], // Експортуємо сервіс
})
export class PrismaModule { }