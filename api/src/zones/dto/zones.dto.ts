import { IsNotEmpty, IsNumber, IsObject, IsString, IsArray, IsOptional, } from "class-validator"


export class ZonesAnalyticsDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    color_hex: string;

    @IsObject()
    geom: object;

    @IsNumber()
    @IsNotEmpty()
    avg_pm2_5: number;

    @IsNumber()
    @IsNotEmpty()
    avg_pm10: number;

    @IsNumber()
    @IsNotEmpty()
    avg_co2: number;

    @IsNumber()
    @IsNotEmpty()
    avg_temperature: number;

    @IsNumber()
    @IsNotEmpty()
    avg_humidity: number;
}

export class ZoneSensorIdsDto {
    @IsString()
    @IsNotEmpty()
    monitoring_zone_id: string;

    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    color_hex: string;

    @IsObject()
    @IsNotEmpty()
    geom: object;

    @IsArray()
    @IsOptional()
    sensor_ids?: string[];
}