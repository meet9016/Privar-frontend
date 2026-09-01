// Committee Members Module API Endpoints
export const COMMITTEE_ENDPOINTS = {
  GET_MEMBERS: '/committee-members',
  CREATE_MEMBER: '/committee-members',
  UPDATE_MEMBER: (id) => `/committee-members/${id}`,
  DELETE_MEMBER: (id) => `/committee-members/${id}`,
  GET_ROLES: '/roles'
}

// Roles & Permissions Module API Endpoints
export const ROLES_ENDPOINTS = {
  GET_ROLES: '/roles',
  CREATE_ROLE: '/roles',
  UPDATE_ROLE: (id) => `/roles/${id}`,
  DELETE_ROLE: (id) => `/roles/${id}`,
  GET_PERMISSIONS: '/permissions'
}

// Members / Family Registry Module API Endpoints
export const MEMBER_ENDPOINTS = {
  GET_MEMBERS: '/users',
  CREATE_MEMBER: '/users',
  UPDATE_MEMBER: (id) => `/users/${id}`,
  DELETE_MEMBER: (id) => `/users/${id}`,
  BULK_UPDATE_STATUS: '/users/bulk-update',
  GET_FAMILY_MEMBERS: (headId) => `/users/family/${headId}`,
  GET_ROLES: '/roles',
  MASTERS_COUNTRY: '/masters/country',
  MASTERS_STATE: '/masters/state',
  MASTERS_CITY: '/masters/city',
  MASTERS_VILLAGE: '/masters/village'
}

// Gallery Module API Endpoints
export const GALLERY_ENDPOINTS = {
  GET_GALLERY: '/gallery',
  CREATE_GALLERY: '/gallery',
  UPDATE_GALLERY: (id) => `/gallery/${id}`,
  DELETE_GALLERY: (id) => `/gallery/${id}`,
  GET_CATEGORIES: '/gallery-categories'
}

// Birthdays Module API Endpoints
export const BIRTHDAY_ENDPOINTS = {
  GET_BIRTHDAYS: '/users?birthday'
}

// Job Vacancies Module API Endpoints
export const JOB_VACANCY_ENDPOINTS = {
  GET_VACANCIES: '/job-vacancy',
  CREATE_VACANCY: '/job-vacancy',
  UPDATE_VACANCY: (id) => `/job-vacancy/${id}`,
  DELETE_VACANCY: (id) => `/job-vacancy/${id}`
}

// Events Module API Endpoints
export const EVENT_ENDPOINTS = {
  GET_EVENTS: '/events',
  CREATE_EVENT: '/events',
  UPDATE_EVENT: (id) => `/events/${id}`,
  DELETE_EVENT: (id) => `/events/${id}`,
  BULK_STATUS: '/events/bulk/status',
  BULK_DELETE: '/events/bulk',
  GET_CATEGORIES: '/masters/event-category',
  GET_REGISTRATIONS: '/event-registrations',
  DOWNLOAD_REGISTRATIONS: (params) => `/event-registrations/download?${params}`
}

export default {
  COMMITTEE: COMMITTEE_ENDPOINTS,
  ROLES: ROLES_ENDPOINTS,
  MEMBER: MEMBER_ENDPOINTS,
  GALLERY: GALLERY_ENDPOINTS,
  BIRTHDAY: BIRTHDAY_ENDPOINTS,
  JOB_VACANCY: JOB_VACANCY_ENDPOINTS,
  EVENT: EVENT_ENDPOINTS
}
