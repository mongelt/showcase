'use client'

/**
 * Stage 14 — Admin Menu Page
 * Central hub for all menu management tools.
 */

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import HoverDescEditor from './_components/HoverDescEditor'
import TagsEditor from './_components/TagsEditor'
import RelationshipOverrides from './_components/RelationshipOverrides'
import BulkMatrix from './_components/BulkMatrix'
import HealthDashboard from './_components/HealthDashboard'
import RelationshipNotifications from './_components/RelationshipNotifications'
import LivePreview from './_components/LivePreview'

// ---------------------------------------------------------------------------
// Shared data types — exported so sub-components can import them
// ---------------------------------------------------------------------------

export type AdminCategory = {
  id: string
  name: string
  order_index: number
  desc?: string | null
}

export type AdminSubcategory = {
  id: string
  category_id: string
  name: string
  order_index: number
  desc?: string | null
}

export type AdminCollection = {
  id: string
  name: string
  slug: string
  order_index: number
  desc?: string | null
  description?: any // BlockNote JSON
  contentIds: string[]
}

export type AdminContent = {
  id: string
  title: string
  publication_name?: string | null
  publication_date?: string | null
  desc?: string | null
  subcategory_id?: string | null
  category_id?: string | null
  collection_ids: string[]
  collection_names: string[]
}

export type MenuTag = {
  id: string
  name: string
}

export type EntityTag = {
  id: string
  tag_id: string
  entity_type: string
  entity_id: string
  tag_name: string
}

export type Override = {
  id: string
  entity_a_type: string
  entity_a_id: string
  entity_b_type: string
  entity_b_id: string
  override_type: 'force_related' | 'force_unrelated'
  created_at: string
}

export type Notification = {
  id: string
  entity_a_type: string
  entity_a_id: string
  entity_b_type: string
  entity_b_id: string
  change_type: string
  reason: string
  admin_action: 'pending' | 'accepted' | 'overridden'
  created_at: string
}

export interface PageData {
  categories: AdminCategory[]
  subcategories: AdminSubcategory[]
  collections: AdminCollection[]
  content: AdminContent[]
  tags: MenuTag[]
  entityTags: EntityTag[]
  overrides: Override[]
  notifications: Notification[]
}

// ---------------------------------------------------------------------------
// Section navigation
// ---------------------------------------------------------------------------

const SECTIONS = [
  { id: 'hover', label: 'Hover Descriptions' },
  { id: 'tags', label: 'Tags' },
  { id: 'overrides', label: 'Overrides' },
  { id: 'matrix', label: 'Bulk Matrix' },
  { id: 'health', label: 'Health' },
  { id: 'notifications', label: 'Notifications' },
  { id: 'preview', label: 'Live Preview' },
]

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function AdminMenuPage() {
  const supabase = createClient()
  const [activeSection, setActiveSection] = useState('hover')
  const [data, setData] = useState<PageData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [
        catRes,
        subRes,
        colRes,
        contentRes,
        tagsRes,
        entityTagsRes,
        overridesRes,
        notifRes,
      ] = await Promise.all([
        supabase
          .from('categories')
          .select('id, name, order_index, desc')
          .order('order_index'),
        supabase
          .from('subcategories')
          .select('id, category_id, name, order_index, desc')
          .order('order_index'),
        supabase
          .from('collections')
          .select('id, name, slug, order_index, desc, description, content_collections(content_id)')
          .order('order_index'),
        supabase
          .from('content')
          .select(
            'id, title, publication_name, publication_date, desc, subcategory_id, category_id, content_collections(collection_id, collections(name))',
          )
          .order('title'),
        supabase.from('menu_tags').select('id, name').order('name'),
        supabase
          .from('menu_entity_tags')
          .select('id, tag_id, entity_type, entity_id, menu_tags(name)'),
        supabase
          .from('menu_relationship_overrides')
          .select('*')
          .order('created_at', { ascending: false }),
        supabase
          .from('menu_relationship_notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(5),
      ])

      const collections: AdminCollection[] = (colRes.data || []).map((col: any) => ({
        id: col.id,
        name: col.name,
        slug: col.slug,
        order_index: col.order_index,
        desc: col.desc,
        description: col.description,
        contentIds: (col.content_collections || []).map((cc: any) => cc.content_id),
      }))

      const content: AdminContent[] = (contentRes.data || []).map((item: any) => {
        const ccs = item.content_collections || []
        const collection_ids: string[] = []
        const collection_names: string[] = []
        for (const cc of ccs) {
          if (cc.collection_id) collection_ids.push(cc.collection_id)
          const colRow = Array.isArray(cc.collections) ? cc.collections[0] : cc.collections
          if (colRow?.name) collection_names.push(colRow.name)
        }
        return {
          id: item.id,
          title: item.title,
          publication_name: item.publication_name,
          publication_date: item.publication_date,
          desc: item.desc,
          subcategory_id: item.subcategory_id,
          category_id: item.category_id,
          collection_ids,
          collection_names,
        }
      })

      const entityTags: EntityTag[] = (entityTagsRes.data || []).map((et: any) => ({
        id: et.id,
        tag_id: et.tag_id,
        entity_type: et.entity_type,
        entity_id: et.entity_id,
        tag_name: Array.isArray(et.menu_tags) ? et.menu_tags[0]?.name || '' : et.menu_tags?.name || '',
      }))

      setData({
        categories: catRes.data || [],
        subcategories: subRes.data || [],
        collections,
        content,
        tags: tagsRes.data || [],
        entityTags,
        overrides: overridesRes.data || [],
        notifications: notifRes.data || [],
      })
    } catch (err: any) {
      setError(err?.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-white mb-8">Menu Administration</h1>
        <p className="text-gray-400">Loading...</p>
      </div>
    )
  }

  if (error || !data) {
    return (
      <div>
        <h1 className="text-3xl font-bold text-white mb-8">Menu Administration</h1>
        <p className="text-red-400">{error || 'Failed to load data.'}</p>
        <button onClick={loadData} className="mt-2 text-sm text-blue-400 hover:text-blue-300">
          Retry
        </button>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold text-white">Menu Administration</h1>
        <Link
          href="/admin/menu/thumbnails"
          className="text-sm bg-gray-800 hover:bg-gray-700 text-gray-300 hover:text-white px-4 py-2 rounded-md transition-colors"
        >
          Thumbnails →
        </Link>
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 mb-6 flex-wrap">
        {SECTIONS.map(s => (
          <button
            key={s.id}
            onClick={() => setActiveSection(s.id)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              activeSection === s.id
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white'
            }`}
          >
            {s.label}
          </button>
        ))}
      </div>

      {activeSection === 'hover' && <HoverDescEditor data={data} onDataChange={loadData} />}
      {activeSection === 'tags' && <TagsEditor data={data} onDataChange={loadData} />}
      {activeSection === 'overrides' && (
        <RelationshipOverrides data={data} onDataChange={loadData} />
      )}
      {activeSection === 'matrix' && <BulkMatrix data={data} onDataChange={loadData} />}
      {activeSection === 'health' && <HealthDashboard data={data} />}
      {activeSection === 'notifications' && (
        <RelationshipNotifications
          data={data}
          onDataChange={loadData}
          onOpenOverrideModal={() => setActiveSection('overrides')}
        />
      )}
      {activeSection === 'preview' && <LivePreview data={data} />}
    </div>
  )
}
