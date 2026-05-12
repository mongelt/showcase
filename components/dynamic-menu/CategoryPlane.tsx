'use client'

/**
 * Stage 8 — Category Plane (Stage 12 animation polish applied)
 *
 * Left panel of the dynamic menu. Three modes:
 *
 * Expanded (isCollapsed=false)
 *   Both columns 300px. NavCard expanded variant. Subcategory column
 *   hidden when no category is selected.
 *
 * Collapsed (isCollapsed=true, not hovering)
 *   Both columns 90px. NavCard collapsed variant. NavCard handles its own
 *   Framer Motion width animation internally (90→300 on individual hover).
 *
 * Hover-overlay (isCollapsed=true, user hovers the plane)
 *   Plane becomes position:absolute, z-index:20. Semi-transparent dark
 *   background, drop shadow, and padding animate in. NavCard receives
 *   isHoverOverlay=true — expands to 300px plane-wide with NO remount.
 *   Individual card hover only swaps shortDesc→desc and reveals thumbnail.
 */

import React, { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { NavCard } from './cards/NavCard'
import { PeriSolo } from './cards/PeriSolo'
import { PeriPair, PeriCardData } from './cards/PeriPair'
import { ScoredSubcategory } from '@/lib/menu/subcategoryLayout'
import { useReducedMotion, dmTransition } from '@/lib/animations'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ScoredCategory {
  id: string
  name: string
  shortDesc?: string
  desc?: string
  /** Thumbnail URLs derived from content items in this category (up to 5) */
  thumbnails?: string[]
  score: number
  classification: 'active' | 'focus' | 'related' | 'hidden'
}

export interface CategoryPlaneProps {
  categories: ScoredCategory[]
  subcategories: ScoredSubcategory[]
  activeCategoryId: string | null
  activeSubcategoryId: string | null
  /** True when the content plane is active (subcategory selected or collection active) */
  isCollapsed: boolean
  /** Max-height for nav columns (px number or CSS string like 'calc(100vh - 300px)').
   *  Required because CategoryPlane can be position:absolute so height:100% won't
   *  resolve against the flex flow. */
  colMaxHeight?: string | number
  onCategoryClick: (id: string) => void
  onSubcategoryClick: (id: string) => void
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Renders subcategory items with pairing support.
 * Pairing applies only in expanded/hover-overlay mode with >5 subcategories.
 * Paired `right` items are skipped — already consumed by their `left` sibling.
 */
function renderSubcategoryItems(
  subcategories: ScoredSubcategory[],
  activeSubcategoryId: string | null,
  useExpanded: boolean,
  isHoverOverlay: boolean,
  onSubcategoryClick: (id: string) => void,
): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  const rendered = new Set<string>()

  for (const sub of subcategories) {
    if (rendered.has(sub.id)) continue

    // Peri-pair: left card renders both cards; right is skipped
    if (useExpanded && sub.pairingRole === 'left' && sub.pairWithId) {
      const right = subcategories.find(s => s.id === sub.pairWithId)
      if (right) {
        rendered.add(right.id)
        const leftData: PeriCardData = {
          name: sub.name,
          shortTitle: sub.shortTitle,
          shortDesc: sub.shortDesc,
          periDesc: sub.periDesc,
          desc: sub.desc,
          thumbnails: sub.thumbnails,
        }
        const rightData: PeriCardData = {
          name: right.name,
          shortTitle: right.shortTitle,
          shortDesc: right.shortDesc,
          periDesc: right.periDesc,
          desc: right.desc,
          thumbnails: right.thumbnails,
        }
        nodes.push(
          <div key={`pair-${sub.id}`} data-menu-card="true" style={{ flexShrink: 0 }}>
            <PeriPair
              left={leftData}
              right={rightData}
              layout="nav"
              onLeftClick={() => onSubcategoryClick(sub.id)}
              onRightClick={() => onSubcategoryClick(right.id)}
            />
          </div>
        )
        continue
      }
    }

    // Peri-solo: isolated related subcategory
    if (useExpanded && sub.pairingRole === 'solo') {
      nodes.push(
        <div key={sub.id} data-menu-card="true" style={{ flexShrink: 0 }}>
          <PeriSolo
            name={sub.name}
            shortTitle={sub.shortTitle}
            shortDesc={sub.shortDesc}
            periDesc={sub.periDesc}
            desc={sub.desc}
            thumbnails={sub.thumbnails}
            layout="nav"
            onClick={() => onSubcategoryClick(sub.id)}
          />
        </div>
      )
      continue
    }

    // Skip right-of-pair items that sneak through (shouldn't happen, but safe guard)
    if (useExpanded && sub.pairingRole === 'right') continue

    // Regular NavCard (active, focus, or related in small/collapsed columns)
    nodes.push(
      <div key={sub.id} data-menu-card="true" style={{ flexShrink: 0 }}>
        <NavCard
          variant={useExpanded ? 'expanded' : 'collapsed'}
          isHoverOverlay={isHoverOverlay}
          name={sub.name}
          shortDesc={sub.shortDesc}
          desc={sub.desc}
          score={sub.score}
          isActive={sub.id === activeSubcategoryId}
          thumbnails={sub.thumbnails ?? []}
          onClick={() => onSubcategoryClick(sub.id)}
        />
      </div>
    )
  }

  return nodes
}

// ---------------------------------------------------------------------------
// Auto-scroll helper (same algorithm as ContentPlane)
// ---------------------------------------------------------------------------

function scrollCardIntoView(e: React.MouseEvent<HTMLDivElement>): void {
  const card = (e.target as HTMLElement).closest('[data-menu-card]') as HTMLElement | null
  if (!card) return
  const col = card.closest('[data-menu-column]') as HTMLElement | null
  if (!col) return
  // Estimated expanded height for nav-cards (matches prototype value)
  const EXPANDED_H = 150
  const colRect = col.getBoundingClientRect()
  const cardRect = card.getBoundingClientRect()
  const cardTopInCol = cardRect.top - colRect.top + col.scrollTop
  const cardExpandedBottom = cardTopInCol + EXPANDED_H
  const colH = col.clientHeight
  if (cardExpandedBottom > col.scrollTop + colH) {
    col.scrollTop = cardExpandedBottom - colH + 12
  } else if (cardTopInCol < col.scrollTop) {
    col.scrollTop = cardTopInCol - 8
  }
}

// ---------------------------------------------------------------------------
// CategoryPlane
// ---------------------------------------------------------------------------

export function CategoryPlane({
  categories,
  subcategories,
  activeCategoryId,
  activeSubcategoryId,
  isCollapsed,
  colMaxHeight,
  onCategoryClick,
  onSubcategoryClick,
}: CategoryPlaneProps) {
  const [isOverlay, setIsOverlay] = useState(false)
  const reduced = useReducedMotion()
  const trans = dmTransition(reduced)

  // Hover-overlay only activates when the content plane is also active
  const isHoverOverlay = isCollapsed && isOverlay

  // useExpanded: whether to use expanded-style cards (PeriSolo/PeriPair shown, NavCard 300px)
  const useExpanded = !isCollapsed || isHoverOverlay

  // Subcategory column is only shown when a category is selected
  const showSubcategories = activeCategoryId !== null

  // Subcategory column container width — matches the card width the column holds
  const subcatColWidth = useExpanded ? 300 : 90

  return (
    <motion.div
      onMouseEnter={() => { if (isCollapsed) setIsOverlay(true) }}
      onMouseLeave={() => setIsOverlay(false)}
      onMouseOver={scrollCardIntoView}
      animate={{
        background: isHoverOverlay ? 'rgba(11, 10, 10, 0.75)' : 'rgba(0,0,0,0)',
        boxShadow: isHoverOverlay
          ? '8px 0 28px rgba(0, 0, 0, 0.55)'
          : '0px 0px 0px rgba(0,0,0,0)',
        // Animate padding so the overlay container expansion doesn't jump
        padding: isHoverOverlay ? 8 : 0,
      }}
      transition={trans}
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: 8,
        flexShrink: 0,
        // When collapsed, always absolute so the content plane never shifts on hover.
        // The parent DynamicMenu Row 1 (position:relative) provides the positioning context.
        // A spacer sibling holds the collapsed footprint so content doesn't move.
        // When expanded (States 1–2), no content plane exists — use normal flow (relative).
        ...(isCollapsed
          ? {
              position: 'absolute',
              top: 0,
              bottom: 0,
              left: 0,
              zIndex: isHoverOverlay ? 20 : 2,
            }
          : {
              position: 'relative',
            }),
      }}
    >
      <style>{`.dm-nav-col::-webkit-scrollbar { display: none; }`}</style>

      {/* ------------------------------------------------------------------ */}
      {/* Category column                                                      */}
      {/* ------------------------------------------------------------------ */}
      <div
        data-menu-column="true"
        className="dm-nav-col"
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 4,
          flexShrink: 0,
          overflowY: 'auto',
          scrollbarWidth: 'none' as const,
          maxHeight: colMaxHeight,
          // paddingTop gives first card's thumbnail lift room above the column
          paddingTop: 12,
        }}
      >
        {categories.map(cat => (
          // NavCard handles its own Framer Motion width animation internally —
          // no wrapper width animation needed (avoids double-animation conflict).
          <div key={cat.id} data-menu-card="true" style={{ flexShrink: 0 }}>
            <NavCard
              variant={isCollapsed ? 'collapsed' : 'expanded'}
              isHoverOverlay={isHoverOverlay}
              name={cat.name}
              shortDesc={cat.shortDesc}
              desc={cat.desc}
              score={cat.score}
              isActive={cat.id === activeCategoryId}
              thumbnails={cat.thumbnails ?? []}
              onClick={() => onCategoryClick(cat.id)}
            />
          </div>
        ))}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Subcategory column                                                   */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence>
        {showSubcategories && (
          <motion.div
            key="subcat-col"
            data-menu-column="true"
            className="dm-nav-col"
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: subcatColWidth, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={trans}
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
              flexShrink: 0,
              overflowY: 'auto',
              overflowX: 'visible',
              scrollbarWidth: 'none' as const,
              maxHeight: colMaxHeight,
              paddingTop: 12,
            }}
          >
            {renderSubcategoryItems(
              subcategories,
              activeSubcategoryId,
              useExpanded,
              isHoverOverlay,
              onSubcategoryClick,
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
