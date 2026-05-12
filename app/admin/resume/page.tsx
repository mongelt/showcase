'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import dynamic from 'next/dynamic'
import type { PartialBlock } from '@blocknote/core'

const BlockNoteEditor = dynamic(() => import('@/components/editor/BlockNoteEditorDynamic'), {
  ssr: false,
})

type ResumeEntryType = {
  id: string
  name: string
  icon: string | null
}

type ResumeEntry = {
  id: string
  entry_type_id: string | null
  title: string
  subtitle: string | null
  date_start: string | null
  date_end: string | null
  description: any
  short_description: string | null
  plane_description: string | null
  collection_id: string | null
  is_featured: boolean
  resume_assets?: ResumeAsset[]
}

type Collection = {
  id: string
  name: string
  slug: string
}

type ContentItem = {
  id: string
  title: string
  type: string
}

type ResumeAsset = {
  id?: string
  asset_type: 'content' | 'link'
  content_id?: string | null
  link_url?: string | null
  link_title?: string | null
  custom_caption?: string | null
  icon_key?: string | null
  thumbnail_url?: string | null
  order_index: number
}
type AssetIcon = {
  id: string
  name: string
  icon_url: string
  order_index: number
}

export default function ResumeManagement() {
  const supabase = createClient()
  const [entryTypes, setEntryTypes] = useState<ResumeEntryType[]>([])
  const [entries, setEntries] = useState<ResumeEntry[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [contentItems, setContentItems] = useState<ContentItem[]>([])
  const [assetIcons, setAssetIcons] = useState<AssetIcon[]>([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  
  const [selectedType, setSelectedType] = useState('')
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [dateStart, setDateStart] = useState('')
  const [dateEnd, setDateEnd] = useState('')
  const [shortDescription, setShortDescription] = useState('')
  const [planeDescription, setPlaneDescription] = useState('')
  const [descriptionData, setDescriptionData] = useState<PartialBlock[] | undefined>()

  const [selectedCollection, setSelectedCollection] = useState('')
  const [assets, setAssets] = useState<ResumeAsset[]>([])
  const [isFeatured, setIsFeatured] = useState(false)
  
  const [showDebugWindow, setShowDebugWindow] = useState(false)
  const [showAllMarkers, setShowAllMarkers] = useState(false)

  useEffect(() => {
    loadData()
    loadDebugSettings()
  }, [])

  function loadDebugSettings() {
    if (typeof window !== 'undefined') {
      const savedDebugWindow = localStorage.getItem('resume-debug-window')
      const savedAllMarkers = localStorage.getItem('resume-all-markers')
      
      if (savedDebugWindow !== null) {
        setShowDebugWindow(savedDebugWindow === 'true')
      }
      if (savedAllMarkers !== null) {
        setShowAllMarkers(savedAllMarkers === 'true')
      }
    }
  }

  function saveDebugSettings(debugWindow?: boolean, allMarkers?: boolean) {
    if (typeof window !== 'undefined') {
      const debugWindowValue = debugWindow !== undefined ? debugWindow : showDebugWindow
      const allMarkersValue = allMarkers !== undefined ? allMarkers : showAllMarkers
      localStorage.setItem('resume-debug-window', debugWindowValue.toString())
      localStorage.setItem('resume-all-markers', allMarkersValue.toString())
    }
  }

  async function loadData() {
    const [typesResult, entriesResult, collectionsResult, contentResult, iconsResult] = await Promise.all([
      supabase.from('resume_entry_types').select('*').order('order_index'),
      supabase.from('resume_entries').select('*, resume_assets(*)').order('date_start', { ascending: false }),
      supabase.from('collections').select('id, name, slug').order('order_index'),
      supabase.from('content').select('id, title, type').order('title'),
      supabase.from('resume_asset_icons').select('*').order('order_index')
    ])
    
    setEntryTypes(typesResult.data || [])
    setEntries(entriesResult.data || [])
    setCollections(collectionsResult.data || [])
    setContentItems(contentResult.data || [])
    setAssetIcons(iconsResult.data || [])
  }

  async function createEntry() {
    if (!title || !selectedType) {
      alert('Please fill in title and type')
      return
    }

    // Extract image sizes from BlockNote image blocks in description
    // BlockNote only stores previewWidth - let browser calculate height to preserve aspect ratio
    let descriptionImageSizes: Record<string, { width?: number; height?: number }> | null = null
    if (descriptionData) {
      descriptionImageSizes = {}
      descriptionData.forEach((block) => {
        if (block.type === 'image' && block.props?.url) {
          const url = block.props.url as string
          const width = block.props.previewWidth as number | undefined
          if (width) {
            // Only store width - browser will calculate height to maintain aspect ratio
            descriptionImageSizes![url] = { width }
          }
        }
      })
      // Set to null if no images found (matches original behavior)
      if (descriptionImageSizes && Object.keys(descriptionImageSizes).length === 0) {
        descriptionImageSizes = null
      }
    }

    const { data: entryData, error } = await supabase
      .from('resume_entries')
      .insert({
        entry_type_id: selectedType,
        title,
        subtitle: subtitle || null,
        date_start: dateStart || null,
        date_end: dateEnd || null,
        short_description: shortDescription || null,
        plane_description: planeDescription || null,
        description: descriptionData || null,
        description_image_sizes: descriptionImageSizes,
        collection_id: selectedCollection || null,
        is_featured: isFeatured,
        order_index: entries.length,
      })
      .select()
      .single()

    if (!error && entryData && assets.length > 0) {
      const assetInserts = assets.map((asset, index) => ({
        resume_entry_id: entryData.id,
        asset_type: asset.asset_type,
        content_id: asset.content_id,
        link_url: asset.link_url,
        link_title: asset.link_title,
        custom_caption: asset.custom_caption || null,
        icon_key: asset.icon_key || null,
        thumbnail_url: asset.thumbnail_url || null,
        order_index: index
      }))
      
      await supabase.from('resume_assets').insert(assetInserts)
    }
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      resetForm()
      loadData()
    }
  }

  async function updateEntry() {
    if (!title || !selectedType || !editingId) return


    // Extract image sizes from BlockNote image blocks in description
    // BlockNote only stores previewWidth - let browser calculate height to preserve aspect ratio
    let descriptionImageSizes: Record<string, { width?: number; height?: number }> | null = null
    if (descriptionData) {
      descriptionImageSizes = {}
      descriptionData.forEach((block) => {
        if (block.type === 'image' && block.props?.url) {
          const url = block.props.url as string
          const width = block.props.previewWidth as number | undefined
          if (width) {
            // Only store width - browser will calculate height to maintain aspect ratio
            descriptionImageSizes![url] = { width }
          }
        }
      })
      // Set to null if no images found (matches original behavior)
      if (descriptionImageSizes && Object.keys(descriptionImageSizes).length === 0) {
        descriptionImageSizes = null
      }
    }

    const { error } = await supabase
      .from('resume_entries')
      .update({
        entry_type_id: selectedType,
        title,
        subtitle: subtitle || null,
        date_start: dateStart || null,
        date_end: dateEnd || null,
        short_description: shortDescription || null,
        plane_description: planeDescription || null,
        description: descriptionData || null,
        description_image_sizes: descriptionImageSizes,
        collection_id: selectedCollection || null,
        is_featured: isFeatured,
      })
      .eq('id', editingId)

    if (!error && editingId) {
      const { error: deleteError } = await supabase.from('resume_assets').delete().eq('resume_entry_id', editingId)
      
      if (deleteError) {
        console.error('Error deleting assets:', deleteError)
      }
      
      if (assets.length > 0) {
        const assetInserts = assets.map((asset, index) => ({
          resume_entry_id: editingId,
          asset_type: asset.asset_type,
          content_id: asset.content_id,
          link_url: asset.link_url,
          link_title: asset.link_title,
          custom_caption: asset.custom_caption || null,
          icon_key: asset.icon_key || null,
          thumbnail_url: asset.thumbnail_url || null,
          order_index: index
        }))
        
        const { error: insertError } = await supabase.from('resume_assets').insert(assetInserts)
        
        if (insertError) {
          console.error('Error inserting assets:', insertError)
        }
      }
    }
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      resetForm()
      loadData()
    }
  }

  function resetForm() {
    setTitle('')
    setSubtitle('')
    setDateStart('')
    setDateEnd('')
    setShortDescription('')
    setPlaneDescription('')
    setDescriptionData(undefined)
    setSelectedCollection('')
    setAssets([])
    setIsFeatured(false)
    setSelectedType('')
    setShowForm(false)
    setEditingId(null)
  }

  async function startEdit(entry: ResumeEntry) {
    
    setEditingId(entry.id)
    setSelectedType(entry.entry_type_id || '')
    setTitle(entry.title)
    setSubtitle(entry.subtitle || '')
    setDateStart(entry.date_start || '')
    setDateEnd(entry.date_end || '')
    setShortDescription(entry.short_description || '')
    setPlaneDescription(entry.plane_description || '')
    setDescriptionData(entry.description)
    setSelectedCollection(entry.collection_id || '')
    setIsFeatured(entry.is_featured)

    if (entry.resume_assets && entry.resume_assets.length > 0) {
      setAssets(entry.resume_assets.map(a => ({
        id: a.id,
        asset_type: a.asset_type,
        content_id: a.content_id,
        link_url: a.link_url,
        link_title: a.link_title,
        custom_caption: a.custom_caption || '',
        icon_key: a.icon_key || '',
        thumbnail_url: (a as any).thumbnail_url || '',
        order_index: a.order_index ?? 0
      })))
    } else {
      const { data: assetsData } = await supabase
        .from('resume_assets')
        .select('*')
        .eq('resume_entry_id', entry.id)
        .order('order_index')
      setAssets((assetsData || []).map(a => ({
        id: a.id,
        asset_type: a.asset_type as 'content' | 'link',
        content_id: a.content_id,
        link_url: a.link_url,
        link_title: a.link_title,
        custom_caption: (a as any).custom_caption || '',
        icon_key: (a as any).icon_key || '',
        thumbnail_url: (a as any).thumbnail_url || '',
        order_index: (a as any).order_index ?? 0
      })))
    }
    setShowForm(true)
  }

  async function deleteEntry(id: string) {
    if (!confirm('Delete this resume entry?')) return
    
    const { error } = await supabase
      .from('resume_entries')
      .delete()
      .eq('id', id)
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      loadData()
    }
  }

  function getTypeName(typeId: string | null) {
    if (!typeId) return 'No Type'
    const type = entryTypes.find(t => t.id === typeId)
    return type ? `${type.icon || ''} ${type.name}` : 'Unknown'
  }

  function addAsset() {
    setAssets([...assets, {
      asset_type: 'link',
      link_url: '',
      link_title: '',
      custom_caption: '',
      icon_key: '',
      thumbnail_url: '',
      order_index: assets.length
    }])
  }

  function removeAsset(index: number) {
    setAssets(assets.filter((_, i) => i !== index))
  }

  function updateAsset(index: number, field: keyof ResumeAsset, value: any) {
    const newAssets = [...assets]
    newAssets[index] = { ...newAssets[index], [field]: value }
    setAssets(newAssets)
  }

  async function uploadAssetThumbnail(index: number, file: File) {
    updateAsset(index, 'thumbnail_url', '__uploading__')
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)
      const res = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      )
      const data = await res.json()
      if (!data.secure_url) throw new Error(data?.error?.message || 'Upload failed')
      updateAsset(index, 'thumbnail_url', data.secure_url)
    } catch (e: any) {
      alert('Thumbnail upload failed: ' + e.message)
      updateAsset(index, 'thumbnail_url', '')
    }
  }

  function getPositionLabel() {
    const type = entryTypes.find(t => t.id === selectedType)
    if (!type) return 'Title'
    if (type.name === 'Center') return 'Caption'
    return 'Company Name'
  }

  function getSubtitleLabel() {
    const type = entryTypes.find(t => t.id === selectedType)
    if (!type || type.name === 'Center') return null
    return 'Job Title'
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Resume Timeline</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Entry'}
        </Button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Debugging</h2>
        
        <div className="space-y-4">
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showDebugWindow}
                onChange={(e) => {
                  const newValue = e.target.checked
                  setShowDebugWindow(newValue)
                  saveDebugSettings(newValue, showAllMarkers)
                }}
                className="rounded border-gray-600 bg-gray-800 text-emerald-400 focus:ring-emerald-400"
              />
              <span className="text-gray-300">Show Debug Window on Frontend</span>
            </label>
          </div>
          
          <div className="flex items-center space-x-4">
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={showAllMarkers}
                onChange={(e) => {
                  const newValue = e.target.checked
                  setShowAllMarkers(newValue)
                  saveDebugSettings(showDebugWindow, newValue)
                }}
                className="rounded border-gray-600 bg-gray-800 text-emerald-400 focus:ring-emerald-400"
              />
              <span className="text-gray-300">Show All Markers (2010 to Now)</span>
            </label>
          </div>
          
          <div className="text-sm text-gray-400">
            <p><strong>Debug Window:</strong> Shows timeline height, marker count, and marker details on the frontend.</p>
            <p><strong>All Markers:</strong> Displays every month marker from January 2010 to current month for testing timeline density.</p>
          </div>
        </div>
      </div>

      {showForm && (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8 space-y-4">
          <h2 className="text-xl font-semibold text-white">
            {editingId ? 'Edit Resume Entry' : 'New Resume Entry'}
          </h2>
          
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Position *
            </label>
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="w-full h-10 rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-white"
              required
            >
              <option value="">Select position...</option>
              {entryTypes.map(type => (
                <option key={type.id} value={type.id}>
                  {type.icon} {type.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Controls where the entry appears on the timeline (left, right, or center)
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              {getPositionLabel()} *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={selectedType && entryTypes.find(t => t.id === selectedType)?.name === 'Center' ? 'e.g., Caption' : 'e.g., Company Name'}
              required
            />
          </div>

          {getSubtitleLabel() && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {getSubtitleLabel()}
              </label>
              <Input
                value={subtitle}
                onChange={(e) => setSubtitle(e.target.value)}
                placeholder="e.g., Senior Reporter"
              />
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Start Date
              </label>
              <Input
                type="date"
                value={dateStart ?? ''}
                onChange={(e) => setDateStart(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                End Date
              </label>
              <Input
                type="date"
                value={dateEnd ?? ''}
                onChange={(e) => setDateEnd(e.target.value)}
                placeholder="Leave empty if current"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Short Description
            </label>
            <textarea
              value={shortDescription}
              onChange={(e) => setShortDescription(e.target.value)}
              placeholder="Brief description that shows when collapsed (plain text)"
              className="w-full h-20 rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-white resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              This appears in the collapsed view. Keep it concise.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Plane Description (optional)
            </label>
            <textarea
              value={planeDescription}
              onChange={(e) => setPlaneDescription(e.target.value)}
              placeholder="2-line description for the portfolio overlay card (max ~120 chars)"
              maxLength={100}
              className="w-full h-16 rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-white resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Appears on the resume overlay card. Leave empty to show no description. Max 120 characters.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Full Description (optional)
            </label>
            <div className="rounded-lg border border-gray-700 min-h-[400px] p-6" style={{ backgroundColor: '#1f1f1f', colorScheme: 'light' }}>
              <BlockNoteEditor
                key={editingId ? `edit-${editingId}` : 'new'}
                data={descriptionData}
                onChange={(data) => setDescriptionData(data as any)}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Detailed description that shows when expanded. Uses rich text editor.
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Samples Collection (optional)
            </label>
            <select
              value={selectedCollection}
              onChange={(e) => setSelectedCollection(e.target.value)}
              className="w-full h-10 rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-white"
            >
              <option value="">No collection</option>
              {collections.map(collection => (
                <option key={collection.id} value={collection.id}>
                  {collection.name}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Links to a collection for the "Samples" button
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Assets
            </label>
            <div className="space-y-3">
              {assets.map((asset, index) => (
                <div key={index} className="space-y-2 p-3 bg-gray-800 rounded-lg">
                  <div className="flex gap-2">
                    <select
                      value={asset.asset_type}
                      onChange={(e) => updateAsset(index, 'asset_type', e.target.value as 'content' | 'link')}
                      className="h-8 rounded border border-gray-700 bg-gray-950 px-2 py-1 text-white text-sm"
                    >
                      <option value="link">Custom Link</option>
                      <option value="content">Content Item</option>
                    </select>
                    
                    {asset.asset_type === 'content' ? (
                      <select
                        value={asset.content_id || ''}
                        onChange={(e) => updateAsset(index, 'content_id', e.target.value)}
                        className="flex-1 h-8 rounded border border-gray-700 bg-gray-950 px-2 py-1 text-white text-sm"
                      >
                        <option value="">Select content...</option>
                        {contentItems.map(item => (
                          <option key={item.id} value={item.id}>
                            {item.title} ({item.type})
                          </option>
                        ))}
                      </select>
                    ) : (
                      <>
                        <Input
                          value={asset.link_url || ''}
                          onChange={(e) => updateAsset(index, 'link_url', e.target.value)}
                          placeholder="URL"
                          className="flex-1 h-8 text-sm"
                        />
                        <Input
                          value={asset.link_title || ''}
                          onChange={(e) => updateAsset(index, 'link_title', e.target.value)}
                          placeholder="Title"
                          className="flex-1 h-8 text-sm"
                        />
                      </>
                    )}
                  </div>

                  {asset.asset_type === 'link' && (
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-xs text-gray-400">Thumbnail</span>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) uploadAssetThumbnail(index, file)
                            e.target.value = ''
                          }}
                          id={`asset-thumb-${index}`}
                        />
                        <label
                          htmlFor={`asset-thumb-${index}`}
                          className="cursor-pointer text-xs px-2 py-1 rounded bg-gray-700 text-gray-300 hover:bg-gray-600"
                        >
                          {asset.thumbnail_url === '__uploading__' ? 'Uploading…' : asset.thumbnail_url ? 'Replace' : 'Upload image'}
                        </label>
                      </label>
                      {asset.thumbnail_url && asset.thumbnail_url !== '__uploading__' && (
                        <>
                          <img src={asset.thumbnail_url} alt="" className="h-8 w-12 object-cover rounded border border-gray-600" />
                          <button
                            type="button"
                            onClick={() => updateAsset(index, 'thumbnail_url', '')}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Remove
                          </button>
                        </>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={asset.custom_caption || ''}
                      onChange={(e) => updateAsset(index, 'custom_caption', e.target.value)}
                      placeholder="Custom caption (optional)"
                      className="h-8 text-sm"
                    />
                    <select
                      value={asset.icon_key || ''}
                      onChange={(e) => updateAsset(index, 'icon_key', e.target.value)}
                      className="h-8 rounded border border-gray-700 bg-gray-950 px-2 py-1 text-white text-sm"
                    >
                      <option value="">No icon</option>
                      {assetIcons.map(icon => (
                        <option key={icon.id} value={icon.id}>
                          {icon.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => removeAsset(index)}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              
              <Button
                type="button"
                variant="outline"
                onClick={addAsset}
                className="w-full"
              >
                + Add Asset
              </Button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Add links to portfolio items or custom URLs
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-gray-300">
              <input
                type="checkbox"
                checked={isFeatured}
                onChange={(e) => setIsFeatured(e.target.checked)}
                className="rounded border-gray-700 bg-gray-950"
              />
              <span className="text-sm">Featured Entry (highlight on timeline)</span>
            </label>
          </div>

          <div className="flex gap-2">
            <Button onClick={editingId ? updateEntry : createEntry}>
              {editingId ? 'Update Entry' : 'Create Entry'}
            </Button>
            {editingId && (
              <Button variant="outline" onClick={resetForm}>
                Cancel Edit
              </Button>
            )}
          </div>
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Resume Entries</h2>
        
        <div className="space-y-3">
          {entries.map(entry => (
            <div 
              key={entry.id}
              className={`rounded-lg p-4 ${entry.is_featured ? 'bg-blue-900/30 border border-blue-800' : 'bg-gray-800'}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs px-2 py-1 rounded bg-gray-700 text-gray-300">
                      {getTypeName(entry.entry_type_id)}
                    </span>
                    {entry.is_featured && (
                      <span className="text-xs px-2 py-1 rounded bg-blue-600 text-white">
                        ⭐ Featured
                      </span>
                    )}
                  </div>
                  <h3 className="text-white font-semibold">{entry.title}</h3>
                  {entry.subtitle && (
                    <p className="text-gray-400 text-sm">{entry.subtitle}</p>
                  )}
                  {(entry.date_start || entry.date_end) && (
                    <p className="text-gray-500 text-sm mt-1">
                      {entry.date_start ? (() => {
                        const [year, month, day] = entry.date_start.split('-').map(Number)
                        return new Date(year, month - 1, day).toLocaleDateString()
                      })() : '?'} 
                      {' → '}
                      {entry.date_end ? (() => {
                        const [year, month, day] = entry.date_end.split('-').map(Number)
                        return new Date(year, month - 1, day).toLocaleDateString()
                      })() : 'Present'}
                    </p>
                  )}
                      {entry.description && (
                        <div className="text-gray-400 text-sm mt-2">
                          {entry.description?.[0]?.content?.[0]?.text || 'Has description'}
                        </div>
                      )}
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => startEdit(entry)}
                  >
                    Edit
                  </Button>
                  <Button 
                    variant="destructive" 
                    size="sm"
                    onClick={() => deleteEntry(entry.id)}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          ))}
          
          {entries.length === 0 && (
            <p className="text-gray-500 text-center py-8">
              No resume entries yet. Click "Add Entry" to create your first one!
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

