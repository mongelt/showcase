'use client'

/**
 * SubheaderCard — collection subheader inside the content plane (Row 3).
 *
 * 300px × 42px min-height at rest → 72px on hover.
 * Fixed dark colors at rest; brightens to #c7c7c2 on hover.
 * ThumbnailStack fades in on hover with ts-0 lift.
 * isCollectionActive: name shifts to #A85A5A, border to #6B2A2A.
 */

import { useState } from 'react'
import { ThumbnailStack } from './ThumbnailStack'
import { useReducedMotion } from '@/lib/animations'

export interface SubheaderCardProps {
  name: string
  shortDesc?: string
  desc?: string
  itemCount: number
  thumbnails: string[]
  isCollectionActive: boolean
  columns?: 1 | 2
  onClick: () => void
}

export function SubheaderCard({
  name, shortDesc, desc, itemCount, thumbnails, isCollectionActive, columns = 1, onClick,
}: SubheaderCardProps) {
  const [hovered, setHovered] = useState(false)
  const reduced = useReducedMotion()
  const DUR = '0.28s cubic-bezier(0.4,0,0.2,1)'

  const nameColor   = hovered ? '#1a1a1a' : isCollectionActive ? '#A85A5A' : '#e0e0e0'
  const bg          = hovered ? '#c7c7c2' : '#0d0a0a'
  const borderColor = hovered ? '#1c1818' : isCollectionActive ? '#6B2A2A' : '#1e1515'

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        border: `0.5px solid ${borderColor}`,
        background: bg,
        width: columns === 2 ? 608 : 300,
        overflow: 'visible',
        cursor: 'pointer',
        transition: reduced ? 'none' : `background ${DUR}, border-color ${DUR}`,
      }}
    >
      {/* .sh-top-row */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
        minHeight: hovered ? 72 : 42,
        width: '100%',
        transition: reduced ? 'none' : `min-height ${DUR}`,
      }}>
        {/* .sh-body */}
        <div style={{
          flex: 1,
          padding: '7px 8px 8px 10px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          minWidth: 0,
        }}>
          {/* .sh-name */}
          <div style={{
            fontSize: 12,
            fontWeight: 600,
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
            color: nameColor,
            transition: reduced ? 'none' : `color ${DUR}`,
          }}>
            {name}
          </div>

          {/* shortDesc: visible at rest, slides out on hover */}
          <div style={{
            fontSize: 11,
            color: '#989898',
            marginTop: 3,
            maxHeight: hovered ? 0 : 18,
            overflow: 'hidden',
            opacity: hovered ? 0 : 1,
            transition: reduced ? 'none' : 'max-height 0.2s cubic-bezier(0.4,0,0.2,1), opacity 0.2s cubic-bezier(0.4,0,0.2,1)',
          }}>
            {shortDesc}
          </div>

          {/* desc-full: hidden at rest, reveals on hover */}
          <div style={{
            fontSize: 11,
            color: '#4a4a4a',
            lineHeight: 1.45,
            maxHeight: hovered ? 80 : 0,
            overflow: 'hidden',
            marginTop: hovered ? 4 : 0,
            transition: reduced ? 'none' : `max-height ${DUR}, margin-top ${DUR}`,
          }}>
            {desc}
          </div>
        </div>

        {/* ThumbnailStack: opacity 0 at rest → 1 on hover */}
        <ThumbnailStack
          thumbnails={thumbnails}
          isVisible={hovered}
          parentHovered={hovered}
        />
      </div>
    </div>
  )
}
