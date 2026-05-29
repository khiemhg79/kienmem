import axios from 'axios'

const api = axios.create({ baseURL: '/api', timeout: 10000 })

// Flag để tránh nhiều request cùng refresh một lúc
let isRefreshing = false
let failedQueue = []

function processQueue(error, token = null) {
  failedQueue.forEach(p => error ? p.reject(error) : p.resolve(token))
  failedQueue = []
}

api.interceptors.request.use(cfg => {
  const token = localStorage.getItem('accessToken')
  if (token) cfg.headers.Authorization = `Bearer ${token}`
  return cfg
})

api.interceptors.response.use(
  r => r,
  async err => {
    const original = err.config

    // Nếu chính request refresh bị lỗi → về login ngay, không retry
    if (original?.url?.includes('/auth/refresh')) {
      isRefreshing = false
      localStorage.clear()
      window.location.href = '/login'
      return Promise.reject(err)
    }

    // Không có token → về login ngay
    if (err.response?.status === 401 && !localStorage.getItem('refreshToken')) {
      localStorage.clear()
      window.location.href = '/login'
      return Promise.reject(err)
    }

    if (err.response?.status === 401 && !original._retry) {
      original._retry = true

      // Nếu đang refresh → xếp hàng chờ
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then(token => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        }).catch(e => Promise.reject(e))
      }

      isRefreshing = true

      try {
        const rt = localStorage.getItem('refreshToken')
        const { data } = await axios.post('/api/auth/refresh', { refreshToken: rt })
        localStorage.setItem('accessToken', data.accessToken)
        localStorage.setItem('refreshToken', data.refreshToken)
        api.defaults.headers.common.Authorization = `Bearer ${data.accessToken}`
        processQueue(null, data.accessToken)
        original.headers.Authorization = `Bearer ${data.accessToken}`
        return api(original)
      } catch (e) {
        processQueue(e, null)
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(e)
      } finally {
        isRefreshing = false
      }
    }

    return Promise.reject(err)
  }
)

// ── Auth ─────────────────────────────────────────
export const login  = (email, password) => api.post('/auth/login', { email, password })
export const logout = ()                 => api.post('/auth/logout')
export const getMe  = ()                 => api.get('/auth/me')

// ── Users ────────────────────────────────────────
export const getUsers   = ()         => api.get('/users')
export const createUser = (data)     => api.post('/users', data)
export const updateUser = (id, data) => api.put(`/users/${id}`, data)
export const deleteUser = (id)       => api.delete(`/users/${id}`)

// ── Devices ──────────────────────────────────────
export const getDevices     = ()         => api.get('/devices')
export const getDevice      = (id)       => api.get(`/devices/${id}`)
export const createDevice   = (data)     => api.post('/devices', data)
export const updateDevice   = (id, data) => api.put(`/devices/${id}`, data)
export const deleteDevice   = (id)       => api.delete(`/devices/${id}`)
export const controlDevice  = (id, cmd)  => api.post(`/devices/${id}/control`, cmd)

// ── Automations ───────────────────────────────────
export const getRules    = ()         => api.get('/automations')
export const createRule  = (data)     => api.post('/automations', data)
export const updateRule  = (id, data) => api.put(`/automations/${id}`, data)
export const deleteRule  = (id)       => api.delete(`/automations/${id}`)
export const triggerRule = (id)       => api.post(`/automations/${id}/trigger`)
export const getRuleLogs = (id)       => api.get(`/automations/${id}/logs`)

// ── Sensors ───────────────────────────────────────
export const getLatestSensors = (room)        => api.get('/sensors/latest', { params: { room } })
export const getSensorHistory = (room, hours) => api.get('/sensors/history', { params: { room, hours } })
export const getSimulationConfig    = ()      => api.get('/sensors/simulation')
export const updateSimulationConfig = (data)  => api.post('/sensors/simulation', data)

export const getFloorPlanConfig     = ()      => api.get('/notifications/settings/floor-plan')
export const updateFloorPlanConfig  = (data)  => api.put('/notifications/settings/floor-plan', data)

// ── Notifications ────────────────────────────────
export const getNotifications     = () => api.get('/notifications')
export const getUnreadCount       = () => api.get('/notifications/unread-count')
export const markRead             = (id) => api.post(`/notifications/${id}/read`)
export const markAllRead          = ()   => api.post('/notifications/read-all')
export const getEmailSetting      = () => api.get('/notifications/settings')
export const updateEmailSetting   = (data) => api.put('/notifications/settings', data)

export default api