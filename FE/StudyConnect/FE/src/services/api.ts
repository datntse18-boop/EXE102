import axios from 'axios'

/**
 * API Base URL resolution priority:
 * 1. If on localhost → use local backend directly (bypass tunnels / Cisco Umbrella)
 * 2. If VITE_API_URL env is set (e.g. Render URL on Vercel production) → use that
 * 3. Fallback: /config.json (for Serveo tunnel dynamic config)
 */
function getInitialBaseUrl(): string {
  const hostname = window.location.hostname
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    return 'http://localhost:3000/api'
  }
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL as string
  }
  return '/api' // fallback
}

const api = axios.create({
  baseURL: getInitialBaseUrl(),
  headers: { 'Content-Type': 'application/json' },
})

let dynamicApiUrl = ''

// Attach JWT token and optional Gemini API key to every request
api.interceptors.request.use(async (config) => {
  const hostname = window.location.hostname

  // On localhost: always use local backend, skip dynamic config
  if (hostname === 'localhost' || hostname === '127.0.0.1') {
    config.baseURL = 'http://localhost:3000/api'
  } else if (import.meta.env.VITE_API_URL) {
    // On Vercel production: use env var baked in at build time
    config.baseURL = import.meta.env.VITE_API_URL as string
  } else if (!dynamicApiUrl && !config.url?.endsWith('/config.json')) {
    // Fallback: load from /config.json (Serveo tunnel dynamic config)
    try {
      const { data } = await axios.get('/config.json')
      if (data?.backendUrl) {
        dynamicApiUrl = data.backendUrl + '/api'
        config.baseURL = dynamicApiUrl
      }
    } catch {
      // ignore – continue with default baseURL
    }
  } else if (dynamicApiUrl) {
    config.baseURL = dynamicApiUrl
  }

  const token = sessionStorage.getItem('accessToken')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  const geminiKey = localStorage.getItem('gemini_api_key')
  if (geminiKey) {
    config.headers['x-gemini-key'] = geminiKey
  }
  // Bypass tunnel warning pages
  config.headers['Bypass-Tunnel-Reminder'] = 'true'

  return config
})

// Auto-refresh token on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status === 401 && !originalRequest.url?.endsWith('/auth/login') && !originalRequest._retry) {
      originalRequest._retry = true
      try {
        const refreshToken = sessionStorage.getItem('refreshToken')
        if (!refreshToken) throw new Error('No refresh token')

        const baseUrl = getInitialBaseUrl()
        const { data } = await axios.post(`${baseUrl}/auth/refresh`, { refreshToken })
        sessionStorage.setItem('accessToken', data.data.accessToken)
        sessionStorage.setItem('refreshToken', data.data.refreshToken)

        originalRequest.headers.Authorization = `Bearer ${data.data.accessToken}`
        return api(originalRequest)
      } catch {
        sessionStorage.removeItem('accessToken')
        sessionStorage.removeItem('refreshToken')
        window.location.href = '/login'
      }
    }
    if (error.response?.status === 403 && error.response?.data?.isLimitReached) {
      window.dispatchEvent(new CustomEvent('ai-limit-reached', { detail: error.response.data.message }))
    }
    return Promise.reject(error)
  }
)

export default api
