import { useState, useEffect } from 'react'
import { Mail, Check, AlertCircle, Loader2, Settings, ShieldAlert, Send } from 'lucide-react'
import { getEmailSetting, updateEmailSetting } from '../services/api'

export default function EmailSettings() {
  const [notifyEmail, setNotifyEmail] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState({ type: '', msg: '' })

  const fetchSettings = async () => {
    setLoading(true)
    try {
      const { data } = await getEmailSetting()
      setNotifyEmail(data.notifyEmail || '')
    } catch (e) {
      console.error(e)
      setStatus({ type: 'error', msg: 'Không thể tải cấu hình email.' })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettings()
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    
    // Simple email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(notifyEmail)) {
      setStatus({ type: 'error', msg: 'Địa chỉ email không hợp lệ.' })
      return
    }

    setSaving(true)
    setStatus({ type: '', msg: '' })
    try {
      await updateEmailSetting({ notifyEmail })
      setStatus({ type: 'success', msg: 'Cập nhật email nhận thông báo thành công!' })
    } catch (e) {
      console.error(e)
      setStatus({ type: 'error', msg: 'Lỗi khi lưu cấu hình email.' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Settings className="w-7 h-7 text-blue-600" />
          Cấu hình Email
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          Quản lý tài khoản email nhận thông báo và cảnh báo khi có sự cố hệ thống.
        </p>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Main settings form */}
          <div className="md:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-gray-400" />
              Địa chỉ nhận thông báo
            </h2>

            {status.msg && (
              <div className={`p-4 rounded-xl mb-6 flex items-start gap-3 text-sm transition-all
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

            <form onSubmit={handleSave} className="space-y-4">
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
                <p className="text-xs text-gray-400 mt-1.5">
                  Các email cảnh báo tự động sẽ được gửi ngay lập tức tới địa chỉ này.
                </p>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full md:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm flex items-center justify-center gap-2 disabled:bg-blue-400"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Lưu cấu hình
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Details / Help sidepanel */}
          <div className="space-y-6">
            
            {/* System Status info */}
            <div className="bg-gradient-to-br from-blue-900 to-indigo-950 text-white rounded-2xl shadow-md p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 translate-x-4 -translate-y-4 w-24 h-24 bg-blue-500/10 rounded-full blur-xl" />
              
              <h3 className="font-semibold text-sm uppercase tracking-wider text-blue-200 mb-4 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4" />
                Cơ chế kích hoạt
              </h3>
              
              <ul className="space-y-3 text-xs text-blue-100/90 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 font-bold">•</span>
                  <span><b>Cảnh báo Cảm biến:</b> Nhiệt độ vượt ngưỡng cho phép (mặc định &gt; 29°C) tại phòng làm việc.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-400 font-bold">•</span>
                  <span><b>Kịch bản tự động hóa:</b> Khi có một quy tắc (rule) kích hoạt do các tham số môi trường chạm ngưỡng.</span>
                </li>
              </ul>
            </div>

            {/* Configured server info */}
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
