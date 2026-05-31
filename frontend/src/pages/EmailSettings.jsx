import { useState, useEffect } from 'react'
import { Mail, Check, AlertCircle, Loader2, Settings, ShieldAlert, Send, Users, Home, Search } from 'lucide-react'
import { getEmailSetting, updateEmailSetting, getRoomEmailSettings, updateRoomEmailSettings, getFloorPlanConfig, getUsers } from '../services/api'

export default function EmailSettings() {
  const [notifyEmail, setNotifyEmail] = useState('')
  const [roomSettings, setRoomSettings] = useState({}) // { room_id: [emails] }
  const [rooms, setRooms] = useState([])
  const [users, setUsers] = useState([])
  const [selectedRoom, setSelectedRoom] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState({ type: '', msg: '' })

  const fetchData = async () => {
    setLoading(true)
    setStatus({ type: '', msg: '' })
    try {
      const [emailRes, roomRes, floorRes, usersRes] = await Promise.all([
        getEmailSetting(),
        getRoomEmailSettings().catch(() => ({ data: {} })),
        getFloorPlanConfig().catch(() => ({ data: { rooms: [] } })),
        getUsers().catch(() => ({ data: [] }))
      ])

      setNotifyEmail(emailRes.data.notifyEmail || '')
      setRoomSettings(roomRes.data || {})
      setUsers(usersRes.data || [])

      // Process rooms from floor config, default to fallback list if none configured
      const configuredRooms = floorRes.data?.rooms || []
      const fallbackList = [
        { id: 'room301', name: 'Phòng 301' },
        { id: 'room302', name: 'Phòng 302' },
        { id: 'common', name: 'Khu vực chung' },
        { id: 'lobby', name: 'Sảnh tầng' }
      ]
      
      const mergedRooms = configuredRooms.length > 0 ? configuredRooms : fallbackList
      setRooms(mergedRooms)
      if (mergedRooms.length > 0) {
        setSelectedRoom(mergedRooms[0].id)
      }
    } catch (e) {
      console.error(e)
      setStatus({ type: 'error', msg: 'Không thể tải cấu hình từ máy chủ.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  // Handle global email save
  const handleSaveGlobal = async (e) => {
    e.preventDefault()
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(notifyEmail)) {
      setStatus({ type: 'error', msg: 'Địa chỉ email toàn cục không hợp lệ.' })
      return
    }

    setSaving(true)
    setStatus({ type: '', msg: '' })
    try {
      await updateEmailSetting({ notifyEmail })
      setStatus({ type: 'success', msg: 'Cập nhật email nhận thông báo toàn cục thành công!' })
    } catch (e) {
      console.error(e)
      setStatus({ type: 'error', msg: 'Lỗi khi lưu cấu hình email toàn cục.' })
    } finally {
      setSaving(false)
    }
  }

  // Handle checking/unchecking a user email for a room
  const handleToggleUserEmail = (email) => {
    setRoomSettings(prev => {
      const currentEmails = prev[selectedRoom] || []
      const updatedEmails = currentEmails.includes(email)
        ? currentEmails.filter(e => e !== email)
        : [...currentEmails, email]
      return {
        ...prev,
        [selectedRoom]: updatedEmails
      }
    })
  }

  // Save room-specific email settings
  const handleSaveRoomSettings = async () => {
    setSaving(true)
    setStatus({ type: '', msg: '' })
    try {
      await updateRoomEmailSettings(roomSettings)
      setStatus({ type: 'success', msg: `Lưu cấu hình email cho các phòng thành công!` })
    } catch (e) {
      console.error(e)
      setStatus({ type: 'error', msg: 'Lỗi khi lưu cấu hình phòng.' })
    } finally {
      setSaving(false)
    }
  }

  const isUserInRoom = (userRoom, selectedRoomId) => {
    if (!userRoom || !selectedRoomId) return false;
    if (userRoom === selectedRoomId) return true;
    
    const selRoom = rooms.find(r => r.id === selectedRoomId);
    if (!selRoom) return false;
    
    // Fallback room301 representing floor 3
    if (userRoom === 'room301' && selRoom.floor === 3) return true;
    
    // Match by digits (e.g. room 101 or Room 101)
    const userDigits = userRoom.match(/\d+/);
    const selDigits = selRoom.name.match(/\d+/);
    if (userDigits && selDigits && userDigits[0] === selDigits[0]) {
      return true;
    }
    
    return false;
  };

  const selectedRoomEmails = roomSettings[selectedRoom] || []

  const filteredUsers = users.filter(u => 
    isUserInRoom(u.assigned_room, selectedRoom) &&
    (u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
     u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  return (
    <div className="p-6 max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-7 h-7 text-blue-600" />
          Cấu hình Email theo Phòng ban
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Quản lý tài khoản nhận thông báo/cảnh báo phân quyền chi tiết cho từng phòng làm việc riêng biệt.
        </p>
      </div>

      {status.msg && (
        <div className={`p-4 rounded-xl flex items-start gap-3 text-sm transition-all
          ${status.type === 'success' 
            ? 'bg-green-50 border border-green-100 text-green-700' 
            : 'bg-red-50 border border-red-100 text-red-700'
          }`}
        >
          {status.type === 'success' ? (
            <Check className="w-5 h-5 flex-shrink-0 text-green-500" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 text-red-500" />
          )}
          <span>{status.msg}</span>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Left panel: Room Settings & User selection */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 pb-4">
                <div className="flex items-center gap-2">
                  <Home className="w-5 h-5 text-blue-600" />
                  <h2 className="text-lg font-semibold text-gray-900">
                    Phân quyền Email theo Phòng
                  </h2>
                </div>
                
                {/* Room Selector */}
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 font-semibold uppercase">Chọn phòng:</span>
                  <select
                    value={selectedRoom}
                    onChange={(e) => setSelectedRoom(e.target.value)}
                    className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 font-medium text-gray-800"
                  >
                    {rooms.map(r => (
                      <option key={r.id} value={r.id}>{r.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Users search and checkbox list */}
              <div className="space-y-3">
                <div className="relative">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Tìm kiếm tài khoản nhân viên..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 pl-10 text-sm focus:outline-none focus:bg-white focus:ring-2 focus:ring-blue-500 transition-all"
                  />
                </div>

                <div className="border border-gray-100 rounded-xl overflow-hidden divide-y divide-gray-50 max-h-[350px] overflow-y-auto">
                  {filteredUsers.map((user) => {
                    const isSelected = selectedRoomEmails.includes(user.email)
                    return (
                      <div 
                        key={user.id} 
                        onClick={() => handleToggleUserEmail(user.email)}
                        className={`flex items-center justify-between p-3.5 hover:bg-gray-50 cursor-pointer transition-colors ${
                          isSelected ? 'bg-blue-50/30' : ''
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center font-bold text-gray-600 text-sm">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm">{user.name}</p>
                            <p className="text-xs text-gray-400">{user.email}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-3">
                          <span className="text-[10px] bg-blue-50 text-blue-600 border border-blue-100 px-2 py-0.5 rounded-full font-semibold">
                            {rooms.find(r => r.id === user.assigned_room)?.name || 'Chưa phân phòng'}
                          </span>
                          <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                            user.Role?.name === 'admin' ? 'bg-red-50 text-red-600 border border-red-100' :
                            user.Role?.name === 'manager' ? 'bg-purple-50 text-purple-600 border border-purple-100' :
                            'bg-gray-50 text-gray-600 border border-gray-100'
                          }`}>
                            {user.Role?.name || 'Nhân viên'}
                          </span>
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}} // Controlled by row onClick
                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 cursor-pointer"
                          />
                        </div>
                      </div>
                    )
                  })}

                  {filteredUsers.length === 0 && (
                    <div className="text-center py-12 px-4 space-y-3">
                      <p className="text-gray-400 text-sm">
                        Chưa có nhân sự nào được phân vào phòng này.
                      </p>
                      <a 
                        href="/accounts" 
                        className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold border-b border-blue-600 pb-0.5"
                      >
                        <Users className="w-3.5 h-3.5" /> Đi đến Quản lý Tài khoản
                      </a>
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-2 flex justify-between items-center">
                <span className="text-xs text-gray-500 font-semibold">
                  Đã chọn {filteredUsers.filter(u => selectedRoomEmails.includes(u.email)).length} nhân sự nhận cảnh báo
                </span>
                <button
                  type="button"
                  onClick={handleSaveRoomSettings}
                  disabled={saving}
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 disabled:bg-blue-400"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Lưu cấu hình Phòng
                </button>
              </div>
            </div>
          </div>

          {/* Right panel: Global settings fallback & SMTP Status */}
          <div className="space-y-6">
            
            {/* Global Settings Fallback Form */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2 border-b border-gray-50 pb-3">
                <Mail className="w-5 h-5 text-gray-400" />
                Email mặc định (Fallback)
              </h2>
              
              <form onSubmit={handleSaveGlobal} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                    Email Nhận Cảnh Báo
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      value={notifyEmail}
                      onChange={(e) => setNotifyEmail(e.target.value)}
                      placeholder="example@domain.com"
                      className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 pl-11 text-gray-800 placeholder-gray-400 focus:outline-none focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-sm"
                      required
                    />
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  </div>
                  <p className="text-xs text-gray-400 mt-1.5 leading-normal">
                    Nếu phòng phát sinh sự kiện chưa được cấu hình người nhận riêng, cảnh báo sẽ tự động gửi tới email này.
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={saving}
                  className="w-full px-5 py-2.5 bg-gray-800 hover:bg-gray-900 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 disabled:bg-gray-400"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Lưu email mặc định'
                  )}
                </button>
              </form>
            </div>

            {/* Cơ chế kích hoạt */}
            <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-2xl shadow-md p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl" />
              
              <h3 className="font-semibold text-sm uppercase tracking-wider text-blue-200 mb-4 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                Cơ chế Định tuyến Email
              </h3>
              
              <ul className="space-y-3 text-xs text-blue-100/90 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 font-bold">•</span>
                  <span><b>Định tuyến theo phòng:</b> Cảnh báo sẽ được chuyển tiếp trực tiếp đến toàn bộ tài khoản nhân viên được tích chọn trong danh sách của phòng đó.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 font-bold">•</span>
                  <span><b>Tài khoản SMTP:</b> Sử dụng giao thức SMTP mã hóa bảo mật SSL kết nối máy chủ để phân phối thư điện tử.</span>
                </li>
              </ul>
            </div>
            
            {/* SMTP status card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
              <h3 className="font-semibold text-gray-900 text-sm mb-3">Tài khoản gửi (SMTP)</h3>
              <div className="space-y-3">
                <div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase">Phương thức</div>
                  <div className="text-xs font-semibold text-gray-700">Gmail OAuth2 / SMTP App Password</div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase">Tài khoản SMTP</div>
                  <div className="text-xs font-mono font-semibold text-gray-600 truncate">
                    khiemhg0709@gmail.com
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-gray-400 font-bold uppercase">Trạng thái gửi</div>
                  <div className="flex items-center gap-1.5 mt-0.5 text-xs text-green-600 font-medium">
                    <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    Sẵn sàng (Gmail SMTP)
                  </div>
                </div>
              </div>
            </div>

          </div>

        </div>
      )}
    </div>
  )
}
