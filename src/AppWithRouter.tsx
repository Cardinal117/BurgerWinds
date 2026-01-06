import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import App from './App'
// import { MapPage } from './pages/MapPage'
// import { WeatherProvider } from './contexts/WeatherContext'

export function AppWithRouter() {
  return (
    // <WeatherProvider>
      <Router>
        <Routes>
          <Route path="/" element={<App />} />
          {/* <Route path="/map" element={<MapPage />} /> */}
        </Routes>
      </Router>
    // {/* </WeatherProvider> */}
  )
}
