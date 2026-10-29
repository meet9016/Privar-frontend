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
    image: member.image || '/image.png',
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

/* ── Individual Member Card ─────────────────────────────────────── */
function MemberCard({ member, theme, index }) {
  const [hovered, setHovered] = useState(false)
  const primary = theme.primaryColor || '#1e3a5f'
  const secondary = theme.secondaryColor || shadeColor(primary, 30)

  return (
    <article
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        position: 'relative',
        borderRadius: 20,
        overflow: 'hidden',
        background: '#fff',
        boxShadow: hovered
          ? `0 20px 48px -8px ${primary}28, 0 4px 16px -4px ${primary}18`
          : '0 2px 12px 0 rgba(0,0,0,0.07)',
        transform: hovered ? 'translateY(-6px) scale(1.012)' : 'translateY(0) scale(1)',
        transition: 'transform 0.4s cubic-bezier(0.34,1.3,0.64,1), box-shadow 0.4s ease',
        cursor: 'default',
        animationDelay: `${index * 60}ms`,
      }}
    >
      <style>{`
        @keyframes card-in {
          from { opacity: 0; transform: translateY(24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      {/* ── Portrait Image ── */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          paddingBottom: '118%', /* portrait ratio */
          overflow: 'hidden',
          background: `linear-gradient(145deg, ${primary}10, ${secondary}18)`,
        }}
      >
        <img
          src={member.image}
          alt={member.name}
          draggable={false}
          loading="lazy"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'top center',
            transform: hovered ? 'scale(1.07)' : 'scale(1)',
            transition: 'transform 0.65s cubic-bezier(0.25,0.46,0.45,0.94)',
          }}
        />

        {/* Gradient overlay — stronger at bottom */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: hovered
              ? `linear-gradient(to top, ${primary}e8 0%, ${primary}60 40%, transparent 75%)`
              : 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.28) 45%, transparent 75%)',
            transition: 'background 0.4s ease',
            zIndex: 1,
          }}
        />

        {/* Name + role block at bottom — slides up on hover */}
        <div
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 2,
            padding: '0 14px 14px',
            transform: hovered ? 'translateY(0)' : 'translateY(2px)',
            transition: 'transform 0.4s ease',
          }}
        >
          <p
            style={{
              margin: 0,
              fontSize: 14,
              fontWeight: 800,
              color: '#ffffff',
              letterSpacing: '0.01em',
              lineHeight: 1.3,
              textShadow: '0 1px 4px rgba(0,0,0,0.3)',
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {member.name}
          </p>

          {/* Role badge — displayed below the name */}
          {member.role && (
            <div style={{ marginTop: 5 }}>
              <span
                style={{
                  display: 'inline-block',
                  background: 'rgba(255,255,255,0.95)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  borderRadius: 999,
                  padding: '2px 9px',
                  fontSize: 10,
                  fontWeight: 800,
                  letterSpacing: '0.05em',
                  textTransform: 'uppercase',
                  color: primary,
                  border: `1px solid ${primary}22`,
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                  maxWidth: '100%',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {member.role}
              </span>
            </div>
          )}

          {/* Animated underline on hover */}
          <div
            style={{
              marginTop: 6,
              height: 2,
              borderRadius: 999,
              background: `linear-gradient(to right, #fff, ${secondary})`,
              width: hovered ? '50%' : '0%',
              transition: 'width 0.4s cubic-bezier(0.34,1.3,0.64,1) 0.05s',
            }}
          />
        </div>
      </div>
    </article>
  )
}

/* ── Skeleton Card ───────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div style={{ borderRadius: 20, overflow: 'hidden', background: '#fff', boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}>
      <div style={{ width: '100%', paddingBottom: '118%', position: 'relative', background: '#f3f4f6' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, #f3f4f6 25%, #e9eaeb 50%, #f3f4f6 75%)',
            backgroundSize: '200% 100%',
            animation: 'skeleton-shimmer 1.4s infinite',
          }}
        />
      </div>
      <style>{`
        @keyframes skeleton-shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  )
}

/* ── Main Section ────────────────────────────────────────────────── */
export default function Members() {
  const [theme, setTheme] = useState(getStoredWebTheme())
  const [members, setMembers] = useState([])
  const [loading, setLoading] = useState(true)

  const primary = theme.primaryColor || '#1e3a5f'
  const secondary = theme.secondaryColor || shadeColor(primary, 30)

  useEffect(() => {
    const loadTheme = () => setTheme(getStoredWebTheme())
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
        const activeRows = rows.filter(r =>
          r.status === undefined || r.status === null ||
          Number(r.status) === 1 || String(r.status).toLowerCase() === 'active'
        )
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
      style={{
        width: '100%',
        padding: '0 16px 64px',
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: '#FFFFFF',
      }}
    >
      <style>{`
        @keyframes section-fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .member-grid {
          display: grid;
          gap: 20px;
          grid-template-columns: repeat(2, 1fr);
        }
        @media (min-width: 480px)  { .member-grid { grid-template-columns: repeat(3, 1fr); } }
        @media (min-width: 768px)  { .member-grid { grid-template-columns: repeat(4, 1fr); } }
        @media (min-width: 1024px) { .member-grid { grid-template-columns: repeat(5, 1fr); } }
      `}</style>

      {/* Subtle bg decorations */}
      <div style={{ position: 'absolute', top: -80, left: -80, width: 320, height: 320, borderRadius: '50%', background: `${primary}06`, filter: 'blur(60px)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', bottom: -80, right: -80, width: 280, height: 280, borderRadius: '50%', background: `${secondary}06`, filter: 'blur(60px)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', zIndex: 1 }}>

        {/* ── Section Header ── */}
        <div style={{ textAlign: 'center', marginBottom: 48, animation: 'section-fade-in 0.6s ease both' }}>

          {/* Eyebrow badge */}
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                padding: '6px 16px',
                borderRadius: 999,
                border: `1.5px solid ${primary}30`,
                background: `${primary}08`,
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: '0.07em',
                textTransform: 'uppercase',
                color: primary,
              }}
            >
              <Users style={{ width: 14, height: 14, color: primary }} />
              Leadership
            </div>
          </div>

          {/* Main heading */}
          <h2
            style={{
              margin: '0 0 12px',
              fontSize: 'clamp(26px, 4vw, 40px)',
              fontWeight: 800,
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              color: theme.textColor || '#0f172a',
            }}
          >
            Meet Our Committee Members
          </h2>


        </div>

        {/* ── Grid ── */}
        {loading ? (
          <div className="member-grid">
            {Array(10).fill(0).map((_, i) => <SkeletonCard key={`sk-${i}`} />)}
          </div>
        ) : visibleMembers.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 24px',
              borderRadius: 20,
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              maxWidth: 400,
              margin: '0 auto',
            }}
          >
            <Users style={{ width: 40, height: 40, color: '#cbd5e1', margin: '0 auto 12px' }} />
            <h3 style={{ margin: '0 0 6px', fontSize: 15, fontWeight: 600, color: '#475569' }}>No Committee Members Found</h3>
            <p style={{ margin: 0, fontSize: 13, color: '#94a3b8' }}>Committee member details will appear here once added.</p>
          </div>
        ) : (
          <div className="member-grid">
            {visibleMembers.map((member, i) => (
              <MemberCard key={`${member.id}-${i}`} member={member} theme={theme} index={i} />
            ))}
          </div>
        )}
      </div>
    </section>
  )
}
