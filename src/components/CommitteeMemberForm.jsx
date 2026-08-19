import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../context/AuthContext'
import Input from './common/Input'
import Select from './common/Select'
import Button from './common/Button'
import ImageUpload from './common/ImageUpload'
import { isValidEmail } from '../lib/validation'

const fieldClass = 'w-full px-3 py-2.5 bg-input-bg text-text border border-border focus:border-primary/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all'

export default function CommitteeMemberForm({ member, roles = [], onSubmit, isLoading, onCancel }) {
  const { user: loggedInUser } = useContext(AuthContext)
  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    number: '',
    email: '',
    password: '',
    role_id: '',
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
      email: member?.email || '',
      password: '',
      role_id: member?.role_id || '',
      status: member ? Number(member.status) : '',
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
    if (!formData.first_name?.trim()) nextErrors.first_name = 'First name is required'
    if (!formData.last_name?.trim()) nextErrors.last_name = 'Last name is required'
    if (!formData.number?.trim()) {
      nextErrors.number = 'Contact number is required'
    } else if (formData.number.length < 10) {
      nextErrors.number = 'Contact number must be 10 digits'
    }
    if (formData.email && !isValidEmail(formData.email)) {
      nextErrors.email = 'Please enter a valid email address (e.g. user@gmail.com)'
    }
    if (formData.status === '' || formData.status === undefined) nextErrors.status = 'Status is required'

    const imageError = await validateImage(formData.image)
    if (imageError) nextErrors.image = imageError

    return nextErrors
  }

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => {
      const updated = { ...prev }
      if (field === 'first_name' && value.trim()) delete updated.first_name
      if (field === 'last_name' && value.trim()) delete updated.last_name
      if (field === 'number' && value.trim().length === 10) delete updated.number
      if (field === 'email') {
        if (!value || isValidEmail(value)) delete updated.email
        else updated.email = 'Please enter a valid email address (e.g. user@gmail.com)'
      }
      if (field === 'status' && value !== '') delete updated.status
      return updated
    })
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
    payload.append('email', formData.email)
    if (formData.password) {
      payload.append('password', formData.password)
    }
    payload.append('role_id', formData.role_id)
    payload.append('status', formData.status)
    payload.append('remove_image', formData.remove_image ? 'true' : 'false')

    if (formData.image instanceof File) {
      payload.append('image', formData.image)
    }
    onSubmit(payload)
  }

  const roleOptions = [
    { label: 'Select Assigned Role', value: '' },
    ...roles.map(r => ({ label: r.name, value: r.id || String(r._id) }))
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-text">
      {/* Row 1: Image (left) + First Name, Middle Name, Last Name (right) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        <div className="md:col-span-1">
          <ImageUpload
            label="Image (300*300 px, Max 1MB)"
            value={formData.image}
            onChange={(file, remove = false) => {
              setFormData(prev => ({ ...prev, image: file, remove_image: remove }))
              if (errors.image) setErrors(prev => ({ ...prev, image: null }))
            }}
            disabled={isLoading}
            error={errors.image}
          />
        </div>
        <div className="md:col-span-2 grid grid-cols-1 gap-3">
          <Input
            label="First Name"
            required
            placeholder="Enter First Name"
            value={formData.first_name}
            onChange={(e) => handleFieldChange('first_name', e.target.value.replace(/[0-9]/g, ''))}
            disabled={isLoading}
            error={errors.first_name}
          />
          <Input
            label="Middle Name"
            placeholder="Enter Middle Name"
            value={formData.middle_name}
            onChange={(e) => handleFieldChange('middle_name', e.target.value.replace(/[0-9]/g, ''))}
            disabled={isLoading}
          />
          <Input
            label="Last Name"
            required
            placeholder="Enter Last Name"
            value={formData.last_name}
            onChange={(e) => handleFieldChange('last_name', e.target.value.replace(/[0-9]/g, ''))}
            disabled={isLoading || !!(member && member.last_name)}
            error={errors.last_name}
          />
        </div>
      </div>

      {/* Row 2: Contact Number, Status, Assign Role */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Contact Number"
          required
          type="tel"
          onlyNumbers
          maxLength={10}
          placeholder="Enter Contact Number"
          value={formData.number}
          onChange={(e) => handleFieldChange('number', e.target.value.replace(/\D/g, '').slice(0, 10))}
          disabled={isLoading}
          error={errors.number}
        />
        <Select
          label="Status"
          required
          placement="down"
          value={formData.status}
          onChange={(val) => handleFieldChange('status', val)}
          disabled={isLoading}
          error={errors.status}
          placeholder="Select Status"
          options={[
            { label: 'Active', value: 1 },
            { label: 'Inactive', value: 0 }
          ]}
        />
        <Select
          label="Assign Role"
          value={formData.role_id}
          onChange={(val) => handleFieldChange('role_id', val)}
          disabled={isLoading}
          options={roleOptions}
        />
      </div>

      {/* Row 3: Email, Password */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="email@example.com"
          value={formData.email}
          onChange={(e) => handleFieldChange('email', e.target.value)}
          disabled={isLoading}
          error={errors.email}
        />
        <Input
          label={member ? "Password (Leave blank to keep)" : "Password"}
          type="password"
          placeholder={member ? "Enter password to update" : "Enter login password"}
          value={formData.password}
          onChange={(e) => handleFieldChange('password', e.target.value)}
          disabled={isLoading}
          error={errors.password}
        />
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-border mt-4">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : 'Save'}
        </Button>
      </div>
    </form>
  )
}
