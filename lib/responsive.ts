'use client'

import { useState, useEffect } from 'react'

/**
 * Checks if the given dimensions match the mobile breakpoint criteria.
 * Mobile breakpoint: width < 768px AND portrait orientation (height > width)
 * 
 * @param width - Window width in pixels
 * @param height - Window height in pixels
 * @returns true if both conditions are met (width < 768px AND portrait)
 */
function isMobileBreakpoint(width: number, height: number): boolean {
  return width < 768 && height > width
}

/**
 * React hook that detects mobile on initial load only.
 * The result is determined once on mount and never changes, even if the window is resized.
 * This is useful for features that should only activate if the user initially loaded the page on mobile.
 * 
 * @returns true if the page was initially loaded in mobile viewport
 */
export function useMobileInitial(): boolean {
  const [isMobile] = useState(() => {
    // Only check on client side
    if (typeof window === 'undefined') return false
    
    return isMobileBreakpoint(window.innerWidth, window.innerHeight)
  })

  return isMobile
}

/**
 * React hook that provides current mobile state based on window size.
 * Updates when the window is resized and crosses the breakpoint.
 * 
 * @returns Object with isMobile boolean that reflects current viewport state
 */
export function useMobileState(): { isMobile: boolean } {
  const [isMobile, setIsMobile] = useState(() => {
    // Only check on client side
    if (typeof window === 'undefined') return false
    
    return isMobileBreakpoint(window.innerWidth, window.innerHeight)
  })

  useEffect(() => {
    // Only set up listener on client side
    if (typeof window === 'undefined') return

    const handleResize = () => {
      setIsMobile(isMobileBreakpoint(window.innerWidth, window.innerHeight))
    }

    // Set initial state
    handleResize()

    // Listen for resize events
    window.addEventListener('resize', handleResize)

    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  return { isMobile }
}
