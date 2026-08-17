import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ZonesAnalyticsDto } from './dto/zones.dto';

@Injectable()
export class ZonesService {
    constructor(private readonly prisma: PrismaService) { }

    //1. Розрахований середній рівень забруднення зон
    async calculateAveragePollution() {
        const result: ZonesAnalyticsDto[] = await this.prisma.$queryRaw`
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

        return result;

    }


}
