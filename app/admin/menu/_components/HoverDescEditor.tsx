'use client'

/**
 * Stage 14a — Hover Description Editor
 * Per entity type: list all entities, show desc, inline edit, auto-generation fallback.
 */

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import type {
  PageData,
  AdminCategory,
  AdminSubcategory,
  AdminCollection,
  AdminContent,
} from '../page'

// ---------------------------------------------------------------------------
// Auto-fallback generators
// ---------------------------------------------------------------------------

function generateCategoryFallback(cat: AdminCategory, data: PageData): string {
  const catContent = data.content.filter(c => c.category_id === cat.id)
  const itemCount = catContent.length
  const collectionIdSet = new Set<string>()
  for (const item of catContent) {
    for (const cid of item.collection_ids) collectionIdSet.add(cid)
  }
  const linkedCols = data.collections.filter(c => collectionIdSet.has(c.id))
  return `${cat.name} · ${itemCount} items · Collections: ${linkedCols.map(c => c.name).join(', ') || 'none'}`
}

function generateSubcategoryFallback(sub: AdminSubcategory, data: PageData): string {
  const subContent = data.content.filter(c => c.subcategory_id === sub.id)
  const itemCount = subContent.length
  const subContentIds = new Set(subContent.map(c => c.id))
  const linkedCols = data.collections.filter(col =>
    col.contentIds.some(cid => subContentIds.has(cid)),
  )
  return `${sub.name} · ${itemCount} items · Collections: ${linkedCols.map(c => c.name).join(', ') || 'none'}`
}

function generateContentFallback(item: AdminContent): string {
  const parts: string[] = []
  if (item.publication_name) parts.push(item.publication_name)
  if (item.publication_date) parts.push(item.publication_date)
  if (item.collection_names.length > 0) parts.push(item.collection_names.join(', '))
  return parts.join(' · ') || item.title
}

function generateCollectionFallback(col: AdminCollection): string {
  if (!col.description) return col.name
  try {
    const blocks: any[] = Array.isArray(col.description)
      ? col.description
      : col.description?.blocks || []
    const first = blocks[0]
    if (!first) return col.name
    const textNodes: any[] = Array.isArray(first.content) ? first.content : []
    const text = textNodes.map((n: any) => n?.text || '').join('')
    return text.trim() || col.name
  } catch {
    return col.name
  }
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type EntityTypeTab = 'categories' | 'subcategories' | 'collections' | 'content'

interface EntityDescRowProps {
  id: string
  name: string
  desc?: string | null
  fallback: string
  editing: boolean
  editDesc: string
  onEdit: () => void
  onCancel: () => void
  onDescChange: (v: string) => void
  onSave: () => void
}

// ---------------------------------------------------------------------------
// Sub-component: single row
// ---------------------------------------------------------------------------

function EntityDescRow({
  name,
  desc,
  fallback,
  editing,
  editDesc,
  onEdit,
  onCancel,
  onDescChange,
  onSave,
}: EntityDescRowProps) {
  return (
    <div className="bg-gray-800 rounded-lg p-3">
      {editing ? (
        <div className="space-y-2">
          <p className="text-white text-sm font-medium">{name}</p>
          <textarea
            value={editDesc}
            onChange={e => onDescChange(e.target.value)}
            rows={3}
            placeholder="Leave empty to use auto-generated fallback"
            className="w-full rounded border border-gray-600 bg-gray-950 px-3 py-2 text-white text-sm resize-y focus:outline-none focus:border-blue-500"
          />
          {!editDesc.trim() && (
            <p className="text-xs text-gray-400">
              <span className="text-gray-500">Auto fallback: </span>
              {fallback}
            </p>
          )}
          <div className="flex gap-2">
            <Button size="sm" onClick={onSave}>
              Save
            </Button>
            <Button size="sm" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium">{name}</p>
            {desc ? (
              <p className="text-gray-400 text-xs mt-0.5 truncate">{desc}</p>
            ) : (
              <p className="text-gray-600 text-xs mt-0.5 truncate italic">
                Auto: {fallback}
              </p>
            )}
          </div>
          <Button size="sm" variant="outline" onClick={onEdit} className="shrink-0">
            Edit
          </Button>
        </div>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

const TABS: { id: EntityTypeTab; label: string; table: string }[] = [
  { id: 'categories', label: 'Categories', table: 'categories' },
  { id: 'subcategories', label: 'Subcategories', table: 'subcategories' },
  { id: 'collections', label: 'Collections', table: 'collections' },
  { id: 'content', label: 'Content', table: 'content' },
]

export default function HoverDescEditor({
  data,
  onDataChange,
}: {
  data: PageData
  onDataChange: () => void
}) {
  const supabase = createClient()
  const [tab, setTab] = useState<EntityTypeTab>('categories')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editDesc, setEditDesc] = useState('')

  function startEdit(id: string, currentDesc: string | null | undefined) {
    setEditingId(id)
    setEditDesc(currentDesc || '')
  }

  function cancelEdit() {
    setEditingId(null)
    setEditDesc('')
  }

  async function saveDesc(table: string, id: string) {
    const { error } = await supabase
      .from(table)
      .update({ desc: editDesc.trim() || null })
      .eq('id', id)
    if (error) {
      alert('Error saving description: ' + error.message)
      return
    }
    setEditingId(null)
    setEditDesc('')
    onDataChange()
  }

  const activeTab = TABS.find(t => t.id === tab)!

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-1">Hover Descriptions</h2>
      <p className="text-gray-400 text-sm mb-4">
        These appear when hovering over menu cards. Leave empty to use the auto-generated fallback.
      </p>

      {/* Type tabs */}
      <div className="flex gap-1 mb-4">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id)
              setEditingId(null)
              setEditDesc('')
            }}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${
              tab === t.id
                ? 'bg-gray-700 text-white'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
        {tab === 'categories' &&
          data.categories.map(cat => (
            <EntityDescRow
              key={cat.id}
              id={cat.id}
              name={cat.name}
              desc={cat.desc}
              fallback={generateCategoryFallback(cat, data)}
              editing={editingId === cat.id}
              editDesc={editDesc}
              onEdit={() => startEdit(cat.id, cat.desc)}
              onCancel={cancelEdit}
              onDescChange={setEditDesc}
              onSave={() => saveDesc(activeTab.table, cat.id)}
            />
          ))}

        {tab === 'subcategories' &&
          data.subcategories.map(sub => {
            const catName =
              data.categories.find(c => c.id === sub.category_id)?.name || '?'
            return (
              <EntityDescRow
                key={sub.id}
                id={sub.id}
                name={`${catName} / ${sub.name}`}
                desc={sub.desc}
                fallback={generateSubcategoryFallback(sub, data)}
                editing={editingId === sub.id}
                editDesc={editDesc}
                onEdit={() => startEdit(sub.id, sub.desc)}
                onCancel={cancelEdit}
                onDescChange={setEditDesc}
                onSave={() => saveDesc(activeTab.table, sub.id)}
              />
            )
          })}

        {tab === 'collections' &&
          data.collections.map(col => (
            <EntityDescRow
              key={col.id}
              id={col.id}
              name={col.name}
              desc={col.desc}
              fallback={generateCollectionFallback(col)}
              editing={editingId === col.id}
              editDesc={editDesc}
              onEdit={() => startEdit(col.id, col.desc)}
              onCancel={cancelEdit}
              onDescChange={setEditDesc}
              onSave={() => saveDesc(activeTab.table, col.id)}
            />
          ))}

        {tab === 'content' &&
          data.content.map(item => (
            <EntityDescRow
              key={item.id}
              id={item.id}
              name={item.title}
              desc={item.desc}
              fallback={generateContentFallback(item)}
              editing={editingId === item.id}
              editDesc={editDesc}
              onEdit={() => startEdit(item.id, item.desc)}
              onCancel={cancelEdit}
              onDescChange={setEditDesc}
              onSave={() => saveDesc(activeTab.table, item.id)}
            />
          ))}

        {tab === 'categories' && data.categories.length === 0 && (
          <p className="text-gray-500 text-sm py-4 text-center">No categories found</p>
        )}
        {tab === 'subcategories' && data.subcategories.length === 0 && (
          <p className="text-gray-500 text-sm py-4 text-center">No subcategories found</p>
        )}
        {tab === 'collections' && data.collections.length === 0 && (
          <p className="text-gray-500 text-sm py-4 text-center">No collections found</p>
        )}
        {tab === 'content' && data.content.length === 0 && (
          <p className="text-gray-500 text-sm py-4 text-center">No content found</p>
        )}
      </div>
    </div>
  )
}
