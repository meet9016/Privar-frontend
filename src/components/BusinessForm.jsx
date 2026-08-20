import React, { useEffect, useState } from 'react'
import { Plus, Trash2, Globe, Facebook, Instagram, Youtube, Share2 } from 'lucide-react'
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

const ALL_SOCIAL_PLATFORMS = [
  { key: 'website', label: 'Website', placeholder: 'https://example.com' },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/...' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/...' },
  { key: 'youtube', label: 'YouTube', placeholder: 'https://youtube.com/@...' },
  { key: 'pinterest', label: 'Pinterest', placeholder: 'https://pinterest.com/...' }
]

export default function BusinessForm({ business, onSubmit, isLoading, onCancel }) {
  const [formData, setFormData] = useState(initialState)
  const [selectedSocials, setSelectedSocials] = useState([])
  const [socialPickerValue, setSocialPickerValue] = useState('')
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
    // Auto-enable social platforms that have values in this business record
    const activeSocials = ALL_SOCIAL_PLATFORMS
      .map(p => p.key)
      .filter(k => business && business[k] && String(business[k]).trim() !== '')
    setSelectedSocials(activeSocials)

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

      {/* Main Details: 4 Inputs Per Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
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
          label="Primary Phone"
          required
          value={formData.number}
          onChange={(e) => handleFieldChange('number', e.target.value.replace(/\D/g, '').slice(0, 10))}
          disabled={isLoading}
          error={errors.number}
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
          label="GST Number"
          value={formData.GST_number}
          onChange={(e) => setFormData({ ...formData, GST_number: e.target.value })}
          disabled={isLoading}
        />
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
        <div className="sm:col-span-2 md:col-span-3">
          <Input
            label="Location Link (Google Maps)"
            required
            placeholder="https://maps.google.com/..."
            value={formData.location_link}
            onChange={(e) => setFormData({ ...formData, location_link: e.target.value })}
            disabled={isLoading}
            error={errors.location_link}
          />
        </div>
      </div>

      {/* Address & About Business side by side in a 2-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
      </div>

      {/* Row with 3 Columns: [1] Social Links Selector & Inputs, [2] Profile Image, [3] Gallery Images */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-stretch">
        {/* Col 1: Dynamic Social Links & Website */}
        <div className="flex flex-col h-full">
          <label className="block text-sm font-semibold text-text-secondary mb-1.5">Social Links & Website</label>
          <div className="flex-1 flex flex-col p-3 rounded-2xl bg-surface-secondary/40 border border-border min-h-[176px]">
            <div className="flex items-center justify-between gap-1 mb-2">
              <span className="text-xs font-semibold text-text">Platform Links</span>
              <div className="w-36">
                <Select
                  placeholder="+ Add Link"
                  searchable={false}
                  value={socialPickerValue}
                  options={ALL_SOCIAL_PLATFORMS
                    .filter(p => !selectedSocials.includes(p.key))
                    .map(p => ({ label: p.label, value: p.key }))
                  }
                  onChange={(val) => {
                    if (val && !selectedSocials.includes(val)) {
                      setSelectedSocials([...selectedSocials, val])
                    }
                    setSocialPickerValue('')
                  }}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1 max-h-[120px]">
              {selectedSocials.length > 0 ? (
                selectedSocials.map((key) => {
                  const platform = ALL_SOCIAL_PLATFORMS.find(p => p.key === key)
                  if (!platform) return null
                  return (
                    <div key={key} className="space-y-0.5">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-semibold text-text-secondary">{platform.label}</span>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedSocials(selectedSocials.filter(k => k !== key))
                            setFormData({ ...formData, [key]: '' })
                          }}
                          className="text-[10px] text-red-500 hover:underline flex items-center gap-0.5 cursor-pointer"
                        >
                          <Trash2 className="w-2.5 h-2.5" /> Remove
                        </button>
                      </div>
                      <Input
                        placeholder={platform.placeholder}
                        value={formData[key] || ''}
                        onChange={(e) => setFormData({ ...formData, [key]: e.target.value })}
                        disabled={isLoading}
                      />
                    </div>
                  )
                })
              ) : (
                <div className="flex items-center justify-center h-full text-[11px] text-text-secondary text-center italic py-4">
                  + Add Link upar click karke Website, Facebook, Instagram add karein.
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Col 2: Profile Image */}
        <div className="flex flex-col h-full">
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
        </div>

        {/* Col 3: Gallery Images */}
        <div className="flex flex-col h-full">
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
            subLabel="Multiple images"
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

      <div className="flex flex-col justify-center pt-1">
        <label className="block text-sm font-semibold text-text-secondary mb-1.5">
          Status
        </label>
        <div className="flex items-center gap-3 py-1">
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              className="sr-only peer"
              checked={Number(formData.status ?? 1) === 1}
              onChange={(e) => handleChange('status', e.target.checked ? 1 : 0)}
              disabled={isLoading}
            />
            <div className="w-11 h-6 bg-surface-secondary peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
          <span className="text-sm font-semibold text-text">
            {Number(formData.status ?? 1) === 1 ? 'Active' : 'Inactive'}
          </span>
        </div>
      </div>

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
