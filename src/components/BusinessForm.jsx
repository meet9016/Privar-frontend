import React, { useEffect, useState } from 'react'
import api from '../lib/api'
import Input from './common/Input'
import Select from './common/Select'
import Button from './common/Button'
import ImageUpload from './common/ImageUpload'
import FileDropzone from './common/FileDropzone'
import { isValidEmail } from '../lib/validation'
const initialState = {
  id: '',
  member_id: '',
  business_name: '',
  business_category_id: '',
  number: '',
  whatsapp_number: '',
  email: '',
  GST_number: '',
  country_id: '',
  state_id: '',
  city_id: '',
  address: '',
  location_link: '',
  about_us: '',
  facebook: '',
  instagram: '',
  pinterest: '',
  youtube: '',
  website: '',
  image: '',
  gallery_images: [],
  status: 0
}

export default function BusinessForm({ business, onSubmit, isLoading, onCancel }) {
  const [formData, setFormData] = useState(initialState)
  const [errors, setErrors] = useState({})
  const [businessCategories, setBusinessCategories] = useState([])
  const [countries, setCountries] = useState([])
  const [states, setStates] = useState([])
  const [cities, setCities] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [profilePreview, setProfilePreview] = useState(null)
  const [galleryPreviews, setGalleryPreviews] = useState([])

  const [existingGalleryImages, setExistingGalleryImages] = useState([])
  const newGalleryFiles = (formData.gallery_images || []).filter((img) => img instanceof File)

  const removeNewGalleryImage = (newIndex) => {
    let currentFileIndex = -1
    const nextGalleryImages = formData.gallery_images.filter((item) => {
      if (!(item instanceof File)) return true
      currentFileIndex += 1
      return currentFileIndex !== newIndex
    })

    if (galleryPreviews[newIndex]) URL.revokeObjectURL(galleryPreviews[newIndex])
    setGalleryPreviews(galleryPreviews.filter((_, index) => index !== newIndex))
    setFormData({ ...formData, gallery_images: nextGalleryImages })
  }

  const removeExistingGalleryImage = (idx) => {
    setExistingGalleryImages((prev) => prev.filter((_, i) => i !== idx))
  }

  useEffect(() => {
    fetchBusinessCategories()
    fetchCountries()
    fetchStates()
    fetchCities()
  }, [])

  const fetchBusinessCategories = async () => {
    try {
      const res = await api.get('/business-categories')
      const data = res.data?.data || res.data || []
      setBusinessCategories(data)
      setError('')
    } catch (err) {
      setError('Failed to fetch business categories')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchCountries = async () => {
    try {
      const res = await api.get('/masters/country')
      const data = res.data?.data || res.data || []
      setCountries(data)
      setError('')
    } catch (err) {
      setError('Failed to fetch countries')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchStates = async () => {
    try {
      const res = await api.get('/masters/state')
      const data = res.data?.data || res.data || []
      setStates(data)
      setError('')
    } catch (err) {
      setError('Failed to fetch states')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchCities = async () => {
    try {
      const res = await api.get('/masters/city')
      const data = res.data?.data || res.data || []
      setCities(data)
      setError('')
    } catch (err) {
      setError('Failed to fetch cities')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    setFormData({
      business_category_id: business?.business_category_id || '',
      email: business?.email || '',
      whatsapp_number: business?.whatsapp_number || '',
      GST_number: business?.GST_number || '',
      country_id: business?.country_id || '',
      state_id: business?.state_id || '',
      city_id: business?.city_id || '',
      location_link: business?.location_link || '',
      business_name: business?.business_name || '',
      number: business?.number || '',
      address: business?.address || '',
      about_us: business?.about_us || '',
      website: business?.website || '',
      facebook: business?.facebook || '',
      instagram: business?.instagram || '',
      pinterest: business?.pinterest || '',
      youtube: business?.youtube || '',
      image: business?.image || '',
      gallery_images: business?.gallery_images || [],
      status: Number(business?.status ?? 0)
    })
    setGalleryPreviews([])
    setExistingGalleryImages(
      (business?.gallery_images || []).filter((img) => typeof img === 'string' && img.trim())
    )
    setProfilePreview(null)
  }, [business])

  const handleFieldChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => {
      const updated = { ...prev }
      if (field === 'business_name' && value.trim()) delete updated.business_name
      if (field === 'business_category_id' && value) delete updated.business_category_id
      if (field === 'number' && value.trim().length === 10) delete updated.number
      if (field === 'email') {
        if (!value.trim()) updated.email = 'Email is required'
        else if (!isValidEmail(value)) updated.email = 'Please enter a valid email (e.g. user@gmail.com)'
        else delete updated.email
      }
      if (field === 'country_id' && value) delete updated.country_id
      if (field === 'state_id' && value) delete updated.state_id
      if (field === 'city_id' && value) delete updated.city_id
      if (field === 'address' && value.trim()) delete updated.address
      if (field === 'location_link' && value.trim()) delete updated.location_link
      return updated
    })
  }

  const validate = () => {
    const nextErrors = {}
    if (!formData.business_name.trim()) nextErrors.business_name = 'Business name is required'
    if (!formData.business_category_id.trim()) nextErrors.business_category_id = 'Business category is required'
    if (!formData.number.trim()) nextErrors.number = 'Primary phone is required'
    else if (formData.number.trim().length < 10) nextErrors.number = 'Phone number must be 10 digits'
    if (!formData.email.trim()) nextErrors.email = 'Email is required'
    else if (!isValidEmail(formData.email)) nextErrors.email = 'Please enter a valid email (e.g. user@gmail.com)'
    if (!formData.country_id.trim()) nextErrors.country_id = 'Country is required'
    if (!formData.state_id.trim()) nextErrors.state_id = 'State is required'
    if (!formData.city_id.trim()) nextErrors.city_id = 'City is required'
    if (!formData.address.trim()) nextErrors.address = 'Address is required'
    if (!formData.location_link.trim()) nextErrors.location_link = 'Location link is required'

    return nextErrors
  }

  const handleSubmit = (event) => {
    event.preventDefault()

    const nextErrors = validate()
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors)
      return
    }
    onSubmit({ ...formData, gallery_images: [...existingGalleryImages, ...newGalleryFiles] })
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-text" noValidate>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          label="Business Name"
          required
          value={formData.business_name}
          onChange={(e) => handleFieldChange('business_name', e.target.value)}
          disabled={isLoading}
          error={errors.business_name}
        />
        <Select
          label="Business Category"
          required
          value={formData.business_category_id}
          onChange={(val) => handleFieldChange('business_category_id', val)}
          disabled={isLoading}
          options={businessCategories.map(c => ({ label: c.business, value: c.id }))}
          error={errors.business_category_id}
        />
        <Input
          type="email"
          label="Email"
          required
          value={formData.email}
          onChange={(e) => handleFieldChange('email', e.target.value)}
          disabled={isLoading}
          error={errors.email}
        />
        <Input
          label="WhatsApp Number"
          value={formData.whatsapp_number}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 10)
            setFormData({ ...formData, whatsapp_number: val })
          }}
          disabled={isLoading}
        />
        <Input
          label="Number"
          required
          value={formData.number}
          onChange={(e) => handleFieldChange('number', e.target.value.replace(/\D/g, '').slice(0, 10))}
          disabled={isLoading}
          error={errors.number}
        />
        <Input
          label="GST Number"
          value={formData.GST_number}
          onChange={(e) => setFormData({ ...formData, GST_number: e.target.value })}
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Select
          label="Country"
          required
          value={formData.country_id}
          onChange={(val) => setFormData({ ...formData, country_id: val })}
          disabled={isLoading}
          options={countries.map(c => ({ label: c.name, value: c._id || c.id }))}
          error={errors.country_id}
        />
        <Select
          label="State"
          required
          value={formData.state_id}
          onChange={(val) => setFormData({ ...formData, state_id: val })}
          disabled={isLoading}
          options={states.map(s => ({ label: s.name, value: s._id || s.id }))}
          error={errors.state_id}
        />
        <Select
          label="City"
          required
          value={formData.city_id}
          onChange={(val) => setFormData({ ...formData, city_id: val })}
          disabled={isLoading}
          options={cities.map(c => ({ label: c.name, value: c._id || c.id }))}
          error={errors.city_id}
        />
      </div>

      <Input
        label="Location Link (Google Maps)"
        required
        placeholder="https://maps.google.com/..."
        value={formData.location_link}
        onChange={(e) => setFormData({ ...formData, location_link: e.target.value })}
        disabled={isLoading}
        error={errors.location_link}
      />

      <Input
        type="textarea"
        rows={3}
        label="Address"
        required
        value={formData.address}
        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        disabled={isLoading}
        error={errors.address}
      />

      <Input
        type="textarea"
        rows={4}
        label="About Business"
        value={formData.about_us}
        onChange={(e) => setFormData({ ...formData, about_us: e.target.value })}
        disabled={isLoading}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Input label="Website" value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} disabled={isLoading} />
        <Input label="Facebook" value={formData.facebook} onChange={(e) => setFormData({ ...formData, facebook: e.target.value })} disabled={isLoading} />
        <Input label="Instagram" value={formData.instagram} onChange={(e) => setFormData({ ...formData, instagram: e.target.value })} disabled={isLoading} />
        <Input label="Pinterest" value={formData.pinterest} onChange={(e) => setFormData({ ...formData, pinterest: e.target.value })} disabled={isLoading} />
        <Input label="YouTube" value={formData.youtube} onChange={(e) => setFormData({ ...formData, youtube: e.target.value })} disabled={isLoading} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ImageUpload
          label="Profile Image"
          value={formData.image || profilePreview}
          onChange={(file) => {
            setFormData({ ...formData, image: file || '' })
            if (file) {
              setProfilePreview(URL.createObjectURL(file))
            } else {
              setProfilePreview(null)
            }
          }}
          disabled={isLoading}
        />

        <div className="flex flex-col bg-input-bg border border-border rounded-xl p-3">
          <label className="block text-sm font-semibold text-text-secondary mb-1.5">Gallery Images</label>
          <FileDropzone
            multiple
            accept="image/*"
            onFilesSelected={(files) => {
              const validFiles = files.filter((file) => file.type.startsWith('image/'))
              const previews = validFiles.map(f => URL.createObjectURL(f))
              setGalleryPreviews([...galleryPreviews, ...previews])
              setFormData({ ...formData, gallery_images: [...formData.gallery_images, ...validFiles] })
            }}
            disabled={isLoading}
            label="Drag & Drop or Click"
            subLabel="Multiple images supported"
            previews={[
              ...existingGalleryImages.map((img, idx) => ({
                url: img,
                onRemove: () => removeExistingGalleryImage(idx)
              })),
              ...galleryPreviews.map((preview, idx) => ({
                url: preview,
                onRemove: () => removeNewGalleryImage(idx)
              }))
            ]}
          />
        </div>
      </div>

      <Select
        label="Status"
        value={formData.status}
        onChange={(val) => setFormData({ ...formData, status: Number(val) })}
        disabled={isLoading}
        options={[
          { label: 'Active', value: 1 },
          { label: 'Inactive', value: 0 }
        ]}
      />

      <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          disabled={isLoading}
          isLoading={isLoading}
          variant="primary"
        >
          Save
        </Button>
      </div>
    </form>
  )
}
