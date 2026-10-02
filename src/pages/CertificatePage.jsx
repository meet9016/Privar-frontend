import React, { useRef, useState, useEffect, useCallback, useMemo, memo } from 'react'
import {
  Download,
  Save,
  Award,
  CheckCircle,
  Upload,
  X,
  FileText,
  Plus,
  Eye,
  Edit2,
  Trash2,
  Search,
  RefreshCw,
  Printer,
  Calendar,
  User,
  HeartHandshake,
  CheckSquare,
  Square,
  Check,
  Layers,
  ChevronDown
} from 'lucide-react'
import { useSearchParams } from 'react-router-dom'
import { toJpeg, getFontEmbedCSS } from 'html-to-image'
import html2canvas from 'html2canvas'
import jsPDF from 'jspdf'
import certData from '../data/certificates.json'
import memonLogo from '../assets/memon.png'
import letterpadLogo from '../assets/letterpad.png'
import letterpadBanner from '../assets/letterpad-banner.png'
import starLogo from '../assets/star.png'
import { toGujarati, toGujaratiDigits, toEnglishDigits } from '../utils/gujaratiTyping'
import api from '../lib/api'
import toast from '../lib/toast'
import { confirm } from '../lib/confirm'
import DatePicker from '../components/DatePicker'
import Table from '../components/common/Table'
import SearchInput from '../components/common/SearchInput'
import Button from '../components/common/Button'
import Checkbox from '../components/common/Checkbox'
import Modal from '../components/Modal'

/* ─── Cached Font Embed CSS for Instant PDF Generation ──────── */
let fontEmbedCSSCache = null

async function getCachedFontCSS(element) {
  return null
}

/* ─── Date & Age Utility Helpers ────────────────────────────── */
const getTodayDateParts = () => {
  const now = new Date()
  const d = String(now.getDate()).padStart(2, '0')
  const m = String(now.getMonth() + 1).padStart(2, '0')
  const y = String(now.getFullYear()).slice(-2)
  const fullYear = String(now.getFullYear())
  return {
    day: toGujaratiDigits(d),
    month: toGujaratiDigits(m),
    year: toGujaratiDigits(y),
    isoDate: `${fullYear}-${m}-${d}`,
  }
}

function partsToIsoDate(dateDay, dateMonth, dateYear) {
  if (!dateDay || !dateMonth) return ''
  const d = toEnglishDigits(String(dateDay)).padStart(2, '0')
  const m = toEnglishDigits(String(dateMonth)).padStart(2, '0')
  let y = toEnglishDigits(String(dateYear || ''))
  if (y.length === 4) {
    // Already full year
  } else if (y.length === 2) {
    y = `20${y}`
  } else {
    y = String(new Date().getFullYear())
  }
  return `${y}-${m}-${d}`
}

function dobToIsoDate(val) {
  if (!val) return ''
  const eng = toEnglishDigits(String(val)).trim()
  if (eng.includes('-')) {
    const parts = eng.split('-')
    if (parts.length === 3) {
      if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
      if (parts[2].length === 4) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
    }
  }
  if (eng.includes('/')) {
    const parts = eng.split('/')
    if (parts.length === 3) {
      if (parts[2].length === 4) return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`
      if (parts[0].length === 4) return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`
    }
  }
  return ''
}

function calculateAgeFromDate(val) {
  if (!val) return ''
  const eng = toEnglishDigits(String(val)).trim()
  let birthDate = null
  if (eng.includes('-')) {
    const parts = eng.split('-')
    if (parts.length === 3) {
      birthDate = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10))
    }
  } else if (eng.includes('/')) {
    const parts = eng.split('/')
    if (parts.length === 3) {
      birthDate = new Date(parseInt(parts[2], 10), parseInt(parts[1], 10) - 1, parseInt(parts[0], 10))
    }
  }
  if (!birthDate || isNaN(birthDate.getTime())) return ''
  const today = new Date()
  let age = today.getFullYear() - birthDate.getFullYear()
  const mDiff = today.getMonth() - birthDate.getMonth()
  if (mDiff < 0 || (mDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--
  }
  return age >= 0 ? toGujaratiDigits(String(age)) : ''
}

/* ─── Constants ─────────────────────────────────────────────── */
const SAVE_KEY = 'parivar_certificates_data'

/* ─── Default form data structure ───────────────────────────── */
const defaultData = {
  marriage: {
    number: '',
    regNumber: '',
    dateDay: '',
    dateMonth: '',
    dateYear: '',
    hijriYear: '',
    hijriMonth: '',
    nikahVenue: '',
    
    // 1. Groom (દુલ્હા)
    dulhaName: '',
    dulhaFatherName: '',
    dulhaDob: '',
    dulhaAge: '',
    dulhaAadhaar: '',
    dulhaMobile: '',
    dulhaVatan: '',
    dulhaAddress: '',
    dulhaMaritalStatus: 'પ્રથમ નિકાહ (કુવારા)',
    dulhaPhoto: '',

    // 2. Bride (દુલ્હન)
    dulhanFullName: '',
    dulhanFatherName: '',
    dulhanDob: '',
    dulhanAge: '',
    dulhanAadhaar: '',
    dulhanMobile: '',
    dulhanVatan: '',
    dulhanAddress: '',
    dulhanMaritalStatus: 'પ્રથમ નિકાહ (કુવારી)',
    dulhanPhoto: '',

    // 3. Vakil / Vali (વકીલ / વાલી)
    dulhanVakilName: '',
    dulhanVakilFather: '',
    dulhanVakilVillage: '',
    dulhanVakilAadhaar: '',
    dulhanVakilMo: '',
    dulhaValiName: '',
    dulhaValiFather: '',
    dulhaValiVillage: '',
    dulhaValiAadhaar: '',
    dulhaValiMo: '',

    // 4. Meher (મહેર)
    maherRakam: '',
    maherRakamWords: '',
    maherGoldDetails: '',
    maherGram: '',
    maherType: 'મોઅજ્જલ (નકદ / રોકડ)', // 'મોઅજ્જલ (નકદ / રોકડ)' | 'મુવજ્જલ (મુદતી / ઉધાર)'

    // 5. Witnesses (સાક્ષીઓ)
    sakshi1Name: '',
    sakshi1Father: '',
    sakshi1Village: '',
    sakshi1Aadhaar: '',
    sakshi1Mo: '',
    sakshi2Name: '',
    sakshi2Father: '',
    sakshi2Village: '',
    sakshi2Aadhaar: '',
    sakshi2Mo: '',

    // 6. Kazi (કાઝી સાહેબ)
    kaziName: '',
    kaziContact: '',
    kaziSign: '',
  },
  letterhead: {
    refNumber: '',
    date: '',
    body: '',
  },
  noc: {
    number: '',
    dateDay: '',
    dateMonth: '',
    dateYear: '',
    localJamat: '',
    muqam: '',
    taluka: '',
    jila: '',
    memberName: '',
    gram: '',
    have: '',
    jawab: '',
    rehvasi: '',
    dikraDikri: '',
    candidateDob: '',
    candidateAge: '',
    candidateAadhaar: '',
    candidateMaritalStatus: 'કુંવારા',
    apniJamatGram: '',
    apniTaluka: '',
    apniJila: '',
    apniJawab: '',
    apniRehvasi: '',
    apniDikraDikri: '',
    apniCandidateDob: '',
    apniCandidateAge: '',
    apniCandidateAadhaar: '',
    apniCandidateMaritalStatus: 'કુંવારા',
    engDateDay: '',
    engDateMonth: '',
    engDateYear: '',
    engDayName: '',
    muqamPlace: '',
    validTillDate: '',
  },
}

function sanitizeData(data) {
  if (!data) return data
  const sanitizeDigits = (val) => (val ? toGujaratiDigits(val).replace(/[^૦-૯]/g, '') : '')
  if (data.marriage) {
    if (data.marriage.number) data.marriage.number = sanitizeDigits(data.marriage.number)
    if (data.marriage.dateDay) data.marriage.dateDay = sanitizeDigits(data.marriage.dateDay).slice(0, 2)
    if (data.marriage.dateMonth) data.marriage.dateMonth = sanitizeDigits(data.marriage.dateMonth).slice(0, 2)
    if (data.marriage.dateYear) data.marriage.dateYear = sanitizeDigits(data.marriage.dateYear).slice(0, 2)
  }
  if (data.noc) {
    if (data.noc.number) data.noc.number = sanitizeDigits(data.noc.number)
    if (data.noc.dateDay) data.noc.dateDay = sanitizeDigits(data.noc.dateDay).slice(0, 2)
    if (data.noc.dateMonth) data.noc.dateMonth = sanitizeDigits(data.noc.dateMonth).slice(0, 2)
    if (data.noc.dateYear) data.noc.dateYear = sanitizeDigits(data.noc.dateYear).slice(0, 2)
  }
  return data
}

/* ─── Load/Save helpers (Exclusively DB) ─────────────────────── */
function loadSavedData() {
  const today = getTodayDateParts()
  return {
    ...defaultData,
    marriage: {
      ...defaultData.marriage,
      dateDay: today.day,
      dateMonth: today.month,
      dateYear: today.year,
    },
    noc: {
      ...defaultData.noc,
      dateDay: today.day,
      dateMonth: today.month,
      dateYear: today.year,
    },
  }
}

function sanitizeRecords(records) {
  if (!Array.isArray(records)) return []
  const seen = new Set()
  const sanitized = []
  records.forEach((r, idx) => {
    if (!r || typeof r !== 'object') return
    let id = r._id ? String(r._id) : (r.id ? String(r.id) : '')
    if (!id || seen.has(id)) {
      id = `rec_${Date.now()}_${idx}_${Math.random().toString(36).substring(2, 7)}`
    }
    seen.add(id)
    sanitized.push({ ...r, _id: id })
  })
  return sanitized
}

function loadSavedRecords() {
  return []
}

function saveData(data) {
  // No localStorage save - records are stored in MongoDB
}

async function downloadAsPDF(ref, filename, options = {}) {
  if (!ref?.current) return

  const rootElement = ref.current
  const safeFilename = filename || 'Certificate'

  // Clean elements & prepare HTML for backend PDF generation
  const guideLines = rootElement.querySelectorAll?.('.letterhead-guide-lines')
  const originalBgs = []
  if (guideLines && guideLines.length > 0) {
    guideLines.forEach((el, idx) => {
      originalBgs[idx] = el.style.backgroundImage
      el.style.backgroundImage = 'none'
    })
  }

  // Method 1: Backend Puppeteer API Generation (Primary - standard API integration)
  try {
    const clone = rootElement.cloneNode(true)
    
    // Ensure all input values from the actual live DOM are correctly mapped to attributes in the clone
    const origInputs = rootElement.querySelectorAll('input, textarea, select')
    const cloneInputs = clone.querySelectorAll('input, textarea, select')
    origInputs.forEach((origEl, i) => {
      const cloneEl = cloneInputs[i]
      if (cloneEl) {
        if (origEl.tagName === 'TEXTAREA') {
          cloneEl.textContent = origEl.value || ''
        } else if (origEl.tagName === 'INPUT') {
          cloneEl.setAttribute('value', origEl.value || '')
        } else if (origEl.tagName === 'SELECT') {
          cloneEl.setAttribute('value', origEl.value || '')
        }
      }
    })

    const response = await api.post(
      '/certificates/generate-pdf',
      { html: clone.outerHTML, filename: safeFilename, pageRanges: options.pageRanges },
      { headers: { 'Content-Type': 'application/json' }, responseType: 'blob', timeout: 35000 }
    )

    if (response.data) {
      const blob = new Blob([response.data], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `${safeFilename}.pdf`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)

      if (guideLines && guideLines.length > 0) {
        guideLines.forEach((el, idx) => {
          el.style.backgroundImage = originalBgs[idx] || ''
        })
      }
      return
    }
  } catch (backendErr) {
    console.warn('Backend PDF API call encountered issue, switching to instant client renderer:', backendErr)
  }

  // Method 2: Fast Client-side html2canvas + jsPDF Fallback
  try {
    const pageElements = rootElement.querySelectorAll('.certificate-page')
    const targets = pageElements.length > 0 ? Array.from(pageElements) : [rootElement]

    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
      compress: true,
    })

    for (let i = 0; i < targets.length; i++) {
      const element = targets[i]
      const elWidth = element.offsetWidth || 650
      const elHeight = element.offsetHeight || 920

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        logging: false,
        backgroundColor: '#ffffff',
        width: elWidth,
        height: elHeight,
      })

      const imgData = canvas.toDataURL('image/jpeg', 0.95)
      const pdfWidth = 210
      const pdfHeight = (elHeight / elWidth) * 210

      if (i > 0) {
        pdf.addPage([pdfWidth, pdfHeight], 'portrait')
      } else {
        pdf.deletePage(1)
        pdf.addPage([pdfWidth, pdfHeight], 'portrait')
      }

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST')
    }

    if (guideLines && guideLines.length > 0) {
      guideLines.forEach((el, idx) => {
        el.style.backgroundImage = originalBgs[idx] || ''
      })
    }

    pdf.save(`${safeFilename}.pdf`)
    return
  } catch (canvasErr) {
    console.warn('html2canvas method failed, trying html-to-image:', canvasErr)
  }

  // Method 3: html-to-image fallback
  try {
    const pageElements = rootElement.querySelectorAll('.certificate-page')
    const targets = pageElements.length > 0 ? Array.from(pageElements) : [rootElement]
    const fontCSS = await getCachedFontCSS(rootElement)

    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })

    for (let i = 0; i < targets.length; i++) {
      const element = targets[i]
      const elWidth = element.offsetWidth || 650
      const elHeight = element.offsetHeight || 920

      const imgData = await toJpeg(element, {
        quality: 0.95,
        pixelRatio: 2,
        fontEmbedCSS: fontCSS || undefined,
        width: elWidth,
        height: elHeight,
      })

      const pdfWidth = 210
      const pdfHeight = (elHeight / elWidth) * 210

      if (i > 0) {
        pdf.addPage([pdfWidth, pdfHeight], 'portrait')
      } else {
        pdf.deletePage(1)
        pdf.addPage([pdfWidth, pdfHeight], 'portrait')
      }

      pdf.addImage(imgData, 'JPEG', 0, 0, pdfWidth, pdfHeight)
    }

    if (guideLines && guideLines.length > 0) {
      guideLines.forEach((el, idx) => {
        el.style.backgroundImage = originalBgs[idx] || ''
      })
    }

    pdf.save(`${safeFilename}.pdf`)
  } catch (htmlToImgErr) {
    console.error('All PDF download pipelines failed:', htmlToImgErr)
    toast.error('PDF download failed. Please try again.')
  }
}

/* ─── Clean Native Input Field for Standard Form ─────────────── */
const NormalInput = memo(function NormalInput({
  label,
  value,
  onChange,
  placeholder = '',
  isNumber = false,
  isMobile = false,
  isTextarea = false,
  rows = 4,
  maxLength,
}) {
  const isMobileField = isMobile || (typeof label === 'string' && (label.includes('મોબાઈલ') || label.toLowerCase().includes('mobile') || label.includes('મો.')))

  const handleBlur = (e) => {
    const raw = e.target.value
    if (!isNumber && !isMobileField && raw && /[a-zA-Z]/.test(raw)) {
      onChange(toGujarati(raw))
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === ' ' || e.keyCode === 32) {
      const raw = e.target.value
      if (!isNumber && !isMobileField && raw && /[a-zA-Z]/.test(raw)) {
        e.preventDefault()
        const converted = toGujarati(raw) + ' '
        onChange(converted)
      }
    }
  }

  const handleChangeInput = (e) => {
    let val = e.target.value
    if (isMobileField) {
      // Allow max 10 digits for phone numbers in Gujarati or English
      val = toGujaratiDigits(val).replace(/[^૦-૯0-9]/g, '').slice(0, 10)
      onChange(val)
    } else if (isNumber) {
      val = toGujaratiDigits(val).replace(/[^૦-૯,.\s/-]/g, '')
      if (maxLength) val = val.slice(0, maxLength)
      onChange(val)
    } else {
      if (maxLength) val = val.slice(0, maxLength)
      onChange(val)
    }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', minHeight: 38, display: 'flex', alignItems: 'flex-end', lineHeight: 1.3 }}>
        {label}
      </label>
      {isTextarea ? (
        <textarea
          rows={rows}
          value={value || ''}
          onChange={handleChangeInput}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || `${label} દાખલ કરો...`}
          style={{
            border: '1.5px solid #cbd5e1',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 14,
            outline: 'none',
            background: '#fff',
            fontFamily: '"Noto Sans Gujarati", "Anek Gujarati", "Noto Sans", Arial, sans-serif',
            boxSizing: 'border-box',
            resize: 'vertical',
            width: '100%',
          }}
        />
      ) : (
        <input
          type="text"
          value={value || ''}
          onChange={handleChangeInput}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          maxLength={isMobileField ? 10 : maxLength}
          placeholder={placeholder || (isMobileField ? '૯૮XXXXXXXX (૧૦ અંક)' : `${label} દાખલ કરો...`)}
          style={{
            border: '1.5px solid #cbd5e1',
            borderRadius: 8,
            padding: '8px 12px',
            fontSize: 14,
            outline: 'none',
            background: '#fff',
            fontFamily: '"Noto Sans Gujarati", "Anek Gujarati", "Noto Sans", Arial, sans-serif',
            boxSizing: 'border-box',
            width: '100%',
            height: 38,
          }}
        />
      )}
    </div>
  )
})

/* ─── Standard Form DatePicker Field ─────────────────────────── */
const FormDatePicker = memo(function FormDatePicker({
  label,
  value,
  onChange,
  placeholder = 'તારીખ પસંદ કરો',
  disableFuture = false,
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={{ fontSize: 13, fontWeight: 700, color: '#1e293b', minHeight: 38, display: 'flex', alignItems: 'flex-end', lineHeight: 1.3 }}>
        {label}
      </label>
      <DatePicker
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disableFuture={disableFuture}
        className="w-full"
      />
    </div>
  )
})

/* ─── Fast Inline Input inside Certificate Sheet ─────────────── */
const CertInput = memo(function CertInput({
  section,
  field,
  value,
  onChange,
  placeholder = '',
  style = {},
  textAlign = 'left',
}) {
  const isDigitField = [
    'number',
    'regNumber',
    'dateDay',
    'dateMonth',
    'dateYear',
    'hijriYear',
    'dulhaAge',
    'dulhanAge',
    'dulhaMobile',
    'dulhanMobile',
    'dulhaAadhaar',
    'dulhanAadhaar',
    'dulhanVakilAadhaar',
    'dulhanVakilMo',
    'dulhaValiAadhaar',
    'dulhaValiMo',
    'maherAmount',
    'maherPaidAmount',
    'maherPendingAmount',
    'maherRakam',
    'maherGram',
    'vakilMo',
    'sakshi1Aadhaar',
    'sakshi1Mo',
    'sakshi2Aadhaar',
    'sakshi2Mo',
    'candidateAge',
    'candidateAadhaar',
    'apniCandidateAge',
    'apniCandidateAadhaar',
    'engDateDay',
    'engDateMonth',
    'engDateYear',
  ].includes(field)

  const handleBlur = (e) => {
    const raw = e.target.value
    if (isDigitField && raw) {
      onChange(section, field, toGujaratiDigits(raw))
    } else if (!isDigitField && raw && /[a-zA-Z]/.test(raw)) {
      onChange(section, field, toGujarati(raw))
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === ' ' || e.keyCode === 32) {
      const raw = e.target.value
      if (!isDigitField && raw && /[a-zA-Z]/.test(raw)) {
        e.preventDefault()
        const converted = toGujarati(raw) + ' '
        onChange(section, field, converted)
      }
    }
  }

  const handleChangeInput = (e) => {
    let val = e.target.value
    if (isDigitField) {
      if (['dateDay', 'dateMonth', 'dateYear', 'engDateDay', 'engDateMonth', 'engDateYear'].includes(field)) {
        val = toGujaratiDigits(val).replace(/[^૦-૯]/g, '').slice(0, 4)
      } else if (field === 'number' || field === 'hijriYear' || field === 'regNumber') {
        val = toGujaratiDigits(val)
      } else if (['vakilMo', 'sakshi1Mo', 'sakshi2Mo', 'dulhaMobile', 'dulhanMobile', 'dulhanVakilMo', 'dulhaValiMo'].includes(field)) {
        val = toGujaratiDigits(val).replace(/[^૦-૯]/g, '').slice(0, 10)
      } else {
        val = toGujaratiDigits(val).replace(/[^૦-૯,.\s/-]/g, '')
      }
      onChange(section, field, val)
    } else {
      onChange(section, field, val)
    }
  }

  return (
    <input
      type="text"
      value={value || ''}
      onChange={handleChangeInput}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      style={{
        width: '100%',
        height: '100%',
        border: 'none',
        outline: 'none',
        background: 'transparent',
        fontFamily: '"Noto Sans Gujarati", "Anek Gujarati", "Noto Sans", Arial, sans-serif',
        fontSize: 13,
        fontWeight: 600,
        color: '#111',
        textAlign: textAlign,
        boxSizing: 'border-box',
        lineHeight: 1.2,
        padding: '0 2px',
        margin: 0,
        verticalAlign: 'middle',
        display: 'flex',
        alignItems: 'center',
        ...style,
      }}
    />
  )
})

/* ══════════════════════════════════════════════════════════════
   NORMAL FORM BUILDER COMPONENT (CLEAN ENTRY FORM)
══════════════════════════════════════════════════════════════ */
const CertificateEntryForm = memo(function CertificateEntryForm({
  activeTab,
  formData,
  onChange,
  onSaveRecord,
  isEditing,
  saving,
  onSwitchToSheet,
}) {
  const data = formData[activeTab] || {}
  const handleField = (field, val) => onChange(activeTab, field, val)

  // Auto-initialize current date if empty for marriage, noc, or letterhead
  useEffect(() => {
    if (activeTab === 'marriage' || activeTab === 'noc') {
      if (!data.dateDay || !data.dateMonth) {
        const today = getTodayDateParts()
        if (!data.dateDay) handleField('dateDay', today.day)
        if (!data.dateMonth) handleField('dateMonth', today.month)
        if (!data.dateYear) handleField('dateYear', today.year)
      }
    } else if (activeTab === 'letterhead') {
      if (!data.date) {
        const today = getTodayDateParts()
        handleField('date', `${today.day}/${today.month}/૨૦${today.year}`)
      }
    }
  }, [activeTab, data.dateDay, data.dateMonth, data.dateYear, data.date])

  const handlePhotoFile = (field, e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => onChange(activeTab, field, event.target.result)
      reader.readAsDataURL(file)
    }
  }

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: 12,
        padding: 24,
        border: '1px solid #e2e8f0',
        boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 20,
          borderBottom: '2px solid #f1f5f9',
          paddingBottom: 14,
        }}
      >
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: '#0f172a' }}>
            📝{' '}
            {activeTab === 'marriage'
              ? 'લગ્ન પ્રમાણપત્ર ફોર્મ (Marriage Certificate Form)'
              : activeTab === 'noc'
                ? 'N.O.C. પ્રમાણપત્ર ફોર્મ (NOC Certificate Form)'
                : 'લેટરહેડ ફોર્મ (Letterhead Form)'}
          </h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: '#64748b' }}>
            નીચેની વિગતો સામાન્ય ફોર્મમાં દાખલ કરો — લાઈવ સર્ટિફિકેટમાં ઓટોમેટિક અપડેટ થઈ જશે.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={onSwitchToSheet}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              background: '#f8fafc',
              border: '1.5px solid #cbd5e1',
              color: '#334155',
              fontWeight: 700,
              fontSize: 13,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <Eye size={16} /> સર્ટિફિકેટ જુઓ (Live Sheet)
          </button>
          <button
            type="button"
            onClick={onSaveRecord}
            disabled={saving}
            style={{
              padding: '8px 20px',
              borderRadius: 8,
              background: '#16a34a',
              border: 'none',
              color: '#fff',
              fontWeight: 700,
              fontSize: 13,
              cursor: saving ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              boxShadow: '0 2px 4px rgba(22, 163, 74, 0.25)',
            }}
          >
            <Save size={16} /> {saving ? 'સેવ થાય છે...' : isEditing ? 'અપડેટ કરો (Update)' : 'ટેબલમાં સેવ કરો (Save to Table)'}
          </button>
        </div>
      </div>

      {/* ── MARRIAGE FORM ── */}
      {activeTab === 'marriage' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Section: Header / Registration & Date */}
          <div>
            <h3
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: '#1b5e20',
                margin: '0 0 10px',
                borderLeft: '4px solid #1b5e20',
                paddingLeft: 8,
              }}
            >
              📋 રજીસ્ટ્રેશન અને તારીખ (Registration & Venue)
            </h3>
            <div
              style={{
                background: '#f8fafc',
                padding: 16,
                borderRadius: 8,
                border: '1px solid #e2e8f0',
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 12,
              }}
            >
              <NormalInput
                label="નિકાહ રજીસ્ટ્રેશન નં."
                value={data.regNumber}
                onChange={(v) => handleField('regNumber', v)}
                placeholder="દા.ત. RMJ/2026/045"
                isNumber
              />
              <NormalInput
                label="જમાઅત રજીસ્ટર પાના નં."
                value={data.number}
                onChange={(v) => handleField('number', v)}
                placeholder="દા.ત. ૫૪૬"
                isNumber
              />
              <FormDatePicker
                label="તારીખ (Date)"
                value={partsToIsoDate(data.dateDay, data.dateMonth, data.dateYear) || getTodayDateParts().isoDate}
                onChange={(val) => {
                  if (!val) {
                    handleField('dateDay', '')
                    handleField('dateMonth', '')
                    handleField('dateYear', '')
                    return
                  }
                  const parts = val.split('-')
                  if (parts.length === 3) {
                    handleField('dateDay', toGujaratiDigits(parts[2]))
                    handleField('dateMonth', toGujaratiDigits(parts[1]))
                    handleField('dateYear', toGujaratiDigits(parts[0].slice(-2)))
                  }
                }}
                placeholder="તારીખ પસંદ કરો"
              />
              <NormalInput
                label="હિજરી સન"
                value={data.hijriYear}
                onChange={(v) => handleField('hijriYear', v)}
                placeholder="દા.ત. ૧૪૪૭"
                isNumber
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#1e293b' }}>હિજરી માહ (મહિનો)</label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    list="hijri-months-list"
                    value={data.hijriMonth || ''}
                    onChange={(e) => handleField('hijriMonth', e.target.value)}
                    placeholder="દા.ત. શવ્વાલ"
                    style={{
                      border: '1.5px solid #cbd5e1',
                      borderRadius: 8,
                      padding: '8px 12px',
                      fontSize: 14,
                      outline: 'none',
                      background: '#fff',
                      fontFamily: '"Noto Sans Gujarati", "Anek Gujarati", "Noto Sans", Arial, sans-serif',
                      boxSizing: 'border-box',
                      width: '100%',
                    }}
                  />
                  <datalist id="hijri-months-list">
                    <option value="મોહરમ" />
                    <option value="સફર" />
                    <option value="રબીઉલ અવ્વલ" />
                    <option value="રબીઉસ્સાની" />
                    <option value="જમાદિલ અવ્વલ" />
                    <option value="જમાદિસ્સાની" />
                    <option value="રજબ" />
                    <option value="શાબાન" />
                    <option value="રમઝાન" />
                    <option value="શવ્વાલ" />
                    <option value="ઝીલકદ" />
                    <option value="ઝીલહિજ્જ" />
                  </datalist>
                </div>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <NormalInput
                  label="નિકાહનું સ્થળ (સરનામું)"
                  value={data.nikahVenue}
                  onChange={(v) => handleField('nikahVenue', v)}
                  placeholder="દા.ત. મેમન જમાતખાના, રાધનપુર"
                />
              </div>
            </div>
          </div>

          {/* Section 1: Dulha (Groom) Details */}
          <div>
            <h3
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: '#1d4ed8',
                margin: '0 0 10px',
                borderLeft: '4px solid #1d4ed8',
                paddingLeft: 8,
              }}
            >
              🤵 ૧. દુલ્હા (વરરાજા) ની વિગત (Groom Details)
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 12,
              }}
            >
              <NormalInput
                label="દુલ્હાનું પૂરું નામ"
                value={data.dulhaName}
                onChange={(v) => handleField('dulhaName', v)}
              />
              <NormalInput
                label="પિતા / વાલીનું નામ"
                value={data.dulhaFatherName}
                onChange={(v) => handleField('dulhaFatherName', v)}
              />
              <FormDatePicker
                label="જન્મ તારીખ (DOB)"
                value={dobToIsoDate(data.dulhaDob)}
                onChange={(val) => {
                  if (!val) {
                    handleField('dulhaDob', '')
                    handleField('dulhaAge', '')
                    return
                  }
                  const parts = val.split('-')
                  if (parts.length === 3) {
                    const formatted = `${toGujaratiDigits(parts[2])}/${toGujaratiDigits(parts[1])}/${toGujaratiDigits(parts[0])}`
                    handleField('dulhaDob', formatted)
                    handleField('dulhaAge', calculateAgeFromDate(val))
                  }
                }}
                disableFuture
                placeholder="DD/MM/YYYY"
              />
              <NormalInput
                label="ઉંમર (પૂર્ણ વર્ષ)"
                value={data.dulhaAge}
                onChange={(v) => handleField('dulhaAge', v)}
                placeholder="દા.ત. 24"
                isNumber
              />
              <NormalInput
                label="આધાર કાર્ડ નંબર"
                value={data.dulhaAadhaar}
                onChange={(v) => handleField('dulhaAadhaar', v)}
                placeholder="XXXX-XXXX-XXXX"
                isNumber
              />
              <NormalInput
                label="મોબાઈલ નંબર"
                value={data.dulhaMobile}
                onChange={(v) => handleField('dulhaMobile', v)}
                placeholder="98XXXXXXXX"
              />
              <NormalInput
                label="મૂળ વતન / ગામ"
                value={data.dulhaVatan || data.dulhaVillage1}
                onChange={(v) => {
                  handleField('dulhaVatan', v);
                  handleField('dulhaVillage1', v);
                }}
              />
              <NormalInput
                label="હાલનું સરનામું"
                value={data.dulhaAddress}
                onChange={(v) => handleField('dulhaAddress', v)}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>વૈવાહિક સ્થિતિ</label>
                <select
                  value={data.dulhaMaritalStatus || 'પ્રથમ નિકાહ (કુવારા)'}
                  onChange={(e) => handleField('dulhaMaritalStatus', e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    fontSize: 14,
                    background: '#fff',
                    outline: 'none',
                  }}
                >
                  <option value="પ્રથમ નિકાહ (કુવારા)">પ્રથમ નિકાહ (કુવારા)</option>
                  <option value="તલાકશુદા">તલાકશુદા</option>
                  <option value="વિધુર">વિધુર</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 2: Dulhan (Bride) Details */}
          <div>
            <h3
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: '#b91c1c',
                margin: '0 0 10px',
                borderLeft: '4px solid #b91c1c',
                paddingLeft: 8,
              }}
            >
              👰 ૨. દુલ્હન (કન્યા) ની વિગત (Bride Details)
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 12,
              }}
            >
              <NormalInput
                label="દુલ્હનનું પૂરું નામ"
                value={data.dulhanFullName}
                onChange={(v) => handleField('dulhanFullName', v)}
              />
              <NormalInput
                label="પિતા / વાલીનું નામ"
                value={data.dulhanFatherName}
                onChange={(v) => handleField('dulhanFatherName', v)}
              />
              <FormDatePicker
                label="જન્મ તારીખ (DOB)"
                value={dobToIsoDate(data.dulhanDob)}
                onChange={(val) => {
                  if (!val) {
                    handleField('dulhanDob', '')
                    handleField('dulhanAge', '')
                    return
                  }
                  const parts = val.split('-')
                  if (parts.length === 3) {
                    const formatted = `${toGujaratiDigits(parts[2])}/${toGujaratiDigits(parts[1])}/${toGujaratiDigits(parts[0])}`
                    handleField('dulhanDob', formatted)
                    handleField('dulhanAge', calculateAgeFromDate(val))
                  }
                }}
                disableFuture
                placeholder="DD/MM/YYYY"
              />
              <NormalInput
                label="ઉંમર (પૂર્ણ વર્ષ)"
                value={data.dulhanAge}
                onChange={(v) => handleField('dulhanAge', v)}
                placeholder="દા.ત. 21"
                isNumber
              />
              <NormalInput
                label="આધાર કાર્ડ નંબર"
                value={data.dulhanAadhaar}
                onChange={(v) => handleField('dulhanAadhaar', v)}
                placeholder="XXXX-XXXX-XXXX"
                isNumber
              />
              <NormalInput
                label="મોબાઈલ નંબર"
                value={data.dulhanMobile}
                onChange={(v) => handleField('dulhanMobile', v)}
                placeholder="98XXXXXXXX"
              />
              <NormalInput
                label="મૂળ વતન / ગામ"
                value={data.dulhanVatan || data.dulhanVillage1}
                onChange={(v) => {
                  handleField('dulhanVatan', v);
                  handleField('dulhanVillage1', v);
                }}
              />
              <NormalInput
                label="હાલનું સરનામું"
                value={data.dulhanAddress}
                onChange={(v) => handleField('dulhanAddress', v)}
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>વૈવાહિક સ્થિતિ</label>
                <select
                  value={data.dulhanMaritalStatus || 'પ્રથમ નિકાહ (કુવારી)'}
                  onChange={(e) => handleField('dulhanMaritalStatus', e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    fontSize: 14,
                    background: '#fff',
                    outline: 'none',
                  }}
                >
                  <option value="પ્રથમ નિકાહ (કુવારી)">પ્રથમ નિકાહ (કુવારી)</option>
                  <option value="તલાકશુદા">તલાકશુદા</option>
                  <option value="વિધવા">વિધવા</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Photos */}
          <div>
            <h3
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: '#475569',
                margin: '0 0 10px',
                borderLeft: '4px solid #475569',
                paddingLeft: 8,
              }}
            >
              📷 પાસપોર્ટ સાઇઝ ફોટોગ્રાફ્સ (Passport Size Photos)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {/* Dulha Photo */}
              <div
                style={{
                  border: '1.5px dashed #93c5fd',
                  borderRadius: 10,
                  padding: 16,
                  textAlign: 'center',
                  background: '#f8fafc',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 180,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: '#1d4ed8' }}>🤵 દુલ્હાનો પાસપોર્ટ ફોટો</div>
                {data.dulhaPhoto ? (
                  <div style={{ position: 'relative', display: 'inline-block', width: 110, height: 138, borderRadius: 6, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', border: '1px solid #cbd5e1' }}>
                    <img
                      src={data.dulhaPhoto}
                      alt="Dulha"
                      style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#fff' }}
                    />
                    <button
                      type="button"
                      onClick={() => handleField('dulhaPhoto', '')}
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        background: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: 22,
                        height: 22,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 900,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label
                    style={{
                      display: 'inline-flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 110,
                      height: 138,
                      background: '#eff6ff',
                      border: '1.5px dashed #3b82f6',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#1d4ed8',
                      cursor: 'pointer',
                      gap: 6,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Upload size={20} />
                    <span>અપલોડ કરો</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoFile('dulhaPhoto', e)}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
              </div>

              {/* Dulhan Photo */}
              <div
                style={{
                  border: '1.5px dashed #fca5a5',
                  borderRadius: 10,
                  padding: 16,
                  textAlign: 'center',
                  background: '#f8fafc',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 180,
                }}
              >
                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10, color: '#b91c1c' }}>👰 દુલ્હનનો પાસપોર્ટ ફોટો</div>
                {data.dulhanPhoto ? (
                  <div style={{ position: 'relative', display: 'inline-block', width: 110, height: 138, borderRadius: 6, overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.12)', border: '1px solid #cbd5e1' }}>
                    <img
                      src={data.dulhanPhoto}
                      alt="Dulhan"
                      style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#fff' }}
                    />
                    <button
                      type="button"
                      onClick={() => handleField('dulhanPhoto', '')}
                      style={{
                        position: 'absolute',
                        top: 4,
                        right: 4,
                        background: '#ef4444',
                        color: '#fff',
                        border: 'none',
                        borderRadius: '50%',
                        width: 22,
                        height: 22,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 12,
                        fontWeight: 900,
                        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                      }}
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <label
                    style={{
                      display: 'inline-flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 110,
                      height: 138,
                      background: '#fff1f2',
                      border: '1.5px dashed #ef4444',
                      borderRadius: 6,
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#b91c1c',
                      cursor: 'pointer',
                      gap: 6,
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <Upload size={20} />
                    <span>અપલોડ કરો</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handlePhotoFile('dulhanPhoto', e)}
                      style={{ display: 'none' }}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Vakil / Vali Details */}
          <div>
            <h3
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: '#4338ca',
                margin: '0 0 10px',
                borderLeft: '4px solid #4338ca',
                paddingLeft: 8,
              }}
            >
              ⚖️ ૩. વકીલ / વાલીની વિગત (Vakil / Vali Details)
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 12,
              }}
            >
              <div style={{ gridColumn: '1 / -1', fontWeight: 700, color: '#b91c1c', fontSize: 13, borderBottom: '1px dashed #cbd5e1', paddingBottom: 4 }}>
                • દુલ્હનના વકીલની વિગત:
              </div>
              <NormalInput
                label="દુલ્હનના વકીલનું નામ"
                value={data.dulhanVakilName}
                onChange={(v) => handleField('dulhanVakilName', v)}
              />
              <NormalInput
                label="પિતાનું નામ"
                value={data.dulhanVakilFather}
                onChange={(v) => handleField('dulhanVakilFather', v)}
              />
              <NormalInput
                label="ગામ"
                value={data.dulhanVakilVillage || data.dulhanVillage3}
                onChange={(v) => {
                  handleField('dulhanVakilVillage', v);
                  handleField('dulhanVillage3', v);
                }}
              />
              <NormalInput
                label="આધાર કાર્ડ નં."
                value={data.dulhanVakilAadhaar}
                onChange={(v) => handleField('dulhanVakilAadhaar', v)}
              />
              <NormalInput
                label="મોબાઈલ નં."
                value={data.dulhanVakilMo || data.vakilMo}
                onChange={(v) => {
                  handleField('dulhanVakilMo', v);
                  handleField('vakilMo', v);
                }}
              />

              <div style={{ gridColumn: '1 / -1', fontWeight: 700, color: '#1d4ed8', fontSize: 13, borderBottom: '1px dashed #cbd5e1', paddingBottom: 4, marginTop: 8 }}>
                • દુલ્હાના વાલી/વકીલની વિગત:
              </div>
              <NormalInput
                label="દુલ્હાના વાલી/વકીલનું નામ"
                value={data.dulhaValiName}
                onChange={(v) => handleField('dulhaValiName', v)}
              />
              <NormalInput
                label="પિતાનું નામ"
                value={data.dulhaValiFather}
                onChange={(v) => handleField('dulhaValiFather', v)}
              />
              <NormalInput
                label="ગામ"
                value={data.dulhaValiVillage}
                onChange={(v) => handleField('dulhaValiVillage', v)}
              />
              <NormalInput
                label="આધાર કાર્ડ નં."
                value={data.dulhaValiAadhaar}
                onChange={(v) => handleField('dulhaValiAadhaar', v)}
              />
              <NormalInput
                label="મોબાઈલ નં."
                value={data.dulhaValiMo}
                onChange={(v) => handleField('dulhaValiMo', v)}
              />
            </div>
          </div>

          {/* Section 4: Maher Details */}
          <div>
            <h3
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: '#b45309',
                margin: '0 0 10px',
                borderLeft: '4px solid #b45309',
                paddingLeft: 8,
              }}
            >
              💰 ૪. મહેર (MEHER) ની વિગત
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: 12,
              }}
            >
              <NormalInput
                label="મહેરની રકમ (રૂપિયામાં)"
                value={data.maherRakam}
                onChange={(v) => handleField('maherRakam', v)}
                placeholder="દા.ત. 1,00,000/-"
              />
              <NormalInput
                label="મહેરની રકમ (શબ્દોમાં)"
                value={data.maherRakamWords}
                onChange={(v) => handleField('maherRakamWords', v)}
                placeholder="દા.ત. એક લાખ પુરા"
              />
              <NormalInput
                label="સોના/ચાંદીના દાગીના વિગત"
                value={data.maherGoldDetails}
                onChange={(v) => handleField('maherGoldDetails', v)}
                placeholder="દા.ત. સોનાનો હાર અને વીંટી"
              />
              <NormalInput
                label="વજન (ગ્રામમાં)"
                value={data.maherGram}
                onChange={(v) => handleField('maherGram', v)}
                placeholder="દા.ત. ૨૫ ગ્રામ"
              />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <label style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>મહેર ચૂકવણીનો પ્રકાર</label>
                <select
                  value={data.maherType || 'મોઅજ્જલ'}
                  onChange={(e) => handleField('maherType', e.target.value)}
                  style={{
                    padding: '8px 12px',
                    borderRadius: 6,
                    border: '1px solid #cbd5e1',
                    fontSize: 14,
                    background: '#fff',
                    outline: 'none',
                  }}
                >
                  <option value="મોઅજ્જલ">મોઅજ્જલ (નકદ / રોકડ - સ્થળ પર જ ચૂકવી આપેલ)</option>
                  <option value="મુવજ્જલ">મુવજ્જલ (મુદતી / ઉધાર - ભવિષ્યમાં માંગણી થયે ચૂકવવાપાત્ર)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section 5: Witnesses Details */}
          <div>
            <h3
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: '#0f766e',
                margin: '0 0 10px',
                borderLeft: '4px solid #0f766e',
                paddingLeft: 8,
              }}
            >
              👥 ૫. સાક્ષીઓ (ગવાહ) ની વિગત (Witnesses)
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 12,
              }}
            >
              <div style={{ gridColumn: '1 / -1', fontWeight: 700, color: '#0f766e', fontSize: 13, borderBottom: '1px dashed #cbd5e1', paddingBottom: 4 }}>
                (૧) સાક્ષી નં. ૧ :
              </div>
              <NormalInput
                label="સાક્ષી ૧ નું નામ"
                value={data.sakshi1Name}
                onChange={(v) => handleField('sakshi1Name', v)}
              />
              <NormalInput
                label="પિતાનું નામ"
                value={data.sakshi1Father}
                onChange={(v) => handleField('sakshi1Father', v)}
              />
              <NormalInput
                label="ગામ"
                value={data.sakshi1Village}
                onChange={(v) => handleField('sakshi1Village', v)}
              />
              <NormalInput
                label="આધાર કાર્ડ નં."
                value={data.sakshi1Aadhaar}
                onChange={(v) => handleField('sakshi1Aadhaar', v)}
              />
              <NormalInput
                label="મોબાઈલ નં."
                value={data.sakshi1Mo}
                onChange={(v) => handleField('sakshi1Mo', v)}
              />

              <div style={{ gridColumn: '1 / -1', fontWeight: 700, color: '#0f766e', fontSize: 13, borderBottom: '1px dashed #cbd5e1', paddingBottom: 4, marginTop: 8 }}>
                (૨) સાક્ષી નં. ૨ :
              </div>
              <NormalInput
                label="સાક્ષી ૨ નું નામ"
                value={data.sakshi2Name}
                onChange={(v) => handleField('sakshi2Name', v)}
              />
              <NormalInput
                label="પિતાનું નામ"
                value={data.sakshi2Father}
                onChange={(v) => handleField('sakshi2Father', v)}
              />
              <NormalInput
                label="ગામ"
                value={data.sakshi2Village}
                onChange={(v) => handleField('sakshi2Village', v)}
              />
              <NormalInput
                label="આધાર કાર્ડ નં."
                value={data.sakshi2Aadhaar}
                onChange={(v) => handleField('sakshi2Aadhaar', v)}
              />
              <NormalInput
                label="મોબાઈલ નં."
                value={data.sakshi2Mo}
                onChange={(v) => handleField('sakshi2Mo', v)}
              />
            </div>
          </div>

          {/* Section 6: Kazi Details */}
          <div>
            <h3
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: '#1e293b',
                margin: '0 0 10px',
                borderLeft: '4px solid #1e293b',
                paddingLeft: 8,
              }}
            >
              📜 ૬. નિકાહ પઢાવનાર કાઝી સાહેબની વિગત
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                gap: 12,
              }}
            >
              <NormalInput
                label="કાઝી સાહેબનું નામ"
                value={data.kaziName}
                onChange={(v) => handleField('kaziName', v)}
                placeholder="દા.ત. મૌલાના મોહમ્મદ સાહેબ"
              />
              <NormalInput
                label="સરનામું / મોબાઈલ નં."
                value={data.kaziContact || data.kaziSign}
                onChange={(v) => {
                  handleField('kaziContact', v);
                  handleField('kaziSign', v);
                }}
                placeholder="દા.ત. જુમ્મા મસ્જિદ પાસે, રાધનપુર / 98XXXXXXXX"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── NOC FORM ── */}
      {activeTab === 'noc' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div
            style={{
              background: '#f8fafc',
              padding: 16,
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: 12,
            }}
          >
            <NormalInput
              label="NOC નંબર (No.)"
              value={data.number}
              onChange={(v) => handleField('number', v)}
              isNumber
              placeholder="દા.ત. 501"
            />
            <FormDatePicker
              label="તારીખ (Date)"
              value={partsToIsoDate(data.dateDay, data.dateMonth, data.dateYear) || getTodayDateParts().isoDate}
              onChange={(val) => {
                if (!val) {
                  handleField('dateDay', '')
                  handleField('dateMonth', '')
                  handleField('dateYear', '')
                  return
                }
                const parts = val.split('-')
                if (parts.length === 3) {
                  handleField('dateDay', toGujaratiDigits(parts[2]))
                  handleField('dateMonth', toGujaratiDigits(parts[1]))
                  handleField('dateYear', toGujaratiDigits(parts[0].slice(-2)))
                }
              }}
              placeholder="તારીખ પસંદ કરો"
            />
          </div>

          <div>
            <h3
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: '#b91c1c',
                margin: '0 0 10px',
                borderLeft: '4px solid #b91c1c',
                paddingLeft: 8,
              }}
            >
              📍 લોકલ જમાત & સભ્ય વિગતો (First Party Details)
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 12,
              }}
            >
              <NormalInput
                label="સ્થાનિક મેમન જમાઅત"
                value={data.localJamat}
                onChange={(v) => handleField('localJamat', v)}
                placeholder="દા.ત. પાટણ"
              />
              <NormalInput
                label="મુકામ"
                value={data.muqam}
                onChange={(v) => handleField('muqam', v)}
              />
              <NormalInput
                label="તાલુકો"
                value={data.taluka}
                onChange={(v) => handleField('taluka', v)}
              />
              <NormalInput
                label="જીલ્લો"
                value={data.jila}
                onChange={(v) => handleField('jila', v)}
              />
              <NormalInput
                label="ગામ"
                value={data.gram}
                onChange={(v) => handleField('gram', v)}
              />
              <NormalInput
                label="હાલે"
                value={data.have}
                onChange={(v) => handleField('have', v)}
              />
              <NormalInput
                label="જનાબ (સભ્યનું નામ)"
                value={data.memberName}
                onChange={(v) => handleField('memberName', v)}
              />
              <NormalInput
                label="રહેવાસી"
                value={data.rehvasi}
                onChange={(v) => handleField('rehvasi', v)}
              />
              <NormalInput
                label="દીકરા / દીકરીનું નામ"
                value={data.dikraDikri}
                onChange={(v) => handleField('dikraDikri', v)}
              />
              <FormDatePicker
                label="જન્મ તારીખ (DOB)"
                value={dobToIsoDate(data.candidateDob)}
                onChange={(val) => {
                  if (!val) {
                    handleField('candidateDob', '')
                    handleField('candidateAge', '')
                    return
                  }
                  const parts = val.split('-')
                  if (parts.length === 3) {
                    const formatted = `${toGujaratiDigits(parts[2])}/${toGujaratiDigits(parts[1])}/${toGujaratiDigits(parts[0])}`
                    handleField('candidateDob', formatted)
                    handleField('candidateAge', calculateAgeFromDate(val))
                  }
                }}
                disableFuture
                placeholder="DD/MM/YYYY"
              />
              <NormalInput
                label="ઉંમર (Age)"
                value={data.candidateAge}
                onChange={(v) => handleField('candidateAge', v)}
                isNumber
                placeholder="દા.ત. 24"
              />
              <NormalInput
                label="આધાર કાર્ડ નંબર (Aadhaar)"
                value={data.candidateAadhaar}
                onChange={(v) => handleField('candidateAadhaar', v)}
                placeholder="XXXX XXXX XXXX"
              />
              <NormalInput
                label="વૈવાહિક દરજ્જો (Marital Status)"
                value={data.candidateMaritalStatus}
                onChange={(v) => handleField('candidateMaritalStatus', v)}
                placeholder="કુંવારા / પુનર્લગ્ન"
              />
            </div>
          </div>

          <div>
            <h3
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: '#1d4ed8',
                margin: '0 0 10px',
                borderLeft: '4px solid #1d4ed8',
                paddingLeft: 8,
              }}
            >
              🤝 આપણી જમાત વિગત (Second Party Details)
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: 12,
              }}
            >
              <NormalInput
                label="આપણી જમાત મુકામ/ગામ"
                value={data.apniJamatGram}
                onChange={(v) => handleField('apniJamatGram', v)}
              />
              <NormalInput
                label="તાલુકો"
                value={data.apniTaluka}
                onChange={(v) => handleField('apniTaluka', v)}
              />
              <NormalInput
                label="જીલ્લો"
                value={data.apniJila}
                onChange={(v) => handleField('apniJila', v)}
              />
              <NormalInput
                label="જનાબનું નામ"
                value={data.apniJawab}
                onChange={(v) => handleField('apniJawab', v)}
              />
              <NormalInput
                label="રહેવાસી"
                value={data.apniRehvasi}
                onChange={(v) => handleField('apniRehvasi', v)}
              />
              <NormalInput
                label="સામા પક્ષના દીકરા / દીકરીનું નામ"
                value={data.apniDikraDikri}
                onChange={(v) => handleField('apniDikraDikri', v)}
              />
              <FormDatePicker
                label="સામા પક્ષ જન્મ તારીખ (DOB)"
                value={dobToIsoDate(data.apniCandidateDob)}
                onChange={(val) => {
                  if (!val) {
                    handleField('apniCandidateDob', '')
                    handleField('apniCandidateAge', '')
                    return
                  }
                  const parts = val.split('-')
                  if (parts.length === 3) {
                    const formatted = `${toGujaratiDigits(parts[2])}/${toGujaratiDigits(parts[1])}/${toGujaratiDigits(parts[0])}`
                    handleField('apniCandidateDob', formatted)
                    handleField('apniCandidateAge', calculateAgeFromDate(val))
                  }
                }}
                disableFuture
                placeholder="DD/MM/YYYY"
              />
              <NormalInput
                label="સામા પક્ષ ઉંમર (Age)"
                value={data.apniCandidateAge}
                onChange={(v) => handleField('apniCandidateAge', v)}
                isNumber
                placeholder="દા.ત. 22"
              />
              <NormalInput
                label="સામા પક્ષ આધાર કાર્ડ (Aadhaar)"
                value={data.apniCandidateAadhaar}
                onChange={(v) => handleField('apniCandidateAadhaar', v)}
                placeholder="XXXX XXXX XXXX"
              />
              <NormalInput
                label="સામા પક્ષ વૈવાહિક દરજ્જો"
                value={data.apniCandidateMaritalStatus}
                onChange={(v) => handleField('apniCandidateMaritalStatus', v)}
                placeholder="કુંવારા / પુનર્લગ્ન"
              />
            </div>
          </div>

          <div>
            <h3
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: '#15803d',
                margin: '0 0 10px',
                borderLeft: '4px solid #15803d',
                paddingLeft: 8,
              }}
            >
              📅 પ્રોગ્રામ તારીખ & સ્થળ (Program Details)
            </h3>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                gap: 12,
              }}
            >
              <FormDatePicker
                label="પ્રોગ્રામ તારીખ (Program Date)"
                value={partsToIsoDate(data.engDateDay, data.engDateMonth, data.engDateYear) || ''}
                onChange={(val) => {
                  if (!val) {
                    handleField('engDateDay', '')
                    handleField('engDateMonth', '')
                    handleField('engDateYear', '')
                    handleField('engDayName', '')
                    return
                  }
                  const parts = val.split('-')
                  if (parts.length === 3) {
                    handleField('engDateDay', toGujaratiDigits(parts[2]))
                    handleField('engDateMonth', toGujaratiDigits(parts[1]))
                    handleField('engDateYear', toGujaratiDigits(parts[0].slice(-2)))
                    // Auto calculate day of week in Gujarati if not already manually set
                    const dayIdx = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10)).getDay()
                    const daysGuj = ['રવિવાર', 'સોમવાર', 'મંગળવાર', 'બુધવાર', 'ગુરુવાર', 'શુક્રવાર', 'શનિવાર']
                    if (!isNaN(dayIdx) && daysGuj[dayIdx]) {
                      handleField('engDayName', daysGuj[dayIdx])
                    }
                  }
                }}
                placeholder="તારીખ પસંદ કરો"
              />
              <NormalInput
                label="વાર (Day Name)"
                value={data.engDayName}
                onChange={(v) => handleField('engDayName', v)}
                placeholder="દા.ત. રવિવાર"
              />
              <NormalInput
                label="મુકામ સ્થળ"
                value={data.muqamPlace}
                onChange={(v) => handleField('muqamPlace', v)}
              />
              <NormalInput
                label="માન્યતા તારીખ (Validity Till Date)"
                value={data.validTillDate}
                onChange={(v) => handleField('validTillDate', v)}
                placeholder="લગ્નની તારીખ સુધી"
              />
            </div>
          </div>
        </div>
      )}

      {/* ── LETTERHEAD FORM ── */}
      {activeTab === 'letterhead' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
              gap: 12,
            }}
          >
            <NormalInput
              label="જાવક નંબર (Ref. Number)"
              value={data.refNumber}
              onChange={(v) => handleField('refNumber', v)}
              placeholder="દા.ત. RMJ/2024/045"
            />
            <FormDatePicker
              label="તારીખ (Date)"
              value={dobToIsoDate(data.date) || getTodayDateParts().isoDate}
              onChange={(val) => {
                if (!val) {
                  handleField('date', '')
                  return
                }
                const parts = val.split('-')
                if (parts.length === 3) {
                  handleField('date', `${toGujaratiDigits(parts[2])}/${toGujaratiDigits(parts[1])}/${toGujaratiDigits(parts[0])}`)
                }
              }}
              placeholder="તારીખ પસંદ કરો"
            />
          </div>
          <NormalInput
            label="પત્રનું લખાણ / વિગત (Letter Body)"
            value={data.body}
            onChange={(v) => handleField('body', v)}
            isTextarea
            rows={10}
            placeholder="અહીં પત્રનું સમગ્ર લખાણ ટાઇપ કરો..."
          />
        </div>
      )}
    </div>
  )
})

/* ══════════════════════════════════════════════════════════════
   SAVED RECORDS HISTORY TABLE COMPONENT (WITH CHECKBOXES & BULK ACTIONS)
══════════════════════════════════════════════════════════════ */
const RecordsHistoryTable = memo(function RecordsHistoryTable({
  records,
  activeTab,
  onEditRecord,
  onDeleteRecord,
  onDeleteMultipleRecords,
  onViewRecord,
  onDownloadRecord,
  onBulkDownloadRecords,
  onAddNew,
  downloadingId,
  loading,
}) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedIds, setSelectedIds] = useState([])
  const [bulkDownloading, setBulkDownloading] = useState(false)

  const safeList = Array.isArray(records) ? records.filter(Boolean) : []

  const filtered = safeList.filter((r) => {
    if (!r || r.type !== activeTab) return false
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase().trim()
    const certNo = String(r.certificateNumber || '').toLowerCase()
    const pName = String(r.primaryName || '').toLowerCase()
    const sName = String(r.secondaryName || '').toLowerCase()
    const iDate = String(r.issuedDate || '').toLowerCase()
    return certNo.includes(term) || pName.includes(term) || sName.includes(term) || iDate.includes(term)
  })

  // Sync selectedIds with filtered records to avoid dangling states
  useEffect(() => {
    setSelectedIds((prev) => {
      const visibleIds = new Set(filtered.map((r, idx) => String(r._id || `rec_${idx}`)))
      const stillVisible = prev.filter((id) => visibleIds.has(id))
      return stillVisible.length === prev.length ? prev : stillVisible
    })
  }, [filtered])

  // Select all toggler
  const allVisibleIds = filtered.map((r, idx) => String(r._id || `rec_${idx}`))
  const isAllSelected = allVisibleIds.length > 0 && allVisibleIds.every((id) => selectedIds.includes(id))
  const isSomeSelected = selectedIds.length > 0 && !isAllSelected

  const handleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds([])
    } else {
      setSelectedIds(allVisibleIds)
    }
  }

  const handleToggleRow = (id) => {
    const strId = String(id)
    setSelectedIds((prev) =>
      prev.includes(strId) ? prev.filter((item) => item !== strId) : [...prev, strId]
    )
  }

  const formatRecordDate = (row) => {
    if (row.issuedDate) return String(row.issuedDate)
    if (row.createdAt) {
      try {
        const d = new Date(row.createdAt)
        if (!isNaN(d.getTime())) {
          return d.toLocaleDateString('en-GB')
        }
      } catch (_) { }
    }
    return '—'
  }

  const getPrimaryHeader = () => {
    if (activeTab === 'marriage') return 'GROOM NAME'
    if (activeTab === 'noc') return 'APPLICANT NAME'
    return 'SUBJECT / REF'
  }

  const getSecondaryHeader = () => {
    if (activeTab === 'marriage') return 'BRIDE NAME'
    if (activeTab === 'noc') return 'CHILD / PARTY NAME'
    return 'PURPOSE'
  }

  const getCertificateBadgeName = () => {
    if (activeTab === 'marriage') return 'Marriage Certificate'
    if (activeTab === 'noc') return 'NOC Certificate'
    return 'Letterhead'
  }

  const handleBulkDownload = async () => {
    if (selectedIds.length === 0) return
    const selectedRecords = filtered.filter((r, idx) => selectedIds.includes(String(r._id || `rec_${idx}`)))
    if (onBulkDownloadRecords) {
      setBulkDownloading(true)
      try {
        await onBulkDownloadRecords(selectedRecords)
      } finally {
        setBulkDownloading(false)
      }
    }
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    const isConfirmed = await confirm(
      `Are you sure you want to delete ${selectedIds.length} selected certificate record(s)? This action cannot be undone.`,
      { confirmText: 'Delete Selected', type: 'danger' }
    )
    if (isConfirmed) {
      if (onDeleteMultipleRecords) {
        onDeleteMultipleRecords(selectedIds)
        setSelectedIds([])
      }
    }
  }

  return (
    <div className="space-y-4 text-text">
      {/* Bulk Selection Action Toolbar */}
      {selectedIds.length > 0 && (
        <div className="flex items-center justify-between bg-primary/10 border border-primary/20 p-3 rounded-xl gap-3 flex-wrap animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-primary" />
            <span className="font-bold text-text text-sm">
              {selectedIds.length} certificate(s) selected
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              onClick={handleBulkDownload}
              disabled={bulkDownloading}
              variant="primary"
              size="sm"
              icon={<Download className="w-4 h-4" />}
            >
              {bulkDownloading ? 'Downloading...' : `Download PDF (${selectedIds.length})`}
            </Button>

            <Button
              onClick={handleBulkDelete}
              variant="danger"
              size="sm"
              icon={<Trash2 className="w-4 h-4" />}
            >
              Delete Selected
            </Button>

            <Button
              onClick={() => setSelectedIds([])}
              variant="outline"
              size="sm"
            >
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      {/* Main Table Container */}
      <div className="bg-white border border-border rounded-2xl overflow-hidden shadow-glass-sm flex flex-col min-h-[400px]">
        <div className="flex-1 overflow-x-auto overflow-y-auto custom-scrollbar">
          <table className="w-full min-w-full text-left border-collapse table-auto bg-white">
            <thead className="sticky top-0 z-20 shadow-sm">
              <tr className="border-b border-primary/20 text-text text-xs uppercase tracking-wider font-bold bg-white">
                <th className="pl-4 pr-2 py-3.5 w-10 text-center bg-white">
                  <div className="flex items-center justify-center">
                    <Checkbox
                      checked={isAllSelected}
                      indeterminate={isSomeSelected}
                      onChange={handleSelectAll}
                      title="Select / Unselect All"
                    />
                  </div>
                </th>
                <th className="px-3 py-3.5 bg-white whitespace-nowrap">
                  {activeTab === 'marriage' ? 'નિકાહ રજીસ્ટ્રેશન નં.' : activeTab === 'noc' ? 'NOC નં.' : 'જાવક ક્રમાંક (REF)'}
                </th>
                {activeTab === 'marriage' && (
                  <th className="px-3 py-3.5 bg-white whitespace-nowrap">જમાઅત રજીસ્ટર પાના નં.</th>
                )}
                <th className="px-3 py-3.5 bg-white whitespace-nowrap">તારીખ (DATE)</th>
                {activeTab === 'marriage' && (
                  <>
                    <th className="px-3 py-3.5 bg-white whitespace-nowrap">હિજરી સન</th>
                    <th className="px-3 py-3.5 bg-white whitespace-nowrap">હિજરી માહ (મહિનો)</th>
                  </>
                )}
                <th className="px-3 py-3.5 bg-white">{getPrimaryHeader()}</th>
                <th className="px-3 py-3.5 bg-white">{getSecondaryHeader()}</th>
                <th className="pl-3 pr-4 py-3.5 text-right bg-white">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border bg-white transition-opacity duration-200">
              {loading && filtered.length === 0 ? (
                <>
                  {[1, 2, 3].map((i) => (
                    <tr key={i} className="animate-pulse">
                      <td className="pl-4 pr-2 py-4 text-center">
                        <div className="w-4 h-4 bg-slate-200 rounded mx-auto" />
                      </td>
                      <td className="px-3 py-4">
                        <div className="h-4 bg-slate-200 rounded w-20" />
                      </td>
                      {activeTab === 'marriage' && (
                        <td className="px-3 py-4">
                          <div className="h-4 bg-slate-200 rounded w-16" />
                        </td>
                      )}
                      <td className="px-3 py-4">
                        <div className="h-4 bg-slate-200 rounded w-20" />
                      </td>
                      {activeTab === 'marriage' && (
                        <>
                          <td className="px-3 py-4">
                            <div className="h-4 bg-slate-200 rounded w-14" />
                          </td>
                          <td className="px-3 py-4">
                            <div className="h-4 bg-slate-200 rounded w-16" />
                          </td>
                        </>
                      )}
                      <td className="px-3 py-4">
                        <div className="h-4 bg-slate-200 rounded w-32" />
                      </td>
                      <td className="px-3 py-4">
                        <div className="h-4 bg-slate-200 rounded w-28" />
                      </td>
                      <td className="pl-3 pr-4 py-4 text-right">
                        <div className="h-7 bg-slate-200 rounded w-20 ml-auto" />
                      </td>
                    </tr>
                  ))}
                </>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={activeTab === 'marriage' ? 8 : 6} className="py-20 text-center">
                    <div className="inline-flex flex-col items-center justify-center gap-3 p-6 rounded-2xl bg-surface-secondary/40 border border-border">
                      <FileText className="w-10 h-10 text-text-secondary/50" />
                      <div className="font-semibold text-text text-sm">
                        No {getCertificateBadgeName()} records found
                      </div>
                      <p className="text-xs text-text-secondary max-w-xs">
                        {searchTerm ? 'No records match your search criteria.' : 'Click "+ Add Certificate" above to create and save your first record.'}
                      </p>
                      <Button
                        onClick={onAddNew}
                        variant="primary"
                        size="sm"
                        icon={<Plus className="w-4 h-4" />}
                      >
                        Add {getCertificateBadgeName()}
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                filtered.map((row, idx) => {
                  const rowId = String(row._id || `rec_${idx}`)
                  const isSelected = selectedIds.includes(rowId)
                  const isThisDownloading = downloadingId === rowId
                  const d = row.data || {}
                  
                  // Extract certificate details
                  const regNo = activeTab === 'marriage'
                    ? (d.number || row.certificateNumber || '—')
                    : (d.regNumber || row.certificateNumber || d.number || d.refNumber || '—')
                  const pageNo = d.regNumber || d.pageNumber || '—'
                  const hijriYear = d.hijriYear || '—'
                  const hijriMonth = d.hijriMonth || '—'

                  return (
                    <tr
                      key={rowId}
                      className={`hover:bg-surface-secondary/50 transition-colors ${
                        isSelected ? 'bg-primary/5' : ''
                      }`}
                    >
                      <td className="pl-4 pr-2 py-3.5 text-center">
                        <div className="flex items-center justify-center">
                          <Checkbox
                            checked={isSelected}
                            onChange={() => handleToggleRow(rowId)}
                          />
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-sm font-bold text-text whitespace-nowrap">
                        <span className="px-2.5 py-1 rounded-md bg-primary/10 text-primary font-mono text-xs border border-primary/20 font-bold">
                          {regNo}
                        </span>
                      </td>
                      {activeTab === 'marriage' && (
                        <td className="px-3 py-3.5 text-sm font-semibold text-text whitespace-nowrap">
                          <span className="px-2 py-0.5 rounded bg-surface-secondary text-text font-mono text-xs border border-border">
                            {pageNo}
                          </span>
                        </td>
                      )}
                      <td className="px-3 py-3.5 text-xs text-text font-medium whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-text-secondary" />
                          <span>{formatRecordDate(row)}</span>
                        </div>
                      </td>
                      {activeTab === 'marriage' && (
                        <>
                          <td className="px-3 py-3.5 text-xs text-text font-medium whitespace-nowrap">
                            <span className="font-mono">{hijriYear}</span>
                          </td>
                          <td className="px-3 py-3.5 text-xs text-text-secondary font-medium whitespace-nowrap">
                            {hijriMonth}
                          </td>
                        </>
                      )}
                      <td className="px-3 py-3.5 text-sm font-semibold text-text">
                        <div className="flex items-center gap-2">
                          <User className="w-3.5 h-3.5 text-text-secondary shrink-0" />
                          <span className="truncate max-w-[180px] font-medium">{row.primaryName || d.dulhaName || d.memberName || d.refNumber || '—'}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-sm text-text-secondary">
                        <span className="truncate max-w-[180px] block font-medium">{row.secondaryName || d.dulhanFullName || d.dikraDikri || d.letterTitle || '—'}</span>
                      </td>
                      <td className="pl-3 pr-4 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => onViewRecord(row)}
                            title="Preview Certificate Sheet"
                            className="p-1.5 rounded-lg transition-all border text-primary bg-primary/10 hover:bg-primary/20 border-primary/20 cursor-pointer"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDownloadRecord(row)}
                            disabled={isThisDownloading}
                            title="Download PDF"
                            className="p-1.5 rounded-lg transition-all border text-amber-600 bg-amber-500/10 hover:bg-amber-500/20 border-amber-500/20 cursor-pointer disabled:opacity-50"
                          >
                            <Download className={`w-3.5 h-3.5 ${isThisDownloading ? 'animate-bounce text-amber-600' : ''}`} />
                          </button>

                          <button
                            type="button"
                            onClick={() => onEditRecord(row)}
                            title="Edit Details"
                            className="p-1.5 rounded-lg transition-all border text-sky-600 bg-sky-500/10 hover:bg-sky-500/20 border-sky-500/20 cursor-pointer"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>

                          <button
                            type="button"
                            onClick={() => onDeleteRecord(row._id)}
                            title="Delete Record"
                            className="p-1.5 rounded-lg transition-all border text-error-text bg-error-bg hover:bg-error/20 border-error-border cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer with Total Count */}
        <div className="flex items-center justify-between px-6 py-3 border-t border-border bg-white text-xs text-text-secondary">
          <div>
            Showing <span className="font-semibold text-text">{filtered.length}</span> of{' '}
            <span className="font-semibold text-text">{filtered.length}</span> records
          </div>
          <div className="text-right">
            {selectedIds.length > 0 ? (
              <span className="text-primary font-semibold">{selectedIds.length} selected</span>
            ) : (
              <span>Page 1 of 1</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
})

/* ══════════════════════════════════════════════════════════════
   1:1 EXACT VISUAL REPLICA MARRIAGE CERTIFICATE COMPONENT (PREMIUM ROYAL DESIGN)
══════════════════════════════════════════════════════════════ */
const MarriageCertificateSheet = memo(function MarriageCertificateSheet({
  data,
  onChange,
  printRef,
}) {
  const m = certData.marriage
  const fileBrideRef = useRef(null)
  const fileGroomRef = useRef(null)

  const handlePhotoUpload = (field, e) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => onChange('marriage', field, event.target.result)
      reader.readAsDataURL(file)
    }
  }

  // Section title badge with elegant light pastel background and rich border/text colors
  const sectionTitle = (num, titleGuj, bg = '#eff6ff', borderColor = '#bfdbfe', textColor = '#1e40af', numBg = '#dbeafe', numColor = '#1e40af') => (
    <div
      style={{
        background: bg,
        color: textColor,
        border: `1px solid ${borderColor}`,
        padding: '0 8px',
        borderRadius: 4,
        fontSize: 12.5,
        fontWeight: 900,
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        marginBottom: 4,
        height: 27,
        lineHeight: 1,
      }}
    >
      <span style={{
        background: numBg,
        color: numColor,
        border: `1px solid ${borderColor}`,
        padding: '0 6px',
        borderRadius: 3,
        fontSize: 11.5,
        fontWeight: 900,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: 19,
        lineHeight: 1,
      }}>
        {num}
      </span>
      <span style={{ display: 'inline-flex', alignItems: 'center', lineHeight: 1 }}>{titleGuj}</span>
    </div>
  )

  // Underline input row helper
  const underField = (field, flex = 1, width = 'auto', textAlign = 'left', placeholder = '') => (
    <div
      style={{
        flex: flex !== null ? flex : undefined,
        width: width !== 'auto' ? width : undefined,
        minWidth: width !== 'auto' ? width : 50,
        borderBottom: '1.2px solid #555',
        height: 22,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: textAlign === 'center' ? 'center' : 'flex-start',
        padding: '0 4px',
        boxSizing: 'border-box',
        verticalAlign: 'middle',
      }}
    >
      <CertInput
        section="marriage"
        field={field}
        value={data[field]}
        onChange={onChange}
        textAlign={textAlign}
        placeholder={placeholder}
        style={{ fontSize: 12.5, fontWeight: 600, color: '#111', padding: 0 }}
      />
    </div>
  )

  return (
    <div
      ref={printRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 28,
        alignItems: 'center',
        width: '100%',
      }}
    >
      {/* ══════════════════════════════════════════════════════════════
         PAGE 1 : નિકાહ નામા — પક્ષકારો અને મહેર વિગત
      ══════════════════════════════════════════════════════════════ */}
      <div
        className="certificate-page"
        style={{
          width: 650,
          maxWidth: 650,
          minWidth: 650,
          margin: '0 auto',
          fontFamily: '"Noto Sans Gujarati", "Anek Gujarati", "Noto Sans", Arial, sans-serif',
          background: 'linear-gradient(160deg, #f0f9ee 0%, #e8f5e2 60%, #f5fbf0 100%)',
          border: '3px solid #1b5e20',
          borderRadius: 6,
          padding: '5px',
          boxSizing: 'border-box',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 6px 28px rgba(27,94,32,0.18), 0 2px 6px rgba(0,0,0,0.10), inset 0 0 0 1.5px rgba(27,94,32,0.12)',
        }}
      >
        {/* Premium Inner Border Frame */}
        <div style={{
          border: '1.5px solid #2e7d32',
          borderRadius: 3,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '9px 10px 8px',
          position: 'relative',
        }}>
        {/* Corner Ornaments */}
        {[['0','0','border-top','border-left'],['0','auto','border-top','border-right'],['auto','0','border-bottom','border-left'],['auto','auto','border-bottom','border-right']].map(([t,r,b1,b2],i)=>(
          <div key={i} style={{ position:'absolute', top:t!=='auto'?4:undefined, right:r!=='auto'?4:undefined, bottom:t==='auto'?4:undefined, left:r==='auto'?4:undefined, width:14, height:14, borderTop: i<2?'2.5px solid #1b5e20':undefined, borderBottom: i>=2?'2.5px solid #1b5e20':undefined, borderLeft: r==='auto'?'2.5px solid #1b5e20':undefined, borderRight: r!=='auto'?'2.5px solid #1b5e20':undefined, pointerEvents:'none', zIndex:2 }} />
        ))}
        {/* ── MAIN CONTENT PAGE 1 ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6, padding: '0 2px' }}>
          {/* 1. Header: Logos + Title + Address */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, padding: '0 4px' }}>
              <div style={{ width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <img src={letterpadLogo} alt="RMJ" style={{ width: '100%', height: '100%', objectFit: 'contain' }} crossOrigin="anonymous" />
              </div>

              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ color: '#d31515', fontWeight: 900, fontSize: 12, letterSpacing: 1.5 }}>
                  ★ બિસ્મિહી તઆલા ★
                </div>
                <div
                  style={{
                    fontFamily: '"Anek Gujarati", "Noto Sans Gujarati", sans-serif',
                    fontSize: 27,
                    fontWeight: 900,
                    color: '#ffffff',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.2,
                    marginTop: 1,
                    textShadow: `
                      -2px -2px 0 #0f4614,
                       0px -2px 0 #0f4614,
                       2px -2px 0 #0f4614,
                      -2px  0px 0 #0f4614,
                       2px  0px 0 #0f4614,
                      -2px  2px 0 #0f4614,
                       0px  2px 0 #0f4614,
                       2px  2px 0 #0f4614,
                       3px  4px 4px rgba(0,0,0,0.6)
                    `,
                  }}
                >
                  {m.communityName}
                </div>
                <div style={{ fontSize: 10, fontWeight: 900, color: '#111', marginTop: 1 }}>{m.trustLine}</div>
              </div>

              <div style={{ width: 72, height: 72, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <img src={letterpadLogo} alt="RMJ" style={{ width: '100%', height: '100%', objectFit: 'contain' }} crossOrigin="anonymous" />
              </div>
            </div>

            {/* Clean Address Line (No Badge) */}
            <div
              style={{
                textAlign: 'center',
                color: '#b71c1c',
                fontSize: 11.5,
                fontWeight: 900,
                marginTop: 3,
                marginBottom: 4,
                borderBottom: '1px solid #e0e0e0',
                paddingBottom: 4,
                letterSpacing: 0.3,
                whiteSpace: 'nowrap',
              }}
            >
              {m.address}
            </div>
          </div>

          {/* Royal Ornamental Certificate Title (Text Only, No Square Box, No Background) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              margin: '5px 0 6px',
            }}
          >
            {/* Left Heraldic Wing */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 45, height: 1.5, background: 'linear-gradient(90deg, transparent, #800000)' }} />
              <span style={{ color: '#d97706', fontSize: 13, lineHeight: 1 }}>❖</span>
              <div style={{ width: 18, height: 2, background: '#800000', borderRadius: 1 }} />
            </div>

            {/* Title Text Only */}
            <span
              style={{
                color: '#800000',
                fontWeight: 900,
                fontSize: 18,
                fontFamily: '"Noto Sans Gujarati", "Anek Gujarati", sans-serif',
                letterSpacing: 0.8,
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
              }}
            >
              નિકાહ નામા / MARRIAGE CERTIFICATE
            </span>

            {/* Right Heraldic Wing */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 18, height: 2, background: '#800000', borderRadius: 1 }} />
              <span style={{ color: '#d97706', fontSize: 13, lineHeight: 1 }}>❖</span>
              <div style={{ width: 45, height: 1.5, background: 'linear-gradient(90deg, #800000, transparent)' }} />
            </div>
          </div>

          {/* Registration, Date, Hijri & Venue Bar */}
          <div style={{ background: '#ffffff', border: '1.5px solid #2e7d32', borderRadius: 6, padding: '6px 10px', fontSize: 12, display: 'flex', flexDirection: 'column', gap: 4, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <strong style={{ color: '#0d2366', display: 'flex', alignItems: 'center' }}>નિકાહ રજીસ્ટ્રેશન નં.:</strong>
                {underField('number', null, '110px')}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <strong style={{ color: '#0d2366', display: 'inline-flex', alignItems: 'center', height: 22, fontSize: 12 }}>તારીખ (ઈ.સ.):</strong>
                <div style={{ width: 28, borderBottom: '1.2px solid #555', height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CertInput section="marriage" field="dateDay" value={data.dateDay} onChange={onChange} textAlign="center" placeholder="DD" style={{ fontSize: 12.5, fontWeight: 600, height: '100%' }} />
                </div>
                <span style={{ fontWeight: 800, fontSize: 13, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 22, lineHeight: '22px' }}>/</span>
                <div style={{ width: 28, borderBottom: '1.2px solid #555', height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CertInput section="marriage" field="dateMonth" value={data.dateMonth} onChange={onChange} textAlign="center" placeholder="MM" style={{ fontSize: 12.5, fontWeight: 600, height: '100%' }} />
                </div>
                <span style={{ fontWeight: 800, fontSize: 13, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 22, lineHeight: '22px' }}>/</span>
                <div style={{ width: 44, borderBottom: '1.2px solid #555', height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <input
                    type="text"
                    value={data.dateYear ? (data.dateYear.length === 2 ? `૨૦${data.dateYear}` : data.dateYear) : ''}
                    onChange={(e) => {
                      const v = toGujaratiDigits(e.target.value).replace(/[^૦-૯]/g, '').slice(0, 4)
                      // store 4 digits or 2 digits consistently
                      onChange('marriage', 'dateYear', v.length === 4 ? v.slice(2) : v)
                    }}
                    placeholder="૨૦૨૬"
                    maxLength={4}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontWeight: 600,
                      fontSize: 12.5,
                      color: '#111',
                      textAlign: 'center',
                      padding: 0,
                      margin: 0,
                      fontFamily: '"Noto Sans Gujarati", "Anek Gujarati", sans-serif',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  />
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <strong style={{ color: '#0d2366', display: 'flex', alignItems: 'center' }}>જમાઅત રજીસ્ટર પાના નં.:</strong>
                {underField('regNumber', null, '90px', 'left')}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <strong style={{ color: '#0d2366', display: 'flex', alignItems: 'center' }}>હિજરી સન:</strong>
                {underField('hijriYear', null, '75px', 'left', '૧૪૪૬')}
                <strong style={{ color: '#0d2366', marginLeft: 4, display: 'flex', alignItems: 'center' }}>માહ:</strong>
                {underField('hijriMonth', null, '90px', 'left', 'શવ્વાલ')}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <strong style={{ color: '#0d2366', flexShrink: 0, display: 'flex', alignItems: 'center' }}>નિકાહનું સ્થળ (સરનામું):</strong>
              {underField('nikahVenue', 1)}
            </div>
          </div>

          {/* 1. Groom (દુલ્હા) Section with Photo */}
          <div style={{ background: '#ffffff', border: '1.5px solid #93c5fd', borderRadius: 6, padding: '6px 9px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            {sectionTitle('૧', 'દુલ્હા (વરરાજા) ની વિગત :', '#eff6ff', '#bfdbfe', '#1e40af', '#dbeafe', '#1e40af')}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3.5, fontSize: 11.5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontWeight: 800, color: '#111', width: 95, flexShrink: 0 }}>• પૂરું નામ :</span>
                  {underField('dulhaName', 1)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontWeight: 800, color: '#111', width: 95, flexShrink: 0 }}>• પિતા/વાલી :</span>
                  {underField('dulhaFatherName', 1)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 800, color: '#111' }}>• જન્મ તારીખ:</span>
                  {underField('dulhaDob', null, '85px', 'center', 'DD/MM/YYYY')}
                  <span style={{ fontWeight: 800, color: '#111' }}>ઉંમર:</span>
                  {underField('dulhaAge', null, '35px', 'center')} વર્ષ
                  <span style={{ fontWeight: 800, color: '#111', marginLeft: 4 }}>મો.:</span>
                  {underField('dulhaMobile', null, '105px')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontWeight: 800, color: '#111', width: 95, flexShrink: 0 }}>• આધાર કાર્ડ નં.:</span>
                  {underField('dulhaAadhaar', null, '130px')}
                  <span style={{ fontWeight: 800, color: '#111', marginLeft: 4, flexShrink: 0 }}>વતન:</span>
                  {underField('dulhaVatan', 1)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontWeight: 800, color: '#111', width: 95, flexShrink: 0 }}>• સરનામું / સ્થિતિ:</span>
                  {underField('dulhaAddress', 1)}
                  <span style={{ fontSize: 11, fontWeight: 900, color: '#15803d', background: '#dcfce7', padding: '1px 6px', borderRadius: 3 }}>
                    {data.dulhaMaritalStatus || 'પ્રથમ નિકાહ'}
                  </span>
                </div>
              </div>

              {/* Groom Photo Box */}
              <input type="file" ref={fileGroomRef} onChange={(e) => handlePhotoUpload('dulhaPhoto', e)} accept="image/*" style={{ display: 'none' }} />
              <div
                onClick={() => fileGroomRef.current?.click()}
                style={{
                  width: 78,
                  height: 96,
                  border: '1.5px dashed #3b82f6',
                  borderRadius: 4,
                  background: '#eff6ff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  overflow: 'hidden',
                  textAlign: 'center',
                }}
              >
                {data.dulhaPhoto ? (
                  <img src={data.dulhaPhoto} alt="Groom" style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#fff' }} crossOrigin="anonymous" />
                ) : (
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#1e40af', lineHeight: 1.2 }}>દુલ્હાનો ફોટો<br />(પાસપોર્ટ)</div>
                )}
              </div>
            </div>
          </div>

          {/* 2. Bride (દુલ્હન) Section with Photo */}
          <div style={{ background: '#ffffff', border: '1.5px solid #fca5a5', borderRadius: 6, padding: '6px 9px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            {sectionTitle('૨', 'દુલ્હન (કન્યા) ની વિગત :', '#fef2f2', '#fecaca', '#991b1b', '#fee2e2', '#991b1b')}
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 3.5, fontSize: 11.5 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontWeight: 800, color: '#111', width: 95, flexShrink: 0 }}>• પૂરું નામ :</span>
                  {underField('dulhanFullName', 1)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontWeight: 800, color: '#111', width: 95, flexShrink: 0 }}>• પિતા/વાલી :</span>
                  {underField('dulhanFatherName', 1)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 800, color: '#111' }}>• જન્મ તારીખ:</span>
                  {underField('dulhanDob', null, '85px', 'center', 'DD/MM/YYYY')}
                  <span style={{ fontWeight: 800, color: '#111' }}>ઉંમર:</span>
                  {underField('dulhanAge', null, '35px', 'center')} વર્ષ
                  <span style={{ fontWeight: 800, color: '#111', marginLeft: 4 }}>મો.:</span>
                  {underField('dulhanMobile', null, '105px')}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontWeight: 800, color: '#111', width: 95, flexShrink: 0 }}>• આધાર કાર્ડ નં.:</span>
                  {underField('dulhanAadhaar', null, '130px')}
                  <span style={{ fontWeight: 800, color: '#111', marginLeft: 4, flexShrink: 0 }}>વતન:</span>
                  {underField('dulhanVatan', 1)}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ fontWeight: 800, color: '#111', width: 95, flexShrink: 0 }}>• સરનામું / સ્થિતિ:</span>
                  {underField('dulhanAddress', 1)}
                  <span style={{ fontSize: 11, fontWeight: 900, color: '#be123c', background: '#ffe4e6', padding: '1px 6px', borderRadius: 3 }}>
                    {data.dulhanMaritalStatus || 'પ્રથમ નિકાહ'}
                  </span>
                </div>
              </div>

              {/* Bride Photo Box */}
              <input type="file" ref={fileBrideRef} onChange={(e) => handlePhotoUpload('dulhanPhoto', e)} accept="image/*" style={{ display: 'none' }} />
              <div
                onClick={() => fileBrideRef.current?.click()}
                style={{
                  width: 78,
                  height: 96,
                  border: '1.5px dashed #f87171',
                  borderRadius: 4,
                  background: '#fff1f2',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  flexShrink: 0,
                  overflow: 'hidden',
                  textAlign: 'center',
                }}
              >
                {data.dulhanPhoto ? (
                  <img src={data.dulhanPhoto} alt="Bride" style={{ width: '100%', height: '100%', objectFit: 'contain', background: '#fff' }} crossOrigin="anonymous" />
                ) : (
                  <div style={{ fontSize: 10, fontWeight: 800, color: '#991b1b', lineHeight: 1.2 }}>દુલ્હનનો ફોટો<br />(પાસપોર્ટ)</div>
                )}
              </div>
            </div>
          </div>

          {/* 3. Vakil / Vali Details */}
          <div style={{ background: '#ffffff', border: '1.5px solid #86efac', borderRadius: 6, padding: '6px 9px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            {sectionTitle('૩', 'વકીલ / વાલીની વિગત :', '#f0fdf4', '#bbf7d0', '#166534', '#dcfce7', '#166534')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3.5, fontSize: 11.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                <strong style={{ color: '#166534' }}>દુલ્હનના વકીલ:</strong>
                {underField('dulhanVakilName', 1)}
                <span>પિતા:</span>
                {underField('dulhanVakilFather', 1)}
                <span>ગામ:</span>
                {underField('dulhanVakilVillage', null, '80px')}
                <span>મો.:</span>
                {underField('dulhanVakilMo', null, '85px')}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                <strong style={{ color: '#166534' }}>દુલ્હાના વાલી/વકીલ:</strong>
                {underField('dulhaValiName', 1)}
                <span>પિતા:</span>
                {underField('dulhaValiFather', 1)}
                <span>ગામ:</span>
                {underField('dulhaValiVillage', null, '80px')}
                <span>મો.:</span>
                {underField('dulhaValiMo', null, '85px')}
              </div>
            </div>
          </div>

          {/* 4. Meher Details */}
          <div style={{ background: '#ffffff', border: '1.5px solid #fde047', borderRadius: 6, padding: '6px 9px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            {sectionTitle('૪', 'મહેર (MEHER) ની વિગત :', '#fefce8', '#fef08a', '#854d0e', '#fef9c3', '#854d0e')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 3.5, fontSize: 11.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                <strong style={{ color: '#854d0e', flexShrink: 0 }}>• મહેરની રકમ:</strong>
                <span>અંકે રૂ.</span>
                {underField('maherRakam', null, '110px')}
                <span>(શબ્દોમાં:</span>
                {underField('maherRakamWords', 1)}
                <span>)</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
                <strong style={{ color: '#854d0e', flexShrink: 0 }}>• સોના/ચાંદીના દાગીના:</strong>
                {underField('maherGoldDetails', 1)}
                <span>વજન:</span>
                {underField('maherGram', null, '70px')}
                <span>ગ્રામ</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 1 }}>
                <strong style={{ color: '#854d0e' }}>• ચૂકવણીનો પ્રકાર:</strong>
                <span style={{ fontWeight: 800, color: '#166534', background: '#fef08a', padding: '1px 8px', borderRadius: 4 }}>
                  {data.maherType || 'મોઅજ્જલ (નકદ / રોકડ - સ્થળ પર જ ચૂકવી આપેલ છે)'}
                </span>
              </div>
            </div>
          </div>

          {/* Page 1 Bottom Indicator */}
          <div style={{ textAlign: 'center', fontSize: 11, color: '#166534', fontWeight: 800, fontStyle: 'italic', marginTop: 3 }}>
            [ પૃષ્ઠ ૧ / ૨ &bull; પાછળ સાક્ષીઓ, કાનૂની શરતો અને સહીઓ જુઓ ]
          </div>
        </div>
        </div>
      </div>



      {/* ══════════════════════════════════════════════════════════════
         PAGE 2 : સાક્ષીઓ, કાઝી, કાનૂની ઘોષણા, સમાજ શિસ્ત અને સહીઓ
      ══════════════════════════════════════════════════════════════ */}
      <div
        className="certificate-page"
        style={{
          width: 650,
          maxWidth: 650,
          minWidth: 650,
          margin: '0 auto',
          fontFamily: '"Noto Sans Gujarati", "Anek Gujarati", "Noto Sans", Arial, sans-serif',
          background: 'linear-gradient(160deg, #f0f9ee 0%, #e8f5e2 60%, #f5fbf0 100%)',
          border: '3px solid #1b5e20',
          borderRadius: 6,
          padding: '5px',
          boxSizing: 'border-box',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 6px 28px rgba(27,94,32,0.18), 0 2px 6px rgba(0,0,0,0.10), inset 0 0 0 1.5px rgba(27,94,32,0.12)',
        }}
      >
        {/* Premium Inner Border Frame */}
        <div style={{
          border: '1.5px solid #2e7d32',
          borderRadius: 3,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '9px 10px 8px',
          position: 'relative',
        }}>
        {[['0','0'],['0','auto'],['auto','0'],['auto','auto']].map(([t,r],i)=>(
          <div key={i} style={{ position:'absolute', top:t!=='auto'?4:undefined, right:r!=='auto'?4:undefined, bottom:t==='auto'?4:undefined, left:r==='auto'?4:undefined, width:14, height:14, borderTop: i<2?'2.5px solid #1b5e20':undefined, borderBottom: i>=2?'2.5px solid #1b5e20':undefined, borderLeft: r==='auto'?'2.5px solid #1b5e20':undefined, borderRight: r!=='auto'?'2.5px solid #1b5e20':undefined, pointerEvents:'none', zIndex:2 }} />
        ))}
        {/* ── MAIN CONTENT PAGE 2 ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10, padding: '2px 4px' }}>
          {/* Page 2 Header Badge */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: '#f1f5f9', border: '1.2px solid #cbd5e1', color: '#0f172a', padding: '5px 12px', borderRadius: 4, fontSize: 12, fontWeight: 900, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ color: '#0f172a' }}>નિકાહ રજીસ્ટ્રેશન નં.: <span style={{ color: '#1e40af' }}>{data.number || '........'}</span></div>
            <div style={{ color: '#854d0e', fontWeight: 900 }}>પૃષ્ઠ ૨ : સાક્ષીઓ, કાનૂની શરતો અને સહીઓ</div>
            <div style={{ color: '#0f172a' }}>તા.: {data.dateDay || 'DD'}/{data.dateMonth || 'MM'}/{data.dateYear ? (data.dateYear.length === 2 ? `૨૦${data.dateYear}` : data.dateYear) : '૨૦૨૬'}</div>
          </div>

          {/* 5. Witnesses (સાક્ષીઓ) Section */}
          <div style={{ background: '#ffffff', border: '1.5px solid #86efac', borderRadius: 6, padding: '8px 10px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            {sectionTitle('૫', 'સાક્ષીઓ (ગવાહ) ની વિગત :', '#f0fdf4', '#bbf7d0', '#15803d', '#dcfce7', '#15803d')}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7, fontSize: 11.5, marginTop: 4 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                <strong style={{ color: '#15803d' }}>(૧) સાક્ષી નં. ૧:</strong>
                <span>નામ:</span>
                {underField('sakshi1Name', 1)}
                <span>પિતા:</span>
                {underField('sakshi1Father', 1)}
                <span>ગામ:</span>
                {underField('sakshi1Village', null, '80px')}
                <span>આધાર:</span>
                {underField('sakshi1Aadhaar', null, '90px')}
                <span>મો.:</span>
                {underField('sakshi1Mo', null, '85px')}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                <strong style={{ color: '#15803d' }}>(૨) સાક્ષી નં. ૨:</strong>
                <span>નામ:</span>
                {underField('sakshi2Name', 1)}
                <span>પિતા:</span>
                {underField('sakshi2Father', 1)}
                <span>ગામ:</span>
                {underField('sakshi2Village', null, '80px')}
                <span>આધાર:</span>
                {underField('sakshi2Aadhaar', null, '90px')}
                <span>મો.:</span>
                {underField('sakshi2Mo', null, '85px')}
              </div>
            </div>
          </div>

          {/* 6. Kazi Saheb Details */}
          <div style={{ background: '#ffffff', border: '1.5px solid #7dd3fc', borderRadius: 6, padding: '7px 10px', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            {sectionTitle('૬', 'નિકાહ પઢાવનાર કાઝી સાહેબની વિગત :', '#f0f9ff', '#bae6fd', '#0284c7', '#e0f2fe', '#0284c7')}
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5, marginTop: 3 }}>
              <strong style={{ color: '#0369a1', flexShrink: 0 }}>• કાઝી સાહેબનું નામ:</strong>
              {underField('kaziName', 1)}
              <strong style={{ color: '#0369a1', flexShrink: 0, marginLeft: 8 }}>• સરનામું / મો. નં.:</strong>
              {underField('kaziContact', 1)}
            </div>
          </div>

          {/* 7. Legal Declarations, Jamaat Constitution & Discipline Clauses */}
          <div style={{ background: '#ffffff', border: '2px solid #1b5e20', borderRadius: 6, padding: '8px 10px', fontSize: 11, lineHeight: '16.5px', color: '#111', boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ color: '#991b1b', fontWeight: 900, fontSize: 12, textAlign: 'center', borderBottom: '1px solid #ddd', paddingBottom: 3, marginBottom: 5 }}>
              ૭. કાનૂની ઘોષણા, સમાજનું બંધારણ અને શિસ્ત અંગેની શરતો
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <div>
                <strong style={{ color: '#166534' }}>૧. સ્વતંત્ર સંમતિ (Consent):</strong> દુલ્હા તથા દુલ્હને સંપૂર્ણ શુદ્ધિબુદ્ધિમાં, કોઈપણ પ્રકારના ડર, દબાણ, ધાકધમકી કે પ્રલોભન વગર, પોતાની મુક્ત અને રાજીખુશીથી શરીઅતે મુહમ્મદી મુજબ શરઈ સાક્ષીઓની હાજરીમાં ઇજાબ-ઓ-કુબૂલ (કબૂલાત) કરેલ છે.
              </div>
              <div>
                <strong style={{ color: '#166534' }}>૨. કાયદેસર પુખ્તતા:</strong> બંને પક્ષકારો ભારત સરકારના પ્રવર્તમાન લગ્ન કાયદા મુજબ લગ્નની કાયદેસર ઉંમર ધરાવે છે અને દર્શાવેલ વિગતો તથા ઓળખના પુરાવા સંપૂર્ણ સાચા છે.
              </div>
              <div>
                <strong style={{ color: '#166534' }}>૩. જમાઅતના બંધારણનું પાલન:</strong> બંને પક્ષકારો તથા તેમના વાલીઓ 'રાધનપુર થરાદી મેમન જમાઅત' ના પ્રવર્તમાન બંધારણ, નીતિ-નિયમો, સામાજિક રિવાજો અને શિસ્તબદ્ધ નિર્ણયોનું ચુસ્તપણે પાલન કરવા સહમત થાય છે.
              </div>
              <div>
                <strong style={{ color: '#166534' }}>૪. વિવાદ નિવારણ અને સમાધાન:</strong> દાંપત્ય જીવન દરમિયાન જો કોઈ ગેરસમજ કે પારિવારિક મતભેદ ઉપસ્થિત થાય, તો કોઈપણ પક્ષકાર સીધા પોલીસ સ્ટેશન કે કોર્ટ-કચેરીના પગલાં ભરશે નહીં. સૌપ્રથમ 'રાધનપુર થરાદી મેમન જમાઅત' ની કારોબારી/પંચાયત સમિતિ સમક્ષ લેખિત રજૂઆત કરી આપસી સુખદ સમાધાન મેળવવા બંધાયેલા રહેશે.
              </div>
              <div>
                <strong style={{ color: '#166534' }}>૫. સત્તાવાર દસ્તાવેજ:</strong> આ પ્રમાણપત્ર મુસ્લિમ પર્સનલ લો (શરીઅત) તથા 'ધ ગુજરાત રજીસ્ટ્રેશન ઓફ મેરેજીસ એક્ટ' અન્વયે જમાઅતના અધિકૃત દસ્તાવેજ તરીકે માન્ય રહેશે.
              </div>
            </div>
          </div>

          {/* 8. Signatures Block */}
          <div style={{ background: '#ffffff', border: '1.5px solid #2e7d32', borderRadius: 6, padding: '10px 14px', marginTop: 3, boxShadow: '0 1px 3px rgba(0,0,0,0.04)' }}>
            <div style={{ color: '#8b0000', fontWeight: 900, fontSize: 13, textAlign: 'center', marginBottom: 12 }}>
              ૮. સહીઓ અને પ્રમાણીકરણ
            </div>

            {/* Row 1: Groom, Bride, Vakil */}
            <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center', fontSize: 11.5, marginBottom: 20 }}>
              <div style={{ width: '30%' }}>
                <div style={{ borderBottom: '1.5px dashed #444', height: 32, marginBottom: 6 }}></div>
                <strong style={{ color: '#0d2366', fontSize: 12 }}>દુલ્હાની સહી</strong>
                <div style={{ fontSize: 10, color: '#666', marginTop: 1 }}>(અથવા ડાબા હાથનો અંગૂઠો)</div>
              </div>
              <div style={{ width: '30%' }}>
                <div style={{ borderBottom: '1.5px dashed #444', height: 32, marginBottom: 6 }}></div>
                <strong style={{ color: '#991b1b', fontSize: 12 }}>દુલ્હનની સહી</strong>
                <div style={{ fontSize: 10, color: '#666', marginTop: 1 }}>(અથવા ડાબા હાથનો અંગૂઠો)</div>
              </div>
              <div style={{ width: '30%' }}>
                <div style={{ borderBottom: '1.5px dashed #444', height: 32, marginBottom: 6 }}></div>
                <strong style={{ color: '#166534', fontSize: 12 }}>દુલ્હનના વકીલની સહી</strong>
              </div>
            </div>

            {/* Row 2: Witness 1, Witness 2, Kazi */}
            <div style={{ display: 'flex', justifyContent: 'space-between', textAlign: 'center', fontSize: 11.5, marginBottom: 16 }}>
              <div style={{ width: '30%' }}>
                <div style={{ borderBottom: '1.5px dashed #444', height: 30, marginBottom: 6 }}></div>
                <strong style={{ color: '#111', fontSize: 12 }}>સાક્ષી (૧) ની સહી</strong>
              </div>
              <div style={{ width: '30%' }}>
                <div style={{ borderBottom: '1.5px dashed #444', height: 30, marginBottom: 6 }}></div>
                <strong style={{ color: '#111', fontSize: 12 }}>સાક્ષી (૨) ની સહી</strong>
              </div>
              <div style={{ width: '30%' }}>
                <div style={{ borderBottom: '1.5px dashed #444', height: 30, marginBottom: 6 }}></div>
                <strong style={{ color: '#0369a1', fontSize: 12 }}>કાઝી સાહેબની સહી</strong>
              </div>
            </div>

            {/* Row 3: Jamaat Seal + Pramukh + Secretary */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, paddingTop: 10, borderTop: '1.2px solid #e5e7eb' }}>
              <div style={{ textAlign: 'center', width: '35%' }}>
                <div style={{ borderBottom: '1.5px solid #8b0000', height: 28, marginBottom: 6 }}></div>
                <strong style={{ color: '#8b0000', fontSize: 12.5 }}>પ્રમુખશ્રી</strong>
                <div style={{ fontSize: 10.5, color: '#333', fontWeight: 700, marginTop: 1 }}>રાધનપુર થરાદી મેમન જમાઅત</div>
              </div>

              {/* Jamaat Stamp Box */}
              <div
                style={{
                  width: 76,
                  height: 76,
                  border: '2px dashed #1b5e20',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 10.5,
                  fontWeight: 900,
                  color: '#1b5e20',
                  textAlign: 'center',
                  lineHeight: 1.25,
                  background: 'rgba(27, 94, 32, 0.04)',
                }}
              >
                જમાઅતની<br />સત્તાવાર મોહર<br />(STAMP)
              </div>

              <div style={{ textAlign: 'center', width: '35%' }}>
                <div style={{ borderBottom: '1.5px solid #8b0000', height: 28, marginBottom: 6 }}></div>
                <strong style={{ color: '#8b0000', fontSize: 12.5 }}>માનદ મંત્રીશ્રી</strong>
                <div style={{ fontSize: 10.5, color: '#333', fontWeight: 700, marginTop: 1 }}>રાધનપુર થરાદી મેમન જમાઅત</div>
              </div>
            </div>
          </div>

          <div style={{ textAlign: 'center', fontSize: 10.5, color: '#166534', fontWeight: 800, marginTop: 2 }}>
            પૃષ્ઠ ૨ / ૨ &bull; રાધનપુર થરાદી મેમન જમાઅત — નિકાહ નામા / MARRIAGE CERTIFICATE
          </div>
        </div>
        </div>
      </div>
    </div>
  )
})

/* ══════════════════════════════════════════════════════════════
   PRINTABLE LETTERHEAD SHEET
══════════════════════════════════════════════════════════════ */
const LetterheadSheet = memo(function LetterheadSheet({ data, onChange, printRef }) {
  const l = certData.letterhead
  const rawBody = data.body || ''

  // Accurately wrap and split letter body text across ANY number of pages (1, 2, 3, 4...)
  // - Single page: Fits up to 12 lines (since it includes header + body + footer/signatures/terms)
  // - First page of multi-page: Fits up to 14 lines (header + body + forward note)
  // - Middle pages (if any): Fits up to 15 lines (header + body + forward note)
  // - Last page of multi-page: Fits up to 9 lines before footer/signatures/terms
  const pagesData = useMemo(() => {
    if (!rawBody || !rawBody.trim()) {
      return ['']
    }

    const CHARS_PER_LINE = 68
    const SINGLE_PAGE_MAX = 12
    const FIRST_PAGE_MAX = 14
    const MIDDLE_PAGE_MAX = 15
    const LAST_PAGE_WITH_FOOTER_MAX = 9

    // Break text into individual visual lines
    const rawParagraphs = rawBody.split('\n')
    const visualLines = []

    for (const paragraph of rawParagraphs) {
      if (paragraph.length === 0) {
        visualLines.push('')
        continue
      }

      const words = paragraph.split(' ')
      let currentLine = ''

      for (const word of words) {
        if (word.length > CHARS_PER_LINE) {
          if (currentLine) {
            visualLines.push(currentLine)
            currentLine = ''
          }
          let remainingWord = word
          while (remainingWord.length > CHARS_PER_LINE) {
            visualLines.push(remainingWord.slice(0, CHARS_PER_LINE))
            remainingWord = remainingWord.slice(CHARS_PER_LINE)
          }
          currentLine = remainingWord
        } else if ((currentLine + (currentLine ? ' ' : '') + word).length <= CHARS_PER_LINE) {
          currentLine = currentLine + (currentLine ? ' ' : '') + word
        } else {
          visualLines.push(currentLine)
          currentLine = word
        }
      }
      if (currentLine) {
        visualLines.push(currentLine)
      }
    }

    // Case 1: Fits on 1 single page with complete footer
    if (visualLines.length <= SINGLE_PAGE_MAX) {
      return [rawBody]
    }

    // Multi-page distribution
    const pages = []
    let remainingLines = [...visualLines]

    // Page 1
    pages.push(remainingLines.slice(0, FIRST_PAGE_MAX).join('\n'))
    remainingLines = remainingLines.slice(FIRST_PAGE_MAX)

    // Subsequent pages
    while (remainingLines.length > 0) {
      // If the remaining lines fit on the last page with footer:
      if (remainingLines.length <= LAST_PAGE_WITH_FOOTER_MAX) {
        pages.push(remainingLines.join('\n'))
        remainingLines = []
      } else {
        // Take a full middle page
        pages.push(remainingLines.slice(0, MIDDLE_PAGE_MAX).join('\n'))
        remainingLines = remainingLines.slice(MIDDLE_PAGE_MAX)
      }
    }

    return pages
  }, [rawBody])

  const totalPages = pagesData.length
  const isMultiPage = totalPages > 1

  // Common Header Banner Component
  const renderHeader = (pageIndex = 0) => (
    <div>
      {/* ── TOP LETTERHEAD BANNER (1:1 Exact Replica) ── */}
      <div
        style={{
          margin: '12px 14px 4px',
          background: '#fffdf4',
          border: '3px solid #15459b',
          borderRadius: 2,
          padding: '2px',
          boxSizing: 'border-box',
        }}
      >
        <div
          style={{
            border: '2px solid #1b7339',
            padding: '5px 8px 4px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {/* Top Line: Trust Reg No (Left) & Contact (Right) */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontWeight: 800,
              fontSize: 11,
              color: '#b71c1c',
              lineHeight: 1.2,
              fontFamily: '"Anek Gujarati", "Noto Sans Gujarati", sans-serif',
            }}
          >
            <div>ટ્રસ્ટ રજીસ્ટ્રેશન નં.: બી-૫૨૯ (મહેસાણા), તા. ૩૦-૦૯-૧૯૫૫</div>
            <div>ઈ-મેઇલ: info.radhanpurmemonjamat@gmail.com</div>
          </div>

          {/* Main Title: RADHANPUR MEMON JAMAT */}
          {/* <div
            style={{
              textAlign: 'center',
              fontFamily: '"Impact", "Arial Black", "Arial", sans-serif',
              fontSize: 38,
              fontWeight: 600,
              color: '#0a2e73',
              letterSpacing: 4,
              lineHeight: 1.4,
              marginTop: 4,
              marginBottom: 2,
              textTransform: 'uppercase',
              transform: 'scaleY(1.15)',
            }}
          >
            {l.orgName || 'RADHANPUR MEMON JAMAT'}
          </div> */}

          {/* Middle Row: Left Logo + Center Gujarati Title with Underline + Right Logo */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              marginTop: 4,
              marginBottom: 4,
              padding: '0 4px',
            }}
          >
            {/* Left Circular Logo */}
            <div
              style={{
                width: 70,
                height: 70,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <img
                src={letterpadLogo}
                alt="Logo Left"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                crossOrigin="anonymous"
              />
            </div>

            {/* Center Area: Gujarati Community Title + Inner Underline Line */}
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '0 6px',
              }}
            >
              <div
                style={{
                  textAlign: 'center',
                  fontFamily: '"Anek Gujarati", "Noto Sans Gujarati", sans-serif',
                  fontSize: 35,
                  fontWeight: 900,
                  color: '#0a2e73',
                  letterSpacing: 1.5,
                  lineHeight: 1.1,
                  whiteSpace: 'nowrap',
                }}
              >
                {l.communityName || 'રાધનપુર મેમણ જમાત'}
              </div>

              {/* Blue Underline that spans between the two logos */}
              <div
                style={{
                  height: 2.5,
                  background: '#0a2e73',
                  width: '100%',
                  marginTop: 4,
                }}
              />
            </div>

            {/* Right Circular Logo */}
            <div
              style={{
                width: 70,
                height: 70,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <img
                src={letterpadLogo}
                alt="Logo Right"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                crossOrigin="anonymous"
              />
            </div>
          </div>

          {/* Bottom Address & Phone Line */}
          <div
            style={{
              textAlign: 'center',
              fontWeight: 800,
              fontSize: 11.5,
              color: '#b71c1c',
              lineHeight: 1.3,
              fontFamily: '"Anek Gujarati", "Noto Sans Gujarati", sans-serif',
              marginTop: 2,
            }}
          >
            કાર્યાલય: મેમણ જમાતખાના, મુ. રાધનપુર, જિ. પાટણ, પીન - ૩૮૫૩૪૦ (ઉ.ગુ.) | સંપર્ક: +૯૧ ૯૯૯૮૦ ૧૬૫૬૬ | +૯૧ ૮૪૯૦૦ ૯૫૨૪૦
          </div>
        </div>
      </div>

      {/* Ref No & Date Row (Standardized with NOC / Marriage formatting, matching text & no rogue underlines) */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          padding: '6px 18px 4px',
          alignItems: 'center',
          borderBottom: '1px solid #e2e8f0',
          fontSize: 12.5,
          fontFamily: '"Anek Gujarati", "Noto Sans Gujarati", sans-serif',
        }}
      >
        {/* Left: Ref Number */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <strong style={{ color: '#0d2366', fontWeight: 800 }}>જાવક ક્રમાંક (Ref. No.):</strong>
          <span style={{ fontWeight: 800, color: '#111' }}>
            {data.refNumber ? (data.refNumber.startsWith('RMJ') ? data.refNumber : `RMJ / ${data.refNumber}`) : 'RMJ / _________'}
          </span>
          {totalPages > 1 && (
            <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 800, color: '#b45309', background: '#fef3c7', padding: '1px 7px', borderRadius: 4, border: '1px solid #fde68a' }}>
              (પૃષ્ઠ {toGujaratiDigits(pageIndex + 1)} / {toGujaratiDigits(totalPages)})
            </span>
          )}
        </div>

        {/* Right: Date (Standardized DD / MM / YYYY) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <strong style={{ color: '#0d2366', fontWeight: 800 }}>તારીખ (Date):</strong>
          <span style={{ fontWeight: 800, color: '#111' }}>
            {(() => {
              if (data.date) {
                const parts = data.date.split('/')
                if (parts.length === 3) {
                  return `${toGujaratiDigits(parts[0])} / ${toGujaratiDigits(parts[1])} / ${toGujaratiDigits(parts[2])}`
                }
                return toGujaratiDigits(data.date)
              }
              if (data.dateDay || data.dateMonth || data.dateYear) {
                const dd = data.dateDay ? toGujaratiDigits(data.dateDay) : 'DD'
                const mm = data.dateMonth ? toGujaratiDigits(data.dateMonth) : 'MM'
                const yy = data.dateYear ? (data.dateYear.length === 2 ? `૨૦${toGujaratiDigits(data.dateYear)}` : toGujaratiDigits(data.dateYear)) : '૨૦૨૬'
                return `${dd} / ${mm} / ${yy}`
              }
              const today = getTodayDateParts()
              return `${today.day} / ${today.month} / ${today.year}`
            })()}
          </span>
        </div>
      </div>
    </div>
  )

  // Common Footer Component with Signatures & Terms
  const renderFooter = () => (
    <div style={{ pageBreakInside: 'avoid', breakInside: 'avoid', width: '100%' }}>
      {/* Bottom Signature Row: Pramukh | Seal | Secretary */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-end',
          padding: '4px 32px 6px',
          borderTop: '1px solid #e2e8f0',
          marginTop: 4,
        }}
      >
        {/* Pramukh */}
        <div style={{ textAlign: 'center', minWidth: 130 }}>
          <div style={{ borderTop: '1.2px solid #8b0000', paddingTop: 3, marginBottom: 2, marginTop: 22 }} />
          <div style={{ fontWeight: 900, fontSize: 12, color: '#8b0000', fontFamily: '"Anek Gujarati", "Noto Sans Gujarati", sans-serif' }}>પ્રમુખશ્રી</div>
          <div style={{ fontSize: 10.5, color: '#333', fontWeight: 700, fontFamily: '"Anek Gujarati", "Noto Sans Gujarati", sans-serif' }}>રાધનપુર મેમણ જમાત</div>
        </div>

        {/* Official Seal */}
        <div
          style={{
            width: 62,
            height: 62,
            border: '2px dashed #1b5e20',
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            fontWeight: 900,
            color: '#1b5e20',
            textAlign: 'center',
            lineHeight: 1.2,
            background: 'rgba(27, 94, 32, 0.04)',
            fontFamily: '"Anek Gujarati", "Noto Sans Gujarati", sans-serif',
          }}
        >
          સહી સિક્કો<br />(Seal)
        </div>

        {/* Secretary */}
        <div style={{ textAlign: 'center', minWidth: 130 }}>
          <div style={{ borderTop: '1.2px solid #8b0000', paddingTop: 3, marginBottom: 2, marginTop: 22 }} />
          <div style={{ fontWeight: 900, fontSize: 12, color: '#8b0000', fontFamily: '"Anek Gujarati", "Noto Sans Gujarati", sans-serif' }}>સેક્રેટરીશ્રી</div>
          <div style={{ fontSize: 10.5, color: '#333', fontWeight: 700, fontFamily: '"Anek Gujarati", "Noto Sans Gujarati", sans-serif' }}>રાધનપુર મેમણ જમાત</div>
        </div>
      </div>

      {/* Footer: Terms & Conditions */}
      <div
        style={{
          background: '#f8faff',
          border: '1px solid #c7d7f0',
          borderRadius: 3,
          margin: '2px 10px 6px',
          padding: '4px 8px 5px',
          fontSize: 9,
          color: '#333',
          lineHeight: 1.35,
          fontFamily: '"Noto Sans Gujarati", "Anek Gujarati", sans-serif',
        }}
      >
        <div style={{ fontWeight: 900, fontSize: 10, color: '#0d2366', marginBottom: 2, textAlign: 'center', fontFamily: '"Anek Gujarati", "Noto Sans Gujarati", sans-serif' }}>
          પત્ર સંબંધી નિયમો અને કાનૂની શરતો (Terms &amp; Conditions)
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <div><strong style={{ color: '#8b0000' }}>૧. અધિકૃતતા:</strong> જમાતના હોદ્દેદારો (પ્રમુખ/સેક્રેટરી) અને સત્તાવાર સહી-સિક્કા વિના આ પત્ર માન્ય ગણાશે નહીં. ફોટોકોપી, ડિજિટલ સ્કેન અથવા અનધિકૃત સહી ધરાવતો પત્ર સંપૂર્ણ અમાન્ય ઠરશે.</div>
          <div><strong style={{ color: '#8b0000' }}>૨. બંધારણ:</strong> આ પત્ર UTMC મેમણ સમાજના બંધારણ, શિસ્ત અને Bye-laws ને આધીન છે. જમાતના સામાજિક નિર્ણયો સર્વ સભ્યો માટે આખરી અને બંધનકર્તા રહેશે.</div>
          <div><strong style={{ color: '#8b0000' }}>૩. ન્યાયક્ષેત્ર:</strong> ભવિષ્યના કોઈ વિવાદ માટે અધિકારક્ષેત્ર ફક્ત રાધનપુર મેમણ જમાત, રાધનપુર પૂરતું. આ પત્ર અન્ય સરકારી/કોર્ટ-કચેરીમાં ઉપયોગ અને જમાત પર કોઈ કાનૂની જવાબદારી ઉપસ્થિત કરી શકાશે નહીં.</div>
          <div><strong style={{ color: '#8b0000' }}>૪. દુરુપયોગ પ્રતિબંધ:</strong> આ પત્ર અધિકૃત ઉદ્દેશ સિવાય અન્યત્ર ઉપયોગ કે ચેડાં સખ્ત પ્રતિબંધિત. ઉલ્લંઘન કરનાર સામે UTMC જમાત-બંધારણ મુજબ સામાજિક કાર્યવાહી હાથ ધરાશે.</div>
          <div><strong style={{ color: '#8b0000' }}>૫. રદ્દીકરણ:</strong> ખોટી/અધૂરી માહિતી દ્વારા પ્રાપ્ત આ પત્રને કોઈ પૂર્વ નોટિસ વિના તત્કાલ અસરથી રદ કરવાનો સંપૂર્ણ અધિકાર રાધનપુર મેમણ જમાતનો રહેશે.</div>
        </div>
      </div>
    </div>
  )

  return (
    <div
      ref={printRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 28,
        alignItems: 'center',
        width: '100%',
      }}
    >
      {pagesData.map((pageText, pageIdx) => {
        const isLastPage = pageIdx === totalPages - 1
        const isSinglePage = totalPages === 1

        return (
          <div
            key={pageIdx}
            className="certificate-page"
            style={{
              width: 650,
              height: 920,
              minHeight: 920,
              maxHeight: 920,
              maxWidth: 650,
              minWidth: 650,
              margin: '0 auto',
              fontFamily: '"Noto Sans Gujarati", "Noto Sans", Arial, sans-serif',
              fontSize: 12,
              background: '#fff',
              border: '2px solid #222',
              boxSizing: 'border-box',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
              {renderHeader(pageIdx)}

              {/* Body Writing Area */}
              <div
                style={{
                  position: 'relative',
                  padding: '10px 24px 8px',
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column',
                  overflow: 'hidden',
                }}
              >
                {/* Center Watermark */}
                <div
                  style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%,-50%)',
                    opacity: 0.07,
                    pointerEvents: 'none',
                    zIndex: 0,
                  }}
                >
                  <img
                    src={letterpadLogo}
                    alt="Watermark"
                    style={{ width: 340, height: 340, objectFit: 'contain' }}
                    crossOrigin="anonymous"
                  />
                </div>
                <div
                  className="letterhead-guide-lines"
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    flex: 1,
                    display: 'flex',
                    backgroundImage:
                      'repeating-linear-gradient(transparent, transparent 30px, rgba(226, 232, 240, 0.65) 30px, rgba(226, 232, 240, 0.65) 31px)',
                  }}
                >
                  {isSinglePage ? (
                    <textarea
                      value={data.body || ''}
                      onChange={(e) => {
                        onChange('letterhead', 'body', e.target.value)
                      }}
                      onBlur={(e) => {
                        const raw = e.target.value
                        if (raw && /[a-zA-Z]/.test(raw)) {
                          onChange('letterhead', 'body', toGujarati(raw))
                        }
                      }}
                      onKeyDown={(e) => {
                        if (e.key === ' ' || e.keyCode === 32) {
                          const raw = e.target.value
                          if (raw && /[a-zA-Z]/.test(raw)) {
                            e.preventDefault()
                            onChange('letterhead', 'body', toGujarati(raw) + ' ')
                          }
                        }
                      }}
                      placeholder="અહીં પત્રનું સમગ્ર લખાણ ટાઇપ કરો..."
                      style={{
                        width: '100%',
                        height: '100%',
                        background: 'transparent',
                        border: 'none',
                        outline: 'none',
                        resize: 'none',
                        fontFamily: '"Noto Sans Gujarati", "Noto Sans", Arial, sans-serif',
                        fontSize: 13.5,
                        fontWeight: 600,
                        lineHeight: '31px',
                        color: '#0f172a',
                        boxSizing: 'border-box',
                        padding: '2px 6px',
                        margin: 0,
                        display: 'block',
                        textAlign: 'left',
                        overflow: 'hidden',
                        wordBreak: 'break-word',
                        overflowWrap: 'anywhere',
                      }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: '100%',
                        fontFamily: '"Noto Sans Gujarati", "Noto Sans", Arial, sans-serif',
                        fontSize: 13.5,
                        fontWeight: 600,
                        lineHeight: '31px',
                        color: '#0f172a',
                        padding: '2px 6px',
                        boxSizing: 'border-box',
                        whiteSpace: 'pre-wrap',
                        wordBreak: 'break-word',
                        overflowWrap: 'anywhere',
                        overflow: 'hidden',
                      }}
                    >
                      {pageText}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Footer on Last Page OR Forward Note on Intermediate Pages */}
            {isLastPage ? (
              renderFooter()
            ) : (
              <div
                style={{
                  padding: '6px 20px',
                  textAlign: 'center',
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#15803d',
                  borderTop: '1px dashed #cbd5e1',
                  fontStyle: 'italic',
                }}
              >
                [ પૃષ્ઠ {toGujaratiDigits(pageIdx + 1)} / {toGujaratiDigits(totalPages)} &bull; આગળનું લખાણ {pageIdx + 2 === totalPages ? 'તથા સહી-સિક્કો પાછળના પૃષ્ઠ' : 'આગળના પૃષ્ઠ'} {toGujaratiDigits(pageIdx + 2)} પર જુઓ &rarr; ]
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
})

/* ══════════════════════════════════════════════════════════════
   1:1 EXACT VISUAL REPLICA NOC CERTIFICATE COMPONENT (PREMIUM ROYAL DESIGN)
══════════════════════════════════════════════════════════════ */
const NocSheet = memo(function NocSheet({ data, onChange, printRef }) {
  const n = certData.noc

  // Premium Royal ribbon strips for "ની નિકાહખ્વાની" and "નિકાહખ્વાનીના પ્રોગ્રામની તારીખથી વિગત"
  const yellowRibbon = {
    background: 'linear-gradient(135deg, #1e3a8a 0%, #0d2366 100%)',
    color: '#ffffff',
    fontWeight: 900,
    fontSize: 14.5,
    fontFamily: '"Noto Sans Gujarati", "Anek Gujarati", sans-serif',
    textAlign: 'center',
    padding: '0 32px',
    height: 34,
    borderRadius: 20,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    lineHeight: 1,
    letterSpacing: 0.5,
    boxShadow: '0 2px 5px rgba(13, 35, 102, 0.25)',
    border: '1.2px solid #3b82f6',
  }

  // Centered red/maroon pill for "પ્રમાણપત્ર (N.O.C.)" matching sample photo
  const redPill = {
    background: 'linear-gradient(135deg, #800000 0%, #5c1044 100%)',
    color: '#ffd600',
    fontWeight: 900,
    fontSize: 20,
    fontFamily: '"Noto Sans Gujarati", "Anek Gujarati", sans-serif',
    textAlign: 'center',
    padding: '0 38px',
    height: 38,
    borderRadius: 20,
    lineHeight: 1,
    letterSpacing: 0.5,
    boxShadow: '0 2px 6px rgba(92, 16, 68, 0.3)',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    border: '1.5px solid #ffffff',
  }

  // Authentic printed form underline input
  const underlineField = (field, width = 'auto', flex = null, textAlign = 'left', placeholder = '') => (
    <div
      style={{
        flex: flex ? flex : undefined,
        width: width !== 'auto' ? width : undefined,
        minWidth: width !== 'auto' ? width : 60,
        borderBottom: '1.2px solid #555',
        height: 22,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: textAlign === 'center' ? 'center' : 'flex-start',
        padding: '0 4px',
        margin: '0 2px',
        boxSizing: 'border-box',
        verticalAlign: 'middle',
      }}
    >
      <CertInput
        section="noc"
        field={field}
        value={data[field]}
        onChange={onChange}
        textAlign={textAlign}
        placeholder={placeholder}
        style={{ fontSize: 13, fontWeight: 600, color: '#111', padding: 0 }}
      />
    </div>
  )

  return (
    <div
      ref={printRef}
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 32,
        alignItems: 'center',
        width: '100%',
      }}
    >
      {/* ══════════════════════════════════════════════════════════════
         PAGE 1 : મુખ્ય વિગત અને નિકાહ કાર્યક્રમ
      ══════════════════════════════════════════════════════════════ */}
      <div
        className="certificate-page"
        style={{
          width: 650,
          maxWidth: 650,
          minWidth: 650,
          margin: '0 auto',
          fontFamily: '"Noto Sans Gujarati", "Anek Gujarati", "Noto Sans", Arial, sans-serif',
          background: 'linear-gradient(160deg, #f0f9ee 0%, #e8f5e2 60%, #f5fbf0 100%)',
          border: '3px solid #1b5e20',
          borderRadius: 6,
          padding: '5px',
          boxSizing: 'border-box',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 6px 28px rgba(27,94,32,0.18), 0 2px 6px rgba(0,0,0,0.10), inset 0 0 0 1.5px rgba(27,94,32,0.12)',
        }}
      >
        {/* Premium Inner Border Frame */}
        <div style={{
          border: '1.5px solid #2e7d32',
          borderRadius: 3,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          padding: '8px 10px 6px',
          position: 'relative',
          boxSizing: 'border-box',
        }}>
        {[['0','0'],['0','auto'],['auto','0'],['auto','auto']].map(([t,r],i)=>(
          <div key={i} style={{ position:'absolute', top:t!=='auto'?4:undefined, right:r!=='auto'?4:undefined, bottom:t==='auto'?4:undefined, left:r==='auto'?4:undefined, width:14, height:14, borderTop: i<2?'2.5px solid #1b5e20':undefined, borderBottom: i>=2?'2.5px solid #1b5e20':undefined, borderLeft: r==='auto'?'2.5px solid #1b5e20':undefined, borderRight: r!=='auto'?'2.5px solid #1b5e20':undefined, pointerEvents:'none', zIndex:2 }} />
        ))}
        {/* ── MAIN CONTENT WRAPPER ── */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 7,
            padding: '1px 3px',
          }}
        >
          {/* 1. Header Block with RMJ Logos & 3D Title */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                padding: '0 4px',
              }}
            >
              {/* Left RMJ Logo */}
              <div
                style={{
                  width: 76,
                  height: 76,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <img
                  src={letterpadLogo}
                  alt="RMJ"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                  onError={(e) => {
                    if (e.target.src !== memonLogo) {
                      e.target.src = memonLogo
                    }
                  }}
                />
              </div>

              {/* Center 5 Lines */}
              <div
                style={{
                  flex: 1,
                  textAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <div style={{ color: '#b71c1c', fontWeight: 900, fontSize: 11.5, lineHeight: 1.2 }}>
                  {n.quoteLine}
                </div>
                <div style={{ fontSize: 9.5, fontWeight: 900, color: '#111', marginTop: 1, lineHeight: 1.2 }}>
                  {n.trustLine}
                </div>
                <div style={{ fontSize: 9, color: '#8b0000', fontWeight: 800, marginTop: 1, lineHeight: 1.2 }}>
                  {n.ayatLine1}
                </div>
                <div style={{ fontSize: 8.5, color: '#4a154b', fontWeight: 700, marginTop: 1, lineHeight: 1.2 }}>
                  {n.ayatLine2}
                </div>

                {/* 3D Community Title */}
                <div
                  style={{
                    fontFamily: '"Anek Gujarati", "Noto Sans Gujarati", sans-serif',
                    fontSize: 27,
                    fontWeight: 900,
                    color: '#ffffff',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.15,
                    marginTop: 1,
                    letterSpacing: 0.5,
                    textShadow: `
                      -2px -2px 0 #0a3d12,
                       0px -2px 0 #0a3d12,
                       2px -2px 0 #0a3d12,
                      -2px  0px 0 #0a3d12,
                       2px  0px 0 #0a3d12,
                      -2px  2px 0 #0a3d12,
                       0px  2px 0 #0a3d12,
                       2px  2px 0 #0a3d12,
                       3px  4px 3px rgba(0,0,0,0.5)
                    `,
                  }}
                >
                  {n.communityName}
                </div>
              </div>

              {/* Right RMJ Logo */}
              <div
                style={{
                  width: 76,
                  height: 76,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <img
                  src={letterpadLogo}
                  alt="RMJ"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                  onError={(e) => {
                    if (e.target.src !== memonLogo) {
                      e.target.src = memonLogo
                    }
                  }}
                />
              </div>
            </div>

            {/* Slogan Line below Header */}
            <div
              style={{
                textAlign: 'center',
                fontSize: 12.5,
                fontWeight: 900,
                color: '#111',
                marginTop: 1,
                lineHeight: 1.2,
              }}
            >
              {n.slogan}
            </div>

            {/* Clean Address Line (No Badge) */}
            <div
              style={{
                textAlign: 'center',
                color: '#b71c1c',
                fontSize: 11,
                fontWeight: 900,
                marginTop: 2,
                marginBottom: 3,
                borderBottom: '1px solid #e0e0e0',
                paddingBottom: 3,
                letterSpacing: 0.3,
                whiteSpace: 'nowrap',
              }}
            >
              {n.address}
            </div>
          </div>

          {/* 2. Number + Date Row (Separated with empty space in between, strictly aligned and centered) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '0 2px',
              height: 26,
            }}
          >
            {/* Number on Left */}
            <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              <div
                style={{
                  background: '#eff6ff',
                  border: '1.2px solid #bfdbfe',
                  borderRight: 'none',
                  color: '#1e40af',
                  fontWeight: 900,
                  fontSize: 12.5,
                  padding: '0 10px',
                  borderRadius: '4px 0 0 4px',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                  boxSizing: 'border-box',
                }}
              >
                {n.numberLabel}
              </div>
              <div
                style={{
                  background: '#fff',
                  border: '1.2px solid #bfdbfe',
                  borderRadius: '0 4px 4px 0',
                  height: '100%',
                  width: 130,
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0 6px',
                  boxSizing: 'border-box',
                }}
              >
                <CertInput section="noc" field="number" value={data.number} onChange={onChange} style={{ fontWeight: 800, fontSize: 12.5, color: '#1e40af' }} />
              </div>
            </div>

            {/* Date on Right */}
            <div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
              <div
                style={{
                  background: '#eff6ff',
                  border: '1.2px solid #bfdbfe',
                  borderRight: 'none',
                  color: '#1e40af',
                  fontWeight: 900,
                  fontSize: 12.5,
                  padding: '0 10px',
                  borderRadius: '4px 0 0 4px',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                  boxSizing: 'border-box',
                }}
              >
                {n.dateLabel}
              </div>
              <div
                style={{
                  background: '#fff',
                  border: '1.2px solid #bfdbfe',
                  borderRadius: '0 4px 4px 0',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 6px',
                  gap: 2,
                  boxSizing: 'border-box',
                }}
              >
                <div style={{ width: 28, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CertInput
                    section="noc"
                    field="dateDay"
                    value={data.dateDay}
                    onChange={onChange}
                    textAlign="center"
                    placeholder="DD"
                    style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1 }}
                  />
                </div>
                <span style={{ fontWeight: 800, fontSize: 12.5, lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>/</span>
                <div style={{ width: 28, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CertInput
                    section="noc"
                    field="dateMonth"
                    value={data.dateMonth}
                    onChange={onChange}
                    textAlign="center"
                    placeholder="MM"
                    style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1 }}
                  />
                </div>
                <span style={{ fontWeight: 800, fontSize: 12.5, lineHeight: 1, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>/</span>
                <div style={{ width: 44, height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <input
                    type="text"
                    value={data.dateYear ? (data.dateYear.length === 2 ? `૨૦${data.dateYear}` : data.dateYear) : ''}
                    onChange={(e) => {
                      const v = toGujaratiDigits(e.target.value).replace(/[^૦-૯]/g, '').slice(0, 4)
                      onChange('noc', 'dateYear', v.length === 4 ? v.slice(2) : v)
                    }}
                    placeholder="૨૦૨૬"
                    maxLength={4}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontWeight: 600,
                      fontSize: 12.5,
                      color: '#111',
                      padding: 0,
                      margin: 0,
                      textAlign: 'center',
                      lineHeight: 1,
                      verticalAlign: 'middle',
                      fontFamily: '"Noto Sans Gujarati", "Anek Gujarati", sans-serif',
                      boxSizing: 'border-box',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Royal Ornamental Certificate Title (Text Only, No Square Box, No Background) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              margin: '2px 0 3px',
            }}
          >
            {/* Left Heraldic Wing */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 45, height: 1.5, background: 'linear-gradient(90deg, transparent, #800000)' }} />
              <span style={{ color: '#d97706', fontSize: 13, lineHeight: 1 }}>❖</span>
              <div style={{ width: 18, height: 2, background: '#800000', borderRadius: 1 }} />
            </div>

            {/* Title Text Only */}
            <span
              style={{
                color: '#800000',
                fontWeight: 900,
                fontSize: 19,
                fontFamily: '"Noto Sans Gujarati", "Anek Gujarati", sans-serif',
                letterSpacing: 0.8,
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
              }}
            >
              {n.certificateTitle}
            </span>

            {/* Right Heraldic Wing */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 18, height: 2, background: '#800000', borderRadius: 1 }} />
              <span style={{ color: '#d97706', fontSize: 13, lineHeight: 1 }}>❖</span>
              <div style={{ width: 45, height: 1.5, background: 'linear-gradient(90deg, #800000, transparent)' }} />
            </div>
          </div>

          {/* 4. First Party Details */}
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111', display: 'flex', flexDirection: 'column', gap: 3.5 }}>
            {/* Salutation */}
            <div
              style={{
                color: '#d81b60',
                fontWeight: 900,
                fontSize: 14,
                textShadow: `
                  -1px -1px 0 #ffffff,
                   1px -1px 0 #ffffff,
                  -1px  1px 0 #ffffff,
                   1px  1px 0 #ffffff
                `,
              }}
            >
              {n.salutation}
            </div>

            {/* Pramukh Saheb / Secretary Saheb & Local Jamat */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div
                style={{
                  color: '#d81b60',
                  fontWeight: 900,
                  paddingLeft: 36,
                  textShadow: `
                    -1px -1px 0 #ffffff,
                     1px -1px 0 #ffffff,
                    -1px  1px 0 #ffffff,
                     1px  1px 0 #ffffff
                  `,
                }}
              >
                {n.pramukhLineLabel}
              </div>
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {underlineField('localJamat', '150px')}
                <span
                  style={{
                    color: '#d81b60',
                    fontWeight: 900,
                    fontSize: 13,
                    marginLeft: 4,
                    textShadow: `
                      -1px -1px 0 #ffffff,
                       1px -1px 0 #ffffff,
                      -1px  1px 0 #ffffff,
                       1px  1px 0 #ffffff
                    `,
                  }}
                >
                  {n.localJamatLabel}
                </span>
              </div>
            </div>

            {/* Mukam, Taluka, Jila */}
            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <span
                style={{
                  color: '#d81b60',
                  fontWeight: 900,
                  flexShrink: 0,
                  textShadow: `
                    -1px -1px 0 #ffffff,
                     1px -1px 0 #ffffff,
                    -1px  1px 0 #ffffff,
                     1px  1px 0 #ffffff
                  `,
                }}
              >
                {n.muqamLabel}
              </span>
              {underlineField('muqam', '180px')}
              <span
                style={{
                  color: '#d81b60',
                  fontWeight: 900,
                  flexShrink: 0,
                  marginLeft: 6,
                  textShadow: `
                    -1px -1px 0 #ffffff,
                     1px -1px 0 #ffffff,
                    -1px  1px 0 #ffffff,
                     1px  1px 0 #ffffff
                  `,
                }}
              >
                {n.talukaLabel}
              </span>
              {underlineField('taluka', '150px')}
              <span
                style={{
                  color: '#d81b60',
                  fontWeight: 900,
                  flexShrink: 0,
                  marginLeft: 6,
                  textShadow: `
                    -1px -1px 0 #ffffff,
                     1px -1px 0 #ffffff,
                    -1px  1px 0 #ffffff,
                     1px  1px 0 #ffffff
                  `,
                }}
              >
                {n.jilaLabel}
              </span>
              {underlineField('jila', 'auto', 1)}
            </div>

            {/* Assalamo Alaykum */}
            <div
              style={{
                color: '#d81b60',
                fontWeight: 900,
                textShadow: `
                  -1px -1px 0 #ffffff,
                   1px -1px 0 #ffffff,
                  -1px  1px 0 #ffffff,
                   1px  1px 0 #ffffff
                `,
              }}
            >
              {n.assalam}
            </div>

            {/* Salam baad gram haale */}
            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <span
                style={{
                  color: '#d81b60',
                  fontWeight: 900,
                  flexShrink: 0,
                  textShadow: `
                    -1px -1px 0 #ffffff,
                     1px -1px 0 #ffffff,
                    -1px  1px 0 #ffffff,
                     1px  1px 0 #ffffff
                  `,
                }}
              >
                {n.salamText}
              </span>
              {underlineField('gram', 'auto', 1)}
              <span
                style={{
                  color: '#d81b60',
                  fontWeight: 900,
                  flexShrink: 0,
                  marginLeft: 6,
                  textShadow: `
                    -1px -1px 0 #ffffff,
                     1px -1px 0 #ffffff,
                    -1px  1px 0 #ffffff,
                     1px  1px 0 #ffffff
                  `,
                }}
              >
                {n.haale}
              </span>
            </div>

            {/* Janaab (Member Name) */}
            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <span
                style={{
                  color: '#d81b60',
                  fontWeight: 900,
                  flexShrink: 0,
                  textShadow: `
                    -1px -1px 0 #ffffff,
                     1px -1px 0 #ffffff,
                    -1px  1px 0 #ffffff,
                     1px  1px 0 #ffffff
                  `,
                }}
              >
                {n.janaab}
              </span>
              {underlineField('memberName', 'auto', 1)}
            </div>

            {/* Rehvasi , na */}
            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <span
                style={{
                  color: '#d81b60',
                  fontWeight: 900,
                  flexShrink: 0,
                  textShadow: `
                    -1px -1px 0 #ffffff,
                     1px -1px 0 #ffffff,
                    -1px  1px 0 #ffffff,
                     1px  1px 0 #ffffff
                  `,
                }}
              >
                {n.rehvaasi}
              </span>
              {underlineField('rehvasi', 'auto', 1)}
              <span
                style={{
                  color: '#d81b60',
                  fontWeight: 900,
                  flexShrink: 0,
                  margin: '0 4px',
                  textShadow: `
                    -1px -1px 0 #ffffff,
                     1px -1px 0 #ffffff,
                    -1px  1px 0 #ffffff,
                     1px  1px 0 #ffffff
                  `,
                }}
              >
                ,
              </span>
              {underlineField('have', '120px')}
              <span
                style={{
                  color: '#d81b60',
                  fontWeight: 900,
                  flexShrink: 0,
                  marginLeft: 4,
                  textShadow: `
                    -1px -1px 0 #ffffff,
                     1px -1px 0 #ffffff,
                    -1px  1px 0 #ffffff,
                     1px  1px 0 #ffffff
                  `,
                }}
              >
                ના
              </span>
            </div>

            {/* Candidate 3 Detailed Lines */}
            {/* Line 1: * વર / કન્યાનું પૂરું નામ: */}
            <div style={{ display: 'flex', alignItems: 'center', width: '100%', marginTop: 1 }}>
              <span
                style={{
                  color: '#d81b60',
                  fontWeight: 900,
                  fontSize: 12.5,
                  flexShrink: 0,
                  textShadow: `
                    -1px -1px 0 #ffffff,
                     1px -1px 0 #ffffff,
                    -1px  1px 0 #ffffff,
                     1px  1px 0 #ffffff
                  `,
                }}
              >
                * વર / કન્યાનું પૂરું નામ:
              </span>
              {underlineField('dikraDikri', 'auto', 1)}
            </div>

            {/* Line 2: * જન્મ તારીખ / ઉંમર: ........... આધાર કાર્ડ નં.: ........... */}
            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <span
                style={{
                  color: '#d81b60',
                  fontWeight: 900,
                  fontSize: 12.5,
                  flexShrink: 0,
                  textShadow: `
                    -1px -1px 0 #ffffff,
                     1px -1px 0 #ffffff,
                    -1px  1px 0 #ffffff,
                     1px  1px 0 #ffffff
                  `,
                }}
              >
                * જન્મ તારીખ / ઉંમર:
              </span>
              {underlineField('candidateDob', 'auto', 1, 'left', data.candidateAge ? `${data.candidateAge} વર્ષ` : '')}
              <span
                style={{
                  color: '#d81b60',
                  fontWeight: 900,
                  fontSize: 12.5,
                  flexShrink: 0,
                  marginLeft: 8,
                  textShadow: `
                    -1px -1px 0 #ffffff,
                     1px -1px 0 #ffffff,
                    -1px  1px 0 #ffffff,
                     1px  1px 0 #ffffff
                  `,
                }}
              >
                આધાર કાર્ડ નં.:
              </span>
              {underlineField('candidateAadhaar', 'auto', 1)}
            </div>

            {/* Line 3: * વૈવાહિક સ્થિતિ: કુંવારા / પુનર્લગ્ન */}
            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <span
                style={{
                  color: '#d81b60',
                  fontWeight: 900,
                  fontSize: 12.5,
                  flexShrink: 0,
                  textShadow: `
                    -1px -1px 0 #ffffff,
                     1px -1px 0 #ffffff,
                    -1px  1px 0 #ffffff,
                     1px  1px 0 #ffffff
                  `,
                }}
              >
                * વૈવાહિક સ્થિતિ:
              </span>
              {underlineField('candidateMaritalStatus', '180px', null, 'left', 'કુંવારા / પુનર્લગ્ન')}
            </div>
          </div>

          {/* 5. Center Title 1 (Text Only, No Box, No Background) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              margin: '2px 0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 45, height: 1.5, background: 'linear-gradient(90deg, transparent, #0d2366)' }} />
              <span style={{ color: '#d97706', fontSize: 13, lineHeight: 1 }}>❖</span>
              <div style={{ width: 18, height: 2, background: '#0d2366', borderRadius: 1 }} />
            </div>

            <span
              style={{
                color: '#0d2366',
                fontWeight: 900,
                fontSize: 15.5,
                fontFamily: '"Noto Sans Gujarati", "Anek Gujarati", sans-serif',
                letterSpacing: 0.6,
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
              }}
            >
              {n.niNikahSection}
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 18, height: 2, background: '#0d2366', borderRadius: 1 }} />
              <span style={{ color: '#d97706', fontSize: 13, lineHeight: 1 }}>❖</span>
              <div style={{ width: 45, height: 1.5, background: 'linear-gradient(90deg, #0d2366, transparent)' }} />
            </div>
          </div>

          {/* 6. Second Party Details */}
          <div style={{ fontSize: 13, fontWeight: 700, color: '#111', display: 'flex', flexDirection: 'column', gap: 3.5 }}>
            {/* Aapni jamat gram, taluka, jila */}
            <div style={{ display: 'flex', alignItems: 'center', width: '100%', flexWrap: 'nowrap' }}>
              <span
                style={{
                  color: '#d81b60',
                  fontWeight: 900,
                  flexShrink: 0,
                  textShadow: `
                    -1px -1px 0 #ffffff,
                     1px -1px 0 #ffffff,
                    -1px  1px 0 #ffffff,
                     1px  1px 0 #ffffff
                  `,
                }}
              >
                {n.aapniJamatText}
              </span>
              {underlineField('apniJamatGram', 'auto', 1)}
              <span
                style={{
                  color: '#d81b60',
                  fontWeight: 900,
                  flexShrink: 0,
                  marginLeft: 4,
                  textShadow: `
                    -1px -1px 0 #ffffff,
                     1px -1px 0 #ffffff,
                    -1px  1px 0 #ffffff,
                     1px  1px 0 #ffffff
                  `,
                }}
              >
                {n.talukaLabel}
              </span>
              {underlineField('apniTaluka', 'auto', 1)}
              <span
                style={{
                  color: '#d81b60',
                  fontWeight: 900,
                  flexShrink: 0,
                  marginLeft: 4,
                  textShadow: `
                    -1px -1px 0 #ffffff,
                     1px -1px 0 #ffffff,
                    -1px  1px 0 #ffffff,
                     1px  1px 0 #ffffff
                  `,
                }}
              >
                {n.jilaLabel}
              </span>
              {underlineField('apniJila', 'auto', 1)}
            </div>

            {/* Janaab */}
            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <span
                style={{
                  color: '#d81b60',
                  fontWeight: 900,
                  flexShrink: 0,
                  textShadow: `
                    -1px -1px 0 #ffffff,
                     1px -1px 0 #ffffff,
                    -1px  1px 0 #ffffff,
                     1px  1px 0 #ffffff
                  `,
                }}
              >
                {n.janaab}
              </span>
              {underlineField('apniJawab', 'auto', 1)}
            </div>

            {/* Rehvasi na */}
            <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'flex-end' }}>
              {underlineField('apniRehvasi', 'auto', 1)}
              <span
                style={{
                  color: '#d81b60',
                  fontWeight: 900,
                  flexShrink: 0,
                  marginLeft: 6,
                  textShadow: `
                    -1px -1px 0 #ffffff,
                     1px -1px 0 #ffffff,
                    -1px  1px 0 #ffffff,
                     1px  1px 0 #ffffff
                  `,
                }}
              >
                {n.rehvaasi} ના
              </span>
            </div>

            {/* Second Party Candidate 3 Detailed Lines */}
            {/* Line 1: * વર / કન્યાનું પૂરું નામ: */}
            <div style={{ display: 'flex', alignItems: 'center', width: '100%', marginTop: 1 }}>
              <span
                style={{
                  color: '#d81b60',
                  fontWeight: 900,
                  fontSize: 12.5,
                  flexShrink: 0,
                  textShadow: `
                    -1px -1px 0 #ffffff,
                     1px -1px 0 #ffffff,
                    -1px  1px 0 #ffffff,
                     1px  1px 0 #ffffff
                  `,
                }}
              >
                * વર / કન્યાનું પૂરું નામ:
              </span>
              {underlineField('apniDikraDikri', 'auto', 1)}
            </div>

            {/* Line 2: * જન્મ તારીખ / ઉંમર: ........... આધાર કાર્ડ નં.: ........... */}
            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <span
                style={{
                  color: '#d81b60',
                  fontWeight: 900,
                  fontSize: 12.5,
                  flexShrink: 0,
                  textShadow: `
                    -1px -1px 0 #ffffff,
                     1px -1px 0 #ffffff,
                    -1px  1px 0 #ffffff,
                     1px  1px 0 #ffffff
                  `,
                }}
              >
                * જન્મ તારીખ / ઉંમર:
              </span>
              {underlineField('apniCandidateDob', 'auto', 1, 'left', data.apniCandidateAge ? `${data.apniCandidateAge} વર્ષ` : '')}
              <span
                style={{
                  color: '#d81b60',
                  fontWeight: 900,
                  fontSize: 12.5,
                  flexShrink: 0,
                  marginLeft: 8,
                  textShadow: `
                    -1px -1px 0 #ffffff,
                     1px -1px 0 #ffffff,
                    -1px  1px 0 #ffffff,
                     1px  1px 0 #ffffff
                  `,
                }}
              >
                આધાર કાર્ડ નં.:
              </span>
              {underlineField('apniCandidateAadhaar', 'auto', 1)}
            </div>

            {/* Line 3: * વૈવાહિક સ્થિતિ: કુંવારા / પુનર્લગ્ન */}
            <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
              <span
                style={{
                  color: '#d81b60',
                  fontWeight: 900,
                  fontSize: 12.5,
                  flexShrink: 0,
                  textShadow: `
                    -1px -1px 0 #ffffff,
                     1px -1px 0 #ffffff,
                    -1px  1px 0 #ffffff,
                     1px  1px 0 #ffffff
                  `,
                }}
              >
                * વૈવાહિક સ્થિતિ:
              </span>
              {underlineField('apniCandidateMaritalStatus', '180px', null, 'left', 'કુંવારા / પુનર્લગ્ન')}
            </div>

            {/* Insha Allah line */}
            <div
              style={{
                color: '#d81b60',
                fontWeight: 900,
                fontSize: 12.5,
                marginTop: 1,
                textShadow: `
                  -1px -1px 0 #ffffff,
                   1px -1px 0 #ffffff,
                  -1px  1px 0 #ffffff,
                   1px  1px 0 #ffffff
                `,
              }}
            >
              {n.inshaAllah}
            </div>
          </div>

          {/* 7. Center Title 2 (Text Only, No Box, No Background) */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              margin: '2px 0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 45, height: 1.5, background: 'linear-gradient(90deg, transparent, #0d2366)' }} />
              <span style={{ color: '#d97706', fontSize: 13, lineHeight: 1 }}>❖</span>
              <div style={{ width: 18, height: 2, background: '#0d2366', borderRadius: 1 }} />
            </div>

            <span
              style={{
                color: '#0d2366',
                fontWeight: 900,
                fontSize: 15.5,
                fontFamily: '"Noto Sans Gujarati", "Anek Gujarati", sans-serif',
                letterSpacing: 0.6,
                lineHeight: 1.2,
                whiteSpace: 'nowrap',
              }}
            >
              {n.programTitle}
            </span>

            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 18, height: 2, background: '#0d2366', borderRadius: 1 }} />
              <span style={{ color: '#d97706', fontSize: 13, lineHeight: 1 }}>❖</span>
              <div style={{ width: 45, height: 1.5, background: 'linear-gradient(90deg, #0d2366, transparent)' }} />
            </div>
          </div>

          {/* 8. Program Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3.5 }}>
              <div style={{ display: 'flex', alignItems: 'center', width: '100%', fontSize: 12.5, fontWeight: 700, height: 22 }}>
                <span
                  style={{
                    color: '#d81b60',
                    fontWeight: 900,
                    flexShrink: 0,
                    display: 'inline-flex',
                    alignItems: 'center',
                    height: 22,
                    textShadow: `
                      -1px -1px 0 #ffffff,
                       1px -1px 0 #ffffff,
                      -1px  1px 0 #ffffff,
                       1px  1px 0 #ffffff
                    `,
                  }}
                >
                  {n.engDateLabel}
                </span>
                <div style={{ width: 28, borderBottom: '1.2px solid #555', height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', marginLeft: 4 }}>
                  <CertInput
                    section="noc"
                    field="engDateDay"
                    value={data.engDateDay}
                    onChange={onChange}
                    textAlign="center"
                    placeholder="DD"
                    style={{ fontSize: 12.5, fontWeight: 600, height: '100%' }}
                  />
                </div>
                <span style={{ fontWeight: 800, fontSize: 12.5, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 22, lineHeight: '22px', margin: '0 2px' }}>/</span>
                <div style={{ width: 28, borderBottom: '1.2px solid #555', height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CertInput
                    section="noc"
                    field="engDateMonth"
                    value={data.engDateMonth}
                    onChange={onChange}
                    textAlign="center"
                    placeholder="MM"
                    style={{ fontSize: 12.5, fontWeight: 600, height: '100%' }}
                  />
                </div>
                <span style={{ fontWeight: 800, fontSize: 12.5, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', height: 22, lineHeight: '22px', margin: '0 2px' }}>/</span>
                <div style={{ width: 44, borderBottom: '1.2px solid #555', height: 22, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                  <input
                    type="text"
                    value={data.engDateYear ? (data.engDateYear.length === 2 ? `૨૦${data.engDateYear}` : data.engDateYear) : ''}
                    onChange={(e) => {
                      const v = toGujaratiDigits(e.target.value).replace(/[^૦-૯]/g, '').slice(0, 4)
                      onChange('noc', 'engDateYear', v.length === 4 ? v.slice(2) : v)
                    }}
                    placeholder="૨૦૨૬"
                    maxLength={4}
                    style={{
                      width: '100%',
                      height: '100%',
                      border: 'none',
                      outline: 'none',
                      background: 'transparent',
                      fontWeight: 600,
                      fontSize: 12.5,
                      color: '#111',
                      textAlign: 'center',
                      padding: 0,
                      margin: 0,
                      fontFamily: '"Noto Sans Gujarati", "Anek Gujarati", sans-serif',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  />
                </div>
                <span
                  style={{
                    color: '#d81b60',
                    fontWeight: 900,
                    flexShrink: 0,
                    marginLeft: 8,
                    marginRight: 4,
                    display: 'inline-flex',
                    alignItems: 'center',
                    height: 22,
                    textShadow: `
                      -1px -1px 0 #ffffff,
                       1px -1px 0 #ffffff,
                      -1px  1px 0 #ffffff,
                       1px  1px 0 #ffffff
                    `,
                  }}
                >
                  {n.neVar}
                </span>
                {underlineField('engDayName', 'auto', 1, 'left', 'દા.ત. રવિવાર')}
              </div>

            {/* Mukam Place */}
            <div style={{ display: 'flex', alignItems: 'center', width: '100%', fontSize: 12.5, fontWeight: 700, paddingLeft: 40, marginBottom: 6 }}>
              <span
                style={{
                  color: '#d81b60',
                  fontWeight: 900,
                  flexShrink: 0,
                  textShadow: `
                    -1px -1px 0 #ffffff,
                     1px -1px 0 #ffffff,
                    -1px  1px 0 #ffffff,
                     1px  1px 0 #ffffff
                  `,
                }}
              >
                {n.muqamLine}
              </span>
              {underlineField('muqamPlace', '380px')}
            </div>
          </div>

          {/* 9. 4 Legal & Social Undertaking Clauses Box (Moved from Page 2) */}
          <div
            style={{
              background: '#ffffff',
              border: '1.5px solid #1b5e20',
              borderRadius: 6,
              padding: '6px 10px',
              fontSize: 11,
              lineHeight: '16px',
              color: '#111',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)',
              display: 'flex',
              flexDirection: 'column',
              gap: 3.5,
              marginTop: 4,
            }}
          >
            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
              <div style={{ color: '#1b5e20', fontWeight: 900, minWidth: 14 }}>૧.</div>
              <div>
                <strong style={{ color: '#8b0000' }}>કોઈ લેણદેણ / વાંધો નથી:</strong> સદર નિકાહખ્વાની બાબતે અમારી જમાઅતના સભ્ય (આસામી) સામે કોઈ સામાજિક વાંધો, તકરાર કે જમાઅતનું કોઈ લ્હેણું બાકી નથી.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
              <div style={{ color: '#1b5e20', fontWeight: 900, minWidth: 14 }}>૨.</div>
              <div>
                <strong style={{ color: '#8b0000' }}>પુખ્ત વયની કાનૂની ખાતરી:</strong> બાળવિવાહ પ્રતિબંધક કાયદા અંતર્ગત બંને પક્ષકારો કાયદેસર લગ્ન વય (વર ૨૧ વર્ષ કે તેથી વધુ અને કન્યા ૧૮ વર્ષ કે તેથી વધુ) ધરાવે છે અને આ નિકાહ બંને પક્ષકારોની મુક્ત અને પરસ્પર સંમતિથી થાય છે.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
              <div style={{ color: '#1b5e20', fontWeight: 900, minWidth: 14 }}>૩.</div>
              <div>
                <strong style={{ color: '#8b0000' }}>સમાજના બંધારણ અને શિસ્તનું ચુસ્ત પાલન:</strong> છ પરગણા થરાદી મેમન જમાઅતના બંધારણ મુજબ લગ્ન પ્રસંગના તમામ સામાજિક નિયમો અને શિસ્ત (વરઘોડામાં ડીજે, ફટાકડા, બિનજરૂરી દેખાડો કે કુરિવાજો પરનો પ્રતિબંધ) માન્ય રાખવાના રહેશે. જો કોઈ સભ્ય નિયમભંગ કરશે તો સમાજના બંધારણ મુજબ પગલાં લેવાશે.
              </div>
            </div>

            <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
              <div style={{ color: '#1b5e20', fontWeight: 900, minWidth: 14 }}>૪.</div>
              <div>
                <strong style={{ color: '#8b0000' }}>હેતુ અને મર્યાદા:</strong> આ પ્રમાણપત્ર માત્ર સામાજિક શિસ્ત, ઓળખ અને અધિકૃત લગ્ન નોંધણીના હેતુ માટે આપવામાં આવેલ છે.
              </div>
            </div>
          </div>

          {/* 10. Purple Note Banner */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <div
              style={{
                background: '#5c1044',
                color: '#ffffff',
                borderRadius: 8,
                padding: '3px 10px',
                fontSize: 10.5,
                fontWeight: 800,
                textAlign: 'center',
                lineHeight: '15px',
                boxSizing: 'border-box',
              }}
            >
              <div>
                <span style={{ color: '#ffd600' }}>{n.noteTitle || 'નોંધ :-'} </span>
                છ પરગણા થરાદી મેમન જમાઅતના બંધારણ મુજબ
              </div>
              <div>
                શાદી પ્રસંગના નિયમોનું ચુસ્તપણે પાલન કરવાની સમાજના દરેક સભ્યની નૈતિક ફરજમાં આવે છે.
              </div>
            </div>

            {/* Bold Closing Declaration */}
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                lineHeight: '16px',
                textAlign: 'center',
                color: '#000000',
                padding: '0 6px',
              }}
            >
              {n.bodyText}
            </div>
          </div>

          {/* 11. Page 1 Bottom Indicator */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
              padding: '3px 10px',
              fontSize: 10,
              color: '#2e7d32',
              fontWeight: 800,
              fontStyle: 'italic',
              textAlign: 'center',
            }}
          >
            [ પૃષ્ઠ ૧ / ૨ &bull; પાછળ કાનૂની શરતો તથા સંમતિ પત્ર જુઓ ]
          </div>
        </div>
        </div>
      </div>


      {/* ══════════════════════════════════════════════════════════════
         PAGE 2 : કાનૂની ખાતરી, શરતો, સંમતિ પત્ર તથા સત્તાવાર મહોર
      ══════════════════════════════════════════════════════════════ */}
      <div
        className="certificate-page"
        style={{
          width: 650,
          maxWidth: 650,
          minWidth: 650,
          margin: '0 auto',
          fontFamily: '"Noto Sans Gujarati", "Anek Gujarati", "Noto Sans", Arial, sans-serif',
          background: 'linear-gradient(160deg, #f0f9ee 0%, #e8f5e2 60%, #f5fbf0 100%)',
          border: '3px solid #1b5e20',
          borderRadius: 6,
          padding: '5px',
          boxSizing: 'border-box',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 6px 28px rgba(27,94,32,0.18), 0 2px 6px rgba(0,0,0,0.10), inset 0 0 0 1.5px rgba(27,94,32,0.12)',
        }}
      >
        {/* Premium Inner Border Frame */}
        <div style={{
          border: '1.5px solid #2e7d32',
          borderRadius: 3,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          padding: '10px 12px 8px',
          position: 'relative',
          boxSizing: 'border-box',
        }}>
        {[['0','0'],['0','auto'],['auto','0'],['auto','auto']].map(([t,r],i)=>(
          <div key={i} style={{ position:'absolute', top:t!=='auto'?4:undefined, right:r!=='auto'?4:undefined, bottom:t==='auto'?4:undefined, left:r==='auto'?4:undefined, width:14, height:14, borderTop: i<2?'2.5px solid #1b5e20':undefined, borderBottom: i>=2?'2.5px solid #1b5e20':undefined, borderLeft: r==='auto'?'2.5px solid #1b5e20':undefined, borderRight: r!=='auto'?'2.5px solid #1b5e20':undefined, pointerEvents:'none', zIndex:2 }} />
        ))}
        {/* ── MAIN CONTENT WRAPPER PAGE 2 ── */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
            padding: '1px 3px',
          }}
        >
          {/* Header Block Page 2 */}
          <div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                padding: '0 4px',
              }}
            >
              <div style={{ width: 62, height: 62, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <img
                  src={letterpadLogo}
                  alt="RMJ"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                  onError={(e) => {
                    if (e.target.src !== memonLogo) {
                      e.target.src = memonLogo
                    }
                  }}
                />
              </div>

              <div style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ color: '#b71c1c', fontWeight: 900, fontSize: 11.5, lineHeight: 1.2 }}>
                  {n.quoteLine}
                </div>
                <div
                  style={{
                    fontFamily: '"Anek Gujarati", "Noto Sans Gujarati", sans-serif',
                    fontSize: 24,
                    fontWeight: 900,
                    color: '#ffffff',
                    whiteSpace: 'nowrap',
                    lineHeight: 1.15,
                    marginTop: 1,
                    textShadow: `
                      -2px -2px 0 #0a3d12,
                       0px -2px 0 #0a3d12,
                       2px -2px 0 #0a3d12,
                      -2px  0px 0 #0a3d12,
                       2px  0px 0 #0a3d12,
                      -2px  2px 0 #0a3d12,
                       0px  2px 0 #0a3d12,
                       2px  2px 0 #0a3d12,
                       3px  4px 3px rgba(0,0,0,0.5)
                    `,
                  }}
                >
                  {n.communityName}
                </div>
                <div style={{ fontSize: 10, fontWeight: 800, color: '#222' }}>{n.trustLine}</div>
              </div>

              <div style={{ width: 62, height: 62, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <img
                  src={letterpadLogo}
                  alt="RMJ"
                  style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
                  onError={(e) => {
                    if (e.target.src !== memonLogo) {
                      e.target.src = memonLogo
                    }
                  }}
                />
              </div>
            </div>

            {/* Reference & Page Badge Bar */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#f1f5f9',
                border: '1.2px solid #cbd5e1',
                color: '#0f172a',
                padding: '4px 12px',
                borderRadius: 4,
                marginTop: 4,
                fontSize: 12,
                fontWeight: 900,
                boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              }}
            >
              <div>NOC નં.: <span style={{ color: '#1e40af' }}>{data.number || '........'}</span></div>
              <div style={{ color: '#854d0e', fontWeight: 900 }}>પૃષ્ઠ ૨ : ખાતરી, પરવાનગી તથા કાનૂની સંમતિ પત્ર</div>
              <div>તા.: {data.dateDay || 'DD'}/{data.dateMonth || 'MM'}/૨૦{data.dateYear || 'YY'}</div>
            </div>
          </div>

          {/* Legal Disclaimer Box */}
          <div
            style={{
              background: '#fff9c4',
              border: '1.5px solid #fbc02d',
              borderLeft: '5px solid #e65100',
              borderRadius: 6,
              padding: '10px 14px',
              fontSize: 12,
              lineHeight: '18px',
              color: '#795548',
              fontWeight: 700,
            }}
          >
            <span style={{ color: '#b71c1c', fontWeight: 900 }}>કાનૂની જવાબદારી મુક્તિ નોંધ (Legal Disclaimer): </span>
            "આ એન.ઓ.સી. (N.O.C.) માત્ર સામાજિક ઓળખ, શિસ્ત અને જમાતના બંધારણ પૂરતી મર્યાદિત છે. પક્ષકારોના અંગત વ્યવહાર, આપ-લે (દહેજ વગેરે) કે ભવિષ્યના કોઈ પારિવારિક વિવાદ માટે રાધનપુર થરાદી મેમન જમાઅત કાનૂની રીતે જવાબદાર રહેશે નહીં."
          </div>

          {/* Member / Guardian Undertaking & Signature Section */}
          <div
            style={{
              background: '#ffffff',
              border: '1.5px solid #2e7d32',
              borderRadius: 8,
              padding: '12px 14px',
              boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
            }}
          >
            <div style={{ color: '#1b5e20', fontWeight: 900, fontSize: 12.5, borderBottom: '1.2px solid #e0e0e0', paddingBottom: 3, marginBottom: 4 }}>
              આસામી / વાલી તથા વર-કન્યાની સંમતિ અને કબૂલાત:
            </div>
            <div style={{ fontSize: 11.5, color: '#222', lineHeight: '17px', fontWeight: 600 }}>
              અમે નીચે સહી કરનાર ખાતરી આપીએ છીએ કે ઉપર જણાવેલ તમામ વિગતો સાચી છે અને અમે રાધનપુર થરાદી મેમન જમાઅતના તમામ સામાજિક નિયમો અને બંધારણનું પાલન કરવા સંપૂર્ણ બંધાયેલા છીએ.
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 24, padding: '0 10px' }}>
              <div style={{ textAlign: 'center', width: '45%' }}>
                <div style={{ borderTop: '1.2px dashed #444', paddingTop: 3, fontSize: 12, fontWeight: 900, color: '#111' }}>
                  આસામી / વાલીની સહી
                </div>
                <div style={{ fontSize: 11, color: '#555', fontWeight: 700, marginTop: 1 }}>
                  ({data.memberName || 'વાલીનું નામ'})
                </div>
              </div>

              <div style={{ textAlign: 'center', width: '45%' }}>
                <div style={{ borderTop: '1.2px dashed #444', paddingTop: 3, fontSize: 12, fontWeight: 900, color: '#111' }}>
                  વર / કન્યાની સહી
                </div>
                <div style={{ fontSize: 11, color: '#555', fontWeight: 700, marginTop: 1 }}>
                  ({data.dikraDikri || 'ઉમેદવારનું નામ'})
                </div>
              </div>
            </div>
          </div>

          {/* Official Seal & Jamaat Signatures Footer */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-end',
              padding: '8px 18px 2px',
              fontSize: 13,
              fontWeight: 900,
              color: '#8b0000',
            }}
          >
            {/* Secretary Signature */}
            <div style={{ textAlign: 'center', minWidth: 140 }}>
              <div style={{ borderTop: '1.5px solid #8b0000', paddingTop: 3, marginBottom: 2 }}>
                {n.secretarySign}
              </div>
              <div style={{ fontSize: 11, color: '#111', fontWeight: 800 }}>{n.footerCommunity}</div>
            </div>

            {/* Official Jamaat Seal Circle */}
            <div
              style={{
                width: 72,
                height: 72,
                border: '2px dashed #1b5e20',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10.5,
                fontWeight: 900,
                color: '#1b5e20',
                textAlign: 'center',
                lineHeight: 1.2,
                background: 'rgba(27, 94, 32, 0.05)',
              }}
            >
              જમાઅત<br />સિક્કો
            </div>

            {/* Pramukh Signature */}
            <div style={{ textAlign: 'center', minWidth: 140 }}>
              <div style={{ borderTop: '1.5px solid #8b0000', paddingTop: 3, marginBottom: 2 }}>
                {n.pramukhSign}
              </div>
              <div style={{ fontSize: 11, color: '#111', fontWeight: 800 }}>{n.footerCommunity}</div>
            </div>
          </div>

          <div style={{ textAlign: 'center', fontSize: 10.5, color: '#2e7d32', fontWeight: 800, marginTop: 'auto' }}>
            પૃષ્ઠ ૨ / ૨ &bull; રાધનપુર થરાદી મેમન જમાઅત N.O.C. પ્રમાણપત્ર
          </div>
        </div>
        </div>
      </div>
    </div>
  )
})

/* ══════════════════════════════════════════════════════════════
   MAIN PAGE CONTROLLER
══════════════════════════════════════════════════════════════ */
export default function CertificatePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const typeParam = searchParams.get('type') || 'marriage'
  const activeTab = ['marriage', 'letterhead', 'noc'].includes(typeParam) ? typeParam : 'marriage'

  // View mode: 'records' (default table view) | 'form' | 'sheet'
  const [activeView, setActiveView] = useState('records')

  // Search filter query
  const [searchQuery, setSearchQuery] = useState('')

  // Modals for live certificate preview sheet & form entry
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState(false)
  const [isFormModalOpen, setIsFormModalOpen] = useState(false)

  const [formData, setFormData] = useState(loadSavedData)
  const [editingRecordId, setEditingRecordId] = useState(null)
  const [recordsList, setRecordsList] = useState(loadSavedRecords)
  const [loadingRecords, setLoadingRecords] = useState(false)
  const [saving, setSaving] = useState(false)
  const [saveStatus, setSaveStatus] = useState(null)
  const [downloading, setDownloading] = useState(false)
  const [downloadingRecordId, setDownloadingRecordId] = useState(null)
  const printRef = useRef(null)

  // Switch tab in URL
  const handleTabChange = (tabKey) => {
    setSearchParams({ type: tabKey })
    setSearchQuery('')
  }

  // Fetch certificate details & saved records list from backend API
  const fetchRecords = useCallback(async () => {
    setLoadingRecords(true)
    try {
      // Dedicated endpoints: /certificates/marriage, /certificates/noc, /certificates/letterhead
      const endpoint = activeTab === 'marriage' ? '/certificates/marriage' : (activeTab === 'noc' ? '/certificates/noc' : '/certificates/letterhead')
      const res = await api.get(endpoint)
      const dataPayload = res.data?.data
      const rawList = Array.isArray(dataPayload)
        ? dataPayload
        : (Array.isArray(dataPayload?.list) ? dataPayload.list : [])

      setRecordsList(sanitizeRecords(rawList))
    } catch (err) {
      console.warn('Could not load records from backend:', err?.message)
      setRecordsList([])
    } finally {
      setLoadingRecords(false)
    }
  }, [activeTab])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  // Preload web fonts cache for instantaneous PDF generation


  const handleChange = useCallback((section, field, value) => {
    setFormData((prev) => ({
      ...prev,
      [section]: { ...prev[section], [field]: value },
    }))
    setSaveStatus(null)
  }, [])

  // Save or Update record into MongoDB Database Table
  const handleSaveRecord = async () => {
    setSaving(true)
    const currentData = formData[activeTab] || {}

    let certificateNumber = ''
    let primaryName = ''
    let secondaryName = ''
    let issuedDate = ''

    if (activeTab === 'marriage') {
      certificateNumber = currentData.number || currentData.regNumber || ''
      primaryName = currentData.dulhaName || ''
      secondaryName = currentData.dulhanFullName || ''
      issuedDate = [currentData.dateDay, currentData.dateMonth, currentData.dateYear ? (currentData.dateYear.length === 2 ? `20${currentData.dateYear}` : currentData.dateYear) : ''].filter(Boolean).join('/')
    } else if (activeTab === 'noc') {
      certificateNumber = currentData.number || currentData.regNumber || ''
      primaryName = currentData.memberName || ''
      secondaryName = currentData.dikraDikri || ''
      issuedDate = [currentData.dateDay, currentData.dateMonth, currentData.dateYear ? (currentData.dateYear.length === 2 ? `20${currentData.dateYear}` : currentData.dateYear) : ''].filter(Boolean).join('/')
    } else if (activeTab === 'letterhead') {
      issuedDate = currentData.date || ''
      primaryName = currentData.refNumber || 'Letter'
      secondaryName = currentData.letterTitle || ''
    }

    try {
      const jsonCfg = { headers: { 'Content-Type': 'application/json' } }
      if (editingRecordId && !String(editingRecordId).startsWith('rec_')) {
        await api.put(
          `/certificates/records/${editingRecordId}`,
          { type: activeTab, data: currentData },
          jsonCfg
        )
        setSaveStatus('updated')
        toast.success('Certificate updated successfully!')
      } else {
        await api.post(
          '/certificates/records',
          { type: activeTab, data: currentData },
          jsonCfg
        )
        setSaveStatus('created')
        toast.success('Certificate saved to table successfully!')
      }

      await fetchRecords()
      setIsFormModalOpen(false)
      setActiveView('records')
    } catch (err) {
      console.error('Backend save error:', err?.message)
      toast.error('Error saving certificate: ' + (err.response?.data?.message || err.message))
    } finally {
      setSaving(false)
      setTimeout(() => setSaveStatus(null), 3000)
    }
  }

  // Edit an existing record from history table
  const handleEditRecord = async (record) => {
    setEditingRecordId(record._id)
    try {
      if (record._id && !String(record._id).startsWith('rec_')) {
        const res = await api.get(`/certificates/records/${record._id}`)
        if (res.data?.data) {
          const fullRec = res.data.data
          setFormData((prev) => ({
            ...prev,
            [fullRec.type || record.type]: { ...(defaultData[fullRec.type || record.type] || {}), ...(fullRec.data || {}) },
          }))
          setIsFormModalOpen(true)
          return
        }
      }
    } catch (_) { }
    setFormData((prev) => ({
      ...prev,
      [record.type]: { ...(defaultData[record.type] || {}), ...(record.data || {}) },
    }))
    setIsFormModalOpen(true)
  }

  // Delete a record from table
  const handleDeleteRecord = async (id) => {
    const isConfirmed = await confirm('Are you sure you want to delete this certificate record? This action cannot be undone.', {
      confirmText: 'Delete',
      type: 'danger',
    })
    if (!isConfirmed) return
    try {
      if (!String(id).startsWith('rec_')) {
        await api.delete(`/certificates/records/${id}`)
      }
      setRecordsList((prev) => (Array.isArray(prev) ? prev : []).filter((r) => r && r._id !== id))
      toast.success('Certificate record deleted successfully')
    } catch (err) {
      toast.error('Error deleting record: ' + (err.message || 'Server error'))
    }
  }

  // View specific record directly in 1:1 Live Sheet view
  const handleViewRecord = async (record) => {
    setEditingRecordId(record._id)
    try {
      if (record._id && !String(record._id).startsWith('rec_')) {
        const res = await api.get(`/certificates/records/${record._id}`)
        if (res.data?.data) {
          const fullRec = res.data.data
          setFormData((prev) => ({
            ...prev,
            [fullRec.type || record.type]: { ...(defaultData[fullRec.type || record.type] || {}), ...(fullRec.data || {}) },
          }))
          setIsPreviewModalOpen(true)
          return
        }
      }
    } catch (_) { }
    setFormData((prev) => ({
      ...prev,
      [record.type]: { ...(defaultData[record.type] || {}), ...(record.data || {}) },
    }))
    setIsPreviewModalOpen(true)
  }

  // Reset to brand new blank form
  const handleNewForm = () => {
    setEditingRecordId(null)
    const resetSection = { ...defaultData[activeTab] }
    setFormData((prev) => ({
      ...prev,
      [activeTab]: resetSection,
    }))
    setIsFormModalOpen(true)
  }

  // Exact PDF download with instant capture & view sync
  const handleDownload = async () => {
    setDownloading(true)
    try {
      const names = {
        marriage: `Marriage-Certificate-${formData.marriage.number || 'New'}`,
        letterhead: `Letterhead-${formData.letterhead.refNumber || 'New'}`,
        noc: `NOC-Certificate-${formData.noc.number || 'New'}`,
      }
      await downloadAsPDF(printRef, names[activeTab], { pageRanges: activeTab === 'letterhead' ? undefined : '1-2' })
    } catch (e) {
      console.error('PDF download error:', e)
    } finally {
      setDownloading(false)
    }
  }

  // Direct PDF download from Saved Records Table
  const handleDownloadRecord = async (record) => {
    if (!record) return
    setDownloadingRecordId(record._id)
    const toastId = toast.loading(`Downloading certificate (1 of 1)...`)
    try {
      const prevFormData = formData
      const prevEditingId = editingRecordId

      let currentRecData = record.data || {}
      if (record._id && !String(record._id).startsWith('rec_')) {
        try {
          const res = await api.get(`/certificates/records/${record._id}`)
          if (res.data?.data?.data) {
            currentRecData = res.data.data.data
          }
        } catch (_) { }
      }

      // Load targeted record data into state
      setFormData((prev) => ({
        ...prev,
        [record.type]: { ...(defaultData[record.type] || {}), ...currentRecData },
      }))

      // Give React a tick to flush state update
      await new Promise((r) => setTimeout(r, 60))

      const names = {
        marriage: `Marriage-Certificate-${record.certificateNumber || currentRecData?.number || 'Record'}`,
        letterhead: `Letterhead-${record.primaryName || currentRecData?.refNumber || 'Record'}`,
        noc: `NOC-Certificate-${record.certificateNumber || currentRecData?.number || 'Record'}`,
      }

      await downloadAsPDF(printRef, names[record.type] || 'Certificate', { pageRanges: record.type === 'letterhead' ? undefined : '1-2' })

      // Restore form state
      setFormData(prevFormData)
      setEditingRecordId(prevEditingId)
      toast.dismiss(toastId)
      toast.success('Certificate downloaded successfully!')
    } catch (e) {
      console.error('Direct table PDF download error:', e)
      toast.dismiss(toastId)
      toast.error('Download failed, please try again.')
    } finally {
      setDownloadingRecordId(null)
    }
  }

  // Bulk download multiple certificates with live count progress toaster
  const handleBulkDownloadRecords = async (recordsToDownload) => {
    if (!Array.isArray(recordsToDownload) || recordsToDownload.length === 0) return
    const totalCount = recordsToDownload.length
    const prevFormData = formData
    const prevEditingId = editingRecordId

    const toastId = toast.loading(`Downloading: 0 of ${totalCount} certificates...`)

    let downloadedCount = 0

    for (let i = 0; i < totalCount; i++) {
      const rec = recordsToDownload[i]
      setDownloadingRecordId(rec._id)
      try {
        let currentRecData = rec.data || {}
        if (rec._id && !String(rec._id).startsWith('rec_')) {
          try {
            const res = await api.get(`/certificates/records/${rec._id}`)
            if (res.data?.data?.data) {
              currentRecData = res.data.data.data
            }
          } catch (_) { }
        }

        setFormData((prev) => ({
          ...prev,
          [rec.type]: { ...(defaultData[rec.type] || {}), ...currentRecData },
        }))

        // Wait for React to flush state to printRef
        await new Promise((r) => setTimeout(r, 80))

        const names = {
          marriage: `Marriage-Certificate-${rec.certificateNumber || currentRecData?.number || i + 1}`,
          letterhead: `Letterhead-${rec.primaryName || currentRecData?.refNumber || i + 1}`,
          noc: `NOC-Certificate-${rec.certificateNumber || currentRecData?.number || i + 1}`,
        }

        await downloadAsPDF(printRef, names[rec.type] || `Certificate-${i + 1}`, { pageRanges: rec.type === 'letterhead' ? undefined : '1-2' })
        downloadedCount++
        toast.loading(`Downloading: ${downloadedCount} of ${totalCount} certificates...`, { id: toastId })
        await new Promise((r) => setTimeout(r, 150))
      } catch (err) {
        console.error(`Error downloading certificate ${rec._id}:`, err)
      }
    }

    setFormData(prevFormData)
    setEditingRecordId(prevEditingId)
    setDownloadingRecordId(null)
    toast.dismiss(toastId)
    toast.success(`Successfully downloaded ${downloadedCount} of ${totalCount} certificate(s)!`)
  }

  // Delete multiple records
  const handleDeleteMultipleRecords = async (idsToDelete) => {
    if (!Array.isArray(idsToDelete) || idsToDelete.length === 0) return
    for (const id of idsToDelete) {
      try {
        if (!String(id).startsWith('rec_')) {
          await api.delete(`/certificates/records/${id}`)
        }
      } catch (_) { }
    }
    setRecordsList((prev) => {
      const updated = (Array.isArray(prev) ? prev : []).filter((r) => r && !idsToDelete.includes(r._id))
      try {
        localStorage.setItem('parivar_certificate_records_list', JSON.stringify(updated))
      } catch (_) { }
      return updated
    })
    toast.success(`Deleted ${idsToDelete.length} certificate record(s)`)
  }

  const getPageTitle = () => {
    if (activeTab === 'letterhead') return 'Letterhead'
    if (activeTab === 'noc') return 'NOC Certificate'
    return 'Marriage Certificate'
  }

  // Filtered records for table
  const safeList = Array.isArray(recordsList) ? recordsList.filter(Boolean) : []
  const filteredRecords = safeList.filter((r) => {
    if (!r || r.type !== activeTab) return false
    if (!searchQuery) return true
    const term = searchQuery.toLowerCase().trim()
    const certNo = String(r.certificateNumber || '').toLowerCase()
    const pName = String(r.primaryName || '').toLowerCase()
    const sName = String(r.secondaryName || '').toLowerCase()
    const iDate = String(r.issuedDate || '').toLowerCase()
    return certNo.includes(term) || pName.includes(term) || sName.includes(term) || iDate.includes(term)
  })

  // Tab buttons config matching the Admin Expense / Donation look
  const certificateTabs = [
    { key: 'marriage', label: 'Marriage Certificate', icon: Award },
    { key: 'letterhead', label: 'Letterhead', icon: FileText },
    { key: 'noc', label: 'NOC Certificate', icon: CheckCircle }
  ]

  return (
    <div className="space-y-4 text-text w-full animate-fade-in">
      {/* ── Top Header Toolbar matching AdminCrudPage ── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        {/* Left Side: Page Title and Subtitle */}
        <div className="flex-1">
          <h2 className="text-xl font-semibold text-text">{getPageTitle()}</h2>
          <p className="text-sm text-text-secondary mt-1">
            Manage, generate, and view {getPageTitle().toLowerCase()} records.
          </p>
        </div>

        {/* Right Side: Search Bar & Primary + Add Certificate Button */}
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <SearchInput
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onClear={() => setSearchQuery('')}
            placeholder={`Search ${getPageTitle().toLowerCase()}...`}
          />

          <Button
            onClick={handleNewForm}
            variant="primary"
            icon={<Plus className="w-4 h-4" />}
            className="h-10 shrink-0"
          >
            Add {getPageTitle()}
          </Button>
        </div>
      </div>

      {/* ── Primary Main Table View ── */}
      <RecordsHistoryTable
        records={filteredRecords}
        activeTab={activeTab}
        onEditRecord={handleEditRecord}
        onDeleteRecord={handleDeleteRecord}
        onDeleteMultipleRecords={handleDeleteMultipleRecords}
        onViewRecord={handleViewRecord}
        onDownloadRecord={handleDownloadRecord}
        onBulkDownloadRecords={handleBulkDownloadRecords}
        onAddNew={handleNewForm}
        downloadingId={downloadingRecordId}
        loading={loadingRecords}
      />

      {/* ── Modal Dialog for Form Entry (Add / Edit) ── */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title={editingRecordId ? `Edit ${getPageTitle()}` : `Add New ${getPageTitle()}`}
        maxWidth="max-w-4xl"
      >
        <CertificateEntryForm
          activeTab={activeTab}
          formData={formData}
          onChange={handleChange}
          onSaveRecord={handleSaveRecord}
          isEditing={!!editingRecordId}
          saving={saving}
          onSwitchToSheet={() => {
            setIsFormModalOpen(false)
            setIsPreviewModalOpen(true)
          }}
        />
      </Modal>

      {/* ── Modal Dialog for 1:1 Live Certificate Sheet Preview ── */}
      <Modal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        title={`Preview ${getPageTitle()}`}
        maxWidth="max-w-4xl"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="flex items-center justify-end w-full gap-2 pb-2 border-b border-border">
            <Button
              onClick={handleDownload}
              disabled={downloading}
              variant="primary"
              size="sm"
              icon={<Download className="w-4 h-4" />}
            >
              {downloading ? 'Generating PDF...' : 'Download PDF'}
            </Button>
            <Button
              onClick={() => {
                setIsPreviewModalOpen(false)
                setIsFormModalOpen(true)
              }}
              variant="outline"
              size="sm"
              icon={<Edit2 className="w-4 h-4" />}
            >
              Edit Form
            </Button>
          </div>

          <div className="overflow-x-auto w-full flex justify-center py-2 bg-surface-secondary/20 rounded-xl">
            {activeTab === 'marriage' && (
              <MarriageCertificateSheet
                data={formData.marriage}
                onChange={handleChange}
                printRef={printRef}
              />
            )}
            {activeTab === 'letterhead' && (
              <LetterheadSheet
                data={formData.letterhead}
                onChange={handleChange}
                printRef={printRef}
              />
            )}
            {activeTab === 'noc' && (
              <NocSheet data={formData.noc} onChange={handleChange} printRef={printRef} />
            )}
          </div>
        </div>
      </Modal>

      {/* Print Container with true dimensions for Instant Ultra-Fast PDF Generation (Off-screen, Zero Blinking) */}
      <div
        style={{
          position: 'fixed',
          left: '-99999px',
          top: '-99999px',
          zIndex: -9999,
          pointerEvents: 'none',
          opacity: 0,
          width: '650px',
        }}
      >
        <div style={{ width: '650px' }}>
          {activeTab === 'marriage' && (
            <MarriageCertificateSheet
              data={formData.marriage}
              onChange={handleChange}
              printRef={printRef}
            />
          )}
          {activeTab === 'letterhead' && (
            <LetterheadSheet
              data={formData.letterhead}
              onChange={handleChange}
              printRef={printRef}
            />
          )}
          {activeTab === 'noc' && (
            <NocSheet data={formData.noc} onChange={handleChange} printRef={printRef} />
          )}
        </div>
      </div>
    </div>
  )
}
