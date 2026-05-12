'use client'

/**
 * Stage 14b — Internal Tags Editor
 * Per entity: tag chips with removal, autocomplete tag input.
 */

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import type { PageData } from '../page'

type EntityTypeTab = 'categories' | 'subcategories' | 'collections' | 'content'

const TABS: { id: EntityTypeTab; label: string; dbType: string }[] = [
  { id: 'categories', label: 'Categories', dbType: 'category' },
  { id: 'subcategories', label: 'Subcategories', dbType: 'subcategory' },
  { id: 'collections', label: 'Collections', dbType: 'collection' },
  { id: 'content', label: 'Content', dbType: 'content' },
]

export default function TagsEditor({
  data,
  onDataChange,
}: {
  data: PageData
  onDataChange: () => void
}) {
  const supabase = createClient()
  const [tab, setTab] = useState<EntityTypeTab>('categories')
  const [tagInputs, setTagInputs] = useState<Record<string, string>>({})
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [activeSuggestionFor, setActiveSuggestionFor] = useState<string | null>(null)

  const activeTab = TABS.find(t => t.id === tab)!

  function getEntityTags(entityId: string) {
    return data.entityTags.filter(et => et.entity_id === entityId)
  }

  function handleTagInput(entityId: string, value: string) {
    setTagInputs(prev => ({ ...prev, [entityId]: value }))
    if (value.trim().length > 0) {
      const q = value.toLowerCase()
      const matches = data.tags
        .filter(t => t.name.toLowerCase().includes(q))
        .map(t => t.name)
      setSuggestions(matches)
      setActiveSuggestionFor(entityId)
    } else {
      setSuggestions([])
      setActiveSuggestionFor(null)
    }
  }

  async function addTag(entityId: string, tagName: string) {
    const trimmed = tagName.trim()
    if (!trimmed) return

    const entityType = activeTab.dbType

    // Upsert into menu_tags (insert if not exists, return existing id)
    let tagId: string | null = null

    const existing = data.tags.find(t => t.name.toLowerCase() === trimmed.toLowerCase())
    if (existing) {
      tagId = existing.id
    } else {
      const { data: inserted, error } = await supabase
        .from('menu_tags')
        .insert({ name: trimmed })
        .select('id')
        .single()

      if (error) {
        // May have been inserted by another request — try fetching
        const { data: fetched } = await supabase
          .from('menu_tags')
          .select('id')
          .eq('name', trimmed)
          .single()
        if (!fetched) {
          alert('Error creating tag: ' + error.message)
          return
        }
        tagId = fetched.id
      } else {
        tagId = inserted.id
      }
    }

    if (!tagId) return

    const { error: linkError } = await supabase.from('menu_entity_tags').insert({
      tag_id: tagId,
      entity_type: entityType,
      entity_id: entityId,
    })

    if (linkError && !linkError.message.toLowerCase().includes('unique')) {
      alert('Error adding tag: ' + linkError.message)
      return
    }

    setTagInputs(prev => ({ ...prev, [entityId]: '' }))
    setSuggestions([])
    setActiveSuggestionFor(null)
    onDataChange()
  }

  async function removeTag(entityTagId: string) {
    const { error } = await supabase
      .from('menu_entity_tags')
      .delete()
      .eq('id', entityTagId)
    if (error) {
      alert('Error removing tag: ' + error.message)
      return
    }
    onDataChange()
  }

  // Build display list for current tab
  const entities: { id: string; displayName: string }[] = (() => {
    if (tab === 'categories') {
      return data.categories.map(c => ({ id: c.id, displayName: c.name }))
    }
    if (tab === 'subcategories') {
      return data.subcategories.map(s => ({
        id: s.id,
        displayName: `${data.categories.find(c => c.id === s.category_id)?.name || '?'} / ${s.name}`,
      }))
    }
    if (tab === 'collections') {
      return data.collections.map(c => ({ id: c.id, displayName: c.name }))
    }
    return data.content.map(c => ({ id: c.id, displayName: c.title }))
  })()

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-1">Internal Tags</h2>
      <p className="text-gray-400 text-sm mb-4">
        Admin-only tags. They create semantic connections between entities that have no structural
        overlap. Never shown publicly.
      </p>

      {/* Type tabs */}
      <div className="flex gap-1 mb-4">
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`px-3 py-1.5 rounded text-sm transition-colors ${
              tab === t.id ? 'bg-gray-700 text-white' : 'text-gray-400 hover:text-white'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="space-y-3 max-h-[600px] overflow-y-auto pr-1">
        {entities.map(entity => {
          const tags = getEntityTags(entity.id)
          const inputVal = tagInputs[entity.id] || ''

          return (
            <div key={entity.id} className="bg-gray-800 rounded-lg p-3">
              <p className="text-white text-sm font-medium mb-2">{entity.displayName}</p>

              {/* Current tags as chips */}
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map(tag => (
                  <span
                    key={tag.id}
                    className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-900/40 text-blue-300 text-xs rounded-full border border-blue-700/40"
                  >
                    {tag.tag_name}
                    <button
                      onClick={() => removeTag(tag.id)}
                      className="text-blue-400 hover:text-red-400 leading-none"
                      aria-label={`Remove tag ${tag.tag_name}`}
                    >
                      ×
                    </button>
                  </span>
                ))}
                {tags.length === 0 && (
                  <span className="text-gray-600 text-xs italic">No tags</span>
                )}
              </div>

              {/* Tag input with autocomplete */}
              <div className="relative">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={inputVal}
                    onChange={e => handleTagInput(entity.id, e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter' && inputVal.trim()) {
                        addTag(entity.id, inputVal)
                      }
                      if (e.key === 'Escape') {
                        setSuggestions([])
                        setActiveSuggestionFor(null)
                      }
                    }}
                    onBlur={() => {
                      // Delay to allow mousedown on suggestion
                      setTimeout(() => {
                        if (activeSuggestionFor === entity.id) {
                          setSuggestions([])
                          setActiveSuggestionFor(null)
                        }
                      }, 150)
                    }}
                    placeholder="Add tag..."
                    className="flex-1 h-8 rounded border border-gray-600 bg-gray-950 px-3 text-white text-xs focus:outline-none focus:border-blue-500"
                  />
                  <Button
                    size="sm"
                    onClick={() => addTag(entity.id, inputVal)}
                    disabled={!inputVal.trim()}
                    className="h-8 px-3 text-xs"
                  >
                    Add
                  </Button>
                </div>

                {/* Autocomplete dropdown */}
                {activeSuggestionFor === entity.id && suggestions.length > 0 && (
                  <div className="absolute z-10 top-full left-0 right-12 mt-0.5 bg-gray-950 border border-gray-700 rounded shadow-xl max-h-40 overflow-y-auto">
                    {suggestions.map(s => (
                      <button
                        key={s}
                        className="w-full text-left px-3 py-1.5 text-xs text-gray-300 hover:bg-gray-800"
                        onMouseDown={e => {
                          e.preventDefault()
                          addTag(entity.id, s)
                        }}
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )
        })}

        {entities.length === 0 && (
          <p className="text-gray-500 text-sm py-4 text-center">No {tab} found</p>
        )}
      </div>
    </div>
  )
}
