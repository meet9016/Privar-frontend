import React, { useState, useEffect } from 'react'
import Modal from './Modal'
import Button from './common/Button'
import Input from './common/Input'
import Select from './common/Select'
import DatePicker from './DatePicker'
import { Printer, FileText, CheckCircle2, ShieldCheck, UserCheck, Calendar, MapPin, Building2 } from 'lucide-react'
import { toast } from '../lib/toast'

export default function NocCertificateModal({ isOpen, onClose, initialData = {} }) {
  const [formData, setFormData] = useState({
    // Header & Meta
    certificate_no: '',
    issue_date: new Date().toISOString().slice(0, 10),
    valid_till_date: '',

    // Jamaat Authority Details
    jamaat_name: 'રાધનપુર થરાદી મેમન જમાઅત',
    trust_reg_no: 'ટ્રસ્ટ રજી. નં. બી-૫૨૯-મહેસાણા, તા. ૩૦-૯-૧૯૫૫',
    jamaat_address: 'ઠે. મેમન જમાતખાના, જુમ્મા મસ્જિદ પાસે, મુ. રાધનપુર, જી. પાટણ - ૩૮૫૩૪૦',

    // Destination / Recipient Jamaat
    recipient_title: 'પ્રમુખ સાહેબ / સેક્રેટરી સાહેબ',
    recipient_jamaat_name: 'સ્થાનિક મેમન જમાઅત',
    recipient_mukam: '',
    recipient_taluko: '',
    recipient_district: '',

    // First Party (Our Jamaat Member & Candidate)
    party1_asami_name: '',
    party1_residence: 'રાધનપુર',
    party1_role: 'સુપુત્ર', // 'સુપુત્ર' | 'સુપુત્રી'
    party1_candidate_name: '',
    party1_father_name: '',
    party1_mother_name: '',
    party1_dob: '',
    party1_age: '',
    party1_aadhaar: '',
    party1_marital_status: 'કુંવારા', // 'કુંવારા' | 'પુનર્લગ્ન'
    party1_divorce_notes: '',

    // Second Party (Other Jamaat Member & Candidate)
    party2_asami_name: '',
    party2_mukam: '',
    party2_taluko: '',
    party2_district: '',
    party2_candidate_name: '',
    party2_father_name: '',
    party2_mother_name: '',
    party2_dob: '',
    party2_age: '',
    party2_aadhaar: '',
    party2_marital_status: 'કુંવારા', // 'કુંવારા' | 'પુનર્લગ્ન'

    // Nikah Program Details
    nikah_date: '',
    nikah_day: '',
    nikah_venue: '',

    // Officials
    president_name: 'પ્રમુખ સાહેબ',
    secretary_name: 'સેક્રેટરી સાહેબ'
  })

  useEffect(() => {
    if (initialData && Object.keys(initialData).length > 0) {
      const isBride = String(initialData.gender || '').toLowerCase() === 'female'
      const candName = initialData.full_name || initialData.name || ''
      const fName = initialData.father_name || initialData.middle_name || ''
      const mName = initialData.mother_name || ''

      let birthDateStr = ''
      let calculatedAge = ''
      if (initialData.birthdate || initialData.dob) {
        const rawDate = initialData.birthdate || initialData.dob
        const d = new Date(rawDate)
        if (!isNaN(d.getTime())) {
          birthDateStr = d.toISOString().slice(0, 10)
          const diffMs = Date.now() - d.getTime()
          const ageDt = new Date(diffMs)
          calculatedAge = Math.abs(ageDt.getUTCFullYear() - 1970).toString()
        }
      }

      setFormData(prev => ({
        ...prev,
        certificate_no: `NOC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
        party1_asami_name: fName ? `${fName} (પિતા/વાલી)` : (candName ? `${candName}` : prev.party1_asami_name),
        party1_role: isBride ? 'સુપુત્રી' : 'સુપુત્ર',
        party1_candidate_name: candName,
        party1_father_name: fName,
        party1_mother_name: mName,
        party1_dob: birthDateStr || prev.party1_dob,
        party1_age: calculatedAge || prev.party1_age,
        party1_aadhaar: initialData.aadhaar_card || initialData.aadhar || initialData.aadhaar_number || prev.party1_aadhaar,
        party1_marital_status: (initialData.marital_status && initialData.marital_status.toLowerCase().includes('divorc')) ? 'પુનર્લગ્ન' : 'કુંવારા'
      }))
    } else {
      setFormData(prev => ({
        ...prev,
        certificate_no: prev.certificate_no || `NOC-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`
      }))
    }
  }, [initialData, isOpen])

  const handleInputChange = (field, value) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value }
      if (field === 'nikah_date' && value) {
        try {
          const d = new Date(value)
          const daysGuj = ['રવિવાર', 'સોમવાર', 'મંગળવાર', 'બુધવાર', 'ગુરુવાર', 'શુક્રવાર', 'શનિવાર']
          if (!isNaN(d.getTime())) {
            updated.nikah_day = daysGuj[d.getDay()]
            if (!updated.valid_till_date) {
              updated.valid_till_date = value
            }
          }
        } catch {
          // ignore
        }
      }
      return updated
    })
  }

  const formatGujaratiDate = (isoDate) => {
    if (!isoDate) return '....................'
    const parts = isoDate.split('-')
    if (parts.length === 3) {
      return `${parts[2]} / ${parts[1]} / ${parts[0]}`
    }
    return isoDate
  }

  const handlePrint = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Please allow popups to print the certificate')
      return
    }

    const {
      certificate_no,
      issue_date,
      valid_till_date,
      jamaat_name,
      trust_reg_no,
      jamaat_address,
      recipient_title,
      recipient_jamaat_name,
      recipient_mukam,
      recipient_taluko,
      recipient_district,
      party1_asami_name,
      party1_residence,
      party1_role,
      party1_candidate_name,
      party1_father_name,
      party1_mother_name,
      party1_dob,
      party1_age,
      party1_aadhaar,
      party1_marital_status,
      party1_divorce_notes,
      party2_asami_name,
      party2_mukam,
      party2_taluko,
      party2_district,
      party2_candidate_name,
      party2_father_name,
      party2_mother_name,
      party2_dob,
      party2_age,
      party2_aadhaar,
      party2_marital_status,
      nikah_date,
      nikah_day,
      nikah_venue
    } = formData

    const printHtml = `
      <!DOCTYPE html>
      <html lang="gu">
      <head>
        <meta charset="UTF-8">
        <title>ના-વાંધા પ્રમાણપત્ર (N.O.C.) - ${party1_candidate_name || 'Certificate'}</title>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Anek+Gujarati:wght@400;500;600;700;800&family=Noto+Sans+Gujarati:wght@400;500;600;700;800&display=swap" rel="stylesheet">
        <style>
          @page {
            size: A4 portrait;
            margin: 10mm 12mm 10mm 12mm;
          }
          * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          body {
            margin: 0;
            padding: 0;
            font-family: 'Anek Gujarati', 'Noto Sans Gujarati', 'Shruti', 'Gujarati Sangam MN', sans-serif;
            color: #1a1a1a;
            background-color: #f8fafc;
            line-height: 1.65;
            font-size: 14px;
          }
          .page-container {
            width: 100%;
            max-width: 210mm;
            margin: 0 auto;
          }
          .sheet {
            background: #ffffff;
            border: 2px solid #065f46;
            border-radius: 8px;
            padding: 24px 28px;
            position: relative;
            box-shadow: 0 4px 20px rgba(0,0,0,0.06);
            margin-bottom: 25px;
            page-break-after: always;
            min-height: 275mm;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          .sheet:last-child {
            page-break-after: auto;
            margin-bottom: 0;
          }
          .inner-border {
            position: absolute;
            top: 6px;
            left: 6px;
            right: 6px;
            bottom: 6px;
            border: 1px solid #10b981;
            border-radius: 6px;
            pointer-events: none;
          }
          .watermark {
            position: absolute;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%) rotate(-25deg);
            font-size: 68px;
            font-weight: 800;
            color: rgba(6, 95, 70, 0.04);
            white-space: nowrap;
            pointer-events: none;
            z-index: 0;
            user-select: none;
          }
          .content-layer {
            position: relative;
            z-index: 1;
            height: 100%;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
          }
          
          /* Header */
          .header-box {
            text-align: center;
            border-bottom: 2px solid #065f46;
            padding-bottom: 12px;
            margin-bottom: 14px;
          }
          .bismillah {
            font-size: 13px;
            font-weight: 600;
            color: #065f46;
            margin-bottom: 3px;
            letter-spacing: 0.5px;
          }
          .main-title {
            font-size: 24px;
            font-weight: 800;
            color: #064e3b;
            margin: 0 0 4px 0;
            letter-spacing: -0.3px;
          }
          .trust-info {
            font-size: 12px;
            font-weight: 600;
            color: #374151;
            margin-bottom: 2px;
          }
          .address-info {
            font-size: 12px;
            color: #4b5563;
          }
          
          /* Meta bar */
          .meta-bar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            border-bottom: 1px dashed #cbd5e1;
            padding: 6px 0 10px 0;
            margin-bottom: 12px;
            font-size: 13px;
          }
          .cert-badge {
            display: inline-block;
            background: #ecfdf5;
            color: #065f46;
            border: 1.5px solid #065f46;
            padding: 4px 18px;
            border-radius: 9999px;
            font-weight: 800;
            font-size: 15px;
            letter-spacing: 0.5px;
          }
          .cert-badge-center {
            text-align: center;
            margin: 8px 0 14px 0;
          }
          
          /* Recipient & Body */
          .recipient-box {
            background: #f8fafc;
            border-left: 3.5px solid #065f46;
            padding: 8px 12px;
            margin-bottom: 12px;
            border-radius: 0 6px 6px 0;
            font-size: 13px;
            line-height: 1.5;
          }
          .salutation {
            font-weight: 700;
            color: #065f46;
            margin: 10px 0 8px 0;
            font-size: 13.5px;
          }
          .body-p {
            margin: 8px 0;
            text-align: justify;
            line-height: 1.7;
          }
          .highlight {
            font-weight: 700;
            color: #111827;
            border-bottom: 1px dotted #6b7280;
            padding: 0 3px;
          }
          
          /* Data Cards / Sections */
          .info-card {
            border: 1px solid #e2e8f0;
            background: #ffffff;
            border-radius: 8px;
            padding: 10px 14px;
            margin: 8px 0;
          }
          .info-card-header {
            font-weight: 700;
            color: #065f46;
            font-size: 13px;
            margin-bottom: 6px;
            display: flex;
            align-items: center;
            gap: 6px;
            border-bottom: 1px solid #f1f5f9;
            padding-bottom: 4px;
          }
          .detail-list {
            margin: 0;
            padding-left: 0;
            list-style: none;
          }
          .detail-list li {
            position: relative;
            padding-left: 18px;
            margin: 5px 0;
            line-height: 1.55;
          }
          .detail-list li::before {
            content: "•";
            position: absolute;
            left: 4px;
            color: #065f46;
            font-weight: bold;
            font-size: 16px;
            top: -2px;
          }
          
          /* Clauses */
          .clause-box {
            background: #f0fdf4;
            border: 1px solid #bbf7d0;
            border-radius: 8px;
            padding: 10px 14px;
            margin: 10px 0;
          }
          .clause-title {
            font-weight: 700;
            color: #166534;
            margin-bottom: 6px;
            font-size: 13px;
          }
          .clause-ol {
            margin: 0;
            padding-left: 20px;
          }
          .clause-ol li {
            margin: 5px 0;
            font-size: 12.5px;
            line-height: 1.6;
            color: #1f2937;
          }
          .disclaimer-box {
            background: #fffbeb;
            border: 1px solid #fef3c7;
            border-left: 3.5px solid #d97706;
            padding: 8px 12px;
            border-radius: 0 6px 6px 0;
            font-size: 12px;
            color: #92400e;
            margin: 10px 0;
            line-height: 1.55;
          }
          
          /* Signatures Footer */
          .footer-section {
            margin-top: 18px;
            padding-top: 12px;
            border-top: 1px solid #e2e8f0;
          }
          .signatures-grid {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            margin-top: 25px;
            padding: 0 15px;
          }
          .sig-block {
            text-align: center;
            width: 30%;
          }
          .sig-line {
            width: 100%;
            height: 1px;
            background: #94a3b8;
            margin-bottom: 6px;
          }
          .sig-role {
            font-weight: 700;
            color: #0f172a;
            font-size: 13px;
          }
          .sig-sub {
            font-size: 11.5px;
            color: #64748b;
          }
          .seal-circle {
            width: 76px;
            height: 76px;
            border: 1.5px dashed #065f46;
            border-radius: 50%;
            margin: 0 auto 6px auto;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 10.5px;
            font-weight: 700;
            color: #065f46;
            text-align: center;
            line-height: 1.3;
            background: rgba(6, 95, 70, 0.03);
          }
          
          .page-footer-note {
            text-align: center;
            font-size: 11px;
            color: #94a3b8;
            margin-top: 10px;
          }

          @media print {
            body {
              background: #ffffff;
            }
            .sheet {
              box-shadow: none;
              margin: 0;
              padding: 16px 20px;
              border: 1.5px solid #065f46;
            }
          }
        </style>
      </head>
      <body>
        <div class="page-container">
          
          <!-- ================= PAGE 1 ================= -->
          <div class="sheet">
            <div class="inner-border"></div>
            <div class="watermark">${jamaat_name}</div>
            
            <div class="content-layer">
              <div>
                <!-- Header -->
                <div class="header-box">
                  <div class="bismillah">|| બિસ્મિલ્લાહિર રહ્માનિર રહીમ ||</div>
                  <h1 class="main-title">${jamaat_name}</h1>
                  <div class="trust-info">${trust_reg_no}</div>
                  <div class="address-info">${jamaat_address}</div>
                </div>

                <!-- Meta Numbers & Title -->
                <div class="meta-bar">
                  <div><strong>નંબર:</strong> <span class="highlight">${certificate_no || '....................'}</span></div>
                  <div><strong>તારીખ:</strong> <span class="highlight">${formatGujaratiDate(issue_date)}</span></div>
                </div>

                <div class="cert-badge-center">
                  <div class="cert-badge">ના-વાંધા પ્રમાણપત્ર (N.O.C.)</div>
                </div>

                <!-- Recipient Address -->
                <div class="recipient-box">
                  <div><strong>પ્રતિ,</strong></div>
                  <div>મોહતરમ જનાબ ${recipient_title},</div>
                  <div>${recipient_jamaat_name || 'સ્થાનિક મેમન જમાઅત'},</div>
                  <div>મુકામ: <span class="highlight">${recipient_mukam || '........................'}</span> &nbsp;|&nbsp; તાલુકો: <span class="highlight">${recipient_taluko || '........................'}</span> &nbsp;|&nbsp; જિલ્લો: <span class="highlight">${recipient_district || '........................'}</span></div>
                </div>

                <div class="salutation">અસ્સલામુ અલૈય  કુમ વ.વ..</div>

                <div class="body-p">
                  સલામ બાદ જણાવવાનું કે અમારી જમાઅતના સભ્ય (આસામી) જનાબ <span class="highlight">${party1_asami_name || '................................................'}</span>, રહેવાસી: <span class="highlight">${party1_residence || 'રાધનપુર'}</span> ના <strong>${party1_role}</strong>:
                </div>

                <!-- Party 1 Candidate Details Card -->
                <div class="info-card">
                  <div class="info-card-header">
                    <span>૧. અમારી જમાઅતના વર / કન્યા (ઉમેદવાર) ની વિગત:</span>
                  </div>
                  <ul class="detail-list">
                    <li><strong>વર / કન્યાનું પૂરું નામ:</strong> <span class="highlight">${party1_candidate_name || '........................................................................'}</span></li>
                    ${party1_father_name ? `<li><strong>પિતાનું નામ:</strong> <span class="highlight">${party1_father_name}</span> &nbsp;&nbsp;|&nbsp;&nbsp; <strong>માતાનું નામ:</strong> <span class="highlight">${party1_mother_name || '-'}</span></li>` : ''}
                    <li><strong>જન્મ તારીખ / ઉંમર:</strong> <span class="highlight">${formatGujaratiDate(party1_dob)}</span> ${party1_age ? `(${party1_age} વર્ષ)` : ''} &nbsp;&nbsp;|&nbsp;&nbsp; <strong>આધાર કાર્ડ નં.:</strong> <span class="highlight">${party1_aadhaar || '................................'}</span></li>
                    <li><strong>વૈવાહિક સ્થિતિ:</strong> <span class="highlight">${party1_marital_status || 'કુંવારા'}</span> ${party1_divorce_notes ? `(${party1_divorce_notes})` : ''}</li>
                  </ul>
                </div>

                <div class="body-p" style="margin-top: 10px;">
                  ની નિકાહખ્વાની આપની જમાઅતના નીચે મુજબના સભ્ય સાથે <strong>ઈન્શાઅલ્લાહ</strong> નક્કી થયેલ છે:
                </div>

                <!-- Party 2 Candidate Details Card -->
                <div class="info-card">
                  <div class="info-card-header">
                    <span>૨. સામેવાળા પક્ષકાર (આપની જમાઅત) ની વિગત:</span>
                  </div>
                  <ul class="detail-list">
                    <li><strong>આસામી (વાલી) નું નામ:</strong> <span class="highlight">${party2_asami_name || '........................................................................'}</span></li>
                    <li><strong>મુકામ:</strong> <span class="highlight">${party2_mukam || '........................'}</span> &nbsp;|&nbsp; <strong>તાલુકો:</strong> <span class="highlight">${party2_taluko || '........................'}</span> &nbsp;|&nbsp; <strong>જિલ્લો:</strong> <span class="highlight">${party2_district || '........................'}</span></li>
                    <li><strong>વર / કન્યાનું પૂરું નામ:</strong> <span class="highlight">${party2_candidate_name || '........................................................................'}</span></li>
                    ${party2_father_name ? `<li><strong>પિતાનું નામ:</strong> <span class="highlight">${party2_father_name}</span> &nbsp;&nbsp;|&nbsp;&nbsp; <strong>માતાનું નામ:</strong> <span class="highlight">${party2_mother_name || '-'}</span></li>` : ''}
                    <li><strong>જન્મ તારીખ / ઉંમર:</strong> <span class="highlight">${formatGujaratiDate(party2_dob)}</span> ${party2_age ? `(${party2_age} વર્ષ)` : ''} &nbsp;&nbsp;|&nbsp;&nbsp; <strong>આધાર કાર્ડ નં.:</strong> <span class="highlight">${party2_aadhaar || '................................'}</span></li>
                    <li><strong>વૈવાહિક સ્થિતિ:</strong> <span class="highlight">${party2_marital_status || 'કુંવારા'}</span></li>
                  </ul>
                </div>

                <!-- Nikah Schedule Card -->
                <div class="info-card" style="background: #faf5ff; border-color: #e9d5ff;">
                  <div class="info-card-header" style="color: #6b21a8; border-color: #f3e8ff;">
                    <span>૩. નિકાહખ્વાનીના પ્રોગ્રામની વિગત:</span>
                  </div>
                  <ul class="detail-list">
                    <li><strong>તારીખ અને વાર:</strong> તા. <span class="highlight">${formatGujaratiDate(nikah_date)}</span>, વાર: <span class="highlight">${nikah_day || '....................'}</span></li>
                    <li><strong>સ્થળ (મુકામ):</strong> <span class="highlight">${nikah_venue || '........................................................................'}</span></li>
                    ${valid_till_date ? `<li><strong>પ્રમાણપત્રની માન્યતા (Validity):</strong> આ NOC તા. <span class="highlight">${formatGujaratiDate(valid_till_date)}</span> (લગ્ન સંપન્ન થવા) સુધી માન્ય રહેશે.</li>` : ''}
                  </ul>
                </div>
              </div>

              <!-- Page 1 Bottom Signatures preview -->
              <div class="footer-section">
                <div style="font-size: 12px; color: #475569; text-align: right; margin-bottom: 4px;">
                  <em>(કાનૂની શરતો તથા ખાતરી માટે પૃષ્ઠ-૨ જુઓ...)</em>
                </div>
                <div class="signatures-grid">
                  <div class="sig-block">
                    <div class="sig-line"></div>
                    <div class="sig-role">સેક્રેટરી સાહેબ</div>
                    <div class="sig-sub">રાધનપુર મેમન જમાઅત</div>
                  </div>
                  <div class="sig-block">
                    <div class="seal-circle">જમાઅત સિક્કો</div>
                  </div>
                  <div class="sig-block">
                    <div class="sig-line"></div>
                    <div class="sig-role">પ્રમુખ સાહેબ</div>
                    <div class="sig-sub">રાધનપુર મેમન જમાઅત</div>
                  </div>
                </div>
                <div class="page-footer-note">પૃષ્ઠ ૧ / ૨ — રાધનપુર થરાદી મેમન જમાઅત N.O.C. પ્રમાણપત્ર</div>
              </div>
            </div>
          </div>


          <!-- ================= PAGE 2 (LEGAL CLAUSES, UNDERTAKING & ATTESTATION) ================= -->
          <div class="sheet">
            <div class="inner-border"></div>
            <div class="watermark">${jamaat_name}</div>

            <div class="content-layer">
              <div>
                <!-- Header (Compact on page 2) -->
                <div class="header-box">
                  <div class="bismillah">|| બિસ્મિલ્લાહિર રહ્માનિર રહીમ ||</div>
                  <h2 class="main-title" style="font-size: 21px;">${jamaat_name}</h2>
                  <div class="trust-info">${trust_reg_no}</div>
                  <div class="address-info">${jamaat_address}</div>
                </div>

                <!-- Meta Numbers -->
                <div class="meta-bar">
                  <div><strong>NOC સંદર્ભ નં.:</strong> <span class="highlight">${certificate_no || '....................'}</span></div>
                  <div><strong>પ્રમાણપત્ર પૃષ્ઠ:</strong> <span class="highlight">પૃષ્ઠ ૨ (કાનૂની શરતો તથા સંમતિ)</span></div>
                  <div><strong>તારીખ:</strong> <span class="highlight">${formatGujaratiDate(issue_date)}</span></div>
                </div>

                <div class="cert-badge-center" style="margin: 4px 0 10px 0;">
                  <div class="cert-badge" style="font-size: 14px; padding: 3px 14px;">ખાતરી, પરવાનગી તથા કાનૂની સંમતિ પત્ર</div>
                </div>

                <!-- 4 Core Undertaking / Permission Clauses -->
                <div class="clause-box">
                  <div class="clause-title">ખાતરી તથા પરવાનગીના મુખ્ય મુદ્દાઓ:</div>
                  <ol class="clause-ol">
                    <li><strong>કોઈ લેણદેણ / વાંધો નથી:</strong> સદર નિકાહખ્વાની બાબતે અમારી જમાઅતના સભ્ય (આસામી) સામે કોઈ સામાજિક વાંધો, તકરાર અને જમાઅતનું કોઈ લ્હેણું બાકી નથી.</li>
                    <li><strong>પુખ્ત વયની કાનૂની ખાતરી:</strong> બાળવિવાહ પ્રતિબંધક કાયદા અંતર્ગત બંને પક્ષકારો કાયદેસર લગ્ન વય (દીકરો ૨૧ વર્ષ કે તેથી વધુ અને દીકરી ૧૮ વર્ષ કે તેથી વધુ) ધરાવે છે અને આ નિકાહ બંને પક્ષકારોની મુક્ત અને પરસ્પર સંમતિથી થાય છે.</li>
                    <li><strong>સમાજના બંધારણ અને શિસ્તનું ચુસ્ત પાલન:</strong>UMTC મેમન જમાઅતના બંધારણ મુજબ લગ્ન પ્રસંગના તમામ સામાજિક નિયમો અને શિસ્ત (જેમ કે વરઘોડામાં ડીજે, ફટાકડા, બિનજરૂરી દેખાડો કે કુરિવાજો પરનો પ્રતિબંધ) માન્ય રાખવાના રહેશે. જો કોઈ સભ્ય નિયમભંગ કરશે તો સમાજના બંધારણ મુજબ કડક પગલાં લેવાશે.</li>
                    <li><strong>હેતુ અને મર્યાદા:</strong> આ પ્રમાણપત્ર માત્ર સામાજિક શિસ્ત, ઓળખ અને અધિકૃત લગ્ન નોંધણીના હેતુ માટે આપવામાં આવેલ છે.</li>
                  </ol>
                </div>

                <!-- Legal Disclaimer Clause -->
                <div class="disclaimer-box">
                  <strong>કાનૂની જવાબદારી મુક્તિ નોંધ (Legal Disclaimer):</strong><br>
                  "આ એન.ઓ.સી. (N.O.C.) માત્ર સામાજિક ઓળખ, શિસ્ત અને જમાતના બંધારણ પૂરતી મર્યાદિત છે. પક્ષકારોના અંગત વ્યવહાર, આપ-લે (દહેજ વગેરે) કે ભવિષ્યના કોઈ પારિવારિક વિવાદ માટે રાધનપુર થરાદી મેમન જમાઅત કાનૂની રીતે જવાબદાર રહેશે નહીં."
                </div>

                <!-- Member Undertaking / Signature Section -->
                <div class="info-card" style="margin-top: 10px;">
                  <div class="info-card-header">
                    <span>આસામી / વાલી તથા વર-કન્યાની સંમતિ અને કબૂલાત:</span>
                  </div>
                  <div style="font-size: 12.5px; line-height: 1.6; color: #334155;">
                    અમે નીચે સહી કરનાર ખાતરી આપીએ છીએ કે ઉપર જણાવેલ તમામ વિગતો સાચી છે અને અમે રાધનપુર થરાદી મેમન જમાઅતના તમામ સામાજિક નિયમો અને બંધારણનું પાલન કરવા સંપૂર્ણ બંધાયેલા છીએ.
                  </div>
                  
                  <div style="display: flex; justify-content: space-between; margin-top: 24px; padding: 0 10px;">
                    <div style="text-align: center; width: 45%;">
                      <div style="height: 1px; background: #cbd5e1; margin-bottom: 5px;"></div>
                      <div style="font-size: 12px; font-weight: 700; color: #0f172a;">આસામી / વાલીની સહી</div>
                      <div style="font-size: 11px; color: #64748b;">(${party1_asami_name || 'વાલી'})</div>
                    </div>
                    <div style="text-align: center; width: 45%;">
                      <div style="height: 1px; background: #cbd5e1; margin-bottom: 5px;"></div>
                      <div style="font-size: 12px; font-weight: 700; color: #0f172a;">વર / કન્યાની સહી</div>
                      <div style="font-size: 11px; color: #64748b;">(${party1_candidate_name || 'ઉમેદવાર'})</div>
                    </div>
                  </div>
                </div>

                <div class="body-p" style="margin-top: 8px; font-weight: 600; text-align: center; color: #064e3b;">
                  આથી સદર નિકાહખ્વાની સંપન્ન કરવા માટે આ 'ના-વાંધા પ્રમાણપત્ર' (N.O.C.) આપવામાં આવે છે.
                </div>
              </div>

              <!-- Page 2 Official Signatures Footer -->
              <div class="footer-section">
                <div class="signatures-grid">
                  <div class="sig-block">
                    <div class="sig-line"></div>
                    <div class="sig-role">સેક્રેટરી</div>
                    <div class="sig-sub">રાધનપુર મેમન જમાઅત</div>
                  </div>
                  <div class="sig-block">
                    <div class="seal-circle">જમાઅત સિક્કો</div>
                  </div>
                  <div class="sig-block">
                    <div class="sig-line"></div>
                    <div class="sig-role">પ્રમુખ</div>
                    <div class="sig-sub">રાધનપુર મેમન જમાઅત</div>
                  </div>
                </div>
                <div class="page-footer-note">પૃષ્ઠ ૨ / ૨ — રાધનપુર થરાદી મેમન જમાઅત N.O.C. પ્રમાણપત્ર</div>
              </div>
            </div>
          </div>

        </div>

        <script>
          window.onload = function() {
            setTimeout(function() {
              window.print();
            }, 300);
          }
        </script>
      </body>
      </html>
    `

    printWindow.document.open()
    printWindow.document.write(printHtml)
    printWindow.document.close()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="લગ્ન ના-વાંધા પ્રમાણપત્ર (Marriage N.O.C. Certificate)"
      maxWidth="max-w-4xl"
    >
      <div className="space-y-6">
        {/* Banner */}
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-start gap-3.5">
          <div className="p-2.5 rounded-xl bg-emerald-600 text-white shadow-xs shrink-0 mt-0.5">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-emerald-900 dark:text-emerald-300">
              રાધનપુર થરાદી મેમન જમાઅત - કાનૂની સંરક્ષિત ૨-પૃષ્ઠ N.O.C. પ્રમાણપત્ર
            </h4>
            <p className="text-xs text-emerald-700 dark:text-emerald-400 mt-1 leading-relaxed">
              આ ફોર્મ દ્વારા બાળવિવાહ પ્રતિબંધક કાયદો, પુખ્ત વય ખાતરી, આધાર કાર્ડ વિગત, બંધારણીય શિસ્ત અને જવાબદારી મુક્તિ (Disclaimer) સહિતનું સંપૂર્ણ માન્યતા પ્રાપ્ત પ્રમાણપત્ર પ્રિન્ટ કરી શકાશે.
            </p>
          </div>
        </div>

        {/* Certificate Meta */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-surface-secondary/50 p-3.5 rounded-2xl border border-border">
          <Input
            label="NOC પ્રમાણપત્ર નંબર"
            value={formData.certificate_no}
            onChange={(e) => handleInputChange('certificate_no', e.target.value)}
            placeholder="NOC-2026-XXXX"
          />
          <DatePicker
            label="તારીખ (Issue Date)"
            value={formData.issue_date}
            onChange={(val) => handleInputChange('issue_date', val)}
          />
          <DatePicker
            label="માન્યતા તારીખ (Valid Till Date)"
            value={formData.valid_till_date}
            onChange={(val) => handleInputChange('valid_till_date', val)}
          />
        </div>

        {/* Recipient Jamaat Box */}
        <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-secondary border-b border-border pb-2">
            <Building2 className="w-4 h-4 text-primary" />
            <span>સામેવાળી / સ્થાનિક જમાઅતની વિગત (પ્રતિ)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="હુદ્દો (Recipient Title)"
              value={formData.recipient_title}
              onChange={(e) => handleInputChange('recipient_title', e.target.value)}
              placeholder="પ્રમુખ સાહેબ / સેક્રેટરી સાહેબ"
            />
            <Input
              label="જમાઅતનું નામ"
              value={formData.recipient_jamaat_name}
              onChange={(e) => handleInputChange('recipient_jamaat_name', e.target.value)}
              placeholder="સ્થાનિક મેમન જમાઅત"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="મુકામ (City/Town)"
              value={formData.recipient_mukam}
              onChange={(e) => handleInputChange('recipient_mukam', e.target.value)}
              placeholder="દા.ત. પાટણ, થરાદ"
            />
            <Input
              label="તાલુકો"
              value={formData.recipient_taluko}
              onChange={(e) => handleInputChange('recipient_taluko', e.target.value)}
              placeholder="દા.ત. પાટણ"
            />
            <Input
              label="જિલ્લો"
              value={formData.recipient_district}
              onChange={(e) => handleInputChange('recipient_district', e.target.value)}
              placeholder="દા.ત. પાટણ, બનાસકાંઠા"
            />
          </div>
        </div>

        {/* Party 1: Our Member Details */}
        <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
          <div className="flex items-center justify-between border-b border-border pb-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-secondary">
              <UserCheck className="w-4 h-4 text-primary" />
              <span>૧. આપણી જમાઅતના ઉમેદવાર (વર / કન્યા)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleInputChange('party1_role', 'સુપુત્ર')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${formData.party1_role === 'સુપુત્ર'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-surface-secondary text-text-secondary hover:text-text'
                  }`}
              >
                વર (સુપુત્ર)
              </button>
              <button
                type="button"
                onClick={() => handleInputChange('party1_role', 'સુપુત્રી')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${formData.party1_role === 'સુપુત્રી'
                    ? 'bg-pink-600 text-white shadow-xs'
                    : 'bg-surface-secondary text-text-secondary hover:text-text'
                  }`}
              >
                કન્યા (સુપુત્રી)
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="સભ્ય (આસામી/વાલી) નું નામ"
              value={formData.party1_asami_name}
              onChange={(e) => handleInputChange('party1_asami_name', e.target.value)}
              placeholder="દા.ત. જનાબ અબ્દુલ કરીમભાઈ..."
            />
            <Input
              label="રહેવાસી"
              value={formData.party1_residence}
              onChange={(e) => handleInputChange('party1_residence', e.target.value)}
              placeholder="દા.ત. રાધનપુર"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="વર / કન્યાનું પૂરું નામ"
              value={formData.party1_candidate_name}
              onChange={(e) => handleInputChange('party1_candidate_name', e.target.value)}
              placeholder="ઉમેદવારનું પૂરું નામ"
            />
            <Input
              label="પિતાનું નામ"
              value={formData.party1_father_name}
              onChange={(e) => handleInputChange('party1_father_name', e.target.value)}
              placeholder="પિતાનું નામ"
            />
            <Input
              label="માતાનું નામ"
              value={formData.party1_mother_name}
              onChange={(e) => handleInputChange('party1_mother_name', e.target.value)}
              placeholder="માતાનું નામ"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <DatePicker
              label="જન્મ તારીખ"
              value={formData.party1_dob}
              onChange={(val) => handleInputChange('party1_dob', val)}
            />
            <Input
              label="ઉંમર (વર્ષ)"
              value={formData.party1_age}
              onChange={(e) => handleInputChange('party1_age', e.target.value)}
              placeholder="દા.ત. 24"
            />
            <Input
              label="આધાર કાર્ડ નંબર"
              value={formData.party1_aadhaar}
              onChange={(e) => handleInputChange('party1_aadhaar', e.target.value)}
              placeholder="XXXX XXXX XXXX"
            />
            <Select
              label="વૈવાહિક સ્થિતિ"
              value={formData.party1_marital_status}
              onChange={(val) => handleInputChange('party1_marital_status', val)}
              options={[
                { label: 'કુંવારા (Unmarried)', value: 'કુંવારા' },
                { label: 'પુનર્લગ્ન (Remarriage)', value: 'પુનર્લગ્ન' }
              ]}
            />
          </div>

          {formData.party1_marital_status === 'પુનર્લગ્ન' && (
            <Input
              label="છૂટાછેડા / શરઈ પુરાવાની વિગત"
              value={formData.party1_divorce_notes}
              onChange={(e) => handleInputChange('party1_divorce_notes', e.target.value)}
              placeholder="અગાઉના લગ્નના શરઈ/કાનૂની છૂટાછેડા થયેલ છે"
            />
          )}
        </div>

        {/* Party 2: Destination Member Details */}
        <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-secondary border-b border-border pb-2">
            <Building2 className="w-4 h-4 text-primary" />
            <span>૨. સામેવાળા પક્ષકાર (જ્યાં સગાઈ/નિકાહ નક્કી થયેલ છે)</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="સામેવાળા આસામી (વાલી) નું નામ"
              value={formData.party2_asami_name}
              onChange={(e) => handleInputChange('party2_asami_name', e.target.value)}
              placeholder="સામેવાળા વડીલ/વાલીનું નામ"
            />
            <Input
              label="વર / કન્યાનું પૂરું નામ"
              value={formData.party2_candidate_name}
              onChange={(e) => handleInputChange('party2_candidate_name', e.target.value)}
              placeholder="સામેવાળા ઉમેદવારનું નામ"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="મુકામ"
              value={formData.party2_mukam}
              onChange={(e) => handleInputChange('party2_mukam', e.target.value)}
              placeholder="મુકામ"
            />
            <Input
              label="તાલુકો"
              value={formData.party2_taluko}
              onChange={(e) => handleInputChange('party2_taluko', e.target.value)}
              placeholder="તાલુકો"
            />
            <Input
              label="જિલ્લો"
              value={formData.party2_district}
              onChange={(e) => handleInputChange('party2_district', e.target.value)}
              placeholder="જિલ્લો"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <DatePicker
              label="જન્મ તારીખ"
              value={formData.party2_dob}
              onChange={(val) => handleInputChange('party2_dob', val)}
            />
            <Input
              label="ઉંમર (વર્ષ)"
              value={formData.party2_age}
              onChange={(e) => handleInputChange('party2_age', e.target.value)}
              placeholder="દા.ત. 22"
            />
            <Input
              label="આધાર કાર્ડ નંબર"
              value={formData.party2_aadhaar}
              onChange={(e) => handleInputChange('party2_aadhaar', e.target.value)}
              placeholder="XXXX XXXX XXXX"
            />
            <Select
              label="વૈવાહિક સ્થિતિ"
              value={formData.party2_marital_status}
              onChange={(val) => handleInputChange('party2_marital_status', val)}
              options={[
                { label: 'કુંવારા (Unmarried)', value: 'કુંવારા' },
                { label: 'પુનર્લગ્ન (Remarriage)', value: 'પુનર્લગ્ન' }
              ]}
            />
          </div>
        </div>

        {/* Nikah Event Details */}
        <div className="p-4 rounded-2xl bg-card border border-border space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-text-secondary border-b border-border pb-2">
            <Calendar className="w-4 h-4 text-primary" />
            <span>૩. નિકાહખ્વાનીના પ્રોગ્રામની વિગત</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <DatePicker
              label="નિકાહની તારીખ"
              value={formData.nikah_date}
              onChange={(val) => handleInputChange('nikah_date', val)}
            />
            <Input
              label="વાર (Day)"
              value={formData.nikah_day}
              onChange={(e) => handleInputChange('nikah_day', e.target.value)}
              placeholder="દા.ત. રવિવાર"
            />
            <Input
              label="સ્થળ (મુકામ / વાડી / જમાતખાના)"
              value={formData.nikah_venue}
              onChange={(e) => handleInputChange('nikah_venue', e.target.value)}
              placeholder="દા.ત. મેમન જમાતખાના, રાધનપુર"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-border">
          <div className="text-xs text-text-secondary font-medium">
            <span className="font-bold text-emerald-600">✓ A4 ૨-પૃષ્ઠ લેઆઉટ:</span> પ્રથમ પેજ પર મુખ્ય પ્રમાણપત્ર અને બીજા પેજ પર કાનૂની શરતો તથા સંમતિ પ્રિન્ટ થશે.
          </div>
          <div className="flex items-center gap-2.5">
            <Button variant="secondary" onClick={onClose}>
              બંધ કરો (Close)
            </Button>
            <Button
              variant="primary"
              onClick={handlePrint}
              icon={<Printer className="w-4 h-4" />}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
            >
              પ્રમાણપત્ર પ્રિન્ટ કરો (Print NOC)
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}
