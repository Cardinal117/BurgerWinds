import React, { useState } from 'react'
import { MapPin, Send, Settings, MessageSquare } from 'lucide-react'

interface FloatingButtonsProps {
  theme: 'light' | 'dark'
  showLocationPanel: boolean
  showNtfyPanel: boolean
  setShowLocationPanel: (value: boolean) => void
  setShowNtfyPanel: (value: boolean) => void
  showDiscordPanel: boolean
  setShowDiscordPanel: (value: boolean) => void
}

export function FloatingButtons({
  theme,
  showLocationPanel,
  showNtfyPanel,
  setShowLocationPanel,
  setShowNtfyPanel,
  setShowDiscordPanel
}: FloatingButtonsProps) {
  const handleDiscordClick = () => {
    setShowDiscordPanel(true)
    setShowNtfyPanel(false)
    setShowLocationPanel(false)
  }

  const handleNtfyClick = () => {
    setShowNtfyPanel(true)
    setShowLocationPanel(false)
  }

  const handleLocationClick = () => {
    setShowLocationPanel(true)
    setShowNtfyPanel(false)
  }

  return (
    <div className="fixed bottom-4 right-4 md:bottom-6 flex-col gap-3 md:gap-4 z-40">
      {/* Location Button */}
      <button
        onClick={handleLocationClick}
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
        onClick={handleNtfyClick}
        className={`group relative rounded-full p-3 md:p-4 shadow-xl transition-colors ${
          theme === 'dark'
            ? 'bg-gradient-to-br from-purple-600 to-purple-800 text-white hover:from-purple-700 hover:to-purple-900 border-2 border-purple-500'
            : 'bg-gradient-to-br from-purple-400 to-purple-600 text-white hover:from-purple-500 hover:to-purple-700 border-2 border-purple-300'
        }`}
        type="button"
      >
        <div className="flex items-center">
          <MessageSquare className="mr-2" size={16} />
          <span className="text-white font-medium">Ntfy</span>
        </div>
      </button>

      {/* Discord Button */}
      <button
        onClick={handleDiscordClick}
        className={`group relative rounded-full p-3 md:p-4 shadow-xl transition-colors ${
          theme === 'dark'
            ? 'bg-gradient-to-br from-purple-600 to-purple-800 text-white hover:from-purple-700 hover:to-purple-900 border-2 border-purple-500'
            : 'bg-gradient-to-br from-purple-400 to-purple-600 text-white hover:from-purple-500 hover:to-purple-700 border-2 border-purple-300'
        }`}
        type="button"
      >
        <div className="flex items-center">
          <Settings className="mr-2" size={16} />
          <span className="text-white font-medium">Discord</span>
        </div>
      </button>

      {/* Settings Button */}
      <button
        onClick={() => {
          setShowDiscordPanel(true)
          setShowNtfyPanel(false)
          setShowLocationPanel(false)
        }}
        className={`group relative rounded-full p-3 md:p-4 shadow-xl transition-colors ${
          theme === 'dark'
            ? 'bg-gradient-to-br from-gray-600 to-gray-700 text-white hover:from-gray-600 hover:to-gray-500 border-2 border-gray-300'
            : 'bg-gradient-to-br from-gray-400 to-gray-600 text-white hover:from-gray-500 hover:to-gray-700 border-2 border-gray-300'
        }`}
        type="button"
      >
        <div className="flex items-center">
          <Settings className="mr-2" size={16} />
          <span className="text-white font-medium">Settings</span>
        </div>
      </button>
    </div>
  )
}
