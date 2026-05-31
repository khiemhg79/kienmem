import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login         from './pages/Login'
import Dashboard     from './pages/Dashboard'
import Devices       from './pages/Devices'
import Automation    from './pages/Automation'
import Notifications from './pages/Notifications'
import Simulation    from './pages/Simulation'
import EmailSettings from './pages/EmailSettings'
import Report        from './pages/Report'
import Accounts      from './pages/Accounts'
import Logs          from './pages/Logs'
import Layout        from './components/Layout'
import { CameraAIProvider } from './components/CameraAIProvider'
import { DeviceProvider }   from './store/deviceStore'

function checkAndApplyUrlToken() {
  try {
    const params = new URLSearchParams(window.location.search)
    const token = params.get('token')
    if (token) {
      const base64Url = token.split('.')[1]
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/')
      const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
      }).join(''))
      const payload = JSON.parse(jsonPayload)
      
      if (payload && payload.email) {
        localStorage.setItem('accessToken', token)
        localStorage.setItem('refreshToken', 'url-token-dummy')
        localStorage.setItem('user', JSON.stringify({
          id: payload.sub,
          name: payload.name || payload.email.split('@')[0],
          email: payload.email,
          role: payload.role,
          assigned_room: payload.assigned_room
        }))
        // Clear token from URL without reloading
        window.history.replaceState({}, document.title, window.location.pathname)
      }
    }
  } catch (e) {
    console.error('Failed to parse URL token:', e)
  }
}

function PrivateRoute({ children }) {
  checkAndApplyUrlToken()
  const token = localStorage.getItem('accessToken')
  const user  = localStorage.getItem('user')
  if (!token || !user) {
    localStorage.clear()
    return <Navigate to="/login" replace />
  }
  return (
    <CameraAIProvider>
      <DeviceProvider>
        {children}
      </DeviceProvider>
    </CameraAIProvider>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<PrivateRoute><Layout /></PrivateRoute>}>
          <Route index                element={<Dashboard />} />
          <Route path="devices"       element={<Devices />} />
          <Route path="automation"    element={<Automation />} />
          <Route path="simulation"    element={<Simulation />} />
          <Route path="notifications" element={<Notifications />} />
          <Route path="email-settings" element={<EmailSettings />} />
          <Route path="report"        element={<Report />} />
          <Route path="accounts"      element={<Accounts />} />
          <Route path="logs"          element={<Logs />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}