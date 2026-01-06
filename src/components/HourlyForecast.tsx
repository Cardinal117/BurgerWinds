import React, { useMemo, useState, useEffect, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ReferenceLine } from 'recharts'
import { ForecastHour, ForecastBundle } from '../lib/openMeteo'
import { formatWindSpeed, degToCompass, fmtTime, fmtDay, WindUnit, TemperatureUnit, formatTemperature, celsiusToFahrenheit, celsiusToKelvin } from '../lib/format'
import { TrendingUp, Table, Calendar, Settings } from 'lucide-react'
import { WaveCompass } from './WaveCompass'

interface HourlyForecastProps {
  bundle: ForecastBundle | null
  hourlyFilter: '6h' | '24h' | '7d'
  onHourlyFilterChange: (filter: '6h' | '24h' | '7d') => void
  unit: WindUnit
  temperatureUnit: TemperatureUnit
  onTemperatureUnitChange: (unit: TemperatureUnit) => void
  theme: 'light' | 'dark'
  viewMode: 'casual' | 'surfer' | 'everything' | 'custom'
  location: { id: string; name: string; lat: number; lon: number }
  savedLocations: { items: { id: string; name: string; lat: number; lon: number }[] }
  onLocationChange: (location: { id: string; name: string; lat: number; lon: number }) => void
}

export function HourlyForecast({ 
  bundle, 
  hourlyFilter, 
  onHourlyFilterChange, 
  unit, 
  temperatureUnit,
  onTemperatureUnitChange,
  theme, 
  viewMode,
  location,
  savedLocations,
  onLocationChange
}: HourlyForecastProps) {
  const [selectedDay, setSelectedDay] = useState(0)
  const [showGraphs, setShowGraphs] = useState(viewMode === 'surfer')
  const tableContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to current hour
  useEffect(() => {
    if (!showGraphs && tableContainerRef.current && bundle?.hours?.length) {
      // Small delay to ensure the table is rendered
      const timer = setTimeout(() => {
        const currentHourElement = tableContainerRef.current?.querySelector('[data-current-hour="true"]')
        if (currentHourElement) {
          currentHourElement.scrollIntoView({
            behavior: 'smooth',
            block: 'center'
          })
        }
      }, 100)
      
      return () => clearTimeout(timer)
    }
  }, [showGraphs, bundle, hourlyFilter, selectedDay])

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

const getTideStatusColor = (status: string) => {
  return status === 'High' ? 'text-red-500' : status === 'Low' ? 'text-blue-500' : 'text-green-500'
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
    return 'Lowering'
  }
}

  if (!bundle) return null

  return (
    <section className="mb-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className={`text-xs font-semibold uppercase tracking-wide ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Hourly Forecast</div>
                <p className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                  {selectedDay > 0 && availableDays[selectedDay - 1] ? (
                    <>Selected: {availableDays[selectedDay - 1].label}</>
                  ) : (
                    hourlyFilter === '6h' ? 'Next 6 hours' : 
                    hourlyFilter === '24h' ? 'Next 24 hours' : 'Next 7 days'
                  )}
                </p>
              </div>
              
              {/* View Mode Toggle */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowGraphs(false)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    !showGraphs
                      ? theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                      : theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  <Table size={14} className="inline mr-1" />
                  Table
                </button>
                <button
                  onClick={() => setShowGraphs(true)}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    showGraphs
                      ? theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                      : theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'
                  }`}
                >
                  <TrendingUp size={14} className="inline mr-1" />
                  Graphs
                </button>
              </div>
            </div>

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

      {/* Conditional rendering: Table or Graphs */}
      {showGraphs ? (
        <div className="space-y-6">
          {/* Wind Speed Chart */}
          <div className={`overflow-hidden rounded-2xl border ${theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'} p-4`}>
            <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
              Wind Speed ({unit})
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={hoursToShow.map((hour: ForecastHour) => {
                let windSpeed = hour.windSpeed10mKmh
                // Convert wind speed to the selected unit
                if (unit === 'kts') {
                  windSpeed = windSpeed / 1.852
                } else if (unit === 'mps') {
                  windSpeed = windSpeed / 3.6
                }
                
                return {
                  time: fmtTime(hour.time, bundle?.timezone || 'UTC'),
                  windSpeed: Math.round(windSpeed * 100) / 100,
                  temperature: Math.round(hour.temperatureC * 100) / 100,
                  humidity: Math.round(hour.humidityPct * 100) / 100,
                  isCurrentHour: Math.abs(new Date(hour.time).getTime() - Date.now()) < 30 * 60 * 1000
                }
              })}>
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
                    if (name === 'windSpeed') return [`${Math.round(value * 100) / 100} ${unit}`, 'Wind Speed']
                    return [`${Math.round(value * 100) / 100}`, name]
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
                    x={hoursToShow.find((hour: ForecastHour) => Math.abs(new Date(hour.time).getTime() - Date.now()) < 30 * 60 * 1000)?.time && fmtTime(hoursToShow.find((hour: ForecastHour) => Math.abs(new Date(hour.time).getTime() - Date.now()) < 30 * 60 * 1000)!.time, bundle?.timezone || 'UTC')} 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    label="Now"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Wave Height Chart */}
          {(viewMode === 'surfer' || viewMode === 'everything') && (
            <div className={`overflow-hidden rounded-2xl border ${theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'} p-4`}>
              <div className="flex items-center justify-between mb-4">
                <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                  Wave Height
                </h3>
                {bundle && bundle.hours && bundle.hours.find((hour) => Math.abs(new Date(hour.time).getTime() - Date.now()) < 30 * 60 * 1000) && (
                  <WaveCompass 
                    direction={bundle.hours.find((hour) => Math.abs(new Date(hour.time).getTime() - Date.now()) < 30 * 60 * 1000)?.waveDirectionDeg || 0} 
                    theme={theme} 
                    size="small" 
                  />
                )}
              </div>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={hoursToShow.map((hour: ForecastHour) => ({
                  time: fmtTime(hour.time, bundle?.timezone || 'UTC'),
                  waveHeight: Math.round((hour.waveHeightM || 0) * 100) / 100,
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
                      if (name === 'waveHeight') return [`${Math.round(value * 100) / 100}m`, 'Wave Height']
                      return [`${Math.round(value * 100) / 100}`, name]
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="waveHeight" 
                    stroke="#06b6d4" 
                    strokeWidth={2}
                    dot={{ fill: '#06b6d4', r: 3 }}
                  />
                  {/* Current hour indicator */}
                  {hoursToShow.some((hour: ForecastHour) => Math.abs(new Date(hour.time).getTime() - Date.now()) < 30 * 60 * 1000) && (
                    <ReferenceLine 
                      x={hoursToShow.find((hour: ForecastHour) => Math.abs(new Date(hour.time).getTime() - Date.now()) < 30 * 60 * 1000)?.time && fmtTime(hoursToShow.find((hour: ForecastHour) => Math.abs(new Date(hour.time).getTime() - Date.now()) < 30 * 60 * 1000)!.time, bundle?.timezone || 'UTC')} 
                      stroke="#06b6d4" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      label="Now"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Temperature Chart */}
          <div className={`overflow-hidden rounded-2xl border ${theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'} p-4`}>
            <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
              Temperature ({temperatureUnit === 'celsius' ? '°C' : temperatureUnit === 'fahrenheit' ? '°F' : 'K'})
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hoursToShow.map((hour: ForecastHour) => ({
                time: fmtTime(hour.time, bundle?.timezone || 'UTC'),
                temperature: temperatureUnit === 'fahrenheit' ? Math.round(celsiusToFahrenheit(hour.temperatureC) * 100) / 100 : 
                            temperatureUnit === 'kelvin' ? Math.round(celsiusToKelvin(hour.temperatureC) * 100) / 100 :
                            Math.round(hour.temperatureC * 100) / 100,
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
                    if (name === 'temperature') return [`${Math.round(value * 100) / 100}${temperatureUnit === 'celsius' ? '°C' : temperatureUnit === 'fahrenheit' ? '°F' : 'K'}`, 'Temperature']
                    return [`${Math.round(value * 100) / 100}`, name]
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
                    x={hoursToShow.find((hour: ForecastHour) => Math.abs(new Date(hour.time).getTime() - Date.now()) < 30 * 60 * 1000)?.time && fmtTime(hoursToShow.find((hour: ForecastHour) => Math.abs(new Date(hour.time).getTime() - Date.now()) < 30 * 60 * 1000)!.time, bundle?.timezone || 'UTC')} 
                    stroke="#f97316" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    label="Now"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Humidity Chart */}
          <div className={`overflow-hidden rounded-2xl border ${theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'} p-4`}>
            <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
              Humidity
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={hoursToShow.map((hour: ForecastHour) => ({
                time: fmtTime(hour.time, bundle?.timezone || 'UTC'),
                humidity: Math.round(hour.humidityPct * 100) / 100,
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
                    if (name === 'humidity') return [`${Math.round(value * 100) / 100}%`, 'Humidity']
                    return [`${Math.round(value * 100) / 100}`, name]
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="humidity" 
                  stroke="#06b6d4" 
                  fill="#06b6d4" 
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                {/* Current hour indicator */}
                {hoursToShow.some((hour: ForecastHour) => Math.abs(new Date(hour.time).getTime() - Date.now()) < 30 * 60 * 1000) && (
                  <ReferenceLine 
                    x={hoursToShow.find((hour: ForecastHour) => Math.abs(new Date(hour.time).getTime() - Date.now()) < 30 * 60 * 1000)?.time && fmtTime(hoursToShow.find((hour: ForecastHour) => Math.abs(new Date(hour.time).getTime() - Date.now()) < 30 * 60 * 1000)!.time, bundle?.timezone || 'UTC')} 
                    stroke="#06b6d4" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    label="Now"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Tide Chart */}
          <div className={`overflow-hidden rounded-2xl border ${theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'} p-4`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className={`text-lg font-semibold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                Tide Height
              </h3>
              {bundle && bundle.hours && bundle.hours.find((hour) => Math.abs(new Date(hour.time).getTime() - Date.now()) < 30 * 60 * 1000) && (
                <WaveCompass 
                  direction={bundle.hours.find((hour) => Math.abs(new Date(hour.time).getTime() - Date.now()) < 30 * 60 * 1000)?.waveDirectionDeg || 0} 
                  theme={theme} 
                  size="small" 
                />
              )}
            </div>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={hoursToShow.map((hour: ForecastHour) => ({
                time: fmtTime(hour.time, bundle?.timezone || 'UTC'),
                tideHeight: Math.round(calculateTideHeight(hour.time) * 100) / 100,
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
                    if (name === 'tideHeight') return [`${Math.round(value * 100) / 100}m`, 'Tide Height']
                    return [`${Math.round(value * 100) / 100}`, name]
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="tideHeight" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6', r: 3 }}
                />
                {/* Current hour indicator */}
                {hoursToShow.some((hour: ForecastHour) => Math.abs(new Date(hour.time).getTime() - Date.now()) < 30 * 60 * 1000) && (
                  <ReferenceLine 
                    x={hoursToShow.find((hour: ForecastHour) => Math.abs(new Date(hour.time).getTime() - Date.now()) < 30 * 60 * 1000)?.time && fmtTime(hoursToShow.find((hour: ForecastHour) => Math.abs(new Date(hour.time).getTime() - Date.now()) < 30 * 60 * 1000)!.time, bundle?.timezone || 'UTC')} 
                    stroke="#8b5cf6" 
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
        <div className={`flex flex-col sm:flex-row gap-2 sm:gap-4 border-b p-2 sm:p-3 text-xs font-semibold uppercase tracking-wide text-center ${
          theme === 'dark' ? 'border-slate-700 text-blue-400' : 'border-slate-200 text-blue-600'
        }`}>
          <div className="flex-1 text-center">Time</div>
          <div className="flex-1 text-center">{viewMode === 'surfer' ? 'Temp' : 'Temp'}</div>
          {viewMode !== 'surfer' && <div className="flex-1 text-center hidden sm:block">Weather</div>}
          <div className="flex-1 text-center">Wind</div>
          {viewMode !== 'surfer' && <div className="flex-1 text-center hidden sm:block">Humidity</div>}
          {(viewMode === 'surfer' || viewMode === 'everything') && <div className="flex-1 text-center">Waves</div>}
          <div className="flex-1 text-center">Tides</div>
        </div>

        {/* Rows */}
        <div className="max-h-96 overflow-y-auto" ref={tableContainerRef}>
          {hoursToShow.map((hour: ForecastHour, index: number) => {
            const isCurrentHour = Math.abs(new Date(hour.time).getTime() - Date.now()) < 30 * 60 * 1000
            const isToday = new Date(hour.time).toDateString() === new Date().toDateString()
            const isTomorrow = new Date(hour.time).toDateString() === new Date(Date.now() + 86400000).toDateString()
            
            return (
              <div
                key={hour.time}
                data-current-hour={isCurrentHour}
                className={`flex flex-col sm:flex-row gap-2 sm:gap-4 border-b p-2 sm:p-3 text-xs sm:text-sm transition-colors hover:${
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
                <div className="flex flex-col justify-center flex-1">
                  <div className={`font-medium text-center ${
                    isCurrentHour
                      ? theme === 'dark' ? 'text-blue-300 font-bold' : 'text-blue-700 font-bold'
                      : theme === 'dark' ? 'text-slate-200' : 'text-slate-900'
                  }`}>
                    {fmtTime(hour.time, bundle?.timezone || 'UTC')}
                  </div>
                  {isCurrentHour && (
                    <span className="inline-flex items-center rounded-full bg-blue-500 px-1 sm:px-2 py-0.5 text-xs text-white mt-1 text-center justify-center">
                      Now
                    </span>
                  )}
                </div>
                <div className="flex flex-col justify-center flex-1">
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
                      <div className="text-center hidden sm:block flex-1">
                        <div className="text-xl sm:text-2xl mb-1">{getWeatherIcon(hour)}</div>
                        <div className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                          {getWeatherCondition(hour)}
                        </div>
                      </div>
                    </>
                  )}
                </div>
                {viewMode !== 'surfer' && (
                  <div className={`text-center hidden sm:block flex-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    <div className="text-xl sm:text-2xl mb-1">{getWeatherIcon(hour)}</div>
                    <div className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      {getWeatherCondition(hour)}
                    </div>
                  </div>
                )}
                <div className="text-center flex-1">
                  <div className={`font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-slate-900'}`}>
                    {formatWindSpeed(hour.windSpeed10mKmh, unit)}
                  </div>
                  <div className={`text-xs ${getDirectionColor(hour.windDirection10mDeg)}`}>
                    {degToCompass(hour.windDirection10mDeg)}
                  </div>
                  <div className="text-lg sm:text-xl">{getWindIcon(hour.windSpeed10mKmh)}</div>
                </div>
                {viewMode !== 'surfer' && (
                  <div className={`text-center hidden sm:block flex-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                    {Math.round(hour.humidityPct)}%
                  </div>
                )}
                {(viewMode === 'surfer' || viewMode === 'everything') && (
                  <div className={`text-center flex-1 ${getWaveColor(hour.waveHeightM)}`}>
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
                <div className={`text-center flex-1 ${getTideColor(calculateTideHeight(hour.time))}`}>
                  <div>{calculateTideHeight(hour.time).toFixed(1)}m</div>
                  <div className={`text-xs ${getTideStatusColor(getTideStatus(hour.time))}`}>
                    {getTideStatus(hour.time)} • {calculateTideHeight(hour.time) < 1.0 ? 'Low' : calculateTideHeight(hour.time) > 1.5 ? 'High' : 'Normal'}
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
