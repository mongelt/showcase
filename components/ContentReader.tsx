'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import dynamic from 'next/dynamic'

const AudioPlayer = dynamic(() => import('@/components/AudioPlayer'), { ssr: false })
const VideoPlayer = dynamic(() => import('@/components/VideoPlayer'), { ssr: false })
import { useMobileState } from '@/lib/responsive'
import { BOTTOM_NAV_HEIGHT_PX } from '@/lib/constants'


import BlockNoteRenderer from '@/components/BlockNoteRendererDynamic'
import Loader from '@/components/Loader'

// Helper function to check if data is in BlockNote format (array of PartialBlock)
function isBlockNoteFormat(data: any): boolean {
  return Array.isArray(data) && data.length > 0 && data.every((block: any) => block && typeof block === 'object' && 'id' in block && 'type' in block)
}

interface ContentItem {
  id: string
  type: string
  category_id: string
  subcategory_id: string
  title: string
  subtitle: string | null
  sidebar_title: string | null
  sidebar_subtitle: string | null
  featured: boolean
  byline_style: string | null
  link_style: string | null
  content_body?: any
  image_sizes?: Record<string, { width?: number; height?: number }>
  image_url?: string
  video_url?: string
  audio_url?: string
  author_name?: string
  publication_name?: string
  publication_date?: string
  source_link?: string
  original_source_url?: string
  order_index?: number
  created_at?: string
  publication_year?: number | null
  byline_style_text?: string | null
  link_style_text?: string | null
  category_name?: string
  subcategory_name?: string
  collection_slugs?: string[]
  collection_names?: string[]
}

interface ContentReaderProps {
  content: ContentItem | null
  isVisible: boolean
  error?: string | null
  onRetry?: () => void
  onTitleVisibilityChange?: (state: { titleInView: boolean; subtitleInView: boolean }) => void
}

export default function ContentReader({ content, isVisible, error, onRetry, onTitleVisibilityChange }: ContentReaderProps) {
  const { isMobile } = useMobileState()
  const titleRef = useRef<HTMLHeadingElement | null>(null)
  const subtitleRef = useRef<HTMLHeadingElement | null>(null)
  const notifyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const onTitleVisibilityChangeRef = useRef(onTitleVisibilityChange)
  useEffect(() => { onTitleVisibilityChangeRef.current = onTitleVisibilityChange }, [onTitleVisibilityChange])

  useEffect(() => {
    if (!onTitleVisibilityChangeRef.current) return
    if (!isVisible || !content) {
      onTitleVisibilityChangeRef.current({ titleInView: true, subtitleInView: true })
      return
    }
    if (typeof IntersectionObserver === 'undefined') {
      onTitleVisibilityChangeRef.current({ titleInView: true, subtitleInView: true })
      return
    }

    let currentTitleInView = true
    let currentSubtitleInView = true

    const notify = () => {
      onTitleVisibilityChangeRef.current?.({
        titleInView: currentTitleInView,
        subtitleInView: currentSubtitleInView
      })
    }

    const DEBOUNCE_MS = 200
    const scheduleNotify = () => {
      if (notifyTimerRef.current) {
        clearTimeout(notifyTimerRef.current)
      }
      notifyTimerRef.current = setTimeout(() => {
        notify()
        notifyTimerRef.current = null
      }, DEBOUNCE_MS)
    }

    const getMenuBarBottom = () => {
      if (typeof document === 'undefined') return 0
      const menuBar = document.querySelector('[data-portfolio-menu-bar]')
      if (!menuBar) return 0
      const rect = menuBar.getBoundingClientRect()
      return rect.bottom || 0
    }

    const HIDE_TRIGGER_OFFSET_PX = 6

    const computeInView = (rect: DOMRect | null) => {
      if (!rect) return true
      const menuBarBottom = getMenuBarBottom()
      if (menuBarBottom > 0) {
        return rect.bottom > (menuBarBottom + HIDE_TRIGGER_OFFSET_PX)
      }
      return rect.bottom > 0 && rect.top < window.innerHeight
    }

    const updateFromRects = () => {
      currentTitleInView = computeInView(titleRef.current?.getBoundingClientRect() || null)
      currentSubtitleInView = computeInView(subtitleRef.current?.getBoundingClientRect() || null)
      scheduleNotify()
    }

    const observer = new IntersectionObserver(() => {
      updateFromRects()
    }, {
      root: null,
      threshold: [0, 0.05, 0.1, 1],
      rootMargin: '0px'
    })

    if (titleRef.current) {
      observer.observe(titleRef.current)
    } else {
      currentTitleInView = true
      scheduleNotify()
    }
    if (subtitleRef.current) {
      observer.observe(subtitleRef.current)
    } else {
      currentSubtitleInView = true
      scheduleNotify()
    }

    if (typeof window !== 'undefined') {
      window.addEventListener('scroll', updateFromRects, { passive: true })
      window.addEventListener('resize', updateFromRects)
    }

    updateFromRects()

    return () => {
      observer.disconnect()
      if (typeof window !== 'undefined') {
        window.removeEventListener('scroll', updateFromRects)
        window.removeEventListener('resize', updateFromRects)
      }
      if (notifyTimerRef.current) {
        clearTimeout(notifyTimerRef.current)
        notifyTimerRef.current = null
      }
    }
  }, [content, isVisible])

  if (!isVisible || !content) return null

  // Desktop positioning
  const marginTop = '70px' // Collapsed: tight below menu bar
  const marginRight = '50px' // Gap from right edge (layout-reset.md line 323)
  const marginLeft = 'calc(var(--info-menu-width) + 30px)' // Starts after Info Menu (280px + 30px gap)
  
  // Mobile positioning: full width with 15px margins, fills space between menu and bottom nav
  const mobileStyles = isMobile ? {
    position: 'relative' as const,
    width: '100%',
    marginTop: '0',
    marginLeft: '0',
    marginRight: '0',
    paddingLeft: '15px',
    paddingRight: '15px',
    paddingBottom: `${BOTTOM_NAV_HEIGHT_PX + 24}px`
  } : {
    position: 'relative' as const,
    marginTop,
    marginLeft,
    marginRight,
    paddingBottom: 'calc(var(--tab-bar-height, 64px) + 24px)'
  }

  const isArticleLoading = content.type === 'article' && !content.content_body && !error

  return (
    <motion.div
      className="flex-1 content-reader"
      style={mobileStyles}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      <div 
        className="text-[#e5e7eb]"
        style={{
          position: 'relative',
          zIndex: 2
        }}
      >
        <h1 ref={titleRef} className="content-title">{content.title}</h1>
        {content.subtitle && (
          <h2 ref={subtitleRef} className="content-subtitle">{content.subtitle}</h2>
        )}
        {isArticleLoading && (
          <div className="mt-8">
            <Loader />
          </div>
        )}
        {error && content.type === 'article' && !content.content_body && (
          <div className="mt-8 flex flex-col gap-3">
            <p className="text-text-on-dark-inactive text-sm">{error}</p>
            {onRetry && (
              <button
                onClick={onRetry}
                className="self-start text-sm text-accent-dark hover:text-accent-emerald-300 transition-colors"
              >
                Try again
              </button>
            )}
          </div>
        )}
        {content.type === 'article' && content.content_body && isBlockNoteFormat(content.content_body) && (
          <div className="content-body">
            <BlockNoteRenderer data={content.content_body} imageSizes={content.image_sizes} />
          </div>
        )}
        {content.type === 'image' && content.image_url && (
          <div className="my-8 flex justify-center">
            <img 
              src={content.image_url} 
              alt={content.title}
              className="max-w-full h-auto rounded-lg"
              loading="lazy"
              decoding="async"
              style={{ objectFit: 'contain' }}
            />
          </div>
        )}
        {content.type === 'video' && content.video_url && (
          <VideoPlayer videoUrl={content.video_url} title={content.title} />
        )}
        {content.type === 'audio' && content.audio_url && (
          <AudioPlayer audioUrl={content.audio_url} />
        )}
      </div>
    </motion.div>
  )
}

