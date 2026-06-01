import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Cpu, Zap, Bell, LogOut, Building2, Box, Mail, FileText, Users, Terminal } from 'lucide-react'
import { logout } from '../services/api'
import { useState, useEffect } from 'react'
import { getUnreadCount } from '../services/api'

const NAV = [
  { to: '/',              icon: LayoutDashboard, label: 'Dashboard',     roles: ['admin', 'manager', 'director', 'staff', 'guest'] },
  { to: '/devices',       icon: Cpu,             label: 'Thiết bị',      roles: ['admin', 'manager', 'director', 'staff', 'guest'] },
  { to: '/automation',    icon: Zap,             label: 'Tự động hóa',   roles: ['admin', 'manager', 'director', 'staff'] },
  { to: '/simulation',    icon: Box,             label: 'Mô phỏng 3D',   roles: ['admin', 'manager', 'director', 'staff', 'guest'] },
  { to: '/notifications', icon: Bell,            label: 'Thông báo',     roles: ['admin', 'manager', 'director', 'staff', 'guest'] },
  { to: '/accounts',      icon: Users,           label: 'Tài khoản',     roles: ['admin'] },
  { to: '/email-settings',icon: Mail,            label: 'Cấu hình Email',roles: ['admin'] },
  { to: '/logs',          icon: Terminal,        label: 'Nhật ký hệ thống',roles: ['admin', 'manager', 'director'] },
  { to: '/report',        icon: FileText,        label: 'Báo cáo',       roles: ['admin', 'manager', 'director'] },
]

export default function Layout() {
  const navigate   = useNavigate()
  const [count, setCount] = useState(0)
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  useEffect(() => {
    const fetchCount = () => {
      if (!localStorage.getItem('accessToken')) return
      getUnreadCount().then(r => setCount(r.data.count)).catch(() => {})
    }
    fetchCount()
    
    window.addEventListener('notificationsRead', fetchCount)
    const t = setInterval(fetchCount, 10000)
    return () => {
      clearInterval(t)
      window.removeEventListener('notificationsRead', fetchCount)
    }
  }, [])

  async function handleLogout() {
    await logout().catch(() => {})
    localStorage.clear()
    window.location.href = '/login'
  }

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1E3A5F] text-white flex flex-col shadow-xl">
        <div className="flex items-center gap-3 px-6 py-5 border-b border-blue-700">
          <Building2 className="w-8 h-8 text-blue-300" />
          <div>
            <p className="font-bold text-lg leading-tight">Smart Office</p>
            <p className="text-xs text-blue-300">IT03A — Đề 2511</p>
          </div>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-3">
          {NAV.filter(item => item.roles.includes(user.role)).map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all
                 ${isActive ? 'bg-blue-600 text-white' : 'text-blue-200 hover:bg-blue-800 hover:text-white'}`
              }
            >
              <Icon className="w-5 h-5 flex-shrink-0" />
              <span>{label}</span>
              {label === 'Thông báo' && count > 0 &&
                <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">{count}</span>
              }
            </NavLink>
          ))}
        </nav>

        <div className="px-4 py-4 border-t border-blue-700">
          <p className="text-xs text-blue-300 mb-1">{user.name || 'Admin'} ({user.role?.toUpperCase()})</p>
          <p className="text-xs text-blue-400 mb-3">{user.email}</p>
          <button onClick={handleLogout}
            className="flex items-center gap-2 text-blue-200 hover:text-white text-sm transition-colors"
          >
            <LogOut className="w-4 h-4" /> Đăng xuất
          </button>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
