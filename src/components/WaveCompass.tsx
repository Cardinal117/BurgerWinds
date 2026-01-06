import React from 'react'
import { Waves } from 'lucide-react'

interface WaveCompassProps {
  direction: number
  theme: 'light' | 'dark'
  size?: 'small' | 'medium' | 'large'
}

export function WaveCompass({ direction, theme, size = 'medium' }: WaveCompassProps) {
  const sizeClasses = {
    small: 'w-12 h-12',
    medium: 'w-16 h-16', 
    large: 'w-20 h-20'
  }

  const iconSizes = {
    small: 16,
    medium: 24,
    large: 32
  }

  const normalized = ((direction + 360) % 360)
  const rotation = normalized - 90 // Adjust for CSS rotation

  return (
    <div className={`relative ${sizeClasses[size]} ${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} rounded-full border-2 ${theme === 'dark' ? 'border-slate-600' : 'border-slate-300'}`}>
      {/* Compass directions */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`text-xs font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>N</div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`text-xs font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} transform rotate-90`}>E</div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`text-xs font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} transform rotate-180`}>S</div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className={`text-xs font-semibold ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} transform -rotate-90`}>W</div>
      </div>
      
      {/* Wave direction indicator */}
      <div 
        className="absolute inset-0 flex items-center justify-center"
        style={{ transform: `rotate(${rotation}deg)` }}
      >
        <div className="flex flex-col items-center">
          <Waves 
            size={iconSizes[size]} 
            className={`text-cyan-500 ${theme === 'dark' ? 'drop-shadow-lg' : 'drop-shadow-md'}`}
            style={{ filter: 'drop-shadow(0 0 3px rgba(6, 182, 212, 0.5))' }}
          />
          <div className={`text-xs font-bold mt-1 ${theme === 'dark' ? 'text-cyan-400' : 'text-cyan-600'}`}>
            {Math.round(direction)}°
          </div>
        </div>
      </div>

      {/* Center dot */}
      <div className={`absolute top-1/2 left-1/2 w-2 h-2 -translate-x-1/2 -translate-y-1/2 rounded-full ${theme === 'dark' ? 'bg-slate-600' : 'bg-slate-400'}`}></div>
    </div>
  )
}
