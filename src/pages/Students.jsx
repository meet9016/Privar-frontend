import React, { useCallback, useContext, useEffect, useState } from 'react'
import { GraduationCap, Phone, Trash2, Search, Edit2, RefreshCw, Plus, Image as ImageIcon, Filter, X } from 'lucide-react'
import api, { assetUrl, getStudentsList, getCommunitySurname } from '../lib/api'
import { STUDENT_ENDPOINTS } from '../utils/endpoints'
import { confirm } from '../lib/confirm'
import Modal from '../components/Modal'
import usePagination from '../hooks/usePagination'
import YearSelect from '../components/YearSelect'
import FileDropzone from '../components/common/FileDropzone'
import Select from '../components/common/Select'
import Input from '../components/common/Input'
import Button from '../components/common/Button'
import Table from '../components/common/Table'
import SearchInput from '../components/common/SearchInput'
import FilterPopover from '../components/common/FilterPopover'
import { toast } from '../lib/toast'
import useDebounce from '../hooks/useDebounce'

import { AuthContext } from '../context/AuthContext'
import usePermissions from '../hooks/usePermissions'

export default function Students({ headerLeftContent }) {
  const { user: currentUser } = useContext(AuthContext)
  const permissions = usePermissions('students')
  const [students, setStudents] = useState([])
  const { page, totalPages, total, setPage, limit, setLimit, setPaginationData, getParams, resetPage } = usePagination(15)
  const [loading, setLoading] = useState(false)

  const [formLoading, setFormLoading] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [search, setSearchValue] = useState('')
  const debouncedSearch = useDebounce(search, 400)
  const [filters, setFilters] = useState({ status: '', year: '' })
  const [draftFilters, setDraftFilters] = useState({ status: '', year: '' })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedStdTab, setSelectedStdTab] = useState('all')

  const [existingStudentImage, setExistingStudentImage] = useState('')
  const [existingResultImage, setExistingResultImage] = useState('')
  const [imageData, setImageData] = useState({ student_image: null, result_image: null, remove_student_image: false, remove_result_image: false })
  const [statusVal, setStatusVal] = useState('')
  const [standardVal, setStandardVal] = useState('')
  const [streamVal, setStreamVal] = useState('')
  const [degreeVal, setDegreeVal] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const baseStandardOptions = [
    { label: 'Jr. KG', value: 'Jr. KG' },
    { label: 'Sr. KG', value: 'Sr. KG' },
    ...Array.from({ length: 10 }, (_, i) => ({ label: `Std ${i + 1}`, value: `${i + 1}` })),
    { label: 'Std 11', value: '11' },
    { label: 'Std 12', value: '12' },
    { label: 'Graduation (Bachelor Degree)', value: 'Graduation' },
    { label: 'Post Graduation (Master Degree)', value: 'Post Graduation' }
  ]

  const streamOptions = [
    { label: 'Commerce', value: 'Commerce' },
    { label: 'Science', value: 'Science' },
    { label: 'Arts', value: 'Arts' }
  ]

  const stdTabs = [
    { label: 'All', value: 'all' },
    { label: 'Jr. KG', value: 'Jr. KG' },
    { label: 'Sr. KG', value: 'Sr. KG' },
    ...Array.from({ length: 10 }, (_, i) => ({ label: `Std ${i + 1}`, value: `${i + 1}` })),
    { label: 'Std 11', value: '11' },
    { label: 'Std 12', value: '12' },
    { label: 'Graduation', value: 'Graduation' },
    { label: 'Post Graduation', value: 'Post Graduation' }
  ]

  const currentPage = Math.min(Math.max(page || 1, 1), totalPages)
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)

  const setSearch = (value) => {
    setSearchValue(value)
    setPage(1)
  }

  const fetchStudents = useCallback(async () => {
    setLoading(true)
    try {
      const params = getParams({ search: debouncedSearch, ...filters })
      if (selectedStdTab && selectedStdTab !== 'all') {
        params.standard = selectedStdTab
      }
      const res = await getStudentsList(params)
      const rows = res.data?.data || res.data || []
      const pg = res.data?.pagination || {}
      setStudents(Array.isArray(rows) ? rows : [])
      setPaginationData(pg)
    } catch (err) {
      setStudents([])
      setPaginationData({ page: 1, totalPages: 1, total: 0 })
      setError(err.response?.data?.message || 'Failed to load students')
    } finally {
      setLoading(false)
    }
  }, [debouncedSearch, page, selectedStdTab, getParams, setPaginationData, filters])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  const handleDelete = async (id) => {
    if (!await confirm('Are you sure you want to delete this student?')) return
    try {
      await api.delete(STUDENT_ENDPOINTS.DELETE_STUDENT(id))
      await fetchStudents()
      toast.success('Student deleted successfully')
    } catch (err) {
      toast.error('Failed to delete student')
    }
  }

  const handleCreate = () => {
    setSelectedStudent(null)
    setExistingStudentImage('')
    setExistingResultImage('')
    setImageData({ student_image: null, result_image: null, remove_student_image: false, remove_result_image: false })
    setStatusVal(1)
    setStandardVal('')
    setStreamVal('')
    setDegreeVal('')
    setFieldErrors({})
    setError('')
    setIsModalOpen(true)
  }

  const handleEdit = (student) => {
    setSelectedStudent(student)
    setExistingStudentImage(student.student_image || '')
    setExistingResultImage(student.result_image || '')
    setImageData({ student_image: null, result_image: null, remove_student_image: false, remove_result_image: false })
    setStatusVal(student.status !== undefined && student.status !== null ? Number(student.status) : 1)
    
    const rawStd = student.standard ? String(student.standard) : ''
    // Parse if it was saved like "11 (Commerce)" or "Graduation - B.Com"
    if (rawStd.startsWith('11') || rawStd.startsWith('Std 11')) {
      setStandardVal('11')
      const match = rawStd.match(/\((.*?)\)/)
      setStreamVal(match ? match[1] : '')
      setDegreeVal('')
    } else if (rawStd.startsWith('12') || rawStd.startsWith('Std 12')) {
      setStandardVal('12')
      const match = rawStd.match(/\((.*?)\)/)
      setStreamVal(match ? match[1] : '')
      setDegreeVal('')
    } else if (rawStd.startsWith('Graduation')) {
      setStandardVal('Graduation')
      const parts = rawStd.split('-')
      setDegreeVal(parts[1] ? parts.slice(1).join('-').trim() : '')
      setStreamVal('')
    } else if (rawStd.startsWith('Post Graduation')) {
      setStandardVal('Post Graduation')
      const parts = rawStd.split('-')
      setDegreeVal(parts[1] ? parts.slice(1).join('-').trim() : '')
      setStreamVal('')
    } else {
      setStandardVal(rawStd)
      setStreamVal('')
      setDegreeVal('')
    }
    
    setFieldErrors({})
    setError('')
    setIsModalOpen(true)
  }

  const defaultSurname = getCommunitySurname()

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedStudent(null)
    setExistingStudentImage('')
    setExistingResultImage('')
    setImageData({ student_image: null, result_image: null, remove_student_image: false, remove_result_image: false })
    setStatusVal('')
    setStandardVal('')
    setStreamVal('')
    setDegreeVal('')
    setFieldErrors({})
    setError('')
  }

  const handleOpenAdd = () => {
    setSelectedStudent(null)
    setExistingStudentImage('')
    setExistingResultImage('')
    setImageData({ student_image: null, result_image: null, remove_student_image: false, remove_result_image: false })
    setStatusVal(1)
    setStandardVal('1')
    setFieldErrors({})
    setError('')
    setIsModalOpen(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormLoading(true)
    setError('')
    setFieldErrors({})
    const fields = new FormData(e.target)

    const requiredKeys = ['surname', 'student_name', 'father_name', 'school_name', 'percentage', 'mobile_number', 'year']
    const errors = {}
    requiredKeys.forEach(k => {
      const val = fields.get(k)
      if (!val || !val.trim()) {
        errors[k] = true
      }
    })

    if (!standardVal || !standardVal.trim()) {
      errors.standard = 'Standard is required'
    }

    if (statusVal === '' || statusVal === undefined || statusVal === null) {
      errors.status = true
    }

    // Check if student image is provided
    const hasExistingStudent = existingStudentImage && !imageData.remove_student_image
    const hasNewStudent = imageData.student_image instanceof File
    if (!hasExistingStudent && !hasNewStudent) {
      errors.student_image = 'Student Image is required'
    }

    // Check if result image is provided (either has an existing one not removed, or a new file selected)
    const hasExistingResult = existingResultImage && !imageData.remove_result_image
    const hasNewResult = imageData.result_image instanceof File
    if (!hasExistingResult && !hasNewResult) {
      errors.result_image = 'Result Image is required'
    }

    let finalStandard = standardVal
    if (standardVal === '11' || standardVal === '12') {
      if (!streamVal) {
        errors.stream = 'Please select a stream'
      } else {
        finalStandard = `Std ${standardVal} (${streamVal})`
      }
    } else if (standardVal === 'Graduation') {
      if (!degreeVal.trim()) {
        errors.degree = 'Please enter degree / course name (e.g. B.Com, B.Tech, BBA)'
      } else {
        finalStandard = `Graduation - ${degreeVal.trim()}`
      }
    } else if (standardVal === 'Post Graduation') {
      if (!degreeVal.trim()) {
        errors.degree = 'Please enter master degree / course name (e.g. M.Com, MBA, M.Tech)'
      } else {
        finalStandard = `Post Graduation - ${degreeVal.trim()}`
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setFormLoading(false)
      return
    }

    const payload = new FormData()
    requiredKeys.forEach(k => payload.append(k, fields.get(k) ?? ''))
    payload.append('standard', finalStandard)
    payload.append('status', statusVal)

    const hasStudentImg = imageData.student_image instanceof File
    const hasResultImg = imageData.result_image instanceof File
    if (hasStudentImg) payload.append('student_image', imageData.student_image)
    if (imageData.remove_student_image) payload.append('remove_student_image', 'true')
    if (hasResultImg) payload.append('result_image', imageData.result_image)
    if (imageData.remove_result_image) payload.append('remove_result_image', 'true')

    try {
      if (selectedStudent) {
        await api.put(STUDENT_ENDPOINTS.UPDATE_STUDENT(selectedStudent.id || selectedStudent._id), payload)
        toast.success('Student updated successfully')
      } else {
        await api.post(STUDENT_ENDPOINTS.CREATE_STUDENT, payload)
        toast.success('Student added successfully')
      }
      handleCloseModal()
      fetchStudents()
    } catch (err) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to save student')
    } finally {
      setFormLoading(false)
    }
  }

  return (
    <div className="space-y-6 text-text">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex-1 overflow-x-auto hide-scrollbar">
          {headerLeftContent ? headerLeftContent : (
            <h2 className="text-2xl font-bold text-text tracking-tight">Students</h2>
          )}
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <SearchInput
            placeholder="Search students..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <FilterPopover
            isOpen={showFilters}
            onToggle={() => {
              setDraftFilters(filters)
              setShowFilters(!showFilters)
            }}
            onClose={() => setShowFilters(false)}
            activeCount={(filters.status ? 1 : 0) + (filters.year ? 1 : 0)}
            onClear={() => {
              setDraftFilters({ status: '', year: '' })
              setFilters({ status: '', year: '' })
              setShowFilters(false)
            }}
            onApply={() => {
              setFilters(draftFilters)
              setShowFilters(false)
            }}
          >
            <Select
              label="Status"
              value={draftFilters.status}
              onChange={(val) => setDraftFilters(current => ({ ...current, status: val }))}
              placeholder="All Status"
              searchable={false}
              options={[
                { label: 'All Status', value: '' },
                { label: 'Active', value: '1' },
                { label: 'Inactive', value: '0' }
              ]}
            />
            <div className="space-y-1">
              <label className="block text-xs font-semibold text-text-secondary">Year</label>
              <YearSelect
                value={draftFilters.year}
                onChange={(val) => setDraftFilters(current => ({ ...current, year: val }))}
                placeholder="All Years"
                className="h-10"
              />
            </div>
          </FilterPopover>
          {!permissions.canAdd && !permissions.isSuperAdmin ? null : (
            <Button onClick={handleCreate} variant="primary" icon={<Plus className="w-4 h-4" />} className="h-10">
              Add Student
            </Button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 overflow-x-auto pb-1 custom-scrollbar">
        {stdTabs.map((tab) => {
          const isActive = selectedStdTab === tab.value
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => {
                setSelectedStdTab(tab.value)
                setPage(1)
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-colors duration-150 cursor-pointer ${
                isActive
                  ? 'bg-primary text-white font-bold shadow-sm'
                  : 'bg-surface-secondary hover:bg-surface border border-border text-text-secondary hover:text-text'
              }`}
            >
              {tab.label}
            </button>
          )
        })}
      </div>
      <Table
        columns={[
          {
            key: 'student',
            header: 'Student',
            render: (student) => (
              <div className="flex items-center gap-3">
                {student.student_image ? (
                  <img src={assetUrl(student.student_image)} alt={student.student_name}
                    className="w-9 h-9 rounded-full object-cover border border-border shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-surface-secondary border border-border flex items-center justify-center shrink-0">
                    <GraduationCap className="w-4 h-4 text-text-secondary" />
                  </div>
                )}
                <span className="font-semibold text-text">{student.surname} {student.student_name}</span>
              </div>
            )
          },
          { key: 'father_name', header: 'Father' },
          { key: 'school_name', header: 'School' },
          {
            key: 'standard',
            header: 'Std / %',
            render: (student) => (
              <>
                <span className="inline-flex items-center px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                  {student.standard}
                </span>
                <span className="ml-2 text-text-secondary text-xs">{student.percentage}%</span>
              </>
            )
          },
          { key: 'mobile_number', header: 'Mobile' },
          {
            key: 'status',
            header: 'Status',
            render: (student) => (
              <span className={`inline-flex px-2.5 py-1 rounded-lg border text-xs font-semibold ${Number(student.status) === 1
                ? 'bg-success-bg border-success-border text-success-text'
                : 'bg-warning/10 border-warning/20 text-warning'
              }`}>
                {Number(student.status) === 1 ? 'Active' : 'Pending'}
              </span>
            )
          },
          { key: 'year', header: 'Year' },
          {
            key: 'actions',
            header: 'Actions',
            align: 'left',
            render: student => ( <div className="flex items-center justify-start gap-2">
                {!permissions.canEdit && !permissions.isSuperAdmin ? null : (
                  <button onClick={() => handleEdit(student)}
                    className="p-2 text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl" title="Edit">
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                )}
                {!permissions.canDelete && !permissions.isSuperAdmin ? null : (
                  <button onClick={() => handleDelete(student.id)}
                    className="p-2 text-error-text bg-error-bg hover:bg-error/20 border border-error-border rounded-xl" title="Delete">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )
          }
        ]}
        data={students}
        keyField="id"
        loading={loading}
        emptyState={{
          icon: GraduationCap,
          title: 'No students found',
          description: 'There are no student records matching your criteria',
          actionLabel: 'Add Student',
          onAction: handleCreate
        }}
        pagination={{
          currentPage: page,
          totalPages,
          total,
          loading,
          onPageChange: setPage,
          limit,
          onLimitChange: (newLimit) => { setLimit(newLimit); setPage(1); }
        }}
      />

      <Modal
        isOpen={isModalOpen}
        title={selectedStudent ? 'Edit Student' : 'Add Student'}
        onClose={handleCloseModal}
      >
        <form key={selectedStudent?._id || selectedStudent?.id || 'new'} onSubmit={handleSubmit} className="space-y-4 text-text" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Surname"
              name="surname"
              defaultValue={selectedStudent?.surname || defaultSurname}
              required
              error={fieldErrors.surname ? 'Surname is required' : undefined}
              onChange={(e) => {
                e.target.value = e.target.value.replace(/[^a-zA-Z\s]/g, '')
                if (fieldErrors.surname) setFieldErrors(prev => ({ ...prev, surname: null }))
              }}
            />
            <Input
              label="Student Name"
              name="student_name"
              defaultValue={selectedStudent?.student_name || ''}
              required
              error={fieldErrors.student_name ? 'Student Name is required' : undefined}
              onChange={(e) => {
                e.target.value = e.target.value.replace(/[^a-zA-Z\s]/g, '')
                if (fieldErrors.student_name) setFieldErrors(prev => ({ ...prev, student_name: null }))
              }}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Father Name"
              name="father_name"
              defaultValue={selectedStudent?.father_name || ''}
              required
              error={fieldErrors.father_name ? 'Father Name is required' : undefined}
              onChange={(e) => {
                e.target.value = e.target.value.replace(/[^a-zA-Z\s]/g, '')
                if (fieldErrors.father_name) setFieldErrors(prev => ({ ...prev, father_name: null }))
              }}
            />
            <Input
              label="School Name"
              name="school_name"
              defaultValue={selectedStudent?.school_name || ''}
              required
              error={fieldErrors.school_name ? 'School Name is required' : undefined}
              onChange={() => { if (fieldErrors.school_name) setFieldErrors(prev => ({ ...prev, school_name: null })) }}
            />
          </div>

          <div className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
              <div>
                <Select
                  label="Standard / Level"
                  name="standard"
                  required
                  value={standardVal}
                  placeholder="Select Standard"
                  options={baseStandardOptions}
                  error={fieldErrors.standard}
                  onChange={(val) => {
                    setStandardVal(val)
                    if (val !== '11' && val !== '12') setStreamVal('')
                    if (val !== 'Graduation' && val !== 'Post Graduation') setDegreeVal('')
                    if (fieldErrors.standard) setFieldErrors(prev => ({ ...prev, standard: null, stream: null, degree: null }))
                  }}
                />
              </div>

              {/* Slide-in side dropdown for 11th & 12th stream */}
              {(standardVal === '11' || standardVal === '12') && (
                <div className="animate-in fade-in slide-in-from-left-4 duration-300">
                  <Select
                    label={`Stream (Std ${standardVal})`}
                    required
                    value={streamVal}
                    placeholder="Select Stream (Commerce, Science, Arts)"
                    options={streamOptions}
                    error={fieldErrors.stream}
                    onChange={(val) => {
                      setStreamVal(val)
                      if (fieldErrors.stream) setFieldErrors(prev => ({ ...prev, stream: null }))
                    }}
                  />
                </div>
              )}

              {/* Slide-down input for Graduation & Post Graduation */}
              {(standardVal === 'Graduation' || standardVal === 'Post Graduation') && (
                <div className="animate-in fade-in slide-in-from-top-3 duration-300">
                  <Input
                    label={standardVal === 'Graduation' ? 'Bachelor Degree / Course' : 'Master Degree / Course'}
                    placeholder={standardVal === 'Graduation' ? 'e.g. B.Com, B.Tech, BBA, MBBS, BCA' : 'e.g. M.Com, MBA, M.Tech, MD, MCA'}
                    required
                    value={degreeVal}
                    error={fieldErrors.degree}
                    onChange={(e) => {
                      setDegreeVal(e.target.value)
                      if (fieldErrors.degree) setFieldErrors(prev => ({ ...prev, degree: null }))
                    }}
                  />
                </div>
              )}

              {/* If not 11/12/Grad, Percentage takes right slot, otherwise it goes on next row */}
              {standardVal !== '11' && standardVal !== '12' && standardVal !== 'Graduation' && standardVal !== 'Post Graduation' && (
                <Input
                  label="Percentage"
                  name="percentage"
                  type="text"
                  defaultValue={selectedStudent?.percentage || ''}
                  required
                  placeholder="e.g. 11.22"
                  maxLength={5}
                  error={fieldErrors.percentage ? 'Percentage is required' : undefined}
                  onChange={(e) => {
                    let val = e.target.value.replace(/[^0-9.]/g, '')
                    const parts = val.split('.')
                    if (parts.length > 2) {
                      val = parts[0] + '.' + parts.slice(1).join('')
                    }
                    const digitCount = val.replace(/\./g, '').length
                    if (digitCount > 4) {
                      let counted = 0
                      let newVal = ''
                      for (let char of val) {
                        if (char === '.') {
                          newVal += char
                        } else if (counted < 4) {
                          newVal += char
                          counted++
                        }
                      }
                      val = newVal
                    }
                    if (parseFloat(val) > 100) {
                      val = '100'
                    }
                    e.target.value = val
                    if (fieldErrors.percentage) setFieldErrors(prev => ({ ...prev, percentage: null }))
                  }}
                />
              )}
            </div>

            {/* When standard is 11, 12, Graduation or Post Graduation, render Percentage on its own row */}
            {(standardVal === '11' || standardVal === '12' || standardVal === 'Graduation' || standardVal === 'Post Graduation') && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input
                  label="Percentage"
                  name="percentage"
                  type="text"
                  defaultValue={selectedStudent?.percentage || ''}
                  required
                  placeholder="e.g. 11.22"
                  maxLength={5}
                  error={fieldErrors.percentage ? 'Percentage is required' : undefined}
                  onChange={(e) => {
                    let val = e.target.value.replace(/[^0-9.]/g, '')
                    const parts = val.split('.')
                    if (parts.length > 2) {
                      val = parts[0] + '.' + parts.slice(1).join('')
                    }
                    const digitCount = val.replace(/\./g, '').length
                    if (digitCount > 4) {
                      let counted = 0
                      let newVal = ''
                      for (let char of val) {
                        if (char === '.') {
                          newVal += char
                        } else if (counted < 4) {
                          newVal += char
                          counted++
                        }
                      }
                      val = newVal
                    }
                    if (parseFloat(val) > 100) {
                      val = '100'
                    }
                    e.target.value = val
                    if (fieldErrors.percentage) setFieldErrors(prev => ({ ...prev, percentage: null }))
                  }}
                />
              </div>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Mobile Number"
              name="mobile_number"
              type="text"
              required
              maxLength={10}
              defaultValue={selectedStudent?.mobile_number || ''}
              error={fieldErrors.mobile_number ? 'Mobile Number is required' : undefined}
              onChange={(e) => {
                e.target.value = e.target.value.replace(/\D/g, '').slice(0, 10)
                if (fieldErrors.mobile_number) setFieldErrors(prev => ({ ...prev, mobile_number: null }))
              }}
            />
            <div>
              <YearSelect
                name="year"
                label="Year"
                required
                defaultValue={selectedStudent?.year || ''}
                onChange={() => { if (fieldErrors.year) setFieldErrors(prev => ({ ...prev, year: null })) }}
                error={fieldErrors.year ? 'Year is required' : undefined}
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Student Image */}
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">Student Image <span className="text-red-500">*</span></label>
              <FileDropzone
                accept="image/*"
                error={fieldErrors.student_image}
                onFilesSelected={(files) => {
                  setImageData({ ...imageData, student_image: files[0] || null, remove_student_image: false })
                  if (fieldErrors.student_image) setFieldErrors(prev => ({ ...prev, student_image: null }))
                }}
                disabled={formLoading}
                label="Click or Drag Student Image"
                previews={[
                  ...(existingStudentImage && !imageData.remove_student_image ? [{
                    url: assetUrl(existingStudentImage),
                    onRemove: () => setImageData({ ...imageData, remove_student_image: true })
                  }] : []),
                  ...(imageData.student_image instanceof File ? [{
                    url: URL.createObjectURL(imageData.student_image),
                    onRemove: () => setImageData({ ...imageData, student_image: null, remove_student_image: false })
                  }] : [])
                ]}
              />
            </div>

             {/* Result Image */}
            <div>
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">Result Image <span className="text-red-500">*</span></label>
              <FileDropzone
                accept="image/*"
                error={fieldErrors.result_image}
                onFilesSelected={(files) => {
                  setImageData({ ...imageData, result_image: files[0] || null, remove_result_image: false })
                  if (fieldErrors.result_image) setFieldErrors(prev => ({ ...prev, result_image: null }))
                }}
                disabled={formLoading}
                label="Click or Drag Result Image"
                previews={[
                  ...(existingResultImage && !imageData.remove_result_image ? [{
                    url: assetUrl(existingResultImage),
                    onRemove: () => setImageData({ ...imageData, remove_result_image: true })
                  }] : []),
                  ...(imageData.result_image instanceof File ? [{
                    url: URL.createObjectURL(imageData.result_image),
                    onRemove: () => setImageData({ ...imageData, result_image: null, remove_result_image: false })
                  }] : [])
                ]}
              />
            </div>
          </div>
          <Select
            label="Status"
            name="status"
            required
            value={statusVal}
            onChange={(val) => {
              setStatusVal(val)
              if (fieldErrors.status) setFieldErrors(prev => ({ ...prev, status: null }))
            }}
            searchable={false}
            placeholder="Select Status"
            options={[
              { label: 'Active', value: 1 },
              { label: 'Pending', value: 0 }
            ]}
            error={fieldErrors.status ? 'Status is required' : undefined}
          />

          <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
              disabled={formLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              isLoading={formLoading}
              disabled={formLoading}
            >
              {formLoading ? 'Saving...' : 'Save'}
            </Button>
          </div>

        </form>
      </Modal>
    </div>
  )
}



