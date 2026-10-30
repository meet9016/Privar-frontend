import React from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout() {
  const location = useLocation()
  const [isSidebarOpen, setIsSidebarOpen] = React.useState(false)
  const isDocPage = location.pathname === '/admin/documentation'
  const isChatPage = location.pathname.startsWith('/admin/chat')

  // Close sidebar on route change on mobile
  React.useEffect(() => {
    setIsSidebarOpen(false)
  }, [location.pathname, location.search])

  if (isDocPage) {
    return (
      <div className="min-h-screen bg-background text-text overflow-hidden font-sans relative flex flex-col justify-center items-center">
        <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary-glow blur-[120px] animate-pulse-slow pointer-events-none"></div>
        <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary-glow blur-[120px] animate-pulse-slow pointer-events-none" style={{ animationDelay: '1.5s' }}></div>
        <div className="w-full h-screen p-4 sm:p-5 lg:p-6 flex flex-col overflow-hidden max-w-[2300px] mx-auto">
          <Outlet />
        </div>
      </div>
    )
  }

  return (
    <div className="h-screen flex bg-background text-text overflow-hidden font-sans">
      {/* Decorative dynamic ambient background glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary-glow blur-[120px] animate-pulse-slow pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary-glow blur-[120px] animate-pulse-slow pointer-events-none" style={{ animationDelay: '1.5s' }}></div>

      {/* Mobile Sidebar Overlay Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden backdrop-blur-xs transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar - fixed on desktop, slide drawer on mobile */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen lg:pl-64 transition-all duration-300 overflow-hidden w-full">
        {/* Header remains fixed at the top */}
        <Header onToggleSidebar={() => setIsSidebarOpen(prev => !prev)} />
        
        {/* Only non-chat page content area scrolls; chat fits 100% full height */}
        <main className={`flex-1 flex flex-col animate-fade-in ${isChatPage ? 'overflow-hidden min-h-0' : 'overflow-y-auto'}`}>
          <div className={`flex-1 max-w-full w-full mx-auto ${
            isChatPage 
              ? 'p-2 sm:p-4 min-h-0 flex flex-col overflow-hidden h-full' 
              : 'px-3 sm:px-6 lg:px-8 pt-4 pb-8 space-y-4 sm:space-y-6'
          }`}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

