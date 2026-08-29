import React, { useState, useMemo } from 'react'
import AdminCrudPage from './AdminCrudPage'
import GalleryPage from './GalleryPage'
import { formatDate } from '../lib/api'
import usePermissions from '../hooks/usePermissions'
import Input from '../components/common/Input'
import Select from '../components/common/Select'
import DatePicker from '../components/DatePicker'

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
    endpoint: '/matrimonies',
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
      { name: 'person_image', label: 'Person Image', type: 'file', multiple: true, className: 'md:col-span-1' }
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
    endpoint: '/gallery',
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
  // banners: {
  //   title: 'Banner',
  //   subtitle: 'Control app banner slides and links',
  //   endpoint: '/content/banners',
  //   fields: [
  //     { name: 'title', label: 'Title' },
  //     { name: 'subtitle', label: 'Subtitle', type: 'textarea' },
  //     { name: 'link', label: 'Link' },
  //     { name: 'image', label: 'Image', type: 'file' },
  //     { name: 'status', label: 'Status', type: 'select', defaultValue: 1, options: [{ value: 1, label: 'Active' }, { value: 0, label: 'Inactive' }] }
  //   ],
  //   columns: [
  //     { key: 'image', label: 'Image', type: 'image' },
  //     { key: 'title', label: 'Title' },
  //     { key: 'subtitle', label: 'Subtitle' },
  //     { key: 'status', label: 'Status', render: (row) => Number(row.status) === 1 ? 'Active' : 'Inactive' }
  //   ]
  // },
  // inquiries: {
  //   title: 'Contact Inquiry',
  //   subtitle: 'Track and update messages from contact forms',
  //   endpoint: '/content/contact-inquiries',
  //   fields: [
  //     { name: 'name', label: 'Name' },
  //     { name: 'email', label: 'Email', type: 'email' },
  //     { name: 'phone', label: 'Phone' },
  //     { name: 'subject', label: 'Subject' },
  //     { name: 'message', label: 'Message', type: 'textarea' },
  //     { name: 'status', label: 'Status', type: 'select', defaultValue: 'new', options: [{ value: 'new', label: 'New' }, { value: 'in-progress', label: 'In Progress' }, { value: 'closed', label: 'Closed' }] }
  //   ],
  //   columns: [
  //     { key: 'name', label: 'Name' },
  //     { key: 'subject', label: 'Subject' },
  //     { key: 'status', label: 'Status' }
  //   ]
  // },
  feedback: {
    title: 'Feedback',
    subtitle: 'Manage user feedback and suggestions',
    endpoint: '/feedback',
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
    subtitle: 'View and manage member birthdays',
    endpoint: '/users?birthday',
    hideAdd: true,
    hideActions: true,
    fields: [{ name: 'name', label: 'Name', disabled: true }, { name: 'dob', label: 'Date of Birth', type: 'date', required: true }, { name: 'anniversary', label: 'Anniversary', type: 'date' }],
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'dob', label: 'Date of Birth', render: (row) => formatDate(row.dob) },
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
                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/15 border border-primary/20 text-xs font-bold text-primary-dark whitespace-nowrap shadow-sm">
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
        render: (row) => formatDate(row.anniversary)
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
            return <span className="inline-block px-2 py-0.5 rounded-md bg-success/15 border border-success/20 text-xs font-bold text-success shadow-sm">Today!</span>
          }

          return (
            <div className="flex items-center gap-1.5 flex-wrap">
              {parts.map((p, i) => (
                <span key={i} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/15 border border-primary/20 text-xs font-bold text-primary-dark whitespace-nowrap shadow-sm">
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
    endpoint: '/job-vacancy',
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
    endpoint: '/bank-details',
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

  return (
    <AdminCrudPage 
      {...definitions[type]} 
      headerLeftContent={headerLeftContent}
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
    />
  )
}
