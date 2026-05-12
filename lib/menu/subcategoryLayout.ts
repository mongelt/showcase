/**
 * Stage 7c — Subcategory Column Computation
 * Pure utility. Returns siblings (focus) and cousins (related) for the subcategory column.
 * Cousins = subcategories from other categories that share a collection with any sibling.
 */

import { ScoreResult } from './scoring'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface SubcategoryForLayout {
  id: string
  category_id: string
  name: string
  shortTitle?: string
  shortDesc?: string
  periDesc?: string
  desc?: string
  /** Collection IDs derived from this subcategory's content items */
  collectionIds: string[]
  /** Thumbnail URLs from content items in this subcategory (up to 5) */
  thumbnails?: string[]
}

export interface ScoredSubcategory extends SubcategoryForLayout {
  score: number
  classification: 'active' | 'focus' | 'related'
  /**
   * Pairing role for when the column has >5 subcategories.
   * Only cousin (related) subcategories can be paired.
   * none  — not participating in pairing (focus/active, or related in small columns)
   * solo  — related, isolated
   * left  — left of a pair
   * right — right of a pair
   */
  pairingRole: 'none' | 'solo' | 'left' | 'right'
  pairWithId?: string
}

// ---------------------------------------------------------------------------
// Pairing (same algorithm as content columns, applied to cousins)
// ---------------------------------------------------------------------------

function applySubcategoryPairing(items: ScoredSubcategory[]): void {
  // Pairing only when column has >5 subcategories total
  if (items.length <= 5) return

  const relatedCount = items.filter(i => i.classification === 'related').length
  if (relatedCount < 2) return

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
 * Returns the ordered list of subcategories for the subcategory column.
 *
 * Siblings:  subcategories whose category_id matches activeCategoryId → focus state.
 *            Always included regardless of score.
 *
 * Cousins:   subcategories from other categories that share at least one collection
 *            with any sibling AND have a positive score → related state.
 *            Excluded if score === 0 (no structural/tag connection to current anchor).
 *
 * Order: siblings first (stable / original data order), then cousins by score desc.
 *
 * @param allSubcategories  Full list of all subcategories with collectionIds
 * @param activeCategoryId  The currently active category
 * @param scores            Score results from the scoring engine for the current anchor
 */
export function computeSubcategoryColumn(
  allSubcategories: SubcategoryForLayout[],
  activeCategoryId: string,
  scores: ScoreResult[],
): ScoredSubcategory[] {
  const scoreMap = new Map(scores.map(s => [s.entityId, s]))

  // Collect all collection IDs belonging to sibling subcategories
  const siblings = allSubcategories.filter(s => s.category_id === activeCategoryId)
  const siblingCollectionIds = new Set(siblings.flatMap(s => s.collectionIds))

  const result: ScoredSubcategory[] = []

  for (const sub of allSubcategories) {
    const sr = scoreMap.get(sub.id)

    if (sub.category_id === activeCategoryId) {
      // --- Sibling: always include ---
      const classification =
        sr?.classification === 'active'
          ? 'active'
          : 'focus'
      result.push({
        ...sub,
        score: sr?.score ?? 1.0,
        classification,
        pairingRole: 'none',
      })
    } else {
      // --- Potential cousin: include only if structural cousin AND score > 0 ---
      const isCousin = sub.collectionIds.some(cid => siblingCollectionIds.has(cid))
      if (isCousin && sr && sr.score > 0) {
        result.push({
          ...sub,
          score: sr.score,
          classification: 'related',
          pairingRole: 'none',
        })
      }
    }
  }

  // Sort: siblings maintain their original order (stable by index), cousins by score desc
  // Stable sort: siblings appear in the order they were in allSubcategories.
  const siblingIds = new Set(siblings.map(s => s.id))
  result.sort((a, b) => {
    const aIsSibling = siblingIds.has(a.id)
    const bIsSibling = siblingIds.has(b.id)
    if (aIsSibling && !bIsSibling) return -1
    if (!aIsSibling && bIsSibling) return 1
    if (!aIsSibling && !bIsSibling) return b.score - a.score
    // Both siblings: preserve original order via allSubcategories index
    return (
      allSubcategories.findIndex(s => s.id === a.id) -
      allSubcategories.findIndex(s => s.id === b.id)
    )
  })

  // Apply pairing (for columns with >5 subcategories in expanded mode)
  applySubcategoryPairing(result)

  return result
}
