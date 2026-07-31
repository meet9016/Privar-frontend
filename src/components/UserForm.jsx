import React, { useContext, useEffect, useMemo, useState } from 'react'
import { AuthContext } from '../context/AuthContext'
import { normalizeRoleId } from '../lib/roles'
import api from '../lib/api'
import Input from './common/Input'
import Select from './common/Select'
import Button from './common/Button'
import RadioGroup from './common/RadioGroup'
import DatePicker from './DatePicker'

export default function UserForm({ user, roles = [], onSubmit, isLoading, onCancel }) {
  const { user: loggedInUser } = useContext(AuthContext)
  const [countries, setCountries] = useState([])
  const [states, setStates] = useState([])
  const [cities, setCities] = useState([])
  const [heads, setHeads] = useState([])
  const [isHead, setIsHead] = useState(true)

  useEffect(() => {
    const fetchMasters = async () => {
      try {
        const [cRes, sRes, ciRes, hRes] = await Promise.all([
          api.get('/masters/country'),
          api.get('/masters/state'),
          api.get('/masters/city'),
          api.get('/users?familyHead=true&limit=1000')
        ])
        setCountries(cRes.data?.data || [])
        setStates(sRes.data?.data || [])
        setCities(ciRes.data?.data || [])
        setHeads(hRes.data?.data || [])
      } catch (err) {
        console.error(err)
      }
    }
    fetchMasters()
  }, [])

  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    number: '',
    gender: '',
    dob: '',
    anniversary: '',
    blood_group: '',
    relation: 'Self',
    is_committee: false,
    committee_role: '',
    role_id: '',
    country_id: '',
    state_id: '',
    city_id: '',
    family_head_id: '',
    address: '',
    status: 0
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (user) {
      // Format ISO date to YYYY-MM-DD for date inputs
      let formattedDob = ''
      let formattedAnniversary = ''
      if (user.dob) {
        const d = new Date(user.dob)
        if (!isNaN(d.getTime())) {
          formattedDob = d.toISOString().slice(0, 10)
        }
      }
      if (user.anniversary) {
        const d = new Date(user.anniversary)
        if (!isNaN(d.getTime())) {
          formattedAnniversary = d.toISOString().slice(0, 10)
        }
      }

      setFormData({
        first_name: user.first_name || '',
        middle_name: user.middle_name || '',
        last_name: user.last_name || '',
        email: user.email || '',
        number: user.number || '',
        gender: user.gender || '',
        dob: formattedDob,
        anniversary: formattedAnniversary ,
        blood_group: user.blood_group || '',
        relation: user.relation || 'Self',
        is_committee: user.is_committee || false,
        committee_role: user.committee_role || '',
        role_id: normalizeRoleId(user.role_id),
        country_id: user.country_id || '',
        state_id: user.state_id || '',
        city_id: user.city_id || '',
        family_head_id: user.family_head?.id || '',
        address: user.address || '',
        status: user.status || 0
      })
      setIsHead(user.familyHead ?? (!user.family_head?.id || user.relation === 'Self'))
    } else {
      setIsHead(true)
      setFormData({
        first_name: '',
        middle_name: '',
        last_name: '',
        email: '',
        number: '',
        gender: '',
        dob: '',
        anniversary: '',
        blood_group: '',
        relation: 'Self',
        is_committee: false,
        committee_role: '',
        role_id: '',
        country_id: '',
        state_id: '',
        city_id: '',
        family_head_id: '',
        address: '',
        status: 0
      })
    }
  }, [user])

  const activeRoles = useMemo(() => roles.filter((role) => Number(role.status ?? 1) === 1), [roles])
  const isEditingSelf = Boolean(user && loggedInUser && [
    user._id,
    user.id,
    user.member_id
  ].some((value) => value && [
    loggedInUser._id,
    loggedInUser.id,
    loggedInUser.member_id
  ].some((current) => current && String(current) === String(value))))
  const canManageRoleFields = loggedInUser?.role === 'admin'

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }))
    }
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required'
    if (!formData.middle_name.trim()) newErrors.middle_name = 'Middle name is required'
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required'
    if (!formData.number.trim()) newErrors.number = 'Mobile number is required'
    if (!formData.email.trim()) newErrors.email = 'Email is required'
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = 'Email format is invalid'
    
    if (!formData.state_id) newErrors.state_id = 'State is required'
    if (!formData.city_id) newErrors.city_id = 'City is required'
    if (!formData.address.trim()) newErrors.address = 'Address is required'
    if (!isHead && !formData.family_head_id) newErrors.family_head_id = 'Family head is required'
    if (!isHead && formData.relation === 'Self') newErrors.relation = 'Under Head cannot be "Self"'

    return newErrors
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const newErrors = validate()
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }
    const payload = { ...formData }
    payload.familyHead = isHead
    if (isHead) {
      payload.family_head_id = ''
    }

    if (!canManageRoleFields || isEditingSelf) {
      delete payload.role_id
      delete payload.committee_role
      delete payload.is_committee
    }

    onSubmit(payload)
  }

  // Formatting options for Select components
  const countryOptions = countries.map(c => ({ label: c.name, value: c._id || c.id }))
  const stateOptions = states.map(s => ({ label: s.name, value: s._id || s.id }))
  const cityOptions = cities.map(c => ({ label: c.name, value: c._id || c.id }))
  const headOptions = heads.map(h => ({ label: `${h.name || `${h.first_name} ${h.last_name}`} - ${h.number}`, value: h._id || h.id }))
  const relationOptions = ['Self', 'Spouse', 'Father', 'Mother', 'Son', 'Daughter', 'Brother', 'Sister', 'Grandfather', 'Grandmother', 'Other'].map(rel => ({ label: rel, value: rel }))
  const genderOptions = [
    { label: 'Unspecified', value: '' },
    { label: 'Male', value: 'Male' },
    { label: 'Female', value: 'Female' },
    { label: 'Other', value: 'Other' },
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-5 px-1 text-text">

      {/* SECTION 1: Personal Name details */}
      <div>
        <h4 className="text-sm font-semibold tracking-widest text-primary mb-4 pb-2 border-b border-border/50 uppercase">Primary Identity</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="First Name"
            value={formData.first_name}
            onChange={(e) => handleChange('first_name', e.target.value)}
            disabled={isLoading}
            required={true}
            error={errors.first_name}
          />
          <Input
            label="Middle Name"
            value={formData.middle_name}
            onChange={(e) => handleChange('middle_name', e.target.value)}
            disabled={isLoading}
            required={true}
            error={errors.middle_name}
          />
          <Input
            label="Last Name"
            value={formData.last_name}
            onChange={(e) => handleChange('last_name', e.target.value)}
            disabled={isLoading || !!(user && user.last_name)}
            required={true}
            error={errors.last_name}
          />
        </div>
      </div>

      {/* SECTION 2: Contact & Authentication */}
      <div>
        <h4 className="text-sm font-semibold tracking-widest text-primary mb-4 pb-2 border-b border-border/50 uppercase">Contact & Login Credentials</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Email Address"
            type="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            disabled={isLoading}
            required={true}
            error={errors.email}
          />
          <Input
            label="Mobile Number"
            type="tel"
            maxLength={10}
            value={formData.number}
            onChange={(e) => handleChange('number', e.target.value)}
            disabled={isLoading}
            required={true}
            error={errors.number}
          />
        </div>
      </div>

      {/* SECTION 3: Bio Metrics & Relation */}
      <div>
        <h4 className="text-sm font-semibold tracking-widest text-primary mb-4 pb-2 border-b border-border/50 uppercase">Family</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Select
            label="Relationship"
            value={formData.relation}
            onChange={(val) => handleChange('relation', val)}
            options={relationOptions}
            disabled={isLoading}
            searchable={false}
            error={errors.relation}
          />
          <Select
            label="Gender"
            value={formData.gender}
            onChange={(val) => handleChange('gender', val)}
            options={genderOptions}
            disabled={isLoading}
            searchable={false}
          />
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-secondary">Date of Birth</label>
            <DatePicker
              value={formData.dob}
              onChange={(val) => handleChange('dob', val)}
              disabled={isLoading}
              placeholder="Select DOB"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold text-text-secondary">Anniversary</label>
            <DatePicker
              value={formData.anniversary}
              onChange={(val) => handleChange('anniversary', val)}
              disabled={isLoading}
              placeholder="Select Anniversary"
            />
          </div>

          <div className="">
            <label className="block text-sm font-semibold text-text-secondary mb-1.5">Status</label>
            <div className="flex align-center item-center gap-2">
              <input
                className="h-5 w-5 px-3 py-2 self-end accent-primary"
                type="checkbox"
                id="status"
                name="Approved"
                checked={formData.status == 1 || formData.status == '1'}
                onChange={(e) => handleChange('status', e.target.checked ? 1 : 0)}
                disabled={isLoading}
              /> <span className="">
                {formData.status == 1 ? 'Approved' : 'Pending'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: Family Hierarchy */}
      <div>
        <h4 className="text-sm font-semibold tracking-widest text-primary mb-4 pb-2 border-b border-border/50 uppercase">Family Hierarchy</h4>
        <RadioGroup
          name="hierarchy"
          options={[
            { label: 'Head', value: 'head' },
            { label: 'Under Head', value: 'under_head' }
          ]}
          value={isHead ? 'head' : 'under_head'}
          onChange={(val) => {
            const headStatus = val === 'head';
            setIsHead(headStatus);
            if (headStatus && errors.relation) setErrors(prev => ({...prev, relation: null}));
            if (!headStatus && errors.family_head_id) setErrors(prev => ({...prev, family_head_id: null}));
          }}
          className="mb-4"
        />
        
        {!isHead && (
          <div className="mb-4">
            <Select
              label="Select Family Head"
              value={formData.family_head_id}
              onChange={(val) => handleChange('family_head_id', val)}
              options={headOptions}
              required={true}
              error={errors.family_head_id}
              placeholder="Search and select head..."
            />
          </div>
        )}
      </div>

      {/* SECTION 5: Location Details */}
      <div>
        <h4 className="text-sm font-semibold tracking-widest text-primary mb-4 pb-2 border-b border-border/50 uppercase">Location Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Select
            label="Country"
            value={formData.country_id}
            onChange={(val) => handleChange('country_id', val)}
            options={countryOptions}
            placeholder="Select Country"
          />
          <Select
            label="State"
            value={formData.state_id}
            onChange={(val) => handleChange('state_id', val)}
            options={stateOptions}
            required={true}
            error={errors.state_id}
            placeholder="Select State"
          />
          <Select
            label="City"
            value={formData.city_id}
            onChange={(val) => handleChange('city_id', val)}
            options={cityOptions}
            required={true}
            error={errors.city_id}
            placeholder="Select City"
          />
        </div>
        <div>
          <label className="block text-sm font-semibold text-text-secondary mb-1.5">Address <span className="text-red-500">*</span></label>
          <textarea
            rows="3"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            className={`w-full px-3 py-2 bg-input-bg text-text border ${errors.address ? 'border-red-500 ring-1 ring-red-500' : 'border-border focus:border-primary/50'} rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all`}
            disabled={isLoading}
          />
          {errors.address && <p className="text-red-500 text-xs mt-1 font-semibold">{errors.address}</p>}
        </div>
      </div>

      {/* SUBMIT BUTTON */}
      <div className="flex justify-end gap-3 mt-4 pt-4 border-t border-border">
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        )}
        <Button
          type="submit"
          variant="primary"
          isLoading={isLoading}
        >
          {isLoading ? 'Processing...' : 'Save'}
        </Button>
      </div>
    </form>
  )
}
