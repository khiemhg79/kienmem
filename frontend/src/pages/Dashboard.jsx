import { useState, useEffect, useCallback } from 'react'
import { Thermometer, Cpu, Zap, Bell, Activity, TrendingUp, AlertTriangle, Settings } from 'lucide-react'
import { getDevices, getLatestSensors, getSensorHistory, getNotifications, getUnreadCount, getRules, getSimulationConfig, updateSimulationConfig } from '../services/api'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

function StatCard({ icon: Icon, label, value, sub, color, alert }) {
  return (
    <div className={`bg-white rounded-xl p-5 shadow-sm border ${alert ? 'border-red-200 ring-2 ring-red-100' : 'border-gray-100'}`}>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-500">{label}</span>
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
      <p className={`text-3xl font-bold ${alert ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
      {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
      {alert && <p className="text-xs text-red-500 mt-1 font-medium">⚠ Vượt ngưỡng cảnh báo!</p>}
    </div>
  )
}

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  const val = payload[0]?.value
  return (
    <div className={`px-3 py-2 rounded-lg shadow-lg text-sm border ${val > 29 ? 'bg-red-50 border-red-200' : 'bg-white border-gray-200'}`}>
      <p className="text-gray-500 text-xs">{label}</p>
      <p className={`font-bold text-base ${val > 29 ? 'text-red-600' : 'text-blue-600'}`}>{val}°C</p>
      {val > 29 && <p className="text-red-500 text-xs">Vượt ngưỡng 29°C</p>}
    </div>
  )
}

export default function Dashboard() {
  const [devices, setDevices] = useState([])
  const [sensors, setSensors] = useState([])
  const [notifs, setNotifs] = useState([])
  const [history, setHistory] = useState([])
  const [unread, setUnread] = useState(0)
  const [rules, setRules] = useState([])
  const [showSimConfig, setShowSimConfig] = useState(false)
  const [simConfig, setSimConfig] = useState({ active: true, base_temp: 26.0, amplitude: 1.5 })
  const [savingSim, setSavingSim] = useState(false)
  const [loading, setLoading] = useState(true)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [dataSource, setDataSource] = useState('mock')

  const fetchAll = useCallback(async () => {
    try {
      const [d, s, n, u, r, sim] = await Promise.allSettled([
        getDevices(), getLatestSensors(''), getNotifications(), getUnreadCount(), getRules(), getSimulationConfig()
      ])
      if (d.status === 'fulfilled') setDevices(d.value.data)
      if (n.status === 'fulfilled') setNotifs(n.value.data.slice(0, 6))
      if (u.status === 'fulfilled') setUnread(u.value.data.count)
      if (r.status === 'fulfilled') setRules(r.value.data || [])
      if (sim.status === 'fulfilled' && sim.value.data?.room301) {
        setSimConfig(sim.value.data.room301)
      }
      if (s.status === 'fulfilled' && s.value.data.length > 0) {
        setSensors(s.value.data)
      }

      // Lấy lịch sử nhiệt độ thật từ InfluxDB
      try {
        const hist = await getSensorHistory('room301', '1')
        if (hist.data?.length > 0) {
          setHistory(hist.data
            .filter(h => typeof h.value === 'number')
            .map(h => ({
              time: new Date(h.time).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
              temperature: +parseFloat(h.value).toFixed(1),
            }))
          )
          setDataSource('real')
        } else {
          // Mock nếu chưa có dữ liệu thật
          const now = Date.now()
          setHistory(Array.from({ length: 20 }, (_, i) => ({
            time: new Date(now - (19 - i) * 60000).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }),
            temperature: +(26 + Math.sin(i * 0.4) * 2.5 + (Math.random() - 0.5)).toFixed(1),
          })))
          setDataSource('mock')
        }
      } catch { /* keep mock */ }

      setLastUpdate(new Date())
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }, [])

  useEffect(() => {
    fetchAll()
    const t = setInterval(fetchAll, 8000)
    return () => clearInterval(t)
  }, [fetchAll])

  const handleSaveSimConfig = async () => {
    setSavingSim(true)
    try {
      await updateSimulationConfig({
        room301: {
          active: simConfig.active,
          base_temp: parseFloat(simConfig.base_temp),
          amplitude: parseFloat(simConfig.amplitude)
        }
      })
      alert('✅ Cập nhật cấu hình mô phỏng thành công!')
      setShowSimConfig(false)
      fetchAll()
    } catch (e) {
      alert('❌ Lỗi cập nhật cấu hình mô phỏng: ' + (e.response?.data?.error || e.message))
    } finally {
      setSavingSim(false)
    }
  }

  // Lấy đúng giá trị số nhiệt độ — bỏ qua record có value là string "celsius"
  const tempSensor = sensors.find(s => s.sensor_type === 'temperature' && typeof s.value === 'number')
  const tempVal = tempSensor ? parseFloat(tempSensor.value).toFixed(1) : null
  const isHot = tempVal !== null && parseFloat(tempVal) > 29
  const online = devices.filter(d => d.status).length
  const maxTemp = history.length ? Math.max(...history.map(h => h.temperature)) : 0
  const activeRules = rules.filter(r => r.is_active)

  const DEVICE_ICONS = { light: '💡', ac: '❄️', camera: '📷', door: '🚪', sensor: '📡' }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-0.5">
            Tổng quan hệ thống Smart Office — cập nhật mỗi 10 giây
            {lastUpdate && <span className="ml-2 text-gray-400">· {lastUpdate.toLocaleTimeString('vi-VN')}</span>}
          </p>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${dataSource === 'real' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
          {dataSource === 'real' ? '● Dữ liệu thật (InfluxDB)' : '○ Dữ liệu mô phỏng'}
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Cpu} label="Tổng thiết bị" value={`${online}/${devices.length}`} sub="đang hoạt động" color="bg-blue-600" />
        
        {/* Card Nhiệt độ phòng 301 tích hợp cài đặt mô phỏng */}
        <div className={`bg-white rounded-xl p-5 shadow-sm border transition-all duration-300 relative ${isHot ? 'border-red-200 ring-2 ring-red-100' : 'border-gray-100'}`}>
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-gray-500">Nhiệt độ phòng 301</span>
            <div className="flex items-center gap-1.5">
              <button 
                onClick={() => setShowSimConfig(!showSimConfig)}
                className={`p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors ${showSimConfig ? 'bg-gray-100 text-gray-600' : ''}`}
                title="Cấu hình mô phỏng"
              >
                <Settings className="w-4 h-4" />
              </button>
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${isHot ? 'bg-red-500' : 'bg-green-600'}`}>
                <Thermometer className="w-5 h-5 text-white" />
              </div>
            </div>
          </div>
          
          {!showSimConfig ? (
            <>
              <p className={`text-3xl font-bold ${isHot ? 'text-red-600' : 'text-gray-900'}`}>{tempVal ? `${tempVal}°C` : '—'}</p>
              <p className="text-xs text-gray-400 mt-1">Ngưỡng: 29°C · Max: {maxTemp}°C</p>
              {isHot && <p className="text-xs text-red-500 mt-1 font-medium">⚠ Vượt ngưỡng cảnh báo!</p>}
              {!simConfig.active && <p className="text-xs text-amber-500 mt-1">⏸ Đã tắt mô phỏng</p>}
            </>
          ) : (
            <div className="space-y-2 mt-2 pt-2 border-t border-gray-100 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 font-medium">Chạy mô phỏng</span>
                <input 
                  type="checkbox" 
                  checked={simConfig.active}
                  onChange={e => setSimConfig(prev => ({ ...prev, active: e.target.checked }))}
                  className="rounded text-blue-600 focus:ring-blue-500 h-4 w-4" 
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-gray-500 mb-0.5">Nhiệt độ nền (°C)</label>
                  <input 
                    type="number" 
                    step="0.5"
                    value={simConfig.base_temp}
                    onChange={e => setSimConfig(prev => ({ ...prev, base_temp: e.target.value }))}
                    className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-gray-500 mb-0.5">Biên độ (±°C)</label>
                  <input 
                    type="number" 
                    step="0.1"
                    value={simConfig.amplitude}
                    onChange={e => setSimConfig(prev => ({ ...prev, amplitude: e.target.value }))}
                    className="w-full border border-gray-200 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500 focus:outline-none" 
                  />
                </div>
              </div>
              <div className="flex gap-1.5 mt-2">
                <button 
                  onClick={() => setShowSimConfig(false)}
                  className="flex-1 py-1 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 text-center font-medium"
                >
                  Hủy
                </button>
                <button 
                  onClick={handleSaveSimConfig}
                  disabled={savingSim}
                  className="flex-1 py-1 rounded bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60 text-center font-medium"
                >
                  {savingSim ? 'Lưu...' : 'Lưu'}
                </button>
              </div>
            </div>
          )}
        </div>

        <StatCard icon={Bell} label="Thông báo chưa đọc" value={unread} sub="Trong 24 giờ qua" color="bg-amber-500" />
        <StatCard
          icon={Zap}
          label="Kịch bản active"
          value={activeRules.length}
          sub={
            activeRules.length === 1
              ? activeRules[0].name
              : activeRules.length > 1
                ? `${activeRules.length} kịch bản đang bật`
                : 'Không có kịch bản'
          }
          color="bg-purple-600"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Temperature chart */}
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              <h2 className="font-semibold text-gray-900">Nhiệt độ phòng 301 — 1 giờ gần nhất</h2>
            </div>
            {isHot && (
              <span className="flex items-center gap-1 text-xs text-red-600 bg-red-50 px-2 py-1 rounded-full border border-red-200">
                <AlertTriangle className="w-3 h-3" /> Vượt ngưỡng
              </span>
            )}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={history} margin={{ top: 5, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="time" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
              <YAxis domain={[20, 35]} tick={{ fontSize: 10 }} unit="°C" />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={29} stroke="#EF4444" strokeDasharray="5 5" strokeWidth={1.5}
                label={{ value: '29°C', fill: '#EF4444', fontSize: 10, position: 'insideTopRight' }} />
              <Line type="monotone" dataKey="temperature" stroke="#2563EB" strokeWidth={2.5} dot={false} activeDot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
          <p className="text-xs text-gray-400 mt-2">
            {dataSource === 'real' ? '📡 Dữ liệu thật từ InfluxDB' : '⚠ Dữ liệu mô phỏng — publish MQTT để có dữ liệu thật'}
          </p>
        </div>

        {/* Device status */}
        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-900">Trạng thái thiết bị</h2>
          </div>
          <div className="mb-3">
            <div className="flex justify-between text-xs text-gray-500 mb-1">
              <span>{online} bật</span>
              <span>{devices.length - online} tắt</span>
            </div>
            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-500"
                style={{ width: devices.length ? `${(online / devices.length) * 100}%` : '0%' }} />
            </div>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {loading ? <p className="text-sm text-gray-400">Đang tải...</p>
              : devices.map(d => (
                <div key={d.id} className="flex items-center justify-between py-1">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{DEVICE_ICONS[d.type] || '🔧'}</span>
                    <div>
                      <p className="text-xs font-medium text-gray-800 leading-tight">{d.name}</p>
                      <p className="text-xs text-gray-400">{d.room}</p>
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${d.status ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {d.status ? 'BẬT' : 'TẮT'}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* Recent alerts */}
      <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-gray-900">Thông báo gần đây</h2>
          {unread > 0 && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium">{unread} chưa đọc</span>}
        </div>
        {notifs.length === 0 ? (
          <p className="text-sm text-gray-400">Chưa có thông báo</p>
        ) : (
          <div className="space-y-2">
            {notifs.map(n => (
              <div key={n.id} className={`flex items-start gap-3 p-3 rounded-lg ${!n.read_at ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50'}`}>
                <Bell className={`w-4 h-4 mt-0.5 flex-shrink-0 ${!n.read_at ? 'text-blue-600' : 'text-gray-400'}`} />
                <div className="flex-1">
                  <p className="text-sm text-gray-800">{n.message}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{new Date(n.createdAt).toLocaleString('vi-VN')}</p>
                </div>
                {!n.read_at && <span className="w-2 h-2 bg-blue-600 rounded-full mt-1.5 flex-shrink-0" />}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}