import React, { useEffect, useState } from 'react'
import { Award, GraduationCap, Medal, Star, Trophy } from 'lucide-react'
import { memberApi } from '../../lib/api'


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
  name: [student.student_name, student.surname].filter(Boolean).join(' ') || 'Student',
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
        const response = await memberApi.get('/students')
        const rows = Array.isArray(response.data?.data) ? response.data.data : []
        const activeRows = rows
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
      className="w-full px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20"
      style={{ backgroundColor: theme.backgroundColor }}
    >
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 sm:mb-12">
          <p
            className="text-sm sm:text-base font-semibold tracking-wide mb-2"
            style={{ color: theme.primaryColor }}
          >
            - Top Students -
          </p>
          <h2
            className="text-3xl sm:text-4xl font-semibold tracking-tight"
            style={{ color: theme.textColor }}
          >
            Students Who{' '}
            <span
              style={{
                backgroundImage: `linear-gradient(to right, ${theme.gradientStart}, ${theme.secondaryColor})`,
                WebkitBackgroundClip: 'text',
                backgroundClip: 'text',
                color: 'transparent',
              }}
            >
              Achieved Ranks
            </span>
          </h2>
          <div
            className="w-12 h-1 rounded-full mx-auto mt-4"
            style={{
              backgroundImage: `linear-gradient(to right, ${theme.gradientStart}, ${theme.gradientEnd})`,
            }}
          />
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
            Loading top students...
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {visibleStudents.map((student, index) => (
            <article
              key={student.name}
              className="group overflow-hidden rounded-lg border bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
              style={{ borderColor: theme.borderColor }}
            >
              <div className="relative h-56 overflow-hidden">
                <img
                  src={student.image}
                  alt={student.name}
                  className="h-full w-full object-contain transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                <div
                  className="absolute left-4 top-4 flex h-12 w-12 items-center justify-center rounded-full shadow-lg"
                  style={{
                    backgroundImage: `linear-gradient(to right, ${theme.gradientStart}, ${theme.gradientEnd})`,
                    color: theme.fontColor,
                  }}
                >
                  {index === 0 ? <Trophy className="h-6 w-6" /> : <Medal className="h-6 w-6" />}
                </div>
                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-sm font-semibold text-white/90">{student.standard}</p>
                  <h3 className="mt-1 text-xl font-semibold text-white">{student.name}</h3>
                </div>
              </div>

              <div className="p-5">
                <div className="mb-4 flex items-center justify-between gap-3">
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold"
                    style={{
                      backgroundColor: shadeColor(theme.backgroundColor, 2),
                      color: theme.primaryColor,
                    }}
                  >
                    <Award className="h-3.5 w-3.5" />
                    {student.rank}
                  </span>
                  <span
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold"
                    style={{
                      backgroundColor: shadeColor(theme.backgroundColor, 4),
                      color: theme.textColor,
                    }}
                  >
                    <Star className="h-3.5 w-3.5" />
                    {student.score}
                  </span>
                </div>

                <div
                  className="flex items-center gap-3 rounded-md border px-4 py-3"
                  style={{
                    borderColor: theme.borderColor,
                    backgroundColor: shadeColor(theme.backgroundColor, 3),
                  }}
                >
                  <GraduationCap className="h-5 w-5 flex-shrink-0" style={{ color: theme.primaryColor }} />
                  <div>
                    <p className="text-sm font-semibold  tracking-wide" style={{ color: shadeColor(theme.textColor, 25) }}>
                      Achievement
                    </p>
                    <p className="text-sm font-semibold" style={{ color: theme.textColor }}>
                      {student.achievement}
                    </p>
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}
