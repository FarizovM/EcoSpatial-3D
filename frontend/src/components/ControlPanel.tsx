import { useSensorStore, type MetricType } from '../store/useSensorStore';

const METRICS: { key: MetricType; label: string; unit: string }[] = [
    { key: 'pm2_5', label: 'PM 2.5', unit: 'µg/m³' },
    { key: 'pm10', label: 'PM 10', unit: 'µg/m³' },
    { key: 'co2', label: 'Рівень CO2', unit: 'ppm' },
    { key: 'temperature', label: 'Температура', unit: '°C' },
    { key: 'humidity', label: 'Вологість', unit: '%' },
];

export const ControlPanel = () => {
    const { activeMetric, setActiveMetric } = useSensorStore();

    return (
        <div className="absolute bottom-8 left-8 bg-slate-800/90 backdrop-blur-md p-4 rounded-xl border border-slate-700 shadow-2xl z-10 w-64">
            <h2 className="text-sm font-semibold text-slate-300 mb-4 uppercase tracking-wider">
                Аналітичний шар
            </h2>

            <div className="flex flex-col gap-2">
                {METRICS.map((metric) => {
                    const isActive = activeMetric === metric.key;
                    return (
                        <button
                            key={metric.key}
                            onClick={() => setActiveMetric(metric.key)}
                            className={`flex justify-between items-center px-4 py-2 rounded-lg text-sm transition-all duration-200 ${isActive
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                                : 'bg-slate-900/50 text-slate-400 border border-transparent hover:bg-slate-700'
                                }`}
                        >
                            <span>{metric.label}</span>
                            <span className={`text-xs ${isActive ? 'text-emerald-500/70' : 'text-slate-600'}`}>
                                {metric.unit}
                            </span>
                        </button>
                    );
                })}
            </div>

            <div className="mt-4 pt-4 border-t border-slate-700">
                <div className="flex justify-between text-[10px] text-slate-500">
                    <span>Норма</span>
                    <span>Увага</span>
                    <span>Небезпечно</span>
                </div>
                <div className="h-1.5 w-full rounded-full mt-1 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500"></div>
            </div>
        </div>
    );
}