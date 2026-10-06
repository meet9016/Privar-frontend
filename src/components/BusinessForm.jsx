import React, { useEffect, useState } from 'react'
import { Plus, Trash2, Globe, Facebook, Instagram, Youtube, Share2 } from 'lucide-react'
import api from '../lib/api'
import { BUSINESS_ENDPOINTS, MEMBER_ENDPOINTS } from '../utils/endpoints'
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
  pincode: '',
  country_id: '',
  state_id: '',
  district_id: '',
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
  status: 1
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
  const [districts, setDistricts] = useState([])
  const [cities, setCities] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [pincodeLoading, setPincodeLoading] = useState(false)
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
    fetchDistricts()
    fetchCities()
  }, [])

  const fetchBusinessCategories = async () => {
    try {
      const res = await api.get(BUSINESS_ENDPOINTS.GET_CATEGORIES)
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
      const res = await api.get(MEMBER_ENDPOINTS.MASTERS_COUNTRY)
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
      const res = await api.get(MEMBER_ENDPOINTS.MASTERS_STATE)
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

  const fetchDistricts = async () => {
    try {
      const res = await api.get(MEMBER_ENDPOINTS.MASTERS_DISTRICT)
      const data = res.data?.data || res.data || []
      setDistricts(data)
      setError('')
    } catch (err) {
      setError('Failed to fetch districts')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchCities = async () => {
    try {
      const res = await api.get(MEMBER_ENDPOINTS.MASTERS_CITY)
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
    const india = countries.find(c => /india/i.test(c.name))
    const gujarat = states.find(s => /gujarat/i.test(s.name))

    setFormData({
      business_category_id: business?.business_category_id || '',
      email: business?.email || '',
      whatsapp_number: business?.whatsapp_number || '',
      GST_number: business?.GST_number || '',
      pincode: business?.pincode || '',
      country_id: business?.country_id || (india ? (india._id || india.id) : ''),
      state_id: business?.state_id || (gujarat ? (gujarat._id || gujarat.id) : ''),
      district_id: business?.district_id || '',
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
      status: Number(business?.status ?? 1)
    })
    const activeSocials = ALL_SOCIAL_PLATFORMS
      .map(p => p.key)
      .filter(k => business && business[k] && String(business[k]).trim() !== '')
    setSelectedSocials(activeSocials)

    setGalleryPreviews([])
    setExistingGalleryImages(
      (business?.gallery_images || []).filter((img) => typeof img === 'string' && img.trim())
    )
    setProfilePreview(null)
  }, [business, countries, states])

  const handlePincodeChange = async (pinValue) => {
    const cleanPin = pinValue.replace(/\D/g, '').slice(0, 6)
    handleFieldChange('pincode', cleanPin)

    if (cleanPin.length === 6) {
      try {
        setPincodeLoading(true)
        const response = await fetch(`https://api.postalpincode.in/pincode/${cleanPin}`)
        const data = await response.json()
        if (data && data[0] && data[0].Status === 'Success' && data[0].PostOffice && data[0].PostOffice.length > 0) {
          const po = data[0].PostOffice[0]
          const postalState = (po.State || '').trim().toLowerCase()
          const postalDistrict = (po.District || '').trim().toLowerCase()
          const postalName = (po.Name || '').trim().toLowerCase()

          // Match country to India
          const india = countries.find(c => /india/i.test(c.name))
          const matchedCountryId = india ? (india._id || india.id) : formData.country_id

          // Match state
          const matchedState = states.find(s => {
            const sName = (s.name || '').trim().toLowerCase()
            return sName === postalState || postalState.includes(sName) || sName.includes(postalState)
          })

          // Match district
          const matchedDistrict = districts.find(d => {
            const dName = (d.name || d.district || '').trim().toLowerCase()
            return dName === postalDistrict || postalDistrict.includes(dName) || dName.includes(postalDistrict)
          })

          // Match city
          const matchedCity = cities.find(c => {
            const cName = (c.name || '').trim().toLowerCase()
            return (
              cName === postalDistrict ||
              cName === postalName ||
              postalDistrict.includes(cName) ||
              postalName.includes(cName)
            )
          })

          setFormData(prev => ({
            ...prev,
            pincode: cleanPin,
            country_id: matchedCountryId || prev.country_id,
            state_id: matchedState ? (matchedState._id || matchedState.id) : prev.state_id,
            district_id: matchedDistrict ? (matchedDistrict._id || matchedDistrict.id) : prev.district_id,
            city_id: matchedCity ? (matchedCity._id || matchedCity.id) : prev.city_id
          }))

          setErrors(prev => {
            const updated = { ...prev }
            if (matchedCountryId) delete updated.country_id
            if (matchedState) delete updated.state_id
            if (matchedDistrict) delete updated.district_id
            if (matchedCity) delete updated.city_id
            return updated
          })
        }
      } catch (err) {
        console.error('Failed to auto-fetch pincode details:', err)
      } finally {
        setPincodeLoading(false)
      }
    }
  }

  const handleFieldChange = (field, value) => {
    setFormData(prev => {
      const next = { ...prev, [field]: value }

      if (field === 'country_id') {
        const selCountry = countries.find(c => String(c._id || c.id) === String(value))
        // If country changed, reset state, district, city
        if (value !== prev.country_id) {
          next.state_id = ''
          next.district_id = ''
          next.city_id = ''
          if (selCountry && /india/i.test(selCountry.name)) {
            const gujarat = states.find(s => /gujarat/i.test(s.name))
            if (gujarat) {
              next.state_id = gujarat._id || gujarat.id
            }
          }
        }
      }

      if (field === 'state_id') {
        // If state changed, reset district and city
        if (value !== prev.state_id) {
          next.district_id = ''
          next.city_id = ''
        }
      }

      if (field === 'district_id') {
        // If district changed, reset city
        if (value !== prev.district_id) {
          next.city_id = ''
        }
      }

      return next
    })
    setErrors(prev => {
      const updated = { ...prev }
      const strVal = value !== undefined && value !== null ? String(value).trim() : ''

      if (field === 'business_name' && strVal) delete updated.business_name
      if (field === 'business_category_id' && strVal) delete updated.business_category_id
      if (field === 'number' && strVal.length === 10) delete updated.number
      if (field === 'email') {
        if (!strVal) updated.email = 'Email is required'
        else if (!isValidEmail(strVal)) updated.email = 'Please enter a valid email (e.g. user@gmail.com)'
        else delete updated.email
      }
      if (field === 'country_id' && strVal) delete updated.country_id
      if (field === 'state_id' && strVal) delete updated.state_id
      if (field === 'district_id' && strVal) delete updated.district_id
      if (field === 'city_id' && strVal) delete updated.city_id
      if (field === 'address' && strVal) delete updated.address
      if (field === 'location_link' && strVal) delete updated.location_link
      return updated
    })
  }

  const validate = () => {
    const nextErrors = {}
    if (!formData.business_name || !String(formData.business_name).trim()) nextErrors.business_name = 'Business name is required'
    if (!formData.business_category_id || !String(formData.business_category_id).trim()) nextErrors.business_category_id = 'Business category is required'
    if (!formData.number || !String(formData.number).trim()) nextErrors.number = 'Primary phone is required'
    else if (String(formData.number).trim().length < 10) nextErrors.number = 'Phone number must be 10 digits'
    if (!formData.email || !String(formData.email).trim()) nextErrors.email = 'Email is required'
    else if (!isValidEmail(String(formData.email).trim())) nextErrors.email = 'Please enter a valid email (e.g. user@gmail.com)'
    if (!formData.country_id || !String(formData.country_id).trim()) nextErrors.country_id = 'Country is required'
    if (!formData.state_id || !String(formData.state_id).trim()) nextErrors.state_id = 'State is required'
    if (!formData.district_id || !String(formData.district_id).trim()) nextErrors.district_id = 'District is required'
    if (!formData.city_id || !String(formData.city_id).trim()) nextErrors.city_id = 'City is required'
    if (!formData.address || !String(formData.address).trim()) nextErrors.address = 'Address is required'
    if (!formData.location_link || !String(formData.location_link).trim()) nextErrors.location_link = 'Location link is required'

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

  // Cascading location options - strictly require parent selection
  const countryOptions = countries.map(c => ({ label: c.name, value: c._id || c.id }))

  const stateOptions = !formData.country_id ? [] : states
    .filter(s => {
      const parent = String(s.country_id || s.parent_id || '')
      return !parent || parent === String(formData.country_id)
    })
    .map(s => ({ label: s.name, value: s._id || s.id }))

  const districtOptions = !formData.state_id ? [] : districts
    .filter(d => {
      const dId = String(d._id || d.id)
      if (formData.district_id && String(formData.district_id) === dId) return true
      const parent = String(d.state_id || d.parent_id || '')
      return !parent || parent === String(formData.state_id)
    })
    .map(d => ({ label: d.name || d.district, value: d._id || d.id }))

  const selectedDistrictObj = districts.find(d => String(d._id || d.id) === String(formData.district_id))
  const selectedDistrictName = (selectedDistrictObj?.name || selectedDistrictObj?.district || '').trim().toLowerCase()

  const cityOptions = !formData.district_id ? [] : cities
    .filter(c => {
      const cId = String(c._id || c.id)
      if (formData.city_id && String(formData.city_id) === cId) return true

      const cDistrictId = String(c.district_id || c.parent_id || '')
      const cName = String(c.name || c.city || '').trim().toLowerCase()

      // 1. Direct match by district ID
      if (cDistrictId && cDistrictId === String(formData.district_id)) {
        return true
      }

      // 2. Direct match if city name equals district name (e.g. Surat city in Surat district)
      if (selectedDistrictName && cName === selectedDistrictName) {
        return true
      }

      // 3. Match if city parent references state AND district name matches
      if (selectedDistrictName && cName.includes(selectedDistrictName)) {
        return true
      }

      return false
    })
    .map(c => ({ label: c.name || c.city || 'Unnamed City', value: c._id || c.id }))

  return (
    <form onSubmit={handleSubmit} className="space-y-5 text-text" noValidate>

      {/* Main Details: 4 Inputs Per Row - Perfectly Balanced Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {/* Row 1 */}
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

        {/* Row 2 */}
        <Input
          label="WhatsApp Number"
          value={formData.whatsapp_number}
          onChange={(e) => {
            const val = e.target.value.replace(/\D/g, '').slice(0, 10)
            setFormData(prev => ({ ...prev, whatsapp_number: val }))
          }}
          disabled={isLoading}
        />
        <Input
          label="GST Number"
          value={formData.GST_number}
          onChange={(e) => setFormData(prev => ({ ...prev, GST_number: e.target.value }))}
          disabled={isLoading}
        />
        <div className="relative">
          <Input
            label="Pincode"
            placeholder="Enter Pincode"
            value={formData.pincode}
            onChange={(e) => handlePincodeChange(e.target.value)}
            disabled={isLoading}
          />
          {pincodeLoading && (
            <div className="absolute right-3 top-[38px] flex items-center gap-1 text-xs text-primary font-medium animate-pulse">
              <span>Fetching...</span>
            </div>
          )}
        </div>
        <Select
          label="Country"
          required
          value={formData.country_id}
          onChange={(val) => handleFieldChange('country_id', val)}
          disabled={isLoading}
          options={countryOptions}
          error={errors.country_id}
          creatable={true}
          createPrompt="Add Country"
          onCreateOption={async (newCountry) => {
            const trimmed = newCountry.trim()
            if (!trimmed) return
            const newCId = `cntry_${Date.now()}`
            const newCObj = { _id: newCId, id: newCId, name: trimmed, status: 1 }
            setCountries(prev => [...prev, newCObj])
            handleFieldChange('country_id', newCId)
            try {
              const res = await api.post(MEMBER_ENDPOINTS.MASTERS_COUNTRY, { name: trimmed, status: 1 })
              const savedId = res.data?.data?._id || res.data?.data?.id
              if (savedId) {
                setCountries(prev => prev.map(c => c._id === newCId ? { ...c, _id: savedId, id: savedId } : c))
                setFormData(prev => prev.country_id === newCId ? { ...prev, country_id: savedId } : prev)
              }
            } catch (err) {
              console.error('Failed to create country:', err)
            }
          }}
        />

        {/* Row 3: State, District, City, Location Link */}
        <Select
          label="State"
          required
          value={formData.state_id}
          onChange={(val) => handleFieldChange('state_id', val)}
          disabled={isLoading}
          placeholder="Select State"
          options={stateOptions}
          error={errors.state_id}
          creatable={Boolean(formData.country_id)}
          createPrompt="Add State"
          onCreateOption={async (newState) => {
            const trimmed = newState.trim()
            if (!trimmed) return
            const newSId = `st_${Date.now()}`
            const newSObj = {
              _id: newSId,
              id: newSId,
              name: trimmed,
              parent_id: formData.country_id || '',
              country_id: formData.country_id || '',
              status: 1
            }
            setStates(prev => [...prev, newSObj])
            handleFieldChange('state_id', newSId)
            try {
              const res = await api.post(MEMBER_ENDPOINTS.MASTERS_STATE, {
                name: trimmed,
                parent_id: formData.country_id || undefined,
                country_id: formData.country_id || undefined,
                status: 1
              })
              const savedId = res.data?.data?._id || res.data?.data?.id
              if (savedId) {
                setStates(prev => prev.map(s => s._id === newSId ? { ...s, _id: savedId, id: savedId } : s))
                setFormData(prev => prev.state_id === newSId ? { ...prev, state_id: savedId } : prev)
              }
            } catch (err) {
              console.error('Failed to create state:', err)
            }
          }}
        />
        <Select
          label="District"
          required
          value={formData.district_id}
          onChange={(val) => handleFieldChange('district_id', val)}
          disabled={isLoading}
          placeholder="Select District"
          options={districtOptions}
          error={errors.district_id}
          creatable={Boolean(formData.state_id)}
          createPrompt="Add District"
          onCreateOption={async (newDist) => {
            const trimmed = newDist.trim()
            if (!trimmed) return
            const newDId = `dist_${Date.now()}`
            const newDObj = {
              _id: newDId,
              id: newDId,
              name: trimmed,
              district: trimmed,
              parent_id: formData.state_id || '',
              state_id: formData.state_id || '',
              status: 1
            }
            setDistricts(prev => [...prev, newDObj])
            handleFieldChange('district_id', newDId)
            try {
              const res = await api.post(MEMBER_ENDPOINTS.MASTERS_DISTRICT, {
                name: trimmed,
                district: trimmed,
                parent_id: formData.state_id || undefined,
                state_id: formData.state_id || undefined,
                status: 1
              })
              const savedId = res.data?.data?._id || res.data?.data?.id
              if (savedId) {
                setDistricts(prev => prev.map(d => d._id === newDId ? { ...d, _id: savedId, id: savedId } : d))
                setFormData(prev => prev.district_id === newDId ? { ...prev, district_id: savedId } : prev)
              }
            } catch (err) {
              console.error('Failed to create district:', err)
            }
          }}
        />
        <Select
          label="City"
          required
          value={formData.city_id}
          onChange={(val) => handleFieldChange('city_id', val)}
          disabled={isLoading}
          placeholder="Select City"
          creatable={Boolean(formData.district_id)}
          createPrompt="Add City"
          onCreateOption={async (newCity) => {
            const trimmed = newCity.trim()
            if (!trimmed) return
            const newCId = `city_${Date.now()}`
            const newCObj = {
              _id: newCId,
              id: newCId,
              name: trimmed,
              city: trimmed,
              parent_id: formData.district_id || formData.state_id || '',
              district_id: formData.district_id || '',
              state_id: formData.state_id || '',
              status: 1
            }
            setCities(prev => [...prev, newCObj])
            handleFieldChange('city_id', newCId)
            try {
              const res = await api.post(MEMBER_ENDPOINTS.MASTERS_CITY, {
                name: trimmed,
                city: trimmed,
                parent_id: formData.district_id || formData.state_id || undefined,
                district_id: formData.district_id || undefined,
                state_id: formData.state_id || undefined,
                status: 1
              })
              const savedId = res.data?.data?._id || res.data?.data?.id
              if (savedId) {
                setCities(prev => prev.map(c => c._id === newCId ? { ...c, _id: savedId, id: savedId } : c))
                setFormData(prev => prev.city_id === newCId ? { ...prev, city_id: savedId } : prev)
              }
            } catch (err) {
              console.error('Failed to create city:', err)
            }
          }}
          options={cityOptions}
          error={errors.city_id}
        />
        <Input
          label="Location Link (Google Maps)"
          required
          placeholder="https://maps.google.com/..."
          value={formData.location_link}
          onChange={(e) => handleFieldChange('location_link', e.target.value)}
          disabled={isLoading}
          error={errors.location_link}
        />
      </div>

      {/* Address & About Business side by side in a 2-column grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Input
          type="textarea"
          rows={3}
          label="Address"
          required
          value={formData.address}
          onChange={(e) => handleFieldChange('address', e.target.value)}
          disabled={isLoading}
          error={errors.address}
        />

        <Input
          type="textarea"
          rows={3}
          label="About Business"
          value={formData.about_us}
          onChange={(e) => setFormData(prev => ({ ...prev, about_us: e.target.value }))}
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
              onChange={(e) => setFormData({ ...formData, status: e.target.checked ? 1 : 0 })}
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
