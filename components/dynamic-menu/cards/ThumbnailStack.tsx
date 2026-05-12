'use client'

/**
 * ThumbnailStack — five stacked 60×60 images.
 * Used inside nav-cards, subheader-cards, and collection-cards.
 *
 * Props:
 *   thumbnails     — up to 5 URLs; index 0 = ts-0 (front/top layer)
 *   isVisible      — opacity 0 when false (hidden at rest on most cards)
 *   parentHovered  — ts-0 lifts to top:-10px when true
 */

import { cloudinaryCropFit as cloudinaryCrop } from '@/lib/utils'

interface ThumbnailStackProps {
  thumbnails: string[]
  isVisible: boolean
  parentHovered?: boolean
}

// Back-to-front layer config. Index 0 = ts-0 (top), index 4 = ts-4 (back).
const LAYERS = [
  { top: 0,  left: 24, zIndex: 5, opacity: 1,    rotate: '0deg'    }, // ts-0
  { top: 2,  left: 20, zIndex: 4, opacity: 0.84,  rotate: '-1deg'   }, // ts-1
  { top: 4,  left: 16, zIndex: 3, opacity: 0.68,  rotate: '-2deg'   }, // ts-2
  { top: 7,  left: 10, zIndex: 2, opacity: 0.52,  rotate: '-3.5deg' }, // ts-3
  { top: 10, left: 4,  zIndex: 1, opacity: 0.35,  rotate: '-5deg'   }, // ts-4
] as const

export function ThumbnailStack({ thumbnails, isVisible, parentHovered }: ThumbnailStackProps) {
  return (
    <div
      style={{
        width: 86,
        flexShrink: 0,
        position: 'relative',
        alignSelf: 'stretch',
        opacity: isVisible ? 1 : 0,
        transition: 'opacity 0.28s cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      {LAYERS.map((cfg, i) => {
        const url = thumbnails[i]
        const isTop = i === 0
        const lifted = isTop && parentHovered

        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 60,
              height: 60,
              borderRadius: 2,
              top: cfg.top,
              left: cfg.left,
              zIndex: cfg.zIndex,
              opacity: cfg.opacity,
              // Use transform for ts-0 lift so pointer hit area stays in original position
              transform: lifted
                ? `translateY(-10px) rotate(${cfg.rotate})`
                : `translateY(0px) rotate(${cfg.rotate})`,
              overflow: 'hidden',
              boxShadow: lifted
                ? '2px 4px 8px rgba(0,0,0,0.4)'
                : '1px 2px 6px rgba(0,0,0,0.4)',
              transition: 'transform 0.28s ease, box-shadow 0.28s ease',
              background: '#c0bcb8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {url ? (
              <img
                src={cloudinaryCrop(url, 120, 120)}
                alt=""
                loading="lazy"
                decoding="async"
                style={{ width: '100%', height: '100%', objectFit: 'contain', display: 'block' }}
              />
            ) : (
              <span style={{ fontSize: 8, color: '#888', textAlign: 'center', lineHeight: 1.3 }}>
                No img
              </span>
            )}
          </div>
        )
      })}
    </div>
  )
}
