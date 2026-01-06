import React from 'react'
import { Waves } from 'lucide-react'

interface WaveCompassProps {
  direction: number
  theme: 'light' | 'dark'
  size?: 'small' | 'medium' | 'large'
}

export function WaveCompass({ direction, theme, size = 'medium' }: WaveCompassProps) {
  const sizeClasses = {
    small: 'w-20 h-20',
    medium: 'w-24 h-24', 
    large: 'w-28 h-28'
  }

  const svgSizes = {
    small: 60,
    medium: 75,
    large: 90
  }

  const rotation = direction || 0
  
  return (
    <div className="relative flex flex-col items-center">
      <div className={`relative ${sizeClasses[size]} rounded-full shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 ${
        theme === 'dark'
          ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-2 border-slate-600'
          : 'bg-gradient-to-br from-slate-700 to-slate-800 border-2 border-slate-500'
      }`}>
        {/* SVG compass - matching the main compass style */}
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
          <text x="50" y="12" textAnchor="middle" fill="#00d4ff" fontSize="12" fontWeight="bold" stroke="#000" strokeWidth="0.5">N</text>
          <text x="88" y="55" textAnchor="middle" fill="#00d4ff" fontSize="12" fontWeight="bold" stroke="#000" strokeWidth="0.5">E</text>
          <text x="50" y="95" textAnchor="middle" fill="#00d4ff" fontSize="12" fontWeight="bold" stroke="#000" strokeWidth="0.5">S</text>
          <text x="12" y="55" textAnchor="middle" fill="#00d4ff" fontSize="12" fontWeight="bold" stroke="#000" strokeWidth="0.5">W</text>
          
          {/* Wave direction indicator */}
          <g transform={`rotate(${rotation}, 50, 50)`}>
            {/* Neon blue arrow for wave direction */}
            <defs>
              <filter id="neonBlue">
                <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
                <feMerge>
                  <feMergeNode in="coloredBlur"/>
                  <feMergeNode in="SourceGraphic"/>
                </feMerge>
              </filter>
            </defs>
            <line 
              x1="50" 
              y1="50" 
              x2="50" 
              y2="15" 
              stroke="#00d4ff" 
              strokeWidth="3" 
              strokeLinecap="round"
              filter="url(#neonBlue)"
            />
            {/* Arrow head */}
            <polygon 
              points="50,10 45,20 55,20" 
              fill="#00d4ff"
              filter="url(#neonBlue)"
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
      <div className={`mt-1 text-xs md:text-sm font-bold whitespace-nowrap ${
        theme === 'dark' ? 'text-cyan-400' : 'text-cyan-500'
      }`}>
        {Math.round(direction)}°
      </div>
    </div>
  )
}
