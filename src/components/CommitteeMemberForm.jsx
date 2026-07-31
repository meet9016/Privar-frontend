import React, { useContext, useEffect, useState } from 'react'
import { AuthContext } from '../context/AuthContext'
import Input from './common/Input'
import Select from './common/Select'
import Button from './common/Button'
import ImageUpload from './common/ImageUpload'

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
      email: member?.email || '',
      password: '',
      role_id: member?.role_id || '',
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
    if (!formData.number) nextErrors.number = 'Contact number is required'
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
    payload.append('email', formData.email)
    if (formData.password) {
      payload.append('password', formData.password)
    }
    payload.append('role_id', formData.role_id)
    payload.append('designation', formData.designation)
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
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="First Name"
          required
          placeholder="Enter First Name"
          value={formData.first_name}
          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
          disabled={isLoading}
          error={errors.first_name}
        />
        <Input
          label="Middle Name"
          placeholder="Enter Middle Name"
          value={formData.middle_name}
          onChange={(e) => setFormData({ ...formData, middle_name: e.target.value })}
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Last Name"
          required
          placeholder="Enter Last Name"
          value={formData.last_name}
          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
          disabled={isLoading || !!(member && member.last_name)}
          error={errors.last_name}
        />

        <Input
          label="Designation"
          required
          placeholder="Enter Designation"
          value={formData.designation}
          onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
          disabled={isLoading || isEditingSelf}
          title={isEditingSelf ? 'You cannot change your own role' : undefined}
          error={errors.designation}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Email Address"
          type="email"
          placeholder="email@example.com"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          disabled={isLoading}
        />

        <Input
          label={member ? "Password (Leave blank to keep)" : "Password"}
          type="password"
          placeholder={member ? "••••••••" : "Enter login password"}
          value={formData.password}
          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
          disabled={isLoading}
        />

        <Select
          label="Assign Role"
          value={formData.role_id}
          onChange={(val) => setFormData({ ...formData, role_id: val })}
          disabled={isLoading}
          options={roleOptions}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input
          label="Contact Number"
          required
          placeholder="Enter Contact Number"
          value={formData.number}
          onChange={(e) => setFormData({ ...formData, number: e.target.value.replace(/\D/g, '').slice(0, 10) })}
          disabled={isLoading}
          error={errors.number}
        />
        <Select
          label="Status"
          required
          value={formData.status}
          onChange={(val) => setFormData({ ...formData, status: val })}
          disabled={isLoading}
          error={errors.status}
          options={[
            { label: 'Active', value: 1 },
            { label: 'Inactive', value: 0 }
          ]}
        />
        <ImageUpload
          label="Image (300*300 px, Max 1MB)"
          value={formData.image}
          onChange={(file, remove = false) => 
            setFormData({ ...formData, image: file, remove_image: remove })
          }
          disabled={isLoading}
          error={errors.image}
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
