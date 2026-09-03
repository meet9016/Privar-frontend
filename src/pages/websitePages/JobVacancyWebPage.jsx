import React, { useEffect, useState } from 'react'
import { Briefcase, MapPin, Building2, Clock, Phone, Mail, ChevronRight, IndianRupee } from 'lucide-react'
import { memberApi, assetUrl } from '../../lib/api'
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

export default function JobVacancyWebPage() {
  useWebTheme()
  const [theme, setTheme] = useState(getStoredWebTheme())
  const [jobs, setJobs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadTheme = () => setTheme(getStoredWebTheme())
    loadTheme()
    window.addEventListener('storage', loadTheme)
    return () => window.removeEventListener('storage', loadTheme)
  }, [])

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        setLoading(true)
        const response = await memberApi.get('/job-vacancy?limit=100&status=1')
        const rows = Array.isArray(response.data?.data) ? response.data.data : (response.data || [])
        setJobs(rows)
      } catch (err) {
        console.error('Failed to fetch job vacancies:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchJobs()
  }, [])

  return (
    <div className="w-full py-10 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header Section */}
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-extrabold uppercase tracking-wider mb-3 bg-blue-50 text-blue-700 border border-blue-200 shadow-sm"
          style={{ color: theme.primaryColor || '#0a2342' }}
        >
          <Briefcase className="w-4 h-4" />
          <span>Career Opportunities</span>
        </div>
        <h1
          className="text-3xl sm:text-4xl lg:text-4xl font-extrabold tracking-tight mb-3"
          style={{ color: theme.textColor || '#123524' }}
        >
          Community Job Vacancies
        </h1>
        <p className="text-gray-600 text-sm sm:text-base leading-relaxed">
          Explore job openings posted by community businesses and members. Connect directly with employers.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full animate-spin mb-4" style={{ borderTopColor: theme.primaryColor || '#0a2342' }}></div>
          <p className="text-sm font-semibold text-gray-500">Loading open positions...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-gray-200 shadow-md p-8 max-w-md mx-auto">
          <Briefcase className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-800 mb-1">No Vacancies Available</h3>
          <p className="text-sm text-gray-500">Check back later for new career opportunities within the community.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-7">
          {jobs.map((job) => (
            <div
              key={job.id || job._id}
              className="bg-white rounded-3xl border border-gray-200 p-6 shadow-sm hover:shadow-xl hover:border-gray-300 hover:-translate-y-1.5 transition-all duration-500 flex flex-col justify-between group overflow-hidden"
            >
              <div>
                {/* Logo & Job Type Tag */}
                <div className="flex items-start justify-between gap-3 mb-5">
                  {job.image ? (
                    <img
                      src={assetUrl(job.image)}
                      alt={job.title}
                      className="w-16 h-16 rounded-2xl object-cover border-2 border-white shadow-md group-hover:scale-105 transition-transform duration-500 shrink-0"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 shadow-xs shrink-0">
                      <Building2 className="w-8 h-8" />
                    </div>
                  )}
                  <span className="inline-flex px-3 py-1 rounded-full text-xs font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-800 border border-emerald-200 shadow-2xs">
                    {job.job_type || 'Full Time'}
                  </span>
                </div>

                {/* Title & Company */}
                <h3 className="font-extrabold text-lg text-gray-900 mb-1.5 line-clamp-1 group-hover:text-blue-700 transition-colors">
                  {job.title}
                </h3>
                <p className="text-xs font-bold text-gray-800 mb-4 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-gray-600 shrink-0" />
                  <span className="truncate">{job.company_name || 'Community Enterprise'}</span>
                </p>

                {/* Details List */}
                <div className="space-y-2.5 py-3.5 border-y border-gray-200 text-xs mb-4">
                  {job.location && (
                    <div className="flex items-center gap-2 font-bold text-gray-800">
                      <MapPin className="w-4 h-4 text-gray-600 shrink-0" />
                      <span className="truncate">{job.location}</span>
                    </div>
                  )}
                  {job.salary && (
                    <div className="flex items-center gap-2 font-extrabold text-gray-900">
                      <span className="text-gray-600 font-bold">Salary:</span> {job.salary}
                    </div>
                  )}
                </div>

                {/* Job Description */}
                {job.description && (
                  <p className="text-xs font-medium text-gray-700 line-clamp-2 leading-relaxed mb-5">
                    {job.description}
                  </p>
                )}
              </div>

              {/* Action Footer */}
              <div className="pt-4 border-t border-gray-200 flex items-center justify-between gap-2.5">
                <div className="flex items-center gap-2">
                  {job.contact_number && (
                    <a
                      href={`tel:${job.contact_number}`}
                      className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300 transition-all hover:scale-105"
                      title={job.contact_number}
                    >
                      <Phone className="w-4 h-4 text-gray-800" />
                    </a>
                  )}
                  {job.contact_email && (
                    <a
                      href={`mailto:${job.contact_email}`}
                      className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-900 border border-gray-300 transition-all hover:scale-105"
                      title={job.contact_email}
                    >
                      <Mail className="w-4 h-4 text-gray-800" />
                    </a>
                  )}
                </div>

                {job.contact_number ? (
                  <a
                    href={`tel:${job.contact_number}`}
                    className="px-5 py-2.5 rounded-full text-xs font-extrabold text-white transition-all shadow-sm hover:scale-105 flex items-center gap-1.5"
                    style={{ backgroundColor: theme.primaryColor || '#0a2342' }}
                  >
                    <span>Apply Now</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </a>
                ) : job.contact_email ? (
                  <a
                    href={`mailto:${job.contact_email}`}
                    className="px-5 py-2.5 rounded-full text-xs font-extrabold text-white transition-all shadow-sm hover:scale-105 flex items-center gap-1.5"
                    style={{ backgroundColor: theme.primaryColor || '#0a2342' }}
                  >
                    <span>Email CV</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </a>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
