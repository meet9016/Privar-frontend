import React, { useEffect, useState, useContext, useMemo } from 'react'
import {
  HeartHandshake,
  HeartPulse,
  AlertTriangle,
  IndianRupee,
  LifeBuoy,
  Phone,
  MapPin,
  Calendar,
  Building,
  User,
  Plus,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  FileText,
  Share2,
  ExternalLink,
  Upload,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  QrCode,
  Info
} from 'lucide-react'
import api, { memberApi, assetUrl, formatDate, uploadFileToDigitalks } from '../../lib/api'
import { APPEAL_ENDPOINTS } from '../../utils/endpoints'
import { useWebTheme } from '../../hooks/useWebTheme'
import { AuthContext } from '../../context/AuthContext'
import Modal from '../../components/Modal'
import { toast } from '../../lib/toast'

const HELP_TYPES = [
  { id: 'Medical', label: 'Medical (चिकित्सा)', icon: HeartPulse, color: 'text-rose-500 bg-rose-50 border-rose-200' },
  { id: 'Financial', label: 'Financial (आर्थिक)', icon: IndianRupee, color: 'text-amber-600 bg-amber-50 border-amber-200' },
  { id: 'Emergency', label: 'Emergency (आपातकालीन)', icon: AlertTriangle, color: 'text-red-600 bg-red-50 border-red-200' },
  { id: 'Other', label: 'Other (अन्य जरूरी)', icon: LifeBuoy, color: 'text-blue-600 bg-blue-50 border-blue-200' }
]

const getStoredWebTheme = () => {
  const colorKeys = [
    'backgroundColor', 'borderColor', 'buttonColor', 'fontColor',
    'gradientEnd', 'gradientStart', 'primaryColor', 'secondaryColor', 'textColor'
  ]
  return colorKeys.reduce((theme, key) => {
    const value = localStorage.getItem(`web_${key}`)
    return value ? { ...theme, [key]: value } : theme
  }, {})
}

export default function AppealsWebPage() {
  useWebTheme()
  const { user } = useContext(AuthContext)
  const [theme, setTheme] = useState(getStoredWebTheme())
  const [appeals, setAppeals] = useState([])
  const [myAppeals, setMyAppeals] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('active') // 'active' | 'completed' | 'my'
  const [selectedType, setSelectedType] = useState('All')
  const [searchQuery, setSearchQuery] = useState('')

  // Modals state
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false)
  const [viewAppeal, setViewAppeal] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  // Form State
  const initialFormState = {
    title: '',
    help_type: 'Medical',
    description: '',
    required_help: '',
    required_amount: '',
    contact_name: user?.name || '',
    contact_phone: user?.number || '',
    contact_alt_phone: '',
    contact_city: user?.city || '',
    contact_address: '',
    patient_name: '',
    hospital_name: '',
    bank_name: '',
    account_holder_name: '',
    account_number: '',
    ifsc_code: '',
    upi_id: '',
    images: [],
    documents: []
  }

  const [formData, setFormData] = useState(initialFormState)
  const [uploadedPhotos, setUploadedPhotos] = useState([])
  const [uploadedDocs, setUploadedDocs] = useState([])
  const [uploadingFiles, setUploadingFiles] = useState(false)
  const [formErrors, setFormErrors] = useState({})

  useEffect(() => {
    const loadTheme = () => setTheme(getStoredWebTheme())
    loadTheme()
    window.addEventListener('storage', loadTheme)
    return () => window.removeEventListener('storage', loadTheme)
  }, [])

  // Fetch Public Appeals
  const fetchAppeals = async () => {
    try {
      setLoading(true)
      const res = await memberApi.get(`${APPEAL_ENDPOINTS.GET_APPEALS}?limit=100`)
      const list = res.data?.data || []
      setAppeals(Array.isArray(list) ? list : [])
    } catch (err) {
      console.error('Failed to load appeals:', err)
    } finally {
      setLoading(false)
    }
  }

  // Fetch Member's Own Submissions
  const fetchMyAppeals = async () => {
    try {
      const res = await api.get(APPEAL_ENDPOINTS.GET_MY_APPEALS)
      const list = res.data?.data || []
      setMyAppeals(Array.isArray(list) ? list : [])
    } catch (err) {
      // If not logged in, ignore
    }
  }

  useEffect(() => {
    fetchAppeals()
    if (user) {
      fetchMyAppeals()
    }
  }, [user])

  // Filtered List based on tab, type, and search
  const displayedAppeals = useMemo(() => {
    let list = []
    if (activeTab === 'my') {
      list = myAppeals
    } else if (activeTab === 'completed') {
      list = appeals.filter(a => a.status === 'Completed')
    } else {
      list = appeals.filter(a => a.status === 'Approved')
    }

    if (selectedType !== 'All') {
      list = list.filter(a => a.help_type === selectedType)
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim()
      list = list.filter(a =>
        a.title?.toLowerCase().includes(q) ||
        a.description?.toLowerCase().includes(q) ||
        a.contact_city?.toLowerCase().includes(q) ||
        a.contact_name?.toLowerCase().includes(q) ||
        a.hospital_name?.toLowerCase().includes(q)
      )
    }

    return list
  }, [appeals, myAppeals, activeTab, selectedType, searchQuery])

  // Handle Photo File Upload
  const handlePhotoUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    try {
      setUploadingFiles(true)
      const urls = []
      for (const file of files) {
        const url = await uploadFileToDigitalks(file, 'appeals/photos')
        urls.push(url)
      }
      setUploadedPhotos(prev => [...prev, ...urls])
      toast.success(`${urls.length} photo(s) uploaded successfully`)
    } catch (err) {
      toast.error(err.message || 'Error uploading photo')
    } finally {
      setUploadingFiles(false)
    }
  }

  // Handle Document File Upload
  const handleDocUpload = async (e) => {
    const files = Array.from(e.target.files || [])
    if (!files.length) return
    try {
      setUploadingFiles(true)
      const docs = []
      for (const file of files) {
        const url = await uploadFileToDigitalks(file, 'appeals/documents')
        docs.push({ name: file.name, url, type: file.type })
      }
      setUploadedDocs(prev => [...prev, ...docs])
      toast.success(`${docs.length} document(s) uploaded successfully`)
    } catch (err) {
      toast.error(err.message || 'Error uploading document')
    } finally {
      setUploadingFiles(false)
    }
  }

  // Submit Help Request
  const handleSubmit = async (e) => {
    e.preventDefault()
    const errors = {}

    if (!formData.title.trim()) errors.title = 'Title is required'
    if (!formData.required_help.trim()) errors.required_help = 'Required help details are required'
    if (!formData.contact_name.trim()) errors.contact_name = 'Contact person name is required'
    if (!formData.contact_phone.trim()) errors.contact_phone = 'Contact phone number is required'

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors)
      toast.error('Please fill in all required fields.')
      return
    }

    try {
      setSubmitting(true)
      const payload = {
        ...formData,
        required_amount: Number(formData.required_amount) || 0,
        images: uploadedPhotos,
        documents: uploadedDocs
      }

      await memberApi.post(APPEAL_ENDPOINTS.CREATE_APPEAL, payload)
      toast.success('Your Help Request has been submitted! Our admin team will review it shortly.')
      setIsSubmitModalOpen(false)
      setFormData(initialFormState)
      setUploadedPhotos([])
      setUploadedDocs([])
      setFormErrors({})

      // Refresh listings
      fetchAppeals()
      if (user) fetchMyAppeals()
      setActiveTab('my')
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || 'Failed to submit help request')
    } finally {
      setSubmitting(false)
    }
  }

  const getTypeBadge = (type) => {
    const item = HELP_TYPES.find(t => t.id === type) || HELP_TYPES[3]
    const Icon = item.icon
    return (
      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border shadow-xs ${item.color}`}>
        <Icon className="w-3.5 h-3.5" />
        <span>{item.id}</span>
      </span>
    )
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Approved':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Approved (सत्यापित)
          </span>
        )
      case 'Pending':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <Clock className="w-3.5 h-3.5 text-amber-600 animate-pulse" /> Pending Review (प्रतीक्षारत)
          </span>
        )
      case 'Completed':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-600" /> Completed (सहायता पूर्ण)
          </span>
        )
      case 'Rejected':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-600" /> Rejected (अस्वीकृत)
          </span>
        )
      default:
        return null
    }
  }

  return (
    <div className="w-full py-8 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto space-y-8 font-sans">
      {/* Hero Banner Header */}
      <div
        className="relative overflow-hidden rounded-3xl p-6 sm:p-10 border shadow-lg transition-all"
        style={{
          background: `linear-gradient(135deg, ${theme.primaryColor || '#0a2342'} 0%, ${theme.gradientEnd || '#123524'} 100%)`,
          borderColor: theme.borderColor || '#D7EFD9'
        }}
      >
        <div className="relative z-10 max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/15 text-white backdrop-blur-md border border-white/20">
            <HeartHandshake className="w-4 h-4 text-amber-300" />
            <span>Community Care & Support • समाज सेवा</span>
          </div>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white tracking-tight leading-tight">
            Appeal & Help Request <br />
            <span className="text-amber-300 text-2xl sm:text-3xl font-extrabold">(सहायता अनुरोध)</span>
          </h1>

          <p className="text-white/90 text-sm sm:text-base leading-relaxed">
            समाज के किसी भी सदस्य को मेडिकल इमरजेंसी, अप्रत्याशित संकट अथवा आर्थिक सहायता की जरूरत हो,
            तो यहाँ अनुरोध दर्ज करें। सत्यापन के पश्चात समाज के सक्षम सदस्यों तक यह संदेश पहुँचाया जाता है।
          </p>

          {/* Action CTAs */}
          <div className="flex items-center gap-3 pt-2 flex-wrap">
            <button
              onClick={() => setIsSubmitModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-white text-gray-900 font-extrabold text-sm shadow-xl hover:bg-amber-50 hover:scale-105 transition-all duration-200"
            >
              <Plus className="w-4 h-4 text-rose-600 stroke-[3]" />
              <span>नया सहायता अनुरोध सबमिट करें</span>
            </button>

            {user && (
              <button
                onClick={() => setActiveTab('my')}
                className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/20 text-white font-bold text-sm backdrop-blur-md border border-white/30 hover:bg-white/30 transition-all duration-200"
              >
                <Clock className="w-4 h-4 text-amber-300" />
                <span>मेरे अनुरोध ({myAppeals.length})</span>
              </button>
            )}
          </div>
        </div>

        {/* Ambient watermark icon */}
        <HeartHandshake className="absolute -bottom-8 -right-8 w-64 h-64 text-white/5 pointer-events-none" />
      </div>

      {/* Main Navigation & Filter Bar */}
      <div className="bg-white rounded-2xl p-4 sm:p-5 border border-gray-200/80 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          {/* Main Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl bg-gray-100/90 w-full sm:w-auto">
            <button
              onClick={() => setActiveTab('active')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'active'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Active Appeals ({appeals.filter(a => a.status === 'Approved').length})
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'completed'
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
                }`}
            >
              Completed ({appeals.filter(a => a.status === 'Completed').length})
            </button>
            {user && (
              <button
                onClick={() => setActiveTab('my')}
                className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'my'
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-600 hover:text-gray-900'
                  }`}
              >
                My Requests ({myAppeals.length})
              </button>
            )}
          </div>

          {/* Search Input */}
          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search title, city, hospital..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          <button
            onClick={() => setSelectedType('All')}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 transition-all ${selectedType === 'All'
              ? 'bg-gray-900 text-white shadow-xs'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
          >
            All Categories
          </button>
          {HELP_TYPES.map(type => {
            const Icon = type.icon
            const isSelected = selectedType === type.id
            return (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold shrink-0 border transition-all ${isSelected
                  ? `${type.color} ring-2 ring-offset-1 ring-gray-900`
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
                  }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{type.label}</span>
              </button>
            )
          })}
        </div>
      </div>

      {/* Appeals Card Grid */}
      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-gray-500">Loading appeals...</p>
        </div>
      ) : displayedAppeals.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-gray-200/80 p-8 space-y-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto text-gray-400">
            <HeartHandshake className="w-8 h-8" />
          </div>
          <div>
            <h3 className="text-base font-bold text-gray-900">No Help Requests Found</h3>
            <p className="text-xs text-gray-500 max-w-md mx-auto mt-1">
              {activeTab === 'my'
                ? 'आपने अभी तक कोई सहायता अनुरोध सबमिट नहीं किया है।'
                : 'इस श्रेणी में वर्तमान में कोई सक्रिय सहायता अनुरोध नहीं है।'}
            </p>
          </div>
          <button
            onClick={() => setIsSubmitModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gray-900 text-white text-xs font-bold shadow-md hover:bg-black transition-all"
          >
            <Plus className="w-4 h-4" />
            <span>सबमिट करें</span>
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {displayedAppeals.map(appeal => {
            const hasAmount = Number(appeal.required_amount) > 0
            const progress = hasAmount
              ? Math.min(100, Math.round(((appeal.collected_amount || 0) / appeal.required_amount) * 100))
              : 0

            return (
              <div
                key={appeal._id}
                className="bg-white rounded-3xl border border-gray-200/90 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col overflow-hidden group"
              >
                {/* Image Banner or Placeholder Header */}
                <div className="h-44 bg-gradient-to-br from-gray-100 to-gray-200 relative overflow-hidden flex items-center justify-center">
                  {appeal.images && appeal.images.length > 0 ? (
                    <img
                      src={assetUrl(appeal.images[0])}
                      alt={appeal.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400 gap-1.5 p-4 text-center">
                      <HeartHandshake className="w-12 h-12 stroke-[1.5]" />
                      <span className="text-[11px] font-bold tracking-wider uppercase text-gray-400">Parivar Assistance</span>
                    </div>
                  )}

                  {/* Top floating badges */}
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    {getTypeBadge(appeal.help_type)}
                  </div>

                  <div className="absolute top-3 right-3">
                    {getStatusBadge(appeal.status)}
                  </div>
                </div>

                {/* Content Box */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div className="space-y-2.5">
                    <h3 className="text-base font-extrabold text-gray-900 group-hover:text-primary transition-colors line-clamp-1">
                      {appeal.title}
                    </h3>

                    <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">
                      {appeal.description}
                    </p>

                    {/* Metadata chips */}
                    <div className="flex items-center gap-3 text-[11px] text-gray-500 pt-1 flex-wrap">
                      {appeal.contact_city && (
                        <span className="flex items-center gap-1 font-semibold text-gray-700">
                          <MapPin className="w-3.5 h-3.5 text-gray-400" />
                          <span>{appeal.contact_city}</span>
                        </span>
                      )}
                      {appeal.hospital_name && (
                        <span className="flex items-center gap-1 text-gray-600 truncate max-w-[150px]">
                          <Building className="w-3.5 h-3.5 text-gray-400" />
                          <span>{appeal.hospital_name}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-gray-500 ml-auto">
                        <Calendar className="w-3 h-3 text-gray-400" />
                        <span>{formatDate(appeal.createdAt)}</span>
                      </span>
                    </div>
                  </div>

                  {/* Amount / Progress bar if financial / medical amount needed */}
                  {hasAmount && (
                    <div className="p-3 rounded-2xl bg-gray-50 border border-gray-100 space-y-1.5">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-gray-500">Target Amount:</span>
                        <span className="text-gray-900 font-extrabold">₹{Number(appeal.required_amount).toLocaleString('en-IN')}</span>
                      </div>
                      {appeal.collected_amount > 0 && (
                        <>
                          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                            <div className="bg-emerald-500 h-2 rounded-full transition-all" style={{ width: `${progress}%` }} />
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-gray-500 font-medium">
                            <span>Collected: ₹{Number(appeal.collected_amount).toLocaleString('en-IN')}</span>
                            <span>{progress}%</span>
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {/* Rejection Note if rejected in My Requests */}
                  {appeal.status === 'Rejected' && appeal.rejection_reason && (
                    <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 space-y-1">
                      <span className="font-bold flex items-center gap-1 text-rose-900">
                        <XCircle className="w-3.5 h-3.5" /> Rejection Remark:
                      </span>
                      <p>{appeal.rejection_reason}</p>
                    </div>
                  )}

                  {/* Card Action Buttons */}
                  <div className="pt-2 flex items-center gap-2 border-t border-gray-100">
                    <button
                      onClick={() => setViewAppeal(appeal)}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl text-xs font-bold text-gray-800 bg-gray-100 hover:bg-gray-200 transition-colors"
                    >
                      <Info className="w-3.5 h-3.5" />
                      <span>View Full Details</span>
                    </button>

                    {appeal.contact_phone && (
                      <a
                        href={`tel:${appeal.contact_phone}`}
                        className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                        title={`Call ${appeal.contact_name}`}
                      >
                        <Phone className="w-4 h-4" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* ======================= SUBMIT APPEAL MODAL ======================= */}
      <Modal
        isOpen={isSubmitModalOpen}
        onClose={() => setIsSubmitModalOpen(false)}
        title="सहायता अनुरोध दर्ज करें (Submit Help Request)"
        size="2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[75vh] overflow-y-auto px-1">
          {/* Header Note */}
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-200/80 text-xs text-amber-900 flex items-start gap-2.5 leading-relaxed">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div>
              <strong>ध्यान दें:</strong> यह अनुरोध पहले समाज एडमिन के पास जाएगा। एडमिन द्वारा समीक्षा और सत्यापन के बाद ही
              यह समाज के सदस्यों को नोटिफिकेशन के माध्यम से भेजा जाएगा।
            </div>
          </div>

          {/* Section 1: Help Category */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700">
              सहायता का प्रकार (Help Type) <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {HELP_TYPES.map(type => {
                const Icon = type.icon
                const isSelected = formData.help_type === type.id
                return (
                  <button
                    key={type.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, help_type: type.id })}
                    className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${isSelected
                      ? 'border-primary bg-primary/10 text-primary font-black shadow-xs ring-2 ring-primary/20'
                      : 'border-gray-200 bg-gray-50/50 text-gray-600 hover:bg-gray-100'
                      }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs">{type.id}</span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Section 2: Title & Required Amount */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-2 space-y-1">
              <label className="block text-xs font-bold text-gray-700">
                Request Title (अनुरोध का शीर्षक) <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Urgent Medical Assistance for Brain Surgery"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className={`w-full px-3.5 py-2.5 text-xs bg-gray-50 border rounded-xl focus:bg-white focus:outline-none ${formErrors.title ? 'border-rose-400 bg-rose-50/30' : 'border-gray-200'
                  }`}
              />
              {formErrors.title && <p className="text-[10px] text-rose-500 font-semibold">{formErrors.title}</p>}
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-gray-700">
                Required Amount (राशि ₹)
              </label>
              <input
                type="number"
                placeholder="₹ 50,000"
                value={formData.required_amount}
                onChange={(e) => setFormData({ ...formData, required_amount: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:bg-white focus:outline-none"
              />
            </div>
          </div>

          {/* Section 3: Problem Description */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-700">
              समस्या का विस्तृत विवरण (Problem Description)
            </label>
            <textarea
              rows={3}
              placeholder="समस्या क्या है, परिस्थिति क्या है और कब से है, उसका पूरा विवरण यहाँ लिखें..."
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className={`w-full px-3.5 py-2.5 text-xs bg-gray-50 border rounded-xl focus:bg-white focus:outline-none ${formErrors.description ? 'border-rose-400 bg-rose-50/30' : 'border-gray-200'
                }`}
            />
            {formErrors.description && <p className="text-[10px] text-rose-500 font-semibold">{formErrors.description}</p>}
          </div>

          {/* Section 4: Required Help Details */}
          <div className="space-y-1">
            <label className="block text-xs font-bold text-gray-700">
              सहायता की आवश्यक जानकारी (Specific Help Needed) <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={2}
              placeholder="आपको किस प्रकार की सहायता चाहिए? (जैसे: आर्थिक मदद, ब्लड डोनर, हॉस्पिटल बिल, दवाइयाँ आदि)"
              value={formData.required_help}
              onChange={(e) => setFormData({ ...formData, required_help: e.target.value })}
              className={`w-full px-3.5 py-2.5 text-xs bg-gray-50 border rounded-xl focus:bg-white focus:outline-none ${formErrors.required_help ? 'border-rose-400 bg-rose-50/30' : 'border-gray-200'
                }`}
            />
            {formErrors.required_help && <p className="text-[10px] text-rose-500 font-semibold">{formErrors.required_help}</p>}
          </div>

          {/* Section 5: Medical Specifics (if Medical) */}
          {formData.help_type === 'Medical' && (
            <div className="p-4 rounded-2xl bg-rose-50/40 border border-rose-100 space-y-3">
              <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                <HeartPulse className="w-4 h-4 text-rose-600" />
                <span>Medical Details (अस्पताल एवं मरीज की जानकारी)</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-gray-700">Patient Name</label>
                  <input
                    type="text"
                    placeholder="मरीज का नाम"
                    value={formData.patient_name}
                    onChange={(e) => setFormData({ ...formData, patient_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-gray-700">Hospital Name</label>
                  <input
                    type="text"
                    placeholder="अस्पताल का नाम"
                    value={formData.hospital_name}
                    onChange={(e) => setFormData({ ...formData, hospital_name: e.target.value })}
                    className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl"
                  />
                </div>

              </div>
            </div>
          )}

          {/* Section 6: Contact Information */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-4 h-4 text-gray-500" />
              <span>Contact Information (संपर्क विवरण)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">
                  Contact Person Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="संपर्क व्यक्ति का नाम"
                  value={formData.contact_name}
                  onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
                  className={`w-full px-3.5 py-2 text-xs bg-gray-50 border rounded-xl ${formErrors.contact_name ? 'border-rose-400' : 'border-gray-200'
                    }`}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">
                  Mobile Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="10 अंकों का मोबाइल नंबर"
                  value={formData.contact_phone}
                  onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
                  className={`w-full px-3.5 py-2 text-xs bg-gray-50 border rounded-xl ${formErrors.contact_phone ? 'border-rose-400' : 'border-gray-200'
                    }`}
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">Alternate Phone (वैकल्पिक)</label>
                <input
                  type="tel"
                  placeholder="दूसरा संपर्क नंबर"
                  value={formData.contact_alt_phone}
                  onChange={(e) => setFormData({ ...formData, contact_alt_phone: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>

              <div className="space-y-1">
                <label className="block text-xs font-bold text-gray-700">City / Village (शहर / गाँव)</label>
                <input
                  type="text"
                  placeholder="e.g. Surat, Ahmedabad"
                  value={formData.contact_city}
                  onChange={(e) => setFormData({ ...formData, contact_city: e.target.value })}
                  className="w-full px-3.5 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Section 7: Bank & UPI Information (Optional for direct assistance) */}
          <div className="p-4 rounded-2xl bg-gray-50 border border-gray-200 space-y-3">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-gray-500" />
              <span>Direct Aid Bank / UPI Details (वैकल्पिक बैंक विवरण)</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-gray-600">Bank Name</label>
                <input
                  type="text"
                  placeholder="SBI, HDFC, etc."
                  value={formData.bank_name}
                  onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-gray-600">Account Number</label>
                <input
                  type="text"
                  placeholder="खाता नंबर"
                  value={formData.account_number}
                  onChange={(e) => setFormData({ ...formData, account_number: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl"
                />
              </div>
              <div className="space-y-1">
                <label className="block text-[11px] font-semibold text-gray-600">IFSC Code / UPI ID</label>
                <input
                  type="text"
                  placeholder="SBIN000... / name@upi"
                  value={formData.ifsc_code}
                  onChange={(e) => setFormData({ ...formData, ifsc_code: e.target.value })}
                  className="w-full px-3 py-2 text-xs bg-white border border-gray-200 rounded-xl"
                />
              </div>
            </div>
          </div>

          {/* Section 8: Photos & Documents Upload */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider flex items-center gap-1.5">
              <Upload className="w-4 h-4 text-gray-500" />
              <span>Upload Photos & Verification Documents (फोटो एवं दस्तावेज)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Photos upload */}
              <div className="p-3.5 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 space-y-2 text-center">
                <label className="cursor-pointer block">
                  <span className="text-xs font-bold text-gray-800 block">Patient / Situation Photos</span>
                  <span className="text-[11px] text-gray-500 block">Click to upload photos (JPG, PNG)</span>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    disabled={uploadingFiles}
                    className="hidden"
                  />
                </label>
                {uploadedPhotos.length > 0 && (
                  <div className="flex gap-2 flex-wrap justify-center pt-1">
                    {uploadedPhotos.map((url, i) => (
                      <img key={i} src={assetUrl(url)} alt="preview" className="w-12 h-12 object-cover rounded-lg border" />
                    ))}
                  </div>
                )}
              </div>

              {/* Documents upload */}
              <div className="p-3.5 rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 space-y-2 text-center">
                <label className="cursor-pointer block">
                  <span className="text-xs font-bold text-gray-800 block">Medical Reports / Bills / ID Proof</span>
                  <span className="text-[11px] text-gray-500 block">Click to upload documents (PDF, Docs, Images)</span>
                  <input
                    type="file"
                    multiple
                    accept=".pdf,.doc,.docx,image/*"
                    onChange={handleDocUpload}
                    disabled={uploadingFiles}
                    className="hidden"
                  />
                </label>
                {uploadedDocs.length > 0 && (
                  <div className="text-left text-[11px] text-gray-600 space-y-1 max-h-20 overflow-y-auto">
                    {uploadedDocs.map((doc, i) => (
                      <div key={i} className="flex items-center gap-1.5 font-medium truncate">
                        <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="truncate">{doc.name}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {uploadingFiles && (
              <p className="text-[11px] text-primary font-bold animate-pulse text-center">Uploading attachments...</p>
            )}
          </div>

          {/* Modal Actions */}
          <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsSubmitModalOpen(false)}
              className="px-5 py-2.5 rounded-xl border border-gray-200 text-xs font-bold text-gray-600 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploadingFiles}
              className="px-6 py-2.5 rounded-xl bg-gray-900 text-white text-xs font-extrabold shadow-md hover:bg-black disabled:opacity-50 flex items-center gap-2"
            >
              {submitting ? 'सबमिट हो रहा है...' : 'अनुरोध सबमिट करें'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </Modal>

      {/* ======================= VIEW DETAILS MODAL ======================= */}
      {viewAppeal && (
        <Modal
          isOpen={Boolean(viewAppeal)}
          onClose={() => setViewAppeal(null)}
          title={`Appeal: ${viewAppeal.title}`}
          size="2xl"
        >
          <div className="space-y-6 max-h-[75vh] overflow-y-auto px-1">
            {/* Header badges */}
            <div className="flex items-center justify-between flex-wrap gap-2 pb-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                {getTypeBadge(viewAppeal.help_type)}
                {getStatusBadge(viewAppeal.status)}
              </div>
              <span className="text-xs text-gray-500 font-medium">
                Submitted on {formatDate(viewAppeal.createdAt)}
              </span>
            </div>

            {/* Title & Description */}
            <div className="space-y-2">
              <h2 className="text-xl font-black text-gray-900 leading-snug">
                {viewAppeal.title}
              </h2>
              <div className="p-4 rounded-2xl bg-gray-50 border border-gray-100 text-xs text-gray-700 leading-relaxed whitespace-pre-wrap">
                {viewAppeal.description}
              </div>
            </div>

            {/* Required help summary */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1.5">
              <h4 className="text-xs font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <HeartHandshake className="w-4 h-4 text-amber-600" />
                <span>सहायता की आवश्यकता (Assistance Needed)</span>
              </h4>
              <p className="text-xs text-amber-950 font-medium leading-relaxed">
                {viewAppeal.required_help}
              </p>
            </div>

            {/* Financial Overview if amount required */}
            {Number(viewAppeal.required_amount) > 0 && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-100 flex items-center justify-between flex-wrap gap-3">
                <div>
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">लक्ष्य राशि (Required Amount)</span>
                  <span className="text-2xl font-black text-emerald-950">₹{Number(viewAppeal.required_amount).toLocaleString('en-IN')}</span>
                </div>
                {viewAppeal.collected_amount > 0 && (
                  <div className="text-right">
                    <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider block">प्राप्त राशि (Collected)</span>
                    <span className="text-lg font-bold text-emerald-700">₹{Number(viewAppeal.collected_amount).toLocaleString('en-IN')}</span>
                  </div>
                )}
              </div>
            )}

            {/* Medical / Hospital Details */}
            {(viewAppeal.hospital_name || viewAppeal.patient_name) && (
              <div className="p-4 rounded-2xl bg-rose-50/50 border border-rose-100 space-y-2">
                <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider flex items-center gap-1.5">
                  <HeartPulse className="w-4 h-4 text-rose-600" />
                  <span>Medical / Hospital Info</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  {viewAppeal.patient_name && <div><span className="text-gray-500 block text-[10px]">Patient:</span><strong className="text-gray-900">{viewAppeal.patient_name}</strong></div>}
                  {viewAppeal.hospital_name && <div><span className="text-gray-500 block text-[10px]">Hospital:</span><strong className="text-gray-900">{viewAppeal.hospital_name}</strong></div>}
                </div>
              </div>
            )}

            {/* Bank / UPI direct aid info */}
            {(viewAppeal.bank_name || viewAppeal.account_number || viewAppeal.ifsc_code || viewAppeal.upi_id) && (
              <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-100 space-y-2">
                <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <span>Direct Bank / UPI Donation Details</span>
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {viewAppeal.bank_name && <div><span className="text-gray-500 block text-[10px]">Bank:</span><strong className="text-gray-900">{viewAppeal.bank_name}</strong></div>}
                  {viewAppeal.account_holder_name && <div><span className="text-gray-500 block text-[10px]">Account Holder:</span><strong className="text-gray-900">{viewAppeal.account_holder_name}</strong></div>}
                  {viewAppeal.account_number && <div><span className="text-gray-500 block text-[10px]">A/C No:</span><strong className="text-gray-900 font-mono">{viewAppeal.account_number}</strong></div>}
                  {viewAppeal.ifsc_code && <div><span className="text-gray-500 block text-[10px]">IFSC Code:</span><strong className="text-gray-900 font-mono">{viewAppeal.ifsc_code}</strong></div>}
                  {viewAppeal.upi_id && <div><span className="text-gray-500 block text-[10px]">UPI ID:</span><strong className="text-blue-700 font-mono">{viewAppeal.upi_id}</strong></div>}
                </div>
              </div>
            )}

            {/* Photos gallery */}
            {viewAppeal.images && viewAppeal.images.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Attached Proofs & Photos</h4>
                <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-none">
                  {viewAppeal.images.map((img, idx) => (
                    <a
                      key={idx}
                      href={assetUrl(img)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="block shrink-0 rounded-2xl overflow-hidden border border-gray-200 hover:opacity-90 shadow-xs"
                    >
                      <img src={assetUrl(img)} alt="appeal proof" className="w-28 h-28 object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Documents list */}
            {viewAppeal.documents && viewAppeal.documents.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider">Verification Documents</h4>
                <div className="space-y-1.5">
                  {viewAppeal.documents.map((doc, idx) => (
                    <a
                      key={idx}
                      href={assetUrl(doc.url)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-200 hover:bg-gray-100 transition-colors text-xs font-semibold text-gray-800"
                    >
                      <div className="flex items-center gap-2 truncate">
                        <FileText className="w-4 h-4 text-primary shrink-0" />
                        <span className="truncate">{doc.name || `Document #${idx + 1}`}</span>
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            {/* Contact Person Card & Direct Actions */}
            <div className="p-4 rounded-2xl bg-gray-900 text-white flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="space-y-1 text-center sm:text-left">
                <span className="text-[10px] uppercase font-bold text-amber-300 tracking-wider">Primary Contact</span>
                <div className="text-sm font-extrabold">{viewAppeal.contact_name}</div>
                <div className="text-xs text-gray-400 flex items-center gap-1.5 justify-center sm:justify-start">
                  <MapPin className="w-3.5 h-3.5" />
                  <span>{viewAppeal.contact_city || 'Parivar Community Member'}</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 w-full sm:w-auto">
                <a
                  href={`tel:${viewAppeal.contact_phone}`}
                  className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-extrabold shadow-md transition-all"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Call: {viewAppeal.contact_phone}</span>
                </a>
                <a
                  href={`https://wa.me/91${viewAppeal.contact_phone.replace(/\D/g, '')}?text=${encodeURIComponent(`Namaste, I am reaching out regarding your Parivar appeal: ${viewAppeal.title}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 text-white border border-emerald-500/50 transition-all"
                  title="WhatsApp"
                >
                  <Share2 className="w-4 h-4" />
                </a>
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  )
}
