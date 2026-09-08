import React, { useEffect, useRef, useState, useLayoutEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'

const MAX_VISIBLE_TABS = 8

export default function TabbedPage({ title, tabs, storageKey }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabRefs = useRef({})
  const [maxWidth, setMaxWidth] = useState(null)

  const urlTab = searchParams.get('tab')
  const activeTab = (urlTab && tabs.some(t => t.id === urlTab)) ? urlTab : (tabs[0]?.id || '')

  // Update URL when tab changes smoothly
  const handleTabChange = (tabId) => {
    if (tabId === activeTab) return
    setSearchParams({ tab: tabId }, { replace: true })
  }

  // Ensure initial tab param is synced in URL if missing
  useEffect(() => {
    if (!urlTab && activeTab) {
      setSearchParams({ tab: activeTab }, { replace: true })
    }
  }, [urlTab, activeTab, setSearchParams])

  // Compute max-width from first MAX_VISIBLE_TABS tab button widths + gap + padding
  useLayoutEffect(() => {
    if (tabs.length <= MAX_VISIBLE_TABS) {
      setMaxWidth(null)
      return
    }
    let total = 8 // container padding (p-1 = 4px each side)
    for (let i = 0; i < MAX_VISIBLE_TABS; i++) {
      const el = tabRefs.current[tabs[i]?.id]
      if (el) total += el.offsetWidth + 4 // 4px gap-1
    }
    setMaxWidth(total)
  }, [tabs])

  // Tab bar — rendered once at the top
  const tabsJSX = (
    <div
      className="overflow-x-auto tab-scrollbar pb-1"
      style={maxWidth ? { maxWidth: `${maxWidth}px` } : { width: 'fit-content', maxWidth: '100%' }}
    >
      <div className="flex gap-2 w-fit">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          ref={(el) => { tabRefs.current[tab.id] = el }}
          onClick={() => handleTabChange(tab.id)}
          className={`relative flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all duration-200 outline-none whitespace-nowrap flex-shrink-0 border ${
            activeTab === tab.id
              ? 'bg-primary border-primary text-white shadow-sm'
              : 'bg-white border-border text-text-secondary hover:text-text hover:border-primary/30 hover:bg-surface-secondary/50'
          }`}
        >
          {activeTab === tab.id && (
            <motion.div
              layoutId={`active-tab-indicator-${storageKey}`}
              className="absolute inset-0 bg-primary rounded-lg"
              style={{ zIndex: 0 }}
              transition={{ type: 'spring', bounce: 0.2, duration: 0.4 }}
            />
          )}
          <span className="relative z-10 flex items-center gap-2">
            {tab.icon && <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'stroke-[2.5]' : ''}`} />}
            {tab.label}
          </span>
        </button>
      ))}
      </div>
    </div>
  )

  return (
    <div className="w-full flex flex-col gap-0 animate-fade-in">
      <div className="w-full relative">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab
          if (!isActive) return null
          return (
            <div
              key={tab.id}
              className="w-full relative"
            >
               {tab.component({ headerLeftContent: tabsJSX })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
