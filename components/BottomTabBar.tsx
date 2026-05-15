'use client'

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { tapScale, useReducedMotion } from '@/lib/animations'
import { useMobileState } from '@/lib/responsive'
import { DownloadCard } from '@/components/dynamic-menu/cards/DownloadCard'
import { CollectionDownloadCard } from '@/components/dynamic-menu/cards/CollectionDownloadCard'
import { track } from '@/lib/umami'

type Collection = {
  slug: string
  name: string
}

type ContentTab = {
  id: string
  title: string
}


type BottomTabBarProps = {
  activeTab: string
  collections: Collection[]
  contentTabs: ContentTab[]
  onTabChange: (tab: string) => void
  currentContentTitle?: string | null
  currentContentType?: string | null
  currentContentId?: string | null
  currentContentDownloadEnabled?: boolean | null
  currentContentDesc?: string | null
  currentContentYear?: number | null
  currentContentThumbnail?: string | null
  currentCollectionName?: string | null
  currentCollectionSlug?: string | null
  currentCollectionDesc?: string | null
  currentCollectionThumbnails?: string[]
  loadingTabs?: string[]
  resumeAvailable?: boolean
  onDownload?: (target: 'resume' | 'content' | 'collection', includeResume?: boolean) => Promise<void>
  isMenuExpanded?: boolean
  isProfileExpanded?: boolean
}

export default function BottomTabBar({ 
  activeTab, 
  collections, 
  contentTabs,
  onTabChange,
  currentContentTitle = null,
  currentContentType = null,
  currentContentId = null,
  currentContentDownloadEnabled = null,
  currentContentDesc = null,
  currentContentYear = null,
  currentContentThumbnail = null,
  currentCollectionName = null,
  currentCollectionSlug = null,
  currentCollectionDesc = null,
  currentCollectionThumbnails = [],
  loadingTabs = [],
  resumeAvailable = false,
  onDownload,
  isMenuExpanded = false,
  isProfileExpanded = false
}: BottomTabBarProps) {
  const { isMobile } = useMobileState()
  const reduced = useReducedMotion()
  const tabs = [
    { id: 'portfolio', label: 'PORTFOLIO' },
    { id: 'resume', label: 'RESUME' }
  ]
  const isTabLoading = (id: string) => loadingTabs.includes(id)

  const downloadBtnRef = useRef<HTMLButtonElement | null>(null)
  const downloadMenuRef = useRef<HTMLDivElement | null>(null)
  const shareBtnRef = useRef<HTMLButtonElement | null>(null)
  const shareMenuRef = useRef<HTMLDivElement | null>(null)
  const [downloadsOpen, setDownloadsOpen] = useState<boolean>(false)
  const [shareOpen, setShareOpen] = useState<boolean>(false)
  const [shareCopiedKey, setShareCopiedKey] = useState<string | null>(null)
  const [downloadStatus, setDownloadStatus] = useState<'idle' | 'loading' | 'error'>('idle')

  useEffect(() => {
    setDownloadsOpen(false)
    setShareOpen(false)
    setShareCopiedKey(null)
    setDownloadStatus('idle')
  }, [activeTab])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      const downloadBtn = downloadBtnRef.current
      const downloadMenu = downloadMenuRef.current
      const shareBtn = shareBtnRef.current
      const shareMenu = shareMenuRef.current
      const target = e.target as Node
      if (downloadBtn?.contains(target) || downloadMenu?.contains(target)) return
      if (shareBtn?.contains(target) || shareMenu?.contains(target)) return
      setDownloadsOpen(false)
      setShareOpen(false)
      setShareCopiedKey(null)
    }
    if (downloadsOpen || shareOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [downloadsOpen, shareOpen])

  const isContentContext =
    activeTab === 'portfolio' ||
    isContentTab(activeTab, contentTabs) ||
    isCollectionTab(activeTab, collections)
  const normalizedType = currentContentType ? currentContentType.toLowerCase() : null
  const allowContentDownload =
    normalizedType !== 'audio' && normalizedType !== 'video'
  const showContentDownload =
    isContentContext &&
    currentContentTitle &&
    allowContentDownload &&
    currentContentDownloadEnabled !== false
  const showCollectionDownload = !!(currentCollectionName && currentCollectionSlug)

  const shareMenuRows = [
    {
      key: 'portfolio',
      label: 'Copy link to Portfolio',
      visible: true,
      value: getShareLink('portfolio')
    }
  ]
  if (isContentContext && currentContentTitle && !(isMenuExpanded && activeTab === 'portfolio')) {
    shareMenuRows.push({
      key: 'content',
      label: `Copy link to ${currentContentTitle}`,
      visible: true,
      value: getShareLink('content')
    })
  }
  if (currentCollectionName && currentCollectionSlug) {
    shareMenuRows.push({
      key: 'collection',
      label: `Copy link to ${currentCollectionName}`,
      visible: true,
      value: getShareLink('collection')
    })
  }

  function isContentTab(activeTab: string, contents: ContentTab[]): boolean {
    const mainTabs = ['portfolio', 'resume']
    if (mainTabs.includes(activeTab)) return false
    return contents.some(c => c.id === activeTab)
  }

  function isCollectionTab(activeTab: string, cols: Collection[]): boolean {
    const mainTabs = ['portfolio', 'resume']
    if (mainTabs.includes(activeTab)) return false
    return cols.some(c => c.slug === activeTab)
  }

  async function handleDownload(target: 'resume' | 'content' | 'collection', includeResume = false) {
    if (downloadStatus === 'loading') return
    if (target === 'resume') {
      track('download_resume')
    } else if (target === 'content') {
      track('download_content', { title: currentContentTitle, id: currentContentId, type: currentContentType, with_resume: includeResume })
    } else if (target === 'collection') {
      track('download_collection', { title: currentCollectionName, slug: currentCollectionSlug, with_resume: includeResume })
    }
    try {
      setDownloadStatus('loading')
      if (onDownload) {
        await onDownload(target, includeResume)
      } else {
        await new Promise(res => setTimeout(res, 300))
      }
      setDownloadStatus('idle')
      setDownloadsOpen(false)
    } catch (err) {
      console.error('Download failed', err)
      setDownloadStatus('error')
    }
  }

  function getShareLink(target: 'portfolio' | 'content' | 'collection') {
    if (typeof window === 'undefined') return ''
    const origin = window.location.origin
    if (target === 'portfolio') return origin
    if (target === 'content') {
      const contentId = currentContentId || (isContentTab(activeTab, contentTabs) ? activeTab : null)
      return contentId ? `${origin}/?content=${encodeURIComponent(contentId)}` : origin
    }
    if (target === 'collection') {
      return currentCollectionSlug ? `${origin}/?collection=${encodeURIComponent(currentCollectionSlug)}` : origin
    }
    return origin
  }

  async function handleShareCopy(value: string) {
    if (!value) return
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(value)
      } else {
        const el = document.createElement('textarea')
        el.value = value
        document.body.appendChild(el)
        el.select()
        document.execCommand('copy')
        document.body.removeChild(el)
      }
    } catch (err) {
      console.error('Share copy failed', err)
    }
  }

  return (
    <motion.div
      className="fixed bottom-0 left-0 right-0 h-16 border-t border-border-gray-800 z-50 bg-bg-menu-bar backdrop-saturate-[180%] backdrop-blur-[20px] shadow-[0_-2px_12px_rgba(0,0,0,0.1)]"
      animate={{ y: !isMobile && isProfileExpanded ? 64 : 0 }}
      transition={{ duration: reduced ? 0 : 0.45, ease: [0.4, 0, 0.2, 1] }}
    >
      <div className="relative flex items-center justify-center h-16 px-4">
        <div className={`absolute ${isMobile ? 'left-[9px]' : 'left-[25px]'}`}>
          <div className="relative">
            <button
              ref={downloadBtnRef}
              onClick={() => {
                const next = !downloadsOpen
                setDownloadsOpen(next)
                if (next) track('downloads_menu_open')
              }}
              className={`dl-btn flex items-center gap-[10px] rounded-[5px] cursor-pointer transition-all duration-300 border-none outline-none ${
                isMobile ? 'h-[40px] px-[10px]' : 'h-[45px] px-[15px]'
              } ${
                downloadsOpen ? 'bg-[#1a1818]' : 'bg-[#0b0a0a] hover:bg-[#161414]'
              }`}
            >
              <span className="relative flex flex-col items-center justify-end" style={{ width: 40 }}>
                <svg className="dl-file-back" width="146" height="113" viewBox="0 0 146 113" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0 4C0 1.79086 1.79086 0 4 0H50.3802C51.8285 0 53.2056 0.627965 54.1553 1.72142L64.3303 13.4371C65.2799 14.5306 66.657 15.1585 68.1053 15.1585H141.509C143.718 15.1585 145.509 16.9494 145.509 19.1585V109C145.509 111.209 143.718 113 141.509 113H3.99999C1.79085 113 0 111.209 0 109V4Z" fill="url(#dlFileBackGrad)" />
                  <defs>
                    <linearGradient id="dlFileBackGrad" x1="0" y1="0" x2="72.93" y2="95.4804" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#9B4A4A" /><stop offset="1" stopColor="#6b2a2a" />
                    </linearGradient>
                  </defs>
                </svg>
                <svg className="dl-file-page" width="88" height="99" viewBox="0 0 88 99" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="88" height="99" fill="url(#dlFilePageGrad)" />
                  <defs>
                    <linearGradient id="dlFilePageGrad" x1="0" y1="0" x2="81" y2="160.5" gradientUnits="userSpaceOnUse">
                      <stop stopColor="white" /><stop offset="1" stopColor="#c0b8b5" />
                    </linearGradient>
                  </defs>
                </svg>
                <svg className="dl-file-front" width="160" height="79" viewBox="0 0 160 79" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M0.29306 12.2478C0.133905 9.38186 2.41499 6.97059 5.28537 6.97059H30.419H58.1902C59.5751 6.97059 60.9288 6.55982 62.0802 5.79025L68.977 1.18034C70.1283 0.410771 71.482 0 72.8669 0H77H155.462C157.87 0 159.733 2.1129 159.43 4.50232L150.443 75.5023C150.19 77.5013 148.489 79 146.474 79H7.78403C5.66106 79 3.9079 77.3415 3.79019 75.2218L0.29306 12.2478Z" fill="url(#dlFileFrontGrad)" />
                  <defs>
                    <linearGradient id="dlFileFrontGrad" x1="38.7619" y1="8.71323" x2="66.9106" y2="82.8317" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#c47a7a" /><stop offset="1" stopColor="#6b2a2a" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
              {!isMobile && (
                <span style={{ color: '#e9e3e0', fontSize: 14, fontWeight: 600, letterSpacing: '0.5px', fontFamily: 'var(--font-body, sans-serif)', whiteSpace: 'nowrap' }}>
                  Downloads
                </span>
              )}
            </button>
            <AnimatePresence>
            {downloadsOpen && (
              <motion.div
                ref={downloadMenuRef}
                className="absolute bottom-full mb-2 left-0 border border-border-gray-700 rounded-lg shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] bg-bg-menu-bar"
                style={{ zIndex: 60, width: 326, padding: '12px 13px', display: 'flex', flexDirection: 'column', gap: 8, overflow: 'visible' }}
                initial={{ y: reduced ? 0 : 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: reduced ? 0 : 20, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              >
                {downloadStatus === 'error' && (
                  <p className="font-body text-sm text-red-400 px-1">Download failed — please try again.</p>
                )}
                <div className="flex items-center gap-2">
                  <button
                    disabled={downloadStatus === 'loading'}
                    onClick={() => handleDownload('resume')}
                    className={`flex-1 font-body text-sm font-semibold rounded-md transition-all duration-200 ${
                      downloadStatus === 'loading'
                        ? 'text-text-on-dark-inactive bg-bg-gray-800 cursor-not-allowed'
                        : 'text-text-body bg-bg-card hover:bg-bg-card-alt'
                    }`}
                    style={{ padding: '8px 12px' }}
                  >
                    {downloadStatus === 'loading' ? 'Generating Download…' : 'Download Resume'}
                  </button>
                </div>
                {showContentDownload && (
                  <div style={{ paddingTop: 10 }}>
                    <DownloadCard
                      name={currentContentTitle ?? ''}
                      desc={currentContentDesc ?? undefined}
                      publication={currentContentType ?? undefined}
                      year={currentContentYear ?? undefined}
                      thumbnail={currentContentThumbnail ?? undefined}
                      resumeAvailable={resumeAvailable}
                      onDownload={(incl) => handleDownload('content', incl)}
                    />
                  </div>
                )}
                {showCollectionDownload && (
                  <div style={{ paddingTop: 10 }}>
                    <CollectionDownloadCard
                      name={currentCollectionName ?? ''}
                      desc={currentCollectionDesc ?? undefined}
                      thumbnails={currentCollectionThumbnails}
                      resumeAvailable={resumeAvailable}
                      onDownload={(incl) => handleDownload('collection', incl)}
                    />
                  </div>
                )}
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        </div>

        <div className={`absolute ${isMobile ? 'right-[9px]' : 'right-[25px]'}`}>
          <div className="relative">
            <button
              ref={shareBtnRef}
              onClick={() => setShareOpen(prev => !prev)}
              className={`cl-btn flex items-center gap-[10px] rounded-[5px] cursor-pointer transition-all duration-300 border-none outline-none ${
                isMobile ? 'h-[40px] px-[10px]' : 'h-[45px] px-[15px]'
              } ${
                shareOpen ? 'bg-[#1a1818]' : 'bg-[#0b0a0a] hover:bg-[#161414]'
              }`}
            >
              <span className="relative flex flex-col items-center justify-end" style={{ width: 40 }}>
                <svg className="cl-back" width="80" height="105" viewBox="0 0 80 105" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="26" y="3" width="28" height="19" rx="9" fill="url(#clBoardGrad)" />
                  <ellipse cx="40" cy="12" rx="7" ry="5" fill="#c4b8b5" opacity="0.35" />
                  <rect x="3" y="14" width="74" height="88" rx="4" fill="url(#clBoardGrad)" />
                  <defs>
                    <linearGradient id="clBoardGrad" x1="0" y1="0" x2="60" y2="105" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#9B4A4A" /><stop offset="1" stopColor="#6b2a2a" />
                    </linearGradient>
                  </defs>
                </svg>
                <svg className="cl-sheet" width="62" height="80" viewBox="0 0 62 80" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="0" y="0" width="62" height="80" rx="2" fill="url(#clSheetGrad)" />
                  <line x1="8" y1="18" x2="54" y2="18" stroke="#c8c0bc" strokeWidth="1.5" />
                  <line x1="8" y1="29" x2="54" y2="29" stroke="#c8c0bc" strokeWidth="1.5" />
                  <line x1="8" y1="40" x2="54" y2="40" stroke="#c8c0bc" strokeWidth="1.5" />
                  <line x1="8" y1="51" x2="42" y2="51" stroke="#c8c0bc" strokeWidth="1.5" />
                  <defs>
                    <linearGradient id="clSheetGrad" x1="0" y1="0" x2="55" y2="130" gradientUnits="userSpaceOnUse">
                      <stop stopColor="white" /><stop offset="1" stopColor="#c8c0bc" />
                    </linearGradient>
                  </defs>
                </svg>
                <svg className="cl-clamp" width="52" height="26" viewBox="0 0 52 26" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="0" y="0" width="52" height="26" rx="8" fill="url(#clClampGrad)" />
                  <rect x="7" y="7" width="38" height="12" rx="5" fill="#e9e3e0" opacity="0.22" />
                  <defs>
                    <linearGradient id="clClampGrad" x1="0" y1="0" x2="40" y2="40" gradientUnits="userSpaceOnUse">
                      <stop stopColor="#c47a7a" /><stop offset="1" stopColor="#6b2a2a" />
                    </linearGradient>
                  </defs>
                </svg>
              </span>
              {!isMobile && (
                <span style={{ color: '#e9e3e0', fontSize: 14, fontWeight: 600, letterSpacing: '0.5px', fontFamily: 'var(--font-body, sans-serif)', whiteSpace: 'nowrap', lineHeight: 1 }}>
                  Copy link
                </span>
              )}
            </button>
            <AnimatePresence>
            {shareOpen && (
              <motion.div
                ref={shareMenuRef}
                className="absolute bottom-full mb-2 right-0 w-72 border border-border-gray-700 rounded-lg shadow-[0_10px_15px_-3px_rgba(0,0,0,0.1)] p-3 space-y-2 bg-bg-menu-bar"
                style={{ zIndex: 60 }}
                initial={{ y: reduced ? 0 : 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: reduced ? 0 : 20, opacity: 0 }}
                transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
              >
                {shareMenuRows
                  .filter(row => row.visible)
                  .map(row => (
                    <button
                      key={row.key}
                      onClick={() => {
                        handleShareCopy(row.value)
                        setShareCopiedKey(row.key)
                        setTimeout(() => setShareCopiedKey(null), 5000)
                        if (row.key === 'portfolio') {
                          track('share_copy', { type: 'portfolio' })
                        } else if (row.key === 'content') {
                          track('share_copy', { type: 'content', title: currentContentTitle, id: currentContentId })
                        } else if (row.key === 'collection') {
                          track('share_copy', { type: 'collection', title: currentCollectionName, slug: currentCollectionSlug })
                        }
                      }}
                      className="w-full font-body text-sm font-semibold rounded-md transition-all duration-200 text-text-body bg-bg-card hover:bg-bg-card-alt text-left"
                      style={{ padding: '8px 12px' }}
                    >
                      {shareCopiedKey === row.key ? 'Link copied' : row.label}
                    </button>
                  ))}
              </motion.div>
            )}
            </AnimatePresence>
          </div>
        </div>

        <div
          className={`flex items-center ${isMobile ? 'gap-1' : 'gap-2'} absolute left-1/2 -translate-x-1/2`}
        >
          {tabs.map((tab) => (
            <motion.div
              key={tab.id}
              className="relative"
              whileTap={tapScale}
            >
              <button
                onClick={() => onTabChange(tab.id)}
                className={`
                  tab-hover-btn relative font-ui text-sm font-semibold uppercase
                  transition-colors duration-300
                  ${activeTab === tab.id
                    ? 'tab-hover-btn-active text-text-on-dark'
                    : 'text-text-on-dark-inactive hover:text-text-on-dark-hover hover:opacity-80'
                  }
                `}
                style={{ padding: '8px 24px', letterSpacing: '0.05em' }}
              >
                {tab.label}
                
                {activeTab === tab.id && (
                  <motion.div
                    layoutId="activeTabUnderline"
                    className={`absolute bottom-0 bg-accent-light ${isMobile ? 'left-4 right-4' : 'left-0 right-0'}`}
                    style={{ height: '2px' }}
                    transition={{ 
                      type: 'spring', 
                      stiffness: 300, 
                      damping: 30 
                    }}
                  />
                )}
                {isTabLoading(tab.id) && (
                  <span className="ml-2 inline-block h-3 w-3 border-2 border-white/40 border-t-transparent rounded-full animate-spin align-middle" />
                )}
              </button>
            </motion.div>
          ))}
        </div>

      </div>
    </motion.div>
  )
}
