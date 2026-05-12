/**
 * Stage 7d — Collection Plane Algorithm
 * Pure utility. Builds the left/right zone split for the bottom collection row.
 * Implements the 6-step algorithm from spec §Collection Plane — Algorithm.
 */

import { ScoreResult } from './scoring'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface CollectionForLayout {
  id: string
  name: string
  shortTitle?: string
  shortDesc?: string
  desc?: string
  featured: boolean
  order_index: number
  /** Thumbnails derived from content items in this collection */
  thumbnails?: string[]
}

export interface ScoredCollection extends CollectionForLayout {
  /**
   * Raw score from the scoring engine (0.0–1.0).
   * Filler featured collections (score 0, included as non-related fill) keep score 0.
   * Renderer uses score + isActive to determine visual appearance.
   */
  score: number
  isActive: boolean
}

// ---------------------------------------------------------------------------
// Main export
// ---------------------------------------------------------------------------

/**
 * Computes the left and right zones of the collection plane bottom row.
 *
 * @param allCollections          All collections in the database
 * @param contentColumnIds        Collections that currently have a subheader card in the
 *                                content plane (excluded from bottom row per spec §One
 *                                Appearance Per Collection). Must NOT include the active
 *                                collection — the active collection is always in the bottom row.
 * @param activeCollectionId      Currently active collection (always stays in bottom row)
 * @param scores                  Score results from the scoring engine for the current anchor
 * @param hasAnchor               False = State 1 (default, no anchor). In this case only
 *                                featured collections are shown (left zone only). When true,
 *                                the full 6-step algorithm applies.
 */
export function computeCollectionPlane(
  allCollections: CollectionForLayout[],
  contentColumnIds: string[],
  activeCollectionId: string | null,
  scores: ScoreResult[],
  hasAnchor: boolean,
): { leftZone: ScoredCollection[]; rightZone: ScoredCollection[] } {
  // --- State 1 (default, no anchor): show only featured collections ---
  if (!hasAnchor) {
    const featuredOnly: ScoredCollection[] = allCollections
      .filter(c => c.featured)
      .sort((a, b) => a.order_index - b.order_index)
      .map(c => ({ ...c, score: 1.0, isActive: false }))
    return { leftZone: featuredOnly, rightZone: [] }
  }

  // --- Step 1: Filter out collections that have subheaders in the content plane.
  //             Exception: active collection always stays in bottom row. ---
  const excludedIds = new Set(contentColumnIds)
  // Active collection is guaranteed NOT to be in contentColumnIds (spec), but
  // guard defensively.
  if (activeCollectionId) excludedIds.delete(activeCollectionId)

  const candidates = allCollections.filter(c => !excludedIds.has(c.id))

  // --- Score each candidate ---
  const scoreMap = new Map(scores.map(s => [s.entityId, s]))

  const scored: ScoredCollection[] = candidates.map(c => {
    const sr = scoreMap.get(c.id)
    return {
      ...c,
      score: sr?.score ?? 0,
      isActive: c.id === activeCollectionId,
    }
  })

  // --- Steps 2–4: Split into related and non-related, then into featured/non-featured ---
  //
  // "Related" = score > 0 (has a structural, tag, or override connection to the anchor)
  // OR is the active collection (always treated as related).
  const related = scored.filter(c => c.score > 0 || c.isActive)
  const notRelated = scored.filter(c => c.score === 0 && !c.isActive)

  // Step 3: Related featured → left zone
  const relatedFeatured = related
    .filter(c => c.featured && !c.isActive)
    .sort((a, b) => b.score - a.score)

  // Active collection is the most prominent — prepend to left zone regardless of featured status
  const activeCol = scored.find(c => c.isActive) ?? null

  // Step 4: Related non-featured → right zone
  const relatedNotFeatured = related
    .filter(c => !c.featured && !c.isActive)
    .sort((a, b) => b.score - a.score)

  // Step 5: Filler featured (non-related) → fills remaining left zone space, ordered by order_index
  const fillerFeatured = notRelated
    .filter(c => c.featured)
    .sort((a, b) => a.order_index - b.order_index)

  // --- Step 6: Apply max-8 cap with priority order:
  //   content-related featured → content-related non-featured → filler featured ---
  const MAX_TOTAL = 8

  const prioritized: ScoredCollection[] = []

  // Active collection always first
  if (activeCol) prioritized.push(activeCol)

  // Related featured (non-active)
  for (const c of relatedFeatured) {
    if (prioritized.length >= MAX_TOTAL) break
    prioritized.push(c)
  }

  // Related non-featured (right zone)
  for (const c of relatedNotFeatured) {
    if (prioritized.length >= MAX_TOTAL) break
    prioritized.push(c)
  }

  // Filler featured
  for (const c of fillerFeatured) {
    if (prioritized.length >= MAX_TOTAL) break
    prioritized.push(c)
  }

  // --- Re-split prioritized list into left/right zones ---
  // Left zone: active + featured (related or filler)
  // Right zone: non-featured related
  const leftZone = prioritized.filter(c => c.isActive || c.featured)
  const rightZone = prioritized.filter(c => !c.featured && !c.isActive)

  return { leftZone, rightZone }
}
