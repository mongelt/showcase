'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import dynamic from 'next/dynamic'

const BlockNoteEditor = dynamic(() => import('@/components/editor/BlockNoteEditorDynamic'), {
  ssr: false,
})

export default function AboutManagement() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profileId, setProfileId] = useState('')
  const [aboutContent, setAboutContent] = useState<any>(undefined)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setLoading(true)
    const { data, error } = await supabase
      .from('profile')
      .select('id, about_content')
      .limit(1)
      .single()

    if (error || !data) {
      alert('Error loading profile')
      setLoading(false)
      return
    }

    setProfileId(data.id)
    setAboutContent(data.about_content ?? undefined)
    setLoading(false)
  }

  async function save() {
    if (!profileId) return
    setSaving(true)
    const { error } = await supabase
      .from('profile')
      .update({ about_content: aboutContent ?? null })
      .eq('id', profileId)

    if (error) alert('Error saving: ' + error.message)
    setSaving(false)
  }

  if (loading) return <div className="text-white">Loading...</div>

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-white">About Page</h2>
        <Button onClick={save} disabled={saving}>
          {saving ? 'Saving...' : 'Save'}
        </Button>
      </div>

      <div className="bg-gray-900 rounded-lg p-6">
        <label className="block text-sm font-medium text-gray-300 mb-3">About Content</label>
        <div className="bg-white rounded">
          <BlockNoteEditor
            data={aboutContent}
            onChange={(data) => setAboutContent(data as any)}
          />
        </div>
      </div>
    </div>
  )
}
