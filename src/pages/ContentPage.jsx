import React from 'react'
import AdminCrudPage from './AdminCrudPage'
import GalleryPage from './GalleryPage'

const definitions = {
  festivals: {
    title: 'Festivals',
    subtitle: 'Create and maintain festival announcements',
    endpoint: '/content/festivals',
    fields: [
      { name: 'title', label: 'Title', required: true },
      { name: 'festival_date', label: 'Festival Date', type: 'date', required: true },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
      { name: 'image', label: 'Image', type: 'file' }
    ],
    columns: [
      { key: 'image', label: 'Image', type: 'image' },
      { key: 'title', label: 'Title' },
      { key: 'festival_date', label: 'Date' },
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
    supportIsOwn: true,
    fields: [
      { name: 'full_name', label: 'Full Name', required: true },
      {
        name: 'gender',
        label: 'Gender',
        type: 'select',
        required: true,
        options: [
          { value: 'Male', label: 'Male' },
          { value: 'Female', label: 'Female' },
          { value: 'Other', label: 'Other' }
        ]
      },
      { name: 'birthdate', label: 'Birthdate', type: 'date', required: true },
      {
        name: 'marital_status',
        label: 'Marital Status',
        type: 'select',
        required: true,
        options: [
          { value: 'Single', label: 'Single' },
          { value: 'Never Married', label: 'Never Married' },
          { value: 'Divorced', label: 'Divorced' },
          { value: 'Widowed', label: 'Widowed' },
          { value: 'Awaiting Divorce', label: 'Awaiting Divorce' }
        ]
      },
      { name: 'height', label: 'Height', required: true },
      { name: 'weight', label: 'Weight', required: true },
      { name: 'complexion', label: 'Complexion', required: true },
      { name: 'education', label: 'Education', required: true },
      { name: 'occupation', label: 'Occupation', required: true },
      { name: 'father_name', label: 'Father Name', required: true },
      { name: 'mother_name', label: 'Mother Name', required: true },
      { name: 'gotra', label: 'Gotra', required: true },
      { name: 'family_type', label: 'Family Type', required: true },
      { name: 'mobile_number', label: 'Mobile Number', required: true },
      { name: 'city', label: 'City', required: true },
      {
        name: 'status',
        label: 'Status',
        type: 'select',
        required: true,
        options: [
          { value: 1, label: 'Active' },
          { value: 0, label: 'Inactive' }
        ]
      },
      { name: 'about', label: 'About', type: 'textarea' },
      { name: 'biodata', label: 'Biodata (PDF/Image)', type: 'file', accept: 'image/*,application/pdf' },
      { name: 'person_image', label: 'Person Image', type: 'file' }
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
    fields: [{ name: 'name', label: 'Name', disabled: true }, { name: 'dob', label: 'Date of Birth', type: 'date', required: true }, { name: 'anniversary', label: 'Anniversary', type: 'date' }],
    columns: [
      { key: 'name', label: 'Name' },
      { key: 'dob', label: 'Date of Birth', render: (row) => row.dob ? new Date(row.dob).toLocaleDateString('en-IN') : '-' },
      { key: 'anniversary', label: 'Anniversary', render: (row) => row.anniversary ? new Date(row.anniversary).toLocaleDateString('en-IN') : '-' }

    ]
  },
  'job-vacancy': {
    title: 'Job Vacancy',
    subtitle: 'Post and manage job vacancy listings',
    endpoint: '/job-vacancy',
    fields: [
      { name: 'title', label: 'Title', required: true },
      { name: 'company_name', label: 'Company Name', required: true },
      { name: 'description', label: 'Description', type: 'textarea', required: true },
      { name: 'qualifications', label: 'Qualifications', type: 'textarea', required: true },
      { name: 'location', label: 'Location', required: true }, 
      {name: 'job_type', label: 'Job Type', type: 'select', required: true,
        options: [{ value: "full-time", label: 'Full Time' }, { value: "part-time", label: 'Part Time' }, { value: "contract", label: 'Contract' }, { value: "internship", label: 'Internship' }]},
      { name: 'salary', label: 'Salary', required: true },
      { name: 'contact_email', label: 'Contact Email', type: 'email', required: true },
      { name: 'contact_number', label: 'Contact Number', required: true },
      { name: 'status', label: 'Status', type: 'select', required: true, options: [{ value: 1, label: 'Approved' }, { value: 0, label: 'Inactive' }] },
      { name: 'image', label: 'Image', type: 'file' }
    ],
    columns: [
      { key: 'title', label: 'Title' },
      { key: 'company_name', label: 'Company' },
      { key: 'qualifications', label: 'qualifications' },
      {key:'image',lable:'Image',type:'image'},

      { key: 'contact_number', label: 'Number' },
      { key: 'job_type', label: 'Job Type' },
      { key: 'status', label: 'Status', render: (row) => Number(row.status) === 1 ? 'Approved' : 'Inactive' }
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
      { key: 'status', label: 'Status', render: (row) => Number(row.status) === 1 ? 'Active' : 'Inactive' }
    ]
  }
}

export default function ContentPage({ type }) {
  if (type === 'gallery') {
    return <GalleryPage />
  }

  if (!definitions[type]) {
    return (
      <div className="rounded-xl border border-error-border bg-error-bg p-6 text-sm text-error-text">
        Unknown content menu selected.
      </div>
    )
  }

  return <AdminCrudPage {...definitions[type]} hideDelete={type === 'birthday'} deleteAction={type === 'birthday' ? 'clear-dob' : undefined} getRowTitle={(row) => row.title || row.full_name || row.subject || row.name} />
}
