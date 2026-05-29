import { useState, useEffect } from 'react'
import { Plus, Edit2, Trash2, Mail, Shield, Building2, DoorOpen, Save, X } from 'lucide-react'
import { getUsers, createUser, updateUser, deleteUser, getFloorPlanConfig } from '../services/api'

export default function Accounts() {
  const [users, setUsers] = useState([])
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [form, setForm] = useState({ id: null, name: '', email: '', password: '', role_name: 'staff', assigned_floor: '', assigned_room: '' })

  const ROLES = [
    { value: 'admin', label: 'Admin (Toàn quyền)' },
    { value: 'director', label: 'Giám đốc' },
    { value: 'manager', label: 'Trưởng phòng' },
    { value: 'staff', label: 'Nhân viên' },
    { value: 'guest', label: 'Khách' }
  ]

  const FLOORS = [1, 2, 3, 4, 5]

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [uRes, pRes] = await Promise.all([
        getUsers(),
        getFloorPlanConfig().catch(() => ({ data: {} }))
      ])
      setUsers(uRes.data || [])
      
      const config = pRes.data || {}
      if (config.rooms) setRooms(config.rooms)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  function openModal(user = null) {
    if (user) {
      setForm({
        id: user.id,
        name: user.name,
        email: user.email,
        password: '',
        role_name: user.Role?.name || 'staff',
        assigned_floor: user.assigned_floor || '',
        assigned_room: user.assigned_room || ''
      })
    } else {
      setForm({ id: null, name: '', email: '', password: '', role_name: 'staff', assigned_floor: '', assigned_room: '' })
    }
    setModal(true)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const data = { ...form }
    if (!data.password && data.id) delete data.password
    if (data.role_name !== 'director') data.assigned_floor = null
    if (data.role_name !== 'manager' && data.role_name !== 'staff') data.assigned_room = null
    
    try {
      if (data.id) {
        await updateUser(data.id, data)
      } else {
        await createUser(data)
      }
      setModal(false)
      fetchData()
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.error || err.message))
    }
  }

  async function handleDelete(id) {
    if (!confirm('Bạn có chắc muốn xóa tài khoản này?')) return
    try {
      await deleteUser(id)
      fetchData()
    } catch (err) {
      alert('Lỗi: ' + (err.response?.data?.error || err.message))
    }
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Quản lý Tài Khoản</h1>
          <p className="text-gray-500 mt-2">Phân quyền và quản lý tài khoản người dùng trong hệ thống</p>
        </div>
        <button onClick={() => openModal()} className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-blue-700 flex items-center gap-2 shadow-lg shadow-blue-200">
          <Plus className="w-5 h-5" /> Thêm tài khoản
        </button>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-gray-50/50 border-b border-gray-100 text-gray-500 text-sm">
              <th className="py-4 px-6 font-semibold">Tên & Email</th>
              <th className="py-4 px-6 font-semibold">Chức vụ</th>
              <th className="py-4 px-6 font-semibold">Khu vực quản lý</th>
              <th className="py-4 px-6 font-semibold text-right">Thao tác</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan="4" className="text-center py-10 text-gray-400">Đang tải dữ liệu...</td></tr>
            ) : users.length === 0 ? (
              <tr><td colSpan="4" className="text-center py-10 text-gray-400">Không có tài khoản nào.</td></tr>
            ) : (
              users.map(u => {
                const roleName = ROLES.find(r => r.value === u.Role?.name)?.label || u.Role?.name
                const isDirector = u.Role?.name === 'director'
                const isManager = u.Role?.name === 'manager' || u.Role?.name === 'staff'
                
                return (
                  <tr key={u.id} className="hover:bg-blue-50/30 transition-colors">
                    <td className="py-4 px-6">
                      <div className="font-semibold text-gray-900">{u.name}</div>
                      <div className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                        <Mail className="w-3.5 h-3.5" /> {u.email}
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold
                        ${u.Role?.name === 'admin' ? 'bg-red-100 text-red-700' : 
                          u.Role?.name === 'director' ? 'bg-purple-100 text-purple-700' :
                          u.Role?.name === 'manager' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
                        <Shield className="w-3.5 h-3.5" /> {roleName}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-sm text-gray-600">
                      {isDirector && u.assigned_floor ? (
                        <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4 text-purple-500"/> Tầng {u.assigned_floor}</span>
                      ) : isManager && u.assigned_room ? (
                        <span className="flex items-center gap-1.5"><DoorOpen className="w-4 h-4 text-blue-500"/> {rooms.find(r => r.id === u.assigned_room)?.name || u.assigned_room}</span>
                      ) : (
                        <span className="text-gray-400 italic">Toàn bộ / Không có</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right space-x-2">
                      <button onClick={() => openModal(u)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleDelete(u.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="flex justify-between items-center p-6 border-b border-gray-100">
              <h3 className="text-xl font-bold text-gray-900">{form.id ? 'Sửa Tài Khoản' : 'Thêm Tài Khoản'}</h3>
              <button onClick={() => setModal(false)} className="text-gray-400 hover:text-gray-600"><X className="w-5 h-5"/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Họ và Tên</label>
                <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="Nguyễn Văn A" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Email</label>
                <input required type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="email@smartoffice.vn" />
              </div>
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Mật khẩu {form.id && <span className="text-gray-400 font-normal">(Bỏ trống nếu không đổi)</span>}</label>
                <input required={!form.id} type="password" value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 focus:border-blue-500" placeholder="••••••••" />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1">Chức vụ</label>
                <select value={form.role_name} onChange={e => setForm({...form, role_name: e.target.value})} className="w-full border border-gray-200 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500 bg-white">
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>

              {form.role_name === 'director' && (
                <div className="animate-in slide-in-from-top-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Tầng quản lý</label>
                  <select required value={form.assigned_floor} onChange={e => setForm({...form, assigned_floor: e.target.value})} className="w-full border border-purple-200 bg-purple-50 rounded-xl px-4 py-2 focus:ring-2 focus:ring-purple-500">
                    <option value="">-- Chọn Tầng --</option>
                    {FLOORS.map(f => <option key={f} value={f}>Tầng {f}</option>)}
                  </select>
                </div>
              )}

              {(form.role_name === 'manager' || form.role_name === 'staff') && (
                <div className="animate-in slide-in-from-top-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1">Phòng ban quản lý</label>
                  <select required value={form.assigned_room} onChange={e => setForm({...form, assigned_room: e.target.value})} className="w-full border border-blue-200 bg-blue-50 rounded-xl px-4 py-2 focus:ring-2 focus:ring-blue-500">
                    <option value="">-- Chọn Phòng Ban --</option>
                    {rooms.map(r => <option key={r.id} value={r.id}>{r.name} (Tầng {r.floor})</option>)}
                  </select>
                </div>
              )}

              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setModal(false)} className="flex-1 py-2.5 rounded-xl border border-gray-200 text-gray-700 font-semibold hover:bg-gray-50">Hủy</button>
                <button type="submit" className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" /> Lưu
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
