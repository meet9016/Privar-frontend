import React, { useRef, useState, useEffect } from 'react'
import Modal from './Modal'
import Button from './common/Button'
import { Download, Edit2, Copy, RefreshCw, Bell, Users, Search, CheckCircle, Shield, UserCheck, X, AlertTriangle } from 'lucide-react'
import api, { API_BASE, formatDate, getDeathCardDownloadUrl, getDeathCardLink, getDeathNotificationRecipients, assetUrl } from '../lib/api'
import { toast } from '../lib/toast'

const GUJARATI_DAYS = ['રવિવાર', 'સોમવાર', 'મંગળવાર', 'બુધવાર', 'ગુરુવાર', 'શુક્રવાર', 'શનિવાર']

function getGujaratiDay(dateStr) {
  if (!dateStr) return ''
  try {
    const str = String(dateStr).trim()
    if (!str) return ''
    if (str.includes('/')) {
      const parts = str.split('/')
      if (parts.length === 3) {
        const d = parseInt(parts[0], 10)
        const m = parseInt(parts[1], 10) - 1
        const y = parseInt(parts[2], 10)
        const res = new Date(y, m, d, 12, 0, 0)
        if (!isNaN(res.getTime())) return GUJARATI_DAYS[res.getDay()] || ''
      }
    }
    if (str.includes('-')) {
      const cleanStr = str.split('T')[0].split(' ')[0]
      const parts = cleanStr.split('-')
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          const y = parseInt(parts[0], 10)
          const m = parseInt(parts[1], 10) - 1
          const d = parseInt(parts[2], 10)
          const res = new Date(y, m, d, 12, 0, 0)
          if (!isNaN(res.getTime())) return GUJARATI_DAYS[res.getDay()] || ''
        } else {
          const d = parseInt(parts[0], 10)
          const m = parseInt(parts[1], 10) - 1
          const y = parseInt(parts[2], 10)
          const res = new Date(y, m, d, 12, 0, 0)
          if (!isNaN(res.getTime())) return GUJARATI_DAYS[res.getDay()] || ''
        }
      }
    }
    const res = new Date(str)
    if (!isNaN(res.getTime())) return GUJARATI_DAYS[res.getDay()] || ''
  } catch (_) { }
  return ''
}

export default function VafatCardModal({ isOpen, onClose, member, onOpenEdit }) {
  const [downloading, setDownloading] = useState(false)
  const [downloadFormat, setDownloadFormat] = useState('png') // 'png' | 'pdf'
  const [updateKey, setUpdateKey] = useState(Date.now())
  const [loadingCard, setLoadingCard] = useState(true)

  // Notification recipients tab state
  const [activeTab, setActiveTab] = useState('card') // 'card' | 'recipients'
  const [notificationInfo, setNotificationInfo] = useState(null)
  const [recipientsList, setRecipientsList] = useState([])
  const [loadingRecipients, setLoadingRecipients] = useState(false)
  const [recipientSearchTerm, setRecipientSearchTerm] = useState('')

  // Direct card edit state so user can write/edit directly on the card
  const [cardData, setCardData] = useState({
    date: '',
    vaar: '',
    name: '',
    address: '',
    janazaTime: '',
    janazaPlace: '',
    kabrastan: '',
    mobile: ''
  })

  const fetchedMemberIdRef = useRef(null)
  const iframeRef = useRef(null)

  // Listen for real-time edits from the embedded backend card iframe
  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data && (event.data.type === 'VAFAT_CARD_DATA_CHANGE' || event.data.type === 'VAFAT_CARD_DATA_RESPONSE')) {
        const d = event.data.data
        if (d && typeof d === 'object') {
          setCardData(prev => ({
            ...prev,
            date: d.date !== undefined && d.date !== '' ? d.date : prev.date,
            vaar: d.vaar !== undefined && d.vaar !== '' ? d.vaar : prev.vaar,
            name: d.name !== undefined && d.name !== '' ? d.name : prev.name,
            address: d.address !== undefined && d.address !== '' ? d.address : prev.address,
            janazaTime: d.janaza_time !== undefined && d.janaza_time !== '' ? d.janaza_time : prev.janazaTime,
            janazaPlace: d.janaza_place !== undefined && d.janaza_place !== '' ? d.janaza_place : prev.janazaPlace,
            kabrastan: d.kabrastan !== undefined && d.kabrastan !== '' ? d.kabrastan : prev.kabrastan,
            mobile: d.number !== undefined && d.number !== '' ? d.number : prev.mobile
          }))
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [])

  // Initialize or re-populate when member prop changes & trigger backend API call exactly ONCE
  useEffect(() => {
    if (!isOpen) {
      fetchedMemberIdRef.current = null
      setLoadingCard(true)
      setActiveTab('card')
      setNotificationInfo(null)
      setRecipientsList([])
      setRecipientSearchTerm('')
      return
    }
    if (!member) return

    setUpdateKey(Date.now())
    setLoadingCard(true)

    const memberId = member._id || member.id || member.member_id

    // Only set initial data from member prop if this member hasn't been initialized yet
    if (fetchedMemberIdRef.current !== memberId) {
      const isFemale = String(member.gender || '').toLowerCase() === 'female'
      const memberName = [member.first_name, member.middle_name, member.last_name]
        .filter(Boolean)
        .join(' ')
        .trim() || member.name || member.full_name || ''

      let formattedDate = ''
      if (member.death_date) {
        const raw = String(member.death_date).split('T')[0]
        if (raw.includes('-')) {
          const parts = raw.split('-')
          if (parts.length === 3) {
            formattedDate = `${parts[2]} / ${parts[1]} / ${parts[0]}`
          }
        } else {
          formattedDate = formatDate(member.death_date)
        }
      }

      const calculatedVaar = member.vaar || (member.death_date ? getGujaratiDay(member.death_date) : '')
      const janPlace = member.janaza_place ? (member.janaza_place.endsWith('માં') ? member.janaza_place : `${member.janaza_place} માં`) : ''

      const vText = member.village ? (member.village.startsWith('ગામ:') ? member.village : `ગામ: ${member.village}`) : ''
      const fullAddress = [member.address, vText].filter(Boolean).join(', ')

      setCardData({
        date: formattedDate || '27 / 10 / 2026',
        vaar: calculatedVaar || 'મંગળવાર',
        name: memberName || '',
        address: fullAddress,
        janazaTime: member.janaza_time || '',
        janazaPlace: janPlace || '',
        kabrastan: member.kabrastan || '',
        mobile: member.number || member.mobile || member.phone || ''
      })
    }

    // Call Backend API EXACTLY ONCE per open for this member
    if (memberId && fetchedMemberIdRef.current !== memberId) {
      fetchedMemberIdRef.current = memberId
      getDeathCardLink(memberId)
        .then(res => {
          if (res.data?.data) {
            const d = res.data.data
            let apiDate = ''
            if (d.death_date) {
              const raw = String(d.death_date).split('T')[0]
              if (raw.includes('-')) {
                const parts = raw.split('-')
                if (parts.length === 3) apiDate = `${parts[2]} / ${parts[1]} / ${parts[0]}`
              } else {
                apiDate = formatDate(d.death_date)
              }
            }
            const calcVaar = d.vaar || (d.death_date ? getGujaratiDay(d.death_date) : '')
            const jPlace = d.janaza_place ? (d.janaza_place.endsWith('માં') ? d.janaza_place : `${d.janaza_place} માં`) : ''

            const dVillage = d.village !== undefined ? d.village : member.village
            const dVText = dVillage ? (dVillage.startsWith('ગામ:') ? dVillage : `ગામ: ${dVillage}`) : ''
            const dAddress = d.address !== undefined ? d.address : (member.address || '')
            const apiFullAddress = [dAddress, dVText].filter(Boolean).join(', ')

            setCardData(prev => ({
              ...prev,
              date: apiDate || prev.date,
              vaar: calcVaar || prev.vaar,
              name: d.name || prev.name,
              address: apiFullAddress || prev.address,
              janazaTime: d.janaza_time !== undefined ? d.janaza_time : prev.janazaTime,
              janazaPlace: jPlace || prev.janazaPlace,
              kabrastan: d.kabrastan !== undefined ? d.kabrastan : prev.kabrastan,
              mobile: d.number !== undefined ? d.number : prev.mobile
            }))
            if (d.notification_info) {
              setNotificationInfo(d.notification_info)
            }
          }
        })
        .catch(err => {
          console.warn('Backend death card API fetch:', err)
        })

      // Fetch full recipient list
      fetchRecipients(memberId)
    }
  }, [member, isOpen])

  const fetchRecipients = async (mId) => {
    const id = mId || member?._id || member?.id || member?.member_id
    if (!id) return
    setLoadingRecipients(true)
    try {
      const res = await getDeathNotificationRecipients(id)
      if (res.data?.data) {
        setNotificationInfo(res.data.data.notification || null)
        setRecipientsList(res.data.data.notification?.recipients || [])
      }
    } catch (err) {
      console.warn('Failed to load notification recipients:', err)
    } finally {
      setLoadingRecipients(false)
    }
  }

  if (!isOpen || !member) return null

  const isFemale = String(member.gender || '').toLowerCase() === 'female'
  const titlePrefixGujarati = isFemale ? 'મરહૂમા' : 'મરહૂમ'
  const nameLabel = isFemale ? 'મરહુમાનું નામ' : 'મરહુમનું નામ'
  const titlePrefix = isFemale ? 'Marhuma' : 'Marhum'
  const communityName = 'રાધનપુર મેમણ જમાત'
  const memberId = member._id || member.id || member.member_id
  const backendCardUrl = memberId ? `${API_BASE}/api/users/death/${memberId}/html?t=${updateKey}` : ''

  // Helper to get latest card values directly from iframe DOM or synced state
  const getLatestCardData = () => {
    try {
      if (iframeRef.current && iframeRef.current.contentDocument) {
        const doc = iframeRef.current.contentDocument
        const getVal = (sel) => {
          const el = doc.querySelector(sel)
          return el ? (el.innerText || el.textContent || '').trim() : ''
        }
        const iframeDate = getVal('[data-field="date"]')
        const iframeVaar = getVal('[data-field="vaar"]')
        const iframeName = getVal('[data-field="name"]')
        const iframeAddress = getVal('[data-field="address"]')
        const iframeTime = getVal('[data-field="janaza_time"]')
        const iframePlace = getVal('[data-field="janaza_place"]')
        const iframeKabrastan = getVal('[data-field="kabrastan"]')
        const iframeNumber = getVal('[data-field="number"]')

        return {
          date: iframeDate || cardData.date,
          vaar: iframeVaar || cardData.vaar,
          name: iframeName || cardData.name,
          address: iframeAddress || cardData.address,
          janazaTime: iframeTime || cardData.janazaTime,
          janazaPlace: iframePlace || cardData.janazaPlace,
          kabrastan: iframeKabrastan || cardData.kabrastan,
          mobile: iframeNumber || cardData.mobile
        }
      }
    } catch (_) {}
    return cardData
  }

  // Copy Full Message Text with real-time cardData values
  const handleCopyText = () => {
    const data = getLatestCardData()
    let text = `🕊️ *મૈયત સમાચાર*\n\n`
    text += `*તારીખ:* ${data.date || '-'}  |  *વાર:* ${data.vaar || '-'}\n\n`
    text += `* *${titlePrefixGujarati} ${data.name || 'Community Member'}* *\n\n`
    if (data.address) {
      text += `*સરનામું:* ${data.address}\n\n`
    }
    if (data.janazaTime || data.janazaPlace) {
      text += `જનાઝા ની નમાઝ નો ટાઇમ ${data.janazaTime || '...'} ${data.janazaPlace || '... માં'} નક્કી થયેલ છે.\n\n`
    }
    if (data.kabrastan) {
      text += `*કબ્રસ્તાન:* ${data.kabrastan}\n\n`
    }
    if (data.mobile) {
      text += `*મોબાઇલ નંબર:* ${data.mobile}\n\n`
    }
    text += `*ઈન્ના લિલ્લાહી વ ઈન્ના ઈલયહી રાજેઊન...*\n\n`
    text += `અલ્લાહ પાક.. એના પ્યારા હબીબ મોહમ્મદ મુસ્તફા સલ્લલ્લાહુ અલયહી વસલ્લમના સદકામા... બુઝુરગાને દીન રહમતુલ્લાહી તઆલા અલયહીના વસીલાથી મગફીરત ફરમાવે... એમની આગળની મંઝીલો આસાન ફરમાવે... દરજાત બુલંદ ફરમાવે...ઘરવાળાઓને સબ્રે જમીલ અતા ફરમાવે...\n\n`
    text += `આમીન... યા રબ્બુલ આલમીન.\n\n`
    text += `— *${communityName}*`

    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(text)
        .then(() => toast.success('મૈયત સમાચાર મેસેજ કોપી થઈ ગયો!'))
        .catch(() => toast.error('Copy failed'))
    }
  }

  // Download handler: Calls backend API endpoint with Axios so it's fully tracked in Network tab
  const handleDownload = async (format = downloadFormat) => {
    setDownloading(true)
    const latest = getLatestCardData()
    const safeName = (latest.name || cardData.name || member?.name || 'Member').replace(/[^a-zA-Z0-9_\-\u0A80-\u0AFF]/g, '_')
    const fileName = `Mayyat_${titlePrefix}_${safeName}.${format === 'pdf' ? 'pdf' : 'png'}`
    const memberId = member?._id || member?.id || member?.member_id || member?.user_id

    try {
      if (memberId) {
        const cleanJanazaPlace = (latest.janazaPlace || '').replace(/\s*માં$/i, '').trim()

        const downloadPayload = {
          format: format === 'pdf' ? 'pdf' : 'png',
          name: latest.name || '',
          date: latest.date || '',
          vaar: latest.vaar || '',
          address: latest.address || '',
          village: '',
          janaza_time: latest.janazaTime || '',
          janaza_place: cleanJanazaPlace,
          kabrastan: latest.kabrastan || '',
          number: latest.mobile || '',
          community_name: communityName || 'રાધનપુર મેમણ જમાત'
        }

        // 1. Call backend API endpoint to get download URL & verify link API (tracked in Network tab)
        const linkRes = await getDeathCardLink(memberId)
        console.log('Death card download API response:', linkRes?.data)

        // 2. Fetch the file blob using POST download endpoint with exact user overrides
        let res
        try {
          res = await api.post(`/users/death/${memberId}/download?format=${format}`, downloadPayload, {
            responseType: 'blob',
            timeout: 45000
          })
        } catch (postErr) {
          console.warn('POST download failed, trying GET fallback:', postErr)
          res = await api.get(`/users/death/${memberId}/download`, {
            params: downloadPayload,
            responseType: 'blob',
            timeout: 45000
          })
        }

        if (res && res.data) {
          const blob = new Blob([res.data], {
            type: format === 'pdf' ? 'application/pdf' : 'image/png'
          })
          const blobUrl = window.URL.createObjectURL(blob)
          const a = document.createElement('a')
          a.href = blobUrl
          a.download = fileName
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          window.URL.revokeObjectURL(blobUrl)

          toast.success(`Mayyat Card ${format.toUpperCase()} downloaded successfully!`)
          setDownloading(false)
          return
        }
      } else {
        toast.error('Member ID not found for API download')
      }
    } catch (backendErr) {
      console.error('Backend download API call failed:', backendErr)
      toast.error(backendErr.response?.data?.message || backendErr.message || 'API download failed')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="મૈયત સમાચાર - Mayyat Announcement & Notification"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4">
        {/* View Mode Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-border pb-2.5">
          <button
            type="button"
            onClick={() => setActiveTab('card')}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'card'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-surface-secondary text-text-secondary hover:text-text'
            }`}
          >
            <span>🖼️ Vafat Announcement Card</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('recipients')
              if (!recipientsList.length) fetchRecipients()
            }}
            className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'recipients'
                ? 'bg-primary text-white shadow-xs'
                : 'bg-surface-secondary text-text-secondary hover:text-text'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Notification Recipients</span>
            {notificationInfo?.recipients_count !== undefined && (
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-extrabold ${
                activeTab === 'recipients' ? 'bg-white/20 text-white' : 'bg-primary/10 text-primary'
              }`}>
                {notificationInfo.recipients_count}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'card' ? (
          <>
        {/* Actions Bar at Top - All on ONE single line */}
        <div className="flex flex-nowrap items-center justify-between gap-3 p-2.5 sm:p-3 bg-surface-secondary/60 rounded-2xl border border-border/80 overflow-x-auto">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Format:</span>
            <div className="inline-flex rounded-xl p-0.5 bg-card border border-border">
              <button
                type="button"
                onClick={() => setDownloadFormat('png')}
                className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${downloadFormat === 'png' ? 'bg-primary text-white shadow-xs' : 'text-text-secondary hover:text-text'
                  }`}
              >
                PNG
              </button>
              <button
                type="button"
                onClick={() => setDownloadFormat('pdf')}
                className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${downloadFormat === 'pdf' ? 'bg-primary text-white shadow-xs' : 'text-text-secondary hover:text-text'
                  }`}
              >
                PDF
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                if (onOpenEdit) onOpenEdit(member)
              }}
              className="text-primary bg-primary/10 hover:bg-primary/20 border-primary/30 font-bold"
              icon={<Edit2 className="w-3.5 h-3.5" />}
              title="Open full Edit Vafat Details form"
            >
              Edit Form
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCopyText}
              className="text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/30 font-bold"
              icon={<Copy className="w-3.5 h-3.5" />}
              title="Copy Mayyat Announcement message"
            >
              Copy
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={downloading}
              disabled={downloading}
              onClick={() => handleDownload(downloadFormat)}
              icon={<Download className="w-3.5 h-3.5" />}
              className="font-bold shadow-md"
            >
              {downloading ? 'Exporting...' : `Download ${downloadFormat.toUpperCase()}`}
            </Button>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            THE CARD: Identical Royal Islamic Gujarati Mayyat Announcement
            WITH DIRECT ON-CARD EDITABLE INPUTS & BIG LABEL.PNG ON TOP
        ════════════════════════════════════════════════════════════════════ */}
        {/* ═══════════════════════════════════════════════════════════════════
            THE CARD: Rendered 100% directly from Backend Template Service
        ════════════════════════════════════════════════════════════════════ */}
        <div className="flex justify-center overflow-x-auto py-2">
          <div className="relative w-full max-w-[675px] bg-[#06182c] rounded-lg shadow-2xl overflow-hidden flex justify-center p-1 border-2 border-[#caa156]">
            {loadingCard && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-[#06182c] text-amber-300 gap-2 min-h-[400px]">
                <RefreshCw className="w-8 h-8 animate-spin text-[#caa156]" />
                <span className="text-sm font-semibold tracking-wide">કાર્ડ લોડ થઈ રહ્યું છે...</span>
              </div>
            )}
            {backendCardUrl && (
              <iframe
                ref={iframeRef}
                key={backendCardUrl}
                src={backendCardUrl}
                title="Mayyat Card Preview"
                onLoad={() => setLoadingCard(false)}
                className="w-[665px] h-[980px] border-0 bg-[#06182c]"
                style={{ width: '665px', height: '980px', minHeight: '980px' }}
              />
            )}
          </div>
        </div>
        </>
        ) : (
          /* ═══════════════════════════════════════════════════════════════════
             NOTIFICATION RECIPIENTS VIEW PANEL
             Displays exact list of members who received or were selected
          ════════════════════════════════════════════════════════════════════ */
          <div className="space-y-4 animate-fade-in text-text">
            {/* Notification Status & Target Overview Box */}
            <div className="bg-surface-secondary/40 border border-border/80 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs">
              <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-border/70">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-text">Push Notification Target Audience</h4>
                    <p className="text-xs text-text-secondary mt-0.5">
                      Recipients who were selected or received this vafat push notification
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20">
                    {notificationInfo?.target_type === 'committee' && '🛡️ Committee Members'}
                    {notificationInfo?.target_type === 'specific' && `👤 Specific Members (${recipientsList.length})`}
                    {(!notificationInfo?.target_type || notificationInfo?.target_type === 'all') && `👥 All Members (${recipientsList.length})`}
                  </span>

                  {onOpenEdit && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenEdit(member)}
                      className="text-xs font-bold"
                      icon={<Edit2 className="w-3.5 h-3.5" />}
                    >
                      Change Recipients
                    </Button>
                  )}
                </div>
              </div>

              {notificationInfo?.body && (
                <div className="text-xs bg-surface p-3 rounded-xl border border-border/60 text-text-secondary italic">
                  "{notificationInfo.body}"
                </div>
              )}

              {notificationInfo?.sent_at && (
                <div className="text-[11px] text-text-secondary flex items-center gap-1.5">
                  <span>📅 Sent Date:</span>
                  <span className="font-semibold text-text">
                    {new Date(notificationInfo.sent_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
                  </span>
                </div>
              )}
            </div>

            {/* Search Input for Recipients */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-text-muted" />
              <input
                type="text"
                value={recipientSearchTerm}
                onChange={(e) => setRecipientSearchTerm(e.target.value)}
                placeholder="Search recipient by name, phone, village, role..."
                className="w-full pl-9 pr-9 py-2 text-xs rounded-xl border border-border bg-input-bg text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary/40 focus:border-primary"
              />
              {recipientSearchTerm && (
                <button
                  type="button"
                  onClick={() => setRecipientSearchTerm('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted hover:text-text cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Scrollable List of Recipients */}
            <div className="max-h-80 overflow-y-auto rounded-xl border border-border/80 bg-surface divide-y divide-border/50">
              {loadingRecipients ? (
                <div className="py-12 text-center text-xs text-text-muted">
                  <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-primary" />
                  Loading notification recipients list...
                </div>
              ) : recipientsList.length === 0 ? (
                <div className="py-12 text-center px-4 space-y-1">
                  <AlertTriangle className="w-6 h-6 text-amber-500 mx-auto" />
                  <p className="text-xs font-bold text-text">No Recipients Found</p>
                  <p className="text-[11px] text-text-secondary">
                    No recipients are recorded for this announcement yet. You can click "Change Recipients" above to configure notification.
                  </p>
                </div>
              ) : (
                (() => {
                  const filtered = recipientsList.filter(u => {
                    if (!recipientSearchTerm.trim()) return true
                    const term = recipientSearchTerm.trim().toLowerCase()
                    const fullName = u.name || [u.first_name, u.last_name].filter(Boolean).join(' ') || ''
                    const phone = String(u.number || '')
                    const village = String(u.village || '')
                    const role = String(u.role || '')
                    return fullName.toLowerCase().includes(term) || phone.includes(term) || village.toLowerCase().includes(term) || role.toLowerCase().includes(term)
                  })

                  if (filtered.length === 0) {
                    return (
                      <div className="py-10 text-center px-4 space-y-1">
                        <Search className="w-5 h-5 text-text-muted mx-auto" />
                        <p className="text-xs font-bold text-text">No Matching Recipients</p>
                        <p className="text-[11px] text-text-secondary">No members matched "{recipientSearchTerm}".</p>
                        <button
                          type="button"
                          onClick={() => setRecipientSearchTerm('')}
                          className="text-xs text-primary font-semibold hover:underline mt-1 cursor-pointer"
                        >
                          Clear Search
                        </button>
                      </div>
                    )
                  }

                  return filtered.map((u, idx) => {
                    const fullName = u.name || [u.first_name, u.last_name].filter(Boolean).join(' ') || 'Community Member'
                    const initials = (fullName.slice(0, 1) || 'M').toUpperCase()

                    return (
                      <div
                        key={u.id || idx}
                        className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-xs hover:bg-surface-secondary/40 transition-colors"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          {u.image ? (
                            <img
                              src={assetUrl(u.image)}
                              alt=""
                              className="w-8 h-8 rounded-full object-cover shrink-0 border border-border"
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary font-bold text-xs flex items-center justify-center shrink-0 border border-primary/20">
                              {initials}
                            </div>
                          )}

                          <div className="min-w-0">
                            <div className="font-semibold text-text truncate flex items-center gap-1.5">
                              <span className="truncate">{fullName}</span>
                              {u.role && (
                                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 shrink-0">
                                  {u.role}
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-text-secondary truncate mt-0.5">
                              {[u.number, u.village].filter(Boolean).join(' • ') || 'No contact details'}
                            </div>
                          </div>
                        </div>

                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 shrink-0">
                          <CheckCircle className="w-3 h-3 text-emerald-500" />
                          Selected for Notification
                        </span>
                      </div>
                    )
                  })
                })()
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}
