import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { CreateMeasurementsDto } from '../src/sensors/dto/create-measurements.dto';

// Підключаємо адаптер, як ми робили це в сервісі
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
    console.log('🌱 Починаємо наповнення бази даних...');

    // 1. Очищення бази (опціонально, щоб не дублювати дані при ручному запуску)
    await prisma.$executeRaw`TRUNCATE TABLE sensors CASCADE;`;

    // 2. Координати реальних районів Києва
    const kievSensors = [
        { name: 'Станція Хрещатик', lat: 50.4501, lng: 30.5234, desc: 'Центр міста' },
        { name: 'Станція Оболонь', lat: 50.5090, lng: 30.4980, desc: 'Оболонська набережна' },
        { name: 'Станція Поділ', lat: 50.4650, lng: 30.5150, desc: 'Контрактова площа' },
        { name: 'Станція Дарниця', lat: 50.4550, lng: 30.6350, desc: 'Дарницька площа' },
        { name: 'Станція Голосієво', lat: 50.3950, lng: 30.5100, desc: 'ВДНГ / Голосіївський парк' },
        { name: 'Станція Солом`янка', lat: 50.4300, lng: 30.4800, desc: 'Севастопольська площа' },
        { name: 'Станція Троєщина', lat: 50.5100, lng: 30.6000, desc: 'Парк Молодіжний' },
        { name: 'Станція Печерськ', lat: 50.4300, lng: 30.5400, desc: 'Метро Печерська' },
        { name: 'Станція Святошин', lat: 50.4550, lng: 30.3600, desc: 'Проспект Перемоги' },
        { name: 'Станція Лук`янівка', lat: 50.4600, lng: 30.4800, desc: 'Лук`янівська площа' },
    ];

    // 3. Зберігаємо датчики через $executeRaw (через PostGIS Unsupported тип)
    for (const s of kievSensors) {
        await prisma.$executeRaw`
      INSERT INTO sensors (name, description, geom)
      VALUES (
        ${s.name}, 
        ${s.desc}, 
        ST_SetSRID(ST_MakePoint(${s.lng}, ${s.lat}), 4326)
      )
    `;
    }
    console.log(`✅ Створено ${kievSensors.length} датчиків.`);

    // 4. Отримуємо їхні згенеровані ID
    const sensors = await prisma.sensor.findMany({ select: { sensor_id: true } });

    // 5. Генеруємо історичні дані (по 1 заміру кожну годину за останні 24 години)
    const measurements: CreateMeasurementsDto[] = [];
    const now = new Date();

    for (const sensor of sensors) {
        for (let hoursAgo = 24; hoursAgo >= 0; hoursAgo--) {
            const recordDate = new Date(now.getTime() - hoursAgo * 60 * 60 * 1000);

            measurements.push({
                sensor_id: sensor.sensor_id,
                created_at: recordDate,
                pm2_5: Number((Math.random() * (45 - 5) + 5).toFixed(2)),
                pm10: Number((Math.random() * (80 - 10) + 10).toFixed(2)),
                co2: Number((Math.random() * (600 - 400) + 400).toFixed(2)),
                temperature: Number((Math.random() * (25 - 15) + 15).toFixed(2)),
                humidity: Number((Math.random() * (70 - 40) + 40).toFixed(2)),
            });
        }
    }

    // Пакетно зберігаємо 240 записів (10 датчиків * 24 години)
    const result = await prisma.airQualityMeasurement.createMany({
        data: measurements,
    });

    console.log(`✅ Згенеровано ${result.count} записів історичних даних.`);
    console.log('🎉 База готова до роботи!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });