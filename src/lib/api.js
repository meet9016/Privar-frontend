import axios from 'axios'
import { toast } from './toast'

export const API_BASE = import.meta.env.VITE_API_BASE || `http://${window.location.hostname}:5000`

export const assetUrl = (path) => {
  if (!path) return ''
  if (/^https?:\/\//i.test(path)) return path
  return `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`
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
      const url = config.url || ''
      const isPublicDropdown = url.includes('/masters/country') || 
                               url.includes('/masters/state') || 
                               url.includes('/masters/city') || 
                               url.includes('familyHead=true')

      const token = localStorage.getItem('auth_token')
      if (token && !isPublicDropdown) {
        config.headers.Authorization = `Bearer ${token}`
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
      const shouldToastSuccess = ['post', 'put', 'patch', 'delete'].includes(method)
      const message = response.data?.message

      if (shouldToastSuccess && message) {
        toast.success(message)
      }

      return response
    },
    (error) => {
      if (error.response?.status === 401) {
        localStorage.removeItem('auth_token')
        localStorage.removeItem('auth_user')
        window.location.href = '/login'
      }

      const message = error.response?.data?.message || error.message || 'Something went wrong'
      toast.error(message)

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

export default api
