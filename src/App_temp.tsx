import { useCallback, useEffect, useMemo, useRef, useState, lazy, Suspense } from 'react'
import { degToCompass, formatWindSpeed, fmtDay, fmtTime, WindUnit, TemperatureUnit, formatTemperature, formatTemperatureForDisplay } from './lib/format'
import { fetchForecast, ForecastBundle, ForecastHour, geocode, GeoResult } from './lib/openMeteo'
import { ChevronUp, ChevronDown, Settings } from 'lucide-react'
import { Compass } from './components/Compass'
import { FloatingButtons } from './components/FloatingButtons'
import { LocationPanel } from './components/LocationPanel'
import { NtfyPanel, NtfySettings } from './components/NtfyPanel'
import { DiscordSettings } from './components/DiscordSettings'
import { DiscordConfig, DiscordNotificationService } from './lib/discordService'

// Lazy load heavy components
const HourlyForecast = lazy(() => import('./components/HourlyForecast').then(module => ({ default: module.HourlyForecast })))

type Theme = 'light' | 'dark'
type ViewMode = 'casual' | 'surfer' | 'everything' | 'custom'

type SavedLocation = {
  id: number
  name: string
  latitude: number
  longitude: number
  timezone: string
}

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

function getViewModeSpecificMessage(bundle: ForecastBundle, nowHour: ForecastHour, unit: WindUnit, temperatureUnit: TemperatureUnit, viewMode: ViewMode): string {
  const location = bundle.locationName
  const time = fmtTime(nowHour.time, bundle.timezone)

  if (viewMode === 'surfer') {
    const wind = `${formatWindSpeed(nowHour.windSpeed10mKmh || 0, unit)} ${degToCompass(nowHour.windDirection10mDeg || 0)}`
    const windRating = getWindSurferRating(nowHour.windSpeed10mKmh || 0)
    const water = getWaterSurfaceDescription(nowHour.waveHeightM, nowHour.windSpeed10mKmh)
    const windType = isSideOnshore(nowHour.windDirection10mDeg || 0) ? 'Side-onshore' : 'Cross-shore'
    const temp = formatTemperatureForDisplay(nowHour.temperatureC || 0, temperatureUnit)

    return `🏄‍♂️ Wind Surfer Report - ${location}
⏰ ${time} • 🌡️ ${temp}
💨 Wind: ${wind} (${windRating.rating})
🌊 Water: ${water.condition} • ${windType}
📊 Rating: ${windRating.rating} (${windRating.range})
${nowHour.waveHeightM ? `🌊 Waves: ${nowHour.waveHeightM.toFixed(1)}m ${nowHour.wavePeriodS ? `${Math.round(nowHour.wavePeriodS)}s` : ''}` : ''}
${nowHour.waterTempC ? `💧 Water: ${nowHour.waterTempC.toFixed(1)}°C` : ''}`
  }

  if (viewMode === 'everything') {
    const wind = `${formatWindSpeed(nowHour.windSpeed10mKmh || 0, unit)} ${degToCompass(nowHour.windDirection10mDeg || 0)}`
    const gust = nowHour.windGusts10mKmh ? `Gust ${formatWindSpeed(nowHour.windGusts10mKmh, unit)}` : ''
    const temp = formatTemperatureForDisplay(nowHour.temperatureC || 0, temperatureUnit)
    const hum = `${Math.round(nowHour.humidityPct || 0)}%`
    const clouds = `${Math.round(nowHour.cloudCoverPct || 0)}%`
    const rain = nowHour.precipitationProbabilityPct ? `Rain ${Math.round(nowHour.precipitationProbabilityPct)}%` : ''
    const pressure = nowHour.pressureMslHpa ? `${Math.round(nowHour.pressureMslHpa)}hPa` : ''
    const vis = nowHour.visibilityM ? `Vis ${(nowHour.visibilityM / 1000).toFixed(1)}km` : ''
    const waves = nowHour.waveHeightM ? `Waves ${nowHour.waveHeightM.toFixed(1)}m` : ''
    const water = nowHour.waterTempC ? `Water ${formatTemperatureForDisplay(nowHour.waterTempC, temperatureUnit)}` : ''

    return `📊 Complete Weather Report - ${location}
⏰ ${time}
💨 Wind: ${wind} ${gust}
🌡️ Temp: ${temp} • Humidity: ${hum} • Clouds: ${clouds}
${rain ? `🌧️ ${rain}` : ''} ${pressure ? `📏 ${pressure}` : ''} ${vis ? `👁️ ${vis}` : ''}
${waves ? `🌊 ${waves}` : ''} ${water ? `💧 ${water}` : ''}`
  }

  if (viewMode === 'custom') {
    return getCasualMessage(bundle, nowHour, unit, temperatureUnit)
  }

  return getCasualMessage(bundle, nowHour, unit, temperatureUnit)
}

function getCasualMessage(bundle: ForecastBundle, nowHour: ForecastHour, unit: WindUnit, temperatureUnit: TemperatureUnit): string {
  const location = bundle.locationName
  const time = fmtTime(nowHour.time, bundle.timezone)
  const wind = `${formatWindSpeed(nowHour.windSpeed10mKmh || 0, unit)} ${degToCompass(nowHour.windDirection10mDeg || 0)}`
  const temp = formatTemperatureForDisplay(nowHour.temperatureC || 0, temperatureUnit)
  const conditions = nowHour.precipitationProbabilityPct && nowHour.precipitationProbabilityPct > 30 ?
    `Rain ${Math.round(nowHour.precipitationProbabilityPct)}%` : 'Clear'

  return `☀️ Daily Weather - ${location}
⏰ ${time}
💨 Wind: ${wind}
🌡️ Temp: ${temp}
🌤️ ${conditions}`
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
  if (windDeg == null || Number.isNaN(windDeg)) return false
  const normalized = ((windDeg + 360) % 360)
  return (normalized >= 315 || normalized < 45) || (normalized >= 135 && normalized < 225)
}

export default function App() {
  const [unit, setUnit] = useState<WindUnit>(() => readJson<WindUnit>('bw_unit', 'kmh'))
  const [temperatureUnit, setTemperatureUnit] = useState<TemperatureUnit>(() => readJson<TemperatureUnit>('bw_temperature_unit', 'celsius'))
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
  const [discordConfig, setDiscordConfig] = useState<DiscordConfig>(() => readJson<DiscordConfig>('bw_discord_config', { enabled: false, webhookUrl: '' }))
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

  // Application state
  const [bundle, setBundle] = useState<ForecastBundle | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  // Panel visibility state
  const [showLocationPanel, setShowLocationPanel] = useState(false)
  const [showNtfyPanel, setShowNtfyPanel] = useState(false)
  const [showDiscordPanel, setShowDiscordPanel] = useState(false)
  const [showArcReactor, setShowArcReactor] = useState(() => readJson('bw_arc_reactor', true))

  // Search state
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<GeoResult[]>([])
  const searchTimer = useRef<number>()

  // Hourly forecast filter state
  const [hourlyFilter, setHourlyFilter] = useState<'6h' | '24h' | '7d'>('24h')

  // Discord notification function inside component to access state
  const sendDiscordNotification = async (message: string, locationName: string) => {
    try {
      const discordService = new DiscordNotificationService({
        webhookUrl: discordConfig.webhookUrl,
        enabled: discordConfig.enabled,
        username: 'WindGuru Bot'
      })
      
      await discordService.sendWeatherAlert(message, locationName)
      console.log('✅ Discord notification sent successfully')
    } catch (e) {
      console.error('Discord notification failed:', e)
    }
  }

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

  useEffect(() => {
    writeJson('bw_temperature_unit', temperatureUnit)
  }, [temperatureUnit])

  useEffect(() => {
    writeJson('bw_discord_config', discordConfig)
  }, [discordConfig])

  useEffect(() => {
    writeJson('bw_arc_reactor', showArcReactor)
  }, [showArcReactor])

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
      setBundle(null)
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
    if (!ntfy.enabled || !ntfy.topic || ntfy.schedule.length === 0 || !bundle || !nowHour) return

    const checkSchedule = () => {
      const now = new Date()
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

      if (ntfy.schedule.includes(currentTime)) {
        const message = getViewModeSpecificMessage(bundle, nowHour, unit, temperatureUnit, viewMode)
        void sendToNtfy(message, ntfy.topic)
      }
    }

    const interval = setInterval(checkSchedule, 60000)
    checkSchedule()

    return () => clearInterval(interval)
  }, [ntfy.enabled, ntfy.topic, ntfy.schedule, bundle, nowHour, unit, viewMode])

  // Discord scheduling
  useEffect(() => {
    if (!discordConfig.enabled || !discordConfig.webhookUrl || !bundle || !nowHour) return

    const checkDiscordSchedule = () => {
      const now = new Date()
      const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

      if (ntfy.schedule.includes(currentTime)) {
        const message = getViewModeSpecificMessage(bundle, nowHour, unit, temperatureUnit, viewMode)
        void sendDiscordNotification(message, bundle.locationName)
      }
    }

    const interval = setInterval(checkDiscordSchedule, 60000)
    checkDiscordSchedule()

    return () => clearInterval(interval)
  }, [discordConfig.enabled, discordConfig.webhookUrl, ntfy.schedule, bundle, nowHour, unit, temperatureUnit, viewMode])

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-slate-900 text-slate-100' : 'bg-gradient-to-br from-blue-50 to-white text-slate-900'}`}>
      <div className="mx-auto w-full max-w-6xl px-3 pb-32 pt-4 sm:px-4 md:px-6">
        <header className="mb-4 sm:mb-6">
          <div className="flex flex-col gap-3">
            <div className={`text-xs font-semibold uppercase tracking-wide ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>BurgerWinds</div>
            <select
              value={location.id.toString()}
              onChange={(e) => {
                const savedLoc = savedLocations.items.find(loc => loc.id.toString() === e.target.value)
                if (savedLoc) {
                  setLocation(savedLoc)
                }
              }}
              className={`w-full rounded-lg px-3 py-2.5 text-sm font-medium shadow-md hover:opacity-90 outline-none cursor-pointer ${
                theme === 'dark'
                  ? 'bg-slate-700 text-slate-200 ring-1 ring-slate-600 hover:bg-slate-600'
                  : 'bg-white text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50'
                }`}
            >
              <option value={location.id}>{location.name}</option>
              {savedLocations.items.filter(loc => loc.id !== location.id).map((loc) => (
                <option key={loc.id} value={loc.id.toString()}>{loc.name}</option>
              ))}
            </select>
          </div>
        </header>

        <FloatingButtons
          theme={theme}
          showLocationPanel={showLocationPanel}
          showNtfyPanel={showNtfyPanel}
          showDiscordPanel={showDiscordPanel}
          setShowLocationPanel={setShowLocationPanel}
          setShowNtfyPanel={setShowNtfyPanel}
          setShowDiscordPanel={setShowDiscordPanel}
          showArcReactor={showArcReactor}
          setShowArcReactor={setShowArcReactor}
        />

        {showDiscordPanel && (
          <DiscordSettings
            theme={theme}
            isOpen={showDiscordPanel}
            currentConfig={discordConfig}
            onClose={() => setShowDiscordPanel(false)}
            onSave={(config) => {
              setDiscordConfig(config)
              if (config.enabled && config.webhookUrl) {
                const testMessage = '🧪 Discord integration test successful!'
                console.log('✅ Discord test would send:', testMessage)
              }
            }}
          />
        )}
      </div>
    </div>
  )
}
