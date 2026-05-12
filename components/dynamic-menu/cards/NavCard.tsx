'use client'

/**
 * NavCard — category / subcategory navigation card.
 *
 * Single unified component — no variant remount — so hover-overlay mode
 * transitions smoothly without a React unmount/remount flash.
 *
 * variant='collapsed'  (90px)
 *   At rest: 90px, name only.
 *   On hover: animates to 300px, shows desc + thumbnail, focus colors (#c7c7c2).
 *   isHoverOverlay=true: animates to 300px plane-wide (no per-card dimension change on
 *     individual hover), shows shortDesc at rest, desc on hover.
 *
 * variant='expanded'  (300px always)
 *   At rest: shortDesc visible.
 *   On hover: desc + thumbnail, no size change.
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { interpolateMenuScore, borderColorFromScore } from '@/lib/menu/scoreSpectrum'
import { useReducedMotion, dmTransition } from '@/lib/animations'
import { ThumbnailStack } from './ThumbnailStack'

export interface NavCardProps {
  name: string
  shortDesc?: string
  desc?: string
  score: number
  isActive: boolean
  thumbnails: string[]
  variant: 'expanded' | 'collapsed'
  /** When true: card is plane-expanded (overlay mode). No dimensional change on individual hover. */
  isHoverOverlay?: boolean
  onClick: () => void
}

export function NavCard({
  name, shortDesc, desc, score, isActive, thumbnails,
  variant, isHoverOverlay = false, onClick,
}: NavCardProps) {
  const [hovered, setHovered] = useState(false)
  const reduced = useReducedMotion()
  const trans = dmTransition(reduced)

  const isCollapsed = variant === 'collapsed'

  // Card is at full 300px width when:
  // - expanded variant (always)
  // - collapsed + overlay (plane-level expansion)
  // - collapsed + individually hovered
  const atFullWidth = !isCollapsed || isHoverOverlay || hovered

  // shortDesc visible: in expanded/overlay mode at rest only (not while hovered)
  const showShortDesc = (!isCollapsed || isHoverOverlay) && !hovered

  // desc visible: on individual hover (any mode)
  const showDesc = hovered

  // Thumbnail visible:
  // - collapsed non-overlay: hover only (card is 90px at rest — no room for 86px stack)
  // - expanded / overlay: active always + hover
  const showThumbnail = (isCollapsed && !isHoverOverlay)
    ? hovered
    : (isActive || hovered)

  const scoreColors = interpolateMenuScore(score)

  // Background: active → #d2c8c8, any hover → focus #c7c7c2, else score-driven
  const bg = isActive
    ? '#d2c8c8'
    : hovered
      ? '#c7c7c2'
      : scoreColors.background

  // Title color: active → #6b2a2a, any hover → #1a1a1a, else score-driven
  const titleColor = isActive
    ? '#6b2a2a'
    : hovered
      ? '#1a1a1a'
      : scoreColors.color

  // Border: active → #6B2A2A, any hover → #1c1818, else score-driven
  const borderStr = isActive
    ? '0.5px solid #6B2A2A'
    : hovered
      ? '0.5px solid #1c1818'
      : `0.5px solid ${borderColorFromScore(score)}`

  const DUR = '0.28s cubic-bezier(0.4,0,0.2,1)'
  const cssTrans = reduced
    ? 'none'
    : `background ${DUR}, border-color ${DUR}`

  // Width target — expanded variant and overlay always 300; collapsed at rest 90
  const targetWidth = atFullWidth ? 300 : 90

  return (
    <motion.div
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      animate={{ width: targetWidth }}
      transition={trans}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
        borderRadius: 3,
        borderTop: borderStr,
        borderRight: borderStr,
        borderBottom: borderStr,
        borderLeft: isActive ? '2px solid #fc5454' : borderStr,
        background: bg,
        flexShrink: 0,
        overflow: 'visible',
        cursor: 'pointer',
        minHeight: atFullWidth ? 72 : undefined,
        // Individually-hovered collapsed (non-overlay) cards overlay content
        ...(isCollapsed && !isHoverOverlay && hovered
          ? { zIndex: 10, position: 'relative' as const }
          : {}),
        transition: cssTrans,
      }}
    >
      {/* Text body */}
      <div style={{
        flex: 1,
        minWidth: 0,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: atFullWidth ? 'flex-start' : 'center',
        padding: atFullWidth ? '10px 8px 0 10px' : '8px',
        overflow: 'hidden',
      }}>
        {/* Name */}
        <div style={{
          fontSize: (isCollapsed && !isHoverOverlay && !hovered) ? 11 : 13,
          fontWeight: 500,
          color: titleColor,
          lineHeight: 1.35,
          whiteSpace: atFullWidth ? 'normal' : 'nowrap',
          overflow: 'hidden',
          textOverflow: atFullWidth ? 'clip' : 'ellipsis',
          transition: reduced ? 'none' : 'font-size 0.1s',
        }}>
          {name}
        </div>

        {/* shortDesc — shown at rest in expanded / overlay mode */}
        <div style={{
          fontSize: 12,
          color: isActive ? '#585050' : scoreColors.descColor,
          marginTop: showShortDesc ? 4 : 0,
          maxHeight: showShortDesc ? 24 : 0,
          overflow: 'hidden',
          whiteSpace: 'nowrap',
          textOverflow: 'ellipsis',
          transition: reduced ? 'none' : `max-height ${DUR}, margin-top ${DUR}`,
        }}>
          {shortDesc}
        </div>

        {/* desc — revealed on hover */}
        <div style={{
          fontSize: 12,
          color: '#363030',
          lineHeight: 1.4,
          maxHeight: showDesc ? 80 : 0,
          overflow: 'hidden',
          marginTop: showDesc ? 4 : 0,
          paddingBottom: showDesc ? 5 : 0,
          transition: reduced ? 'none' : `max-height ${DUR}, margin-top ${DUR}, padding-bottom ${DUR}`,
        }}>
          {desc}
        </div>
      </div>

      {/* Thumbnail stack: 0 → 86px on hover or when active */}
      <div style={{
        width: showThumbnail ? 86 : 0,
        overflow: showThumbnail ? 'visible' : 'hidden',
        opacity: showThumbnail ? 1 : 0,
        flexShrink: 0,
        transition: reduced ? 'none' : `width ${DUR}, opacity ${DUR}`,
      }}>
        <ThumbnailStack
          thumbnails={thumbnails}
          isVisible={showThumbnail}
          parentHovered={hovered}
        />
      </div>
    </motion.div>
  )
}
