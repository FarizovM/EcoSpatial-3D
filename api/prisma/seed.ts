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

    // 2. Координати реальних районів Києва (по 3 станції на район)
    const kievSensors = [
        // Шевченківський / Центр
        { name: 'Майдан Незалежності', lat: 50.4504, lng: 30.5245, desc: 'Центр міста, головна площа' },
        { name: 'Університет ім. Шевченка', lat: 50.4443, lng: 30.5074, desc: 'Парк Шевченка' },

        // Оболонь
        { name: 'Оболонська набережна', lat: 50.5090, lng: 30.4980, desc: 'Оболонська набережна' },
        { name: 'Метро Мінська', lat: 50.5122, lng: 30.4987, desc: 'Метро Мінська, центр району' },
        { name: 'Парк Наталка', lat: 50.4985, lng: 30.5204, desc: 'Парк Наталка, берег Дніпра' },

        // Поділ
        { name: 'Контрактова площа', lat: 50.4650, lng: 30.5150, desc: 'Контрактова площа' },
        { name: 'Поштова площа', lat: 50.4590, lng: 30.5255, desc: 'Поштова площа, Фунікулер' },
        { name: 'Житній ринок', lat: 50.4632, lng: 30.5100, desc: 'Житній ринок, Нижній Вал' },

        // Дарниця
        { name: 'Дарницька площа', lat: 50.4435, lng: 30.6275, desc: 'Дарницька площа' },
        { name: 'Метро Позняки', lat: 50.3980, lng: 30.6358, desc: 'Метро Позняки, парк' },
        { name: 'Парк Партизанської слави', lat: 50.4185, lng: 30.6720, desc: 'Парк Партизанської слави' },

        // Голосієво
        { name: 'ВДНГ', lat: 50.3780, lng: 30.4795, desc: 'ВДНГ' },
        { name: 'Метро Васильківська', lat: 50.3935, lng: 30.4880, desc: 'Метро Васильківська' },
        { name: 'Голосіївський парк', lat: 50.3875, lng: 30.5015, desc: 'Центральний вхід у Голосіївський парк' },

        // Солом`янка
        { name: 'Севастопольська площа', lat: 50.4238, lng: 30.4614, desc: 'Севастопольська площа' },
        { name: 'Залізничний вокзал', lat: 50.4400, lng: 30.4885, desc: 'Центральний вокзал' },
        { name: 'НАУ / Відрадний', lat: 50.4395, lng: 30.4330, desc: 'Парк Відрадний' },

        // Троєщина / Деснянський
        { name: 'Парк Молодіжний', lat: 50.5100, lng: 30.6000, desc: 'Парк Молодіжний' },
        { name: 'ТРЦ Район', lat: 50.5170, lng: 30.5980, desc: 'Вулиця Лаврухіна' },
        { name: 'Парк Кіото', lat: 50.4645, lng: 30.6400, desc: 'Лісовий масив, Парк Кіото' },

        // Печерськ
        { name: 'Метро Печерська', lat: 50.4275, lng: 30.5400, desc: 'Метро Печерська' },
        { name: 'Ботанічний сад', lat: 50.4150, lng: 30.5600, desc: 'Ботанічний сад ім. Гришка' },
        { name: 'Маріїнський парк', lat: 50.4475, lng: 30.5385, desc: 'Маріїнський парк, МОЗ' },

        // Святошин
        { name: 'Метро Святошин', lat: 50.4578, lng: 30.3912, desc: 'Метро Святошин, Проспект Перемоги' },
        { name: 'Академмістечко', lat: 50.4645, lng: 30.3540, desc: 'Метро Академмістечко' },
        { name: 'Парк Совки', lat: 50.4365, lng: 30.3810, desc: 'Парк Совки' },

        // Лук`янівка
        { name: 'Лук`янівська площа', lat: 50.4605, lng: 30.4815, desc: 'Метро Лук`янівська' },
        { name: 'Татарка', lat: 50.4695, lng: 30.4885, desc: 'Мікрорайон Татарка' },
        { name: 'Сирецький парк', lat: 50.4720, lng: 30.4465, desc: 'Сирецький парк' },
    ];

    // 3. Зберігаємо датчики через $executeRaw (через PostGIS Unsupported тип)
    for (const s of kievSensors) {
        const sql: string[] = [];

        sql.push(`INSERT INTO sensors (name, description, geom)
            VALUES (
                ${s.name}, 
                ${s.desc}, 
                ST_SetSRID(ST_MakePoint(${s.lng}, ${s.lat}), 4326)
            );`);

        await prisma.$executeRaw`${sql.join('')}`;
    }
    console.log(`✅ Створено ${kievSensors.length} датчиків.`);

    // 4. Додаємо адміністративні райони Києва (MonitoringZone)
    await prisma.$executeRaw`TRUNCATE TABLE monitoring_zones CASCADE;`;
    const monitoringZones = [
        {
            name: 'Голосіївський район',
            color_hex: '#2ecc71',
            wkt: 'MULTIPOLYGON(((30.43 50.39, 30.55 50.41, 30.59 50.34, 30.53 50.30, 30.43 50.39)))',
        },
        {
            name: 'Дарницький район',
            color_hex: '#e74c3c',
            wkt: 'MULTIPOLYGON(((30.59 50.41, 30.70 50.43, 30.73 50.38, 30.61 50.36, 30.59 50.41)))',
        },
        {
            name: 'Деснянський район',
            color_hex: '#3498db',
            wkt: 'MULTIPOLYGON(((30.57 50.53, 30.67 50.55, 30.71 50.48, 30.58 50.47, 30.57 50.53)))',
        },
        {
            name: 'Дніпровський район',
            color_hex: '#f1c40f',
            wkt: 'MULTIPOLYGON(((30.56 50.48, 30.68 50.48, 30.66 50.43, 30.58 50.44, 30.56 50.48)))',
        },
        {
            name: 'Оболонський район',
            color_hex: '#9b59b6',
            wkt: 'MULTIPOLYGON(((30.42 50.55, 30.54 50.53, 30.50 50.48, 30.43 50.49, 30.42 50.55)))',
        },
        {
            name: 'Печерський район',
            color_hex: '#e67e22',
            wkt: 'MULTIPOLYGON(((30.52 50.44, 30.57 50.44, 30.56 50.40, 30.53 50.41, 30.52 50.44)))',
        },
        {
            name: 'Подільський район',
            color_hex: '#1abc9c',
            wkt: 'MULTIPOLYGON(((30.40 50.51, 30.52 50.48, 30.50 50.46, 30.42 50.47, 30.40 50.51)))',
        },
        {
            name: 'Святошинський район',
            color_hex: '#34495e',
            wkt: 'MULTIPOLYGON(((30.32 50.48, 30.40 50.47, 30.40 50.41, 30.34 50.42, 30.32 50.48)))',
        },
        {
            name: 'Солом`янський район',
            color_hex: '#d35400',
            wkt: 'MULTIPOLYGON(((30.41 50.45, 30.49 50.44, 30.46 50.40, 30.41 50.41, 30.41 50.45)))',
        },
        {
            name: 'Шевченківський район',
            color_hex: '#c0392b',
            wkt: 'MULTIPOLYGON(((30.42 50.48, 30.52 50.46, 30.50 50.44, 30.44 50.45, 30.42 50.48)))',
        }
    ];

    for (const zone of monitoringZones) {
        const sql: string[] = [];
        sql.push(`INSERT INTO "MonitoringZone" (name, color_hex, geom)
            VALUES (
                ${zone.name},
                ${zone.color_hex},
                ST_GeomFromText(${zone.wkt}, 4326)
            ) on conflict (name) do nothing;`);

        await prisma.$executeRaw`${sql.join('')}`;

    }
    console.log(`✅ Створено ${monitoringZones.length} адміністративних зон.`);


    /*
    // 5. Отримуємо їхні згенеровані ID
    const sensors = await prisma.sensor.findMany({ select: { sensor_id: true } });

    // 6. Генеруємо історичні дані (по 1 заміру кожну годину за останні 24 години)
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

    // Пакетно зберігаємо історичні дані
    const result = await prisma.airQualityMeasurement.createMany({
        data: measurements,
    });

    console.log(`✅ Згенеровано ${result.count} записів історичних даних.`);
    */
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