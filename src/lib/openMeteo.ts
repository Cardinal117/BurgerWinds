export type GeoResult = {
  id: number
  name: string
  latitude: number
  longitude: number
  country?: string
  admin1?: string
  timezone?: string
}

export type ForecastHour = {
  time: string
  windSpeed10mKmh: number
  windGusts10mKmh?: number
  windDirection10mDeg: number
  temperatureC: number
  humidityPct: number
  cloudCoverPct: number
  precipitationProbabilityPct?: number
  precipitationMm?: number
  pressureMslHpa?: number
  visibilityM?: number
  waveHeightM?: number
  waveDirectionDeg?: number
  wavePeriodS?: number
  waterTempC?: number
  uvIndex?: number
}

export type ForecastBundle = {
  locationName: string
  latitude: number
  longitude: number
  timezone: string
  hours: ForecastHour[]
  sunrise?: string
  sunset?: string
}

export async function geocode(query: string): Promise<GeoResult[]> {
  const url = new URL('https://geocoding-api.open-meteo.com/v1/search')
  url.searchParams.set('name', query)
  url.searchParams.set('count', '8')
  url.searchParams.set('language', 'en')
  url.searchParams.set('format', 'json')

  const res = await fetch(url)
  if (!res.ok) throw new Error(`Geocoding failed (${res.status})`)
  const data = (await res.json()) as { results?: GeoResult[] }
  return data.results ?? []
}

function asNumberArray(v: unknown): number[] {
  if (!Array.isArray(v)) return []
  return v.map((x) => (typeof x === 'number' ? x : Number(x)))
}

function asStringArray(v: unknown): string[] {
  if (!Array.isArray(v)) return []
  return v.map((x) => String(x))
}

export async function fetchForecast(args: {
  latitude: number
  longitude: number
  locationName: string
  timezone?: string
}): Promise<ForecastBundle> {
  const timezone = args.timezone ?? 'Africa/Johannesburg'

  const weatherUrl = new URL('https://api.open-meteo.com/v1/forecast')
  weatherUrl.searchParams.set('latitude', String(args.latitude))
  weatherUrl.searchParams.set('longitude', String(args.longitude))
  weatherUrl.searchParams.set('timezone', timezone)
  weatherUrl.searchParams.set('hourly',
    [
      'wind_speed_10m',
      'wind_gusts_10m',
      'wind_direction_10m',
      'temperature_2m',
      'relative_humidity_2m',
      'cloud_cover',
      'precipitation_probability',
      'precipitation',
      'pressure_msl',
      'visibility',
      'uv_index',
    ].join(',')
  )
  weatherUrl.searchParams.set('daily', ['sunrise', 'sunset'].join(','))

  const marineUrl = new URL('https://marine-api.open-meteo.com/v1/marine')
  marineUrl.searchParams.set('latitude', String(args.latitude))
  marineUrl.searchParams.set('longitude', String(args.longitude))
  marineUrl.searchParams.set('timezone', timezone)
  marineUrl.searchParams.set('hourly', ['wave_height', 'wave_direction', 'wave_period', 'sea_surface_temperature'].join(','))

  const [weatherRes, marineRes] = await Promise.all([fetch(weatherUrl), fetch(marineUrl)])

  if (!weatherRes.ok) throw new Error(`Forecast failed (${weatherRes.status})`)
  if (!marineRes.ok) throw new Error(`Marine failed (${marineRes.status})`)

  const weather = (await weatherRes.json()) as any
  const marine = (await marineRes.json()) as any

  const time = asStringArray(weather?.hourly?.time)
  const windSpeed = asNumberArray(weather?.hourly?.wind_speed_10m)
  const windGusts = asNumberArray(weather?.hourly?.wind_gusts_10m)
  const windDir = asNumberArray(weather?.hourly?.wind_direction_10m)
  const temp = asNumberArray(weather?.hourly?.temperature_2m)
  const hum = asNumberArray(weather?.hourly?.relative_humidity_2m)
  const clouds = asNumberArray(weather?.hourly?.cloud_cover)
  const precipProb = asNumberArray(weather?.hourly?.precipitation_probability)
  const precip = asNumberArray(weather?.hourly?.precipitation)
  const pressure = asNumberArray(weather?.hourly?.pressure_msl)
  const visibility = asNumberArray(weather?.hourly?.visibility)
  const uvIndex = asNumberArray(weather?.hourly?.uv_index)

  const marineTime = asStringArray(marine?.hourly?.time)
  const waveHeight = asNumberArray(marine?.hourly?.wave_height)
  const waveDirection = asNumberArray(marine?.hourly?.wave_direction)
  const wavePeriod = asNumberArray(marine?.hourly?.wave_period)
  const waterTemp = asNumberArray(marine?.hourly?.sea_surface_temperature)

  const marineIndex = new Map<string, number>()
  for (let i = 0; i < marineTime.length; i++) marineIndex.set(marineTime[i], i)

  const hours: ForecastHour[] = time.map((t, i) => {
    const mi = marineIndex.get(t)
    return {
      time: t,
      windSpeed10mKmh: windSpeed[i] ?? 0,
      windGusts10mKmh: windGusts[i],
      windDirection10mDeg: windDir[i] ?? 0,
      temperatureC: temp[i] ?? 0,
      humidityPct: hum[i] ?? 0,
      cloudCoverPct: clouds[i] ?? 0,
      precipitationProbabilityPct: precipProb[i],
      precipitationMm: precip[i],
      pressureMslHpa: pressure[i],
      visibilityM: visibility[i],
      uvIndex: uvIndex[i],
      waveHeightM: mi == null ? undefined : waveHeight[mi],
      waveDirectionDeg: mi == null ? undefined : waveDirection[mi],
      wavePeriodS: mi == null ? undefined : wavePeriod[mi],
      waterTempC: mi == null ? undefined : waterTemp[mi],
    }
  })

  const sunrise = Array.isArray(weather?.daily?.sunrise) ? weather.daily.sunrise[0] : undefined
  const sunset = Array.isArray(weather?.daily?.sunset) ? weather.daily.sunset[0] : undefined

  return {
    locationName: args.locationName,
    latitude: args.latitude,
    longitude: args.longitude,
    timezone,
    hours,
    sunrise,
    sunset,
  }
}