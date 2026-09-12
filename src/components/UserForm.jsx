import React, { useContext, useEffect, useMemo, useState } from 'react'
import { AuthContext } from '../context/AuthContext'
import { normalizeRoleId } from '../lib/roles'
import api, { getCommunitySurname, formatDate, uploadFileToDigitalks, assetUrl } from '../lib/api'
import { MEMBER_ENDPOINTS } from '../utils/endpoints'
import Input from './common/Input'
import Select from './common/Select'
import Switch from './common/Switch'
import Button from './common/Button'
import DatePicker from './DatePicker'
import { isValidEmail } from '../lib/validation'
import { Users as UsersIcon, Plus, Trash2, User, ChevronDown, ChevronUp, Edit2, Check, Camera, Image as ImageIcon, X, RefreshCw, Eye, HelpCircle, Languages, Sparkles } from 'lucide-react'
import { toast } from '../lib/toast'
import ImagePreviewModal from './common/ImagePreviewModal'
import RelationshipGuideModal from './common/RelationshipGuideModal'
import { transliterateText, isIndicText } from '../utils/transliterate'

function MemberAvatarUpload({ value, onChange, name, disabled, label = "Photo", size = 52 }) {
  const fileInputRef = React.useRef(null)
  const [uploading, setUploading] = useState(false)
  const [previewModalOpen, setPreviewModalOpen] = useState(false)

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const uploadedUrl = await uploadFileToDigitalks(file, 'members')
      if (uploadedUrl) {
        onChange(uploadedUrl)
        toast.success('Photo uploaded successfully')
      }
    } catch (err) {
      console.error('Upload to service.digitalks.co.in failed', err)
      toast.error('Failed to upload image. Please try again.')
    } finally {
      setUploading(false)
      if (e.target) e.target.value = ''
    }
  }

  const handleRemove = (e) => {
    e.stopPropagation()
    onChange('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const previewSrc = value ? assetUrl(value) : ''

  return (
    <div className="flex items-center gap-3 shrink-0">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        onClick={(e) => { e.target.value = '' }}
        accept="image/*"
        className="hidden"
        disabled={disabled || uploading}
      />
      <div
        onClick={() => {
          if (disabled || uploading) return
          if (previewSrc) {
            setPreviewModalOpen(true)
          } else {
            fileInputRef.current?.click()
          }
        }}
        style={{ width: `${size}px`, height: `${size}px`, minWidth: `${size}px`, minHeight: `${size}px`, maxWidth: `${size}px`, maxHeight: `${size}px` }}
        className="relative rounded-full bg-surface-secondary border-2 border-dashed border-border/80 hover:border-primary/60 flex items-center justify-center cursor-pointer overflow-hidden transition-all group shrink-0 shadow-xs"
        title={previewSrc ? "Click to preview image (Zoom/Pan)" : "Click to upload photo"}
      >
        {uploading ? (
          <div className="flex items-center justify-center w-full h-full bg-surface-secondary/80">
            <RefreshCw className="w-4 h-4 animate-spin text-primary" />
          </div>
        ) : previewSrc ? (
          <>
            <img src={previewSrc} alt={name || 'Avatar'} className="w-full h-full object-cover block rounded-full" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded-full">
              <Eye className="w-4 h-4 text-white" />
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center text-text-secondary/70 group-hover:text-primary transition-colors">
            <Camera className="w-4 h-4" />
          </div>
        )}
      </div>
      <div className="flex flex-col justify-center">
        <span className="text-[11px] font-bold text-text uppercase tracking-wide">{label}</span>
        <div className="flex items-center gap-2 mt-0.5">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || uploading}
            className="text-[11px] font-bold text-primary hover:underline cursor-pointer disabled:opacity-50"
          >
            {uploading ? 'Uploading...' : (value ? 'Change' : 'Upload')}
          </button>
          {value && !uploading && (
            <button
              type="button"
              onClick={handleRemove}
              disabled={disabled}
              className="text-[11px] font-bold text-error-text hover:underline cursor-pointer"
            >
              Remove
            </button>
          )}
        </div>
      </div>

      <ImagePreviewModal
        isOpen={previewModalOpen}
        imageUrl={previewSrc}
        title={name ? `${name}'s Photo` : 'Member Photo'}
        onClose={() => setPreviewModalOpen(false)}
      />
    </div>
  )
}

let cachedMasters = null;
let mastersPromise = null;

const RELATION_GENDER_MAP = {
  Spouse: 'Female',
  Wife: 'Female',
  Husband: 'Male',
  Mother: 'Female',
  Father: 'Male',
  Daughter: 'Female',
  Son: 'Male',
  Sister: 'Female',
  Brother: 'Male',
  Grandfather: 'Male',
  Grandmother: 'Female',
  Uncle: 'Male',
  Aunt: 'Female',
  'Daughter-in-law': 'Female',
  'Son-in-law': 'Male',
  Grandson: 'Male',
  Granddaughter: 'Female',
  Cousin: '',
  Nephew: 'Male',
  Niece: 'Female',
  'Sister-in-law': 'Female',
  Bhabhi: 'Female',
  bhabhi: 'Female',
  Other: ''
}

export const RELATION_GUJARATI_MAP = {
  Self: 'પોતે',
  Head: 'મુખ્ય / પોતે',
  'Family Head': 'મુખ્ય / પોતે',
  Wife: 'પત્ની',
  wife: 'પત્ની',
  Husband: 'પતિ',
  husband: 'પતિ',
  Son: 'પુત્ર',
  son: 'પુત્ર',
  Daughter: 'પુત્રી',
  daughter: 'પુત્રી',
  Father: 'પિતા',
  father: 'પિતા',
  Mother: 'માતા',
  mother: 'માતા',
  Brother: 'ભાઈ',
  brother: 'ભાઈ',
  Sister: 'બહેન',
  sister: 'બહેન',
  Bhabhi: 'ભાભી',
  bhabhi: 'ભાભી',
  'Sister-in-law': 'ભાભી / સાળી',
  'sister-in-law': 'ભાભી / સાળી',
  Grandfather: 'દાદા',
  grandfather: 'દાદા',
  Grandmother: 'દાદી',
  grandmother: 'દાદી',
  Uncle: 'કાકા / મામા',
  uncle: 'કાકા / મામા',
  Aunt: 'કાકી / મામી / ફોઈ',
  aunt: 'કાકી / મામી / ફોઈ',
  'Daughter-in-law': 'પુત્રવધૂ',
  'daughter-in-law': 'પુત્રવધૂ',
  'Son-in-law': 'જમાઈ',
  'son-in-law': 'જમાઈ',
  Grandson: 'પૌત્ર',
  grandson: 'પૌત્ર',
  Granddaughter: 'પૌત્રી',
  granddaughter: 'પૌત્રી',
  Cousin: 'પિતરાઈ ભાઈ/બહેન',
  cousin: 'પિતરાઈ ભાઈ/બહેન',
  Nephew: 'ભત્રીજો / ભાણો',
  nephew: 'ભત્રીજો / ભાણો',
  Niece: 'ભત્રીજી / ભાણી',
  niece: 'ભત્રીજી / ભાણી',
  'Father-in-law': 'સસરા',
  'father-in-law': 'સસરા',
  'Mother-in-law': 'સાસુ',
  'mother-in-law': 'સાસુ',
  'Brother-in-law': 'સાળો / બનેવી',
  'brother-in-law': 'સાળો / બનેવી',
  BhabhiJi: 'ભાભી',
  Kaka: 'કાકા',
  kaka: 'કાકા',
  Kaki: 'કાકી',
  kaki: 'કાકી',
  Mama: 'મામા',
  mama: 'મામા',
  Mami: 'મામી',
  mami: 'મામી',
  Masa: 'માસા',
  masa: 'માસા',
  Masi: 'માસી',
  masi: 'માસી',
  Fua: 'ફુવા',
  fua: 'ફુવા',
  Foi: 'ફોઈ',
  foi: 'ફોઈ',
  Nanand: 'નણંદ',
  nanand: 'નણંદ',
  Derani: 'દેરાણી',
  derani: 'દેરાણી',
  Jethani: 'જેઠાણી',
  jethani: 'જેઠાણી',
  Jeth: 'જેઠ',
  jeth: 'જેઠ',
  Diyor: 'દિયર',
  diyor: 'દિયર',
  Salo: 'સાળો',
  salo: 'સાળો',
  Sali: 'સાળી',
  sali: 'સાળી',
  Banevi: 'બનેવી',
  banevi: 'બનેવી',
  Jamai: 'જમાઈ',
  jamai: 'જમાઈ',
  Vahu: 'પુત્રવધૂ',
  vahu: 'પુત્રવધૂ',
  Spouse: 'પત્ની / પતિ',
  spouse: 'પત્ની / પતિ',
  Other: 'અન્ય',
  other: 'અન્ય'
}

export const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'].map(bg => ({ label: bg, value: bg }))

export const getRelationDisplay = (relation, itemObj = null) => {
  if (!relation) return ''
  const cleanRel = relation === 'Spouse' ? 'Wife' : String(relation).trim()
  if (cleanRel.includes('(') && cleanRel.includes(')')) return cleanRel
  const guj = itemObj?.gujarati_name || RELATION_GUJARATI_MAP[cleanRel] || RELATION_GUJARATI_MAP[cleanRel.toLowerCase()] || ''
  return guj ? `${cleanRel} (${guj})` : cleanRel
}

export const RELATION_OPTIONS = [
  { name: 'Wife', meaning: 'પરિવારના વડા (Head) ના ધર્મપત્ની' },
  { name: 'Husband', meaning: 'પરિવારના વડા (Head) ના પતિ / જીવનસાથી' },
  { name: 'Son', meaning: 'પરિવારના વડાના દીકરા / પુત્ર' },
  { name: 'Daughter', meaning: 'પરિવારના વડાની દીકરી / પુત્રી' },
  { name: 'Father', meaning: 'પરિવારના વડાના પિતાશ્રી (બાપુજી/પપ્પા)' },
  { name: 'Mother', meaning: 'પરિવારના વડાના માતુશ્રી (બા/મમ્મી)' },
  { name: 'Brother', meaning: 'પરિવારના વડાના સગા મોટા અથવા નાના ભાઈ' },
  { name: 'Bhabhi', meaning: 'મોટા કે નાના ભાઈના પત્ની (ભાભી / મોટી ભાભી / જેઠાણી)' },
  { name: 'Nephew', meaning: 'સગા ભાઈનો દીકરો (ભત્રીજો) અથવા બહેનનો દીકરો (ભાણો)' },
  { name: 'Niece', meaning: 'સગા ભાઈની દીકરી (ભત્રીજી) અથવા બહેનની દીકરી (ભાણી)' },
  { name: 'Sister', meaning: 'પરિવારના વડાની સગી મોટી અથવા નાની બહેન' },
  { name: 'Grandfather', meaning: 'પિતાના પિતા (દાદા) અથવા માતાના પિતા (નાના)' },
  { name: 'Grandmother', meaning: 'પિતાની માતા (દાદી) અથવા માતાની માતા (નાની)' },
  { name: 'Uncle', meaning: 'કાકા, મામા, ફુવા અથવા માસા' },
  { name: 'Aunt', meaning: 'કાકી, મામી, ફોઈ અથવા માસી' },
  { name: 'Daughter-in-law', meaning: 'દીકરાની પત્ની (પુત્રવધૂ / વહુ)' },
  { name: 'Son-in-law', meaning: 'દીકરીના પતિ (જમાઈ)' },
  { name: 'Grandson', meaning: 'દીકરાનો દીકરો (પૌત્ર) અથવા દીકરીનો દીકરો (દોહિત્ર)' },
  { name: 'Granddaughter', meaning: 'દીકરાની દીકરી (પૌત્રી) અથવા દીકરીની દીકરી (દોહિત્રી)' },
  { name: 'Cousin', meaning: 'પિતરાઈ ભાઈ અથવા પિતરાઈ બહેન' },
  { name: 'Other', meaning: 'અન્ય કૌટુંબિક સંબંધ' }
].map(rel => ({
  label: getRelationDisplay(rel.name),
  value: rel.name,
  name: rel.name,
  meaning: rel.meaning,
  description: rel.meaning
}))

const GENDER_OPTIONS = [
  { label: 'Male', value: 'Male' },
  { label: 'Female', value: 'Female' },
  { label: 'Other', value: 'Other' },
]

export const capitalizeWords = (str) => {
  if (!str) return ''
  return str
    .toString()
    .trim()
    .split(/\s+/)
    .map(word => {
      if (!word) return ''
      // If word contains Gujarati or Hindi unicode characters, keep as is
      if (/[\u0A80-\u0AFF\u0900-\u097F]/.test(word)) return word
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    })
    .join(' ')
}

export default function UserForm({ user, targetMemberId = null, roles = [], onSubmit, isLoading, onCancel }) {
  const { user: loggedInUser } = useContext(AuthContext)
  const [countries, setCountries] = useState(cachedMasters ? cachedMasters.countries : [])
  const [states, setStates] = useState(cachedMasters ? cachedMasters.states : [])
  const [cities, setCities] = useState(cachedMasters ? cachedMasters.cities : [])
  const [villages, setVillages] = useState(cachedMasters ? cachedMasters.villages : [])
  const [relationOptions, setRelationOptions] = useState(
    cachedMasters?.relationships?.length ? cachedMasters.relationships : RELATION_OPTIONS
  )

  const [formData, setFormData] = useState({
    first_name: '',
    middle_name: '',
    last_name: '',
    email: '',
    number: '',
    gender: 'Male',
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
    village: '',
    address: '',
    image: '',
    status: 1
  })
  const [errors, setErrors] = useState({})

  // Family Members under this Head
  const [members, setMembers] = useState([])
  const [deletedMemberIds, setDeletedMemberIds] = useState([])
  const [membersLoading, setMembersLoading] = useState(false)
  const [expandedMemberIndex, setExpandedMemberIndex] = useState(null)
  const [editingMember, setEditingMember] = useState(null)
  const [guideModalOpen, setGuideModalOpen] = useState(false)
  const [activeGuideTarget, setActiveGuideTarget] = useState(null)

  useEffect(() => {
    const fetchMasters = async () => {
      if (cachedMasters) {
        setCountries(cachedMasters.countries)
        setStates(cachedMasters.states)
        setCities(cachedMasters.cities)
        setVillages(cachedMasters.villages)
        if (cachedMasters.relationships?.length) {
          setRelationOptions(cachedMasters.relationships)
        }
        return
      }

      if (!mastersPromise) {
        mastersPromise = Promise.all([
          api.get(MEMBER_ENDPOINTS.MASTERS_COUNTRY),
          api.get(MEMBER_ENDPOINTS.MASTERS_STATE),
          api.get(MEMBER_ENDPOINTS.MASTERS_CITY),
          api.get(MEMBER_ENDPOINTS.MASTERS_VILLAGE).catch(() => ({ data: { data: [] } })),
          api.get(MEMBER_ENDPOINTS.MASTERS_RELATIONSHIP).catch(() => ({ data: { data: [] } }))
        ])
      }

      try {
        const [cRes, sRes, ciRes, vRes, relRes] = await mastersPromise
        const countryList = cRes.data?.data || []
        
        // Merge backend relationships with default RELATION_OPTIONS
        const fetchedRels = (relRes.data?.data || []).filter(r => r.status !== 0 && r.status !== '0').map(r => ({
          label: getRelationDisplay(r.name, r),
          value: r.name,
          name: r.name,
          gujarati_name: r.gujarati_name || '',
          description: r.description || ''
        }))
        const relMap = new Map()
        RELATION_OPTIONS.forEach(r => relMap.set(r.value.toLowerCase(), r))
        fetchedRels.forEach(r => relMap.set(r.value.toLowerCase(), r))
        const mergedRelations = Array.from(relMap.values())

        cachedMasters = {
          countries: countryList,
          states: sRes.data?.data || [],
          cities: ciRes.data?.data || [],
          villages: vRes.data?.data || [],
          relationships: mergedRelations
        }

        setCountries(cachedMasters.countries)
        setStates(cachedMasters.states)
        setCities(cachedMasters.cities)
        setVillages(cachedMasters.villages)
        setRelationOptions(mergedRelations)

        // If country not yet selected, default to India
        setFormData(prev => {
          if (!prev.country_id) {
            const india = countryList.find(c => /india/i.test(c.name))
            if (india) {
              return { ...prev, country_id: india._id || india.id }
            }
          }
          return prev
        })
      } catch (err) {
        console.error(err)
      }
    }
    fetchMasters()
  }, [])

  useEffect(() => {
    if (user) {
      let formattedDob = ''
      let formattedAnniversary = ''
      if (user.dob) {
        const d = new Date(user.dob)
        if (!isNaN(d.getTime())) formattedDob = d.toISOString().slice(0, 10)
      }
      if (user.anniversary) {
        const d = new Date(user.anniversary)
        if (!isNaN(d.getTime())) formattedAnniversary = d.toISOString().slice(0, 10)
      }

      setFormData({
        first_name: user.first_name || '',
        middle_name: user.middle_name || '',
        last_name: user.last_name !== undefined ? user.last_name : (getCommunitySurname() || ''),
        email: user.email || '',
        number: user.number || '',
        gender: user.gender || 'Male',
        dob: formattedDob,
        anniversary: formattedAnniversary,
        blood_group: user.blood_group || '',
        relation: 'Self',
        is_committee: user.is_committee || false,
        committee_role: user.committee_role || '',
        role_id: normalizeRoleId(user.role_id),
        country_id: user.country_id || '',
        state_id: user.state_id || '',
        city_id: user.city_id || '',
        village: user.village || user.village_id || '',
        address: user.address || '',
        image: user.image || user.profile_image || '',
        status: user.status !== undefined ? Number(user.status) : 1
      })
      const headId = user.id || user._id
      if (headId) {
        setMembersLoading(true)
        api.get(MEMBER_ENDPOINTS.GET_FAMILY_MEMBERS(headId))
          .then(res => {
            const rawList = res.data?.data || res.data || []
            const childMembers = rawList.filter(m => {
              const mId = String(m.id || m._id)
              return mId !== String(headId) && m.relation !== 'Self'
            }).map(m => {
              let mDob = ''
              let mAnniversary = ''
              if (m.dob) {
                const d = new Date(m.dob)
                if (!isNaN(d.getTime())) mDob = d.toISOString().slice(0, 10)
              }
              if (m.anniversary) {
                const d = new Date(m.anniversary)
                if (!isNaN(d.getTime())) mAnniversary = d.toISOString().slice(0, 10)
              }
              return {
                _id: m.id || m._id,
                first_name: m.first_name || '',
                middle_name: m.middle_name || '',
                last_name: m.last_name || '',
                relation: m.relation === 'Spouse' ? 'Wife' : (m.relation || 'Wife'),
                gender: m.gender || 'Male',
                dob: mDob,
                anniversary: mAnniversary,
                blood_group: m.blood_group || '',
                number: m.number || '',
                email: m.email || '',
                image: m.image || m.profile_image || '',
                status: m.status !== undefined ? Number(m.status) : 1
              }
            })
            setMembers(childMembers)

            // If targetMemberId provided, auto-expand that member's row for inline edit
            if (targetMemberId) {
              const targetIdx = childMembers.findIndex(m => String(m._id) === String(targetMemberId) || String(m.id) === String(targetMemberId))
              if (targetIdx !== -1) {
                setExpandedMemberIndex(targetIdx)
                setEditingMember({ ...childMembers[targetIdx] })
              }
            }
          })
          .catch(err => console.error('Failed to fetch family members', err))
          .finally(() => setMembersLoading(false))
      }
    } else {
      const india = countries.find(c => /india/i.test(c.name))
      const defaultCommunityName = getCommunitySurname() || ''

      setFormData({
        first_name: '',
        middle_name: '',
        last_name: defaultCommunityName,
        email: '',
        number: '',
        gender: 'Male',
        dob: '',
        anniversary: '',
        blood_group: '',
        relation: 'Self',
        is_committee: false,
        committee_role: '',
        role_id: '',
        country_id: india ? (india._id || india.id) : '',
        state_id: '',
        city_id: '',
        village: '',
        address: '',
        status: 1
      })
      setMembers([])
      setDeletedMemberIds([])
      setExpandedMemberIndex(null)
    }
  }, [user, targetMemberId, countries])

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
  const canManageRoleFields = Boolean(
    loggedInUser?.role === 'admin' ||
    loggedInUser?.role === 'superadmin' ||
    loggedInUser?.committee_role === 'President' ||
    loggedInUser?.committee_role === 'Admin' ||
    loggedInUser?.is_super_admin ||
    Boolean(loggedInUser?.role_id)
  )

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    setErrors(prev => {
      const updated = { ...prev }
      if (field === 'first_name' && value.trim()) delete updated.first_name
      if (field === 'middle_name' && value.trim()) delete updated.middle_name
      if (field === 'last_name' && value.trim()) delete updated.last_name
      if (field === 'number' && value.trim().length === 10) delete updated.number
      if (field === 'email') {
        if (value.trim() && !isValidEmail(value)) updated.email = 'Please enter a valid email'
        else delete updated.email
      }
      if (field === 'country_id' && value) delete updated.country_id
      if (field === 'state_id' && value) delete updated.state_id
      if (field === 'city_id' && value) delete updated.city_id
      if (field === 'address' && value.trim()) delete updated.address
      if (field === 'dob' && value) delete updated.dob
      return updated
    })
  }

  // --- Dynamic Family Members Handlers ---
  const handleAddMember = () => {
    // If another member was being edited, commit it first
    let currentMembers = [...members]
    if (expandedMemberIndex !== null && editingMember && currentMembers[expandedMemberIndex]) {
      currentMembers[expandedMemberIndex] = { ...editingMember }
    }

    const defaultLastName = formData.last_name || getCommunitySurname() || ''
    const defaultMiddleName = formData.first_name || ''
    const newIdx = currentMembers.length
    const newMemberObj = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
      first_name: '',
      middle_name: defaultMiddleName,
      last_name: defaultLastName,
      relation: 'Wife',
      gender: 'Female',
      dob: '',
      anniversary: '',
      blood_group: '',
      number: '',
      email: '',
      image: '',
      status: 1
    }

    setMembers([...currentMembers, newMemberObj])
    setExpandedMemberIndex(newIdx)
    setEditingMember({ ...newMemberObj })
  }

  const handleEditingMemberChange = (field, value) => {
    setEditingMember(prev => {
      if (!prev) return prev
      const current = { ...prev, [field]: value }

      // Auto set gender and default middle name when relationship changes
      if (field === 'relation') {
        const mappedGender = RELATION_GENDER_MAP[value]
        if (mappedGender) {
          current.gender = mappedGender
        }
        if (value === 'Brother' || value === 'Sister') {
          const father = members.find((m, i) => m.relation === 'Father' && i !== expandedMemberIndex)
          const fatherName = father?.first_name || formData.middle_name || ''
          if (fatherName) {
            current.middle_name = fatherName
            if (father?._id || father?.id) {
              current.father_id = father._id || father.id
            }
          }
        } else if (value === 'Bhabhi') {
          const brother = members.find((m, i) => m.relation === 'Brother' && i !== expandedMemberIndex)
          if (brother && brother.first_name && (!current.middle_name || current.middle_name === formData.first_name)) {
            current.middle_name = brother.first_name
            current.spouse_id = brother._id || brother.id
          }
        } else if (value === 'Daughter-in-law') {
          const son = members.find((m, i) => m.relation === 'Son' && i !== expandedMemberIndex)
          if (son && son.first_name && (!current.middle_name || current.middle_name === formData.first_name)) {
            current.middle_name = son.first_name
            current.spouse_id = son._id || son.id
          }
        } else if (value === 'Cousin') {
          const uncle = members.find((m, i) => m.relation === 'Uncle' && i !== expandedMemberIndex)
          if (uncle && uncle.first_name && (!current.middle_name || current.middle_name === formData.first_name)) {
            current.middle_name = uncle.first_name
            current.father_id = uncle._id || uncle.id
          }
        } else if (['Nephew', 'Niece'].includes(value)) {
          const brother = members.find((m, i) => m.relation === 'Brother' && i !== expandedMemberIndex)
          if (brother && brother.first_name && (!current.middle_name || current.middle_name === formData.first_name)) {
            current.middle_name = brother.first_name
            current.father_id = brother._id || brother.id
          }
        } else if (['Grandson', 'Granddaughter'].includes(value)) {
          const son = members.find((m, i) => m.relation === 'Son' && i !== expandedMemberIndex)
          if (son && son.first_name && (!current.middle_name || current.middle_name === formData.first_name)) {
            current.middle_name = son.first_name
            current.father_id = son._id || son.id
          }
        } else if (value === 'Wife' || ['Son', 'Daughter'].includes(value)) {
          if (!current.middle_name && formData.first_name) {
            current.middle_name = formData.first_name
          }
        }
      }

      return current
    })

    if (expandedMemberIndex !== null) {
      setMembers(prev => {
        const updated = [...prev]
        if (updated[expandedMemberIndex]) {
          const current = { ...updated[expandedMemberIndex], [field]: value }
          if (field === 'relation') {
            const mappedGender = RELATION_GENDER_MAP[value]
            if (mappedGender) current.gender = mappedGender
            if (value === 'Brother' || value === 'Sister') {
              const father = prev.find((m, i) => m.relation === 'Father' && i !== expandedMemberIndex)
              const fatherName = father?.first_name || formData.middle_name || ''
              if (fatherName) {
                current.middle_name = fatherName
                if (father?._id || father?.id) {
                  current.father_id = father._id || father.id
                }
              }
            } else if (value === 'Bhabhi') {
              const brother = prev.find((m, i) => m.relation === 'Brother' && i !== expandedMemberIndex)
              if (brother && brother.first_name && (!current.middle_name || current.middle_name === formData.first_name)) {
                current.middle_name = brother.first_name
                current.spouse_id = brother._id || brother.id
              }
            } else if (value === 'Daughter-in-law') {
              const son = prev.find((m, i) => m.relation === 'Son' && i !== expandedMemberIndex)
              if (son && son.first_name && (!current.middle_name || current.middle_name === formData.first_name)) {
                current.middle_name = son.first_name
                current.spouse_id = son._id || son.id
              }
            } else if (value === 'Cousin') {
              const uncle = prev.find((m, i) => m.relation === 'Uncle' && i !== expandedMemberIndex)
              if (uncle && uncle.first_name && (!current.middle_name || current.middle_name === formData.first_name)) {
                current.middle_name = uncle.first_name
                current.father_id = uncle._id || uncle.id
              }
            } else if (['Nephew', 'Niece'].includes(value)) {
              const brother = prev.find((m, i) => m.relation === 'Brother' && i !== expandedMemberIndex)
              if (brother && brother.first_name && (!current.middle_name || current.middle_name === formData.first_name)) {
                current.middle_name = brother.first_name
                current.father_id = brother._id || brother.id
              }
            } else if (['Grandson', 'Granddaughter'].includes(value)) {
              const son = prev.find((m, i) => m.relation === 'Son' && i !== expandedMemberIndex)
              if (son && son.first_name && (!current.middle_name || current.middle_name === formData.first_name)) {
                current.middle_name = son.first_name
                current.father_id = son._id || son.id
              }
            } else if (value === 'Wife' || ['Son', 'Daughter'].includes(value)) {
              if (!current.middle_name && formData.first_name) {
                current.middle_name = formData.first_name
              }
            }
          }
          updated[expandedMemberIndex] = current
        }
        return updated
      })
    }
  }

  const handleDoneEditing = () => {
    if (expandedMemberIndex !== null && editingMember) {
      const sanitized = {
        ...editingMember,
        first_name: capitalizeWords(editingMember.first_name),
        middle_name: capitalizeWords(editingMember.middle_name),
        last_name: capitalizeWords(editingMember.last_name)
      }
      setMembers(prev => {
        const updated = [...prev]
        if (updated[expandedMemberIndex]) {
          updated[expandedMemberIndex] = sanitized
        }
        return updated
      })
    }
    setExpandedMemberIndex(null)
    setEditingMember(null)
  }

  const handleRemoveMember = (index, e) => {
    if (e) e.stopPropagation()
    const target = members[index]
    if (target?._id) {
      setDeletedMemberIds(prev => [...prev, target._id])
    }
    setMembers(prev => prev.filter((_, i) => i !== index))
    if (expandedMemberIndex === index) {
      setExpandedMemberIndex(null)
      setEditingMember(null)
    } else if (expandedMemberIndex > index) {
      setExpandedMemberIndex(expandedMemberIndex - 1)
    }
  }

  const toggleExpandMember = (index) => {
    if (expandedMemberIndex === index) {
      // Done / collapse current member
      handleDoneEditing()
    } else {
      // Commit previous member if open
      let currentMembers = [...members]
      if (expandedMemberIndex !== null && editingMember && currentMembers[expandedMemberIndex]) {
        currentMembers[expandedMemberIndex] = {
          ...editingMember,
          first_name: capitalizeWords(editingMember.first_name),
          middle_name: capitalizeWords(editingMember.middle_name),
          last_name: capitalizeWords(editingMember.last_name)
        }
        setMembers(currentMembers)
      }
      setExpandedMemberIndex(index)
      setEditingMember(currentMembers[index] ? { ...currentMembers[index] } : null)
    }
  }

  const validate = (membersToValidate = members) => {
    const newErrors = {}
    if (!formData.first_name.trim()) newErrors.first_name = 'First name is required'
    if (!formData.middle_name.trim()) newErrors.middle_name = 'Middle name is required'
    if (!formData.last_name.trim()) newErrors.last_name = 'Last name is required'
    if (!formData.number.trim()) newErrors.number = 'Mobile number is required'
    else if (formData.number.trim().length < 10) newErrors.number = '10 digits required'
    if (formData.email.trim() && !isValidEmail(formData.email)) newErrors.email = 'Valid email required'

    if (!formData.country_id) newErrors.country_id = 'Country is required'
    if (!formData.state_id) newErrors.state_id = 'State is required'
    if (!formData.city_id) newErrors.city_id = 'City is required'
    if (!formData.dob) newErrors.dob = 'Date of Birth is required'

    // Validate family members if any are added
    membersToValidate.forEach((m, idx) => {
      if (!m.first_name || !m.first_name.trim()) {
        newErrors[`member_${idx}_first_name`] = 'Required'
      }
      if (!m.relation) {
        newErrors[`member_${idx}_relation`] = 'Required'
      }
      if (m.number && m.number.trim().length > 0 && m.number.trim().length < 10) {
        newErrors[`member_${idx}_number`] = '10 digits'
      }
    })

    return newErrors
  }

  const handleSubmit = (e) => {
    e.preventDefault()

    // First commit any active editing member buffer into effective members array
    let currentMembers = [...members]
    if (expandedMemberIndex !== null && editingMember && currentMembers[expandedMemberIndex]) {
      currentMembers[expandedMemberIndex] = {
        ...editingMember,
        first_name: capitalizeWords(editingMember.first_name),
        middle_name: capitalizeWords(editingMember.middle_name),
        last_name: capitalizeWords(editingMember.last_name)
      }
      setMembers(currentMembers)
    }

    const newErrors = validate(currentMembers)
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      // If error belongs to a member, expand that member
      const memberErrKey = Object.keys(newErrors).find(k => k.startsWith('member_'))
      if (memberErrKey) {
        const errIdx = parseInt(memberErrKey.split('_')[1], 10)
        if (!isNaN(errIdx)) {
          setExpandedMemberIndex(errIdx)
          setEditingMember(currentMembers[errIdx] ? { ...currentMembers[errIdx] } : null)
        }
      }
      return
    }

    const payload = {
      ...formData,
      first_name: capitalizeWords(formData.first_name),
      middle_name: capitalizeWords(formData.middle_name),
      last_name: capitalizeWords(formData.last_name),
      familyHead: true,
      relation: 'Self',
      members: currentMembers.map(m => ({
        ...(m._id ? { _id: m._id } : {}),
        first_name: capitalizeWords(m.first_name),
        middle_name: capitalizeWords(m.middle_name),
        last_name: capitalizeWords(m.last_name || formData.last_name),
        relation: m.relation || 'Other',
        gender: m.gender || 'Male',
        spouse_id: m.spouse_id || null,
        father_id: m.father_id || null,
        dob: m.dob || null,
        anniversary: m.anniversary || null,
        blood_group: m.blood_group || '',
        number: (m.number || '').trim(),
        email: (m.email || '').trim(),
        image: m.image || '',
        status: m.status !== undefined ? Number(m.status) : 1
      })),
      deletedMemberIds
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
  const villageOptions = villages.map(v => ({ label: v.name, value: v.name }))
  const roleOptions = [
    { label: 'Select Assigned Role (Optional)', value: '' },
    ...activeRoles.map(r => ({ label: r.name, value: r.id || String(r._id) }))
  ]

  return (
    <form onSubmit={handleSubmit} className="space-y-4 px-0.5 text-text">
      {/* ─── SECTION 1: FAMILY HEAD DETAILS (COMPACT 4 ITEMS PER LINE) ─────────── */}
      <div className="bg-card border border-border rounded-xl p-3.5 sm:p-4 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-border/60">
          <div className="flex items-center gap-3.5">
            <MemberAvatarUpload
              value={formData.image}
              onChange={(val) => handleChange('image', val)}
              name={formData.first_name}
              label="Head Photo"
              size={54}
              disabled={isLoading}
            />
            <div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold">
                  <User className="w-3.5 h-3.5" />
                </div>
                <h3 className="text-xs font-bold text-text uppercase tracking-wide">Family Head Details</h3>
              </div>
              <p className="text-[11px] text-text-secondary mt-0.5">Primary head of the family</p>
            </div>
          </div>
          <span className="self-start sm:self-center px-2 py-0.5 rounded-md bg-primary/10 border border-primary/20 text-primary text-[11px] font-bold">
            Family Head
          </span>
        </div>

        {/* Row 1: Name & Mobile (4 inputs) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          <Input
            label="First Name"
            placeholder="Head First Name"
            value={formData.first_name}
            onChange={(e) => handleChange('first_name', e.target.value.replace(/[^a-zA-Z\u0A80-\u0AFF\u0900-\u097F\s.'-]/g, ''))}
            disabled={isLoading}
            required={true}
            error={errors.first_name}
          />
          <Input
            label="Middle Name"
            placeholder="Middle Name"
            value={formData.middle_name}
            onChange={(e) => handleChange('middle_name', e.target.value.replace(/[^a-zA-Z\u0A80-\u0AFF\u0900-\u097F\s.'-]/g, ''))}
            disabled={isLoading}
            required={true}
            error={errors.middle_name}
          />
          <Input
            label="Last Name / Surname"
            placeholder="Surname"
            value={formData.last_name}
            onChange={(e) => handleChange('last_name', e.target.value.replace(/[^a-zA-Z\u0A80-\u0AFF\u0900-\u097F\s.'-]/g, ''))}
            disabled={isLoading}
            required={true}
            error={errors.last_name}
          />
          <Input
            label="Mobile Number"
            type="tel"
            maxLength={10}
            placeholder="10 digit mobile"
            value={formData.number}
            onChange={(e) => handleChange('number', e.target.value.replace(/\D/g, '').slice(0, 10))}
            disabled={isLoading}
            required={true}
            error={errors.number}
          />
        </div>

        {/* Row 2: Email, Blood Group, Gender, Assign Role (4 inputs) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          <Input
            label="Email Address"
            type="email"
            placeholder="email@example.com"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            disabled={isLoading}
            required={false}
            error={errors.email}
          />
          <Select
            label="Blood Group"
            value={formData.blood_group}
            onChange={(val) => handleChange('blood_group', val)}
            options={[{ label: 'Select Blood Group', value: '' }, ...BLOOD_GROUPS]}
            disabled={isLoading}
            searchable={true}
          />
          <Select
            label="Gender"
            value={formData.gender}
            onChange={(val) => handleChange('gender', val)}
            options={GENDER_OPTIONS}
            disabled={isLoading}
            searchable={false}
          />
          {canManageRoleFields ? (
            <Select
              label="Assign Role"
              value={formData.role_id}
              onChange={(val) => handleChange('role_id', val)}
              options={roleOptions}
              placeholder="Select Role (Optional)"
              disabled={isLoading}
              searchable={true}
            />
          ) : (
            <div className="hidden md:block" />
          )}
        </div>

        {/* Row 3: Country, State, City, Village (4 inputs in 1 line) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5">
          <Select
            label="Country"
            value={formData.country_id}
            onChange={(val) => handleChange('country_id', val)}
            options={countryOptions}
            required={true}
            error={errors.country_id}
            placeholder="Select Country"
            searchable={true}
          />
          <Select
            label="State"
            value={formData.state_id}
            onChange={(val) => handleChange('state_id', val)}
            options={stateOptions}
            required={true}
            error={errors.state_id}
            placeholder="Select State"
            searchable={true}
          />
          <Select
            label="City"
            value={formData.city_id}
            onChange={(val) => handleChange('city_id', val)}
            options={cityOptions}
            required={true}
            error={errors.city_id}
            placeholder="Select City"
            searchable={true}
          />
          {villageOptions.length > 0 ? (
            <Select
              label="Village"
              value={formData.village}
              onChange={(val) => handleChange('village', val)}
              options={[{ label: 'Select Village', value: '' }, ...villageOptions]}
              placeholder="Select Village"
              searchable={true}
              disabled={isLoading}
            />
          ) : (
            <Input
              label="Village"
              value={formData.village}
              onChange={(e) => handleChange('village', e.target.value)}
              placeholder="Enter Village"
              disabled={isLoading}
            />
          )}
        </div>

        {/* Row 4: Date of Birth, Anniversary Date, Address, Status (4 inputs/columns) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2.5 items-end">
          <DatePicker
            label="Date of Birth"
            required
            value={formData.dob}
            onChange={(val) => handleChange('dob', val)}
            disabled={isLoading}
            placeholder="Select DOB"
            error={errors.dob}
          />
          <DatePicker
            label="Anniversary Date"
            value={formData.anniversary}
            onChange={(val) => handleChange('anniversary', val)}
            disabled={isLoading}
            placeholder="Select Anniversary"
          />
          <Input
            label="Address"
            placeholder="Address (Area, Street)"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            disabled={isLoading}
          />
          <Switch
            label="Status"
            checked={Number(formData.status ?? 1) === 1}
            onChange={(val) => handleChange('status', val ? 1 : 0)}
            disabled={isLoading}
            activeLabel="Active"
            inactiveLabel="Inactive"
          />
        </div>
      </div>

      {/* ─── SECTION 2: DYNAMIC FAMILY MEMBERS (SINGLE-LINE TABLE + SLIDE-DOWN EDIT) ─── */}
      <div className="bg-card border border-border rounded-xl p-3.5 sm:p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-border/60">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-600 font-bold">
              <UsersIcon className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-1.5">
              <h3 className="text-xs font-bold text-text uppercase tracking-wide">Family Members</h3>
              <span className="px-1.5 py-0.2 rounded-full bg-primary/10 text-primary font-bold text-[11px]">
                {members.length}
              </span>
            </div>
          </div>

          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={handleAddMember}
            className="flex items-center gap-1 py-1 px-2.5 border-primary/40 text-primary hover:bg-primary/10 cursor-pointer shadow-xs font-bold text-xs"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Member</span>
          </Button>
        </div>

        {membersLoading ? (
          <div className="py-6 text-center text-xs text-text-secondary font-medium">
            Loading family members...
          </div>
        ) : members.length === 0 ? (
          <div className="py-6 px-3 rounded-lg border border-dashed border-border/80 text-center bg-surface/30">
            <p className="text-xs font-semibold text-text">No family members added</p>
            <p className="text-[11px] text-text-secondary mt-0.5 mb-2.5">Click Add Member to register spouse, children, or parents under this head</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddMember}
              className="inline-flex items-center gap-1 text-xs text-primary border-primary/30 hover:bg-primary/10 py-1"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Member</span>
            </Button>
          </div>
        ) : (
          <div className="border border-border rounded-xl overflow-hidden shadow-xs divide-y divide-border">
            {/* Table Header Row */}
            <div className="hidden sm:grid sm:grid-cols-12 gap-2 px-3.5 py-2 bg-surface-secondary text-[11px] font-bold text-text-secondary uppercase tracking-wider items-center">
              <div className="col-span-1 text-center">#</div>
              <div className="col-span-3">Name</div>
              <div className="col-span-2">Relation</div>
              <div className="col-span-1">Gender</div>
              <div className="col-span-2">DOB</div>
              <div className="col-span-1 text-center">Blood</div>
              <div className="col-span-1">Mobile</div>
              <div className="col-span-1 text-right">Actions</div>
            </div>

            {/* Member Rows */}
            {members.map((m, idx) => {
              const isExpanded = expandedMemberIndex === idx
              const fNameErr = errors[`member_${idx}_first_name`]
              const relErr = errors[`member_${idx}_relation`]
              const numErr = errors[`member_${idx}_number`]
              const hasRowError = fNameErr || relErr || numErr

              return (
                <div key={m._id || m.id || idx} className="bg-card transition-colors">
                  {/* Single Line Member Row Summary */}
                  <div
                    onClick={() => toggleExpandMember(idx)}
                    className={`grid grid-cols-1 sm:grid-cols-12 gap-2 items-center px-3.5 py-2.5 cursor-pointer hover:bg-surface-secondary/60 transition-colors ${
                      isExpanded ? 'bg-primary/5 border-l-4 border-l-primary' : ''
                    } ${hasRowError ? 'bg-error-bg/30 border-l-4 border-l-red-500' : ''}`}
                  >
                    {/* Index */}
                    <div className="col-span-1 flex items-center gap-1.5 sm:justify-center">
                      <span className="w-5 h-5 rounded-full bg-surface-secondary border border-border text-[11px] font-bold text-text flex items-center justify-center">
                        {idx + 1}
                      </span>
                    </div>

                    {/* Name with Avatar */}
                    <div className="col-span-3 min-w-0 flex items-center gap-2">
                      <div 
                        style={{ width: '28px', height: '28px', minWidth: '28px', minHeight: '28px' }}
                        className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center text-primary font-bold text-[11px] shrink-0 overflow-hidden shadow-xs"
                      >
                        {m.image ? (
                          <img src={assetUrl(m.image)} alt={m.first_name} className="w-full h-full object-cover block" />
                        ) : (
                          (m.first_name || 'M').charAt(0).toUpperCase()
                        )}
                      </div>
                      <span className="text-xs font-bold text-text truncate block">
                        {[capitalizeWords(m.first_name), capitalizeWords(m.middle_name), capitalizeWords(m.last_name)].filter(Boolean).join(' ') || (
                          <span className="text-text-secondary italic">New Member (Click to edit)</span>
                        )}
                      </span>
                    </div>

                    {/* Relation */}
                    <div className="col-span-2">
                      <span
                        onClick={(e) => {
                          e.stopPropagation()
                          setActiveGuideTarget(idx)
                          setGuideModalOpen(true)
                        }}
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20 text-[11px] font-bold hover:bg-primary/20 transition-colors cursor-pointer"
                        title="Click to view relation explanation (સંબંધની સમજૂતી)"
                      >
                        <span>{getRelationDisplay(m.relation) || 'Relation'}</span>
                        <HelpCircle className="w-3 h-3 opacity-70 shrink-0" />
                      </span>
                    </div>

                    {/* Gender (separate column) */}
                    <div className="col-span-1 text-xs text-text-secondary font-medium">
                      {m.gender || '-'}
                    </div>

                    {/* DOB (separate column) */}
                    <div className="col-span-2 text-xs text-text-secondary font-medium truncate">
                      {m.dob ? formatDate(m.dob) : '-'}
                    </div>

                    {/* Blood Group (separate column) */}
                    <div className="col-span-1 text-center">
                      {m.blood_group ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                          {m.blood_group}
                        </span>
                      ) : (
                        <span className="text-text-secondary text-xs">-</span>
                      )}
                    </div>

                    {/* Mobile */}
                    <div className="col-span-1 text-xs text-text font-medium truncate">
                      {m.number || <span className="text-text-secondary">-</span>}
                    </div>

                    {/* Action buttons (matching Users table icon buttons) */}
                    <div className="col-span-1 flex items-center justify-end gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => toggleExpandMember(idx)}
                        className={`p-1.5 rounded-xl border transition-all cursor-pointer ${
                          isExpanded
                            ? 'text-white bg-primary border-primary shadow-xs'
                            : 'text-primary hover:text-primary bg-primary/10 hover:bg-primary/20 border-primary/20'
                        }`}
                        title={isExpanded ? 'Done editing' : 'Edit member'}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={(e) => handleRemoveMember(idx, e)}
                        className="p-1.5 text-error-text hover:text-error-text bg-error-bg/60 hover:bg-error-bg border border-error-border rounded-xl transition-all cursor-pointer"
                        title="Remove member"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Slide-Down Inline Edit Form (Accordion) */}
                  {isExpanded && editingMember && (
                    <div className="p-3.5 sm:p-4 bg-surface/50 border-t border-b border-border/80 space-y-3 animate-fade-in">
                      {/* Top Bar: Member Photo + Status Switch + Done Button */}
                      <div className="flex items-center justify-between pb-2.5 border-b border-border/50">
                        <div className="flex items-center gap-4">
                          <MemberAvatarUpload
                            value={editingMember.image || ''}
                            onChange={(val) => handleEditingMemberChange('image', val)}
                            name={editingMember.first_name}
                            label="Member Photo"
                            size={44}
                            disabled={isLoading}
                          />
                          <div className="flex items-center pl-2 border-l border-border/60">
                            <Switch
                              label="Status"
                              checked={Number(editingMember.status ?? 1) === 1}
                              onChange={(val) => handleEditingMemberChange('status', val ? 1 : 0)}
                              disabled={isLoading}
                              activeLabel="Active"
                              inactiveLabel="Inactive"
                            />
                          </div>
                        </div>

                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={handleDoneEditing}
                          className="h-[34px] px-4 text-xs font-bold text-primary border-primary/30 hover:bg-primary/10 cursor-pointer shadow-xs"
                        >
                          <Check className="w-3.5 h-3.5 mr-1" /> Done
                        </Button>
                      </div>

                      {/* Row 1: First Name, Middle Name, Last Name, Relationship (4 inputs) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 items-start">
                        <Input
                          label="First Name"
                          placeholder="First Name"
                          value={editingMember.first_name || ''}
                          onChange={(e) => handleEditingMemberChange('first_name', e.target.value.replace(/[^a-zA-Z\u0A80-\u0AFF\u0900-\u097F\s.'-]/g, ''))}
                          disabled={isLoading}
                          required={true}
                          error={fNameErr}
                        />
                        <Input
                          label="Middle Name"
                          placeholder="Middle Name"
                          value={editingMember.middle_name || ''}
                          onChange={(e) => handleEditingMemberChange('middle_name', e.target.value.replace(/[^a-zA-Z\u0A80-\u0AFF\u0900-\u097F\s.'-]/g, ''))}
                          disabled={isLoading}
                        />
                        <Input
                          label="Last Name / Surname"
                          placeholder="Surname"
                          value={editingMember.last_name || ''}
                          onChange={(e) => handleEditingMemberChange('last_name', e.target.value.replace(/[^a-zA-Z\u0A80-\u0AFF\u0900-\u097F\s.'-]/g, ''))}
                          disabled={isLoading}
                        />
                        <div className="flex flex-col">
                          <div className="flex items-center justify-between mb-1">
                            <label className="text-xs font-semibold text-text">
                              Relationship <span className="text-error-text">*</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveGuideTarget(idx)
                                setGuideModalOpen(true)
                              }}
                              className="inline-flex items-center gap-1 text-[11px] font-bold text-primary hover:underline cursor-pointer"
                              title="Click to understand relationship in Gujarati & English"
                            >
                              <HelpCircle className="w-3.5 h-3.5" />
                              <span>Guide (સમજૂતી)</span>
                            </button>
                          </div>
                          <Select
                            value={editingMember.relation || 'Wife'}
                            onChange={(val) => handleEditingMemberChange('relation', val)}
                            options={relationOptions}
                            required={true}
                            searchable={true}
                            error={relErr}
                          />
                        </div>
                      </div>

                      {/* Smart Relationship Connection Helpers */}
                      {['Brother', 'Sister'].includes(editingMember.relation) && (() => {
                        const fatherMember = members.find((m, i) => m.relation === 'Father' && i !== expandedMemberIndex)
                        const fatherName = fatherMember?.first_name || formData.middle_name || ''
                        return (
                          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                              <div>
                                <span className="font-bold text-text">પિતાનું નામ (Father Name):</span>
                                <span className="ml-1.5 font-bold text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                  {fatherName || '(Head ના પિતાનું નામ)'}
                                </span>
                                <p className="text-[11px] text-text-secondary mt-0.5">
                                  પરિવારના વડા (Head) ના પિતાનું નામ Middle Name માં આપોઆપ સેટ થઈ ગયું છે.
                                </p>
                              </div>
                            </div>
                          </div>
                        )
                      })()}

                      {editingMember.relation === 'Bhabhi' && (() => {
                        const brotherOptions = members.filter((m, i) => m.relation === 'Brother' && i !== expandedMemberIndex)
                        return (
                          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-primary shrink-0" />
                              <div>
                                <span className="font-bold text-text">પતિ / ભાઈ (Husband / Brother):</span>
                                <p className="text-[11px] text-text-secondary mt-0.5">
                                  {brotherOptions.length > 0 
                                    ? 'ક્યા ભાઈના પત્ની છે તે પસંદ કરો (Middle Name આપોઆપ આવી જશે):' 
                                    : 'પરિવારમાં કોઈ ભાઈ લિસ્ટેડ નથી. તમે ઉપર Middle Name માં સીધું જ પતિનું નામ લખી શકો છો.'}
                                </p>
                              </div>
                            </div>
                            {brotherOptions.length > 0 && (
                              <div className="w-full sm:w-64 shrink-0">
                                <Select
                                  value={editingMember.spouse_id || ''}
                                  onChange={(val) => {
                                    handleEditingMemberChange('spouse_id', val)
                                    const selectedBro = members.find(m => String(m._id || m.id) === String(val))
                                    if (selectedBro && selectedBro.first_name) {
                                      handleEditingMemberChange('middle_name', selectedBro.first_name)
                                    }
                                  }}
                                  options={[
                                    { label: 'ભાઈ પસંદ કરો (Select Brother)...', value: '' },
                                    ...brotherOptions.map(b => ({
                                      label: `${b.first_name || 'Brother'} ${b.last_name || ''} (Brother)`,
                                      value: b._id || b.id
                                    }))
                                  ]}
                                  placeholder="Select Brother"
                                />
                              </div>
                            )}
                          </div>
                        )
                      })()}

                      {editingMember.relation === 'Daughter-in-law' && (() => {
                        const sonOptions = members.filter((m, i) => m.relation === 'Son' && i !== expandedMemberIndex)
                        return (
                          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-primary shrink-0" />
                              <div>
                                <span className="font-bold text-text">પતિ / દીકરો (Husband / Son):</span>
                                <p className="text-[11px] text-text-secondary mt-0.5">
                                  {sonOptions.length > 0 
                                    ? 'ક્યા દીકરાના પત્ની (પુત્રવધૂ) છે તે પસંદ કરો:' 
                                    : 'પરિવારમાં કોઈ દીકરો લિસ્ટેડ નથી. તમે ઉપર Middle Name માં સીધું જ પતિનું નામ લખી શકો છો.'}
                                </p>
                              </div>
                            </div>
                            {sonOptions.length > 0 && (
                              <div className="w-full sm:w-64 shrink-0">
                                <Select
                                  value={editingMember.spouse_id || ''}
                                  onChange={(val) => {
                                    handleEditingMemberChange('spouse_id', val)
                                    const selectedSon = members.find(m => String(m._id || m.id) === String(val))
                                    if (selectedSon && selectedSon.first_name) {
                                      handleEditingMemberChange('middle_name', selectedSon.first_name)
                                    }
                                  }}
                                  options={[
                                    { label: 'દીકરો પસંદ કરો (Select Son)...', value: '' },
                                    ...sonOptions.map(s => ({
                                      label: `${s.first_name || 'Son'} ${s.last_name || ''} (Son)`,
                                      value: s._id || s.id
                                    }))
                                  ]}
                                  placeholder="Select Son"
                                />
                              </div>
                            )}
                          </div>
                        )
                      })()}

                      {editingMember.relation === 'Cousin' && (() => {
                        const uncleOptions = members.filter((m, i) => ['Uncle', 'Father', 'Brother'].includes(m.relation) && i !== expandedMemberIndex)
                        return (
                          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-primary shrink-0" />
                              <div>
                                <span className="font-bold text-text">પિતા / કાકા / મામા (Father / Uncle):</span>
                                <p className="text-[11px] text-text-secondary mt-0.5">
                                  {uncleOptions.length > 0 
                                    ? 'પિતરાઈ ભાઈ/બહેનના પિતા પસંદ કરો જેથી Middle Name આપોઆપ આવી જશે:' 
                                    : 'પરિવારમાં કાકા/મામા લિસ્ટેડ નથી. તમે ઉપર Middle Name માં સીધું જ તેમના પિતાનું નામ લખી શકો છો.'}
                                </p>
                              </div>
                            </div>
                            {uncleOptions.length > 0 && (
                              <div className="w-full sm:w-64 shrink-0">
                                <Select
                                  value={editingMember.father_id || ''}
                                  onChange={(val) => {
                                    handleEditingMemberChange('father_id', val)
                                    const selectedUncle = members.find(m => String(m._id || m.id) === String(val))
                                    if (selectedUncle && selectedUncle.first_name) {
                                      handleEditingMemberChange('middle_name', selectedUncle.first_name)
                                    }
                                  }}
                                  options={[
                                    { label: 'પિતા પસંદ કરો...', value: '' },
                                    ...uncleOptions.map(u => ({
                                      label: `${u.first_name || 'Relative'} ${u.last_name || ''} (${getRelationDisplay(u.relation)})`,
                                      value: u._id || u.id
                                    }))
                                  ]}
                                  placeholder="Select Uncle / Father"
                                />
                              </div>
                            )}
                          </div>
                        )
                      })()}

                      {['Nephew', 'Niece'].includes(editingMember.relation) && (() => {
                        const brotherOptions = members.filter((m, i) => m.relation === 'Brother' && i !== expandedMemberIndex)
                        return (
                          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-primary shrink-0" />
                              <div>
                                <span className="font-bold text-text">પિતા / ભાઈ (Father / Brother):</span>
                                <p className="text-[11px] text-text-secondary mt-0.5">
                                  {brotherOptions.length > 0 
                                    ? 'ભત્રીજા/ભત્રીજીના પિતા (ભાઈ) પસંદ કરો (Middle Name આપોઆપ આવી જશે):' 
                                    : 'પરિવારમાં કોઈ ભાઈ લિસ્ટેડ નથી. તમે ઉપર Middle Name માં સીધું જ પિતાનું નામ લખી શકો છો.'}
                                </p>
                              </div>
                            </div>
                            {brotherOptions.length > 0 && (
                              <div className="w-full sm:w-64 shrink-0">
                                <Select
                                  value={editingMember.father_id || ''}
                                  onChange={(val) => {
                                    handleEditingMemberChange('father_id', val)
                                    const selectedBro = members.find(m => String(m._id || m.id) === String(val))
                                    if (selectedBro && selectedBro.first_name) {
                                      handleEditingMemberChange('middle_name', selectedBro.first_name)
                                    }
                                  }}
                                  options={[
                                    { label: 'ભાઈ પસંદ કરો (Select Brother)...', value: '' },
                                    ...brotherOptions.map(b => ({
                                      label: `${b.first_name || 'Brother'} ${b.last_name || ''} (Brother)`,
                                      value: b._id || b.id
                                    }))
                                  ]}
                                  placeholder="Select Brother / Father"
                                />
                              </div>
                            )}
                          </div>
                        )
                      })()}

                      {['Grandson', 'Granddaughter'].includes(editingMember.relation) && (() => {
                        const sonOptions = members.filter((m, i) => m.relation === 'Son' && i !== expandedMemberIndex)
                        return (
                          <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                            <div className="flex items-center gap-2">
                              <Sparkles className="w-4 h-4 text-primary shrink-0" />
                              <div>
                                <span className="font-bold text-text">પિતા / દીકરો (Father / Son):</span>
                                <p className="text-[11px] text-text-secondary mt-0.5">
                                  {sonOptions.length > 0 
                                    ? 'પૌત્ર/પૌત્રીના પિતા (દીકરો) પસંદ કરો (Middle Name આપોઆપ આવી જશે):' 
                                    : 'પરિવારમાં કોઈ દીકરો લિસ્ટેડ નથી. તમે ઉપર Middle Name માં સીધું જ પિતાનું નામ લખી શકો છો.'}
                                </p>
                              </div>
                            </div>
                            {sonOptions.length > 0 && (
                              <div className="w-full sm:w-64 shrink-0">
                                <Select
                                  value={editingMember.father_id || ''}
                                  onChange={(val) => {
                                    handleEditingMemberChange('father_id', val)
                                    const selectedSon = members.find(m => String(m._id || m.id) === String(val))
                                    if (selectedSon && selectedSon.first_name) {
                                      handleEditingMemberChange('middle_name', selectedSon.first_name)
                                    }
                                  }}
                                  options={[
                                    { label: 'દીકરો પસંદ કરો (Select Son)...', value: '' },
                                    ...sonOptions.map(s => ({
                                      label: `${s.first_name || 'Son'} ${s.last_name || ''} (Son)`,
                                      value: s._id || s.id
                                    }))
                                  ]}
                                  placeholder="Select Son / Father"
                                />
                              </div>
                            )}
                          </div>
                        )
                      })()}

                      {/* Row 2: Gender, Date of Birth, Anniversary Date, Blood Group, Mobile Number (Balanced 5 columns or clean 2+3 layout) */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 items-start">
                        <Select
                          label="Gender"
                          value={editingMember.gender || 'Male'}
                          onChange={(val) => handleEditingMemberChange('gender', val)}
                          options={GENDER_OPTIONS}
                          disabled={isLoading}
                        />
                        <DatePicker
                          label="Date of Birth"
                          value={editingMember.dob || ''}
                          onChange={(val) => handleEditingMemberChange('dob', val)}
                          disabled={isLoading}
                          placeholder="Select DOB"
                        />
                        <DatePicker
                          label="Anniversary Date"
                          value={editingMember.anniversary || ''}
                          onChange={(val) => handleEditingMemberChange('anniversary', val)}
                          disabled={isLoading}
                          placeholder="Select Anniversary"
                        />
                        <Select
                          label="Blood Group"
                          value={editingMember.blood_group || ''}
                          onChange={(val) => handleEditingMemberChange('blood_group', val)}
                          options={[{ label: 'Select Blood Group', value: '' }, ...BLOOD_GROUPS]}
                          disabled={isLoading}
                          searchable={true}
                        />
                        <div className="col-span-1 sm:col-span-2 md:col-span-4 lg:col-span-1">
                          <Input
                            label="Mobile Number (Optional)"
                            type="tel"
                            maxLength={10}
                            placeholder="10 digit number"
                            value={editingMember.number || ''}
                            onChange={(e) => handleEditingMemberChange('number', e.target.value.replace(/\D/g, '').slice(0, 10))}
                            disabled={isLoading}
                            error={numErr}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ─── FORM FOOTER & SUBMIT BUTTON ─────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-3 pt-2.5 border-t border-border mt-2">
        <div className="text-xs text-text-secondary font-medium">
          Total: <span className="font-bold text-text">1 Head</span> + <span className="font-bold text-primary">{members.length} Members</span>
        </div>
        <div className="flex items-center gap-2">
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
            {isLoading ? 'Processing...' : user ? 'Update Family' : 'Save Family'}
          </Button>
        </div>
      </div>

      <RelationshipGuideModal
        isOpen={guideModalOpen}
        onClose={() => {
          setGuideModalOpen(false)
          setActiveGuideTarget(null)
        }}
        selectedRelation={
          activeGuideTarget !== null && members[activeGuideTarget]
            ? members[activeGuideTarget].relation
            : editingMember?.relation || ''
        }
        onSelectRelation={(selectedRel) => {
          if (activeGuideTarget !== null) {
            handleMemberFieldChange(activeGuideTarget, 'relation', selectedRel)
            if (expandedMemberIndex === activeGuideTarget && editingMember) {
              handleEditingMemberChange('relation', selectedRel)
            }
          } else if (editingMember) {
            handleEditingMemberChange('relation', selectedRel)
          }
        }}
        dynamicRelations={relationOptions}
      />
    </form>
  )
}

