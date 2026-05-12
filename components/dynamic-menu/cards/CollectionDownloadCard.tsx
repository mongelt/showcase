'use client'

import React, { useState } from 'react'
import { useReducedMotion } from '@/lib/animations'
import { ThumbnailStack } from './ThumbnailStack'

export interface CollectionDownloadCardProps {
  name: string
  desc?: string
  thumbnails?: string[]
  resumeAvailable?: boolean
  onDownload: (includeResume: boolean) => void
}

export function CollectionDownloadCard({
  name, desc, thumbnails = [], resumeAvailable = true, onDownload,
}: CollectionDownloadCardProps) {
  const [hovered, setHovered]             = useState(false)
  const [resumeHovered, setResumeHovered] = useState(false)
  const [includeResume, setIncludeResume] = useState(false)
  const reduced                           = useReducedMotion()

  const DUR = '0.28s cubic-bezier(0.4,0,0.2,1)'

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setResumeHovered(false) }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        borderTop: '0.5px solid #6B2A2A',
        borderRight: '0.5px solid #6B2A2A',
        borderBottom: '0.5px solid #6B2A2A',
        borderLeft: '2px solid #fc5454',
        background: '#d2c8c8',
        width: 300,
        flexShrink: 0,
        overflow: 'visible',
        position: 'relative',
      }}
    >
      {/* ── Main body ─────────────────────────────────────────────── */}
      <div
        onClick={() => onDownload(includeResume)}
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'stretch',
          cursor: 'pointer',
          minHeight: 72,
        }}
      >
        {/* Text body */}
        <div style={{
          flex: 1,
          minWidth: 0,
          padding: '10px 8px 10px 10px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
        }}>
          <div style={{
            fontSize: 13,
            fontWeight: 500,
            color: '#6b2a2a',
            lineHeight: 1.35,
          }}>
            {name}
          </div>
          {desc && (
            <div style={{
              fontSize: 12,
              color: '#363030',
              lineHeight: 1.4,
              marginTop: 4,
            }}>
              {desc}
            </div>
          )}
        </div>

        {/* ThumbnailStack — right side, always visible */}
        <div style={{
          width: 86,
          flexShrink: 0,
          overflow: 'visible',
          position: 'relative',
        }}>
          <ThumbnailStack
            thumbnails={thumbnails}
            isVisible={true}
            parentHovered={hovered}
          />
        </div>
      </div>

      {/* ── Include Resume zone ────────────────────────────────────── */}
      {resumeAvailable && (
        <div
          onMouseEnter={() => setResumeHovered(true)}
          onMouseLeave={() => setResumeHovered(false)}
          onClick={(e) => { e.stopPropagation(); setIncludeResume(prev => !prev) }}
          style={{
            maxHeight: (hovered || includeResume) ? 20 : 0,
            overflow: 'hidden',
            background: (resumeHovered || includeResume)
              ? 'linear-gradient(to bottom, #d2c8c8, rgba(11, 10, 10, 0.3))'
              : 'transparent',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            transition: reduced ? 'none' : `max-height ${DUR}, background 0.2s ease`,
          }}
        >
          <span style={{
            fontSize: 14,
            fontFamily: 'var(--font-ui, Space Grotesk, sans-serif)',
            color: (resumeHovered || includeResume) ? '#6b2a2a' : '#1a1a1a',
            textTransform: (resumeHovered || includeResume) ? 'uppercase' : 'none',
            letterSpacing: (resumeHovered || includeResume) ? '0.05em' : '0.01em',
            lineHeight: '20px',
            whiteSpace: 'nowrap',
            opacity: (hovered || includeResume) ? 1 : 0,
            transition: reduced ? 'none' : 'opacity 0.18s ease 0.08s, color 0.15s ease, letter-spacing 0.15s ease',
            userSelect: 'none',
          }}>
            {includeResume ? '✓ Resume included' : 'Include Resume'}
          </span>
        </div>
      )}
    </div>
  )
}
