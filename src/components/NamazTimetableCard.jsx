import React, { forwardRef } from 'react';
import { assetUrl } from '../lib/api';
import leavesLeft from '../assets/prayer/leavesLeft.png';
import leavesRight from '../assets/prayer/leavesRight.png';
import jamatSealImg from '../assets/prayer/jamatSeal.png';
import dividerFlourishImg from '../assets/prayer/dividerFlourish.png';
import bottomLeftCornerImg from '../assets/prayer/bottomLeftCorner.png';
import bottomRightCornerImg from '../assets/prayer/bottomRightCorner.png';

// Ornate Mosque Dome & Minaret Icon (Amber Gold)
const MosqueIcon = ({ className = "w-4 h-4 text-[#B89237]" }) => (
  <svg viewBox="0 0 32 32" fill="currentColor" className={className}>
    <path d="M16 2C15.5 2 15 2.5 15 3V5.1C11.5 5.7 8.8 8.4 8.2 11.9H7C6.4 11.9 6 12.3 6 12.9V13.8C6 14.4 6.4 14.8 7 14.8H8V28C8 28.6 8.4 29 9 29H23C23.6 29 24 28.6 24 28V14.8H25C25.6 14.8 26 14.4 26 13.8V12.9C26 12.3 25.6 11.9 25 11.9H23.8C23.2 8.4 20.5 5.7 17 5.1V3C17 2.5 16.5 2 16 2ZM16 7C18.8 7 21 9.2 21 12H11C11 9.2 13.2 7 16 7ZM10 14H22V27H19V20C19 18.3 17.7 17 16 17C14.3 17 13 18.3 13 20V27H10V14ZM15 27V20C15 19.4 15.4 19 16 19C16.6 19 17 19.4 17 20V27H15Z" />
    <path d="M4 14H5V28H4C3.4 28 3 27.6 3 27V15C3 14.4 3.4 14 4 14ZM27 14H28C28.6 14 29 14.4 29 15V27C29 27.6 28.6 28 28 28H27V14Z" opacity="0.75" />
    <circle cx="16" cy="3.5" r="1.2" />
  </svg>
);

// Morning Sun Rising Icon
const SunriseIcon = ({ className = "w-4 h-4 text-[#D88D23]" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 2v4M4.93 10.93l2.83-2.83M19.07 10.93l-2.83-2.83M2 18h2M20 18h2M6 18a6 6 0 0 1 12 0" fill="#F8B84E" fillOpacity="0.4" />
    <line x1="2" y1="21" x2="22" y2="21" />
  </svg>
);

// High Sun Icon
const SunIcon = ({ className = "w-4 h-4 text-[#DF921F]" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="4.5" fill="#FBBF24" fillOpacity="0.5" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
  </svg>
);

// Sunset Icon
const SunsetIcon = ({ className = "w-4 h-4 text-[#D67118]" }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M12 10v4M4.93 10.93l2.83-2.83M19.07 10.93l-2.83-2.83M2 18h2M20 18h2M6 18a6 6 0 0 1 12 0" fill="#FB923C" fillOpacity="0.4" />
    <line x1="2" y1="21" x2="22" y2="21" />
    <polyline points="16 10 12 14 8 10" />
  </svg>
);

// Crescent Moon Icon
const MoonIcon = ({ className = "w-4 h-4 text-[#D6A02B]" }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

/**
 * Islamic Cartouche Plaque Header Badge
 * Generates the authentic green ornamental pill with side notches
 */
const CartoucheBadge = ({ label }) => {
  const gradId = React.useId ? React.useId().replace(/[^a-zA-Z0-9]/g, '') : `grad_${label}`;
  return (
    <div className="relative inline-flex items-center justify-center select-none min-w-[128px] sm:min-w-[140px] h-[30px] sm:h-[34px] px-6">
      {/* SVG ornamental cartouche with side-notches and gold bevel */}
      <svg viewBox="0 0 160 38" className="absolute inset-0 w-full h-full overflow-visible">
        <defs>
          <linearGradient id={gradId} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#2E6E45" />
            <stop offset="40%" stopColor="#225B36" />
            <stop offset="100%" stopColor="#143F24" />
          </linearGradient>
        </defs>
        {/* Outer scalloped notched plaque */}
        <path
          d="M 18 1 
             L 142 1 
             C 152 1, 159 8, 159 18 
             C 159 28, 152 37, 142 37 
             L 18 37 
             C 8 37, 1 28, 1 18 
             C 1 8, 8 1, 18 1 Z"
          fill={`url(#${gradId})`}
          stroke="#7AA669"
          strokeWidth="1.6"
        />
        {/* Side notch ornament arcs */}
        <path d="M 1 14 C 5 16, 5 22, 1 24" fill="none" stroke="#FAF6EE" strokeWidth="0.8" opacity="0.7" />
        <path d="M 159 14 C 155 16, 155 22, 159 24" fill="none" stroke="#FAF6EE" strokeWidth="0.8" opacity="0.7" />
        {/* Inner highlight line */}
        <path d="M 22 4 L 138 4" stroke="#87BF74" strokeWidth="0.9" strokeLinecap="round" opacity="0.6" />
      </svg>
      <span className="relative z-10 text-white font-['Noto_Sans_Gujarati'] font-black text-[15px] sm:text-[17px] tracking-wide pb-0.5">
        {label}
      </span>
    </div>
  );
};

/**
 * Single Prayer Row Card
 * Placed with proper spacing so the green badge NEVER overlaps the text!
 */
const PrayerRow = ({
  name = "ફજર",
  azan = "05:26",
  jamat = "05:45",
  qaza = "06:42",
  qazaLabel = "સુધી",
  iconType = "fajr"
}) => {
  let azanIcon = <SunIcon className="w-4 h-4 text-[#C98A28] shrink-0" />;
  let qazaIcon = <SunIcon className="w-4 h-4 text-[#C98A28] shrink-0" />;

  if (iconType === 'fajr') {
    azanIcon = <SunriseIcon className="w-4 h-4 text-[#D88D23] shrink-0" />;
    qazaIcon = <SunIcon className="w-4 h-4 text-[#D88D23] shrink-0" />;
  } else if (iconType === 'zohr') {
    azanIcon = <SunIcon className="w-4 h-4 text-[#D3841C] shrink-0" />;
    qazaIcon = <SunIcon className="w-4 h-4 text-[#D3841C] shrink-0" />;
  } else if (iconType === 'asr') {
    azanIcon = <SunIcon className="w-4 h-4 text-[#CF7D1C] shrink-0" />;
    qazaIcon = <SunIcon className="w-4 h-4 text-[#CF7D1C] shrink-0" />;
  } else if (iconType === 'maghrib') {
    azanIcon = <SunsetIcon className="w-4 h-4 text-[#D67118] shrink-0" />;
    qazaIcon = <MoonIcon className="w-4 h-4 text-[#D6A02B] shrink-0" />;
  } else if (iconType === 'isha') {
    azanIcon = <MoonIcon className="w-4 h-4 text-[#D6A02B] shrink-0" />;
    qazaIcon = <MoonIcon className="w-4 h-4 text-[#D6A02B] shrink-0" />;
  }

  return (
    <div className="relative pt-3 sm:pt-3.5 mb-2 sm:mb-2.5 font-['Noto_Sans_Gujarati']">
      {/* Green Header Cartouche centered on top border */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 z-20">
        <CartoucheBadge label={name} />
      </div>

      <div className="bg-[#FFFFFF]/95 rounded-2xl border-2 border-[#8EAB7F] shadow-xs px-2 sm:px-3 pt-5 sm:pt-6 pb-2.5 flex items-center justify-between text-[#1A2E16]">
        
        <div className="flex-1 flex items-center justify-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-semibold pr-1 border-r border-[#CBD8BF]">
          {azanIcon}
          <span className="font-black text-[#1F3A1A] whitespace-nowrap">અઝાન:</span>
          <span className="font-black text-[#10240E] font-mono text-[11.5px] sm:text-[13px] whitespace-nowrap">{azan}</span>
        </div>

        <div className="flex-1 flex items-center justify-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-semibold px-1 border-r border-[#CBD8BF]">
          <MosqueIcon className="w-4 h-4 text-[#B89237] shrink-0" />
          <span className="font-black text-[#1F3A1A] whitespace-nowrap">જમાત:</span>
          <span className="font-black text-[#10240E] font-mono text-[11.5px] sm:text-[13px] whitespace-nowrap">{jamat}</span>
        </div>

        <div className="flex-1 flex items-center justify-center gap-1 sm:gap-1.5 text-xs sm:text-sm font-semibold pl-1">
          {qazaIcon}
          <span className="font-black text-[#1F3A1A] whitespace-nowrap">કઝા:</span>
          <span className="font-black text-[#10240E] font-mono text-[11.5px] sm:text-[13px] whitespace-nowrap">{qaza}</span>
          {qazaLabel && <span className="text-[10px] font-bold text-[#3B5A33] whitespace-nowrap">{qazaLabel}</span>}
        </div>
      </div>
    </div>
  );
};

/**
 * Main Namaz Timetable Card Component
 * Exactly replicates the user's template with authentic foliage, seal, and clean spacing.
 */
const NamazTimetableCard = forwardRef(({ prayerTimes = {}, className = "" }, ref) => {
  const pt = {
    title: prayerTimes?.title || 'રાધનપુર મેમણ જમાત',
    subTitle: prayerTimes?.subTitle || 'રાધનપુર',
    logo: prayerTimes?.logo || '',
    fajr: prayerTimes?.fajr || { name: 'ફજર', azan: '05:26', jamat: '05:45', qaza: '06:42', qazaLabel: 'સુધી' },
    zohr: prayerTimes?.zohr || { name: 'ઝોહર', azan: '12:28', jamat: '12:45', qaza: '04:36', qazaLabel: 'સુધી' },
    asr: prayerTimes?.asr || { name: 'અસર', azan: '04:36', jamat: '04:50', qaza: '06:16', qazaLabel: 'સુધી' },
    maghrib: prayerTimes?.maghrib || { name: 'મગરીબ', azan: '06:16', jamat: '06:18', qaza: '07:29', qazaLabel: 'સુધી' },
    isha: prayerTimes?.isha || { name: 'ઈશા', azan: '07:29', jamat: '07:45', qaza: '05:25', qazaLabel: 'સુધી' },
    tahajjudEnd: prayerTimes?.tahajjudEnd || '05:25',
    sehriEnd: prayerTimes?.sehriEnd || '05:25',
    sunrise: prayerTimes?.sunrise || '06:42',
    ishraq: prayerTimes?.ishraq || '06:57',
    chasht: prayerTimes?.chasht || '08:30',
    iftar: prayerTimes?.iftar || '06:16',
    note: prayerTimes?.note || '',
  };

  return (
    <div
      ref={ref}
      className={`relative w-full max-w-[440px] mx-auto rounded-[32px] overflow-hidden p-3.5 sm:p-5 shadow-2xl transition-all border-4 border-[#789664]/60 font-['Noto_Sans_Gujarati'] select-none ${className}`}
      style={{
        background: 'linear-gradient(180deg, #FAF7EE 0%, #F5F1E2 50%, #ECE7D2 100%)',
        boxShadow: '0 20px 40px -15px rgba(22, 45, 20, 0.25), 0 0 0 1px rgba(112, 142, 94, 0.3) inset'
      }}
    >
      {/* Decorative Inner Olive Border Line */}
      <div className="absolute inset-2 sm:inset-3 rounded-[24px] border border-[#A7BE93]/70 pointer-events-none z-0"></div>

      {/* Authentic Watercolor Olive Leaves in Top Left Corner */}
      <div className="absolute top-0 left-0 w-24 sm:w-28 pointer-events-none select-none z-10">
        <img
          src={leavesLeft}
          alt=""
          className="w-full h-auto object-contain"
        />
      </div>

      {/* Authentic Watercolor Olive Leaves in Top Right Corner */}
      <div className="absolute top-0 right-0 w-24 sm:w-28 pointer-events-none select-none z-10">
        <img
          src={leavesRight}
          alt=""
          className="w-full h-auto object-contain"
        />
      </div>

      {/* Authentic Bottom Left Corner Accent */}
      <div className="absolute bottom-0 left-0 w-12 sm:w-14 pointer-events-none select-none z-10">
        <img
          src={bottomLeftCornerImg}
          alt=""
          className="w-full h-auto object-contain"
        />
      </div>

      {/* Authentic Bottom Right Corner Accent */}
      <div className="absolute bottom-0 right-0 w-12 sm:w-14 pointer-events-none select-none z-10">
        <img
          src={bottomRightCornerImg}
          alt=""
          className="w-full h-auto object-contain"
        />
      </div>

      {/* Card Content */}
      <div className="relative z-10 flex flex-col pt-1">
        
        {/* Top Jamat Logo Crest */}
        <div className="flex flex-col items-center justify-center mb-1.5 select-none">
          {pt.logo ? (
            <div className="relative flex flex-col items-center justify-center">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full p-1 bg-gradient-to-b from-[#8C2923] via-[#B88636] to-[#5B7846] shadow-md flex items-center justify-center">
                <div className="w-full h-full rounded-full bg-[#FAF5EB] p-1.5 flex items-center justify-center overflow-hidden border-2 border-[#C6A24D]">
                  <img src={assetUrl(pt.logo)} alt={pt.title} className="w-full h-full object-contain" />
                </div>
              </div>
              {pt.subTitle && (
                <div className="relative -mt-3.5 z-10 px-4 py-0.5 rounded-full bg-gradient-to-r from-[#17488B] via-[#1E5FB4] to-[#17488B] text-white text-[11px] font-bold tracking-wider shadow border border-[#6FA4E8]">
                  {pt.subTitle}
                </div>
              )}
            </div>
          ) : (
            <div className="relative flex flex-col items-center justify-center">
              <img
                src={jamatSealImg}
                alt={pt.title}
                className="w-24 h-24 sm:w-28 sm:h-28 object-contain drop-shadow-md"
              />
            </div>
          )}
        </div>

        {/* 5 Farz Namaz Timings Rows */}
        <div className="space-y-1 sm:space-y-1.5 my-1">
          <PrayerRow
            name={pt.fajr?.name || "ફજર"}
            azan={pt.fajr?.azan || "05:26"}
            jamat={pt.fajr?.jamat || "05:45"}
            qaza={pt.fajr?.qaza || "06:42"}
            qazaLabel={pt.fajr?.qazaLabel || "સુધી"}
            iconType="fajr"
          />

          <PrayerRow
            name={pt.zohr?.name || "ઝોહર"}
            azan={pt.zohr?.azan || "12:28"}
            jamat={pt.zohr?.jamat || "12:45"}
            qaza={pt.zohr?.qaza || "04:36"}
            qazaLabel={pt.zohr?.qazaLabel || "સુધી"}
            iconType="zohr"
          />

          <PrayerRow
            name={pt.asr?.name || "અસર"}
            azan={pt.asr?.azan || "04:36"}
            jamat={pt.asr?.jamat || "04:50"}
            qaza={pt.asr?.qaza || "06:16"}
            qazaLabel={pt.asr?.qazaLabel || "સુધી"}
            iconType="asr"
          />

          <PrayerRow
            name={pt.maghrib?.name || "મગરીબ"}
            azan={pt.maghrib?.azan || "06:16"}
            jamat={pt.maghrib?.jamat || "06:18"}
            qaza={pt.maghrib?.qaza || "07:29"}
            qazaLabel={pt.maghrib?.qazaLabel || "સુધી"}
            iconType="maghrib"
          />

          <PrayerRow
            name={pt.isha?.name || "ઈશા"}
            azan={pt.isha?.azan || "07:29"}
            jamat={pt.isha?.jamat || "07:45"}
            qaza={pt.isha?.qaza || "05:25"}
            qazaLabel={pt.isha?.qazaLabel || "સુધી"}
            iconType="isha"
          />
        </div>

        {/* Center Vintage Arabesque Divider */}
        <div className="flex items-center justify-center gap-2 py-2 w-full select-none">
          <div className="h-[1.5px] bg-gradient-to-r from-transparent via-[#86996D] to-[#516B40] flex-1"></div>
          <img
            src={dividerFlourishImg}
            alt=""
            className="h-4 sm:h-4.5 w-auto object-contain opacity-80"
          />
          <div className="h-[1.5px] bg-gradient-to-l from-transparent via-[#86996D] to-[#516B40] flex-1"></div>
        </div>

        {/* 2x2 Bottom Grid */}
        <div className="grid grid-cols-2 gap-2 sm:gap-2.5 mt-1">
          {/* Box 1: Tahajjud End Time */}
          <div className="bg-[#FFFFFF]/95 rounded-2xl border-2 border-[#8EAB7F] py-2.5 px-2 flex flex-col items-center justify-between text-center shadow-xs min-h-[76px]">
            <span className="text-[12px] sm:text-[13px] font-black text-[#1E3A1A] whitespace-nowrap leading-tight">
              તહજુદ છેલ્લો સમય:
            </span>
            <span className="text-xl sm:text-2xl font-black text-[#10240E] font-mono tracking-tight mt-0.5">
              {pt.tahajjudEnd}
            </span>
          </div>

          {/* Box 2: Sehri End Time */}
          <div className="bg-[#FFFFFF]/95 rounded-2xl border-2 border-[#8EAB7F] py-2.5 px-2 flex flex-col items-center justify-between text-center shadow-xs min-h-[76px]">
            <span className="text-[12px] sm:text-[13px] font-black text-[#1E3A1A] whitespace-nowrap leading-tight">
              સેહરી છેલ્લો સમય:
            </span>
            <span className="text-xl sm:text-2xl font-black text-[#10240E] font-mono tracking-tight mt-0.5">
              {pt.sehriEnd}
            </span>
          </div>

          {/* Box 3: Sunrise, Ishraq & Chasht */}
          <div className="bg-[#FFFFFF]/95 rounded-2xl border-2 border-[#8EAB7F] py-2 px-2 flex flex-col items-center justify-between text-center shadow-xs min-h-[76px]">
            <div className="flex items-center justify-center gap-1.5 leading-tight">
              <span className="text-[12px] sm:text-[13px] font-black text-[#1E3A1A] whitespace-nowrap">
                સૂર્યોદય:
              </span>
              <span className="text-base sm:text-lg font-black text-[#10240E] font-mono tracking-tight">
                {pt.sunrise}
              </span>
            </div>
            <div className="flex items-center justify-center gap-1.5 text-[10px] sm:text-[11px] font-bold text-[#2A4725] leading-tight pt-1 border-t border-[#CBD8BF]/70 w-full whitespace-nowrap">
              <span>ઈશરાક: <span className="font-mono font-black">{pt.ishraq}</span></span>
              <span className="text-[#8EAB7F]">•</span>
              <span>ચાશ્ત: <span className="font-mono font-black">{pt.chasht}</span></span>
            </div>
          </div>

          {/* Box 4: Iftar Time */}
          <div className="bg-[#FFFFFF]/95 rounded-2xl border-2 border-[#8EAB7F] py-2.5 px-2 flex flex-col items-center justify-between text-center shadow-xs min-h-[76px]">
            <span className="text-[12px] sm:text-[13px] font-black text-[#1E3A1A] whitespace-nowrap leading-tight">
              ઈફ્તારી સમય:
            </span>
            <span className="text-xl sm:text-2xl font-black text-[#10240E] font-mono tracking-tight mt-0.5">
              {pt.iftar}
            </span>
          </div>
        </div>

        {/* Optional Custom Note if present */}
        {pt.note && (
          <div className="mt-2 text-center text-xs text-[#35522F] font-semibold bg-[#EBF1E3]/80 rounded-xl py-1 px-2 border border-[#9EB88A]">
            {pt.note}
          </div>
        )}
      </div>
    </div>
  );
});

export default NamazTimetableCard;
