import {
    useSensorStore,
    type MapStyleType,
} from "../store/useSensorStore"

export const LayerSwitcher = () => {
    const { activeMapStyleType, setActiveMapStyleType, toggle3DBuildings, show3DBuildings } = useSensorStore();

    const mapTypes: { id: MapStyleType, label: string, img: string }[] = [
        { id: "dark", label: "Ніч", img: "https://a.basemaps.cartocdn.com/dark_all/13/4788/2762@2x.png" },
        { id: "light", label: "День", img: "https://a.basemaps.cartocdn.com/light_all/13/4788/2762@2x.png" },
        { id: "satellite", label: "Супутник", img: "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/13/4788/2762" },
    ];

    return (
        <div className="absolute top-24 right-8 bg-slate-800/90 backdrop-blur-md p-2 rounded-xl border border-slate-700 shadow-2xl z-10 w-40 flex flex-col gap-2">

            {/* Кнопки підкладок */}
            <div className="flex flex-col gap-1">
                {mapTypes.map((type) => (
                    <button
                        key={type.id}
                        onClick={() => setActiveMapStyleType(type.id)}
                        className={`px-3 py-1.5 text-xs text-left rounded-lg flex items-center justify-between transition-all ${activeMapStyleType === type.id
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50'
                            : 'text-slate-400 hover:bg-slate-700/50 hover:text-slate-300 border border-transparent'
                            }`}
                    >
                        {type.label}
                        <img src={type.img} alt={type.label} className="w-10 h-10 rounded-lg" />
                    </button>
                ))}
            </div>

            <div className="w-full h-px bg-slate-700 my-1"></div>

            {/* Тогл 3D будівель */}
            <label className="flex items-center justify-between px-2 py-1 cursor-pointer group">
                <span className="text-xs text-slate-400 group-hover:text-slate-300 transition-colors">
                    3D Будівлі
                </span>
                <div className="relative">
                    <input
                        type="checkbox"
                        className="sr-only"
                        checked={show3DBuildings}
                        onChange={toggle3DBuildings}
                    />
                    <div className={`block w-8 h-4 rounded-full transition-colors ${show3DBuildings ? 'bg-emerald-500' : 'bg-slate-600'}`}></div>
                    <div className={`dot absolute left-1 top-1 bg-white w-2 h-2 rounded-full transition-transform ${show3DBuildings ? 'transform translate-x-4' : ''}`}></div>
                </div>
            </label>

        </div>
    );

}