import { useState, useEffect } from 'react'
import { Bell, CheckCheck, Loader2, AlertTriangle, Zap, Info } from 'lucide-react'
import { getNotifications, markRead, markAllRead } from '../services/api'

const TYPE_CONFIG = {
  sensor_alert:    { icon: AlertTriangle, color: 'text-red-500',    bg: 'bg-red-50',    label: 'Cảnh báo cảm biến' },
  automation:      { icon: Zap,           color: 'text-purple-500', bg: 'bg-purple-50', label: 'Kịch bản tự động' },
  automation_alert:{ icon: Zap,           color: 'text-amber-500',  bg: 'bg-amber-50',  label: 'Cảnh báo kịch bản' },
  default:         { icon: Info,          color: 'text-blue-500',   bg: 'bg-blue-50',   label: 'Thông báo' },
}

export default function Notifications() {
  const [notifs,  setNotifs]  = useState([])
  const [loading, setLoading] = useState(true)
  const [filter,  setFilter]  = useState('all')

  const fetch = async () => {
    setLoading(true)
    try { const r = await getNotifications(); setNotifs(r.data) }
    catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetch(); const t = setInterval(fetch, 8000); return () => clearInterval(t) }, [])

  async function handleRead(id) {
    await markRead(id).catch(() => {})
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, read_at: new Date() } : n))
  }

  async function handleReadAll() {
    await markAllRead().catch(() => {})
    setNotifs(prev => prev.map(n => ({ ...n, read_at: n.read_at || new Date() })))
  }

  const unread   = notifs.filter(n => !n.read_at).length
  const filtered = filter === 'unread' ? notifs.filter(n => !n.read_at) : notifs

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thông báo</h1>
          <p className="text-gray-500 text-sm mt-1">{unread} chưa đọc · cập nhật mỗi 8 giây</p>
        </div>
        {unread > 0 && (
          <button onClick={handleReadAll} className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-700 font-medium">
            <CheckCheck className="w-4 h-4" /> Đánh dấu đã đọc tất cả
          </button>
        )}
      </div>

      <div className="flex gap-2 mb-4">
        {['all','unread'].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors
              ${filter === f ? 'bg-blue-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {f === 'all' ? `Tất cả (${notifs.length})` : `Chưa đọc (${unread})`}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <Bell className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">Không có thông báo</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map(n => {
            const cfg = TYPE_CONFIG[n.type] || TYPE_CONFIG.default
            const Icon = cfg.icon
            return (
              <div key={n.id}
                onClick={() => !n.read_at && handleRead(n.id)}
                className={`flex items-start gap-4 p-4 rounded-xl border cursor-pointer transition-all
                  ${n.read_at ? 'bg-white border-gray-100' : `${cfg.bg} border-transparent shadow-sm hover:shadow`}`}>
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${n.read_at ? 'bg-gray-100' : cfg.bg}`}>
                  <Icon className={`w-5 h-5 ${n.read_at ? 'text-gray-400' : cfg.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-xs font-medium text-gray-500">{cfg.label}</span>
                    {!n.read_at && <span className="w-2 h-2 bg-blue-600 rounded-full flex-shrink-0" />}
                  </div>
                  <p className={`text-sm ${n.read_at ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>{n.message}</p>
                  <p className="text-xs text-gray-400 mt-1">{new Date(n.createdAt).toLocaleString('vi-VN')}</p>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
