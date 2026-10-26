import React, { useState, useMemo, useCallback, useEffect } from 'react'
import AdminCrudPage from './AdminCrudPage'
import GalleryPage from './GalleryPage'
import { GALLERY_ENDPOINTS, BIRTHDAY_ENDPOINTS, DEATH_ENDPOINTS, JOB_VACANCY_ENDPOINTS, MATRIMONY_ENDPOINTS, MASTER_ENDPOINTS } from '../utils/endpoints'
import { formatDate } from '../lib/api'
import usePermissions from '../hooks/usePermissions'
import Input from '../components/common/Input'
import Select from '../components/common/Select'
import TimePicker from '../components/common/TimePicker'
import DatePicker from '../components/DatePicker'
import { Cake, Heart, Sparkles, PartyPopper, MessageCircle, Phone, Send, Users as UsersIcon, AlertTriangle, CheckCircle, ExternalLink, Plus, Edit2, Trash2, Search, RefreshCw, User, Flower2, ShieldCheck, FileCheck, Eye, Download, Copy } from 'lucide-react'
import { toast } from '../lib/toast'
import { confirm } from '../lib/confirm'
import api, { getCommunityFullName, assetUrl, getUsersList } from '../lib/api'
import Modal from '../components/Modal'
import Button from '../components/common/Button'
import VafatCardModal from '../components/VafatCardModal'
import NocCertificateModal from '../components/NocCertificateModal'
import { toGujarati } from '../utils/gujaratiTyping'

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

export const ISLAMIC_MONTHS = [
  { value: 'મોહર્રમ', label: '૧. મોહર્રમ (Muharram)', num: 1, en: 'Muharram', aliases: ['muharram', 'moharram'] },
  { value: 'સફર', label: '૨. સફર (Safar)', num: 2, en: 'Safar', aliases: ['safar'] },
  { value: 'રબીઉલ અવ્વલ', label: '૩. રબીઉલ અવ્વલ (Rabi\' al-Awwal)', num: 3, en: 'Rabi\' al-Awwal', aliases: ['rabi al-awwal', 'rabi 1', 'rabi i', 'rabiul awwal'] },
  { value: 'રબીઉલ આખિર', label: '૪. રબીઉલ આખિર (Rabi\' al-Thani)', num: 4, en: 'Rabi\' al-Thani', aliases: ['rabi al-thani', 'rabi 2', 'rabi ii', 'rabiul aakhir', 'rabiul sani'] },
  { value: 'જમાદિલ અવ્વલ', label: '૫. જમાદિલ અવ્વલ (Jumada al-Awwal)', num: 5, en: 'Jumada al-Awwal', aliases: ['jumada al-awwal', 'jumada 1', 'jumada i', 'jumada awwal', 'jamadil awwal'] },
  { value: 'જમાદિલ આખિર', label: '૬. જમાદિલ આખિર (Jumada al-Thani)', num: 6, en: 'Jumada al-Thani', aliases: ['jumada al-thani', 'jumada 2', 'jumada ii', 'jumada aakhir', 'jamadil aakhir', 'jamadil sani'] },
  { value: 'રજબ', label: '૭. રજબ (Rajab)', num: 7, en: 'Rajab', aliases: ['rajab'] },
  { value: 'શાબાન', label: '૮. શાબાન (Sha\'ban)', num: 8, en: 'Sha\'ban', aliases: ['shaban', 'sha\'ban', 'shabaan'] },
  { value: 'રમઝાન', label: '૯. રમઝાન (Ramadan)', num: 9, en: 'Ramadan', aliases: ['ramzan', 'ramadan'] },
  { value: 'શવ્વાલ', label: '૧૦. શવ્વાલ (Shawwal)', num: 10, en: 'Shawwal', aliases: ['shawwal', 'shavval'] },
  { value: 'ઝીલકાદ', label: '૧૧. ઝીલકાદ (Dhul Qadah)', num: 11, en: 'Dhul Qadah', aliases: ['dhul qadah', 'dhul-qadah', 'zilqad', 'zulqadah'] },
  { value: 'ઝીલહિજ્જા', label: '૧૨. ઝીલહિજ્જા (Dhul Hijjah)', num: 12, en: 'Dhul Hijjah', aliases: ['dhul hijjah', 'dhul-hijjah', 'zilhajj', 'zulhijjah'] }
]

export const findIslamicMonth = (str) => {
  if (!str) return null
  const s = String(str).toLowerCase().trim()
  return ISLAMIC_MONTHS.find(m => {
    if (m.value && s.includes(m.value.toLowerCase())) return true
    if (m.en && s.includes(m.en.toLowerCase())) return true
    if (m.aliases && m.aliases.some(a => s.includes(a))) return true
    return false
  }) || null
}

export const GUJARATI_DAYS = [
  'રવિવાર',
  'સોમવાર',
  'મંગળવાર',
  'બુધવાર',
  'ગુરુવાર',
  'શુક્રવાર',
  'શનિવાર'
]

export const parseAnyDate = (dateStr) => {
  if (!dateStr) return null
  if (dateStr instanceof Date) return isNaN(dateStr.getTime()) ? null : dateStr
  const str = String(dateStr).trim()
  if (!str) return null
  if (str.includes('/')) {
    const parts = str.split(' ')[0].split('/')
    if (parts.length === 3) {
      const d = parseInt(parts[0], 10)
      const m = parseInt(parts[1], 10) - 1
      const y = parseInt(parts[2], 10)
      const res = new Date(y, m, d, 12, 0, 0)
      return isNaN(res.getTime()) ? null : res
    }
  }
  if (str.includes('-')) {
    const cleanStr = str.split('T')[0].split(' ')[0]
    const parts = cleanStr.split('-')
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        const y = parseInt(parts[0], 10)
        const m = parseInt(parts[1], 10) - 1
        const d = parseInt(parts[2], 10)
        const res = new Date(y, m, d, 12, 0, 0)
        return isNaN(res.getTime()) ? null : res
      }
      const d = parseInt(parts[0], 10)
      const m = parseInt(parts[1], 10) - 1
      const y = parseInt(parts[2], 10)
      const res = new Date(y, m, d, 12, 0, 0)
      return isNaN(res.getTime()) ? null : res
    }
  }
  const res = new Date(str)
  return isNaN(res.getTime()) ? null : res
}

export const getGujaratiDay = (dateStr) => {
  const d = parseAnyDate(dateStr)
  if (!d) return ''
  return GUJARATI_DAYS[d.getDay()] || ''
}

export const getAutoIslamicDate = (dateStr) => {
  const d = parseAnyDate(dateStr)
  if (!d) return ''
  try {
    const formatter = new Intl.DateTimeFormat('en-u-ca-islamic-umalqura', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric'
    })
    const parts = formatter.formatToParts(d)
    const day = parts.find(p => p.type === 'day')?.value
    const month = parseInt(parts.find(p => p.type === 'month')?.value, 10)
    const m = ISLAMIC_MONTHS[month - 1]
    if (day && m) {
      return `${day} ${m.value}`
    }
  } catch (e) {
    try {
      const formatter = new Intl.DateTimeFormat('en-u-ca-islamic', {
        day: 'numeric',
        month: 'numeric',
        year: 'numeric'
      })
      const parts = formatter.formatToParts(d)
      const day = parts.find(p => p.type === 'day')?.value
      const month = parseInt(parts.find(p => p.type === 'month')?.value, 10)
      const m = ISLAMIC_MONTHS[month - 1]
      if (day && m) {
        return `${day} ${m.value}`
      }
    } catch (_) {}
  }
  return ''
}

const MAYYAT_DEFAULT_DUA = `અલ્લાહ પાક.. એના પ્યારા હબીબ મોહમ્મદ મુસ્તફા સલ્લલ્લાહુ અલયહી વસલ્લમના સદકામા... બુઝુરગાને દીન રહમતુલ્લાહી તઆલા અલયહીના વસીલાથી મગફીરત ફરમાવે... એમની આગળની મંઝીલો આસાન ફરમાવે... દરજાત બુલંદ ફરમાવે...ઘરવાળાઓને સબ્રે જમીલ અતા ફરમાવે...`


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
      { key: 'image', label: 'Preview', type: 'image' },
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
      {
        key: 'birthdate', label: 'Birthdate', render: (row) => {
          if (!row.birthdate) return '-'
          const d = new Date(row.birthdate)
          if (isNaN(d.getTime())) return row.birthdate
          const day = String(d.getDate()).padStart(2, '0')
          const month = String(d.getMonth() + 1).padStart(2, '0')
          return `${day}/${month}/${d.getFullYear()}`
        }
      },
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
    title: 'vafat & Barsi',
    subtitle: 'Marhum members, Namaz-e-Janaza, and Kabrastan details',
    endpoint: DEATH_ENDPOINTS.GET_DEATHS,
    hideAdd: true,
    hideActions: false,
    fields: [
      { name: 'name', label: 'Name', disabled: true },
      { name: 'death_date', label: 'Date of vafat', type: 'date', required: true },
      { name: 'death_time', label: 'Time of vafat' },
      { name: 'death_place', label: 'Place of vafat' },
      { name: 'janaza_date', label: 'Namaz-e-Janaza Date', type: 'date' },
      { name: 'janaza_time', label: 'Janaza Time' },
      { name: 'janaza_place', label: 'Janaza Venue / Masjid' },
      { name: 'kabrastan', label: 'Kabrastan / Burial Place' },
      { name: 'death_note', label: 'Special Note / Dua', type: 'textarea' }
    ],
    columns: [
      {
        key: 'name',
        label: 'Marhum Member',
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
              {row.profile_image || row.image ? (
                <img src={assetUrl(row.profile_image || row.image)} alt="" className="h-9 w-9 rounded-lg object-cover border border-border" />
              ) : (
                <div className="h-9 w-9 rounded-lg bg-surface-secondary flex items-center justify-center text-sm font-semibold text-text-secondary">
                  {row.name?.slice(0, 1) || 'M'}
                </div>
              )}
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <div className="font-semibold text-text truncate">
                    <span className="text-xs text-primary font-medium mr-1">{titlePrefix}</span>
                    {row.name || '-'}
                  </div>
                  {isToday && (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border font-semibold text-xs bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20 whitespace-nowrap shrink-0">
                      Today
                    </span>
                  )}
                  {cleanPhone && (
                    <button
                      type="button"
                      onClick={handleSendCondolence}
                      className="p-1.5 text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-lg transition-all cursor-pointer shrink-0"
                      title={`Send WhatsApp Condolence (${cleanPhone})`}
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="text-xs text-text-secondary truncate mt-0.5">
                  {[row.relation, row.village || (row.family_head?.name ? `Head: ${row.family_head.name}` : '')].filter(Boolean).join(' • ')}
                </div>
              </div>
            </div>
          )
        }
      },
      {
        key: 'death_date',
        label: 'Date of vafat',
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
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-semibold text-text text-sm">
                  {formatDate(row.death_date)}
                </span>
                {row.death_time && <span className="text-xs text-text-secondary">({row.death_time})</span>}
                {isToday && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-lg border font-semibold text-xs bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/20 whitespace-nowrap shadow-xs">
                    🕯️ Today
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-xs text-text-secondary flex-wrap">
                {row.death_place && <span>📍 {row.death_place}</span>}
                <span className="inline-flex items-center px-2 py-0.5 rounded-lg border border-border bg-surface-secondary text-text-secondary font-medium text-xs">
                  ⏳ {passedLabel}
                </span>
              </div>
            </div>
          )
        }
      },
      {
        key: 'janaza_kabrastan',
        label: 'Janaza & Kabrastan',
        render: (row) => {
          const hasJanaza = row.janaza_date || row.janaza_time || row.janaza_place
          const hasKabr = row.kabrastan
          if (!hasJanaza && !hasKabr) return <span className="text-text-secondary text-sm">-</span>
          return (
            <div className="space-y-1 text-sm">
              {hasJanaza && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="font-semibold text-text text-sm">
                    🕌 {row.janaza_date ? formatDate(row.janaza_date) : ''}
                  </span>
                  {row.janaza_time && <span className="text-xs text-text-secondary">({row.janaza_time})</span>}
                  {row.janaza_place && <span className="text-xs text-text-secondary truncate max-w-[160px]" title={row.janaza_place}>• 📍 {row.janaza_place}</span>}
                </div>
              )}
              {hasKabr && (
                <div className="text-xs text-text-secondary flex items-center gap-1 truncate max-w-[200px]" title={row.kabrastan}>
                  <span>🌿</span>
                  <span className="font-medium text-text">{row.kabrastan}</span>
                </div>
              )}
            </div>
          )
        }
      },
      {
        key: 'death_note',
        label: 'Dua & Remarks',
        render: (row) => {
          if (!row.death_note) return <span className="text-text-secondary text-sm">-</span>
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
      {
        name: 'job_type', label: 'Job Type', type: 'select', required: true, className: 'md:col-span-1',
        options: [{ value: "full-time", label: 'Full Time' }, { value: "part-time", label: 'Part Time' }, { value: "contract", label: 'Contract' }, { value: "internship", label: 'Internship' }]
      },
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

  const customFilters = (type === 'birthday' || type === 'death') ? (
    <div className="space-y-4 mb-4">
      <Select
        label={type === 'birthday' ? "Birth Month" : "vafat Month"}
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
        label={type === 'birthday' ? "Birth Year" : "vafat Year"}
        type="number"
        placeholder={type === 'birthday' ? "e.g. 1995" : "e.g. 2024"}
        value={draftYear}
        onChange={(e) => setDraftYear(e.target.value.replace(/\D/g, ''))}
      />
      <div className="grid grid-cols-2 gap-2">
        <DatePicker
          label={type === 'birthday' ? "From DOB" : "From Date"}
          placeholder="Start Date"
          value={draftStart}
          onChange={setDraftStart}
        />
        <DatePicker
          label={type === 'birthday' ? "To DOB" : "To Date"}
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
      // Sort items: today's vafat or barsi (same day and month as today) to the VERY TOP
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
        return '!bg-rose-500/5 hover:!bg-rose-500/10 border-l-4 border-l-rose-500'
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

  // Death / vafat Modal State & Handlers
  const [deathModalOpen, setDeathModalOpen] = useState(false)
  const [deathModalMode, setDeathModalMode] = useState('add') // 'add' | 'edit'
  const [selectedDeathMember, setSelectedDeathMember] = useState(null)
  const [isManualEntry, setIsManualEntry] = useState(false)
  const [userList, setUserList] = useState([])
  const [loadingUsers, setLoadingUsers] = useState(false)
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
    village: '',
    address: '',
    vaar: '',
    islamic_date: '',
    janaza_date: '',
    janaza_time: '',
    janaza_place: '',
    kabrastan: '',
    death_note: MAYYAT_DEFAULT_DUA
  })
  const [savingDeath, setSavingDeath] = useState(false)

  // Fetch community users for dropdown selection when death modal is used
  useEffect(() => {
    if (!deathModalOpen || userList.length > 0) return
    let isMounted = true
    const fetchUsers = async () => {
      setLoadingUsers(true)
      try {
        const res = await getUsersList({ limit: 500, flat: 'true' })
        const raw = res.data?.data || res.data?.members || res.data || []
        const list = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : [])
        if (isMounted) setUserList(list)
      } catch (err) {
        console.error('Failed to load user list for vafat selection:', err)
      } finally {
        if (isMounted) setLoadingUsers(false)
      }
    }
    fetchUsers()
    return () => { isMounted = false }
  }, [deathModalOpen, userList.length])

  const deathUserOptions = useMemo(() => {
    const options = [
      { label: loadingUsers ? 'Loading members...' : 'Select a Member...', value: '' }
    ]
    userList.forEach(u => {
      const id = String(u._id || u.id || u.member_id)
      const fullName = [u.first_name, u.middle_name, u.last_name].filter(Boolean).join(' ')
      const phone = u.number || u.phone || ''
      const village = u.village || u.city || ''
      const sub = [phone, village].filter(Boolean).join(' • ')
      const initials = (u.first_name?.[0] || '') + (u.last_name?.[0] || '')

      options.push({
        label: fullName || 'Unnamed Member',
        value: id,
        sublabel: sub || undefined,
        image: u.image || u.profile_image || undefined,
        imagePlaceholder: !u.image && !u.profile_image ? initials.toUpperCase() || 'U' : undefined
      })
    })
    return options
  }, [userList, loadingUsers])

  // Default Gujarati Vafat Dua template generator with auto member name prefixing
  const getGujaratiDuaText = (name = '', village = '', isFemale = false) => {
    const title = isFemale ? 'મરહૂમા' : 'મરહૂમ'
    const cleanName = String(name || '').trim()
    const memberTitle = cleanName ? `${title} ${cleanName}` : title
    return `${memberTitle} ગુજરી ગયા છે. બધા સાથીઓ તેમના માટે ખાસ દુઆ કરે, અલ્લાહપાક તેમની મગફિરત કરે અને તેમને જન્નતુલ ફિરદોસમાં આલા મકામ ફરમાવે અને તેમના ઘરવાળાઓને સબર આપે. આમીન!`
  }

  const handleOpenAddDeathModal = () => {
    setDeathModalMode('add')
    setSelectedDeathMember(null)
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
    const todayStr = new Date().toISOString().split('T')[0]
    setDeathFormData({
      death_date: todayStr,
      death_time: '',
      death_place: '',
      village: '',
      address: '',
      vaar: getGujaratiDay(todayStr),
      islamic_date: getAutoIslamicDate(todayStr),
      janaza_date: todayStr,
      janaza_time: '',
      janaza_place: '',
      kabrastan: '',
      death_note: MAYYAT_DEFAULT_DUA
    })
    setDeathModalOpen(true)
  }

  // Auto-sync manual member name and village to form
  useEffect(() => {
    if (deathModalOpen && isManualEntry && deathModalMode === 'add') {
      if (manualMember.village) {
        setDeathFormData(prev => ({
          ...prev,
          village: prev.village || manualMember.village
        }))
      }
    }
  }, [deathModalOpen, isManualEntry, deathModalMode, manualMember.village])

  const handleOpenEditDeathModal = (row) => {
    setDeathModalMode('edit')
    setSelectedDeathMember(row)
    setIsManualEntry(false)
    const rowDate = row.death_date ? (row.death_date.includes('T') ? row.death_date.split('T')[0] : row.death_date) : ''
    const calculatedVaar = rowDate ? getGujaratiDay(rowDate) : ''
    const calculatedIslamic = rowDate ? getAutoIslamicDate(rowDate) : ''
    const hasValidGujMonth = row.islamic_date && ISLAMIC_MONTHS.some(m => row.islamic_date.includes(m.value))

    setDeathFormData({
      death_date: rowDate,
      death_time: row.death_time || '',
      death_place: row.death_place || '',
      village: row.village || row.native_place || '',
      address: row.address || '',
      vaar: row.vaar || calculatedVaar || '',
      islamic_date: (hasValidGujMonth ? row.islamic_date : calculatedIslamic) || '',
      janaza_date: row.janaza_date ? (row.janaza_date.includes('T') ? row.janaza_date.split('T')[0] : row.janaza_date) : '',
      janaza_time: row.janaza_time || '',
      janaza_place: row.janaza_place || '',
      kabrastan: row.kabrastan || '',
      death_note: row.death_note || MAYYAT_DEFAULT_DUA
    })
    setDeathModalOpen(true)
  }

  const handleDeathDateChange = (val) => {
    const vaarVal = getGujaratiDay(val)
    const islamicVal = getAutoIslamicDate(val)
    setDeathFormData(prev => ({
      ...prev,
      death_date: val,
      vaar: vaarVal,
      islamic_date: islamicVal,
      janaza_date: prev.janaza_date || val
    }))
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
      toast.error('Date of vafat is required')
      return
    }

    setSavingDeath(true)
    try {
      const deathPayload = {
        is_deceased: true,
        death_date: deathFormData.death_date,
        death_time: deathFormData.death_time,
        death_place: deathFormData.death_place,
        village: deathFormData.village,
        address: deathFormData.address,
        vaar: deathFormData.vaar,
        islamic_date: deathFormData.islamic_date,
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

      toast.success(deathModalMode === 'edit' ? 'vafat details updated successfully' : 'vafat recorded successfully')
      setDeathModalOpen(false)
      setRefreshTrigger(prev => prev + 1)
    } catch (err) {
      console.error('Save vafat Error:', err)
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to save vafat record')
    } finally {
      setSavingDeath(false)
    }
  }

  const handleClearDeath = async (row) => {
    const isFemale = String(row.gender || '').toLowerCase() === 'female'
    const prefix = isFemale ? 'Marhuma' : 'Marhum'
    const memberName = `${prefix} ${row.name || 'this member'}`
    const confirmed = await confirm(`Are you sure you want to remove ${memberName} from vafat records? This will restore their active member status in the Jamat.`, {
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
      toast.success(`${memberName} removed from vafat successfully`)
      setRefreshTrigger(prev => prev + 1)
    } catch (err) {
      console.error('Failed to remove vafat record:', err)
      toast.error(err.response?.data?.message || err.response?.data?.error || err.message || 'Failed to remove vafat record')
    }
  }

  // vafat Notification Card Modal State
  const [vafatCardModalOpen, setvafatCardModalOpen] = useState(false)
  const [selectedvafatCardMember, setSelectedvafatCardMember] = useState(null)

  const handleOpenvafatCard = (row) => {
    setSelectedvafatCardMember(row)
    setvafatCardModalOpen(true)
  }

  const copyMayyatText = (row) => {
    const isFemale = String(row.gender || '').toLowerCase() === 'female'
    const titlePrefixGujarati = isFemale ? 'મરહૂમા' : 'મરહૂમ'
    const memberName = [row.first_name, row.middle_name, row.last_name].filter(Boolean).join(' ') || row.name || row.full_name || 'Community Member'
    const villageText = row.village || row.native_place || '-'
    const rawDate = row.death_date ? formatDate(row.death_date) : '-'
    const islamicDateText = row.islamic_date ? ` (${row.islamic_date})` : (row.death_date ? ` (${getAutoIslamicDate(row.death_date)})` : '')
    const dateDisplay = `${rawDate}${islamicDateText}`
    const vaarText = row.vaar || (row.death_date ? getGujaratiDay(row.death_date) : '-')
    const janazaTime = row.janaza_time || '...'
    const janazaPlace = row.janaza_place ? `${row.janaza_place} માં` : '... માં'
    const addressText = row.address || row.death_place || '-'

    let text = `🕊️ *મૈયત સમાચાર*\n\n`
    text += `*ગામ -* ${villageText}  |  *તારીખ:* ${dateDisplay}  |  *વાર:* ${vaarText}\n\n`
    text += `* *${titlePrefixGujarati} ${memberName}* *\n\n`
    text += `જનાઝા ની નમાઝ નો ટાઇમ ${janazaTime} વાગે ${janazaPlace} ઇન્શાઅલ્લાહ નક્કી થયેલ છે.\n\n`
    if (addressText && addressText !== '-') {
      text += `*એડ્રેસ: ${addressText}*\n\n`
    }
    text += `*ઈન્ના લિલ્લાહી વ ઈન્ના ઈલયહી રાજેઊન...*\n\n`
    text += `અલ્લાહ પાક.. એના પ્યારા હબીબ મોહમ્મદ મુસ્તફા સલ્લલ્લાહુ અલયહી વસલ્લમના સદકામા... બુઝુરગાને દીન રહમતુલ્લાહી તઆલા અલયહીના વસીલાથી મગફીરત ફરમાવે... એમની આગળની મંઝીલો આસાન ફરમાવે... દરજાત બુલંદ ફરમાવે...ઘરવાળાઓને સબ્રે જમીલ અતા ફરમાવે...\n\n`
    text += `آمین بجاه شفیع المذنبین ﷺ\n`
    text += `આમીન... યા રબ્બુલ આલમીન.`

    const copyToClipboard = (str) => {
      if (navigator?.clipboard?.writeText) {
        return navigator.clipboard.writeText(str)
      }
      return new Promise((resolve, reject) => {
        try {
          const ta = document.createElement('textarea')
          ta.value = str
          ta.style.position = 'fixed'
          ta.style.opacity = '0'
          document.body.appendChild(ta)
          ta.select()
          document.execCommand('copy')
          document.body.removeChild(ta)
          resolve()
        } catch (e) {
          reject(e)
        }
      })
    }

    copyToClipboard(text)
      .then(() => {
        toast.success('મૈયત સમાચાર મેસેજ કોપી થઈ ગયો!')
      })
      .catch(() => {
        toast.error('Copy failed')
      })
  }

  const deathRowActions = type === 'death' ? (row) => (
    <div className="flex items-center gap-1.5">
      <button
        type="button"
        onClick={() => copyMayyatText(row)}
        className="p-2 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/20 rounded-xl transition-all cursor-pointer"
        title="Copy Mayyat Samachar Message"
      >
        <Copy className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => handleOpenvafatCard(row)}
        className="p-2 text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl transition-all cursor-pointer"
        title="View & Download vafat Card / Announcement"
      >
        <Eye className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => handleOpenvafatCard(row)}
        className="p-2 text-amber-600 dark:text-amber-400 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/20 rounded-xl transition-all cursor-pointer"
        title="Download vafat Announcement"
      >
        <Download className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => handleOpenEditDeathModal(row)}
        className="p-2 text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl transition-all cursor-pointer"
        title="Edit vafat & Janaza Details"
      >
        <Edit2 className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => handleClearDeath(row)}
        className="p-2 text-rose-600 dark:text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-all cursor-pointer"
        title="Remove from vafat Records (Restore Member)"
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
          className="h-10"
        >
          Record vafat
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

      {/* Record vafat / Edit Death Modal */}
      {type === 'death' && (
        <Modal
          isOpen={deathModalOpen}
          title={deathModalMode === 'edit' ? 'Edit Vafat Details' : 'Record New Vafat'}
          onClose={() => setDeathModalOpen(false)}
          maxWidth="max-w-3xl"
        >
          <form onSubmit={handleSaveDeath} className="space-y-4 text-text">
            {/* Step 1: Member Selection (Add mode) */}
            {deathModalMode === 'add' ? (
              <div className="bg-surface-secondary/40 border border-border/80 rounded-2xl p-4 sm:p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-primary font-bold text-xs uppercase tracking-wide">
                    <UsersIcon className="w-4 h-4" />
                    <span>Select Community Member *</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setIsManualEntry(!isManualEntry)
                      setSelectedDeathMember(null)
                    }}
                    className="text-xs text-primary font-semibold hover:underline cursor-pointer"
                  >
                    {isManualEntry ? '← Select registered member' : '+ Or enter member manually'}
                  </button>
                </div>

                {!isManualEntry ? (
                  <Select
                    label=""
                    value={selectedDeathMember ? String(selectedDeathMember._id || selectedDeathMember.id || selectedDeathMember.member_id) : ''}
                    onChange={(val) => {
                      if (!val) {
                        setSelectedDeathMember(null)
                        return
                      }
                      const found = userList.find(u => String(u._id || u.id || u.member_id) === String(val))
                      setSelectedDeathMember(found || null)
                      if (found && deathModalMode === 'add') {
                        const mName = [found.first_name, found.middle_name, found.last_name].filter(Boolean).join(' ') || found.name || ''
                        const isFem = String(found.gender || '').toLowerCase() === 'female'
                        const mVillage = found.village || found.native_place || found.city || ''
                        const mAddress = found.address || found.residential_address || ''
                        setDeathFormData(prev => ({
                          ...prev,
                          village: prev.village || mVillage,
                          address: prev.address || mAddress,
                          death_note: getGujaratiDuaText(mName, mVillage, isFem)
                        }))
                      }
                    }}
                    options={deathUserOptions}
                    searchable={true}
                    placeholder="Search and select community member..."
                    disabled={savingDeath || loadingUsers}
                  />
                ) : (
                  <div className="space-y-3 pt-1">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Input
                        label="First Name"
                        placeholder="e.g. Ahmed"
                        value={manualMember.first_name}
                        onChange={(e) => setManualMember(prev => ({ ...prev, first_name: e.target.value }))}
                        required
                        disabled={savingDeath}
                      />
                      <Input
                        label="Father / Middle Name"
                        placeholder="e.g. Ibrahim"
                        value={manualMember.middle_name}
                        onChange={(e) => setManualMember(prev => ({ ...prev, middle_name: e.target.value }))}
                        disabled={savingDeath}
                      />
                      <Input
                        label="Surname / Last Name"
                        placeholder="e.g. Memon"
                        value={manualMember.last_name}
                        onChange={(e) => setManualMember(prev => ({ ...prev, last_name: e.target.value }))}
                        disabled={savingDeath}
                      />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <Select
                        label="Gender"
                        value={manualMember.gender}
                        onChange={(val) => setManualMember(prev => ({ ...prev, gender: val }))}
                        options={[
                          { value: 'Male', label: 'Male (Marhum)' },
                          { value: 'Female', label: 'Female (Marhuma)' }
                        ]}
                        disabled={savingDeath}
                      />
                      <Input
                        label="Family Phone"
                        placeholder="e.g. 9876543210"
                        value={manualMember.number}
                        onChange={(e) => setManualMember(prev => ({ ...prev, number: e.target.value }))}
                        disabled={savingDeath}
                      />
                      <Input
                        label="Native / City"
                        placeholder="e.g. Surat"
                        value={manualMember.village}
                        onChange={(e) => setManualMember(prev => ({ ...prev, village: e.target.value }))}
                        disabled={savingDeath}
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              /* Edit mode: Display Selected Member Details */
              <div className="bg-gradient-to-r from-primary/5 via-primary/[0.02] to-transparent border border-primary/20 rounded-2xl p-4 flex items-center justify-between shadow-xs">
                <div className="flex items-center gap-3.5">
                  {selectedDeathMember?.profile_image || selectedDeathMember?.image ? (
                    <img src={assetUrl(selectedDeathMember.profile_image || selectedDeathMember.image)} alt="" className="h-11 w-11 rounded-xl object-cover border border-border shadow-xs" />
                  ) : (
                    <div className="h-11 w-11 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center text-base font-bold text-primary shadow-xs">
                      {selectedDeathMember?.name?.slice(0, 1) || selectedDeathMember?.first_name?.slice(0, 1) || 'M'}
                    </div>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold bg-primary/15 text-primary border border-primary/20 uppercase tracking-wide">
                        {String(selectedDeathMember?.gender || '').toLowerCase() === 'female' ? 'Marhuma (મરહૂમા)' : 'Marhum (મરહૂમ)'}
                      </span>
                      <h3 className="font-bold text-text text-base">
                        {selectedDeathMember?.name || `${selectedDeathMember?.first_name || ''} ${selectedDeathMember?.middle_name || ''} ${selectedDeathMember?.last_name || ''}`.trim()}
                      </h3>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-text-secondary mt-1">
                      {selectedDeathMember?.number && (
                        <span className="flex items-center gap-1 font-medium">
                          <Phone className="w-3 h-3 text-text-secondary" />
                          {selectedDeathMember.number}
                        </span>
                      )}
                      {selectedDeathMember?.village && (
                        <span className="flex items-center gap-1 font-medium">
                          📍 {selectedDeathMember.village}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Mayyat Samachar & Vafat Details Card */}
            <div className="bg-surface-secondary/20 border border-border/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 pb-2.5 border-b border-border/70">
                <div className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Flower2 className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-text">Mayyat Details</h4>
                  <p className="text-xs text-text-secondary">Date, Islamic date and residence details</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DatePicker
                  label="Date of Vafat"
                  required
                  value={deathFormData.death_date}
                  onChange={handleDeathDateChange}
                  placeholder="Select date"
                />

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-semibold text-text-secondary">
                      Islamic Month / Date
                    </label>
                    <div className="flex items-center gap-1.5">
                      <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                        Auto
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          if (deathFormData.death_date) {
                            const autoDate = getAutoIslamicDate(deathFormData.death_date)
                            const autoVaar = getGujaratiDay(deathFormData.death_date)
                            setDeathFormData(prev => ({
                              ...prev,
                              islamic_date: autoDate,
                              vaar: autoVaar || prev.vaar
                            }))
                            toast.success(`Auto-fetched: ${autoDate}`)
                          }
                        }}
                        title="Re-calculate Islamic Date from Date of Vafat"
                        className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1 cursor-pointer bg-primary/10 hover:bg-primary/20 px-2 py-0.5 rounded-md transition-colors"
                      >
                        <RefreshCw className="w-3 h-3" />
                        Auto Fetch
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2 items-center">
                    <input
                      type="text"
                      placeholder="e.g. 6 જમાદિલ અવ્વલ"
                      value={deathFormData.islamic_date}
                      onChange={(e) => {
                        const val = e.target.value
                        setDeathFormData(prev => ({ ...prev, islamic_date: val }))
                      }}
                      onKeyDown={(e) => {
                        if (e.key === ' ' || e.keyCode === 32) {
                          const raw = e.target.value
                          if (raw && /[a-zA-Z]/.test(raw)) {
                            e.preventDefault()
                            const converted = toGujarati(raw) + ' '
                            setDeathFormData(prev => ({ ...prev, islamic_date: converted }))
                          }
                        }
                      }}
                      onBlur={(e) => {
                        const raw = e.target.value
                        if (raw && /[a-zA-Z]/.test(raw)) {
                          const converted = toGujarati(raw)
                          setDeathFormData(prev => ({ ...prev, islamic_date: converted }))
                        }
                      }}
                      className="w-full px-3.5 py-2.5 bg-input-bg text-text border border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/15 rounded-xl text-sm outline-none transition-all font-medium placeholder:text-text-secondary/50"
                      disabled={savingDeath}
                    />
                    <div className="w-48 sm:w-56 shrink-0">
                      <Select
                        placeholder="Month..."
                        value={findIslamicMonth(deathFormData.islamic_date)?.value || ''}
                        options={ISLAMIC_MONTHS}
                        searchable={true}
                        onChange={(chosenMonth) => {
                          if (!chosenMonth) return
                          setDeathFormData(prev => {
                            let dayPart = ''
                            if (prev.islamic_date) {
                              const match = prev.islamic_date.match(/^([0-9૦-૯]+)/)
                              if (match) dayPart = match[1]
                            }
                            if (!dayPart && prev.death_date) {
                              const auto = getAutoIslamicDate(prev.death_date)
                              const match = auto?.match(/^([0-9૦-૯]+)/)
                              if (match) dayPart = match[1]
                            }
                            if (!dayPart) dayPart = '1'
                            return {
                              ...prev,
                              islamic_date: `${dayPart} ${chosenMonth}`
                            }
                          })
                        }}
                        disabled={savingDeath}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Village / Native Town"
                  placeholder="e.g. Bagsara / Surat"
                  value={deathFormData.village}
                  onChange={(e) => setDeathFormData(prev => ({ ...prev, village: e.target.value }))}
                  disabled={savingDeath}
                />
                <Input
                  label="Residence Address"
                  placeholder="e.g. 104, Madina Apartment, Surat"
                  value={deathFormData.address}
                  onChange={(e) => setDeathFormData(prev => ({ ...prev, address: e.target.value }))}
                  disabled={savingDeath}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TimePicker
                  label="Time of Vafat"
                  placeholder="Select time (e.g. 05:30 AM)"
                  value={deathFormData.death_time}
                  onChange={(val) => setDeathFormData(prev => ({ ...prev, death_time: val }))}
                  disabled={savingDeath}
                />
                <Input
                  label="Place of Vafat"
                  placeholder="e.g. Surat / Residence"
                  value={deathFormData.death_place}
                  onChange={(e) => setDeathFormData(prev => ({ ...prev, death_place: e.target.value }))}
                  disabled={savingDeath}
                />
              </div>
            </div>

            {/* Step 3: Namaz-e-Janaza & Kabrastan Card */}
            <div className="bg-surface-secondary/20 border border-border/80 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
              <div className="flex items-center gap-2 pb-2.5 border-b border-border/70">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-text">Namaz-e-Janaza & Kabrastan</h4>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <TimePicker
                  label="Janaza Time"
                  placeholder="Select time (e.g. 01:30 PM)"
                  value={deathFormData.janaza_time}
                  onChange={(val) => setDeathFormData(prev => ({ ...prev, janaza_time: val }))}
                  disabled={savingDeath}
                />
                <Input
                  label="Janaza Venue / Masjid"
                  placeholder="e.g. Memon Jamat Masjid / Jama Masjid"
                  value={deathFormData.janaza_place}
                  onChange={(e) => setDeathFormData(prev => ({ ...prev, janaza_place: e.target.value }))}
                  disabled={savingDeath}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DatePicker
                  label="Janaza Date"
                  value={deathFormData.janaza_date}
                  onChange={(val) => setDeathFormData(prev => ({ ...prev, janaza_date: val }))}
                  placeholder="Select date"
                />
                <Input
                  label="Kabrastan / Burial Place"
                  placeholder="e.g. Memon Kabrastan"
                  value={deathFormData.kabrastan}
                  onChange={(e) => setDeathFormData(prev => ({ ...prev, kabrastan: e.target.value }))}
                  disabled={savingDeath}
                />
              </div>
            </div>

            {/* Step 4: Dua / Remarks Card */}
            <div className="bg-surface-secondary/20 border border-border/80 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between pb-2 border-b border-border/70">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                    <span className="text-sm">🤲</span>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-text">Dua / Special Remarks</h4>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDeathFormData(prev => ({ ...prev, death_note: MAYYAT_DEFAULT_DUA }))}
                  className="text-xs text-primary hover:underline font-semibold cursor-pointer"
                >
                  Reset Default Dua
                </button>
              </div>
              <textarea
                rows={3}
                value={deathFormData.death_note}
                onChange={(e) => setDeathFormData(prev => ({ ...prev, death_note: e.target.value }))}
                placeholder="Dua-e-Magfirat..."
                className="w-full px-3.5 py-2.5 bg-input-bg text-text border border-border focus:border-primary/50 focus:ring-2 focus:ring-primary/15 rounded-xl text-sm outline-none transition-all custom-scrollbar leading-relaxed font-medium"
                disabled={savingDeath}
              />
            </div>

            {/* Modal Footer Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border mt-3">
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={() => setDeathModalOpen(false)}
                disabled={savingDeath}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="md"
                isLoading={savingDeath}
                disabled={savingDeath}
                className="min-w-[130px]"
              >
                {savingDeath ? 'Saving...' : (deathModalMode === 'edit' ? 'Update Details' : 'Save Record')}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* vafat / Death Notification Card Modal */}
      {type === 'death' && (
        <VafatCardModal
          isOpen={vafatCardModalOpen}
          onClose={() => { setvafatCardModalOpen(false); setSelectedvafatCardMember(null); }}
          member={selectedvafatCardMember}
        />
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
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold text-xs shadow-xs transition-all cursor-pointer active:scale-95 ${cleanPhone
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
