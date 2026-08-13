import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
    constructor() {
        // 1. Створюємо пул з'єднань за допомогою драйвера pg
        const connectionString = process.env.DATABASE_URL;
        const pool = new Pool({ connectionString });

        // 2. Ініціалізуємо адаптер Prisma для PostgreSQL
        const adapter = new PrismaPg(pool);

        // 3. Передаємо адаптер у батьківський конструктор PrismaClient
        super({ adapter });
    }

    async onModuleInit() {
        await this.$connect();
    }

    async onModuleDestroy() {
        await this.$disconnect();
    }
}