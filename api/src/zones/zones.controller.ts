import { Controller, Get } from '@nestjs/common';
// import { CacheKey, CacheTTL } from '@nestjs/cache-manager';

import { ZonesService } from './zones.service';
import { ZonesAnalyticsDto } from './dto/zones.dto';

@Controller('zones')
export class ZonesController {
    constructor(private readonly zonesService: ZonesService) { }

    @Get('analytics')
    async calculateAveragePollution(): Promise<ZonesAnalyticsDto[]> {
        return this.zonesService.calculateAveragePollution();
    }
}
