import React from 'react'

interface GTAMapBackgroundProps {
  latitude: number
  longitude: number
  theme: 'light' | 'dark'
}

export function GTAMapBackground({ latitude, longitude, theme }: GTAMapBackgroundProps) {
  return (
    <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
      {/* Full page wrapper with radial gradient background */}
      <div className={`fullpage-wrapper w-full h-screen ${theme === 'dark' ? 'bg-[radial-gradient(#353c44,#222931)]' : 'bg-[radial-gradient(#4a5568,#2d3748)]'} flex items-center justify-center`}>
        {/* Reactor Container */}
        <div className="reactor-container w-[300px] h-[300px] m-auto border border-dashed border-gray-600 relative rounded-full bg-[#384c50] border-[rgb(18,20,20)] shadow-[0px_0px_32px_8px_rgb(18,20,20),0px_0px_4px_1px_rgb(18,20,20)_inset]">
          
          {/* Reactor Container Inner */}
          <div className="reactor-container-inner circle abs-center h-[238px] w-[238px] bg-[rgb(22,26,27)] shadow-[0px_0px_4px_1px_#52FEFE]" />
          
          {/* Core Components */}
          <div className="tunnel circle abs-center w-[220px] h-[220px] bg-white shadow-[0px_0px_5px_1px_#52FEFE,0px_0px_5px_4px_#52FEFE_inset]" />
          <div className="core-wrapper circle abs-center w-[180px] h-[180px] bg-[#073c4b] shadow-[0px_0px_5px_4px_#52FEFE,0px_0px_6px_2px_#52FEFE_inset]" />
          <div className="core-outer circle abs-center w-[120px] h-[120px] border border-[#52FEFE] bg-white shadow-[0px_0px_2px_1px_#52FEFE,0px_0px_10px_5px_#52FEFE_inset]" />
          <div className="core-inner circle abs-center w-[70px] h-[70px] border-[5px_solid_#1B4E5F] bg-white shadow-[0px_0px_7px_5px_#52FEFE,0px_0px_10px_10px_#52FEFE_inset]" />
          
          {/* Rotating Coil Container */}
          <div className="coil-container absolute inset-0 animate-spin-slow">
            <div className="coil coil-1 absolute w-[30px] h-[20px] top-[calc(50%-110px)] left-[calc(50%-15px)] origin-[15px_110px] bg-[#073c4b] shadow-[0px_0px_5px_#52FEFE_inset]" />
            <div className="coil coil-2 absolute w-[30px] h-[20px] top-[calc(50%-110px)] left-[calc(50%-15px)] origin-[15px_110px] bg-[#073c4b] shadow-[0px_0px_5px_#52FEFE_inset] rotate-[45deg]" />
            <div className="coil coil-3 absolute w-[30px] h-[20px] top-[calc(50%-110px)] left-[calc(50%-15px)] origin-[15px_110px] bg-[#073c4b] shadow-[0px_0px_5px_#52FEFE_inset] rotate-[90deg]" />
            <div className="coil coil-4 absolute w-[30px] h-[20px] top-[calc(50%-110px)] left-[calc(50%-15px)] origin-[15px_110px] bg-[#073c4b] shadow-[0px_0px_5px_#52FEFE_inset] rotate-[135deg]" />
            <div className="coil coil-5 absolute w-[30px] h-[20px] top-[calc(50%-110px)] left-[calc(50%-15px)] origin-[15px_110px] bg-[#073c4b] shadow-[0px_0px_5px_#52FEFE_inset] rotate-[180deg]" />
            <div className="coil coil-6 absolute w-[30px] h-[20px] top-[calc(50%-110px)] left-[calc(50%-15px)] origin-[15px_110px] bg-[#073c4b] shadow-[0px_0px_5px_#52FEFE_inset] rotate-[225deg]" />
            <div className="coil coil-7 absolute w-[30px] h-[20px] top-[calc(50%-110px)] left-[calc(50%-15px)] origin-[15px_110px] bg-[#073c4b] shadow-[0px_0px_5px_#52FEFE_inset] rotate-[270deg]" />
            <div className="coil coil-8 absolute w-[30px] h-[20px] top-[calc(50%-110px)] left-[calc(50%-15px)] origin-[15px_110px] bg-[#073c4b] shadow-[0px_0px_5px_#52FEFE_inset] rotate-[315deg]" />
          </div>
          
          {/* Location coordinates display */}
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-[#52FEFE] text-[10px] font-mono opacity-70">
            {latitude.toFixed(4)}°N {longitude.toFixed(4)}°W
          </div>
          
          {/* Arc reactor model designation */}
          <div className="absolute top-2 left-1/2 transform -translate-x-1/2 text-[#52FEFE] text-[8px] font-mono opacity-50">
            ARC REACTOR MARK I
          </div>
        </div>
      </div>
      
      {/* Additional visual effects */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Subtle energy field overlay */}
        <div 
          className="absolute inset-0 opacity-30"
          style={{
            background: `radial-gradient(circle at center, transparent 30%, rgba(82, 254, 254, 0.1) 60%, rgba(82, 254, 254, 0.2) 100%)`,
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
              rgba(82, 254, 254, 0.1) 1px,
              rgba(82, 254, 254, 0.1) 2px
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
