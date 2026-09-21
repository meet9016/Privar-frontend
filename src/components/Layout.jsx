import React, { useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout() {
  const location = useLocation()
  const isDocPage = location.pathname === '/admin/documentation'
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)

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
    <div className="min-h-screen flex bg-background text-text overflow-x-hidden font-sans">
      {/* Decorative dynamic ambient background glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary-glow blur-[120px] animate-pulse-slow pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary-glow blur-[120px] animate-pulse-slow pointer-events-none" style={{ animationDelay: '1.5s' }}></div>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar - fixed and styled */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen w-full lg:pl-64 transition-all duration-300">
        <main className="flex-1 overflow-y-auto animate-fade-in flex flex-col">
          <Header onMenuClick={() => setIsSidebarOpen(true)} />
          <div className="flex-1 px-4 sm:px-6 lg:px-8 pt-4 pb-8 max-w-full mx-auto space-y-6 w-full overflow-x-hidden">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}

