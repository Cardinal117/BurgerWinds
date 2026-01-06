import React, { useMemo } from 'react'
import { ForecastHour, ForecastBundle } from '../lib/openMeteo'
import { formatWindSpeed, degToCompass, fmtTime, fmtDay, WindUnit } from '../lib/format'

interface HourlyForecastProps {
  bundle: ForecastBundle | null
  hourlyFilter: '6h' | '24h' | '7d'
  onHourlyFilterChange: (filter: '6h' | '24h' | '7d') => void
  unit: WindUnit
  theme: 'light' | 'dark'
  viewMode: 'casual' | 'surfer' | 'everything' | 'custom'
}

export function HourlyForecast({ bundle, hourlyFilter, onHourlyFilterChange, unit, theme, viewMode }: HourlyForecastProps) {
  const hoursToShow = useMemo(() => {
    if (!bundle?.hours?.length) return []
    
    const hoursToTake = hourlyFilter === '6h' ? 6 : hourlyFilter === '24h' ? 24 : 168 // 7 days = 168 hours
    return bundle.hours.slice(0, hoursToTake)
  }, [bundle, hourlyFilter])

  const getDirectionColor = (deg: number) => {
    const colors = [
      'text-blue-500', 'text-blue-400', 'text-green-500', 'text-green-400',
      'text-yellow-500', 'text-yellow-400', 'text-orange-500', 'text-orange-400',
      'text-red-500', 'text-red-400'
    ]
    const index = Math.round(deg / 36) % 10
    return colors[index]
  }

  const getWeatherIcon = (hour: ForecastHour) => {
    if (hour.precipitationProbabilityPct && hour.precipitationProbabilityPct > 50) return '💧'
    if (hour.cloudCoverPct > 70) return '☁️'
    if (hour.cloudCoverPct > 30) return '⛅'
    return '☀️'
  }

  const getWeatherCondition = (hour: ForecastHour) => {
    if (hour.precipitationProbabilityPct && hour.precipitationProbabilityPct > 30) {
      return `${Math.round(hour.precipitationProbabilityPct)}% rain`
    }
    if (hour.cloudCoverPct > 70) return 'Cloudy'
    if (hour.cloudCoverPct > 30) return 'Partly cloudy'
    return 'Clear'
  }

  const getWindIcon = (speed: number) => {
    if (speed > 30) return '🌪️'
    if (speed > 15) return '💨'
    return '🍃'
  }

  if (!bundle) return null

  return (
    <section className="mb-8">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>Hourly Forecast</h2>
          <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            {hourlyFilter === '6h' ? 'Next 6 hours' : hourlyFilter === '24h' ? 'Next 24 hours' : 'Next 7 days'}
          </p>
        </div>
        
        {/* Filter buttons */}
        <div className={`inline-flex rounded-xl border p-1 ${theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
          }`}>
          {(['6h', '24h', '7d'] as const).map((filter) => (
            <button
              key={filter}
              onClick={() => onHourlyFilterChange(filter)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${hourlyFilter === filter
                  ? theme === 'dark'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-500 text-white'
                  : theme === 'dark'
                    ? 'text-slate-300 hover:bg-slate-700'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              {filter === '6h' ? '6h' : filter === '24h' ? '24h' : '7d'}
            </button>
          ))}
        </div>
      </div>

      {/* Table-like layout */}
      <div className={`overflow-hidden rounded-2xl border ${theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
        {/* Header */}
        <div className={`grid grid-cols-8 gap-4 border-b p-3 text-xs font-semibold uppercase tracking-wide ${
          theme === 'dark' ? 'border-slate-700 text-blue-400' : 'border-slate-200 text-blue-600'
        }`}>
          <div>Time</div>
          <div>Date</div>
          <div>Temp</div>
          <div>Weather</div>
          <div>Wind</div>
          <div>Humidity</div>
          {(viewMode === 'surfer' || viewMode === 'everything') && <div>Waves</div>}
        </div>

        {/* Rows */}
        <div className="max-h-96 overflow-y-auto">
          {hoursToShow.map((hour, index) => {
            const isCurrentHour = Math.abs(new Date(hour.time).getTime() - Date.now()) < 30 * 60 * 1000
            const isToday = new Date(hour.time).toDateString() === new Date().toDateString()
            const isTomorrow = new Date(hour.time).toDateString() === new Date(Date.now() + 86400000).toDateString()
            
            return (
              <div
                key={hour.time}
                className={`grid grid-cols-8 gap-4 border-b p-3 text-sm transition-colors hover:${
                  theme === 'dark' ? 'bg-slate-700' : 'bg-blue-50'
                } ${isCurrentHour
                  ? theme === 'dark'
                    ? 'border-blue-500 bg-blue-900/50'
                    : 'border-blue-400 bg-blue-100'
                  : theme === 'dark'
                    ? 'border-slate-700'
                    : 'border-slate-200'
                }`}
              >
                <div>
                  <div className={`font-medium ${
                    isCurrentHour
                      ? theme === 'dark' ? 'text-blue-400' : 'text-blue-700'
                      : theme === 'dark' ? 'text-slate-200' : 'text-slate-900'
                  }`}>
                    {fmtTime(hour.time, bundle.timezone)}
                  </div>
                  {isCurrentHour && (
                    <span className="inline-flex items-center rounded-full bg-blue-500 px-2 py-1 text-xs text-white mt-1">
                      Now
                    </span>
                  )}
                </div>
                <div className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>
                  {isToday ? 'Today' : isTomorrow ? 'Tomorrow' : fmtDay(hour.time, bundle.timezone)}
                </div>
                <div className={`font-medium ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                  {Math.round(hour.temperatureC)}°
                  <div className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    Feels like {Math.round(hour.temperatureC - (hour.windSpeed10mKmh > 10 ? 2 : 0))}°
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl mb-1">{getWeatherIcon(hour)}</div>
                  <div className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    {getWeatherCondition(hour)}
                  </div>
                </div>
                <div>
                  <div className={`font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>
                    {formatWindSpeed(hour.windSpeed10mKmh, unit)}
                  </div>
                  <div className={`text-xs ${getDirectionColor(hour.windDirection10mDeg)}`}>
                    {degToCompass(hour.windDirection10mDeg)}
                  </div>
                  <div className="text-lg">{getWindIcon(hour.windSpeed10mKmh)}</div>
                </div>
                <div className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>
                  {Math.round(hour.humidityPct)}%
                </div>
                {(viewMode === 'surfer' || viewMode === 'everything') && (
                  <div className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}>
                    {hour.waveHeightM ? `${hour.waveHeightM.toFixed(1)}m` : '—'}
                    {hour.waterTempC && (
                      <div className="text-xs">
                        💧 {hour.waterTempC.toFixed(1)}°
                      </div>
                    )}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
