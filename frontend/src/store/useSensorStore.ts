// src/store/useSensorStore.ts
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

interface SensorState {
    sensors: Sensor[];
    // Зберігаємо останні показники як словник (Record) для швидкого доступу O(1)
    latestMeasurements: Record<string, Measurement>;
    socket: Socket | null;

    // Екшени
    setSensors: (sensors: Sensor[]) => void;
    connectSocket: () => void;
    disconnectSocket: () => void;
}

export const useSensorStore = create<SensorState>((set, get) => ({
    sensors: [],
    latestMeasurements: {},
    socket: null,

    setSensors: (sensors) => set({ sensors }),

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
}));