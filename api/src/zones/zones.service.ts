import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ZonesAnalyticsDto, ZoneSensorIdsDto } from './dto/zones.dto';


@Injectable()
export class ZonesService {
    constructor(private readonly prisma: PrismaService) { }

    //1. Розрахований середній рівень забруднення зон
    async calculateAveragePollution(): Promise<ZonesAnalyticsDto[]> {
        return await this.prisma.$queryRaw<ZonesAnalyticsDto[]>`
            select
            mz.name,
            mz.color_hex,
            st_asgeojson(mz.geom)::jsonb as geom,
            round((avg(aqm.pm2_5)::numeric), 2) as avg_pm2_5,
            round((avg(aqm.pm10)::numeric), 2) as avg_pm10,
            round((avg(aqm.co2)::numeric), 2) as avg_co2,
            round((avg(aqm.temperature)::numeric), 2) as avg_temperature,
            round((avg(aqm.humidity)::numeric), 2) as avg_humidity

            from monitoring_zones mz
            left join sensors s on st_intersects(s.geom, mz.geom)
            left join lateral (
                select
                *
                from air_quality_measurements aqm
                where aqm.sensor_id = s.sensor_id
                order by aqm.created_at desc
                limit 1
            ) aqm on true

            group by mz.name, mz.color_hex, mz.geom
            order by mz.name;
            `;

    };


    //2. Для відображення датчиків по зонах в UI
    async findAllZones(): Promise<ZoneSensorIdsDto[]> {
        return this.prisma.$queryRaw<ZoneSensorIdsDto[]>`
            SELECT 
                z.monitoring_zone_id, 
                z.name, 
                z.color_hex,
                ST_AsGeoJSON(z.geom)::jsonb as geom,
                array_agg(s.sensor_id) as sensor_ids
            FROM monitoring_zones z
            LEFT JOIN sensors s ON ST_Intersects(z.geom, s.geom)
            GROUP BY z.monitoring_zone_id, z.name, z.geom;
        `;
    };


}
