import React, { useRef, useState, useEffect } from 'react'
import Modal from './Modal'
import Button from './common/Button'
import { Download, Edit2, Copy } from 'lucide-react'
import api, { API_BASE, formatDate, getDeathCardDownloadUrl, getDeathCardLink } from '../lib/api'
import { toast } from '../lib/toast'
import { getGujaratiDay } from '../pages/ContentPage'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'

import cornerImg from '../assets/mayyat/mayyat_corner.png'
import sealImg from '../assets/mayyat/jamatSeal.png'
import labelImg from '../assets/mayyat/label_tall.png'
import bannerImg from '../assets/mayyat/banner_tall.png'
import topImg from '../assets/mayyat/top_img.png'

export default function VafatCardModal({ isOpen, onClose, member, onOpenEdit }) {
  const cardRef = useRef(null)
  const [downloading, setDownloading] = useState(false)
  const [downloadFormat, setDownloadFormat] = useState('png') // 'png' | 'pdf'

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

  // Initialize or re-populate when member prop changes & trigger backend API call
  useEffect(() => {
    if (!member || !isOpen) return

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

    // Explicitly call Backend API to ensure Network call is fired and latest data synced
    const memberId = member._id || member.id || member.member_id
    if (memberId) {
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

            setCardData({
              date: apiDate || formattedDate || '27 / 10 / 2026',
              vaar: calcVaar || calculatedVaar || 'મંગળવાર',
              name: d.name || memberName || '',
              address: apiFullAddress || fullAddress,
              janazaTime: d.janaza_time !== undefined ? d.janaza_time : (member.janaza_time || ''),
              janazaPlace: jPlace,
              kabrastan: d.kabrastan !== undefined ? d.kabrastan : (member.kabrastan || ''),
              mobile: d.number !== undefined ? d.number : (member.number || member.mobile || '')
            })
          }
        })
        .catch(err => {
          console.warn('Backend death card API fetch:', err)
        })
    }
  }, [member, isOpen])

  if (!member) return null

  const isFemale = String(member.gender || '').toLowerCase() === 'female'
  const titlePrefixGujarati = isFemale ? 'મરહૂમા' : 'મરહૂમ'
  const nameLabel = isFemale ? 'મરહુમાનું નામ' : 'મરહુમનું નામ'
  const titlePrefix = isFemale ? 'Marhuma' : 'Marhum'
  const communityName = 'રાધનપુર મેમણ જમાત'

  // Copy Full Message Text with real-time cardData values
  const handleCopyText = () => {
    let text = `🕊️ *મૈયત સમાચાર*\n\n`
    text += `*તારીખ:* ${cardData.date || '-'}  |  *વાર:* ${cardData.vaar || '-'}\n\n`
    text += `* *${titlePrefixGujarati} ${cardData.name || 'Community Member'}* *\n\n`
    if (cardData.address) {
      text += `*સરનામું:* ${cardData.address}\n\n`
    }
    if (cardData.janazaTime || cardData.janazaPlace) {
      text += `જનાઝા ની નમાઝ નો ટાઇમ ${cardData.janazaTime || '...'} ${cardData.janazaPlace || '... માં'} નક્કી થયેલ છે.\n\n`
    }
    if (cardData.kabrastan) {
      text += `*કબ્રસ્તાન:* ${cardData.kabrastan}\n\n`
    }
    if (cardData.mobile) {
      text += `*મોબાઇલ નંબર:* ${cardData.mobile}\n\n`
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
    const safeName = (cardData.name || member?.name || 'Member').replace(/[^a-zA-Z0-9_\-\u0A80-\u0AFF]/g, '_')
    const fileName = `Mayyat_${titlePrefix}_${safeName}.${format === 'pdf' ? 'pdf' : 'png'}`
    const memberId = member?._id || member?.id || member?.member_id || member?.user_id

    try {
      if (memberId) {
        const cleanJanazaPlace = (cardData.janazaPlace || '').replace(/\s*માં$/i, '').trim()

        const downloadParams = {
          format: format === 'pdf' ? 'pdf' : 'png',
          name: cardData.name || '',
          date: cardData.date || '',
          vaar: cardData.vaar || '',
          address: cardData.address || '',
          village: '',
          janaza_time: cardData.janazaTime || '',
          janaza_place: cleanJanazaPlace,
          kabrastan: cardData.kabrastan || '',
          number: cardData.mobile || '',
          community_name: communityName || 'રાધનપુર મેમણ જમાત'
        }

        // 1. Call backend API endpoint to get download URL in response
        const linkRes = await getDeathCardLink(memberId, downloadParams)
        console.log('Death card download API response:', linkRes?.data)

        const downloadUrl = linkRes?.data?.data?.download_url || linkRes?.data?.download_url || linkRes?.data?.data?.url || linkRes?.data?.url

        if (downloadUrl) {
          // 2. Fetch the file blob using the downloadUrl from the API response
          const res = await api.get(downloadUrl, {
            responseType: 'blob',
            timeout: 45000
          })

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
    }

    // Client-side fallback with input-to-text conversion to avoid html2canvas baseline slicing
    try {
      if (!cardRef.current) {
        setDownloading(false)
        return
      }
      const canvas = await html2canvas(cardRef.current, {
        scale: 2.8,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#06182c',
        logging: false,
        onclone: (clonedDoc) => {
          const clonedCard = clonedDoc.querySelector('[data-card-frame]') || clonedDoc.body;
          const inputs = clonedCard.querySelectorAll('input');
          inputs.forEach(input => {
            const isDateField = input.closest('.date-group, .day-group') || input.parentElement?.querySelector('.invisible');
            if (isDateField) {
              const wrapper = input.parentElement;
              const val = input.value || '';
              const span = clonedDoc.createElement('span');
              span.textContent = val;
              span.style.borderBottom = '2px solid #081a2e';
              span.style.padding = '0 4px 3px 6px';
              span.style.display = 'inline-block';
              span.style.fontWeight = '600';
              span.style.fontSize = '16.5px';
              span.style.color = '#081a2e';
              span.style.lineHeight = '1.3';
              if (wrapper && wrapper.parentElement) {
                wrapper.parentElement.replaceChild(span, wrapper);
              }
            } else {
              const val = input.value || '';
              const div = clonedDoc.createElement('div');
              div.textContent = val;
              div.style.borderBottom = '2px solid #081a2e';
              div.style.paddingBottom = '3px';
              div.style.paddingLeft = '6px';
              div.style.fontSize = '16px';
              div.style.fontWeight = '600';
              div.style.color = '#081a2e';
              div.style.minHeight = '24px';
              div.style.display = 'block';
              div.style.lineHeight = '22px';
              div.style.width = '100%';
              if (input.parentElement) {
                input.parentElement.replaceChild(div, input);
              }
            }
          });
        }
      })

      if (format === 'pdf') {
        const imgData = canvas.toDataURL('image/png')
        const pdf = new jsPDF('p', 'mm', 'a4')
        const pdfWidth = pdf.internal.pageSize.getWidth()
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width
        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight)
        pdf.save(fileName)
        toast.success('Mayyat Card PDF downloaded successfully!')
      } else {
        const imageUri = canvas.toDataURL('image/png')
        const link = document.createElement('a')
        link.href = imageUri
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        toast.success('Mayyat Card PNG downloaded successfully!')
      }
    } catch (err) {
      console.error('All download methods failed:', err)
      toast.error('Failed to download card')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="મૈયત સમાચાર - Mayyat Announcement Card (Editable Form)"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-4">
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
        <div className="flex justify-center overflow-x-auto py-2">
          <div
            ref={cardRef}
            data-card-frame="true"
            className="w-full max-w-[665px] bg-[#06182c] text-stone-900 rounded shadow-2xl relative select-none border-2 border-[#caa156] overflow-hidden flex flex-col"
            style={{
              fontFamily: "'Noto Sans Gujarati', 'Noto Sans', system-ui, sans-serif"
            }}
          >
            {/* Outer thin gold inner line */}
            <div className="absolute top-1 left-1 right-1 bottom-1 border border-[#7d6328] pointer-events-none z-[1]" />

            {/* Top Corner Ornaments on Navy Background */}
            <div
              className="absolute top-0.5 left-0.5 w-28 sm:w-36 h-28 sm:h-36 pointer-events-none z-[1] bg-contain bg-no-repeat"
              style={{ backgroundImage: `url(${cornerImg})` }}
            />
            <div
              className="absolute top-0.5 right-0.5 w-28 sm:w-36 h-28 sm:h-36 pointer-events-none z-[1] bg-contain bg-no-repeat -scale-x-100"
              style={{ backgroundImage: `url(${cornerImg})` }}
            />

            {/* Top Arch Banner Header using top_img.png */}
            <div className="relative mx-3 sm:mx-4 mt-2 h-[220px] sm:h-[270px] overflow-hidden z-[3]">
              <img
                src={topImg}
                alt="Top Header Arch"
                className="absolute -top-4 sm:-top-[26px] left-0 w-full h-[260px] sm:h-[324px] pointer-events-none object-fill"
              />
              {/* Content positioned inside the dark blue cartouche of top_img.png - centered comfortably */}
              <div className="absolute top-[82px] sm:top-[112px] left-[30px] sm:left-[40px] right-[30px] sm:right-[40px] h-[95px] sm:h-[135px] flex flex-col items-center justify-center z-[4] text-center">
                <span
                  className="text-white text-sm sm:text-[21px] font-bold tracking-wide drop-shadow-[0_1px_3px_rgba(0,0,0,0.85)] leading-tight"
                  style={{ fontFamily: "'Amiri', serif" }}
                >
                  إِنَّا لِلَّٰهِ وَإِنَّا إِلَيْهِ رَاجِعُونَ
                </span>
                <div className="flex items-center justify-center gap-3 sm:gap-4 mt-1 sm:mt-1.5">

                  <h1 className="text-2xl sm:text-[40px] font-extrabold text-[#fad074] tracking-wider leading-none drop-shadow-[0_2px_5px_rgba(0,0,0,0.95)]">
                    મૈયત સમાચાર
                  </h1>

                </div>
              </div>
            </div>

            {/* Main Parchment Content Body */}
            <div
              className="relative z-[2] -mt-[2px] mx-3 sm:mx-4 mb-3 sm:mb-4 rounded-b border-2 border-[#caa156] border-t-0 flex flex-col justify-between overflow-hidden shadow-inner flex-1"
              style={{
                background: 'radial-gradient(circle at 50% 30%, #fffdf8 0%, #faf5ea 70%, #f6edd7 100%)'
              }}
            >
              {/* Bottom Corner Ornaments inside Cream Background */}
              <div
                className="absolute bottom-0 left-0 w-24 sm:w-32 h-24 sm:h-32 pointer-events-none z-[1] opacity-85 bg-contain bg-no-repeat -scale-y-100"
                style={{ backgroundImage: `url(${cornerImg})` }}
              />
              <div
                className="absolute bottom-0 right-0 w-24 sm:w-32 h-24 sm:h-32 pointer-events-none z-[1] opacity-85 bg-contain bg-no-repeat scale-[-1]"
                style={{ backgroundImage: `url(${cornerImg})` }}
              />

              <div className="relative z-[3] px-3 sm:px-5 pb-2 pt-1 flex flex-col justify-between flex-1 gap-2">
                {/* Date and Day Row with Editable Inputs - Underline strictly matches text length & Vaar on right side */}
                <div className="flex justify-between items-baseline px-1 sm:px-2 pt-2 sm:pt-3 text-base sm:text-[19px] font-bold text-[#081a2e]">
                  <div className="flex items-baseline gap-1.5 sm:gap-2">
                    <span>તા.</span>
                    <span className="relative inline-flex items-baseline border-b-2 border-[#081a2e] pb-0.5">
                      <span className="invisible px-1 sm:px-1.5 font-semibold text-sm sm:text-[16.5px] whitespace-pre select-none pointer-events-none">
                        {cardData.date || 'DD / MM / YYYY'}
                      </span>
                      <input
                        type="text"
                        value={cardData.date}
                        onChange={(e) => setCardData(prev => ({ ...prev, date: e.target.value }))}
                        placeholder="DD / MM / YYYY"
                        title="Click to edit date"
                        className="absolute inset-0 w-full h-full bg-transparent border-0 px-1 sm:px-1.5 text-left font-semibold text-sm sm:text-[16.5px] outline-none"
                      />
                    </span>
                  </div>
                  <div className="flex items-baseline gap-1.5 sm:gap-2">
                    <span>વાર.</span>
                    <span className="relative inline-flex items-baseline border-b-2 border-[#081a2e] pb-0.5">
                      <span className="invisible px-1 sm:px-1.5 font-semibold text-sm sm:text-[16.5px] whitespace-pre select-none pointer-events-none">
                        {cardData.vaar || 'વાર...'}
                      </span>
                      <input
                        type="text"
                        value={cardData.vaar}
                        onChange={(e) => setCardData(prev => ({ ...prev, vaar: e.target.value }))}
                        placeholder="વાર..."
                        title="Click to edit day"
                        className="absolute inset-0 w-full h-full bg-transparent border-0 px-1 sm:px-1.5 text-left font-semibold text-sm sm:text-[16.5px] outline-none"
                      />
                    </span>
                  </div>
                </div>

                {/* Form Fields Section: 6 Clean Aligned Rows */}
                <div className="flex flex-col gap-2 sm:gap-2.5 my-0.5">
                  {/* 1. Marhum Name */}
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="relative w-44 sm:w-56 h-12 sm:h-[52px] shrink-0 flex items-center justify-center">
                      <img src={labelImg} alt="" className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-sm" />
                      <span className="relative z-2 text-white font-semibold text-xs sm:text-[15.5px] text-center px-3 tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                        {nameLabel}
                      </span>
                    </div>
                    <div className="flex-1 flex items-end">
                      <input
                        type="text"
                        value={cardData.name}
                        onChange={(e) => setCardData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="મરહુમનું નામ દાખલ કરો..."
                        title="Click to edit Marhum name"
                        className="w-full bg-transparent border-0 border-b-2 border-[#081a2e] text-[#081a2e] font-semibold text-sm sm:text-[16px] pb-0.5 pl-1.5 outline-none focus:border-[#caa156] focus:bg-amber-500/10 transition-colors"
                      />
                    </div>
                  </div>

                  {/* 2. Address (Single Line) */}
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="relative w-44 sm:w-56 h-12 sm:h-[52px] shrink-0 flex items-center justify-center">
                      <img src={labelImg} alt="" className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-sm" />
                      <span className="relative z-2 text-white font-semibold text-xs sm:text-[15.5px] text-center px-3 tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                        સરનામું
                      </span>
                    </div>
                    <div className="flex-1 flex items-end">
                      <input
                        type="text"
                        value={cardData.address}
                        onChange={(e) => setCardData(prev => ({ ...prev, address: e.target.value }))}
                        placeholder="સરનામું દાખલ કરો..."
                        title="Click to edit Address"
                        className="w-full bg-transparent border-0 border-b-2 border-[#081a2e] text-[#081a2e] font-semibold text-sm sm:text-[16px] pb-0.5 pl-1.5 outline-none focus:border-[#caa156] focus:bg-amber-500/10 transition-colors"
                      />
                    </div>
                  </div>

                  {/* 3. Janaza Time (Separate) */}
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="relative w-44 sm:w-56 h-12 sm:h-[52px] shrink-0 flex items-center justify-center">
                      <img src={labelImg} alt="" className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-sm" />
                      <span className="relative z-2 text-white font-semibold text-xs sm:text-[15.5px] text-center px-3 tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                        જનાઝાનો સમય
                      </span>
                    </div>
                    <div className="flex-1 flex items-end">
                      <input
                        type="text"
                        value={cardData.janazaTime}
                        onChange={(e) => setCardData(prev => ({ ...prev, janazaTime: e.target.value }))}
                        placeholder="જનાઝાનો સમય (દા.ત. બપોરે ૦૨:૩૦ વાગે)..."
                        title="Click to edit Janaza Time"
                        className="w-full bg-transparent border-0 border-b-2 border-[#081a2e] text-[#081a2e] font-semibold text-sm sm:text-[16px] pb-0.5 pl-1.5 outline-none focus:border-[#caa156] focus:bg-amber-500/10 transition-colors"
                      />
                    </div>
                  </div>

                  {/* 4. Janaza Place (Separate) */}
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="relative w-44 sm:w-56 h-12 sm:h-[52px] shrink-0 flex items-center justify-center">
                      <img src={labelImg} alt="" className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-sm" />
                      <span className="relative z-2 text-white font-semibold text-xs sm:text-[15.5px] text-center px-3 tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                        જનાઝાની નમાઝનું સ્થળ
                      </span>
                    </div>
                    <div className="flex-1 flex items-end">
                      <input
                        type="text"
                        value={cardData.janazaPlace}
                        onChange={(e) => setCardData(prev => ({ ...prev, janazaPlace: e.target.value }))}
                        placeholder="જનાઝાનું સ્થળ / મસ્જિદ (દા.ત. જામા મસ્જિદ માં)..."
                        title="Click to edit Janaza Place"
                        className="w-full bg-transparent border-0 border-b-2 border-[#081a2e] text-[#081a2e] font-semibold text-sm sm:text-[16px] pb-0.5 pl-1.5 outline-none focus:border-[#caa156] focus:bg-amber-500/10 transition-colors"
                      />
                    </div>
                  </div>

                  {/* 5. Kabrastan */}
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="relative w-44 sm:w-56 h-12 sm:h-[52px] shrink-0 flex items-center justify-center">
                      <img src={labelImg} alt="" className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-sm" />
                      <span className="relative z-2 text-white font-semibold text-xs sm:text-[15.5px] text-center px-3 tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                        કબ્રસ્તાન
                      </span>
                    </div>
                    <div className="flex-1 flex items-end">
                      <input
                        type="text"
                        value={cardData.kabrastan}
                        onChange={(e) => setCardData(prev => ({ ...prev, kabrastan: e.target.value }))}
                        placeholder="કબ્રસ્તાનનું નામ દાખલ કરો..."
                        title="Click to edit Kabrastan"
                        className="w-full bg-transparent border-0 border-b-2 border-[#081a2e] text-[#081a2e] font-semibold text-sm sm:text-[16px] pb-0.5 pl-1.5 outline-none focus:border-[#caa156] focus:bg-amber-500/10 transition-colors"
                      />
                    </div>
                  </div>

                  {/* 6. Mobile Number (Aligned with all other badge rows) */}
                  <div className="flex items-center gap-2.5 sm:gap-3">
                    <div className="relative w-44 sm:w-56 h-12 sm:h-[52px] shrink-0 flex items-center justify-center">
                      <img src={labelImg} alt="" className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-sm" />
                      <span className="relative z-2 text-white font-semibold text-xs sm:text-[15.5px] text-center px-3 tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                        મોબાઇલ નંબર
                      </span>
                    </div>
                    <div className="flex-1 flex items-end">
                      <input
                        type="text"
                        value={cardData.mobile}
                        onChange={(e) => setCardData(prev => ({ ...prev, mobile: e.target.value }))}
                        placeholder="મોબાઇલ નંબર દાખલ કરો..."
                        title="Click to edit Mobile number"
                        className="w-full bg-transparent border-0 border-b-2 border-[#081a2e] text-[#081a2e] font-semibold text-sm sm:text-[16px] pb-0.5 pl-1.5 outline-none focus:border-[#caa156] focus:bg-amber-500/10 transition-colors"
                      />
                    </div>
                  </div>
                </div>

                {/* Namaz Instructions Section with banner_tall.png Banner */}
                <div className="flex flex-col items-center mt-1 sm:mt-1.5">
                  <div className="relative w-full max-w-[490px] sm:max-w-[510px] h-11 sm:h-12 flex items-center justify-center">
                    <img src={bannerImg} alt="" className="absolute inset-0 w-full h-full pointer-events-none drop-shadow-sm" />
                    <span className="relative z-2 text-white font-bold text-sm sm:text-[19px] tracking-wide drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
                      જનાઝાની નમાઝનો તરીકો
                    </span>
                  </div>
                  <div className="mt-1 px-2 sm:px-3 text-center text-[10.5px] sm:text-[11.5px] font-medium text-black leading-relaxed">
                    મુક્તદી કિબ્લાની તરફ નિય્યત કરે કે: હું નિય્યત કરૂં છું આ જનાઝાની નમાઝની, ચાર તકબીર સાથે અલ્લાહ માટે, દુઆ માટે, આ મૈયત માટે, પાછળ આ ઈમામની. પછી પ્રથમ તકબીર કહી હાથ બાંધી સુરા ફાતિહા પઢે. બીજી તકબીર પછી દુરૂદે ઈબ્રાહીમ પઢે. ત્રીજી તકબીર પછી મૈયત માટે દુઆ કરે કે: "અલ્લાહુમ્મા ઈગ્ફિર લિહય્યિના વ મય્યિતિના.." ચોથી તકબીર પછી સલામ ફેરવે જમણી અને ડાબી તરફ.
                  </div>
                </div>

                {/* Footer Logo & Jamat Name */}
                <div className="flex flex-col items-center justify-center mt-1 sm:mt-1.5 gap-0.5">
                  <img src={sealImg} alt="Seal" className="w-14 sm:w-16 h-14 sm:h-16 object-contain drop-shadow" />
                  <div className="text-base sm:text-[21px] font-bold text-[#081a2e] tracking-wide">
                    {communityName}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  )
}
