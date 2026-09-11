import React, { useEffect, useRef, useState } from 'react'
import { Award, ChevronLeft, ChevronRight, GraduationCap, Medal, Star, Trophy } from 'lucide-react'
import { memberApi, getCommunitySurname } from '../../lib/api'

const rankLabel = (index) => {
  const rank = index + 1
  if (rank === 1) return '1st Rank'
  if (rank === 2) return '2nd Rank'
  if (rank === 3) return '3rd Rank'
  return `${rank}th Rank`
}

const normalizePercentage = (value) => {
  const percentage = Number(String(value || '').replace('%', ''))
  return Number.isNaN(percentage) ? 0 : percentage
}

const normalizeStudent = (student, index) => ({
  name: [student.student_name, getCommunitySurname()].filter(Boolean).join(' ') || 'Student',
  rank: rankLabel(index),
  standard: student.standard || 'Standard',
  score: student.percentage ? `${String(student.percentage).replace('%', '')}%` : '0%',
  achievement: student.school_name || 'Academic Achievement',
  image: student.student_image || "/image.png"
})

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

export default function TopStudents() {
  const [theme, setTheme] = useState(getStoredWebTheme())
  const [students, setStudents] = useState([])
  const [loading, setLoading] = useState(true)
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
    const fetchStudents = async () => {
      try {
        setLoading(true)
        const response = await memberApi.get('/students?status=1&limit=50')
        const rows = Array.isArray(response.data?.data) ? response.data.data : []
        const activeRows = rows
          .filter(r => r.status === undefined || r.status === null || Number(r.status) === 1 || String(r.status).toLowerCase() === 'active')
          .sort((a, b) => normalizePercentage(b.percentage) - normalizePercentage(a.percentage))

        setStudents(activeRows.map(normalizeStudent))
      } catch (error) {
        setStudents([])
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [])

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
  }, [students])

  const scroll = (direction) => {
    if (!sliderRef.current) return
    const container = sliderRef.current
    const scrollAmount = container.clientWidth * 0.75
    container.scrollBy({
      left: direction === 'left' ? -scrollAmount : scrollAmount,
      behavior: 'smooth',
    })
  }

  const visibleStudents = students.length > 0 ? students : []

  return (
    <section
      id="students"
      className="w-full px-4 sm:px-6 lg:px-8 pb-12 sm:pb-16 lg:pb-20 relative overflow-hidden"
      style={{ backgroundColor: theme.backgroundColor || '#FFFFFF' }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header with Title and Slider Navigation Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-6 sm:mb-8">
          <div className="flex flex-col items-center sm:items-start text-center sm:text-left">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold mb-3 px-3.5 py-1.5 rounded-full border bg-white shadow-sm"
              style={{
                color: theme.primaryColor || '#0a2342',
                borderColor: `${theme.primaryColor || '#0a2342'}30`,
              }}
            >
              <GraduationCap className="w-4 h-4" style={{ color: theme.primaryColor || '#0a2342' }} />
              <span>Top Achievers</span>
            </div>

            {/* Heading */}
            <h2
              className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight"
              style={{ color: theme.textColor || '#0a2342' }}
            >
              Students Who Achieved Ranks
            </h2>
          </div>

          {/* Slider Prev / Next Controls */}
          {visibleStudents.length > 1 && (
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
                aria-label="Previous students"
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
                aria-label="Next students"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Loading State */}
        {loading ? (
          <div className="flex gap-5 overflow-hidden py-2">
            {Array(4).fill(0).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="w-[80vw] sm:w-[300px] lg:w-[calc(25%-15px)] flex-shrink-0 bg-white rounded-[28px] border border-gray-100 p-4 flex flex-col shadow-sm animate-pulse"
              >
                <div className="w-full aspect-[4/3] bg-gray-200 rounded-[20px] mb-4" />
                <div className="h-5 w-3/4 bg-gray-200 rounded-full mb-2" />
                <div className="h-4 w-1/2 bg-gray-200 rounded-full" />
              </div>
            ))}
          </div>
        ) : visibleStudents.length === 0 ? (
          <div className="text-center py-12 px-4 bg-white rounded-2xl border border-gray-100 shadow-sm max-w-md mx-auto">
            <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-700 mb-1">No Student Records Yet</h3>
            <p className="text-xs text-gray-500">Student achievements will appear here once published.</p>
          </div>
        ) : (
          /* Slider Track */
          <div className="relative group">
            <div
              ref={sliderRef}
              className="flex gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory py-3 px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {visibleStudents.map((student, index) => (
                <article
                  key={`${student.name}-${index}`}
                  className="w-[82vw] sm:w-[310px] lg:w-[calc(25%-15px)] flex-shrink-0 snap-start group/card relative flex flex-col overflow-hidden bg-white rounded-[28px] border shadow-sm transition-all duration-300 hover:shadow-xl hover:-translate-y-1.5 p-3.5"
                  style={{
                    borderColor: `${theme.primaryColor || '#0a2342'}18`,
                  }}
                >
                  {/* Photo Header */}
                  <div className="relative w-full aspect-[4/3] rounded-[22px] overflow-hidden bg-gray-900 mb-3 shadow-inner">
                    <img
                      src={student.image}
                      alt={student.name}
                      className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover/card:scale-108"
                      loading={index < 4 ? 'eager' : 'lazy'}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

                    {/* Top-Left Floating Rank Badge */}
                    <div
                      className="absolute top-2.5 left-2.5 px-2.5 py-1 text-xs font-bold text-white rounded-full shadow-md z-10 backdrop-blur-md flex items-center gap-1.5 border border-white/30"
                      style={{ backgroundColor: theme.primaryColor || '#0a2342' }}
                    >
                      <Award className="h-3.5 w-3.5" />
                      <span>{student.rank}</span>
                    </div>

                    {/* Top-Right Trophy/Medal Icon */}
                    <div className="absolute top-2.5 right-2.5 flex items-center justify-center w-7 h-7 rounded-full bg-white/95 backdrop-blur-md shadow-md z-10 border border-white/50">
                      {index === 0 ? (
                        <Trophy className="h-3.5 w-3.5 text-amber-500" />
                      ) : (
                        <Medal className="h-3.5 w-3.5" style={{ color: theme.primaryColor || '#0a2342' }} />
                      )}
                    </div>

                    {/* Bottom Standard Tag */}
                    <div className="absolute bottom-2.5 left-2.5 z-10">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider text-white bg-black/50 backdrop-blur-md border border-white/20 truncate max-w-[130px]">
                        {student.standard}
                      </span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className="flex flex-col flex-1 justify-between px-1">
                    <div>
                      <h3
                        className="text-base font-bold mb-1 leading-snug truncate group-hover/card:text-primary transition-colors"
                        style={{ color: theme.textColor || '#0a2342' }}
                      >
                        {student.name}
                      </h3>

                      <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3">
                        <GraduationCap className="h-3.5 w-3.5 shrink-0 text-gray-400" />
                        <span className="truncate">{student.achievement}</span>
                      </div>
                    </div>

                    {/* Score Footer */}
                    <div className="pt-2.5 border-t border-gray-100 flex items-center justify-between mt-auto">
                      <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Score</span>
                      <span
                        className="inline-flex items-center justify-center px-3 py-1 rounded-lg text-xs font-bold text-white shadow-sm"
                        style={{
                          backgroundColor: theme.buttonColor || theme.primaryColor || '#0a2342',
                          color: theme.fontColor || '#FFFFFF',
                        }}
                      >
                        {student.score}
                      </span>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
