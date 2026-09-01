import axios from 'axios'
import { toast } from './toast'

export const API_BASE = import.meta.env.VITE_API_BASE || `http://${window.location.hostname}:5000`

export const assetUrl = (path) => {
  if (!path) return ''
  const cleanPath = Array.isArray(path) ? path[0] : path
  if (!cleanPath || typeof cleanPath !== 'string') return ''
  if (/^https?:\/\//i.test(cleanPath)) return cleanPath
  return `${API_BASE}${cleanPath.startsWith('/') ? cleanPath : `/${cleanPath}`}`
}

/**
 * Extracts the clean community surname/name without 'Parivar' suffix
 * e.g. 'vala.parivar.com' -> 'Vala', 'test.parivar.com' -> 'Test', 'patel.parivar.com' -> 'Patel'
 */
export const getCommunitySurname = () => {
  // 1. Most reliable indicator: The actual display name
  const webName = localStorage.getItem('web_name') || ''
  if (webName) {
    // If the web_name explicitly contains "parivar" (e.g., "Sojitra Parivar")
    if (webName.toLowerCase().includes('parivar')) {
      const cleaned = webName.replace(/parivar|_|-/gi, '').trim()
      if (cleaned) {
        return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
      }
    }
    // If it has a web_name but NO "parivar" (e.g. "Vala Admin" or "Village"), do NOT autofill
    return ''
  }
  // We rely entirely on the explicitly saved web_name. 
  // Guessing from the URL can lead to false positives for Villages (e.g. vala.parivar.me -> Vala)
  return ''

  // Default fallback
  return ''
}

export const getCommunityFullName = () => {
  const webName = localStorage.getItem('web_name')
  if (webName) return webName

  // Fallback if not logged in / missing
  const surname = getCommunitySurname()
  return surname ? `${surname} Parivar` : ''
}

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { 'Content-Type': 'multipart/form-data' },
  timeout: 12000,
  transitional: {
    clarifyTimeoutError: true
  }
})

export const exportDonationsExcel = (search = '') =>
  api.get('/donations/export', { params: search ? { search } : {}, responseType: 'blob' })

export const memberApi = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 12000,
  transitional: {
    clarifyTimeoutError: true
  }
})



// Add token to all requests
const setupInterceptors = (axiosInstance) => {
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('auth_token')
      const tenantCode = localStorage.getItem('tenant_code')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
      if (tenantCode) {
        config.headers['x-tenant-id'] = tenantCode
      }
      if (config.data instanceof FormData) {
        delete config.headers['Content-Type']
      }
      return config
    },
    (error) => Promise.reject(error)
  )

  // Handle 401 responses
  axiosInstance.interceptors.response.use(
    (response) => {
      const method = response.config?.method?.toLowerCase()
      // Success toasts are handled by individual components to avoid duplicates
      return response
    },
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        window.location.href = '/login'
        return Promise.reject(error)
      }

      // Handle error toasts for API responses
      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error

      if (errorMessage) {
        toast.error(errorMessage)
      }

      return Promise.reject(error)
    }
  )
}

setupInterceptors(api)
setupInterceptors(memberApi)

import { COMMITTEE_ENDPOINTS, MEMBER_ENDPOINTS, EVENT_ENDPOINTS, GALLERY_ENDPOINTS } from '../utils/endpoints'

export const getEventsList = (params = {}) => api.get(EVENT_ENDPOINTS.GET_EVENTS, { params })
export const getUsersList = (params = {}) => api.get(MEMBER_ENDPOINTS.GET_MEMBERS, { params })
export const getStudentsList = (params = {}) => api.get('/students', { params })
export const getBusinessesList = (params = {}) => api.get('/businesses', { params })
export const getPostsList = (params = {}) => api.get('/posts', { params })
export const getNewsList = (params = {}) => api.get('/news', { params })
export const getDonationsList = (params = {}) => api.get('/donations', { params })
export const getBankDetailsList = (params = {}) => api.get('/bank-details', { params })
export const getCommitteeMembersList = (params = {}) => api.get(COMMITTEE_ENDPOINTS.GET_MEMBERS, { params })
export const getGalleryList = (params = {}) => api.get(GALLERY_ENDPOINTS.GET_GALLERY, { params })
export const getExpensesList = (params = {}) => api.get('/expenses', { params })

export const exportExpensesExcel = (params = {}) =>
  api.get('/expenses/export', { params, responseType: 'blob' })

// Standard Universal Date Formatter: DD/MM/YYYY
export const formatDate = (val) => {
  if (!val) return '-'
  try {
    const str = String(val).trim()
    if (!str) return '-'
    if (str.includes('/')) {
      const parts = str.split('/')
      if (parts.length === 3) {
        const d = parts[0].padStart(2, '0')
        const m = parts[1].padStart(2, '0')
        const y = parts[2]
        return `${d}/${m}/${y}`
      }
    }
    const d = new Date(val)
    if (isNaN(d.getTime())) return String(val)
    const day = String(d.getDate()).padStart(2, '0')
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const year = d.getFullYear()
    return `${day}/${month}/${year}`
  } catch {
    return String(val || '-')
  }
}

export default api
