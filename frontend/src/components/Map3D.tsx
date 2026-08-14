import { useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { ColumnLayer } from '@deck.gl/layers';
import type { MapViewState } from '@deck.gl/core';
import Map from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css'; // стилі для карти
import { useSensorStore } from '../store/useSensorStore';

// Початкова позиція камери (центр Києва, нахил 45 градусів для 3D ефекту)
const INITIAL_VIEW_STATE: MapViewState = {
    longitude: 30.5234,
    latitude: 50.4501,
    zoom: 11,
    pitch: 45,
    bearing: 0,
};

export const Map3D = () => {
    const { sensors, latestMeasurements } = useSensorStore();

    // Об'єднуємо статичні датчики з останніми показниками для рендеру
    const data = useMemo(() => {
        return sensors.map((sensor) => {
            const currentData = latestMeasurements[sensor.sensorId];
            return {
                ...sensor,
                // Якщо даних ще немає, ставимо 0
                pm2_5: currentData?.pm2_5 || 0,
                co2: currentData?.co2 || 0,
                temperature: currentData?.temperature || 0,
            };
        });
    }, [sensors, latestMeasurements]);


    // Створюємо 3D шар
    const layer = new ColumnLayer({
        id: 'sensors-column-layer',
        data,
        diskResolution: 12, // Кількість граней (12 = циліндр, 6 = гексагон)
        radius: 200,        // Радіус стовпця в метрах
        extruded: true,     // Вмикаємо 3D витягування
        pickable: true,     // Дозволяємо наведення мишкою для тултипів
        elevationScale: 50, // Масштаб висоти (щоб стовпці були помітними)

        // Координати
        getPosition: (d: any) => [d.lng, d.lat],

        // Висота залежить від рівня PM2.5
        getElevation: (d: any) => d.pm2_5,

        // Колір залежить від небезпеки (PM2.5 > 35 - червоний, > 20 - жовтий, інакше - зелений)
        getFillColor: (d: any) => {
            if (d.pm2_5 > 35) return [239, 68, 68, 255]; // Tailwind red-500
            if (d.pm2_5 > 20) return [234, 179, 8, 255]; // Tailwind yellow-500
            return [34, 197, 94, 255];                   // Tailwind green-500
        },

        // Плавна анімація при оновленні даних (сокети)
        transitions: {
            getElevation: 1000,
            getFillColor: 1000,
        },
    });

    return (
        <div className="absolute inset-0">
            <DeckGL
                initialViewState={INITIAL_VIEW_STATE}
                controller={true}
                layers={[layer]}
                // Налаштування підказки при наведенні
                getTooltip={({ object }: any) =>
                    object && {
                        html: `
              <div style="font-family: sans-serif; padding: 4px;">
                <strong style="font-size: 16px;">${object.name}</strong><br/>
                <span style="color: #cbd5e1;">${object.description}</span><br/><br/>
                PM2.5: <strong style="color: #38bdf8;">${object.pm2_5} µg/m³</strong><br/>
                CO2: <strong>${object.co2} ppm</strong><br/>
                Температура: <strong>${object.temperature}°C</strong>
              </div>
            `,
                        style: {
                            backgroundColor: '#1e293b', // Tailwind slate-800
                            color: '#fff',
                            borderRadius: '8px',
                            border: '1px solid #334155',
                        },
                    }
                }
            >
                {/* Темна тема CartoDB (безкоштовна, не потребує токена) */}
                <Map mapStyle="https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json" />
            </DeckGL>
        </div>
    );

};