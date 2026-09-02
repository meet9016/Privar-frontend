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
        <div className="text-center mb-8 sm:mb-4 relative">
         
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

        {/* Custom Keyframes for One-by-One Bottom-to-Top Reveal */}
        <style>{`
          @keyframes studentCascadeUp {
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto px-4 mt-8">
            {Array(4).fill(0).map((_, i) => (
              <div key={`skeleton-${i}`} className="bg-white rounded-[32px] border border-gray-100 p-4 flex flex-col shadow-sm animate-pulse">
                <div className="w-full aspect-[4/3] bg-gray-200 rounded-[24px] mb-4" />
                <div className="h-5 w-3/4 bg-gray-200 rounded-full mb-2" />
                <div className="h-4 w-1/2 bg-gray-200 rounded-full" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto px-4 mt-8">
            {visibleStudents.map((student, index) => (
              <article
                key={student.name || index}
                className="group relative flex flex-col overflow-hidden bg-white rounded-[32px] border shadow-md transition-all duration-500 hover:shadow-2xl hover:-translate-y-2.5 p-4 opacity-0"
                style={{
                  borderColor: `${theme.primaryColor || '#0a2342'}20`,
                  animation: 'studentCascadeUp 0.65s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                  animationDelay: `${index * 100}ms`,
                }}
              >
                {/* Photo Header */}
                <div className="relative w-full aspect-[4/3] rounded-[24px] overflow-hidden bg-gray-900 mb-3.5 shadow-sm">
                  <img
                    src={student.image}
                    alt={student.name}
                    className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent pointer-events-none" />

                  {/* Top-Left Floating Rank Badge */}
                  <div
                    className="absolute top-3 left-3 px-3 py-1 text-xs font-black text-white rounded-full shadow-md z-10 backdrop-blur-md flex items-center gap-1.5 border border-white/30"
                    style={{ backgroundColor: theme.primaryColor || '#0a2342' }}
                  >
                    <Award className="h-3.5 w-3.5" />
                    <span>{student.rank}</span>
                  </div>

                  {/* Top-Right Trophy Icon */}
                  <div className="absolute top-3 right-3 flex items-center justify-center w-8 h-8 rounded-full bg-white/95 backdrop-blur-md shadow-md z-10 border border-white/50">
                    {index === 0 ? (
                      <Trophy className="h-4 w-4" style={{ color: theme.primaryColor || '#0a2342' }} />
                    ) : (
                      <Medal className="h-4 w-4" style={{ color: theme.primaryColor || '#0a2342' }} />
                    )}
                  </div>

                  {/* Bottom Category/Standard Tag */}
                  <div className="absolute bottom-3 left-3 z-10">
                    <span className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider text-white bg-black/45 backdrop-blur-md border border-white/30 truncate max-w-[130px]">
                      {student.standard}
                    </span>
                  </div>
                </div>

                {/* Card Body */}
                <div className="flex flex-col flex-1 justify-between px-1">
                  <div>
                    <h3 className="text-base sm:text-[17px] font-extrabold mb-1.5 leading-snug truncate" style={{ color: theme.textColor || theme.primaryColor || '#0a2342' }}>
                      {student.name}
                    </h3>

                    <div className="flex items-center gap-2 text-xs font-medium text-gray-600 mb-4">
                      <GraduationCap className="h-3.5 w-3.5 shrink-0" style={{ color: theme.primaryColor || '#0a2342' }} />
                      <span className="truncate">{student.achievement}</span>
                    </div>
                  </div>

                  {/* Score Footer */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between mt-auto">
                    <span className="text-xs font-extrabold text-gray-400 uppercase tracking-wider">Score</span>
                    <span
                      className="inline-flex items-center justify-center px-3.5 py-1 rounded-xl text-xs font-black text-white shadow-sm"
                      style={{ backgroundColor: theme.buttonColor || theme.primaryColor || '#0a2342', color: theme.fontColor || '#FFFFFF' }}
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
