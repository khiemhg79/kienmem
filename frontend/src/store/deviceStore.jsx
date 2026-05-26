import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { getDevices, controlDevice } from '../services/api'

const DeviceContext = createContext(null)

export function DeviceProvider({ children }) {
  const [devices, setDevices] = useState([])
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(null)
  const intervalRef = useRef(null)

  const fetchDevices = useCallback(async () => {
    try {
      const r = await getDevices()
      setDevices(r.data)
    } catch (e) {
      console.error('fetchDevices error', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchDevices()
    intervalRef.current = setInterval(fetchDevices, 5000)
    return () => clearInterval(intervalRef.current)
  }, [fetchDevices])

  const toggleDevice = useCallback(async (device) => {
    if (toggling === device.id) return
    setToggling(device.id)
    const newStatus = !device.status

    // Optimistic update — cập nhật UI ngay lập tức
    setDevices(prev =>
      prev.map(d => d.id === device.id ? { ...d, status: newStatus } : d)
    )

    try {
      await controlDevice(device.id, { command: newStatus ? 'ON' : 'OFF' })
    } catch {
      // Rollback nếu API lỗi
      setDevices(prev =>
        prev.map(d => d.id === device.id ? { ...d, status: !newStatus } : d)
      )
    } finally {
      setToggling(null)
    }
  }, [toggling])

  const refreshDevices = useCallback(() => fetchDevices(), [fetchDevices])

  return (
    <DeviceContext.Provider value={{ devices, setDevices, loading, toggling, toggleDevice, refreshDevices }}>
      {children}
    </DeviceContext.Provider>
  )
}

export function useDeviceStore() {
  const ctx = useContext(DeviceContext)
  if (!ctx) throw new Error('useDeviceStore must be used inside DeviceProvider')
  return ctx
}