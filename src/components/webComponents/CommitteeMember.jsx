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

  return (
    <section
      id="members"
      className="w-full px-4 sm:px-6 lg:px-8  relative overflow-hidden"
      style={{
        backgroundColor: '#FFFFFF', // User requested strictly white background
      }}
    >
      {/* Decorative Blur Orbs */}
      <div className="absolute -top-32 -left-32 w-96 h-96 rounded-full opacity-[0.03] blur-3xl pointer-events-none" style={{ backgroundColor: theme.primaryColor }} />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 rounded-full opacity-[0.03] blur-3xl pointer-events-none" style={{ backgroundColor: theme.secondaryColor }} />

      <div className="max-w-7xl mx-auto relative z-10">
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
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 px-4 py-2">
            {Array(10).fill(0).map((_, i) => (
              <div
                key={`skeleton-${i}`}
                className="relative w-full rounded-lg overflow-hidden bg-white border border-gray-100 shadow-sm"
              >
                <div className="w-full aspect-[4/4.8] bg-gray-200 animate-pulse" />
                <div className="px-4 pt-3 pb-4 flex flex-col items-center bg-white">
                  <div className="h-5 w-3/4 bg-gray-200 rounded animate-pulse mb-3" />
                  <div className="h-4 w-1/2 bg-gray-200 rounded-full animate-pulse" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 px-4 py-2">
            {visibleMembers.map((member, i) => (
              <article
                key={`${member.id}-${i}`}
                className="group relative w-full rounded-t-[36px] rounded-b-2xl overflow-hidden transition-all duration-500 bg-white border shadow-sm hover:shadow-2xl hover:-translate-y-2 flex flex-col"
                style={{
                  borderColor: `${theme.primaryColor || '#0a2342'}20`,
                }}
              >
                {/* Capsule Portrait Container */}
                <div className="relative w-full aspect-[4/4.8] bg-gray-100 overflow-hidden">
                  <img
                    src={member.image}
                    alt={member.name}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    draggable={false}
                    loading="lazy"
                  />

                  {/* Gradient Overlay for Text Readability */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-transparent z-10 pointer-events-none" />

                  {/* Top-Right Floating Role Badge */}
                  <div className="absolute top-3 right-3 z-20 pointer-events-none">
                    <span
                      className="inline-block px-3 py-1 rounded-full text-[10px] sm:text-[11px] font-black tracking-wider uppercase shadow-md backdrop-blur-md bg-white/95 text-gray-900 border border-white/40 truncate"
                      style={{ color: theme.primaryColor || '#0a2342' }}
                    >
                      {member.role}
                    </span>
                  </div>

                  {/* Bottom Overlay Name Label */}
                  <div className="absolute bottom-3 left-3 right-3 z-20 pointer-events-none text-left">
                    <h3 className="text-white text-sm sm:text-base font-extrabold leading-snug drop-shadow-md truncate">
                      {member.name}
                    </h3>
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
