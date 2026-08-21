import React from 'react'
import { Outlet } from 'react-router-dom'
import WebHeader from './WebHeader'
import WebFooter from './WebFooter'
import { useWebTheme } from '../../hooks/useWebTheme'

export default function WebLayout() {
  useWebTheme()

  return (
    <div className="min-h-screen bg-white flex flex-col justify-between w-full">
      <WebHeader />
      <main className="flex-1 w-full animate-fade-in">
        <Outlet />
      </main>
      <WebFooter />
    </div>
  )
}
