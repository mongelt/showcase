'use client'

/**
 * ThumbCard — focus and active content card (Row 1).
 *
 * 300px wide × 72px min-height. Grows vertically when description expands.
 *
 * Focus state:
 *   - Score-driven background + title color
 *   - Thumbnail lifts on hover
 *   - .tc-desc-extra reveals below top row on hover
 *
 * Active state:
 *   - Fixed colors (#d2c8c8 bg, #6b2a2a title, #fc5454 left border)
 *   - Thumbnail always lifted
 *   - .tc-desc-unified always visible below top row
 */

import React, { useState, useRef, useLayoutEffect } from 'react'
import { interpolateMenuScore, borderColorFromScore } from '@/lib/menu/scoreSpectrum'
import { useReducedMotion } from '@/lib/animations'
import { cloudinaryCrop } from '@/lib/utils'

export interface ThumbCardProps {
  name: string
  shortDesc?: string
  desc?: string
  publication?: string
  year?: number
  score: number
  isActive: boolean
  thumbnail?: string
  onClick: () => void
}

export function ThumbCard({
  name, shortDesc, desc, publication, year, score, isActive, thumbnail, onClick,
}: ThumbCardProps) {
  const [hovered, setHovered] = useState(false)
  const reduced = useReducedMotion()
  const titleRef = useRef<HTMLDivElement>(null)
  const [isTwoLine, setIsTwoLine] = useState(false)

  useLayoutEffect(() => {
    if (titleRef.current) {
      setIsTwoLine(titleRef.current.offsetHeight > 26)
    }
  }, [name])

  const DUR = '0.28s cubic-bezier(0.4,0,0.2,1)'

  const scoreColors  = interpolateMenuScore(score)
  const bg           = isActive ? '#d2c8c8' : hovered ? '#c7c7c2' : scoreColors.background
  const titleColor   = isActive ? '#6b2a2a' : hovered ? '#1a1a1a' : scoreColors.color
  const border       = isActive ? '0.5px solid #6B2A2A' : hovered ? '0.5px solid #1c1818' : `0.5px solid ${borderColorFromScore(score)}`
  const thumbLifted  = isActive || hovered
  const thumbBg      = isActive ? '#c0b8b8' : hovered ? '#b8b4b0' : scoreColors.background

  const pub = publication && publication.length > 20 ? publication.slice(0, 19) + '…' : publication
  const metaText = [pub, year].filter(Boolean).join(' · ')

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        borderTop: border,
        borderRight: border,
        borderBottom: border,
        borderLeft: isActive ? '2px solid #fc5454' : border,
        background: bg,
        width: 300,
        minHeight: 72,
        flexShrink: 0,
        overflow: 'visible',
        cursor: 'pointer',
        transition: reduced ? 'none' : `background ${DUR}, border-color ${DUR}`,
      }}
    >
      {/* Top row: thumbnail + body */}
      <div style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'flex-start',
        minHeight: 72,
        width: '100%',
      }}>
        {/* Thumbnail */}
        <div style={{
          width: 104,
          height: 72,
          flexShrink: 0,
          background: thumbBg,
          marginLeft: 6,
          borderRadius: 2,
          overflow: 'hidden',
          boxShadow: thumbLifted ? '2px 4px 8px rgba(0,0,0,0.14)' : 'none',
          // Use transform (not position/top) for the lift so the pointer hit area stays
          // at the original position — prevents jitter when cursor enters the lifted area.
          transform: thumbLifted
            ? 'translateY(-10px) perspective(280px) rotateY(10deg)'
            : 'translateY(0px) perspective(280px) rotateY(0deg)',
          transformOrigin: 'left center',
          transition: reduced ? 'none' : 'transform 0.28s ease, box-shadow 0.28s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {thumbnail ? (
            <img src={cloudinaryCrop(thumbnail, 208, 144)} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <span style={{ fontSize: 9, color: '#8a8480', textAlign: 'center', padding: 8, lineHeight: 1.4 }}>
              No thumbnail
            </span>
          )}
        </div>

        {/* Body */}
        <div style={{
          flex: 1,
          padding: '1px 5px 6px 0',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          textAlign: 'right',
        }}>
          {metaText && (
            <div style={{
              fontSize: 10,
              color: isActive ? '#3a3535' : scoreColors.color,
              textTransform: 'uppercase',
              marginTop: 3,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}>
              {metaText}
            </div>
          )}

          <div
            ref={titleRef}
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: titleColor,
              lineHeight: 1.5,
              paddingBottom: 1,
              marginLeft: 'auto',
              marginTop: isTwoLine ? -2 : 6,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
              maxWidth: '24ch',
            } as React.CSSProperties}
          >
            {name}
          </div>

          {/* shortDesc: shown at rest for focus, hidden on hover */}
          {!isActive && (
            <div style={{
              fontSize: 12,
              color: scoreColors.descColor,
              marginTop: 3,
              maxHeight: hovered ? 0 : 20,
              overflow: 'hidden',
              opacity: hovered ? 0 : 1,
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              transition: reduced ? 'none' : 'max-height 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.2s',
            }}>
              {shortDesc && shortDesc.length > 30 ? shortDesc.slice(0, 29) + '…' : shortDesc}
            </div>
          )}
        </div>
      </div>

      {/* Description area below top row */}
      {isActive ? (
        /* Always visible for active — .tc-desc-unified */
        <div style={{
          textAlign: 'right',
          padding: '2px 12px 8px',
          fontSize: 12,
          lineHeight: 1.45,
          textIndent: 98,
          color: '#363030',
          display: '-webkit-box',
          WebkitLineClamp: 4,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          marginTop: -15,
        } as React.CSSProperties}>
          {desc}
        </div>
      ) : (
        /* Reveals on hover for focus — .tc-desc-extra */
        <div style={{
          textAlign: 'right',
          padding: hovered ? '2px 12px 8px' : '0 12px',
          fontSize: 12,
          lineHeight: 1.45,
          textIndent: 98,
          color: '#363030',
          maxHeight: hovered ? 64 : 0,
          overflow: 'hidden',
          marginTop: hovered ? -15 : 0,
          transition: reduced ? 'none' : 'max-height 0.28s cubic-bezier(0.4,0,0.2,1), margin-top 0.28s cubic-bezier(0.4,0,0.2,1)',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
        } as React.CSSProperties}>
          {desc}
        </div>
      )}
    </div>
  )
}
