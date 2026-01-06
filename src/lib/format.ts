export type WindUnit = 'kmh' | 'kts' | 'mps'
export type TemperatureUnit = 'celsius' | 'fahrenheit' | 'kelvin'

export function kmhToKts(kmh: number): number {
  return kmh / 1.852
}

export function kmhToMps(kmh: number): number {
  return kmh / 3.6
}

export function celsiusToFahrenheit(celsius: number): number {
  return (celsius * 9/5) + 32
}

export function celsiusToKelvin(celsius: number): number {
  return celsius + 273.15
}

export function formatWindSpeed(valueKmh: number, unit: WindUnit): string {
  if (unit === 'kts') return `${Math.round(kmhToKts(valueKmh))} kt`
  if (unit === 'mps') return `${Math.round(kmhToMps(valueKmh))} m/s`
  return `${Math.round(valueKmh)} km/h`
}

export function formatTemperature(valueCelsius: number, unit: TemperatureUnit): string {
  if (unit === 'fahrenheit') return `${Math.round(celsiusToFahrenheit(valueCelsius))}°F`
  if (unit === 'kelvin') return `${Math.round(celsiusToKelvin(valueCelsius))}K`
  return `${Math.round(valueCelsius)}°C`
}

export function formatTemperatureForDisplay(valueCelsius: number, unit: TemperatureUnit): string {
  if (unit === 'fahrenheit') return `${Math.round(celsiusToFahrenheit(valueCelsius))}°`
  if (unit === 'kelvin') return `${Math.round(celsiusToKelvin(valueCelsius))}`
  return `${Math.round(valueCelsius)}°`
}

export function degToCompass(deg: number): string {
  const dirs = [
    'N',
    'NNE',
    'NE',
    'ENE',
    'E',
    'ESE',
    'SE',
    'SSE',
    'S',
    'SSW',
    'SW',
    'WSW',
    'W',
    'WNW',
    'NW',
    'NNW',
  ]
  const idx = Math.round((deg % 360) / 22.5) % 16
  return dirs[idx]
}

export function fmtTime(iso: string, timeZone: string): string {
  const d = new Date(iso)
  return new Intl.DateTimeFormat('en-ZA', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone,
  }).format(d)
}

export function fmtDay(iso: string, timeZone: string): string {
  const d = new Date(iso)
  return new Intl.DateTimeFormat('en-ZA', {
    weekday: 'short',
    month: 'short',
    day: '2-digit',
    timeZone,
  }).format(d)
}
