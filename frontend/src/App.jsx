import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login         from './pages/Login'
import Dashboard     from './pages/Dashboard'
import Devices       from './pages/Devices'
import Automation    from './pages/Automation'
import Notifications from './pages/Notifications'
import Simulation    from './pages/Simulation'
import EmailSettings from './pages/EmailSettings'
import Report        from './pages/Report'
import Layout        from './components/Layout'
import { CameraAIProvider } from './components/CameraAIProvider'
import { DeviceProvider }   from './store/deviceStore'

function PrivateRoute({ children }) {
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
        </Route>
      </Routes>
    </BrowserRouter>
  )
}