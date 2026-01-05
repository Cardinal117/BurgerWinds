import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { degToCompass, formatWindSpeed, fmtDay, fmtTime, WindUnit } from './lib/format'
import { fetchForecast, ForecastBundle, geocode, GeoResult } from './lib/openMeteo'

type SavedLocation = {
  name: string
  latitude: number
  longitude: number
  timezone: string
}

type DiscordSettings = {
  webhookUrl: string
  sendsPerDay: number
  sendPreset: 'off' | '1' | '2' | '3' | '4' | 'custom'
  sendHoursCsv: string
}

const DEFAULT_LOCATION: SavedLocation = {
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

function normalizeDiscordSettings(v: unknown): DiscordSettings {
  const d = (v && typeof v === 'object' ? (v as any) : {}) as any
  const webhookUrl = typeof d.webhookUrl === 'string' ? d.webhookUrl : ''
  const sendsPerDay = typeof d.sendsPerDay === 'number' ? clamp(d.sendsPerDay, 0, 24) : 0
  const sendPreset: DiscordSettings['sendPreset'] =
    d.sendPreset === 'off' || d.sendPreset === '1' || d.sendPreset === '2' || d.sendPreset === '3' || d.sendPreset === '4' || d.sendPreset === 'custom'
      ? d.sendPreset
      : 'off'
  const sendHoursCsv = typeof d.sendHoursCsv === 'string' ? d.sendHoursCsv : ''
  return { webhookUrl, sendsPerDay, sendPreset, sendHoursCsv }
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

export default function App() {
  const [unit, setUnit] = useState<WindUnit>(() => readJson<WindUnit>('bw_unit', 'kmh'))
  const [location, setLocation] = useState<SavedLocation>(() => readJson('bw_location', DEFAULT_LOCATION))
  const [discord, setDiscord] = useState<DiscordSettings>(() =>
    normalizeDiscordSettings(readJson('bw_discord', { webhookUrl: '', sendsPerDay: 0, sendPreset: 'off', sendHoursCsv: '' })),
  )

  const [bundle, setBundle] = useState<ForecastBundle | null>(null)
  const [loading, setLoading] = useState(false)
  const [err, setErr] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState<GeoResult[]>([])
  const searchTimer = useRef<number | null>(null)

  useEffect(() => {
    writeJson('bw_unit', unit)
  }, [unit])

  useEffect(() => {
    writeJson('bw_location', location)
  }, [location])

  useEffect(() => {
    writeJson('bw_discord', discord)
  }, [discord])

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

  function applyPreset(p: DiscordSettings['sendPreset']) {
    if (p === 'off') {
      setDiscord((d) => ({ ...d, sendPreset: 'off', sendsPerDay: 0, sendHoursCsv: '' }))
      return
    }
    if (p === '1') {
      setDiscord((d) => ({ ...d, sendPreset: '1', sendHoursCsv: '7', sendsPerDay: 0 }))
      return
    }
    if (p === '2') {
      setDiscord((d) => ({ ...d, sendPreset: '2', sendHoursCsv: '7,18', sendsPerDay: 0 }))
      return
    }
    if (p === '3') {
      setDiscord((d) => ({ ...d, sendPreset: '3', sendHoursCsv: '7,12,18', sendsPerDay: 0 }))
      return
    }
    if (p === '4') {
      setDiscord((d) => ({ ...d, sendPreset: '4', sendHoursCsv: '6,10,14,18', sendsPerDay: 0 }))
      return
    }
    setDiscord((d) => ({ ...d, sendPreset: 'custom', sendsPerDay: 0 }))
  }

  async function sendToDiscord() {
    if (!discord.webhookUrl.trim()) {
      setErr('Add a Discord webhook URL first.')
      return
    }
    if (!condensedMessage) {
      setErr('No message to send yet (forecast not loaded).')
      return
    }

    setErr(null)
    try {
      const body = new URLSearchParams({ content: condensedMessage })
      await fetch(discord.webhookUrl.trim(), {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8' },
        body,
      })
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Discord send failed')
    }
  }

  function selectLocation(r: GeoResult) {
    const name = [r.name, r.admin1, r.country].filter(Boolean).join(', ')
    setLocation({
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
    return bundle.hours.slice(0, 36)
  }, [bundle])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto w-full max-w-6xl px-4 pb-20 pt-5 md:px-6">
        <header className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wide text-slate-400">BurgerWinds</div>
            <div className="truncate text-lg font-semibold">{location.name}</div>
            {bundle?.sunrise && bundle?.sunset ? (
              <div className="text-xs text-slate-400">
                {fmtDay(bundle.sunrise, bundle.timezone)} • Sun {fmtTime(bundle.sunrise, bundle.timezone)}-
                {fmtTime(bundle.sunset, bundle.timezone)}
              </div>
            ) : null}
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <button
              className="rounded-full bg-slate-800 px-3 py-2 text-xs font-medium"
              onClick={() => setUnit((u) => (u === 'kmh' ? 'kts' : 'kmh'))}
              type="button"
            >
              {unit === 'kmh' ? 'km/h' : 'kts'}
            </button>
            <button
              className="rounded-full bg-slate-800 px-3 py-2 text-xs font-medium"
              onClick={() => void refresh()}
              type="button"
            >
              {loading ? 'Loading…' : 'Refresh'}
            </button>
          </div>
        </header>

        <div className="mt-4">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Change location (e.g. Cape Town, Langebaan, Maui)"
            className="w-full rounded-2xl border border-slate-800 bg-slate-900 px-4 py-3 text-sm outline-none placeholder:text-slate-500"
          />
          {searchResults.length ? (
            <div className="mt-2 overflow-hidden rounded-2xl border border-slate-800 bg-slate-900">
              {searchResults.map((r) => (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => selectLocation(r)}
                  className="block w-full border-b border-slate-800 px-4 py-3 text-left text-sm last:border-b-0 hover:bg-slate-800"
                >
                  {[r.name, r.admin1, r.country].filter(Boolean).join(', ')}
                  <div className="text-xs text-slate-500">
                    {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}
                  </div>
                </button>
              ))}
            </div>
          ) : null}
        </div>

        {err ? (
          <div className="mt-4 rounded-2xl border border-red-900/50 bg-red-950/40 px-4 py-3 text-sm text-red-200">
            {err}
          </div>
        ) : null}

        <div className="mt-4 grid gap-4 lg:grid-cols-12">
          <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 lg:col-span-8">
            <div className="text-xs uppercase tracking-wide text-slate-400">Now</div>
            {nowHour ? (
              <div className="mt-2 grid grid-cols-2 gap-3 lg:grid-cols-4">
                <div className="rounded-2xl bg-slate-950/40 p-3">
                  <div className="text-xs text-slate-400">Wind</div>
                  <div className="mt-1 text-xl font-semibold">
                    {formatWindSpeed(nowHour.windSpeed10mKmh, unit)}
                  </div>
                  <div className="text-sm text-slate-300">
                    {degToCompass(nowHour.windDirection10mDeg)} ({Math.round(nowHour.windDirection10mDeg)}°)
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    Gust {nowHour.windGusts10mKmh == null ? '—' : formatWindSpeed(nowHour.windGusts10mKmh, unit)}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-950/40 p-3">
                  <div className="text-xs text-slate-400">Weather</div>
                  <div className="mt-1 text-xl font-semibold">{Math.round(nowHour.temperatureC)}°C</div>
                  <div className="text-sm text-slate-300">
                    Hum {Math.round(nowHour.humidityPct)}% • Clouds {Math.round(nowHour.cloudCoverPct)}%
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    Rain {nowHour.precipitationProbabilityPct == null ? '—' : `${Math.round(nowHour.precipitationProbabilityPct)}%`}
                    {nowHour.precipitationMm == null ? '' : ` • ${nowHour.precipitationMm.toFixed(1)}mm`}
                  </div>
                  <div className="mt-1 text-xs text-slate-400">
                    P {nowHour.pressureMslHpa == null ? '—' : `${Math.round(nowHour.pressureMslHpa)} hPa`} • Vis {fmtVisibility(nowHour.visibilityM)}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-950/40 p-3">
                  <div className="text-xs text-slate-400">Waves</div>
                  <div className="mt-1 text-xl font-semibold">
                    {nowHour.waveHeightM == null ? '—' : `${nowHour.waveHeightM.toFixed(1)} m`}
                  </div>
                  <div className="text-sm text-slate-300">
                    {nowHour.waveDirectionDeg == null ? '—' : degToCompass(nowHour.waveDirectionDeg)}
                    {nowHour.wavePeriodS == null ? '' : ` • ${Math.round(nowHour.wavePeriodS)}s`}
                  </div>
                </div>
                <div className="rounded-2xl bg-slate-950/40 p-3">
                  <div className="text-xs text-slate-400">Water</div>
                  <div className="mt-1 text-xl font-semibold">
                    {nowHour.waterTempC == null ? '—' : `${nowHour.waterTempC.toFixed(1)}°C`}
                  </div>
                  <div className="text-sm text-slate-300">Sea surface</div>
                </div>
              </div>
            ) : (
              <div className="mt-2 text-sm text-slate-400">No data yet.</div>
            )}
          </section>

          <section className="rounded-3xl border border-slate-800 bg-slate-900/60 p-4 lg:col-span-4">
            <div className="flex items-baseline justify-between">
              <div className="text-sm font-semibold">Discord</div>
              <div className="text-xs text-slate-500">Condensed message</div>
            </div>

            <label className="mt-3 block text-xs text-slate-400">Webhook URL (stored on this device)</label>
            <input
              value={discord.webhookUrl}
              onChange={(e) => setDiscord((d) => ({ ...d, webhookUrl: e.target.value }))}
              placeholder="https://discord.com/api/webhooks/..."
              className="mt-1 w-full rounded-2xl border border-slate-800 bg-slate-950/30 px-4 py-3 text-sm outline-none placeholder:text-slate-600"
            />

            <label className="mt-3 block text-xs text-slate-400">Schedule</label>
            <select
              value={discord.sendPreset}
              onChange={(e) => applyPreset(e.target.value as DiscordSettings['sendPreset'])}
              className="mt-1 w-full rounded-2xl border border-slate-800 bg-slate-950/30 px-4 py-3 text-sm outline-none"
            >
              <option value="off">Off</option>
              <option value="1">Preset: 1/day (07:00)</option>
              <option value="2">Preset: 2/day (07:00, 18:00)</option>
              <option value="3">Preset: 3/day (07:00, 12:00, 18:00)</option>
              <option value="4">Preset: 4/day (06:00, 10:00, 14:00, 18:00)</option>
              <option value="custom">Custom hours</option>
            </select>

            {discord.sendPreset === 'custom' ? (
              <div className="mt-3">
                <label className="block text-xs text-slate-400">Custom send hours (0-23, comma separated)</label>
                <input
                  value={discord.sendHoursCsv}
                  onChange={(e) => setDiscord((d) => ({ ...d, sendHoursCsv: e.target.value }))}
                  placeholder="7,12,18"
                  className="mt-1 w-full rounded-2xl border border-slate-800 bg-slate-950/30 px-4 py-3 text-sm outline-none placeholder:text-slate-600"
                />
                <div className="mt-1 text-[11px] text-slate-500">Parsed: {parseHoursCsv(discord.sendHoursCsv).join(', ') || '—'}</div>
              </div>
            ) : null}

            <div className="mt-3 grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-slate-400">Fallback sends/day</label>
                <input
                  type="number"
                  min={0}
                  max={24}
                  value={discord.sendsPerDay}
                  onChange={(e) =>
                    setDiscord((d) => ({ ...d, sendsPerDay: clamp(Number(e.target.value || 0), 0, 24) }))
                  }
                  className="mt-1 w-full rounded-2xl border border-slate-800 bg-slate-950/30 px-4 py-3 text-sm outline-none"
                />
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={() => void sendToDiscord()}
                  className="w-full rounded-2xl bg-emerald-600 px-4 py-3 text-sm font-semibold text-emerald-950"
                >
                  Send now
                </button>
              </div>
            </div>

            <div className="mt-3 rounded-2xl border border-slate-800 bg-slate-950/30 p-3 text-xs text-slate-300">
              {condensedMessage || 'Forecast not loaded yet.'}
            </div>
          </section>

          <section className="lg:col-span-12">
            <div className="mb-2 flex items-baseline justify-between">
              <div className="text-sm font-semibold">Hourly</div>
              <div className="text-xs text-slate-500">Next 36h</div>
            </div>

            <div className="flex gap-3 overflow-x-auto pb-2 md:grid md:grid-cols-3 md:overflow-visible md:pb-0 lg:grid-cols-4 xl:grid-cols-6">
              {hoursToShow.map((h) => (
                <div
                  key={h.time}
                  className="min-w-[150px] rounded-3xl border border-slate-800 bg-slate-900/60 p-3 md:min-w-0"
                >
                  <div className="text-xs text-slate-400">{bundle ? fmtTime(h.time, bundle.timezone) : h.time}</div>
                  <div className="mt-1 text-base font-semibold">{formatWindSpeed(h.windSpeed10mKmh, unit)}</div>
                  <div className="text-sm text-slate-300">{degToCompass(h.windDirection10mDeg)}</div>
                  <div className="text-xs text-slate-400">
                    Gust {h.windGusts10mKmh == null ? '—' : formatWindSpeed(h.windGusts10mKmh, unit)}
                  </div>
                  <div className="mt-2 text-xs text-slate-400">Temp {Math.round(h.temperatureC)}°C</div>
                  <div className="text-xs text-slate-400">Hum {Math.round(h.humidityPct)}%</div>
                  <div className="text-xs text-slate-400">Clouds {Math.round(h.cloudCoverPct)}%</div>
                  <div className="text-xs text-slate-400">
                    Rain {h.precipitationProbabilityPct == null ? '—' : `${Math.round(h.precipitationProbabilityPct)}%`}
                    {h.precipitationMm == null ? '' : ` • ${h.precipitationMm.toFixed(1)}mm`}
                  </div>
                  <div className="text-xs text-slate-400">
                    P {h.pressureMslHpa == null ? '—' : `${Math.round(h.pressureMslHpa)}hPa`} • Vis {fmtVisibility(h.visibilityM)}
                  </div>
                  <div className="mt-2 text-xs text-slate-400">
                    Waves {h.waveHeightM == null ? '—' : `${h.waveHeightM.toFixed(1)}m`}
                  </div>
                  <div className="text-xs text-slate-400">
                    Dir {h.waveDirectionDeg == null ? '—' : degToCompass(h.waveDirectionDeg)}
                    {h.wavePeriodS == null ? '' : ` • ${Math.round(h.wavePeriodS)}s`}
                  </div>
                  <div className="text-xs text-slate-400">
                    Water {h.waterTempC == null ? '—' : `${h.waterTempC.toFixed(1)}°C`}
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <footer className="mt-6 text-center text-xs text-slate-600">
          Data: Open-Meteo (Forecast + Marine). Built for mobile.
        </footer>
      </div>
    </div>
  )
}
