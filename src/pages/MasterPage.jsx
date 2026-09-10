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
  city: { source: MASTER_ENDPOINTS.STATE, label: 'State', key: 'name' },
  village: { source: MASTER_ENDPOINTS.CITY, label: 'City', key: 'name' }
}

export default function MasterPage({ type, headerLeftContent }) {
  const label = masterLabels[type]
  const parentConfig = parentFieldsConfig[type]
  const permissions = usePermissions('masters')
  
  const [filterValue, setFilterValue] = useState('')
  const [showFilters, setShowFilters] = useState(false)
  const [parentOptions, setParentOptions] = useState([])

  useEffect(() => {
    setFilterValue('')
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
    { name: 'name', label: `${label} Name (English)`, required: true, placeholder: type === 'relationship' ? 'e.g. Son-in-law, Sister' : `${label} Name` },
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
    { key: 'name', label: type === 'relationship' ? 'Relationship (English)' : 'Name' },
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

  const customFilters = parentConfig ? (
    <Select
      value={filterValue}
      onChange={setFilterValue}
      placeholder={`All ${parentConfig.label}s`}
      options={[{ label: `All ${parentConfig.label}s`, value: '' }, ...parentOptions]}
    />
  ) : null;

  const extraParams = filterValue ? { parent_id: filterValue } : {};

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
      onClearFilters={() => setFilterValue('')}
      onToggleFilters={() => setShowFilters(s => !s)}
      extraActiveFiltersCount={filterValue ? 1 : 0}
      hideFilter={type === 'country'}
      hideAdd={!permissions.canAdd && !permissions.isSuperAdmin}
      hideEdit={!permissions.canEdit && !permissions.isSuperAdmin}
      hideDelete={!permissions.canDelete && !permissions.isSuperAdmin}
    />
  )
}
