import { IsDate, IsNotEmpty, IsNumber, IsString, Min, Max } from "class-validator"

export class CreateMeasurementsDto {
    @IsString()
    @IsNotEmpty()
    sensor_id: string;

    @IsDate()
    created_at?: Date;

    @IsNumber()
    @Min(0)
    @Max(1000)
    pm2_5: number;

    @IsNumber()
    @Min(0)
    @Max(1000)
    pm10: number;

    @IsNumber()
    @Min(0)
    @Max(5000)
    co2: number;

    @IsNumber()
    @Min(-50)
    @Max(50)
    temperature: number;

    @IsNumber()
    @Min(0)
    @Max(100)
    humidity: number;
}