import React from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'

export default function Layout() {
  return (
    <div className="min-h-screen flex bg-background text-text overflow-x-hidden font-sans">
      {/* Decorative dynamic ambient background glows */}
      <div className="fixed top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary-glow blur-[120px] animate-pulse-slow pointer-events-none"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-primary-glow blur-[120px] animate-pulse-slow pointer-events-none" style={{ animationDelay: '1.5s' }}></div>

      {/* Sidebar - fixed and styled */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen pl-64 transition-all duration-300">
        <Header />
        <main className="flex-1 px-8 py-4 overflow-y-auto animate-fade-in">
          <div className="max-w-full mx-auto space-y-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
