import { create } from 'zustand';
import { io, Socket } from 'socket.io-client';

// Типізація наших даних
export interface Sensor {
    sensorId: string;
    name: string;
    description: string;
    lat: number;
    lng: number;
    isActive: boolean;
}

export interface Measurement {
    sensor_id: string;
    pm2_5: number;
    pm10: number;
    co2: number;
    temperature: number;
    humidity: number;
}

export interface Zone {
    name: string;
    color_hex: string;
    geom: object;
    sensor_ids?: string[];
}

export type MetricType = 'pm2_5' | 'pm10' | 'co2' | 'temperature' | 'humidity';
export type MapStyleType = 'dark' | 'light' | 'satellite';

interface SensorState {
    sensors: Sensor[];
    // Зберігаємо останні показники як словник (Record) для швидкого доступу O(1)
    latestMeasurements: Record<string, Measurement>;
    socket: Socket | null;
    activeMetric: MetricType;
    activeMapStyleType: MapStyleType;
    show3DBuildings: boolean;
    zones: Zone[];
    showZones: boolean;


    // Екшени
    setSensors: (sensors: Sensor[]) => void;
    setZones: (zones: Zone[]) => void;
    connectSocket: () => void;
    disconnectSocket: () => void;
    setActiveMetric: (metric: MetricType) => void;
    setActiveMapStyleType: (styleType: MapStyleType) => void;
    toggle3DBuildings: () => void;
    toggleZones: () => void;
}

export const METRICS: { key: MetricType; label: string; unit: string }[] = [
    { key: 'pm2_5', label: 'Рівень PM2.5', unit: 'µg/m³' },
    { key: 'pm10', label: 'Рівень PM10', unit: 'µg/m³' },
    { key: 'co2', label: 'CO2', unit: 'ppm' },
    { key: 'temperature', label: 'Температура', unit: '°C' },
    { key: 'humidity', label: 'Вологість', unit: '%' }
];

export const useSensorStore = create<SensorState>((set, get) => ({
    sensors: [],
    latestMeasurements: {},
    socket: null,
    activeMetric: 'pm2_5',
    activeMapStyleType: 'dark',
    show3DBuildings: false,
    zones: [],
    showZones: false,

    // Екшени
    setSensors: (sensors) => set({ sensors }),
    setZones: (zones) => set({ zones }),

    connectSocket: () => {
        // Уникаємо дублювання підключень
        if (get().socket) return;

        const socket = io('http://localhost:3000'); // URL нашого NestJS бекенду

        socket.on('connect', () => {
            console.log('🟢 Підключено до WebSocket сервера');
        });

        // Слухаємо нашу подію з бекенду
        socket.on('measurements_update', (newMeasurements: Measurement[]) => {
            set((state) => {
                // Оновлюємо словник новими даними
                const updatedMeasurements = { ...state.latestMeasurements };
                newMeasurements.forEach((m) => {
                    updatedMeasurements[m.sensor_id] = m;
                });
                return { latestMeasurements: updatedMeasurements };
            });
        });

        set({ socket });
    },

    disconnectSocket: () => {
        const { socket } = get();
        if (socket) {
            socket.disconnect();
            set({ socket: null });
        }
    },

    setActiveMetric: (metric) => set({ activeMetric: metric }),
    setActiveMapStyleType: (styleType) => set({ activeMapStyleType: styleType }),
    toggle3DBuildings: () => set((state) => ({ show3DBuildings: !state.show3DBuildings })),
    toggleZones: () => set((state) => ({ showZones: !state.showZones })),
}));