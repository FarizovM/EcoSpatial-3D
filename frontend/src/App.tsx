import { useEffect } from 'react';
import axios from 'axios';
import { useSensorStore } from './store/useSensorStore';

export default function App() {
  const { sensors, connectSocket, disconnectSocket, setSensors, latestMeasurements } = useSensorStore();

  useEffect(() => {
    // 1. Завантажуємо статичні дані датчиків (їх координати)
    const fetchSensors = async () => {
      try {
        // Щоб це працювало, нам потрібно буде додати простий GET метод в SensorsController на бекенді
        const response = await axios.get('http://localhost:3000/sensors');
        setSensors(response.data);
      } catch (error) {
        console.error('Помилка завантаження датчиків:', error);
      }
    };

    fetchSensors();

    // 2. Підключаємо WebSockets для отримання стріму даних
    connectSocket();

    // Клінап при розмонтуванні
    return () => {
      disconnectSocket();
    };
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-900 text-white">
      {/* Хедер дашборду */}
      <header className="p-4 border-b border-slate-700 bg-slate-800 flex justify-between items-center z-10">
        <h1 className="text-xl font-bold bg-linear-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          EcoSpatial 3D
        </h1>
        <div className="flex gap-4 text-sm">
          <span>Активних датчиків: <strong className="text-emerald-400">{sensors.length}</strong></span>
        </div>
      </header>

      {/* Контейнер для майбутньої 3D карти */}
      <main className="flex-1 relative">
        <div className="absolute inset-0 flex items-center justify-center text-slate-500">
          {/* Тимчасовий вивід даних для перевірки */}
          <pre className="text-xs bg-slate-800 p-4 rounded-lg overflow-auto max-h-[80%] max-w-[80%]">
            {JSON.stringify(latestMeasurements, null, 2)}
          </pre>
        </div>
      </main>
    </div>
  );
}