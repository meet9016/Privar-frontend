import React, { useRef, useState } from 'react'
import Modal from './Modal'
import Button from './common/Button'
import { Download, Share2, Copy } from 'lucide-react'
import { API_BASE, getCommunityFullName, formatDate, getDeathCardDownloadUrl, getDeathCardLink } from '../lib/api'
import { toast } from '../lib/toast'
import { getGujaratiDay, getAutoIslamicDate } from '../pages/ContentPage'

export default function VafatCardModal({ isOpen, onClose, member }) {
  const cardRef = useRef(null)
  const [downloading, setDownloading] = useState(false)
  const [downloadFormat, setDownloadFormat] = useState('png') // 'png' | 'pdf'

  if (!member) return null

  const isFemale = String(member.gender || '').toLowerCase() === 'female'
  const titlePrefix = isFemale ? 'Marhuma' : 'Marhum'
  const memberName = [member.first_name, member.middle_name, member.last_name].filter(Boolean).join(' ') || member.name || member.full_name || 'Community Member'
  const titlePrefixGujarati = isFemale ? 'મરહૂમા' : 'મરહૂમ'
  const communityName = getCommunityFullName() || 'Shree Halai Memon Jamat'

  // Format Dynamic Fields
  const villageText = member.village || member.native_place || '-'
  const rawDate = member.death_date ? formatDate(member.death_date) : '-'
  const islamicDateText = member.islamic_date ? ` (${member.islamic_date})` : (member.death_date ? ` (${getAutoIslamicDate(member.death_date)})` : '')
  const dateDisplay = `${rawDate}${islamicDateText}`
  const vaarText = member.vaar || (member.death_date ? getGujaratiDay(member.death_date) : '-')
  const janazaTime = member.janaza_time || '...'
  const janazaPlace = member.janaza_place ? `${member.janaza_place} માં` : '... માં'
  const addressText = member.address || member.death_place || '-'

  // Copy Full Message Text
  const handleCopyText = () => {
    let text = `મૈયત સમાચાર\n\n`
    text += `ગામ - ${villageText}\n\n`
    text += `તારીખ: ${dateDisplay}\n\n`
    text += `વાર: ${vaarText}\n\n`
    text += ` * ${titlePrefixGujarati} ${memberName} * \n\n\n`
    text += `જનાઝા ની નમાઝ નો ટાઇમ ${janazaTime} વાગે ${janazaPlace} ઇન્શાઅલ્લાહ નક્કી થયેલ છે.\n\n`
    text += `*એડ્રેસ: ${addressText}*\n\n\n`
    text += `ઈન્ના લિલ્લાહી વ ઈન્ના ઈલયહી રાજેઊન...\n\n`
    text += `અલ્લાહ પાક.. એના પ્યારા હબીબ મોહમ્મદ મુસ્તફા સલ્લલ્લાહુ અલયહી વસલ્લમના સદકામા... બુઝુરગાને દીન રહમતુલ્લાહી તઆલા અલયહીના વસીલાથી મગફીરત ફરમાવે... એમની આગળની મંઝીલો આસાન ફરમાવે... દરજાત બુલંદ ફરમાવે...ઘરવાળાઓને સબ્રે જમીલ અતા ફરમાવે...\n\n`
    text += `آمین بجاه شفیع المذنبین ﷺ\n`
    text += `આમીન... યા રબ્બુલ આલમીન.`

    const copyToClipboard = (str) => {
      if (navigator?.clipboard?.writeText) {
        return navigator.clipboard.writeText(str)
      }
      return new Promise((resolve, reject) => {
        try {
          const ta = document.createElement('textarea')
          ta.value = str
          ta.style.position = 'fixed'
          ta.style.opacity = '0'
          document.body.appendChild(ta)
          ta.select()
          document.execCommand('copy')
          document.body.removeChild(ta)
          resolve()
        } catch (e) {
          reject(e)
        }
      })
    }

    copyToClipboard(text)
      .then(() => {
        toast.success('મૈયત સમાચાર મેસેજ કોપી થઈ ગયો!')
      })
      .catch(() => {
        toast.error('Copy failed')
      })
  }

  // Download Handler (Backend PDF/PNG service)
  const handleDownload = async (format = downloadFormat) => {
    const id = member.id || member._id || member.member_id
    if (!id) return

    setDownloading(true)
    const safeName = memberName.replace(/[^a-zA-Z0-9_\-]/g, '_')
    const fileName = `Mayyat_${titlePrefix}_${safeName}.${format === 'pdf' ? 'pdf' : 'png'}`

    try {
      const res = await getDeathCardLink(id)
      const data = res.data?.data || {}
      const downloadUrl = (format === 'pdf' ? data.pdf_url : data.png_url) || data.download_url || getDeathCardDownloadUrl(id, format)

      const link = document.createElement('a')
      link.href = downloadUrl
      link.setAttribute('download', fileName)
      link.style.display = 'none'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      toast.success(`Mayyat Card ${format.toUpperCase()} downloaded successfully!`)
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
      toast.success(`Mayyat Card ${format.toUpperCase()} downloaded`)
    } finally {
      setDownloading(false)
    }
  }

  // WhatsApp Share handler formatted exactly with the user's template
  const handleShareWhatsApp = () => {
    const memberId = member._id || member.id || member.member_id
    const downloadUrl = member.download_url || member.png_url || (memberId ? `${API_BASE}/api/users/death/${memberId}/download?format=png` : '')

    let text = `🕊️ *મૈયત સમાચાર*\n\n`
    text += `*ગામ -* ${villageText}\n\n`
    text += `*તારીખ:* ${dateDisplay}\n\n`
    text += `*વાર:* ${vaarText}\n\n`
    text += `* *${titlePrefixGujarati} ${memberName}* *\n\n\n`
    text += `જનાઝા ની નમાઝ નો ટાઇમ ${janazaTime} વાગે ${janazaPlace} ઇન્શાઅલ્લાહ નક્કી થયેલ છે.\n\n`
    text += `*એડ્રેસ: ${addressText}*\n\n\n`
    text += `*ઈન્ના લિલ્લાહી વ ઈન્ના ઈલયહી રાજેઊન...*\n\n`
    text += `અલ્લાહ પાક.. એના પ્યારા હબીબ મોહમ્મદ મુસ્તફા સલ્લલ્લાહુ અલયહી વસલ્લમના સદકામા... બુઝુરગાને દીન રહમતુલ્લાહી તઆલા અલયહીના વસીલાથી મગફીરત ફરમાવે... એમની આગળની મંઝીલો આસાન ફરમાવે... દરજાત બુલંદ ફરમાવે...ઘરવાળાઓને સબ્રે જમીલ અતા ફરમાવે...\n\n`
    text += `آمین بجاه شفیع المذنبین ﷺ\n`
    text += `આમીન... યા રબ્બુલ આલમીન.\n\n`
    if (downloadUrl) {
      text += `📄 *Download Official Card:* ${downloadUrl}\n\n`
    }
    text += `— *${communityName}*`

    window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, '_blank')
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="મૈયત સમાચાર - Mayyat Notification Card"
      maxWidth="max-w-3xl"
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
                className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  downloadFormat === 'png' ? 'bg-primary text-white shadow-xs' : 'text-text-secondary hover:text-text'
                }`}
              >
                PNG Image
              </button>
              <button
                type="button"
                onClick={() => setDownloadFormat('pdf')}
                className={`px-3 py-1 rounded-lg text-xs font-extrabold transition-all cursor-pointer ${
                  downloadFormat === 'pdf' ? 'bg-primary text-white shadow-xs' : 'text-text-secondary hover:text-text'
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
              onClick={handleCopyText}
              className="text-indigo-700 bg-indigo-500/10 hover:bg-indigo-500/20 border-indigo-500/30"
              icon={<Copy className="w-3.5 h-3.5" />}
            >
              Copy Message
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleShareWhatsApp}
              className="text-emerald-700 bg-emerald-500/10 hover:bg-emerald-500/20 border-emerald-500/30"
              icon={<Share2 className="w-3.5 h-3.5" />}
            >
              Share WhatsApp
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

        {/* ═══════════════════════════════════════════════════════════════════
            THE CARD: Clean Normal White Card with Wide Margins (No Photo)
        ════════════════════════════════════════════════════════════════════ */}
        <div className="flex justify-center overflow-x-auto py-2">
          <div
            ref={cardRef}
            className="w-full max-w-[640px] bg-white text-stone-900 rounded-2xl border-2 border-stone-800 p-7 sm:p-9 shadow-xl relative select-none"
            style={{
              fontFamily: "'Noto Sans Gujarati', 'Noto Sans', system-ui, sans-serif"
            }}
          >
            {/* Header: મૈયત સમાચાર */}
            <div className="text-center pb-3 mb-5 border-b-2 border-stone-800">
              <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-wider">
                મૈયત સમાચાર
              </h1>
            </div>

            {/* Metadata Lines: ગામ, તારીખ, વાર */}
            <div className="space-y-2 text-base sm:text-lg font-bold text-stone-800 mb-6 px-1 leading-normal">
              <p>
                <span className="font-black text-stone-950">ગામ -</span> {villageText}
              </p>
              <p>
                <span className="font-black text-stone-950">તારીખ:</span> {dateDisplay}
              </p>
              <p>
                <span className="font-black text-stone-950">વાર:</span> {vaarText}
              </p>
            </div>

            {/* Marhum Name (Clean text only, no DP) */}
            <div className="text-center py-3.5 my-4 border-y border-dashed border-stone-300">
              <h2 className="text-2xl sm:text-3xl font-black text-stone-950 tracking-tight">
                * {titlePrefixGujarati} {memberName} *
              </h2>
            </div>

            {/* Janaza Announcement Line */}
            <div className="my-6 text-center text-sm sm:text-base font-bold text-stone-900 leading-relaxed px-2">
              જનાઝા ની નમાઝ નો ટાઇમ{' '}
              <span className="font-black text-stone-950 underline decoration-stone-400 underline-offset-4">
                {janazaTime}
              </span>{' '}
              વાગે{' '}
              <span className="font-black text-stone-950">
                {janazaPlace}
              </span>{' '}
              <span className="font-black text-stone-950">ઇન્શાઅલ્લાહ</span> નક્કી થયેલ છે.
            </div>

            {/* Address Line */}
            <div className="text-center text-sm sm:text-base font-black text-stone-900 my-5 px-2">
              *એડ્રેસ: {addressText}*
            </div>

            {/* Inna Lillahi Calligraphy & Text */}
            <div className="text-center my-6 pt-5 border-t border-stone-200">
              <div
                className="text-xl sm:text-2xl font-bold text-stone-900 tracking-wide mb-1.5"
                style={{ fontFamily: "'Amiri', 'Traditional Arabic', serif" }}
              >
                إِنَّا لِلَّهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ
              </div>
              <p className="text-sm sm:text-base font-bold text-stone-800">
                ઈન્ના લિલ્લાહી વ ઈન્ના ઈલયહી રાજેઊન...
              </p>
            </div>

            {/* Dua Body */}
            <div className="text-center text-xs sm:text-sm font-semibold text-stone-700 leading-relaxed px-2 sm:px-6 my-5">
              અલ્લાહ પાક.. એના પ્યારા હબીબ મોહમ્મદ મુસ્તફા સલ્લલ્લાહુ અલયહી વસલ્લમના સદકામા... બુઝુરગાને દીન રહમતુલ્લાહી તઆલા અલયહીના વસીલાથી મગફીરત ફરમાવે... એમની આગળની મંઝીલો આસાન ફરમાવે... દરજાત બુલંદ ફરમાવે...ઘરવાળાઓને સબ્રે જમીલ અતા ફરમાવે...
            </div>

            {/* Closing Aameen */}
            <div className="text-center my-5">
              <p
                className="text-lg sm:text-xl font-bold text-stone-900 tracking-wide"
                style={{ fontFamily: "'Amiri', 'Traditional Arabic', serif" }}
              >
                آمین بجاه شفیع المذنبین ﷺ
              </p>
              <p className="text-xs sm:text-sm font-bold text-stone-800 mt-1">
                આમીન... યા રબ્બુલ આલમીન.
              </p>
            </div>

            {/* Community Footer Signature */}
            <div className="text-center pt-3 mt-5 border-t border-stone-200 text-xs font-bold text-stone-500 tracking-wider">
              — {communityName} —
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
