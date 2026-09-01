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

// Businesses Module API Endpoints
export const BUSINESS_ENDPOINTS = {
  GET_BUSINESSES: '/businesses',
  CREATE_BUSINESS: '/businesses',
  UPDATE_BUSINESS: (id) => `/businesses/${id}`,
  DELETE_BUSINESS: (id) => `/businesses/${id}`,
  GET_CATEGORIES: '/business-categories'
}

// Students Module API Endpoints
export const STUDENT_ENDPOINTS = {
  GET_STUDENTS: '/students',
  CREATE_STUDENT: '/students',
  UPDATE_STUDENT: (id) => `/students/${id}`,
  DELETE_STUDENT: (id) => `/students/${id}`
}

// Matrimonies Module API Endpoints
export const MATRIMONY_ENDPOINTS = {
  GET_MATRIMONIES: '/matrimonies',
  CREATE_MATRIMONY: '/matrimonies',
  UPDATE_MATRIMONY: (id) => `/matrimonies/${id}`,
  DELETE_MATRIMONY: (id) => `/matrimonies/${id}`
}

// Posts Module API Endpoints
export const POST_ENDPOINTS = {
  GET_POSTS: '/posts',
  CREATE_POST: '/posts',
  UPDATE_POST: (id) => `/posts/${id}`,
  DELETE_POST: (id) => `/posts/${id}`
}

// News Module API Endpoints
export const NEWS_ENDPOINTS = {
  GET_NEWS: '/news',
  CREATE_NEWS: '/news',
  UPDATE_NEWS: (id) => `/news/${id}`,
  DELETE_NEWS: (id) => `/news/${id}`
}

// Feedback Module API Endpoints
export const FEEDBACK_ENDPOINTS = {
  GET_FEEDBACK: '/feedback'
}

// Expenses Module API Endpoints
export const EXPENSE_ENDPOINTS = {
  GET_EXPENSES: '/expenses',
  CREATE_EXPENSE: '/expenses',
  UPDATE_EXPENSE: (id) => `/expenses/${id}`,
  DELETE_EXPENSE: (id) => `/expenses/${id}`,
  EXPORT_EXCEL: '/expenses/export',
  GET_CATEGORIES: '/masters/expense-category'
}

// Donations Module API Endpoints
export const DONATION_ENDPOINTS = {
  GET_DONATIONS: '/donations',
  CREATE_DONATION: '/donations',
  UPDATE_DONATION: (id) => `/donations/${id}`,
  DELETE_DONATION: (id) => `/donations/${id}`,
  EXPORT_EXCEL: '/donations/export'
}

// Masters Module API Endpoints
export const MASTER_ENDPOINTS = {
  BUSINESS_CATEGORY: '/masters/business',
  BANK_DETAILS: '/bank-details',
  COUNTRY: '/masters/country',
  STATE: '/masters/state',
  CITY: '/masters/city',
  VILLAGE: '/masters/village',
  BLOOD_GROUP: '/masters/blood-group',
  EVENT_CATEGORY: '/masters/event-category',
  GALLERY_CATEGORY: '/masters/gallery-category',
  EXPENSE_CATEGORY: '/masters/expense-category',
  GET_MASTER: (type) => type === 'bank-details' ? '/bank-details' : `/masters/${type}`
}

export default {
  COMMITTEE: COMMITTEE_ENDPOINTS,
  ROLES: ROLES_ENDPOINTS,
  MEMBER: MEMBER_ENDPOINTS,
  GALLERY: GALLERY_ENDPOINTS,
  BIRTHDAY: BIRTHDAY_ENDPOINTS,
  JOB_VACANCY: JOB_VACANCY_ENDPOINTS,
  EVENT: EVENT_ENDPOINTS,
  BUSINESS: BUSINESS_ENDPOINTS,
  STUDENT: STUDENT_ENDPOINTS,
  MATRIMONY: MATRIMONY_ENDPOINTS,
  POST: POST_ENDPOINTS,
  NEWS: NEWS_ENDPOINTS,
  FEEDBACK: FEEDBACK_ENDPOINTS,
  EXPENSE: EXPENSE_ENDPOINTS,
  DONATION: DONATION_ENDPOINTS,
  MASTER: MASTER_ENDPOINTS
}
