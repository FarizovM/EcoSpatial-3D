import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSensorDto } from './dto/create-sensor.dto';

@Injectable()
export class SensorsService {
    constructor(private readonly prisma: PrismaService) { }

    // 1. Створення датчика
    async create(dto: CreateSensorDto) {

        const result: object[] = await this.prisma.$queryRaw`
        INSERT INTO sensors (name, description, geom)
        VALUES (
            ${dto.name},
            ${dto.description || null},
            ST_SetSRID(ST_MakePoint(${dto.lng}, ${dto.lat}), 4326)
        )
        RETURNING 
            sensor_id as "sensorId", 
            name, 
            description, 
            is_active as "isActive", 
        created_at as "createdAt",
        ST_X(geom) as lng, 
        ST_Y(geom) as lat;
      `;

        // $queryRaw завжди повертає масив
        return result[0] as object;
    };


    // 2. Пошук датчиків у заданому радіусі (в метрах)
    async findInRadius(lat: number, lng: number, radiusInMeters: number) {

        const sensors: object[] = await this.prisma.$queryRaw`
        SELECT 
            sensor_id as "sensorId",
            name,
            description,
            is_active as "isActive",
            ST_X(geom) as lng,
            ST_Y(geom) as lat,
            ST_Distance(
                geom::geography,
                ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
            ) as distance
        FROM sensors
        WHERE ST_DWithin(
            geom::geography,
            ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
            ${radiusInMeters}
        )
        ORDER BY distance ASC;
    `;

        return sensors;
    }


    // 3. Отримуємо всі датчики без фільтрації
    async findAll() {
        const sensors: object[] = await this.prisma.$queryRaw`
        SELECT 
            sensor_id as "sensorId",
            name,
            description,
            is_active as "isActive",
            ST_X(geom) as lng,
            ST_Y(geom) as lat
        FROM sensors
        WHERE is_active;
    `;

        return sensors;
    }
}