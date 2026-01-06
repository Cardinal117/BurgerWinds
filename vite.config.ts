import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  base: command === 'build' ? '/WindGuru/' : '/',
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor chunks
          'vendor-react': ['react', 'react-dom'],
          'vendor-charts': ['recharts'],
          'vendor-icons': ['lucide-react'],
          
          // Feature chunks - separated to avoid circular dependencies
          'chunk-forecast': ['./src/components/HourlyForecast'],
          'chunk-panels': ['./src/components/LocationPanel', './src/components/NtfyPanel']
        }
      }
    },
    chunkSizeWarningLimit: 600 // Reduce warning threshold
  }
}))
