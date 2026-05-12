'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import Link from 'next/link'

type Content = {
  id: string
  type: string
  title: string
  created_at: string
  content_collections?: { collection_id: string, collections: { name: string }[] }[]
}

export default function ContentManagement() {
  const [content, setContent] = useState<Content[]>([])
  const [loading, setLoading] = useState(true)
  const [isDropdownModalOpen, setIsDropdownModalOpen] = useState(false)
  const [dropdownInputText, setDropdownInputText] = useState('')
  const [dropdownSubmitting, setDropdownSubmitting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    loadContent()
  }, [])

  async function loadContent() {
    try {
      const { data, error } = await supabase
        .from('content')
        .select(`
          id,
          type,
          title,
          created_at,
          content_collections(
            collection_id,
            collections!inner(name)
          )
        `)
        .order('created_at', { ascending: false })
      
      if (error) throw error
      setContent(data || [])
    } catch (error) {
      console.error('Error loading content:', error)
    } finally {
      setLoading(false)
    }
  }

  async function deleteContent(id: string) {
    if (!confirm('Are you sure you want to delete this content?')) return
    
    try {
      // Check if content is used in resume entries
      const { data: resumeAssets, error: checkError } = await supabase
        .from('resume_assets')
        .select('id')
        .eq('content_id', id)
        .eq('asset_type', 'content')
        .limit(1)
      
      if (checkError) {
        alert('Error checking content usage: ' + checkError.message)
        return
      }
      
      if (resumeAssets && resumeAssets.length > 0) {
        alert("Content item can't be deleted because it is used in a resume entry")
        return
      }
      
      const { error } = await supabase
        .from('content')
        .delete()
        .eq('id', id)
      
      if (error) throw error
      
      loadContent()
    } catch (error) {
      console.error('Error deleting content:', error)
      alert('Failed to delete content')
    }
  }

  if (loading) {
    return <div className="text-white">Loading...</div>
  }

  function closeModal() {
    setIsDropdownModalOpen(false)
    setDropdownInputText('')
  }

  async function createBylineOption() {
    const trimmedText = dropdownInputText.trim()
    
    if (!trimmedText) {
      alert('Please enter option text')
      return
    }

    setDropdownSubmitting(true)

    try {
      const { error } = await supabase
        .from('byline_options')
        .insert({ option_text: trimmedText })

      if (error) {
        alert('Error creating byline option: ' + error.message)
      } else {
        alert('Byline option created successfully')
        setDropdownInputText('')
      }
    } catch (error) {
      alert('Error creating byline option: ' + (error as Error).message)
    } finally {
      setDropdownSubmitting(false)
    }
  }

  async function createLinkOption() {
    const trimmedText = dropdownInputText.trim()
    
    if (!trimmedText) {
      alert('Please enter option text')
      return
    }

    setDropdownSubmitting(true)

    try {
      const { error } = await supabase
        .from('link_options')
        .insert({ option_text: trimmedText })

      if (error) {
        alert('Error creating link option: ' + error.message)
      } else {
        alert('Link option created successfully')
        setDropdownInputText('')
      }
    } catch (error) {
      alert('Error creating link option: ' + (error as Error).message)
    } finally {
      setDropdownSubmitting(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Content Management</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setIsDropdownModalOpen(true)}>
            Manage Dropdown Options
          </Button>
          <Link href="/admin/content/new">
            <Button>+ Create New Content</Button>
          </Link>
        </div>
      </div>

      {content.length === 0 ? (
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-12 text-center">
          <p className="text-gray-400 mb-4">No content yet. Create your first piece!</p>
          <Link href="/admin/content/new">
            <Button>+ Create Content</Button>
          </Link>
        </div>
      ) : (
        <div className="bg-gray-900 border border-gray-800 rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-800">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Title</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Type</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Collections</th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-gray-300">Created</th>
                <th className="text-right px-6 py-3 text-sm font-semibold text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {content.map((item) => (
                <tr key={item.id} className="hover:bg-gray-800/50">
                  <td className="px-6 py-4 text-white">{item.title}</td>
                  <td className="px-6 py-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-900/50 text-blue-300 capitalize">
                      {item.type}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    {item.content_collections && item.content_collections.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {item.content_collections.map((cc: any) => (
                          <span 
                            key={cc.collection_id}
                            className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-purple-900/50 text-purple-300"
                          >
                            {cc.collections.name}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-gray-600 text-xs">None</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-gray-400 text-sm">
                    {new Date(item.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right space-x-2">
                    <Link href={`/admin/content/edit/${item.id}`}>
                      <Button variant="outline" size="sm">Edit</Button>
                    </Link>
                    <Button 
                      variant="destructive" 
                      size="sm"
                      onClick={() => deleteContent(item.id)}
                    >
                      Delete
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {isDropdownModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={closeModal}>
          <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-white">Manage Dropdown Options</h2>
              <button
                onClick={closeModal}
                className="text-gray-400 hover:text-white transition-colors"
                aria-label="Close modal"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <input
                  type="text"
                  value={dropdownInputText}
                  onChange={(e) => setDropdownInputText(e.target.value)}
                  placeholder="Enter option text (e.g., Written by, Read original)"
                  className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <Button
                onClick={createBylineOption}
                disabled={dropdownSubmitting || !dropdownInputText.trim()}
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                {dropdownSubmitting ? 'Creating...' : 'Create as Byline'}
              </Button>

              <Button
                onClick={createLinkOption}
                disabled={dropdownSubmitting || !dropdownInputText.trim()}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {dropdownSubmitting ? 'Creating...' : 'Create as Link'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

