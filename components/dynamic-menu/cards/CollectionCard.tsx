'use client'

/**
 * CollectionCard — bottom-row collection card (Row 3).
 *
 * 140px at rest (160px when active for close button) → 290px on hover.
 * shortTitle at rest; name (uppercase) on hover.
 * Description expands inline below the name on hover (same pattern as NavCard).
 * ThumbnailStack slides in from right on hover.
 * Score-driven colors for focus/related; fixed colors for active.
 * Close (×) button visible only when isActive.
 * CollectionPlane uses overflow:visible + fixed height so expanding cards
 * grow upward into the content plane without shifting layout.
 */

import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ThumbnailStack } from './ThumbnailStack'
import { useReducedMotion, dmTransition } from '@/lib/animations'

export interface CollectionCardProps {
  name: string
  shortTitle: string
  shortDesc?: string
  desc?: string
  score: number
  isActive: boolean
  thumbnails: string[]
  onClick: () => void
  onDismiss?: () => void
}

type ColState = 'active' | 'focus' | 'related'

function colState(score: number, isActive: boolean): ColState {
  if (isActive) return 'active'
  return score >= 0.50 ? 'focus' : 'related'
}

const AT_REST: Record<ColState, { bg: string; border: string; nameColor: string }> = {
  active:  { bg: '#d2c8c8', border: '0.5px solid #6B2A2A',  nameColor: '#6b2a2a' },
  focus:   { bg: '#c7c7c2', border: '0.5px solid #1c1818',  nameColor: '#1a1a1a' },
  related: { bg: '#0f0e0e', border: '0.5px solid #222020',  nameColor: '#b0b0b0' },
}

const ON_HOVER: Record<ColState, { bg: string; nameColor: string }> = {
  active:  { bg: '#d2c8c8', nameColor: '#6b2a2a' },
  focus:   { bg: '#c7c7c2', nameColor: '#1a1a1a' },
  related: { bg: '#b4b0ac', nameColor: '#111111' },
}

export function CollectionCard({
  name, shortTitle, shortDesc, desc, score, isActive, thumbnails, onClick, onDismiss,
}: CollectionCardProps) {
  const [hovered, setHovered] = useState(false)
  const [inDismissZone, setInDismissZone] = useState(false)
  const reduced = useReducedMotion()
  const trans = dmTransition(reduced)
  const DUR = '0.28s cubic-bezier(0.4,0,0.2,1)'

  const state    = colState(score, isActive)
  const atRest   = AT_REST[state]
  const onHover  = ON_HOVER[state]

  const expanded    = hovered && !inDismissZone
  const bg          = expanded ? onHover.bg   : atRest.bg
  const border      = expanded
    ? (state === 'active' ? '0.5px solid #6B2A2A' : '0.5px solid #1c1818')
    : atRest.border
  const nameColor   = expanded ? onHover.nameColor : atRest.nameColor
  const restWidth   = isActive ? 160 : 140

  return (
    <motion.div
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => { setHovered(false); setInDismissZone(false) }}
      onClick={onClick}
      animate={{ width: expanded ? 290 : restWidth }}
      transition={trans}
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        borderTop: border,
        borderRight: border,
        borderBottom: border,
        borderLeft: isActive ? '2px solid #fc5454' : border,
        background: bg,
        flexShrink: 0,
        overflow: expanded ? 'visible' : 'hidden',
        cursor: 'pointer',
        position: 'relative',
        transition: reduced ? 'none' : `background ${DUR}, border-color ${DUR}`,
      }}
    >
      {/* .col-top-row */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
        minHeight: expanded ? 72 : 36,
        width: '100%',
        transition: reduced ? 'none' : `min-height ${DUR}`,
      }}>
        {/* .col-body */}
        <div style={{
          flex: 1,
          padding: expanded ? '10px 8px 0 12px' : '7px 8px 7px 12px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: expanded ? 'flex-start' : 'center',
          minWidth: 0,
        }}>
          {/* .col-name */}
          <div style={{
            fontSize: 12,
            fontWeight: 500,
            color: nameColor,
            whiteSpace: expanded ? 'normal' : 'nowrap',
            overflow: expanded ? 'visible' : 'hidden',
            textOverflow: expanded ? 'clip' : 'ellipsis',
            textTransform: expanded ? 'uppercase' : 'none',
            letterSpacing: expanded ? '0.06em' : 'normal',
          }}>
            {expanded ? name : shortTitle}
          </div>

          {/* Description — revealed inline on hover, same pattern as NavCard */}
          <div style={{
            fontSize: 11,
            color: '#585050',
            lineHeight: 1.45,
            maxHeight: expanded ? 80 : 0,
            overflow: 'hidden',
            marginTop: expanded ? 4 : 0,
            paddingBottom: expanded ? 5 : 0,
            transition: reduced ? 'none' : `max-height ${DUR}, margin-top ${DUR}, padding-bottom ${DUR}`,
          }}>
            {desc || shortDesc}
          </div>
        </div>

        {/* ThumbnailStack: width 0 at rest → 86px on hover */}
        <div style={{
          width: expanded ? 86 : 0,
          overflow: expanded ? 'visible' : 'hidden',
          opacity: expanded ? 1 : 0,
          flexShrink: 0,
          transition: reduced ? 'none' : `width ${DUR}, opacity ${DUR}`,
        }}>
          <ThumbnailStack thumbnails={thumbnails} isVisible={expanded} parentHovered={expanded} />
        </div>
      </div>

      {/* Dismiss zone — AnimatePresence so it fades in/out when isActive toggles */}
      <AnimatePresence>
        {isActive && onDismiss && (
          <motion.div
            key="dismiss"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={trans}
            onMouseEnter={() => setInDismissZone(true)}
            onMouseLeave={() => setInDismissZone(false)}
            onClick={(e) => { e.stopPropagation(); onDismiss() }}
            title="Dismiss collection"
            style={{
              position: 'absolute',
              right: 0,
              top: 0,
              bottom: 0,
              width: 24,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: '#fc5454',
              borderRadius: '0 3px 3px 0',
              cursor: 'pointer',
            }}
          >
            <span style={{
              color: '#0b0a0a',
              fontSize: 14,
              lineHeight: 1,
              userSelect: 'none',
              pointerEvents: 'none',
            }}>
              ×
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
