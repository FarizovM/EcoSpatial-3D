import { useEffect } from 'react';
import axios from 'axios';
import { useSensorStore } from './store/useSensorStore';
import { Map3D } from './components/Map3D';
import { ControlPanel } from './components/ControlPanel';
import { LayerSwitcher } from './components/LayerSwitcher';

export default function App() {
  const {
    connectSocket,
    disconnectSocket,
    sensors,
    setSensors,
    zones,
    showZones,
    setZones
  } = useSensorStore();
  const API_URL = import.meta.env.VITE_API_URL;

  useEffect(() => {

    // 1. Завантажуємо статичні дані датчиків (їх координати)
    const fetchSensors = async () => {
      try {

        const response = await axios.get(`${API_URL}/sensors`);
        setSensors(response.data);

      } catch (error) {
        console.error('Помилка завантаження датчиків:', error);
      }
    };

    const fetchZones = async () => {
      try {
        const response = await axios.get(`${API_URL}/zones`);
        setZones(response.data);
      } catch (error) {
        console.error('Помилка завантаження зон:', error);
      }
    };

    fetchSensors();
    fetchZones();

    // 2. Підключаємо WebSockets для отримання стріму даних
    connectSocket();

    // Клінап при розмонтуванні
    return () => {
      disconnectSocket();
    };
  }, []);

  return (
    <div className="h-screen w-screen flex flex-col bg-slate-900 text-white overflow-hidden">
      <header className="p-4 border-b border-slate-700 bg-slate-800 flex justify-between items-center z-10 shadow-lg">
        <div>
          <h1 className="text-2xl font-bold bg-linear-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
            EcoSpatial 3D
          </h1>
          <p className="text-xs text-slate-400 mt-1">Real-time моніторинг якості повітря</p>
        </div>
        <div className="flex items-center gap-4 text-sm bg-slate-900 px-4 py-2 rounded-full border border-slate-700">
          <div className="flex items-center gap-2">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <span>Live Data</span>
          </div>
          <div className="w-px h-4 bg-slate-700"></div>
          <span>Активних датчиків: <strong className="text-emerald-400">{sensors.length}</strong></span>
          {showZones && (
            <>
              <div className="w-px h-4 bg-slate-700"></div>
              <span>Районів: <strong className="text-emerald-400">{zones.length}</strong></span>
            </>
          )}
        </div>
      </header>

      <main className="flex-1 relative">
        <Map3D />
        <LayerSwitcher />
        <ControlPanel />
      </main>
    </div >
  );
}