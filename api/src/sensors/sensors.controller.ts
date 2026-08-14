import { Controller, Post, Body, Get, Query, ParseFloatPipe, ParseIntPipe } from '@nestjs/common';
import { SensorsService } from './sensors.service';
import { CreateSensorDto } from './dto/create-sensor.dto';


@Controller('sensors')
export class SensorsController {
    constructor(private readonly sensorsService: SensorsService) { }

    // POST http://localhost:3000/sensors
    @Post()
    async create(@Body() createSensorDto: CreateSensorDto) {
        return this.sensorsService.create(createSensorDto);
    }

    // Get http://localhost:3000/sensors/search?lat=50.4501&lng=30.5234&radius=5000
    @Get('search')
    async search(
        @Query('lat', ParseFloatPipe) lat: number,
        @Query('lng', ParseFloatPipe) lng: number,
        @Query('radius', ParseIntPipe) radius: number
    ) {
        return this.sensorsService.findInRadius(lat, lng, radius);
    }

    // Get http://localhost:3000/sensors
    @Get()
    async findAll() {
        return this.sensorsService.findAll();
    }
}
