'use client'

/**
 * Stage 15 — Thumbnail Capture Page
 * /admin/menu/thumbnails
 *
 * List view: table of all content items with thumbnail status.
 *
 * Capture flows by content type:
 *   article — render content_body in read-only BlockNote, crop + capture
 *             via html2canvas, upload to Cloudinary, save URL to Supabase.
 *   image   — item has a single image_url; save it directly as menu_thumbnail_url
 *             (already on Cloudinary — no re-upload needed).
 *   audio   — generate a static waveform SVG canvas, upload to Cloudinary,
 *             save URL to Supabase.
 */

import { useCallback, useEffect, useRef, useState } from 'react'
import dynamic from 'next/dynamic'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

// Dynamic imports — both require browser APIs
const BlockNoteReadOnly = dynamic(
  () => import('@/components/editor/BlockNoteReadOnly'),
  { ssr: false, loading: () => <div className="text-gray-500 text-sm p-4">Loading content…</div> }
)

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface ContentItem {
  id: string
  title: string
  type: string
  menu_thumbnail_url: string | null
  content_body?: any
  image_url?: string | null
  audio_url?: string | null
}

// Crop dimensions (logical pixels) — matches prototype spec
const CROP_W = 340
const CROP_H = 222

/** Extracts the Cloudinary public_id from a secure_url (any path format, no transforms). */
function extractCloudinaryPublicId(url: string): string | null {
  const after = url.split('/image/upload/')[1]
  if (!after) return null
  const withoutVersion = after.replace(/^v\d+\//, '')
  return withoutVersion.replace(/\.[^/.]+$/, '') || null
}

// Zoom-out factor applied to the BlockNote content before capture.
const CONTENT_ZOOM = 2 / 3

// ---------------------------------------------------------------------------
// Waveform canvas generator (audio type)
// ---------------------------------------------------------------------------

/**
 * Draws a static waveform visual on a canvas and returns a PNG data URL.
 * Uses multi-frequency sine waves to produce a realistic-looking waveform shape.
 * Colors match the BlockNote Audio block design: #6B2A2A bars on #c7c7c2 background.
 */
function generateWaveformDataUrl(): string {
  const W = CROP_W * 2   // 2× for retina quality
  const H = CROP_H * 2
  const canvas = document.createElement('canvas')
  canvas.width = W
  canvas.height = H
  const ctx = canvas.getContext('2d')!

  // Background
  ctx.fillStyle = '#c7c7c2'
  ctx.fillRect(0, 0, W, H)

  const BAR_COUNT = 58
  const BAR_GAP = 4          // gap between bars (unscaled, canvas units)
  const WAVEFORM_W = W * 0.86
  const BAR_W = (WAVEFORM_W - (BAR_COUNT - 1) * BAR_GAP) / BAR_COUNT
  const WAVEFORM_X = (W - WAVEFORM_W) / 2
  const MAX_H = H * 0.72
  const MIN_H = H * 0.03
  const CENTER_Y = H * 0.50

  for (let i = 0; i < BAR_COUNT; i++) {
    const t = i / (BAR_COUNT - 1)

    // Attack-sustain-decay envelope: tapers at both ends
    const envelope = Math.sin(t * Math.PI)

    // Multi-frequency waveform detail
    const detail =
      0.50 +
      Math.sin(t * Math.PI * 2.0) * 0.14 +
      Math.sin(t * Math.PI * 5.7) * 0.10 +
      Math.sin(t * Math.PI * 13.3) * 0.07 +
      Math.sin(t * Math.PI * 29.1) * 0.04 +
      Math.sin(t * Math.PI * 53.7) * 0.02

    const normalized = Math.max(0, Math.min(1, detail)) * envelope
    const h = MIN_H + normalized * (MAX_H - MIN_H)
    const x = WAVEFORM_X + i * (BAR_W + BAR_GAP)

    // Primary bar — solid accent color
    ctx.fillStyle = '#6B2A2A'
    ctx.fillRect(Math.round(x), Math.round(CENTER_Y - h / 2), Math.round(BAR_W), Math.round(h))

    // Reflection — softer, below center (matches wavesurfer's mirrored look)
    ctx.fillStyle = 'rgba(107, 42, 42, 0.28)'
    const reflectH = h * 0.45
    ctx.fillRect(Math.round(x), Math.round(CENTER_Y + h / 2), Math.round(BAR_W), Math.round(reflectH))
  }

  return canvas.toDataURL('image/png')
}

// ---------------------------------------------------------------------------
// Shared upload helper
// ---------------------------------------------------------------------------

async function uploadDataUrlToCloudinary(dataUrl: string): Promise<string> {
  const res = await fetch(dataUrl)
  const blob = await res.blob()
  const file = new File([blob], 'menu-thumbnail.png', { type: 'image/png' })

  const formData = new FormData()
  formData.append('file', file)
  formData.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET!)
  const uploadRes = await fetch(
    `https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  )
  const data = await uploadRes.json()
  if (!data.secure_url) throw new Error(data?.error?.message || 'Cloudinary upload failed')
  return data.secure_url
}

async function deleteOldThumbnail(url: string): Promise<void> {
  const publicId = extractCloudinaryPublicId(url)
  if (!publicId) return
  await fetch('/api/cloudinary-delete', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ public_id: publicId }),
  })
}

// ---------------------------------------------------------------------------
// List row
// ---------------------------------------------------------------------------

const TYPE_LABEL: Record<string, string> = {
  article: 'Article',
  image: 'Image',
  audio: 'Audio',
  video: 'Video',
}

function ThumbnailRow({
  item,
  onSetThumbnail,
}: {
  item: ContentItem
  onSetThumbnail: (id: string) => void
}) {
  return (
    <tr className="border-b border-gray-800 hover:bg-gray-900/50">
      <td className="px-4 py-3 text-gray-200 max-w-xs truncate">{item.title}</td>
      <td className="px-4 py-3">
        <span className="text-xs text-gray-500 bg-gray-800 px-2 py-0.5 rounded">
          {TYPE_LABEL[item.type] ?? item.type}
        </span>
      </td>
      <td className="px-4 py-3">
        {item.menu_thumbnail_url ? (
          <div className="flex items-center gap-3">
            <img
              src={item.menu_thumbnail_url}
              alt="thumb"
              width={68}
              height={44}
              className="rounded object-cover border border-gray-700"
              style={{ width: 68, height: 44 }}
            />
            <span className="text-xs text-emerald-400">Set</span>
          </div>
        ) : (
          <span className="text-xs text-gray-500 bg-gray-800 px-2 py-1 rounded">No thumbnail</span>
        )}
      </td>
      <td className="px-4 py-3">
        <button
          onClick={() => onSetThumbnail(item.id)}
          className="text-xs bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded transition-colors"
        >
          Set thumbnail
        </button>
      </td>
    </tr>
  )
}

// ---------------------------------------------------------------------------
// Image type tool
// ---------------------------------------------------------------------------

function ImageThumbnailTool({
  item,
  onClose,
  onSaved,
}: {
  item: ContentItem
  onClose: () => void
  onSaved: (id: string, url: string) => void
}) {
  const supabase = createClient()
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  async function handleSave() {
    if (!item.image_url) return
    setSaving(true)
    setStatus(null)
    try {
      // Delete old thumbnail if present (it's a separate Cloudinary asset from the image itself)
      if (item.menu_thumbnail_url) {
        await deleteOldThumbnail(item.menu_thumbnail_url)
      }
      // Save image_url directly — it is already hosted on Cloudinary
      const { error } = await supabase
        .from('content')
        .update({ menu_thumbnail_url: item.image_url })
        .eq('id', item.id)
      if (error) throw error
      setStatus('Saved!')
      onSaved(item.id, item.image_url!)
    } catch (err: any) {
      setStatus(`Failed: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Set Thumbnail — Image</h2>
          <p className="text-sm text-gray-400 mt-0.5 max-w-xl truncate">{item.title}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-sm px-3 py-1.5 rounded border border-gray-700 hover:border-gray-500 transition-colors"
        >
          ← Back to list
        </button>
      </div>

      {item.image_url ? (
        <div className="flex gap-8 items-start">
          <div className="flex flex-col gap-3">
            <p className="text-xs text-gray-400">
              The item's uploaded image will be used as the thumbnail.
            </p>
            <img
              src={item.image_url}
              alt="Item image"
              style={{
                width: CROP_W,
                height: CROP_H,
                objectFit: 'cover',
                border: '2px solid #fc5454',
                borderRadius: 4,
              }}
            />
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm px-4 py-2 rounded transition-colors"
            >
              {saving ? 'Saving…' : 'Use as thumbnail'}
            </button>
            {status && (
              <p className={`text-sm ${status === 'Saved!' ? 'text-emerald-400' : 'text-red-400'}`}>
                {status}
              </p>
            )}
          </div>
        </div>
      ) : (
        <p className="text-gray-500 text-sm">No image URL found for this item.</p>
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Audio type tool
// ---------------------------------------------------------------------------

function AudioThumbnailTool({
  item,
  onClose,
  onSaved,
}: {
  item: ContentItem
  onClose: () => void
  onSaved: (id: string, url: string) => void
}) {
  const supabase = createClient()
  const [previewUrl] = useState<string>(() => generateWaveformDataUrl())
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  async function handleSave() {
    setUploading(true)
    setStatus(null)
    try {
      if (item.menu_thumbnail_url) {
        await deleteOldThumbnail(item.menu_thumbnail_url)
      }
      const secureUrl = await uploadDataUrlToCloudinary(previewUrl)
      const { error } = await supabase
        .from('content')
        .update({ menu_thumbnail_url: secureUrl })
        .eq('id', item.id)
      if (error) throw error
      setStatus('Saved!')
      onSaved(item.id, secureUrl)
    } catch (err: any) {
      setStatus(`Failed: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Set Thumbnail — Audio</h2>
          <p className="text-sm text-gray-400 mt-0.5 max-w-xl truncate">{item.title}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-sm px-3 py-1.5 rounded border border-gray-700 hover:border-gray-500 transition-colors"
        >
          ← Back to list
        </button>
      </div>

      <div className="flex gap-8 items-start">
        <div className="flex flex-col gap-3">
          <p className="text-xs text-gray-400">
            Generated static waveform visual ({CROP_W}×{CROP_H}px).
          </p>
          <img
            src={previewUrl}
            alt="Waveform thumbnail preview"
            style={{
              width: CROP_W,
              height: CROP_H,
              border: '2px solid #fc5454',
              borderRadius: 4,
            }}
          />
          <button
            onClick={handleSave}
            disabled={uploading}
            className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm px-4 py-2 rounded transition-colors"
          >
            {uploading ? 'Uploading…' : 'Save waveform thumbnail'}
          </button>
          {status && (
            <p className={`text-sm ${status === 'Saved!' ? 'text-emerald-400' : 'text-red-400'}`}>
              {status}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Article type capture tool (BlockNote html2canvas flow)
// ---------------------------------------------------------------------------

function ArticleCaptureTool({
  item,
  onClose,
  onSaved,
}: {
  item: ContentItem
  onClose: () => void
  onSaved: (id: string, url: string) => void
}) {
  const supabase = createClient()
  const scrollRef = useRef<HTMLDivElement>(null)
  const captureRef = useRef<HTMLDivElement>(null)
  const [capturing, setCapturing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [status, setStatus] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const hasContent =
    item.content_body && Array.isArray(item.content_body) && item.content_body.length > 0

  async function handleCapture() {
    if (!captureRef.current) return
    setCapturing(true)
    setStatus(null)
    setPreviewUrl(null)

    try {
      const html2canvas = (await import('html2canvas')).default
      await document.fonts.ready

      const visibleScrollTop = scrollRef.current?.scrollTop ?? 0
      const captureScrollY = visibleScrollTop / CONTENT_ZOOM

      const canvas = await html2canvas(captureRef.current, {
        useCORS: true,
        allowTaint: false,
        scale: 2,
        width: Math.round(CROP_W / CONTENT_ZOOM),
        height: Math.round(CROP_H / CONTENT_ZOOM),
        y: captureScrollY,
        logging: false,
        backgroundColor: '#c7c7c2',
      })

      setPreviewUrl(canvas.toDataURL('image/png'))
      setCapturing(false)
    } catch (err) {
      console.error('Capture error:', err)
      setStatus('Capture failed — see console')
      setCapturing(false)
    }
  }

  async function handleUpload() {
    if (!previewUrl) return
    setUploading(true)
    setStatus(null)

    try {
      if (item.menu_thumbnail_url) {
        await deleteOldThumbnail(item.menu_thumbnail_url)
      }
      const secureUrl = await uploadDataUrlToCloudinary(previewUrl)
      const { error } = await supabase
        .from('content')
        .update({ menu_thumbnail_url: secureUrl })
        .eq('id', item.id)
      if (error) throw error
      setStatus('Saved!')
      onSaved(item.id, secureUrl)
    } catch (err: any) {
      console.error('Upload error:', err)
      setStatus(`Upload failed: ${err.message}`)
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Set Thumbnail — Article</h2>
          <p className="text-sm text-gray-400 mt-0.5 max-w-xl truncate">{item.title}</p>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-white text-sm px-3 py-1.5 rounded border border-gray-700 hover:border-gray-500 transition-colors"
        >
          ← Back to list
        </button>
      </div>

      <div className="flex gap-8 items-start">
        <div className="flex flex-col gap-3">
          <p className="text-xs text-gray-400">
            Scroll within the frame to position the thumbnail area ({CROP_W}×{CROP_H}px).
          </p>

          <div className="relative" style={{ width: CROP_W }}>
            <div
              ref={scrollRef}
              className="overflow-y-auto overflow-x-hidden"
              style={{
                width: CROP_W,
                height: CROP_H,
                background: '#c7c7c2',
                border: '2px solid #fc5454',
                borderRadius: 4,
                position: 'relative',
              }}
            >
              <div style={{ width: CROP_W, background: '#c7c7c2', color: '#1a1a1a' }}>
                {hasContent ? (
                  <div style={{ width: Math.round(CROP_W / CONTENT_ZOOM), zoom: CONTENT_ZOOM }}>
                    <BlockNoteReadOnly content={item.content_body} />
                  </div>
                ) : (
                  <div
                    className="flex items-center justify-center h-full text-gray-600 text-sm"
                    style={{ height: CROP_H }}
                  >
                    No content body available for this item
                  </div>
                )}
              </div>
            </div>

            <div className="text-xs text-red-400/80 mt-1 text-right" style={{ width: CROP_W }}>
              {CROP_W}×{CROP_H}px capture area
            </div>
          </div>

          {/* Hidden unzoomed capture target */}
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: '-9999px',
              width: Math.round(CROP_W / CONTENT_ZOOM),
              background: '#c7c7c2',
              color: '#1a1a1a',
              pointerEvents: 'none',
              zIndex: -1,
            }}
            ref={captureRef}
          >
            {hasContent && <BlockNoteReadOnly content={item.content_body} />}
          </div>

          <button
            onClick={handleCapture}
            disabled={capturing || !hasContent}
            className="bg-blue-700 hover:bg-blue-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm px-4 py-2 rounded transition-colors"
          >
            {capturing ? 'Capturing…' : 'Capture'}
          </button>
        </div>

        {previewUrl && (
          <div className="flex flex-col gap-3">
            <p className="text-xs text-gray-400">Preview (shown at half scale):</p>
            <img
              src={previewUrl}
              alt="Captured thumbnail preview"
              style={{
                width: CROP_W / 2,
                height: CROP_H / 2,
                objectFit: 'cover',
                border: '1px solid #374151',
                borderRadius: 4,
              }}
            />
            <div className="flex gap-3 items-center">
              <button
                onClick={handleUpload}
                disabled={uploading}
                className="bg-emerald-700 hover:bg-emerald-600 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm px-4 py-2 rounded transition-colors"
              >
                {uploading ? 'Uploading…' : 'Save thumbnail'}
              </button>
              <button
                onClick={() => setPreviewUrl(null)}
                className="text-gray-400 hover:text-white text-sm"
              >
                Recapture
              </button>
            </div>
            {status && (
              <p className={`text-sm ${status === 'Saved!' ? 'text-emerald-400' : 'text-red-400'}`}>
                {status}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// CaptureTool — routes to the right sub-tool by content type
// ---------------------------------------------------------------------------

function CaptureTool({
  item,
  onClose,
  onSaved,
}: {
  item: ContentItem
  onClose: () => void
  onSaved: (id: string, url: string) => void
}) {
  if (item.type === 'image') {
    return <ImageThumbnailTool item={item} onClose={onClose} onSaved={onSaved} />
  }
  if (item.type === 'audio') {
    return <AudioThumbnailTool item={item} onClose={onClose} onSaved={onSaved} />
  }
  // article (and any other BlockNote-based type)
  return <ArticleCaptureTool item={item} onClose={onClose} onSaved={onSaved} />
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function ThumbnailsPage() {
  const supabase = createClient()
  const [items, setItems] = useState<ContentItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeItem, setActiveItem] = useState<ContentItem | null>(null)

  useEffect(() => {
    loadItems()
  }, [])

  async function loadItems() {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('content')
      .select('id, title, type, menu_thumbnail_url')
      .order('title')

    if (error) {
      setError(error.message)
    } else {
      setItems(data ?? [])
    }
    setLoading(false)
  }

  const handleSetThumbnail = useCallback(
    async (id: string) => {
      const { data, error } = await supabase
        .from('content')
        .select('id, title, type, menu_thumbnail_url, content_body, image_url, audio_url')
        .eq('id', id)
        .single()

      if (error || !data) {
        alert('Failed to load content: ' + error?.message)
        return
      }
      setActiveItem(data)
    },
    [supabase]
  )

  const handleSaved = useCallback((id: string, url: string) => {
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, menu_thumbnail_url: url } : item))
    )
    setActiveItem(null)
  }, [])

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/admin/menu" className="hover:text-gray-300 transition-colors">
          Menu Admin
        </Link>
        <span>/</span>
        <span className="text-gray-300">Thumbnails</span>
      </div>

      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Menu Thumbnails</h1>
        <p className="text-gray-400 text-sm mt-1">
          Set the thumbnail image displayed on ThumbCards in the dynamic menu.
        </p>
      </div>

      {activeItem ? (
        <CaptureTool
          item={activeItem}
          onClose={() => setActiveItem(null)}
          onSaved={handleSaved}
        />
      ) : (
        <>
          {loading && (
            <div className="text-gray-400 text-sm py-8 text-center">Loading content…</div>
          )}
          {error && (
            <div className="text-red-400 text-sm py-4 bg-red-900/20 rounded px-4">{error}</div>
          )}
          {!loading && !error && (
            <div className="border border-gray-800 rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-800 bg-gray-900">
                    <th className="px-4 py-3 text-left text-gray-400 font-medium">Title</th>
                    <th className="px-4 py-3 text-left text-gray-400 font-medium">Type</th>
                    <th className="px-4 py-3 text-left text-gray-400 font-medium">Thumbnail</th>
                    <th className="px-4 py-3 text-left text-gray-400 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {items.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                        No content items found.
                      </td>
                    </tr>
                  )}
                  {items.map((item) => (
                    <ThumbnailRow
                      key={item.id}
                      item={item}
                      onSetThumbnail={handleSetThumbnail}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {!loading && !error && items.length > 0 && (
            <p className="text-xs text-gray-600 mt-3">
              {items.filter((i) => i.menu_thumbnail_url).length} of {items.length} items have
              thumbnails set.
            </p>
          )}
        </>
      )}
    </div>
  )
}
