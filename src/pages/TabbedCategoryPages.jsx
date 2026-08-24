import React, { useMemo, useContext } from 'react'
import TabbedPage from '../components/common/TabbedPage'
import ContentPage from './ContentPage'
import Events from './Events'
import Businesses from './Businesses'
import Students from './Students'
import Donations from './Donations'
import Expenses from './Expenses'
import Posts from './Post'
import News from './News'
import MasterPage from './MasterPage'
import { AuthContext } from '../context/AuthContext'
import { hasPermission } from '../lib/permissions'
import {
  activityNavigation,
  servicesNavigation,
  mediaNavigation,
  engagementNavigation,
  masterNavigation
} from '../config/navigation'
import { Database } from 'lucide-react'

export const ActivitiesPage = () => {
  const { user } = useContext(AuthContext)
  const tabs = useMemo(() => [
    { id: 'gallery', label: 'Gallery', icon: activityNavigation.find(n => n.to?.includes('gallery'))?.icon, permission: 'gallery.list', component: (props) => <ContentPage type="gallery" {...props} /> },
    { id: 'birthday', label: 'Birthdays', icon: activityNavigation.find(n => n.to?.includes('birthday'))?.icon, permission: 'birthday.list', component: (props) => <ContentPage type="birthday" {...props} /> },
    { id: 'job-vacancy', label: 'Job Vacancies', icon: activityNavigation.find(n => n.to?.includes('job-vacancy'))?.icon, permission: 'job-vacancy.list', component: (props) => <ContentPage type="job-vacancy" {...props} /> },
    { id: 'events', label: 'Events', icon: activityNavigation.find(n => n.to?.includes('events'))?.icon, permission: 'events.list', component: (props) => <Events {...props} /> }
  ].filter(t => hasPermission(user, t.permission)), [user])

  return tabs.length > 0 ? <TabbedPage title="Activities" tabs={tabs} storageKey="activities" /> : null
}

export const ServicesPage = () => {
  const { user } = useContext(AuthContext)
  const tabs = useMemo(() => [
    { id: 'businesses', label: 'Businesses', icon: servicesNavigation.find(n => n.to?.includes('businesses'))?.icon, permission: 'businesses.list', component: (props) => <Businesses {...props} /> },
    { id: 'students', label: 'Students', icon: servicesNavigation.find(n => n.to?.includes('students'))?.icon, permission: 'students.list', component: (props) => <Students {...props} /> },
    { id: 'matrimonies', label: 'Matrimonies', icon: servicesNavigation.find(n => n.to?.includes('matrimonies'))?.icon, permission: 'matrimonies.list', component: (props) => <ContentPage type="matrimonies" {...props} /> }
  ].filter(t => hasPermission(user, t.permission)), [user])

  return tabs.length > 0 ? <TabbedPage title="Services" tabs={tabs} storageKey="services" /> : null
}

export const MediaPage = () => {
  const { user } = useContext(AuthContext)
  const tabs = useMemo(() => [
    { id: 'posts', label: 'Posts', icon: mediaNavigation.find(n => n.to?.includes('posts'))?.icon, permission: 'posts.list', component: (props) => <Posts {...props} /> },
    { id: 'news', label: 'News', icon: mediaNavigation.find(n => n.to?.includes('news'))?.icon, permission: 'news.list', component: (props) => <News {...props} /> },
    { id: 'feedback', label: 'Feedback', icon: mediaNavigation.find(n => n.to?.includes('feedback'))?.icon, permission: 'feedback.list', component: (props) => <ContentPage type="feedback" {...props} /> }
  ].filter(t => hasPermission(user, t.permission)), [user])

  return tabs.length > 0 ? <TabbedPage title="Media & Content" tabs={tabs} storageKey="media" /> : null
}

export const EngagementsPage = () => {
  const { user } = useContext(AuthContext)
  const tabs = useMemo(() => [
    { id: 'expenses', label: 'Expenses', icon: engagementNavigation.find(n => n.to?.includes('expenses'))?.icon, permission: 'expenses.list', component: (props) => <Expenses {...props} /> },
    { id: 'donations', label: 'Donations', icon: engagementNavigation.find(n => n.to?.includes('donations'))?.icon, permission: 'donations.list', component: (props) => <Donations {...props} /> }
  ].filter(t => hasPermission(user, t.permission)), [user])

  return tabs.length > 0 ? <TabbedPage title="Engagements" tabs={tabs} storageKey="engagements" /> : null
}

export const MastersPage = () => {
  const { user } = useContext(AuthContext)
  const tabs = useMemo(() => masterNavigation.map(m => ({
    id: m.type,
    label: m.label,
    icon: Database,
    permission: m.permission,
    component: (props) => m.type === 'bank-details' ? <ContentPage type="bank-details" {...props} /> : <MasterPage type={m.type} {...props} />
  })).filter(t => hasPermission(user, t.permission)), [user])

  return tabs.length > 0 ? <TabbedPage title="Masters" tabs={tabs} storageKey="masters" /> : null
}
