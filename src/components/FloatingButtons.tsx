import React from 'react'
import { MapPin, Send, X } from 'lucide-react'

interface FloatingButtonsProps {
  theme: 'light' | 'dark'
  showLocationPanel: boolean
  showNtfyPanel: boolean
  ntfyEnabled: boolean
  onLocationClick: () => void
  onNtfyClick: () => void
}

export function FloatingButtons({ 
  theme, 
  showLocationPanel, 
  showNtfyPanel, 
  ntfyEnabled,
  onLocationClick,
  onNtfyClick 
}: FloatingButtonsProps) {
  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 md:right-6 flex flex-col gap-3 md:gap-4 z-40">
      {/* Location Button */}
      <button
        onClick={onLocationClick}
        className={`group relative rounded-full p-3 md:p-4 shadow-xl transition-all duration-300 hover:scale-110 ${
          theme === 'dark'
            ? 'bg-gradient-to-br from-blue-600 to-blue-800 text-white hover:from-blue-700 hover:to-blue-900 border-2 border-blue-400'
            : 'bg-gradient-to-br from-blue-400 to-blue-600 text-white hover:from-blue-500 hover:to-blue-700 border-2 border-blue-300'
        }`}
        type="button"
      >
        <div className="relative">
          <MapPin size={20} className="md:w-6 md:h-6" />
          {showLocationPanel && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
          )}
        </div>
      </button>
      
      {/* Ntfy Button */}
      <button
        onClick={onNtfyClick}
        className={`group relative rounded-full p-3 md:p-4 shadow-xl transition-all duration-300 hover:scale-110 ${
          theme === 'dark'
            ? 'bg-gradient-to-br from-green-600 to-green-800 text-white hover:from-green-700 hover:to-green-900 border-2 border-green-400'
            : 'bg-gradient-to-br from-green-400 to-green-600 text-white hover:from-green-500 hover:to-green-700 border-2 border-green-300'
        }`}
        type="button"
      >
        <div className="relative">
          <Send size={20} className="md:w-6 md:h-6" />
          {ntfyEnabled && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
          )}
        </div>
      </button>
    </div>
  )
}
