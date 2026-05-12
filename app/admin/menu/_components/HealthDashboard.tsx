'use client'

/**
 * Stage 14e — Relationship Health Dashboard
 * Flags: Orphaned, Over-connected, Potential overflows, Tag-structural mismatches.
 */

import { useMemo } from 'react'
import type { PageData } from '../page'
import {
  scoreAllEntities,
  scoreStructural,
  scoreTagSimilarity,
  AnyEntity,
  ContentScoringEntity,
  SubcategoryScoringEntity,
  CollectionScoringEntity,
  CategoryScoringEntity,
  ManualOverride,
} from '@/lib/menu/scoring'

// ---------------------------------------------------------------------------
// Helpers (duplicated locally since buildTagFrequency is not exported)
// ---------------------------------------------------------------------------

function buildTagFreq(entities: AnyEntity[]): Map<string, number> {
  const freq = new Map<string, number>()
  for (const e of entities) {
    for (const t of e.tags) freq.set(t, (freq.get(t) ?? 0) + 1)
  }
  return freq
}

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

function buildNameMap(data: PageData): (type: string, id: string) => string {
  return (type, id) => {
    if (type === 'content') return data.content.find(c => c.id === id)?.title || id
    if (type === 'subcategory') {
      const s = data.subcategories.find(s => s.id === id)
      return s
        ? `${data.categories.find(c => c.id === s.category_id)?.name || '?'} / ${s.name}`
        : id
    }
    if (type === 'collection') return data.collections.find(c => c.id === id)?.name || id
    if (type === 'category') return data.categories.find(c => c.id === id)?.name || id
    return id
  }
}

// ---------------------------------------------------------------------------
// Computation
// ---------------------------------------------------------------------------

interface OrphanedFlag {
  type: string
  id: string
  name: string
}

interface OverConnectedFlag {
  type: string
  id: string
  name: string
  pct: number
}

interface OverflowFlag {
  id: string
  name: string
  count: number
}

interface TagStructuralMismatch {
  nameA: string
  nameB: string
  tagScore: number
}

function computeHealth(data: PageData) {
  const entities = buildEntities(data)
  const overrides: ManualOverride[] = data.overrides.map(o => ({
    entityAType: o.entity_a_type as any,
    entityAId: o.entity_a_id,
    entityBType: o.entity_b_type as any,
    entityBId: o.entity_b_id,
    overrideType: o.override_type,
  }))
  const getName = buildNameMap(data)
  const tagFreq = buildTagFreq(entities)
  const totalOther = entities.length - 1

  const orphaned: OrphanedFlag[] = []
  const overConnected: OverConnectedFlag[] = []

  for (const entity of entities) {
    if (entities.length < 2) break
    const results = scoreAllEntities(
      entities,
      { primary: { type: entity.type, id: entity.id }, secondary: null },
      overrides,
    )
    const others = results.filter(r => r.entityId !== entity.id)
    const nonZero = others.filter(r => r.score > 0)

    if (nonZero.length === 0) {
      orphaned.push({ type: entity.type, id: entity.id, name: getName(entity.type, entity.id) })
    }

    if (totalOther > 0) {
      const highScoreCount = others.filter(r => r.score >= 0.5).length
      const pct = highScoreCount / totalOther
      if (pct > 0.8) {
        overConnected.push({
          type: entity.type,
          id: entity.id,
          name: getName(entity.type, entity.id),
          pct: Math.round(pct * 100),
        })
      }
    }
  }

  // Potential overflows: subcategory anchor → count content items shown > 15
  const potentialOverflows: OverflowFlag[] = []
  for (const sub of data.subcategories) {
    const results = scoreAllEntities(
      entities,
      { primary: { type: 'subcategory', id: sub.id }, secondary: null },
      overrides,
    )
    const contentShown = results.filter(r => {
      const e = entities.find(e => e.id === r.entityId)
      return e?.type === 'content' && r.score > 0
    }).length
    if (contentShown > 15) {
      potentialOverflows.push({
        id: sub.id,
        name: getName('subcategory', sub.id),
        count: contentShown,
      })
    }
  }

  // Tag-structural mismatch: tag similarity > 0.50 but zero structural connection
  // Limit pairs for performance
  const tagStructuralMismatches: TagStructuralMismatch[] = []
  const MAX_PAIRS = 300
  let pairCount = 0
  outer: for (let i = 0; i < entities.length; i++) {
    for (let j = i + 1; j < entities.length; j++) {
      if (pairCount++ > MAX_PAIRS) break outer
      const ea = entities[i]
      const eb = entities[j]
      if (scoreStructural(ea, eb, entities) > 0) continue
      const tagSim = scoreTagSimilarity(ea, eb, entities, tagFreq)
      if (tagSim > 0.5) {
        tagStructuralMismatches.push({
          nameA: getName(ea.type, ea.id),
          nameB: getName(eb.type, eb.id),
          tagScore: Math.round(tagSim * 100) / 100,
        })
      }
    }
  }

  return { orphaned, overConnected, potentialOverflows, tagStructuralMismatches }
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

interface FlagSection {
  title: string
  desc: string
  color: string
  items: React.ReactNode[]
  emptyLabel: string
}

export default function HealthDashboard({ data }: { data: PageData }) {
  const { orphaned, overConnected, potentialOverflows, tagStructuralMismatches } = useMemo(
    () => computeHealth(data),
    [data],
  )

  const sections: FlagSection[] = [
    {
      title: 'Orphaned',
      desc: 'Entities with zero connections to anything (score 0.00 against all others)',
      color: 'text-red-400',
      emptyLabel: 'No orphaned entities',
      items: orphaned.map((item, i) => (
        <li key={i} className="text-sm text-red-400">
          <span className="text-gray-500">[{item.type}]</span> {item.name}
        </li>
      )),
    },
    {
      title: 'Over-connected',
      desc: 'Score ≥ 0.50 against more than 80% of all other entities',
      color: 'text-yellow-400',
      emptyLabel: 'No over-connected entities',
      items: overConnected.map((item, i) => (
        <li key={i} className="text-sm text-yellow-400">
          <span className="text-gray-500">[{item.type}]</span> {item.name}{' '}
          <span className="text-gray-500">— {item.pct}% of entities</span>
        </li>
      )),
    },
    {
      title: 'Potential Overflows',
      desc: 'Subcategories that would show more than 15 content items when selected as anchor',
      color: 'text-orange-400',
      emptyLabel: 'No potential overflows',
      items: potentialOverflows.map((item, i) => (
        <li key={i} className="text-sm text-orange-400">
          {item.name}{' '}
          <span className="text-gray-500">— {item.count} items</span>
        </li>
      )),
    },
    {
      title: 'Tag-Structural Mismatch',
      desc: 'Pairs with high tag similarity (> 0.50) but zero structural connection — consider adding a manual override or structural link',
      color: 'text-purple-400',
      emptyLabel: 'No mismatches detected',
      items: tagStructuralMismatches.map((item, i) => (
        <li key={i} className="text-sm text-purple-400">
          {item.nameA}{' '}
          <span className="text-gray-500">↔</span>{' '}
          {item.nameB}{' '}
          <span className="text-gray-500">— tag score: {item.tagScore}</span>
        </li>
      )),
    },
  ]

  return (
    <div className="space-y-4">
      {sections.map(section => (
        <div key={section.title} className="bg-gray-900 border border-gray-800 rounded-lg p-6">
          <h2 className="text-lg font-semibold text-white mb-1">{section.title}</h2>
          <p className="text-gray-400 text-sm mb-4">{section.desc}</p>

          {section.items.length === 0 ? (
            <div className="flex items-center gap-2">
              <span className="text-green-400 text-sm">✓</span>
              <span className="text-gray-400 text-sm">{section.emptyLabel}</span>
            </div>
          ) : (
            <ul className="space-y-1.5">{section.items}</ul>
          )}
        </div>
      ))}
    </div>
  )
}
