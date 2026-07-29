import React, { useContext, useEffect, useMemo, useState } from 'react'
import { AuthContext } from '../context/AuthContext'


const fieldClass = 'w-full px-3 py-2.5 bg-input-bg text-text border border-border focus:border-primary/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all'

export default function CommitteeMemberForm({ member, onSubmit, isLoading }) {
  const { user: loggedInUser } = useContext(AuthContext)
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    number: '',
    password: '',
    designation: '',
    remove_image: false,
    status: 1,
    image: null
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    setFormData({
      first_name: member?.first_name || '',
      middle_name: member?.middle_name || '',
      last_name: member?.last_name || '',
      number: member?.number || '',
      password: '',
      designation: member?.designation || '',
      status: Number(member?.status ?? 1),
      image: member?.image
    })
    setErrors({})
  }, [member])

  const isEditingSelf = Boolean(member && loggedInUser && [
    member._id,
    member.id,
    member.member_id
  ].some((value) => value && [
    loggedInUser._id,
    loggedInUser.id,
    loggedInUser.member_id
  ].some((current) => current && String(current) === String(value))))
  const canManageRoleFields = loggedInUser?.role === 'admin'

  const validateImage = (file) => new Promise((resolve) => {
  if (!file || !(file instanceof File)) return resolve('')
    if (file.size > 1024 * 1024) return resolve('Image must be 1 MB or smaller')

    const image = new Image()
    const url = URL.createObjectURL(file)
    image.onload = () => {
      URL.revokeObjectURL(url)
      resolve(image.width <= 300 && image.height <= 300 ? '' : 'Image must be 300 x 300 px or smaller')
    }
    image.onerror = () => {
      URL.revokeObjectURL(url)
      resolve('Please select a valid image')
    }
    image.src = url
  })

  const validate = async () => {
    const nextErrors = {}
    if (!formData.first_name) nextErrors.first_name = 'First name is required'
    if (!formData.number) nextErrors.number = 'number is required'
    if (formData.status === '') nextErrors.status = 'Status is required'

    const imageError = await validateImage(formData.image)
    if (imageError) nextErrors.image = imageError

    return nextErrors
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = await validate()
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors)
      return
    }

    const payload = new FormData()
    payload.append('first_name', formData.first_name)
    payload.append('middle_name', formData.middle_name)
    payload.append('last_name', formData.last_name)
    payload.append('number', formData.number)
    payload.append('designation', formData.designation)
    payload.append('status', formData.status)
    payload.append('remove_image', formData.remove_image ? 'true' : 'false')

    if (formData.image instanceof File) {
      payload.append('image', formData.image)
    }
    onSubmit(payload)
  }


  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-h-[76vh] overflow-y-auto pr-1 select-none text-text">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm  font-semibold text-text-secondary mb-1.5">First Name *</label>
          <input type="text" placeholder="Enter First Name" value={formData.first_name} onChange={(e) => setFormData({ ...formData, first_name: e.target.value })} className={fieldClass} disabled={isLoading} />
          {errors.first_name && <p className="text-error-text text-sm mt-1 font-semibold">{errors.first_name}</p>}
        </div>
        <div>
          <label className="block text-sm  font-semibold text-text-secondary mb-1.5">Middle Name</label>
          <input type="text" placeholder="Enter Middle Name" value={formData.middle_name} onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })} className={fieldClass} disabled={isLoading} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm  font-semibold text-text-secondary mb-1.5">Last Name *</label>
          <input type="text" placeholder="Enter Last Name" value={formData.last_name} onChange={(e) => setFormData({ ...formData, last_name: e.target.value })} className={`${fieldClass} disabled:opacity-50 disabled:cursor-not-allowed`} disabled={isLoading || !!(member && member.last_name)} />
          {errors.last_name && <p className="text-error-text text-sm mt-1 font-semibold">{errors.last_name}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col justify-between mb-1.5 ">
            <label className="block text-sm  font-semibold text-text-secondary mb-1.5">Designation *</label>
            <input
              type="text"
              placeholder="Enter Designation"
              value={formData.designation}
              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
              className={`${fieldClass} disabled:cursor-not-allowed disabled:opacity-70`}
              disabled={isLoading || isEditingSelf}
              title={isEditingSelf ? 'You cannot change your own role' : undefined}
            />
            {errors.designation && <p className="text-error-text text-sm mt-1 font-semibold">{errors.designation}</p>}
          </div>

          <div>
            <label className="block text-sm  font-semibold text-text-secondary mb-1.5">Status *</label>
            <select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })} className={fieldClass} disabled={isLoading}>
              <option value={1}>Active</option>
              <option value={0}>Inactive</option>
            </select>
            {errors.status && <p className="text-error-text text-sm mt-1 font-semibold">{errors.status}</p>}
          </div>
        </div>

      </div>


      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm  font-semibold text-text-secondary mb-1.5">Number *</label>
          <input type="text" placeholder="Enter number" maxLength={10} value={formData.number} onChange={(e) => setFormData({ ...formData, number: e.target.value })} className={fieldClass} disabled={isLoading} />
        </div>
        <div className="flex flex-col bg-input-bg border border-border rounded-xl p-3">
          <label className="block text-sm font-semibold text-text-secondary mb-1.5">Image (300*300 px, Max size 1 mb)</label>

          {(formData.image && typeof formData.image === 'string') || (formData.image instanceof File) ? (
            <div className="relative w-20 h-20 mb-2">
              <img
                src={formData.image instanceof File ? URL.createObjectURL(formData.image) : formData.image}
                alt="preview"
                className="w-20 h-20 rounded-lg object-cover border border-border"
              />
              <button
                type="button"
                onClick={() => setFormData({ ...formData, image: null, remove_image: true })}
                className="absolute -top-1.5 -right-1.5 bg-error text-white rounded-full w-5 h-5 flex items-center justify-center text-xs font-semibold"
                disabled={isLoading}
              >×</button>
            </div>
          ) : null}

          <input type="file" accept="image/*"
            onChange={(e) => setFormData({ ...formData, image: e.target.files?.[0] || null, remove_image: false })}
            className="w-full text-sm text-text-secondary file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-primary hover:file:bg-primary/20"
            disabled={isLoading} />
          {errors.image && <p className="text-error-text text-sm mt-1 font-semibold">{errors.image}</p>}
        </div>

      </div>

      <button type="submit" disabled={isLoading} className="justify-self-end flex bg-primary hover:bg-primary-hover text-white px-3 py-3 rounded-xl font-semibold text-sm tracking-wider  transition-all disabled:opacity-50 shadow-glow-primary">
        {isLoading ? 'Saving...' : member ? 'Save Committee Member' : 'Add Committee Member'}
      </button>
    </form>
  )
}
