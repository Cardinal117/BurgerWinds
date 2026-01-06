import React from 'react'
import { degToCompass } from '../lib/format'

interface CompassProps {
  direction: number | null | undefined
  theme: 'light' | 'dark'
}

export function Compass({ direction, theme }: CompassProps) {
  const rotation = direction || 0
  const size = 112 // 28 * 4 (28 = 7 * 4 for w-28)
  
  return (
    <div className="relative flex flex-col items-center">
      <div className={`relative w-24 h-24 md:w-28 md:h-28 rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 ${
        theme === 'dark'
          ? 'bg-gradient-to-br from-blue-600 to-blue-800 border-2 border-blue-400'
          : 'bg-gradient-to-br from-blue-400 to-blue-600 border-2 border-blue-300'
      }`}>
        {/* SVG compass - always perfect centering */}
        <svg 
          className="w-[90%] h-[90%]" 
          viewBox="0 0 100 100"
        >
          {/* Outer circle */}
          <circle 
            cx="50" 
            cy="50" 
            r="45" 
            fill="none" 
            stroke={theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.4)'} 
            strokeWidth="1"
          />
          
          {/* Cardinal directions */}
          <text x="50" y="10" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">N</text>
          <text x="90" y="55" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">E</text>
          <text x="50" y="95" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">S</text>
          <text x="10" y="55" textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">W</text>
          
          {/* Wind direction arrow */}
          <g transform={`rotate(${rotation}, 50, 50)`}>
            {/* Arrow line */}
            <line 
              x1="50" 
              y1="50" 
              x2="50" 
              y2="15" 
              stroke="#ef4444" 
              strokeWidth="3" 
              strokeLinecap="round"
            />
            {/* Arrow head */}
            <polygon 
              points="50,10 45,20 55,20" 
              fill="#ef4444"
            />
          </g>
          
          {/* Center dot */}
          <circle 
            cx="50" 
            cy="50" 
            r="3" 
            fill="white" 
            stroke="rgba(0,0,0,0.1)" 
            strokeWidth="1"
          />
        </svg>
      </div>
      
      {/* Current direction text */}
      <div className={`mt-2 text-sm md:text-base font-bold whitespace-nowrap ${
        theme === 'dark' ? 'text-blue-300' : 'text-blue-700'
      }`}>
        {direction ? degToCompass(direction) : 'N'}
      </div>
    </div>
  )
}