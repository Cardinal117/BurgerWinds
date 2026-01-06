// Simple test for Discord service
import { discordService } from './src/lib/discordService'

// Test the Discord service
async function testDiscord() {
  console.log('🧪 Testing Discord service...')
  
  // Test 1: Basic connection test
  try {
    const isConnected = await discordService.testConnection()
    console.log('✅ Discord connection test:', isConnected)
  } catch (error) {
    console.error('❌ Discord connection test failed:', error)
  }
  
  // Test 2: Send a test message
  try {
    await discordService.sendWeatherAlert(
      '🧪 Test Alert - WindGuru Discord Integration',
      'Test Location',
      { windSpeed10mKmh: 25, windDirection10mDeg: 180, temperatureC: 20 }
    )
    console.log('✅ Discord test message sent successfully')
  } catch (error) {
    console.error('❌ Discord test message failed:', error)
  }
  
  console.log('🎯 Discord service test complete!')
}

// Run the test
testDiscord()
