import React, { useEffect, useState } from 'react'
import { Heart, User, MapPin, Calendar, Phone, Sparkles, Filter } from 'lucide-react'
import { memberApi, assetUrl, formatDate } from '../../lib/api'
import { useWebTheme } from '../../hooks/useWebTheme'

const getStoredWebTheme = () => {
  const colorKeys = [
    'backgroundColor', 'borderColor', 'buttonColor', 'fontColor',
    'gradientEnd', 'gradientStart', 'primaryColor', 'secondaryColor', 'textColor'
  ]
  return colorKeys.reduce((theme, key) => {
    const value = localStorage.getItem(`web_${key}`)
    return value ? { ...theme, [key]: value } : theme
  }, {})
}

export default function MatrimonialWebPage() {
  useWebTheme()
  const [theme, setTheme] = useState(getStoredWebTheme())
  const [profiles, setProfiles] = useState([])
  const [loading, setLoading] = useState(true)
  const [genderFilter, setGenderFilter] = useState('')

  useEffect(() => {
    const loadTheme = () => setTheme(getStoredWebTheme())
    loadTheme()
    window.addEventListener('storage', loadTheme)
    return () => window.removeEventListener('storage', loadTheme)
  }, [])

  useEffect(() => {
    const fetchMatrimonials = async () => {
      try {
        setLoading(true)
        const response = await memberApi.get('/matrimonies?limit=100&status=1')
        const rows = Array.isArray(response.data?.data) ? response.data.data : (response.data || [])
        setProfiles(rows)
      } catch (err) {
        console.error('Failed to fetch matrimonial profiles:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchMatrimonials()
  }, [])

  const filteredProfiles = genderFilter 
    ? profiles.filter(p => String(p.gender).toLowerCase() === genderFilter.toLowerCase())
    : profiles

  return (
    <div className="w-full py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3 bg-pink-50 text-pink-600 border border-pink-100">
          <Heart className="w-3.5 h-3.5 text-pink-500 fill-pink-500" /> Community Matrimonial
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3" style={{ color: theme.textColor || '#123524' }}>
          Matrimonial Profiles
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Find suitable life partners from within our trusted community. Connect with verified families.
        </p>

        {/* Gender Filter Tabs */}
        <div className="flex items-center justify-center gap-2 mt-6">
          <button
            onClick={() => setGenderFilter('')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              genderFilter === '' 
                ? 'bg-gray-900 text-white shadow-xs' 
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            All Profiles ({profiles.length})
          </button>
          <button
            onClick={() => setGenderFilter('Female')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              genderFilter === 'Female' 
                ? 'bg-pink-600 text-white shadow-xs' 
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Brides (Female)
          </button>
          <button
            onClick={() => setGenderFilter('Male')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              genderFilter === 'Male' 
                ? 'bg-blue-600 text-white shadow-xs' 
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            Grooms (Male)
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin mb-4"></div>
          <p className="text-sm font-medium text-gray-500">Loading matrimonial profiles...</p>
        </div>
      ) : filteredProfiles.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-gray-100 shadow-sm p-8 max-w-md mx-auto">
          <Heart className="w-12 h-12 text-pink-200 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-800 mb-1">No Profiles Found</h3>
          <p className="text-sm text-gray-500">There are currently no matrimonial listings under this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProfiles.map((profile) => {
            const photo = profile.person_image || profile.image || (Array.isArray(profile.images) ? profile.images[0] : null)
            return (
              <div 
                key={profile.id || profile._id} 
                className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
              >
                <div className="p-6">
                  <div className="flex items-start gap-4 mb-4">
                    {photo ? (
                      <img 
                        src={assetUrl(photo)} 
                        alt={profile.full_name || profile.name} 
                        className="w-20 h-20 rounded-2xl object-cover border border-gray-100 shadow-xs shrink-0" 
                      />
                    ) : (
                      <div className="w-20 h-20 rounded-2xl bg-pink-50 border border-pink-100 flex items-center justify-center text-pink-400 shrink-0">
                        <User className="w-10 h-10" />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1">
                        <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                          String(profile.gender).toLowerCase() === 'female' 
                            ? 'bg-pink-50 text-pink-700 border border-pink-100' 
                            : 'bg-blue-50 text-blue-700 border border-blue-100'
                        }`}>
                          {profile.gender || 'Profile'}
                        </span>
                        {profile.marital_status && (
                          <span className="inline-flex px-2 py-0.5 rounded text-[10px] font-medium bg-gray-50 text-gray-600 border border-gray-100">
                            {profile.marital_status}
                          </span>
                        )}
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 truncate">
                        {profile.full_name || profile.name || 'Community Member'}
                      </h3>
                      <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3 text-gray-400 shrink-0" />
                        <span className="truncate">{profile.city || profile.address || 'Gujarat'}</span>
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 py-3 border-t border-gray-50 text-xs text-gray-600">
                    {profile.birthdate && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Date of Birth:</span>
                        <span className="font-medium text-gray-800">{formatDate(profile.birthdate)}</span>
                      </div>
                    )}
                    {profile.education && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Education:</span>
                        <span className="font-medium text-gray-800 truncate max-w-[160px]">{profile.education}</span>
                      </div>
                    )}
                    {profile.occupation && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Occupation:</span>
                        <span className="font-medium text-gray-800 truncate max-w-[160px]">{profile.occupation}</span>
                      </div>
                    )}
                  </div>

                  {profile.about && (
                    <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mt-2 pt-2 border-t border-gray-50">
                      {profile.about}
                    </p>
                  )}
                </div>

                {profile.mobile_number && (
                  <div className="px-6 py-3 bg-gray-50/50 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-500 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-400" /> Contact Family:
                    </span>
                    <a 
                      href={`tel:${profile.mobile_number}`} 
                      className="text-xs font-bold text-pink-600 hover:underline font-mono"
                    >
                      {profile.mobile_number}
                    </a>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
