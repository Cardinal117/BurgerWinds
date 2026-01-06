import React, { useState } from 'react'
import { X, MapPin } from 'lucide-react'
import { GeoResult } from '../lib/openMeteo'

interface LocationPanelProps {
  theme: 'light' | 'dark'
  location: GeoResult
  savedLocations: { items: GeoResult[] }
  search: string
  searchResults: GeoResult[]
  onSearchChange: (value: string) => void
  onLocationSelect: (location: GeoResult) => void
  onSaveLocation: () => void
  onDeleteLocation: (locationId: number) => void
  onClose: () => void
  isCurrentLocationSaved: boolean
}

export function LocationPanel({
  theme,
  location,
  savedLocations,
  search,
  searchResults,
  onSearchChange,
  onLocationSelect,
  onSaveLocation,
  onDeleteLocation,
  onClose,
  isCurrentLocationSaved
}: LocationPanelProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 transform transition-transform">
      <div className={`shadow-2xl ring-1 ${theme === 'dark' ? 'bg-slate-800 ring-slate-700' : 'bg-white ring-slate-200'
        }`}>
        <div className={`flex items-center justify-between p-4 border-b ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'
          }`}>
          <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>Change Location</div>
          <button
            onClick={onClose}
            className={`rounded-full p-1 ${theme === 'dark' ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-400 hover:bg-slate-100'
              }`}
            type="button"
          >
            <X size={16} />
          </button>
        </div>
        <div className="p-4">
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-3">
              <MapPin size={16} className={theme === 'dark' ? 'text-slate-400' : 'text-slate-500'} />
              <div className={`text-sm ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
                {[location.name, location.admin1, location.country].filter(Boolean).join(', ')}
              </div>
            </div>
            
            <input
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search location (e.g. Cape Town, Langebaan, Maui)"
              className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none placeholder:text-slate-500 focus:ring-1 ${theme === 'dark'
                  ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 focus:border-blue-400 focus:ring-blue-400'
                }`}
            />
            {searchResults.length ? (
              <div className={`mt-2 overflow-hidden rounded-2xl border ${theme === 'dark' ? 'border-slate-700 bg-slate-800' : 'border-slate-200 bg-white'
                }`}>
                {searchResults.map((r) => (
                  <button
                    key={r.id}
                    onClick={() => onLocationSelect(r)}
                    className={`block w-full border-b px-4 py-3 text-left text-sm last:border-b-0 ${theme === 'dark' ? 'border-slate-700 hover:bg-slate-700' : 'border-slate-200 hover:bg-blue-50'
                      }`}
                  >
                    {[r.name, r.admin1, r.country].filter(Boolean).join(', ')}
                    <div className={`text-xs ${theme === 'dark' ? 'text-slate-500' : 'text-slate-500'}`}>
                      {r.latitude.toFixed(4)}, {r.longitude.toFixed(4)}
                    </div>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>Saved Locations</div>
              <button
                type="button"
                onClick={onSaveLocation}
                disabled={isCurrentLocationSaved}
                className={`rounded-full px-3 py-1 text-xs font-medium text-white disabled:opacity-50 ${theme === 'dark' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-blue-500 hover:bg-blue-600'
                  }`}
              >
                {isCurrentLocationSaved ? 'Saved' : 'Save current'}
              </button>
            </div>

            <div className="space-y-2">
              {savedLocations.items.length === 0 ? (
                <div className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>No saved locations yet.</div>
              ) : (
                savedLocations.items.map((l) => (
                  <div
                    key={l.id}
                    className={`rounded-2xl border px-3 py-2 text-sm transition-colors cursor-pointer ${l.id === location.id
                        ? theme === 'dark'
                          ? 'border-blue-500 bg-blue-900/50 text-blue-400'
                          : 'border-blue-400 bg-blue-50 text-blue-700'
                        : theme === 'dark'
                          ? 'border-slate-700 bg-slate-800 text-slate-200 hover:bg-slate-700'
                          : 'border-slate-200 bg-white text-slate-900 hover:bg-blue-50'
                      }`}
                    onClick={() => onLocationSelect(l)}
                  >
                    <button
                      type="button"
                      onClick={() => onLocationSelect(l)}
                      className="w-full text-left"
                    >
                      <div className={`font-medium ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>{l.name}</div>
                      <div className={`text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                        {l.latitude.toFixed(4)}, {l.longitude.toFixed(4)}
                      </div>
                    </button>
                    {l.id !== 0 && (
                      <button
                        type="button"
                        onClick={() => onDeleteLocation(l.id)}
                        className={`absolute top-2 right-2 p-1 rounded-full text-xs ${
                          theme === 'dark' ? 'text-slate-400 hover:bg-slate-700' : 'text-slate-400 hover:bg-slate-100'
                        }`}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
