import {
  Briefcase,
  CalendarDays,
  FileText,
  Home,
  Image,
  Mail,
  Megaphone,
  Settings,
  ShieldCheck,
  UserCog,
  Users,
  GraduationCap,
  HeartHandshake,
  IndianRupee
} from 'lucide-react'

export const coreNavigation = [
  { to: '/admin', label: 'Dashboard', icon: Home, end: true, title: 'System Overview', permission: 'dashboard.view' },
  { to: '/admin/committee', label: 'Committee Members', icon: UserCog, title: 'Committee Members', permission: 'committee.list' },
  { to: '/admin/roles', label: 'Roles', icon: ShieldCheck, title: 'Roles & Permissions', permission: 'roles.list' },
  { to: '/admin/users', label: 'Members', icon: Users, title: 'Member Directory', permission: 'members.list' },
  { to: '/admin/festivals', label: 'Festivals', icon: CalendarDays, title: 'Festivals', permission: 'festivals.list' },
  { to: '/admin/events', label: 'Events', icon: CalendarDays, title: 'Events', permission: 'events.list' },
  { to: '/admin/gallery', label: 'Gallery', icon: Image, title: 'Gallery', permission: 'gallery.list' },
  // { to: '/admin/banners', label: 'Banners', icon: Megaphone, title: 'Banner Manager', permission: 'banners.list' },
  { to: '/admin/matrimonies', label: 'Matrimonies', icon: Users, title: 'Matrimony Profiles', permission: 'matrimonies.list' },
  { to: '/admin/businesses', label: 'Businesses', icon: Briefcase, title: 'Business Index', permission: 'businesses.list' },
  { to: '/admin/students', label: 'Students', icon: GraduationCap, title: 'Students', permission: 'students.list' },
  { to: '/admin/donations', label: 'Donations', icon: HeartHandshake, title: 'Donations', permission: 'donations.list' },
  { to: '/admin/expenses', label: 'Expenses', icon: IndianRupee, title: 'Expenses', permission: 'expenses.list' },
  { to: '/admin/posts', label: 'Posts', icon: FileText, title: 'Post Moderator', permission: 'posts.list' },
  { to: '/admin/news', label: 'News', icon: FileText, title: 'News Moderator', permission: 'news.list' },

  // { to: '/admin/contact-inquiries', label: 'Contact Inquiries', icon: Mail, title: 'Contact Inquiries', permission: 'contact-inquiries.list' },
  { to: '/admin/feedback', label: 'Feedback', icon: FileText, title: 'Feedback', permission: 'feedback.list' },
  { to: '/admin/birthday', label: 'Birthdays', icon: CalendarDays, title: 'Member Birthdays', permission: 'birthday.list' },
  { to: '/admin/job-vacancy', label: 'Job Vacancies', icon: Briefcase, title: 'Job Vacancies', permission: 'job-vacancy.list' }
]

export const masterNavigation = [
  { type: 'business', label: 'Business', permission: 'businesses.list' },
  { type: 'bank-details', label: 'Bank Details', permission: 'bank-details.list', to: '/admin/bank-details' },
  { type: 'country', label: 'Country', permission: 'country.list' },
  { type: 'state', label: 'State', permission: 'state.list' },
  { type: 'district', label: 'District', permission: 'district.list' },
  { type: 'taluka', label: 'Taluka', permission: 'taluka.list' },
  { type: 'city', label: 'City', permission: 'city.list' },
  { type: 'village', label: 'Village', permission: 'village.list' },
  { type: 'area', label: 'Area', permission: 'area.list' },
  { type: 'blood-group', label: 'Blood Group', permission: 'blood-group.list' },
  { type: 'event-category', label: 'Event Category', permission: 'event-category.list' },
  { type: 'gallery-category', label: 'Gallery Category', permission: 'gallery-category.list' },
  { type: 'expense-category', label: 'Expense Category', permission: 'expense-category.list' }
]

export const configurationNavigation = [
  { to: '/admin/settings', label: 'Theme Config', icon: Settings, title: 'Theme Customizer', permission: 'settings.edit' }
]

export const routeTitles = [
  ...coreNavigation,
  ...configurationNavigation
].reduce((acc, item) => ({ ...acc, [item.to]: item.title }), {})

export const masterLabels = masterNavigation.reduce(
  (acc, item) => ({ ...acc, [item.type]: item.label }),
  {}
)
