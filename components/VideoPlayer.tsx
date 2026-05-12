'use client'

import 'video.js/dist/video-js.css'
import { useEffect, useRef, useState } from 'react'

type VideoPlayerProps = {
  videoUrl: string
  title?: string
}

function convertYouTubeUrlToEmbed(url: string): string {
  if (url.includes('youtube.com/embed/')) {
    return url
  }

  let videoId: string | null = null

  const watchMatch = url.match(/[?&]v=([^&]+)/)
  if (watchMatch) {
    videoId = watchMatch[1]
  }

  if (!videoId) {
    const shortMatch = url.match(/youtu\.be\/([^?&]+)/)
    if (shortMatch) {
      videoId = shortMatch[1]
    }
  }

  if (!videoId) {
    const vMatch = url.match(/youtube\.com\/v\/([^?&]+)/)
    if (vMatch) {
      videoId = vMatch[1]
    }
  }

  if (videoId) {
    return `https://www.youtube.com/embed/${videoId}`
  }

  return url
}

function convertVimeoUrlToEmbed(url: string): string {
  if (url.includes('player.vimeo.com/video/')) {
    return url
  }

  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/)
  if (vimeoMatch) {
    const videoId = vimeoMatch[1]
    return `https://player.vimeo.com/video/${videoId}`
  }

  return url
}

export default function VideoPlayer({ videoUrl, title }: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const playerRef = useRef<any>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [playerReady, setPlayerReady] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const isYouTube = videoUrl.includes('youtube.com') || videoUrl.includes('youtu.be')
  const isVimeo = videoUrl.includes('vimeo.com')
  
  const embedUrl = isYouTube ? convertYouTubeUrlToEmbed(videoUrl) : (isVimeo ? convertVimeoUrlToEmbed(videoUrl) : videoUrl)

  useEffect(() => {
    if (isYouTube || isVimeo || typeof window === 'undefined' || !containerRef.current) {
      return
    }

    let isMounted = true

    const checkElement = () => {
      return videoRef.current && videoRef.current.parentNode !== null
    }

    const initPlayer = async () => {
      try {
        let attempts = 0
        const maxAttempts = 50
        while (!checkElement() && isMounted && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100))
          attempts++
        }

        if (!checkElement()) {
          console.error('Video element not found in DOM after waiting')
          if (isMounted) {
            setError('Failed to initialize video player: element not in DOM')
          }
          return
        }

        const videojs = (await import('video.js')).default

        if (playerRef.current) {
          try {
            playerRef.current.dispose()
          } catch (error) {
            console.warn('Error disposing existing Video.js player:', error)
          }
          playerRef.current = null
        }

        if (!isMounted || !checkElement() || !videoRef.current) {
          return
        }

        const player = videojs(videoRef.current, {
          controls: true,
          responsive: true,
          fluid: true,
          preload: 'metadata',
          playbackRates: [0.5, 1, 1.25, 1.5, 2],
          controlBar: {
            playToggle: true,
            volumePanel: {
              inline: false
            },
            currentTimeDisplay: true,
            timeDivider: true,
            durationDisplay: true,
            progressControl: true,
            remainingTimeDisplay: true,
            fullscreenToggle: true
          }
        })

        player.src(videoUrl)

        player.on('ready', () => {
          if (isMounted) {
            setPlayerReady(true)
            setError(null)
          }
        })

        player.on('error', () => {
          if (isMounted) {
            const error = player.error()
            setError(error ? `Video error: ${error.message || 'Unknown error'}` : 'Failed to load video')
            setPlayerReady(false)
          }
        })

        if (isMounted) {
          playerRef.current = player
        } else {
          player.dispose()
        }
      } catch (error) {
        console.error('Failed to initialize Video.js player:', error)
        if (isMounted) {
          setError('Failed to initialize video player')
          setPlayerReady(false)
        }
      }
    }

    initPlayer()

    return () => {
      isMounted = false
      if (playerRef.current) {
        try {
          playerRef.current.dispose()
        } catch (error) {
          console.warn('Error disposing Video.js player:', error)
        }
        playerRef.current = null
      }
    }
  }, [videoUrl, isYouTube, isVimeo])

  if (!videoUrl) {
    return null
  }

  if (isYouTube || isVimeo) {
    return (
      <div className="my-8 flex justify-center pb-20">
        <div className="aspect-video w-[60%]">
          <iframe
            src={embedUrl}
            className="w-full h-full rounded-lg"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
            allowFullScreen
            title={title || 'Video player'}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="my-8 flex flex-col items-center pb-20">
      <div ref={containerRef} className="w-[60%]">
        <video
          ref={videoRef}
          className="video-js vjs-big-play-centered vjs-default-skin"
          playsInline
          preload="metadata"
        >
          <p className="vjs-no-js">
            To view this video please enable JavaScript, and consider upgrading to a web browser that
            <a href="https://videojs.com/html5-video-support/" target="_blank" rel="noopener noreferrer">
              supports HTML5 video
            </a>.
          </p>
        </video>

        {error && (
          <div className="mt-4 p-4 bg-red-900/20 border border-red-800 rounded-lg">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        {!playerReady && !error && (
          <div className="mt-4 text-center text-gray-400 text-sm">
            Loading video player...
          </div>
        )}
      </div>
    </div>
  )
}

