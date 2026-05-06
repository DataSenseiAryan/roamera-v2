'use client';

import { Cloud, CloudRain, Sun, CloudSnow, Zap, Wind } from 'lucide-react';
import { useWeatherForecast } from '@roamera/sdk';
import type { WeatherForecastDay } from '@roamera/types';

interface Props {
  lat: number;
  lng: number;
  date?: string;
}

function getWeatherIcon(code: number, size = 'h-5 w-5') {
  if (code === 0 || code === 1) return <Sun className={`${size} text-yellow-500`} />;
  if (code === 2 || code === 3) return <Cloud className={`${size} text-slate-400`} />;
  if (code >= 45 && code <= 48) return <Cloud className={`${size} text-slate-300`} />;
  if (code >= 51 && code <= 67) return <CloudRain className={`${size} text-blue-400`} />;
  if (code >= 71 && code <= 77) return <CloudSnow className={`${size} text-blue-200`} />;
  if (code >= 80 && code <= 82) return <CloudRain className={`${size} text-blue-500`} />;
  if (code >= 95) return <Zap className={`${size} text-yellow-600`} />;
  return <Wind className={`${size} text-slate-400`} />;
}

function ForecastDay({ day }: { day: WeatherForecastDay }) {
  const d = new Date(day.date);
  return (
    <div className="flex flex-col items-center gap-1 px-2 py-1.5 rounded-xl min-w-[52px]">
      <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
        {d.toLocaleDateString('en', { weekday: 'short' })}
      </span>
      {getWeatherIcon(day.weathercode, 'h-5 w-5')}
      <span className="text-xs font-bold text-slate-900 dark:text-white">{Math.round(day.tempMax)}°</span>
      <span className="text-xs text-slate-400">{Math.round(day.tempMin)}°</span>
      {day.precipitationProbability != null && day.precipitationProbability > 20 && (
        <span className="text-[10px] text-blue-500">{day.precipitationProbability}%</span>
      )}
    </div>
  );
}

export function WeatherWidget({ lat, lng, date }: Props) {
  const { data: forecast, isLoading } = useWeatherForecast(lat, lng, 7);

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-slate-900 rounded-xl p-3 flex items-center gap-2 text-sm text-slate-400 animate-pulse">
        <Sun className="h-4 w-4" />
        Loading weather...
      </div>
    );
  }

  if (!forecast || forecast.length === 0) return null;

  // Find the forecast day matching the given date, or show the first 5 days
  const targetDay = date ? forecast.find((d) => d.date === date) : null;

  if (targetDay) {
    return (
      <div className="flex items-center gap-2 bg-sky-50 dark:bg-sky-900/20 rounded-xl px-3 py-2">
        {getWeatherIcon(targetDay.weathercode)}
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-white">
            {Math.round(targetDay.tempMax)}° / {Math.round(targetDay.tempMin)}°
          </p>
          <p className="text-xs text-slate-500 dark:text-slate-400">{targetDay.description}</p>
        </div>
        {targetDay.precipitationProbability != null && targetDay.precipitationProbability > 20 && (
          <span className="ml-auto text-xs text-blue-500 font-medium">
            🌧 {targetDay.precipitationProbability}%
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-slate-900 rounded-xl p-3 shadow-sm overflow-x-auto">
      <p className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2">7-day forecast</p>
      <div className="flex gap-1">
        {forecast.slice(0, 7).map((day) => (
          <ForecastDay key={day.date} day={day} />
        ))}
      </div>
    </div>
  );
}
