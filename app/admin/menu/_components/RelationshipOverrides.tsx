'use client'

/**
 * Stage 14c — Manual Relationship Overrides
 * Add / delete force_related or force_unrelated overrides.
 * Override tracking table shows auto-detected score alongside each override.
 */

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import type { PageData, Override } from '../page'
import {
  scoreAllEntities,
  AnyEntity,
  ContentScoringEntity,
  SubcategoryScoringEntity,
  CollectionScoringEntity,
  CategoryScoringEntity,
  ManualOverride,
} from '@/lib/menu/scoring'

// ---------------------------------------------------------------------------
// Helpers
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

function getEntityDisplayName(data: PageData, type: string, id: string): string {
  if (type === 'category') return data.categories.find(c => c.id === id)?.name || id
  if (type === 'subcategory') {
    const s = data.subcategories.find(s => s.id === id)
    if (!s) return id
    return `${data.categories.find(c => c.id === s.category_id)?.name || '?'} / ${s.name}`
  }
  if (type === 'collection') return data.collections.find(c => c.id === id)?.name || id
  if (type === 'content') return data.content.find(c => c.id === id)?.title || id
  return id
}

// ---------------------------------------------------------------------------
// Entity search field sub-component
// ---------------------------------------------------------------------------

interface AnyEntityItem {
  id: string
  type: string
  name: string
}

function EntitySearchField({
  label,
  value,
  selected,
  onSearch,
  results,
  onSelect,
}: {
  label: string
  value: string
  selected: AnyEntityItem | null
  onSearch: (q: string) => void
  results: AnyEntityItem[]
  onSelect: (e: AnyEntityItem) => void
}) {
  return (
    <div>
      <p className="text-gray-400 text-sm mb-1">{label}</p>
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={e => onSearch(e.target.value)}
          placeholder="Search by name..."
          className={`w-full h-9 rounded border bg-gray-950 px-3 text-white text-sm focus:outline-none ${
            selected ? 'border-blue-600' : 'border-gray-600 focus:border-blue-500'
          }`}
        />
        {selected && (
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-gray-500 pointer-events-none">
            [{selected.type}]
          </span>
        )}
        {results.length > 0 && (
          <div className="absolute z-20 top-full left-0 right-0 mt-0.5 bg-gray-950 border border-gray-700 rounded shadow-xl max-h-48 overflow-y-auto">
            {results.map(r => (
              <button
                key={r.id}
                className="w-full text-left px-3 py-2 text-sm hover:bg-gray-800 flex items-center gap-2"
                onMouseDown={e => {
                  e.preventDefault()
                  onSelect(r)
                }}
              >
                <span className="text-gray-500 text-xs">[{r.type}]</span>
                <span className="text-white">{r.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function RelationshipOverrides({
  data,
  onDataChange,
}: {
  data: PageData
  onDataChange: () => void
}) {
  const supabase = createClient()
  const [showModal, setShowModal] = useState(false)
  const [entityA, setEntityA] = useState<AnyEntityItem | null>(null)
  const [entityB, setEntityB] = useState<AnyEntityItem | null>(null)
  const [overrideType, setOverrideType] = useState<'force_related' | 'force_unrelated'>(
    'force_related',
  )
  const [searchA, setSearchA] = useState('')
  const [searchB, setSearchB] = useState('')
  const [saving, setSaving] = useState(false)

  // Flat entity list for search
  const allEntityItems: AnyEntityItem[] = useMemo(
    () => [
      ...data.categories.map(c => ({ id: c.id, type: 'category', name: c.name })),
      ...data.subcategories.map(s => ({
        id: s.id,
        type: 'subcategory',
        name: `${data.categories.find(c => c.id === s.category_id)?.name || '?'} / ${s.name}`,
      })),
      ...data.collections.map(c => ({ id: c.id, type: 'collection', name: c.name })),
      ...data.content.map(c => ({ id: c.id, type: 'content', name: c.title })),
    ],
    [data],
  )

  function searchEntities(query: string): AnyEntityItem[] {
    if (!query.trim()) return []
    const q = query.toLowerCase()
    return allEntityItems.filter(e => e.name.toLowerCase().includes(q)).slice(0, 10)
  }

  // Build scoring entities to compute auto-detected score
  const scoringEntities = useMemo(() => buildEntities(data), [data])
  const overridesForScoring: ManualOverride[] = useMemo(
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

  function getAutoScore(ov: Override): number | null {
    // Score without this particular override
    const otherOverrides = overridesForScoring.filter(
      o => !(o.entityAId === ov.entity_a_id && o.entityBId === ov.entity_b_id),
    )
    const anchor = scoringEntities.find(e => e.id === ov.entity_a_id)
    if (!anchor) return null
    const results = scoreAllEntities(
      scoringEntities,
      { primary: { type: anchor.type, id: anchor.id }, secondary: null },
      otherOverrides,
    )
    return results.find(r => r.entityId === ov.entity_b_id)?.score ?? null
  }

  function openModal() {
    setEntityA(null)
    setEntityB(null)
    setSearchA('')
    setSearchB('')
    setOverrideType('force_related')
    setShowModal(true)
  }

  function closeModal() {
    setShowModal(false)
  }

  async function saveOverride() {
    if (!entityA || !entityB) return
    setSaving(true)
    const { error } = await supabase.from('menu_relationship_overrides').insert({
      entity_a_type: entityA.type,
      entity_a_id: entityA.id,
      entity_b_type: entityB.type,
      entity_b_id: entityB.id,
      override_type: overrideType,
    })
    setSaving(false)
    if (error) {
      alert('Error saving override: ' + error.message)
      return
    }
    closeModal()
    onDataChange()
  }

  async function deleteOverride(id: string) {
    if (!confirm('Remove this override?')) return
    const { error } = await supabase.from('menu_relationship_overrides').delete().eq('id', id)
    if (error) {
      alert('Error removing override: ' + error.message)
      return
    }
    onDataChange()
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h2 className="text-xl font-semibold text-white">Relationship Overrides</h2>
          <p className="text-gray-400 text-sm mt-1">
            Manual overrides take absolute priority over structural and tag scoring (Layer 3).
          </p>
        </div>
        <Button onClick={openModal} className="shrink-0">
          Add Connection
        </Button>
      </div>

      {/* Override tracking table */}
      {data.overrides.length === 0 ? (
        <p className="text-gray-500 text-sm py-8 text-center">No overrides set.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-700">
                <th className="text-left text-gray-400 font-medium py-2 pr-4">Entity A</th>
                <th className="text-left text-gray-400 font-medium py-2 pr-4">Entity B</th>
                <th className="text-left text-gray-400 font-medium py-2 pr-4">Override</th>
                <th className="text-left text-gray-400 font-medium py-2 pr-4">
                  Auto Score
                  <span className="ml-1 text-gray-600 font-normal text-xs">(without override)</span>
                </th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data.overrides.map(ov => {
                const autoScore = getAutoScore(ov)
                return (
                  <tr key={ov.id} className="border-b border-gray-800">
                    <td className="py-2 pr-4 text-white">
                      <span className="text-xs text-gray-500 mr-1">[{ov.entity_a_type}]</span>
                      {getEntityDisplayName(data, ov.entity_a_type, ov.entity_a_id)}
                    </td>
                    <td className="py-2 pr-4 text-white">
                      <span className="text-xs text-gray-500 mr-1">[{ov.entity_b_type}]</span>
                      {getEntityDisplayName(data, ov.entity_b_type, ov.entity_b_id)}
                    </td>
                    <td className="py-2 pr-4">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          ov.override_type === 'force_related'
                            ? 'bg-green-900/50 text-green-300'
                            : 'bg-red-900/50 text-red-300'
                        }`}
                      >
                        {ov.override_type === 'force_related' ? 'Force Related' : 'Force Unrelated'}
                      </span>
                    </td>
                    <td className="py-2 pr-4 text-gray-400 text-xs font-mono">
                      {autoScore !== null ? autoScore.toFixed(2) : '—'}
                    </td>
                    <td className="py-2">
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => deleteOverride(ov.id)}
                      >
                        Delete
                      </Button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Connection Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-700 rounded-xl p-6 w-full max-w-lg mx-4 shadow-2xl">
            <h3 className="text-lg font-semibold text-white mb-4">Add Relationship Override</h3>

            <div className="space-y-4">
              <EntitySearchField
                label="Entity A"
                value={searchA}
                selected={entityA}
                onSearch={q => {
                  setSearchA(q)
                  if (!q) setEntityA(null)
                }}
                results={entityA ? [] : searchEntities(searchA)}
                onSelect={e => {
                  setEntityA(e)
                  setSearchA(e.name)
                }}
              />

              <EntitySearchField
                label="Entity B"
                value={searchB}
                selected={entityB}
                onSearch={q => {
                  setSearchB(q)
                  if (!q) setEntityB(null)
                }}
                results={entityB ? [] : searchEntities(searchB)}
                onSelect={e => {
                  setEntityB(e)
                  setSearchB(e.name)
                }}
              />

              <div>
                <p className="text-gray-400 text-sm mb-2">Override Type</p>
                <div className="flex gap-6">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={overrideType === 'force_related'}
                      onChange={() => setOverrideType('force_related')}
                      className="accent-green-500"
                    />
                    <span className="text-sm text-gray-300">Force Related</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="radio"
                      checked={overrideType === 'force_unrelated'}
                      onChange={() => setOverrideType('force_unrelated')}
                      className="accent-red-500"
                    />
                    <span className="text-sm text-gray-300">Force Unrelated</span>
                  </label>
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <Button
                onClick={saveOverride}
                disabled={!entityA || !entityB || saving}
              >
                {saving ? 'Saving...' : 'Save Override'}
              </Button>
              <Button variant="outline" onClick={closeModal}>
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
