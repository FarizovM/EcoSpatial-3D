import { useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { ColumnLayer } from '@deck.gl/layers';
import type { MapViewState } from '@deck.gl/core';
import Map, { Source, Layer } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css'; // стилі для карти
import { useSensorStore, type MetricType, METRICS } from '../store/useSensorStore';

// Початкова позиція камери (центр Києва, нахил 45 градусів для 3D ефекту)
const INITIAL_VIEW_STATE: MapViewState = {
    longitude: 30.5234,
    latitude: 50.4501,
    zoom: 11.5,
    pitch: 45,
    bearing: 0,
};

// Налаштування для кожної метрики: множник висоти та пороги кольорів
const METRIC_CONFIG: { [key in MetricType]: { scale: number; thresholds: [number, number]; unit: string } } = {
    pm2_5: { scale: 50, thresholds: [20, 35], unit: 'µg/m³' },
    pm10: { scale: 30, thresholds: [40, 75], unit: 'µg/m³' },
    co2: { scale: 2, thresholds: [450, 550], unit: 'ppm' },
    temperature: { scale: 100, thresholds: [20, 35], unit: '°C' },
    humidity: { scale: 50, thresholds: [50, 70], unit: '%' },
};

// RGB кольори: [Зелений, Жовтий, Червоний]
const COLORS: [number, number, number, number][] = [
    [34, 197, 94, 255],
    [234, 179, 8, 255],
    [239, 68, 68, 255]
];

const MAP_STYLES = {
    dark: {
        version: 8,
        sources: { 'carto-dark': { type: 'raster', tiles: ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'], tileSize: 256 } },
        layers: [{ id: 'carto-dark-layer', type: 'raster', source: 'carto-dark', minzoom: 0, maxzoom: 22 }]
    },
    light: {
        version: 8,
        sources: { 'carto-light': { type: 'raster', tiles: ['https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png'], tileSize: 256 } },
        layers: [{ id: 'carto-light-layer', type: 'raster', source: 'carto-light', minzoom: 0, maxzoom: 22 }]
    },
    satellite: {
        version: 8,
        sources: { 'esri-sat': { type: 'raster', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], tileSize: 256 } },
        layers: [{ id: 'esri-sat-layer', type: 'raster', source: 'esri-sat', minzoom: 0, maxzoom: 22 }]
    }
};


export const Map3D = () => {
    const { sensors, latestMeasurements, activeMetric, activeMapStyleType, show3DBuildings } = useSensorStore();

    // Об'єднуємо статичні датчики з останніми показниками для рендеру
    const data = useMemo(() => {
        return sensors.map((sensor) => {
            const currentData = latestMeasurements[sensor.sensorId];
            return {
                ...sensor,
                pm2_5: currentData?.pm2_5 || 0,
                pm10: currentData?.pm10 || 0,
                co2: currentData?.co2 || 0,
                temperature: currentData?.temperature || 0,
                humidity: currentData?.humidity || 0,
            };
        });
    }, [sensors, latestMeasurements]);

    const config = METRIC_CONFIG[activeMetric as MetricType];

    // Створюємо 3D шар
    const layer = new ColumnLayer({
        id: `sensors-column-layer-${activeMetric as MetricType}`,
        data,
        diskResolution: 12, // Кількість граней (12 = циліндр, 6 = гексагон)
        radius: 150,        // Радіус стовпця в метрах
        extruded: true,     // Вмикаємо 3D витягування
        pickable: true,     // Дозволяємо наведення мишкою для тултипів
        elevationScale: config.scale, // Масштаб висоти (щоб стовпці були помітними)

        // Координати
        getPosition: (d: any) => [d.lng, d.lat],

        // Беремо значення активної метрики
        getElevation: (d: any) => d[activeMetric as MetricType] || 0,

        // Колір залежить від небезпеки (PM2.5 > 35 - червоний, > 20 - жовтий, інакше - зелений)
        getFillColor: (d: any) => {
            const val = d[activeMetric as MetricType];
            if (val > config.thresholds[1]) return COLORS[2];
            if (val > config.thresholds[0]) return COLORS[1];
            return COLORS[0];
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
                            <strong style="font-size: 16px;">${object.name}</strong>
                            <br/>
                            <span style="color: #94a3b8; font-size: 12px;">${object.description}</span>
                            <br/><br/>

                            ${METRICS.map((el) => (
                            `<div style="display: flex; justify-content: space-between; gap: 12px;">
                                    <span>${el.label}:</span> <strong style="color: ${activeMetric === el.key ? '#38bdf8' : '#fff'}">${object[el.key]}</strong>
                                </div>`
                        )
                        ).join('')}
                        </div>
                        `,
                        style: {
                            backgroundColor: '#1e293b',
                            color: '#f8fafc',
                            borderRadius: '8px',
                            border: '1px solid #334155',
                            boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.5)',
                        },
                    }
                }
            >
                {/* Темна тема CartoDB (безкоштовна, не потребує токена) */}
                <Map mapStyle={MAP_STYLES[activeMapStyleType] as any}>

                    {show3DBuildings && (
                        <Source
                            id="maptiler-v3"
                            type="vector"
                            // УВАГА: Для 3D будівель потрібні Векторні Тайли. 
                            // Отримай безкоштовний ключ на maptiler.com і встав замість YOUR_MAPTILER_KEY
                            url={`https://api.maptiler.com/tiles/v3/tiles.json?key=${import.meta.env.VITE_MAPTILER_KEY || 'YOUR_MAPTILER_KEY'}`}
                        >
                            <Layer
                                id="3d-buildings"
                                source="maptiler-v3"
                                source-layer="building" // Стандартна назва шару з будівлями в OSM
                                type="fill-extrusion"
                                minzoom={13} // Показувати тільки при наближенні
                                paint={{
                                    // Колір будівель підлаштовується під темну/світлу тему
                                    'fill-extrusion-color': activeMapStyleType === 'dark' ? '#1e293b' : '#e2e8f0',
                                    'fill-extrusion-height': ['get', 'render_height'],
                                    'fill-extrusion-base': ['get', 'render_min_height'],
                                    'fill-extrusion-opacity': 0.7,
                                }}
                            />
                        </Source>
                    )}

                </Map>
            </DeckGL>
        </div>
    );

};