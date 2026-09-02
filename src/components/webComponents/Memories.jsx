import React, { useEffect, useMemo, useState } from 'react'
import { Camera } from 'lucide-react'
import { assetUrl, memberApi } from '../../lib/api'




const normalizeGalleryMemories = (galleryRows, categories) => {
  const categoryMap = categories.reduce((map, category) => {
    const id = String(category.id || category._id || '')
    if (id) map[id] = category.category || category.name || 'Gallery'
    return map
  }, {})

  const activeRows = galleryRows.filter(row => row.status === undefined || row.status === null || Number(row.status) === 1)

  return activeRows.flatMap((row, rowIndex) => {
    const images = Array.isArray(row.images) ? row.images : (row.image ? [row.image] : [])
    const categoryId = String(row.gallery_category_id || '')
    const rawCat = row.category || row.category_name || (row.gallery_category_id && categoryMap[categoryId]) || 'General'
    const categoryName = (typeof rawCat === 'object' && rawCat?.name) ? rawCat.name : String(rawCat)

    return images.map((image, imageIndex) => ({
      src: assetUrl(image),
      fallback: `/${((rowIndex + imageIndex) % 4) + 1}.png`,
      category: categoryName,
      categoryId: categoryId || categoryName,
      alt: `${categoryName} memory`,
    }))
  })
}

const getStoredWebTheme = () => {
  const colorKeys = [
    'backgroundColor',
    'borderColor',
    'buttonColor',
    'fontColor',
    'gradientEnd',
    'gradientStart',
    'primaryColor',
    'secondaryColor',
    'textColor',
  ]

  return colorKeys.reduce((theme, key) => {
    const value = localStorage.getItem(`web_${key}`)
    return value ? { ...theme, [key]: value } : theme
  }, {})
}

const shadeColor = (color, percent) => {
  if (!color) return '#000000'

  const num = parseInt(color.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const r = Math.max(0, Math.min(255, (num >> 16) + amt)).toString(16).padStart(2, '0')
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt)).toString(16).padStart(2, '0')
  const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amt)).toString(16).padStart(2, '0')

  return `#${r}${g}${b}`
}

export default function Memories() {
  const [activeTab, setActiveTab] = useState('all')
  const [theme, setTheme] = useState(getStoredWebTheme())
  const [memories, setMemories] = useState([])
  const [categoryTabs, setCategoryTabs] = useState([{ id: 'all', label: 'All' }])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTheme = () => {
      setTheme(getStoredWebTheme())
    }

    loadTheme()
    window.addEventListener('storage', loadTheme)
    return () => window.removeEventListener('storage', loadTheme)
  }, [])



  useEffect(() => {
    const fetchGallery = async () => {
      try {
        setLoading(true)
        const [galleryResponse, categoryResponse] = await Promise.all([
          memberApi.get('/gallery?status=1&limit=100'),
          memberApi.get('/gallery-categories?status=1&limit=100'),
        ])

        const galleryRows = Array.isArray(galleryResponse.data?.data) ? galleryResponse.data.data : []
        const categories = Array.isArray(categoryResponse.data?.data) ? categoryResponse.data.data : []

        const normalized = normalizeGalleryMemories(galleryRows, categories)
        setMemories(normalized)

        // Build list of category tabs from category table AND from actual items
        const catMap = new Map()
        categories.forEach(c => {
          const name = (c.category || '').trim()
          if (name) catMap.set(name, name)
        })
        normalized.forEach(m => {
          if (m.category && m.category !== 'General') {
            catMap.set(m.category, m.category)
          }
        })

        const dynamicTabs = [
          { id: 'all', label: 'All' },
          ...Array.from(catMap.keys()).map(name => ({
            id: name,
            label: name
          }))
        ]

        setCategoryTabs(dynamicTabs)
      } catch (error) {
        setCategoryTabs([{ id: 'all', label: 'All' }])
        setMemories([])
      } finally {
        setLoading(false)
      }
    }

    fetchGallery()
  }, [])

  const visibleMemories = memories.length > 0 ? memories : []
  const visibleTabs = memories.length > 0 ? categoryTabs : []

  const filteredMemories = useMemo(() => {
    if (activeTab === 'all') {
      return visibleMemories
    }
    return visibleMemories.filter((memory) =>
      String(memory.category).toLowerCase().trim() === String(activeTab).toLowerCase().trim() ||
      String(memory.categoryId) === String(activeTab)
    )
  }, [activeTab, visibleMemories])

  return (
    <section
      id="gallery"
      className="w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16 relative overflow-hidden"
      style={{ backgroundColor: theme.backgroundColor }}
    >
      <div className="max-w-[1600px] mx-auto">
        <div className="text-center mb-10 relative">


          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 text-sm font-semibold mb-4 px-4 py-1.5 rounded-full border bg-white shadow-sm"
              style={{
                color: theme.primaryColor,
                borderColor: `${theme.primaryColor}30`,
              }}
            >
              <Camera className="w-4 h-4" style={{ color: theme.primaryColor }} />
              <span>Gallery</span>
            </div>

            {/* Heading */}
            <h2
              className="text-3xl sm:text-4xl lg:text-4xl font-bold tracking-tight mb-3"
              style={{ color: theme.textColor }}
            >
              Memories That Last Forever
            </h2>
          </div>
        </div>

        {/* Segmented Glass Category Filter Tabs */}
        <div className="flex justify-center mb-12">
          <div className="inline-flex flex-wrap items-center justify-center gap-1.5 p-1.5 rounded-full bg-gray-100/90 border border-gray-200/80 backdrop-blur-md shadow-inner">
            {visibleTabs.map((tab) => {
              const isActive = activeTab === tab.id

              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className="rounded-full px-5 sm:px-6 py-2 text-xs sm:text-sm font-extrabold tracking-wide transition-all duration-300 relative"
                  style={{
                    backgroundImage: isActive ? `linear-gradient(135deg, ${theme.primaryColor || '#0a2342'}, ${theme.secondaryColor || '#4f46e5'})` : 'none',
                    color: isActive ? '#ffffff' : (theme.textColor || '#475569'),
                    boxShadow: isActive ? `0 6px 16px -2px ${theme.primaryColor || '#0a2342'}60` : 'none',
                  }}
                >
                  {tab.label}
                </button>
              )
            })}
          </div>
        </div>

        {/* Custom Keyframe for One-by-One Bottom-to-Top Slide Reveal */}
        <style>{`
          @keyframes cascadeSlideUp {
            0% {
              opacity: 0;
              transform: translateY(55px) scale(0.95);
            }
            100% {
              opacity: 1;
              transform: translateY(0px) scale(1);
            }
          }
        `}</style>

        {loading ? (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6 w-full">
            {[64, 48, 80, 56, 72, 64, 96, 48].map((h, i) => (
              <div key={`skeleton-${i}`} className={`w-full rounded-[28px] bg-gray-200 animate-pulse break-inside-avoid h-${h}`} />
            ))}
          </div>
        ) : (
          <div className="columns-1 sm:columns-2 lg:columns-3 xl:columns-4 gap-6 space-y-6 w-full">
            {filteredMemories.map((memory, index) => (
              <article
                key={`${activeTab}-${memory.src}-${index}`}
                className="group relative overflow-hidden rounded-[28px] bg-white border border-gray-100/90 shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-3 break-inside-avoid p-3 flex flex-col opacity-0"
                style={{
                  animation: 'cascadeSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                  animationDelay: `${index * 90}ms`,
                  borderColor: `${theme.primaryColor || '#0a2342'}15`,
                }}
              >
                {/* Inner Rounded Photo Container */}
                <div className="relative w-full overflow-hidden rounded-2xl bg-gray-900">
                  <img
                    src={memory.src}
                    alt={memory.alt}
                    className="w-full h-auto object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    loading={index < 4 ? 'eager' : 'lazy'}
                    onError={(event) => {
                      if (event.currentTarget.src.endsWith(memory.fallback)) return
                      event.currentTarget.src = memory.fallback
                    }}
                  />

                  {/* Gradient Overlay on Hover */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  {/* Bottom Slide-Up Category Tag */}
                  <div className="absolute bottom-3 left-3 z-20 opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all duration-300 pointer-events-none">
                    <span
                      className="inline-block px-3.5 py-1 rounded-full text-[10px] sm:text-[11px] font-black tracking-wider uppercase text-white shadow-lg backdrop-blur-md bg-black/50 border border-white/30"
                    >
                      {memory.category}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}

        {!loading && filteredMemories.length === 0 && (
          <div
            className="rounded-lg border px-4 py-8 text-center text-sm font-semibold"
            style={{
              borderColor: theme.borderColor,
              backgroundColor: '#FFFFFF',
              color: theme.textColor,
            }}
          >
            No gallery images found.
          </div>
        )}
      </div>
    </section>
  )
}
