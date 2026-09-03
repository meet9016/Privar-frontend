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
 * Extracts the tenant slug from the subdomain (e.g. 'chovatiya.parivar.me' -> 'chovatiya')
 */
export const getSubdomainTenant = () => {
  if (typeof window === 'undefined') return ''
  const hostname = window.location.hostname
  if (!hostname || hostname === 'localhost' || hostname === '127.0.0.1') {
    return localStorage.getItem('tenant_code') || ''
  }

  // If IP address (IPv4 or IPv6), do not treat first octet as a tenant subdomain
  if (/^(\d{1,3}\.){3}\d{1,3}$/.test(hostname) || hostname.includes(':')) {
    return localStorage.getItem('tenant_code') || ''
  }

  const parts = hostname.split('.')
  // Check for multi-part domains (e.g. chovatiya.parivar.me -> parts: ['chovatiya', 'parivar', 'me'])
  if (parts.length >= 3) {
    const sub = parts[0].toLowerCase()
    const nonTenantSubdomains = ['www', 'admin', 'api', 'app', 'superadmin', 'parivar', 'mail', 'service']
    if (!nonTenantSubdomains.includes(sub)) {
      return sub
    }
  } else if (parts.length === 2 && parts[1].toLowerCase() === 'localhost') {
    // e.g. chovatiya.localhost
    const sub = parts[0].toLowerCase()
    const nonTenantSubdomains = ['www', 'admin', 'api', 'app', 'superadmin', 'parivar', 'mail', 'service']
    if (!nonTenantSubdomains.includes(sub)) {
      return sub
    }
  }

  return localStorage.getItem('tenant_code') || ''
}

/**
 * Returns the exact community name from domain subdomain (e.g. 'chovatiya.parivar.me' -> 'Chovatiya')
 * If not on a tenant subdomain, falls back to stored surname or 'Parivar'
 */
export const getDomainCommunityName = () => {
  const currentSubdomain = getSubdomainTenant()
  if (currentSubdomain) {
    return currentSubdomain.charAt(0).toUpperCase() + currentSubdomain.slice(1)
  }
  const surname = getCommunitySurname()
  if (surname) {
    return surname
  }
  const webName = localStorage.getItem('web_name')
  if (webName) {
    return webName
  }
  return 'Parivar'
}

/**
 * Extracts the clean community surname/name without 'Parivar' suffix
 * e.g. 'chovatiya.parivar.me' -> 'Chovatiya', 'vala.parivar.me' -> 'Vala'
 */
export const getCommunitySurname = () => {
  const currentSubdomain = getSubdomainTenant()
  const webName = localStorage.getItem('web_name') || ''

  if (webName) {
    // If the subdomain is explicitly something else (e.g. chovatiya) and webName contains old/different name (e.g. Vala)
    if (currentSubdomain && !webName.toLowerCase().includes(currentSubdomain)) {
      return currentSubdomain.charAt(0).toUpperCase() + currentSubdomain.slice(1)
    }

    if (webName.toLowerCase().includes('parivar')) {
      const cleaned = webName.replace(/parivar|_|-/gi, '').trim()
      if (cleaned) {
        return cleaned.charAt(0).toUpperCase() + cleaned.slice(1)
      }
    } else {
      return webName.trim()
    }
  }

  if (currentSubdomain) {
    return currentSubdomain.charAt(0).toUpperCase() + currentSubdomain.slice(1)
  }

  return ''
}

export const getCommunityFullName = () => {
  const currentSubdomain = getSubdomainTenant()
  const webName = localStorage.getItem('web_name')

  // If on a specific tenant subdomain (e.g. chovatiya.parivar.me)
  if (currentSubdomain) {
    const formatted = currentSubdomain.charAt(0).toUpperCase() + currentSubdomain.slice(1)
    if (webName && webName.toLowerCase().includes(currentSubdomain.toLowerCase())) {
      return webName
    }
    return `${formatted} Parivar`
  }

  if (webName) {
    return webName
  }

  // Fallback if not logged in / missing
  const surname = getCommunitySurname()
  return surname ? `${surname} Parivar` : 'Parivar'
}

const api = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { 'Content-Type': 'multipart/form-data' },
  timeout: 120000, 
  transitional: {
    clarifyTimeoutError: true
  }
})

export const exportDonationsExcel = (search = '') =>
  api.get('/donations/export', { params: search ? { search } : {}, responseType: 'blob' })

export const memberApi = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: { 'Content-Type': 'application/json' },
  timeout: 120000, 
  transitional: {
    clarifyTimeoutError: true
  }
})

// Add token and tenant to all requests
const setupInterceptors = (axiosInstance) => {
  axiosInstance.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('auth_token')
      const tenantCode = getSubdomainTenant() || localStorage.getItem('tenant_code')
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

import { COMMITTEE_ENDPOINTS, MEMBER_ENDPOINTS, EVENT_ENDPOINTS, GALLERY_ENDPOINTS, STUDENT_ENDPOINTS, BUSINESS_ENDPOINTS, POST_ENDPOINTS, NEWS_ENDPOINTS, EXPENSE_ENDPOINTS, DONATION_ENDPOINTS, MASTER_ENDPOINTS } from '../utils/endpoints'

export const getEventsList = (params = {}) => api.get(EVENT_ENDPOINTS.GET_EVENTS, { params })
export const getUsersList = (params = {}) => api.get(MEMBER_ENDPOINTS.GET_MEMBERS, { params })
export const getStudentsList = (params = {}) => api.get(STUDENT_ENDPOINTS.GET_STUDENTS, { params })
export const getBusinessesList = (params = {}) => api.get(BUSINESS_ENDPOINTS.GET_BUSINESSES, { params })
export const getPostsList = (params = {}) => api.get(POST_ENDPOINTS.GET_POSTS, { params })
export const getNewsList = (params = {}) => api.get(NEWS_ENDPOINTS.GET_NEWS, { params })
export const getDonationsList = (params = {}) => api.get(DONATION_ENDPOINTS.GET_DONATIONS, { params })
export const getBankDetailsList = (params = {}) => api.get(MASTER_ENDPOINTS.BANK_DETAILS, { params })
export const getCommitteeMembersList = (params = {}) => api.get(COMMITTEE_ENDPOINTS.GET_MEMBERS, { params })
export const getGalleryList = (params = {}) => api.get(GALLERY_ENDPOINTS.GET_GALLERY, { params })
export const getExpensesList = (params = {}) => api.get(EXPENSE_ENDPOINTS.GET_EXPENSES, { params })

export const exportExpensesExcel = (params = {}) =>
  api.get(EXPENSE_ENDPOINTS.EXPORT_EXCEL, { params, responseType: 'blob' })

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
