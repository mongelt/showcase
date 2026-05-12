'use client'

import { useState, useRef, useCallback } from 'react'
import { ThumbnailStack } from './dynamic-menu/cards/ThumbnailStack'

const BOUNDARY_HEIGHT = 110

export type ProfileNavCard = {
  id: string
  name: string
  shortDesc: string | null
  desc: string | null
  thumbnails: string[]
  type: 'category' | 'subcategory' | 'collection'
}

export type ProfileResumeCard = {
  id: string
  title: string
  subtitle: string | null
  dateStart: string | null
  dateEnd: string | null
  shortDescription: string | null
  planeDescription: string | null
}

interface ProfilePlanesProps {
  portfolioCards: ProfileNavCard[]
  resumeCards: ProfileResumeCard[]
  education: string | null
  jhuEntryId: string | null
  onSwitchToPortfolio: () => void
  onSwitchToResume: (entryId?: string) => void
  onCardSelect?: (id: string, type: 'category' | 'subcategory' | 'collection') => void
}

function PlaneNavCard({
  card,
  index,
  planeHovered,
  onClick,
}: {
  card: ProfileNavCard
  index: number
  planeHovered: boolean
  onClick?: () => void
}) {
  const [cardHovered, setCardHovered] = useState(false)
  const parallaxY = planeHovered ? ([-3, -5, -7][index] ?? -3) : 0

  return (
    <div
      onMouseEnter={() => setCardHovered(true)}
      onMouseLeave={() => setCardHovered(false)}
      onClick={onClick ? (e) => { e.stopPropagation(); onClick() } : undefined}
      style={{
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'stretch',
        borderRadius: 3,
        border: `0.5px solid ${cardHovered ? '#1c1818' : 'rgba(26,26,26,0.35)'}`,
        background: '#c7c7c2',
        width: 300,
        minHeight: 72,
        flexShrink: 0,
        cursor: 'pointer',
        overflow: 'visible',
        transform: `translateY(${parallaxY}px)`,
        boxShadow: planeHovered ? '4px 6px 16px rgba(199,199,194,0.3)' : 'none',
        transition: 'border-color 0.28s cubic-bezier(0.4,0,0.2,1), box-shadow 0.3s ease, transform 0.35s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'flex-start', padding: '10px 8px 0 10px', overflow: 'hidden' }}>
        <div style={{ fontFamily: 'var(--font-ui, sans-serif)', fontSize: 13, fontWeight: 500, color: '#1a1a1a', lineHeight: 1.35 }}>
          {card.name}
        </div>
        {card.shortDesc && (
          <div style={{
            fontSize: 12,
            color: '#303030',
            marginTop: cardHovered ? 0 : 4,
            maxHeight: cardHovered ? 0 : 24,
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
            opacity: cardHovered ? 0 : 1,
            transition: 'max-height 0.28s cubic-bezier(0.4,0,0.2,1), margin-top 0.28s cubic-bezier(0.4,0,0.2,1), opacity 0.2s',
          }}>
            {card.shortDesc}
          </div>
        )}
        {card.desc && (
          <div style={{
            fontSize: 12,
            color: '#363030',
            lineHeight: 1.4,
            maxHeight: cardHovered ? 80 : 0,
            overflow: 'hidden',
            marginTop: cardHovered ? 4 : 0,
            paddingBottom: cardHovered ? 5 : 0,
            transition: 'max-height 0.28s cubic-bezier(0.4,0,0.2,1), margin-top 0.28s cubic-bezier(0.4,0,0.2,1), padding-bottom 0.28s cubic-bezier(0.4,0,0.2,1)',
          }}>
            {card.desc}
          </div>
        )}
      </div>
      <div style={{
        width: cardHovered ? 86 : 0,
        overflow: 'visible',
        flexShrink: 0,
        transition: 'width 0.28s cubic-bezier(0.4,0,0.2,1)',
        pointerEvents: 'none',
      }}>
        <ThumbnailStack thumbnails={card.thumbnails} isVisible={cardHovered} parentHovered={cardHovered} />
      </div>
    </div>
  )
}

function formatResumeDate(date: string | null): string {
  if (!date) return 'Present'
  const [year, month] = date.split('-').map(Number)
  return new Date(year, month - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

export function PlaneResumeCard({
  card,
  index,
  planeHovered,
  onCardClick,
}: {
  card: ProfileResumeCard
  index: number
  planeHovered: boolean
  onCardClick?: (id: string) => void
}) {
  const parallaxY = planeHovered ? ([-3, -5][index] ?? -3) : 0
  const dateStr = `${formatResumeDate(card.dateStart)} — ${formatResumeDate(card.dateEnd)}`

  return (
    <div
      onClick={onCardClick ? (e) => { e.stopPropagation(); onCardClick(card.id) } : undefined}
      style={{
        position: 'relative',
        background: 'linear-gradient(to bottom, rgba(220,210,200,0.85) 0%, rgba(210,200,190,0.75) 100%)',
        borderLeft: 0,
        borderRight: 0,
        borderBottom: '3px solid #6B2A2A',
        borderTop: '6px solid #6B2A2A',
        borderRadius: 0,
        boxShadow: planeHovered ? '4px 6px 16px rgba(0,0,0,0.27)' : '0 2px 8px rgba(0,0,0,0.07)',
        transform: `translateY(${parallaxY}px)`,
        transition: 'box-shadow 0.3s ease, transform 0.35s cubic-bezier(0.4,0,0.2,1)',
        padding: '10px 16px 12px',
        width: 260,
        flexShrink: 0,
        cursor: 'pointer',
      }}
    >
      {/* Paper texture overlay */}
      <svg
        style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', opacity: 0.4, pointerEvents: 'none' }}
        aria-hidden="true"
      >
        <defs>
          <pattern id={`paper-${card.id}`} x="0" y="0" width="3" height="3" patternUnits="userSpaceOnUse">
            <line x1="0" y1="0" x2="0" y2="3" stroke="rgba(0,0,0,0.08)" strokeWidth="0.5" />
            <line x1="0" y1="0" x2="3" y2="0" stroke="rgba(0,0,0,0.08)" strokeWidth="0.5" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill={`url(#paper-${card.id})`} />
      </svg>
      {/* Corner accent — top-left triangle */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: 0, height: 0, borderStyle: 'solid', borderWidth: '0 0 10px 10px', borderColor: 'transparent transparent transparent #6B2A2A', zIndex: 2 }} />
      <div style={{ position: 'relative', zIndex: 1 }}>
        {/* Date — single line, sized to fit longest date range */}
        <div style={{
          fontFamily: 'var(--font-ui, sans-serif)',
          fontSize: 11,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          color: '#6a6a6a',
          whiteSpace: 'nowrap',
          marginBottom: 5,
        }}>
          {dateStr}
        </div>
        {/* Title (company) — prominent */}
        <div style={{
          fontFamily: 'var(--font-display, serif)',
          fontSize: 17,
          fontWeight: 600,
          color: '#111111',
          lineHeight: 1.25,
          marginBottom: 2,
        }}>
          {card.title}
        </div>
        {/* Subtitle (job title) */}
        {card.subtitle && (
          <div style={{
            fontFamily: 'var(--font-ui, sans-serif)',
            fontSize: 16,
            color: '#4a4a4a',
            marginBottom: card.planeDescription ? 5 : 0,
          }}>
            {card.subtitle}
          </div>
        )}
        {/* Plane description — 2 lines max, only if set */}
        {card.planeDescription && (
          <div style={{
            fontFamily: 'var(--font-ui, sans-serif)',
            fontSize: '0.75rem',
            color: '#5a5a5a',
            lineHeight: 1.4,
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          } as React.CSSProperties}>
            {card.planeDescription}
          </div>
        )}
      </div>
    </div>
  )
}

export function ProfilePlanes({ portfolioCards, resumeCards, education, jhuEntryId, onSwitchToPortfolio, onSwitchToResume, onCardSelect }: ProfilePlanesProps) {
  const [portfolioHovered, setPortfolioHovered] = useState(false)
  const [resumeHovered, setResumeHovered] = useState(false)
  const portfolioPlaneRef = useRef<HTMLDivElement>(null)

  const handlePortfolioMouseMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = portfolioPlaneRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    el.style.setProperty('--spotlight-x', `${e.clientX - rect.left}px`)
    el.style.setProperty('--spotlight-y', `${e.clientY - rect.top}px`)
  }, [])

  const resetSpotlight = useCallback(() => {
    const el = portfolioPlaneRef.current
    if (el) {
      el.style.setProperty('--spotlight-x', '-9999px')
      el.style.setProperty('--spotlight-y', '-9999px')
    }
  }, [])

  const handlePortfolioLeave = useCallback(() => {
    resetSpotlight()
    setPortfolioHovered(false)
  }, [resetSpotlight])

  // Boundary zone Y-split: upper 55px → portfolio hover, lower 55px → resume hover
  const handleHitAreaMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const relY = e.clientY - rect.top
    const el = portfolioPlaneRef.current
    if (relY < BOUNDARY_HEIGHT / 2) {
      setPortfolioHovered(true)
      setResumeHovered(false)
      if (el) {
        const planeRect = el.getBoundingClientRect()
        el.style.setProperty('--spotlight-x', `${e.clientX - planeRect.left}px`)
        el.style.setProperty('--spotlight-y', `${e.clientY - planeRect.top}px`)
      }
    } else {
      setPortfolioHovered(false)
      setResumeHovered(true)
      resetSpotlight()
    }
  }, [resetSpotlight])

  const handleHitAreaLeave = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const related = e.relatedTarget as Node | null
    const planeEl = portfolioPlaneRef.current
    if (planeEl && related instanceof Node && planeEl.contains(related)) {
      // Cursor moved into portfolio plane body — keep portfolioHovered, just clear resume
      setResumeHovered(false)
    } else {
      setPortfolioHovered(false)
      setResumeHovered(false)
      resetSpotlight()
    }
  }, [resetSpotlight])

  const handleResumePlaneMove = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const el = portfolioPlaneRef.current
    if (!el) return
    const portfolioBottom = el.getBoundingClientRect().bottom
    if (e.clientY < portfolioBottom) {
      setResumeHovered(false)
      setPortfolioHovered(true)
      const rect = el.getBoundingClientRect()
      el.style.setProperty('--spotlight-x', `${e.clientX - rect.left}px`)
      el.style.setProperty('--spotlight-y', `${e.clientY - rect.top}px`)
    }
  }, [])

  const handleHitAreaClick = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const relY = e.clientY - rect.top
    if (relY < BOUNDARY_HEIGHT / 2) {
      onSwitchToPortfolio()
    } else {
      onSwitchToResume()
    }
  }, [onSwitchToPortfolio, onSwitchToResume])

  const educationLines = education?.split('\n').filter(Boolean) ?? []

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minHeight: 0 }}>

      {/* Portfolio plane */}
      <div
        ref={portfolioPlaneRef}
        onMouseEnter={() => setPortfolioHovered(true)}
        onMouseLeave={handlePortfolioLeave}
        onMouseMove={handlePortfolioMouseMove}
        onClick={onSwitchToPortfolio}
        style={{
          height: 'calc(25vh - 45px)',
          background: '#0B0A0A',
          borderTop: '2px solid #6B2A2A',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'visible',
          position: 'relative',
          zIndex: 2,
          cursor: 'pointer',
          ['--spotlight-x' as any]: '-9999px',
          ['--spotlight-y' as any]: '-9999px',
        }}
      >
        {/* Spotlight overlay — extends into boundary zone */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: -BOUNDARY_HEIGHT,
          background: 'radial-gradient(500px circle at var(--spotlight-x) var(--spotlight-y), rgba(199,199,194,0.13), transparent 65%)',
          pointerEvents: 'none',
          zIndex: 2,
        }} />

        {/* Cards row */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-start',
          gap: 10,
          padding: '34px 32px 0',
          flexShrink: 0,
          marginLeft: 40,
          position: 'relative',
          zIndex: 2,
        }}>
          {portfolioCards.map((card, i) => (
            <PlaneNavCard
              key={card.id}
              card={card}
              index={i}
              planeHovered={portfolioHovered}
              onClick={onCardSelect ? () => onCardSelect(card.id, card.type) : undefined}
            />
          ))}
        </div>

        {/* Portfolio label — hangs into boundary zone */}
        <div style={{
          position: 'absolute',
          left: 0,
          bottom: -BOUNDARY_HEIGHT,
          display: 'inline-flex',
          alignItems: 'center',
          fontFamily: 'var(--font-ui, sans-serif)',
          fontSize: '2.25rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          color: portfolioHovered ? '#fc5454' : '#e0e0e0',
          letterSpacing: '0.02em',
          background: '#0B0A0A',
          padding: '14px 30px',
          borderRadius: 8,
          marginLeft: 20,
          zIndex: 1,
          transition: 'color 0.3s ease',
          pointerEvents: 'auto',
        }}
          onMouseEnter={() => { setPortfolioHovered(true); setResumeHovered(false) }}
        >
          Portfolio
          {/* Triangle tab extending right — top/bottom anchored to match label height */}
          <div style={{
            position: 'absolute',
            left: '100%',
            top: 0,
            bottom: 0,
            width: 150,
            background: '#0B0A0A',
            clipPath: 'polygon(0 0, 100% 0, 0 100%)',
            marginLeft: -5,
          }} />
        </div>

        {/* Boundary hit-area: upper half → portfolio hover, lower half → resume hover */}
        <div
          style={{ position: 'absolute', left: 0, right: 0, top: '100%', height: BOUNDARY_HEIGHT, pointerEvents: 'auto' }}
          onMouseEnter={() => setPortfolioHovered(true)}
          onMouseLeave={handleHitAreaLeave}
          onMouseMove={handleHitAreaMove}
          onClick={handleHitAreaClick}
        />
      </div>

      {/* Plane boundary — gradient strip */}
      <div style={{
        height: BOUNDARY_HEIGHT,
        flexShrink: 0,
        background: 'linear-gradient(to bottom, #0B0A0A 0 calc(50% - 1px), #6B2A2A calc(50% - 1px) calc(50% + 1px), #c7c7c2 calc(50% + 1px) 100%)',
        position: 'relative',
        zIndex: 1,
        pointerEvents: 'none',
      }} />

      {/* Resume plane */}
      <div
        onMouseEnter={() => setResumeHovered(true)}
        onMouseLeave={() => setResumeHovered(false)}
        onMouseMove={handleResumePlaneMove}
        onClick={() => onSwitchToResume()}
        style={{
          height: 'calc(30vh - 60px)',
          background: '#c7c7c2',
          flexShrink: 0,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'visible',
          position: 'relative',
          zIndex: 3,
          cursor: 'pointer',
        }}
      >
        {/* Dot pattern — fades in on hover, extends 110px upward into boundary zone */}
        <svg
          style={{ position: 'absolute', top: -BOUNDARY_HEIGHT, left: 0, width: '100%', height: `calc(100% + ${BOUNDARY_HEIGHT}px)`, pointerEvents: 'none', zIndex: 0, opacity: resumeHovered ? 1 : 0, transition: 'opacity 0.3s ease' }}
          aria-hidden="true"
        >
          <defs>
            <pattern id="profile-dot-pattern" x="0" y="0" width="10" height="10" patternUnits="userSpaceOnUse">
              <circle cx="1" cy="1" r="1" fill="rgba(0,0,0,0.08)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#profile-dot-pattern)" />
        </svg>

        {/* Education corner */}
        <div
          style={{ position: 'absolute', left: 80, top: 20, display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 2, pointerEvents: jhuEntryId ? 'auto' : 'none', cursor: jhuEntryId ? 'pointer' : 'default' }}
          onClick={jhuEntryId ? (e) => { e.stopPropagation(); onSwitchToResume(jhuEntryId) } : undefined}
        >
          <div style={{ position: 'relative', width: 250 }}>
            <img
              src="/jhu-black.svg"
              alt="Johns Hopkins University"
              style={{ width: 250, display: 'block', transition: 'opacity 0.3s ease', opacity: resumeHovered ? 0 : 1 }}
            />
            <img
              src="/jhu-blue.svg"
              alt="Johns Hopkins University"
              style={{ position: 'absolute', top: 0, left: 0, width: 250, display: 'block', transition: 'opacity 0.3s ease', opacity: resumeHovered ? 1 : 0 }}
            />
          </div>
          {educationLines.length > 0 && (
            <div style={{ fontSize: 14, color: '#5a5a5a', textAlign: 'center', marginTop: -8, lineHeight: 1.4, whiteSpace: 'nowrap' }}>
              {educationLines.map((line, i) => <div key={i}>{line}</div>)}
            </div>
          )}
        </div>

        {/* Resume label — hangs above into boundary zone */}
        <div style={{
          position: 'absolute',
          right: 0,
          bottom: 'calc(100% + 50px)',
          display: 'inline-flex',
          alignItems: 'center',
          fontFamily: 'var(--font-ui, sans-serif)',
          fontSize: '2.25rem',
          fontWeight: 700,
          textTransform: 'uppercase',
          color: resumeHovered ? '#6B2A2A' : '#111111',
          letterSpacing: '0.02em',
          background: '#c7c7c2',
          padding: '14px 30px',
          borderRadius: 8,
          marginRight: 30,
          zIndex: 4,
          transition: 'color 0.3s ease',
          pointerEvents: 'auto',
        }}>
          {/* Dot overlay covering label area */}
          <div style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px)',
            backgroundSize: '10px 10px',
            borderRadius: 8,
            opacity: resumeHovered ? 1 : 0,
            transition: 'opacity 0.3s ease',
            pointerEvents: 'none',
            zIndex: 0,
          }} />
          <span style={{ position: 'relative', zIndex: 1 }}>Resume</span>
          {/* Triangle tab extending left — top/bottom anchored to match label height */}
          <div style={{
            position: 'absolute',
            right: '100%',
            top: 0,
            bottom: 0,
            width: 150,
            background: '#c7c7c2',
            clipPath: 'polygon(100% 0, 100% 100%, 0 100%)',
            marginRight: -5,
          }}>
            {/* Dot overlay covering triangle tab */}
            <div style={{
              position: 'absolute',
              inset: 0,
              backgroundImage: 'radial-gradient(circle, rgba(0,0,0,0.08) 1px, transparent 1px)',
              backgroundSize: '10px 10px',
              opacity: resumeHovered ? 1 : 0,
              transition: 'opacity 0.3s ease',
              pointerEvents: 'none',
            }} />
          </div>
        </div>

        {/* Cards row — pointer-events none so boundary events reach portfolio plane hit-area */}
        <div style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'flex-end',
          gap: 12,
          padding: '20px 32px 15px',
          marginTop: -45,
          marginRight: 150,
          position: 'relative',
          zIndex: 2,
          pointerEvents: 'none',
        }}>
          {resumeCards.map((card, i) => (
            <div key={card.id} style={{ pointerEvents: 'auto' }}>
              <PlaneResumeCard card={card} index={i} planeHovered={resumeHovered} onCardClick={(id) => onSwitchToResume(id)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
