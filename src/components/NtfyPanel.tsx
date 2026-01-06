import React from 'react'
import { X, Send } from 'lucide-react'

export type NtfySettings = {
  enabled: boolean
  topic: string
  schedule: string[]
}

interface NtfyPanelProps {
  theme: 'light' | 'dark'
  ntfy: NtfySettings
  onNtfyChange: (ntfy: NtfySettings) => void
  onSend: () => void
  onClose: () => void
}

export function NtfyPanel({ theme, ntfy, onNtfyChange, onSend, onClose }: NtfyPanelProps) {
  return (
    <div className="fixed inset-x-0 bottom-0 z-50 transform transition-transform">
      <div className={`shadow-2xl ring-1 ${theme === 'dark' ? 'bg-slate-800 ring-slate-700' : 'bg-white ring-slate-200'
        }`}>
        <div className={`flex items-center justify-between p-4 border-b ${theme === 'dark' ? 'border-slate-700' : 'border-slate-200'
          }`}>
          <div className={`text-sm font-semibold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>Messaging Settings</div>
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
          {/* ntfy.sh Section */}
          <div className={`mb-4 rounded-2xl p-3 ${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50'}`}>
            <div className={`text-xs font-semibold mb-3 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>ntfy.sh (Zero Setup)</div>
            <input
              value={ntfy.topic}
              onChange={(e) => onNtfyChange({ ...ntfy, topic: e.target.value })}
              placeholder="topic-name (optional)"
              className={`w-full rounded-2xl border px-4 py-3 text-sm outline-none placeholder:text-slate-500 focus:ring-1 ${theme === 'dark'
                  ? 'bg-slate-900 border-slate-700 text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:ring-blue-500'
                  : 'bg-white border-slate-300 text-slate-900 placeholder:text-slate-500 focus:border-blue-400 focus:ring-blue-400'
                }`}
            />
            <div className="mt-3 flex items-center justify-between">
              <div>
                <label className={`flex items-center gap-2 text-xs font-medium ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>
                  <input
                    type="checkbox"
                    checked={ntfy.enabled}
                    onChange={(e) => onNtfyChange({ ...ntfy, enabled: e.target.checked })}
                    className="rounded"
                  />
                  Enable notifications
                </label>
              </div>
              <div className="flex items-end">
                <button
                  type="button"
                  onClick={onSend}
                  className={`rounded-2xl px-4 py-3 text-sm font-semibold hover:opacity-90 ${theme === 'dark'
                      ? 'bg-green-700 text-white hover:bg-green-600'
                      : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                >
                  {ntfy.topic ? 'Send now' : 'Auto-generate topic'}
                </button>
              </div>
            </div>
            {ntfy.enabled && (
              <div className={`mt-3 rounded-2xl border px-3 py-2 text-xs ${theme === 'dark' ? 'border-green-700 bg-green-900/50 text-green-300' : 'border-green-200 bg-green-50 text-green-800'
                }`}>
                ✅ ntfy.sh enabled • Topic: {ntfy.topic}
              </div>
            )}
          </div>

          {/* Scheduling Section */}
          {ntfy.enabled && (
            <div className="mt-4">
              <label className={`block text-xs font-medium mb-2 ${theme === 'dark' ? 'text-blue-400' : 'text-blue-600'}`}>Notification Schedule</label>
              <div className="space-y-2">
                {ntfy.schedule.map((time: string, index: number) => (
                  <div key={index} className="flex gap-2">
                    <input
                      type="time"
                      value={time}
                      onChange={(e) => {
                        const newSchedule = [...ntfy.schedule]
                        newSchedule[index] = e.target.value
                        onNtfyChange({ ...ntfy, schedule: newSchedule })
                      }}
                      className={`flex-1 rounded-xl border px-3 py-2 text-sm outline-none focus:ring-1 ${theme === 'dark'
                          ? 'bg-slate-900 border-slate-700 text-slate-100 focus:border-blue-500 focus:ring-blue-500'
                          : 'bg-white border-slate-300 text-slate-900 focus:border-blue-400 focus:ring-blue-400'
                        }`}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const newSchedule = ntfy.schedule.filter((_: string, i: number) => i !== index)
                        onNtfyChange({ ...ntfy, schedule: newSchedule })
                      }}
                      className={`rounded-xl px-3 py-2 text-sm font-medium hover:opacity-90 ${theme === 'dark'
                          ? 'bg-red-700 text-white hover:bg-red-600'
                          : 'bg-red-600 text-white hover:bg-red-700'
                        }`}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    onNtfyChange({ ...ntfy, schedule: [...ntfy.schedule, '07:00'] })
                  }}
                  className={`w-full rounded-xl px-3 py-2 text-sm font-medium hover:opacity-90 ${theme === 'dark'
                      ? 'bg-blue-700 text-white hover:bg-blue-600'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                >
                  Add Time
                </button>
              </div>
              <div className={`mt-2 text-xs ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
                Notifications will be sent at these times daily with content based on your current view mode
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
