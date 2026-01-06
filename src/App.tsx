import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { degToCompass, formatWindSpeed, fmtDay, fmtTime, WindUnit } from './lib/format'
import { fetchForecast, ForecastBundle, ForecastHour, geocode, GeoResult } from './lib/openMeteo'
import { ChevronUp, ChevronDown, Settings } from 'lucide-react'
import { Compass } from './components/Compass'
import { HourlyForecast } from './components/HourlyForecast'
import { FloatingButtons } from './components/FloatingButtons'
import { LocationPanel } from './components/LocationPanel'
import { NtfyPanel, NtfySettings } from './components/NtfyPanel'

type Theme = 'light' | 'dark'
type ViewMode = 'casual' | 'surfer' | 'everything' | 'custom'

type SavedLocation = GeoResult

type SavedLocations = {
  items: SavedLocation[]
}

type CompassDirection = 'wind' | 'wave'

type CustomSettings = {
  topRow: string[]
  cardDetails: string[]
  hoursToShow: number
  compassDirection: CompassDirection
}

type ViewModeToggles = {
  windConsistency: boolean
  waterSurface: boolean
  waterMovement: boolean
  visibilitySafety: boolean
  temperature: boolean
  uvIndex: boolean
  tideInfo: boolean
}

const DEFAULT_LOCATION: SavedLocation = {
  id: 0,
  name: 'Langebaan, ZA',
  latitude: -33.0919,
  longitude: 18.0392,
  timezone: 'Africa/Johannesburg',
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

function writeJson(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value))
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n))
}

function parseHoursCsv(v: string): number[] {
  const items = v
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => Number(s))
    .filter((n) => Number.isFinite(n))
    .map((n) => Math.round(n))
    .filter((n) => n >= 0 && n <= 23)

  return Array.from(new Set(items)).sort((a, b) => a - b)
}

function fmtVisibility(m?: number): string {
  if (m == null || Number.isNaN(m)) return '—'
  return `${(m / 1000).toFixed(1)} km`
}

function getDirectionColor(deg: number): string {
  const normalized = ((deg + 360) % 360)
  if (normalized >= 337.5 || normalized < 22.5) return 'text-red-600' // N
  if (normalized >= 22.5 && normalized < 67.5) return 'text-orange-600' // NE
  if (normalized >= 67.5 && normalized < 112.5) return 'text-yellow-600' // E
  if (normalized >= 112.5 && normalized < 157.5) return 'text-green-600' // SE
  if (normalized >= 157.5 && normalized < 202.5) return 'text-blue-600' // S
  if (normalized >= 202.5 && normalized < 247.5) return 'text-indigo-600' // SW
  if (normalized >= 247.5 && normalized < 292.5) return 'text-purple-600' // W
  return 'text-pink-600' // NW
}

function getWindSurferRating(windSpeedKmh: number): { rating: string; color: string; range: string } {
  if (windSpeedKmh < 16) return { rating: 'Light', color: 'text-green-600', range: '5–16 km/h' }
  if (windSpeedKmh < 30) return { rating: 'Moderate', color: 'text-yellow-600', range: '16–30 km/h' }
  return { rating: 'Strong+', color: 'text-red-600', range: '30+ km/h' }
}

function getWaterSurfaceDescription(waveHeightM?: number, windSpeedKmh?: number): { condition: string; color: string } {
  if (!waveHeightM || waveHeightM < 0.3) return { condition: 'Smooth', color: 'text-blue-600' }
  if (waveHeightM < 0.8) return { condition: 'Choppy', color: 'text-green-600' }
  return { condition: 'Rough', color: 'text-orange-600' }
}

function isSideOnshore(windDeg: number): boolean {
  // Simplified: assumes shore is roughly north for most spots
  const normalized = ((windDeg + 360) % 360)
  return (normalized >= 315 || normalized < 45) || (normalized >= 135 && normalized < 225)
}

async function sendToNtfy(message: string, topic: string) {
  try {
    await fetch(`https://ntfy.sh/${topic}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Title': 'BurgerWinds Forecast',
        'Priority': 'high',
        'Tags': 'weather,wind,forecast',
      },
      body: JSON.stringify({ message }),
    })
  } catch (e) {
    console.error('ntfy.sh send failed:', e)
    throw e
  }
}

function getViewModeSpecificMessage(bundle: ForecastBundle, nowHour: ForecastHour, unit: WindUnit, viewMode: ViewMode): string {
  const location = bundle.locationName
  const time = fmtTime(nowHour.time, bundle.timezone)

  if (viewMode === 'surfer') {
    const wind = `${formatWindSpeed(nowHour.windSpeed10mKmh, unit)} ${degToCompass(nowHour.windDirection10mDeg)}`
    const windRating = getWindSurferRating(nowHour.windSpeed10mKmh)
    const water = getWaterSurfaceDescription(nowHour.waveHeightM, nowHour.windSpeed10mKmh)
    const windType = isSideOnshore(nowHour.windDirection10mDeg) ? 'Side-onshore' : 'Cross-shore'
    const temp = `${Math.round(nowHour.temperatureC)}°C`

    return `🏄‍♂️ Wind Surfer Report - ${location}
⏰ ${time} • 🌡️ ${temp}
💨 Wind: ${wind} (${windRating.rating})
🌊 Water: ${water.condition} • ${windType}
📊 Rating: ${windRating.rating} (${windRating.range})
${nowHour.waveHeightM ? `🌊 Waves: ${nowHour.waveHeightM.toFixed(1)}m ${nowHour.wavePeriodS ? `${Math.round(nowHour.wavePeriodS)}s` : ''}` : ''}
${nowHour.waterTempC ? `💧 Water: ${nowHour.waterTempC.toFixed(1)}°C` : ''}`
  }

  if (viewMode === 'everything') {
    const wind = `${formatWindSpeed(nowHour.windSpeed10mKmh, unit)} ${degToCompass(nowHour.windDirection10mDeg)}`
    const gust = nowHour.windGusts10mKmh ? `Gust ${formatWindSpeed(nowHour.windGusts10mKmh, unit)}` : ''
    const temp = `${Math.round(nowHour.temperatureC)}°C`
    const hum = `${Math.round(nowHour.humidityPct)}%`
    const clouds = `${Math.round(nowHour.cloudCoverPct)}%`
    const rain = nowHour.precipitationProbabilityPct ? `Rain ${Math.round(nowHour.precipitationProbabilityPct)}%` : ''
    const pressure = nowHour.pressureMslHpa ? `${Math.round(nowHour.pressureMslHpa)}hPa` : ''
    const vis = nowHour.visibilityM ? `Vis ${(nowHour.visibilityM / 1000).toFixed(1)}km` : ''
    const waves = nowHour.waveHeightM ? `Waves ${nowHour.waveHeightM.toFixed(1)}m` : ''
    const water = nowHour.waterTempC ? `Water ${nowHour.waterTempC.toFixed(1)}°C` : ''

    return `📊 Complete Weather Report - ${location}
⏰ ${time}
💨 Wind: ${wind} ${gust}
🌡️ Temp: ${temp} • Humidity: ${hum} • Clouds: ${clouds}
${rain ? `🌧️ ${rain}` : ''} ${pressure ? `📏 ${pressure}` : ''} ${vis ? `👁️ ${vis}` : ''}
${waves ? `🌊 ${waves}` : ''} ${water ? `💧 ${water}` : ''}`
  }

  if (viewMode === 'custom') {
    // Custom mode would need to access customSettings, but for now use casual
    return getCasualMessage(bundle, nowHour, unit)
  }

  // Default casual mode
  return getCasualMessage(bundle, nowHour, unit)
}

function getCasualMessage(bundle: ForecastBundle, nowHour: ForecastHour, unit: WindUnit): string {
  const location = bundle.locationName
  const time = fmtTime(nowHour.time, bundle.timezone)
  const wind = `${formatWindSpeed(nowHour.windSpeed10mKmh, unit)} ${degToCompass(nowHour.windDirection10mDeg)}`
  const temp = `${Math.round(nowHour.temperatureC)}°C`
  const conditions = nowHour.precipitationProbabilityPct && nowHour.precipitationProbabilityPct > 30 ?
    `Rain ${Math.round(nowHour.precipitationProbabilityPct)}%` : 'Clear'

  return `☀️ Daily Weather - ${location}
⏰ ${time}
💨 Wind: ${wind}
🌡️ Temp: ${temp}
🌤️ ${conditions}`
}

export default function App() {
  const [unit, setUnit] = useState<WindUnit>(() => readJson<WindUnit>('bw_unit', 'kmh'))
  const [theme, setTheme] = useState<Theme>(() => readJson<Theme>('bw_theme', 'light'))
  const [viewMode, setViewMode] = useState<ViewMode>(() => readJson<ViewMode>('bw_view_mode', 'casual'))
  const [toggles, setToggles] = useState<ViewModeToggles>(() => readJson<ViewModeToggles>('bw_toggles', {
    windConsistency: true,
    waterSurface: true,
    waterMovement: true,
    visibilitySafety: true,
    temperature: true,
    uvIndex: false,
    tideInfo: false,
  }))
  const [ntfy, setNtfy] = useState<NtfySettings>(() => readJson<NtfySettings>('bw_ntfy', { enabled: false, topic: '', schedule: [] }))
  const [location, setLocation] = useState<SavedLocation>(() => {
    const saved = readJson<SavedLocations>('bw_saved_locations', { items: [] })
    const current = readJson<SavedLocation>('bw_location', DEFAULT_LOCATION)
    return saved.items.find((l) => l.id === current.id) || current
  })
  const [savedLocations, setSavedLocations] = useState<SavedLocations>(() => readJson('bw_saved_locations', { items: [] }))
  const [customSettings, setCustomSettings] = useState<CustomSettings>(() => readJson<CustomSettings>('bw_custom_settings', {
    topRow: ['wind', 'temperature', 'time'],
    cardDetails: ['wind', 'temperature', 'humidity', 'clouds'],
    hoursToShow: 36,
    compassDirection: 'wind'
  }))

  const [bundle, setBundle] = useState<ForecastBundle | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const [showLocationPanel, setShowLocationPanel] = useState(false)
  const [showNtfyPanel, setShowNtfyPanel] = useState(false)

  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<GeoResult[]>([])
  const searchTimer = useRef<number | null>(null)

  useEffect(() => {
    writeJson('bw_unit', unit)
  }, [unit])

  useEffect(() => {
    writeJson('bw_theme', theme)
  }, [theme])

  useEffect(() => {
    writeJson('bw_view_mode', viewMode)
  }, [viewMode])

  useEffect(() => {
    writeJson('bw_toggles', toggles)
  }, [toggles])

  useEffect(() => {
    writeJson('bw_ntfy', ntfy)
  }, [ntfy])

  useEffect(() => {
    writeJson('bw_location', location)
  }, [location])

  useEffect(() => {
    writeJson('bw_saved_locations', savedLocations)
  }, [savedLocations])

  useEffect(() => {
    writeJson('bw_custom_settings', customSettings)
  }, [customSettings])

  // Hourly forecast filter state
  const [hourlyFilter, setHourlyFilter] = useState<'6h' | '24h' | '7d'>('24h')

  const refresh = useCallback(async () => {
    setLoading(true)
    setErr(null)
    try {
      const b = await fetchForecast({
        latitude: location.latitude,
        longitude: location.longitude,
        locationName: location.name,
        timezone: location.timezone,
      })
      setBundle(b)
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Failed to load forecast')
    } finally {
      setLoading(false)
    }
  }, [location.latitude, location.longitude, location.name, location.timezone])

  useEffect(() => {
    void refresh()
  }, [refresh])

  useEffect(() => {
    if (!search.trim()) {
      setSearchResults([])
      return
    }

    if (searchTimer.current) window.clearTimeout(searchTimer.current)
    searchTimer.current = window.setTimeout(async () => {
      try {
        const results = await geocode(search.trim())
        setSearchResults(results)
      } catch {
        setSearchResults([])
      }
    }, 300)

    return () => {
      if (searchTimer.current) window.clearTimeout(searchTimer.current)
    }
  }, [search])

  const nowHour = useMemo(() => {
    if (!bundle?.hours?.length) return null
    const now = Date.now()
    let best = bundle.hours[0]
    let bestDelta = Math.abs(new Date(best.time).getTime() - now)
    for (const h of bundle.hours) {
      const d = Math.abs(new Date(h.time).getTime() - now)
      if (d < bestDelta) {
        best = h
        bestDelta = d
      }
    }
    return best
  }, [bundle])

  // ntfy scheduling
  useEffect(() => {
    if (!ntfy.enabled || !ntfy.topic || ntfy.schedule.length === 0) return

    const checkSchedule = () => {
      const now = new Date()
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

      if (ntfy.schedule.includes(currentTime) && bundle && nowHour) {
        const message = getViewModeSpecificMessage(bundle, nowHour, unit, viewMode)
        void sendToNtfy(message, ntfy.topic)
      }
    }

    // Check every minute
    const interval = setInterval(checkSchedule, 60000)

    // Check immediately on load
    checkSchedule()

    return () => clearInterval(interval)
  }, [ntfy.enabled, ntfy.topic, ntfy.schedule, bundle, nowHour, unit, viewMode])

  const condensedMessage = useMemo(() => {
    if (!bundle || !nowHour) return ''

    const wind = `${formatWindSpeed(nowHour.windSpeed10mKmh, unit)} ${degToCompass(nowHour.windDirection10mDeg)}`
    const gust =
      nowHour.windGusts10mKmh == null || Number.isNaN(nowHour.windGusts10mKmh)
        ? ''
        : ` | Gust ${formatWindSpeed(nowHour.windGusts10mKmh, unit)}`
    const temp = `${Math.round(nowHour.temperatureC)}°C`
    const hum = `${Math.round(nowHour.humidityPct)}%`
    const clouds = `${Math.round(nowHour.cloudCoverPct)}%`

    const rainProb =
      nowHour.precipitationProbabilityPct == null || Number.isNaN(nowHour.precipitationProbabilityPct)
        ? ''
        : ` | Rain ${Math.round(nowHour.precipitationProbabilityPct)}%`

    const rainMm =
      nowHour.precipitationMm == null || Number.isNaN(nowHour.precipitationMm)
        ? ''
        : ` ${nowHour.precipitationMm.toFixed(1)}mm`

    const pressure =
      nowHour.pressureMslHpa == null || Number.isNaN(nowHour.pressureMslHpa)
        ? ''
        : ` | ${Math.round(nowHour.pressureMslHpa)}hPa`

    const vis = nowHour.visibilityM == null || Number.isNaN(nowHour.visibilityM) ? '' : ` | Vis ${(nowHour.visibilityM / 1000).toFixed(1)}km`

    const waves =
      nowHour.waveHeightM == null || Number.isNaN(nowHour.waveHeightM)
        ? ''
        : ` | Waves ${nowHour.waveHeightM.toFixed(1)}m`

    const waveDir =
      nowHour.waveDirectionDeg == null || Number.isNaN(nowHour.waveDirectionDeg)
        ? ''
        : ` ${degToCompass(nowHour.waveDirectionDeg)}`

    const wavePeriod =
      nowHour.wavePeriodS == null || Number.isNaN(nowHour.wavePeriodS)
        ? ''
        : ` ${Math.round(nowHour.wavePeriodS)}s`

    const water =
      nowHour.waterTempC == null || Number.isNaN(nowHour.waterTempC)
        ? ''
        : ` | Water ${nowHour.waterTempC.toFixed(1)}°C`

    const rise = bundle.sunrise ? fmtTime(bundle.sunrise, bundle.timezone) : ''
    const set = bundle.sunset ? fmtTime(bundle.sunset, bundle.timezone) : ''
    const sun = rise && set ? ` | Sun ${rise}-${set}` : ''

    const t = fmtTime(nowHour.time, bundle.timezone)
    return `BurgerWinds • ${bundle.locationName} • ${t} • Wind ${wind}${gust} • Temp ${temp} • Hum ${hum} • Clouds ${clouds}${rainProb}${rainMm}${pressure}${vis}${waves}${waveDir}${wavePeriod}${water}${sun}`
  }, [bundle, nowHour, unit])

  function selectLocation(r: GeoResult) {
    const name = [r.name, r.admin1, r.country].filter(Boolean).join(', ')
    setLocation({
      id: Date.now(),
      name,
      latitude: r.latitude,
      longitude: r.longitude,
      timezone: r.timezone ?? 'Africa/Johannesburg',
    })
    setSearch('')
    setSearchResults([])
  }

  const hoursToShow = useMemo(() => {
    if (!bundle?.hours?.length) return []

    const hoursToTake = hourlyFilter === '6h' ? 6 : hourlyFilter === '24h' ? 24 : 168 // 7 days = 168 hours
    return bundle.hours.slice(0, hoursToTake)
  }, [bundle, hourlyFilter])

  const compassDirection = customSettings.compassDirection === 'wind'
    ? nowHour?.windDirection10mDeg
    : nowHour?.waveDirectionDeg

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-gradient-to-br from-blue-50 to-white text-slate-900'}`}>
      <div className="mx-auto w-full max-w-6xl px-4 pb-32 pt-6 md:px-6">
        {/* Header with basics */}
        <header className="mb-6">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0">
              <div className={`text-xs font-semibold uppercase tracking-wide ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>BurgerWinds</div>
              <div className="truncate text-2xl font-bold">{location.name}</div>
              {bundle?.sunrise && bundle?.sunset ? (
                <div className={`text-sm ${theme === 'dark' ? 'text-slate-400' : 'text-slate-600'}`}>
                  {fmtDay(bundle.sunrise, bundle.timezone)} • Sun {fmtTime(bundle.sunrise, bundle.timezone)}–{fmtTime(bundle.sunset, bundle.timezone)}
                </div>
              ) : null}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <select
                value={viewMode}
                onChange={(e) => setViewMode(e.target.value as ViewMode)}
                className={`rounded-full px-3 py-2 text-xs font-medium shadow-md hover:opacity-90 outline-none ${theme === 'dark'
                    ? 'bg-slate-700 text-slate-200 ring-1 ring-slate-600 hover:bg-slate-600'
                    : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
                  }`}
              >
                <option value="casual">Casual</option>
                <option value="surfer">Wind Surfer</option>
                <option value="everything">Everything</option>
                <option value="custom">Custom</option>
              </select>
              <button
                className={`rounded-full px-4 py-2 text-xs font-medium shadow-md hover:opacity-90 ${theme === 'dark'
                    ? 'bg-slate-800 text-slate-200 ring-1 ring-slate-700 hover:bg-slate-700'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                onClick={() => setUnit((u) => (u === 'kmh' ? 'kts' : 'kmh'))}
                type="button"
              >
                {unit === 'kmh' ? 'km/h' : 'kts'}
              </button>
              <button
                className={`rounded-full px-4 py-2 text-xs font-medium shadow-md hover:opacity-90 ${theme === 'dark'
                    ? 'bg-slate-700 text-yellow-400 ring-1 ring-slate-600 hover:bg-slate-600'
                    : 'bg-white text-blue-600 ring-1 ring-blue-200 hover:bg-blue-50'
                  }`}
                onClick={() => setTheme((t) => (t === 'light' ? 'dark' : 'light'))}
                type="button"
              >
                {theme === 'light' ? '🌙' : '☀️'}
              </button>
              <button
                className={`rounded-full px-4 py-2 text-xs font-medium shadow-md hover:opacity-90 ${theme === 'dark'
                    ? 'bg-slate-800 text-slate-200 ring-1 ring-slate-700 hover:bg-slate-700'
                    : 'bg-white text-blue-600 ring-1 ring-blue-200 hover:bg-blue-50'
                  }`}
                onClick={() => void refresh()}
                type="button"
              >
                {loading ? 'Loading…' : 'Refresh'}
              </button>
            </div>
          </div>
        </header>

        {/* Now card */}
        {nowHour ? (
          <div className={`mb-8 rounded-3xl p-6 shadow-lg ring-1 ${theme === 'dark' ? 'bg-slate-800 ring-slate-700' : 'bg-white ring-blue-100'
            }`}>
            <div className={`mb-4 text-xs font-semibold uppercase tracking-wide ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
              }`}>Now</div>

            {viewMode === 'custom' && (
              <div className={`mb-4 rounded-2xl p-4 ${theme === 'dark' ? 'bg-slate-900' : 'bg-blue-50'
                }`}>
                <div className={`text-xs font-semibold mb-3 uppercase tracking-wide ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'
                  }`}>Custom View</div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                  {customSettings.topRow.map((item) => {
                    if (item === 'wind') return (
                      <div key={item} className={`rounded-xl p-3 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
                        <div className={`text-xs font-medium mb-1 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Wind</div>
                        <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                          {formatWindSpeed(nowHour.windSpeed10mKmh, unit)}
                        </div>
                        <div className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                          <span className={getDirectionColor(nowHour.windDirection10mDeg)}>
                            {degToCompass(nowHour.windDirection10mDeg)}
                          </span>{' '}
                          ({Math.round(nowHour.windDirection10mDeg)}°)
                        </div>
                        <div className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                          Gust {nowHour.windGusts10mKmh == null ? '—' : formatWindSpeed(nowHour.windGusts10mKmh, unit)}
                        </div>
                      </div>
                    )
                    if (item === 'temperature') return (
                      <div key={item} className={`rounded-xl p-3 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
                        <div className={`text-xs font-medium mb-1 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Weather</div>
                        <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>{Math.round(nowHour.temperatureC)}°C</div>
                        <div className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                          Hum {Math.round(nowHour.humidityPct)}% • Clouds {Math.round(nowHour.cloudCoverPct)}%
                        </div>
                      </div>
                    )
                    if (item === 'time') return (
                      <div key={item} className={`rounded-xl p-3 ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'}`}>
                        <div className={`text-xs font-medium mb-1 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Time</div>
                        <div className={`text-2xl font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                          {bundle ? fmtTime(nowHour.time, bundle.timezone) : nowHour.time}
                        </div>
                        <div className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                          {bundle ? fmtDay(bundle.sunrise || '', bundle.timezone) : ''}
                        </div>
                      </div>
                    )
                    return null
                  })}
                </div>
              </div>
            )}

            <div className={`grid grid-cols-1 gap-4 ${viewMode === 'surfer' ? 'md:grid-cols-2' : viewMode === 'custom' ? 'md:grid-cols-2 lg:grid-cols-4' : 'md:grid-cols-2 lg:grid-cols-4'}`}>
              {viewMode !== 'custom' && (
                <>
                  <div className={`rounded-2xl p-4 ${theme === 'dark' ? 'bg-slate-900' : 'bg-blue-50'}`}>
                    <div className={`text-xs font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Wind</div>
                    <div className={`mt-1 text-2xl font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                      {formatWindSpeed(nowHour.windSpeed10mKmh, unit)}
                    </div>
                    <div className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                      <span className={getDirectionColor(nowHour.windDirection10mDeg)}>
                        {degToCompass(nowHour.windDirection10mDeg)}
                      </span>{' '}
                      ({Math.round(nowHour.windDirection10mDeg)}°)
                    </div>
                    <div className={`mt-1 text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      Gust {nowHour.windGusts10mKmh == null ? '—' : formatWindSpeed(nowHour.windGusts10mKmh, unit)}
                    </div>
                  </div>
                  <div className={`rounded-2xl p-4 ${theme === 'dark' ? 'bg-slate-900' : 'bg-blue-50'}`}>
                    <div className={`text-xs font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Weather</div>
                    <div className={`mt-1 text-2xl font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>{Math.round(nowHour.temperatureC)}°C</div>
                    <div className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                      Hum {Math.round(nowHour.humidityPct)}% • Clouds {Math.round(nowHour.cloudCoverPct)}%
                    </div>
                    <div className={`mt-1 text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      Rain {nowHour.precipitationProbabilityPct == null ? '—' : `${Math.round(nowHour.precipitationProbabilityPct)}%`}
                      {nowHour.precipitationMm == null ? '' : ` • ${nowHour.precipitationMm.toFixed(1)}mm`}
                    </div>
                    <div className={`mt-1 text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      P {nowHour.pressureMslHpa == null ? '—' : `${Math.round(nowHour.pressureMslHpa)} hPa`} • Vis {fmtVisibility(nowHour.visibilityM)}
                    </div>
                  </div>
                  <div className={`rounded-2xl p-4 ${theme === 'dark' ? 'bg-slate-900' : 'bg-blue-50'}`}>
                    <div className={`text-xs font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Waves</div>
                    <div className={`mt-1 text-2xl font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                      {nowHour.waveHeightM == null ? '—' : `${nowHour.waveHeightM.toFixed(1)} m`}
                    </div>
                    <div className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                      {nowHour.waveDirectionDeg == null ? '—' : (
                        <span className={getDirectionColor(nowHour.waveDirectionDeg)}>
                          {degToCompass(nowHour.waveDirectionDeg)}
                        </span>
                      )}
                      {nowHour.wavePeriodS == null ? '' : ` • ${Math.round(nowHour.wavePeriodS)}s`}
                    </div>
                  </div>
                  <div className={`rounded-2xl p-4 ${theme === 'dark' ? 'bg-slate-900' : 'bg-blue-50'}`}>
                    <div className={`text-xs font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Water</div>
                    <div className={`mt-1 text-2xl font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                      {nowHour.waterTempC == null ? '—' : `${nowHour.waterTempC.toFixed(1)}°C`}
                    </div>
                    <div className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Sea surface</div>
                  </div>
                </>
              )}

              {/* Custom mode cards */}
              {viewMode === 'custom' && customSettings.cardDetails.map((item) => {
                if (item === 'wind') return (
                  <div key={item} className={`rounded-2xl p-4 ${theme === 'dark' ? 'bg-slate-900' : 'bg-blue-50'}`}>
                    <div className={`text-xs font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Wind</div>
                    <div className={`mt-1 text-2xl font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                      {formatWindSpeed(nowHour.windSpeed10mKmh, unit)}
                    </div>
                    <div className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                      <span className={getDirectionColor(nowHour.windDirection10mDeg)}>
                        {degToCompass(nowHour.windDirection10mDeg)}
                      </span>{' '}
                      ({Math.round(nowHour.windDirection10mDeg)}°)
                    </div>
                    <div className={`mt-1 text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      Gust {nowHour.windGusts10mKmh == null ? '—' : formatWindSpeed(nowHour.windGusts10mKmh, unit)}
                    </div>
                  </div>
                )
                if (item === 'temperature') return (
                  <div key={item} className={`rounded-2xl p-4 ${theme === 'dark' ? 'bg-slate-900' : 'bg-blue-50'}`}>
                    <div className={`text-xs font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Weather</div>
                    <div className={`mt-1 text-2xl font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>{Math.round(nowHour.temperatureC)}°C</div>
                    <div className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                      Hum {Math.round(nowHour.humidityPct)}% • Clouds {Math.round(nowHour.cloudCoverPct)}%
                    </div>
                    <div className={`mt-1 text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      Rain {nowHour.precipitationProbabilityPct == null ? '—' : `${Math.round(nowHour.precipitationProbabilityPct)}%`}
                      {nowHour.precipitationMm == null ? '' : ` • ${nowHour.precipitationMm.toFixed(1)}mm`}
                    </div>
                    <div className={`mt-1 text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                      P {nowHour.pressureMslHpa == null ? '—' : `${Math.round(nowHour.pressureMslHpa)} hPa`} • Vis {fmtVisibility(nowHour.visibilityM)}
                    </div>
                  </div>
                )
                if (item === 'humidity') return (
                  <div key={item} className={`rounded-2xl p-4 ${theme === 'dark' ? 'bg-slate-900' : 'bg-blue-50'}`}>
                    <div className={`text-xs font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Humidity</div>
                    <div className={`mt-1 text-2xl font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>{Math.round(nowHour.humidityPct)}%</div>
                    <div className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Relative humidity</div>
                  </div>
                )
                if (item === 'clouds') return (
                  <div key={item} className={`rounded-2xl p-4 ${theme === 'dark' ? 'bg-slate-900' : 'bg-blue-50'}`}>
                    <div className={`text-xs font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Cloud Cover</div>
                    <div className={`mt-1 text-2xl font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>{Math.round(nowHour.cloudCoverPct)}%</div>
                    <div className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Sky coverage</div>
                  </div>
                )
                if (item === 'rain') return (
                  <div key={item} className={`rounded-2xl p-4 ${theme === 'dark' ? 'bg-slate-900' : 'bg-blue-50'}`}>
                    <div className={`text-xs font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Precipitation</div>
                    <div className={`mt-1 text-2xl font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                      {nowHour.precipitationProbabilityPct == null ? '—' : `${Math.round(nowHour.precipitationProbabilityPct)}%`}
                    </div>
                    <div className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                      {nowHour.precipitationMm == null ? 'No rain expected' : `${nowHour.precipitationMm.toFixed(1)}mm expected`}
                    </div>
                  </div>
                )
                if (item === 'pressure') return (
                  <div key={item} className={`rounded-2xl p-4 ${theme === 'dark' ? 'bg-slate-900' : 'bg-blue-50'}`}>
                    <div className={`text-xs font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Pressure</div>
                    <div className={`mt-1 text-2xl font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                      {nowHour.pressureMslHpa == null ? '—' : `${Math.round(nowHour.pressureMslHpa)} hPa`}
                    </div>
                    <div className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Atmospheric pressure</div>
                  </div>
                )
                if (item === 'visibility') return (
                  <div key={item} className={`rounded-2xl p-4 ${theme === 'dark' ? 'bg-slate-900' : 'bg-blue-50'}`}>
                    <div className={`text-xs font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Visibility</div>
                    <div className={`mt-1 text-2xl font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>{fmtVisibility(nowHour.visibilityM)}</div>
                    <div className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Horizontal visibility</div>
                  </div>
                )
                if (item === 'waves') return (
                  <div key={item} className={`rounded-2xl p-4 ${theme === 'dark' ? 'bg-slate-900' : 'bg-blue-50'}`}>
                    <div className={`text-xs font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Waves</div>
                    <div className={`mt-1 text-2xl font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                      {nowHour.waveHeightM == null ? '—' : `${nowHour.waveHeightM.toFixed(1)} m`}
                    </div>
                    <div className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                      {nowHour.waveDirectionDeg == null ? '—' : (
                        <span className={getDirectionColor(nowHour.waveDirectionDeg)}>
                          {degToCompass(nowHour.waveDirectionDeg)}
                        </span>
                      )}
                      {nowHour.wavePeriodS == null ? '' : ` • ${Math.round(nowHour.wavePeriodS)}s`}
                    </div>
                  </div>
                )
                if (item === 'water') return (
                  <div key={item} className={`rounded-2xl p-4 ${theme === 'dark' ? 'bg-slate-900' : 'bg-blue-50'}`}>
                    <div className={`text-xs font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Water Temp</div>
                    <div className={`mt-1 text-2xl font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                      {nowHour.waterTempC == null ? '—' : `${nowHour.waterTempC.toFixed(1)}°C`}
                    </div>
                    <div className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Sea surface temperature</div>
                  </div>
                )
                if (item === 'gusts') return (
                  <div key={item} className={`rounded-2xl p-4 ${theme === 'dark' ? 'bg-slate-900' : 'bg-blue-50'}`}>
                    <div className={`text-xs font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Wind Gusts</div>
                    <div className={`mt-1 text-2xl font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
                      {nowHour.windGusts10mKmh == null ? '—' : formatWindSpeed(nowHour.windGusts10mKmh, unit)}
                    </div>
                    <div className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Peak wind speed</div>
                  </div>
                )
                if (item === 'uvIndex') return (
                  <div key={item} className={`rounded-2xl p-4 ${theme === 'dark' ? 'bg-slate-900' : 'bg-blue-50'}`}>
                    <div className={`text-xs font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>UV Index</div>
                    <div className={`mt-1 text-2xl font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>—</div>
                    <div className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Not available from API</div>
                  </div>
                )
                if (item === 'tide') return (
                  <div key={item} className={`rounded-2xl p-4 ${theme === 'dark' ? 'bg-slate-900' : 'bg-blue-50'}`}>
                    <div className={`text-xs font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Tide Info</div>
                    <div className={`mt-1 text-2xl font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>—</div>
                    <div className={`text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>Not available from API</div>
                  </div>
                )
                return null
              })}
            </div>
          </div>
        ) : null}

        {/* Hourly forecast */}
        <HourlyForecast
          bundle={bundle}
          hourlyFilter={hourlyFilter}
          onHourlyFilterChange={setHourlyFilter}
          unit={unit}
          theme={theme}
          viewMode={viewMode}
        />

        {/* Error display */}
        {err ? (
          <div className={`mb-8 rounded-2xl border px-4 py-3 text-sm ${theme === 'dark' ? 'border-red-800 bg-red-900/50 text-red-300' : 'border-red-200 bg-red-50 text-red-800'
            }`}>
            {err}
          </div>
        ) : null}

        {/* Floating action buttons */}
        {/* Floating Compass - positioned on left on all screens to avoid overlap */}
        <div className="fixed bottom-4 left-4 md:bottom-6 md:left-6 z-30">
          <Compass
            direction={compassDirection}
            theme={theme}
          />
        </div>
        
        {/* Floating Buttons - always on right */}
        <FloatingButtons
          theme={theme}
          showLocationPanel={showLocationPanel}
          showNtfyPanel={showNtfyPanel}
          ntfyEnabled={ntfy.enabled}
          onLocationClick={() => setShowLocationPanel(!showLocationPanel)}
          onNtfyClick={() => setShowNtfyPanel(!showNtfyPanel)}
        />

        {/* Location slide-up panel */}
        {showLocationPanel && (
          <LocationPanel
            theme={theme}
            location={location}
            savedLocations={savedLocations}
            search={search}
            searchResults={searchResults}
            onSearchChange={setSearch}
            onLocationSelect={(loc) => {
              setLocation({
                id: loc.id,
                name: loc.name,
                latitude: loc.latitude,
                longitude: loc.longitude,
                timezone: loc.timezone ?? 'Africa/Johannesburg',
              })
              setSearch('')
              setSearchResults([])
            }}
            onSaveLocation={() => {
              const exists = savedLocations.items.some((l) => l.id === location.id)
              if (!exists) {
                setSavedLocations((s) => ({ items: [...s.items, location] }))
              }
            }}
            onClose={() => setShowLocationPanel(false)}
            isCurrentLocationSaved={savedLocations.items.some((l) => l.id === location.id)}
          />
        )}

        {/* Messaging slide-up panel */}
        {showNtfyPanel && (
          <NtfyPanel
            theme={theme}
            ntfy={ntfy}
            onNtfyChange={setNtfy}
            onSend={() => {
              if (!ntfy.topic) {
                const randomTopic = `bw-${Math.random().toString(36).substr(2, 9)}`
                setNtfy({ enabled: true, topic: randomTopic, schedule: [] })
              } else if (bundle && nowHour) {
                const message = getViewModeSpecificMessage(bundle, nowHour, unit, viewMode)
                void sendToNtfy(message, ntfy.topic)
              }
            }}
            onClose={() => setShowNtfyPanel(false)}
          />
        )}

        {/* Custom Mode Settings */}
        {viewMode === 'custom' && (
          <div className={`rounded-2xl p-3 ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
            <div className={`text-xs font-semibold mb-3 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Custom Mode Builder</div>

            {/* Compass Direction Setting */}
            <div className="mb-4">
              <label className={`block text-xs font-medium mb-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Compass Direction</label>
              <select
                value={customSettings.compassDirection}
                onChange={(e) => setCustomSettings((s) => ({ ...s, compassDirection: e.target.value as CompassDirection }))}
                className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-1 ${theme === 'dark'
                    ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-blue-500 focus:ring-blue-500'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-blue-400 focus:ring-blue-400'
                  }`}
              >
                <option value="wind">Wind Direction</option>
                <option value="wave">Wave Direction</option>
              </select>
            </div>

            {/* Hours to Show */}
            <div className="mb-4">
              <label className={`block text-xs font-medium mb-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Hours to Show</label>
              <input
                type="number"
                min="1"
                max="168"
                value={customSettings.hoursToShow}
                onChange={(e) => setCustomSettings((s) => ({ ...s, hoursToShow: Math.max(1, Math.min(168, parseInt(e.target.value) || 36)) }))}
                className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none focus:ring-1 ${theme === 'dark'
                    ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-blue-500 focus:ring-blue-500'
                    : 'bg-white border-slate-300 text-slate-900 focus:border-blue-400 focus:ring-blue-400'
                  }`}
              />
            </div>

            {/* Top Row Items */}
            <div className="mb-4">
              <label className={`block text-xs font-medium mb-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Top Row Items</label>
              <div className="space-y-2">
                {['wind', 'temperature', 'time', 'humidity', 'clouds', 'rain', 'pressure', 'visibility', 'waves', 'water'].map((item) => (
                  <label key={item} className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                    <input
                      type="checkbox"
                      checked={customSettings.topRow.includes(item)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCustomSettings((s) => ({ ...s, topRow: [...s.topRow, item] }))
                        } else {
                          setCustomSettings((s) => ({ ...s, topRow: s.topRow.filter((i) => i !== item) }))
                        }
                      }}
                      className="rounded"
                    />
                    <span className="capitalize">{item}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Card Details */}
            <div>
              <label className={`block text-xs font-medium mb-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Card Details</label>
              <div className="space-y-2">
                {['wind', 'temperature', 'humidity', 'clouds', 'rain', 'pressure', 'visibility', 'waves', 'water', 'gusts', 'uvIndex', 'tide'].map((item) => (
                  <label key={item} className={`flex items-center gap-2 text-sm ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
                    <input
                      type="checkbox"
                      checked={customSettings.cardDetails.includes(item)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setCustomSettings((s) => ({ ...s, cardDetails: [...s.cardDetails, item] }))
                        } else {
                          setCustomSettings((s) => ({ ...s, cardDetails: s.cardDetails.filter((i) => i !== item) }))
                        }
                      }}
                      className="rounded"
                    />
                    <span className="capitalize">{item.replace(/([A-Z])/g, ' $1').trim()}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
