import React, { useContext, useEffect, useMemo, useState } from 'react'
import { AuthContext } from '../context/AuthContext'
import { normalizeRoleId } from '../lib/roles'
import api from '../lib/api'

export default function UserForm({ user, roles = [], onSubmit, isLoading }) {
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
      let formattedAnniversary
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
        family_head_id: user.family_head_id || '',
        address: user.address || '',
        status: user.status || 0
      })
      setIsHead(user.familyHead ?? (!user.family_head_id || user.relation === 'Self'))
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

  return (
    <form onSubmit={handleSubmit} className="space-y-5 px-1 select-none text-text">

      {/* SECTION 1: Personal Name details */}
      <div>
        <h4 className="text-sm font-semibold tracking-widest text-primary mb-4 pb-2 border-b border-border/50 uppercase">Primary Identity</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm  font-semibold text-text-secondary mb-1.5">First Name *</label>
            <input
              type="text"
              value={formData.first_name}
              onChange={(e) => handleChange('first_name', e.target.value)}
              className={`w-full px-3 py-2 bg-input-bg text-text border ${errors.first_name ? 'border-red-500 ring-1 ring-red-500' : 'border-border focus:border-primary/50'} rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all`}
              disabled={isLoading}
            />
            {errors.first_name && <p className="text-error-text text-xs mt-1 font-semibold">{errors.first_name}</p>}
          </div>

          <div>
            <label className="block text-sm  font-semibold text-text-secondary mb-1.5">Middle Name *</label>
            <input
              type="text"
              value={formData.middle_name}
              onChange={(e) => handleChange('middle_name', e.target.value)}
              className={`w-full px-3 py-2 bg-input-bg text-text border ${errors.middle_name ? 'border-red-500 ring-1 ring-red-500' : 'border-border focus:border-primary/50'} rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all`}
              disabled={isLoading}
            />
            {errors.middle_name && <p className="text-error-text text-xs mt-1 font-semibold">{errors.middle_name}</p>}
          </div>

          <div>
            <label className="block text-sm  font-semibold text-text-secondary mb-1.5">Last Name *</label>
            <input
              type="text"
              value={formData.last_name}
              onChange={(e) => handleChange('last_name', e.target.value)}
              className={`w-full px-3 py-2 bg-input-bg text-text border ${errors.last_name ? 'border-red-500 ring-1 ring-red-500' : 'border-border focus:border-primary/50'} rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed`}
              disabled={isLoading || !!(user && user.last_name)}
            />
            {errors.last_name && <p className="text-error-text text-xs mt-1 font-semibold">{errors.last_name}</p>}
          </div>
        </div>
      </div>

      {/* SECTION 2: Contact & Authentication */}
      <div>
        <h4 className="text-sm font-semibold tracking-widest text-primary mb-4 pb-2 border-b border-border/50 uppercase">Contact & Login Credentials</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm  font-semibold text-text-secondary mb-1.5">Email Address *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={`w-full px-3 py-2 bg-input-bg text-text border ${errors.email ? 'border-red-500 ring-1 ring-red-500' : 'border-border focus:border-primary/50'} rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all`}
              disabled={isLoading}
            />
            {errors.email && <p className="text-error-text text-xs mt-1 font-semibold">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm  font-semibold text-text-secondary mb-1.5">Mobile Number *</label>
            <input
              type="tel"
              value={formData.number}
              maxLength={10}
              onChange={(e) => handleChange('number', e.target.value)}
              className="w-full px-3 py-2 bg-input-bg text-text border border-border focus:border-primary/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all"
              disabled={isLoading}
            />
            {errors.number && <p className="text-error-text text-xs mt-1 font-semibold">{errors.number}</p>}
          </div>


        </div>
      </div>

      {/* SECTION 3: Bio Metrics & Relation */}
      <div>
        <h4 className="text-sm font-semibold tracking-widest text-primary mb-4 pb-2 border-b border-border/50 uppercase">Family </h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm  font-semibold text-text-secondary mb-1.5">Relationship</label>
            <select
              value={formData.relation}
              onChange={(e) => handleChange('relation', e.target.value)}
              className={`w-full bg-input-bg text-text border ${errors.relation ? 'border-red-500 ring-1 ring-red-500' : 'border-border focus:border-primary/50'} rounded-xl py-2 px-3 text-sm outline-none cursor-pointer`}
              disabled={isLoading}
            >
              {['Self', 'Spouse', 'Father', 'Mother', 'Son', 'Daughter', 'Brother', 'Sister', 'Grandfather', 'Grandmother', 'Other'].map(rel => (
                <option key={rel} value={rel} className="bg-surface text-text">{rel}</option>
              ))}
            </select>
            {errors.relation && <p className="text-error-text text-xs mt-1 font-semibold">{errors.relation}</p>}
          </div>

          <div>
            <label className="block text-sm  font-semibold text-text-secondary mb-1.5">Gender</label>
            <select
              value={formData.gender}
              onChange={(e) => handleChange('gender', e.target.value)}
              className="w-full bg-input-bg text-text border border-border rounded-xl py-2 px-3 text-sm outline-none focus:border-primary/50 cursor-pointer"
              disabled={isLoading}
            >
              <option value="" className="bg-surface text-text">Unspecified</option>
              <option value="Male" className="bg-surface text-text">Male</option>
              <option value="Female" className="bg-surface text-text">Female</option>
              <option value="Other" className="bg-surface text-text">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm  font-semibold text-text-secondary mb-1.5">Date of Birth</label>
            <input
              type="date"
              value={formData.dob}
              onChange={(e) => handleChange('dob', e.target.value)}
              className="w-full px-3 py-2 bg-input-bg text-text border border-border focus:border-primary/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer"
              disabled={isLoading}
            />
          </div>
          <div>
            <label className="block text-sm  font-semibold text-text-secondary mb-1.5">Anniversary</label>
            <input
              type="date"
              value={formData.anniversary}
              onChange={(e) => handleChange('anniversary', e.target.value)}
              className="w-full px-3 py-2 bg-input-bg text-text border border-border focus:border-primary/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all cursor-pointer"
              disabled={isLoading}
            />
          </div>



          <div className="" >
            <label className="block text-sm font-semibold text-text-secondary mb-1.5">Status</label>
            <div className="flex align-center item-center gap-2">
              <input
                className="h-5 w-5 px-3 py-2 self-end"
                type="checkbox"
                id="status"
                name="Approved"
                checked={formData.status == 1 || formData.status == '1'}
                onChange={(e) => handleChange('status', e.target.checked ? 1 : 0)}
                disabled={isLoading}
              /> <span className=''>
                {formData.status == 1 ? 'Approved' : 'Pending'}
              </span>
            </div>
          </div>
        </div>
      </div>
      {/* 
      {canManageRoleFields && (
        <div>
          <h4 className="text-sm font-semibold tracking-widest text-primary mb-4 pb-2 border-b border-border/50 uppercase">Roles & Committee Status</h4>
          <div className="bg-surface-secondary border border-border rounded-2xl p-4 flex flex-col md:flex-row items-center gap-6">
            <label className="flex items-center gap-3 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={formData.is_committee}
                onChange={(e) => setFormData({ ...formData, is_committee: e.target.checked })}
                className="w-4.5 h-4.5 rounded bg-input-bg border-border text-primary focus:ring-primary/10 transition cursor-pointer"
                disabled={isLoading || isEditingSelf}
                title={isEditingSelf ? 'You cannot change your own role' : undefined}
              />
              <div className="text-sm">
                <div className="font-semibold text-text">Flag as Committee Member</div>
                <div className="text-sm text-text-secondary">Grants administrative privileges in core app</div>
              </div>
            </label>

            {formData.is_committee && (
              <div className="flex-1 w-full animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm  font-semibold text-text-secondary mb-1.5">Admin Role</label>
                  <select
                    value={formData.role_id}
                    onChange={(e) => handleChange('role_id', e.target.value)}
                    className="w-full bg-input-bg text-text border border-border rounded-xl py-2 px-3 text-sm outline-none focus:border-primary/50 cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={isLoading || isEditingSelf}
                    title={isEditingSelf ? 'You cannot change your own role' : undefined}
                  >
                    <option value="" className="bg-surface text-text">Select Role</option>
                    {activeRoles.map((role) => <option key={role.id} value={role.id} className="bg-surface text-text">{role.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm  font-semibold text-text-secondary mb-1.5">Committee Designation</label>
                  <input
                    type="text"
                    placeholder="e.g. President, Vice President, Secretary"
                    value={formData.committee_role}
                    onChange={(e) => handleChange('committee_role', e.target.value)}
                    className="w-full px-3 py-2 bg-input-bg text-text border border-border focus:border-primary/50 rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all disabled:cursor-not-allowed disabled:opacity-70"
                    disabled={isLoading || isEditingSelf}
                    title={isEditingSelf ? 'You cannot change your own role' : undefined}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      )} */}

      {/* SECTION 4: Family Hierarchy */}
      <div>
        <h4 className="text-sm font-semibold tracking-widest text-primary mb-4 pb-2 border-b border-border/50 uppercase">Family Hierarchy</h4>
        <div className="flex gap-4 mb-4">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" checked={isHead} onChange={(e) => { setIsHead(true); if (errors.relation) setErrors(prev => ({...prev, relation: null})) }} className="w-4 h-4 text-primary focus:ring-primary" />
            <span className="text-sm font-semibold text-text">Head</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" checked={!isHead} onChange={(e) => { setIsHead(false); if (errors.family_head_id) setErrors(prev => ({...prev, family_head_id: null})) }} className="w-4 h-4 text-primary focus:ring-primary" />
            <span className="text-sm font-semibold text-text">Under Head</span>
          </label>
        </div>
        {!isHead && (
          <div className="mb-4">
            <label className="block text-sm font-semibold text-text-secondary mb-1.5">Select Family Head *</label>
            <select
              value={formData.family_head_id}
              onChange={(e) => handleChange('family_head_id', e.target.value)}
              className={`w-full bg-input-bg text-text border ${errors.family_head_id ? 'border-red-500 ring-1 ring-red-500' : 'border-border focus:border-primary/50'} rounded-xl py-2 px-3 text-sm outline-none cursor-pointer`}
            >
              <option value="">Select Head</option>
              {heads.map(h => (
                <option key={h._id || h.id} value={h._id || h.id}>
                  {h.name || `${h.first_name} ${h.last_name}`} - {h.number}
                </option>
              ))}
            </select>
            {errors.family_head_id && <p className="text-error-text text-xs mt-1 font-semibold">{errors.family_head_id}</p>}
          </div>
        )}
      </div>

      {/* SECTION 5: Location Details */}
      <div>
        <h4 className="text-sm font-semibold tracking-widest text-primary mb-4 pb-2 border-b border-border/50 uppercase">Location Details</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-1.5">Country</label>
            <select
              value={formData.country_id}
              onChange={(e) => handleChange('country_id', e.target.value)}
              className="w-full bg-input-bg text-text border border-border rounded-xl py-2 px-3 text-sm outline-none focus:border-primary/50 cursor-pointer"
            >
              <option value="">Select Country</option>
              {countries.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-1.5">State *</label>
            <select
              value={formData.state_id}
              onChange={(e) => handleChange('state_id', e.target.value)}
              className={`w-full bg-input-bg text-text border ${errors.state_id ? 'border-red-500 ring-1 ring-red-500' : 'border-border focus:border-primary/50'} rounded-xl py-2 px-3 text-sm outline-none cursor-pointer`}
            >
              <option value="">Select State</option>
              {states.map(s => <option key={s._id} value={s._id}>{s.name}</option>)}
            </select>
            {errors.state_id && <p className="text-error-text text-xs mt-1 font-semibold">{errors.state_id}</p>}
          </div>
          <div>
            <label className="block text-sm font-semibold text-text-secondary mb-1.5">City *</label>
            <select
              value={formData.city_id}
              onChange={(e) => handleChange('city_id', e.target.value)}
              className={`w-full bg-input-bg text-text border ${errors.city_id ? 'border-red-500 ring-1 ring-red-500' : 'border-border focus:border-primary/50'} rounded-xl py-2 px-3 text-sm outline-none cursor-pointer`}
            >
              <option value="">Select City</option>
              {cities.map(c => <option key={c._id} value={c._id}>{c.name}</option>)}
            </select>
            {errors.city_id && <p className="text-error-text text-xs mt-1 font-semibold">{errors.city_id}</p>}
          </div>
        </div>
        <div>
          <label className="block text-sm font-semibold text-text-secondary mb-1.5">Address *</label>
          <textarea
            rows="3"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            className={`w-full px-3 py-2 bg-input-bg text-text border ${errors.address ? 'border-red-500 ring-1 ring-red-500' : 'border-border focus:border-primary/50'} rounded-xl text-sm outline-none focus:ring-2 focus:ring-primary/10 transition-all`}
            disabled={isLoading}
          />
          {errors.address && <p className="text-error-text text-xs mt-1 font-semibold">{errors.address}</p>}
        </div>
      </div>

      {/* SUBMIT BUTTON */}
      <button
        type="submit"
        disabled={isLoading}
        className="flex justify-self-end mt-4 bg-primary hover:bg-primary-hover text-white p-3 rounded-xl font-semibold text-sm tracking-wider  transition-all duration-300 disabled:opacity-50 shadow-glow-primary"
      >
        {isLoading ? 'Processing ...' : user ? 'Save Changes' : 'Add Member'}
      </button>
    </form>
  )
}
