'use client'

import { Input } from '@/components/ui/input'
import VideoPlayer from '@/components/VideoPlayer'

type VideoEditorProps = {
  videoUrl: string
  onVideoUrlChange: (url: string) => void
  uploading?: boolean
  onUploadingChange?: (uploading: boolean) => void
}

export default function VideoEditor({ 
  videoUrl, 
  onVideoUrlChange,
  uploading = false,
  onUploadingChange
}: VideoEditorProps) {
  async function handleFileUpload(file: File) {
    if (onUploadingChange) {
      onUploadingChange(true)
    }
    
    try {
      const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
      const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET
      if (!cloudName || !uploadPreset) {
        alert('Upload is not configured. Please set Cloudinary env vars.')
        if (onUploadingChange) {
          onUploadingChange(false)
        }
        return
      }

      const formData = new FormData()
      formData.append('file', file)
      formData.append('upload_preset', uploadPreset)
      
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${cloudName}/video/upload`,
        { method: 'POST', body: formData }
      )
      
      const data = await response.json()
      onVideoUrlChange(data.secure_url)
    } catch (error) {
      console.error('Video upload failed:', error)
      alert('Upload failed')
    } finally {
      if (onUploadingChange) {
        onUploadingChange(false)
      }
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Video URL *
        </label>
        <Input
          type="url"
          value={videoUrl}
          onChange={(e) => onVideoUrlChange(e.target.value)}
          placeholder="YouTube embed URL or Cloudinary video URL"
          className="mb-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Upload Video File
        </label>
        <input
          type="file"
          accept="video/*"
          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
          className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
          disabled={uploading}
        />
        <p className="text-xs text-gray-500 mt-2">
          For videos &lt;10MB: Upload here. For larger: Upload to YouTube (unlisted) and paste embed URL
        </p>
        {uploading && <p className="text-sm text-blue-400 mt-2">Uploading...</p>}
      </div>

      {videoUrl && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Video Preview
          </label>
          <div className="bg-gray-900 rounded-md p-4 border border-gray-800">
            <VideoPlayer videoUrl={videoUrl} title="Video preview" />
          </div>
        </div>
      )}
    </div>
  )
}

