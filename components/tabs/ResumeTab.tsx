'use client'

import React, { useEffect, useState, useRef, useCallback, useMemo } from 'react'
import type { RefObject } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import BlockNoteRenderer from '@/components/BlockNoteRendererDynamic'
import { useMobileState } from '@/lib/responsive'
import { useReducedMotion, dmTransition } from '@/lib/animations'
import { RESUME_SIDE_CARD_WIDTH_PX, RESUME_CENTER_CARD_WIDTH_PX, RESUME_SIDE_CARD_OFFSET_PX } from '@/lib/constants'
import Loader from '@/components/Loader'
import { cloudinaryCrop } from '@/lib/utils'

const TIMELINE_TOP_OFFSET = 0

// ---------------------------------------------------------------------------
// Resume asset cards — PeriTriad-style, score-1.00 colours
// ---------------------------------------------------------------------------

type ResumeAssetItem = {
  id: string
  caption: string
  shortTitle?: string | null
  thumbnail?: string | null
  periDesc?: string | null
  shortDesc?: string | null
  iconUrl?: string | null
  assetType: 'content' | 'link'
  onClick: () => void
}

const ASSET_CARD_DUR = '0.28s cubic-bezier(0.4,0,0.2,1)'

function AssetCard({
  data,
  isHovered,
  isCondensed,
  onEnter,
  onLeave,
}: {
  data: ResumeAssetItem
  isHovered: boolean
  isCondensed: boolean
  onEnter: () => void
  onLeave: () => void
}) {
  const reduced = useReducedMotion()
  const targetWidth = isCondensed ? 10 : isHovered ? 290 : 150

  return (
    <motion.div
      animate={{ width: targetWidth }}
      transition={dmTransition(reduced)}
      onClick={data.onClick}
      onMouseEnter={onEnter}
      onMouseLeave={onLeave}
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        border: isHovered ? '0.5px solid #1c1818' : '0.5px solid rgba(26,26,26,0.35)',
        background: isCondensed ? '#9a9994' : '#c7c7c2',
        flexShrink: 0,
        overflow: isCondensed ? 'hidden' : 'visible',
        cursor: 'pointer',
      }}
    >
      <div style={{ opacity: isCondensed ? 0 : 1, transition: 'opacity 0.2s', display: 'flex', flexDirection: 'column' }}>
        {/* Top row */}
        <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', height: 72, width: '100%' }}>
          {isHovered && (
            <div style={{
              width: 104,
              height: '100%',
              flexShrink: 0,
              background: '#b8b4b0',
              marginLeft: 6,
              borderRadius: 2,
              overflow: 'hidden',
              position: 'relative',
              top: -10,
              boxShadow: '2px 4px 8px rgba(0,0,0,0.14)',
              transform: 'perspective(280px) rotateY(10deg)',
              transformOrigin: 'left center',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {data.thumbnail ? (
                <img src={cloudinaryCrop(data.thumbnail, 208, 144)} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
              ) : (
                <span style={{ fontSize: 9, color: '#8a8480', textAlign: 'center', padding: 8 }}>No img</span>
              )}
            </div>
          )}
          {!isHovered && data.iconUrl && (
            <img
              src={data.iconUrl}
              alt=""
              style={{ width: 20, height: 20, margin: '10px 0 0 8px', flexShrink: 0, objectFit: 'contain' }}
            />
          )}
          {/* Body */}
          <div style={{
            flex: 1,
            padding: '1px 8px 6px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            textAlign: 'right',
            minWidth: 0,
            overflow: 'hidden',
          }}>
            {!isHovered && (
              <div style={{
                fontSize: 12,
                fontWeight: 500,
                color: '#1a1a1a',
                marginTop: 5,
                lineHeight: 1.5,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
              }}>
                {data.shortTitle || data.caption}
              </div>
            )}
            {isHovered && (
              <div style={{
                fontSize: 13,
                fontWeight: 500,
                color: '#1a1a1a',
                lineHeight: 1.5,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
                maxWidth: '24ch',
                marginLeft: 'auto',
              } as React.CSSProperties}>
                {data.caption}
              </div>
            )}
            {!isHovered && data.periDesc && (
              <div style={{
                fontSize: 12,
                color: '#303030',
                marginTop: 16,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}>
                {data.periDesc.length > 22 ? data.periDesc.slice(0, 21) + '…' : data.periDesc}
              </div>
            )}
          </div>
        </div>
        {/* Short desc expansion on hover */}
        <div style={{
          textAlign: 'right',
          padding: isHovered ? '2px 12px 8px' : '0 12px',
          fontSize: 12,
          lineHeight: 1.45,
          textIndent: 98,
          color: '#363030',
          maxHeight: isHovered ? 64 : 0,
          overflow: 'hidden',
          marginTop: isHovered ? -15 : 0,
          transition: reduced ? 'none' : `max-height ${ASSET_CARD_DUR}, margin-top ${ASSET_CARD_DUR}`,
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
        } as React.CSSProperties}>
          {data.shortDesc}
        </div>
      </div>
    </motion.div>
  )
}

function ResumeAssetGroup({ assets, isMobile = false }: { assets: ResumeAssetItem[], isMobile?: boolean }) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null)
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleEnter = (i: number) => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current)
    setHoveredIdx(i)
  }
  const handleLeave = () => {
    leaveTimer.current = setTimeout(() => setHoveredIdx(null), 150)
  }

  useEffect(() => () => { if (leaveTimer.current) clearTimeout(leaveTimer.current) }, [])

  if (isMobile) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: '100%' }}>
        {assets.map(asset => (
          <div
            key={asset.id}
            onClick={asset.onClick}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              gap: 8,
              background: '#c7c7c2',
              border: '0.5px solid #1c1818',
              borderRadius: 3,
              padding: '8px 10px',
              cursor: 'pointer',
              width: '100%',
            }}
          >
            {asset.iconUrl ? (
              <img src={asset.iconUrl} alt="" style={{ width: 20, height: 20, objectFit: 'contain', flexShrink: 0 }} />
            ) : (
              <div style={{ width: 20, height: 20, flexShrink: 0 }} />
            )}
            <span style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a', flex: 1 }}>
              {asset.shortTitle || asset.caption}
            </span>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
      {assets.map((asset, i) => (
        <AssetCard
          key={asset.id}
          data={asset}
          isHovered={hoveredIdx === i}
          isCondensed={hoveredIdx !== null && hoveredIdx !== i}
          onEnter={() => handleEnter(i)}
          onLeave={handleLeave}
        />
      ))}
    </div>
  )
}

// Helper function to check if data is in BlockNote format (array of PartialBlock)
function isBlockNoteFormat(data: any): boolean {
  return Array.isArray(data) && data.length > 0 && data.every((block: any) => block && typeof block === 'object' && 'id' in block && 'type' in block)
}

type DebugSettings = {
  showDebugWindow: boolean
  showAllMarkers: boolean
}

type ResumeEntryRaw = {
  id: string
  entry_type_id: string | null
  title: string
  subtitle: string | null
  date_start: string | null
  date_end: string | null
  short_description: string | null
  description: any
  description_image_sizes?: Record<string, { width?: number; height?: number }>
  collection_id: string | null
  is_featured: boolean
  order_index: number
  resume_entry_types: {
    name: 'Left Side' | 'Right Side' | 'Center'
    icon: string | null
  } | null
  collections: {
    name: string
    slug: string
  } | null
  resume_assets: Array<{
    id: string
    asset_type: 'content' | 'link'
    content_id: string | null
    link_url: string | null
    link_title: string | null
    order_index: number
    custom_caption: string | null
    icon_key: string | null
    thumbnail_url: string | null
    resume_asset_icons: {
      id: string
      name: string
      icon_url: string
      order_index: number
    } | null
    content: {
      id: string
      title: string
      type: string
      short_title?: string | null
      menu_thumbnail_url?: string | null
      peri_desc?: string | null
      short_desc?: string | null
    } | null
  }>
}

export default function ResumeTab({
  onOpenCollection,
  onOpenContent,
  profileHeight = 0,
  onNowMarkerInViewChange,
  onSideEntryExpandedChange,
  focusEntryId = null,
}: {
  onOpenCollection?: (slug: string, name: string) => void
  onOpenContent?: (id: string, title: string) => void
  profileHeight?: number
  onNowMarkerInViewChange?: (inView: boolean) => void
  onSideEntryExpandedChange?: (hasExpanded: boolean) => void
  focusEntryId?: string | null
} = {}) {
  const { isMobile } = useMobileState()
  
  const [debugSettings, setDebugSettings] = useState<DebugSettings>({
    showDebugWindow: false,
    showAllMarkers: false
  })
  
  const [entries, setEntries] = useState<ResumeEntryRaw[]>([])
  const [transformedEntries, setTransformedEntries] = useState<ResumeEntry[]>([])
  const [sideEntries, setSideEntries] = useState<ResumeEntry[]>([])
  const [centerEntries, setCenterEntries] = useState<ResumeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const [cardHeights, setCardHeights] = useState<Map<string, { collapsed: number, expanded?: number }>>(new Map())
  
  const [expandedEntries, setExpandedEntries] = useState<Set<string>>(new Set())
  const nowMarkerRef = useRef<HTMLDivElement | null>(null)

  const [operationalMonths, setOperationalMonths] = useState<Date[]>([])
  const [activatedMarkers, setActivatedMarkers] = useState<Set<string>>(new Set())
  const [greenMarkers, setGreenMarkers] = useState<Set<string>>(new Set())
  const [blueMarkers, setBlueMarkers] = useState<Set<string>>(new Set())
  const [greenActivatedMarkers, setGreenActivatedMarkers] = useState<Set<string>>(new Set())
  const [blueActivatedMarkers, setBlueActivatedMarkers] = useState<Set<string>>(new Set())
  const [markerHeights, setMarkerHeights] = useState<Map<string, number>>(new Map())
  const [monthToEntriesMap, setMonthToEntriesMap] = useState<Map<string, string[]>>(new Map())
  
  const [standardCard, setStandardCard] = useState<ResumeEntry | null>(null)
  const [standardHeight, setStandardHeight] = useState<number | null>(null)
  
  const [markerPositions, setMarkerPositions] = useState<Map<string, number>>(new Map())
  
  const [timelineHeight, setTimelineHeight] = useState<number>(300) // Initialize with empty state height
  const SIDE_CARD_TOP_BUFFER = 15
  const leftEntries = useMemo(() => sideEntries.filter(e => e.position === 'left'), [sideEntries])
  const rightEntries = useMemo(() => sideEntries.filter(e => e.position === 'right'), [sideEntries])
  const sortedLeftEntries = useMemo(() => {
    return [...leftEntries].sort((a, b) => {
      const aEnd = a.date_end_normalized?.getTime() || Date.now()
      const bEnd = b.date_end_normalized?.getTime() || Date.now()
      return bEnd - aEnd
    })
  }, [leftEntries])
  const sortedRightEntries = useMemo(() => {
    return [...rightEntries].sort((a, b) => {
      const aEnd = a.date_end_normalized?.getTime() || Date.now()
      const bEnd = b.date_end_normalized?.getTime() || Date.now()
      return bEnd - aEnd
    })
  }, [rightEntries])
  const adjustedMarkerHeights = useMemo(() => {
    return new Map(markerHeights)
  }, [markerHeights])
  const onCardHeightMeasured = useCallback((entryId: string, height: number, state: 'collapsed' | 'expanded') => {
    setCardHeights(prev => {
      const next = new Map(prev)
      const existing = next.get(entryId) || { collapsed: 0 }
      
      if (state === 'collapsed') {
        next.set(entryId, { ...existing, collapsed: height })
      } else {
        next.set(entryId, { ...existing, expanded: height })
      }
      
      return next
    })
  }, [])
  
  const toggleExpand = useCallback((entryId: string) => {
    setExpandedEntries(prev => {
      const next = new Set(prev)
      if (next.has(entryId)) {
        next.delete(entryId) // Collapse
      } else {
        next.add(entryId) // Expand
      }
      return next
    })
  }, [])

  const hasExpandedSideEntry = useMemo(() => {
    if (!sideEntries.length) return false
    return sideEntries.some(entry => expandedEntries.has(entry.id))
  }, [sideEntries, expandedEntries])

  const lastAppliedFocusRef = useRef<string | null>(null)

  useEffect(() => {
    if (!focusEntryId) return
    if (focusEntryId === lastAppliedFocusRef.current) return
    if (loading || !transformedEntries.length) return

    lastAppliedFocusRef.current = focusEntryId
    setExpandedEntries(prev => {
      const next = new Set(prev)
      next.add(focusEntryId)
      return next
    })

    setTimeout(() => {
      const el = document.querySelector(`[data-resume-entry-id="${focusEntryId}"]`)
      if (el) {
        const rect = el.getBoundingClientRect()
        const offset = 80
        window.scrollTo({ top: rect.top + window.scrollY - offset, behavior: 'smooth' })
      }
    }, 400)
  }, [focusEntryId, loading, transformedEntries.length])

  useEffect(() => {
    if (!onSideEntryExpandedChange) return
    onSideEntryExpandedChange(hasExpandedSideEntry)
  }, [hasExpandedSideEntry, onSideEntryExpandedChange])

  useEffect(() => {
    if (!onNowMarkerInViewChange) return
    let observer: IntersectionObserver | null = null
    let retryTimer: number | null = null

    const attachObserver = () => {
      const element = nowMarkerRef.current
      if (!element) {
        retryTimer = window.setTimeout(attachObserver, 100)
        return
      }
      observer = new IntersectionObserver(
        ([entry]) => {
          onNowMarkerInViewChange(entry.isIntersecting)
        },
        { root: null, threshold: 0 }
      )
      observer.observe(element)
    }

    attachObserver()
    return () => {
      if (retryTimer) window.clearTimeout(retryTimer)
      if (observer) observer.disconnect()
    }
  }, [onNowMarkerInViewChange])
  
  useEffect(() => {
    const loadEntries = async () => {
      try {
        setLoading(true)
        setError(null)
        
        const supabase = createClient()
        
        const [
          { data: entriesData, error: entriesError },
          { data: iconsData, error: iconsError }
        ] = await Promise.all([
          supabase
            .from('resume_entries')
            .select(`
              *,
              resume_entry_types!inner(name, icon),
              collections(name, slug),
              resume_assets(
                id,
                asset_type,
                content_id,
                link_url,
                link_title,
                order_index,
                custom_caption,
                icon_key,
                thumbnail_url,
                content(id, title, type, short_title, menu_thumbnail_url, peri_desc, short_desc)
              )
            `)
            .eq('is_featured', true)
            .order('date_end', { ascending: false, nullsFirst: true })
            .order('date_start', { ascending: false })
            .order('order_index', { ascending: true }),
          supabase
            .from('resume_asset_icons')
            .select('id, name, icon_url, order_index')
            .order('order_index')
        ])
        
        const queryError = entriesError || iconsError
        if (queryError) {
          throw queryError
        }
        
        const iconMap = new Map<string, { id: string, name: string, icon_url: string, order_index: number }>()
        ;(iconsData || []).forEach(icon => {
          if (icon.id) iconMap.set(icon.id, icon)
        })
        
        const data = (entriesData || []).map(entry => ({
          ...entry,
          resume_assets: (entry.resume_assets || []).map((asset: any) => ({
            ...asset,
            resume_asset_icons: asset.icon_key ? iconMap.get(asset.icon_key) || null : null
          }))
        }))
        
        setEntries(data || [])
        
        
        
        const transformed: ResumeEntry[] = (data || []).map(entry => {
          const startNormalized = normalizeDate(entry.date_start)
          let endNormalized = normalizeDate(entry.date_end)
          const hasEndDateOriginal = !!entry.date_end
          
          let position: 'left' | 'right' | 'center'
          if (entry.resume_entry_types?.name === 'Left Side') {
            position = 'left'
          } else if (entry.resume_entry_types?.name === 'Right Side') {
            position = 'right'
          } else if (entry.resume_entry_types?.name === 'Center') {
            position = 'center'
          } else {
            position = 'right'
          }
          
          if (position === 'center' && !endNormalized) {
            endNormalized = startNormalized
          }
          
          const months = countMonths(startNormalized, endNormalized)
          
          return {
            ...entry,
            date_start_normalized: startNormalized,
            date_end_normalized: endNormalized,
            has_end_date_original: hasEndDateOriginal,
            monthCount: months,
            position
          }
        })
        
        setTransformedEntries(transformed)
        
        const side = transformed.filter(e => e.position === 'left' || e.position === 'right')
        const center = transformed.filter(e => e.position === 'center')
        
        setSideEntries(side)
        setCenterEntries(center)
        
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to load entries'
        setError(errorMessage)
        console.error('❌ Error loading entries:', err)
      } finally {
        setLoading(false)
      }
    }
    
    loadEntries()
  }, [])
  
  useEffect(() => {
    const loadDebugSettings = () => {
      if (typeof window !== 'undefined') {
        const debugWindow = localStorage.getItem('resume-debug-window') === 'true'
        const allMarkers = localStorage.getItem('resume-all-markers') === 'true'
        
        setDebugSettings(prev => {
          if (prev.showDebugWindow === debugWindow && prev.showAllMarkers === allMarkers) {
            return prev
          }

          return {
            showDebugWindow: debugWindow,
            showAllMarkers: allMarkers
          }
        })
      }
    }
    
    loadDebugSettings()

    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'resume-debug-window' || e.key === 'resume-all-markers') {
        loadDebugSettings()
      }
    }

    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])
  
  useEffect(() => {
    if (transformedEntries.length === 0) return
    
    
    const startMarker = calculateStartMarker(transformedEntries)
    const nowMarker = getCurrentMonthEST()
    const operationalMonths = generateOperationalMonths(startMarker, nowMarker)

    const activatedMarkersSet = new Set<string>()
    const greenActivatedMarkersSet = new Set<string>()
    const blueActivatedMarkersSet = new Set<string>()
    
    
    for (const entry of transformedEntries) {
      const isSide = entry.position === 'left' || entry.position === 'right'
      const isCenter = entry.position === 'center'
      
      const allowEndMarker =
        entry.position !== 'center' ? !!entry.date_end_normalized : entry.has_end_date_original && !!entry.date_end_normalized

      if (allowEndMarker && entry.date_end_normalized) {
        const endKey = formatMonthKey(entry.date_end_normalized)
        activatedMarkersSet.add(endKey)
        
        if (isSide) greenActivatedMarkersSet.add(endKey)
        if (isCenter) blueActivatedMarkersSet.add(endKey)
      }
      
      if (entry.date_start_normalized) {
        const startKey = formatMonthKey(entry.date_start_normalized)
        activatedMarkersSet.add(startKey)
        
        if (isSide) greenActivatedMarkersSet.add(startKey)
        if (isCenter) blueActivatedMarkersSet.add(startKey)
      }
    }
    
    
    
    
    
    const monthToEntriesMap = new Map<string, string[]>()
    const greenMarkersSet = new Set<string>() // Side entry markers
    const blueMarkersSet = new Set<string>()  // Center entry markers
    
    
    for (const entry of transformedEntries) {
      let startDate = entry.date_start_normalized
      let endDate = entry.date_end_normalized
      
      if (!endDate) {
        if (entry.position === 'left' || entry.position === 'right') {
          endDate = nowMarker
        } else if (entry.position === 'center') {
          endDate = startDate
        }
      }
      
      if (startDate && endDate) {
        const monthsInRange = getMonthsInRange(startDate, endDate)
        
        for (const month of monthsInRange) {
          const monthKey = formatMonthKey(month)
          
          if (!monthToEntriesMap.has(monthKey)) {
            monthToEntriesMap.set(monthKey, [])
          }
          monthToEntriesMap.get(monthKey)!.push(entry.id)
        }
        
        const rangeKeys = monthsInRange.map(formatMonthKey)
        
        if (entry.position === 'left' || entry.position === 'right') {
          rangeKeys.forEach(key => greenMarkersSet.add(key))
        } else if (entry.position === 'center') {
          rangeKeys.forEach(key => blueMarkersSet.add(key))
        }
      }
    }
    
    
    const markerHeightsMap = new Map<string, number>()
    operationalMonths.forEach(month => {
      const key = formatMonthKey(month)
      markerHeightsMap.set(key, 50) // 50px placeholder (Step 4.2 will calculate actual standard height)
    })
    
    
    setOperationalMonths(operationalMonths)
    setActivatedMarkers(activatedMarkersSet)
    setGreenMarkers(greenMarkersSet)
    setBlueMarkers(blueMarkersSet)
    setGreenActivatedMarkers(greenActivatedMarkersSet)
    setBlueActivatedMarkers(blueActivatedMarkersSet)
    setMarkerHeights(markerHeightsMap)
    setMonthToEntriesMap(monthToEntriesMap)
    
    
    
  }, [transformedEntries])
  
  useEffect(() => {
    if (sideEntries.length === 0) return

    const selected = calculateStandardCard(sideEntries)
    
    if (selected) {
      setStandardCard(selected)
    } else {
      setStandardCard(null)
    }
  }, [sideEntries])
  
  const detectDetachments = useCallback((
    cascadePositions: Map<string, number>,
    markerPositions: Map<string, number>,
    sideEntries: ResumeEntry[]
  ): Array<{entry: ResumeEntry, detachmentAmount: number, markerY: number}> => {
    const detachments: Array<{entry: ResumeEntry, detachmentAmount: number, markerY: number}> = []
    
    sideEntries.forEach(entry => {
      const adjustedY = cascadePositions.get(entry.id)
      if (adjustedY === undefined) return
      
      const endDate = entry.date_end_normalized || getCurrentMonthEST()
      const endKey = formatMonthKey(endDate)
      const markerY = markerPositions.get(endKey) ?? 0
      
      const detachmentAmount = adjustedY - markerY
      
      if (detachmentAmount > 0.1) { // Threshold to avoid floating point noise
        detachments.push({ entry, detachmentAmount, markerY })
      }
    })
    
    return detachments
  }, [])
  
  const adjustForDetachments = useCallback((
    baseHeights: Map<string, number>,
    detachments: Array<{entry: ResumeEntry, detachmentAmount: number, markerY: number}>,
    cardHeights: Map<string, {collapsed: number, expanded?: number}>,
    expandedEntries: Set<string>,
    standardHeight: number
  ): Map<string, number> => {
    const adjusted = new Map(baseHeights)
    
    detachments.forEach(({entry, detachmentAmount}) => {
      const isExpanded = expandedEntries.has(entry.id)
      const entryHeight = isExpanded 
        ? cardHeights.get(entry.id)?.expanded ?? cardHeights.get(entry.id)?.collapsed ?? 0
        : cardHeights.get(entry.id)?.collapsed ?? 0
      
      const actualSpanNeeded = entryHeight + detachmentAmount
      const perMonthRequired = actualSpanNeeded / entry.monthCount
      
      
      const startDate = entry.date_start_normalized || entry.date_end_normalized || getCurrentMonthEST()
      const endDate = entry.date_end_normalized || entry.date_start_normalized || getCurrentMonthEST()
      const monthSpan = getMonthsInRange(startDate, endDate)
      
      monthSpan.forEach(month => {
        const monthKey = formatMonthKey(month)
        const current = adjusted.get(monthKey) ?? standardHeight
        adjusted.set(monthKey, Math.max(current, perMonthRequired))
      })
    })
    
    return adjusted
  }, [])
  
  const checkConvergence = useCallback((
    previous: Map<string, number>,
    current: Map<string, number>
  ): number => {
    let maxDiff = 0
    
    for (const [key, currentHeight] of current) {
      const previousHeight = previous.get(key) ?? 0
      const diff = Math.abs(currentHeight - previousHeight)
      if (diff > maxDiff) {
        maxDiff = diff
      }
    }
    
    return maxDiff
  }, [])
  
  useEffect(() => {
    if (!standardCard) return
    
    
    const cardHeight = cardHeights.get(standardCard.id)
    const collapsedHeight = cardHeight?.collapsed
    
    
    if (!collapsedHeight || collapsedHeight === 0) {
      return
    }
    
    const rawCalculation = collapsedHeight / standardCard.monthCount
    const calculatedStandardHeight = Math.round(rawCalculation)
    
    
    
    setStandardHeight(calculatedStandardHeight)
    
    
  }, [standardCard, cardHeights])
  
  useEffect(() => {
    if (!standardHeight) return
    if (cardHeights.size === 0) return
    if (operationalMonths.length === 0) return
    
    if (cardHeights.size < transformedEntries.length) return
    
    let iteration = 0
    const MAX_ITERATIONS = 3
    let converged = false
    let finalCalculatedHeights = new Map<string, number>()
    
    while (!converged && iteration < MAX_ITERATIONS) {
      iteration++
      
      const requiredHeightsMap = calculateRequiredHeights(transformedEntries, cardHeights, expandedEntries)
      
      const calculatedHeights = applyMaximumHeights(requiredHeightsMap, operationalMonths, standardHeight)
      
      const tempPositions = calculateMarkerPositions(operationalMonths, calculatedHeights, standardHeight)
      
      const tempCascade = new Map<string, number>()
      
      for (const sorted of [sortedLeftEntries, sortedRightEntries]) {
        
        let previousBottom = 0
        
        sorted.forEach(entry => {
          const endDate = entry.date_end_normalized || getCurrentMonthEST()
          const endKey = formatMonthKey(endDate)
          const markerY = tempPositions.get(endKey) ?? 0
          
          const isExpanded = expandedEntries.has(entry.id)
          const entryHeight = isExpanded 
            ? cardHeights.get(entry.id)?.expanded ?? cardHeights.get(entry.id)?.collapsed ?? 0
            : cardHeights.get(entry.id)?.collapsed ?? 0
          
          const adjustedY = Math.max(markerY, previousBottom)
          tempCascade.set(entry.id, adjustedY)
          previousBottom = adjustedY + entryHeight
        })
      }
      
      const detachments = detectDetachments(tempCascade, tempPositions, sideEntries)
      
      if (detachments.length === 0) {
        converged = true
        finalCalculatedHeights = calculatedHeights
        break
      }
      
      const adjustedHeights = adjustForDetachments(calculatedHeights, detachments, cardHeights, expandedEntries, standardHeight)
      
      if (iteration > 1) {
        const maxDiff = checkConvergence(finalCalculatedHeights, adjustedHeights)
        if (maxDiff < 0.1) {
          converged = true
          finalCalculatedHeights = adjustedHeights
          break
        }
      }
      
      finalCalculatedHeights = adjustedHeights
    }

    setMarkerHeights(finalCalculatedHeights)
    
    const totalHeight = Array.from(finalCalculatedHeights.values()).reduce((sum, h) => sum + h, 0)
    setTimelineHeight(totalHeight)
    
  }, [
    transformedEntries,
    cardHeights,
    standardHeight,
    operationalMonths,
    expandedEntries,
    sideEntries,
    sortedLeftEntries,
    sortedRightEntries
  ])
  
  useEffect(() => {
    if (operationalMonths.length === 0) return
    
    const positions = calculateMarkerPositions(operationalMonths, adjustedMarkerHeights, standardHeight)
    
    setMarkerPositions(positions)
    
  }, [operationalMonths, adjustedMarkerHeights, standardHeight])
  
  const centerEntryAdjustedPositions = useMemo(() => {
    const positions = new Map<string, number>()
    
    centerEntries.forEach(entry => {
      if (markerPositions.size > 0 && markerHeights.size > 0) {
        const endDate = entry.date_end_normalized || entry.date_start_normalized
        const startDate = entry.date_start_normalized || entry.date_end_normalized

        if (!endDate || !startDate) {
          return // Skip entries with ZERO dates (shouldn't happen)
        }

        const startKey = formatMonthKey(startDate)
        const endKey = formatMonthKey(endDate)

        const startY = markerPositions.get(startKey) ?? 0
        const endY = markerPositions.get(endKey) ?? 0

        const startHeight = markerHeights.get(startKey) ?? standardHeight ?? 5

        const totalSpan = (startY + startHeight) - endY

        const cardHeight = cardHeights.get(entry.id)?.collapsed ?? 0
        const centerOffset = (totalSpan - cardHeight) / 2
        const centeredY = endY + centerOffset + 35

        positions.set(entry.id, centeredY)
      }
    })

    return positions
  }, [centerEntries, markerPositions, markerHeights, cardHeights, standardHeight])
  
  const sideEntryAdjustedPositions = useMemo(() => {
    const positions = new Map<string, number>() // entryId → adjusted Y position
    const getEndMarkerBottom = (entry: ResumeEntry) => {
      const endDate = entry.date_end_normalized || getCurrentMonthEST()
      const endKey = formatMonthKey(endDate)
      const top = markerPositions.get(endKey) ?? 0
      const height = markerHeights.get(endKey) ?? standardHeight ?? 5
      return top + TIMELINE_TOP_OFFSET + SIDE_CARD_TOP_BUFFER // top + offset + buffer
    }
    
    const leftEntries = sideEntries.filter(e => e.position === 'left')
    const rightEntries = sideEntries.filter(e => e.position === 'right')
    
    for (const entries of [leftEntries, rightEntries]) {
      if (entries.length === 0) continue

      const sorted = [...entries].sort((a, b) => {
        const aEnd = a.date_end_normalized?.getTime() || Date.now()
        const bEnd = b.date_end_normalized?.getTime() || Date.now()
        return bEnd - aEnd // Descending: newest end date first
      })

      let previousBottom = 0 // Track previous card bottom for cascade

      sorted.forEach((entry, index) => {
        const markerY = getEndMarkerBottom(entry)

        const height = expandedEntries.has(entry.id)
          ? (cardHeights.get(entry.id)?.expanded ?? cardHeights.get(entry.id)?.collapsed ?? 0)
          : (cardHeights.get(entry.id)?.collapsed ?? 0)

        const adjustedY = index === 0 ? markerY : Math.max(markerY, previousBottom)

        positions.set(entry.id, adjustedY)

        previousBottom = adjustedY + height
      })
    }
    
    return positions
  }, [sideEntries, markerPositions, cardHeights, expandedEntries])
  
  const resumeTopOffset = 1 // target gap below Profile

  const allEntriesForMobile = useMemo(() => {
    if (!isMobile) return []
    
    const all = [...sideEntries, ...centerEntries]
    return all.sort((a, b) => {
      const aDate = a.date_end_normalized?.getTime() || a.date_start_normalized?.getTime() || 0
      const bDate = b.date_end_normalized?.getTime() || b.date_start_normalized?.getTime() || 0
      return bDate - aDate // Descending: newest first
    })
  }, [isMobile, sideEntries, centerEntries])

  const reduced = useReducedMotion()

  return (
    <div
      className="max-w-6xl mx-auto resume-container"
      style={{
        paddingTop: `${resumeTopOffset}px`,
        paddingLeft: isMobile ? '0' : '2rem',
        paddingRight: isMobile ? '0' : '2rem',
        paddingBottom: isMobile ? '0' : '2rem'
      }}
    >
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader />
        </div>
      )}
      
      {error && (
        <div className="bg-red-900/20 border border-red-500 rounded-lg p-4 mb-6">
          <div className="text-red-400 font-semibold mb-2">Error loading entries:</div>
          <div className="text-red-300 text-sm">{error}</div>
        </div>
      )}
      
      {!loading && (
        <motion.div
          initial={{ y: reduced ? 0 : -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
        >
          {debugSettings.showDebugWindow && (
            <DebugWindow 
              debugSettings={debugSettings} 
              entries={entries}
              transformedEntries={transformedEntries}
              sideEntries={sideEntries}
              centerEntries={centerEntries}
              cardHeights={cardHeights}
              expandedEntries={expandedEntries}
              operationalMonths={operationalMonths}
              activatedMarkers={activatedMarkers}
              greenMarkers={greenMarkers}
              blueMarkers={blueMarkers}
              greenActivatedMarkers={greenActivatedMarkers}
              blueActivatedMarkers={blueActivatedMarkers}
              markerHeights={markerHeights}
              monthToEntriesMap={monthToEntriesMap}
              standardCard={standardCard}
              standardHeight={standardHeight}
              timelineHeight={timelineHeight}
            />
          )}
          
          {isMobile ? (
            <div className="flex flex-col" style={{ marginLeft: '15px', marginRight: '15px', gap: '20px' }}>
              {allEntriesForMobile.map((entry, index) => (
                <EntryCard 
                  key={entry.id}
                  entry={entry}
                  position={entry.position as 'left' | 'right' | 'center'}
                  index={index}
                  isExpanded={expandedEntries.has(entry.id)}
                  onToggleExpand={() => toggleExpand(entry.id)}
                  onHeightMeasured={onCardHeightMeasured}
                  markerPositions={markerPositions}
                  sideAdjustedY={sideEntryAdjustedPositions.get(entry.id)}
                  centerAdjustedY={centerEntryAdjustedPositions.get(entry.id)}
                  onOpenCollection={onOpenCollection}
                  onOpenContent={onOpenContent}
                  isMobile={isMobile}
                />
              ))}
            </div>
          ) : (
            <div 
              className="relative" 
              style={{ 
                height: `${35 + timelineHeight + 400}px`,
                transition: 'height 300ms ease-out'
              }}
            >
              <Timeline
                nowMarkerRef={nowMarkerRef}
                debugSettings={debugSettings}
                operationalMonths={operationalMonths}
                activatedMarkers={activatedMarkers}
                greenActivatedMarkers={greenActivatedMarkers}
                blueActivatedMarkers={blueActivatedMarkers}
                markerPositions={markerPositions}
                timelineHeight={timelineHeight}
              />
              
              {sideEntries.map((entry, index) => (
                <EntryCard 
                  key={entry.id}
                  entry={entry}
                  position={entry.position as 'left' | 'right'}
                  index={index}
                  isExpanded={expandedEntries.has(entry.id)}
                  onToggleExpand={() => toggleExpand(entry.id)}
                  onHeightMeasured={onCardHeightMeasured}
                  markerPositions={markerPositions}
                  sideAdjustedY={sideEntryAdjustedPositions.get(entry.id)} // Fix 9 Stage 3: Pass cascade-adjusted position
                  onOpenCollection={onOpenCollection}
                  onOpenContent={onOpenContent}
                  isMobile={isMobile}
                />
              ))}
              
              {centerEntries.map((entry, index) => {
                const centerY = centerEntryAdjustedPositions.get(entry.id)
                const cardHeight = cardHeights.get(entry.id)?.collapsed ?? 120
                const expandedHeight = expandedEntries.has(entry.id) 
                  ? (cardHeights.get(entry.id)?.expanded ?? cardHeight)
                  : cardHeight
                
                return (
                  <React.Fragment key={entry.id}>
                    {/* Center Entry Background Pill - breaks timeline visually */}
                    {centerY !== undefined && (
                      <div 
                        className="center-entry-pill absolute"
                        style={{
                          left: '50%',
                          transform: 'translateX(-50%)',
                          top: `${centerY - 10}px`, /* Extend 10px above to accommodate fade */
                          width: `${RESUME_CENTER_CARD_WIDTH_PX}px`,
                          height: `${expandedHeight + 20}px`, /* Extend 20px total (10px top + 10px bottom) to accommodate fade */
                          transition: 'top 300ms ease-out, height 300ms ease-out'
                        }}
                      />
                    )}
                    <EntryCard 
                      entry={entry}
                      position='center'
                      index={index}
                      isExpanded={expandedEntries.has(entry.id)}
                      onToggleExpand={() => toggleExpand(entry.id)}
                      onHeightMeasured={onCardHeightMeasured}
                      markerPositions={markerPositions}
                      centerAdjustedY={centerY}
                      onOpenCollection={onOpenCollection}
                      onOpenContent={onOpenContent}
                      isMobile={isMobile}
                    />
                  </React.Fragment>
                )
              })}
            </div>
          )}
        </motion.div>
      )}
    </div>
  )
}

function DebugWindow({ 
  debugSettings, 
  entries,
  transformedEntries,
  sideEntries,
  centerEntries,
  cardHeights,
  expandedEntries,
  operationalMonths,
  activatedMarkers,
  greenMarkers,
  blueMarkers,
  greenActivatedMarkers,
  blueActivatedMarkers,
  markerHeights,
  monthToEntriesMap,
  standardCard,
  standardHeight,
  timelineHeight
}: { 
  debugSettings: DebugSettings
  entries: ResumeEntryRaw[]
  transformedEntries: ResumeEntry[]
  sideEntries: ResumeEntry[]
  centerEntries: ResumeEntry[]
  cardHeights: Map<string, { collapsed: number, expanded?: number }>
  expandedEntries: Set<string>
  operationalMonths: Date[]
  activatedMarkers: Set<string>
  greenMarkers: Set<string>
  blueMarkers: Set<string>
  greenActivatedMarkers: Set<string>
  blueActivatedMarkers: Set<string>
  markerHeights: Map<string, number>
  monthToEntriesMap: Map<string, string[]>
  standardCard: ResumeEntry | null
  standardHeight: number | null
  timelineHeight: number
}) {
  const [markersExpanded, setMarkersExpanded] = useState(false)
  
  const formatDate = (date: Date | null): string => {
    if (!date) return 'Present'
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`
  }
  
  const formatMonthDisplay = (monthKey: string): string => {
    const [year, month] = monthKey.split('-')
    const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                        'July', 'August', 'September', 'October', 'November', 'December']
    const monthIndex = parseInt(month, 10) - 1
    return `${monthNames[monthIndex]} ${year}`
  }
  
  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-6">
      <h2 className="text-white text-xl font-bold mb-4">Resume Timeline Debug</h2>
      
      <div className="mb-4">
        <div className="text-gray-300 mb-2">
          <span className="text-white font-semibold">Featured Entries:</span> {entries.length}
        </div>
        <div className="text-gray-300 mb-2">
          <span className="text-white font-semibold">Expanded:</span> {expandedEntries.size}
        </div>
      </div>
      
      <div className="mb-4">
        <div className="text-white font-semibold mb-2">Standard Card:</div>
        {!standardCard || !standardHeight ? (
          <div className="text-gray-400 text-sm">No entries yet</div>
        ) : (
          <div className="text-sm space-y-1">
            <div className="text-gray-300">
              <span className="text-white font-semibold">Title:</span> {standardCard.title}
            </div>
            <div className="text-gray-300">
              <span className="text-white font-semibold">Start Month:</span>{' '}
              {standardCard.date_start_normalized 
                ? formatMonthDisplay(formatMonthKey(standardCard.date_start_normalized))
                : 'null'}
            </div>
            <div className="text-gray-300">
              <span className="text-white font-semibold">End Month:</span>{' '}
              {standardCard.date_end_normalized 
                ? formatMonthDisplay(formatMonthKey(standardCard.date_end_normalized))
                : 'Present'}
            </div>
            <div className="text-gray-300">
              <span className="text-white font-semibold">Month Count:</span> {standardCard.monthCount} months
            </div>
            <div className="text-gray-300">
              <span className="text-white font-semibold">Card Height:</span>{' '}
              {cardHeights.get(standardCard.id)?.collapsed || 0}px
            </div>
            <div className="text-gray-300">
              <span className="text-white font-semibold">Standard Marker Height:</span> {standardHeight}px
            </div>
          </div>
        )}
      </div>
      
      <div className="mb-4">
        <div className="text-gray-300 mb-2">
          <span className="text-white font-semibold">Timeline Height:</span> {timelineHeight.toFixed(2)}px
        </div>
        <div className="text-gray-300 mb-2">
          <span className="text-white font-semibold">Operational Markers:</span> {operationalMonths.length}
        </div>
        <div className="text-gray-300 mb-2">
          <span className="text-white font-semibold">Activated Markers:</span> {activatedMarkers.size}
        </div>
      </div>
      
      <div className="mb-4">
        <div className="text-white font-semibold mb-2">Entries:</div>
        {transformedEntries.length === 0 ? (
          <div className="text-gray-400 text-sm">No entries loaded</div>
        ) : (
          <div className="space-y-2">
            {transformedEntries.map(entry => {
              const height = cardHeights.get(entry.id)
              return (
                <div key={entry.id} className="text-gray-300 text-sm font-mono">
                  <div className="text-white font-semibold">{entry.title}</div>
                  <div className="text-xs text-gray-400 mt-1">
                    <span className={
                      entry.position === 'left' ? 'text-yellow-400' :
                      entry.position === 'right' ? 'text-green-400' :
                      'text-red-400'
                    }>
                      [{entry.position.toUpperCase()}]
                    </span>
                    {' | '}
                    {formatDate(entry.date_end_normalized)} → {formatDate(entry.date_start_normalized)}
                    {' | '}
                    {entry.monthCount} month{entry.monthCount !== 1 ? 's' : ''}
                  </div>
                  {height && (
                    <div className="text-xs text-gray-500 mt-1">
                      <div>Height: {height.collapsed}px (collapsed)</div>
                      {height.expanded && (
                        <div>Height: {height.expanded}px (expanded)</div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
      
      <div className="border-t border-gray-800 pt-4">
        <button 
          onClick={() => setMarkersExpanded(!markersExpanded)}
          className="text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-2"
        >
          Show Markers {markersExpanded ? '▲' : '▼'}
        </button>
        
        {markersExpanded && (
          <div className="mt-3 text-gray-400 text-sm">
            {operationalMonths.length === 0 ? (
              <p className="mb-2">No markers yet (no entries loaded)</p>
            ) : (
              <>
                <p className="text-xs text-gray-500 mb-3">
                  Marker debug mode: Toggle in admin panel to visualize operational markers on timeline (Step 4.3+)
                </p>
                
                <div className="mb-3 pb-3 border-b border-gray-700">
                  <p className="text-xs">
                    <span className="text-gray-400">Marker Debug Mode:</span>{' '}
                    <span className={debugSettings.showAllMarkers ? 'text-emerald-400' : 'text-gray-500'}>
                      {debugSettings.showAllMarkers ? 'ON' : 'OFF'}
                    </span>
                  </p>
                </div>
                
                <div className="space-y-1 max-h-60 overflow-y-auto">
                  {operationalMonths.map((month, index) => {
                    const monthKey = formatMonthKey(month)
                    const isActivated = activatedMarkers.has(monthKey)
                    const isGreen = greenMarkers.has(monthKey)
                    const isBlue = blueMarkers.has(monthKey)
                    const isGreenActivated = greenActivatedMarkers.has(monthKey)
                    const isBlueActivated = blueActivatedMarkers.has(monthKey)
                    const height = markerHeights.get(monthKey) || 0
                    
                    return (
                      <div key={monthKey} className="text-xs flex items-center gap-2">
                        <span className="w-3">{isActivated ? '✓' : '○'}</span>
                        <span className="w-32">{formatMonthDisplay(monthKey)}</span>
                        <span className="w-16 text-gray-500">{height}px</span>
                        {isActivated && (
                          <>
                            {isGreenActivated && isBlueActivated ? (
                              <span className="flex items-center gap-1">
                                <span className="text-emerald-400">(green)</span>
                                <span className="text-blue-400">(blue)</span>
                              </span>
                            ) : isGreen && isBlue ? (
                              <span className="text-purple-400">(green+blue)</span>
                            ) : isGreen ? (
                              <span className="text-emerald-400">(green)</span>
                            ) : isBlue ? (
                              <span className="text-blue-400">(blue)</span>
                            ) : null}
                          </>
                        )}
                      </div>
                    )
                  })}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function formatDateRange(start: Date | null, end: Date | null): string {
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December']
  
  const formatMonth = (date: Date | null): string => {
    if (!date) return 'Present'
    return `${monthNames[date.getMonth()]} ${date.getFullYear()}`
  }
  
  if (!start) {
    return formatMonth(end)
  }
  
  const startStr = formatMonth(start)
  const endStr = formatMonth(end)
  
  return `${startStr} → ${endStr}`
}

function formatSingleDate(date: Date | null): string {
  if (!date) return 'Present'
  
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December']
  
  return `${monthNames[date.getMonth()]} ${date.getFullYear()}`
}

function shouldShowExpandButton(entry: ResumeEntry): boolean {
  return entry.description !== null && entry.description !== undefined
}

function shouldShowSamplesButton(entry: ResumeEntry): boolean {
  return entry.collection_id !== null
}

function shouldShowExpandButtonCenter(entry: ResumeEntry): boolean {
  return entry.short_description !== null && 
         entry.short_description !== undefined && 
         entry.short_description !== ''
}

function calculateRequiredHeights(
  transformedEntries: ResumeEntry[],
  cardHeights: Map<string, {collapsed: number, expanded?: number}>,
  expandedEntries: Set<string>
): Map<string, Map<string, number>> {
  const requiredHeightsMap = new Map<string, Map<string, number>>()
  
  
  for (const entry of transformedEntries) {
    const isExpanded = expandedEntries.has(entry.id)
    const entryHeight = isExpanded 
      ? (cardHeights.get(entry.id)?.expanded || cardHeights.get(entry.id)?.collapsed)
      : cardHeights.get(entry.id)?.collapsed
    
    if (!entryHeight) {
      continue
    }
    
    const requiredPerMonth = entryHeight / entry.monthCount
    
    let startDate = entry.date_start_normalized
    let endDate = entry.date_end_normalized
    
    if (!endDate) {
      if (entry.position === 'left' || entry.position === 'right') {
        endDate = getCurrentMonthEST()
      } else {
        endDate = startDate
      }
    }
    
    if (!startDate) {
      startDate = endDate
    }
    
    const monthSpan = getMonthsInRange(startDate, endDate)
    
    for (const month of monthSpan) {
      const monthKey = formatMonthKey(month)
      
      if (!requiredHeightsMap.has(monthKey)) {
        requiredHeightsMap.set(monthKey, new Map<string, number>())
      }
      
      requiredHeightsMap.get(monthKey)!.set(entry.id, requiredPerMonth)
    }
  }

  return requiredHeightsMap
}

function applyMaximumHeights(
  requiredHeightsMap: Map<string, Map<string, number>>,
  operationalMonths: Date[],
  standardHeight: number
): Map<string, number> {
  const updatedMarkerHeights = new Map<string, number>()

  for (const month of operationalMonths) {
    const monthKey = formatMonthKey(month)
    const entryRequirementsMap = requiredHeightsMap.get(monthKey)

    if (!entryRequirementsMap) {
      updatedMarkerHeights.set(monthKey, standardHeight)
    } else {
      const allRequiredHeights = Array.from(entryRequirementsMap.values())
      const maximumRequired = Math.max(...allRequiredHeights)
      const finalHeight = Math.max(standardHeight, maximumRequired)
      updatedMarkerHeights.set(monthKey, finalHeight)
    }
  }

  return updatedMarkerHeights
}

function EntryCard({ 
  entry, 
  position,
  index,
  isExpanded,
  onToggleExpand,
  onHeightMeasured,
  markerPositions,
  centerAdjustedY,
  sideAdjustedY,
  onOpenCollection,
  onOpenContent,
  isMobile = false
}: {
  entry: ResumeEntry
  position: 'left' | 'right' | 'center'
  index: number
  isExpanded: boolean
  onToggleExpand: () => void
  onHeightMeasured: (entryId: string, height: number, state: 'collapsed' | 'expanded') => void
  markerPositions: Map<string, number>
  centerAdjustedY?: number
  sideAdjustedY?: number
  onOpenCollection?: (slug: string, name: string) => void
  onOpenContent?: (id: string, title: string) => void
  isMobile?: boolean
}) {
  const normalizeLink = useCallback((url?: string | null) => {
    if (!url) return null
    const trimmed = url.trim()
    if (!trimmed) return null
    if (/^https?:\/\//i.test(trimmed)) return trimmed
    return `https://${trimmed}`
  }, [])
  const reduced = useReducedMotion()
  const fadeTrans = { duration: reduced ? 0 : 0.25 }
  const measureRef = useRef<HTMLDivElement>(null)
  const [editorReady, setEditorReady] = useState(false)
  
  const handleEditorReady = useCallback(() => {
    setEditorReady(true)
  }, [entry.title])
  
  useEffect(() => {
    if (measureRef.current && !isExpanded) {
      const height = measureRef.current.getBoundingClientRect().height
      onHeightMeasured(entry.id, height, 'collapsed')
    }
  }, [entry.id])
  
  useEffect(() => {
    const canMeasureExpanded = isExpanded && (position === 'center' || editorReady)
    
    if (canMeasureExpanded && measureRef.current) {
      requestAnimationFrame(() => {
        if (measureRef.current) {
          const height = measureRef.current.getBoundingClientRect().height
          onHeightMeasured(entry.id, height, 'expanded')
        }
      })
    }
    
    if (!isExpanded && position !== 'center') {
      setEditorReady(false)
    }
  }, [isExpanded, editorReady, entry.id, entry.title, entry.short_description, position, onHeightMeasured])
  
  // Side entry cards use CSS classes, not Tailwind classes
  const baseClasses = position === 'left' ? 'resume-entry-card-left p-6' : 
                      position === 'right' ? 'resume-entry-card-right p-6' : 
                      '' // Center entries handled separately
  
  let topPosition = 0 // Will be set from markerPositions Map
  
  if (position === 'center') {
    
    if (centerAdjustedY !== undefined) {
      topPosition = centerAdjustedY
      
    } else {
      const positioningDate = entry.date_end_normalized || entry.date_start_normalized
      if (positioningDate) {
        const monthKey = formatMonthKey(positioningDate)
        const markerYPosition = markerPositions.get(monthKey) ?? 0
        topPosition = markerYPosition
      }
    }
  } else {
    if (sideAdjustedY !== undefined) {
      topPosition = sideAdjustedY
    } else {
      const positioningDate = entry.date_end_normalized || getCurrentMonthEST()
      const monthKey = formatMonthKey(positioningDate)
      const markerYPosition = markerPositions.get(monthKey) ?? 0
      topPosition = markerYPosition
    }
  }
  
  const dateRange = formatDateRange(entry.date_start_normalized, entry.date_end_normalized)
  
  if (isMobile) {
    // Center entries have different visual styling (no card background/border, drop shadow) and are centered
    if (position === 'center') {
      return (
        <div
          ref={measureRef}
          className="py-3 px-2 w-full text-center relative resume-entry-card-center"
        >
          <div className="resume-entry-date text-sm mb-2">
            {formatSingleDate(entry.date_end_normalized || entry.date_start_normalized)}
          </div>

          <h3 className="text-xl font-bold resume-entry-title mb-2">
            {entry.title}
          </h3>

          <AnimatePresence>
            {isExpanded && entry.short_description && (
              <motion.div
                key="center-desc-mobile"
                className="resume-entry-description text-sm mb-3"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={fadeTrans}
              >
                {entry.short_description}
              </motion.div>
            )}
          </AnimatePresence>

          {entry.date_start_normalized && entry.date_end_normalized && (
            <div className="resume-entry-date text-sm mb-3">
              {formatSingleDate(entry.date_start_normalized)}
            </div>
          )}

          {shouldShowExpandButtonCenter(entry) && (
            <div
              onClick={onToggleExpand}
              className="center-entry-expand-btn text-sm cursor-pointer"
            >
              {isExpanded ? '▲' : '▼'}
            </div>
          )}
        </div>
      )
    }
    
    // Side entries (left/right) use card styling
    return (
      <div
        ref={measureRef}
        data-resume-entry-id={entry.id}
        className={`${baseClasses} w-full text-left relative${isExpanded ? ' is-expanded' : ''}`}
      >
        <div className={`resume-entry-date text-sm mb-3 ${dateRange.includes('Present') ? 'has-present' : ''}`}>
          {dateRange}
        </div>

        <h3 className="text-xl font-bold resume-entry-title mb-1">
          {entry.title}
        </h3>

        {entry.subtitle && (
          <div className="resume-entry-subtitle text-base mb-2">
            {entry.subtitle}
          </div>
        )}

        {entry.short_description && (
          <div className="resume-entry-description text-base mb-4">
            {entry.short_description}
          </div>
        )}

        <AnimatePresence>
          {isExpanded && entry.description && isBlockNoteFormat(entry.description) && (
            <motion.div
              key="side-desc-mobile"
              className="resume-entry-description-expanded overflow-hidden mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={fadeTrans}
            >
              <BlockNoteRenderer data={entry.description} imageSizes={entry.description_image_sizes} onReady={handleEditorReady} />
            </motion.div>
          )}
        </AnimatePresence>

        {entry.resume_assets && entry.resume_assets.length > 0 && (() => {
          const items: ResumeAssetItem[] = entry.resume_assets.map(asset => ({
            id: asset.id,
            caption: asset.custom_caption || asset.content?.title || asset.link_title || 'Asset',
            shortTitle: asset.content?.short_title ?? null,
            thumbnail: asset.content?.menu_thumbnail_url ?? asset.thumbnail_url ?? null,
            periDesc: asset.content?.peri_desc ?? null,
            shortDesc: asset.content?.short_desc ?? null,
            iconUrl: asset.resume_asset_icons?.icon_url,
            assetType: asset.asset_type,
            onClick: () => {
              if (asset.asset_type === 'content' && asset.content_id) {
                onOpenContent?.(asset.content_id, asset.content?.title || 'Content')
              } else if (asset.asset_type === 'link' && asset.link_url) {
                const href = normalizeLink(asset.link_url)
                if (href) window.open(href, '_blank', 'noopener,noreferrer')
              }
            },
          }))
          const triads: ResumeAssetItem[][] = []
          for (let i = 0; i < items.length; i += 3) triads.push(items.slice(i, i + 3))
          return (
            <div className="flex flex-col gap-1 mb-3">
              {triads.map((triad, i) => <ResumeAssetGroup key={i} assets={triad} isMobile={isMobile} />)}
            </div>
          )
        })()}

        <div className="resume-entry-actions">
          <div></div>
          {shouldShowExpandButton(entry) && (
            <div
              onClick={onToggleExpand}
              className="resume-entry-action text-sm cursor-pointer"
            >
              {isExpanded ? 'Collapse ▲' : 'Expand ▼'}
            </div>
          )}
        </div>
      </div>
    )
  }
  
  // Desktop layouts below
  if (position === 'left') {
    return (
      <div
        ref={measureRef}
        data-resume-entry-id={entry.id}
        className={`${baseClasses} absolute${isExpanded ? ' is-expanded' : ''}`}
        style={{
          width: `${RESUME_SIDE_CARD_WIDTH_PX}px`,
          right: `calc(50% + ${RESUME_SIDE_CARD_OFFSET_PX}px)`,
          top: `${topPosition}px`,
          transition: 'top 300ms ease-out'
        }}
      >
        <div className={`resume-entry-date mb-3 ${dateRange.includes('Present') ? 'has-present' : ''}`}>
          {dateRange}
        </div>
        
        <h3 className="resume-entry-title mb-1">
          {entry.title}
        </h3>
        
        {entry.subtitle && (
          <div className="resume-entry-subtitle mb-2">
            {entry.subtitle}
          </div>
        )}
        
        {entry.short_description && (
          <div className="resume-entry-description mb-4">
            {entry.short_description}
          </div>
        )}
        
        <AnimatePresence>
          {isExpanded && entry.description && isBlockNoteFormat(entry.description) && (
            <motion.div
              key="side-desc-left"
              className="resume-entry-description-expanded overflow-hidden mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={fadeTrans}
            >
              <BlockNoteRenderer data={entry.description} imageSizes={entry.description_image_sizes} onReady={handleEditorReady} />
            </motion.div>
          )}
        </AnimatePresence>

        {entry.resume_assets && entry.resume_assets.length > 0 && (() => {
          const items: ResumeAssetItem[] = entry.resume_assets.map(asset => ({
            id: asset.id,
            caption: asset.custom_caption || asset.content?.title || asset.link_title || 'Asset',
            shortTitle: asset.content?.short_title ?? null,
            thumbnail: asset.content?.menu_thumbnail_url ?? asset.thumbnail_url ?? null,
            periDesc: asset.content?.peri_desc ?? null,
            shortDesc: asset.content?.short_desc ?? null,
            iconUrl: asset.resume_asset_icons?.icon_url,
            assetType: asset.asset_type,
            onClick: () => {
              if (asset.asset_type === 'content' && asset.content_id) {
                onOpenContent?.(asset.content_id, asset.content?.title || 'Content')
              } else if (asset.asset_type === 'link' && asset.link_url) {
                const href = normalizeLink(asset.link_url)
                if (href) window.open(href, '_blank', 'noopener,noreferrer')
              }
            },
          }))
          const triads: ResumeAssetItem[][] = []
          for (let i = 0; i < items.length; i += 3) triads.push(items.slice(i, i + 3))
          return (
            <div className="flex flex-col gap-1 mb-3 items-end">
              {triads.map((triad, i) => <ResumeAssetGroup key={i} assets={triad} isMobile={isMobile} />)}
            </div>
          )
        })()}

        <div className="resume-entry-actions">
          {shouldShowSamplesButton(entry) ? (
            <div
              className="resume-entry-action"
              onClick={() => {
                const slug = entry.collections?.slug
                const name = entry.collections?.name
                if (slug && name) {
                  onOpenCollection?.(slug, name)
                }
              }}
            >
              Samples →
            </div>
          ) : (
            <div></div> // Spacer if no Samples button
          )}
          
          {shouldShowExpandButton(entry) && (
            <div 
              onClick={onToggleExpand}
              className="resume-entry-action"
            >
              {isExpanded ? 'Collapse ▲' : 'Expand ▼'}
            </div>
          )}
        </div>
      </div>
    )
  }
  
  if (position === 'right') {
    return (
      <div
        ref={measureRef}
        data-resume-entry-id={entry.id}
        className={`${baseClasses} absolute${isExpanded ? ' is-expanded' : ''}`}
        style={{
          width: `${RESUME_SIDE_CARD_WIDTH_PX}px`,
          left: `calc(50% + ${RESUME_SIDE_CARD_OFFSET_PX}px)`,
          top: `${topPosition}px`,
          transition: 'top 300ms ease-out'
        }}
      >
        <div className={`resume-entry-date mb-3 ${dateRange.includes('Present') ? 'has-present' : ''}`}>
          {dateRange}
        </div>
        
        <h3 className="resume-entry-title mb-1">
          {entry.title}
        </h3>
        
        {entry.subtitle && (
          <div className="resume-entry-subtitle mb-2">
            {entry.subtitle}
          </div>
        )}
        
        {entry.short_description && (
          <div className="resume-entry-description mb-4">
            {entry.short_description}
          </div>
        )}
        
        <AnimatePresence>
          {isExpanded && entry.description && isBlockNoteFormat(entry.description) && (
            <motion.div
              key="side-desc-right"
              className="resume-entry-description-expanded overflow-hidden mb-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={fadeTrans}
            >
              <BlockNoteRenderer data={entry.description} imageSizes={entry.description_image_sizes} onReady={handleEditorReady} />
            </motion.div>
          )}
        </AnimatePresence>

        {entry.resume_assets && entry.resume_assets.length > 0 && (() => {
          const items: ResumeAssetItem[] = entry.resume_assets.map(asset => ({
            id: asset.id,
            caption: asset.custom_caption || asset.content?.title || asset.link_title || 'Asset',
            shortTitle: asset.content?.short_title ?? null,
            thumbnail: asset.content?.menu_thumbnail_url ?? asset.thumbnail_url ?? null,
            periDesc: asset.content?.peri_desc ?? null,
            shortDesc: asset.content?.short_desc ?? null,
            iconUrl: asset.resume_asset_icons?.icon_url,
            assetType: asset.asset_type,
            onClick: () => {
              if (asset.asset_type === 'content' && asset.content_id) {
                onOpenContent?.(asset.content_id, asset.content?.title || 'Content')
              } else if (asset.asset_type === 'link' && asset.link_url) {
                const href = normalizeLink(asset.link_url)
                if (href) window.open(href, '_blank', 'noopener,noreferrer')
              }
            },
          }))
          const triads: ResumeAssetItem[][] = []
          for (let i = 0; i < items.length; i += 3) triads.push(items.slice(i, i + 3))
          return (
            <div className="flex flex-col gap-1 mb-3">
              {triads.map((triad, i) => <ResumeAssetGroup key={i} assets={triad} isMobile={isMobile} />)}
            </div>
          )
        })()}

        <div className="resume-entry-actions">
          {shouldShowExpandButton(entry) && (
            <div 
              onClick={onToggleExpand}
              className="resume-entry-action"
            >
              {isExpanded ? 'Collapse ▲' : 'Expand ▼'}
            </div>
          )}
          
          {shouldShowSamplesButton(entry) ? (
            <div
              className="resume-entry-action"
              onClick={() => {
                const slug = entry.collections?.slug
                const name = entry.collections?.name
                if (slug && name) {
                  onOpenCollection?.(slug, name)
                }
              }}
            >
              Samples →
            </div>
          ) : (
            <div></div> // Spacer if no Samples button
          )}
        </div>
      </div>
    )
  }
  
  if (position === 'center') {
    return (
      <div 
        ref={measureRef}
        className="py-3 px-2 text-center absolute resume-entry-card-center"
        style={{
          width: `${RESUME_CENTER_CARD_WIDTH_PX}px`,
          left: '50%',
          transform: 'translateX(-50%)',
          top: `${topPosition}px`,
          transition: 'top 300ms ease-out'
        }}
      >
        <div className="text-sm mb-2 resume-entry-date">
          {formatSingleDate(entry.date_end_normalized || entry.date_start_normalized)}
        </div>
        
        <h3 className="text-xl font-bold mb-2 resume-entry-title">
          {entry.title}
        </h3>
        
        <AnimatePresence>
          {isExpanded && entry.short_description && (
            <motion.div
              key="center-desc-desktop"
              className="mb-3 center-entry-description"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={fadeTrans}
            >
              {entry.short_description}
            </motion.div>
          )}
        </AnimatePresence>

        {entry.date_start_normalized && entry.date_end_normalized && (
          <div className="text-sm mb-3 resume-entry-date">
            {formatSingleDate(entry.date_start_normalized)}
          </div>
        )}
        
        {shouldShowExpandButtonCenter(entry) && (
          <div 
            onClick={onToggleExpand}
            className="font-semibold text-sm cursor-pointer center-entry-expand-btn"
          >
            {isExpanded ? '▲' : '▼'}
          </div>
        )}
      </div>
    )
  }
  
  return null
}

function getCurrentMonthEST(): Date {
  const now = new Date()
  
  const estOffset = -5 * 60 // EST is UTC-5 in minutes
  const utcTime = now.getTime() + (now.getTimezoneOffset() * 60000)
  const estTime = new Date(utcTime + (estOffset * 60000))
  
  return new Date(estTime.getFullYear(), estTime.getMonth(), 1)
}

function normalizeDate(dateString: string | null): Date | null {
  if (!dateString) return null
  
  const [year, month, day] = dateString.split('-').map(Number)
  
  const date = new Date(year, month - 1, 1)
  
  return date
}

function countMonths(start: Date | null, end: Date | null): number {
  if (!start && !end) return 0
  if (!start) start = end! // Missing start = treat as equal to end
  if (!end) end = getCurrentMonthEST() // Missing end = treat as Present
  
  const yearDiff = end.getFullYear() - start.getFullYear()
  const monthDiff = end.getMonth() - start.getMonth()
  const totalMonths = yearDiff * 12 + monthDiff + 1 // +1 for inclusive counting
  
  return Math.max(1, totalMonths)
}

function formatMonthKey(date: Date): string {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  return `${year}-${month}`
}

function getMonthsInRange(start: Date | null, end: Date | null): Date[] {
  if (!start || !end) return []
  
  const months: Date[] = []
  const current = new Date(start.getFullYear(), start.getMonth(), 1)
  const endDate = new Date(end.getFullYear(), end.getMonth(), 1)
  
  while (current <= endDate) {
    months.push(new Date(current))
    current.setMonth(current.getMonth() + 1)
  }
  
  return months
}

function calculateStartMarker(entries: ResumeEntry[]): Date | null {
  if (entries.length === 0) return null
  
  let earliestDate: Date | null = null
  
  for (const entry of entries) {
    const startCandidate = entry.date_start_normalized || entry.date_end_normalized || getCurrentMonthEST()
    if (!earliestDate || startCandidate < earliestDate) {
      earliestDate = startCandidate
    }
  }
  
  return earliestDate
}

function generateOperationalMonths(startMarker: Date | null, nowMarker: Date): Date[] {
  if (!startMarker) return [nowMarker]
  
  return getMonthsInRange(startMarker, nowMarker)
}

function calculateMarkerPositions(
  operationalMonths: Date[],
  markerHeights: Map<string, number>,
  standardHeight: number | null
): Map<string, number> {
  const positions = new Map<string, number>()
  
  if (operationalMonths.length === 0) return positions
  
  let yOffset = 0

  for (let i = operationalMonths.length - 1; i >= 0; i--) {
    const month = operationalMonths[i]
    const monthKey = formatMonthKey(month)

    positions.set(monthKey, yOffset)

    const height = markerHeights.get(monthKey) ?? standardHeight ?? 50
    yOffset += height
  }
  
  return positions
}

function calculateStandardCard(sideEntries: ResumeEntry[]): ResumeEntry | null {
  if (sideEntries.length === 0) return null
  
  const maxMonthCount = Math.max(...sideEntries.map(e => e.monthCount))
  
  let candidates = sideEntries.filter(e => e.monthCount === maxMonthCount)
  
  if (candidates.length === 1) return candidates[0]
  
  let minEndDate: Date | null = null
  for (const entry of candidates) {
    const endDate = entry.date_end_normalized
    if (endDate) {
      if (!minEndDate || endDate < minEndDate) {
        minEndDate = endDate
      }
    }
  }
  
  if (minEndDate) {
    const tier1Candidates = candidates.filter(e => 
      e.date_end_normalized && e.date_end_normalized.getTime() === minEndDate.getTime()
    )
    if (tier1Candidates.length === 1) return tier1Candidates[0]
    candidates = tier1Candidates
  }
  
  let maxStartDate: Date | null = null
  for (const entry of candidates) {
    const startDate = entry.date_start_normalized
    if (startDate) {
      if (!maxStartDate || startDate > maxStartDate) {
        maxStartDate = startDate
      }
    }
  }
  
  if (maxStartDate) {
    const tier2Candidates = candidates.filter(e => 
      e.date_start_normalized && e.date_start_normalized.getTime() === maxStartDate.getTime()
    )
    if (tier2Candidates.length === 1) return tier2Candidates[0]
    candidates = tier2Candidates
  }
  
  const minOrderIndex = Math.min(...candidates.map(e => e.order_index))
  const finalCandidate = candidates.find(e => e.order_index === minOrderIndex)
  
  return finalCandidate || candidates[0] // Fallback to first if somehow still tied
}

type ResumeEntry = ResumeEntryRaw & {
  date_start_normalized: Date | null
  date_end_normalized: Date | null
  has_end_date_original: boolean
  monthCount: number
  position: 'left' | 'right' | 'center'
}

function Timeline({
  nowMarkerRef,
  debugSettings,
  operationalMonths,
  activatedMarkers,
  greenActivatedMarkers,
  blueActivatedMarkers,
  markerPositions,
  timelineHeight,
}: {
  nowMarkerRef: RefObject<HTMLDivElement | null>
  debugSettings: DebugSettings
  operationalMonths: Date[]
  activatedMarkers: Set<string>
  greenActivatedMarkers: Set<string>
  blueActivatedMarkers: Set<string>
  markerPositions: Map<string, number>
  timelineHeight: number
}) {
  const markersToRender = debugSettings.showAllMarkers
    ? operationalMonths // Debug mode: show all operational markers
    : operationalMonths.filter(month => { // Normal mode: only activated markers
        const monthKey = formatMonthKey(month)
        return activatedMarkers.has(monthKey)
      })
  
  return (
    <div className="relative w-full">
      <div ref={nowMarkerRef} className="absolute left-1/2 -translate-x-1/2 top-0" aria-hidden="true" />

      {/* Decorative gradient cap — visually extends the timeline line upward into the top gap. Pure visual, no logic. */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          top: '-32px',
          width: '4px',
          height: '32px',
          background: 'linear-gradient(to bottom, transparent 0%, rgba(122, 48, 32, 0.75) 100%)',
          filter: 'blur(0.5px)',
          pointerEvents: 'none',
          zIndex: 1,
        }}
      />

      {/* All background pills in one container - same stacking context */}
      <div className="absolute left-1/2 -translate-x-1/2" style={{ top: '0', zIndex: 2 }}>
        {markersToRender.map((month) => {
          const monthKey = formatMonthKey(month)
          const yPosition = markerPositions.get(monthKey) ?? 0

          const isBlueActivated = blueActivatedMarkers.has(monthKey)
          const isGreenActivated = greenActivatedMarkers.has(monthKey)
          
          let markerType: 'green' | 'blue' | 'operational'
          if (isBlueActivated) {
            markerType = 'blue'
          } else if (isGreenActivated) {
            markerType = 'green'
          } else {
            markerType = 'operational'
          }
          
          if (markerType === 'blue') {
            return null
          }
          
          const opacityClass = markerType === 'operational' ? 'opacity-40' : 'opacity-100'
          const [year, monthNum] = monthKey.split('-')
          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                            'July', 'August', 'September', 'October', 'November', 'December']
          const monthName = monthNames[parseInt(monthNum) - 1]
          const label = `${monthName} ${year}`

          return (
            <div
              key={`pill-${monthKey}`}
              className="absolute left-1/2 -translate-x-1/2"
              style={{ top: `${yPosition}px` }}
            >
              <div className="relative inline-block">
                {/* Invisible text to size the pill container */}
                <span style={{ visibility: 'hidden', padding: '4px 12px', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>
                  {label}
                </span>
                {/* Background pill - breaks the timeline visually */}
                <div className={`timeline-month-marker-pill ${opacityClass}`} />
              </div>
            </div>
          )
        })}
      </div>
      
      {/* All text in another container - same stacking context, above pills */}
      <div className="absolute left-1/2 -translate-x-1/2" style={{ top: '0', zIndex: 3 }}>
        {markersToRender.map((month) => {
          const monthKey = formatMonthKey(month)
          const yPosition = markerPositions.get(monthKey) ?? 0

          const isBlueActivated = blueActivatedMarkers.has(monthKey)
          const isGreenActivated = greenActivatedMarkers.has(monthKey)
          
          let markerType: 'green' | 'blue' | 'operational'
          if (isBlueActivated) {
            markerType = 'blue'
          } else if (isGreenActivated) {
            markerType = 'green'
          } else {
            markerType = 'operational'
          }
          
          if (markerType === 'blue') {
            return null
          }
          
          const [year, monthNum] = monthKey.split('-')
          const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                            'July', 'August', 'September', 'October', 'November', 'December']
          const monthName = monthNames[parseInt(monthNum) - 1]
          const label = `${monthName} ${year}`

          return (
            <div
              key={`text-${monthKey}`}
              className="absolute left-1/2 -translate-x-1/2"
              style={{ top: `${yPosition}px` }}
            >
              <div className="relative inline-block">
                <span className="timeline-month-marker-text">
                  {label}
                </span>
              </div>
            </div>
          )
        })}
      </div>
      
      <div 
        className="absolute left-1/2 -translate-x-1/2 w-1 timeline-line"
        style={{
          top: '0',
          height: `${timelineHeight + 300}px`,
          transition: 'height 300ms ease-out, background 300ms ease-out',
          zIndex: 1 // Explicitly set z-index to ensure it's below marker pills
        }}
      >
      </div>
      
      <div 
        className="absolute left-1/2 -translate-x-1/2 text-center"
        style={{ top: `${timelineHeight + 300}px` }}
      >
        <span className="timeline-birth-marker">
          Born in Moscow, Russia - July 1st, 1994
        </span>
      </div>
    </div>
  )
}
