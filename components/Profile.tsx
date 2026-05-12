'use client'

import { useState, useEffect, useLayoutEffect, useRef, forwardRef, useImperativeHandle, useMemo, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import BlockNoteRenderer from '@/components/BlockNoteRendererDynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { useReducedMotion } from '@/lib/animations'
import { useMobileState } from '@/lib/responsive'
import { BOTTOM_NAV_HEIGHT_PX } from '@/lib/constants'
import { ProfilePlanes, type ProfileNavCard, type ProfileResumeCard } from '@/components/ProfilePlanes'
import Link from 'next/link'

type ProfileData = {
  full_name: string | null
  location: string | null
  job_title_1: string | null
  job_title_2: string | null
  job_title_3: string | null
  job_title_4: string | null
  short_bio: any
  full_bio: any
  full_bio_image_sizes?: Record<string, { width?: number; height?: number }>
  email: string | null
  phone: string | null
  linkedin: string | null
  show_email: boolean
  show_phone: boolean
  show_social_media: boolean
  skills: string[] | null
  education: string | null
  jhu_entry_id: string | null
  collapsed_profile_height: number | null
  portfolio_plane_cards: Array<{ type: string; id: string }> | null
  resume_plane_cards: string[] | null
}

interface ProfileProps {
  onHeightChange?: (height: number) => void
  onOpenCollection?: (slug: string, name: string) => void
  condensedMode?: boolean
  initialExpanded?: boolean
  onExpand?: () => void
  onExpandedChange?: (expanded: boolean) => void
  onSwitchToPortfolio?: () => void
  onSwitchToResume?: (entryId?: string) => void
  onCardSelect?: (id: string, type: 'category' | 'subcategory' | 'collection') => void
}

export interface ProfileRef {
  collapse: () => void
}

// Helper function to check if data is in BlockNote format (array of PartialBlock)
function isBlockNoteFormat(data: any): boolean {
  return Array.isArray(data) && data.length > 0 && data.every((block: any) => block && typeof block === 'object' && 'id' in block && 'type' in block)
}

// Simple renderer for short bio that pre-renders content immediately to avoid loading delay
function ShortBioRenderer({ data }: { data: any }) {
  // Memoize the check to prevent switching between renderers
  const shouldUseSimpleRender = useMemo(() => {
    if (!data) return false
    if (isBlockNoteFormat(data)) {
      return data.every((block: any) => {
        return block && block.type === 'paragraph' && block.content && Array.isArray(block.content)
      })
    }
    return false
  }, [data])
  
  // Memoize the rendered paragraphs to prevent re-rendering
  const simpleContent = useMemo(() => {
    if (!shouldUseSimpleRender || !data) return null
    const paragraphs = data
      .map((block: any, index: number) => {
        if (block.type === 'paragraph' && block.content && Array.isArray(block.content)) {
          const textContent = block.content
            .map((item: any) => (item.type === 'text' ? item.text || '' : ''))
            .join('')
          const htmlText = textContent.replace(/&nbsp;/g, ' ').trim()
          if (!htmlText) return null
          return <p key={index} dangerouslySetInnerHTML={{ __html: htmlText }} />
        }
        return null
      })
      .filter(Boolean)
    return paragraphs.length > 0 ? paragraphs : null
  }, [shouldUseSimpleRender, data])
  
  // For simple paragraph-only content, render directly without BlockNote renderer
  // This eliminates any loading delay or layout shift
  if (simpleContent) {
    return <div>{simpleContent}</div>
  }
  
  if (isBlockNoteFormat(data)) {
    return <BlockNoteRenderer data={data} />
  }

  return null
}

const Profile = forwardRef<ProfileRef, ProfileProps>(({
  onHeightChange,
  onOpenCollection,
  condensedMode = false,
  initialExpanded = true,
  onExpand,
  onExpandedChange,
  onSwitchToPortfolio,
  onSwitchToResume,
  onCardSelect,
}, ref) => {
  const [isExpanded, setIsExpanded] = useState(initialExpanded)
  const [profile, setProfile] = useState<ProfileData | null>(null)
  const [headerHovered, setHeaderHovered] = useState(false)
  const [portfolioCardData, setPortfolioCardData] = useState<ProfileNavCard[]>([])
  const [resumeCardData, setResumeCardData] = useState<ProfileResumeCard[]>([])
  const supabase = createClient()
  const headerRef = useRef<HTMLElement | null>(null)
  const resizeDebounceTimerRef = useRef<NodeJS.Timeout | null>(null)
  const { isMobile } = useMobileState()
  const reduced = useReducedMotion()
  const condensedMeasureRef = useRef<HTMLDivElement>(null)
  const [condensedDesktopHeight, setCondensedDesktopHeight] = useState(80)
  const [isAnimatingOut, setIsAnimatingOut] = useState(false)
  const [animatingOutDestination, setAnimatingOutDestination] = useState<'portfolio' | 'resume' | null>(null)
  const [expandedHeight, setExpandedHeight] = useState(() =>
    typeof window !== 'undefined' ? window.innerHeight * 0.45 - 20 : 400
  )

  // Keep condensedDesktopHeight in sync with the live measurement div via ResizeObserver.
  // The measurement div always renders the condensed layout (name + py-4 padding) invisibly,
  // so this value is accurate across all font sizes and window widths.
  useLayoutEffect(() => {
    if (isMobile || !condensedMeasureRef.current) return
    const el = condensedMeasureRef.current
    const update = () => {
      const h = el.getBoundingClientRect().height
      if (h > 0) setCondensedDesktopHeight(h)
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [isMobile])

  // Keep expandedHeight in sync with viewport height
  useLayoutEffect(() => {
    if (isMobile) return
    const update = () => setExpandedHeight(window.innerHeight * 0.45 - 20)
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [isMobile])

  // Animated collapse — fades out planes and bio, shrinks upper zone to collapsed height, then unmounts
  const triggerCollapse = useCallback((afterCollapse?: () => void, destination?: 'portfolio' | 'resume') => {
    if (isMobile || !isExpanded) {
      setIsExpanded(false)
      onExpandedChange?.(false)
      afterCollapse?.()
      return
    }
    // Fire immediately so BottomTabBar starts sliding up in sync with the overlay animation
    onExpandedChange?.(false)
    setIsAnimatingOut(true)
    if (destination) setAnimatingOutDestination(destination)
    setTimeout(() => {
      setIsAnimatingOut(false)
      setAnimatingOutDestination(null)
      setIsExpanded(false)
      afterCollapse?.()
    }, reduced ? 0 : 500)
  }, [isMobile, isExpanded, reduced, onExpandedChange])

  const handleExpand = useCallback(() => {
    onExpandedChange?.(true)
    if (onExpand) onExpand()
    else setIsExpanded(true)
  }, [onExpand, onExpandedChange])

  // Expose collapse method via ref
  useImperativeHandle(ref, () => ({
    collapse: () => triggerCollapse()
  }), [triggerCollapse])

  useEffect(() => {
    loadProfile().then(fetchPlaneCardData)
  }, [])

  // While profile data is still loading, report the skeleton height so consumers
  // (e.g. PortfolioContent's loading div) can position themselves correctly.
  useEffect(() => {
    if (profile) return
    onHeightChange?.(condensedDesktopHeight)
  }, [profile, condensedDesktopHeight, onHeightChange])

  useEffect(() => {
    if (!onHeightChange) return
    if (!profile) return // Don't measure if profile hasn't loaded yet

    const element = headerRef.current
    if (!element) {
      return
    }

    const updateHeight = () => {
      const rect = element.getBoundingClientRect()
      const height = rect.height
      onHeightChange(height)
    }

    const timeoutId = setTimeout(() => {
      updateHeight()
    }, 0)

    // Determine if we're transitioning to condensed mode
    const isCondensed = condensedMode && !isExpanded
    // Use shorter debounce (0ms) when transitioning to condensed for immediate menu bar positioning
    // Use normal debounce (100ms) for other transitions to prevent rapid re-renders
    const debounceDelay = isCondensed ? 0 : 100

    const resizeObserver = new ResizeObserver(() => {
      // Debounce ResizeObserver callbacks to prevent rapid re-renders
      if (resizeDebounceTimerRef.current) {
        clearTimeout(resizeDebounceTimerRef.current)
      }
      resizeDebounceTimerRef.current = setTimeout(() => {
        updateHeight()
        resizeDebounceTimerRef.current = null
      }, debounceDelay)
    })

    resizeObserver.observe(element)

    // When condensedMode changes, trigger immediate height update after a brief delay
    // This ensures menu bar position updates quickly when transitioning to condensed
    // The delay accounts for the CSS transition starting (requestAnimationFrame ensures DOM has updated)
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        updateHeight()
      })
    })

    return () => {
      clearTimeout(timeoutId)
      if (resizeDebounceTimerRef.current) {
        clearTimeout(resizeDebounceTimerRef.current)
        resizeDebounceTimerRef.current = null
      }
      resizeObserver.disconnect()
    }
  }, [onHeightChange, profile, isExpanded, condensedMode]) // Added condensedMode to dependencies for immediate reaction


  async function loadProfile(): Promise<ProfileData | null> {
    const { data } = await supabase
      .from('profile')
      .select('*')
      .limit(1)
      .single()

    if (data) {
      setProfile(data)
      return data
    }
    return null
  }

  async function fetchPlaneCardData(profileData: ProfileData | null) {
    if (!profileData) return

    // Fetch portfolio nav cards — all cards run in parallel
    const pCards: ProfileNavCard[] = []
    if (profileData.portfolio_plane_cards?.length) {
      const cardPromises = profileData.portfolio_plane_cards.map(async (card): Promise<ProfileNavCard | null> => {
        if (card.type === 'category') {
          const { data } = await supabase.from('categories').select('id, name, short_desc, desc').eq('id', card.id).single()
          if (!data) return null
          const { data: imgs } = await supabase.from('content').select('menu_thumbnail_url, image_url').eq('category_id', card.id).order('order_index', { ascending: true }).limit(5)
          return { id: data.id, name: data.name, shortDesc: (data as any).short_desc ?? null, desc: (data as any).desc ?? null, thumbnails: imgs?.map((c: any) => c.menu_thumbnail_url ?? c.image_url).filter(Boolean) ?? [], type: 'category' as const }
        } else if (card.type === 'subcategory') {
          const { data } = await supabase.from('subcategories').select('id, name, short_desc, desc').eq('id', card.id).single()
          if (!data) return null
          const { data: imgs } = await supabase.from('content').select('menu_thumbnail_url, image_url').eq('subcategory_id', card.id).order('order_index', { ascending: true }).limit(5)
          return { id: data.id, name: data.name, shortDesc: (data as any).short_desc ?? null, desc: (data as any).desc ?? null, thumbnails: imgs?.map((c: any) => c.menu_thumbnail_url ?? c.image_url).filter(Boolean) ?? [], type: 'subcategory' as const }
        } else if (card.type === 'collection') {
          const { data } = await supabase.from('collections').select('id, name, short_desc, desc').eq('id', card.id).single()
          if (!data) return null
          const { data: junctionData } = await supabase.from('content_collections').select('content_id').eq('collection_id', card.id).limit(5)
          let thumbnails: string[] = []
          if (junctionData?.length) {
            const ids = junctionData.map((j: any) => j.content_id)
            const { data: imgs } = await supabase.from('content').select('menu_thumbnail_url, image_url').in('id', ids).limit(5)
            thumbnails = imgs?.map((c: any) => c.menu_thumbnail_url ?? c.image_url).filter(Boolean) ?? []
          }
          return { id: data.id, name: data.name, shortDesc: (data as any).short_desc ?? null, desc: (data as any).desc ?? null, thumbnails, type: 'collection' as const }
        }
        return null
      })
      const results = await Promise.all(cardPromises)
      for (const card of results) {
        if (card) pCards.push(card)
      }
    }
    setPortfolioCardData(pCards)

    // Fetch resume cards
    const rCards: ProfileResumeCard[] = []
    if (profileData.resume_plane_cards?.length) {
      const { data } = await supabase
        .from('resume_entries')
        .select('id, title, subtitle, short_description, plane_description, date_start, date_end')
        .in('id', profileData.resume_plane_cards)
      if (data) {
        for (const id of profileData.resume_plane_cards) {
          const entry = data.find((d: any) => d.id === id)
          if (entry) rCards.push({ id: entry.id, title: entry.title, subtitle: entry.subtitle ?? null, dateStart: entry.date_start ?? null, dateEnd: entry.date_end ?? null, shortDescription: entry.short_description ?? null, planeDescription: (entry as any).plane_description ?? null })
        }
      }
    }
    setResumeCardData(rCards)
  }

  if (!profile) return (
    <header
      className="sticky top-0 z-40 border-b-2 border-accent-light"
      style={{ backgroundColor: '#121212', height: condensedDesktopHeight }}
    />
  )
  const isCondensed = condensedMode && !isExpanded

  const isClickable = !isExpanded || isCondensed
  const showGradientStrip = isClickable && !isMobile
  const hoverGradientHeight = 40
  const hoverExpansion = hoverGradientHeight / 2

  return (<>
    <motion.header
      ref={headerRef}
      className={`border-b-2 border-accent-light sticky top-0 z-40 font-body text-text-on-dark-secondary bg-bg-profile backdrop-saturate-[180%] backdrop-blur-[20px] shadow-[0_2px_12px_rgba(0,0,0,0.08)] relative ${!isExpanded && !isCondensed && !isMobile ? 'collapsed' : ''} ${isClickable ? 'select-none' : ''} ${showGradientStrip ? 'cursor-pointer' : ''}`}
      onClick={isClickable ? handleExpand : undefined}
      onMouseEnter={() => { if (showGradientStrip) setHeaderHovered(true) }}
      onMouseLeave={() => setHeaderHovered(false)}
      animate={!isMobile ? {
        height: isCondensed
          ? condensedDesktopHeight
          : (profile.collapsed_profile_height ?? condensedDesktopHeight)
      } : {}}
      transition={{ duration: reduced ? 0 : 0.45, ease: [0.4, 0, 0.2, 1] }}
      style={{ backgroundColor: '#121212', overflow: 'visible' }}
    >
      {/* Invisible measurement div — always in DOM on desktop, sized to condensed layout.
          ResizeObserver on this element gives us the live condensed height for animation. */}
      {!isMobile && (
        <div
          ref={condensedMeasureRef}
          aria-hidden="true"
          style={{ position: 'absolute', top: 0, left: 0, right: 0, opacity: 0, pointerEvents: 'none', zIndex: -1 }}
          className="py-4 px-8"
        >
          <h1 className="font-display text-[2rem] font-bold uppercase text-text-on-dark tracking-[-0.012em] mb-1 select-none">
            {profile.full_name?.toUpperCase() || 'YOUR NAME'}
          </h1>
        </div>
      )}

      {/* Inner wrapper — clips content during height animation while gradient strips remain outside */}
      <div style={{ overflow: 'hidden', height: !isMobile ? '100%' : undefined }}>

        {/* Mobile states */}
        <AnimatePresence initial={false}>
          {isMobile && !isExpanded && !isCondensed && (
            <motion.div
              key="mobile-collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: reduced ? 0 : 0.38, ease: 'easeInOut' }}
            >
              <div className="px-[15px] py-4">
                <div className="flex justify-between items-start w-full mb-2">
                  <div className="w-[40%]">
                    <h1 className="font-display text-[1.35rem] font-bold uppercase text-text-on-dark tracking-[-0.012em] leading-none mb-1">
                      {profile.full_name?.toUpperCase() || 'YOUR NAME'}
                    </h1>
                    {profile.location && (
                      <div className="flex items-center gap-1 font-body text-sm text-text-on-dark-secondary whitespace-nowrap">
                        <img src="/dc-outline.png" alt="location" style={{ width: 14, height: 14, objectFit: 'contain' }} />
                        <p>{profile.location}</p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-0.5 text-xs text-text-on-dark-secondary text-right w-[60%]">
                    {profile.job_title_1 && <p>{profile.job_title_1}</p>}
                    {profile.job_title_2 && <p>{profile.job_title_2}</p>}
                    {profile.job_title_3 && <p>{profile.job_title_3}</p>}
                    {profile.job_title_4 && <p>{profile.job_title_4}</p>}
                  </div>
                </div>
                <hr className="border-0 border-t border-accent-dark my-2" />
                <div className="font-body text-sm text-text-on-dark-secondary leading-relaxed mt-2">
                  {profile.short_bio ? (
                    isBlockNoteFormat(profile.short_bio) ? (
                      <ShortBioRenderer data={profile.short_bio} />
                    ) : (
                      <p>{profile.short_bio}</p>
                    )
                  ) : (
                    <p>No bio available</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {isCondensed && isMobile && (
            <motion.div
              key="mobile-condensed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: reduced ? 0 : 0.38, ease: 'easeInOut' }}
            >
              <div className="px-[15px] py-3">
                <h1 className="font-display text-[2rem] font-bold uppercase text-text-on-dark tracking-[-0.012em] leading-none whitespace-nowrap overflow-hidden text-ellipsis select-none cursor-pointer" onClick={handleExpand}>
                  {profile.full_name?.toUpperCase() || 'YOUR NAME'}
                </h1>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Desktop: unified layout — name always visible at same position, extra fields fade */}
        {!isMobile && (
          <div className="py-4 px-8">
            <div className="flex items-start">
              <div className="w-[50%]">
                <h1 className="font-display text-[2rem] font-bold uppercase text-text-on-dark tracking-[-0.012em] mb-1 select-none overflow-hidden text-ellipsis whitespace-nowrap">
                  {profile.full_name?.toUpperCase() || 'YOUR NAME'}
                </h1>
                <AnimatePresence>
                  {!isCondensed && (
                    <motion.div
                      key="desktop-extras"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: reduced ? 0 : 0.38, ease: 'easeInOut' }}
                    >
                      {profile.location && (
                        <div className="flex items-center gap-1 font-body text-sm text-text-on-dark-secondary whitespace-nowrap mb-3">
                          <img src="/dc-outline.png" alt="location" style={{ width: 14, height: 14, objectFit: 'contain' }} />
                          <p>{profile.location}</p>
                        </div>
                      )}
                      <div className="space-y-0.5 font-body text-sm text-text-on-dark-secondary">
                        {profile.job_title_1 && <p>{profile.job_title_1}</p>}
                        {profile.job_title_2 && <p>{profile.job_title_2}</p>}
                        {profile.job_title_3 && <p>{profile.job_title_3}</p>}
                        {profile.job_title_4 && <p>{profile.job_title_4}</p>}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <AnimatePresence>
                {!isCondensed && (
                  <motion.div
                    key="desktop-bio"
                    className="w-[40%]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: reduced ? 0 : 0.38, ease: 'easeInOut' }}
                  >
                    <div className="font-body text-sm text-text-on-dark-secondary leading-relaxed" style={{ lineHeight: '1.625' }}>
                      {profile.short_bio ? (
                        isBlockNoteFormat(profile.short_bio) ? (
                          <ShortBioRenderer data={profile.short_bio} />
                        ) : (
                          <p>{profile.short_bio}</p>
                        )
                      ) : (
                        <p>No bio available</p>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="w-[10%]"></div>
            </div>
          </div>
        )}
      </div>

      {/* Gradient strips — siblings of inner wrapper so they're not clipped by overflow:hidden */}
      {showGradientStrip && (<>
        <div
          className="absolute left-0 right-0 pointer-events-none transition-opacity duration-300"
          style={{
            bottom: -hoverExpansion,
            height: hoverExpansion,
            backgroundColor: '#121212',
            opacity: headerHovered ? 1 : 0,
            zIndex: 38,
          }}
        />
        <div
          className="absolute left-0 right-0 pointer-events-none transition-opacity duration-300"
          style={{
            bottom: -hoverExpansion,
            height: hoverGradientHeight,
            background: 'linear-gradient(to bottom, transparent, #6B2A2A)',
            opacity: headerHovered ? 1 : 0,
            zIndex: 39,
          }}
        />
      </>)}
    </motion.header>

    {/* Mobile expanded overlay — sibling to header, outside backdrop-filter containing block */}
    {isMobile && (
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0, y: reduced ? 0 : 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: reduced ? 0 : 10 }}
            transition={{ duration: reduced ? 0 : 0.45, ease: 'easeInOut' }}
            className="bg-bg-profile"
            style={{
              position: 'fixed',
              top: 0,
              bottom: 0,
              left: 0,
              right: 0,
              zIndex: 55,
              backgroundColor: '#121212',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden'
            }}
          >
            {/* Dual-column header: Name 30%, Titles 70% + Collapse button */}
            <div className="px-[15px] pt-4 pb-2 border-b border-border-gray-800">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-start flex-1">
                  <div className="w-[30%]">
                    <h1 className="font-display text-[1.35rem] font-bold uppercase text-text-on-dark tracking-[-0.012em] leading-tight mb-1">
                      {profile.full_name?.toUpperCase() || 'YOUR NAME'}
                    </h1>
                    {profile.location && (
                      <div className="flex items-center gap-1 font-body text-sm text-text-on-dark-secondary whitespace-nowrap">
                        <img src="/dc-outline.png" alt="location" style={{ width: 14, height: 14, objectFit: 'contain' }} />
                        <p>{profile.location}</p>
                      </div>
                    )}
                  </div>
                  <div className="w-[70%] pl-4">
                    <div className="flex flex-col gap-0.5 font-body text-xs text-text-on-dark-secondary text-right">
                      {profile.job_title_1 && <p>{profile.job_title_1}</p>}
                      {profile.job_title_2 && <p>{profile.job_title_2}</p>}
                      {profile.job_title_3 && <p>{profile.job_title_3}</p>}
                      {profile.job_title_4 && <p>{profile.job_title_4}</p>}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Bio section — fills remaining space */}
            <div className="flex-1 overflow-hidden px-[15px] pb-4" style={{ paddingTop: '10%' }}>
              <div className="font-body text-sm text-text-on-dark-secondary leading-relaxed h-full overflow-hidden">
                {profile.short_bio ? (
                  isBlockNoteFormat(profile.short_bio) ? (
                    <ShortBioRenderer data={profile.short_bio} />
                  ) : (
                    <p>{profile.short_bio}</p>
                  )
                ) : (
                  <p>No bio available</p>
                )}
              </div>
            </div>

            {/* Navigation rectangles */}
            <div style={{ height: 2, backgroundColor: '#6B2A2A', flexShrink: 0 }} />
            <button
              className="w-full flex items-center justify-center"
              style={{ height: '25vh', backgroundColor: '#0B0A0A' }}
              onClick={() => { setIsExpanded(false); onSwitchToPortfolio?.() }}
            >
              <span style={{ fontFamily: 'var(--font-ui, sans-serif)', fontSize: '2.25rem', fontWeight: 700, textTransform: 'uppercase', color: '#e0e0e0', letterSpacing: '0.02em' }}>Portfolio</span>
            </button>
            <div style={{ height: 3, backgroundColor: '#6B2A2A', flexShrink: 0 }} />
            <button
              className="w-full flex items-center justify-center"
              style={{ height: '25vh', backgroundColor: '#c7c7c2' }}
              onClick={() => { setIsExpanded(false); onSwitchToResume?.() }}
            >
              <span style={{ fontFamily: 'var(--font-ui, sans-serif)', fontSize: '2.25rem', fontWeight: 700, textTransform: 'uppercase', color: '#111111', letterSpacing: '0.02em' }}>Resume</span>
            </button>
            <div style={{ height: 10, backgroundColor: '#6B2A2A', flexShrink: 0 }} />
          </motion.div>
        )}
      </AnimatePresence>
    )}

    {/* Desktop expanded overlay — fixed, covers full viewport including bottom nav */}
    {!isMobile && (
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0 } }}
            transition={{ duration: reduced ? 0 : 0.15 }}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 55,
              backgroundColor: '#121212',
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* Profile upper zone — height animates between collapsed height (enter/exit) and full expanded height */}
            <motion.div
              initial={!reduced ? { height: profile.collapsed_profile_height ?? condensedDesktopHeight } : { height: expandedHeight }}
              animate={{ height: isAnimatingOut ? (profile.collapsed_profile_height ?? condensedDesktopHeight) : expandedHeight }}
              transition={{ duration: reduced ? 0 : 0.45, ease: [0.4, 0, 0.2, 1] }}
              style={{
                display: 'flex',
                flexDirection: 'column',
                flexShrink: 0,
                overflow: 'hidden',
                backgroundColor: '#121212',
                borderBottom: '2px solid #6B2A2A',
              }}
            >
              {/* Profile header: name / location / job titles (left) + short bio (right) */}
              <div className="py-4 px-8 flex items-start flex-shrink-0">
                <div className="w-[50%]">
                  <h1 className="font-display text-[2rem] font-bold uppercase text-text-on-dark tracking-[-0.012em] mb-1 select-none">
                    {profile.full_name?.toUpperCase() || 'YOUR NAME'}
                  </h1>
                  {profile.location && (
                    <div className="flex items-center gap-1 font-body text-sm text-text-on-dark-secondary whitespace-nowrap mb-3">
                      <img src="/dc-outline.png" alt="location" style={{ width: 14, height: 14, objectFit: 'contain' }} />
                      <p>{profile.location}</p>
                    </div>
                  )}
                  <div className="space-y-0.5 font-body text-sm text-text-on-dark-secondary">
                    {profile.job_title_1 && <p>{profile.job_title_1}</p>}
                    {profile.job_title_2 && <p>{profile.job_title_2}</p>}
                    {profile.job_title_3 && <p>{profile.job_title_3}</p>}
                    {profile.job_title_4 && <p>{profile.job_title_4}</p>}
                  </div>
                </div>
                <div className="w-[40%] font-body text-sm text-text-on-dark-secondary" style={{ lineHeight: '1.625' }}>
                  {profile.short_bio ? (
                    isBlockNoteFormat(profile.short_bio) ? (
                      <ShortBioRenderer data={profile.short_bio} />
                    ) : (
                      <p>{profile.short_bio}</p>
                    )
                  ) : (
                    <p>No bio available</p>
                  )}
                </div>
              </div>

              {/* Full bio — fades out immediately on collapse, fades in after upper zone has expanded */}
              <motion.div
                animate={{ opacity: isAnimatingOut ? 0 : 1 }}
                transition={{ duration: reduced ? 0 : 0.2, delay: isAnimatingOut ? 0 : (reduced ? 0 : 0.35) }}
                className="flex-1 min-h-0 overflow-y-hidden px-8 py-4"
                style={{ borderTop: '2px solid #2e2a28' }}
              >
                <div
                  className="blocknote-profile-bio font-body text-text-on-dark-secondary"
                  style={{
                    fontSize: '14px',
                    lineHeight: '1.625',
                    '--text-body': 'var(--text-on-dark-secondary)',
                    '--text-headings': 'var(--text-on-dark)',
                    '--text-secondary': 'var(--text-on-dark-secondary)',
                    '--text-metadata': 'var(--text-on-dark-inactive)',
                  } as React.CSSProperties}
                >
                  {profile.full_bio ? (
                    isBlockNoteFormat(profile.full_bio) ? (
                      <BlockNoteRenderer data={profile.full_bio} imageSizes={profile.full_bio_image_sizes} />
                    ) : (
                      <p>{profile.full_bio}</p>
                    )
                  ) : profile.short_bio ? (
                    isBlockNoteFormat(profile.short_bio) ? (
                      <BlockNoteRenderer data={profile.short_bio} />
                    ) : (
                      <p>{profile.short_bio}</p>
                    )
                  ) : (
                    <p>No bio available</p>
                  )}
                </div>
              </motion.div>
            </motion.div>

            {/* Planes area — layered: destination background behind, planes content in front */}
            <div style={{ position: 'relative', flex: 1, minHeight: 0 }}>
              {/* Destination background — fades in as planes fade out to reveal the correct next-view color */}
              <motion.div
                animate={{ opacity: isAnimatingOut && animatingOutDestination !== null ? 1 : 0 }}
                transition={{ duration: reduced ? 0 : 0.25 }}
                className={animatingOutDestination === 'portfolio' ? 'bg-bg-menu-bar' : 'bg-bg-main'}
                style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}
              />
              {/* Planes — fade out on collapse, fade in (with delay) on expand */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: isAnimatingOut ? 0 : 1 }}
                transition={{
                  duration: reduced ? 0 : 0.25,
                  delay: isAnimatingOut ? 0 : (reduced ? 0 : 0.3),
                }}
                style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column' }}
              >
                <ProfilePlanes
                  portfolioCards={portfolioCardData}
                  resumeCards={resumeCardData}
                  education={profile.education}
                  jhuEntryId={profile.jhu_entry_id ?? null}
                  onSwitchToPortfolio={() => triggerCollapse(() => onSwitchToPortfolio?.(), 'portfolio')}
                  onSwitchToResume={(entryId?: string) => triggerCollapse(() => onSwitchToResume?.(entryId), 'resume')}
                  onCardSelect={onCardSelect ? (id, type) => triggerCollapse(() => onCardSelect(id, type), 'portfolio') : undefined}
                />
              </motion.div>
            </div>

            {/* Footer caption */}
            <div style={{ position: 'absolute', bottom: -5, right: 12, zIndex: 60 }}>
              <Link href="/about" className="font-ui hover:text-white transition-colors" style={{ fontSize: 11, color: '#b0b0b0', textDecoration: 'none' }}>Made with Cursor and Claude Code</Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    )}
  </>
  )
})

Profile.displayName = 'Profile'

export default Profile


