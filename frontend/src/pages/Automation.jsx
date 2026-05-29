import { useState, useEffect } from 'react'
import { Plus, Play, Trash2, ToggleLeft, ToggleRight, Loader2, Zap, CheckCircle, XCircle } from 'lucide-react'
import { getRules, createRule, updateRule, deleteRule, triggerRule, getDevices } from '../services/api'

const INIT = { name:'', description:'', trigger_type:'sensor', condition: { sensor_type:'temperature', operator:'>', threshold:29 }, action:{ device_id:'', command:'ON', params:{ target_temp:24 } }, notify:true, notify_message:'', is_active:true }

export default function Automation() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const canEdit = ['admin', 'manager'].includes(user.role)
  const canDelete = user.role === 'admin'

  const [rules,   setRules]   = useState([])
  const [devices, setDevices] = useState([])
  const [modal,   setModal]   = useState(false)
  const [form,    setForm]    = useState(INIT)
  const [loading, setLoading] = useState(true)
  const [saving,  setSaving]  = useState(false)
  const [running, setRunning] = useState(null)

  const fetch = async () => {
    setLoading(true)
    try {
      const [r, d] = await Promise.all([getRules(), getDevices()])
      setRules(r.data); setDevices(d.data)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetch() }, [])

  async function handleSave() {
    setSaving(true)
    try {
      await createRule({ ...form, condition: { sensor_type: form.condition.sensor_type, operator: form.condition.operator, threshold: Number(form.condition.threshold) }, action: { ...form.action, device_id: form.action.device_id } })
      setModal(false); await fetch()
    } catch (e) { alert(e.response?.data?.error || 'Lỗi tạo kịch bản') }
    finally { setSaving(false) }
  }

  async function handleToggle(rule) {
    try { await updateRule(rule.id, { is_active: !rule.is_active }); await fetch() }
    catch (e) { alert('Lỗi cập nhật') }
  }

  async function handleTrigger(id) {
    setRunning(id)
    try { await triggerRule(id); alert('✅ Đã thực thi kịch bản thành công!'); await fetch() }
    catch (e) { alert(e.response?.data?.error || 'Lỗi thực thi') }
    finally { setRunning(null) }
  }

  async function handleDelete(id) {
    if (!confirm('Xóa kịch bản này?')) return
    try { await deleteRule(id); await fetch() }
    catch (e) { alert('Lỗi xóa') }
  }

  const acDevices = devices.filter(d => d.type === 'ac' || d.type === 'light')

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tự động hóa</h1>
          <p className="text-gray-500 text-sm mt-1">Thiết lập kịch bản điều kiện → hành động</p>
        </div>
        {canEdit && (
          <button onClick={() => { setForm(INIT); setModal(true) }}
            className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-blue-700">
            <Plus className="w-4 h-4" /> Tạo kịch bản
          </button>
        )}
      </div>

      {/* Câu 3 highlight box */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
        <p className="text-sm font-semibold text-amber-800 mb-1">🎯 Kịch bản Câu 3 — Đề thi IT03A-2511</p>
        <p className="text-xs text-amber-700">Nếu nhiệt độ phòng 301 vượt 29°C → tự động bật điều hòa + gửi thông báo đến điện thoại</p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-blue-600" /></div>
      ) : (
        <div className="space-y-4">
          {rules.map(rule => (
            <div key={rule.id} className={`bg-white rounded-xl p-5 shadow-sm border transition-all ${rule.is_active ? 'border-blue-100' : 'border-gray-100 opacity-70'}`}>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className={`w-4 h-4 ${rule.is_active ? 'text-blue-600' : 'text-gray-400'}`} />
                    <h3 className="font-semibold text-gray-900">{rule.name}</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${rule.is_active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                      {rule.is_active ? 'Đang bật' : 'Tắt'}
                    </span>
                  </div>
                  {rule.description && <p className="text-sm text-gray-500 mb-2">{rule.description}</p>}

                  <div className="flex flex-wrap gap-3 text-xs">
                    <div className="bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg">
                      <span className="font-medium">Điều kiện: </span>
                      {rule.trigger_type === 'time' 
                        ? `Vào lúc ${rule.condition?.time}` 
                        : `${rule.condition?.sensor_type} ${rule.condition?.operator} ${rule.condition?.threshold}`}
                    </div>
                    <div className="bg-green-50 text-green-700 px-3 py-1.5 rounded-lg">
                      <span className="font-medium">Hành động: </span>
                      {rule.action?.command} thiết bị
                    </div>
                    {rule.notify && (
                      <div className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg">
                        🔔 Gửi thông báo
                      </div>
                    )}
                  </div>

                  {rule.last_triggered && (
                    <p className="text-xs text-gray-400 mt-2">
                      Lần cuối: {new Date(rule.last_triggered).toLocaleString('vi-VN')} · {rule.trigger_count} lần
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2 ml-4">
                  {canEdit && (
                    <button onClick={() => handleTrigger(rule.id)} disabled={running === rule.id}
                      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 font-medium disabled:opacity-50">
                      {running === rule.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
                      Chạy
                    </button>
                  )}
                  {canEdit && (
                    <button onClick={() => handleToggle(rule)}
                      className={`p-1.5 rounded-lg transition-colors ${rule.is_active ? 'text-green-600 hover:bg-green-50' : 'text-gray-400 hover:bg-gray-50'}`}>
                      {rule.is_active ? <ToggleRight className="w-5 h-5" /> : <ToggleLeft className="w-5 h-5" />}
                    </button>
                  )}
                  {canDelete && (
                    <button onClick={() => handleDelete(rule.id)} className="p-1.5 rounded-lg text-red-400 hover:bg-red-50">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
          {rules.length === 0 && <div className="text-center py-16 text-gray-400">Chưa có kịch bản nào. Nhấn "Tạo kịch bản" để bắt đầu.</div>}
        </div>
      )}

      {/* Modal tạo kịch bản */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 max-h-[90vh] overflow-y-auto">
            <h2 className="text-lg font-bold text-gray-900 mb-4">Tạo kịch bản tự động</h2>
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Tên kịch bản *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="VD: Bật điều hòa khi nhiệt độ > 29°C"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Mô tả</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">Loại kích hoạt (Trigger)</label>
                <select value={form.trigger_type} onChange={e => setForm(f => ({ ...f, trigger_type: e.target.value }))}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="sensor">Cảm biến / Trạng thái</option>
                  <option value="time">Thời gian (Lịch trình)</option>
                </select>
              </div>

              {form.trigger_type === 'sensor' ? (
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-blue-800 mb-2">ĐIỀU KIỆN (Trigger)</p>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Loại cảm biến</label>
                      <select value={form.condition.sensor_type} onChange={e => setForm(f => ({ ...f, condition: { ...f.condition, sensor_type: e.target.value } }))}
                        className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs">
                        <option value="temperature">Nhiệt độ</option>
                        <option value="humidity">Độ ẩm</option>
                        <option value="motion">Chuyển động</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Điều kiện</label>
                      <select value={form.condition.operator} onChange={e => setForm(f => ({ ...f, condition: { ...f.condition, operator: e.target.value } }))}
                        className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs">
                        {['>','>=','<','<=','=='].map(o => <option key={o} value={o}>{o}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">Ngưỡng</label>
                      <input type="number" value={form.condition.threshold} onChange={e => setForm(f => ({ ...f, condition: { ...f.condition, threshold: e.target.value } }))}
                        className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="bg-blue-50 rounded-xl p-4">
                  <p className="text-xs font-semibold text-blue-800 mb-2">ĐIỀU KIỆN THỜI GIAN (Trigger)</p>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Giờ kích hoạt (HH:MM)</label>
                    <input type="time" value={form.condition.time || '18:00'} onChange={e => setForm(f => ({ ...f, condition: { ...f.condition, time: e.target.value } }))}
                      className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs" />
                  </div>
                </div>
              )}
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-xs font-semibold text-green-800 mb-2">HÀNH ĐỘNG (Action)</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Thiết bị</label>
                    <select value={form.action.device_id} onChange={e => setForm(f => ({ ...f, action: { ...f.action, device_id: e.target.value } }))}
                      className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs">
                      <option value="">-- Chọn thiết bị --</option>
                      {acDevices.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-600 mb-1">Lệnh</label>
                    <select value={form.action.command} onChange={e => setForm(f => ({ ...f, action: { ...f.action, command: e.target.value } }))}
                      className="w-full border border-gray-200 rounded px-2 py-1.5 text-xs">
                      <option value="ON">BẬT</option>
                      <option value="OFF">TẮT</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input type="checkbox" id="notify" checked={form.notify} onChange={e => setForm(f => ({ ...f, notify: e.target.checked }))} />
                <label htmlFor="notify" className="text-sm text-gray-700">Gửi thông báo khi kịch bản kích hoạt</label>
              </div>
              {form.notify && (
                <input value={form.notify_message} onChange={e => setForm(f => ({ ...f, notify_message: e.target.value }))}
                  placeholder="Nội dung thông báo (để trống = tự động)"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              )}
            </div>
            <div className="flex gap-3 mt-5">
              <button onClick={() => setModal(false)} className="flex-1 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50">Hủy</button>
              <button onClick={handleSave} disabled={saving || !form.name}
                className="flex-1 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60 flex items-center justify-center gap-2">
                {saving && <Loader2 className="w-4 h-4 animate-spin" />} Tạo kịch bản
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
