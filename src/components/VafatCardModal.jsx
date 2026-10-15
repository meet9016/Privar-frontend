import React, { useRef, useState } from 'react'
import Modal from './Modal'
import Button from './common/Button'
import { toPng, toJpeg } from 'html-to-image'
import jsPDF from 'jspdf'
import { Download, Eye, Share2, Sparkles, MapPin, Calendar, Clock, HeartHandshake, ShieldCheck, Check } from 'lucide-react'
import { assetUrl, getCommunityFullName, formatDate } from '../lib/api'
import { toast } from '../lib/toast'

export default function VafatCardModal({ isOpen, onClose, member }) {
  const cardRef = useRef(null)
  const [downloading, setDownloading] = useState(false)
  const [downloadFormat, setDownloadFormat] = useState('png') // 'png' | 'pdf'

  if (!member) return null

  const isFemale = String(member.gender || '').toLowerCase() === 'female'
  const titlePrefix = isFemale ? 'Marhuma' : 'Marhum'
  const memberName = member.name || member.full_name || 'Community Member'
  const titlePrefixGujarati = isFemale ? 'મરહૂમા' : 'મરહૂમ'

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

  // Download Handler (High-Resolution Card Generation)
  const handleDownload = async (format = downloadFormat) => {
    if (!cardRef.current) return
    setDownloading(true)
    try {
      // 1. Generate image using html-to-image with high pixel ratio
      const dataUrl = await toPng(cardRef.current, {
        quality: 0.98,
        pixelRatio: 2.5,
        cacheBust: true,
        style: {
          transform: 'none'
        }
      })

      const safeName = memberName.replace(/[^a-zA-Z0-9_\-]/g, '_')
      const fileName = `vafat_${titlePrefix}_${safeName}`

      if (format === 'pdf') {
        const pdf = new jsPDF({
          orientation: 'portrait',
          unit: 'mm',
          format: 'a4'
        })
        const imgProps = pdf.getImageProperties(dataUrl)
        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width

        // Center vertically if smaller than A4
        const pageHeight = pdf.internal.pageSize.getHeight()
        const yOffset = pdfHeight < pageHeight ? (pageHeight - pdfHeight) / 2 : 10

        pdf.addImage(dataUrl, 'PNG', 0, yOffset > 0 ? yOffset : 0, pdfWidth, pdfHeight)
        pdf.save(`${fileName}.pdf`)
        toast.success('vafat PDF downloaded successfully!')
      } else {
        const link = document.createElement('a')
        link.download = `${fileName}.png`
        link.href = dataUrl
        link.click()
        toast.success('vafat Card image downloaded successfully!')
      }
    } catch (err) {
      console.error('Download vafat Card error:', err)
      toast.error('Failed to generate image. Please try again.')
    } finally {
      setDownloading(false)
    }
  }

  // WhatsApp Share handler
  const handleShareWhatsApp = () => {
    const text = `🕊️ *إِنَّا لِلّهِ وَإِنَّـا إِلَيْهِ رَاجِعونَ*\n*Inna Lillahi wa Inna Ilayhi Raji'un*\n\nBade ranj-o-alam ke saath itla di jaati hai ki humare jamaat ke rukan *${titlePrefix} ${memberName}* ka vafat ho gaya hai.\n\n📅 *Date of vafat:* ${member.death_date ? formatDate(member.death_date) : '-'}\n📍 *Place:* ${member.death_place || '-'}\n\n🕌 *Namaz-e-Janaza:* ${member.janaza_date ? formatDate(member.janaza_date) : '-'}${member.janaza_time ? ` (${member.janaza_time})` : ''}\n📍 *Venue:* ${member.janaza_place || '-'}\n🌿 *Kabrastan:* ${member.kabrastan || '-'}\n\n🤲 *Dua:* ${member.death_note || 'Allah Ta’ala Marhum ko Jannat-ul-Firdaus me aala darja ata farmaye aur lawaheqeen ko Sabr-e-Jameel ata farmaye. Aameen!'}\n\n— *${communityName}*`

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

        {/* The Card to be captured & previewed (Respectful Solemn Light Theme) */}
        <div className="flex justify-center overflow-x-auto py-2">
          <div
            ref={cardRef}
            className="w-full max-w-[540px] bg-gradient-to-b from-[#fafaf9] via-[#f5f5f4] to-[#f0efed] text-stone-900 rounded-3xl border-2 border-stone-300/80 p-6 sm:p-8 shadow-xl relative overflow-hidden select-none"
            style={{
              fontFamily: "'Outfit', 'Inter', system-ui, sans-serif"
            }}
          >
            {/* Elegant Ornamental Background Elements */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-stone-400 via-stone-600 to-stone-400" />
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-stone-300/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-stone-300/20 rounded-full blur-3xl pointer-events-none" />

            {/* Corner Decorative Borders */}
            <div className="absolute top-3 left-3 w-4 h-4 border-t-2 border-l-2 border-stone-500/70 rounded-tl-sm pointer-events-none" />
            <div className="absolute top-3 right-3 w-4 h-4 border-t-2 border-r-2 border-stone-500/70 rounded-tr-sm pointer-events-none" />
            <div className="absolute bottom-3 left-3 w-4 h-4 border-b-2 border-l-2 border-stone-500/70 rounded-bl-sm pointer-events-none" />
            <div className="absolute bottom-3 right-3 w-4 h-4 border-b-2 border-r-2 border-stone-500/70 rounded-br-sm pointer-events-none" />

            {/* Main Profile & Name Section */}
            <div className="flex flex-col items-center text-center mt-3 mb-5 space-y-3">
              {/* Member Photo (DP) */}
              <div className="relative">
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl p-1 bg-gradient-to-tr from-stone-400 via-stone-200 to-stone-500 shadow-md">
                  {memberImage ? (
                    <img
                      src={assetUrl(memberImage)}
                      alt={memberName}
                      crossOrigin="anonymous"
                      className="w-full h-full object-cover rounded-xl bg-stone-200"
                    />
                  ) : (
                    <div className="w-full h-full rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-3xl font-bold text-stone-700">
                      {memberName?.slice(0, 1) || 'M'}
                    </div>
                  )}
                </div>
                <div className="absolute -bottom-2 inset-x-0 flex justify-center">
                  <span className="px-3 py-0.5 rounded-full bg-stone-900 text-stone-100 text-[10px] font-black uppercase tracking-wider shadow-md">
                    {titlePrefix}
                  </span>
                </div>
              </div>

              {/* Marhum Name */}
              <div className="pt-2">
                <h3 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
                  {memberName}
                </h3>
                <p className="text-xs text-stone-600 mt-0.5 font-semibold">
                  {[member.relation, member.village, member.native_place, (member.family_head?.name ? `Family Head: ${member.family_head.name}` : '')].filter(Boolean).join(' • ')}
                </p>
              </div>
            </div>

            {/* Details Cards Grid */}
            <div className="space-y-2.5 text-xs">
              {/* 1. vafat Date, Time & Place */}
              <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3.5 border border-stone-200 shadow-xs flex items-start gap-3">
                <div className="p-2 rounded-xl bg-stone-100 text-stone-700 shrink-0">
                  <Calendar className="w-4 h-4" />
                </div>
                <div className="space-y-0.5 flex-1 min-w-0">
                  <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">
                    vafat Details
                  </span>
                  <p className="font-bold text-stone-900 text-sm">
                    {member.death_date ? formatDate(member.death_date) : 'Date not specified'}
                  </p>
                  {member.death_place && (
                    <p className="text-stone-600 flex items-center gap-1 text-[11px] mt-0.5 font-medium">
                      <MapPin className="w-3 h-3 text-stone-500 shrink-0" />
                      <span>{member.death_place}</span>
                    </p>
                  )}
                </div>
              </div>

              {/* 2. Namaz-e-Janaza */}
              {(member.janaza_date || member.janaza_time || member.janaza_place) && (
                <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3.5 border border-stone-200 shadow-xs flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-stone-100 text-stone-700 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">
                      Namaz-e-Janaza
                    </span>
                    <p className="font-bold text-stone-900 text-sm">
                      {member.janaza_date ? formatDate(member.janaza_date) : 'Janaza Date TBA'}
                      {member.janaza_time && <span className="text-xs font-medium text-stone-600 ml-1.5">({member.janaza_time})</span>}
                    </p>
                    {member.janaza_place && (
                      <p className="text-stone-600 flex items-center gap-1 text-[11px] mt-0.5 font-medium">
                        <MapPin className="w-3 h-3 text-stone-500 shrink-0" />
                        <span>Venue: {member.janaza_place}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* 3. Kabrastan / Tadfeen */}
              {member.kabrastan && (
                <div className="bg-white/95 backdrop-blur-md rounded-2xl p-3.5 border border-stone-200 shadow-xs flex items-start gap-3">
                  <div className="p-2 rounded-xl bg-stone-100 text-stone-700 shrink-0">
                    <MapPin className="w-4 h-4" />
                  </div>
                  <div className="space-y-0.5 flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-stone-600 uppercase tracking-wider block">
                      Tadfeen / Kabrastan
                    </span>
                    <p className="font-bold text-stone-900 text-sm">
                      {member.kabrastan}
                    </p>
                  </div>
                </div>
              )}

              {/* 4. Dua-e-Magfirat (Card k last me default note with auto member name) */}
              <div className="bg-white/95 rounded-2xl p-4 border border-stone-300 text-center space-y-1.5 shadow-xs">
                <span className="text-[10px] font-black text-stone-800 uppercase tracking-widest block">
                  🤲 Dua-e-Magfirat
                </span>
                <p className="text-xs text-stone-800 font-semibold leading-relaxed">
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
