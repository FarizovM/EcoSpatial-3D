import { Injectable, Logger, Inject } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { type Cache } from 'cache-manager';

import { PrismaService } from '../prisma/prisma.service';
//import { LiveDataGateway } from '../live-data/live-data.gateway';
import { CreateMeasurementsDto } from '../sensors/dto/create-measurements.dto';

@Injectable()
export class GeneratorService {
    private readonly logger = new Logger(GeneratorService.name);
    constructor(
        private readonly prisma: PrismaService,
        private readonly eventEmitter: EventEmitter2,
        //private readonly gateway: LiveDataGateway,
        @Inject(CACHE_MANAGER) private cacheManager: Cache,
    ) { };

    // Допоміжний метод для генерації випадкових чисел з 2 знаками після коми
    private random(min: number, max: number): number {
        return Number((Math.random() * (max - min) + min).toFixed(2));
    }

    @Cron(CronExpression.EVERY_10_SECONDS)
    async handleDataGeneration() {

        interface SensorId {
            sensor_id: string;
        }

        const cachedData = await this.cacheManager.get<SensorId[]>('sensors');
        let sensors: SensorId[] = [];

        if (!cachedData) {
            // 1. Отримуємо всі активні датчики
            const freshData: SensorId[] = await this.prisma.sensor.findMany({
                where: { is_active: true },
                select: { sensor_id: true },
            });

            if (freshData.length === 0) {
                this.logger.debug('Немає активних датчиків для генерації даних.');
                return;
            }

            await this.cacheManager.set('sensors', freshData);
            sensors = freshData;
        } else {
            sensors = cachedData;
        }



        // 2. Генеруємо масив нових показників
        const measurements: CreateMeasurementsDto[] = sensors.map((sensor) => {
            return {
                sensor_id: sensor.sensor_id,
                // Симулюємо реалістичні дані з невеликим рандомом
                pm2_5: this.random(5, 30),     // Норма PM2.5 (до 50)
                pm10: this.random(10, 80),     // Норма PM10
                co2: this.random(400, 600),    // Рівень CO2 на вулиці (ppm)
                temperature: this.random(15, 40), // Температура повітря 
                humidity: this.random(40, 70), // Вологість у відсотках
            };
        });


        // 3. Пакетне збереження в БД (один SQL-запит на всі датчики)
        try {
            const result = await this.prisma.airQualityMeasurement.createMany({
                data: measurements,
            });

            // Відправляємо щойно згенеровані дані всім активним клієнтам
            //this.gateway.broadcastNewMeasurements(measurements);
            this.eventEmitter.emit('measurements.new', measurements);

            this.logger.log(`Успішно згенеровано ${result.count} записів показників.`);
        } catch (error) {
            this.logger.error('Помилка при генерації даних', error);
        }
    }

}
