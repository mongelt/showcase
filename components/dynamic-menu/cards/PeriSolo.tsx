'use client'

/**
 * PeriSolo — isolated related-state card.
 *
 * layout='content' (default): original content-card style.
 *   Single thumbnail on left with 3D lift, text right-aligned.
 *   Used in ContentPlane for related content items.
 *
 * layout='nav': NavCard-style.
 *   ThumbnailStack on right, text left-aligned.
 *   Used in CategoryPlane for related subcategory items.
 *
 * 150px at rest → 300px on hover.
 */

import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ThumbnailStack } from './ThumbnailStack'
import { useReducedMotion, dmTransition } from '@/lib/animations'
import { cloudinaryCrop } from '@/lib/utils'

export interface PeriSoloProps {
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
  layout?: 'content' | 'nav'
  onClick: () => void
}

export function PeriSolo({
  name, shortTitle, shortDesc, periDesc, desc, publication, year,
  thumbnail, thumbnails, layout = 'content', onClick,
}: PeriSoloProps) {
  const [hovered, setHovered] = useState(false)
  const reduced = useReducedMotion()
  const trans = dmTransition(reduced)
  const DUR = '0.28s cubic-bezier(0.4,0,0.2,1)'

  const pub = publication && publication.length > 20 ? publication.slice(0, 19) + '…' : publication
  const metaText = [pub, year].filter(Boolean).join(' · ')

  return (
    <motion.div
      onClick={onClick}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      animate={{ width: hovered ? 300 : 150 }}
      transition={trans}
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        border: hovered ? '0.5px solid #1c1818' : '0.5px solid #222020',
        background: hovered ? '#b4b0ac' : '#0f0e0e',
        flexShrink: 0,
        overflow: 'visible',
        cursor: 'pointer',
      }}
    >
      {layout === 'nav' ? (
        // ── Nav layout: text left, ThumbnailStack right ──
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'stretch',
          minHeight: hovered ? 72 : 36,
          transition: reduced ? 'none' : `min-height ${DUR}`,
        }}>
          <div style={{
            flex: 1,
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: hovered ? 'flex-start' : 'center',
            padding: hovered ? '10px 8px 0 10px' : '7px 8px 7px 10px',
            overflow: 'hidden',
          }}>
            {metaText && (
              <div style={{
                fontSize: 10,
                color: hovered ? '#3a3535' : '#808080',
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
              color: hovered ? '#111111' : '#b0b0b0',
              whiteSpace: hovered ? 'normal' : 'nowrap',
              overflow: 'hidden',
              textOverflow: hovered ? 'clip' : 'ellipsis',
              transition: reduced ? 'none' : `color ${DUR}`,
            }}>
              {hovered ? name : (shortTitle || name)}
            </div>
            <div style={{
              fontSize: 12,
              color: '#989898',
              marginTop: !hovered ? 4 : 0,
              maxHeight: !hovered ? 24 : 0,
              overflow: 'hidden',
              whiteSpace: 'nowrap',
              textOverflow: 'ellipsis',
              transition: reduced ? 'none' : `max-height ${DUR}, margin-top ${DUR}`,
            }}>
              {periDesc ?? shortDesc}
            </div>
            <div style={{
              fontSize: 12,
              color: hovered ? '#303030' : '#989898',
              lineHeight: 1.4,
              maxHeight: hovered ? 80 : 0,
              overflow: 'hidden',
              marginTop: hovered ? 4 : 0,
              paddingBottom: hovered ? 5 : 0,
              transition: reduced ? 'none' : `max-height ${DUR}, margin-top ${DUR}, padding-bottom ${DUR}`,
            }}>
              {desc}
            </div>
          </div>
          <div style={{
            width: hovered ? 86 : 0,
            overflow: hovered ? 'visible' : 'hidden',
            opacity: hovered ? 1 : 0,
            flexShrink: 0,
            transition: reduced ? 'none' : `width ${DUR}, opacity ${DUR}`,
          }}>
            <ThumbnailStack
              thumbnails={thumbnails ?? []}
              isVisible={hovered}
              parentHovered={hovered}
            />
          </div>
        </div>
      ) : (
        // ── Content layout: single thumbnail left, text right-aligned ──
        <>
          <div style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-start',
            height: 72,
            width: '100%',
          }}>
            {/* Thumbnail: hidden at rest, shown with lift on hover */}
            {hovered && (
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
                {thumbnail ? (
                  <img src={cloudinaryCrop(thumbnail, 208, 144)} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                ) : (
                  <span style={{ fontSize: 9, color: '#8a8480', textAlign: 'center', padding: 8, lineHeight: 1.4 }}>
                    No thumbnail
                  </span>
                )}
              </div>
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
              {metaText && (
                <div style={{
                  fontSize: 10,
                  color: hovered ? '#3a3535' : '#989898',
                  textTransform: 'uppercase',
                  marginTop: 3,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {metaText}
                </div>
              )}

              {!hovered && (
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
                  {shortTitle || name}
                </div>
              )}

              {hovered && (
                <div style={{
                  fontSize: 13,
                  fontWeight: 500,
                  color: '#111111',
                  marginTop: 0,
                  lineHeight: 1.5,
                  display: '-webkit-box',
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  maxWidth: '24ch',
                  marginLeft: 'auto',
                } as React.CSSProperties}>
                  {name}
                </div>
              )}

              {!hovered && (
                <div style={{
                  fontSize: 12,
                  color: '#989898',
                  marginTop: 4,
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {(() => { const d = periDesc ?? shortDesc; return d && d.length > 22 ? d.slice(0, 21) + '…' : d })()}
                </div>
              )}
            </div>
          </div>

          {/* .tc-desc-extra — reveals on hover */}
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
            transition: reduced ? 'none' : `max-height ${DUR}, margin-top ${DUR}`,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
          } as React.CSSProperties}>
            {desc}
          </div>
        </>
      )}
    </motion.div>
  )
}
