import React, { useEffect, useState } from 'react'
import { Briefcase, MapPin, Building2, Clock, Phone, Mail, ChevronRight } from 'lucide-react'
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
  const [selectedJob, setSelectedJob] = useState(null)

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
      <div className="text-center max-w-3xl mx-auto mb-10">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider mb-3 bg-primary/10" style={{ color: theme.primaryColor || '#0a2342' }}>
          <Briefcase className="w-3.5 h-3.5" /> Career Opportunities
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-3" style={{ color: theme.textColor || '#123524' }}>
          Community Job Vacancies
        </h1>
        <p className="text-gray-600 text-sm sm:text-base">
          Explore job openings posted by community businesses and members. Connect directly with employers.
        </p>
      </div>

      {loading ? (
        <div className="py-20 text-center flex flex-col items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin mb-4" style={{ borderTopColor: theme.primaryColor || '#0a2342' }}></div>
          <p className="text-sm font-medium text-gray-500">Loading open positions...</p>
        </div>
      ) : jobs.length === 0 ? (
        <div className="py-16 text-center bg-white rounded-3xl border border-gray-100 shadow-sm p-8 max-w-md mx-auto">
          <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-800 mb-1">No Vacancies Available</h3>
          <p className="text-sm text-gray-500">Check back later for new career opportunities within the community.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {jobs.map((job) => (
            <div 
              key={job.id || job._id} 
              className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  {job.image ? (
                    <img src={assetUrl(job.image)} alt={job.title} className="w-14 h-14 rounded-xl object-cover border border-gray-100 shadow-xs" />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400">
                      <Building2 className="w-7 h-7" />
                    </div>
                  )}
                  <span className="inline-flex px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                    {job.job_type || 'Full Time'}
                  </span>
                </div>

                <h3 className="font-bold text-lg text-gray-900 mb-1 line-clamp-1">{job.title}</h3>
                <p className="text-sm font-medium text-gray-500 mb-3 flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-gray-400 shrink-0" />
                  <span className="truncate">{job.company_name || 'Community Enterprise'}</span>
                </p>

                <div className="space-y-2 py-3 border-y border-gray-50 text-xs text-gray-600 mb-4">
                  {job.location && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                      <span className="truncate">{job.location}</span>
                    </div>
                  )}
                  {job.salary && (
                    <div className="flex items-center gap-2 font-semibold text-gray-800">
                      <span className="text-gray-400">Salary:</span> {job.salary}
                    </div>
                  )}
                </div>

                {job.description && (
                  <p className="text-xs text-gray-500 line-clamp-2 leading-relaxed mb-4">
                    {job.description}
                  </p>
                )}
              </div>

              <div className="pt-3 border-t border-gray-50 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {job.contact_number && (
                    <a 
                      href={`tel:${job.contact_number}`} 
                      className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors"
                      title={job.contact_number}
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                  )}
                  {job.contact_email && (
                    <a 
                      href={`mailto:${job.contact_email}`} 
                      className="p-2 rounded-xl bg-gray-50 hover:bg-gray-100 text-gray-700 transition-colors"
                      title={job.contact_email}
                    >
                      <Mail className="w-4 h-4" />
                    </a>
                  )}
                </div>
                
                {job.contact_number ? (
                  <a
                    href={`tel:${job.contact_number}`}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90 flex items-center gap-1"
                    style={{ backgroundColor: theme.primaryColor || '#0a2342' }}
                  >
                    Apply Now &rarr;
                  </a>
                ) : job.contact_email ? (
                  <a
                    href={`mailto:${job.contact_email}`}
                    className="px-4 py-2 rounded-xl text-xs font-bold text-white transition-opacity hover:opacity-90 flex items-center gap-1"
                    style={{ backgroundColor: theme.primaryColor || '#0a2342' }}
                  >
                    Email CV &rarr;
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
