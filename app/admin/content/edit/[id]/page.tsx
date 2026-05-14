'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import dynamic from 'next/dynamic'
import type { PartialBlock } from '@blocknote/core'
import AudioEditor from '@/components/AudioEditor'
import VideoEditor from '@/components/VideoEditor'

const BlockNoteEditor = dynamic(() => import('@/components/editor/BlockNoteEditorDynamic'), {
  ssr: false,
})

type Category = {
  id: string
  name: string
}

type Subcategory = {
  id: string
  name: string
  category_id: string
}

type Collection = {
  id: string
  name: string
}

type BylineOption = {
  id: string
  option_text: string
}

type LinkOption = {
  id: string
  option_text: string
}

type CustomPDFOption = {
  id: string
  title: string
  file_name: string
}

export default function EditContent() {
  const router = useRouter()
  const params = useParams()
  const contentId = params.id as string
  const supabase = createClient()
  
  const [loading, setLoading] = useState(true)
  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [filteredSubcategories, setFilteredSubcategories] = useState<Subcategory[]>([])
  const [collections, setCollections] = useState<Collection[]>([])
  const [bylineOptions, setBylineOptions] = useState<BylineOption[]>([])
  const [selectedBylineStyle, setSelectedBylineStyle] = useState('')
  const [linkOptions, setLinkOptions] = useState<LinkOption[]>([])
  const [selectedLinkStyle, setSelectedLinkStyle] = useState('')
  
  const [contentType, setContentType] = useState('article')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedSubcategory, setSelectedSubcategory] = useState('')
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [sidebarTitle, setSidebarTitle] = useState('')
  const [sidebarSubtitle, setSidebarSubtitle] = useState('')
  const [authorName, setAuthorName] = useState('')
  const [publicationName, setPublicationName] = useState('')
  const [publicationDate, setPublicationDate] = useState('')
  const [sourceLink, setSourceLink] = useState('')
  const [copyrightNotice, setCopyrightNotice] = useState('')
  const [imageUrl, setImageUrl] = useState('')
  const [videoUrl, setVideoUrl] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [editorData, setEditorData] = useState<PartialBlock[] | undefined>()
  const [selectedCollections, setSelectedCollections] = useState<string[]>([])
  const [downloadEnabled, setDownloadEnabled] = useState(false)
  const [downloadSource, setDownloadSource] = useState<'generated' | 'external' | 'custom'>('generated')
  const [externalDownloadUrl, setExternalDownloadUrl] = useState('')
  const [customPdfId, setCustomPdfId] = useState('')
  const [customPdfs, setCustomPdfs] = useState<CustomPDFOption[]>([])
  const [orderIndex, setOrderIndex] = useState(0)
  const [uploading, setUploading] = useState(false)
  const [featured, setFeatured] = useState(false)
  const [menuShortTitle, setMenuShortTitle] = useState('')
  const [menuShortDesc, setMenuShortDesc] = useState('')
  const [menuPeriDesc, setMenuPeriDesc] = useState('')
  const [menuDesc, setMenuDesc] = useState('')

  useEffect(() => {
    loadCategories()
    loadSubcategories()
    loadCollections()
    loadBylineOptions()
    loadLinkOptions()
    loadCustomPDFs()
    loadContent()
  }, [])

  useEffect(() => {
    if (selectedCategory) {
      const filtered = subcategories.filter(sub => sub.category_id === selectedCategory)
      setFilteredSubcategories(filtered)
    } else {
      setFilteredSubcategories([])
    }
  }, [selectedCategory, subcategories])

  async function loadContent() {
    const { data, error } = await supabase
      .from('content')
      .select('*')
      .eq('id', contentId)
      .single()
    
    if (error || !data) {
      alert('Content not found')
      router.push('/admin/content')
      return
    }

    setContentType(data.type)
    setSelectedCategory(data.category_id || '')
    setSelectedSubcategory(data.subcategory_id || '')
    setTitle(data.title)
    setSubtitle(data.subtitle || '')
    setSidebarTitle(data.sidebar_title || '')
    setSidebarSubtitle(data.sidebar_subtitle || '')
    setAuthorName(data.author_name || '')
    setPublicationName(data.publication_name || '')
    setPublicationDate(data.publication_date || '')
    setSourceLink(data.source_link || '')
    setCopyrightNotice(data.copyright_notice || '')
    setImageUrl(data.image_url || '')
    setVideoUrl(data.video_url || '')
    setAudioUrl(data.audio_url || '')
    setEditorData(data.content_body)
    setDownloadEnabled(data.download_enabled || false)
    setExternalDownloadUrl(data.external_download_url || '')
    const resolvedSource =
      data.download_source ||
      (data.custom_pdf_id ? 'custom' : data.external_download_url ? 'external' : 'generated')
    setDownloadSource(resolvedSource)
    setCustomPdfId(data.custom_pdf_id || '')
    setOrderIndex(data.order_index || 0)
    setFeatured(data.featured || false)
    setSelectedBylineStyle(data.byline_style || '')
    setSelectedLinkStyle(data.link_style || '')
    setMenuShortTitle(data.short_title || '')
    setMenuShortDesc(data.short_desc || '')
    setMenuPeriDesc(data.peri_desc || '')
    setMenuDesc(data.desc || '')

    const { data: collectionData } = await supabase
      .from('content_collections')
      .select('collection_id')
      .eq('content_id', contentId)
    
    setSelectedCollections(collectionData?.map(c => c.collection_id) || [])
    setLoading(false)
  }

  async function loadCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('order_index')
    setCategories(data || [])
  }

  async function loadSubcategories() {
    const { data } = await supabase
      .from('subcategories')
      .select('*')
      .order('order_index')
    setSubcategories(data || [])
  }

  async function loadCollections() {
    const { data } = await supabase
      .from('collections')
      .select('*')
      .order('order_index')
    setCollections(data || [])
  }

  async function loadBylineOptions() {
    const { data } = await supabase
      .from('byline_options')
      .select('id, option_text')
      .order('created_at')
    setBylineOptions(data || [])
  }

  async function loadLinkOptions() {
    const { data } = await supabase
      .from('link_options')
      .select('id, option_text')
      .order('created_at')
    setLinkOptions(data || [])
  }

  async function loadCustomPDFs() {
    const { data, error } = await supabase
      .from('custom_pdfs')
      .select('id, title, file_name')
      .order('order_index', { ascending: true })
    if (error) {
      console.error('Failed to load custom PDFs', error)
      setCustomPdfs([])
      return
    }
    setCustomPdfs(data || [])
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
      setImageUrl(data.secure_url)
    } catch (error) {
      alert('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleVideoUpload(file: File) {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)
      
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload`,
        { method: 'POST', body: formData }
      )
      
      const data = await response.json()
      setVideoUrl(data.secure_url)
    } catch (error) {
      alert('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleAudioUpload(file: File) {
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)
      
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/video/upload`,
        { method: 'POST', body: formData }
      )
      
      const data = await response.json()
      setAudioUrl(data.secure_url)
    } catch (error) {
      alert('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function reuploadExternalImages(blocks: PartialBlock[]): Promise<PartialBlock[]> {
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
    const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET

    async function processBlock(block: PartialBlock): Promise<PartialBlock> {
      let processedChildren = block.children
      if (Array.isArray(block.children) && block.children.length > 0)
        processedChildren = await Promise.all(block.children.map(processBlock))

      if (
        block.type === 'image' &&
        typeof block.props?.url === 'string' &&
        block.props.url.trim() !== '' &&
        !block.props.url.includes('res.cloudinary.com')
      ) {
        try {
          const proxyRes = await fetch(`/api/proxy-image?url=${encodeURIComponent(block.props.url)}`)
          if (!proxyRes.ok) throw new Error(`Proxy ${proxyRes.status}`)
          const blob = await proxyRes.blob()
          const ext = blob.type.split('/')[1] || 'jpg'
          const formData = new FormData()
          formData.append('file', new File([blob], `image.${ext}`, { type: blob.type }))
          formData.append('upload_preset', uploadPreset!)
          const upRes = await fetch(
            `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
            { method: 'POST', body: formData }
          )
          const upData = await upRes.json()
          if (upData.secure_url)
            return { ...block, props: { ...block.props, url: upData.secure_url }, children: processedChildren }
        } catch (err) {
          console.warn('Failed to re-upload image:', err)
        }
      }
      return { ...block, children: processedChildren }
    }

    return Promise.all(blocks.map(processBlock))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!title || !selectedCategory || !selectedSubcategory) {
      alert('Please fill in all required fields')
      return
    }

    if (downloadEnabled && downloadSource === 'external' && !externalDownloadUrl) {
      alert('Please provide an external download link or change the download source.')
      return
    }

    if (downloadEnabled && downloadSource === 'custom' && !customPdfId) {
      alert('Please select a custom PDF or change the download source.')
      return
    }

    try {
      // BlockNote: data is already in editorData from onChange callback
      const latestEditorData = editorData

      // Re-upload any external images to Cloudinary before saving
      let processedEditorData = latestEditorData
      if (contentType === 'article' && latestEditorData?.length) {
        try {
          processedEditorData = await reuploadExternalImages(latestEditorData)
        } catch (err) {
          console.warn('Image re-upload failed, saving original data:', err)
        }
      }

      // Extract image sizes from BlockNote image blocks (use processedEditorData so URLs match Cloudinary keys)
      let imageSizeMap: Record<string, { width?: number; height?: number }> | null = null
      if (contentType === 'article' && processedEditorData) {
        imageSizeMap = {}
        processedEditorData.forEach((block) => {
          if (block.type === 'image' && block.props?.url) {
            const url = block.props.url as string
            const width = block.props.previewWidth as number | undefined
            if (width) {
              imageSizeMap![url] = { width }
            }
          }
        })
        if (imageSizeMap && Object.keys(imageSizeMap).length === 0) {
          imageSizeMap = null
        }
      }

      const { error: contentError } = await supabase
        .from('content')
        .update({
          type: contentType,
          category_id: selectedCategory,
          subcategory_id: selectedSubcategory,
          title,
          subtitle: subtitle || null,
          sidebar_title: sidebarTitle || null,
          sidebar_subtitle: sidebarSubtitle || null,
          image_sizes: contentType === 'article' ? imageSizeMap : null,
          content_body: contentType === 'article' ? (processedEditorData || editorData) : null,
          image_url: contentType === 'image' ? imageUrl : null,
          video_url: contentType === 'video' ? videoUrl : null,
          audio_url: contentType === 'audio' ? audioUrl : null,
          author_name: authorName || null,
          publication_name: publicationName || null,
          publication_date: publicationDate || null,
          source_link: sourceLink || null,
          copyright_notice: copyrightNotice || null,
          download_enabled: downloadEnabled,
          download_source: downloadEnabled ? downloadSource : 'generated',
          external_download_url: downloadEnabled && downloadSource === 'external' ? externalDownloadUrl : null,
          custom_pdf_id: downloadEnabled && downloadSource === 'custom' ? customPdfId : null,
          order_index: orderIndex,
          featured: featured,
          byline_style: selectedBylineStyle || null,
          link_style: selectedLinkStyle || null,
          short_title: menuShortTitle || null,
          short_desc: menuShortDesc || null,
          peri_desc: menuPeriDesc || null,
          desc: menuDesc || null,
        })
        .eq('id', contentId)
      
      if (contentError) {
        console.error('Error updating content:', contentError)
        if (contentError.code === '42703') {
          alert('Database is missing new download columns. Please run the SQL migration for download_source and custom_pdf_id, then retry.')
          return
        }
        alert(`Failed to update content: ${contentError.message}`)
        return
      }

      await supabase
        .from('content_collections')
        .delete()
        .eq('content_id', contentId)

      if (selectedCollections.length > 0) {
        const collectionInserts = selectedCollections.map((collectionId, index) => ({
          content_id: contentId,
          collection_id: collectionId,
          order_index: index,
        }))

        const { error: collectionError } = await supabase
          .from('content_collections')
          .insert(collectionInserts)
        
        if (collectionError) console.error('Error updating collections:', collectionError)
      }

      alert('Content updated successfully!')
      router.push('/admin/content')
    } catch (error) {
      console.error('Error updating content:', error)
      alert('Failed to update content')
    }
  }

  if (loading) return <div className="text-white">Loading...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-white">Edit Content</h1>
        <Link href="/admin/content">
          <Button variant="outline">← Back to List</Button>
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Content Type *
            </label>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value)}
              className="w-full h-10 rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-white"
              required
            >
              <option value="article">Article</option>
              <option value="image">Image</option>
              <option value="video">Video</option>
              <option value="audio">Audio</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Category *
            </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full h-10 rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-white"
              required
            >
              <option value="">Select category...</option>
              {categories.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Subcategory *
            </label>
            <select
              value={selectedSubcategory}
              onChange={(e) => setSelectedSubcategory(e.target.value)}
              className="w-full h-10 rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-white"
              required
              disabled={!selectedCategory}
            >
              <option value="">
                {selectedCategory ? 'Select subcategory...' : 'Select category first...'}
              </option>
              {filteredSubcategories.map(sub => (
                <option key={sub.id} value={sub.id}>{sub.name}</option>
              ))}
            </select>
          </div>

          <div className="border-t border-gray-800 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Main Content Information</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Content Title *
            </label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Main title for the content page"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Content Subtitle
            </label>
            <Input
              value={subtitle}
              onChange={(e) => setSubtitle(e.target.value)}
              placeholder="Subtitle for the content page (optional)"
            />
          </div>

          <div className="border-t border-gray-800 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Sidebar Display (Optional)</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sidebar Title
            </label>
            <Input
              value={sidebarTitle}
              onChange={(e) => setSidebarTitle(e.target.value)}
              placeholder="Different title for sidebar (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Sidebar Subtitle
            </label>
            <Input
              value={sidebarSubtitle}
              onChange={(e) => setSidebarSubtitle(e.target.value)}
              placeholder="Different subtitle for sidebar (optional)"
            />
          </div>

          <div className="border-t border-gray-800 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Publication Metadata (Optional)</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Byline Style (Optional)
            </label>
            <select
              value={selectedBylineStyle}
              onChange={(e) => setSelectedBylineStyle(e.target.value)}
              className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select byline style...</option>
              {bylineOptions.map(option => (
                <option key={option.id} value={option.id}>
                  {option.option_text}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Byline text style for author attribution
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Author Name
            </label>
            <Input
              value={authorName}
              onChange={(e) => setAuthorName(e.target.value)}
              placeholder="Author name (for attribution)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Publication Name <span className="text-gray-500 text-xs">{publicationName.length}/20</span>
            </label>
            <Input
              value={publicationName}
              onChange={(e) => setPublicationName(e.target.value)}
              placeholder="Where this was published"
              maxLength={20}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Publication Date
            </label>
            <Input
              value={publicationDate}
              onChange={(e) => setPublicationDate(e.target.value)}
              placeholder="e.g., January 2024"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Link Style (Optional)
            </label>
            <select
              value={selectedLinkStyle}
              onChange={(e) => setSelectedLinkStyle(e.target.value)}
              className="w-full px-3 py-2 bg-gray-950 border border-gray-700 rounded text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="">Select link style...</option>
              {linkOptions.map(option => (
                <option key={option.id} value={option.id}>
                  {option.option_text}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 mt-1">
              Link text style for source attribution
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Link to Original Source
            </label>
            <Input
              type="url"
              value={sourceLink}
              onChange={(e) => setSourceLink(e.target.value)}
              placeholder="https://example.com/article"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Copyright Notice
            </label>
            <Input
              value={copyrightNotice}
              onChange={(e) => setCopyrightNotice(e.target.value)}
              placeholder="© 2024 Publication Name. All rights reserved."
            />
          </div>

          <div className="border-t border-gray-800 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Content Body</h3>
          </div>

          {contentType === 'article' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Article Content
              </label>
              <div className="rounded-lg border border-gray-700 min-h-[500px] p-6" style={{ backgroundColor: '#1f1f1f', colorScheme: 'light' }}>
                <BlockNoteEditor
                  data={editorData}
                  onChange={(data) => setEditorData(data as any)}
                />
              </div>
            </div>
          )}

          {contentType === 'image' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Image Upload *
              </label>
              <Input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="Image URL"
                className="mb-2"
              />
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0])}
                className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                disabled={uploading}
              />
              {uploading && <p className="text-sm text-blue-400 mt-2">Uploading...</p>}
              {imageUrl && (
                <img src={imageUrl} alt="Preview" className="mt-4 max-w-md rounded-lg" />
              )}
            </div>
          )}

          {contentType === 'video' && (
            <VideoEditor
              videoUrl={videoUrl}
              onVideoUrlChange={setVideoUrl}
              uploading={uploading}
              onUploadingChange={setUploading}
            />
          )}

          {contentType === 'audio' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Audio Upload *
              </label>
              <AudioEditor
                audioUrl={audioUrl}
                onAudioUrlChange={setAudioUrl}
                uploading={uploading}
                onUploadingChange={setUploading}
              />
            </div>
          )}

          <div className="border-t border-gray-800 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Collections (Optional)</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Assign to Collections
            </label>
            <div className="space-y-2">
              {collections.map(collection => (
                <label key={collection.id} className="flex items-center gap-2 text-gray-300">
                  <input
                    type="checkbox"
                    checked={selectedCollections.includes(collection.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedCollections([...selectedCollections, collection.id])
                      } else {
                        setSelectedCollections(selectedCollections.filter(id => id !== collection.id))
                      }
                    }}
                    className="rounded border-gray-700 bg-gray-950"
                  />
                  {collection.name}
                </label>
              ))}
              {collections.length === 0 && (
                <p className="text-sm text-gray-500">No collections yet. Create one first!</p>
              )}
            </div>
          </div>

          <div className="border-t border-gray-800 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Display Settings</h3>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Display Order
            </label>
            <div className="flex items-center gap-2">
              <Input
                type="number"
                value={orderIndex}
                onChange={(e) => setOrderIndex(parseInt(e.target.value) || 0)}
                min="0"
                step="10"
                className="w-32"
              />
              <button
                type="button"
                onClick={() => setOrderIndex(Math.max(0, orderIndex - 10))}
                className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded"
              >
                ↑
              </button>
              <button
                type="button"
                onClick={() => setOrderIndex(orderIndex + 10)}
                className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded"
              >
                ↓
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Lower numbers appear first in the sidebar. Use increments of 10 for easier reordering.
            </p>
          </div>

          <div className="border-t border-gray-800 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Download Settings (Optional)</h3>
          </div>

          <div>
            <label className="flex items-center gap-2 text-gray-300">
              <input
                type="checkbox"
                checked={downloadEnabled}
                onChange={(e) => setDownloadEnabled(e.target.checked)}
                className="rounded border-gray-700 bg-gray-950"
              />
              Enable Download Button
            </label>
          </div>

          {downloadEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Download Source
              </label>
              <div className="space-y-2">
                <label className="flex items-center gap-2 text-gray-300">
                  <input
                    type="radio"
                    name="downloadSource"
                    value="generated"
                    checked={downloadSource === 'generated'}
                    onChange={(e) => setDownloadSource(e.target.value as 'generated' | 'external' | 'custom')}
                    className="border-gray-700 bg-gray-950"
                  />
                  Generate PDF (Articles only)
                </label>
                <label className="flex items-center gap-2 text-gray-300">
                  <input
                    type="radio"
                    name="downloadSource"
                    value="external"
                    checked={downloadSource === 'external'}
                    onChange={(e) => setDownloadSource(e.target.value as 'generated' | 'external' | 'custom')}
                    className="border-gray-700 bg-gray-950"
                  />
                  External Link
                </label>
                <label className="flex items-center gap-2 text-gray-300">
                  <input
                    type="radio"
                    name="downloadSource"
                    value="custom"
                    checked={downloadSource === 'custom'}
                    onChange={(e) => setDownloadSource(e.target.value as 'generated' | 'external' | 'custom')}
                    className="border-gray-700 bg-gray-950"
                  />
                  Custom PDF
                </label>
              </div>
            </div>
          )}

          {downloadEnabled && downloadSource === 'external' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                External Download Link
              </label>
              <Input
                type="url"
                value={externalDownloadUrl}
                onChange={(e) => setExternalDownloadUrl(e.target.value)}
                placeholder="https://example.com/download.pdf"
                required={downloadEnabled && downloadSource === 'external'}
              />
              <p className="text-xs text-gray-500 mt-1">
                URL where users will be redirected when they click the download button
              </p>
            </div>
          )}

          {downloadEnabled && downloadSource === 'custom' && (
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Select Custom PDF
              </label>
              <select
                value={customPdfId}
                onChange={(e) => setCustomPdfId(e.target.value)}
                className="w-full bg-gray-950 border border-gray-700 text-gray-200 rounded px-3 py-2"
              >
                <option value="">Select a custom PDF</option>
                {customPdfs.map((pdf) => (
                  <option key={pdf.id} value={pdf.id}>
                    {pdf.title} ({pdf.file_name})
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Choose which custom PDF should download for this content item
              </p>
            </div>
          )}

          {downloadEnabled && downloadSource === 'generated' && (
            <div className="bg-blue-900/20 border border-blue-800 rounded-lg p-4">
              <h4 className="text-blue-300 font-medium mb-2">📄 PDF Generation</h4>
              <p className="text-blue-200 text-sm">
                A PDF will be automatically generated from the article content when users click the download button. 
                The PDF will include the title, content, and publication information.
              </p>
              {contentType !== 'article' && (
                <p className="text-yellow-300 text-sm mt-2">
                  ⚠️ Note: PDF generation is only available for articles. For other content types, consider using an external link.
                </p>
              )}
            </div>
          )}

          <div>
            <label className="flex items-center gap-2 text-gray-300">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 rounded border-gray-700 bg-gray-950 text-emerald-500 focus:ring-emerald-500"
              />
              <span className="text-sm">Featured Content</span>
            </label>
            <p className="text-xs text-gray-500 mt-1 ml-6">
              Featured content appears in Main Menu on Portfolio tab
            </p>
          </div>

          <div className="border-t border-gray-800 pt-6">
            <h3 className="text-lg font-semibold text-white mb-4">Menu Display</h3>
            <p className="text-xs text-gray-500 -mt-2 mb-4">Fields used by the dynamic menu cards</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Short Title <span className="text-gray-500 text-xs">{menuShortTitle.length}/15</span>
            </label>
            <Input
              value={menuShortTitle}
              onChange={(e) => setMenuShortTitle(e.target.value)}
              placeholder="Short title for menu card"
              maxLength={15}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Short Description <span className="text-gray-500 text-xs">{menuShortDesc.length}/30</span>
            </label>
            <Input
              value={menuShortDesc}
              onChange={(e) => setMenuShortDesc(e.target.value)}
              placeholder="Short description for menu card"
              maxLength={30}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Peri Description <span className="text-gray-500 text-xs">{menuPeriDesc.length}/22</span>
            </label>
            <Input
              value={menuPeriDesc}
              onChange={(e) => setMenuPeriDesc(e.target.value)}
              placeholder="Description shown on peri cards at rest"
              maxLength={22}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">
              Description
            </label>
            <textarea
              value={menuDesc}
              onChange={(e) => setMenuDesc(e.target.value)}
              placeholder="Full description for menu card"
              rows={3}
              className="w-full rounded-md border border-gray-700 bg-gray-950 px-3 py-2 text-white text-sm resize-y"
            />
          </div>
        </div>

        <div className="flex gap-4">
          <Button type="submit">Update Content</Button>
          <Link href="/admin/content">
            <Button type="button" variant="outline">Cancel</Button>
          </Link>
        </div>
      </form>
    </div>
  )
}

