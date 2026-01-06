import React from 'react'

interface GTAMapBackgroundProps {
  latitude: number
  longitude: number
  theme: 'light' | 'dark'
}

export function GTAMapBackground({ latitude, longitude, theme }: GTAMapBackgroundProps) {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Dark background */}
      <div className={`absolute inset-0 ${theme === 'dark' ? 'bg-black' : 'bg-slate-900'}`} />
      
      {/* Arc Reactor Core */}
      <svg
        className="absolute inset-0 w-full h-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          {/* Glow effects */}
          <filter id="arcReactorGlow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          <filter id="innerGlow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge>
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
          
          {/* Radial gradients for depth */}
          <radialGradient id="coreGradient">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="30%" stopColor="#00d4ff" stopOpacity="0.8" />
            <stop offset="60%" stopColor="#0099ff" stopOpacity="0.6" />
            <stop offset="100%" stopColor="#0066ff" stopOpacity="0.3" />
          </radialGradient>
          
          <radialGradient id="outerRingGradient">
            <stop offset="0%" stopColor="#00d4ff" stopOpacity="0" />
            <stop offset="70%" stopColor="#0099ff" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#0066ff" stopOpacity="0.8" />
          </radialGradient>
          
          <radialGradient id="energyPulse">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
            <stop offset="50%" stopColor="#00d4ff" stopOpacity="0.8" />
            <stop offset="100%" stopColor="#0099ff" stopOpacity="0" />
          </radialGradient>
        </defs>
        
        {/* Outer energy field */}
        <circle
          cx="50"
          cy="50"
          r="45"
          fill="url(#outerRingGradient)"
          opacity="0.3"
        >
          <animate
            attributeName="r"
            from="45"
            to="48"
            dur="3s"
            repeatCount="indefinite"
            values="45;48;45"
          />
          <animate
            attributeName="opacity"
            from="0.3"
            to="0.6"
            dur="3s"
            repeatCount="indefinite"
            values="0.3;0.6;0.3"
          />
        </circle>
        
        {/* Middle ring */}
        <circle
          cx="50"
          cy="50"
          r="35"
          fill="none"
          stroke="#00d4ff"
          strokeWidth="0.5"
          opacity="0.8"
          filter="url(#arcReactorGlow)"
        />
        
        {/* Inner ring */}
        <circle
          cx="50"
          cy="50"
          r="25"
          fill="none"
          stroke="#0099ff"
          strokeWidth="1"
          opacity="0.9"
          filter="url(#innerGlow)"
        />
        
        {/* Rotating energy segments */}
        <g>
          {/* Energy segments */}
          {Array.from({ length: 8 }).map((_, i) => (
            <g key={i} transform={`rotate(${i * 45}, 50, 50)`}>
              <rect
                x="49"
                y="15"
                width="2"
                height="20"
                fill="#00d4ff"
                opacity="0.7"
                filter="url(#innerGlow)"
              >
                <animate
                  attributeName="opacity"
                  from="0.3"
                  to="0.9"
                  dur="2s"
                  begin={`${i * 0.25}s`}
                  repeatCount="indefinite"
                  values="0.3;0.9;0.3"
                />
              </rect>
            </g>
          ))}
          
          {/* Rotation animation */}
          <animateTransform
            attributeName="transform"
            attributeType="XML"
            type="rotate"
            from="0 50 50"
            to="360 50 50"
            dur="20s"
            repeatCount="indefinite"
          />
        </g>
        
        {/* Core reactor */}
        <circle
          cx="50"
          cy="50"
          r="15"
          fill="url(#coreGradient)"
          filter="url(#arcReactorGlow)"
        />
        
        {/* Inner core */}
        <circle
          cx="50"
          cy="50"
          r="8"
          fill="#ffffff"
          opacity="0.9"
          filter="url(#innerGlow)"
        />
        
        {/* Center bright spot */}
        <circle
          cx="50"
          cy="50"
          r="3"
          fill="#ffffff"
          filter="url(#arcReactorGlow)"
        />
        
        {/* Energy pulses */}
        <circle
          cx="50"
          cy="50"
          r="15"
          fill="none"
          stroke="url(#energyPulse)"
          strokeWidth="2"
          opacity="0"
        >
          <animate
            attributeName="r"
            from="15"
            to="40"
            dur="2s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            from="0.8"
            to="0"
            dur="2s"
            repeatCount="indefinite"
          />
        </circle>
        
        {/* Secondary pulse */}
        <circle
          cx="50"
          cy="50"
          r="15"
          fill="none"
          stroke="url(#energyPulse)"
          strokeWidth="1"
          opacity="0"
        >
          <animate
            attributeName="r"
            from="15"
            to="35"
            dur="2s"
            begin="1s"
            repeatCount="indefinite"
          />
          <animate
            attributeName="opacity"
            from="0.6"
            to="0"
            dur="2s"
            begin="1s"
            repeatCount="indefinite"
          />
        </circle>
        
        {/* Particle effects */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = (i * 30) * Math.PI / 180
          const startRadius = 20
          const endRadius = 40
          const duration = 3 + Math.random() * 2
          
          return (
            <circle key={i} r="0.5" fill="#00d4ff" opacity="0.8">
              <animateMotion
                dur={`${duration}s`}
                repeatCount="indefinite"
                path={`M ${50 + Math.cos(angle) * startRadius} ${50 + Math.sin(angle) * startRadius} L ${50 + Math.cos(angle) * endRadius} ${50 + Math.sin(angle) * endRadius}`}
              />
              <animate
                attributeName="opacity"
                from="0"
                to="0.8"
                dur="0.5s"
                repeatCount="indefinite"
                values="0;0.8;0"
              />
            </circle>
          )
        })}
        
        {/* Location coordinates display */}
        <text
          x="50"
          y="92"
          textAnchor="middle"
          fill="#00d4ff"
          fontSize="2.5"
          fontFamily="monospace"
          opacity="0.7"
          filter="url(#innerGlow)"
        >
          {latitude.toFixed(4)}°N {longitude.toFixed(4)}°W
        </text>
        
        {/* Arc reactor model designation */}
        <text
          x="50"
          y="8"
          textAnchor="middle"
          fill="#00d4ff"
          fontSize="2"
          fontFamily="monospace"
          opacity="0.5"
          filter="url(#innerGlow)"
        >
          ARC REACTOR MARK I
        </text>
      </svg>
      
      {/* Additional visual effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Subtle energy field overlay */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(circle at center, transparent 30%, rgba(0, 212, 255, 0.1) 60%, rgba(0, 102, 255, 0.2) 100%)`,
          }}
        />
        
        {/* Scan lines for that high-tech feel */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `repeating-linear-gradient(
              0deg,
              transparent,
              transparent 1px,
              rgba(0, 212, 255, 0.1) 1px,
              rgba(0, 212, 255, 0.1) 2px
            )`,
          }}
        />
        
        {/* Vignette for depth */}
        <div 
          className="absolute inset-0 pointer-events-none"
          style={{
            background: `radial-gradient(circle at center, transparent 40%, rgba(0, 0, 0, 0.4) 100%)`,
          }}
        />
      </div>
    </div>
  )
}
