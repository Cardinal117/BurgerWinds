export type WindUnit = 'kmh' | 'kts'

export function kmhToKts(kmh: number): number {
  return kmh / 1.852
}

export function formatWindSpeed(valueKmh: number, unit: WindUnit): string {
  if (unit === 'kts') return `${Math.round(kmhToKts(valueKmh))} kt`
  return `${Math.round(valueKmh)} km/h`
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
