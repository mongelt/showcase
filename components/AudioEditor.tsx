'use client'

import { useState, useEffect, useRef } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

type AudioEditorProps = {
  audioUrl: string
  onAudioUrlChange: (url: string) => void
  uploading?: boolean
  onUploadingChange?: (uploading: boolean) => void
}

export default function AudioEditor({ 
  audioUrl, 
  onAudioUrlChange,
  uploading = false,
  onUploadingChange
}: AudioEditorProps) {
  const [waveformReady, setWaveformReady] = useState(false)
  const waveformRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<any>(null)
  const lastUrlRef = useRef<string | null>(null)

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
      onAudioUrlChange(data.secure_url)
    } catch (error) {
      console.error('Audio upload failed:', error)
      alert('Upload failed')
    } finally {
      if (onUploadingChange) {
        onUploadingChange(false)
      }
    }
  }

  useEffect(() => {
    if (typeof window === 'undefined' || !waveformRef.current) {
      return
    }

    if (!audioUrl) {
      return
    }

    if (lastUrlRef.current !== audioUrl) {
      setWaveformReady(false)
    }

    let isMounted = true

    const initWaveform = async () => {
      try {
        if (lastUrlRef.current === audioUrl && wavesurferRef.current) {
          return
        }
        const WaveSurfer = (await import('wavesurfer.js')).default

        if (wavesurferRef.current) {
          wavesurferRef.current.destroy()
          wavesurferRef.current = null
        }

        if (waveformRef.current) {
          waveformRef.current.innerHTML = ''
        }

        const wavesurfer = WaveSurfer.create({
          container: waveformRef.current!,
          waveColor: '#60a5fa',
          progressColor: '#3b82f6',
          cursorColor: '#ffffff',
          barWidth: 2,
          barRadius: 3,
          height: 100,
          normalize: true,
        })

        await wavesurfer.load(audioUrl)
        lastUrlRef.current = audioUrl
        
        if (isMounted) {
          wavesurferRef.current = wavesurfer
          setWaveformReady(true)
        } else {
          wavesurfer.destroy()
        }
      } catch (error) {
        console.error('Failed to initialize waveform:', error)
        if (isMounted) {
          setWaveformReady(false)
        }
      }
    }

    initWaveform()

    return () => {
      isMounted = false
      if (wavesurferRef.current) {
        try {
          wavesurferRef.current.destroy()
        } catch (error) {
          console.error('Error destroying wavesurfer:', error)
        }
        wavesurferRef.current = null
      }
    }
  }, [audioUrl])

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Audio URL
        </label>
        <Input
          type="url"
          value={audioUrl}
          onChange={(e) => onAudioUrlChange(e.target.value)}
          placeholder="Enter audio URL or upload a file"
          className="mb-2"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          Upload Audio File
        </label>
        <input
          type="file"
          accept="audio/*"
          onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0])}
          className="block w-full text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
          disabled={uploading}
        />
        {uploading && <p className="text-sm text-blue-400 mt-2">Uploading...</p>}
      </div>

      {audioUrl && (
        <div className="mt-4">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Waveform Preview
          </label>
          <div 
            ref={waveformRef} 
            className="w-full bg-gray-900 rounded-md p-4 border border-gray-800"
          />
          {waveformReady && (
            <div className="mt-2 flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => wavesurferRef.current?.playPause()}
                className="text-xs"
              >
                Play/Pause
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => wavesurferRef.current?.stop()}
                className="text-xs"
              >
                Stop
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

