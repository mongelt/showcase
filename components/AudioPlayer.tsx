'use client'

import { useState, useEffect, useRef } from 'react'

type AudioPlayerProps = {
  audioUrl: string
}

export default function AudioPlayer({ audioUrl }: AudioPlayerProps) {
  const [waveformReady, setWaveformReady] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const waveformRef = useRef<HTMLDivElement>(null)
  const wavesurferRef = useRef<any>(null)
  const lastUrlRef = useRef<string | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined' || !waveformRef.current || !audioUrl) {
      return
    }

    if (lastUrlRef.current !== audioUrl) {
      setWaveformReady(false)
      setIsPlaying(false)
    }

    let isMounted = true

    const initWaveform = async () => {
      try {
        if (lastUrlRef.current === audioUrl && wavesurferRef.current) {
          return
        }

        const [WaveSurfer, HoverPlugin] = await Promise.all([
          import('wavesurfer.js').then((m) => m.default),
          import('wavesurfer.js/dist/plugins/hover.esm.js').then((m) => m.default),
        ])

        if (wavesurferRef.current) {
          wavesurferRef.current.destroy()
          wavesurferRef.current = null
        }

        if (waveformRef.current) {
          waveformRef.current.innerHTML = ''
        }

        const wavesurfer = WaveSurfer.create({
          container: waveformRef.current!,
          waveColor: '#6B2A2A',
          progressColor: '#A85A5A',
          cursorColor: '#1a1a1a',
          barWidth: 2,
          barRadius: 1,
          height: 80,
          normalize: true,
          plugins: [
            HoverPlugin.create({
              lineColor: '#6B2A2A',
              lineWidth: 1,
              labelColor: '#1a1a1a',
              labelBackground: '#E9E3E0',
              labelSize: 11,
            }),
          ],
        })

        wavesurfer.on('ready', () => {
          if (isMounted) setWaveformReady(true)
        })
        wavesurfer.on('play', () => {
          if (isMounted) setIsPlaying(true)
        })
        wavesurfer.on('pause', () => {
          if (isMounted) setIsPlaying(false)
        })
        wavesurfer.on('finish', () => {
          if (isMounted) setIsPlaying(false)
        })

        await wavesurfer.load(audioUrl)
        lastUrlRef.current = audioUrl

        if (isMounted) {
          wavesurferRef.current = wavesurfer
        } else {
          wavesurfer.destroy()
        }
      } catch (error) {
        console.error('Failed to initialize waveform:', error)
        if (isMounted) setWaveformReady(false)
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

  const handlePlayPause = () => wavesurferRef.current?.playPause()
  const handleStop = () => {
    wavesurferRef.current?.stop()
  }

  if (!audioUrl) return null

  return (
    <div
      className="my-8"
      style={{
        borderRadius: 8,
        padding: 20,
        border: '1px solid var(--border-card, #b8b0aa)',
        background: 'transparent',
        transition: 'transform 0.2s ease, box-shadow 0.2s ease',
      }}
      onMouseEnter={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.transform = 'translateY(-2px)'
        el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)'
      }}
      onMouseLeave={(e) => {
        const el = e.currentTarget as HTMLDivElement
        el.style.transform = ''
        el.style.boxShadow = ''
      }}
    >
      <div
        ref={waveformRef}
        style={{
          width: '100%',
          borderRadius: 4,
          background: 'var(--bg-main, #c7c7c2)',
          overflow: 'hidden',
        }}
      />

      {!waveformReady && (
        <p
          style={{
            fontFamily: "var(--font-body, 'Public Sans', sans-serif)",
            fontSize: '0.875rem',
            color: 'var(--text-metadata, #5a5a5a)',
            textAlign: 'center',
            padding: '8px 0',
          }}
        >
          Loading waveform…
        </p>
      )}

      {waveformReady && (
        <div
          style={{
            display: 'flex',
            gap: 10,
            justifyContent: 'center',
            alignItems: 'center',
            marginTop: 10,
          }}
        >
          <button
            onClick={handlePlayPause}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            style={{
              padding: '8px 16px',
              background: 'transparent',
              color: 'var(--accent-light, #6B2A2A)',
              border: '1px solid var(--accent-light, #6B2A2A)',
              borderRadius: 4,
              cursor: 'pointer',
              fontFamily: "var(--font-ui, 'Space Grotesk', sans-serif)",
              fontSize: '0.9rem',
              fontWeight: 600,
              transition: 'background 0.2s ease, border-color 0.2s ease, color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget
              el.style.background = 'rgba(107, 42, 42, 0.1)'
              el.style.borderColor = 'var(--accent-emerald-300, #A85A5A)'
              el.style.color = 'var(--accent-emerald-300, #A85A5A)'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget
              el.style.background = 'transparent'
              el.style.borderColor = 'var(--accent-light, #6B2A2A)'
              el.style.color = 'var(--accent-light, #6B2A2A)'
            }}
          >
            {isPlaying ? 'Pause' : 'Play'}
          </button>
          <button
            onClick={handleStop}
            aria-label="Stop"
            style={{
              padding: '8px 16px',
              background: 'transparent',
              color: 'var(--accent-light, #6B2A2A)',
              border: '1px solid var(--accent-light, #6B2A2A)',
              borderRadius: 4,
              cursor: 'pointer',
              fontFamily: "var(--font-ui, 'Space Grotesk', sans-serif)",
              fontSize: '0.9rem',
              fontWeight: 600,
              transition: 'background 0.2s ease, border-color 0.2s ease, color 0.2s ease',
            }}
            onMouseEnter={(e) => {
              const el = e.currentTarget
              el.style.background = 'rgba(107, 42, 42, 0.1)'
              el.style.borderColor = 'var(--accent-emerald-300, #A85A5A)'
              el.style.color = 'var(--accent-emerald-300, #A85A5A)'
            }}
            onMouseLeave={(e) => {
              const el = e.currentTarget
              el.style.background = 'transparent'
              el.style.borderColor = 'var(--accent-light, #6B2A2A)'
              el.style.color = 'var(--accent-light, #6B2A2A)'
            }}
          >
            Stop
          </button>
        </div>
      )}
    </div>
  )
}
