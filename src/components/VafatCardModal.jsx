import React, { useRef, useState, useEffect } from 'react'
import Modal from './Modal'
import Button from './common/Button'
import { toPng } from 'html-to-image'
import jsPDF from 'jspdf'
import { Download, Eye, Share2, Sparkles, MapPin, Calendar, Clock, HeartHandshake, ShieldCheck, Check } from 'lucide-react'
import api, { API_BASE, assetUrl, getCommunityFullName, formatDate, getDeathCardDownloadUrl, getDeathCardLink } from '../lib/api'
import { toast } from '../lib/toast'

export default function VafatCardModal({ isOpen, onClose, member }) {
  const cardRef = useRef(null)
  const [downloading, setDownloading] = useState(false)
  const [downloadFormat, setDownloadFormat] = useState('png') // 'png' | 'pdf'
  const [imgError, setImgError] = useState(false)

  useEffect(() => {
    setImgError(false)
  }, [member])

  if (!member) return null

  const isFemale = String(member.gender || '').toLowerCase() === 'female'
  const titlePrefix = isFemale ? 'Marhuma' : 'Marhum'
  const memberName = member.name || member.full_name || 'Community Member'
  const titlePrefixGujarati = isFemale ? 'મરહૂમા' : 'મરહૂમ'
  const communityName = getCommunityFullName() || 'Shree Halai Memon Jamat'
  const memberImage = member.profile_image || member.image || member.photo || member.avatar || ''

  // Format Dua text: ensure member name is auto-prefixed by default as requested
  const getDisplayDuaText = () => {
    const defaultDua = `${titlePrefixGujarati} ${memberName} ગુજરી ગયા છે. બધા સાથીઓ તેમના માટે ખાસ દુઆ કરે, અલ્લાહપાક તેમની મગફિરત કરે અને તેમને જન્નતુલ ફિરદોસમાં આલા મકામ ફરમાવે અને તેમના ઘરવાળાઓને સબર આપે. આમીન!`
    const note = String(member.death_note || '').trim()

    if (!note || note === 'અલ્લાહપાક મરહૂમની મગફિરત કરે અને તેમને જન્નતુલ ફિરદોસમાં આલા મકામ ફરમાવે અને તેમના ઘરવાળાઓને સબર આપે. આમીન!') {
      return defaultDua
    }

    if (note.startsWith('મરહૂમ ગુજરી ગયા છે') || note.startsWith('મરહૂમા ગુજરી ગયા છે')) {
      return note.replace(/^(મરહૂમ|મરહૂમા)\s+ગુજરી ગયા છે/, `${titlePrefixGujarati} ${memberName} ગુજરી ગયા છે`)
    }

    return note
  }

  // Download Handler (Same pattern as Donation Receipt Download)
  const handleDownload = async (format = downloadFormat) => {
    const id = member.id || member._id || member.member_id
    if (!id) return

    setDownloading(true)
    const safeName = memberName.replace(/[^a-zA-Z0-9_\-]/g, '_')
    const fileName = `vafat_${titlePrefix}_${safeName}.${format === 'pdf' ? 'pdf' : 'png'}`

    try {
      // 1. Call Backend API to fetch direct death card download link
      // Shows up in DevTools Network tab under Fetch/XHR as: GET /api/users/death/:id/download-link
      const res = await getDeathCardLink(id)
      const data = res.data?.data || {}
      const downloadUrl = (format === 'pdf' ? data.pdf_url : data.png_url) || data.download_url || getDeathCardDownloadUrl(id, format)

      // 2. Direct browser download from the backend link (exact same pattern as donation receipt)
      const link = document.createElement('a')
      link.href = downloadUrl
      link.setAttribute('download', fileName)
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success(`vafat ${format.toUpperCase()} downloaded successfully!`)
    } catch (err) {
      console.error('Failed to get death card download link, using direct URL fallback:', err)
      const fallbackUrl = member.download_url || member.png_url || getDeathCardDownloadUrl(id, format)
      const link = document.createElement('a')
      link.href = fallbackUrl
      link.setAttribute('download', fileName)
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success(`vafat ${format.toUpperCase()} downloaded`)
    } finally {
      setDownloading(false)
    }
  }

  // WhatsApp Share handler
  const handleShareWhatsApp = () => {
    const memberId = member._id || member.id || member.member_id
    const downloadUrl = member.download_url || member.png_url || (memberId ? `${API_BASE}/api/users/death/${memberId}/download?format=png` : '')

    let text = `🕊️ *إِنَّا لِلّهِ وَإِنَّـا إِلَيْهِ رَاجِعونَ*\n*Inna Lillahi wa Inna Ilayhi Raji'un*\n\nBade ranj-o-alam ke saath itla di jaati hai ki humare jamaat ke rukan *${titlePrefix} ${memberName}* ka vafat ho gaya hai.\n\n📅 *Date of vafat:* ${member.death_date ? formatDate(member.death_date) : '-'}\n📍 *Place:* ${member.death_place || '-'}\n\n`
    if (member.janaza_date || member.janaza_time || member.janaza_place) {
      text += `🕌 *Namaz-e-Janaza:* ${member.janaza_date ? formatDate(member.janaza_date) : '-'}${member.janaza_time ? ` (${member.janaza_time})` : ''}\n📍 *Venue:* ${member.janaza_place || '-'}\n`
    }
    if (member.kabrastan) {
      text += `🌿 *Kabrastan:* ${member.kabrastan}\n`
    }
    text += `\n🤲 *Dua:* ${member.death_note || 'Allah Ta’ala Marhum ko Jannat-ul-Firdaus me aala darja ata farmaye aur lawaheqeen ko Sabr-e-Jameel ata farmaye. Aameen!'}\n\n`
    if (downloadUrl) {
      text += `📄 *Download Official Vafat Card:* ${downloadUrl}\n\n`
    }
    text += `— *${communityName}*`

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="vafat & Janaza Notification Card"
      maxWidth="max-w-2xl"
    >
      <div className="space-y-4">
        {/* Actions Bar at Top */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-surface-secondary/60 rounded-2xl border border-border/80">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-text-secondary uppercase tracking-wider">Format:</span>
            <div className="inline-flex rounded-xl p-0.5 bg-card border border-border">
              <button
                type="button"
                onClick={() => setDownloadFormat('png')}
                className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${downloadFormat === 'png' ? 'bg-primary text-white shadow-xs' : 'text-text-secondary hover:text-text'
                  }`}
              >
                PNG Image
              </button>
              <button
                type="button"
                onClick={() => setDownloadFormat('pdf')}
                className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${downloadFormat === 'pdf' ? 'bg-primary text-white shadow-xs' : 'text-text-secondary hover:text-text'
                  }`}
              >
                PDF Document
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleShareWhatsApp}
              className="text-emerald-700 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30"
              icon={<Share2 className="w-3.5 h-3.5" />}
            >
              Share Details
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              isLoading={downloading}
              disabled={downloading}
              onClick={() => handleDownload(downloadFormat)}
              icon={<Download className="w-3.5 h-3.5" />}
            >
              {downloading ? 'Exporting...' : `Download ${downloadFormat.toUpperCase()}`}
            </Button>
          </div>
        </div>

        {/* The Card to be captured & previewed (Respectful Solemn Warm Light Theme) */}
        <div className="flex justify-center overflow-x-auto py-2">
          <div
            ref={cardRef}
            className="w-full max-w-[540px] bg-gradient-to-b from-[#FCFBF7] via-[#F8F4EC] to-[#F3ECE0] text-stone-900 rounded-3xl border-2 border-amber-500/30 p-6 sm:p-8 shadow-2xl relative overflow-hidden select-none"
            style={{
              fontFamily: "'Outfit', 'Inter', system-ui, sans-serif"
            }}
          >
            {/* Elegant Ornamental Background Elements */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-600 via-amber-400 to-amber-600 shadow-xs" />
            <div className="absolute -top-24 -right-24 w-52 h-52 bg-amber-400/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-52 h-52 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Main Profile & Name Section */}
            <div className="flex flex-col items-center text-center mt-3 mb-5 space-y-3">
              {/* Member Photo (DP) */}
              <div className="relative">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl p-1 bg-gradient-to-tr from-amber-600 via-amber-300 to-amber-600 shadow-lg shadow-amber-950/15">
                  {memberImage && !imgError ? (
                    <img
                      src={assetUrl(memberImage)}
                      alt={memberName}
                      onError={() => setImgError(true)}
                      className="w-full h-full object-cover rounded-xl bg-amber-50"
                    />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-amber-50/90 border border-amber-200/60 flex items-center justify-center text-3xl font-extrabold text-amber-900">
                      {memberName?.slice(0, 1) || 'M'}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                  <span className="px-3.5 py-0.5 rounded-full bg-gradient-to-r from-stone-900 via-stone-800 to-stone-900 text-amber-300 border border-amber-400/40 text-[10px] font-black uppercase tracking-wider shadow-md">
                    {titlePrefix}
                  </span>
                </div>
              </div>

              {/* Marhum Name */}
              <div className="pt-2">
                <h3 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                  {memberName}
                </h3>
                <p className="text-xs text-stone-600 mt-1 font-semibold flex items-center justify-center gap-1.5 flex-wrap">
                  {[member.relation, member.village, member.native_place, (member.family_head?.name ? `Family Head: ${member.family_head.name}` : '')].filter(Boolean).join(' • ')}
                </p>
              </div>
            </div>

            {/* Details Cards Grid */}
            <div className="space-y-2.5 text-xs">
              {/* 1. Vafat Date, Time & Place */}
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3.5 border border-amber-200/80 shadow-xs flex items-start gap-3 transition-all">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-800 border border-amber-500/20 shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 flex-1 min-w-0">
                  <span className="text-[10px] font-extrabold text-amber-800/90 uppercase tracking-wider block">
                    Vafat Details
                  </span>
                  <p className="font-bold text-stone-900 text-sm">
                    {member.death_date ? formatDate(member.death_date) : 'Date not specified'}
                  </p>
                  {member.death_place && (
                    <p className="text-stone-600 flex items-center gap-1 text-[11px] mt-0.5 font-medium">
                      <MapPin className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                      <span>{member.death_place}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* 2. Namaz-e-Janaza */}
              {(member.janaza_date || member.janaza_time || member.janaza_place) && (
                <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3.5 border border-emerald-200/80 shadow-xs flex items-start gap-3 transition-all">
                  <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-800 border border-emerald-500/20 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider block">
                      Namaz-e-Janaza
                    </span>
                    <p className="font-bold text-stone-900 text-sm">
                      {member.janaza_date ? formatDate(member.janaza_date) : 'Janaza Date TBA'}
                      {member.janaza_time && (
                        <span className="text-xs font-semibold text-emerald-800 ml-1.5">
                          ({member.janaza_time})
                        </span>
                      )}
                    </p>
                    {member.janaza_place && (
                      <p className="text-stone-600 flex items-center gap-1 text-[11px] mt-0.5 font-medium">
                        <MapPin className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>Venue: {member.janaza_place}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* 3. Kabrastan / Tadfeen */}
              {member.kabrastan && (
                <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3.5 border border-teal-200/80 shadow-xs flex items-start gap-3 transition-all">
                  <div className="p-2.5 rounded-xl bg-teal-500/10 text-teal-800 border border-teal-500/20 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <span className="text-[10px] font-extrabold text-teal-800 uppercase tracking-wider block">
                      Tadfeen / Kabrastan
                    </span>
                    <p className="font-bold text-stone-900 text-sm">
                      {member.kabrastan}
                    </p>
                  </div>
                </div>
              )}

              {/* 4. Dua-e-Magfirat (Card k last me default note with auto member name) */}
              <div className="bg-gradient-to-br from-amber-50/95 via-emerald-50/35 to-amber-50/90 rounded-2xl p-4 sm:p-5 border border-amber-300/80 text-center space-y-1.5 shadow-xs">
                <span className="text-[11px] font-black text-amber-900 uppercase tracking-wider block">
                  🤲 Dua-e-Magfirat
                </span>
                <p className="text-xs sm:text-[13px] text-stone-800 font-semibold leading-relaxed">
                  {getDisplayDuaText()}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end gap-2.5 pt-3 border-t border-border">
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
          <Button
            type="button"
            variant="primary"
            isLoading={downloading}
            disabled={downloading}
            onClick={() => handleDownload(downloadFormat)}
            icon={<Download className="w-4 h-4" />}
          >
            Download {downloadFormat.toUpperCase()}
          </Button>
        </div>
      </div>
    </Modal>
  )
}
