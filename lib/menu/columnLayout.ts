/**
 * Stage 7b — Content Column Computation
 * Pure utility. No React, no Supabase. Takes scored content → returns up to 3 columns.
 * Implements the 7-step Candidate Computation algorithm from spec §Candidate Computation.
 */

import { ScoreResult } from './scoring'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface ContentItemForLayout {
  id: string
  /** sidebar_title — shown in 300px cards */
  name: string
  /** short_title — shown in 150px compact cards */
  shortTitle?: string
  shortDesc?: string
  periDesc?: string
  desc?: string
  /** menu_thumbnail_url */
  thumbnail?: string
  publication?: string
  year?: number
  order_index: number
  /** All collection IDs this item belongs to */
  collectionIds: string[]
}

export interface CollectionInfo {
  id: string
  name: string
  shortDesc?: string
  desc?: string
}

export interface ScoredContentItem extends ContentItemForLayout {
  score: number
  classification: 'active' | 'focus' | 'related'
  /**
   * none  — no pairing (focus/active items, or related in small columns)
   * solo  — related, isolated; renders as PeriSolo
   * left  — left card of a peri-pair; renders as PeriPair
   * right — right card; contained within left's PeriPair, skipped in main render loop
   */
  pairingRole: 'none' | 'solo' | 'left' | 'right'
  /** ID of the right-card partner. Set only when pairingRole === 'left'. */
  pairWithId?: string
  /** True when the item's position in the column exceeds the unscrolled viewport. */
  overflowsViewport: boolean
}

export interface ContentColumn {
  /** null = uncollected group */
  collectionId: string | null
  collectionName: string | null
  collectionShortDesc?: string
  collectionDesc?: string
  /** True when this column belongs to the active collection (no subheader rendered). */
  isActiveCollection: boolean
  /**
   * True when this column is the second half of a split collection.
   * No subheader is rendered — it visually continues under the wide subheader of the
   * preceding column.
   */
  isContinuation: boolean
  /**
   * True when this column's subheader should render at 600px (spanning two column widths).
   * Set only on the primary column of a split pair, never on continuations or active-collection columns.
   */
  subheaderSpansTwo: boolean
  items: ScoredContentItem[]
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/** Returns the primary collection ID for a qualifying item. */
function getPrimaryCollectionId(
  collectionIds: string[],
  activeCollectionId: string | null,
  qualifyingCountByCollection: Map<string, number>,
): string | null {
  if (collectionIds.length === 0) return null

  // Active collection takes priority (spec §Step 3)
  if (activeCollectionId && collectionIds.includes(activeCollectionId)) {
    return activeCollectionId
  }

  // Otherwise: the collection with the most qualifying items in the current set
  let bestId: string | null = null
  let bestCount = -1
  for (const cid of collectionIds) {
    const count = qualifyingCountByCollection.get(cid) ?? 0
    if (count > bestCount) {
      bestCount = count
      bestId = cid
    }
  }
  return bestId
}

/** Average score of a group of items. */
function avgScore(items: Array<{ score: number }>): number {
  if (items.length === 0) return 0
  return items.reduce((sum, i) => sum + i.score, 0) / items.length
}

/** Sort items by score desc, then order_index asc. */
function sortItems<T extends { score: number; order_index: number }>(items: T[]): void {
  items.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score
    return a.order_index - b.order_index
  })
}

/**
 * Apply pairing rules to a column's items (Step 7).
 *
 * Conditions for pairing to apply (spec §Related Card Pairing Rules):
 *   - At least one item overflows the unscrolled viewport
 *   - At least 2 related-state items in the column
 *
 * Pairing is only triggered when items actually overflow — if all items fit
 * in the unscrolled viewport at full size, there is no reason to compact them.
 * The overflowsViewport flag is set on each item before this function is called.
 *
 * Algorithm: scan in render order. Two consecutive related → pair (left/right).
 * Isolated related → solo. Non-related items (focus/active) are never paired.
 *
 * When pairing does NOT apply, all items keep pairingRole 'none' and related
 * items render at full thumb-card size (spec: "All cards render at full size").
 */
function applyPairing(items: ScoredContentItem[]): void {
  // Only pair when content actually overflows the unscrolled viewport
  if (!items.some(i => i.overflowsViewport)) return

  const relatedCount = items.filter(i => i.classification === 'related').length
  if (relatedCount < 2) return

  // Pair consecutive related items; isolates become solo
  let i = 0
  while (i < items.length) {
    if (items[i].classification === 'related') {
      if (i + 1 < items.length && items[i + 1].classification === 'related') {
        items[i].pairingRole = 'left'
        items[i].pairWithId = items[i + 1].id
        items[i + 1].pairingRole = 'right'
        i += 2
      } else {
        items[i].pairingRole = 'solo'
        i++
      }
    } else {
      i++
    }
  }
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Computes up to 3 content columns from all qualifying content items.
 *
 * @param allContent   All content items with layout fields + collectionIds
 * @param allCollections  All collections (for column name lookup)
 * @param scores       Score results from the scoring engine for current anchor
 * @param activeCollectionId  Currently active collection (gets first slot, no subheader)
 */
export function computeContentColumns(
  allContent: ContentItemForLayout[],
  allCollections: CollectionInfo[],
  scores: ScoreResult[],
  activeCollectionId: string | null,
): ContentColumn[] {
  // --- Step 1: Filter to score > 0.00 ---
  const scoreMap = new Map(scores.map(s => [s.entityId, s]))

  type ScoredItem = ContentItemForLayout & {
    score: number
    classification: 'active' | 'focus' | 'related'
  }

  const qualifying: ScoredItem[] = []
  for (const item of allContent) {
    const sr = scoreMap.get(item.id)
    if (sr && sr.score > 0) {
      qualifying.push({
        ...item,
        score: sr.score,
        classification: sr.classification as 'active' | 'focus' | 'related',
      })
    }
  }

  if (qualifying.length === 0) return []

  // --- Step 2: Determine primary collection per item ---
  // Build count of qualifying items per collection first
  const qualifyingCountByCollection = new Map<string, number>()
  for (const item of qualifying) {
    for (const cid of item.collectionIds) {
      qualifyingCountByCollection.set(cid, (qualifyingCountByCollection.get(cid) ?? 0) + 1)
    }
  }

  type ScoredItemWithPrimary = ScoredItem & { primaryCollectionId: string | null }

  const itemsWithPrimary: ScoredItemWithPrimary[] = qualifying.map(item => ({
    ...item,
    primaryCollectionId: getPrimaryCollectionId(
      item.collectionIds,
      activeCollectionId,
      qualifyingCountByCollection,
    ),
  }))

  // --- Step 3: Group by primary collection ---
  const groups = new Map<string | null, ScoredItemWithPrimary[]>()

  for (const item of itemsWithPrimary) {
    const key = item.primaryCollectionId
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(item)
  }

  // --- Step 3 (cont): Sort items within each group (score desc, then order_index) ---
  for (const items of groups.values()) {
    sortItems(items)
  }

  // --- Step 4: Sort groups by average score, active collection always first ---
  const sortedGroupKeys = [...groups.keys()].sort((a, b) => {
    // Only give priority when activeCollectionId is actually set (not null).
    // null key = uncollected group — must NOT be confused with null activeCollectionId.
    if (activeCollectionId !== null && a === activeCollectionId) return -1
    if (activeCollectionId !== null && b === activeCollectionId) return 1
    return avgScore(groups.get(b)!) - avgScore(groups.get(a)!)
  })

  // --- Step 5: Assign columns (max 3) and handle overflow groups ---
  const MAX_COLUMNS = 3
  const assignedKeys = sortedGroupKeys.slice(0, MAX_COLUMNS)
  const overflowKeys = sortedGroupKeys.slice(MAX_COLUMNS)

  const assignedKeySet = new Set(assignedKeys)

  // Reassign overflow items to existing columns or the uncollected group
  for (const key of overflowKeys) {
    const overflowItems = groups.get(key) ?? []
    for (const item of overflowItems) {
      // Try to find an alternative collection that already has a column
      const altCollectionId = item.collectionIds.find(cid => assignedKeySet.has(cid))
      const targetKey = altCollectionId !== undefined ? altCollectionId : null

      if (!groups.has(targetKey)) groups.set(targetKey, [])
      groups.get(targetKey)!.push(item)
    }
    groups.delete(key)
  }

  // Re-sort items in groups that received overflow items
  for (const key of assignedKeys) {
    const items = groups.get(key)
    if (items) sortItems(items)
  }

  // If uncollected group (null) gained items from overflow and isn't already assigned,
  // give it a column by bumping the last non-active assigned group.
  const uncollectedItems = groups.get(null) ?? []
  if (uncollectedItems.length > 0 && !assignedKeySet.has(null)) {
    if (assignedKeys.length < MAX_COLUMNS) {
      assignedKeys.push(null)
      assignedKeySet.add(null)
    } else {
      // Bump the last non-active group to make room for uncollected
      const lastIdx = assignedKeys.length - 1
      const lastKey = assignedKeys[lastIdx]
      if (lastKey !== activeCollectionId) {
        assignedKeys[lastIdx] = null
        // Items from the bumped group that can't find alternative columns are
        // effectively absorbed or excluded. This is an uncommon edge case.
      }
    }
  }

  // --- Step 5b: Determine column splits ---
  // If a collection's items exceed the unscrolled slot limit for its column type AND
  // a free column slot exists, split it into a primary column + a continuation column.
  //   - Column with subheader:    max 4 items (subheader + 4 = 5 cards)
  //   - Column without subheader: max 5 items
  // The primary gets a wide (600px) subheader spanning two columns.
  // The continuation has no subheader and holds the remaining items.
  // Processing is in assignedKeys order (highest avg score first); the first overflowing
  // collection takes the next free slot.

  type PendingColumn = {
    key: string | null
    items: ScoredItemWithPrimary[]
    isContinuation: boolean
    subheaderSpansTwo: boolean
  }

  const pendingColumns: PendingColumn[] = []

  for (let ki = 0; ki < assignedKeys.length; ki++) {
    const key = assignedKeys[ki]
    const allItems = groups.get(key) ?? []
    if (allItems.length === 0) continue

    const isActiveCol = activeCollectionId !== null && key === activeCollectionId
    const hasSubheader = key !== null && !isActiveCol
    const maxItems = hasSubheader ? 4 : 5
    const slotsRemaining = MAX_COLUMNS - pendingColumns.length
    if (slotsRemaining <= 0) break

    // A split uses 2 slots for this key. Only split if enough slots remain for
    // the split AND one slot each for all remaining assigned keys after this one.
    const remainingKeys = assignedKeys.length - ki - 1
    if (allItems.length > maxItems && slotsRemaining >= 2 + remainingKeys) {
      // Split: primary gets first maxItems, continuation gets the rest
      pendingColumns.push({
        key,
        items: allItems.slice(0, maxItems),
        isContinuation: false,
        subheaderSpansTwo: hasSubheader,
      })
      pendingColumns.push({
        key,
        items: allItems.slice(maxItems),
        isContinuation: true,
        subheaderSpansTwo: false,
      })
    } else {
      pendingColumns.push({
        key,
        items: allItems,
        isContinuation: false,
        subheaderSpansTwo: false,
      })
    }
  }

  // --- Build final columns ---
  const collectionNameMap = new Map(allCollections.map(c => [c.id, c.name]))
  const collectionShortDescMap = new Map(allCollections.map(c => [c.id, c.shortDesc]))
  const collectionDescMap = new Map(allCollections.map(c => [c.id, c.desc]))

  const columns: ContentColumn[] = []

  for (const pending of pendingColumns) {
    const { key, items: colItems, isContinuation, subheaderSpansTwo } = pending
    if (colItems.length === 0) continue

    // null key = uncollected group — must NOT match null activeCollectionId
    const isActiveCollection = activeCollectionId !== null && key === activeCollectionId
    // Continuation columns and active-collection columns never render a subheader
    const hasSubheader = !isContinuation && key !== null && !isActiveCollection
    const maxVisibleItems = hasSubheader ? 4 : 5

    // --- Step 6: Mark items that exceed the unscrolled viewport ---
    const scoredItems: ScoredContentItem[] = colItems.map((item, idx) => ({
      ...item,
      pairingRole: 'none' as const,
      overflowsViewport: idx >= maxVisibleItems,
    }))

    // --- Step 7: Apply pairing rules ---
    applyPairing(scoredItems)

    columns.push({
      collectionId: key,
      collectionName: key ? (collectionNameMap.get(key) ?? null) : null,
      collectionShortDesc: key ? collectionShortDescMap.get(key) : undefined,
      collectionDesc: key ? collectionDescMap.get(key) : undefined,
      isActiveCollection,
      isContinuation,
      subheaderSpansTwo,
      items: scoredItems,
    })
  }

  return columns
}
