import { useState } from 'react'
import { Plus, Pencil, Trash2, Power, RefreshCw, Loader2, Settings } from 'lucide-react'
import { createDevice, updateDevice, deleteDevice } from '../services/api'
import { useDeviceStore } from '../store/deviceStore.jsx'

const TYPES  = ['light','ac','camera','door','sensor','projector','printer','tv','router']
const ICONS  = { light:'💡', ac:'❄️', camera:'📹', door:'🚪', sensor:'🌡️', projector:'📽️', printer:'🖨️', tv:'📺', router:'📡' }
const FLOORS = [1,2,3,4,5]

const INIT = { name:'', type:'light', room:'none', floor:1, ip_address:'', mqtt_topic:'' }

export default function Devices() {
  const { devices, loading, toggling, toggleDevice, refreshDevices } = useDeviceStore()
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const canControl = ['admin', 'manager', 'staff'].includes(user.role)
  const canEdit    = ['admin', 'manager'].includes(user.role)
  const canDelete  = user.role === 'admin'

  const [modal,     setModal]     = useState(false)
  const [form,      setForm]      = useState(INIT)
  const [editing,   setEditing]   = useState(null)
  const [saving,    setSaving]    = useState(false)
  const [search,    setSearch]    = useState('')
  const [activeTab, setActiveTab] = useState('quick') // 'quick' | 'custom'
  const [aiModal, setAiModal] = useState(false)
  const [aiDevice, setAiDevice] = useState(null)
  const [aiForm, setAiForm] = useState({
    person_detected: ['door', 'light', 'ac'],
    no_person: ['door', 'light', 'ac'],
    cooldown_seconds: 120
  })

  function openAiConfig(d) {
    setAiDevice(d)
    const existing = d.settings?.ai_triggers || {
      person_detected: ['door', 'light', 'ac'],
      no_person: ['door', 'light', 'ac'],
      cooldown_seconds: 120
    }
    setAiForm(existing)
    setAiModal(true)
  }

  const toggleTriggerType = (field, type) => {
    setAiForm(prev => {
      const list = prev[field] || []
      const newList = list.includes(type)
        ? list.filter(t => t !== type)
        : [...list, type]
      return { ...prev, [field]: newList }
    })
  }

  async function handleSaveAiConfig() {
    setSaving(true)
    try {
      const updatedDevice = {
        ...aiDevice,
        settings: {
          ...aiDevice.settings,
          ai_triggers: {
            person_detected: aiForm.person_detected || [],
            no_person: aiForm.no_person || [],
            cooldown_seconds: Number(aiForm.cooldown_seconds || 120)
          }
        }
      }
      await updateDevice(aiDevice.id, updatedDevice)
      setAiModal(false)
      await refreshDevices()
      alert('✅ Cấu hình AI thành công!')
    } catch (e) {
      alert(e.response?.data?.error || 'Lỗi lưu cấu hình AI')
    } finally {
      setSaving(false)
    }
  }

  function openCreate() { 
    setForm(INIT)
    setEditing(null)
    setActiveTab('quick')
    setModal(true) 
  }
  
  function openEdit(d)  {
    setForm({ name:d.name, type:d.type, room:d.room||'', floor:d.floor||1, ip_address:d.ip_address||'', mqtt_topic:d.mqtt_topic||'' })
    setEditing(d.id)
    setActiveTab('custom')
    setModal(true)
  }

  async function handleSave() {
    setSaving(true)
    try {
      let finalForm = { ...form }
      
      // Nếu là thêm mới và ở chế độ Thêm Nhanh -> Tự động sinh thông số kỹ thuật
      if (!editing && activeTab === 'quick') {
        const cleanRoom = form.room.trim().toLowerCase()
          .normalize("NFD").replace(/[\u0300-\u036f]/g, "") // Khử dấu tiếng Việt
          .replace(/[đĐ]/g, 'd')
          .replace(/[^a-z0-9]/g, '') || 'room'
        
        finalForm.mqtt_topic = `office/${form.floor}/${cleanRoom}/${form.type}/cmd`
        
        if (form.type === 'camera') {
          const rand = Math.floor(Math.random() * 254) + 1
          finalForm.ip_address = `192.168.${form.floor}.${rand}/video`
        } else if (form.type === 'sensor') {
          // Cảm biến thì topic dữ liệu mặc định (không có /cmd)
          finalForm.mqtt_topic = `office/${form.floor}/${cleanRoom}/temperature`
          finalForm.status = true
        }
      }

      if (editing) await updateDevice(editing, finalForm)
      else         await createDevice(finalForm)
      setModal(false)
      await refreshDevices()
    } catch (e) { alert(e.response?.data?.error || 'Lỗi lưu') }
    finally { setSaving(false) }
  }

  async function handleDelete(id) {
    if (!confirm('Xác nhận xóa thiết bị?')) return
    try { await deleteDevice(id); await refreshDevices() }
    catch (e) { alert(e.response?.data?.error || 'Lỗi xóa') }
  }

  const filtered = devices.filter(d =>
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    (d.room||'').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý thiết bị</h1>
          <p className="text-gray-500 text-sm mt-1">{devices.length} thiết bị — {devices.filter(d=>d.status).length} đang bật</p>
        </div>
        <div className="flex gap-3">
          <button onClick={refreshDevices} className="p-2 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
            <RefreshCw className="w-4 h-4 text-gray-500" />
          </button>
          {canEdit && (
            <button onClick={openCreate} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors">
              <Plus className="w-4 h-4" /> Thêm thiết bị
            </button>
          )}
        </div>
      </div>

      <input value={search} onChange={e => setSearch(e.target.value)}
        placeholder="Tìm kiếm thiết bị hoặc phòng..."
        className="w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map(d => {
            const isStaff = user.role === 'staff';
            const staffCanControl = !isStaff || (isStaff && user.assigned_room && user.assigned_room.toLowerCase() === (d.room || '').toLowerCase());
            const deviceCanControl = canControl && staffCanControl;

            return (
            <div key={d.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <span className="text-3xl">{ICONS[d.type] || '🔧'}</span>
                  <div>
                    <p className="font-semibold text-gray-900 leading-tight">{d.name}</p>
                    <p className="text-xs text-gray-500">{!d.room || d.room === 'none' ? 'Chưa phân phòng' : d.room} · Tầng {d.floor}</p>
                  </div>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${d.status ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                  {d.type === 'door' ? (d.status ? 'MỞ' : 'ĐÓNG') : (d.status ? 'BẬT' : 'TẮT')}
                </span>
              </div>

              {d.ip_address && <p className="text-xs text-gray-400 mb-3">IP: {d.ip_address}</p>}

              {(d.type === 'camera' && canEdit) || (d.type !== 'camera' && d.type !== 'sensor' && deviceCanControl) || canEdit || canDelete ? (
                <div className="flex gap-2 pt-3 border-t border-gray-100">
                  {d.type === 'camera' ? (
                    canEdit && (
                      <button
                        onClick={() => openAiConfig(d)}
                        className="flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-lg font-medium transition-colors bg-purple-50 text-purple-700 hover:bg-purple-100"
                      >
                        <Settings className="w-3.5 h-3.5" />
                        Cài đặt AI
                      </button>
                    )
                  ) : d.type !== 'sensor' ? (
                    deviceCanControl && (
                      <button
                        onClick={() => toggleDevice(d)}
                        disabled={toggling === d.id}
                        className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-lg font-medium transition-colors disabled:opacity-60
                          ${d.status ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-green-100 text-green-700 hover:bg-green-200'}`}
                      >
                        {toggling === d.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <Power className="w-3.5 h-3.5" />
                        )}
                        {d.type === 'door' ? (d.status ? 'Đóng' : 'Mở') : (d.status ? 'Tắt' : 'Bật')}
                      </button>
                    )
                  ) : null}
                  {canEdit && (
                    <button onClick={() => openEdit(d)}
                      className="flex-1 flex items-center justify-center gap-1.5 text-xs py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium transition-colors">
                      <Pencil className="w-3.5 h-3.5" /> Sửa
                    </button>
                  )}
                  {canDelete && (
                    <button onClick={() => handleDelete(d.id)}
                      className="flex items-center justify-center px-3 py-1.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ) : null}
            </div>
          )})}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 overflow-hidden">
            <h2 className="text-lg font-bold text-gray-900 mb-3">
              {editing ? 'Sửa thiết bị' : 'Thêm thiết bị mới'}
            </h2>
            
            {/* Tabs Selector (Chỉ hiện khi Thêm Mới) */}
            {!editing && (
              <div className="flex bg-gray-100 p-1 rounded-xl mb-4">
                <button
                  type="button"
                  onClick={() => setActiveTab('quick')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors
                    ${activeTab === 'quick' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  ⚡ Thêm nhanh
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('custom')}
                  className={`flex-1 py-1.5 text-xs font-semibold rounded-lg transition-colors
                    ${activeTab === 'custom' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                >
                  🛠️ Tự cấu hình
                </button>
              </div>
            )}

            <div className="space-y-4">
              {/* Form Thêm Nhanh */}
              {activeTab === 'quick' && !editing ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">TÊN THIẾT BỊ</label>
                    <input 
                      type="text" 
                      value={form.name} 
                      onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder="Vd: Đèn trần phòng khách, Cảm biến nhiệt độ"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">PHÒNG</label>
                      <input 
                        type="text" 
                        value="Tự động gán (kéo trên sa bàn 3D)" 
                        disabled
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">TẦNG</label>
                      <select 
                        value={form.floor} 
                        onChange={e => setForm(f => ({ ...f, floor: parseInt(e.target.value) }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        {FLOORS.map(n => <option key={n} value={n}>Tầng {n}</option>)}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1.5">LOẠI THIẾT BỊ Presets</label>
                    <div className="grid grid-cols-5 gap-2">
                      {TYPES.map(t => {
                        const isSelected = form.type === t;
                        return (
                          <button
                            key={t}
                            type="button"
                            onClick={() => setForm(f => ({ ...f, type: t }))}
                            className={`flex flex-col items-center gap-1 p-2 rounded-xl border text-center transition-all
                              ${isSelected 
                                ? 'border-blue-600 bg-blue-50/50 text-blue-600 shadow-sm ring-1 ring-blue-500' 
                                : 'border-gray-200 bg-white text-gray-500 hover:bg-gray-50'
                              }`}
                          >
                            <span className="text-xl leading-none">{ICONS[t]}</span>
                            <span className="text-[9px] font-bold tracking-tight uppercase mt-1">{t}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                </div>
              ) : (
                /* Form Cấu Hình Chi Tiết (Custom / Editing) */
                <div className="space-y-3">
                  {[['Tên thiết bị','name','text'],['IP Address','ip_address','text'],['MQTT Topic','mqtt_topic','text']].map(([label, key, type]) => (
                    <div key={key}>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">{label.toUpperCase()}</label>
                      <input 
                        type={type} 
                        value={form[key]} 
                        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                        placeholder={`Nhập ${label.toLowerCase()}...`}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" 
                      />
                    </div>
                  ))}
                  <div>
                    <label className="block text-xs font-semibold text-gray-500 mb-1">PHÒNG</label>
                    <input 
                      type="text" 
                      value={form.room || 'none'} 
                      disabled
                      title="Phòng được tự động gắn khi bạn di chuyển thiết bị trên Mô phỏng 3D"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm bg-gray-50 text-gray-400 cursor-not-allowed" 
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">LOẠI</label>
                      <select 
                        value={form.type} 
                        onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        {TYPES.map(t => <option key={t} value={t}>{ICONS[t]} {t}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-500 mb-1">TẦNG</label>
                      <select 
                        value={form.floor} 
                        onChange={e => setForm(f => ({ ...f, floor: parseInt(e.target.value) }))}
                        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        {FLOORS.map(n => <option key={n} value={n}>Tầng {n}</option>)}
                      </select>
                    </div>
                  </div>
                </div>
              )}
            </div>
            
            <div className="flex gap-3 mt-5">
              <button 
                onClick={() => setModal(false)} 
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={handleSave} 
                disabled={saving || !form.name || !form.room}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Lưu
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Config Modal */}
      {aiModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 overflow-hidden">
            <h2 className="text-lg font-bold text-gray-900 mb-1">
              Cấu hình Sự kiện AI Camera
            </h2>
            <p className="text-xs text-gray-500 mb-4">
              Thiết lập hành động tự động khi Camera **{aiDevice?.name}** phát hiện/vắng người.
            </p>

            <div className="space-y-4">
              {/* Person Detected Settings */}
              <div className="p-4 bg-purple-50/50 border border-purple-100 rounded-xl space-y-2">
                <span className="text-xs font-bold text-purple-800 block">🟢 KHI PHÁT HIỆN CÓ NGƯỜI (BẬT)</span>
                <div className="flex gap-4">
                  {[['💡 Đèn', 'light'], ['🚪 Cửa', 'door'], ['❄️ Điều hòa', 'ac']].map(([label, type]) => {
                    const active = aiForm.person_detected?.includes(type)
                    return (
                      <label key={type} className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={active}
                          onChange={() => toggleTriggerType('person_detected', type)}
                          className="rounded text-purple-600 focus:ring-purple-500 h-4 w-4"
                        />
                        {label}
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* No Person Settings */}
              <div className="p-4 bg-gray-50 border border-gray-150 rounded-xl space-y-2">
                <span className="text-xs font-bold text-gray-800 block">🔴 KHI KHÔNG CÓ NGƯỜI (TẮT)</span>
                <div className="flex gap-4">
                  {[['💡 Đèn', 'light'], ['🚪 Cửa', 'door'], ['❄️ Điều hòa', 'ac']].map(([label, type]) => {
                    const active = aiForm.no_person?.includes(type)
                    return (
                      <label key={type} className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                        <input 
                          type="checkbox" 
                          checked={active}
                          onChange={() => toggleTriggerType('no_person', type)}
                          className="rounded text-gray-600 focus:ring-gray-500 h-4 w-4"
                        />
                        {label}
                      </label>
                    )
                  })}
                </div>
              </div>

              {/* Cooldown Settings */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">THỜI GIAN CHỜ TẮT (GIÂY)</label>
                <input 
                  type="number"
                  min="5"
                  max="600"
                  value={aiForm.cooldown_seconds}
                  onChange={e => setAiForm(prev => ({ ...prev, cooldown_seconds: e.target.value }))}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[10px] text-gray-400 mt-1 block">Thời gian vắng người liên tục trước khi tự động tắt các thiết bị đã chọn.</span>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button 
                onClick={() => setAiModal(false)} 
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button 
                onClick={handleSaveAiConfig} 
                disabled={saving || !aiForm.cooldown_seconds}
                className="flex-1 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2 transition-colors"
              >
                {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                Lưu cấu hình
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}