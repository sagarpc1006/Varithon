import React, { useState, useEffect } from "react";
import {
  ArrowLeft,
  Sun,
  Cloud,
  CloudRain,
  CloudLightning,
  Wind,
  Droplets,
  Eye,
  Thermometer,
  ShieldCheck,
  AlertTriangle,
  Compass,
  MapPin,
  RefreshCw,
  Clock,
  Umbrella,
  Sparkles,
  Info
} from "lucide-react";
import { UserSession, Language } from "../types";
import { api } from "../services/api";

interface WeatherViewProps {
  session: UserSession;
  language: Language;
  onBack: () => void;
}

interface WeatherLocation {
  temp_c: number;
  feels_like_c: number;
  condition: string;
  condition_code: string;
  humidity: number;
  precipitation_prob: number;
  wind_kph: number;
  uv_index: number;
  advisory: string;
  status: "optimal" | "caution" | "warning";
}

interface HourlyForecast {
  time: string;
  temp_c: number;
  condition: string;
  rain_prob: number;
  icon: string;
}

interface FiveDayForecast {
  day: string;
  halt: string;
  temp_high: number;
  temp_low: number;
  condition: string;
  rain_prob: number;
}

export const WeatherView: React.FC<WeatherViewProps> = ({
  session,
  language,
  onBack,
}) => {
  const [selectedHalt, setSelectedHalt] = useState<string>("Saswad");
  const [loading, setLoading] = useState<boolean>(true);
  const [weatherData, setWeatherData] = useState<{
    current: WeatherLocation;
    all_locations: Record<string, WeatherLocation>;
    hourly: HourlyForecast[];
    five_day_forecast: FiveDayForecast[];
    last_updated: string;
  } | null>(null);

  const halts = [
    "Alandi",
    "Pune",
    "Dive Ghat",
    "Saswad",
    "Jejuri",
    "Lonand",
    "Phaltan",
    "Natepute",
    "Velapur",
    "Pandharpur",
  ];

  const fetchWeather = async (halt: string) => {
    setLoading(true);
    try {
      const res = await api.get<any>(`/weather/?location=${encodeURIComponent(halt)}`);
      if (res) {
        setWeatherData(res);
      }
    } catch (err) {
      console.error("Failed to fetch weather:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWeather(selectedHalt);
  }, [selectedHalt]);

  const getWeatherIcon = (code: string, size = 28) => {
    switch (code) {
      case "sunny":
        return <Sun size={size} className="text-amber-400" />;
      case "partly_cloudy":
        return <Cloud size={size} className="text-blue-300" />;
      case "cloudy":
        return <Cloud size={size} className="text-slate-300" />;
      case "rain_light":
      case "rain_moderate":
        return <CloudRain size={size} className="text-sky-300" />;
      case "windy":
        return <Wind size={size} className="text-teal-300" />;
      default:
        return <Sun size={size} className="text-amber-400" />;
    }
  };

  const current = weatherData?.current;

  return (
    <div className="flex flex-col gap-6 w-full max-w-5xl mx-auto pb-10">
      {/* Top Header & Back Button */}
      <div className="flex items-center justify-between">
        <button
          id="btn-weather-back"
          onClick={onBack}
          className="flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-orange-600 bg-white hover:bg-orange-50 border border-slate-200 px-3.5 py-2 rounded-xl transition-all shadow-xs cursor-pointer"
        >
          <ArrowLeft size={14} />
          <span>Back to Pilgrim Hub</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </span>
          <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
            Live Route Weather Station
          </span>
        </div>
      </div>

      {/* Halt Selector Horizontal Scroll Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3 flex items-center gap-2 overflow-x-auto no-scrollbar">
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-2 flex-shrink-0 flex items-center gap-1.5">
          <MapPin size={13} className="text-orange-500" />
          Route Halts:
        </span>
        {halts.map((halt) => (
          <button
            key={halt}
            onClick={() => setSelectedHalt(halt)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer flex-shrink-0 ${
              selectedHalt === halt
                ? "bg-gradient-to-r from-orange-500 to-amber-600 text-white shadow-md shadow-orange-500/20"
                : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200/60"
            }`}
          >
            {halt}
          </button>
        ))}
      </div>

      {/* Hero Weather Card */}
      {current && (
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 border border-slate-800 shadow-2xl p-6 sm:p-8 text-white">
          <div className="absolute -top-12 -right-12 w-80 h-80 bg-blue-500/15 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 -left-12 w-80 h-80 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            {/* Left Main Temp & Location */}
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="bg-orange-500/20 text-orange-400 border border-orange-500/30 text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full">
                  Palkhi Route Sector
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  Updated: {weatherData?.last_updated || "Live"}
                </span>
              </div>

              <div className="flex items-baseline gap-4 mt-2">
                <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-white">
                  {selectedHalt}
                </h1>
                <div className="flex items-center gap-2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-xl">
                  {getWeatherIcon(current.condition_code, 22)}
                  <span className="text-sm font-bold text-slate-200">
                    {current.condition}
                  </span>
                </div>
              </div>

              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-5xl sm:text-6xl font-black text-white tracking-tighter">
                  {current.temp_c}°C
                </span>
                <span className="text-sm text-slate-300 font-medium">
                  Feels like {current.feels_like_c}°C
                </span>
              </div>
            </div>

            {/* Right Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full md:w-auto">
              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center">
                <Droplets size={18} className="text-sky-400 mb-1" />
                <span className="text-[10px] font-bold text-slate-300 uppercase">Humidity</span>
                <span className="text-lg font-bold text-white mt-0.5">{current.humidity}%</span>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center">
                <Umbrella size={18} className="text-blue-400 mb-1" />
                <span className="text-[10px] font-bold text-slate-300 uppercase">Rain Chance</span>
                <span className="text-lg font-bold text-white mt-0.5">{current.precipitation_prob}%</span>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center">
                <Wind size={18} className="text-teal-400 mb-1" />
                <span className="text-[10px] font-bold text-slate-300 uppercase">Wind Speed</span>
                <span className="text-lg font-bold text-white mt-0.5">{current.wind_kph} km/h</span>
              </div>

              <div className="bg-white/10 backdrop-blur-md border border-white/10 rounded-2xl p-3.5 flex flex-col items-center justify-center text-center">
                <Sun size={18} className="text-amber-400 mb-1" />
                <span className="text-[10px] font-bold text-slate-300 uppercase">UV Index</span>
                <span className="text-lg font-bold text-white mt-0.5">{current.uv_index}/10</span>
              </div>
            </div>
          </div>

          {/* Pilgrim Advisory Banner */}
          <div className="mt-6 pt-4 border-t border-white/10 flex items-start gap-3 bg-white/5 p-4 rounded-2xl">
            <ShieldCheck size={20} className="text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider">
                Warkari Health & Safety Advisory
              </p>
              <p className="text-xs text-slate-200 mt-0.5 leading-relaxed font-medium">
                {current.advisory}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2-Column Section: Hourly Forecast + 5-Day Wari Progression */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left (7 Cols): 24-Hour Walking Hourly Forecast */}
        <div className="lg:col-span-7 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={16} className="text-orange-500" />
              <h3 className="text-sm font-bold text-slate-900">
                Today's Trekking Hours Forecast
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-400">
              {selectedHalt} Sector
            </span>
          </div>

          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
            {weatherData?.hourly.map((hr, idx) => (
              <div
                key={idx}
                className="bg-slate-50 border border-slate-100 rounded-xl p-3 flex flex-col items-center text-center gap-1.5 hover:bg-orange-50/50 hover:border-orange-200 transition-colors"
              >
                <span className="text-[10px] font-bold text-slate-400">{hr.time}</span>
                <div className="my-1">{getWeatherIcon(hr.icon, 20)}</div>
                <span className="text-sm font-black text-slate-800">{hr.temp_c}°</span>
                <span className="text-[10px] text-sky-600 font-bold flex items-center gap-0.5">
                  <Droplets size={10} />
                  {hr.rain_prob}%
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Right (5 Cols): 5-Day Palkhi Route Progression Forecast */}
        <div className="lg:col-span-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Compass size={16} className="text-orange-500" />
              <h3 className="text-sm font-bold text-slate-900">
                5-Day Palkhi Route Forecast
              </h3>
            </div>
          </div>

          <div className="flex flex-col divide-y divide-slate-100 text-xs">
            {weatherData?.five_day_forecast.map((f, idx) => (
              <div key={idx} className="py-2.5 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-bold text-slate-800 truncate">{f.day}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{f.halt}</p>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <span className="text-[11px] text-slate-500">{f.condition}</span>
                  <div className="text-right">
                    <span className="font-black text-slate-800">{f.temp_high}°</span>
                    <span className="text-slate-400 ml-1">/ {f.temp_low}°</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Safety Guidelines in Monsoon & Hot Weather */}
      <div className="bg-gradient-to-r from-orange-50 to-amber-50 rounded-2xl border border-orange-200/80 p-5 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <Sparkles size={16} className="text-orange-600" />
          <h3 className="text-xs font-bold text-orange-900 uppercase tracking-wider">
            Essential Wari Weather Guidelines
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-700">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-orange-100">
            <p className="font-bold text-slate-900 mb-1">🌧️ Rain Protection</p>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Carry light waterproof ponchos and pack clothes in poly-bags inside your backpack.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-orange-100">
            <p className="font-bold text-slate-900 mb-1">💧 Hydration & ORS</p>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Consume ORS and fresh buttermilk available at Seva stalls during high humidity stretches.
            </p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl p-3 border border-orange-100">
            <p className="font-bold text-slate-900 mb-1">👣 Foot & Blister Care</p>
            <p className="text-slate-600 text-[11px] leading-relaxed">
              Change wet socks at each rest halt. Free medical camps provide antiseptic foot powders.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
