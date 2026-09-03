import React, { useEffect, useState } from 'react'
import { Heart, User, MapPin, Calendar, Phone, Sparkles, Briefcase, GraduationCap } from 'lucide-react'
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
      {/* Header Section */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div 
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider mb-3 bg-pink-50 text-pink-600 border border-pink-100 shadow-sm"
        >
          <Heart className="w-4 h-4 text-pink-500 fill-pink-500 animate-pulse" />
          <span>Community Matrimonial</span>
        </div>
        <h1 
          className="text-3xl sm:text-4xl lg:text-4xl font-extrabold tracking-tight mb-3" 
          style={{ color: theme.textColor || '#123524' }}
        >
          Matrimonial Profiles
        </h1>
        <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
          Find suitable life partners from within our trusted community. Connect directly with verified families.
        </p>

        {/* Gender Filter Tabs */}
        <div className="flex items-center justify-center gap-2.5 mt-7 flex-wrap">
          <button
            onClick={() => setGenderFilter('')}
            className={`px-5 py-2.5 rounded-full text-xs font-black transition-all duration-300 shadow-sm ${
              genderFilter === '' 
                ? 'bg-gray-900 text-white shadow-md scale-105' 
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
            }`}
          >
            All Profiles ({profiles.length})
          </button>
          <button
            onClick={() => setGenderFilter('Female')}
            className={`px-5 py-2.5 rounded-full text-xs font-black transition-all duration-300 shadow-sm flex items-center gap-1.5 ${
              genderFilter === 'Female' 
                ? 'bg-pink-600 text-white shadow-md scale-105' 
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-pink-50 hover:text-pink-600'
            }`}
          >
            <Heart className="w-3.5 h-3.5 fill-current" />
            <span>Brides (Female)</span>
          </button>
          <button
            onClick={() => setGenderFilter('Male')}
            className={`px-5 py-2.5 rounded-full text-xs font-black transition-all duration-300 shadow-sm flex items-center gap-1.5 ${
              genderFilter === 'Male' 
                ? 'bg-blue-600 text-white shadow-md scale-105' 
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-blue-50 hover:text-blue-600'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Grooms (Male)</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-pink-200 border-t-pink-600 rounded-full animate-spin mb-4"></div>
          <p className="text-sm font-semibold text-gray-500">Loading matrimonial profiles...</p>
        </div>
      ) : filteredProfiles.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-gray-100 shadow-md p-8 max-w-md mx-auto">
          <Heart className="w-12 h-12 text-pink-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-800 mb-1">No Profiles Found</h3>
          <p className="text-sm text-gray-500">There are currently no matrimonial listings under this category.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {filteredProfiles.map((profile) => {
            const photo = profile.person_image || profile.image || (Array.isArray(profile.images) ? profile.images[0] : null)
            const isFemale = String(profile.gender).toLowerCase() === 'female'

            return (
              <div 
                key={profile.id || profile._id} 
                className="bg-white rounded-3xl border border-gray-200 shadow-sm hover:shadow-xl hover:border-pink-300 hover:-translate-y-1.5 transition-all duration-500 flex flex-col justify-between overflow-hidden group"
              >
                <div className="p-6">
                  {/* Top Header Card */}
                  <div className="flex items-start gap-4 mb-5">
                    {photo ? (
                      <div className="relative shrink-0">
                        <img 
                          src={assetUrl(photo)} 
                          alt={profile.full_name || profile.name} 
                          className="w-20 h-20 rounded-2xl object-cover border-2 border-white shadow-md group-hover:scale-105 transition-transform duration-500" 
                        />
                        <span className={`absolute -bottom-1.5 -right-1.5 p-1 rounded-full text-white shadow-md ${isFemale ? 'bg-pink-500' : 'bg-blue-500'}`}>
                          <Heart className="w-3 h-3 fill-current" />
                        </span>
                      </div>
                    ) : (
                      <div className={`w-20 h-20 rounded-2xl flex items-center justify-center shrink-0 border shadow-xs ${
                        isFemale ? 'bg-pink-50 border-pink-200 text-pink-500' : 'bg-blue-50 border-blue-200 text-blue-500'
                      }`}>
                        <User className="w-9 h-9" />
                      </div>
                    )}

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1.5 flex-wrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          isFemale 
                            ? 'bg-pink-50 text-pink-700 border border-pink-200' 
                            : 'bg-blue-50 text-blue-700 border border-blue-200'
                        }`}>
                          {profile.gender || 'Profile'}
                        </span>
                        {profile.marital_status && (
                          <span className="inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-700 border border-gray-300">
                            {profile.marital_status}
                          </span>
                        )}
                      </div>

                      <h3 className="font-extrabold text-lg text-gray-900 truncate group-hover:text-pink-600 transition-colors">
                        {profile.full_name || profile.name || 'Community Member'}
                      </h3>

                      <p className="text-xs font-bold text-gray-700 flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-gray-600 shrink-0" />
                        <span className="truncate">{profile.city || profile.address || 'Gujarat'}</span>
                      </p>
                    </div>
                  </div>

                  {/* Details List */}
                  <div className="space-y-2.5 py-3.5 border-t border-gray-200 text-xs">
                    {profile.birthdate && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 font-bold flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5 text-gray-600" /> Date of Birth:
                        </span>
                        <span className="font-extrabold text-gray-900">{formatDate(profile.birthdate)}</span>
                      </div>
                    )}
                    {profile.education && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 font-bold flex items-center gap-1.5">
                          <GraduationCap className="w-3.5 h-3.5 text-gray-600" /> Education:
                        </span>
                        <span className="font-extrabold text-gray-900 truncate max-w-[160px]">{profile.education}</span>
                      </div>
                    )}
                    {profile.occupation && (
                      <div className="flex items-center justify-between">
                        <span className="text-gray-700 font-bold flex items-center gap-1.5">
                          <Briefcase className="w-3.5 h-3.5 text-gray-600" /> Occupation:
                        </span>
                        <span className="font-extrabold text-gray-900 truncate max-w-[160px]">{profile.occupation}</span>
                      </div>
                    )}
                  </div>

                  {/* About Bio */}
                  {profile.about && (
                    <p className="text-xs font-medium text-gray-700 line-clamp-2 leading-relaxed mt-2 pt-2.5 border-t border-gray-200 italic">
                      "{profile.about}"
                    </p>
                  )}
                </div>

                {/* Bottom Contact Bar */}
                {profile.mobile_number && (
                  <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                    <span className="text-xs font-bold text-gray-800 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-gray-600" /> Contact Family:
                    </span>
                    <a 
                      href={`tel:${profile.mobile_number}`} 
                      className={`inline-flex items-center gap-1 px-3.5 py-1.5 rounded-full text-xs font-extrabold text-white transition-all shadow-sm hover:scale-105 ${
                        isFemale ? 'bg-pink-600 hover:bg-pink-700' : 'bg-blue-600 hover:bg-blue-700'
                      }`}
                    >
                      <span>{profile.mobile_number}</span>
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
