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
  // 1. Check live link / domain / subdomain first (e.g. test.parivar.in, vala.parivar.com, etc.)
  const hostname = window.location.hostname
  const hostParts = hostname.split('.')
  if (hostParts.length > 1 && !['localhost', '127.0.0.1'].includes(hostname)) {
    const firstPart = hostParts[0].toLowerCase()
    if (firstPart !== 'www' && firstPart !== 'admin' && firstPart !== 'api') {
      const cleanFirst = firstPart.replace(/parivar/gi, '').trim()
      if (cleanFirst) {
        return cleanFirst.charAt(0).toUpperCase() + cleanFirst.slice(1)
      }
    }
  }

  // 2. Check logged-in tenant code in localStorage
  const tenantCode = localStorage.getItem('tenant_code') || ''
  if (tenantCode) {
    const cleanedTenant = tenantCode.replace(/parivar/gi, '').trim()
    if (cleanedTenant) {
      return cleanedTenant.charAt(0).toUpperCase() + cleanedTenant.slice(1)
    }
  }

  // 3. Check saved app name in localStorage / Theme Config
  const webName = localStorage.getItem('web_name') || ''
  const cleaned = webName.replace(/parivar/gi, '').trim()
  if (cleaned) {
    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
  }

  // Default fallback if no domain/subdomain and no web_name
  return ''
}

export const getCommunityFullName = () => {
  const surname = getCommunitySurname()
  return `${surname} Parivar`
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

export const getEventsList = (params = {}) => api.get('/events', { params })
export const getUsersList = (params = {}) => api.get('/users', { params })
export const getStudentsList = (params = {}) => api.get('/students', { params })
export const getBusinessesList = (params = {}) => api.get('/businesses', { params })
export const getPostsList = (params = {}) => api.get('/posts', { params })
export const getNewsList = (params = {}) => api.get('/news', { params })
export const getDonationsList = (params = {}) => api.get('/donations', { params })
export const getBankDetailsList = (params = {}) => api.get('/bank-details', { params })
export const getCommitteeMembersList = (params = {}) => api.get('/committee-members', { params })
export const getGalleryList = (params = {}) => api.get('/gallery', { params })
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
