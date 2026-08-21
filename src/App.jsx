import React, { Suspense, lazy, useContext } from 'react'
import { Routes, Route, Navigate, useParams } from 'react-router-dom'
import { AuthContext, AuthProvider } from './context/AuthContext'
import { NotificationProvider } from './context/NotificationContext'
import ProtectedRoute from './components/ProtectedRoute'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Businesses from './pages/Businesses'
import BusinessProfile from './pages/BusinessProfile'
import Students from './pages/Students'
import Donations from './pages/Donations'
import Expenses from './pages/Expenses'
import Settings from './pages/Settings'
import CommitteeMembers from './pages/CommitteeMembers'
import Roles from './pages/Roles'
import ContentPage from './pages/ContentPage'
import Events from './pages/Events'
import EventRegistrations from './pages/EventRegistration'
import MasterPage from './pages/MasterPage'
import News from './pages/News'
import { hasPermission } from './lib/permissions'
import Posts from './pages/Post'
import { activeTheme, applyTheme } from './theme/theme'
import { ThemeProvider } from './context/ThemeContext'

import Home from './pages/websitePages/Home'
import AboutPage from './pages/websitePages/AboutPage'
import MembersPage from './pages/websitePages/MembersPage'
import GalleryWebPage from './pages/websitePages/GalleryWebPage'
import EventsWebPage from './pages/websitePages/EventsWebPage'
import StudentsWebPage from './pages/websitePages/StudentsWebPage'
import DonorsWebPage from './pages/websitePages/DonorsWebPage'
import JobVacancyWebPage from './pages/websitePages/JobVacancyWebPage'
import MatrimonialWebPage from './pages/websitePages/MatrimonialWebPage'
import PrivacyPolicy from './components/webComponents/PrivacyAndPolicy'
import TermsAndConditions from './components/webComponents/TermsAndConditions'

import WebLayout from './components/webComponents/WebLayout'

const ReactToaster = lazy(() => import('./components/ReactToaster'))
const ConfirmDialog = lazy(() => import('./components/ConfirmDialog'))


applyTheme(activeTheme)

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <NotificationProvider>
        <Suspense fallback={null}>
        <ReactToaster />
        <ConfirmDialog />
      </Suspense>
      <Routes>
        {/* Public Website Routes with Persistent WebLayout (Header & Footer fixed) */}
        <Route element={<WebLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/members" element={<MembersPage />} />
          <Route path="/gallery" element={<GalleryWebPage />} />
          <Route path="/events" element={<EventsWebPage />} />
          <Route path="/students" element={<StudentsWebPage />} />
          <Route path="/donors" element={<DonorsWebPage />} />
          <Route path="/matrimonial" element={<MatrimonialWebPage />} />
          <Route path="/jobs" element={<JobVacancyWebPage />} />
          <Route path="/job-vacancy" element={<JobVacancyWebPage />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
        </Route>

        <Route path="/login" element={<Login />} />
        <Route path="/businesses/:id" element={<BusinessProfile />} />




        {/* Admin Dashboard Routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<PermissionRoute permission="dashboard.view"><Dashboard /></PermissionRoute>} />
          <Route path="committee" element={<PermissionRoute permission="committee.list"><CommitteeMembers /></PermissionRoute>} />
          <Route path="roles" element={<PermissionRoute permission="roles.list"><Roles /></PermissionRoute>} />
          <Route path="users" element={<PermissionRoute permission="members.list"><Users /></PermissionRoute>} />
          <Route path="festivals" element={<PermissionRoute permission="festivals.list"><ContentPage type="festivals" /></PermissionRoute>} />
          <Route path="events" element={<PermissionRoute permission="events.list"><Events /></PermissionRoute>} />
        <Route path="event-registrations" element={<PermissionRoute permission="events.list"><EventRegistrations /></PermissionRoute>} />

          <Route path="gallery" element={<PermissionRoute permission="gallery.list"><ContentPage type="gallery" /></PermissionRoute>} />
          {/* <Route path="banners" element={<PermissionRoute permission="banners.list"><ContentPage type="banners" /></PermissionRoute>} /> */}
          <Route path="matrimonies" element={<PermissionRoute permission="matrimonies.list"><ContentPage type="matrimonies" /></PermissionRoute>} />
          <Route path="businesses" element={<PermissionRoute permission="businesses.list"><Businesses /></PermissionRoute>} />
          <Route path="students" element={<PermissionRoute permission="students.list"><Students /></PermissionRoute>} />
          <Route path="donations" element={<PermissionRoute permission="donations.list"><Donations /></PermissionRoute>} />
          <Route path="expenses" element={<PermissionRoute permission="expenses.list"><Expenses /></PermissionRoute>} />
          <Route path="posts" element={<PermissionRoute permission="posts.list"><Posts /></PermissionRoute>} />
          <Route path="news" element={<PermissionRoute permission="news.list"><News /></PermissionRoute>} />

          <Route path="contact-inquiries" element={<PermissionRoute permission="contact-inquiries.list"><ContentPage type="inquiries" /></PermissionRoute>} />
          <Route path="feedback" element={<PermissionRoute permission="feedback.list"><ContentPage type="feedback" /></PermissionRoute>} />
          <Route path="birthday" element={<PermissionRoute permission="birthday.list"><ContentPage type="birthday" /></PermissionRoute>} />
          <Route path="job-vacancy" element={<PermissionRoute permission="job-vacancy.list"><ContentPage type="job-vacancy" /></PermissionRoute>} />
          <Route path="bank-details" element={<PermissionRoute permission="bank-details.list"><ContentPage type="bank-details" /></PermissionRoute>} />

          <Route path="masters/:type" element={<MasterRoute />} />
          <Route path="settings" element={<PermissionRoute permission="settings.edit"><Settings /></PermissionRoute>} />


        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </NotificationProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}

function MasterRoute() {
  const { type } = useParams()
  const permission = `${type === 'business' ? 'businesses' : type}.list`
  return <PermissionRoute permission={permission}><MasterPage type={type} /></PermissionRoute>
}

function PermissionRoute({ permission, children }) {
  const { user } = useContext(AuthContext)

  if (!hasPermission(user, permission)) {
    return (
      <div className="rounded-2xl border border-error-border bg-error-bg p-6 text-sm text-error-text">
        You do not have permission to access this page.
      </div>
    )
  }

  return children
}
