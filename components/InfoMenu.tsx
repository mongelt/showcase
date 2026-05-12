'use client'

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMobileState } from '@/lib/responsive'
import { useReducedMotion } from '@/lib/animations'


interface ContentMetadata {
  publication_name: string
  publication_date: string // "January 2024" format
  
  byline_style_text: string // From byline_options table (green label)
  author_name: string // Gray value
  
  link_style_text: string // From link_options table (green label)
  source_link: string // URL (gray value)
}

const DEFAULT_FAVICON_DATA_URI =
  'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16">' +
  '<rect width="16" height="16" fill="%239ca3af"/>' +
  '<path d="M3 3h10v10H3z" fill="%231a1d23"/>' +
  '<path d="M6 6h4v4H6z" fill="%239ca3af"/></svg>'

interface InfoMenuProps {
  metadata: ContentMetadata | null
  isVisible: boolean
  profileHeight?: number // Profile height for vertical centering calculation (Step 6.4 Stage 2)
  stickyTitle?: string | null
  stickySubtitle?: string | null
  showStickyTitle?: boolean
  showStickySubtitle?: boolean
}

export default function InfoMenu({
  metadata,
  isVisible,
  profileHeight = 0,
  stickyTitle = null,
  stickySubtitle = null,
  showStickyTitle = false,
  showStickySubtitle = false
}: InfoMenuProps) {
  const { isMobile } = useMobileState()
  const reduced = useReducedMotion()
  const [faviconSrc, setFaviconSrc] = useState<string | null>(null)
  const [faviconStage, setFaviconStage] = useState<0 | 1 | 2>(0)

  const sourceLink = metadata?.source_link || ''

  const mainDomain = useMemo(() => {
    if (!sourceLink) return ''
    try {
      const url = new URL(sourceLink)
      const hostname = url.hostname || sourceLink
      if (hostname === 'localhost' || /^\d{1,3}(\.\d{1,3}){3}$/.test(hostname)) {
        return hostname
      }
      const parts = hostname.split('.').filter(Boolean)
      if (parts.length <= 2) return hostname
      return parts.slice(-2).join('.')
    } catch {
      return sourceLink
    }
  }, [sourceLink])

  const directFaviconUrl = useMemo(() => {
    if (!mainDomain) return ''
    return `https://${mainDomain}/favicon.ico`
  }, [mainDomain])

  const serviceFaviconUrl = useMemo(() => {
    if (!mainDomain) return ''
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(mainDomain)}&sz=64`
  }, [mainDomain])

  useEffect(() => {
    if (!isVisible) return
    if (!sourceLink || !mainDomain) {
      setFaviconSrc(null)
      setFaviconStage(0)
      return
    }
    setFaviconStage(0)
    setFaviconSrc(directFaviconUrl)
  }, [isVisible, sourceLink, mainDomain, directFaviconUrl])

  if (!isVisible || !metadata) return null

  const handleFaviconError = () => {
    if (!mainDomain) return
    if (faviconStage === 0) {
      setFaviconStage(1)
      setFaviconSrc(serviceFaviconUrl)
      return
    }
    if (faviconStage === 1) {
      setFaviconStage(2)
      setFaviconSrc(DEFAULT_FAVICON_DATA_URI)
    }
  }

  // Desktop positioning: sidebar layout, positioned directly below menu bar
  // Top = profile height + menu bar height (no gap)
  const desktopTop = profileHeight > 0
    ? `${profileHeight + 64}px` // profileHeight + menu bar height (64px)
    : 'calc(var(--spacing-profile-collapsed) + var(--spacing-menu-bar-height))' // Fallback: 200px + 64px

  // Mobile positioning: relative, 10px below collapsed menu, full width with 15px margins
  const mobileStyles = isMobile ? {
    position: 'relative' as const,
    top: 'auto',    // Override CSS class's top: 264px (which offsets relative elements down)
    left: 'auto',
    bottom: 'auto',
    width: '100%',
    paddingLeft: '15px',
    paddingRight: '15px',
    paddingTop: '10px',
    paddingBottom: '15px',
    marginTop: '-10px',
    marginBottom: '0',
    borderBottom: '1px solid #1f2937' // border-gray-800
  } : {
    position: 'fixed' as const,
    left: '0',
    top: desktopTop,
    bottom: 'var(--spacing-bottom-nav-height)',
    width: 'var(--info-menu-width)',
    zIndex: 20
  }

  return (
    <motion.div
      className="info-menu"
      style={mobileStyles}
      initial={reduced ? { opacity: 0 } : isMobile ? { opacity: 0 } : { x: '-100%', opacity: 0 }}
      animate={reduced ? { opacity: 1 } : isMobile ? { opacity: 1 } : { x: 0, opacity: 1 }}
      exit={reduced ? { opacity: 0 } : isMobile ? { opacity: 0 } : { x: '-100%', opacity: 0 }}
      transition={{ duration: reduced ? 0 : 0.35, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Sticky title/subtitle only shown in desktop (not mobile) */}
      <AnimatePresence>
        {!isMobile && (showStickyTitle || showStickySubtitle) && (
          <motion.div
            key="sticky-title"
            className="info-menu-sticky-title"
            initial={{ y: reduced ? 0 : -16, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: reduced ? 0 : -16, opacity: 0 }}
            transition={{ duration: reduced ? 0 : 0.25, ease: [0.4, 0, 0.2, 1] }}
          >
            {showStickyTitle && stickyTitle && (
              <div className="info-menu-sticky-title-text">
                {stickyTitle}
              </div>
            )}
            {showStickySubtitle && stickySubtitle && (
              <div className="info-menu-sticky-subtitle">
                {stickySubtitle}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
      
      {(metadata.publication_name || metadata.publication_date) && (
        <div className="info-menu-line">
          {metadata.publication_name && (
            <>
              <span className="info-menu-label">{metadata.publication_name}</span>
              {metadata.publication_date && (
                <span className="info-menu-value"> / </span>
              )}
            </>
          )}
          {metadata.publication_date && (
            <span className="info-menu-value">{metadata.publication_date}</span>
          )}
        </div>
      )}
      
      {metadata.byline_style_text && (
        <div className="info-menu-line">
          <span className="info-menu-label">{metadata.byline_style_text}</span>
          {metadata.author_name && (
            <span className="info-menu-value">: </span>
          )}
          {metadata.author_name && (
            <span className="info-menu-value">{metadata.author_name}</span>
          )}
        </div>
      )}
      
      {metadata.link_style_text && (
        <div className="info-menu-line">
          <span className="info-menu-label">{metadata.link_style_text}</span>
          {metadata.source_link && (
            <span className="info-menu-value">: </span>
          )}
          {metadata.source_link ? (
            <a 
              href={metadata.source_link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="info-menu-link"
              title={metadata.source_link}
            >
              {faviconSrc && (
                <img
                  src={faviconSrc}
                  alt=""
                  className="info-menu-favicon"
                  onError={handleFaviconError}
                />
              )}
              <span>{mainDomain || metadata.source_link}</span>
            </a>
          ) : (
            <span className="info-menu-value">—</span>
          )}
        </div>
      )}
    </motion.div>
  )
}

