import React, { useCallback, useEffect, useState } from 'react'
import { GraduationCap, Phone, Trash2, Search, Edit2, RefreshCw, Plus, Image as ImageIcon, Filter } from 'lucide-react'
import api, { assetUrl, getStudentsList } from '../lib/api'
import { confirm } from '../lib/confirm'
import Modal from '../components/Modal'
import usePagination from '../hooks/usePagination'
import YearSelect from '../components/YearSelect'
import FileDropzone from '../components/common/FileDropzone'
import Select from '../components/common/Select'
import Input from '../components/common/Input'
import Table from '../components/common/Table'
import { toast } from '../lib/toast'

export default function Students() {
  const [students, setStudents] = useState([])
  const { page, totalPages, total, setPage, limit, setLimit, setPaginationData, getParams, resetPage } = usePagination(10)
  const [loading, setLoading] = useState(false)

  const [formLoading, setFormLoading] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [search, setSearchValue] = useState('')
  const [showFilters, setShowFilters] = useState(false)


  const [existingStudentImage, setExistingStudentImage] = useState('')
  const [existingResultImage, setExistingResultImage] = useState('')
  const [imageData, setImageData] = useState({ student_image: null, result_image: null, remove_student_image: false, remove_result_image: false })
  const [statusVal, setStatusVal] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const currentPage = Math.min(Math.max(page || 1, 1), totalPages)
  const pageNumbers = Array.from({ length: totalPages }, (_, index) => index + 1)

  const setSearch = (value) => {
    setSearchValue(value)
    setPage(1)
  }


  const fetchStudents = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getStudentsList(getParams({ search }))
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
  }, [search, page])

  useEffect(() => {
    fetchStudents()
  }, [fetchStudents])

  const handleDelete = async (id) => {
    if (!await confirm('Are you sure you want to delete this student?')) return
    try {
      await api.delete(`/students/${id}`)
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
    setStatusVal('')
    setFieldErrors({})
    setError('')
    setIsModalOpen(true)
  }

  const handleEdit = (student) => {
    setSelectedStudent(student)
    setExistingStudentImage(student.student_image || '')
    setExistingResultImage(student.result_image || '')
    setImageData({ student_image: null, result_image: null, remove_student_image: false, remove_result_image: false })
    setStatusVal(student.status !== undefined && student.status !== null ? Number(student.status) : '')
    setFieldErrors({})
    setError('')
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedStudent(null)
    setExistingStudentImage('')
    setExistingResultImage('')
    setImageData({ student_image: null, result_image: null, remove_student_image: false, remove_result_image: false })
    setStatusVal('')
    setFieldErrors({})
    setError('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormLoading(true)
    setError('')
    setFieldErrors({})
    const fields = new FormData(e.target)

    const requiredKeys = ['surname', 'student_name', 'father_name', 'school_name', 'standard', 'percentage', 'mobile_number', 'year']
    const errors = {}
    requiredKeys.forEach(k => {
      const val = fields.get(k)
      if (!val || !val.trim()) {
        errors[k] = true
      }
    })

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

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors)
      setFormLoading(false)
      return
    }

    const payload = new FormData()
    requiredKeys.forEach(k => payload.append(k, fields.get(k) ?? ''))
    payload.append('status', statusVal)

    const hasStudentImg = imageData.student_image instanceof File
    const hasResultImg = imageData.result_image instanceof File
    if (hasStudentImg) payload.append('student_image', imageData.student_image)
    if (imageData.remove_student_image) payload.append('remove_student_image', 'true')
    if (hasResultImg) payload.append('result_image', imageData.result_image)
    if (imageData.remove_result_image) payload.append('remove_result_image', 'true')

    try {
      if (selectedStudent) {
        await api.put(`/students/${selectedStudent.id}`, payload)
      } else {
        await api.post('/students', payload)
      }
      await fetchStudents()
      toast.success(`Student ${selectedStudent ? 'updated' : 'created'} successfully`)
      setIsModalOpen(false)
      setSelectedStudent(null)
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update student')
    } finally {
      setFormLoading(false)
    }
  }





  const groupedStudents = React.useMemo(() => {
    return students.reduce((acc, student) => {
      const year = student.createdAt ? new Date(student.createdAt).getFullYear() : (student.cdate ? new Date(student.cdate).getFullYear() : 'Unknown');
      if (!acc[year]) acc[year] = [];
      acc[year].push(student);
      return acc;
    }, {});
  }, [students]);

  const sortedYears = Object.keys(groupedStudents).sort((a, b) => b === 'Unknown' ? 1 : a === 'Unknown' ? -1 : b - a);

  return (
    <div className="space-y-6 animate-slide-up text-text">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-text">Students</h2>

        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center justify-center p-2.5 rounded-xl border transition-all ${showFilters ? 'bg-primary/10 border-primary/20 text-primary' : 'bg-surface-secondary hover:bg-surface border-border text-text-secondary hover:text-text'}`}
            title="Toggle Filters"
          >
            <Filter className="w-4 h-4" />
          </button>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-glow-primary"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>

      <div className={`transition-all duration-300 ease-in-out ${showFilters ? 'max-h-[500px] opacity-100 mt-4 overflow-visible z-20 relative' : 'max-h-0 opacity-0 mt-0 overflow-hidden pointer-events-none'}`}>
        <div className="bg-surface border border-border rounded-2xl p-5 shadow-glass-sm space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Input
              icon={<Search className="w-4 h-4" />}
              type="search"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex justify-end gap-3 mt-4">
            <button type="button" onClick={fetchStudents} className="text-sm font-medium text-text-secondary hover:text-primary transition-colors flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Refresh Data
            </button>
          </div>
        </div>
      </div>





      {/* Main Table */}
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
            align: 'right',
            render: (student) => (
              <div className="flex items-center justify-end gap-2">
                <button onClick={() => handleEdit(student)}
                  className="p-2 text-primary bg-primary/10 hover:bg-primary/20 border border-primary/20 rounded-xl" title="Edit">
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(student.id)}
                  className="p-2 text-error-text bg-error-bg hover:bg-error/20 border border-error-border rounded-xl" title="Delete">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
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
          description: 'There are no student records matching your criteria'
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
        <form onSubmit={handleSubmit} className="space-y-4 text-text" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Surname"
              name="surname"
              defaultValue={selectedStudent?.surname || ''}
              required
              disabled={!!(selectedStudent && selectedStudent.surname)}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Standard"
              name="standard"
              defaultValue={selectedStudent?.standard || ''}
              required
              error={fieldErrors.standard ? 'Standard is required' : undefined}
              onChange={(e) => {
                e.target.value = e.target.value.replace(/\D/g, '')
                if (fieldErrors.standard) setFieldErrors(prev => ({ ...prev, standard: null }))
              }}
            />
            <Input
              label="Percentage"
              name="percentage"
              type="text"
              defaultValue={selectedStudent?.percentage || ''}
              required
              error={fieldErrors.percentage ? 'Percentage is required' : undefined}
              onChange={(e) => {
                e.target.value = e.target.value.replace(/[^0-9.]/g, '')
                if (fieldErrors.percentage) setFieldErrors(prev => ({ ...prev, percentage: null }))
              }}
            />
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
              <label className="text-sm text-text-secondary mb-1.5 block font-semibold">Year <span className="text-red-500">*</span></label>
              <YearSelect
                name="year"
                required
                defaultValue={selectedStudent?.year || ''}
                className={`w-full bg-input-bg text-text border ${fieldErrors.year ? 'border-red-500' : 'border-border focus:border-primary/50'} rounded-xl py-2.5 px-4 text-sm outline-none`}
                onChange={() => { if (fieldErrors.year) setFieldErrors(prev => ({ ...prev, year: null })) }}
              />
              {fieldErrors.year && <p className="text-red-500 text-xs mt-1 font-semibold">Year is required</p>}
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Student Image */}
            <div className={`flex flex-col bg-input-bg border ${fieldErrors.student_image ? 'border-red-500' : 'border-border'} rounded-xl p-3`}>
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">Student Image <span className="text-red-500">*</span></label>
              <FileDropzone
                accept="image/*"
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
              {fieldErrors.student_image && <p className="text-red-500 text-xs mt-1 font-semibold">{fieldErrors.student_image}</p>}
            </div>

             {/* Result Image */}
            <div className={`flex flex-col bg-input-bg border ${fieldErrors.result_image ? 'border-red-500' : 'border-border'} rounded-xl p-3`}>
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">Result Image <span className="text-red-500">*</span></label>
              <FileDropzone
                accept="image/*"
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
              {fieldErrors.result_image && <p className="text-red-500 text-xs mt-1 font-semibold">{fieldErrors.result_image}</p>}
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

          <button
            type="submit"
            disabled={formLoading}
            className="flex justify-self-end bg-primary hover:bg-primary-hover text-white p-3 rounded-xl font-semibold text-sm tracking-wider  disabled:opacity-50 shadow-glow-primary"
          >
            {formLoading ? 'Saving...' : selectedStudent ? 'Update Student' : 'Add Student'}
          </button>

        </form>
      </Modal>
    </div>
  )
}
