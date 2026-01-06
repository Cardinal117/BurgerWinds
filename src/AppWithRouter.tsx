import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import App from './App'
// import { MapPage } from './pages/MapPage'
// import { WeatherProvider } from './contexts/WeatherContext'

export function AppWithRouter() {
  // Use basename for GitHub Pages, but not for development
  const basename = import.meta.env.PROD ? '/BurgerWinds' : '/'
  
  return (
    // <WeatherProvider>
      <Router basename={basename}>
        <Routes>
          <Route path="/" element={<App />} />
          {/* <Route path="/map" element={<MapPage />} /> */}
        </Routes>
      </Router>
    // {/* </WeatherProvider> */}
  )
}
