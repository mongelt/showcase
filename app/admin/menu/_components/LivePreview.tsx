'use client'

/**
 * Stage 14g — Live Preview Panel
 * Simplified read-only rendering of the menu grid with simulation controls.
 * Uses the same scoring engine as the real menu. Updates when data changes.
 */

import { useState, useMemo } from 'react'
import type { PageData } from '../page'
import {
  scoreAllEntities,
  AnyEntity,
  ContentScoringEntity,
  SubcategoryScoringEntity,
  CollectionScoringEntity,
  CategoryScoringEntity,
  ManualOverride,
  AnchorState,
} from '@/lib/menu/scoring'
import { interpolateMenuScore } from '@/lib/menu/scoreSpectrum'

// ---------------------------------------------------------------------------
// Entity builder (same logic as DynamicMenu.tsx)
// ---------------------------------------------------------------------------

function buildEntities(data: PageData): AnyEntity[] {
  const tagMap = new Map<string, string[]>()
  for (const et of data.entityTags) {
    if (!tagMap.has(et.entity_id)) tagMap.set(et.entity_id, [])
    tagMap.get(et.entity_id)!.push(et.tag_name)
  }
  const subcatCols = new Map<string, Set<string>>()
  for (const item of data.content) {
    if (!item.subcategory_id) continue
    if (!subcatCols.has(item.subcategory_id)) subcatCols.set(item.subcategory_id, new Set())
    for (const cid of item.collection_ids) subcatCols.get(item.subcategory_id)!.add(cid)
  }
  const result: AnyEntity[] = []
  for (const item of data.content) {
    result.push({
      id: item.id,
      type: 'content',
      tags: tagMap.get(item.id) || [],
      subcategoryId: item.subcategory_id || '',
      categoryId: item.category_id || '',
      collectionIds: item.collection_ids,
    } as ContentScoringEntity)
  }
  for (const sub of data.subcategories) {
    result.push({
      id: sub.id,
      type: 'subcategory',
      tags: tagMap.get(sub.id) || [],
      categoryId: sub.category_id,
      collectionIds: Array.from(subcatCols.get(sub.id) || []),
    } as SubcategoryScoringEntity)
  }
  for (const cat of data.categories) {
    result.push({
      id: cat.id,
      type: 'category',
      tags: tagMap.get(cat.id) || [],
      subcategoryIds: data.subcategories.filter(s => s.category_id === cat.id).map(s => s.id),
    } as CategoryScoringEntity)
  }
  for (const col of data.collections) {
    result.push({
      id: col.id,
      type: 'collection',
      tags: tagMap.get(col.id) || [],
      contentIds: col.contentIds,
    } as CollectionScoringEntity)
  }
  return result
}

// ---------------------------------------------------------------------------
// Score chip
// ---------------------------------------------------------------------------

function ScoreChip({
  name,
  score,
  type,
  active,
  onClick,
}: {
  name: string
  score: number
  type: string
  active: boolean
  onClick?: () => void
}) {
  const { background, color } = interpolateMenuScore(score)

  const truncated = name.length > 22 ? name.slice(0, 20) + '…' : name

  return (
    <button
      onClick={onClick}
      disabled={!onClick}
      title={`[${type}] ${name} — score: ${score.toFixed(2)}`}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-all ${
        active ? 'ring-2 ring-white ring-offset-1 ring-offset-gray-900' : ''
      } ${onClick ? 'cursor-pointer hover:opacity-90' : 'cursor-default'}`}
      style={{
        background,
        color,
        borderColor: active ? 'white' : 'rgba(255,255,255,0.1)',
      }}
    >
      <span>{truncated}</span>
      <span style={{ opacity: 0.55, fontVariantNumeric: 'tabular-nums' }}>
        {score.toFixed(2)}
      </span>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Section header
// ---------------------------------------------------------------------------

function PlaneHeader({ label, count }: { label: string; count?: number }) {
  return (
    <div className="flex items-center gap-2 mb-2">
      <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</h3>
      {count !== undefined && (
        <span className="text-xs text-gray-600">{count} shown</span>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function LivePreview({ data }: { data: PageData }) {
  const [simCategory, setSimCategory] = useState<string>('')
  const [simSubcategory, setSimSubcategory] = useState<string>('')
  const [simCollection, setSimCollection] = useState<string>('')

  const entities = useMemo(() => buildEntities(data), [data])

  const overrides: ManualOverride[] = useMemo(
    () =>
      data.overrides.map(o => ({
        entityAType: o.entity_a_type as any,
        entityAId: o.entity_a_id,
        entityBType: o.entity_b_type as any,
        entityBId: o.entity_b_id,
        overrideType: o.override_type,
      })),
    [data.overrides],
  )

  const anchor: AnchorState = useMemo(() => {
    if (simCollection) {
      return {
        primary: { type: 'collection', id: simCollection },
        secondary: simSubcategory ? { type: 'subcategory', id: simSubcategory } : null,
      }
    }
    if (simSubcategory) {
      return { primary: { type: 'subcategory', id: simSubcategory }, secondary: null }
    }
    if (simCategory) {
      return { primary: { type: 'category', id: simCategory }, secondary: null }
    }
    return { primary: null, secondary: null }
  }, [simCategory, simSubcategory, simCollection])

  const scores = useMemo(
    () => scoreAllEntities(entities, anchor, overrides),
    [entities, anchor, overrides],
  )

  const scoreMap = useMemo(() => {
    const m = new Map<string, number>()
    for (const r of scores) m.set(r.entityId, r.score)
    return m
  }, [scores])

  // Category plane: all, sorted by score desc
  const scoredCategories = useMemo(
    () =>
      data.categories
        .map(c => ({ ...c, score: scoreMap.get(c.id) ?? 0 }))
        .sort((a, b) => b.score - a.score),
    [data.categories, scoreMap],
  )

  // Subcategory plane: siblings always shown, cousins shown if score > 0 and share a collection
  // with any sibling. Mirrors computeSubcategoryColumn logic exactly.
  const visibleSubcategories = useMemo(() => {
    // Resolve effective active category (from simCategory, or from selected subcategory's parent)
    const activeCategoryId =
      simCategory ||
      (simSubcategory
        ? (data.subcategories.find(s => s.id === simSubcategory)?.category_id ?? '')
        : '')

    if (!activeCategoryId) {
      // No category context: show all with score > 0, sorted
      return data.subcategories
        .map(s => ({ ...s, score: scoreMap.get(s.id) ?? 0 }))
        .filter(s => s.score > 0)
        .sort((a, b) => b.score - a.score)
    }

    // Build the set of collection IDs belonging to siblings (for cousin detection)
    const siblings = data.subcategories.filter(s => s.category_id === activeCategoryId)
    const siblingEntities = entities.filter(
      e => e.type === 'subcategory' && siblings.some(s => s.id === e.id)
    ) as SubcategoryScoringEntity[]
    const siblingCollectionIds = new Set(siblingEntities.flatMap(s => s.collectionIds))

    const result: Array<(typeof data.subcategories)[0] & { score: number }> = []
    const siblingIds = new Set(siblings.map(s => s.id))

    for (const sub of data.subcategories) {
      const score = scoreMap.get(sub.id) ?? 0

      if (siblingIds.has(sub.id)) {
        // Sibling: always include regardless of score
        result.push({ ...sub, score })
      } else {
        // Cousin: must have score > 0 and share a collection with a sibling
        const entity = entities.find(
          e => e.id === sub.id && e.type === 'subcategory'
        ) as SubcategoryScoringEntity | undefined
        if (score > 0 && entity && entity.collectionIds.some(cid => siblingCollectionIds.has(cid))) {
          result.push({ ...sub, score })
        }
      }
    }

    // Siblings first (stable order), then cousins by score desc
    result.sort((a, b) => {
      const aIsSibling = siblingIds.has(a.id)
      const bIsSibling = siblingIds.has(b.id)
      if (aIsSibling && !bIsSibling) return -1
      if (!aIsSibling && bIsSibling) return 1
      if (!aIsSibling && !bIsSibling) return b.score - a.score
      return siblings.findIndex(s => s.id === a.id) - siblings.findIndex(s => s.id === b.id)
    })

    return result
  }, [data.subcategories, simCategory, simSubcategory, scoreMap, entities])

  // Content plane: only items with score > 0
  const scoredContent = useMemo(
    () =>
      data.content
        .map(c => ({ ...c, score: scoreMap.get(c.id) ?? 0 }))
        .filter(c => c.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 30),
    [data.content, scoreMap],
  )

  // Collection plane: sorted by score
  const scoredCollections = useMemo(
    () =>
      data.collections
        .map(c => ({ ...c, score: scoreMap.get(c.id) ?? 0 }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 15),
    [data.collections, scoreMap],
  )

  // Split content into focus vs related columns
  const focusContent = scoredContent.filter(c => c.score >= 0.5)
  const relatedContent = scoredContent.filter(c => c.score > 0 && c.score < 0.5)

  function resetSim() {
    setSimCategory('')
    setSimSubcategory('')
    setSimCollection('')
  }

  const hasSelection = simCategory || simSubcategory || simCollection

  const filteredSubsForDropdown = simCategory
    ? data.subcategories.filter(s => s.category_id === simCategory)
    : data.subcategories

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-1">Live Preview</h2>
      <p className="text-gray-400 text-sm mb-4">
        Simulates the menu grid with current scoring, tags, and overrides. Click chips to
        select anchors, or use the dropdowns below.
      </p>

      {/* Simulation controls */}
      <div className="flex flex-wrap items-end gap-3 mb-6 p-4 bg-gray-800 rounded-lg">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Category</label>
          <select
            value={simCategory}
            onChange={e => {
              setSimCategory(e.target.value)
              setSimSubcategory('')
              setSimCollection('')
            }}
            className="h-8 rounded border border-gray-600 bg-gray-950 px-2 text-white text-sm min-w-[150px]"
          >
            <option value="">— Default state —</option>
            {data.categories.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Subcategory</label>
          <select
            value={simSubcategory}
            onChange={e => {
              setSimSubcategory(e.target.value)
              setSimCollection('')
            }}
            className="h-8 rounded border border-gray-600 bg-gray-950 px-2 text-white text-sm min-w-[150px]"
          >
            <option value="">— None —</option>
            {filteredSubsForDropdown.map(s => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-xs text-gray-400 mb-1">Collection</label>
          <select
            value={simCollection}
            onChange={e => setSimCollection(e.target.value)}
            className="h-8 rounded border border-gray-600 bg-gray-950 px-2 text-white text-sm min-w-[150px]"
          >
            <option value="">— None —</option>
            {data.collections.map(c => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {hasSelection && (
          <button
            onClick={resetSim}
            className="h-8 px-3 text-xs text-gray-400 hover:text-white border border-gray-600 rounded transition-colors"
          >
            Reset
          </button>
        )}

        {hasSelection && (
          <div className="text-xs text-gray-500 ml-auto">
            {simCollection
              ? 'State 5/6 (Collection anchor)'
              : simSubcategory
                ? 'State 3 (Subcategory anchor)'
                : simCategory
                  ? 'State 2 (Category anchor)'
                  : ''}
          </div>
        )}
      </div>

      {/* Three planes */}
      <div className="space-y-6">
        {/* Category plane */}
        <div>
          <PlaneHeader label="Category Plane" count={scoredCategories.length} />
          <div className="flex flex-wrap gap-1.5">
            {scoredCategories.map(cat => (
              <ScoreChip
                key={cat.id}
                name={cat.name}
                score={cat.score}
                type="category"
                active={simCategory === cat.id}
                onClick={() => {
                  if (simCategory === cat.id) {
                    setSimCategory('')
                  } else {
                    setSimCategory(cat.id)
                    setSimSubcategory('')
                    setSimCollection('')
                  }
                }}
              />
            ))}
            {scoredCategories.length === 0 && (
              <span className="text-gray-600 text-xs italic">No categories</span>
            )}
          </div>
        </div>

        {/* Subcategory plane — siblings always shown, cousins shown if score > 0 */}
        {(simCategory || simSubcategory) && (
          <div>
            <PlaneHeader label="Subcategory Plane (siblings + cousins)" count={visibleSubcategories.length} />
            <div className="flex flex-wrap gap-1.5">
              {visibleSubcategories.map(sub => (
                <ScoreChip
                  key={sub.id}
                  name={sub.name}
                  score={sub.score}
                  type="subcategory"
                  active={simSubcategory === sub.id}
                  onClick={() => {
                    if (simSubcategory === sub.id) {
                      setSimSubcategory('')
                    } else {
                      setSimSubcategory(sub.id)
                      setSimCollection('')
                    }
                  }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Content plane — shown when any anchor is selected */}
        {hasSelection && (
          <div>
            <PlaneHeader
              label="Content Plane"
              count={scoredContent.length}
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {focusContent.length > 0 && (
                <div>
                  <p className="text-xs text-gray-600 uppercase mb-1.5">
                    Focus ({focusContent.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {focusContent.map(item => (
                      <ScoreChip
                        key={item.id}
                        name={item.title}
                        score={item.score}
                        type="content"
                        active={false}
                      />
                    ))}
                  </div>
                </div>
              )}
              {relatedContent.length > 0 && (
                <div>
                  <p className="text-xs text-gray-600 uppercase mb-1.5">
                    Related ({relatedContent.length})
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {relatedContent.map(item => (
                      <ScoreChip
                        key={item.id}
                        name={item.title}
                        score={item.score}
                        type="content"
                        active={false}
                      />
                    ))}
                  </div>
                </div>
              )}
              {scoredContent.length === 0 && (
                <p className="text-gray-600 text-xs italic">
                  No content items score above 0 with current anchor
                </p>
              )}
            </div>
          </div>
        )}

        {/* Collection plane */}
        <div>
          <PlaneHeader label="Collection Plane" count={scoredCollections.length} />
          <div className="flex flex-wrap gap-1.5">
            {scoredCollections.map(col => (
              <ScoreChip
                key={col.id}
                name={col.name}
                score={col.score}
                type="collection"
                active={simCollection === col.id}
                onClick={() => {
                  if (simCollection === col.id) {
                    setSimCollection('')
                  } else {
                    setSimCollection(col.id)
                  }
                }}
              />
            ))}
            {scoredCollections.length === 0 && (
              <span className="text-gray-600 text-xs italic">No collections</span>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
