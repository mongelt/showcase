'use client'

/**
 * PeriPair — two related cards side by side.
 *
 * layout='content' (default): original content-card style.
 *   Single thumbnail on left with 3D lift, text right-aligned.
 *   Used in ContentPlane for related content items.
 *
 * layout='nav': NavCard-style.
 *   ThumbnailStack on right, text left-aligned.
 *   Used in CategoryPlane for related subcategory items.
 *
 * Hovered card expands to 290px; non-hovered collapses to a 10px sliver.
 */

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ThumbnailStack } from './ThumbnailStack'
import { useReducedMotion, dmTransition } from '@/lib/animations'
import { cloudinaryCrop } from '@/lib/utils'

export interface PeriCardData {
  name: string
  shortTitle?: string
  shortDesc?: string
  periDesc?: string
  desc?: string
  publication?: string
  year?: number
  /** Single thumbnail — used by layout='content' */
  thumbnail?: string
  /** Multi-asset thumbnails — used by layout='nav' */
  thumbnails?: string[]
}

export interface PeriPairProps {
  left: PeriCardData
  right: PeriCardData
  onLeftClick: () => void
  onRightClick: () => void
  layout?: 'content' | 'nav'
}

interface PairCardProps {
  data: PeriCardData
  isHovered: boolean
  isCondensed: boolean
  isLeft: boolean
  layout: 'content' | 'nav'
  onClick: () => void
  onHoverStart: () => void
  onHoverEnd: () => void
}

function PairCard({ data, isHovered, isCondensed, isLeft, layout, onClick, onHoverStart, onHoverEnd }: PairCardProps) {
  const pub = data.publication && data.publication.length > 20 ? data.publication.slice(0, 19) + '…' : data.publication
  const metaText = [pub, data.year].filter(Boolean).join(' · ')
  const targetWidth = isCondensed ? 10 : isHovered ? 290 : 150
  const reduced = useReducedMotion()
  const DUR = '0.28s cubic-bezier(0.4,0,0.2,1)'

  return (
    <motion.div
      onClick={onClick}
      onHoverStart={onHoverStart}
      onHoverEnd={onHoverEnd}
      animate={{ width: targetWidth }}
      transition={dmTransition(reduced)}
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        border: isHovered ? '0.5px solid #1c1818' : '0.5px solid #222020',
        background: isCondensed ? '#222222' : isHovered ? '#b4b0ac' : '#0f0e0e',
        flexShrink: 0,
        overflow: isCondensed ? 'hidden' : 'visible',
        cursor: 'pointer',
      }}
    >
      {/* Card body — hidden (opacity 0) when condensed */}
      <div style={{ opacity: isCondensed ? 0 : 1, transition: 'opacity 0.2s', display: 'flex', flexDirection: 'column' }}>

        {layout === 'nav' ? (
          // ── Nav layout: text left, ThumbnailStack right ──
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'stretch',
            minHeight: isHovered ? 72 : 36,
            transition: reduced ? 'none' : `min-height ${DUR}`,
          }}>
            {/* Text body */}
            <div style={{
              flex: 1,
              minWidth: 0,
              display: 'flex',
              flexDirection: 'column',
              justifyContent: isHovered ? 'flex-start' : 'center',
              padding: isHovered ? '10px 8px 0 10px' : '7px 8px 7px 10px',
              overflow: 'hidden',
            }}>
              {metaText && (
                <div style={{
                  fontSize: 10,
                  color: isHovered ? '#3a3535' : '#808080',
                  textTransform: 'uppercase',
                  marginBottom: 2,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {metaText}
                </div>
              )}
              <div style={{
                fontSize: 12,
                fontWeight: 500,
                color: isHovered ? '#111111' : '#b0b0b0',
                whiteSpace: isHovered ? 'normal' : 'nowrap',
                overflow: 'hidden',
                textOverflow: isHovered ? 'clip' : 'ellipsis',
                transition: reduced ? 'none' : `color ${DUR}`,
              }}>
                {isHovered ? data.name : (data.shortTitle || data.name)}
              </div>
              <div style={{
                fontSize: 12,
                color: '#989898',
                marginTop: !isHovered ? 4 : 0,
                maxHeight: !isHovered ? 24 : 0,
                overflow: 'hidden',
                whiteSpace: 'nowrap',
                textOverflow: 'ellipsis',
                transition: reduced ? 'none' : `max-height ${DUR}, margin-top ${DUR}`,
              }}>
                {data.periDesc ?? data.shortDesc}
              </div>
              <div style={{
                fontSize: 12,
                color: isHovered ? '#303030' : '#989898',
                lineHeight: 1.4,
                maxHeight: isHovered ? 80 : 0,
                overflow: 'hidden',
                marginTop: isHovered ? 4 : 0,
                paddingBottom: isHovered ? 5 : 0,
                transition: reduced ? 'none' : `max-height ${DUR}, margin-top ${DUR}, padding-bottom ${DUR}`,
              }}>
                {data.desc}
              </div>
            </div>
            {/* ThumbnailStack */}
            <div style={{
              width: isHovered ? 86 : 0,
              overflow: isHovered ? 'visible' : 'hidden',
              opacity: isHovered ? 1 : 0,
              flexShrink: 0,
              transition: reduced ? 'none' : `width ${DUR}, opacity ${DUR}`,
            }}>
              <ThumbnailStack
                thumbnails={data.thumbnails ?? []}
                isVisible={isHovered}
                parentHovered={isHovered}
              />
            </div>
          </div>
        ) : (
          // ── Content layout: single thumbnail left, text right-aligned ──
          <>
            <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', height: 72, width: '100%' }}>
              {/* Thumbnail: shown on hover */}
              {isHovered && (
                <div style={{
                  width: 104,
                  height: '100%',
                  flexShrink: 0,
                  background: '#b4b0ac',
                  marginLeft: 6,
                  borderRadius: 2,
                  overflow: 'hidden',
                  boxShadow: '2px 4px 8px rgba(0,0,0,0.14)',
                  transform: 'translateY(-10px) perspective(280px) rotateY(10deg)',
                  transformOrigin: 'left center',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}>
                  {data.thumbnail ? (
                    <img src={cloudinaryCrop(data.thumbnail, 208, 144)} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  ) : (
                    <span style={{ fontSize: 9, color: '#8a8480', textAlign: 'center', padding: 8 }}>No img</span>
                  )}
                </div>
              )}

              {/* Text body */}
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
                {metaText && (
                  <div style={{
                    fontSize: 10,
                    color: isHovered ? '#3a3535' : '#989898',
                    textTransform: 'uppercase',
                    marginTop: 3,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {metaText}
                  </div>
                )}

                {!isHovered && (
                  <div style={{
                    fontSize: 12,
                    fontWeight: 500,
                    color: '#b0b0b0',
                    marginTop: 5,
                    lineHeight: 1.5,
                    overflow: 'hidden',
                    whiteSpace: 'nowrap',
                    textOverflow: 'ellipsis',
                  }}>
                    {data.shortTitle || data.name}
                  </div>
                )}

                {isHovered && (
                  <div style={{
                    fontSize: 13,
                    fontWeight: 500,
                    color: '#111111',
                    marginTop: isLeft ? 0 : 7,
                    lineHeight: 1.5,
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                    maxWidth: '24ch',
                    marginLeft: 'auto',
                  } as React.CSSProperties}>
                    {data.name}
                  </div>
                )}

                {!isHovered && (
                  <div style={{
                    fontSize: 12,
                    color: '#989898',
                    marginTop: 4,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                    {(() => { const d = data.periDesc ?? data.shortDesc; return d && d.length > 22 ? d.slice(0, 21) + '…' : d })()}
                  </div>
                )}
              </div>
            </div>

            {/* Description expansion */}
            <div style={{
              textAlign: 'right',
              padding: isHovered ? '2px 12px 8px' : '0 12px',
              fontSize: 12,
              lineHeight: 1.45,
              textIndent: 98,
              color: '#585050',
              maxHeight: isHovered ? 64 : 0,
              overflow: 'hidden',
              marginTop: isHovered ? -15 : 0,
              transition: reduced ? 'none' : `max-height ${DUR}, margin-top ${DUR}`,
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
            } as React.CSSProperties}>
              {data.desc}
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}

export function PeriPair({ left, right, onLeftClick, onRightClick, layout = 'content' }: PeriPairProps) {
  const [hoveredSide, setHoveredSide] = useState<'left' | 'right' | null>(null)

  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
      <PairCard
        data={left}
        isHovered={hoveredSide === 'left'}
        isCondensed={hoveredSide === 'right'}
        isLeft={true}
        layout={layout}
        onClick={onLeftClick}
        onHoverStart={() => setHoveredSide('left')}
        onHoverEnd={() => setHoveredSide(null)}
      />
      <PairCard
        data={right}
        isHovered={hoveredSide === 'right'}
        isCondensed={hoveredSide === 'left'}
        isLeft={false}
        layout={layout}
        onClick={onRightClick}
        onHoverStart={() => setHoveredSide('right')}
        onHoverEnd={() => setHoveredSide(null)}
      />
    </div>
  )
}
