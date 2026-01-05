const WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL
const LAT = Number(process.env.BW_LAT)
const LON = Number(process.env.BW_LON)
const NAME = process.env.BW_LOCATION_NAME || 'Langebaan, ZA'
const TZ = process.env.BW_TIMEZONE || 'Africa/Johannesburg'
const UNIT = process.env.BW_WIND_UNIT || 'kmh'
const SENDS_PER_DAY = Number(process.env.BW_SENDS_PER_DAY || '0')
const SEND_HOURS = process.env.BW_SEND_HOURS || ''

function kmhToKts(kmh) {
  return kmh / 1.852
}

function formatWindSpeed(kmh) {
  if (UNIT === 'kts') return `${Math.round(kmhToKts(kmh))} kt`
  return `${Math.round(kmh)} km/h`
}

function degToCompass(deg) {
  const dirs = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW']
  const idx = Math.round(((deg % 360) + 360) % 360 / 22.5) % 16
  return dirs[idx]
}

function fmtTime(iso) {
  const d = new Date(iso)
  return new Intl.DateTimeFormat('en-ZA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: TZ,
  }).format(d)
}

function parseHoursCsv(v) {
  if (!v || typeof v !== 'string') return []
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

async function fetchJson(url) {
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Fetch failed (${res.status}) ${url}`)
  return res.json()
}

async function main() {
  if (!WEBHOOK_URL) throw new Error('Missing DISCORD_WEBHOOK_URL')
  if (!Number.isFinite(LAT) || !Number.isFinite(LON)) throw new Error('Missing BW_LAT / BW_LON')

  const now = new Date()
  const hour = Number(
    new Intl.DateTimeFormat('en-ZA', { hour: '2-digit', hour12: false, timeZone: TZ }).format(now),
  )

  const hoursList = parseHoursCsv(SEND_HOURS)
  if (hoursList.length) {
    if (!hoursList.includes(hour)) {
      console.log(`Not a send hour. hour=${hour}, sendHours=${hoursList.join(',')}`)
      return
    }
  } else {
    if (!Number.isFinite(SENDS_PER_DAY) || SENDS_PER_DAY <= 0) {
      console.log('BW_SENDS_PER_DAY <= 0 and BW_SEND_HOURS empty, nothing to send')
      return
    }
    const interval = Math.floor(24 / Math.min(24, Math.max(1, SENDS_PER_DAY)))
    const shouldSend = hour % Math.max(1, interval) === 0
    if (!shouldSend) {
      console.log(`Not a send hour. hour=${hour}, interval=${interval}`)
      return
    }
  }

  const weatherUrl = new URL('https://api.open-meteo.com/v1/forecast')
  weatherUrl.searchParams.set('latitude', String(LAT))
  weatherUrl.searchParams.set('longitude', String(LON))
  weatherUrl.searchParams.set('timezone', TZ)
  weatherUrl.searchParams.set(
    'hourly',
    'wind_speed_10m,wind_gusts_10m,wind_direction_10m,temperature_2m,relative_humidity_2m,cloud_cover,precipitation_probability,precipitation,pressure_msl,visibility',
  )
  weatherUrl.searchParams.set('daily', 'sunrise,sunset')

  const marineUrl = new URL('https://marine-api.open-meteo.com/v1/marine')
  marineUrl.searchParams.set('latitude', String(LAT))
  marineUrl.searchParams.set('longitude', String(LON))
  marineUrl.searchParams.set('timezone', TZ)
  marineUrl.searchParams.set('hourly', 'wave_height,wave_direction,wave_period,sea_surface_temperature')

  const [weather, marine] = await Promise.all([fetchJson(weatherUrl), fetchJson(marineUrl)])

  const times = weather?.hourly?.time ?? []
  const ws = weather?.hourly?.wind_speed_10m ?? []
  const wg = weather?.hourly?.wind_gusts_10m ?? []
  const wd = weather?.hourly?.wind_direction_10m ?? []
  const t2 = weather?.hourly?.temperature_2m ?? []
  const rh = weather?.hourly?.relative_humidity_2m ?? []
  const cc = weather?.hourly?.cloud_cover ?? []
  const pp = weather?.hourly?.precipitation_probability ?? []
  const pr = weather?.hourly?.precipitation ?? []
  const pmsl = weather?.hourly?.pressure_msl ?? []
  const vis = weather?.hourly?.visibility ?? []

  const mTimes = marine?.hourly?.time ?? []
  const wave = marine?.hourly?.wave_height ?? []
  const waveDir = marine?.hourly?.wave_direction ?? []
  const wavePeriod = marine?.hourly?.wave_period ?? []
  const water = marine?.hourly?.sea_surface_temperature ?? []
  const mIndex = new Map(mTimes.map((t, i) => [t, i]))

  const nowMs = now.getTime()
  let bestIdx = 0
  let bestDelta = Infinity
  for (let i = 0; i < times.length; i++) {
    const d = Math.abs(new Date(times[i]).getTime() - nowMs)
    if (d < bestDelta) {
      bestDelta = d
      bestIdx = i
    }
  }

  const timeIso = times[bestIdx]
  const wind = `${formatWindSpeed(Number(ws[bestIdx] ?? 0))} ${degToCompass(Number(wd[bestIdx] ?? 0))}`
  const gust = Number(wg[bestIdx])
  const gustTxt = Number.isFinite(gust) ? ` | Gust ${formatWindSpeed(gust)}` : ''
  const temp = `${Math.round(Number(t2[bestIdx] ?? 0))}°C`
  const hum = `${Math.round(Number(rh[bestIdx] ?? 0))}%`
  const clouds = `${Math.round(Number(cc[bestIdx] ?? 0))}%`

  const rainProb = Number(pp[bestIdx])
  const rainMm = Number(pr[bestIdx])
  const pressure = Number(pmsl[bestIdx])
  const visibility = Number(vis[bestIdx])
  const rainTxt = Number.isFinite(rainProb) ? ` | Rain ${Math.round(rainProb)}%` : ''
  const rainMmTxt = Number.isFinite(rainMm) ? ` ${rainMm.toFixed(1)}mm` : ''
  const pressureTxt = Number.isFinite(pressure) ? ` | ${Math.round(pressure)}hPa` : ''
  const visTxt = Number.isFinite(visibility) ? ` | Vis ${(visibility / 1000).toFixed(1)}km` : ''

  const mi = mIndex.get(timeIso)
  const waves = mi == null ? '' : ` | Waves ${Number(wave[mi]).toFixed(1)}m`
  const wavesDir = mi == null ? '' : ` ${degToCompass(Number(waveDir[mi] ?? 0))}`
  const wavesPeriod = mi == null ? '' : ` ${Number(wavePeriod[mi] ?? 0).toFixed(0)}s`
  const waterT = mi == null ? '' : ` | Water ${Number(water[mi]).toFixed(1)}°C`

  const sunrise = Array.isArray(weather?.daily?.sunrise) ? weather.daily.sunrise[0] : null
  const sunset = Array.isArray(weather?.daily?.sunset) ? weather.daily.sunset[0] : null
  const sun = sunrise && sunset ? ` | Sun ${fmtTime(sunrise)}-${fmtTime(sunset)}` : ''

  const msg = `BurgerWinds • ${NAME} • ${fmtTime(timeIso)} • Wind ${wind}${gustTxt} • Temp ${temp} • Hum ${hum} • Clouds ${clouds}${rainTxt}${rainMmTxt}${pressureTxt}${visTxt}${waves}${wavesDir}${wavesPeriod}${waterT}${sun}`

  const res = await fetch(WEBHOOK_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: msg }),
  })

  if (!res.ok) {
    const txt = await res.text().catch(() => '')
    throw new Error(`Discord post failed (${res.status}) ${txt}`)
  }

  console.log('Sent:', msg)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
