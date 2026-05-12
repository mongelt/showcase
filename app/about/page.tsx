'use client'

import { useEffect, useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Profile from '@/components/Profile'
import Loader from '@/components/Loader'
import dynamic from 'next/dynamic'
import type { CustomPartialBlock } from '@/lib/blocknote'

const BlockNoteRenderer = dynamic(() => import('@/components/BlockNoteRendererDynamic'), {
  ssr: false,
})

export default function AboutPage() {
  const supabase = useMemo(() => createClient(), [])
  const router = useRouter()
  const [aboutContent, setAboutContent] = useState<CustomPartialBlock[] | null>(null)
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState(false)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('profile')
        .select('about_content')
        .limit(1)
        .single()
      if (error) setFetchError(true)
      if (data?.about_content) setAboutContent(data.about_content)
      setLoading(false)
    }
    load()
  }, [])

  return (
    <div className="min-h-screen bg-bg-main">
      <Profile
        condensedMode={true}
        initialExpanded={false}
        onExpand={() => router.push('/')}
      />

      <div style={{ padding: 50 }}>
        {loading ? (
          <div className="flex items-center justify-center" style={{ minHeight: 'calc(100vh - 100px)' }}>
            <Loader />
          </div>
        ) : fetchError ? (
          <p className="text-text-secondary text-sm">Failed to load content.</p>
        ) : aboutContent ? (
          <BlockNoteRenderer data={aboutContent} />
        ) : (
          <p className="text-text-secondary text-sm">No content yet.</p>
        )}
      </div>
    </div>
  )
}
