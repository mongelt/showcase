'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

type ResumeEntry = {
  id: string
  title: string
  subtitle: string | null
  date_start: string | null
  date_end: string | null
}

export default function SeoAdmin() {
  const supabase = createClient()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)

  const [pageTitle, setPageTitle] = useState('')
  const [pageDescription, setPageDescription] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [personDescription, setPersonDescription] = useState('')
  const [sameAs, setSameAs] = useState<string[]>([''])
  const [knowsLanguage, setKnowsLanguage] = useState('')
  const [alumniSelections, setAlumniSelections] = useState<{ id: string; url: string }[]>([])
  const [resumeEntries, setResumeEntries] = useState<ResumeEntry[]>([])

  useEffect(() => {
    loadSettings()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  async function loadSettings() {
    setLoading(true)
    try {
      const [{ data, error }, { data: entries }] = await Promise.all([
        supabase.from('seo_settings').select('*').eq('id', 1).single(),
        supabase
          .from('resume_entries')
          .select('id, title, subtitle, date_start, date_end')
          .order('date_start', { ascending: false }),
      ])

      if (error) {
        alert('Error loading SEO settings: ' + error.message)
        return
      }

      setResumeEntries(entries ?? [])

      if (data) {
        setPageTitle(data.page_title ?? '')
        setPageDescription(data.page_description ?? '')
        setImageUrl(data.image_url ?? '')
        setPersonDescription(data.person_description ?? '')
        setSameAs(Array.isArray(data.same_as) && data.same_as.length > 0 ? data.same_as : [''])
        setKnowsLanguage(
          Array.isArray(data.knows_language) && data.knows_language.length > 0
            ? data.knows_language.join(', ')
            : 'English, Russian'
        )
        setAlumniSelections(
          Array.isArray(data.alumni_of)
            ? (data.alumni_of as Array<{ id?: string; url?: string }>)
                .filter(r => r.id)
                .map(r => ({ id: r.id!, url: r.url ?? '' }))
            : []
        )
      }
    } catch {
      alert('Error loading SEO settings')
    } finally {
      setLoading(false)
    }
  }

  async function handleImageUpload(file: File) {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      )
      const data = await response.json()
      if (!data.secure_url) throw new Error(data?.error?.message || 'Upload failed')
      setImageUrl(data.secure_url)
    } catch {
      alert('Image upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const filteredSameAs = sameAs.filter(u => u.trim() !== '')
      const parsedLanguages = knowsLanguage
        .split(',')
        .map(l => l.trim())
        .filter(Boolean)

      const { error } = await supabase.from('seo_settings').upsert({
        id: 1,
        page_title: pageTitle || null,
        page_description: pageDescription || null,
        image_url: imageUrl || null,
        person_description: personDescription || null,
        same_as: filteredSameAs,
        knows_language: parsedLanguages,
        alumni_of: alumniSelections.map(s => ({
          id: s.id,
          ...(s.url.trim() ? { url: s.url.trim() } : {}),
        })),
        updated_at: new Date().toISOString(),
      })

      if (error) {
        alert('Error saving: ' + error.message)
        return
      }
      alert('SEO settings saved!')
    } catch {
      alert('Error saving SEO settings')
    } finally {
      setSaving(false)
    }
  }

  const addSameAs = () => setSameAs(prev => [...prev, ''])
  const removeSameAs = (i: number) => setSameAs(prev => prev.filter((_, idx) => idx !== i))
  const updateSameAs = (i: number, val: string) =>
    setSameAs(prev => prev.map((v, idx) => (idx === i ? val : v)))

  const toggleAlumniEntry = (id: string) =>
    setAlumniSelections(prev =>
      prev.some(s => s.id === id)
        ? prev.filter(s => s.id !== id)
        : [...prev, { id, url: '' }]
    )

  const updateAlumniUrl = (id: string, url: string) =>
    setAlumniSelections(prev =>
      prev.map(s => (s.id === id ? { ...s, url } : s))
    )

  if (loading) return <div className="text-white">Loading...</div>

  return (
    <div>
      <h1 className="text-3xl font-bold text-white mb-8">SEO Settings</h1>
      <form onSubmit={handleSave} className="space-y-6">

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-6">
          <h2 className="text-xl font-semibold text-white">Page Metadata</h2>
          <p className="text-sm text-gray-400">Populates the page title, meta description, and Open Graph / Twitter Card tags.</p>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Page Title</label>
            <Input
              value={pageTitle}
              onChange={e => setPageTitle(e.target.value)}
              placeholder="e.g., Andrey Beregovskiy — Content Strategist"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Page Description</label>
            <textarea
              value={pageDescription}
              onChange={e => setPageDescription(e.target.value)}
              placeholder="Brief description shown in search results and link previews"
              rows={3}
              className="w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Profile Image</label>
            <p className="text-xs text-gray-500 mb-3">Used as og:image for link previews and in Person schema. Recommended: square or 1200×630px.</p>
            {imageUrl && (
              <div className="mb-3 space-y-2">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={imageUrl} alt="Profile" className="w-32 h-32 object-cover rounded-md border border-gray-700" />
                <Input
                  value={imageUrl}
                  onChange={e => setImageUrl(e.target.value)}
                  placeholder="Cloudinary URL"
                  className="text-xs"
                />
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              onChange={e => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
              disabled={uploading}
              className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 disabled:opacity-50"
            />
            {uploading && <p className="text-sm text-blue-400 mt-2">Uploading...</p>}
          </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-6">
          <h2 className="text-xl font-semibold text-white">Schema Markup</h2>
          <p className="text-sm text-gray-400">Populates the Person and ProfilePage JSON-LD schema injected in every page, which helps search engines and AI systems understand who you are.</p>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Person Description</label>
            <p className="text-xs text-gray-500 mb-2">A concise bio written for search engines — separate from your on-page bio.</p>
            <textarea
              value={personDescription}
              onChange={e => setPersonDescription(e.target.value)}
              placeholder="e.g., Content strategist and writer with 10+ years of experience in B2B marketing..."
              rows={4}
              className="w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Profile URLs (sameAs)</label>
            <p className="text-xs text-gray-500 mb-3">Links to your profiles elsewhere — LinkedIn, GitHub, company pages, etc.</p>
            <div className="space-y-2">
              {sameAs.map((url, i) => (
                <div key={i} className="flex gap-2">
                  <Input
                    type="url"
                    value={url}
                    onChange={e => updateSameAs(i, e.target.value)}
                    placeholder="https://linkedin.com/in/yourprofile"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => removeSameAs(i)}
                    disabled={sameAs.length === 1}
                    className="shrink-0"
                  >
                    Remove
                  </Button>
                </div>
              ))}
            </div>
            <Button type="button" variant="outline" onClick={addSameAs} className="mt-2">
              + Add URL
            </Button>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Languages</label>
            <p className="text-xs text-gray-500 mb-2">Comma-separated. Populates knowsLanguage in Person schema.</p>
            <Input
              value={knowsLanguage}
              onChange={e => setKnowsLanguage(e.target.value)}
              placeholder="English, Russian"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Education (alumniOf)</label>
            <p className="text-xs text-gray-500 mb-3">
              Select which resume entries are education. These populate the alumniOf field in the Person schema.
              The entry title is used as the institution name, subtitle as the degree/program.
            </p>
            {resumeEntries.length === 0 ? (
              <p className="text-sm text-gray-500">No resume entries found.</p>
            ) : (
              <div className="space-y-2">
                {resumeEntries.map(entry => {
                  const startYear = entry.date_start ? new Date(entry.date_start).getFullYear() : ''
                  const endYear = entry.date_end ? new Date(entry.date_end).getFullYear() : 'Present'
                  const dateRange = startYear ? `${startYear}–${endYear}` : ''
                  const selection = alumniSelections.find(s => s.id === entry.id)
                  const checked = !!selection
                  return (
                    <div key={entry.id} className="rounded-md border border-gray-700 overflow-hidden">
                      <label className="flex items-start gap-3 px-4 py-3 cursor-pointer hover:border-gray-500 transition-colors">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleAlumniEntry(entry.id)}
                          className="mt-0.5 rounded border-gray-600"
                        />
                        <span className="text-sm text-gray-200">
                          {entry.title}
                          {entry.subtitle && (
                            <span className="text-gray-400"> · {entry.subtitle}</span>
                          )}
                          {dateRange && (
                            <span className="text-gray-500 ml-2 text-xs">{dateRange}</span>
                          )}
                        </span>
                      </label>
                      {checked && (
                        <div className="px-4 pb-3 border-t border-gray-700 pt-3">
                          <label className="block text-xs font-medium text-gray-400 mb-1">
                            Institution URL (optional)
                          </label>
                          <Input
                            type="url"
                            value={selection!.url}
                            onChange={e => updateAlumniUrl(entry.id, e.target.value)}
                            placeholder="https://www.jhu.edu"
                          />
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="submit" disabled={saving || uploading}>
            {saving ? 'Saving...' : 'Save SEO Settings'}
          </Button>
          <Button type="button" variant="outline" onClick={loadSettings} disabled={saving}>
            Reset Changes
          </Button>
        </div>
      </form>
    </div>
  )
}
