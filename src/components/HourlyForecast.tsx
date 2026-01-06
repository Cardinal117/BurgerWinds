import React, { useMemo, useState, useEffect, useRef } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area, ReferenceLine } from 'recharts'
import { ForecastHour, ForecastBundle } from '../lib/openMeteo'
import { formatWindSpeed, degToCompass, fmtTime, fmtDay, WindUnit, TemperatureUnit, celsiusToFahrenheit, celsiusToKelvin } from '../lib/format'
import { TrendingUp, Table, Wind, Waves, Droplets, Cloud, Gauge, Thermometer, ChevronDown, ChevronUp } from 'lucide-react'
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
  const [expandedHour, setExpandedHour] = useState<string | null>(null)
  const tableContainerRef = useRef<HTMLDivElement>(null)

  // Auto-scroll to current hour
  useEffect(() => {
    if (!showGraphs && tableContainerRef.current && bundle?.hours?.length) {
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
      return availableDays[selectedDay - 1].hours
    } else {
      const hoursToTake = hourlyFilter === '6h' ? 6 : hourlyFilter === '24h' ? 24 : 168
      return bundle.hours.slice(0, hoursToTake)
    }
  }, [bundle, hourlyFilter, selectedDay, availableDays])

  // Color coding functions
  const getBackgroundColor = (index: number, isCurrentHour: boolean) => {
    if (isCurrentHour) {
      return theme === 'dark' ? 'bg-gradient-to-r from-blue-900/60 to-cyan-900/40' : 'bg-gradient-to-r from-blue-50/80 to-cyan-50/60'
    }
    
    if (index % 2 === 0) {
      return theme === 'dark' ? 'bg-slate-800/40' : 'bg-white/80'
    } else {
      return theme === 'dark' ? 'bg-slate-900/40' : 'bg-slate-50/80'
    }
  }

  const getBorderColor = (isCurrentHour: boolean) => {
    if (isCurrentHour) {
      return theme === 'dark' ? 'border-blue-500/60' : 'border-blue-400/60'
    }
    return theme === 'dark' ? 'border-slate-700/50' : 'border-slate-200/70'
  }

  const getTimeColor = (isCurrentHour: boolean, isToday: boolean) => {
    if (isCurrentHour) return 'text-blue-500 font-bold'
    if (isToday) return theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
    return theme === 'dark' ? 'text-slate-300' : 'text-slate-700'
  }

  const getTemperatureColor = (tempC: number) => {
    if (tempC < 10) return 'text-blue-500'
    if (tempC < 15) return 'text-cyan-500'
    if (tempC < 20) return 'text-emerald-500'
    if (tempC < 25) return 'text-yellow-500'
    if (tempC < 30) return 'text-orange-500'
    return 'text-red-500'
  }

  const getWindColor = (speed: number) => {
    if (speed < 10) return 'text-blue-500'
    if (speed < 20) return 'text-green-500'
    if (speed < 30) return 'text-yellow-500'
    return 'text-red-500'
  }

  const getWaveColor = (waveHeightM?: number) => {
    if (!waveHeightM || waveHeightM < 0.5) return 'text-blue-500'
    if (waveHeightM < 1.0) return 'text-emerald-500'
    if (waveHeightM < 1.5) return 'text-yellow-500'
    if (waveHeightM < 2.0) return 'text-orange-500'
    return 'text-red-500'
  }

  const getHumidityColor = (humidity: number) => {
    if (humidity < 40) return 'text-blue-500'
    if (humidity < 60) return 'text-green-500'
    if (humidity < 80) return 'text-yellow-500'
    return 'text-orange-500'
  }

  const getWeatherIcon = (hour: ForecastHour) => {
    if (hour.precipitationProbabilityPct && hour.precipitationProbabilityPct > 50) return '🌧️'
    if (hour.precipitationProbabilityPct && hour.precipitationProbabilityPct > 30) return '🌦️'
    if (hour.cloudCoverPct > 70) return '☁️'
    if (hour.cloudCoverPct > 30) return '⛅'
    const hourNum = new Date(hour.time).getHours()
    if (hourNum >= 18 || hourNum <= 6) return '🌙'
    return '☀️'
  }

  const getWindIcon = (speed: number) => {
    if (speed > 30) return '🌪️'
    if (speed > 20) return '💨'
    if (speed > 10) return '🌬️'
    return '🍃'
  }

  const getTideHeight = (time: string) => {
    const date = new Date(time)
    const hours = date.getUTCHours()
    const tidalPeriod = 12.42
    const phase = (hours % tidalPeriod) / tidalPeriod * 2 * Math.PI
    const meanTide = 1.1
    const tideRange = 0.9
    return meanTide + tideRange * Math.sin(phase - Math.PI / 2)
  }

  const getTideStatus = (time: string) => {
    const date = new Date(time)
    const hours = date.getUTCHours()
    const tidalPeriod = 12.42
    const phase = (hours % tidalPeriod) / tidalPeriod * 2 * Math.PI
    
    const nextPhase = phase + 0.1
    const currentHeight = Math.sin(phase - Math.PI / 2)
    const nextHeight = Math.sin(nextPhase - Math.PI / 2)
    
    return nextHeight > currentHeight ? 'Rising' : 'Falling'
  }

  const getTideColor = (height: number) => {
    if (height < 0.5) return 'text-blue-500'
    if (height < 1.0) return 'text-emerald-500'
    if (height < 1.5) return 'text-yellow-500'
    return 'text-orange-500'
  }

  const toggleExpand = (time: string) => {
    setExpandedHour(expandedHour === time ? null : time)
  }

  if (!bundle) return null

  return (
    <section className="mb-8">
      {/* Header and controls */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
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
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              !showGraphs
                ? theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                : theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'
            }`}
          >
            <Table size={16} />
            <span className="hidden sm:inline">Table</span>
          </button>
          <button
            onClick={() => setShowGraphs(true)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-1.5 ${
              showGraphs
                ? theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                : theme === 'dark' ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'
            }`}
          >
            <TrendingUp size={16} />
            <span className="hidden sm:inline">Graphs</span>
          </button>
        </div>
      </div>

      {/* Day selector */}
      {availableDays.length > 1 && (
        <div className={`inline-flex flex-wrap rounded-xl border p-1 gap-1 mb-4 ${theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'}`}>
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

      {/* Table view */}
      {!showGraphs ? (
        <div className={`rounded-2xl border ${theme === 'dark' ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-white/80'} overflow-hidden`}>
          <div className="max-h-[600px] overflow-y-auto" ref={tableContainerRef}>
            {hoursToShow.map((hour: ForecastHour, index: number) => {
              const isCurrentHour = Math.abs(new Date(hour.time).getTime() - Date.now()) < 30 * 60 * 1000
              const isToday = new Date(hour.time).toDateString() === new Date().toDateString()
              const isExpanded = expandedHour === hour.time
              const tideHeight = getTideHeight(hour.time)
              
              return (
                <div
                  key={hour.time}
                  data-current-hour={isCurrentHour}
                  className={`border-b ${getBorderColor(isCurrentHour)} transition-all duration-200 ${
                    isCurrentHour ? 'shadow-lg shadow-blue-500/20' : ''
                  }`}
                >
                  {/* Compact card view for mobile */}
                  <div 
                    className={`p-3 sm:p-4 ${getBackgroundColor(index, isCurrentHour)} cursor-pointer transition-all duration-200 hover:brightness-105`}
                    onClick={() => toggleExpand(hour.time)}
                  >
                    {/* Main info row */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">
                          {getWeatherIcon(hour)}
                        </div>
                        <div>
                          <div className={`text-sm font-medium ${getTimeColor(isCurrentHour, isToday)}`}>
                            {fmtTime(hour.time, bundle?.timezone || 'UTC')}
                            {isCurrentHour && (
                              <span className="ml-2 inline-flex items-center rounded-full bg-blue-500 px-2 py-0.5 text-xs text-white">
                                Now
                              </span>
                            )}
                          </div>
                          <div className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                            {fmtDay(hour.time, bundle?.timezone || 'UTC').split(' ')[0]}
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        {/* Temperature */}
                        <div className="text-center">
                          <div className={`text-lg font-bold ${getTemperatureColor(hour.temperatureC)}`}>
                            {Math.round(hour.temperatureC)}°
                          </div>
                          <div className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                            Feels {Math.round(hour.temperatureC - (hour.windSpeed10mKmh > 10 ? 2 : 0))}°
                          </div>
                        </div>
                        
                        {/* Expand/collapse button */}
                        <button 
                          className={`p-1 rounded-lg transition-colors ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-200'}`}
                          onClick={(e) => {
                            e.stopPropagation()
                            toggleExpand(hour.time)
                          }}
                        >
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </div>
                    </div>
                    
                    {/* Quick stats row */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-3">
                      {/* Wind */}
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-blue-50'}`}>
                          <Wind size={14} className={getWindColor(hour.windSpeed10mKmh)} />
                        </div>
                        <div>
                          <div className={`text-sm font-medium ${getWindColor(hour.windSpeed10mKmh)}`}>
                            {formatWindSpeed(hour.windSpeed10mKmh, unit)}
                          </div>
                          <div className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                            {degToCompass(hour.windDirection10mDeg)}
                          </div>
                        </div>
                      </div>
                      
                      {/* Waves (if surfer mode) */}
                      {(viewMode === 'surfer' || viewMode === 'everything') && (
                        <div className="flex items-center gap-2">
                          <div className={`p-1.5 rounded-lg ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-emerald-50'}`}>
                            <Waves size={14} className={getWaveColor(hour.waveHeightM)} />
                          </div>
                          <div>
                            <div className={`text-sm font-medium ${getWaveColor(hour.waveHeightM)}`}>
                              {hour.waveHeightM?.toFixed(1) || '—'}m
                            </div>
                            <div className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                              {hour.wavePeriodS ? `${Math.round(hour.wavePeriodS)}s` : '—'}
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {/* Humidity */}
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-cyan-50'}`}>
                          <Droplets size={14} className={getHumidityColor(hour.humidityPct)} />
                        </div>
                        <div>
                          <div className={`text-sm font-medium ${getHumidityColor(hour.humidityPct)}`}>
                            {Math.round(hour.humidityPct)}%
                          </div>
                          <div className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                            Humidity
                          </div>
                        </div>
                      </div>
                      
                      {/* Tides */}
                      <div className="flex items-center gap-2">
                        <div className={`p-1.5 rounded-lg ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-violet-50'}`}>
                          <div className={`text-sm ${getTideColor(tideHeight)}`}>
                            {tideHeight < 1.0 ? '📉' : tideHeight > 1.5 ? '📈' : '↔️'}
                          </div>
                        </div>
                        <div>
                          <div className={`text-sm font-medium ${getTideColor(tideHeight)}`}>
                            {tideHeight.toFixed(1)}m
                          </div>
                          <div className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                            {getTideStatus(hour.time)}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Expanded details */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-dashed border-gray-400/30">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {/* Weather Conditions */}
                          <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-slate-100/70'}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <Cloud size={14} className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} />
                              <div className="text-xs font-medium">Conditions</div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>Cloud Cover</span>
                                <span className="font-medium">{Math.round(hour.cloudCoverPct)}%</span>
                              </div>
                              {hour.precipitationProbabilityPct && (
                                <div className="flex justify-between text-sm">
                                  <span>Rain Chance</span>
                                  <span className={`font-medium ${hour.precipitationProbabilityPct > 50 ? 'text-blue-500' : hour.precipitationProbabilityPct > 30 ? 'text-cyan-500' : 'text-slate-500'}`}>
                                    {Math.round(hour.precipitationProbabilityPct)}%
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Wind Details */}
                          <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-blue-50/70'}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <Wind size={14} className={getWindColor(hour.windSpeed10mKmh)} />
                              <div className="text-xs font-medium">Wind Details</div>
                            </div>
                            <div className="space-y-1">
                              <div className="flex justify-between text-sm">
                                <span>Direction</span>
                                <span className="font-medium">{degToCompass(hour.windDirection10mDeg)}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span>Gusts</span>
                                <span className="font-medium">
                                  {hour.windGusts10mKmh ? formatWindSpeed(hour.windGusts10mKmh, unit) : '—'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          {/* Additional Data */}
                          <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-emerald-50/70'}`}>
                            <div className="flex items-center gap-2 mb-2">
                              <Gauge size={14} className={theme === 'dark' ? 'text-slate-400' : 'text-slate-600'} />
                              <div className="text-xs font-medium">More Data</div>
                            </div>
                            <div className="space-y-1">
                              {hour.pressureMslHpa && (
                                <div className="flex justify-between text-sm">
                                  <span>Pressure</span>
                                  <span className="font-medium">{Math.round(hour.pressureMslHpa)} hPa</span>
                                </div>
                              )}
                              {hour.visibilityM && (
                                <div className="flex justify-between text-sm">
                                  <span>Visibility</span>
                                  <span className="font-medium">{(hour.visibilityM / 1000).toFixed(1)} km</span>
                                </div>
                              )}
                              {hour.waterTempC && (
                                <div className="flex justify-between text-sm">
                                  <span>Water Temp</span>
                                  <span className="font-medium">{hour.waterTempC.toFixed(1)}°C</span>
                                </div>
                              )}
                            </div>
                          </div>
                          
                          {/* Wave Details (if available) */}
                          {(viewMode === 'surfer' || viewMode === 'everything') && hour.waveHeightM && (
                            <div className={`p-3 rounded-xl ${theme === 'dark' ? 'bg-slate-700/50' : 'bg-amber-50/70'}`}>
                              <div className="flex items-center gap-2 mb-2">
                                <Waves size={14} className={getWaveColor(hour.waveHeightM)} />
                                <div className="text-xs font-medium">Wave Details</div>
                              </div>
                              <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span>Height</span>
                                  <span className="font-medium">{hour.waveHeightM.toFixed(1)} m</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>Period</span>
                                  <span className="font-medium">{hour.wavePeriodS ? `${Math.round(hour.wavePeriodS)}s` : '—'}</span>
                                </div>
                                {hour.waveDirectionDeg && (
                                  <div className="flex justify-between text-sm">
                                    <span>Direction</span>
                                    <span className="font-medium">{degToCompass(hour.waveDirectionDeg)}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        /* Comprehensive Graph view with all charts from second component */
        <div className="space-y-6">
          {/* Wind Speed Chart */}
          <div className={`overflow-hidden rounded-2xl border ${theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'} p-4`}>
            <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
              Wind Speed ({unit})
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={hoursToShow.map((hour: ForecastHour) => {
                let windSpeed = hour.windSpeed10mKmh
                if (unit === 'kts') windSpeed = windSpeed / 1.852
                else if (unit === 'mps') windSpeed = windSpeed / 3.6
                
                return {
                  time: fmtTime(hour.time, bundle?.timezone || 'UTC'),
                  windSpeed: Math.round(windSpeed),
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
                  formatter={(value: any) => [`${Math.round(value)} ${unit}`, 'Wind Speed']}
                />
                <Area 
                  type="monotone" 
                  dataKey="windSpeed" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
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

          {/* UV Index Chart */}
          <div className={`overflow-hidden rounded-2xl border ${theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'} p-4`}>
            <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
              UV Index
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={hoursToShow.map((hour: ForecastHour) => ({
                time: fmtTime(hour.time, bundle?.timezone || 'UTC'),
                uvIndex: hour.uvIndex || 0,
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
                    if (name === 'uvIndex') return [`${Math.round(value)}`, 'UV Index']
                    return [`${Math.round(value)}`, name]
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="uvIndex" 
                  stroke="#f59e0b" 
                  fill="#f59e0b" 
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                {hoursToShow.some((hour: ForecastHour) => Math.abs(new Date(hour.time).getTime() - Date.now()) < 30 * 60 * 1000) && (
                  <ReferenceLine 
                    x={hoursToShow.find((hour: ForecastHour) => Math.abs(new Date(hour.time).getTime() - Date.now()) < 30 * 60 * 1000)?.time && fmtTime(hoursToShow.find((hour: ForecastHour) => Math.abs(new Date(hour.time).getTime() - Date.now()) < 30 * 60 * 1000)!.time, bundle?.timezone || 'UTC')} 
                    stroke="#f59e0b" 
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

          {/* Pressure Chart */}
          <div className={`overflow-hidden rounded-2xl border ${theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'} p-4`}>
            <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
              Atmospheric Pressure
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={hoursToShow.map((hour: ForecastHour) => ({
                time: fmtTime(hour.time, bundle?.timezone || 'UTC'),
                pressure: Math.round(hour.pressureMslHpa || 0),
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
                    if (name === 'pressure') return [`${Math.round(value)} hPa`, 'Pressure']
                    return [`${Math.round(value)}`, name]
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="pressure" 
                  stroke="#8b5cf6" 
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6', r: 3 }}
                />
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

          {/* Precipitation Chart */}
          <div className={`overflow-hidden rounded-2xl border ${theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'} p-4`}>
            <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
              Precipitation
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={hoursToShow.map((hour: ForecastHour) => ({
                time: fmtTime(hour.time, bundle?.timezone || 'UTC'),
                precipitation: hour.precipitationMm || 0,
                probability: hour.precipitationProbabilityPct || 0,
                isCurrentHour: Math.abs(new Date(hour.time).getTime() - Date.now()) < 30 * 60 * 1000
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#475569' : '#e2e8f0'} />
                <XAxis 
                  dataKey="time" 
                  stroke={theme === 'dark' ? '#94a3b8' : '#64748b'}
                  tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12 }}
                />
                <YAxis 
                  yAxisId="left"
                  stroke={theme === 'dark' ? '#94a3b8' : '#64748b'}
                  tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12 }}
                />
                <YAxis 
                  yAxisId="right"
                  orientation="right"
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
                    if (name === 'precipitation') return [`${value.toFixed(1)} mm`, 'Rain Amount']
                    if (name === 'probability') return [`${Math.round(value)}%`, 'Rain Chance']
                    return [`${value}`, name]
                  }}
                />
                <Area 
                  yAxisId="left"
                  type="monotone" 
                  dataKey="precipitation" 
                  stroke="#3b82f6" 
                  fill="#3b82f6" 
                  fillOpacity={0.3}
                  strokeWidth={2}
                  name="Rain Amount"
                />
                <Line 
                  yAxisId="right"
                  type="monotone" 
                  dataKey="probability" 
                  stroke="#ec4899" 
                  strokeWidth={2}
                  strokeDasharray="5 5"
                  dot={{ fill: '#ec4899', r: 3 }}
                  name="Rain Chance"
                />
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

          {/* Cloud Cover Chart */}
          <div className={`overflow-hidden rounded-2xl border ${theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'} p-4`}>
            <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
              Cloud Cover
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={hoursToShow.map((hour: ForecastHour) => ({
                time: fmtTime(hour.time, bundle?.timezone || 'UTC'),
                cloudCover: Math.round(hour.cloudCoverPct * 100) / 100,
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
                    if (name === 'cloudCover') return [`${Math.round(value * 100) / 100}%`, 'Cloud Cover']
                    return [`${Math.round(value * 100) / 100}`, name]
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="cloudCover" 
                  stroke="#94a3b8" 
                  fill="#94a3b8" 
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                {hoursToShow.some((hour: ForecastHour) => Math.abs(new Date(hour.time).getTime() - Date.now()) < 30 * 60 * 1000) && (
                  <ReferenceLine 
                    x={hoursToShow.find((hour: ForecastHour) => Math.abs(new Date(hour.time).getTime() - Date.now()) < 30 * 60 * 1000)?.time && fmtTime(hoursToShow.find((hour: ForecastHour) => Math.abs(new Date(hour.time).getTime() - Date.now()) < 30 * 60 * 1000)!.time, bundle?.timezone || 'UTC')} 
                    stroke="#94a3b8" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    label="Now"
                  />
                )}
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Visibility Chart */}
          <div className={`overflow-hidden rounded-2xl border ${theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'} p-4`}>
            <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
              Visibility
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={hoursToShow.map((hour: ForecastHour) => ({
                time: fmtTime(hour.time, bundle?.timezone || 'UTC'),
                visibility: hour.visibilityM ? Math.round((hour.visibilityM / 1000) * 100) / 100 : 0,
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
                    if (name === 'visibility') return [`${Math.round(value * 100) / 100} km`, 'Visibility']
                    return [`${Math.round(value * 100) / 100}`, name]
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="visibility" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 3 }}
                />
                {hoursToShow.some((hour: ForecastHour) => Math.abs(new Date(hour.time).getTime() - Date.now()) < 30 * 60 * 1000) && (
                  <ReferenceLine 
                    x={hoursToShow.find((hour: ForecastHour) => Math.abs(new Date(hour.time).getTime() - Date.now()) < 30 * 60 * 1000)?.time && fmtTime(hoursToShow.find((hour: ForecastHour) => Math.abs(new Date(hour.time).getTime() - Date.now()) < 30 * 60 * 1000)!.time, bundle?.timezone || 'UTC')} 
                    stroke="#10b981" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    label="Now"
                  />
                )}
              </LineChart>
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
                tideHeight: Math.round(getTideHeight(hour.time) * 100) / 100,
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

          {/* Water Temperature Chart (if available) */}
          {hoursToShow.some((hour: ForecastHour) => hour.waterTempC) && (
            <div className={`overflow-hidden rounded-2xl border ${theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'} p-4`}>
              <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                Water Temperature ({temperatureUnit === 'celsius' ? '°C' : temperatureUnit === 'fahrenheit' ? '°F' : 'K'})
              </h3>
              <ResponsiveContainer width="100%" height={250}>
                <LineChart data={hoursToShow.map((hour: ForecastHour) => ({
                  time: fmtTime(hour.time, bundle?.timezone || 'UTC'),
                  waterTemp: hour.waterTempC ? 
                    temperatureUnit === 'fahrenheit' ? Math.round(celsiusToFahrenheit(hour.waterTempC) * 100) / 100 : 
                    temperatureUnit === 'kelvin' ? Math.round(celsiusToKelvin(hour.waterTempC) * 100) / 100 :
                    Math.round(hour.waterTempC * 100) / 100 : 0,
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
                      if (name === 'waterTemp') return [`${Math.round(value * 100) / 100}${temperatureUnit === 'celsius' ? '°C' : temperatureUnit === 'fahrenheit' ? '°F' : 'K'}`, 'Water Temp']
                      return [`${Math.round(value * 100) / 100}`, name]
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="waterTemp" 
                    stroke="#0ea5e9" 
                    strokeWidth={2}
                    dot={{ fill: '#0ea5e9', r: 3 }}
                  />
                  {hoursToShow.some((hour: ForecastHour) => Math.abs(new Date(hour.time).getTime() - Date.now()) < 30 * 60 * 1000) && (
                    <ReferenceLine 
                      x={hoursToShow.find((hour: ForecastHour) => Math.abs(new Date(hour.time).getTime() - Date.now()) < 30 * 60 * 1000)?.time && fmtTime(hoursToShow.find((hour: ForecastHour) => Math.abs(new Date(hour.time).getTime() - Date.now()) < 30 * 60 * 1000)!.time, bundle?.timezone || 'UTC')} 
                      stroke="#0ea5e9" 
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      label="Now"
                    />
                  )}
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Wind Direction Chart */}
          <div className={`overflow-hidden rounded-2xl border ${theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'} p-4`}>
            <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
              Wind Direction
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={hoursToShow.map((hour: ForecastHour) => ({
                time: fmtTime(hour.time, bundle?.timezone || 'UTC'),
                direction: hour.windDirection10mDeg,
                speed: hour.windSpeed10mKmh,
                isCurrentHour: Math.abs(new Date(hour.time).getTime() - Date.now()) < 30 * 60 * 1000
              }))}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#475569' : '#e2e8f0'} />
                <XAxis 
                  dataKey="time" 
                  stroke={theme === 'dark' ? '#94a3b8' : '#64748b'}
                  tick={{ fill: theme === 'dark' ? '#94a3b8' : '#64748b', fontSize: 12 }}
                />
                <YAxis 
                  domain={[0, 360]}
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
                    if (name === 'direction') return [`${Math.round(value)}° (${degToCompass(value)})`, 'Wind Direction']
                    if (name === 'speed') return [`${formatWindSpeed(value, unit)}`, 'Wind Speed']
                    return [`${value}`, name]
                  }}
                />
                <Line 
                  type="monotone" 
                  dataKey="direction" 
                  stroke="#f59e0b" 
                  strokeWidth={2}
                  dot={{ fill: '#f59e0b', r: 3 }}
                />
                {hoursToShow.some((hour: ForecastHour) => Math.abs(new Date(hour.time).getTime() - Date.now()) < 30 * 60 * 1000) && (
                  <ReferenceLine 
                    x={hoursToShow.find((hour: ForecastHour) => Math.abs(new Date(hour.time).getTime() - Date.now()) < 30 * 60 * 1000)?.time && fmtTime(hoursToShow.find((hour: ForecastHour) => Math.abs(new Date(hour.time).getTime() - Date.now()) < 30 * 60 * 1000)!.time, bundle?.timezone || 'UTC')} 
                    stroke="#f59e0b" 
                    strokeWidth={2}
                    strokeDasharray="5 5"
                    label="Now"
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </section>
  )
}