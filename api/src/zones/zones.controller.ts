import { Controller, Get } from '@nestjs/common';
import { CacheKey, CacheTTL } from '@nestjs/cache-manager';

import { ZonesService } from './zones.service';
import { ZonesAnalyticsDto, ZoneSensorIdsDto } from './dto/zones.dto';

@Controller('zones')
export class ZonesController {
    constructor(private readonly zonesService: ZonesService) { }

    //1. Для відображення датчиків по зонах в UI
    @Get()
    @CacheKey('zones')
    @CacheTTL(600000) //Cache for 10 minutes 
    async findAllZones(): Promise<ZoneSensorIdsDto[]> {
        return this.zonesService.findAllZones();
    }


    //2. Розрахований середній рівень забруднення зон
    @Get('analytics')
    async calculateAveragePollution(): Promise<ZonesAnalyticsDto[]> {
        return this.zonesService.calculateAveragePollution();
    }
}
