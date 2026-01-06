import React, { useState, useRef, useEffect } from 'react'
import { Settings, MessageSquare, X } from 'lucide-react'

interface SettingsDropdownProps {
  theme: 'light' | 'dark'
  showNtfyPanel: boolean
  showDiscordPanel: boolean
  setShowNtfyPanel: (value: boolean) => void
  setShowDiscordPanel: (value: boolean) => void
}

export function SettingsDropdown({
  theme,
  showNtfyPanel,
  showDiscordPanel,
  setShowNtfyPanel,
  setShowDiscordPanel
}: SettingsDropdownProps) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleNtfyClick = () => {
    setShowNtfyPanel(true)
    setShowDiscordPanel(false)
    setIsOpen(false)
  }

  const handleDiscordClick = () => {
    setShowDiscordPanel(true)
    setShowNtfyPanel(false)
    setIsOpen(false)
  }

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Settings Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`group relative rounded-full p-3 md:p-4 shadow-xl transition-all duration-300 hover:scale-110 ${
          theme === 'dark'
            ? 'bg-gradient-to-br from-gray-600 to-gray-700 text-white hover:from-gray-600 hover:to-gray-500 border-2 border-gray-300'
            : 'bg-gradient-to-br from-gray-400 to-gray-600 text-white hover:from-gray-500 hover:to-gray-700 border-2 border-gray-300'
        }`}
        type="button"
      >
        <div className="flex items-center">
          <Settings size={20} className="md:w-6 md:h-6" />
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className={`absolute bottom-full right-0 mb-2 w-48 rounded-lg shadow-2xl border ${
          theme === 'dark'
            ? 'bg-slate-800 border-slate-600'
            : 'bg-white border-slate-200'
        }`}>
          <div className="p-2">
            {/* Ntfy Option */}
            <button
              onClick={handleNtfyClick}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                theme === 'dark'
                  ? 'hover:bg-slate-700 text-slate-200'
                  : 'hover:bg-slate-100 text-slate-700'
              } ${showNtfyPanel ? 'bg-blue-100 text-blue-700' : ''}`}
              type="button"
            >
              <MessageSquare size={16} />
              <span>Ntfy Notifications</span>
              {showNtfyPanel && <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full" />}
            </button>

            {/* Discord Option */}
            <button
              onClick={handleDiscordClick}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                theme === 'dark'
                  ? 'hover:bg-slate-700 text-slate-200'
                  : 'hover:bg-slate-100 text-slate-700'
              } ${showDiscordPanel ? 'bg-blue-100 text-blue-700' : ''}`}
              type="button"
            >
              <Settings size={16} />
              <span>Discord Settings</span>
              {showDiscordPanel && <div className="ml-auto w-2 h-2 bg-blue-500 rounded-full" />}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
