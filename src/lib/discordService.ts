// Discord notification service for WindGuru
export interface DiscordConfig {
  webhookUrl: string
  enabled: boolean
  username?: string
  avatarUrl?: string
}

export interface DiscordEmbed {
  title: string
  description: string
  color?: string
  timestamp?: string
  thumbnail?: {
    url: string
  width?: number
    height?: number
  }
  fields?: Array<{
    name: string
    value: string
    inline?: boolean
  }>
}

export class DiscordNotificationService {
  private config: DiscordConfig;

  constructor(config: DiscordConfig) {
    this.config = config;
  }

  async sendWeatherAlert(message: string, locationName: string, weatherData?: any): Promise<void> {
    if (!this.config.enabled || !this.config.webhookUrl) {
      console.log('Discord notifications disabled or webhook URL not set');
      return;
    }

    const embed: DiscordEmbed = {
      title: '🌊 WindGuru Weather Alert',
      description: message,
      color: this.getWeatherColor(weatherData),
      timestamp: new Date().toISOString(),
      thumbnail: {
        url: 'https://i.imgur.com/your-windguru-icon.png', // You can replace with actual icon
        width: 256,
        height: 256
      },
      fields: [
        {
          name: '📍 Location',
          value: locationName,
          inline: true
        },
        {
          name: '⏰ Time',
          value: new Date().toLocaleString(),
          inline: true
        },
        {
          name: '🌡️ Service',
          value: 'WindGuru Notification System',
          inline: true
        }
      ]
    };

    const payload = {
      username: this.config.username || 'WindGuru Bot',
      avatar_url: this.config.avatarUrl,
      embeds: [embed]
    };

    try {
      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'WindGuru-Notifier/1.0'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`Discord webhook failed: ${response.status} ${response.statusText}`);
      }

      console.log('✅ Discord notification sent successfully');
    } catch (error) {
      console.error('❌ Failed to send Discord notification:', error);
      throw error;
    }
  }

  async sendWindSurferAlert(message: string, locationName: string, windSpeed: number, windDirection: string): Promise<void> {
    if (!this.config.enabled || !this.config.webhookUrl) {
      return;
    }

    const embed: DiscordEmbed = {
      title: '🏄‍♂️ Wind Surfer Alert',
      description: message,
      color: this.getWindSpeedColor(windSpeed),
      timestamp: new Date().toISOString(),
      thumbnail: {
        url: 'https://i.imgur.com/wind-icon.png', // Wind-specific icon
        width: 256,
        height: 256
      },
      fields: [
        {
          name: '💨 Wind Speed',
          value: `${windSpeed} km/h`,
          inline: true
        },
        {
          name: '🧭 Direction',
          value: windDirection,
          inline: true
        },
        {
          name: '📍 Location',
          value: locationName,
          inline: true
        },
        {
          name: '⏰ Alert Time',
          value: new Date().toLocaleString(),
          inline: true
        }
      ]
    };

    const payload = {
      username: this.config.username || 'Wind Surfer Bot',
      avatar_url: this.config.avatarUrl,
      embeds: [embed]
    };

    try {
      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'WindGuru-Surfer/1.0'
        },
        body: JSON.stringify(payload)
      });

      console.log('✅ Wind surfer Discord notification sent');
    } catch (error) {
      console.error('❌ Failed to send wind surfer notification:', error);
    }
  }

  async sendCustomAlert(title: string, message: string, color: string = '#0099ff', fields?: any[]): Promise<void> {
    if (!this.config.enabled || !this.config.webhookUrl) {
      return;
    }

    const embed: DiscordEmbed = {
      title,
      description: message,
      color,
      timestamp: new Date().toISOString(),
      fields: fields || []
    };

    const payload = {
      username: this.config.username || 'WindGuru Bot',
      avatar_url: this.config.avatarUrl,
      embeds: [embed]
    };

    try {
      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'WindGuru-Custom/1.0'
        },
        body: JSON.stringify(payload)
      });

      console.log('✅ Custom Discord notification sent');
    } catch (error) {
      console.error('❌ Failed to send custom notification:', error);
    }
  }

  private getWeatherColor(weatherData?: any): string {
    if (!weatherData) return '#3B82F6'; // Blue default
    
    const temp = weatherData.temperatureC || 20;
    
    // Temperature-based color coding
    if (temp <= 0) return '#00D9FF'; // Ice blue
    if (temp <= 10) return '#00BFFF'; // Light blue
    if (temp <= 20) return '#00FF7F'; // Light green
    if (temp <= 30) return '#FFFF00'; // Yellow
    if (temp <= 40) return '#FF7F00'; // Orange
    return '#FF0000'; // Red
  }

  private getWindSpeedColor(windSpeed: number): string {
    if (windSpeed < 16) return '#00FF00'; // Green - Light winds
    if (windSpeed < 30) return '#FFFF00'; // Yellow - Moderate
    if (windSpeed < 40) return '#FF7F00'; // Orange - Strong
    return '#FF0000'; // Red - Very strong
  }

  // Test method to verify Discord webhook
  async testConnection(): Promise<boolean> {
    if (!this.config.enabled || !this.config.webhookUrl) {
      return false;
    }

    try {
      const testEmbed: DiscordEmbed = {
        title: '🧪 Connection Test',
        description: 'WindGuru Discord notification service is working!',
        color: '#00FF00',
        timestamp: new Date().toISOString()
      };

      const response = await fetch(this.config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'WindGuru-Test/1.0'
        },
        body: JSON.stringify({
          username: 'WindGuru Test Bot',
          embeds: [testEmbed]
        })
      });

      return response.ok;
    } catch (error) {
      console.error('Discord connection test failed:', error);
      return false;
    }
  }
}

// Export for use in React components
export const discordService = new DiscordNotificationService({
  webhookUrl: '', // Will be set from settings
  enabled: false,
  username: 'WindGuru Bot',
  avatarUrl: 'https://i.imgur.com/windguru-avatar.png'
});
