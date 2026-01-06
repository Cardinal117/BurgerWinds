import React, { useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ReferenceLine } from 'recharts'
import { ForecastHour, ForecastBundle } from '../lib/openMeteo'
import { formatWindSpeed, degToCompass, fmtTime, fmtDay, WindUnit } from '../lib/format'
import { TrendingUp, Table, Calendar } from 'lucide-react'

interface HourlyForecastProps {
  bundle: ForecastBundle | null
  hourlyFilter: '6h' | '24h' | '7d'
  onHourlyFilterChange: (filter: '6h' | '24h' | '7d') => void
  unit: WindUnit
  theme: 'light' | 'dark'
  viewMode: 'casual' | 'surfer' | 'everything' | 'custom'
}

export function HourlyForecast({ bundle, hourlyFilter, onHourlyFilterChange, unit, theme, viewMode }: HourlyForecastProps) {
  const [selectedDay, setSelectedDay] = useState(0)
  const [showGraphs, setShowGraphs] = useState(viewMode === 'surfer')

  // Generate unique days from forecast data
  const availableDays = useMemo(() => {
    if (!bundle?.hours?.length) return []
    const days = new Map()
    bundle.hours.forEach(hour => {
      const dayKey = fmtDay(hour.time, bundle.timezone)
      if (!days.has(dayKey)) {
        days.set(dayKey, {
          label: dayKey,
          date: new Date(hour.time),
          hours: bundle.hours.filter(h => fmtDay(h.time, bundle.timezone) === dayKey)
        })
      }
    })
    return Array.from(days.values()).slice(0, 7)
  }, [bundle])

  // Filter hours based on selection
  const hoursToShow = useMemo(() => {
    if (!bundle?.hours?.length) return []
    
    if (selectedDay > 0 && availableDays[selectedDay - 1]) {
      // Show selected day only
      return availableDays[selectedDay - 1].hours
    } else {
      // Show based on hourly filter
      const hoursToTake = hourlyFilter === '6h' ? 6 : hourlyFilter === '24h' ? 24 : 168
      return bundle.hours.slice(0, hoursToTake)
    }
  }, [bundle, hourlyFilter, selectedDay, availableDays])

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

// Color coding functions
const getTemperatureColor = (tempC: number) => {
  if (tempC < 10) return 'text-blue-600'
  if (tempC < 15) return 'text-cyan-600'
  if (tempC < 20) return 'text-green-600'
  if (tempC < 25) return 'text-yellow-600'
  if (tempC < 30) return 'text-orange-600'
  return 'text-red-600'
}

const getWaveColor = (waveHeightM?: number) => {
  if (!waveHeightM || waveHeightM < 0.5) return 'text-blue-500'
  if (waveHeightM < 1.0) return 'text-green-500'
  if (waveHeightM < 1.5) return 'text-yellow-500'
  if (waveHeightM < 2.0) return 'text-orange-500'
  return 'text-red-500'
}

const getTideColor = (height: number) => {
  if (height < 0.5) return 'text-blue-500'
  if (height < 1.0) return 'text-green-500'
  if (height < 1.5) return 'text-yellow-500'
  return 'text-orange-500'
}

// Tide calculation functions
function calculateTideHeight(time: string): number {
  const date = new Date(time)
  const hours = date.getUTCHours()
  const tidalPeriod = 12.42
  const phase = (hours % tidalPeriod) / tidalPeriod * 2 * Math.PI
  const meanTide = 1.1
  const tideRange = 0.9
  return meanTide + tideRange * Math.sin(phase - Math.PI / 2)
}

function getTideStatus(time: string): string {
  const date = new Date(time)
  const hours = date.getUTCHours()
  const tidalPeriod = 12.42
  const phase = (hours % tidalPeriod) / tidalPeriod * 2 * Math.PI
  
  const nextPhase = phase + 0.1
  const currentHeight = Math.sin(phase - Math.PI / 2)
  const nextHeight = Math.sin(nextPhase - Math.PI / 2)
  
  if (nextHeight > currentHeight) {
    return 'Rising'
  } else {
    return 'Falling'
  }
}

  if (!bundle) return null

  return (
    <section className="mb-8">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className={`text-lg font-semibold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>Hourly Forecast</h2>
          <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
            {selectedDay > 0 ? availableDays[selectedDay]?.label : 
             hourlyFilter === '6h' ? 'Next 6 hours' : 
             hourlyFilter === '24h' ? 'Next 24 hours' : 'Next 7 days'}
          </p>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {/* Day selector dropdown */}
          {availableDays.length > 1 && (
            <div className={`inline-flex rounded-xl border p-1 ${theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
              <button
                onClick={() => setSelectedDay(0)}
                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  selectedDay === 0
                    ? theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                    : theme === 'dark' ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                All
              </button>
              {availableDays.map((day: any, index: number) => (
                <button
                  key={index}
                  onClick={() => setSelectedDay(index + 1)}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                    selectedDay === index + 1
                      ? theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                      : theme === 'dark' ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {day.label.split(' ')[0]}
                </button>
              ))}
            </div>
          )}
          
          {/* View mode toggle */}
          <div className={`inline-flex rounded-xl border p-1 ${theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
            <button
              onClick={() => setShowGraphs(false)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1 ${
                !showGraphs
                  ? theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                  : theme === 'dark' ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <Table size={14} />
              Table
            </button>
            <button
              onClick={() => setShowGraphs(true)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors flex items-center gap-1 ${
                showGraphs
                  ? theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                  : theme === 'dark' ? 'text-slate-300 hover:bg-slate-700' : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <TrendingUp size={14} />
              Graphs
            </button>
          </div>
        </div>
      </div>

      {/* Conditional rendering: Table or Graphs */}
      {showGraphs ? (
        <div className="space-y-6">
          {/* Wind Speed Chart */}
          <div className={`overflow-hidden rounded-2xl border ${theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'} p-4`}>
            <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
              Wind Speed ({unit})
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={hoursToShow.map((hour: ForecastHour) => ({
                time: fmtTime(hour.time, bundle.timezone),
                windSpeed: hour.windSpeed10mKmh,
                temperature: hour.temperatureC,
                humidity: hour.humidityPct,
                isCurrentHour: Math.abs(new Date(hour.time).getTime() - Date.now()) < 30 * 60 * 1000
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#475569' : '#e2e8f0'} />
                <XAxis 
                  dataKey="time" 
                  stroke={theme === 'dark' ? '#94a3b8' : '#64748b'}
                  tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12 }}
                />
                <YAxis 
                  stroke={theme === 'dark' ? '#94a3b8' : '#64748b'}
                  tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                    border: `1px solid ${theme === 'dark' ? '#475569' : '#e2e8f0'}`,
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: theme === 'dark' ? '#f1f5f9' : '#0f172a' }}
                  formatter={(value: any, name?: string) => {
                    if (name === 'windSpeed') return [`${value} ${unit}`, 'Wind Speed']
                    return [value, name]
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="windSpeed" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                {/* Current hour indicator */}
                {hoursToShow.some((hour: ForecastHour) => Math.abs(new Date(hour.time).getTime() - Date.now()) < 30 * 60 * 1000) && (
                  <ReferenceLine 
                    x={hoursToShow.find((hour: ForecastHour) => Math.abs(new Date(hour.time).getTime() - Date.now()) < 30 * 60 * 1000)?.time && fmtTime(hoursToShow.find((hour: ForecastHour) => Math.abs(new Date(hour.time).getTime() - Date.now()) < 30 * 60 * 1000)!.time, bundle.timezone)} 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    label="Now"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Temperature Chart */}
          <div className={`overflow-hidden rounded-2xl border ${theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'} p-4`}>
            <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
              Temperature
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hoursToShow.map((hour: ForecastHour) => ({
                time: fmtTime(hour.time, bundle.timezone),
                temperature: hour.temperatureC,
                isCurrentHour: Math.abs(new Date(hour.time).getTime() - Date.now()) < 30 * 60 * 1000
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#475569' : '#e2e8f0'} />
                <XAxis 
                  dataKey="time" 
                  stroke={theme === 'dark' ? '#94a3b8' : '#64748b'}
                  tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12 }}
                />
                <YAxis 
                  stroke={theme === 'dark' ? '#94a3b8' : '#64748b'}
                  tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#1e293b' : '#ffffff',
                    border: `1px solid ${theme === 'dark' ? '#475569' : '#e2e8f0'}`,
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: theme === 'dark' ? '#f1f5f9' : '#0f172a' }}
                  formatter={(value: any, name?: string) => {
                    if (name === 'temperature') return [`${value}°C`, 'Temperature']
                    return [value, name]
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="temperature" 
                  stroke="#f97316" 
                  strokeWidth={2}
                  dot={{ fill: '#f97316', r: 3 }}
                />
                {/* Current hour indicator */}
                {hoursToShow.some((hour: ForecastHour) => Math.abs(new Date(hour.time).getTime() - Date.now()) < 30 * 60 * 1000) && (
                  <ReferenceLine 
                    x={hoursToShow.find((hour: ForecastHour) => Math.abs(new Date(hour.time).getTime() - Date.now()) < 30 * 60 * 1000)?.time && fmtTime(hoursToShow.find((hour: ForecastHour) => Math.abs(new Date(hour.time).getTime() - Date.now()) < 30 * 60 * 1000)!.time, bundle.timezone)} 
                    stroke="#f97316" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    label="Now"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : (
        /* Table-like layout */
        <div className={`overflow-hidden rounded-2xl border ${theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
        {/* Header */}
        <div className={`grid grid-cols-9 gap-2 sm:gap-4 border-b p-2 sm:p-3 text-xs font-semibold uppercase tracking-wide text-center ${
          theme === 'dark' ? 'border-slate-700 text-blue-400' : 'border-slate-200 text-blue-600'
        }`}>
          <div className="text-center">Time</div>
          <div className="text-center">Date</div>
          {viewMode === 'surfer' ? <div className="text-center">Temp</div> : <div className="text-center">Temp</div>}
          {viewMode !== 'surfer' && <div className="text-center">Weather</div>}
          <div className="text-center">Wind</div>
          {viewMode !== 'surfer' && <div className="text-center">Humidity</div>}
          {(viewMode === 'surfer' || viewMode === 'everything') && <div className="text-center">Waves</div>}
          <div className="text-center">Tides</div>
        </div>

        {/* Rows */}
        <div className="max-h-96 overflow-y-auto">
          {hoursToShow.map((hour: ForecastHour, index: number) => {
            const isCurrentHour = Math.abs(new Date(hour.time).getTime() - Date.now()) < 30 * 60 * 1000
            const isToday = new Date(hour.time).toDateString() === new Date().toDateString()
            const isTomorrow = new Date(hour.time).toDateString() === new Date(Date.now() + 86400000).toDateString()
            
            return (
              <div
                key={hour.time}
                className={`grid grid-cols-9 gap-2 sm:gap-4 border-b p-2 sm:p-3 text-xs sm:text-sm transition-colors hover:${
                  theme === 'dark' ? 'bg-slate-700' : 'bg-blue-50'
                } ${isCurrentHour
                  ? theme === 'dark'
                    ? 'border-blue-500 bg-blue-900/50 shadow-lg shadow-blue-500/20'
                    : 'border-blue-400 bg-blue-100 shadow-lg shadow-blue-400/20'
                  : theme === 'dark'
                    ? 'border-slate-700'
                    : 'border-slate-200'
                }`}
              >
                <div className="flex flex-col justify-center">
                  <div className={`font-medium text-center ${
                    isCurrentHour
                      ? theme === 'dark' ? 'text-blue-300 font-bold' : 'text-blue-700 font-bold'
                      : theme === 'dark' ? 'text-slate-200' : 'text-slate-900'
                  }`}>
                    {fmtTime(hour.time, bundle.timezone)}
                  </div>
                  {isCurrentHour && (
                    <span className="inline-flex items-center rounded-full bg-blue-500 px-1 sm:px-2 py-0.5 text-xs text-white mt-1 text-center justify-center">
                      Now
                    </span>
                  )}
                </div>
                <div className={`flex flex-col justify-center text-center ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  <span className="hidden sm:block">{isToday ? 'Today' : isTomorrow ? 'Tomorrow' : fmtDay(hour.time, bundle.timezone)}</span>
                  <span className="sm:hidden">{isToday ? 'Tdy' : isTomorrow ? 'Tmw' : fmtDay(hour.time, bundle.timezone).slice(0, 3)}</span>
                </div>
                {viewMode === 'surfer' ? (
                  <div className={`font-medium text-center ${getTemperatureColor(hour.temperatureC)}`}>
                    <div>{Math.round(hour.temperatureC)}°</div>
                    <div className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      Feels like {Math.round(hour.temperatureC - (hour.windSpeed10mKmh > 10 ? 2 : 0))}°
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={`font-medium text-center ${getTemperatureColor(hour.temperatureC)}`}>
                      <div>{Math.round(hour.temperatureC)}°</div>
                      <div className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        Feels like {Math.round(hour.temperatureC - (hour.windSpeed10mKmh > 10 ? 2 : 0))}°
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-xl sm:text-2xl mb-1">{getWeatherIcon(hour)}</div>
                      <div className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        {getWeatherCondition(hour)}
                      </div>
                    </div>
                  </>
                )}
                <div className="text-center">
                  <div className={`font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>
                    {formatWindSpeed(hour.windSpeed10mKmh, unit)}
                  </div>
                  <div className={`text-xs ${getDirectionColor(hour.windDirection10mDeg)}`}>
                    {degToCompass(hour.windDirection10mDeg)}
                  </div>
                  <div className="text-lg sm:text-xl">{getWindIcon(hour.windSpeed10mKmh)}</div>
                </div>
                {viewMode !== 'surfer' && (
                  <div className={`text-center ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    {Math.round(hour.humidityPct)}%
                  </div>
                )}
                {(viewMode === 'surfer' || viewMode === 'everything') && (
                  <div className={`text-center ${getWaveColor(hour.waveHeightM)}`}>
                    <div>{hour.waveHeightM ? `${hour.waveHeightM.toFixed(1)}m` : '—'}</div>
                    {hour.waterTempC && (
                      <div className="text-xs">
                        💧 {hour.waterTempC.toFixed(1)}°
                      </div>
                    )}
                    {hour.waveDirectionDeg && (
                      <div className={`text-xs ${getDirectionColor(hour.waveDirectionDeg)}`}>
                        {degToCompass(hour.waveDirectionDeg)}
                      </div>
                    )}
                  </div>
                )}
                <div className={`text-center ${getTideColor(calculateTideHeight(hour.time))}`}>
                  <div>{calculateTideHeight(hour.time).toFixed(1)}m</div>
                  <div className="text-xs">
                    {getTideStatus(hour.time)}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
      )}
    </section>
  )
}
