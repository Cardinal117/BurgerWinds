import React, { useState, useMemo, useEffect } from 'react'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts'
import { Wind, Droplets, Eye, Gauge, Waves, Thermometer, Calendar, Settings, Table, TrendingUp } from 'lucide-react'
import { ForecastBundle, ForecastHour } from '../lib/openMeteo'
import { formatWindSpeed, WindUnit, fmtTime, fmtDay } from '../lib/format'

interface WeatherDashboardProps {
  bundle: ForecastBundle | null
  nowHour: ForecastHour | null
  theme: 'light' | 'dark'
  unit: WindUnit
  onUnitChange: (unit: WindUnit) => void
  onThemeChange: (theme: 'light' | 'dark') => void
}

export function WeatherDashboard({ bundle, nowHour, theme, unit, onUnitChange, onThemeChange }: WeatherDashboardProps) {
  const [selectedDay, setSelectedDay] = useState(0)
  const [showSettings, setShowSettings] = useState(false)
  const [viewMode, setViewMode] = useState<'charts' | 'table'>('charts')
  const [displayMode, setDisplayMode] = useState<'casual' | 'windsurfer' | 'everything'>(() => {
    const saved = localStorage.getItem('bw_display_mode')
    if (saved === 'windsurfer') return 'windsurfer'
    if (saved === 'everything') return 'everything'
    return 'casual'
  })
  const [skillLevel, setSkillLevel] = useState<'beginner' | 'casual' | 'experienced'>(() => {
    const saved = localStorage.getItem('bw_skill_level')
    return (saved === 'beginner' || saved === 'casual' || saved === 'experienced') ? saved : 'casual'
  })

  useEffect(() => {
    localStorage.setItem('bw_display_mode', displayMode)
  }, [displayMode])

  useEffect(() => {
    localStorage.setItem('bw_skill_level', skillLevel)
  }, [skillLevel])

  // Generate day options
  const dayOptions = useMemo(() => {
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
  
  const selectedDayData = dayOptions[selectedDay] || null
  
  // Calculate tide height
  const calculateTideHeight = (time: string): number => {
    const date = new Date(time)
    const hours = date.getUTCHours()
    const tidalPeriod = 12.42
    const phase = (hours % tidalPeriod) / tidalPeriod * 2 * Math.PI
    const meanTide = 1.1
    const tideRange = 0.9
    return meanTide + tideRange * Math.sin(phase - Math.PI / 2)
  }

  // Get weather emoji
  const getWeatherEmoji = (hour: ForecastHour): string => {
    const temp = hour.temperatureC || 0
    const rainChance = hour.precipitationProbabilityPct || 0
    
    if (rainChance > 70) return '🌧️'
    if (rainChance > 40) return '🌦️'
    if (temp > 30) return '🌞'
    if (temp > 20) return '⛅'
    if (temp > 10) return '☁️'
    if (temp > 0) return '🌨️'
    return '❄️'
  }

  const chartData = selectedDayData?.hours.map((hour: any) => {
    let windSpeed = hour.windSpeed10mKmh
    // Convert wind speed to the selected unit
    if (unit === 'kts') {
      windSpeed = windSpeed / 1.852
    } else if (unit === 'mps') {
      windSpeed = windSpeed / 3.6
    }
    
    return {
      time: fmtTime(hour.time, bundle?.timezone || 'UTC'),
      windSpeed: windSpeed,
      temperature: hour.temperatureC,
      humidity: hour.humidityPct,
      waveHeight: hour.waveHeightM,
      precipitation: hour.precipitationProbabilityPct,
      tideHeight: calculateTideHeight(hour.time)
    }
  }) || []
  
  if (!bundle || !nowHour) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className={`text-center ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
          <Wind size={48} className="mx-auto mb-4 opacity-50" />
          <p>Loading weather data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className={`text-xl sm:text-2xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            {bundle.locationName}
          </h1>
          <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
            {fmtDay(nowHour.time, bundle.timezone)} • {fmtTime(nowHour.time, bundle.timezone)}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`p-2 rounded-lg border transition-colors ${
              theme === 'dark'
                ? 'bg-gray-800 border-gray-700 text-gray-300 hover:text-white'
                : 'bg-white border-gray-300 text-gray-600 hover:text-gray-900'
            }`}
          >
            <Settings size={16} />
          </button>
        </div>
      </div>

      {/* Settings Panel */}
      {showSettings && (
        <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Settings
          </h3>
          <div className="space-y-4">
            {/* Display Mode */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Display Mode
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setDisplayMode('casual')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    displayMode === 'casual'
                      ? theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                      : theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  ☀️ Casual
                </button>
                <button
                  onClick={() => setDisplayMode('windsurfer')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    displayMode === 'windsurfer'
                      ? theme === 'dark' ? 'bg-green-600 text-white' : 'bg-green-500 text-white'
                      : theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  🏄 Windsurfer
                </button>
                <button
                  onClick={() => setDisplayMode('everything')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    displayMode === 'everything'
                      ? theme === 'dark' ? 'bg-purple-600 text-white' : 'bg-purple-500 text-white'
                      : theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  🌟 Everything
                </button>
              </div>
            </div>
            
            {/* Unit Selector */}
            <div>
              <label className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                Wind Unit
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => onUnitChange('kmh')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    unit === 'kmh'
                      ? theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                      : theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  km/h
                </button>
                <button
                  onClick={() => onUnitChange('kts')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    unit === 'kts'
                      ? theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                      : theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  knots
                </button>
                <button
                  onClick={() => onUnitChange('mps')}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    unit === 'mps'
                      ? theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                      : theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                  }`}
                >
                  m/s
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Day Selector */}
      <div className="flex flex-wrap gap-2">
        {dayOptions.map((day, index) => (
          <button
            key={index}
            onClick={() => setSelectedDay(index)}
            className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedDay === index
                ? theme === 'dark' ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
                : theme === 'dark' ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
            }`}
          >
            {day.label}
          </button>
        ))}
      </div>

      {/* Current Conditions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
        {displayMode === 'casual' && (
          <>
            <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-2xl">{getWeatherEmoji(nowHour)}</span>
                <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Current</span>
              </div>
              <div className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {Math.round(nowHour.temperatureC)}°C
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Wind size={16} className={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} />
                <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Wind</span>
              </div>
              <div className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {formatWindSpeed(nowHour.windSpeed10mKmh, unit)}
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Waves size={16} className={theme === 'dark' ? 'text-teal-400' : 'text-teal-600'} />
                <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Waves</span>
              </div>
              <div className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {nowHour.waveHeightM?.toFixed(1)} m
              </div>
            </div>
          </>
        )}
        
        {(displayMode === 'windsurfer' || displayMode === 'everything') && (
          <>
            <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Wind size={16} className={theme === 'dark' ? 'text-blue-400' : 'text-blue-600'} />
                <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Wind</span>
              </div>
              <div className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {formatWindSpeed(nowHour.windSpeed10mKmh, unit)}
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Waves size={16} className={theme === 'dark' ? 'text-teal-400' : 'text-teal-600'} />
                <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Waves</span>
              </div>
              <div className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {nowHour.waveHeightM?.toFixed(1)} m
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Gauge size={16} className={theme === 'dark' ? 'text-purple-400' : 'text-purple-600'} />
                <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Tide</span>
              </div>
              <div className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {calculateTideHeight(nowHour.time).toFixed(1)} m
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Thermometer size={16} className={theme === 'dark' ? 'text-orange-400' : 'text-orange-600'} />
                <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Temp</span>
              </div>
              <div className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {Math.round(nowHour.temperatureC)}°C
              </div>
            </div>
          </>
        )}
        
        {displayMode === 'everything' && (
          <>
            <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Droplets size={16} className={theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'} />
                <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Humidity</span>
              </div>
              <div className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {Math.round(nowHour.humidityPct)}%
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Gauge size={16} className={theme === 'dark' ? 'text-purple-400' : 'text-purple-600'} />
                <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Pressure</span>
              </div>
              <div className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {Math.round(nowHour.pressureMslHpa || 0)} hPa
              </div>
            </div>

            <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <Eye size={16} className={theme === 'dark' ? 'text-gray-400' : 'text-gray-600'} />
                <span className={`text-xs font-medium ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>Visibility</span>
              </div>
              <div className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                {(nowHour.visibilityM! / 1000).toFixed(1)} km
              </div>
            </div>
          </>
        )}
      </div>

      {/* Charts */}
      <div className="space-y-4">
        {/* Wind Speed Chart */}
        <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Wind Speed ({unit})
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
              <XAxis 
                dataKey="time" 
                stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#6B7280', fontSize: 12 }}
              />
              <YAxis 
                stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#6B7280', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                  border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                  borderRadius: '8px'
                }}
                labelStyle={{ color: theme === 'dark' ? '#F3F4F6' : '#111827' }}
              />
              <Area 
                type="monotone" 
                dataKey="windSpeed" 
                stroke="#3B82F6" 
                fill="#3B82F6" 
                fillOpacity={0.3}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Temperature Chart */}
        <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
          <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
            Temperature
          </h3>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
              <XAxis 
                dataKey="time" 
                stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#6B7280', fontSize: 12 }}
              />
              <YAxis 
                stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#6B7280', fontSize: 12 }}
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                  border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                  borderRadius: '8px'
                }}
                labelStyle={{ color: theme === 'dark' ? '#F3F4F6' : '#111827' }}
              />
              <Line 
                type="monotone" 
                dataKey="temperature" 
                stroke="#F97316" 
                strokeWidth={2}
                dot={{ fill: '#F97316', r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Wave Height Chart */}
        {displayMode !== 'casual' && (
          <div className={`p-4 rounded-xl border ${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
            <h3 className={`text-lg font-semibold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
              Wave Height
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme === 'dark' ? '#374151' : '#E5E7EB'} />
                <XAxis 
                  dataKey="time" 
                  stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                  tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#6B7280', fontSize: 12 }}
                />
                <YAxis 
                  stroke={theme === 'dark' ? '#9CA3AF' : '#6B7280'}
                  tick={{ fill: theme === 'dark' ? '#9CA3AF' : '#6B7280', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: theme === 'dark' ? '#1F2937' : '#FFFFFF',
                    border: `1px solid ${theme === 'dark' ? '#374151' : '#E5E7EB'}`,
                    borderRadius: '8px'
                  }}
                  labelStyle={{ color: theme === 'dark' ? '#F3F4F6' : '#111827' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="waveHeight" 
                  stroke="#06B6D4" 
                  strokeWidth={2}
                  dot={{ fill: '#06B6D4', r: 3 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  )
}