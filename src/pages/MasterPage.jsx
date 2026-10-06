import React, { useMemo, useState, useEffect } from 'react'
import AdminCrudPage from './AdminCrudPage'
import { masterLabels } from '../config/navigation'
import { Filter } from 'lucide-react'
import Select from '../components/common/Select'
import api from '../lib/api'
import { MASTER_ENDPOINTS } from '../utils/endpoints'
import usePermissions from '../hooks/usePermissions'

const parentFieldsConfig = {
  state: { source: MASTER_ENDPOINTS.COUNTRY, label: 'Country', key: 'name' },
  district: { source: MASTER_ENDPOINTS.STATE, label: 'State', key: 'name' },
  city: { source: MASTER_ENDPOINTS.DISTRICT, label: 'District', key: 'name' },
  village: { source: MASTER_ENDPOINTS.CITY, label: 'City', key: 'name' }
}

const EDUCATION_CATEGORY_OPTIONS = [
  { value: 'standard', label: 'Standard / School Level' },
  { value: 'bachelor-degree', label: 'Graduation (Bachelor Degree)' },
  { value: 'master-degree', label: 'Post Graduation (Master Degree)' }
]

export default function MasterPage({ type, headerLeftContent }) {
  const label = masterLabels[type] || (type === 'standard' ? 'Standard / Level' : type)
  const parentConfig = parentFieldsConfig[type]
  const permissions = usePermissions('masters')
  
  const [filterValue, setFilterValue] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [parentOptions, setParentOptions] = useState([])

  useEffect(() => {
    setFilterValue('')
    setCategoryFilter('')
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
    ...(type === 'standard' ? [
      {
        name: 'category',
        label: 'Education Category / Level Type',
        type: 'select',
        required: true,
        defaultValue: 'standard',
        options: EDUCATION_CATEGORY_OPTIONS,
        className: 'sm:col-span-2'
      }
    ] : []),
    { 
      name: 'name', 
      label: type === 'standard' ? 'Name / Degree Title' : `${label} Name`, 
      required: true, 
      placeholder: type === 'relationship' 
        ? 'e.g. Son-in-law, Sister' 
        : (type === 'sub-caste' 
            ? 'દા.ત. પાયા, ખાગડા, વાઘડા' 
            : (type === 'standard'
                ? 'e.g. Std 1, Jr. KG, B.Com, B.Tech, M.Com, MBA'
                : `${label} Name`)), 
      transliterate: type === 'sub-caste' ? 'gu' : undefined 
    },
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
    { key: 'name', label: type === 'relationship' ? 'Relationship (English)' : (type === 'standard' ? 'Standard / Degree Name' : 'Name') },
    ...(type === 'standard' ? [
      {
        key: 'category',
        label: 'Category',
        render: (row) => {
          const cat = row.category || 'standard'
          if (cat === 'bachelor-degree' || cat === 'graduation') {
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/10 text-blue-500">Graduation</span>
          }
          if (cat === 'master-degree' || cat === 'post-graduation') {
            return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-500/10 text-purple-500">Post Graduation</span>
          }
          return <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-500">Standard / Level</span>
        }
      }
    ] : []),
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

  const customFilters = type === 'standard' ? (
    <Select
      value={categoryFilter}
      onChange={setCategoryFilter}
      placeholder="All Categories"
      options={[{ label: 'All Categories', value: '' }, ...EDUCATION_CATEGORY_OPTIONS]}
    />
  ) : parentConfig ? (
    <Select
      value={filterValue}
      onChange={setFilterValue}
      placeholder={`All ${parentConfig.label}s`}
      options={[{ label: `All ${parentConfig.label}s`, value: '' }, ...parentOptions]}
    />
  ) : null;

  const extraParams = useMemo(() => {
    const params = {}
    if (filterValue) params.parent_id = filterValue
    if (categoryFilter) params.category = categoryFilter
    return params
  }, [filterValue, categoryFilter])

  return (
    <AdminCrudPage
      title={`${label} Master`}
      subtitle={`Manage ${label.toLowerCase()} master records`}
      endpoint={MASTER_ENDPOINTS.GET_MASTER(type)}
      fields={fields}
      columns={columns}
      headerLeftContent={headerLeftContent}
      getRowTitle={(row) => row.name}
      customFilters={customFilters}
      extraParams={extraParams}
      onApplyFilters={() => {}}
      onClearFilters={() => {
        setFilterValue('')
        setCategoryFilter('')
      }}
      onToggleFilters={() => setShowFilters(s => !s)}
      extraActiveFiltersCount={(filterValue ? 1 : 0) + (categoryFilter ? 1 : 0)}
      hideFilter={type === 'country'}
      hideAdd={!permissions.canAdd && !permissions.isSuperAdmin}
      hideEdit={!permissions.canEdit && !permissions.isSuperAdmin}
      hideDelete={!permissions.canDelete && !permissions.isSuperAdmin}
    />
  )
}
