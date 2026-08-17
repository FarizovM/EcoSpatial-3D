import { IsNotEmpty, IsNumber, IsObject, IsString } from "class-validator"


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