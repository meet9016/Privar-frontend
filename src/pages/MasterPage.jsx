import React, { useMemo, useState, useEffect } from 'react'
import AdminCrudPage from './AdminCrudPage'
import { masterLabels } from '../config/navigation'
import Select from '../components/common/Select'
import api from '../lib/api'
import { MASTER_ENDPOINTS } from '../utils/endpoints'
import usePermissions from '../hooks/usePermissions'

const parentFieldsConfig = {
  state: { source: MASTER_ENDPOINTS.COUNTRY, label: 'Country', key: 'name' },
  city: { source: MASTER_ENDPOINTS.STATE, label: 'State', key: 'name' },
  village: { source: MASTER_ENDPOINTS.CITY, label: 'City', key: 'name' }
}

const EDUCATION_LEVEL_OPTIONS = [
  { value: 'School', label: 'School' },
  { value: 'Bachelor', label: 'Bachelor' },
  { value: 'Master', label: 'Master' },
  { value: 'Diploma', label: 'Diploma' },
  { value: 'Other', label: 'Other' }
]

export default function MasterPage({ type, headerLeftContent }) {
  const label = masterLabels[type]
  const parentConfig = parentFieldsConfig[type]
  const permissions = usePermissions('masters')
  
  const [filterValue, setFilterValue] = useState('')
  const [educationLevelFilter, setEducationLevelFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [parentOptions, setParentOptions] = useState([])

  useEffect(() => {
    setFilterValue('')
    setEducationLevelFilter('')
    setShowFilters(false)
    if (parentConfig) {
      api.get(parentConfig.source).then(res => {
        const data = res.data?.data || res.data || []
        setParentOptions(data.map(d => ({ label: d.name || d.title, value: d.id || d._id })))
      }).catch(console.error)
    }
  }, [type, parentConfig])

  const fields = useMemo(() => [
    ...(type === 'business' ? [{ name: 'image', label: 'Image', type: 'file', accept: 'image/*', className: 'sm:col-span-2' }] : []),
    ...(type === 'education' ? [
      {
        name: 'level',
        label: 'Education Level / Category',
        type: 'select',
        required: true,
        defaultValue: 'School',
        options: EDUCATION_LEVEL_OPTIONS
      },
      {
        name: 'standard',
        fallback: 'name',
        label: 'Standard / Class / Degree',
        required: true,
        placeholder: 'e.g. 10th Standard, 12th Standard, B.Com, B.Tech, MBA...'
      },
      {
        name: 'description',
        label: 'Description / Notes (Optional)',
        type: 'textarea',
        required: false,
        placeholder: 'e.g. Secondary School Certificate, Bachelor of Commerce...'
      }
    ] : [
      { name: 'name', label: `${label} Name (English)`, required: true, placeholder: type === 'relationship' ? 'e.g. Son-in-law, Sister' : `${label} Name` }
    ]),
    ...(type === 'relationship' ? [
      { name: 'gujarati_name', label: 'Gujarati Name (ગુજરાતી નામ)', required: false, placeholder: 'દા.ત. જમાઈ, બહેન', transliterate: 'gu' },
      { name: 'hindi_name', label: 'Hindi Name (हिंदी नाम - Optional)', required: false, placeholder: 'દા.ત. दामाद, बहन', transliterate: 'hi' },
      { name: 'description', label: 'Relationship Meaning / Details (સમજૂતી)', type: 'textarea', required: false, placeholder: 'દા.ત. દીકરીના પતિ, પિતાની બહેન...', transliterate: 'gu' }
    ] : []),
    ...(parentConfig ? [{ 
      name: 'parent_id', 
      label: parentConfig.label,
      type: 'select-remote',
      required: true,
      source: parentConfig.source
    }] : []),
    { name: 'status', label: 'Status', type: 'select', required: true, defaultValue: 1, options: [{ value: 1, label: 'Active' }, { value: 0, label: 'Inactive' }] }
  ], [label, type, parentConfig])

  const columns = useMemo(() => [
    ...(type === 'business' ? [{ key: 'image', label: 'Image', type: 'image' }] : []),
    ...(type === 'education' ? [
      {
        key: 'level',
        label: 'Education Level',
        render: (row) => {
          const badgeStyles = {
            School: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
            Bachelor: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
            Master: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
            Diploma: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
            Other: 'bg-gray-500/10 text-gray-600 dark:text-gray-400 border-gray-500/20'
          }
          const style = badgeStyles[row.level] || 'bg-primary/10 text-primary border-primary/20'
          return (
            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${style}`}>
              {row.level || 'School'}
            </span>
          )
        }
      },
      {
        key: 'standard',
        label: 'Standard / Degree',
        render: (row) => (
          <div>
            <span className="font-semibold text-text">{row.standard || row.name || '-'}</span>
            {row.description && (
              <p className="text-xs text-text-secondary mt-0.5 line-clamp-1">{row.description}</p>
            )}
          </div>
        )
      }
    ] : [
      { key: 'name', label: type === 'relationship' ? 'Relationship (English)' : 'Name' }
    ]),
    ...(type === 'relationship' ? [
      { key: 'gujarati_name', label: 'Gujarati (ગુજરાતી)', render: (row) => row.gujarati_name ? <span className="font-semibold text-primary">({row.gujarati_name})</span> : '-' },
      { key: 'hindi_name', label: 'Hindi (हिंदी)', render: (row) => row.hindi_name ? <span className="font-medium text-text-secondary">({row.hindi_name})</span> : '-' },
      { key: 'description', label: 'Meaning (સમજૂતી)', render: (row) => row.description || '-' }
    ] : []),
    ...(parentConfig ? [{ key: 'parent_name', label: parentConfig.label, render: (row) => (row.parent_name && !/^[0-9a-fA-F]{24}$/.test(row.parent_name) ? row.parent_name : '-') }] : []),
    { key: 'status', label: 'Status' }
  ], [type, parentConfig])

  if (!label) {
    return (
      <div className="rounded-xl border border-error-border bg-error-bg p-6 text-sm text-error-text">
        Unknown master menu selected.
      </div>
    )
  }

  const customFilters = useMemo(() => {
    if (type === 'education') {
      return (
        <Select
          label="Education Level"
          value={educationLevelFilter}
          onChange={setEducationLevelFilter}
          placeholder="All Levels"
          options={[{ label: 'All Levels', value: '' }, ...EDUCATION_LEVEL_OPTIONS]}
        />
      )
    }
    if (parentConfig) {
      return (
        <Select
          value={filterValue}
          onChange={setFilterValue}
          placeholder={`All ${parentConfig.label}s`}
          options={[{ label: `All ${parentConfig.label}s`, value: '' }, ...parentOptions]}
        />
      )
    }
    return null
  }, [type, educationLevelFilter, parentConfig, filterValue, parentOptions])

  const extraParams = useMemo(() => {
    const params = {}
    if (filterValue) params.parent_id = filterValue
    if (type === 'education' && educationLevelFilter) params.level = educationLevelFilter
    return params
  }, [filterValue, type, educationLevelFilter])

  return (
    <AdminCrudPage
      title={type === 'education' ? 'Education Master' : `${label} Master`}
      subtitle={type === 'education' ? 'Manage school standards, bachelor and master degrees' : `Manage ${label.toLowerCase()} master records`}
      endpoint={MASTER_ENDPOINTS.GET_MASTER(type)}
      fields={fields}
      columns={columns}
      headerLeftContent={headerLeftContent}
      getRowTitle={(row) => row.standard || row.name}
      customFilters={customFilters}
      extraParams={extraParams}
      onApplyFilters={() => {}}
      onClearFilters={() => { setFilterValue(''); setEducationLevelFilter(''); }}
      onToggleFilters={() => setShowFilters(s => !s)}
      extraActiveFiltersCount={(filterValue ? 1 : 0) + (type === 'education' && educationLevelFilter ? 1 : 0)}
      hideFilter={type === 'country'}
      hideAdd={!permissions.canAdd && !permissions.isSuperAdmin}
      hideEdit={!permissions.canEdit && !permissions.isSuperAdmin}
      hideDelete={!permissions.canDelete && !permissions.isSuperAdmin}
    />
  )
}
