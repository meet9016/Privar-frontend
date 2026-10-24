import React, { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import AdminCrudPage from './AdminCrudPage'
import { masterLabels } from '../config/navigation'
import { GraduationCap, BookOpen, Filter } from 'lucide-react'
import Select from '../components/common/Select'
import api from '../lib/api'
import { MASTER_ENDPOINTS } from '../utils/endpoints'
import usePermissions from '../hooks/usePermissions'

export const STANDARD_LEVEL_OPTIONS = [
  { value: 'Standard / School Level', label: 'Standard / School Level' },
  { value: 'Graduation (Bachelor Degree)', label: 'Graduation (Bachelor Degree)' },
  { value: 'Post Graduation (Master Degree)', label: 'Post Graduation (Master Degree)' }
]

const parentFieldsConfig = {
  state: { source: MASTER_ENDPOINTS.COUNTRY, label: 'Country', key: 'name' },
  city: { source: MASTER_ENDPOINTS.STATE, label: 'State', key: 'name' },
  village: { source: MASTER_ENDPOINTS.CITY, label: 'City', key: 'name' }
}

export default function MasterPage({ type, headerLeftContent }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const isEducationMaster = type === 'standard-level' || type === 'dini-talim'

  const currentTab = isEducationMaster
    ? (searchParams.get('tab') === 'dini-talim' || type === 'dini-talim' ? 'dini-talim' : 'standard-level')
    : type

  const activeType = isEducationMaster ? currentTab : type
  const label = masterLabels[activeType] || masterLabels[type]
  const parentConfig = parentFieldsConfig[activeType]
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
  }, [activeType, parentConfig])

  const handleTabChange = (newTab) => {
    setFilterValue('')
    setShowFilters(false)
    setSearchParams({ tab: newTab }, { replace: true })
  }

  const fields = useMemo(() => [
    ...(activeType === 'standard-level' ? [
      {
        name: 'level',
        label: 'Standard / Level',
        type: 'select',
        required: true,
        placeholder: 'Select Standard / Level',
        options: STANDARD_LEVEL_OPTIONS
      },
      {
        name: 'name',
        label: 'Degree Title',
        required: true,
        placeholder: 'e.g. 10th, 12th, B.Com, B.Sc, M.Sc, MBA'
      }
    ] : activeType === 'dini-talim' ? [
      {
        name: 'name',
        label: 'Dini Talim Title',
        required: true,
        placeholder: 'e.g. Hafiz, Alim, Nazra, Qari, Mufti'
      },
      {
        name: 'description',
        label: 'Meaning / Details (સમજૂતી - Optional)',
        type: 'textarea',
        required: false,
        placeholder: 'દા.ત. કુરાન શરીફ હિફ્ઝ (મોઢે યાદ કરનાર)...',
        transliterate: 'gu'
      }
    ] : [
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
      }] : [])
    ]),
    { name: 'status', label: 'Status', type: 'select', required: true, defaultValue: 1, options: [{ value: 1, label: 'Active' }, { value: 0, label: 'Inactive' }] }
  ], [label, activeType, type, parentConfig])

  const columns = useMemo(() => [
    ...(activeType === 'standard-level' ? [
      {
        key: 'level',
        label: 'Standard / Level',
        render: (row) => {
          const badgeStyle = {
            'Standard / School Level': 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800',
            'Graduation (Bachelor Degree)': 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800',
            'Post Graduation (Master Degree)': 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/40 dark:text-purple-300 dark:border-purple-800'
          }[row.level] || 'bg-surface-secondary text-text-secondary border-border';

          return (
            <span className={`inline-flex items-center px-2.5 py-1 rounded-lg border font-semibold text-xs transition-all shadow-2xs ${badgeStyle}`}>
              {row.level || '-'}
            </span>
          );
        }
      },
      { key: 'name', label: 'Degree Title' }
    ] : activeType === 'dini-talim' ? [
      {
        key: 'name',
        label: 'Dini Talim Title',
        render: (row) => (
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60 flex items-center justify-center font-bold text-xs shrink-0">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="font-semibold text-text text-sm">{row.name}</span>
          </div>
        )
      },
      {
        key: 'description',
        label: 'Details',
        render: (row) => row.description ? (
          <span className="text-xs text-text-secondary max-w-sm block truncate" title={row.description}>
            {row.description}
          </span>
        ) : '-'
      }
    ] : [
      ...(type === 'business' ? [{ key: 'image', label: 'Image', type: 'image' }] : []),
      { key: 'name', label: type === 'relationship' ? 'Relationship (English)' : 'Name' },
      ...(type === 'relationship' ? [
        { key: 'gujarati_name', label: 'Gujarati (ગુજરાતી)', render: (row) => row.gujarati_name ? <span className="font-semibold text-primary">({row.gujarati_name})</span> : '-' },
        { key: 'hindi_name', label: 'Hindi (हिंदी)', render: (row) => row.hindi_name ? <span className="font-medium text-text-secondary">({row.hindi_name})</span> : '-' },
        { key: 'description', label: 'Meaning (સમજૂતી)', render: (row) => row.description || '-' }
      ] : []),
      ...(parentConfig ? [{ key: 'parent_name', label: parentConfig.label, render: (row) => (row.parent_name && !/^[0-9a-fA-F]{24}$/.test(row.parent_name) ? row.parent_name : '-') }] : [])
    ]),
    { key: 'status', label: 'Status' }
  ], [activeType, type, parentConfig])

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
  ) : activeType === 'standard-level' ? (
    <Select
      value={filterValue}
      onChange={setFilterValue}
      placeholder="All Standard / Levels"
      options={[{ label: 'All Standard / Levels', value: '' }, ...STANDARD_LEVEL_OPTIONS]}
    />
  ) : null;

  const extraParams = filterValue
    ? (activeType === 'standard-level' ? { level: filterValue } : (parentConfig ? { parent_id: filterValue } : {}))
    : {};

  const educationHeaderTabs = isEducationMaster ? (
    <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto">
      <div>
        <h2 className="text-lg sm:text-xl font-bold text-text flex items-center gap-2">
          {currentTab === 'standard-level' ? (
            <>
              <GraduationCap className="w-5 h-5 text-primary" />
              <span>Standard / Level Master</span>
            </>
          ) : (
            <>
              <BookOpen className="w-5 h-5 text-primary" />
              <span>Dini Talim Master (દીની તાલીમ)</span>
            </>
          )}
        </h2>
        <p className="text-xs text-text-secondary mt-0.5">
          {currentTab === 'standard-level'
            ? 'Manage school standards, graduation degrees, and post-graduation programs'
            : 'Manage Islamic & religious education qualifications (e.g. Nazra, Hafiz, Alim, Qari)'}
        </p>
      </div>

      <div className="inline-flex items-center p-1 bg-surface-secondary/80 backdrop-blur-md rounded-xl border border-border shadow-2xs w-fit">
        <button
          type="button"
          onClick={() => handleTabChange('standard-level')}
          className={`relative flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-all duration-200 outline-none whitespace-nowrap cursor-pointer ${currentTab === 'standard-level'
            ? 'bg-primary text-white shadow-sm'
            : 'text-text-secondary hover:text-text hover:bg-surface/60'
            }`}
        >
          <GraduationCap className="w-4 h-4" />
          <span>Standard / Level</span>
        </button>

        <button
          type="button"
          onClick={() => handleTabChange('dini-talim')}
          className={`relative flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-bold rounded-lg transition-all duration-200 outline-none whitespace-nowrap cursor-pointer ${currentTab === 'dini-talim'
            ? 'bg-primary text-white shadow-sm'
            : 'text-text-secondary hover:text-text hover:bg-surface/60'
            }`}
        >
          <BookOpen className="w-4 h-4" />
          <span>Dini Talim (દીની તાલીમ)</span>
        </button>
      </div>
    </div>
  ) : null;

  return (
    <AdminCrudPage
      key={activeType}
      title={`${label} Master`}
      subtitle={`Manage ${label.toLowerCase()} master records`}
      endpoint={MASTER_ENDPOINTS.GET_MASTER(activeType)}
      fields={fields}
      columns={columns}
      headerLeftContent={headerLeftContent || educationHeaderTabs}
      getRowTitle={(row) => row.name}
      customFilters={customFilters}
      extraParams={extraParams}
      onApplyFilters={() => { }}
      onClearFilters={() => setFilterValue('')}
      onToggleFilters={() => setShowFilters(s => !s)}
      extraActiveFiltersCount={filterValue ? 1 : 0}
      hideFilter={activeType === 'country' || activeType === 'dini-talim'}
      hideAdd={!permissions.canAdd && !permissions.isSuperAdmin}
      hideEdit={!permissions.canEdit && !permissions.isSuperAdmin}
      hideDelete={!permissions.canDelete && !permissions.isSuperAdmin}
    />
  )
}
