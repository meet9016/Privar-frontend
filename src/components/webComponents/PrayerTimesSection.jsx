import React, { useEffect, useState, useRef } from 'react';
import { Clock, Download, Share2, Sparkles, CheckCircle2, Moon, Sun, BellRing } from 'lucide-react';
import api from '../../lib/api';
import NamazTimetableCard from '../NamazTimetableCard';
import { toast } from '../../lib/toast';

export default function PrayerTimesSection() {
  const [prayerTimes, setPrayerTimes] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [downloading, setDownloading] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    fetchPrayerTimes();
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchPrayerTimes = async () => {
    try {
      setLoading(true);
      const res = await api.get('/prayer-times');
      const data = res.data?.data || res.data || {};
      setPrayerTimes(data);
    } catch (err) {
      console.warn('Failed to fetch prayer times:', err.message);
    } finally {
      setLoading(false);
    }
  };

  // Do not render if explicitly disabled
  if (loading || !prayerTimes || prayerTimes.enabled === false || prayerTimes.showOnWebsite === false) {
    return null;
  }

  // Handle Download Image
  const handleDownloadCard = async () => {
    if (!cardRef.current) return;
    setDownloading(true);

    const offscreenContainer = document.createElement('div');
    offscreenContainer.style.position = 'fixed';
    offscreenContainer.style.left = '-9999px';
    offscreenContainer.style.top = '0';
    offscreenContainer.style.width = '440px';
    offscreenContainer.style.minWidth = '440px';
    offscreenContainer.style.maxWidth = '440px';
    offscreenContainer.style.zIndex = '-99999';
    offscreenContainer.style.overflow = 'visible';
    offscreenContainer.style.background = 'transparent';

    const clone = cardRef.current.cloneNode(true);
    clone.style.width = '440px';
    clone.style.minWidth = '440px';
    clone.style.maxWidth = '440px';
    clone.style.margin = '0';
    clone.style.transform = 'none';
    clone.style.boxShadow = 'none';

    offscreenContainer.appendChild(clone);
    document.body.appendChild(offscreenContainer);

    try {
      if (document.fonts && document.fonts.ready) {
        await document.fonts.ready;
      }

      const imgs = Array.from(clone.querySelectorAll('img'));
      await Promise.all(
        imgs.map((img) => {
          if (img.complete) return Promise.resolve();
          return new Promise((res) => {
            img.onload = res;
            img.onerror = res;
          });
        })
      );

      let dataUrl = null;

      try {
        const { toPng } = await import('html-to-image');
        dataUrl = await toPng(clone, {
          skipFonts: true,
          pixelRatio: 2.5,
          cacheBust: false,
          backgroundColor: '#F9F6ED',
          width: 440,
          height: clone.scrollHeight || clone.offsetHeight,
          style: {
            width: '440px',
            minWidth: '440px',
            maxWidth: '440px',
            margin: '0',
            transform: 'none'
          }
        });
      } catch (errHtmlToImage) {
        console.warn('html-to-image export failed, attempting html2canvas:', errHtmlToImage);
      }

      if (!dataUrl) {
        const html2canvas = (await import('html2canvas')).default;
        const canvas = await html2canvas(clone, {
          scale: 2.5,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#F9F6ED',
          width: 440,
          windowWidth: 1200
        });
        dataUrl = canvas.toDataURL('image/png');
      }

      if (!dataUrl) throw new Error('Failed to generate image data URL');

      const safeTitle = (prayerTimes?.title || 'Jamat')
        .replace(/[/\\?%*:|"<>]/g, '-')
        .trim();
      const link = document.createElement('a');
      link.download = `Namaz-Timetable-${safeTitle}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success('નમાઝ ટાઈમટેબલ સફળતાપૂર્વક ડાઉનલોડ થઈ ગયું!');
    } catch (err) {
      console.error('Download flyer error:', err);
      toast.error('ઈમેજ ડાઉનલોડ કરવામાં ક્ષતિ આવી.');
    } finally {
      if (offscreenContainer.parentNode) {
        offscreenContainer.parentNode.removeChild(offscreenContainer);
      }
      setDownloading(false);
    }
  };

  // Handle WhatsApp Share
  const handleWhatsAppShare = () => {
    const pt = prayerTimes;
    const msg = `🕌 *${pt.title || 'રાધનપુર મેમણ જમાત'} - નમાઝ સમયપત્રક*\n📍 ${pt.subTitle || 'રાધનપુર'}\n\n` +
      `🟢 *ફજર:* અઝાન ${pt.fajr?.azan || '05:26'} | જમાત ${pt.fajr?.jamat || '05:45'} | કઝા ${pt.fajr?.qaza || '06:42'}\n` +
      `🟢 *ઝોહર:* અઝાન ${pt.zohr?.azan || '12:28'} | જમાત ${pt.zohr?.jamat || '12:45'} | કઝા ${pt.zohr?.qaza || '04:36'}\n` +
      `🟢 *અસર:* અઝાન ${pt.asr?.azan || '04:36'} | જમાત ${pt.asr?.jamat || '04:50'} | કઝા ${pt.asr?.qaza || '06:16'}\n` +
      `🟢 *મગરીબ:* અઝાન ${pt.maghrib?.azan || '06:16'} | જમાત ${pt.maghrib?.jamat || '06:18'} | કઝા ${pt.maghrib?.qaza || '07:29'}\n` +
      `🟢 *ઈશા:* અઝાન ${pt.isha?.azan || '07:29'} | જમાત ${pt.isha?.jamat || '07:45'} | કઝા ${pt.isha?.qaza || '05:25'}\n\n` +
      `⏳ *તહજુદ છેલ્લો સમય:* ${pt.tahajjudEnd || '05:25'}\n` +
      `🥣 *સેહરી છેલ્લો સમય:* ${pt.sehriEnd || '05:25'}\n` +
      `🌅 *સૂર્યોદય:* ${pt.sunrise || '06:42'} (ઈશરાક: ${pt.ishraq || '06:57'} | ચાશ્ત: ${pt.chasht || '08:30'})\n` +
      `🌙 *ઈફ્તારી સમય:* ${pt.iftar || '06:16'}\n\n` +
      `🌐 વેબસાઇટ પર લાઈવ જુઓ: ${window.location.origin}`;

    const encoded = encodeURIComponent(msg);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const formattedDate = currentTime.toLocaleDateString('gu-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  const formattedTime = currentTime.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true
  });

  return (
    <section id="prayer-times" className="py-16 bg-gradient-to-b from-[#F7FAF4] via-[#F4F9EF] to-[#EEF5E6] border-y border-[#D6E6C7] relative overflow-hidden font-['Noto_Sans_Gujarati']">
      {/* Background Decorative Rings */}
      <div className="absolute top-1/2 left-0 -translate-y-1/2 -translate-x-1/2 w-96 h-96 rounded-full bg-[#3B7A4C]/5 blur-3xl pointer-events-none"></div>
      <div className="absolute top-1/2 right-0 -translate-y-1/2 translate-x-1/2 w-96 h-96 rounded-full bg-[#C69C3D]/5 blur-3xl pointer-events-none"></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#205C36]/10 border border-[#205C36]/20 text-[#1C5330] text-xs sm:text-sm font-extrabold tracking-wide">
            <Moon className="w-3.5 h-3.5 text-[#205C36]" />
            <span>દૈનિક નમાઝ તથા સેહરી-ઈફ્તારી સમયપત્રક</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-black text-[#132A11] tracking-tight">
            પંજવક્તા નમાઝ અને ઔકાત
          </h2>

          <p className="text-sm sm:text-base text-[#3E5C38] leading-relaxed">
            {prayerTimes.title} તરફથી દરરોજની ફર્ઝ નમાઝોની જમાત, અઝાન તેમજ કઝાના સમયની સચોટ માહિતી.
          </p>
        </div>

        {/* Content Grid: Info & Live Clock on Left, Card on Right */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Live Clock Card */}
            <div className="bg-white/90 backdrop-blur-md rounded-3xl p-6 border-2 border-[#94B384]/40 shadow-lg space-y-4">
              <div className="flex items-center justify-between border-b border-[#E0ECD3] pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500 animate-ping"></div>
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider">Live Time (ચાલુ સમય)</span>
                </div>
                <span className="text-xs font-semibold text-[#486B3E]">{formattedDate}</span>
              </div>

              <div className="text-center py-2">
                <div className="text-3xl sm:text-4xl font-black font-mono text-[#183916] tracking-tight">
                  {formattedTime}
                </div>
                <div className="text-xs font-bold text-[#4B733E] mt-1">
                  ભારતીય સમય (IST)
                </div>
              </div>

              <div className="p-3 bg-[#F2F8ED] rounded-2xl border border-[#C5DDB4] text-xs text-[#284920] space-y-1">
                <div className="flex items-center gap-1.5 font-bold text-sm text-[#1B4B24]">
                  <CheckCircle2 className="w-4 h-4 text-[#2C6B37]" />
                  <span>જમાત સમય સાથે જોડાઓ</span>
                </div>
                <p className="leading-relaxed opacity-90">
                  નમાઝના નિર્ધારિત સમયથી ૫ મિનિટ અગાઉ મસ્જિદ પધારી જમાતમાં શામેલ થવા વિનંતી છે.
                </p>
              </div>
            </div>

            {/* Quick Summary Badges */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-white/80 rounded-2xl p-4 border border-[#B1CDA0]/50 shadow-xs flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600">
                  <Sun className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-500">સેહરી છેલ્લો સમય</div>
                  <div className="text-lg font-black text-slate-800 font-mono">{prayerTimes.sehriEnd || '05:25'}</div>
                </div>
              </div>

              <div className="bg-white/80 rounded-2xl p-4 border border-[#B1CDA0]/50 shadow-xs flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600">
                  <Moon className="w-5 h-5" />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-slate-500">ઈફ્તારી સમય</div>
                  <div className="text-lg font-black text-slate-800 font-mono">{prayerTimes.iftar || '06:16'}</div>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleDownloadCard}
                disabled={downloading}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-gradient-to-r from-[#1E5733] to-[#144225] hover:from-[#266D40] hover:to-[#1B522E] text-white font-bold text-sm shadow-md transition-all cursor-pointer active:scale-95 disabled:opacity-60"
              >
                <Download className="w-4 h-4" />
                {downloading ? 'ડાઉનલોડ થઈ રહ્યું છે...' : 'ટાઈમટેબલ ડાઉનલોડ (HD)'}
              </button>

              <button
                type="button"
                onClick={handleWhatsAppShare}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-[#25D366] hover:bg-[#20BA5A] text-white font-bold text-sm shadow-md transition-all cursor-pointer active:scale-95"
              >
                <Share2 className="w-4 h-4" />
                <span>WhatsApp શેર કરો</span>
              </button>
            </div>

          </div>

          {/* Right Column (7 Cols): Namaz Timetable Card */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center">
            <div className="relative group max-w-full">
              {/* Outer decorative glow */}
              <div className="absolute -inset-1.5 bg-gradient-to-r from-[#2B6D41] via-[#A88232] to-[#2B6D41] rounded-[36px] blur-sm opacity-25 group-hover:opacity-40 transition duration-500"></div>
              
              {/* Rendered Namaz Timetable Card */}
              <NamazTimetableCard ref={cardRef} prayerTimes={prayerTimes} />
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
