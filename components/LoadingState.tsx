'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import BlockNoteRenderer from '@/components/BlockNoteRendererDynamic'

// Overlay is visible during 'typing' and 'sliding' phases, then fades out.
// The settled layout (flex row, guaranteed gap) fades in after the overlay is gone.
// Location + bio fade in only once the settled layout is fully visible ('holding'+).
type Phase = 'typing' | 'sliding' | 'revealing' | 'holding' | 'exiting'

type ProfileSnap = {
  full_name: string | null
  location: string | null
  job_title_1: string | null
  job_title_2: string | null
  job_title_3: string | null
  job_title_4: string | null
  short_bio: any
  short_bio_loading_margin_top: number | null
}

function isBlockNoteFormat(data: any): boolean {
  return (
    Array.isArray(data) &&
    data.length > 0 &&
    data.every(
      (b: any) => b && typeof b === 'object' && 'id' in b && 'type' in b
    )
  )
}

function ShortBioRenderer({ data }: { data: any }) {
  const isSimple = useMemo(() => {
    if (!data || !isBlockNoteFormat(data)) return false
    return data.every(
      (b: any) => b.type === 'paragraph' && Array.isArray(b.content)
    )
  }, [data])

  const simpleContent = useMemo(() => {
    if (!isSimple || !data) return null
    return data
      .map((b: any, i: number) => {
        const text = (b.content || [])
          .map((item: any) => (item.type === 'text' ? item.text || '' : ''))
          .join('')
        const html = text.replace(/&nbsp;/g, ' ').trim()
        return html ? (
          <p key={i} dangerouslySetInnerHTML={{ __html: html }} />
        ) : null
      })
      .filter(Boolean)
  }, [isSimple, data])

  if (simpleContent?.length) return <div>{simpleContent}</div>
  if (isBlockNoteFormat(data)) return <BlockNoteRenderer data={data} />
  return null
}

export default function LoadingState({ onDone }: { onDone: () => void }) {
  const supabase = useMemo(() => createClient(), [])
  const onDoneRef = useRef(onDone)
  onDoneRef.current = onDone
  const [profile, setProfile] = useState<ProfileSnap | null>(null)
  const [phase, setPhase] = useState<Phase>('typing')
  const [displayedName, setDisplayedName] = useState('')
  const [cursorVisible, setCursorVisible] = useState(true)

  // Fetch profile immediately so short_bio initialises during typing
  useEffect(() => {
    supabase
      .from('profile')
      .select(
        'full_name, location, job_title_1, job_title_2, job_title_3, job_title_4, short_bio, short_bio_loading_margin_top'
      )
      .limit(1)
      .single()
      .then(({ data }) => {
        if (data) setProfile(data)
      })
  }, [])

  // Typewriter — starts once profile is loaded
  useEffect(() => {
    if (!profile?.full_name) return
    const name = profile.full_name.toUpperCase()
    let i = 0
    const id = setInterval(() => {
      i++
      setDisplayedName(name.slice(0, i))
      if (i >= name.length) {
        clearInterval(id)
        setTimeout(() => {
          setCursorVisible(false)
          setPhase('sliding')
        }, 400)
      }
    }, 80)
    return () => clearInterval(id)
  }, [profile])

  // Phase timeline
  useEffect(() => {
    let t: ReturnType<typeof setTimeout>
    if (phase === 'sliding') {
      // Hold for 500ms so the overlay is still visible before fading
      t = setTimeout(() => setPhase('revealing'), 500)
    } else if (phase === 'revealing') {
      // 500ms: overlay fades out, settled layout cross-fades in
      t = setTimeout(() => setPhase('holding'), 500)
    } else if (phase === 'holding') {
      t = setTimeout(() => setPhase('exiting'), 2000)
    } else if (phase === 'exiting') {
      t = setTimeout(() => onDoneRef.current(), 600)
    }
    return () => clearTimeout(t)
  }, [phase])

  const showOverlay = phase === 'typing' || phase === 'sliding'
  // Settled layout appears during 'revealing' (with a 0.4s delay so the
  // overlay finishes fading before the name shows at its left position)
  const showSettled =
    phase === 'revealing' || phase === 'holding' || phase === 'exiting'
  // Location + bio fade in only after the settled layout is stable
  const showDetails = phase === 'holding' || phase === 'exiting'
  const isExiting = phase === 'exiting'

  return (
    <motion.div
      className="fixed inset-0 overflow-hidden"
      style={{ background: '#121212', zIndex: 200 }}
      animate={isExiting ? { opacity: 0, y: -24 } : { opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: 'easeInOut' }}
    >
      {/* Settled layout — flex row centered as a unit, with a minimum 10vw gap
          so the bio can never overlap the name regardless of name length.
          Rendered immediately (opacity 0) so BlockNote preloads during typing. */}
      <motion.div
        className="fixed flex items-start"
        style={{
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          gap: '10vw',
        }}
        animate={{ opacity: showSettled ? 1 : 0 }}
        transition={{ duration: 0.3, delay: showSettled ? 0.4 : 0 }}
      >
        {/* Left block: name, location, titles */}
        <div className="flex-shrink-0">
          <h1 className="font-display text-[2rem] font-bold uppercase text-text-on-dark tracking-[-0.012em] mb-1 whitespace-nowrap">
            {displayedName}
          </h1>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: showDetails ? 1 : 0 }}
            transition={{ duration: 0.5 }}
          >
            {profile?.location && (
              <div className="flex items-center gap-1 font-body text-sm text-text-on-dark-secondary whitespace-nowrap mb-3">
                <img
                  src="/dc-outline.png"
                  alt="location"
                  style={{ width: 14, height: 14, objectFit: 'contain' }}
                />
                <p>{profile.location}</p>
              </div>
            )}
            <div className="space-y-0.5 font-body text-sm text-text-on-dark-secondary">
              {profile?.job_title_1 && <p>{profile.job_title_1}</p>}
              {profile?.job_title_2 && <p>{profile.job_title_2}</p>}
              {profile?.job_title_3 && <p>{profile.job_title_3}</p>}
              {profile?.job_title_4 && <p>{profile.job_title_4}</p>}
            </div>
          </motion.div>
        </div>

        {/* Right block: short bio — width capped so it doesn't run off screen */}
        <motion.div
          className="font-body text-sm text-text-on-dark-secondary leading-relaxed"
          style={{ width: '22vw', maxWidth: '380px', ...(profile?.short_bio_loading_margin_top != null ? { marginTop: profile.short_bio_loading_margin_top } : {}) }}
          initial={{ opacity: 0 }}
          animate={{ opacity: showDetails ? 1 : 0 }}
          transition={{ duration: 0.5 }}
        >
          {profile?.short_bio && <ShortBioRenderer data={profile.short_bio} />}
        </motion.div>
      </motion.div>

      {/* Typing overlay — covers the settled layout with a centered name.
          Fades out when phase reaches 'revealing', leaving the settled layout. */}
      <AnimatePresence>
        {showOverlay && (
          <motion.div
            key="typing-overlay"
            className="fixed inset-0 flex items-center justify-center"
            style={{ background: '#121212', zIndex: 201 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="font-display text-[2rem] font-bold uppercase text-text-on-dark tracking-[-0.012em] whitespace-nowrap select-none">
              {displayedName}
              {/* Always in DOM to prevent width shift when cursor disappears */}
              <motion.span
                className="ml-0.5 inline-block"
                animate={cursorVisible ? { opacity: [1, 0, 1] } : { opacity: 0 }}
                transition={cursorVisible ? { repeat: Infinity, duration: 0.8, ease: 'linear' } : { duration: 0.1 }}
              >
                |
              </motion.span>
            </h1>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
