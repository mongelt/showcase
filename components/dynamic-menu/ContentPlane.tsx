'use client'

/**
 * Stage 9 — Content Plane (Stage 12 animation polish applied)
 *
 * Renders 1–3 content columns from computeContentColumns() output.
 *
 * Each column:
 *   - Starts with a SubheaderCard unless isActiveCollection (no subheader)
 *   - Items classified 'focus' or 'active' → ThumbCard
 *   - Items with pairingRole 'solo'  → PeriSolo
 *   - Items with pairingRole 'left'  → PeriPair (right item is nested, skip in loop)
 *   - Items with pairingRole 'right' → skip (rendered inside PeriPair)
 *   - Items classified 'related' with pairingRole 'none' (small column, pairing
 *     threshold not met) → ThumbCard at full size (spec §Related Card Pairing Rules)
 *
 * Auto-scroll: onMouseOver on the container delegates to scrollCardIntoView,
 * which uses data-menu-card / data-menu-column attributes to scroll hovered
 * cards into view.
 *
 * Entry animation: columns stagger in left-to-right with 40ms delay.
 * Exit animation: columns fade+slide out via AnimatePresence.
 * Card items: fade in on entry, fade out on removal (AnimatePresence per column).
 */

import React from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ContentColumn, ScoredContentItem } from '@/lib/menu/columnLayout'
import { ThumbCard } from './cards/ThumbCard'
import { PeriSolo } from './cards/PeriSolo'
import { PeriPair } from './cards/PeriPair'
import { SubheaderCard } from './cards/SubheaderCard'
import { useReducedMotion, dmTransition } from '@/lib/animations'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ContentPlaneProps {
  columns: ContentColumn[]
  activeContentId: string | null
  onContentClick: (id: string) => void
  /** Fires when a subheader is clicked — promotes that collection to active */
  onSubheaderClick: (collectionId: string) => void
  /** Max-height for each content column (px number or CSS string like 'calc(100vh - 380px)'). */
  colMaxHeight?: string | number
}

// ---------------------------------------------------------------------------
// Auto-scroll helper
// ---------------------------------------------------------------------------

function scrollCardIntoView(e: React.MouseEvent<HTMLDivElement>): void {
  const card = (e.target as HTMLElement).closest('[data-menu-card]') as HTMLElement | null
  if (!card) return
  const col = card.closest('[data-menu-column]') as HTMLElement | null
  if (!col) return
  // Use estimated expanded height (matches prototype): accounts for card height after hover
  const EXPANDED_H = 155
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
// Column item renderer
// ---------------------------------------------------------------------------

function renderColumnItems(
  items: ScoredContentItem[],
  activeContentId: string | null,
  onContentClick: (id: string) => void,
  trans: ReturnType<typeof dmTransition>,
): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  const rendered = new Set<string>()

  for (const item of items) {
    if (rendered.has(item.id)) continue

    // -- PeriPair: left card renders both --
    if (item.pairingRole === 'left' && item.pairWithId) {
      const right = items.find(i => i.id === item.pairWithId)
      if (right) {
        rendered.add(right.id)
        nodes.push(
          <motion.div
            key={`pair-${item.id}`}
            data-menu-card="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={trans}
          >
            <PeriPair
              left={{
                name: item.name,
                shortTitle: item.shortTitle,
                shortDesc: item.shortDesc,
                periDesc: item.periDesc,
                desc: item.desc,
                publication: item.publication,
                year: item.year,
                thumbnail: item.thumbnail,
              }}
              right={{
                name: right.name,
                shortTitle: right.shortTitle,
                shortDesc: right.shortDesc,
                periDesc: right.periDesc,
                desc: right.desc,
                publication: right.publication,
                year: right.year,
                thumbnail: right.thumbnail,
              }}
              onLeftClick={() => onContentClick(item.id)}
              onRightClick={() => onContentClick(right.id)}
            />
          </motion.div>
        )
        continue
      }
    }

    // -- Skip right-of-pair (already rendered inside PeriPair above) --
    if (item.pairingRole === 'right') continue

    // -- PeriSolo: isolated related item --
    if (item.pairingRole === 'solo') {
      nodes.push(
        <motion.div
          key={item.id}
          data-menu-card="true"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={trans}
        >
          <PeriSolo
            name={item.name}
            shortTitle={item.shortTitle}
            shortDesc={item.shortDesc}
            periDesc={item.periDesc}
            desc={item.desc}
            publication={item.publication}
            year={item.year}
            thumbnail={item.thumbnail}
            onClick={() => onContentClick(item.id)}
          />
        </motion.div>
      )
      continue
    }

    // -- ThumbCard: focus, active, or related with pairingRole='none' --
    nodes.push(
      <motion.div
        key={item.id}
        data-menu-card="true"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={trans}
      >
        <ThumbCard
          name={item.name}
          shortDesc={item.shortDesc}
          desc={item.desc}
          publication={item.publication}
          year={item.year}
          score={item.score}
          isActive={item.id === activeContentId}
          thumbnail={item.thumbnail}
          onClick={() => onContentClick(item.id)}
        />
      </motion.div>
    )
  }

  return nodes
}

// ---------------------------------------------------------------------------
// ContentPlane
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Render-group helpers
// ---------------------------------------------------------------------------

type RenderGroup =
  | { kind: 'single'; column: ContentColumn; staggerIdx: number }
  | { kind: 'split'; primary: ContentColumn; continuation: ContentColumn; staggerIdx: number }

function buildRenderGroups(columns: ContentColumn[]): RenderGroup[] {
  const groups: RenderGroup[] = []
  let i = 0
  let staggerIdx = 0
  while (i < columns.length) {
    const col = columns[i]
    const next = columns[i + 1]
    if (
      col.subheaderSpansTwo &&
      next?.isContinuation &&
      next?.collectionId === col.collectionId
    ) {
      groups.push({ kind: 'split', primary: col, continuation: next, staggerIdx })
      staggerIdx += 2
      i += 2
    } else {
      groups.push({ kind: 'single', column: col, staggerIdx })
      staggerIdx++
      i++
    }
  }
  return groups
}

// ---------------------------------------------------------------------------
// Scrollable items column
// ---------------------------------------------------------------------------

function ItemsColumn({
  column,
  activeContentId,
  onContentClick,
  colMaxHeight,
  trans,
  width = 300,
  useFlexHeight = false,
}: {
  column: ContentColumn
  activeContentId: string | null
  onContentClick: (id: string) => void
  colMaxHeight?: string | number
  trans: ReturnType<typeof dmTransition>
  width?: number
  /**
   * When true the div uses flex:1 + minHeight:0 so a parent flex container
   * controls the height (single-column bounded wrapper). When false it uses
   * maxHeight directly (split-pair items columns).
   */
  useFlexHeight?: boolean
}) {
  return (
    <div
      className="dm-content-col"
      data-menu-column="true"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        width,
        flexShrink: 0,
        overflowY: 'auto',
        scrollbarWidth: 'none',
        paddingTop: 12,
        ...(useFlexHeight ? { flex: 1, minHeight: 0 } : { maxHeight: colMaxHeight }),
      }}
    >
      <AnimatePresence initial={false}>
        {renderColumnItems(column.items, activeContentId, onContentClick, trans)}
      </AnimatePresence>
    </div>
  )
}

// ---------------------------------------------------------------------------
// ContentPlane
// ---------------------------------------------------------------------------

export function ContentPlane({
  columns,
  activeContentId,
  onContentClick,
  onSubheaderClick,
  colMaxHeight,
}: ContentPlaneProps) {
  const reduced = useReducedMotion()
  const trans = dmTransition(reduced)

  if (columns.length === 0) return null

  const groups = buildRenderGroups(columns)

  // For split pairs the items columns sit below a subheader (~42px) + gap (4px).
  // Reduce their maxHeight so the total pair height stays within colMaxHeight.
  const reducedMaxHeight = colMaxHeight
    ? typeof colMaxHeight === 'string'
      ? `calc(${colMaxHeight} - 46px)`
      : (colMaxHeight as number) - 46
    : undefined

  return (
    <>
      {/* Scrollbar hide for WebKit — can't be done via inline style */}
      <style>{`.dm-content-col::-webkit-scrollbar { display: none; }`}</style>

      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          gap: 8,
          alignItems: 'flex-start',
        }}
        onMouseOver={scrollCardIntoView}
      >
        <AnimatePresence initial={false}>
          {groups.map(group => {

            // ── Split pair: 600px subheader above two side-by-side item columns ──
            if (group.kind === 'split') {
              const { primary, continuation, staggerIdx } = group
              const allThumbnails = [...primary.items, ...continuation.items]
                .filter(item => item.thumbnail)
                .slice(0, 5)
                .map(item => item.thumbnail!)
              return (
                <motion.div
                  key={`split-${primary.collectionId}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 8 }}
                  transition={{ ...trans, delay: reduced ? 0 : staggerIdx * 0.04 }}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    flexShrink: 0,
                  }}
                >
                  {/* 600px subheader above both item columns */}
                  <motion.div
                    key={`sh-${primary.collectionId}`}
                    data-menu-card="true"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={trans}
                  >
                    <SubheaderCard
                      name={primary.collectionName!}
                      shortDesc={primary.collectionShortDesc}
                      desc={primary.collectionDesc}
                      itemCount={primary.items.length + continuation.items.length}
                      thumbnails={allThumbnails}
                      isCollectionActive={false}
                      columns={2}
                      onClick={() => onSubheaderClick(primary.collectionId!)}
                    />
                  </motion.div>

                  {/* Two item columns sit naturally below the subheader.
                      reducedMaxHeight accounts for the subheader height so the
                      total pair height stays within colMaxHeight. */}
                  <div style={{ display: 'flex', flexDirection: 'row', gap: 8 }}>
                    <ItemsColumn
                      column={primary}
                      activeContentId={activeContentId}
                      onContentClick={onContentClick}
                      colMaxHeight={reducedMaxHeight}
                      trans={trans}
                    />
                    <ItemsColumn
                      column={continuation}
                      activeContentId={activeContentId}
                      onContentClick={onContentClick}
                      colMaxHeight={reducedMaxHeight}
                      trans={trans}
                    />
                  </div>
                </motion.div>
              )
            }

            // ── Single column ──
            const { column, staggerIdx } = group
            const hasSubheader = !column.isContinuation && !column.isActiveCollection
              && !!column.collectionId && !!column.collectionName
            return (
              <motion.div
                key={`${column.collectionId ?? '__uncollected__'}${column.isContinuation ? '__cont' : ''}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={{ ...trans, delay: reduced ? 0 : staggerIdx * 0.04 }}
                style={{ display: 'flex', flexDirection: 'column', width: 300, flexShrink: 0 }}
              >
                {/* Bounded wrapper: subheader + items share colMaxHeight.
                    Subheader is flexShrink:0; items flex:1 fills what remains.
                    This prevents the column from growing taller than colMaxHeight
                    and pushing the collection row down. */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, maxHeight: colMaxHeight }}>
                  {hasSubheader && (
                    <motion.div
                      key={`sh-${column.collectionId}`}
                      data-menu-card="true"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={trans}
                      style={{ flexShrink: 0 }}
                    >
                      <SubheaderCard
                        name={column.collectionName!}
                        shortDesc={column.collectionShortDesc}
                        desc={column.collectionDesc}
                        itemCount={column.items.length}
                        thumbnails={column.items
                          .filter(item => item.thumbnail)
                          .slice(0, 5)
                          .map(item => item.thumbnail!)}
                        isCollectionActive={false}
                        columns={1}
                        onClick={() => onSubheaderClick(column.collectionId!)}
                      />
                    </motion.div>
                  )}

                  <ItemsColumn
                    column={column}
                    activeContentId={activeContentId}
                    onContentClick={onContentClick}
                    colMaxHeight={colMaxHeight}
                    trans={trans}
                    useFlexHeight={true}
                  />
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </>
  )
}
