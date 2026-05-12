/**
 * Stage 4 — Scoring Engine
 * Pure utility: no React, no Supabase calls. Testable in isolation.
 * Takes data + anchor state → returns scores for all entities.
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type EntityType = 'category' | 'subcategory' | 'collection' | 'content'

export interface ScoringEntity {
  id: string
  type: EntityType
  tags: string[] // tag names from menu_entity_tags
}

export interface ContentScoringEntity extends ScoringEntity {
  type: 'content'
  subcategoryId: string
  categoryId: string
  collectionIds: string[]
}

export interface SubcategoryScoringEntity extends ScoringEntity {
  type: 'subcategory'
  categoryId: string
  collectionIds: string[] // collections that contain this subcategory's content
}

export interface CollectionScoringEntity extends ScoringEntity {
  type: 'collection'
  contentIds: string[] // content items belonging to this collection
}

export interface CategoryScoringEntity extends ScoringEntity {
  type: 'category'
  subcategoryIds: string[]
}

export type AnyEntity =
  | ContentScoringEntity
  | SubcategoryScoringEntity
  | CollectionScoringEntity
  | CategoryScoringEntity

export interface AnchorState {
  primary: { type: EntityType; id: string } | null
  secondary: { type: EntityType; id: string } | null
}

export interface ManualOverride {
  entityAType: EntityType
  entityAId: string
  entityBType: EntityType
  entityBId: string
  overrideType: 'force_related' | 'force_unrelated'
}

export interface ScoreResult {
  entityId: string
  score: number // 0.00–1.00
  classification: 'active' | 'focus' | 'related' | 'hidden'
}

// ---------------------------------------------------------------------------
// Layer 1: Structural Baseline
// ---------------------------------------------------------------------------

/**
 * Scores a pair of entities based purely on structural overlap.
 * Scores: 1.0 / 0.75 / 0.40 / 0.0
 */
export function scoreStructural(a: AnyEntity, b: AnyEntity, allEntities: AnyEntity[]): number {
  // Content ↔ Content
  if (a.type === 'content' && b.type === 'content') {
    const ac = a as ContentScoringEntity
    const bc = b as ContentScoringEntity
    const sameSubcat = ac.subcategoryId === bc.subcategoryId
    const sharedCollections = ac.collectionIds.filter(id => bc.collectionIds.includes(id))
    const sameCollection = sharedCollections.length > 0

    if (sameSubcat && sameCollection) return 1.0
    if (sameSubcat || sameCollection) return 0.75
    if (ac.categoryId === bc.categoryId) return 0.40
    return 0.0
  }

  // Subcategory ↔ Subcategory (cousin: share content in same collection)
  if (a.type === 'subcategory' && b.type === 'subcategory') {
    const as_ = a as SubcategoryScoringEntity
    const bs = b as SubcategoryScoringEntity
    const sharedCollections = as_.collectionIds.filter(id => bs.collectionIds.includes(id))
    if (sharedCollections.length > 0) return 0.75
    if (as_.categoryId === bs.categoryId) return 0.40
    return 0.0
  }

  // Collection ↔ Collection (share content items)
  if (a.type === 'collection' && b.type === 'collection') {
    const ac = a as CollectionScoringEntity
    const bc = b as CollectionScoringEntity
    const sharedContent = ac.contentIds.filter(id => bc.contentIds.includes(id))
    return sharedContent.length > 0 ? 0.75 : 0.0
  }

  // Category ↔ Collection (any subcategory content in that collection)
  if (
    (a.type === 'category' && b.type === 'collection') ||
    (a.type === 'collection' && b.type === 'category')
  ) {
    const cat = (a.type === 'category' ? a : b) as CategoryScoringEntity
    const col = (a.type === 'collection' ? a : b) as CollectionScoringEntity
    // Find all subcategories belonging to this category
    const subcats = allEntities.filter(
      e => e.type === 'subcategory' && (e as SubcategoryScoringEntity).categoryId === cat.id
    ) as SubcategoryScoringEntity[]
    const related = subcats.some(s => s.collectionIds.includes(col.id))
    return related ? 0.40 : 0.0
  }

  // Content ↔ Subcategory
  if (
    (a.type === 'content' && b.type === 'subcategory') ||
    (a.type === 'subcategory' && b.type === 'content')
  ) {
    const content = (a.type === 'content' ? a : b) as ContentScoringEntity
    const subcat = (a.type === 'subcategory' ? a : b) as SubcategoryScoringEntity
    if (content.subcategoryId === subcat.id) return 1.0
    const sharedCollections = content.collectionIds.filter(id => subcat.collectionIds.includes(id))
    if (sharedCollections.length > 0) return 0.75
    if (content.categoryId === subcat.categoryId) return 0.40
    return 0.0
  }

  // Content ↔ Collection
  if (
    (a.type === 'content' && b.type === 'collection') ||
    (a.type === 'collection' && b.type === 'content')
  ) {
    const content = (a.type === 'content' ? a : b) as ContentScoringEntity
    const col = (a.type === 'collection' ? a : b) as CollectionScoringEntity
    if (content.collectionIds.includes(col.id)) return 0.75
    return 0.0
  }

  // Content ↔ Category
  if (
    (a.type === 'content' && b.type === 'category') ||
    (a.type === 'category' && b.type === 'content')
  ) {
    const content = (a.type === 'content' ? a : b) as ContentScoringEntity
    const cat = (a.type === 'category' ? a : b) as CategoryScoringEntity
    if (content.categoryId === cat.id) return 0.40
    return 0.0
  }

  // Subcategory ↔ Collection
  if (
    (a.type === 'subcategory' && b.type === 'collection') ||
    (a.type === 'collection' && b.type === 'subcategory')
  ) {
    const subcat = (a.type === 'subcategory' ? a : b) as SubcategoryScoringEntity
    const col = (a.type === 'collection' ? a : b) as CollectionScoringEntity
    if (subcat.collectionIds.includes(col.id)) return 0.75
    return 0.0
  }

  // Subcategory ↔ Category
  if (
    (a.type === 'subcategory' && b.type === 'category') ||
    (a.type === 'category' && b.type === 'subcategory')
  ) {
    const subcat = (a.type === 'subcategory' ? a : b) as SubcategoryScoringEntity
    const cat = (a.type === 'category' ? a : b) as CategoryScoringEntity

    // Direct child: subcategory belongs to this category — strongest structural relation
    if (subcat.categoryId === cat.id) return 1.0

    // Cousin: subcategory shares a collection with any of the category's own subcategories
    const catSubcats = allEntities.filter(
      e => e.type === 'subcategory' && (e as SubcategoryScoringEntity).categoryId === cat.id
    ) as SubcategoryScoringEntity[]
    const catCollectionIds = new Set(catSubcats.flatMap(s => s.collectionIds))
    if (subcat.collectionIds.some(cid => catCollectionIds.has(cid))) return 0.40

    return 0.0
  }

  // Category ↔ Category
  if (a.type === 'category' && b.type === 'category') {
    // No direct structural relation between categories at same level
    return 0.0
  }

  return 0.0
}

// ---------------------------------------------------------------------------
// Layer 2: Semantic Tags (TF-IDF)
// ---------------------------------------------------------------------------

/**
 * Builds a frequency map: tag name → number of entities that carry it.
 */
function buildTagFrequency(allEntities: AnyEntity[]): Map<string, number> {
  const freq = new Map<string, number>()
  for (const entity of allEntities) {
    for (const tag of entity.tags) {
      freq.set(tag, (freq.get(tag) ?? 0) + 1)
    }
  }
  return freq
}

/**
 * Raw TF-IDF-style tag similarity score (not yet normalized).
 * Formula: Σ (1 / log2(1 + frequency(tag))) for all shared tags.
 */
function rawTagScore(a: AnyEntity, b: AnyEntity, tagFreq: Map<string, number>): number {
  const sharedTags = a.tags.filter(t => b.tags.includes(t))
  if (sharedTags.length === 0) return 0
  return sharedTags.reduce((sum, tag) => {
    const freq = tagFreq.get(tag) ?? 1
    return sum + 1 / Math.log2(1 + freq)
  }, 0)
}

/**
 * Returns a normalized [0, 1] tag similarity score.
 * Normalization is against the dynamic median of all entity pairs that
 * have a structural connection (score > 0) OR share at least one tag.
 */
export function scoreTagSimilarity(
  a: AnyEntity,
  b: AnyEntity,
  allEntities: AnyEntity[],
  tagFreq: Map<string, number>
): number {
  const raw = rawTagScore(a, b, tagFreq)
  if (raw === 0) return 0

  // Collect raw tag scores for all "connected" pairs that share at least one tag.
  // Pairs with zero connections in both layers are excluded per spec.
  // The median is computed over pairs with positive raw tag scores only —
  // otherwise a dataset where most structurally-connected pairs share no tags
  // would drive the median to 0 and nullify all tag signals.
  const positiveRaws: number[] = []
  for (let i = 0; i < allEntities.length; i++) {
    for (let j = i + 1; j < allEntities.length; j++) {
      const ea = allEntities[i]
      const eb = allEntities[j]
      const structural = scoreStructural(ea, eb, allEntities)
      const tagRaw = rawTagScore(ea, eb, tagFreq)
      if ((structural > 0 || tagRaw > 0) && tagRaw > 0) {
        positiveRaws.push(tagRaw)
      }
    }
  }

  if (positiveRaws.length === 0) return 0

  // Dynamic median over tag-sharing pairs
  positiveRaws.sort((x, y) => x - y)
  const mid = Math.floor(positiveRaws.length / 2)
  const median =
    positiveRaws.length % 2 === 0
      ? (positiveRaws[mid - 1] + positiveRaws[mid]) / 2
      : positiveRaws[mid]

  // Normalize: median maps to ~0.5; clamp to [0, 1]
  return Math.min(raw / (median * 2), 1.0)
}

// ---------------------------------------------------------------------------
// Layer 3: Manual Overrides
// ---------------------------------------------------------------------------

export function getOverride(
  a: AnyEntity,
  b: AnyEntity,
  overrides: ManualOverride[]
): 'force_related' | 'force_unrelated' | null {
  for (const override of overrides) {
    const matchAB =
      override.entityAType === a.type &&
      override.entityAId === a.id &&
      override.entityBType === b.type &&
      override.entityBId === b.id
    const matchBA =
      override.entityAType === b.type &&
      override.entityAId === b.id &&
      override.entityBType === a.type &&
      override.entityBId === a.id
    if (matchAB || matchBA) return override.overrideType
  }
  return null
}

// ---------------------------------------------------------------------------
// Signal Combination
// ---------------------------------------------------------------------------

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value))
}

/**
 * Structural baseline + proportional tag bonus.
 * Tags fill up to 30% of remaining headroom above the structural score.
 * Untagged items score their structural value exactly. Tagged items are lifted
 * toward 1.0 proportionally — the higher the structural score, the less headroom
 * tags can fill (perfect structural match is unaffected).
 */
export function combineScores(structural: number, tagSimilarity: number): number {
  const tagBonus = tagSimilarity * (1.0 - structural) * 0.30
  return clamp(structural + tagBonus, 0.0, 1.0)
}

/**
 * Dual-anchor blending (State 6): primary 70%, secondary 30%.
 */
export function blendAnchorScores(primaryScore: number, secondaryScore: number): number {
  return clamp(primaryScore * 0.7 + secondaryScore * 0.3, 0.0, 1.0)
}

// ---------------------------------------------------------------------------
// Score a single entity against an anchor
// ---------------------------------------------------------------------------

function scorePair(
  entity: AnyEntity,
  anchor: AnyEntity,
  allEntities: AnyEntity[],
  overrides: ManualOverride[],
  tagFreq: Map<string, number>
): number {
  // Layer 3 first
  const override = getOverride(entity, anchor, overrides)
  if (override === 'force_unrelated') return 0.0
  if (override === 'force_related') return 0.75 // clamp to focus-threshold per plan

  // Layers 1 + 2
  const structural = scoreStructural(entity, anchor, allEntities)
  const tagSim = scoreTagSimilarity(entity, anchor, allEntities, tagFreq)
  return combineScores(structural, tagSim)
}

// ---------------------------------------------------------------------------
// Main entry point
// ---------------------------------------------------------------------------

function classify(score: number): ScoreResult['classification'] {
  if (score === 0) return 'hidden'
  if (score < 0.50) return 'related'
  return 'focus'
}

/**
 * Scores all entities against the current anchor state.
 * Returns one ScoreResult per entity.
 */
export function scoreAllEntities(
  entities: AnyEntity[],
  anchors: AnchorState,
  overrides: ManualOverride[]
): ScoreResult[] {
  // No anchor → all entities score 1.0 (spec: default, equal weight)
  if (!anchors.primary) {
    return entities.map(e => ({ entityId: e.id, score: 1.0, classification: 'focus' }))
  }

  const primaryAnchor = entities.find(
    e => e.id === anchors.primary!.id && e.type === anchors.primary!.type
  )
  if (!primaryAnchor) {
    return entities.map(e => ({ entityId: e.id, score: 1.0, classification: 'focus' }))
  }

  const secondaryAnchor = anchors.secondary
    ? entities.find(e => e.id === anchors.secondary!.id && e.type === anchors.secondary!.type)
    : undefined

  const tagFreq = buildTagFrequency(entities)

  return entities.map(entity => {
    // Active anchors get classification 'active'
    if (entity.id === primaryAnchor.id) {
      return { entityId: entity.id, score: 1.0, classification: 'active' }
    }
    if (secondaryAnchor && entity.id === secondaryAnchor.id) {
      return { entityId: entity.id, score: 1.0, classification: 'active' }
    }

    const primaryScore = scorePair(entity, primaryAnchor, entities, overrides, tagFreq)

    if (secondaryAnchor) {
      const secondaryScore = scorePair(entity, secondaryAnchor, entities, overrides, tagFreq)
      const blended = blendAnchorScores(primaryScore, secondaryScore)
      return { entityId: entity.id, score: blended, classification: classify(blended) }
    }

    return { entityId: entity.id, score: primaryScore, classification: classify(primaryScore) }
  })
}
