import React, { useEffect, useRef, useState } from 'react'
import { Users } from 'lucide-react'
import { memberApi } from '../../lib/api'
import { COMMITTEE_ENDPOINTS } from '../../utils/endpoints'



const normalizeCommitteeMember = (member, index) => {
  const name = [member.first_name, member.middle_name, member.last_name]
    .filter(Boolean)
    .join(' ')
    .trim()

  return {
    id: member.id || `${name}-${index}`,
    name: name || 'Committee Member',
    role: member.role_name || (typeof member.role_id === 'object' ? member.role_id?.name : '') || member.role || 'Member',
    image: member.image || "/image.png",
  }
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

export default function Members() {
  const [theme, setTheme] = useState(getStoredWebTheme())
  const [members, setMembers] = useState([])
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
    const fetchCommitteeMembers = async () => {
      try {
        setLoading(true)
        const response = await memberApi.get(`${COMMITTEE_ENDPOINTS.GET_MEMBERS}?status=1`)
        const rows = Array.isArray(response.data?.data) ? response.data.data : []
        const activeRows = rows.filter(r => r.status === undefined || r.status === null || Number(r.status) === 1 || String(r.status).toLowerCase() === 'active')
        setMembers(activeRows.map(normalizeCommitteeMember))
      } catch (error) {
        setMembers([])
      } finally {
        setLoading(false)
      }
    }

    fetchCommitteeMembers()
  }, [])

  const visibleMembers = members.length > 0 ? members : []

  // Duplicate items heavily to ensure they fill wide screens and prevent white space.
  // Using an even number of duplications ensures translateX(-50%) works perfectly.
  const doubled = Array(12).fill(visibleMembers).flat()
  return (
    <section
      id="members"
      className="w-full px-4 sm:px-6 lg:px-8 pb-10 sm:pb-12 lg:pb-14 relative overflow-hidden"
      style={{
        backgroundColor: '#FFFFFF', // User requested strictly white background
      }}
    >
      {/* Decorative Blur Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-[0.03] blur-3xl pointer-events-none" style={{ backgroundColor: theme.primaryColor }} />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-[0.03] blur-3xl pointer-events-none" style={{ backgroundColor: theme.secondaryColor }} />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-8 sm:mb-12 relative">
          {/* Faint Background Text */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-[60%] w-full text-[5rem] sm:text-[8rem] md:text-[10rem] font-black opacity-[0.02] pointer-events-none tracking-tighter uppercase whitespace-nowrap select-none" style={{ color: theme.primaryColor }}>
            Committee
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
              <Users className="w-4 h-4" style={{ color: theme.primaryColor }} />
              <span>Leadership</span>
            </div>

            {/* Heading */}
            <h2
              className="text-3xl sm:text-4xl lg:text-4xl font-bold tracking-tight"
              style={{ color: theme.textColor }}
            >
              Meet Our Committee Members
            </h2>
          </div>

        </div>

        {loading ? (
          <div className="flex gap-[24px] justify-center overflow-hidden px-4 py-2">
            {Array(5).fill(0).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="relative flex-shrink-0 w-[220px] sm:w-[240px] rounded-lg overflow-hidden bg-white border border-gray-100 shadow-sm"
              >
                <div className="w-full aspect-square bg-gray-200 animate-pulse" />
                <div className="px-4 pt-3 pb-4 flex flex-col items-center bg-white">
                  <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse mb-3" />
                  <div className="h-4 w-1/2 bg-gray-200 rounded-full animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div style={{
            overflow: 'hidden', position: 'relative',
            maskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
            WebkitMaskImage: 'linear-gradient(to right, transparent 0%, black 8%, black 92%, transparent 100%)',
          }}>
            <div
              style={{
                display: 'flex',
                gap: '24px',
                width: 'max-content',
                padding: '10px 12px', // 12px + 12px = 24px (equals gap) to make the -50% scroll mathematically seamless
                animation: 'scroll-left 90s linear infinite', // Slowed down slightly for smoother readability
              }}
              onMouseEnter={e => e.currentTarget.style.animationPlayState = 'paused'}
              onMouseLeave={e => e.currentTarget.style.animationPlayState = 'running'}
            >
              {doubled.map((member, i) => (
                <article
                  key={`${member.id}-${i}`}
                  className="group relative flex-shrink-0 w-[220px] sm:w-[240px] rounded-lg overflow-hidden transition-all duration-500 bg-white border"
                  style={{
                    borderColor: `${theme.borderColor}50`,
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-5px)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0px)'
                  }}
                >
                  {/* Flat Square Image (Edge-to-Edge) */}
                  <div className="relative w-full aspect-square bg-gray-50 overflow-hidden">
                    <img
                      src={member.image}
                      alt={member.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      draggable={false}
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-10 pointer-events-none" />
                  </div>

                  {/* Text Content */}
                  <div className="px-4 pt-3 pb-4 text-center relative z-20 bg-white flex flex-col items-center">
                    <h3
                      className="text-base sm:text-[17px] font-bold mb-1.5 w-full truncate transition-colors duration-300"
                      style={{ color: theme.primaryColor }}
                    >
                      {member.name}
                    </h3>
                    <div
                      className="inline-flex items-center justify-center text-[11px] sm:text-[12px] font-medium tracking-wide px-3 py-0.5 rounded-full border bg-white"
                      style={{
                        color: theme.primaryColor,
                        borderColor: theme.primaryColor,
                      }}
                    >
                      {member.role}
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
