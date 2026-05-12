'use client'

/**
 * Stage 13 — Collapsed Menu Bar (updated Stage 18)
 *
 * Thin fixed bar shown when pageState='collapsed-reader'.
 *
 * Always shows collapsed cards — no text breadcrumbs:
 *   [NavCard cat] | [NavCard subcat] | [NavCard content]       [CollectionCard]
 *   Separators are 1px × 10px vertical lines in accent-light color.
 *
 * Category and subcategory use NavCard variant="collapsed" (90px at rest).
 * Content uses NavCard variant="collapsed" — no dedicated small content card.
 * CollectionCard at rest: 140px, expands to 290px on individual hover.
 * Each card handles its own hover expansion internally.
 *
 * On bar hover: bar background expands slightly via padding animation,
 * giving cards a little breathing room.
 *
 * Click handlers:
 *   Category card  → selectCategory → expand (State 2)
 *   Subcategory card → selectSubcategory → expand (State 3)
 *   Content card   → clearContent (keep subcategory anchor) → expand (State 3)
 *   Collection card → selectCollection → expand (State 5/6)
 *   Empty space    → expand with current DynamicMenu state
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { NavCard } from './cards/NavCard'
import { CollectionCard } from './cards/CollectionCard'
import { useReducedMotion } from '@/lib/animations'
import type { ScoredCategory } from './CategoryPlane'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface BarSubcategoryData {
  id: string
  name: string
  shortDesc?: string
  desc?: string
  score: number
  thumbnails?: string[]
}

export interface BarContentData {
  id: string
  name: string
  thumbnail?: string
  publication?: string
  year?: number
  score: number
}

export interface BarCollectionData {
  id: string
  name: string
  shortTitle?: string
  shortDesc?: string
  desc?: string
  score: number
  thumbnails?: string[]
}

export interface CollapsedMenuBarProps {
  profileHeight: number
  activeCategoryData: ScoredCategory | null
  activeSubcategoryData: BarSubcategoryData | null
  activeContentData: BarContentData | null
  activeCollectionData: BarCollectionData | null
  onCategoryClick: () => void
  onSubcategoryClick: () => void
  onContentClick: () => void
  onCollectionClick: () => void
  /** Called when user clicks empty space in the bar */
  onExpand: () => void
}

// ---------------------------------------------------------------------------
// Separator — 1px × 10px vertical line in accent-light color
// ---------------------------------------------------------------------------

function Sep() {
  return (
    <div
      style={{
        width: 1,
        height: 10,
        background: 'var(--accent-light)',
        opacity: 0.4,
        flexShrink: 0,
        alignSelf: 'center',
        margin: '0 6px',
      }}
    />
  )
}

// ---------------------------------------------------------------------------
// CollapsedMenuBar
// ---------------------------------------------------------------------------

export function CollapsedMenuBar({
  profileHeight,
  activeCategoryData,
  activeSubcategoryData,
  activeContentData,
  activeCollectionData,
  onCategoryClick,
  onSubcategoryClick,
  onContentClick,
  onCollectionClick,
  onExpand,
}: CollapsedMenuBarProps) {
  const [isBarHovered, setIsBarHovered] = useState(false)
  const reduced = useReducedMotion()
  const DUR = reduced ? 0 : 0.18

  return (
    <motion.div
      className="fixed z-30 bg-bg-menu-bar border-t-2 border-accent-light"
      animate={{
        paddingTop: isBarHovered ? 10 : 4,
        paddingBottom: isBarHovered ? 10 : 4,
      }}
      transition={{ duration: DUR, ease: [0.4, 0, 0.2, 1] }}
      style={{
        top: profileHeight ? `${profileHeight}px` : '200px',
        left: 0,
        width: '100%',
        minHeight: 64,
        overflow: 'visible',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 60,
        paddingRight: 60,
        cursor: 'pointer',
      }}
      onClick={onExpand}
      onMouseEnter={() => setIsBarHovered(true)}
      onMouseLeave={() => setIsBarHovered(false)}
    >
      {/* Left: collapsed cards for category, subcategory, content */}
      <div
        style={{ display: 'flex', alignItems: 'center' }}
        onClick={(e) => e.stopPropagation()}
      >
        {activeCategoryData && (
          <>
            <NavCard
              variant="collapsed"
              name={activeCategoryData.name}
              shortDesc={activeCategoryData.shortDesc}
              desc={activeCategoryData.desc}
              score={activeCategoryData.score}
              isActive
              thumbnails={activeCategoryData.thumbnails ?? []}
              onClick={onCategoryClick}
            />
            {(activeSubcategoryData || activeContentData) && <Sep />}
          </>
        )}

        {activeSubcategoryData && (
          <>
            <NavCard
              variant="collapsed"
              name={activeSubcategoryData.name}
              shortDesc={activeSubcategoryData.shortDesc}
              desc={activeSubcategoryData.desc}
              score={activeSubcategoryData.score}
              isActive
              thumbnails={activeSubcategoryData.thumbnails ?? []}
              onClick={onSubcategoryClick}
            />
            {activeContentData && <Sep />}
          </>
        )}

        {activeContentData && (
          <NavCard
            variant="collapsed"
            name={activeContentData.name}
            score={activeContentData.score}
            isActive
            thumbnails={activeContentData.thumbnail ? [activeContentData.thumbnail] : []}
            onClick={onContentClick}
          />
        )}
      </div>

      {/* Right: CollectionCard at rest (140px) — expands on individual hover */}
      {activeCollectionData && (
        <div
          style={{ flexShrink: 0 }}
          onClick={(e) => { e.stopPropagation(); onCollectionClick() }}
        >
          <CollectionCard
            name={activeCollectionData.name}
            shortTitle={activeCollectionData.shortTitle ?? activeCollectionData.name}
            shortDesc={activeCollectionData.shortDesc}
            desc={activeCollectionData.desc}
            score={activeCollectionData.score}
            isActive={false}
            thumbnails={activeCollectionData.thumbnails ?? []}
            onClick={onCollectionClick}
          />
        </div>
      )}
    </motion.div>
  )
}
