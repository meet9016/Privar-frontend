import React, { useEffect, useState } from 'react'
import api from '../lib/api'

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

export default function BusinessForm({ business, onSubmit, isLoading }) {
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

  const validate = () => {
    const nextErrors = {}
    if (!formData.business_name.trim()) nextErrors.business_name = 'Business name is required'
    if (!formData.business_category_id.trim()) nextErrors.business_category_id = 'Business category is required'
    if (!formData.number.trim()) nextErrors.number = 'Primary phone is required'
    if (!formData.email.trim()) nextErrors.email = 'Email is required'
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
    <form onSubmit={handleSubmit} className="space-y-5 max-h-[76vh] overflow-y-auto pr-1 select-none text-text">

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm  font-semibold text-text-secondary mb-1.5">Business Name *</label>
          <input
            type="text"
            value={formData.business_name}
            onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
            className="w-full px-3 py-2.5 bg-input-bg text-text border border-border focus:border-primary/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10"
            disabled={isLoading}
          />
          {errors.business_name && <p className="text-error-text text-sm mt-1 font-semibold">{errors.business_name}</p>}
        </div>
        <div>
          <label className="block text-sm  font-semibold text-text-secondary mb-1.5">Business Category *</label>
          <select
            value={formData.business_category_id}
            onChange={(e) => setFormData({ ...formData, business_category_id: e.target.value })}
            className="w-full bg-input-bg text-text border border-border rounded-xl py-2.5 px-3 text-sm outline-none focus:border-primary/50 cursor-pointer"
            disabled={isLoading}
          >
            <option value="" className="bg-surface text-text">Select Business Category</option>
            {businessCategories.map((category) => (
              <option key={category.id} value={category.id} className="bg-surface text-text">{category.business}</option>
            ))}
          </select>
          {errors.business_category_id && <p className="text-error-text text-sm mt-1 font-semibold">{errors.business_category_id}</p>}
        </div>
        <div>
          <label className="block text-sm  font-semibold text-text-secondary mb-1.5">Email *</label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2.5 bg-input-bg text-text border border-border focus:border-primary/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10"
            disabled={isLoading}
          />
          {errors.email && <p className="text-error-text text-sm mt-1 font-semibold">{errors.email}</p>}
        </div>
        <div>
          <label className="block text-sm  font-semibold text-text-secondary mb-1.5">WhatsApp Number</label>
          <input
            value={formData.whatsapp_number}
            onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
            className="w-full px-3 py-2.5 bg-input-bg text-text border border-border focus:border-primary/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10"
            disabled={isLoading}
          />
        </div>
        <div>
          <label className="block text-sm  font-semibold text-text-secondary mb-1.5">Number</label>
          <input
            value={formData.number}
            onChange={(e) => setFormData({ ...formData, number: e.target.value })}
            className="w-full px-3 py-2.5 bg-input-bg text-text border border-border focus:border-primary/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10"
            disabled={isLoading}
          />
        </div>
        <div>
          <label className="block text-sm  font-semibold text-text-secondary mb-1.5">GST Number</label>
          <input
            value={formData.GST_number}
            onChange={(e) => setFormData({ ...formData, GST_number: e.target.value })}
            className="w-full px-3 py-2.5 bg-input-bg text-text border border-border focus:border-primary/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm  font-semibold text-text-secondary mb-1.5">Country *</label>
          <select
            value={formData.country_id}
            onChange={(e) => setFormData({ ...formData, country_id: e.target.value })}
            className="w-full bg-input-bg text-text border border-border rounded-xl py-2.5 px-3 text-sm outline-none focus:border-primary/50 cursor-pointer"
            disabled={isLoading}
          >
            <option value="" className="bg-surface text-text">Select Country</option>
            {countries.map((country) => (
              <option key={country._id} value={country._id} className="bg-surface text-text">{country.name}</option>
            ))}
          </select>
          {errors.country_id && <p className="text-error-text text-sm mt-1 font-semibold">{errors.country_id}</p>}
        </div>
        <div>
          <label className="block text-sm  font-semibold text-text-secondary mb-1.5">State *</label>
          <select
            value={formData.state_id}
            onChange={(e) => setFormData({ ...formData, state_id: e.target.value })}
            className="w-full bg-input-bg text-text border border-border rounded-xl py-2.5 px-3 text-sm outline-none focus:border-primary/50 cursor-pointer"
            disabled={isLoading}
          >
            <option value="" className="bg-surface text-text">Select State</option>
            {states.map((state) => (
              <option key={state._id} value={state._id} className="bg-surface text-text">{state.name}</option>
            ))}
          </select>
          {errors.state_id && <p className="text-error-text text-sm mt-1 font-semibold">{errors.state_id}</p>}
        </div>
        <div>
          <label className="block text-sm  font-semibold text-text-secondary mb-1.5">City *</label>
          <select
            value={formData.city_id}
            onChange={(e) => setFormData({ ...formData, city_id: e.target.value })}
            className="w-full bg-input-bg text-text border border-border rounded-xl py-2.5 px-3 text-sm outline-none focus:border-primary/50 cursor-pointer"
            disabled={isLoading}
          >
            <option value="" className="bg-surface text-text">Select City</option>
            {cities.map((city) => (
              <option key={city._id} value={city._id} className="bg-surface text-text">{city.name}</option>
            ))}
          </select>
          {errors.city_id && <p className="text-error-text text-sm mt-1 font-semibold">{errors.city_id}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm  font-semibold text-text-secondary mb-1.5">Location Link (Google Maps) *</label>
        <input
          value={formData.location_link}
          onChange={(e) => setFormData({ ...formData, location_link: e.target.value })}
          placeholder="https://maps.google.com/..."
          className="w-full px-3 py-2.5 bg-input-bg text-text border border-border focus:border-primary/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10"
          disabled={isLoading}
        />
        {errors.location_link && <p className="text-error-text text-sm mt-1 font-semibold">{errors.location_link}</p>}
      </div>

      <div>
        <label className="block text-sm  font-semibold text-text-secondary mb-1.5">Address *</label>
        <textarea
          rows="3"
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          className="w-full px-3 py-2.5 bg-input-bg text-text border border-border focus:border-primary/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10"
          disabled={isLoading}
        />
        {errors.address && <p className="text-error-text text-sm mt-1 font-semibold">{errors.address}</p>}
      </div>

      <div>
        <label className="block text-sm  font-semibold text-text-secondary mb-1.5">About Business</label>
        <textarea
          rows="4"
          value={formData.about_us}
          onChange={(e) => setFormData({ ...formData, about_us: e.target.value })}
          className="w-full px-3 py-2.5 bg-input-bg text-text border border-border focus:border-primary/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10"
          disabled={isLoading}
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className="block text-sm  font-semibold text-text-secondary mb-1.5">Website</label>
          <input
            value={formData.website}
            onChange={(e) => setFormData({ ...formData, website: e.target.value })}
            className="w-full px-3 py-2.5 bg-input-bg text-text border border-border focus:border-primary/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10"
            disabled={isLoading}
          />
        </div>
        <div>
          <label className="block text-sm  font-semibold text-text-secondary mb-1.5">Facebook</label>
          <input
            value={formData.facebook}
            onChange={(e) => setFormData({ ...formData, facebook: e.target.value })}
            className="w-full px-3 py-2.5 bg-input-bg text-text border border-border focus:border-primary/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10"
            disabled={isLoading}
          />
        </div>
        <div>
          <label className="block text-sm  font-semibold text-text-secondary mb-1.5">Instagram</label>
          <input
            value={formData.instagram}
            onChange={(e) => setFormData({ ...formData, instagram: e.target.value })}
            className="w-full px-3 py-2.5 bg-input-bg text-text border border-border focus:border-primary/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10"
            disabled={isLoading}
          />
        </div>
        <div>
          <label className="block text-sm  font-semibold text-text-secondary mb-1.5">Pinterest</label>
          <input
            value={formData.pinterest}
            onChange={(e) => setFormData({ ...formData, pinterest: e.target.value })}
            className="w-full px-3 py-2.5 bg-input-bg text-text border border-border focus:border-primary/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10"
            disabled={isLoading}
          />
        </div>
        <div>
          <label className="block text-sm  font-semibold text-text-secondary mb-1.5">YouTube</label>
          <input
            value={formData.youtube}
            onChange={(e) => setFormData({ ...formData, youtube: e.target.value })}
            className="w-full px-3 py-2.5 bg-input-bg text-text border border-border focus:border-primary/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10"
            disabled={isLoading}
          />
        </div>
      </div>

      <div>
        <label className="block text-sm  font-semibold text-text-secondary mb-1.5">Profile Image</label>
        {(profilePreview || formData.image) && (
          <div className="relative w-20 h-20 mb-3 rounded-lg overflow-hidden border border-border">
            <img
              src={profilePreview || formData.image}
              alt="preview"
              className="w-full h-full object-cover"
            />
            <button
              type="button"
              onClick={() => {
                setProfilePreview(null)
                setFormData({ ...formData, image: '' })
              }}
              className="absolute top-1 right-1 bg-error rounded-full p-1 text-white text-sm hover:bg-error-bg hover:text-error-text"
            >
              ✕
            </button>
          </div>
        )}
        <input
          type="file"
          onChange={(e) => {
            const file = e.target.files[0]
            if (file) {
              setProfilePreview(URL.createObjectURL(file))
              setFormData({ ...formData, image: file })
            }
          }}
          className="w-full bg-input-bg text-text border border-border rounded-xl py-2.5 px-3 text-sm outline-none focus:border-primary/50"
          disabled={isLoading}
          accept="image/*"
        />
      </div>

      <div>
        <label className="block text-sm  font-semibold text-text-secondary mb-1.5">Gallery Images</label>
        {(galleryPreviews.length > 0 || existingGalleryImages.length > 0) && (
          <div className="grid grid-cols-4 gap-2 mb-3">
            {newGalleryFiles.map((file, idx) => (
              <div key={`new-${idx}`} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                <img src={galleryPreviews[idx]} alt={file.name || `preview-${idx}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeNewGalleryImage(idx)}
                  className="absolute top-1 right-1 bg-error rounded-full p-1 text-white text-sm hover:bg-error-bg hover:text-error-text"
                >
                  ✕
                </button>
              </div>
            ))}
            {existingGalleryImages.map((img, idx) => (
              <div key={`old-${img}-${idx}`} className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                <img src={img} alt={`gallery-${idx}`} className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => removeExistingGalleryImage(idx)}
                  className="absolute top-1 right-1 bg-error rounded-full p-1 text-white text-sm hover:bg-error-bg hover:text-error-text"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        <input
          type="file"
          multiple
          onChange={(e) => {
            const files = Array.from(e.target.files || []).filter((file) => file.type.startsWith('image/'))
            const previews = files.map(f => URL.createObjectURL(f))
            setGalleryPreviews([...galleryPreviews, ...previews])
            setFormData({ ...formData, gallery_images: [...formData.gallery_images, ...files] })
            e.target.value = ''
          }}
          className="w-full bg-input-bg text-text border border-border rounded-xl py-2.5 px-3 text-sm outline-none focus:border-primary/50"
          disabled={isLoading}
          accept="image/*"
        />
      </div>

      <div>
        <label className="block text-sm  font-semibold text-text-secondary mb-1.5">Status</label>
        <select
          value={formData.status}
          onChange={(e) => setFormData({ ...formData, status: Number(e.target.value) })}
          className="w-full md:w-56 bg-input-bg text-text border border-border rounded-xl py-2.5 px-3 text-sm outline-none focus:border-primary/50 cursor-pointer"
          disabled={isLoading}
        >
          <option value={1} className="bg-surface text-text">Active</option>
          <option value={0} className="bg-surface text-text">Inactive</option>
        </select>
      </div>

      <button
        type="submit"
        disabled={isLoading}
        className="flex justify-self-end bg-primary hover:bg-primary-hover text-white p-3 rounded-xl font-semibold text-sm tracking-wider  transition-all duration-300 disabled:opacity-50 shadow-glow-primary"
      >
        {isLoading ? 'Saving business...' : 'Save Business'}
      </button>
    </form>
  )
}
