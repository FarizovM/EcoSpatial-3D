export class CreateMeasurementsDto {
    sensor_id: string;
    created_at?: Date;
    pm2_5: number;
    pm10: number;
    co2: number;
    temperature: number;
    humidity: number;
}