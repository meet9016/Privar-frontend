import React, { useEffect, useRef, useState, useLayoutEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'

const MAX_VISIBLE_TABS = 8

export default function TabbedPage({ title, tabs, storageKey }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const tabRefs = useRef({})
  const [maxWidth, setMaxWidth] = useState(null)

  // Initialize active tab from URL -> localStorage -> first available tab
  const [activeTab, setActiveTab] = useState(() => {
    const urlTab = searchParams.get('tab')
    if (urlTab && tabs.some(t => t.id === urlTab)) return urlTab

    const savedTab = localStorage.getItem(`tabbed_page_${storageKey}`)
    if (savedTab && tabs.some(t => t.id === savedTab)) return savedTab

    return tabs[0]?.id || ''
  })

  // Update URL and storage when tab changes
  const handleTabChange = (tabId) => {
    setActiveTab(tabId)
    setSearchParams({ tab: tabId }, { replace: true })
    localStorage.setItem(`tabbed_page_${storageKey}`, tabId)
  }

  // Sync URL on mount only
  useEffect(() => {
    const urlTab = searchParams.get('tab')
    if (urlTab !== activeTab) {
      setSearchParams({ tab: activeTab }, { replace: true })
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

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
      {/* Content: all tabs mounted, only active visible via CSS */}
      <div className="w-full relative">
        {tabs.map((tab) => {
          const isActive = tab.id === activeTab
          return (
            <div
              key={tab.id}
              style={{
                opacity: isActive ? 1 : 0,
                pointerEvents: isActive ? 'auto' : 'none',
                position: isActive ? 'relative' : 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                transition: 'opacity 0.2s ease',
                visibility: isActive ? 'visible' : 'hidden',
              }}
            >
              {/* Active tab gets the tab bar; inactive gets null (no duplicate bars) */}
              {tab.component({ headerLeftContent: isActive ? tabsJSX : null })}
            </div>
          )
        })}
      </div>
    </div>
  )
}
