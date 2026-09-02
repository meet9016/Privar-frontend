import React, { useEffect, useState } from 'react'
import { Award, GraduationCap, Medal, Star, Trophy } from 'lucide-react'
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

const shadeColor = (color, percent) => {
  if (!color) return '#000000'

  const num = parseInt(color.replace('#', ''), 16)
  const amt = Math.round(2.55 * percent)
  const r = Math.max(0, Math.min(255, (num >> 16) + amt)).toString(16).padStart(2, '0')
  const g = Math.max(0, Math.min(255, ((num >> 8) & 0x00ff) + amt)).toString(16).padStart(2, '0')
  const b = Math.max(0, Math.min(255, (num & 0x0000ff) + amt)).toString(16).padStart(2, '0')

  return `#${r}${g}${b}`
}

export default function TopStudents() {
  const [theme, setTheme] = useState(getStoredWebTheme())
  const [students, setStudents] = useState([])
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
    const fetchStudents = async () => {
      try {
        setLoading(true)
        const response = await memberApi.get('/students?status=1')
        const rows = Array.isArray(response.data?.data) ? response.data.data : []
        const activeRows = rows
          .filter(r => r.status === undefined || r.status === null || Number(r.status) === 1 || String(r.status).toLowerCase() === 'active')
          .sort((a, b) => normalizePercentage(b.percentage) - normalizePercentage(a.percentage))
          .slice(0, 4)

        setStudents(activeRows.map(normalizeStudent))
      } catch (error) {
        setStudents([])
      } finally {
        setLoading(false)
      }
    }

    fetchStudents()
  }, [])

  const visibleStudents = students.length > 0 ? students : []
  return (
    <section
      id="students"
      className="w-full px-4 sm:px-6 lg:px-8 pb-10 sm:pb-12 lg:pb-14 relative overflow-hidden"
      style={{ backgroundColor: theme.backgroundColor }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 sm:mb-14 relative">
          {/* Faint Background Text */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-full text-[4rem] sm:text-[6rem] md:text-[9rem] font-black opacity-[0.02] pointer-events-none tracking-tighter uppercase whitespace-nowrap select-none" style={{ color: theme.primaryColor }}>
            Achievers
          </div>

          <div className="relative z-10 flex flex-col items-center text-center">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 text-sm font-semibold mb-4 px-4 py-1.5 rounded-full border bg-white shadow-sm"
              style={{
                color: theme.primaryColor,
                borderColor: `${theme.primaryColor}30`,
              }}
            >
              <GraduationCap className="w-4 h-4" style={{ color: theme.primaryColor }} />
              <span>Top Students</span>
            </div>

            {/* Heading */}
            <h2
              className="text-3xl sm:text-4xl lg:text-4xl font-bold tracking-tight mb-3"
              style={{ color: theme.textColor }}
            >
              Students Who Achieved Ranks
            </h2>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto px-4 mt-12">
            {Array(4).fill(0).map((_, i) => (
              <div key={`skeleton-${i}`} className="bg-white rounded-lg border border-gray-100 flex flex-col overflow-hidden shadow-sm">
                <div className="w-full aspect-[4/3] bg-gray-200 animate-pulse" />
                <div className="p-4 sm:p-5 flex flex-col flex-1">
                  <div className="mb-3">
                    <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse mb-2" />
                    <div className="h-3 w-1/3 bg-gray-200 rounded animate-pulse" />
                  </div>
                  <div className="flex items-start gap-2 mb-5 flex-1">
                    <div className="w-3.5 h-3.5 bg-gray-200 rounded-full animate-pulse shrink-0 mt-0.5" />
                    <div className="space-y-2 w-full">
                      <div className="h-3 w-full bg-gray-200 rounded animate-pulse" />
                      <div className="h-3 w-5/6 bg-gray-200 rounded animate-pulse" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t border-dashed border-gray-200">
                    <div className="h-4 w-12 bg-gray-200 rounded animate-pulse" />
                    <div className="h-5 w-16 bg-gray-200 rounded animate-pulse" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto px-4 mt-12">
            {visibleStudents.map((student, index) => (
              <article
                key={student.name}
                className="group flex flex-col overflow-hidden bg-white rounded-lg border shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-1"
                style={{
                  borderColor: `${theme.borderColor}40`
                }}
              >
                {/* Card Header / Image */}
                <div className="relative w-full aspect-[4/3] overflow-hidden bg-gray-100">
                  <img
                    src={student.image}
                    alt={student.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />

                  {/* Sleek Rank Badge */}
                  <div
                    className="absolute top-3 left-3 px-2.5 py-1 text-[12px] font-bold text-white rounded-md shadow-sm z-10"
                    style={{ backgroundColor: theme.primaryColor }}
                  >
                    Rank {student.rank}
                  </div>

                  {/* Minimalist Trophy Badge */}
                  <div
                    className="absolute top-3 right-3 flex items-center justify-center w-7 h-7 rounded-full bg-white shadow-sm z-10"
                  >
                    {index === 0 ? <Trophy className="h-3.5 w-3.5" style={{ color: theme.primaryColor }} /> : <Medal className="h-3.5 w-3.5" style={{ color: theme.primaryColor }} />}
                  </div>
                </div>

                {/* Card Body */}
                <div className="p-4 sm:p-5 flex flex-col flex-1">
                  {/* Identity */}
                  <div className="mb-3">
                    <h3 className="text-[17px] font-bold mb-1 leading-snug line-clamp-1" style={{ color: theme.primaryColor }}>
                      {student.name}
                    </h3>
                    <p className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: theme.primaryColor }}>
                      {student.standard}
                    </p>
                  </div>

                  {/* Achievement (Clean, Minimal text) */}
                  <div className="flex items-start gap-2 mb-5 flex-1">
                    <GraduationCap className="h-3.5 w-3.5 flex-shrink-0 mt-0.5 opacity-80" style={{ color: theme.primaryColor }} />
                    <p className="text-xs font-medium leading-relaxed text-[#475569] line-clamp-3">
                      {student.achievement}
                    </p>
                  </div>

                  {/* Score */}
                  <div className="flex items-center justify-between pt-3 border-t border-dashed" style={{ borderColor: `${theme.borderColor}40` }}>
                    <span className="text-[15px] font-bold text-[#64748b]">Score</span>
                    <span
                      className="inline-flex items-center justify-center text-[14px] font-bold"
                      style={{ color: theme.primaryColor }}
                    >
                      {student.score}
                    </span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
