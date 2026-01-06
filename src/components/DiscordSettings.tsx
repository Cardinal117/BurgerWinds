import React, { useState } from 'react'
import { Settings, Bell, Mail, MessageSquare, TestTube, CheckCircle, X } from 'lucide-react'
import { discordService } from '../lib/discordService'
import { DiscordConfig } from '../lib/discordService'

interface DiscordSettingsProps {
  theme: 'light' | 'dark'
  isOpen: boolean
  onClose: () => void
  currentConfig?: DiscordConfig
  onSave: (config: DiscordConfig) => void
}

export function DiscordSettings({ theme, isOpen, onClose, currentConfig, onSave }: DiscordSettingsProps) {
  const [config, setConfig] = useState<DiscordConfig>(currentConfig || {
    webhookUrl: '',
    enabled: false,
    username: 'WindGuru Bot',
    avatarUrl: 'https://i.imgur.com/windguru-avatar.png'
  });

  const [testResult, setTestResult] = useState<string>('');
  const [isTesting, setIsTesting] = useState(false);

  const handleTest = async () => {
    setIsTesting(true);
    setTestResult('Testing connection...');
    
    try {
      const success = await discordService.testConnection();
      if (success) {
        setTestResult('✅ Connection successful! Discord notification sent.');
      } else {
        setTestResult('❌ Connection failed. Check webhook URL and Discord server status.');
      }
    } catch (error) {
      setTestResult(`❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsTesting(false);
    }
  };

  const handleSave = () => {
    onSave(config);
    };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center ${theme === 'dark' ? 'bg-black/50' : 'bg-black/50'}`}>
      <div className={`relative w-full max-w-md mx-auto p-6 rounded-2xl shadow-2xl ${theme === 'dark' ? 'bg-slate-800 text-slate-100' : 'bg-white text-slate-900'}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className={`text-xl font-bold ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
            <MessageSquare className="mr-2" size={24} />
            Discord Notifications
          </h2>
          <button
            onClick={onClose}
            className={`p-2 rounded-full hover:bg-opacity-80 ${theme === 'dark' ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
          >
            <X size={20} />
          </button>
        </div>

        {/* Settings Form */}
        <div className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="discord-enabled"
              checked={config.enabled}
              onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
              className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
            />
            <label htmlFor="discord-enabled" className="flex items-center cursor-pointer">
              <Bell className="ml-2" size={16} />
              <span className={`ml-2 font-medium ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
                Enable Discord Notifications
              </span>
            </label>
          </div>

          {/* Webhook URL */}
          <div>
            <label htmlFor="webhook-url" className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
              <Settings className="inline mr-2" size={16} />
              Discord Webhook URL
            </label>
            <input
              type="url"
              id="webhook-url"
              value={config.webhookUrl}
              onChange={(e) => setConfig({ ...config, webhookUrl: e.target.value })}
              placeholder="https://discord.com/api/webhooks/..."
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`}
            />
            <p className={`text-xs mt-1 ${theme === 'dark' ? 'text-slate-400' : 'text-slate-500'}`}>
              Get this from your Discord server → Server Settings → Integrations → Webhooks → New Webhook
            </p>
          </div>

          {/* Bot Username */}
          <div>
            <label htmlFor="bot-username" className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
              Bot Username
            </label>
            <input
              type="text"
              id="bot-username"
              value={config.username}
              onChange={(e) => setConfig({ ...config, username: e.target.value })}
              placeholder="WindGuru Bot"
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`}
            />
          </div>

          {/* Avatar URL */}
          <div>
            <label htmlFor="avatar-url" className={`block text-sm font-medium mb-2 ${theme === 'dark' ? 'text-slate-200' : 'text-slate-700'}`}>
              Avatar URL (optional)
            </label>
            <input
              type="url"
              id="avatar-url"
              value={config.avatarUrl}
              onChange={(e) => setConfig({ ...config, avatarUrl: e.target.value })}
              placeholder="https://i.imgur.com/..."
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${theme === 'dark' ? 'bg-slate-700 border-slate-600 text-slate-100' : 'bg-white border-slate-300 text-slate-900'}`}
            />
          </div>
        </div>

        {/* Test Connection */}
        <div className="border-t pt-6">
          <button
            onClick={handleTest}
            disabled={isTesting || !config.webhookUrl}
            className={`w-full flex items-center justify-center px-4 py-3 rounded-lg font-medium transition-colors ${
              isTesting
                ? 'bg-gray-400 cursor-not-allowed'
                : config.enabled
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 hover:bg-gray-400 text-gray-700'
            }`}
          >
            {isTesting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-transparent border-r-transparent mr-3"></div>
                Testing...
              </>
            ) : (
              <>
                <TestTube className="mr-2" size={16} />
                Test Connection
              </>
            )}
          </button>
          
          {testResult && (
            <div className={`mt-4 p-3 rounded-lg text-sm ${testResult.includes('✅') ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              {testResult}
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3 pt-6">
          <button
            onClick={handleSave}
            disabled={!config.webhookUrl}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              config.webhookUrl
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <CheckCircle className="mr-2" size={16} />
            Save Configuration
          </button>
          
          <button
            onClick={onClose}
            className={`flex-1 px-4 py-2 rounded-lg font-medium transition-colors ${
              theme === 'dark' ? 'bg-slate-700 hover:bg-slate-600 text-slate-100' : 'bg-gray-200 hover:bg-gray-300 text-slate-700'
            }`}
          >
            Cancel
          </button>
        </div>

        {/* Instructions */}
        <div className={`mt-6 p-4 rounded-lg ${theme === 'dark' ? 'bg-slate-700' : 'bg-blue-50'}`}>
          <h3 className={`font-semibold mb-3 ${theme === 'dark' ? 'text-slate-100' : 'text-slate-900'}`}>
            📋 Setup Instructions
          </h3>
          <ol className={`text-sm space-y-2 ${theme === 'dark' ? 'text-slate-300' : 'text-slate-600'}`}>
            <li>1. Create a Discord server or use existing one</li>
            <li>2. Go to Server Settings → Integrations → Webhooks</li>
            <li>3. Create "New Webhook" with a name (e.g., "WindGuru")</li>
            <li>4. Copy the webhook URL and paste it above</li>
            <li>5. Test the connection to verify it works</li>
            <li>6. Save and enjoy notifications! 🎉</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
