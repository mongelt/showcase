'use client'

import { useEffect, useRef, useState } from 'react'
import { useCreateBlockNote } from '@blocknote/react'
import { BlockNoteView } from '@blocknote/mantine'
import '@blocknote/core/fonts/inter.css'
import '@blocknote/mantine/style.css'
import '@/lib/blocknote/styles/theme.css'
import { schema } from '@/lib/blocknote/schema'
import type { CustomPartialBlock } from '@/lib/blocknote'

type ImageSizeMap = Record<string, { width?: number; height?: number }>

interface BlockNoteRendererProps {
  data?: CustomPartialBlock[]
  imageSizes?: ImageSizeMap
  onReady?: () => void
}

export default function BlockNoteRenderer({ 
  data, 
  imageSizes, 
  onReady 
}: BlockNoteRendererProps) {
  const holderRef = useRef<HTMLDivElement>(null)
  const onReadyRef = useRef(onReady)
  const imageSizesRef = useRef<ImageSizeMap | null>(imageSizes || null)
  const [isReady, setIsReady] = useState(false)
  const lastDataRef = useRef<string | null>(null)
  const isInitializingRef = useRef(false)
  const replaceBlocksTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Update refs when props change
  useEffect(() => {
    onReadyRef.current = onReady
  }, [onReady])

  useEffect(() => {
    imageSizesRef.current = imageSizes || null
  }, [imageSizes])

  // Create editor instance - MUST be called unconditionally (Rules of Hooks)
  // Use empty array if no data to avoid initializing with content
  // Pass custom schema to useCreateBlockNote (per custom-schemas/index.mdx lines 96-102)
  const editor = useCreateBlockNote({
    schema,
    initialContent: (data && data.length > 0) ? data : undefined,
  })

  // Handle onReady callback - fire after renderer is ready
  useEffect(() => {
    if (editor && !isReady && !isInitializingRef.current) {
      isInitializingRef.current = true
      setIsReady(true)
      if (onReadyRef.current) {
        onReadyRef.current()
      }
    }
  }, [editor, isReady])

  // Handle initial content loading when data prop changes
  useEffect(() => {
    if (!editor || !data) return

    // Ensure data is an array (BlockNote format)
    if (!Array.isArray(data)) {
      return
    }

    // Serialize data to avoid unnecessary updates
    const serialized = JSON.stringify(data)
    if (serialized === lastDataRef.current) {
      return
    }
    lastDataRef.current = serialized

    // Replace document content when data prop changes
    // Use setTimeout to avoid flushSync error (React cannot flush during render)
    if (replaceBlocksTimerRef.current) clearTimeout(replaceBlocksTimerRef.current)
    replaceBlocksTimerRef.current = setTimeout(() => {
      replaceBlocksTimerRef.current = null
      try {
        editor.replaceBlocks(editor.document, data)
      } catch (error) {
        console.warn('BlockNote Renderer: Error replacing blocks:', error)
      }
    }, 0)
    return () => { if (replaceBlocksTimerRef.current) clearTimeout(replaceBlocksTimerRef.current) }
  }, [editor, data])

  // Handle imageSizes prop - only apply width, let browser calculate height to preserve aspect ratio
  // This aligns with BlockNote's architecture (only stores previewWidth)
  useEffect(() => {
    if (!editor || !imageSizesRef.current || !isReady) return
    if (typeof window === 'undefined') return

    const applyImageSizes = () => {
      const holder = holderRef.current
      const sizes = imageSizesRef.current
      if (!holder || !sizes) return

      // Find all images in the BlockNote renderer
      const images = holder.querySelectorAll('img')
      images.forEach((img) => {
        const imageEl = img as HTMLImageElement
        const src = imageEl.getAttribute('src') || ''
        if (!src) return

        const size = sizes[src]
        if (!size || !size.width) return

        // Only apply width - browser will calculate height to maintain aspect ratio
        // This prevents distortion from incorrect height calculations
        imageEl.setAttribute('width', String(size.width))
        imageEl.style.width = `${size.width}px`
        imageEl.style.height = 'auto' // Let browser maintain aspect ratio
        imageEl.setAttribute('data-has-custom-size', 'true')
      })
    }

    // Apply image sizes after a short delay to ensure DOM is ready
    const timer = setTimeout(applyImageSizes, 100)
    const raf = requestAnimationFrame(applyImageSizes)
    
    // Also observe for dynamic image loading
    const observer = new MutationObserver(() => {
      applyImageSizes()
    })
    
    if (holderRef.current) {
      observer.observe(holderRef.current, { childList: true, subtree: true })
    }

    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [editor, isReady])

  // Handle lazy loading - check if BlockNote applies natively, if not add loading="lazy" attributes via DOM manipulation
  useEffect(() => {
    if (!isReady || typeof window === 'undefined') return
    const holder = holderRef.current
    if (!holder) return

    const applyLazyLoading = () => {
      // Apply lazy loading to images
      const images = holder.querySelectorAll('img')
      images.forEach((img) => {
        const imageEl = img as HTMLImageElement
        if (!imageEl.getAttribute('loading')) {
          imageEl.setAttribute('loading', 'lazy')
        }
        if (!imageEl.getAttribute('decoding')) {
          imageEl.setAttribute('decoding', 'async')
        }
      })

      // Apply lazy loading to iframes
      const iframes = holder.querySelectorAll('iframe')
      iframes.forEach((iframe) => {
        const iframeEl = iframe as HTMLIFrameElement
        if (!iframeEl.getAttribute('loading')) {
          iframeEl.setAttribute('loading', 'lazy')
        }
      })
    }

    // Apply lazy loading after a short delay
    const timer = setTimeout(applyLazyLoading, 100)
    const raf = requestAnimationFrame(applyLazyLoading)
    
    // Observe for dynamic content
    const observer = new MutationObserver(() => {
      applyLazyLoading()
    })
    
    observer.observe(holder, { childList: true, subtree: true })

    return () => {
      clearTimeout(timer)
      cancelAnimationFrame(raf)
      observer.disconnect()
    }
  }, [isReady])

  // Handle empty/null data - render structure but don't show BlockNoteView
  if (!data || !Array.isArray(data) || data.length === 0) {
    return (
      <div className="w-full">
        <div 
          ref={holderRef}
          className="editor-renderer"
        />
      </div>
    )
  }

  return (
    <div className="w-full">
      <div 
        ref={holderRef}
        className="editor-renderer"
        style={{
          opacity: isReady ? 1 : 0,
          transition: 'opacity 200ms ease-in'
        }}
      >
        {/* BlockNoteView renders its own container, holderRef wraps it for DOM queries */}
        <BlockNoteView 
          editor={editor} 
          editable={false}
        />
      </div>
    </div>
  )
}
