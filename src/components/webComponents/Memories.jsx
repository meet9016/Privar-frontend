import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Camera, ChevronLeft, ChevronRight, Maximize2, X } from 'lucide-react'
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

export default function Memories() {
  const [activeTab, setActiveTab] = useState('all')
  const [theme, setTheme] = useState(getStoredWebTheme())
  const [memories, setMemories] = useState([])
  const [categoryTabs, setCategoryTabs] = useState([{ id: 'all', label: 'All' }])
  const [loading, setLoading] = useState(true)
  const [lightboxIndex, setLightboxIndex] = useState(null)

  const sliderRef = useRef(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(true)

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

  const checkScroll = () => {
    if (!sliderRef.current) return
    const { scrollLeft, scrollWidth, clientWidth } = sliderRef.current
    setCanScrollLeft(scrollLeft > 10)
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10)
  }

  useEffect(() => {
    checkScroll()
    const slider = sliderRef.current
    if (slider) {
      slider.addEventListener('scroll', checkScroll, { passive: true })
      window.addEventListener('resize', checkScroll)
    }
    return () => {
      if (slider) slider.removeEventListener('scroll', checkScroll)
      window.removeEventListener('resize', checkScroll)
    }
  }, [filteredMemories])

  // Reset scroll when tab changes
  useEffect(() => {
    if (sliderRef.current) {
      sliderRef.current.scrollTo({ left: 0, behavior: 'smooth' })
    }
  }, [activeTab])

  // Lightbox keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return undefined

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setLightboxIndex(null)
      if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => (prev > 0 ? prev - 1 : filteredMemories.length - 1))
      }
      if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev < filteredMemories.length - 1 ? prev + 1 : 0))
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [lightboxIndex, filteredMemories.length])

  const scroll = (direction) => {
    if (!sliderRef.current) return
    const container = sliderRef.current
    const scrollAmount = container.clientWidth * 0.8
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  return (
    <section
      id="gallery"
      className="w-full px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16 relative overflow-hidden"
      style={{ backgroundColor: theme.backgroundColor || '#FFFFFF' }}
    >
      <div className="max-w-[1600px] mx-auto">
        {/* Section Header */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-5">
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold mb-2.5 px-3.5 py-1.5 rounded-full border bg-white shadow-sm"
              style={{
                color: theme.primaryColor || '#0a2342',
                borderColor: `${theme.primaryColor || '#0a2342'}30`,
              }}
            >
              <Camera className="w-4 h-4" style={{ color: theme.primaryColor || '#0a2342' }} />
              <span>Memories &amp; Moments</span>
            </div>

            {/* Heading */}
            <h2
              className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight"
              style={{ color: theme.textColor || '#0a2342' }}
            >
              Memories That Last Forever
            </h2>
          </div>

          {/* Slider Prev / Next Controls */}
          {filteredMemories.length > 1 && (
            <div className="flex items-center gap-2.5 shrink-0">
              <button
                type="button"
                onClick={() => scroll('left')}
                disabled={!canScrollLeft}
                className="w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-200 shadow-sm disabled:opacity-35 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                style={{
                  borderColor: `${theme.primaryColor || '#0a2342'}25`,
                  backgroundColor: '#FFFFFF',
                  color: theme.primaryColor || '#0a2342',
                }}
                aria-label="Previous photos"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => scroll('right')}
                disabled={!canScrollRight}
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 shadow-sm disabled:opacity-35 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: theme.primaryColor || '#0a2342',
                  color: '#FFFFFF',
                }}
                aria-label="Next photos"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Category Filter Tabs */}
        {visibleTabs.length > 1 && (
          <div className="flex justify-center mb-6 px-1">
            <div className="flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-2xl sm:rounded-full bg-gray-100/90 border border-gray-200/80 backdrop-blur-md shadow-inner max-w-full">
              {visibleTabs.map((tab) => {
                const isActive = activeTab === tab.id

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className="rounded-full px-4 sm:px-5 py-1.5 text-xs sm:text-sm font-bold tracking-wide transition-all duration-300"
                    style={{
                      backgroundImage: isActive
                        ? `linear-gradient(135deg, ${theme.primaryColor || '#0a2342'}, ${theme.secondaryColor || '#4f46e5'})`
                        : 'none',
                      color: isActive ? '#ffffff' : (theme.textColor || '#475569'),
                      boxShadow: isActive ? `0 4px 12px -2px ${theme.primaryColor || '#0a2342'}50` : 'none',
                    }}
                  >
                    {tab.label}
                  </button>
                )
              })}
            </div>
          </div>
        )}

        {/* Loading State */}
        {loading ? (
          <div className="flex gap-5 overflow-hidden py-3">
            {Array(4).fill(0).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="w-[80vw] sm:w-[320px] md:w-[380px] flex-shrink-0 rounded-[28px] bg-gray-200 aspect-[4/3] animate-pulse"
              />
            ))}
          </div>
        ) : filteredMemories.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white rounded-2xl border border-gray-100 shadow-sm max-w-md mx-auto">
            <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-700 mb-1">No Gallery Images Found</h3>
            <p className="text-xs text-gray-500">Photos will appear here once added to this category.</p>
          </div>
        ) : (
          /* Slider Container */
          <div className="relative group">
            <div
              ref={sliderRef}
              className="flex gap-4 sm:gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory py-3 px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {filteredMemories.map((memory, index) => (
                <article
                  key={`${activeTab}-${memory.src}-${index}`}
                  onClick={() => setLightboxIndex(index)}
                  className="w-[82vw] sm:w-[320px] md:w-[380px] lg:w-[420px] flex-shrink-0 snap-start group/card relative overflow-hidden rounded-[26px] bg-white border shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 p-2.5 cursor-pointer"
                  style={{
                    borderColor: `${theme.primaryColor || '#0a2342'}15`,
                  }}
                >
                  {/* Photo Container */}
                  <div className="relative w-full aspect-[4/3] overflow-hidden rounded-[20px] bg-gray-900 shadow-inner">
                    <img
                      src={memory.src}
                      alt={memory.alt}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/card:scale-110"
                      loading={index < 4 ? 'eager' : 'lazy'}
                      onError={(event) => {
                        if (event.currentTarget.src.endsWith(memory.fallback)) return
                        event.currentTarget.src = memory.fallback
                      }}
                    />

                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover/card:opacity-90 transition-opacity duration-300 pointer-events-none" />

                    {/* Expand Icon on Hover */}
                    <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/90 backdrop-blur-md shadow-md flex items-center justify-center text-gray-800 opacity-0 group-hover/card:opacity-100 transition-all duration-300 scale-90 group-hover/card:scale-100">
                      <Maximize2 className="w-4 h-4" />
                    </div>

                    {/* Bottom Category Tag */}
                    <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2">
                      <span className="inline-block px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider text-white shadow-lg backdrop-blur-md bg-black/55 border border-white/30">
                        {memory.category}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Lightbox Fullscreen Modal */}
      {lightboxIndex !== null && filteredMemories[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors"
            aria-label="Close lightbox"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Left Arrow */}
          {filteredMemories.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setLightboxIndex((prev) => (prev > 0 ? prev - 1 : filteredMemories.length - 1))
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/15 hover:bg-white/30 text-white transition-all shadow-lg hover:scale-110"
              aria-label="Previous photo"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
          )}

          {/* Center Image */}
          <div
            className="max-w-4xl max-h-[85vh] overflow-hidden rounded-2xl shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={filteredMemories[lightboxIndex].src}
              alt={filteredMemories[lightboxIndex].alt}
              className="w-full h-auto max-h-[80vh] object-contain rounded-2xl"
            />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs bg-black/60 backdrop-blur-md py-2 px-4 rounded-xl border border-white/10">
              <span className="font-bold">{filteredMemories[lightboxIndex].category}</span>
              <span className="opacity-75">{lightboxIndex + 1} / {filteredMemories.length}</span>
            </div>
          </div>

          {/* Right Arrow */}
          {filteredMemories.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setLightboxIndex((prev) => (prev < filteredMemories.length - 1 ? prev + 1 : 0))
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/15 hover:bg-white/30 text-white transition-all shadow-lg hover:scale-110"
              aria-label="Next photo"
            >
              <ChevronRight className="w-6 h-6" />
            </button>
          )}
        </div>
      )}
    </section>
  )
}
