import React, { useState, useMemo, useCallback } from 'react'
import AdminCrudPage from './AdminCrudPage'
import GalleryPage from './GalleryPage'
import { GALLERY_ENDPOINTS, BIRTHDAY_ENDPOINTS, DEATH_ENDPOINTS, JOB_VACANCY_ENDPOINTS, MATRIMONY_ENDPOINTS, FEEDBACK_ENDPOINTS, MASTER_ENDPOINTS } from '../utils/endpoints'
import { formatDate } from '../lib/api'
import usePermissions from '../hooks/usePermissions'
import Input from '../components/common/Input'
import Select from '../components/common/Select'
import DatePicker from '../components/DatePicker'
import { Cake, Heart, Sparkles, PartyPopper, MessageCircle, Phone, Send, Users as UsersIcon, AlertTriangle, CheckCircle, ExternalLink, Plus, Edit2, Trash2, Search, RefreshCw, User, Flower2 } from 'lucide-react'
import { toast } from '../lib/toast'
import { confirm } from '../lib/confirm'
import api, { getCommunityFullName, assetUrl } from '../lib/api'
import Modal from '../components/Modal'
import Button from '../components/common/Button'
import NocCertificateModal from '../components/NocCertificateModal'
import { FileCheck } from 'lucide-react'

const isSameDayAndMonth = (dateStr) => {
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
      { name: 'city', label: 'City', required: true },
      { name: 'education', label: 'Education', required: true },
      { name: 'occupation', label: 'Occupation', required: true },
      { name: 'father_name', label: 'Father Name', required: true },
      { name: 'mother_name', label: 'Mother Name', required: true },
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
      { name: 'about', label: 'About', type: 'textarea' },
      { name: 'biodata', label: 'Biodata (PDF/Image)', type: 'file', accept: 'image/*,application/pdf', className: 'md:col-span-1' },
      { name: 'person_image', label: 'Person Image', type: 'file', className: 'md:col-span-1' },
      { name: 'status', label: 'Status', type: 'select', defaultValue: 1, options: [{ value: 1, label: 'Approved' }, { value: 0, label: 'Inactive' }], className: 'md:col-span-2' }
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
      { key: 'city', label: 'City' },
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
  death: {
    title: 'Intekal & Barsi',
    subtitle: 'Marhum members, Namaz-e-Janaza, and Kabrastan details',
    endpoint: DEATH_ENDPOINTS.GET_DEATHS,
    hideAdd: true,
    hideActions: false,
    fields: [
      { name: 'name', label: 'Name', disabled: true },
      { name: 'death_date', label: 'Date of Intekal', type: 'date', required: true },
      { name: 'death_time', label: 'Time of Intekal' },
      { name: 'death_place', label: 'Place of Intekal' },
      { name: 'janaza_date', label: 'Namaz-e-Janaza Date', type: 'date' },
      { name: 'janaza_time', label: 'Janaza Time' },
      { name: 'janaza_place', label: 'Janaza Venue / Masjid' },
      { name: 'kabrastan', label: 'Kabrastan / Burial Place' },
      { name: 'death_note', label: 'Special Note / Dua', type: 'textarea' }
    ],
    columns: [
      {
        key: 'name',
        label: 'MARHUM MEMBER',
        render: (row) => {
          const isFemale = String(row.gender || '').toLowerCase() === 'female'
          const titlePrefix = isFemale ? 'Marhuma' : 'Marhum'
          const isToday = Boolean(row.is_today || isSameDayAndMonth(row.death_date))
          const phone = row.number || row.mobile || row.phone || row.mobile_number || ''
          const cleanPhone = String(phone).replace(/\D/g, '')

          const handleSendCondolence = (e) => {
            e.stopPropagation()
            const communityName = getCommunityFullName() || 'Our Jamat'
            const msg = `🤲 *Dua-e-Magfirat* 🕊️\n\nMay Allah grant magfirah to ${titlePrefix} *${row.name}*, elevate their ranks, and bless them with the highest place in Jannat-ul-Firdaus.\n\nMay Allah grant patience (Sabr-e-Jameel) to the family in this difficult time. Aameen! 🤲\n\n- *${communityName}*`
            if (cleanPhone) {
              const formattedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone
              const url = `https://api.whatsapp.com/send?phone=${formattedPhone}&text=${encodeURIComponent(msg)}`
              window.open(url, '_blank')
            } else {
              navigator.clipboard?.writeText(msg)
              toast.success('Dua-e-Magfirat message copied to clipboard!')
            }
          }

          return (
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center shrink-0 border transition-all ${
                isToday ? 'border-rose-500 ring-2 ring-rose-500/40 shadow-rose-500/20' : 'border-primary/30 shadow-xs'
              }`}>
                {row.profile_image || row.image ? (
                  <img src={assetUrl(row.profile_image || row.image)} alt={row.name} className="w-full h-full object-cover filter grayscale" />
                ) : (
                  <Flower2 className={`w-5 h-5 ${isToday ? 'text-rose-500 animate-pulse' : 'text-primary'}`} />
                )}
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-text truncate">
                    <span className={`${isToday ? 'text-rose-600 dark:text-rose-400 font-extrabold' : 'text-primary font-semibold'} text-xs mr-1`}>{titlePrefix}</span>
                    {row.name || '-'}
                  </span>
                  {isToday && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 font-black text-[10px] tracking-wide border border-rose-500/30 whitespace-nowrap animate-pulse">
                      Today
                    </span>
                  )}
                  {cleanPhone && (
                    <button
                      type="button"
                      onClick={handleSendCondolence}
                      className="inline-flex items-center justify-center p-1 rounded-md bg-primary/10 hover:bg-primary/20 text-primary border border-primary/20 transition-all cursor-pointer"
                      title={`Send WhatsApp Condolence to family (${cleanPhone})`}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="text-[11px] text-text-secondary truncate mt-0.5">
                  {row.relation ? `${row.relation} • ` : ''}{row.village || (row.family_head?.name ? `Head: ${row.family_head.name}` : '')}
                </div>
              </div>
            </div>
          )
        }
      },
      {
        key: 'death_date',
        label: 'INTEKAL',
        render: (row) => {
          if (!row.death_date) return '-'
          const isToday = Boolean(row.is_today || isSameDayAndMonth(row.death_date))
          const deathDate = new Date(row.death_date)
          const today = new Date()
          let years = today.getFullYear() - deathDate.getFullYear()
          let months = today.getMonth() - deathDate.getMonth()
          let days = today.getDate() - deathDate.getDate()
          if (days < 0) {
            months--
            days += new Date(today.getFullYear(), today.getMonth(), 0).getDate()
          }
          if (months < 0) { years--; months += 12 }

          let passedLabel = ''
          if (years > 0) passedLabel = `${years} ${years === 1 ? 'Year' : 'Years'}`
          else if (months > 0) passedLabel = `${months} ${months === 1 ? 'Month' : 'Months'}`
          else passedLabel = `${Math.max(days, 0)} Days`

          return (
            <div className="text-xs space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className={`font-bold ${isToday ? 'text-rose-600 dark:text-rose-400 font-extrabold' : 'text-text'}`}>
                  {formatDate(row.death_date)}
                </span>
                {row.death_time && <span className="text-[11px] text-text-secondary">({row.death_time})</span>}
                {isToday && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rose-500/15 text-rose-600 dark:text-rose-400 font-extrabold text-[10px] border border-rose-500/30 whitespace-nowrap shadow-xs animate-pulse">
                    🕯️ Today's Barsi
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[11px] text-text-secondary flex-wrap">
                {row.death_place && <span className="truncate max-w-[130px]">📍 {row.death_place}</span>}
                <span className="px-1.5 py-0.5 rounded-md bg-slate-500/10 border border-slate-500/15 text-text-secondary font-medium shrink-0">
                  ⏳ {passedLabel}
                </span>
              </div>
            </div>
          )
        }
      },
      {
        key: 'janaza_kabrastan',
        label: 'JANAZA & KABRASTAN',
        render: (row) => {
          const hasJanaza = row.janaza_date || row.janaza_time || row.janaza_place
          const hasKabr = row.kabrastan
          if (!hasJanaza && !hasKabr) return <span className="text-text-secondary text-xs">-</span>
          return (
            <div className="text-xs space-y-1">
              {hasJanaza && (
                <div className="font-medium text-text flex items-center gap-1.5 flex-wrap">
                  <span className="text-primary font-semibold">🕌 {row.janaza_date ? formatDate(row.janaza_date) : ''}</span>
                  {row.janaza_time && <span className="text-[11px] text-text-secondary">({row.janaza_time})</span>}
                  {row.janaza_place && <span className="text-[11px] text-text-secondary truncate max-w-[150px]" title={row.janaza_place}>• 📍 {row.janaza_place}</span>}
                </div>
              )}
              {hasKabr && (
                <div className="text-[11px] text-text font-medium flex items-center gap-1 truncate max-w-[200px]" title={row.kabrastan}>
                  <span>🌿</span>
                  <span>{row.kabrastan}</span>
                </div>
              )}
            </div>
          )
        }
      },
      {
        key: 'death_note',
        label: 'DUA & REMARKS',
        render: (row) => {
          if (!row.death_note) return <span className="text-text-secondary text-xs">-</span>
          return (
            <div className="text-xs text-text-secondary max-w-[240px] truncate flex items-center gap-1.5" title={row.death_note}>
              <span>🤲</span>
              <span className="italic">{row.death_note}</span>
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
  const [refreshTrigger, setRefreshTrigger] = useState(0)

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

  const deathExtraParams = useMemo(() => {
    const params = {
      _t: refreshTrigger
    }
    if (appliedMonth) params.death_month = appliedMonth
    if (appliedYear) params.death_year = appliedYear
    if (appliedStart) params.death_from = appliedStart
    if (appliedEnd) params.death_to = appliedEnd
    return params
  }, [appliedMonth, appliedYear, appliedStart, appliedEnd, refreshTrigger])

  const extraCount = [appliedMonth, appliedYear, appliedStart, appliedEnd].filter(Boolean).length

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
    if (!Array.isArray(data)) return []
    if (type === 'birthday') {
      setBirthdayRows(data)
      // Sort items: today's birthdays or anniversaries first
      return [...data].sort((a, b) => {
        const aToday = isSameDayAndMonth(a.dob) || isSameDayAndMonth(a.anniversary)
        const bToday = isSameDayAndMonth(b.dob) || isSameDayAndMonth(b.anniversary)
        if (aToday && !bToday) return -1
        if (!aToday && bToday) return 1
        return 0
      })
    }
    if (type === 'death') {
      // Sort items: today's intekal or barsi (same day and month as today) to the VERY TOP
      return [...data].sort((a, b) => {
        const aToday = Boolean(a.is_today || isSameDayAndMonth(a.death_date))
        const bToday = Boolean(b.is_today || isSameDayAndMonth(b.death_date))
        if (aToday && !bToday) return -1
        if (!aToday && bToday) return 1
        const aTime = a.death_date ? new Date(a.death_date).getTime() : 0
        const bTime = b.death_date ? new Date(b.death_date).getTime() : 0
        return bTime - aTime
      })
    }
    return data
  }, [type])

  const rowClassName = useCallback((row) => {
    if (type === 'birthday') {
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
    }
    if (type === 'death') {
      const isToday = Boolean(row.is_today || isSameDayAndMonth(row.death_date))
      if (isToday) {
        return '!bg-linear-to-r !from-rose-500/15 !via-primary/5 !to-transparent hover:!bg-rose-500/20 border-l-4 border-l-rose-500 font-semibold shadow-xs'
      }
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

  // Death / Intekal Modal State & Handlers
  const [deathModalOpen, setDeathModalOpen] = useState(false)
  const [deathModalMode, setDeathModalMode] = useState('add') // 'add' | 'edit'
  const [selectedDeathMember, setSelectedDeathMember] = useState(null)
  const [isManualEntry, setIsManualEntry] = useState(false)
  const [manualMember, setManualMember] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    gender: 'Male',
    number: '',
    village: '',
    relation: ''
  })
  const [deathFormData, setDeathFormData] = useState({
    death_date: '',
    death_time: '',
    death_place: '',
    janaza_date: '',
    janaza_time: '',
    janaza_place: '',
    kabrastan: '',
    death_note: ''
  })
  const [savingDeath, setSavingDeath] = useState(false)
  const [deathSearchQuery, setDeathSearchQuery] = useState('')
  const [memberOptions, setMemberOptions] = useState([])
  const [searchingMembers, setSearchingMembers] = useState(false)

  const handleSearchMembers = async (q) => {
    setDeathSearchQuery(q)
    if (!q || q.trim().length < 2) {
      setMemberOptions([])
      return
    }
    setSearchingMembers(true)
    try {
      const res = await api.get('/users', { params: { search: q.trim(), limit: 12 } })
      const data = res.data?.data || res.data || []
      setMemberOptions(Array.isArray(data) ? data : [])
    } catch (err) {
      console.error('Failed to search members', err)
    } finally {
      setSearchingMembers(false)
    }
  }

  const handleOpenAddDeathModal = () => {
    setDeathModalMode('add')
    setSelectedDeathMember(null)
    setDeathSearchQuery('')
    setMemberOptions([])
    setIsManualEntry(false)
    setManualMember({
      first_name: '',
      middle_name: '',
      last_name: '',
      gender: 'Male',
      number: '',
      village: '',
      relation: ''
    })
    setDeathFormData({
      death_date: new Date().toISOString().split('T')[0],
      death_time: '',
      death_place: '',
      janaza_date: '',
      janaza_time: '',
      janaza_place: '',
      kabrastan: '',
      death_note: ''
    })
    setDeathModalOpen(true)
  }

  const handleOpenEditDeathModal = (row) => {
    setDeathModalMode('edit')
    setSelectedDeathMember(row)
    setIsManualEntry(false)
    setDeathFormData({
      death_date: row.death_date ? (row.death_date.includes('T') ? row.death_date.split('T')[0] : row.death_date) : '',
      death_time: row.death_time || '',
      death_place: row.death_place || '',
      janaza_date: row.janaza_date ? (row.janaza_date.includes('T') ? row.janaza_date.split('T')[0] : row.janaza_date) : '',
      janaza_time: row.janaza_time || '',
      janaza_place: row.janaza_place || '',
      kabrastan: row.kabrastan || '',
      death_note: row.death_note || ''
    })
    setDeathModalOpen(true)
  }

  const handleSaveDeath = async (e) => {
    e?.preventDefault()
    if (!isManualEntry && !selectedDeathMember) {
      toast.error('Please select an existing member or choose manual entry')
      return
    }
    if (isManualEntry && !manualMember.first_name.trim()) {
      toast.error('First name is required for manual entry')
      return
    }
    if (!deathFormData.death_date) {
      toast.error('Date of Intekal is required')
      return
    }

    setSavingDeath(true)
    try {
      const deathPayload = {
        is_deceased: true,
        death_date: deathFormData.death_date,
        death_time: deathFormData.death_time,
        death_place: deathFormData.death_place,
        janaza_date: deathFormData.janaza_date || null,
        janaza_time: deathFormData.janaza_time,
        janaza_place: deathFormData.janaza_place,
        kabrastan: deathFormData.kabrastan,
        death_note: deathFormData.death_note
      }

      if (isManualEntry && deathModalMode === 'add') {
        await api.post('/users', {
          first_name: manualMember.first_name.trim(),
          middle_name: manualMember.middle_name.trim(),
          last_name: manualMember.last_name.trim(),
          gender: manualMember.gender || 'Male',
          number: manualMember.number ? manualMember.number.trim() : '',
          village: manualMember.village.trim(),
          relation: 'Self',
          familyHead: true,
          ...deathPayload
        })
      } else {
        const memberId = selectedDeathMember.id || selectedDeathMember._id
        await api.put(`/users/${memberId}`, deathPayload)
      }

      toast.success(deathModalMode === 'edit' ? 'Intekal details updated successfully' : 'Intekal recorded successfully')
      setDeathModalOpen(false)
      setRefreshTrigger(prev => prev + 1)
    } catch (err) {
      console.error('Save Intekal Error:', err)
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to save intekal record')
    } finally {
      setSavingDeath(false)
    }
  }

  const handleClearDeath = async (row) => {
    const isFemale = String(row.gender || '').toLowerCase() === 'female'
    const prefix = isFemale ? 'Marhuma' : 'Marhum'
    const memberName = `${prefix} ${row.name || 'this member'}`
    const confirmed = await confirm(`Are you sure you want to remove ${memberName} from Intekal records? This will restore their active member status in the Jamat.`, {
      confirmText: 'Remove',
      cancelText: 'Cancel',
      type: 'danger'
    })
    if (!confirmed) {
      return
    }
    try {
      const memberId = row._id || row.id
      try {
        await api.put(`/users/${memberId}`, {
          is_deceased: false,
          death_date: null,
          death_time: '',
          death_place: '',
          janaza_date: null,
          janaza_time: '',
          janaza_place: '',
          kabrastan: '',
          death_note: ''
        }, {
          headers: { 'Content-Type': 'application/json' }
        })
      } catch (putErr) {
        // Fallback: If this was a manual entry deceased record or cannot be restored, remove directly
        await api.delete(`/users/${memberId}`)
      }
      toast.success(`${memberName} removed from Intekal successfully`)
      setRefreshTrigger(prev => prev + 1)
    } catch (err) {
      console.error('Failed to remove intekal record:', err)
      toast.error(err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to remove intekal record')
    }
  }

  const deathRowActions = type === 'death' ? (row) => (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => handleOpenEditDeathModal(row)}
        className="p-2 text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl transition-all cursor-pointer"
        title="Edit Intekal & Janaza Details"
      >
        <Edit2 className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => handleClearDeath(row)}
        className="p-2 text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-all cursor-pointer"
        title="Remove from Intekal Records (Restore Member)"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  ) : undefined

  const customHeaderActions = useMemo(() => {
    if (type === 'birthday') {
      return (
        <Button
          onClick={handleOpenBulkModal}
          variant="primary"
          icon={<MessageCircle className="w-4 h-4 fill-white stroke-primary" />}
          className="!bg-emerald-600 hover:!bg-emerald-700 text-white font-bold h-10 shadow-sm whitespace-nowrap cursor-pointer"
        >
          Wish All Today {todayCelebrants.length > 0 ? `(${todayCelebrants.length})` : ''}
        </Button>
      )
    }
    if (type === 'death') {
      return (
        <Button
          onClick={handleOpenAddDeathModal}
          variant="primary"
          icon={<Plus className="w-4 h-4" />}
          className="h-10 shadow-sm whitespace-nowrap cursor-pointer font-bold"
        >
          Record Death
        </Button>
      )
    }
    return null
  }, [type, todayCelebrants.length])

  // Marriage NOC Certificate State
  const [nocModalOpen, setNocModalOpen] = useState(false)
  const [selectedNocMember, setSelectedNocMember] = useState(null)

  const handleOpenNocModal = (row) => {
    setSelectedNocMember(row)
    setNocModalOpen(true)
  }

  const matrimonyRowActions = type === 'matrimonies' ? (row) => (
    <button
      type="button"
      onClick={() => handleOpenNocModal(row)}
      className="p-2 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl transition-all cursor-pointer"
      title="Generate Marriage NOC Certificate"
    >
      <FileCheck className="w-3.5 h-3.5" />
    </button>
  ) : undefined

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

  return (
    <>
      <AdminCrudPage 
        key={`crud-${type}-${refreshTrigger}`}
        refreshTrigger={refreshTrigger}
        {...definitions[type]} 
        headerLeftContent={headerLeftContent}
        customHeaderActions={customHeaderActions}
        customRowActions={type === 'matrimonies' ? matrimonyRowActions : (type === 'death' ? deathRowActions : undefined)}
        hideAdd={definitions[type].hideAdd || (!permissions.canAdd && !permissions.isSuperAdmin)}
        hideEdit={definitions[type].hideEdit || (type === 'death' ? true : (!permissions.canEdit && !permissions.isSuperAdmin))}
        hideDelete={definitions[type].hideDelete || (type === 'birthday' ? (!permissions.canEdit && !permissions.isSuperAdmin) : (type === 'death' ? true : (!permissions.canDelete && !permissions.isSuperAdmin)))} 
        deleteAction={type === 'birthday' ? 'clear-dob' : (type === 'death' ? 'clear-death' : undefined)} 
        getRowTitle={(row) => row.title || row.full_name || row.subject || row.name} 
        extraParams={type === 'birthday' ? birthdayExtraParams : (type === 'death' ? deathExtraParams : undefined)}
        customFilters={customFilters}
        onClearFilters={(type === 'birthday' || type === 'death') ? handleClear : undefined}
        onApplyFilters={(type === 'birthday' || type === 'death') ? handleApply : undefined}
        onToggleFilters={(type === 'birthday' || type === 'death') ? handleToggle : undefined}
        extraActiveFiltersCount={(type === 'birthday' || type === 'death') ? extraCount : 0}
        transformData={(type === 'birthday' || type === 'death') ? transformData : undefined}
        rowClassName={(type === 'birthday' || type === 'death') ? rowClassName : undefined}
      />

      {/* Record Intekal / Edit Death Modal */}
      {type === 'death' && (
        <Modal
          isOpen={deathModalOpen}
          title={deathModalMode === 'edit' ? 'Edit Intekal & Janaza Details' : 'Record Intekal'}
          onClose={() => setDeathModalOpen(false)}
          maxWidth="max-w-2xl"
        >
          <div className="space-y-4">
            {/* Mode Switch Tabs for Adding */}
            {deathModalMode === 'add' && (
              <div className="flex p-1 bg-surface-secondary/70 rounded-xl border border-border gap-1">
                <button
                  type="button"
                  onClick={() => setIsManualEntry(false)}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    !isManualEntry 
                      ? 'bg-primary text-white shadow-xs' 
                      : 'text-text-secondary hover:text-text'
                  }`}
                >
                  🔍 Select From Registered Members
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsManualEntry(true)
                    setSelectedDeathMember(null)
                  }}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                    isManualEntry 
                      ? 'bg-primary text-white shadow-xs' 
                      : 'text-text-secondary hover:text-text'
                  }`}
                >
                  ✍️ Add New / Manual Entry
                </button>
              </div>
            )}

            {/* Member Selection from List */}
            {!isManualEntry && (
              !selectedDeathMember ? (
                <div className="space-y-2">
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary">
                    Select Member *
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-text-secondary absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="Search member by name, mobile, or village..."
                      value={deathSearchQuery}
                      onChange={(e) => handleSearchMembers(e.target.value)}
                      className="w-full pl-9 pr-8 py-2.5 bg-input-bg text-text border border-border focus:border-primary/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all"
                      autoFocus
                    />
                    {searchingMembers && (
                      <RefreshCw className="w-4 h-4 text-primary animate-spin absolute right-3 top-1/2 -translate-y-1/2" />
                    )}
                  </div>

                  {memberOptions.length > 0 && (
                    <div className="max-h-48 overflow-y-auto border border-border rounded-xl divide-y divide-border bg-card shadow-lg custom-scrollbar">
                      {memberOptions.map((m) => {
                        const memberDisplayName = m.name || `${m.first_name || ''} ${m.middle_name || ''} ${m.last_name || ''}`.trim()
                        const isF = String(m.gender || '').toLowerCase() === 'female'
                        return (
                          <button
                            key={m.id || m._id}
                            type="button"
                            onClick={() => {
                              setSelectedDeathMember(m)
                              setMemberOptions([])
                            }}
                            className="w-full p-2.5 text-left flex items-center justify-between hover:bg-surface-secondary/70 transition-colors cursor-pointer"
                          >
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden flex items-center justify-center shrink-0">
                                {m.profile_image || m.image ? (
                                  <img src={assetUrl(m.profile_image || m.image)} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <User className="w-4 h-4 text-slate-500" />
                                )}
                              </div>
                              <div>
                                <div className="font-semibold text-sm text-text">
                                  <span className="text-xs text-primary mr-1 font-medium">{isF ? 'Marhuma' : 'Marhum'}</span>
                                  {memberDisplayName}
                                </div>
                                <div className="text-xs text-text-secondary">
                                  {m.number ? `📱 ${m.number} • ` : ''}{m.village || 'No village'}
                                </div>
                              </div>
                            </div>
                            <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-lg">Select</span>
                          </button>
                        )
                      })}
                    </div>
                  )}
                  {deathSearchQuery.trim().length >= 2 && memberOptions.length === 0 && !searchingMembers && (
                    <p className="text-xs text-text-secondary italic">No members found matching "${deathSearchQuery}". Try another name or phone number, or switch to manual entry above.</p>
                  )}
                </div>
              ) : (
                <div className="p-3.5 rounded-xl bg-surface-secondary/60 border border-border flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-300 dark:bg-slate-700 overflow-hidden flex items-center justify-center shrink-0 border border-primary/30">
                      {selectedDeathMember.profile_image || selectedDeathMember.image ? (
                        <img src={assetUrl(selectedDeathMember.profile_image || selectedDeathMember.image)} alt="" className="w-full h-full object-cover grayscale" />
                      ) : (
                        <Flower2 className="w-5 h-5 text-primary" />
                      )}
                    </div>
                    <div>
                      <div className="font-bold text-sm text-text flex items-center gap-1.5">
                        <span className="text-xs px-2 py-0.5 rounded-md bg-primary/15 text-primary font-semibold">
                          {String(selectedDeathMember.gender || '').toLowerCase() === 'female' ? 'Marhuma' : 'Marhum'}
                        </span>
                        <span>
                          {selectedDeathMember.name || `${selectedDeathMember.first_name || ''} ${selectedDeathMember.middle_name || ''} ${selectedDeathMember.last_name || ''}`.trim()}
                        </span>
                      </div>
                      <div className="text-xs text-text-secondary mt-0.5">
                        {selectedDeathMember.number ? `📱 ${selectedDeathMember.number} • ` : ''}
                        {selectedDeathMember.village ? `🏡 ${selectedDeathMember.village}` : ''}
                      </div>
                    </div>
                  </div>
                  {deathModalMode === 'add' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedDeathMember(null)}
                      className="text-xs"
                    >
                      Change Member
                    </Button>
                  )}
                </div>
              )
            )}

            {/* Manual Member Entry Form */}
            {isManualEntry && deathModalMode === 'add' && (
              <div className="p-3.5 rounded-xl bg-slate-500/5 border border-border space-y-3">
                <div className="font-semibold text-xs text-text uppercase tracking-wider flex items-center justify-between">
                  <span>✍️ Member Details</span>
                  <span className="text-[11px] text-primary font-bold">
                    {manualMember.gender === 'Female' ? 'Marhuma' : 'Marhum'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Input
                    label="First Name"
                    placeholder="e.g. Ahmed"
                    value={manualMember.first_name}
                    onChange={(e) => setManualMember(prev => ({ ...prev, first_name: e.target.value }))}
                    required
                  />
                  <Input
                    label="Father / Husband Name"
                    placeholder="e.g. Ibrahim"
                    value={manualMember.middle_name}
                    onChange={(e) => setManualMember(prev => ({ ...prev, middle_name: e.target.value }))}
                  />
                  <Input
                    label="Surname / Last Name"
                    placeholder="e.g. Memon"
                    value={manualMember.last_name}
                    onChange={(e) => setManualMember(prev => ({ ...prev, last_name: e.target.value }))}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <Select
                    label="Gender *"
                    value={manualMember.gender}
                    onChange={(val) => setManualMember(prev => ({ ...prev, gender: val }))}
                    options={[
                      { value: 'Male', label: 'Male (Marhum)' },
                      { value: 'Female', label: 'Female (Marhuma)' }
                    ]}
                  />
                  <Input
                    label="Family Phone / Contact"
                    placeholder="e.g. 9876543210 (Optional)"
                    value={manualMember.number}
                    onChange={(e) => setManualMember(prev => ({ ...prev, number: e.target.value }))}
                  />
                  <Input
                    label="Native / Village / City"
                    placeholder="e.g. Surat / Dhoraji"
                    value={manualMember.village}
                    onChange={(e) => setManualMember(prev => ({ ...prev, village: e.target.value }))}
                  />
                </div>
              </div>
            )}

            {/* Intekal & Funeral Details Form */}
            {(selectedDeathMember || isManualEntry) && (
              <form onSubmit={handleSaveDeath} className="space-y-4 pt-1">
                {/* 1. Intekal Details */}
                <div className="p-3.5 rounded-xl bg-slate-500/5 border border-border space-y-3">
                  <div className="font-semibold text-xs text-text uppercase tracking-wider flex items-center gap-1.5">
                    <span>🕊️ Intekal Details</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <DatePicker
                      label="Date of Intekal "
                      value={deathFormData.death_date}
                      onChange={(val) => setDeathFormData(prev => ({ ...prev, death_date: val }))}
                      required
                      placeholder="Select intekal date"
                    />
                    <Input
                      label="Time of Intekal"
                      placeholder="e.g. 05:30 AM / Morning 8:00 AM"
                      value={deathFormData.death_time}
                      onChange={(e) => setDeathFormData(prev => ({ ...prev, death_time: e.target.value }))}
                    />
                  </div>
                  <Input
                    label="Place of Intekal"
                    placeholder="e.g. Surat / Residence / Civil Hospital"
                    value={deathFormData.death_place}
                    onChange={(e) => setDeathFormData(prev => ({ ...prev, death_place: e.target.value }))}
                  />
                </div>

                {/* 2. Namaz-e-Janaza & Kabrastan */}
                <div className="p-3.5 rounded-xl bg-slate-500/5 border border-border space-y-3">
                  <div className="font-semibold text-xs text-text uppercase tracking-wider flex items-center gap-1.5">
                    <span>🕌 Namaz-e-Janaza & Kabrastan</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <DatePicker
                      label="Janaza Date"
                      value={deathFormData.janaza_date}
                      onChange={(val) => setDeathFormData(prev => ({ ...prev, janaza_date: val }))}
                      placeholder="Select janaza date"
                    />
                    <Input
                      label="Janaza Time"
                      placeholder="e.g. Baad Namaz-e-Zuhr / Baad Asr / 10:30 AM"
                      value={deathFormData.janaza_time}
                      onChange={(e) => setDeathFormData(prev => ({ ...prev, janaza_time: e.target.value }))}
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      label="Janaza Masjid / Venue"
                      placeholder="e.g. Memon Jamat Masjid, Surat"
                      value={deathFormData.janaza_place}
                      onChange={(e) => setDeathFormData(prev => ({ ...prev, janaza_place: e.target.value }))}
                    />
                    <Input
                      label="Kabrastan / Burial Place"
                      placeholder="e.g. Memon Kabrastan, Rander Road"
                      value={deathFormData.kabrastan}
                      onChange={(e) => setDeathFormData(prev => ({ ...prev, kabrastan: e.target.value }))}
                    />
                  </div>
                </div>

                {/* 3. Dua / Remarks */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-text-secondary mb-1.5">
                    Dua / Special Remarks
                  </label>
                  <textarea
                    rows={3}
                    value={deathFormData.death_note}
                    onChange={(e) => setDeathFormData(prev => ({ ...prev, death_note: e.target.value }))}
                    placeholder="e.g. May Allah grant magfirah and the highest place in Jannat-ul-Firdaus..."
                    className="w-full px-3.5 py-2.5 bg-input-bg text-text border border-border focus:border-primary/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all custom-scrollbar"
                  />
                </div>

                <div className="flex items-center justify-end gap-3 pt-3 border-t border-border">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setDeathModalOpen(false)}
                    disabled={savingDeath}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={savingDeath}
                    className="font-bold"
                  >
                    {savingDeath ? 'Saving...' : (deathModalMode === 'edit' ? 'Update Intekal Details' : 'Save Intekal Record')}
                  </Button>
                </div>
              </form>
            )}
          </div>
        </Modal>
      )}

      {/* Marriage NOC Certificate Modal */}
      {type === 'matrimonies' && (
        <NocCertificateModal
          isOpen={nocModalOpen}
          onClose={() => { setNocModalOpen(false); setSelectedNocMember(null); }}
          initialData={selectedNocMember}
        />
      )}

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
