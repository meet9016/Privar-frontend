import React, { useEffect, useRef, useState } from 'react'
import { Award, ChevronLeft, ChevronRight, GraduationCap, Medal, Star, Trophy } from 'lucide-react'
import { api, getCommunitySurname } from '../../lib/api'
import { STUDENT_ENDPOINTS } from '../../utils/endpoints'
import { getStoredWebTheme } from '../../hooks/useWebTheme'

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
    window.addEventListener('web-theme-updated', loadTheme)
    return () => {
      window.removeEventListener('storage', loadTheme)
      window.removeEventListener('web-theme-updated', loadTheme)
    }
  }, [])

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        setLoading(true)
        const response = await api.get(`${STUDENT_ENDPOINTS.GET_STUDENTS}?status=1&limit=50`)
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

  const primaryColor = theme.primaryColor || '#991B1B'

  return (
    <section
      id="students"
      className="w-full px-4 sm:px-6 lg:px-8 pt-3 sm:pt-4 lg:pt-5 pb-12 sm:pb-14 lg:pb-16 relative overflow-hidden"
      style={{
        backgroundColor: theme.backgroundColor || '#FFFFFF',
        paddingTop: '20px',
        paddingBottom: '64px',
      }}
    >
      <div className="max-w-7xl mx-auto">
        {/* Header with Centered Title */}
        <div className="relative z-10 flex flex-col items-center text-center mb-6 sm:mb-7">
          {/* Badge */}
          <div
            className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold mb-2.5 sm:mb-3 px-3.5 py-1.5 rounded-full border bg-white shadow-sm"
            style={{
              color: primaryColor,
              borderColor: `${primaryColor}30`,
            }}
          >
            <GraduationCap className="w-4 h-4" style={{ color: primaryColor }} />
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

        {/* Loading State */}
        {loading ? (
          <div className="flex gap-5 overflow-hidden py-2">
            {Array(4).fill(0).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="w-[80vw] sm:w-[300px] lg:w-[calc(25%-15px)] h-[380px] sm:h-[400px] flex-shrink-0 bg-white rounded-[26px] border border-gray-100 p-4 flex flex-col shadow-sm animate-pulse"
              >
                <div className="w-full flex-1 bg-gray-200 rounded-[20px] mb-4" />
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
            {visibleStudents.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => scroll('left')}
                  disabled={!canScrollLeft}
                  className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 sm:-translate-x-4 z-30 w-10 h-10 rounded-full border flex items-center justify-center transition-all duration-200 shadow-md disabled:opacity-0 disabled:pointer-events-none hover:scale-105 active:scale-95 bg-white cursor-pointer"
                  style={{
                    borderColor: `${primaryColor}25`,
                    color: primaryColor,
                  }}
                  aria-label="Previous students"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  type="button"
                  onClick={() => scroll('right')}
                  disabled={!canScrollRight}
                  className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 sm:translate-x-4 z-30 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-200 shadow-md disabled:opacity-0 disabled:pointer-events-none hover:scale-105 active:scale-95 text-white cursor-pointer"
                  style={{
                    backgroundColor: primaryColor,
                  }}
                  aria-label="Next students"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
            <div
              ref={sliderRef}
              className="flex gap-5 overflow-x-auto scroll-smooth snap-x snap-mandatory py-4 px-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {visibleStudents.map((student, index) => (
                <StudentCard
                  key={`${student.name}-${index}`}
                  student={student}
                  index={index}
                  primaryColor={primaryColor}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

function StudentCard({ student, index, primaryColor }) {
  const [hovered, setHovered] = useState(false)

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="w-[82vw] sm:w-[300px] lg:w-[calc(25%-15px)] h-[380px] sm:h-[400px] flex-shrink-0 snap-start relative flex flex-col overflow-hidden bg-white rounded-[26px] border select-none cursor-pointer"
      style={{
        borderColor: `${primaryColor}20`,
        boxShadow: hovered
          ? '0 20px 40px -8px rgba(0, 0, 0, 0.28)'
          : '0 4px 16px rgba(0, 0, 0, 0.06)',
        transition: 'box-shadow 0.4s ease',
      }}
    >
      {/* Full Photo Background */}
      <div className="absolute inset-0 w-full h-full bg-slate-900 overflow-hidden">
        <img
          src={student.image}
          alt={student.name}
          onError={(e) => {
            e.target.src = '/image.png'
          }}
          className="w-full h-full object-cover"
          style={{
            transform: hovered ? 'scale(1.06)' : 'scale(1)',
            transition: 'transform 0.7s cubic-bezier(0.25, 1, 0.5, 1)',
          }}
          loading={index < 4 ? 'eager' : 'lazy'}
        />
        {/* Dark Gradient Overlay for bottom text readability */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent pointer-events-none" />
      </div>

      {/* Top Badges (Rank & Medal - Always Visible) */}
      <div className="absolute top-3 inset-x-3 z-20 flex items-center justify-between pointer-events-none">
        {/* Rank Badge */}
        <div
          className="px-3 py-1 text-xs font-extrabold text-white rounded-full shadow-md backdrop-blur-md flex items-center gap-1.5 border border-white/30"
          style={{ backgroundColor: primaryColor }}
        >
          <Award className="h-3.5 w-3.5" />
          <span>{student.rank}</span>
        </div>

        {/* Trophy / Medal Badge */}
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/95 backdrop-blur-md shadow-md border border-white/60">
          {index === 0 ? (
            <Trophy className="h-4 w-4 text-amber-500" />
          ) : index === 1 ? (
            <Medal className="h-4 w-4 text-slate-400" />
          ) : index === 2 ? (
            <Medal className="h-4 w-4 text-amber-700" />
          ) : (
            <Medal className="h-4 w-4" style={{ color: primaryColor }} />
          )}
        </div>
      </div>

      {/* ================= UNIFIED EXPANDABLE FROSTED GLASS DRAWER ================= */}
      {/* Smoothly expands upwards on hover with ZERO jerk/jitter! */}
      <div className="absolute inset-x-3 bottom-3 z-20">
        <div
          className="bg-white/95 backdrop-blur-md rounded-2xl p-3.5 sm:p-4 border border-white/80"
          style={{
            boxShadow: '0 10px 30px -4px rgba(0, 0, 0, 0.22)',
          }}
        >
          {/* Top Row: Standard Tag & Score Pill */}
          <div className="flex items-center justify-between gap-2 mb-1.5">
            <span
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider"
              style={{
                backgroundColor: `${primaryColor}14`,
                color: primaryColor,
              }}
            >
              <GraduationCap className="h-3 w-3" />
              <span>{student.standard}</span>
            </span>

            <span
              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black shadow-xs"
              style={{
                backgroundColor: primaryColor,
                color: '#FFFFFF',
              }}
            >
              <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
              <span>{student.score}</span>
            </span>
          </div>

          {/* Student Name */}
          <h4 className="text-base sm:text-lg font-black text-gray-900 leading-snug truncate">
            {student.name}
          </h4>

          {/* Expandable Content (Unfolds butter-smoothly on hover with zero jerk!) */}
          <div
            style={{
              display: 'grid',
              gridTemplateRows: hovered ? '1fr' : '0fr',
              transition: 'grid-template-rows 450ms cubic-bezier(0.25, 1, 0.5, 1)',
              willChange: 'grid-template-rows',
            }}
          >
            <div style={{ minHeight: 0, overflow: 'hidden' }}>
              <div
                style={{
                  opacity: hovered ? 1 : 0,
                  transform: hovered ? 'translateY(0)' : 'translateY(8px)',
                  transition: 'opacity 320ms ease-out 60ms, transform 380ms cubic-bezier(0.25, 1, 0.5, 1) 30ms',
                }}
                className="pt-2.5 mt-2 border-t border-gray-100 space-y-1.5"
              >
                {/* School / Achievement Box */}
                <div
                  className="text-xs text-gray-700 leading-relaxed px-2.5 py-1.5 rounded-xl border flex items-center gap-1.5"
                  style={{
                    backgroundColor: `${primaryColor}06`,
                    borderColor: `${primaryColor}15`,
                  }}
                >
                  <Award className="h-3.5 w-3.5 shrink-0" style={{ color: primaryColor }} />
                  <span className="font-semibold text-[11px] sm:text-xs truncate">
                    {student.achievement}
                  </span>
                </div>

                {/* Position Badge Row */}
                <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 px-0.5 pt-0.5">
                  <span className="uppercase tracking-wider text-[10px] text-gray-400">Position</span>
                  <span className="font-extrabold" style={{ color: primaryColor }}>
                    {student.rank} Holder
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </article>
  )
}

