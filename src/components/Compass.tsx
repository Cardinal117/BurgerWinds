import React from 'react'
import { degToCompass } from '../lib/format'

interface CompassProps {
  direction: number | null | undefined
  theme: 'light' | 'dark'
}

export function Compass({ direction, theme }: CompassProps) {
  return (
    <div className={`relative w-24 h-24 md:w-28 md:h-28 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 ${
      theme === 'dark'
        ? 'bg-gradient-to-br from-blue-600 to-blue-800 text-white border-2 border-blue-400'
        : 'bg-gradient-to-br from-blue-400 to-blue-600 text-white border-2 border-blue-300'
    }`}>
      {/* Compass Circle */}
      <div className="absolute inset-2 rounded-full border-2 border-current/30 flex items-center justify-center bg-gradient-to-br from-transparent to-black/10">
        {/* Cardinal Directions - Only N, E, S, W */}
        <div className="absolute inset-0">
          <div className="absolute top-1 left-1/2 transform -translate-x-1/2 text-sm md:text-base font-bold">N</div>
          <div className="absolute top-1/2 right-1 transform -translate-y-1/2 text-sm md:text-base font-bold">E</div>
          <div className="absolute bottom-1 left-1/2 transform -translate-x-1/2 text-sm md:text-base font-bold">S</div>
          <div className="absolute top-1/2 left-1 transform -translate-y-1/2 text-sm md:text-base font-bold">W</div>
        </div>
        
        {/* Direction Indicator - Fixed centering */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div 
            className="w-1.5 h-10 md:w-2 md:h-12 bg-gradient-to-t from-red-600 to-red-400 rounded-full transition-transform duration-500 shadow-lg"
            style={{
              transform: `rotate(${direction || 0}deg)`,
              transformOrigin: 'center bottom'
            }}
          />
        </div>
        
        {/* Center dot */}
        <div className="absolute w-3 h-3 md:w-4 md:h-4 bg-white rounded-full shadow-md border border-current/20 z-10" />
      </div>
      
      {/* Current direction text */}
      <div className={`absolute -bottom-7 md:-bottom-8 left-1/2 transform -translate-x-1/2 text-sm md:text-base font-bold ${
        theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
      }`}>
        {direction ? degToCompass(direction) : 'N'}
      </div>
    </div>
  )
}
