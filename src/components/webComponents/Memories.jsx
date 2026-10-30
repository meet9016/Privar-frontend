import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { Camera, ChevronLeft, ChevronRight, ChevronDown, Maximize2, X } from 'lucide-react'
import { assetUrl, api } from '../../lib/api'
import { GALLERY_ENDPOINTS } from '../../utils/endpoints'
import { getStoredWebTheme } from '../../hooks/useWebTheme'

const normalizeGalleryMemories = (galleryRows, categories = []) => {
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
    const titleName = row.title || row.name || row.gallery_name || categoryName

    return images.map((image, imageIndex) => ({
      src: assetUrl(image),
      fallback: `/${((rowIndex + imageIndex) % 4) + 1}.png`,
      category: categoryName,
      categoryId: categoryId || categoryName,
      title: titleName,
      alt: `${titleName} memory`,
    }))
  })
}

function RowsSelector({ limit, onLimitChange }) {
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef(null)

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const options = [15, 20, 25, 50, 100]

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 bg-white border border-gray-200 text-gray-700 font-semibold text-xs rounded-lg px-2.5 py-1.5 hover:border-gray-300 focus:outline-none transition-all shadow-2xs cursor-pointer"
      >
        <span>{limit || 20}</span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute bottom-full left-0 mb-1.5 w-20 bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-30 animate-fade-in">
          {options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onLimitChange(opt)
                setIsOpen(false)
              }}
              className={`w-full text-left px-3 py-1.5 text-xs font-semibold transition-colors cursor-pointer ${(limit || 20) === opt
                ? 'bg-blue-50 text-blue-600 font-bold'
                : 'text-gray-700 hover:bg-gray-50'
                }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1)
  }

  const pages = []
  pages.push(1)

  if (currentPage > 3) {
    pages.push('...')
  }

  const start = Math.max(2, currentPage - 1)
  const end = Math.min(totalPages - 1, currentPage + 1)

  for (let i = start; i <= end; i++) {
    pages.push(i)
  }

  if (currentPage < totalPages - 2) {
    pages.push('...')
  }

  if (totalPages > 1) {
    pages.push(totalPages)
  }

  return pages
}

export default function Memories() {
  const location = useLocation()
  const navigate = useNavigate()
  const isGalleryPage = location?.pathname === '/gallery'

  const [theme, setTheme] = useState(getStoredWebTheme())
  const [categories, setCategories] = useState([])
  const [categoryTabs, setCategoryTabs] = useState([{ id: 'all', label: 'All' }])
  const [activeTab, setActiveTab] = useState('all')

  // Dynamic server-side pagination & memories
  const [memories, setMemories] = useState([])
  const [pagination, setPagination] = useState({ total: 0, page: 1, limit: isGalleryPage ? 20 : 10, totalPages: 1 })
  const [currentPage, setCurrentPage] = useState(1)
  const [limit, setLimit] = useState(isGalleryPage ? 20 : 10)
  const [loading, setLoading] = useState(true)
  const [lightboxIndex, setLightboxIndex] = useState(null)

  useEffect(() => {
    const loadTheme = () => {
      setTheme(getStoredWebTheme())
    }

    loadTheme()
    window.addEventListener('storage', loadTheme)
    return () => window.removeEventListener('storage', loadTheme)
  }, [])

  // 1. Fetch Categories for Tabs (limit 100 to get ALL categories from backend)
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const categoryResponse = await api.get(`${GALLERY_ENDPOINTS.GET_CATEGORIES}?status=1&limit=100`)
        const cats = Array.isArray(categoryResponse.data?.data) ? categoryResponse.data.data : []
        setCategories(cats)

        const dynamicTabs = [
          { id: 'all', label: 'All' },
          ...cats.map((c) => ({
            id: String(c.id || c._id || c.category),
            label: c.category || c.name || 'Category',
          })),
        ]
        setCategoryTabs(dynamicTabs)
      } catch (err) {
        setCategoryTabs([{ id: 'all', label: 'All' }])
      }
    }

    fetchCategories()
  }, [])

  // 2. Fetch Initial Memories dynamically from Backend (10 by default on homepage, 20 on gallery page)
  const fetchGallery = useCallback(async () => {
    try {
      setLoading(true)
      const currentLimit = isGalleryPage ? limit : 10
      const params = {
        status: 1,
        page: isGalleryPage ? currentPage : 1,
        limit: currentLimit,
      }
      if (activeTab !== 'all') {
        params.gallery_category_id = activeTab
      }

      const res = await api.get(GALLERY_ENDPOINTS.GET_GALLERY, { params })
      const galleryRows = Array.isArray(res.data?.data) ? res.data.data : []
      const pg = res.data?.pagination || {}

      const normalized = normalizeGalleryMemories(galleryRows, categories)
      setMemories(normalized)
      setPagination({
        total: Number(pg.total ?? galleryRows.length),
        page: Number(pg.page ?? (isGalleryPage ? currentPage : 1)),
        limit: Number(pg.limit ?? currentLimit),
        totalPages: Math.max(1, Number(pg.totalPages ?? pg.total_pages ?? 1)),
      })
    } catch (err) {
      setMemories([])
      setPagination({ total: 0, page: 1, limit: isGalleryPage ? limit : 10, totalPages: 1 })
    } finally {
      setLoading(false)
    }
  }, [currentPage, limit, activeTab, categories, isGalleryPage])

  useEffect(() => {
    fetchGallery()
  }, [fetchGallery])

  // Continuous loop duplicate list for single-row marquee on homepage (max 10 items)
  const displayMemories = useMemo(() => {
    if (!memories.length) return []
    let list = memories.slice(0, 10)
    while (list.length < 8) {
      list = [...list, ...memories]
    }
    return [...list, ...list]
  }, [memories])

  const totalRecords = pagination.total || 0
  const totalPages = pagination.totalPages || 1
  const showingFrom = totalRecords === 0 ? 0 : (currentPage - 1) * limit + 1
  const showingTo = Math.min(showingFrom + memories.length - 1, totalRecords)

  const smartPageNumbers = useMemo(() => {
    return getPageNumbers(currentPage, totalPages)
  }, [currentPage, totalPages])

  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    setCurrentPage(1)
  }

  const handleLimitChange = (newLimit) => {
    setLimit(newLimit)
    setCurrentPage(1)
  }

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
    const element = document.getElementById('gallery')
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }

  // Lightbox keyboard navigation
  useEffect(() => {
    if (lightboxIndex === null) return undefined

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setLightboxIndex(null)
      if (e.key === 'ArrowLeft') {
        setLightboxIndex((prev) => (prev > 0 ? prev - 1 : memories.length - 1))
      }
      if (e.key === 'ArrowRight') {
        setLightboxIndex((prev) => (prev < memories.length - 1 ? prev + 1 : 0))
      }
    }

    document.body.style.overflow = 'hidden'
    window.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = ''
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [lightboxIndex, memories.length])

  return (
    <section
      id="gallery"
      className="w-full pt-3 sm:pt-4 lg:pt-5 pb-12 sm:pb-14 lg:pb-16 relative overflow-hidden"
      style={{
        backgroundColor: theme.backgroundColor || '#FFFFFF',
        paddingTop: '20px',
        paddingBottom: '64px',
      }}
    >
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 pt-5">
        {/* Section Header */}
        <div className="relative z-10 flex flex-col items-center text-center mb-8 sm:mb-10">
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

        {/* Category Filter Tabs - Centered */}
        {categoryTabs.length > 1 && (
          <div className="flex justify-center mb-8 px-2 sm:px-6">
            <div className="flex flex-wrap items-center justify-center gap-2 max-w-full">
              {categoryTabs.map((tab) => {
                const isActive = activeTab === tab.id

                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => handleTabChange(tab.id)}
                    className="rounded-full px-4 sm:px-5 py-1.5 text-xs sm:text-sm font-bold tracking-wide transition-all duration-300 cursor-pointer shadow-xs"
                    style={{
                      backgroundImage: isActive
                        ? `linear-gradient(135deg, ${theme.primaryColor || '#0a2342'}, ${theme.secondaryColor || '#4f46e5'})`
                        : 'none',
                      backgroundColor: isActive ? 'transparent' : '#f1f5f9',
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

        {/* Loading Skeleton State */}
        {loading ? (
          <div className="flex gap-5 overflow-hidden py-3">
            {Array(4).fill(0).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="w-[80vw] sm:w-[320px] md:w-[360px] flex-shrink-0 rounded-[20px] bg-gray-200 aspect-[4/3] animate-pulse"
              />
            ))}
          </div>
        ) : memories.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white rounded-2xl border border-gray-100 shadow-sm max-w-md mx-auto">
            <Camera className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-700 mb-1">No Gallery Images Found</h3>
            <p className="text-xs text-gray-500">Photos will appear here once added to this category.</p>
          </div>
        ) : null}

        {/* ======================= CASE 1: GALLERY PAGE GRID VIEW & ELEGANT FULL-WIDTH PAGINATION ======================= */}
        {isGalleryPage && !loading && memories.length > 0 && (
          <div className="space-y-12">
            {/* Gallery Cards Grid: Elegant Modern Card Shell */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 sm:gap-6">
              {memories.map((memory, index) => (
                <article
                  key={`${activeTab}-${memory.src}-${index}`}
                  onClick={() => setLightboxIndex(index)}
                  className="group/card flex flex-col bg-white rounded-[22px] border border-gray-200/70 p-2.5 sm:p-3 shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer select-none"
                >
                  {/* Photo Container */}
                  <div className="relative w-full aspect-[4/3] overflow-hidden rounded-[16px] bg-gray-900 border border-gray-100">
                    <img
                      src={memory.src}
                      alt={memory.alt}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/card:scale-108"
                      loading="lazy"
                      onError={(event) => {
                        if (event.currentTarget.src.endsWith(memory.fallback)) return
                        event.currentTarget.src = memory.fallback
                      }}
                    />

                    {/* Expand Icon on Hover */}
                    <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full bg-black/60 backdrop-blur-md shadow-md flex items-center justify-center text-white opacity-0 group-hover/card:opacity-100 transition-all duration-300 scale-90 group-hover/card:scale-100 border border-white/20">
                      <Maximize2 className="w-3.5 h-3.5" />
                    </div>
                  </div>

                  {/* Name / Category below photo inside card */}
                  <div className="pt-2.5 pb-1 px-1 text-center">
                    <h4
                      className="text-sm sm:text-base font-bold truncate transition-colors duration-200"
                      style={{ color: theme.primaryColor || '#0a2342' }}
                    >
                      {memory.title || memory.category}
                    </h4>
                  </div>
                </article>
              ))}
            </div>

            {/* Seamless, Sleek Pagination Toolbar (Clean full-width divider matching table screenshot) */}
            {totalRecords > 0 && (
              <div className="border-t border-gray-200 pt-6 pb-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 text-sm">
                {/* Left: ROWS selector + Showing info */}
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 font-semibold text-xs uppercase tracking-wider">ROWS</span>
                    <RowsSelector limit={limit} onLimitChange={handleLimitChange} />
                  </div>
                  <span className="text-gray-500 text-xs sm:text-sm">
                    Showing <span className="font-semibold text-gray-900">{showingFrom}</span> to <span className="font-semibold text-gray-900">{showingTo}</span> of <span className="font-semibold text-gray-900">{totalRecords}</span>
                  </span>
                </div>

                {/* Right: Page navigation buttons */}
                <div className="flex items-center gap-1.5 self-center sm:self-auto">
                  <button
                    type="button"
                    disabled={currentPage <= 1}
                    onClick={() => handlePageChange(Math.max(1, currentPage - 1))}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 hover:text-gray-800 transition-all cursor-pointer shadow-2xs"
                    aria-label="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {smartPageNumbers.map((item, idx) =>
                    item === '...' ? (
                      <span key={`ellipsis-${idx}`} className="w-8 h-8 flex items-center justify-center text-gray-400 text-xs select-none">...</span>
                    ) : (
                      <button
                        key={`page-${item}`}
                        type="button"
                        disabled={item === currentPage}
                        onClick={() => handlePageChange(item)}
                        className={`min-w-[32px] h-8 px-2 rounded-lg border text-sm font-semibold transition-all cursor-pointer shadow-2xs ${item === currentPage
                          ? 'disabled:opacity-100 disabled:cursor-default text-white'
                          : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        style={
                          item === currentPage
                            ? {
                              backgroundColor: theme.primaryColor || '#0a2342',
                              borderColor: theme.primaryColor || '#0a2342',
                              color: '#FFFFFF',
                            }
                            : {}
                        }
                      >
                        {item}
                      </button>
                    )
                  )}

                  <button
                    type="button"
                    disabled={currentPage >= totalPages}
                    onClick={() => handlePageChange(Math.min(totalPages, currentPage + 1))}
                    className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-500 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-50 hover:text-gray-800 transition-all cursor-pointer shadow-2xs"
                    aria-label="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ======================= CASE 2: HOMEPAGE SINGLE-ROW CONTINUOUS AUTO-SCROLL MARQUEE (DEFAULT 10 ITEMS) ======================= */}
      {!isGalleryPage && !loading && memories.length > 0 && (
        <div
          className="w-full overflow-hidden relative py-2"
          style={{
            maskImage: 'linear-gradient(to right, transparent 0%, black 3%, black 97%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 3%, black 97%, transparent 100%)',
          }}
        >
          <div
            className="flex gap-4 sm:gap-6 will-change-transform"
            style={{
              width: 'max-content',
              animation: `scroll-left ${Math.max(25, displayMemories.length * 3.5)}s linear infinite`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.animationPlayState = 'paused'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.animationPlayState = 'running'
            }}
          >
            {displayMemories.map((memory, index) => {
              const originalIndex = memories.findIndex((m) => m.src === memory.src)
              const targetIndex = originalIndex >= 0 ? originalIndex : (index % memories.length)

              return (
                <article
                  key={`${activeTab}-${memory.src}-${index}`}
                  onClick={() => setLightboxIndex(targetIndex)}
                  className="flex flex-col w-[260px] sm:w-[320px] md:w-[360px] lg:w-[400px] flex-shrink-0 cursor-pointer group/card select-none"
                >
                  {/* Photo Container */}
                  <div className="relative w-full aspect-[4/3] overflow-hidden rounded-[20px] shadow-sm group-hover/card:shadow-xl transition-all duration-500 bg-gray-900 border border-gray-100">
                    <img
                      src={memory.src}
                      alt={memory.alt}
                      className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover/card:scale-108"
                      loading="lazy"
                      onError={(event) => {
                        if (event.currentTarget.src.endsWith(memory.fallback)) return
                        event.currentTarget.src = memory.fallback
                      }}
                    />

                    {/* Expand Icon on Hover */}
                    <div className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/60 backdrop-blur-md shadow-md flex items-center justify-center text-white opacity-0 group-hover/card:opacity-100 transition-all duration-300 scale-90 group-hover/card:scale-100 border border-white/20">
                      <Maximize2 className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Name / Category in Center with Dynamic Theme Color */}
                  <div className="pt-3 pb-1 px-2 text-center">
                    <h4
                      className="text-base sm:text-lg font-bold truncate transition-transform duration-300 group-hover/card:scale-105"
                      style={{ color: theme.primaryColor || '#0a2342' }}
                    >
                      {memory.title || memory.category}
                    </h4>
                  </div>
                </article>
              )
            })}
          </div>
        </div>
      )}

      {/* ======================= VIEW ALL BUTTON (HOMEPAGE - WHEN TOTAL > 10) ======================= */}
      {!isGalleryPage && !loading && totalRecords > 10 && (
        <div className="mt-8 sm:mt-10 flex justify-center">
          <button
            type="button"
            onClick={() => {
              navigate('/gallery')
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }}
            className="inline-flex items-center gap-2.5 px-8 py-3 rounded-full text-sm font-semibold border transition-all duration-200 hover:shadow-md hover:scale-105 cursor-pointer"
            style={{
              color: theme.primaryColor || '#0a2342',
              borderColor: theme.primaryColor || '#0a2342',
              backgroundColor: 'transparent',
            }}
          >
            <span>View All ({totalRecords})</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Lightbox Fullscreen Modal */}
      {lightboxIndex !== null && memories[lightboxIndex] && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4 animate-fade-in"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Close button */}
          <button
            type="button"
            onClick={() => setLightboxIndex(null)}
            className="absolute top-4 right-4 z-50 p-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
            aria-label="Close lightbox"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Left Arrow */}
          {memories.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setLightboxIndex((prev) => (prev > 0 ? prev - 1 : memories.length - 1))
              }}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/15 hover:bg-white/30 text-white transition-all shadow-lg hover:scale-110 cursor-pointer"
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
              src={memories[lightboxIndex].src}
              alt={memories[lightboxIndex].alt}
              className="w-full h-auto max-h-[80vh] object-contain rounded-2xl"
            />
            <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between text-white text-xs bg-black/60 backdrop-blur-md py-2 px-4 rounded-xl border border-white/10">
              <span className="font-bold">{memories[lightboxIndex].category}</span>
              <span className="opacity-75">{lightboxIndex + 1} / {memories.length}</span>
            </div>
          </div>

          {/* Right Arrow */}
          {memories.length > 1 && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                setLightboxIndex((prev) => (prev < memories.length - 1 ? prev + 1 : 0))
              }}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-white/15 hover:bg-white/30 text-white transition-all shadow-lg hover:scale-110 cursor-pointer"
              aria-label="Next photo"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
    </section>
  )
}
