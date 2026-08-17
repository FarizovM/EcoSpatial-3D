import { useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { ColumnLayer, PolygonLayer } from '@deck.gl/layers';
import { MVTLayer } from '@deck.gl/geo-layers';
import type { MapViewState } from '@deck.gl/core';
import Map from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { useSensorStore, type MetricType, METRICS, type Zone } from '../store/useSensorStore';

// Початкова позиція камери (центр Києва, нахил 45° для 3D ефекту)
const INITIAL_VIEW_STATE: MapViewState = {
    longitude: 30.5234,
    latitude: 50.4501,
    zoom: 11.5,      // zoom 14 щоб будівлі одразу були видні
    pitch: 45,
    bearing: 0,
};

// Налаштування для кожної метрики
const METRIC_CONFIG: { [key in MetricType]: { scale: number; thresholds: [number, number]; unit: string } } = {
    pm2_5: { scale: 50, thresholds: [20, 35], unit: 'µg/m³' },
    pm10: { scale: 30, thresholds: [40, 75], unit: 'µg/m³' },
    co2: { scale: 2, thresholds: [450, 550], unit: 'ppm' },
    temperature: { scale: 100, thresholds: [20, 35], unit: '°C' },
    humidity: { scale: 50, thresholds: [50, 70], unit: '%' },
};

type rgb = [number, number, number, number]

// RGB кольори: [Зелений, Жовтий, Червоний]
const COLORS: rgb[] = [
    [34, 197, 94, 255],
    [234, 179, 8, 255],
    [239, 68, 68, 255],
];

const MAP_STYLES = {
    dark: {
        version: 8,
        sources: { 'carto-dark': { type: 'raster', tiles: ['https://a.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'], tileSize: 256 } },
        layers: [{ id: 'carto-dark-layer', type: 'raster', source: 'carto-dark', minzoom: 0, maxzoom: 22 }],
    },
    light: {
        version: 8,
        sources: { 'carto-light': { type: 'raster', tiles: ['https://a.basemaps.cartocdn.com/light_all/{z}/{x}/{y}@2x.png'], tileSize: 256 } },
        layers: [{ id: 'carto-light-layer', type: 'raster', source: 'carto-light', minzoom: 0, maxzoom: 22 }],
    },
    satellite: {
        version: 8,
        sources: { 'esri-sat': { type: 'raster', tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'], tileSize: 256 } },
        layers: [{ id: 'esri-sat-layer', type: 'raster', source: 'esri-sat', minzoom: 0, maxzoom: 22 }],
    },
};

const MAPTILER_API_KEY = import.meta.env.VITE_MAPTILER_KEY || '';
const BUILDINGS_TILES_URL = `https://api.maptiler.com/tiles/v3/{z}/{x}/{y}.pbf?key=${MAPTILER_API_KEY}`;

// Кольори будівель для кожної теми [R, G, B, A]
const BUILDING_COLORS: Record<string, [number, number, number, number]> = {
    dark: [45, 65, 95, 210],
    light: [170, 180, 200, 210],
    satellite: [60, 70, 90, 200],
};

/** Convert '#rrggbb' or '#rgb' hex string to [R, G, B] tuple for deck.gl */
function hexToRgb(hex: string): [number, number, number] {
    const clean = hex.replace('#', '');
    const full = clean.length === 3
        ? clean.split('').map(c => c + c).join('')
        : clean;
    const num = parseInt(full, 16);
    return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

export const Map3D = () => {
    const {
        sensors,
        latestMeasurements,
        activeMetric,
        activeMapStyleType,
        show3DBuildings,
        zones,
        showZones,
    } = useSensorStore();

    // Об'єднуємо датчики з останніми показниками
    const data = useMemo(() => {
        return sensors.map((sensor) => {
            const currentData = latestMeasurements[sensor.sensorId];
            return {
                ...sensor,
                pm2_5: currentData?.pm2_5 ?? 0,
                pm10: currentData?.pm10 ?? 0,
                co2: currentData?.co2 ?? 0,
                temperature: currentData?.temperature ?? 0,
                humidity: currentData?.humidity ?? 0,
            };
        });
    }, [sensors, latestMeasurements]);

    const zonesData = useMemo(() => {
        return zones.map((zone: Zone) => {
            const zoneData = data.filter(el => zone?.sensor_ids?.find(id => id === el.sensorId));

            // Merge array of {key: value} objects into a single flat object
            const avgZoneData = Object.assign({}, ...METRICS.map((m) => {
                const metricData = zoneData.map(el => el[m.key as MetricType]);
                const avg = metricData.length > 0
                    ? metricData.reduce((acc, item) => acc + item, 0) / metricData.length
                    : 0;
                return { [m.key]: avg };
            }));

            // Extract outer ring coords from GeoJSON
            const geomCoords = (zone.geom as { coordinates?: number[][][] })?.coordinates?.[0] ?? [];
            // convert hex color to [R,G,B]
            const rgb = hexToRgb((zone.color_hex as string) ?? '#888888');

            return {
                ...zone,
                ...avgZoneData,
                geomCoords,
                rgb,
            };
        });

    }, [zones, data]);


    const config = METRIC_CONFIG[activeMetric as MetricType];

    // ========================================================
    // 3D будівлі через MVTLayer — правильний підхід для DeckGL
    // MapLibre fill-extrusion конфліктує з WebGL контекстом DeckGL,
    // тому використовуємо MVTLayer який рендерить через DeckGL pipeline
    // ========================================================
    const buildingsLayer = useMemo(() => {
        if (!show3DBuildings) return null;

        const fillColor = BUILDING_COLORS[activeMapStyleType] ?? BUILDING_COLORS.dark;

        return new MVTLayer({
            id: '3d-buildings-mvt',
            data: BUILDINGS_TILES_URL,
            minZoom: 0,
            maxZoom: 14,
            pickable: false,
            binary: false,
            // renderSubLayers отримує features одного тайлу
            // Фільтруємо ТІЛЬКИ Polygon/MultiPolygon і виключаємо LineString/Point (дороги тощо)
            renderSubLayers: (props: any) => {
                const allFeatures: any[] = props.data || [];

                // Флетуємо MultiPolygon → окремі Polygon entries
                const polygons: { coords: number[][][]; elevation: number }[] = [];

                for (const f of allFeatures) {
                    const geom = f.geometry;
                    if (!geom) continue;

                    const elevation = Number(
                        f.properties?.render_height ?? f.properties?.height ?? 5
                    );

                    if (geom.type === 'Polygon') {
                        // coordinates[0] — зовнішнє кільце (outer ring)
                        polygons.push({ coords: geom.coordinates[0], elevation });
                    } else if (geom.type === 'MultiPolygon') {
                        for (const poly of geom.coordinates) {
                            polygons.push({ coords: poly[0], elevation });
                        }
                    }
                    // LineString, Point тощо — ігноруємо
                }

                if (!polygons.length) return null;

                return new PolygonLayer({
                    ...props,
                    id: `${props.id}-poly`,
                    data: polygons,
                    extruded: true,
                    wireframe: false,
                    filled: true,
                    stroked: false,
                    // coords — вже плоский масив [[lng,lat], ...] (outer ring)
                    getPolygon: (d: any) => d.coords,
                    getElevation: (d: any) => d.elevation,
                    getFillColor: fillColor,
                    material: {
                        ambient: 0.4,
                        diffuse: 0.6,
                        shininess: 24,
                        specularColor: [80, 90, 110],
                    },
                });
            },
        });
    }, [show3DBuildings, activeMapStyleType]);

    // Датчики — ColumnLayer
    const sensorsLayer = useMemo(() => new ColumnLayer({
        id: `sensors-column-layer-${activeMetric as MetricType}`,
        data,
        diskResolution: 12,
        radius: 150,
        extruded: true,
        pickable: true,
        elevationScale: config.scale,
        getPosition: (d: any) => [d.lng, d.lat],
        getElevation: (d: any) => d[activeMetric as MetricType] ?? 0,
        getFillColor: (d: any) => {
            const val = d[activeMetric as MetricType];
            if (val > config.thresholds[1]) return COLORS[2];
            if (val > config.thresholds[0]) return COLORS[1];
            return COLORS[0];
        },
        transitions: {
            getElevation: 1000,
            getFillColor: 1000,
        },
    }), [data, activeMetric, config]);

    // Зони (райони)

    const zonesLayer = useMemo(() => {
        if (!showZones) return null;

        return new PolygonLayer({
            id: 'zones-layer',
            data: zonesData,
            extruded: true,
            wireframe: false,
            filled: true,
            stroked: false,
            // geomCoords — outer ring [[lng,lat], ...] extracted from GeoJSON
            getPolygon: (d: any) => d.geomCoords,
            getElevation: (d: any) => (d[activeMetric as MetricType] ?? 0) * config.scale,
            getFillColor: (d: any) => [...d.rgb, 180] as rgb,
            material: {
                ambient: 0.4,
                diffuse: 0.6,
                shininess: 24,
                specularColor: [80, 90, 110],
            },
            updateTriggers: {
                getElevation: activeMetric,
                getFillColor: activeMetric,
            },
            transitions: {
                getElevation: 1000,
                getFillColor: 1000,
            },
        });

    }, [showZones, zonesData, activeMetric, config]);


    const layers = useMemo(
        () => [buildingsLayer, sensorsLayer, zonesLayer].filter(Boolean) as any[],
        [buildingsLayer, sensorsLayer, zonesLayer],
    );

    return (
        <div className="absolute inset-0">
            <DeckGL
                initialViewState={INITIAL_VIEW_STATE}
                controller={true}
                layers={layers}
                getTooltip={({ object }: any) =>
                    object && object.sensorId
                        ? {
                            html: `
                            <div style="font-family: sans-serif; padding: 4px;">
                                <strong style="font-size: 16px;">${object.name}</strong>
                                <br/>
                                <span style="color: #94a3b8; font-size: 12px;">${object.description}</span>
                                <br/><br/>
                                ${METRICS.map((el) =>
                                `<div style="display: flex; justify-content: space-between; gap: 12px;">
                                        <span>${el.label}:</span>
                                        <strong style="color: ${activeMetric === el.key ? '#38bdf8' : '#fff'}">${object[el.key]}</strong>
                                    </div>`
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
                        : null
                }
            >
                <Map
                    mapStyle={MAP_STYLES[activeMapStyleType] as any}
                    initialViewState={INITIAL_VIEW_STATE}
                />
            </DeckGL>
        </div>
    );
};
