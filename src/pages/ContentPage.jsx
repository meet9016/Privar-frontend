import React, { useState, useMemo, useCallback } from 'react'
import AdminCrudPage from './AdminCrudPage'
import GalleryPage from './GalleryPage'
import { GALLERY_ENDPOINTS, BIRTHDAY_ENDPOINTS, JOB_VACANCY_ENDPOINTS, MATRIMONY_ENDPOINTS, FEEDBACK_ENDPOINTS, MASTER_ENDPOINTS } from '../utils/endpoints'
import { formatDate } from '../lib/api'
import usePermissions from '../hooks/usePermissions'
import Input from '../components/common/Input'
import Select from '../components/common/Select'
import DatePicker from '../components/DatePicker'
import { Cake, Heart, Sparkles, PartyPopper, MessageCircle, Phone, Send, Users as UsersIcon, AlertTriangle, CheckCircle, ExternalLink } from 'lucide-react'
import { toast } from '../lib/toast'
import { getCommunityFullName } from '../lib/api'
import Modal from '../components/Modal'
import Button from '../components/common/Button'

export const isSameDayAndMonth = (dateStr) => {
  if (!dateStr) return false
  const str = String(dateStr).trim()
  if (!str) return false
  const today = new Date()
  const todayDay = today.getDate()
  const todayMonth = today.getMonth() + 1 // 1-indexed

  // Handle DD/MM/YYYY format
  if (str.includes('/')) {
    const parts = str.split('/')
    if (parts.length >= 2) {
      const d = parseInt(parts[0], 10)
      const m = parseInt(parts[1], 10)
      return d === todayDay && m === todayMonth
    }
  }

  // Handle YYYY-MM-DD or ISO string
  const d = new Date(dateStr)
  if (isNaN(d.getTime())) return false

  return (
    (d.getUTCDate() === todayDay && (d.getUTCMonth() + 1) === todayMonth) ||
    (d.getDate() === todayDay && (d.getMonth() + 1) === todayMonth)
  )
}

const definitions = {
  festivals: {
    title: 'Festivals',
    subtitle: 'Create and maintain festival announcements',
    endpoint: '/festivals',
    fields: [
      { name: 'title', label: 'Title', required: true },
      { name: 'festival_date', label: 'Festival Date', type: 'date', required: true },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
      { name: 'image', label: 'Image', type: 'file' },
      { name: 'status', label: 'Status', type: 'select', defaultValue: 1, options: [{ value: 1, label: 'Active' }, { value: 0, label: 'Inactive' }] }
    ],
    columns: [
      { key: 'image', label: 'Image', type: 'image' },
      { key: 'title', label: 'Title' },
      { key: 'festival_date', label: 'Date', render: (row) => formatDate(row.festival_date) },
      { key: 'status', label: 'Status' }
    ]
  },
  events: {
    title: 'Events',
    subtitle: 'Manage event listings and calendar details',
    endpoint: '/content/events',
    fields: [
      { name: 'title', label: 'Title' },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'event_date', label: 'Event Date', type: 'date' },
      { name: 'event_location', label: 'Location', fallback: 'venue' },
      { name: 'event_category_name', label: 'Category' },
      { name: 'entry_type', label: 'Entry Type' },
      { name: 'image', label: 'Image', type: 'file' }
    ],
    columns: [
      { key: 'image', label: 'Image', type: 'image' },
      { key: 'title', label: 'Event' },
      { key: 'event_date', label: 'Date' },
      { key: 'event_location', label: 'Location' }
    ]
  },
  matrimonies: {
    title: 'Matrimonies',
    subtitle: 'Create and manage matrimony profiles',
    endpoint: MATRIMONY_ENDPOINTS.GET_MATRIMONIES,
    hideFilter: true,
    fields: [
      // Row 1: Basic Info (4 fields)
      { name: 'full_name', label: 'Full Name', required: true },
      { name: 'middle_name', label: 'Middle Name', required: true },
      {
        name: 'gender',
        label: 'Gender',
        type: 'select',
        options: [
          { value: 'Male', label: 'Male' },
          { value: 'Female', label: 'Female' },
          { value: 'Other', label: 'Other' }
        ]
      },
      { name: 'birthdate', label: 'Birthdate', type: 'date' },

      // Row 2: Physical & Contact (4 fields)
      {
        name: 'marital_status',
        label: 'Marital Status',
        type: 'select',
        options: [
          { value: 'Single', label: 'Single' },
          { value: 'Never Married', label: 'Never Married' },
          { value: 'Divorced', label: 'Divorced' },
          { value: 'Widowed', label: 'Widowed' },
          { value: 'Awaiting Divorce', label: 'Awaiting Divorce' }
        ]
      },
      { name: 'height', label: 'Height' },
      { name: 'weight', label: 'Weight' },
      { name: 'mobile_number', label: 'Mobile Number' },

      // Row 3: Location Info (Cascading)
      { name: 'country', label: 'Country', type: 'select-remote', source: MASTER_ENDPOINTS.COUNTRY, labelKey: 'name', valueKey: 'name' },
      { name: 'state', label: 'State', type: 'select-remote', source: MASTER_ENDPOINTS.STATE, labelKey: 'name', valueKey: 'name', required: true },
      { name: 'district', label: 'District', type: 'select-remote', source: MASTER_ENDPOINTS.DISTRICT, labelKey: 'name', valueKey: 'name', required: true },
      { name: 'city', label: 'City', type: 'select-remote', source: MASTER_ENDPOINTS.CITY, labelKey: 'name', valueKey: 'name', required: true },
      { name: 'village', label: 'Village', type: 'select-remote', source: MASTER_ENDPOINTS.VILLAGE, labelKey: 'name', valueKey: 'name' },

      // Row 4: Education & Parents (4 fields)
      { name: 'education', label: 'Education', required: true },
      { name: 'occupation', label: 'Occupation', required: true },
      { name: 'father_name', label: 'Father Name', required: true },
      { name: 'mother_name', label: 'Mother Name', required: true },

      // Row 5: Community & Status (4 fields)
      {
        name: 'complexion',
        label: 'Complexion',
        type: 'select',
        options: [
          { value: 'Fair', label: 'Fair' },
          { value: 'Wheatish', label: 'Wheatish' },
          { value: 'Dark', label: 'Dark' }
        ]
      },
      { name: 'gotra', label: 'Gotra' },
      {
        name: 'family_type',
        label: 'Family Type',
        type: 'select',
        options: [
          { value: 'Joint Family', label: 'Joint Family' },
          { value: 'Nuclear Family', label: 'Nuclear Family' }
        ]
      },
      { name: 'status', label: 'Status', type: 'select', defaultValue: 1, options: [{ value: 1, label: 'Approved' }, { value: 0, label: 'Inactive' }] },

      // Row 6: About (Full 4-column row)
      { name: 'about', label: 'About', type: 'textarea', className: 'sm:col-span-2 md:col-span-4' },

      // Row 7: Files (2 columns each)
      { name: 'biodata', label: 'Biodata (PDF/Image)', type: 'file', accept: 'image/*,application/pdf', className: 'sm:col-span-1 md:col-span-2' },
      { name: 'person_image', label: 'Person Image', type: 'file', className: 'sm:col-span-1 md:col-span-2' }
    ],
    columns: [
      { key: 'person_image', label: 'Photo', type: 'image' },
      { key: 'full_name', label: 'Name' },
      { key: 'gender', label: 'Gender' },
      { key: 'birthdate', label: 'Birthdate', render: (row) => {
        if (!row.birthdate) return '-'
        const d = new Date(row.birthdate)
        if (isNaN(d.getTime())) return row.birthdate
        const day = String(d.getDate()).padStart(2, '0')
        const month = String(d.getMonth() + 1).padStart(2, '0')
        return `${day}/${month}/${d.getFullYear()}`
      }},
      { key: 'marital_status', label: 'Status' },
      { key: 'location', label: 'Location', render: (row) => [row.village, row.city, row.district, row.state].filter(Boolean).join(', ') || row.city || '-' },
      { key: 'mobile_number', label: 'Mobile' }
    ]
  },
  gallery: {
    title: 'Gallery',
    subtitle: 'Maintain gallery images and categories',
    endpoint: GALLERY_ENDPOINTS.GET_GALLERY,
    fields: [
      { name: 'category', label: 'Category' },
      { name: 'year', label: 'Year' },
      { name: 'images', label: 'Images', type: 'file', multiple: true }
    ],
    columns: [
      { key: 'images', label: 'Images', type: 'image' },
      { key: 'title', label: 'Title' },
      { key: 'category', label: 'Category' },
      { key: 'year', label: 'Year' }
    ]
  },
  feedback: {
    title: 'Feedback',
    subtitle: 'Manage user feedback and suggestions',
    endpoint: FEEDBACK_ENDPOINTS.GET_FEEDBACK,
    hideAdd: true,
    hideActions: true,
    fields: [
      { name: 'name', label: 'Name', required: true },
      { name: 'email', label: 'Email', type: 'email', required: true },
      { name: 'message', label: 'Message', type: 'textarea', required: true }
    ],
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'email', label: 'Email' },
      { key: 'message', label: 'Message' }
    ]
  },
  birthday: {
    title: 'Birthdays',
    subtitle: 'View and manage member birthdays and anniversaries',
    endpoint: BIRTHDAY_ENDPOINTS.GET_BIRTHDAYS,
    hideAdd: true,
    hideActions: true,
    fields: [{ name: 'name', label: 'Name', disabled: true }, { name: 'dob', label: 'Date of Birth', type: 'date', required: true }, { name: 'anniversary', label: 'Anniversary', type: 'date' }],
    columns: [
      {
        key: 'name',
        label: 'Name',
        render: (row) => {
          const isBday = isSameDayAndMonth(row.dob)
          const isAnniv = isSameDayAndMonth(row.anniversary)
          const phone = row.number || row.mobile || row.phone || row.mobile_number || ''
          const cleanPhone = String(phone).replace(/\D/g, '')

          const handleSendWhatsApp = (e) => {
            e.stopPropagation()
            if (!cleanPhone) {
              toast.error(`Phone number not available for ${row.name || 'this member'}`)
              return
            }
            
            const communityName = getCommunityFullName() || 'Our Parivar Community'
            let greeting = ''
            if (isBday && isAnniv) {
              greeting = `🎉🎂 Wishing you a very Happy Birthday and Happy Wedding Anniversary, ${row.name}! May your life be filled with happiness, health and success. Best wishes from ${communityName}! 💐✨`
            } else if (isBday) {
              greeting = `🎂 Wishing you a very Happy Birthday, ${row.name}! May God bless you with abundant health, prosperity, and joy on this special day. Best wishes from ${communityName}! 💐🎉`
            } else if (isAnniv) {
              greeting = `💖 Wishing you a very Happy Wedding Anniversary, ${row.name}! May your bond and love grow stronger with every passing year. Best wishes from ${communityName}! 💐💑`
            } else {
              greeting = `Hello ${row.name}, greetings from ${communityName}!`
            }

            const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone
            const url = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(greeting)}`
            window.open(url, '_blank')
          }

          return (
            <div className="flex items-center gap-2 flex-nowrap whitespace-nowrap">
              <span className="font-semibold text-text">{row.name || '-'}</span>
              {(isBday || isAnniv) && (
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="inline-flex items-center justify-center p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer active:scale-95"
                  title={cleanPhone ? `Send WhatsApp greeting to ${cleanPhone}` : 'No phone number available'}
                >
                  <MessageCircle className="w-3.5 h-3.5 fill-white stroke-emerald-500" />
                </button>
              )}
            </div>
          )
        }
      },
      {
        key: 'dob',
        label: 'Date of Birth',
        render: (row) => {
          if (!row.dob) return '-'
          const isBday = isSameDayAndMonth(row.dob)
          return (
            <div className="flex items-center gap-1.5 flex-nowrap whitespace-nowrap">
              <span>{formatDate(row.dob)}</span>
              {isBday && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-800 dark:text-amber-300 font-bold text-xs border border-amber-500/30 shadow-2xs whitespace-nowrap shrink-0">
                  <Cake className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                  <span>Today!</span>
                </span>
              )}
            </div>
          )
        }
      },
      {
        key: 'age',
        label: 'Age',
        render: (row) => {
          if (!row.dob) return '-'
          const birth = new Date(row.dob)
          const today = new Date()
          let years = today.getFullYear() - birth.getFullYear()
          let months = today.getMonth() - birth.getMonth()
          let days = today.getDate() - birth.getDate()
          if (days < 0) {
            months--
            days += new Date(today.getFullYear(), today.getMonth(), 0).getDate()
          }
          if (months < 0) { years--; months += 12 }
          
          const parts = []
          if (years > 0) parts.push({ label: years === 1 ? 'Year' : 'Years', value: String(years).padStart(2, '0') })
          if (months > 0) parts.push({ label: months === 1 ? 'Month' : 'Months', value: String(months).padStart(2, '0') })
          if (days > 0) parts.push({ label: days === 1 ? 'Day' : 'Days', value: String(days).padStart(2, '0') })
          if (parts.length === 0) parts.push({ label: 'Days', value: '00' })

          return (
            <div className="flex items-center gap-1.5 flex-wrap">
              {parts.map((p, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold whitespace-nowrap shadow-sm bg-primary/15 border border-primary/20 text-primary-dark">
                  <span>{p.value}</span>
                  <span className="text-[10px] opacity-75 font-semibold">{p.label}</span>
                </span>
              ))}
            </div>
          )
        }
      },
      {
        key: 'anniversary',
        label: 'Anniversary Date',
        render: (row) => {
          if (!row.anniversary) return '-'
          const isAnniv = isSameDayAndMonth(row.anniversary)
          return (
            <div className="flex items-center gap-1.5 flex-nowrap whitespace-nowrap">
              <span>{formatDate(row.anniversary)}</span>
              {isAnniv && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-800 dark:text-rose-300 font-bold text-xs border border-rose-500/30 shadow-2xs whitespace-nowrap shrink-0">
                  <Heart className="w-3.5 h-3.5 fill-rose-500 text-rose-500 shrink-0" />
                  <span>Today!</span>
                </span>
              )}
            </div>
          )
        }
      },
      {
        key: 'married_for',
        label: 'Time Married',
        render: (row) => {
          if (!row.anniversary) return '-'
          const ann = new Date(row.anniversary)
          const today = new Date()
          let years = today.getFullYear() - ann.getFullYear()
          let months = today.getMonth() - ann.getMonth()
          let days = today.getDate() - ann.getDate()
          if (days < 0) {
            months--
            days += new Date(today.getFullYear(), today.getMonth(), 0).getDate()
          }
          if (months < 0) { years--; months += 12 }
          if (years < 0) return '-'
          
          const parts = []
          if (years > 0) parts.push({ label: years === 1 ? 'Year' : 'Years', value: String(years).padStart(2, '0') })
          if (months > 0) parts.push({ label: months === 1 ? 'Month' : 'Months', value: String(months).padStart(2, '0') })
          if (days > 0) parts.push({ label: days === 1 ? 'Day' : 'Days', value: String(days).padStart(2, '0') })
          
          if (parts.length === 0) {
            parts.push({ label: 'Days', value: '00' })
          }

          return (
            <div className="flex items-center gap-1.5 flex-wrap">
              {parts.map((p, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold whitespace-nowrap shadow-sm bg-primary/15 border border-primary/20 text-primary-dark">
                  <span>{p.value}</span>
                  <span className="text-[10px] opacity-75 font-semibold">{p.label}</span>
                </span>
              ))}
            </div>
          )
        }
      }
    ]
  },
  'job-vacancy': {
    title: 'Job Vacancy',
    subtitle: 'Post and manage job vacancy listings',
    endpoint: JOB_VACANCY_ENDPOINTS.GET_VACANCIES,
    gridCols: 'md:grid-cols-2',
    fields: [
      { name: 'title', label: 'Title', required: true, className: 'md:col-span-1' },
      { name: 'company_name', label: 'Company Name', required: true, className: 'md:col-span-1' },
      { name: 'description', label: 'Description', type: 'textarea', rows: 4, required: true, className: 'md:col-span-1' },
      { name: 'image', label: 'Image', type: 'file', className: 'md:col-span-1 md:row-span-2 [&>div]:h-[calc(100%-6px)] [&>div]:min-h-[140px]' },
      { name: 'qualifications', label: 'Qualifications', type: 'textarea', rows: 4, required: true, className: 'md:col-span-1' },
      { name: 'location', label: 'Location', required: true, className: 'md:col-span-1' }, 
      { name: 'job_type', label: 'Job Type', type: 'select', required: true, className: 'md:col-span-1',
        options: [{ value: "full-time", label: 'Full Time' }, { value: "part-time", label: 'Part Time' }, { value: "contract", label: 'Contract' }, { value: "internship", label: 'Internship' }]},
      { name: 'contact_number', label: 'Contact Number', required: true, className: 'md:col-span-1' },
      { name: 'status', label: 'Status', type: 'select', required: true, className: 'md:col-span-1', options: [{ value: 1, label: 'Approved' }, { value: 0, label: 'Inactive' }] },
      { name: 'salary', label: 'Salary', required: true, className: 'md:col-span-1' },
      { name: 'contact_email', label: 'Contact Email', type: 'email', required: true, className: 'md:col-span-1' }
    ],
    columns: [
      { key: 'title', label: 'Title', className: 'min-w-[150px]' },
      { key: 'company_name', label: 'Company', className: 'min-w-[150px]' },
      { key: 'qualifications', label: 'Qualifications', className: 'min-w-[200px]' },
      { key: 'image', label: 'Image', type: 'image', className: 'min-w-[80px]' },
      { key: 'contact_number', label: 'Number', className: 'min-w-[120px]' },
      { key: 'job_type', label: 'Job Type', className: 'min-w-[120px]' },
      { key: 'status', label: 'Status', className: 'min-w-[100px]' }
    ]
  },
  'bank-details': {
    title: 'Bank Details',
    subtitle: 'Manage bank accounts for donations',
    endpoint: MASTER_ENDPOINTS.BANK_DETAILS,
    fields: [
      { name: 'bank_name', label: 'Bank Name', required: true },
      { name: 'account_name', label: 'Account Name', required: true },
      { name: 'account_number', label: 'Account Number', required: true },
      { name: 'ifsc_code', label: 'IFSC Code', required: true },
      { name: 'branch', label: 'Branch', required: true },
      { name: 'upi_link', label: 'UPI Link' },
      { name: 'qr_code', label: 'QR Code', type: 'file' },
      { name: 'status', label: 'Status', type: 'select', defaultValue: 1, options: [{ value: 1, label: 'Active' }, { value: 0, label: 'Inactive' }] }
    ],
    columns: [  
      { key: 'bank_name', label: 'Bank Name' },
      { key: 'account_name', label: 'Account Name' },
      { key: 'account_number', label: 'Account Number' },
      { key: 'status', label: 'Status' }
    ]
  }
}

export default function ContentPage({ type, headerLeftContent }) {
  const permissions = usePermissions(type === 'birthday' ? 'members' : type === 'donation' ? 'donations' : type)

  // Applied states
  const [appliedMonth, setAppliedMonth] = useState('')
  const [appliedYear, setAppliedYear] = useState('')
  const [appliedStart, setAppliedStart] = useState('')
  const [appliedEnd, setAppliedEnd] = useState('')

  // Draft states
  const [draftMonth, setDraftMonth] = useState('')
  const [draftYear, setDraftYear] = useState('')
  const [draftStart, setDraftStart] = useState('')
  const [draftEnd, setDraftEnd] = useState('')

  const handleApply = () => {
    setAppliedMonth(draftMonth)
    setAppliedYear(draftYear)
    setAppliedStart(draftStart)
    setAppliedEnd(draftEnd)
  }

  const handleClear = () => {
    setDraftMonth('')
    setDraftYear('')
    setDraftStart('')
    setDraftEnd('')
    setAppliedMonth('')
    setAppliedYear('')
    setAppliedStart('')
    setAppliedEnd('')
  }

  const handleToggle = () => {
    setDraftMonth(appliedMonth)
    setDraftYear(appliedYear)
    setDraftStart(appliedStart)
    setDraftEnd(appliedEnd)
  }

  const birthdayExtraParams = useMemo(() => {
    const params = {}
    if (appliedMonth) params.dob_month = appliedMonth
    if (appliedYear) params.dob_year = appliedYear
    if (appliedStart) params.dob_start = appliedStart
    if (appliedEnd) params.dob_end = appliedEnd
    return params
  }, [appliedMonth, appliedYear, appliedStart, appliedEnd])

  const extraCount = [appliedMonth, appliedYear, appliedStart, appliedEnd].filter(Boolean).length

  if (type === 'gallery') {
    return <GalleryPage headerLeftContent={headerLeftContent} />
  }

  if (!definitions[type]) {
    return (
      <div className="rounded-xl border border-error-border bg-error-bg p-6 text-sm text-error-text">
        Unknown content menu selected.
      </div>
    )
  }

  const customFilters = type === 'birthday' ? (
    <div className="space-y-4 mb-4">
      <Select
        label="Birth Month"
        value={draftMonth}
        onChange={setDraftMonth}
        options={[
          { value: '', label: 'All Months' },
          { value: '1', label: 'January' },
          { value: '2', label: 'February' },
          { value: '3', label: 'March' },
          { value: '4', label: 'April' },
          { value: '5', label: 'May' },
          { value: '6', label: 'June' },
          { value: '7', label: 'July' },
          { value: '8', label: 'August' },
          { value: '9', label: 'September' },
          { value: '10', label: 'October' },
          { value: '11', label: 'November' },
          { value: '12', label: 'December' }
        ]}
      />
      <Input
        label="Birth Year"
        type="number"
        placeholder="e.g. 1995"
        value={draftYear}
        onChange={(e) => setDraftYear(e.target.value.replace(/\D/g, ''))}
      />
      <div className="grid grid-cols-2 gap-2">
        <DatePicker
          label="From DOB"
          placeholder="Start Date"
          value={draftStart}
          onChange={setDraftStart}
        />
        <DatePicker
          label="To DOB"
          placeholder="End Date"
          value={draftEnd}
          onChange={setDraftEnd}
        />
      </div>
    </div>
  ) : null

  // Bulk WhatsApp Wish Modal State
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false)
  const [birthdayRows, setBirthdayRows] = useState([])
  const [customWishMsg, setCustomWishMsg] = useState('')
  const [sentMap, setSentMap] = useState({})

  const todayCelebrants = useMemo(() => {
    return birthdayRows.filter(r => isSameDayAndMonth(r.dob) || isSameDayAndMonth(r.anniversary))
  }, [birthdayRows])

  const transformData = useCallback((data) => {
    if (type !== 'birthday') return data
    setBirthdayRows(data)
    // Sort items: today's birthdays or anniversaries first
    return [...data].sort((a, b) => {
      const aToday = isSameDayAndMonth(a.dob) || isSameDayAndMonth(a.anniversary)
      const bToday = isSameDayAndMonth(b.dob) || isSameDayAndMonth(b.anniversary)
      if (aToday && !bToday) return -1
      if (!aToday && bToday) return 1
      return 0
    })
  }, [type])

  const rowClassName = useCallback((row) => {
    if (type !== 'birthday') return ''
    const isBday = isSameDayAndMonth(row.dob)
    const isAnniv = isSameDayAndMonth(row.anniversary)
    if (isBday && isAnniv) {
      return '!bg-linear-to-r !from-amber-500/10 !via-rose-500/10 !to-transparent hover:!bg-amber-500/15 border-l-4 border-l-amber-500 font-medium'
    }
    if (isBday) {
      return '!bg-amber-500/5 hover:!bg-amber-500/10 border-l-4 border-l-amber-500 font-medium'
    }
    if (isAnniv) {
      return '!bg-rose-500/5 hover:!bg-rose-500/10 border-l-4 border-l-rose-500 font-medium'
    }
    return ''
  }, [type])

  const handleOpenBulkModal = () => {
    if (todayCelebrants.length === 0) {
      toast.info('No birthdays or anniversaries today')
      return
    }
    const communityName = getCommunityFullName() || 'Our Parivar Community'
    setCustomWishMsg(`🎉 Wishing you a wonderful and blessed day filled with happiness, good health, and success! Best wishes from ${communityName}! 💐✨`)
    setIsBulkModalOpen(true)
  }

  const handleSendSingleWish = (member) => {
    const phone = member.number || member.mobile || member.phone || member.mobile_number || ''
    const cleanPhone = String(phone).replace(/\D/g, '')

    if (!cleanPhone) {
      toast.error(`Phone number not available for ${member.name || 'this member'}`)
      return
    }

    const isBday = isSameDayAndMonth(member.dob)
    const isAnniv = isSameDayAndMonth(member.anniversary)
    const communityName = getCommunityFullName() || 'Our Parivar Community'

    let greeting = customWishMsg
    if (!greeting) {
      if (isBday && isAnniv) {
        greeting = `🎉🎂 Wishing you a very Happy Birthday and Happy Wedding Anniversary, ${member.name}! May your life be filled with happiness, health and success. Best wishes from ${communityName}! 💐✨`
      } else if (isBday) {
        greeting = `🎂 Wishing you a very Happy Birthday, ${member.name}! May God bless you with abundant health, prosperity, and joy on this special day. Best wishes from ${communityName}! 💐🎉`
      } else if (isAnniv) {
        greeting = `💖 Wishing you a very Happy Wedding Anniversary, ${member.name}! May your bond and love grow stronger with every passing year. Best wishes from ${communityName}! 💐💑`
      } else {
        greeting = `Hello ${member.name}, greetings from ${communityName}!`
      }
    } else {
      greeting = `Dear ${member.name},\n\n${greeting}`
    }

    const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone
    const url = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(greeting)}`
    window.open(url, '_blank')
    setSentMap(prev => ({ ...prev, [member.id || member._id || member.name]: true }))
  }

  const customHeaderActions = type === 'birthday' ? (
    <Button
      onClick={handleOpenBulkModal}
      variant="primary"
      icon={<MessageCircle className="w-4 h-4 fill-white stroke-primary" />}
      className="!bg-emerald-600 hover:!bg-emerald-700 text-white font-bold h-10 shadow-sm whitespace-nowrap"
    >
      Wish All Today {todayCelebrants.length > 0 ? `(${todayCelebrants.length})` : ''}
    </Button>
  ) : null

  return (
    <>
      <AdminCrudPage 
        {...definitions[type]} 
        headerLeftContent={headerLeftContent}
        customHeaderActions={customHeaderActions}
        hideAdd={definitions[type].hideAdd || (!permissions.canAdd && !permissions.isSuperAdmin)}
        hideEdit={definitions[type].hideEdit || (!permissions.canEdit && !permissions.isSuperAdmin)}
        hideDelete={definitions[type].hideDelete || (type === 'birthday' ? (!permissions.canEdit && !permissions.isSuperAdmin) : (!permissions.canDelete && !permissions.isSuperAdmin))} 
        deleteAction={type === 'birthday' ? 'clear-dob' : undefined} 
        getRowTitle={(row) => row.title || row.full_name || row.subject || row.name} 
        extraParams={type === 'birthday' ? birthdayExtraParams : undefined}
        customFilters={customFilters}
        onClearFilters={type === 'birthday' ? handleClear : undefined}
        onApplyFilters={type === 'birthday' ? handleApply : undefined}
        onToggleFilters={type === 'birthday' ? handleToggle : undefined}
        extraActiveFiltersCount={type === 'birthday' ? extraCount : 0}
        transformData={type === 'birthday' ? transformData : undefined}
        rowClassName={type === 'birthday' ? rowClassName : undefined}
      />

      {/* Bulk WhatsApp Wish Modal */}
      {type === 'birthday' && (
        <Modal
          isOpen={isBulkModalOpen}
          title="Send WhatsApp Wishes (Today's Celebrations)"
          onClose={() => setIsBulkModalOpen(false)}
          maxWidth="max-w-3xl"
        >
          <div className="space-y-4">
            <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex items-start gap-3">
              <div className="p-2 rounded-xl bg-emerald-500 text-white shrink-0 mt-0.5 shadow-sm">
                <PartyPopper className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-sm text-text">
                  Today's Celebrations ({todayCelebrants.length} members)
                </h4>
                <p className="text-xs text-text-secondary mt-0.5">
                  Aap yahan se ek-ek karke sabhi members ko personalized WhatsApp shubh-kamna sandesh bhej sakte hain.
                </p>
              </div>
            </div>

            {/* Custom Greeting Message Box */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                Message Content (Customize if needed)
              </label>
              <textarea
                rows={3}
                value={customWishMsg}
                onChange={(e) => setCustomWishMsg(e.target.value)}
                placeholder="Enter greeting message..."
                className="w-full px-3.5 py-2.5 bg-input-bg text-text border border-border focus:border-primary/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all custom-scrollbar"
              />
            </div>

            {/* Celebrants List */}
            <div className="border border-border rounded-2xl overflow-hidden bg-card divide-y divide-border max-h-[380px] overflow-y-auto custom-scrollbar">
              {todayCelebrants.map((member, idx) => {
                const isBday = isSameDayAndMonth(member.dob)
                const isAnniv = isSameDayAndMonth(member.anniversary)
                const phone = member.number || member.mobile || member.phone || member.mobile_number || ''
                const cleanPhone = String(phone).replace(/\D/g, '')
                const memberKey = member.id || member._id || member.name || idx
                const isSent = !!sentMap[memberKey]

                return (
                  <div key={memberKey} className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-surface-secondary/40 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${isBday ? 'bg-amber-500/10 text-amber-600' : 'bg-rose-500/10 text-rose-600'}`}>
                        {isBday ? <Cake className="w-5 h-5" /> : <Heart className="w-5 h-5 fill-rose-500" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-text">{member.name || '-'}</span>
                          {isBday && (
                            <span className="px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-800 dark:text-amber-300 font-bold text-[11px]">
                              🎂 Birthday
                            </span>
                          )}
                          {isAnniv && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-500/15 text-rose-800 dark:text-rose-300 font-bold text-[11px]">
                              💖 Anniversary
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-xs text-text-secondary">
                          {cleanPhone ? (
                            <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-medium">
                              <Phone className="w-3 h-3" /> +91 {cleanPhone}
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-rose-500 font-semibold">
                              <AlertTriangle className="w-3 h-3" /> No Phone Number
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isSent && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 font-bold text-xs border border-emerald-500/20">
                          <CheckCircle className="w-3.5 h-3.5" /> Sent
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => handleSendSingleWish(member)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95 ${
                          cleanPhone
                            ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            : 'bg-surface-secondary text-text-secondary/60 hover:bg-surface-secondary/80 border border-border'
                        }`}
                      >
                        <MessageCircle className="w-3.5 h-3.5 fill-white stroke-emerald-600" />
                        <span>{cleanPhone ? 'Send WhatsApp' : 'No Number (Check)'}</span>
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="flex items-center justify-between pt-3 border-t border-border">
              <span className="text-xs text-text-secondary">
                Total: <span className="font-bold text-text">{todayCelebrants.length}</span> | Sent: <span className="font-bold text-emerald-600">{Object.keys(sentMap).length}</span>
              </span>
              <Button variant="outline" onClick={() => setIsBulkModalOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </>
  )
}
