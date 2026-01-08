import React from 'react'
import { MapPin, Zap } from 'lucide-react'
import { SettingsDropdown } from './SettingsDropdown'

interface FloatingButtonsProps {
  theme: 'light' | 'dark'
  showLocationPanel: boolean
  showNtfyPanel: boolean
  showDiscordPanel: boolean
  setShowLocationPanel: (value: boolean) => void
  setShowNtfyPanel: (value: boolean) => void
  setShowDiscordPanel: (value: boolean) => void
  showArcReactor: boolean
  setShowArcReactor: (value: boolean) => void
}

export function FloatingButtons({
  theme,
  showLocationPanel,
  showNtfyPanel,
  showDiscordPanel,
  setShowLocationPanel,
  setShowNtfyPanel,
  setShowDiscordPanel,
  showArcReactor,
  setShowArcReactor
}: FloatingButtonsProps) {
  const handleLocationClick = () => {
    setShowLocationPanel(true)
    setShowNtfyPanel(false)
    setShowDiscordPanel(false)
  }

  return (
    <div className="fixed bottom-4 right-4 md:bottom-8 flex flex-col gap-3 md:gap-4 z-50">
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

      {/* Arc Reactor Toggle Button */}
      <button
        onClick={() => setShowArcReactor(!showArcReactor)}
        className={`group relative rounded-full p-3 md:p-4 shadow-xl transition-all duration-300 hover:scale-110 ${
          showArcReactor
            ? theme === 'dark'
              ? 'bg-gradient-to-br from-cyan-600 to-cyan-800 text-white hover:from-cyan-700 hover:to-cyan-900 border-2 border-cyan-400'
              : 'bg-gradient-to-br from-cyan-400 to-cyan-600 text-white hover:from-cyan-500 hover:to-cyan-700 border-2 border-cyan-300'
            : theme === 'dark'
              ? 'bg-gradient-to-br from-slate-600 to-slate-800 text-white hover:from-slate-700 hover:to-slate-900 border-2 border-slate-400'
              : 'bg-gradient-to-br from-slate-400 to-slate-600 text-white hover:from-slate-500 hover:to-slate-700 border-2 border-slate-300'
        }`}
        type="button"
      >
        <div className="relative">
          <Zap size={20} className="md:w-6 md:h-6" />
          {showArcReactor && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-cyan-500 rounded-full animate-pulse" />
          )}
        </div>
      </button>

      {/* Settings Dropdown */}
      <SettingsDropdown
        theme={theme}
        showNtfyPanel={showNtfyPanel}
        showDiscordPanel={showDiscordPanel}
        setShowNtfyPanel={setShowNtfyPanel}
        setShowDiscordPanel={setShowDiscordPanel}
      />
    </div>
  )
}
