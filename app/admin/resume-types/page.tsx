'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type ResumeEntryType = {
  id: string
  name: string
  icon: string | null
  order_index: number
}
type AssetIcon = {
  id: string
  name: string
  icon_url: string
  order_index: number
}

export default function ResumeTypesManagement() {
  const supabase = createClient()
  const [types, setTypes] = useState<ResumeEntryType[]>([])
  const [newName, setNewName] = useState('')
  const [newIcon, setNewIcon] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')
  const [editIcon, setEditIcon] = useState('')
  const [icons, setIcons] = useState<AssetIcon[]>([])
  const [newIconName, setNewIconName] = useState('')
  const [newIconUrl, setNewIconUrl] = useState('')
  const [editingIconId, setEditingIconId] = useState<string | null>(null)
  const [editIconName, setEditIconName] = useState('')
  const [editIconUrl, setEditIconUrl] = useState('')

  useEffect(() => {
    loadTypes()
    loadIcons()
  }, [])

  async function loadTypes() {
    const { data } = await supabase
      .from('resume_entry_types')
      .select('*')
      .order('order_index')
    
    setTypes(data || [])
  }
  async function loadIcons() {
    const { data } = await supabase
      .from('resume_asset_icons')
      .select('*')
      .order('order_index')
    
    setIcons(data || [])
  }

  async function createType() {
    if (!newName.trim()) return
    
    const { error } = await supabase
      .from('resume_entry_types')
      .insert({ 
        name: newName,
        icon: newIcon || null,
        order_index: types.length 
      })
    
    if (error) {
      alert('Error creating type: ' + error.message)
    } else {
      setNewName('')
      setNewIcon('')
      loadTypes()
    }
  }

  async function updateType() {
    if (!editName.trim() || !editingId) return
    
    const { error } = await supabase
      .from('resume_entry_types')
      .update({ 
        name: editName,
        icon: editIcon || null,
      })
      .eq('id', editingId)
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      setEditingId(null)
      setEditName('')
      setEditIcon('')
      loadTypes()
    }
  }

  async function deleteType(id: string) {
    if (!confirm('Delete this type? Resume entries using it will lose their type association.')) return
    
    const { error } = await supabase
      .from('resume_entry_types')
      .delete()
      .eq('id', id)
    
    if (error) {
      alert('Error: ' + error.message)
    } else {
      loadTypes()
    }
  }

  function startEdit(type: ResumeEntryType) {
    setEditingId(type.id)
    setEditName(type.name)
    setEditIcon(type.icon || '')
  }

  async function createIcon() {
    if (!newIconName.trim() || !newIconUrl.trim()) return

    const { error } = await supabase
      .from('resume_asset_icons')
      .insert({
        name: newIconName,
        icon_url: newIconUrl,
        order_index: icons.length
      })

    if (error) {
      alert('Error creating icon: ' + error.message)
    } else {
      setNewIconName('')
      setNewIconUrl('')
      loadIcons()
    }
  }

  async function updateIcon() {
    if (!editingIconId || !editIconName.trim() || !editIconUrl.trim()) return

    const { error } = await supabase
      .from('resume_asset_icons')
      .update({
        name: editIconName,
        icon_url: editIconUrl
      })
      .eq('id', editingIconId)

    if (error) {
      alert('Error updating icon: ' + error.message)
    } else {
      setEditingIconId(null)
      setEditIconName('')
      setEditIconUrl('')
      loadIcons()
    }
  }

  async function deleteIcon(id: string) {
    if (!confirm('Delete this asset icon?')) return

    const { error } = await supabase
      .from('resume_asset_icons')
      .delete()
      .eq('id', id)

    if (error) {
      alert('Error: ' + error.message)
    } else {
      loadIcons()
    }
  }

  function startEditIcon(icon: AssetIcon) {
    setEditingIconId(icon.id)
    setEditIconName(icon.name)
    setEditIconUrl(icon.icon_url)
  }

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">Timeline Position Types</h1>

      <div className="bg-yellow-900/20 border border-yellow-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-yellow-400 mb-4">⚠️ Important Notice</h2>
        <p className="text-yellow-200 text-sm mb-4">
          This table now controls timeline positioning for resume entries. It should contain exactly 3 entries:
        </p>
        <ul className="text-yellow-200 text-sm list-disc list-inside mb-4">
          <li><strong>Left Side</strong> - Entry appears on the left of the timeline</li>
          <li><strong>Right Side</strong> - Entry appears on the right of the timeline</li>
          <li><strong>Center</strong> - Entry appears centered on the timeline (caption style)</li>
        </ul>
        <p className="text-yellow-200 text-sm">
          Do not add or remove entries unless you understand the implications for your resume timeline layout.
        </p>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold text-white mb-4">Create New Position Type</h2>
        <p className="text-gray-400 text-sm mb-4">
          Position types control where resume entries appear on the timeline
        </p>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Position Name *
            </label>
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="e.g., Left Side, Right Side, Center"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Icon (Emoji)
            </label>
            <Input
              value={newIcon}
              onChange={(e) => setNewIcon(e.target.value)}
              placeholder="e.g., ←, →, •"
              className="text-2xl"
            />
            <p className="text-xs text-gray-500 mt-1">
              Use directional arrows or dots (←, →, •)
            </p>
          </div>

          <Button onClick={createType}>Create Type</Button>
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold text-white mb-4">Existing Position Types</h2>
        
        <div className="space-y-3">
          {types.map(type => (
            <div 
              key={type.id}
              className="bg-gray-800 rounded-lg p-4"
            >
              {editingId === type.id ? (
                <div className="space-y-3">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    placeholder="Position name"
                  />
                  <Input
                    value={editIcon}
                    onChange={(e) => setEditIcon(e.target.value)}
                    placeholder="Position icon"
                    className="text-2xl"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={updateType}>Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{type.icon || '📄'}</span>
                    <span className="text-white font-medium">{type.name}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => startEdit(type)}
                    >
                      Edit
                    </Button>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => deleteType(type.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}
          
          {types.length === 0 && (
            <p className="text-gray-500 text-center py-8">No position types yet</p>
          )}
        </div>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mt-8">
        <h2 className="text-xl font-semibold text-white mb-4">Asset Icons (shared pool)</h2>
        <p className="text-gray-400 text-sm mb-4">
          Upload icons to Supabase bucket <code className="font-mono">resume-asset-icons</code> and paste the public/signed URL here. These icons will be selectable for assets in resume entries.
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Icon Name *</label>
            <Input
              value={newIconName}
              onChange={(e) => setNewIconName(e.target.value)}
              placeholder="e.g., PDF, Link, Video"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Icon URL *</label>
            <Input
              value={newIconUrl}
              onChange={(e) => setNewIconUrl(e.target.value)}
              placeholder="https://.../resume-asset-icons/your-icon.png"
            />
          </div>
        </div>
        <Button onClick={createIcon}>Add Icon</Button>
      </div>

      <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 mt-6">
        <h2 className="text-xl font-semibold text-white mb-4">Existing Asset Icons</h2>
        <div className="space-y-3">
          {icons.map(icon => (
            <div key={icon.id} className="bg-gray-800 rounded-lg p-4">
              {editingIconId === icon.id ? (
                <div className="space-y-3">
                  <Input
                    value={editIconName}
                    onChange={(e) => setEditIconName(e.target.value)}
                    placeholder="Icon name"
                  />
                  <Input
                    value={editIconUrl}
                    onChange={(e) => setEditIconUrl(e.target.value)}
                    placeholder="Icon URL"
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={updateIcon}>Save</Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingIconId(null)}>Cancel</Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-white font-medium">{icon.name}</span>
                    <span className="text-gray-400 text-xs break-all">{icon.icon_url}</span>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => startEditIcon(icon)}>Edit</Button>
                    <Button variant="destructive" size="sm" onClick={() => deleteIcon(icon.id)}>Delete</Button>
                  </div>
                </div>
              )}
            </div>
          ))}
          {icons.length === 0 && (
            <p className="text-gray-500 text-center py-8">No asset icons yet</p>
          )}
        </div>
      </div>
    </div>
  )
}

