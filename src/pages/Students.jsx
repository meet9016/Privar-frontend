import React, { useCallback, useEffect, useState } from 'react'
import { GraduationCap, Phone, Trash2, Search, Edit2, RefreshCw, Plus, Image as ImageIcon } from 'lucide-react'
import api, { assetUrl, getStudentsList } from '../lib/api'
import { confirm } from '../lib/confirm'
import Modal from '../components/Modal'
import usePagination from '../hooks/usePagination'
import YearSelect from '../components/YearSelect'

const limit = 10

export default function Students() {
  const [students, setStudents] = useState([])
  const { page, totalPages, total, setPage, setPaginationData, getParams, resetPage } = usePagination(limit)
  const [loading, setLoading] = useState(false)

  const [formLoading, setFormLoading] = useState(false)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [selectedStudent, setSelectedStudent] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [search, setSearchValue] = useState('')


  const [existingStudentImage, setExistingStudentImage] = useState('')
  const [existingResultImage, setExistingResultImage] = useState('')
  const [imageData, setImageData] = useState({ student_image: null, result_image: null, remove_student_image: false, remove_result_image: false })

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
      setSuccess('Student deleted successfully')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError('Failed to delete student')
    }
  }

  const handleCreate = () => {
    setSelectedStudent(null)
    setExistingStudentImage('')
    setExistingResultImage('')
    setImageData({ student_image: null, result_image: null, remove_student_image: false, remove_result_image: false })
    setIsModalOpen(true)
  }

  const handleEdit = (student) => {
    setSelectedStudent(student)
    setExistingStudentImage(student.student_image || '')
    setExistingResultImage(student.result_image || '')
    setImageData({ student_image: null, result_image: null, remove_student_image: false, remove_result_image: false })
    setIsModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsModalOpen(false)
    setSelectedStudent(null)
    setExistingStudentImage('')
    setExistingResultImage('')
    setImageData({ student_image: null, result_image: null, remove_student_image: false, remove_result_image: false })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormLoading(true)
    setError('')
    const fields = new FormData(e.target)
    const payload = new FormData()
      ;['surname', 'student_name', 'father_name', 'school_name', 'standard', 'percentage', 'mobile_number', 'year', 'status'].forEach(k => payload.append(k, fields.get(k) ?? ''))

    const hasStudentImg = imageData.student_image instanceof FileList ? imageData.student_image.length > 0 : imageData.student_image instanceof File
    const hasResultImg = imageData.result_image instanceof FileList ? imageData.result_image.length > 0 : imageData.result_image instanceof File
    if (hasStudentImg) payload.append('student_image', imageData.student_image instanceof FileList ? imageData.student_image[0] : imageData.student_image)
    if (imageData.remove_student_image) payload.append('remove_student_image', 'true')
    if (hasResultImg) payload.append('result_image', imageData.result_image instanceof FileList ? imageData.result_image[0] : imageData.result_image)
    if (imageData.remove_result_image) payload.append('remove_result_image', 'true')

    try {
      if (selectedStudent) {
        await api.put(`/students/${selectedStudent.id}`, payload)
      } else {
        await api.post('/students', payload)
      }
      await fetchStudents()
      setSuccess(`Student ${selectedStudent ? 'updated' : 'created'} successfully`)
      setIsModalOpen(false)
      setSelectedStudent(null)
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update student')
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
            onClick={fetchStudents}
            className="flex items-center justify-center p-2.5 rounded-xl bg-surface-secondary hover:bg-surface border border-border text-text-secondary hover:text-text transition-all"
            title="Refresh"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          <div className="relative flex-1 sm:w-64">
            <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-text-secondary/60" />
            <input
              type="search"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-input-bg text-text placeholder-text-secondary/50 border border-border rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:border-primary/50"
            />
          </div>
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-glow-primary"
          >
            <Plus className="w-4 h-4" /> Add
          </button>
        </div>
      </div>



      {/* Alerts */}
      {error && (
        <div className="bg-error-bg border border-error-border text-error-text p-4 rounded-2xl text-sm flex items-center gap-2 animate-fade-in shadow-sm">
          <span className="w-2 h-2 rounded-full bg-error animate-ping"></span>
          {error}
        </div>
      )}
      {success && (
        <div className="bg-success-bg border border-success-border text-success-text p-4 rounded-2xl text-sm flex items-center gap-2 animate-fade-in shadow-sm">
          <span className="w-2 h-2 rounded-full bg-success animate-ping"></span>
          {success}
        </div>
      )}

      {/* Main Grid */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <div className="w-8 h-8 rounded-full border-2 border-primary/25 border-t-primary animate-spin"></div>
          <span className="text-text-secondary text-sm">Loading students...</span>
        </div>
      ) : students.length === 0 ? (
        <div className="bg-card border border-border rounded-2xl p-16 text-center shadow-glass-sm flex flex-col items-center justify-center gap-4">
          <GraduationCap className="w-12 h-12 text-text-secondary/40 animate-pulse-slow" />
          <div>
            <h4 className="font-semibold text-text">No students found</h4>
            <p className="text-text-secondary text-sm mt-1">There are no student records matching your criteria</p>
          </div>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-glass-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-secondary text-text-secondary text-sm font-semibold tracking-wider">
                  <th className="p-4">Student</th>
                  <th className="p-4">Father</th>
                  <th className="p-4">School</th>
                  <th className="p-4">Std / %</th>
                  <th className="p-4">Mobile</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">Year </th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-surface-secondary/40 text-sm text-text">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        {student.student_image ? (
                          <img src={assetUrl(student.student_image)} alt={student.student_name}
                            className="w-9 h-9 rounded-full object-cover border border-border shrink-0" />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-surface-secondary border border-border flex items-center justify-center shrink-0">
                            <GraduationCap className="w-4 h-4 text-text-secondary" />
                          </div>
                        )}
                        <span className="font-semibold">{student.surname} {student.student_name}</span>
                      </div>
                    </td>
                    <td className="p-4 text-text-secondary">{student.father_name}</td>
                    <td className="p-4 text-text-secondary max-w-[160px] truncate">{student.school_name}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary text-xs font-semibold">
                        {student.standard}
                      </span>
                      <span className="ml-2 text-text-secondary text-xs">{student.percentage}%</span>
                    </td>
                    <td className="p-4 font-mono text-text-secondary text-xs">
                      {student.mobile_number}
                    </td>
                    
                    <td className="p-4">
                      <span className={`inline-flex px-2.5 py-1 rounded-lg border text-xs font-semibold ${Number(student.status) === 1
                        ? 'bg-success-bg border-success-border text-success-text'
                        : 'bg-warning/10 border-warning/20 text-warning'
                        }`}>
                        {Number(student.status) === 1 ? 'Active' : 'Pending'}
                      </span>
                    </td>
                    <td className="p-4">

                      <span className="ml-2 text-text-secondary text-xs">{student.year}</span>
                    </td>
                    <td className="p-4 text-right">
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-4 py-3 border border-border bg-surface-secondary/40 rounded-xl text-sm">
          <span className="text-text-secondary">
            Page {page} of {totalPages} {total ? `(${total} total)` : ''}
          </span>
          <div className="flex items-center gap-2">
            <button type="button" disabled={loading || page <= 1} onClick={() => setPage((current) => Math.max(1, current - 1))} className="px-3 py-2 rounded-lg border border-border bg-card text-text disabled:opacity-50 disabled:cursor-not-allowed">
              Previous
            </button>
            {pageNumbers.map((item) => (
              <button
                key={item}
                type="button"
                disabled={loading || item === currentPage}
                onClick={() => setPage(item)}
                className={`min-w-10 px-3 py-2 rounded-lg border transition-all ${item === currentPage
                  ? 'border-primary bg-primary/10 text-primary font-semibold disabled:opacity-100 disabled:cursor-default'
                  : 'border-border bg-card text-text hover:bg-surface-secondary disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
              >
                {item}
              </button>
            ))}
            <button type="button" disabled={loading || page >= totalPages} onClick={() => setPage((current) => Math.min(totalPages, current + 1))} className="px-3 py-2 rounded-lg border border-border bg-card text-text disabled:opacity-50 disabled:cursor-not-allowed">
              Next
            </button>
          </div>
        </div>
      )}

      <Modal
        isOpen={isModalOpen}
        title={selectedStudent ? 'Edit Student' : 'Add Student'}
        onClose={handleCloseModal}
      >
        <form onSubmit={handleSubmit} className="space-y-4 text-text">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-text-secondary mb-1.5 block">Surname *</label>
              <input
                type="text"
                name="surname"
                defaultValue={selectedStudent?.surname || ''}
                required
                className="w-full bg-input-bg text-text border border-border hover:border-text-secondary/30 focus:border-primary/50 rounded-xl py-2.5 px-4 text-sm outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={!!(selectedStudent && selectedStudent.surname)}
              />
            </div>
            <div>
              <label className="text-sm text-text-secondary mb-1.5 block">Student Name *</label>
              <input
                type="text"
                name="student_name"
                defaultValue={selectedStudent?.student_name || ''}
                required
                className="w-full bg-input-bg text-text border border-border hover:border-text-secondary/30 focus:border-primary/50 rounded-xl py-2.5 px-4 text-sm outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

            <div>
              <label className="text-sm text-text-secondary mb-1.5 block">Father Name *</label>
              <input
                type="text"
                name="father_name"
                defaultValue={selectedStudent?.father_name || ''}

                className="w-full bg-input-bg text-text border border-border hover:border-text-secondary/30 focus:border-primary/50 rounded-xl py-2.5 px-4 text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-text-secondary mb-1.5 block">School Name *</label>
              <input
                type="text"
                name="school_name"
                defaultValue={selectedStudent?.school_name || ''}
                required
                className="w-full bg-input-bg text-text border border-border hover:border-text-secondary/30 focus:border-primary/50 rounded-xl py-2.5 px-4 text-sm outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-text-secondary mb-1.5 block">Standard *</label>
              <input
                type="text"
                name="standard"
                defaultValue={selectedStudent?.standard || ''}
                required
                className="w-full bg-input-bg text-text border border-border hover:border-text-secondary/30 focus:border-primary/50 rounded-xl py-2.5 px-4 text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-text-secondary mb-1.5 block">Percentage *</label>
              <input
                type="text"
                name="percentage"
                defaultValue={selectedStudent?.percentage || ''}
                required
                className="w-full bg-input-bg text-text border border-border hover:border-text-secondary/30 focus:border-primary/50 rounded-xl py-2.5 px-4 text-sm outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-text-secondary mb-1.5 block">Mobile Number *</label>
              <input
                type="text"
                name="mobile_number"
                defaultValue={selectedStudent?.mobile_number || ''}
                required
                maxLength={10}
                className="w-full bg-input-bg text-text border border-border hover:border-text-secondary/30 focus:border-primary/50 rounded-xl py-2.5 px-4 text-sm outline-none"
              />
            </div>
            <div>
              <label className="text-sm text-text-secondary mb-1.5 block">Year *</label>
              <YearSelect
                name="year"
                required
                defaultValue={selectedStudent?.year || ''}
                className="w-full bg-input-bg text-text border border-border hover:border-text-secondary/30 focus:border-primary/50 rounded-xl py-2.5 px-4 text-sm outline-none"
              />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Student Image */}
            <div className="flex flex-col bg-input-bg border border-border rounded-xl p-3">
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">Student Image</label>
              {(imageData.student_image instanceof File || (imageData.student_image instanceof FileList && imageData.student_image.length > 0)) ? (
                <div className="relative w-20 h-20 mb-2">
                  <img src={URL.createObjectURL(imageData.student_image instanceof FileList ? imageData.student_image[0] : imageData.student_image)}
                    alt="preview" className="w-20 h-20 rounded-lg object-cover border border-border" />
                  <button type="button" onClick={() => setImageData({ ...imageData, student_image: null, remove_student_image: false })}
                    className="absolute -top-1.5 -right-1.5 bg-error text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold" disabled={formLoading}>×</button>
                </div>
              ) : existingStudentImage && !imageData.remove_student_image ? (
                <div className="relative w-20 h-20 mb-2">
                  <img src={assetUrl(existingStudentImage)} alt="current" className="w-20 h-20 rounded-lg object-cover border border-border" />
                  <button type="button" onClick={() => setImageData({ ...imageData, remove_student_image: true })}
                    className="absolute -top-1.5 -right-1.5 bg-error text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold" disabled={formLoading}>×</button>
                </div>
              ) : null}
              <input type="file" accept="image/*"
                onChange={(e) => setImageData({ ...imageData, student_image: e.target.files, remove_student_image: false })}
                className="w-full text-sm text-text-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                disabled={formLoading} />
            </div>

            {/* Result Image */}
            <div className="flex flex-col bg-input-bg border border-border rounded-xl p-3">
              <label className="block text-sm font-semibold text-text-secondary mb-1.5">Result Image</label>
              {(imageData.result_image instanceof File || (imageData.result_image instanceof FileList && imageData.result_image.length > 0)) ? (
                <div className="relative w-20 h-20 mb-2">
                  <img src={URL.createObjectURL(imageData.result_image instanceof FileList ? imageData.result_image[0] : imageData.result_image)}
                    alt="preview" className="w-20 h-20 rounded-lg object-cover border border-border" />
                  <button type="button" onClick={() => setImageData({ ...imageData, result_image: null, remove_result_image: false })}
                    className="absolute -top-1.5 -right-1.5 bg-error text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold" disabled={formLoading}>×</button>
                </div>
              ) : existingResultImage && !imageData.remove_result_image ? (
                <div className="relative w-20 h-20 mb-2">
                  <img src={assetUrl(existingResultImage)} alt="current" className="w-20 h-20 rounded-lg object-cover border border-border" />
                  <button type="button" onClick={() => setImageData({ ...imageData, remove_result_image: true })}
                    className="absolute -top-1.5 -right-1.5 bg-error text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold" disabled={formLoading}>×</button>
                </div>
              ) : null}
              <input type="file" accept="image/*"
                onChange={(e) => setImageData({ ...imageData, result_image: e.target.files, remove_result_image: false })}
                className="w-full text-sm text-text-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
                disabled={formLoading} />
            </div>
          </div>
          <div>
            <label className="text-sm text-text-secondary mb-1.5 block">Status</label>
            <select
              name="status"
              defaultValue={selectedStudent?.status ?? 0}
              className="w-full bg-input-bg text-text border border-border hover:border-text-secondary/30 focus:border-primary/50 rounded-xl py-2.5 px-4 text-sm outline-none"
            >
              <option value={1}>Active</option>
              <option value={0}>Pending</option>
            </select>
          </div>

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
