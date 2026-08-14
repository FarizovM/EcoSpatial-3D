import { IsLatitude, IsLongitude, IsNotEmpty, IsOptional, IsString, } from "class-validator"

export class CreateSensorDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsLatitude()
    @IsNotEmpty()
    lat: number;

    @IsLongitude()
    @IsNotEmpty()
    lng: number;
}