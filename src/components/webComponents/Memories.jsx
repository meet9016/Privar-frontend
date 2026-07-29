import React, { useEffect, useMemo, useState } from 'react'
import { assetUrl, memberApi } from '../../lib/api'




const normalizeGalleryMemories = (galleryRows, categories) => {
  const categoryMap = categories.reduce((map, category) => {
    return { ...map, [String(category.id)]: category.category || 'Gallery' }
  }, {})

  return galleryRows.flatMap((row, rowIndex) => {
    const images = Array.isArray(row.images) ? row.images : []
    const categoryId = String(row.gallery_category_id || '')
    const categoryName = categoryMap[categoryId] || row.year || 'Gallery'

    return images.map((image, imageIndex) => ({
      src: assetUrl(image),
      fallback: `/${((rowIndex + imageIndex) % 4) + 1}.png`,
      category: categoryId || categoryName,
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
          memberApi.get('/gallery'),
          memberApi.get('/gallery-categories'),
        ])

        const galleryRows = Array.isArray(galleryResponse.data?.data) ? galleryResponse.data.data : []
        const categories = Array.isArray(categoryResponse.data?.data) ? categoryResponse.data.data : []
        const dynamicTabs = [
          { id: 'all', label: 'All' },
          ...categories.slice(0, 3).map((category) => ({
            id: String(category.id),
            label: category.category || 'Gallery',
          })),
        ]

        setCategoryTabs(dynamicTabs)
        setMemories(normalizeGalleryMemories(galleryRows, categories))
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
  const list = activeTab === 'all'
    ? visibleMemories
    : visibleMemories.filter((memory) => memory.category === activeTab)
  return list ? list.slice(0, 9) : []
}, [activeTab, visibleMemories])

  return (
    <section
      id="gallery"
      className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20"
      style={{ backgroundColor: theme.backgroundColor }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-8 sm:mb-10">
          <p
            className="text-sm sm:text-base font-semibold tracking-wide mb-2"
            style={{ color: theme?.primaryColor }}
          >
            - Gallery -
          </p>
          <h2
            className="text-3xl sm:text-4xl font-semibold tracking-tight"
            style={{ color: theme?.textColor }}
          >
            Memories That{' '}
            <span
              style={{
                backgroundImage: `linear-gradient(to right, ${theme.gradientStart}, ${theme.secondaryColor})`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Last Forever
            </span>
          </h2>
          <div
            className="w-12 h-1 rounded-full mx-auto mt-4"
            style={{
              backgroundImage: `linear-gradient(to right, ${theme.gradientStart}, ${theme.gradientEnd})`,
            }}
          />
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-3 mb-8">
          {visibleTabs.map((tab) => {
            const isActive = activeTab === tab.id

            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className="min-w-24 rounded-full border px-5 py-2 text-sm font-semibold transition-all duration-200"
                style={{
                  borderColor: isActive ? theme.primaryColor : theme.borderColor,
                  backgroundColor: isActive ? theme.primaryColor : '#FFFFFF',
                  color: isActive ? theme.fontColor : theme.textColor,
                }}
              >
                {tab.label}
              </button>
            )
          })}
        </div>

        {loading && (
          <div
            className="mb-6 rounded-lg border px-4 py-3 text-center text-sm font-semibold"
            style={{
              borderColor: theme.borderColor,
              backgroundColor: shadeColor(theme.backgroundColor, 2),
              color: theme.textColor,
            }}
          >
            Loading gallery...
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredMemories.map((memory, index) => (
            <article
              key={`${memory.src}-${memory.category}-${index}`}
              className="group overflow-hidden rounded-lg border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              style={{ borderColor: theme.borderColor }}
            >
              <div className="aspect-[2/1] overflow-hidden">
                <img
                  src={memory.src}
                  alt={memory.alt}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading={index < 3 ? 'eager' : 'lazy'}
                  onError={(event) => {
                    if (event.currentTarget.src.endsWith(memory.fallback)) return
                    event.currentTarget.src = memory.fallback
                  }}
                />
              </div>
            </article>
          ))}
        </div>

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
