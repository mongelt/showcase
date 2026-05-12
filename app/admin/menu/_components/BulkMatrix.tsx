'use client'

/**
 * Stage 14d — Bulk Relationship Matrix
 * Subcategories × Subcategories and Collections × Collections grids.
 * Checkboxes write force_related overrides; unchecking removes them.
 * Grey = auto-detected structural connection. Blue = manual override.
 */

import { useState, useMemo } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { PageData } from '../page'
import {
  scoreStructural,
  AnyEntity,
  SubcategoryScoringEntity,
  CollectionScoringEntity,
} from '@/lib/menu/scoring'

type MatrixMode = 'subcategories' | 'collections'

const MATRIX_LIMIT = 20

export default function BulkMatrix({
  data,
  onDataChange,
}: {
  data: PageData
  onDataChange: () => void
}) {
  const supabase = createClient()
  const [mode, setMode] = useState<MatrixMode>('subcategories')

  // Build scoring entities for auto-detection
  const subcatEntities = useMemo((): SubcategoryScoringEntity[] => {
    const subcatCols = new Map<string, Set<string>>()
    for (const item of data.content) {
      if (!item.subcategory_id) continue
      if (!subcatCols.has(item.subcategory_id)) subcatCols.set(item.subcategory_id, new Set())
      for (const cid of item.collection_ids) subcatCols.get(item.subcategory_id)!.add(cid)
    }
    return data.subcategories.map(s => ({
      id: s.id,
      type: 'subcategory',
      tags: [],
      categoryId: s.category_id,
      collectionIds: Array.from(subcatCols.get(s.id) || []),
    }))
  }, [data.content, data.subcategories])

  const colEntities = useMemo((): CollectionScoringEntity[] => {
    return data.collections.map(col => ({
      id: col.id,
      type: 'collection',
      tags: [],
      contentIds: col.contentIds,
    }))
  }, [data.collections])

  const allEntitiesForScoring = useMemo(
    (): AnyEntity[] => [...subcatEntities, ...colEntities],
    [subcatEntities, colEntities],
  )

  function isAutoRelated(aId: string, bId: string, entityType: 'subcategory' | 'collection'): boolean {
    const entities =
      entityType === 'subcategory'
        ? (subcatEntities as AnyEntity[])
        : (colEntities as AnyEntity[])
    const a = entities.find(e => e.id === aId)
    const b = entities.find(e => e.id === bId)
    if (!a || !b) return false
    return scoreStructural(a, b, allEntitiesForScoring) > 0
  }

  function findOverride(aId: string, bId: string, entityType: string) {
    return data.overrides.find(
      o =>
        o.override_type === 'force_related' &&
        ((o.entity_a_id === aId &&
          o.entity_b_id === bId &&
          o.entity_a_type === entityType &&
          o.entity_b_type === entityType) ||
          (o.entity_a_id === bId &&
            o.entity_b_id === aId &&
            o.entity_a_type === entityType &&
            o.entity_b_type === entityType)),
    )
  }

  async function toggleCell(aId: string, bId: string, entityType: string) {
    const existing = findOverride(aId, bId, entityType)
    if (existing) {
      const { error } = await supabase
        .from('menu_relationship_overrides')
        .delete()
        .eq('id', existing.id)
      if (error) {
        alert('Error: ' + error.message)
        return
      }
    } else {
      const { error } = await supabase.from('menu_relationship_overrides').insert({
        entity_a_type: entityType,
        entity_a_id: aId,
        entity_b_type: entityType,
        entity_b_id: bId,
        override_type: 'force_related',
      })
      if (error) {
        alert('Error: ' + error.message)
        return
      }
    }
    onDataChange()
  }

  const subcats = data.subcategories.slice(0, MATRIX_LIMIT)
  const collections = data.collections.slice(0, MATRIX_LIMIT)
  const items = mode === 'subcategories' ? subcats : collections
  const entityType = mode === 'subcategories' ? 'subcategory' : 'collection'

  function getDisplayName(id: string): string {
    if (mode === 'subcategories') {
      return data.subcategories.find(s => s.id === id)?.name || id
    }
    return data.collections.find(c => c.id === id)?.name || id
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-1">Bulk Relationship Matrix</h2>
      <p className="text-gray-400 text-sm mb-4">
        Click intersections to toggle force-related overrides.{' '}
        <span className="text-gray-500">Grey</span> = auto-detected structural connection.{' '}
        <span className="text-blue-400">Blue</span> = manual override. Lower-left triangle is read-only (mirror).
        {mode === 'subcategories' && data.subcategories.length > MATRIX_LIMIT && (
          <span className="text-yellow-500">
            {' '}
            Showing first {MATRIX_LIMIT} of {data.subcategories.length}.
          </span>
        )}
        {mode === 'collections' && data.collections.length > MATRIX_LIMIT && (
          <span className="text-yellow-500">
            {' '}
            Showing first {MATRIX_LIMIT} of {data.collections.length}.
          </span>
        )}
      </p>

      <div className="flex gap-2 mb-4">
        {(['subcategories', 'collections'] as MatrixMode[]).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            className={`px-3 py-1.5 rounded text-sm capitalize transition-colors ${
              mode === m ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {items.length < 2 ? (
        <p className="text-gray-500 text-sm py-4 text-center">
          Need at least 2 {mode} to show matrix.
        </p>
      ) : (
        <div className="overflow-x-auto">
          <table className="border-collapse">
            <thead>
              <tr>
                {/* Empty corner */}
                <th className="w-36 min-w-[144px]"></th>
                {items.map(item => (
                  <th key={item.id} className="p-0.5">
                    <div
                      className="text-xs text-gray-400 text-left w-8"
                      style={{
                        writingMode: 'vertical-rl',
                        transform: 'rotate(180deg)',
                        height: '72px',
                        overflow: 'hidden',
                        whiteSpace: 'nowrap',
                      }}
                      title={getDisplayName(item.id)}
                    >
                      {getDisplayName(item.id)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map((rowItem, rowIdx) => (
                <tr key={rowItem.id}>
                  <td
                    className="pr-2 py-0.5 text-xs text-gray-400 max-w-[144px] truncate"
                    title={getDisplayName(rowItem.id)}
                  >
                    {getDisplayName(rowItem.id)}
                  </td>
                  {items.map((colItem, colIdx) => {
                    // Lower-left triangle = mirror; show as disabled fill
                    if (rowIdx >= colIdx) {
                      return (
                        <td key={colItem.id} className="p-0.5">
                          <div className="w-7 h-7 rounded bg-gray-850 border border-gray-800" />
                        </td>
                      )
                    }

                    const auto = isAutoRelated(
                      rowItem.id,
                      colItem.id,
                      mode === 'subcategories' ? 'subcategory' : 'collection',
                    )
                    const manual = !!findOverride(rowItem.id, colItem.id, entityType)

                    return (
                      <td key={colItem.id} className="p-0.5">
                        <button
                          onClick={() => toggleCell(rowItem.id, colItem.id, entityType)}
                          title={
                            manual
                              ? 'Manual override (click to remove)'
                              : auto
                                ? 'Auto-detected (click to add manual override)'
                                : 'No connection (click to force-relate)'
                          }
                          className={`w-7 h-7 rounded border transition-colors ${
                            manual
                              ? 'bg-blue-600 border-blue-500 hover:bg-blue-700'
                              : auto
                                ? 'bg-gray-600 border-gray-500 hover:bg-gray-500'
                                : 'bg-gray-900 border-gray-700 hover:bg-gray-800'
                          }`}
                        >
                          {(manual || auto) && (
                            <span
                              className={`text-xs leading-none ${
                                manual ? 'text-white' : 'text-gray-400'
                              }`}
                            >
                              ✓
                            </span>
                          )}
                        </button>
                      </td>
                    )
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
