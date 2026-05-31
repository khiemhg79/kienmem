import { useState, useEffect } from 'react'
import { getDeviceLogs, getExecLogs, getDevices, getRules } from '../services/api'
import { Terminal, RefreshCw, Cpu, Zap, CheckCircle2, XCircle, User, Clock, Eye } from 'lucide-react'

export default function Logs() {
  const [activeTab, setActiveTab] = useState('device')
  const [deviceLogs, setDeviceLogs] = useState([])
  const [execLogs, setExecLogs] = useState([])
  const [devices, setDevices] = useState([])
  const [rules, setRules] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [dLogs, eLogs, devList, ruleList] = await Promise.all([
        getDeviceLogs(),
        getExecLogs(),
        getDevices(),
        getRules()
      ])
      setDeviceLogs(dLogs.data)
      setExecLogs(eLogs.data)
      setDevices(devList.data)
      setRules(ruleList.data)
    } catch (e) {
      console.error('Error fetching logs:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const getDeviceName = (id) => {
    const d = devices.find(x => x.id === id)
    return d ? `${d.name} (Tầng ${d.floor})` : id
  }

  const getRuleName = (id) => {
    const r = rules.find(x => x.id === id)
    return r ? r.name : id
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Terminal className="w-7 h-7 text-blue-600" />
            Nhật ký Hệ thống (System Logs)
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            Theo dõi lịch sử điều khiển thiết bị và nhật ký kích hoạt kịch bản tự động theo thời gian thực.
          </p>
        </div>
        <button
          onClick={fetchData}
          disabled={loading}
          className="flex items-center gap-2 bg-white border border-gray-200 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors shadow-sm disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Tải lại
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200">
        <button
          onClick={() => setActiveTab('device')}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-all px-1 ${
            activeTab === 'device'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Cpu className="w-4 h-4" />
          Lịch sử Điều khiển Thiết bị
        </button>
        <button
          onClick={() => setActiveTab('automation')}
          className={`flex items-center gap-2 pb-3 text-sm font-semibold border-b-2 transition-all px-1 ${
            activeTab === 'automation'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Zap className="w-4 h-4" />
          Nhật ký Tự động hóa (Exec Logs)
        </button>
      </div>

      {/* Log Container */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-400">Đang tải nhật ký...</p>
          </div>
        ) : activeTab === 'device' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 font-semibold">
                  <th className="p-4">Thời gian</th>
                  <th className="p-4">Thiết bị</th>
                  <th className="p-4">Lệnh</th>
                  <th className="p-4">Nguồn kích hoạt</th>
                  <th className="p-4">Chi tiết (Payload)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {deviceLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 text-gray-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {new Date(log.createdAt).toLocaleString('vi-VN')}
                      </div>
                    </td>
                    <td className="p-4 font-medium text-gray-900">
                      {getDeviceName(log.device_id)}
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                        log.command === 'ON' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                      }`}>
                        {log.command}
                      </span>
                    </td>
                    <td className="p-4 text-gray-600">
                      <span className="inline-flex items-center gap-1">
                        {log.source === 'automation' ? (
                          <span className="bg-purple-50 text-purple-700 px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1">
                            <Zap className="w-3 h-3" /> Tự động hóa
                          </span>
                        ) : (
                          <span className="bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1">
                            <User className="w-3 h-3" /> Người dùng
                          </span>
                        )}
                      </span>
                    </td>
                    <td className="p-4 text-gray-500 font-mono text-xs">
                      {log.payload ? JSON.stringify(log.payload) : '{}'}
                    </td>
                  </tr>
                ))}
                {deviceLogs.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-gray-400">
                      Chưa có lịch sử điều khiển thiết bị nào.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100 text-gray-600 font-semibold">
                  <th className="p-4">Thời gian</th>
                  <th className="p-4">Kịch bản</th>
                  <th className="p-4">Kết quả</th>
                  <th className="p-4">Thời gian chạy</th>
                  <th className="p-4">Dữ liệu kích hoạt / Lỗi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {execLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 text-gray-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        {new Date(log.createdAt).toLocaleString('vi-VN')}
                      </div>
                    </td>
                    <td className="p-4 font-medium text-gray-900">
                      {log.rule?.name || getRuleName(log.rule_id)}
                    </td>
                    <td className="p-4">
                      {log.result === 'success' ? (
                        <span className="inline-flex items-center gap-1 bg-green-50 text-green-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Thành công
                        </span>
                      ) : log.result === 'skipped' ? (
                        <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-600 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                          Bỏ qua (Cooldown)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 px-2.5 py-0.5 rounded-full text-xs font-semibold">
                          <XCircle className="w-3.5 h-3.5" /> Lỗi
                        </span>
                      )}
                    </td>
                    <td className="p-4 text-gray-600">
                      {log.duration_ms} ms
                    </td>
                    <td className="p-4 text-gray-500 max-w-xs truncate">
                      {log.result === 'failed' ? (
                        <span className="text-red-600 font-semibold text-xs">{log.error_msg}</span>
                      ) : (
                        <span className="font-mono text-xs">{log.trigger_data ? JSON.stringify(log.trigger_data) : '{}'}</span>
                      )}
                    </td>
                  </tr>
                ))}
                {execLogs.length === 0 && (
                  <tr>
                    <td colSpan="5" className="text-center py-12 text-gray-400">
                      Chưa có nhật ký kịch bản tự động nào được ghi nhận.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
