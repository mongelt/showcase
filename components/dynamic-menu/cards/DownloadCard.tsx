'use client'

import React, { useState, useRef, useLayoutEffect } from 'react'
import { useReducedMotion } from '@/lib/animations'
import { cloudinaryCrop } from '@/lib/utils'

export interface DownloadCardProps {
  name: string
  desc?: string
  publication?: string
  year?: number
  thumbnail?: string
  resumeAvailable?: boolean
  onDownload: (includeResume: boolean) => void
}

export function DownloadCard({
  name, desc, publication, year, thumbnail, resumeAvailable = true, onDownload,
}: DownloadCardProps) {
  const [hovered, setHovered]             = useState(false)
  const [resumeHovered, setResumeHovered] = useState(false)
  const [includeResume, setIncludeResume] = useState(false)
  const reduced                           = useReducedMotion()
  const titleRef                          = useRef<HTMLDivElement>(null)
  const [isTwoLine, setIsTwoLine]         = useState(false)

  useLayoutEffect(() => {
    if (titleRef.current) {
      setIsTwoLine(titleRef.current.offsetHeight > 26)
    }
  }, [name])

  const DUR = '0.28s cubic-bezier(0.4,0,0.2,1)'

  const pub      = publication && publication.length > 20 ? publication.slice(0, 19) + '…' : publication
  const metaText = [pub, year].filter(Boolean).join(' · ')

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setResumeHovered(false) }}
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 3,
        border: '0.5px solid #6B2A2A',
        background: '#d2c8c8',
        width: 300,
        flexShrink: 0,
        overflow: 'visible',
        position: 'relative',
      }}
    >
      {/* ── Main body — click triggers download ───────────────────── */}
      <div
        onClick={() => onDownload(includeResume)}
        style={{ display: 'flex', flexDirection: 'column', cursor: 'pointer' }}
      >
        {/* Top row: thumbnail + text body */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-start',
          minHeight: 72,
          width: '100%',
        }}>
          {/* Thumbnail — permanently lifted (at-rest = ThumbCard hover) */}
          <div style={{
            width: 104,
            height: 72,
            flexShrink: 0,
            background: '#c0b8b8',
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
              <img
                src={cloudinaryCrop(thumbnail, 208, 144)}
                alt=""
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            ) : (
              <span style={{ fontSize: 9, color: '#8a8480', textAlign: 'center', padding: 8, lineHeight: 1.4 }}>
                No thumbnail
              </span>
            )}
          </div>

          {/* Text body */}
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
                color: '#1a1a1a',
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
                color: '#1a1a1a',
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
          </div>
        </div>

        {/* Description — always visible, clamped at 3 lines */}
        <div style={{
          textAlign: 'right',
          padding: '2px 12px 8px',
          fontSize: 12,
          lineHeight: 1.45,
          textIndent: 98,
          color: '#363030',
          display: '-webkit-box',
          WebkitLineClamp: 3,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          marginTop: -15,
        } as React.CSSProperties}>
          {desc}
        </div>
      </div>

      {/* ── Include Resume zone — expands 20px on card hover ──────── */}
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
