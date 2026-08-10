export const ALLOWED_EMAIL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'yahoo.co.in',
  'ymail.com',
  'outlook.com',
  'hotmail.com',
  'live.com',
  'msn.com',
  'icloud.com',
  'me.com',
  'protonmail.com',
  'proton.me',
  'zoho.com',
  'rediffmail.com',
  'aol.com',
  'gmx.com',
  'parivar.com',
  'gov.in',
  'nic.in',
  'edu.in',
  'org.in',
  'co.in'
]

export const isValidEmail = (email) => {
  if (!email || typeof email !== 'string') return false
  const trimmed = email.trim().toLowerCase()
  if (!trimmed) return false

  // Strict email format regex
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,10}$/
  if (!emailRegex.test(trimmed)) return false

  const parts = trimmed.split('@')
  if (parts.length !== 2) return false

  const username = parts[0]
  const domain = parts[1]

  if (!username || username.length < 2) return false

  // Domain must be one of the allowed email domains or end with an allowed domain (e.g. gmail.com)
  const isAllowedDomain = ALLOWED_EMAIL_DOMAINS.some(allowed => 
    domain === allowed || domain.endsWith('.' + allowed)
  )

  if (!isAllowedDomain) {
    return false
  }

  return true
}
