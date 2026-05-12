'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import dynamic from 'next/dynamic'
import Profile, { ProfileRef } from '@/components/Profile'
import BottomTabBar from '@/components/BottomTabBar'
import PortfolioContent from '@/components/tabs/PortfolioContent'
import MobileBanner from '@/components/MobileBanner'
import LoadingState from '@/components/LoadingState'
import { createClient } from '@/lib/supabase/client'
import { useMobileState } from '@/lib/responsive'

const ResumeTab = dynamic(() => import('@/components/tabs/ResumeTab'), { ssr: false })

type Collection = {
  slug: string
  name: string
}

type ContentTab = {
  id: string
  title: string
}

const isCollectionTab = (tab: string, collections: Collection[]) =>
  collections.some(c => c.slug === tab)

export default function HomeClient() {
  const supabase = useMemo(() => createClient(), [])
  const { isMobile } = useMobileState()
  const [activeTab, setActiveTab] = useState<string>('portfolio')
  const [activeCollections, setActiveCollections] = useState<Collection[]>([])
  const [activeContents, setActiveContents] = useState<ContentTab[]>([])
  const [selectedContentId, setSelectedContentId] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const [showIntro, setShowIntro] = useState(false)
  const [profileHeight, setProfileHeight] = useState<number>(0)
  const [portfolioContentTitle, setPortfolioContentTitle] = useState<string | null>(null)
  const [portfolioContentId, setPortfolioContentId] = useState<string | null>(null)
  const [portfolioContentType, setPortfolioContentType] = useState<string | null>(null)
  const [portfolioContentDownloadEnabled, setPortfolioContentDownloadEnabled] = useState<boolean | null>(null)
  const [portfolioContentDesc, setPortfolioContentDesc] = useState<string | null>(null)
  const [portfolioContentYear, setPortfolioContentYear] = useState<number | null>(null)
  const [portfolioContentThumbnail, setPortfolioContentThumbnail] = useState<string | null>(null)
  const [portfolioCollectionName, setPortfolioCollectionName] = useState<string | null>(null)
  const [portfolioCollectionSlug, setPortfolioCollectionSlug] = useState<string | null>(null)
  const [portfolioCollectionDesc, setPortfolioCollectionDesc] = useState<string | null>(null)
  const [portfolioCollectionThumbnails, setPortfolioCollectionThumbnails] = useState<string[]>([])
  const [resumeAvailable, setResumeAvailable] = useState<boolean>(false)
  const [resumeFocusEntryId, setResumeFocusEntryId] = useState<string | null>(null)
  const [resumeNowMarkerVisible, setResumeNowMarkerVisible] = useState<boolean>(true)
  const [resumeHasExpandedSideEntry, setResumeHasExpandedSideEntry] = useState<boolean>(false)
  const [portfolioMenuExpanded, setPortfolioMenuExpanded] = useState<boolean>(true)
  const [isProfileExpanded, setIsProfileExpanded] = useState<boolean>(true)
  // State memory for Portfolio tab to persist across remounts
  const [savedPortfolioMenuState, setSavedPortfolioMenuState] = useState<{
    pageState: 'expanded-empty' | 'expanded-reader' | 'collapsed-reader' | null
    contentId: string | null
    categoryId: string | null
    subcategoryId: string | null
  }>({ pageState: null, contentId: null, categoryId: null, subcategoryId: null })
  // On desktop, external triggers (BlockNote buttons, Resume side cards, shared URLs)
  // activate items inside the dynamic menu instead of opening legacy tabs.
  const [externalMenuContentId, setExternalMenuContentId] = useState<string | null>(null)
  const [externalMenuCollectionSlug, setExternalMenuCollectionSlug] = useState<string | null>(null)
  // Portfolio nav scenario triggers (desktop only).
  const [portfolioToggleTrigger, setPortfolioToggleTrigger] = useState(0)
  const [portfolioExpandTrigger, setPortfolioExpandTrigger] = useState(0)
  const [externalMenuCardSelect, setExternalMenuCardSelect] = useState<{ id: string; type: 'category' | 'subcategory' | 'collection' } | null>(null)

  const profileRef = useRef<ProfileRef>(null)
  const urlAppliedRef = useRef(false)
  const urlAnimatingRef = useRef(false)
  const urlAnimationTimersRef = useRef<ReturnType<typeof setTimeout>[]>([])
  const lastDownloadContextRef = useRef<{
    contentTitle: string | null
    contentId: string | null
    contentType: string | null
    downloadEnabled: boolean | null
    contentDesc: string | null
    contentYear: number | null
    contentThumbnail: string | null
    collectionName: string | null
    collectionSlug: string | null
    collectionDesc: string | null
    collectionThumbnails: string[]
  } | null>(null)

  const handleDownloadContextChange = useCallback(({
    contentTitle,
    contentId,
    contentType,
    downloadEnabled,
    contentDesc,
    contentYear,
    contentThumbnail,
    collectionName,
    collectionSlug,
    collectionDesc,
    collectionThumbnails,
  }: {
    contentTitle: string | null
    contentId: string | null
    contentType: string | null
    downloadEnabled: boolean | null
    contentDesc: string | null
    contentYear: number | null
    contentThumbnail: string | null
    collectionName: string | null
    collectionSlug: string | null
    collectionDesc: string | null
    collectionThumbnails: string[]
  }) => {
    const prev = lastDownloadContextRef.current
    if (
      prev &&
      prev.contentTitle === contentTitle &&
      prev.contentId === contentId &&
      prev.contentType === contentType &&
      prev.downloadEnabled === downloadEnabled &&
      prev.contentDesc === contentDesc &&
      prev.contentYear === contentYear &&
      prev.contentThumbnail === contentThumbnail &&
      prev.collectionName === collectionName &&
      prev.collectionSlug === collectionSlug &&
      prev.collectionDesc === collectionDesc &&
      prev.collectionThumbnails.length === collectionThumbnails.length &&
      prev.collectionThumbnails.every((t, i) => t === collectionThumbnails[i])
    ) {
      return
    }
    lastDownloadContextRef.current = { contentTitle, contentId, contentType, downloadEnabled, contentDesc, contentYear, contentThumbnail, collectionName, collectionSlug, collectionDesc, collectionThumbnails }

    setPortfolioContentTitle(contentTitle)
    setPortfolioContentId(contentId)
    setPortfolioContentType(contentType)
    setPortfolioContentDownloadEnabled(downloadEnabled)
    setPortfolioContentDesc(contentDesc)
    setPortfolioContentYear(contentYear)
    setPortfolioContentThumbnail(contentThumbnail)
    setPortfolioCollectionName(collectionName)
    setPortfolioCollectionSlug(collectionSlug)
    setPortfolioCollectionDesc(collectionDesc)
    setPortfolioCollectionThumbnails(collectionThumbnails)

    if (contentId) {
      setActiveContents(prevTabs =>
        prevTabs.map(tab => tab.id === contentId && tab.title !== contentTitle && contentTitle
          ? { ...tab, title: contentTitle }
          : tab
        )
      )
    }
  }, [])

  const activeContent = activeContents.find(c => c.id === activeTab) || null
  const activeCollection = activeCollections.find(c => c.slug === activeTab) || null
  const isActiveContentTab = activeContents.some(c => c.id === activeTab)
  const currentContentTitle =
    activeContent?.title ||
    ((activeTab === 'portfolio' || isCollectionTab(activeTab, activeCollections)) && !portfolioMenuExpanded
      ? portfolioContentTitle
      : null)
  const currentContentId =
    activeContent?.id ||
    (activeTab === 'portfolio' || isCollectionTab(activeTab, activeCollections)
      ? portfolioContentId
      : null)
  const isPortfolioLikeTab = activeTab === 'portfolio' || isCollectionTab(activeTab, activeCollections) || isActiveContentTab
  const shouldCondenseProfile =
    (isPortfolioLikeTab && !portfolioMenuExpanded) ||
    (activeTab === 'resume' && (!resumeNowMarkerVisible || resumeHasExpandedSideEntry))

  useEffect(() => {
    setMounted(true)
    // Show intro only on desktop, root URL, once per session
    if (typeof window !== 'undefined' && !sessionStorage.getItem('intro_seen')) {
      const url = new URL(window.location.href)
      const hasUrlParam = url.searchParams.has('content') || url.searchParams.has('collection') || url.searchParams.has('tab')
      const isRootUrl = url.pathname === '/'
      if (isRootUrl && !hasUrlParam) {
        setShowIntro(true)
      }
    }
    return () => { urlAnimationTimersRef.current.forEach(clearTimeout) }
  }, [])

  useEffect(() => {
    getLinkedPdfId('resume', null).then(id => setResumeAvailable(!!id))
  }, [])

  useEffect(() => {
    if (!mounted || typeof window === 'undefined') return
    if (urlAppliedRef.current) return
    urlAppliedRef.current = true
    try {
      const url = new URL(window.location.href)
      const tab = url.searchParams.get('tab')
      const contentId = url.searchParams.get('content')
      const collectionSlug = url.searchParams.get('collection')

      if (tab === 'resume') {
        setActiveTab('resume')
      }

      if (contentId) {
        if (!isMobile) {
          urlAnimatingRef.current = true
          const t1 = setTimeout(() => {
            profileRef.current?.collapse()
            setActiveTab('portfolio')
          }, 1000)
          const t2 = setTimeout(() => {
            setExternalMenuContentId(contentId)
            urlAnimatingRef.current = false
          }, 2000)
          urlAnimationTimersRef.current = [t1, t2]
        } else {
          setActiveContents(prev => {
            if (prev.find(c => c.id === contentId)) return prev
            return [...prev, { id: contentId, title: 'Loading…' }]
          })
          setActiveTab(contentId)
        }
      } else if (collectionSlug) {
        if (!isMobile) {
          urlAnimatingRef.current = true
          const t1 = setTimeout(() => {
            profileRef.current?.collapse()
            setExternalMenuCollectionSlug(collectionSlug)
            setActiveTab('portfolio')
            urlAnimatingRef.current = false
          }, 1000)
          urlAnimationTimersRef.current = [t1]
        } else {
          setActiveCollections(prev => {
            if (prev.find(c => c.slug === collectionSlug)) return prev
            return [...prev, { slug: collectionSlug, name: collectionSlug }]
          })
          setActiveTab(collectionSlug)
        }
      }
    } catch (err) {
      console.error('Failed to apply URL params', err)
    }
    return () => { urlAnimationTimersRef.current.forEach(clearTimeout) }
  }, [mounted, isMobile])

  // Toggle body.menu-expanded class when menu expands
  useEffect(() => {
    if (typeof document === 'undefined') return
    if (portfolioMenuExpanded) {
      document.body.classList.add('menu-expanded')
    } else {
      document.body.classList.remove('menu-expanded')
    }
    return () => { document.body.classList.remove('menu-expanded') }
  }, [portfolioMenuExpanded])

  const handleTabChange = (tab: string) => {
    if (urlAnimatingRef.current) return
    // Collapse profile whenever Portfolio or Resume is clicked
    if ((tab === 'portfolio' || tab === 'resume') && profileRef.current) {
      profileRef.current.collapse()
    }
    setActiveTab(tab)
    setSelectedContentId(null)
    // Already on portfolio tab → trigger toggle instead of full re-navigation
    if (tab === 'portfolio' && activeTab === 'portfolio' && !isMobile) {
      setPortfolioToggleTrigger(n => n + 1)
    }
  }

  // Profile portfolio plane click — always expands, never collapses.
  const handleSwitchToPortfolio = () => {
    if (urlAnimatingRef.current) return
    setActiveTab('portfolio')
    if (!isMobile) setPortfolioExpandTrigger(n => n + 1)
  }

  const handleOpenCollection = (slug: string, name: string) => {
    if (!isMobile) {
      setExternalMenuCollectionSlug(slug)
      setActiveTab('portfolio')
      return
    }
    // Mobile: open collection tab
    if (!activeCollections.find(c => c.slug === slug)) {
      setActiveCollections(prev => [...prev, { slug, name }])
    }
    setActiveTab(slug)
  }

  const handleOpenContent = (id: string, title: string) => {
    // Mobile from Resume tab: switch to Portfolio and auto-select content
    if (isMobile && activeTab === 'resume') {
      setSelectedContentId(id)
      setTimeout(() => {
        setActiveTab('portfolio')
      }, 0)
      return
    }

    // Desktop: activate content inside the menu (opens reader + collapsed bar)
    if (!isMobile) {
      setExternalMenuContentId(id)
      setActiveTab('portfolio')
      return
    }

    // Mobile: open content in its own tab
    if (!activeContents.find(c => c.id === id)) {
      setActiveContents(prev => [...prev, { id, title }])
    }
    setActiveTab(id)
  }

  const handleCollectionClick = (collection: { slug: string; name: string }) => {
    handleOpenCollection(collection.slug, collection.name)
  }

  // Listen for tab-open events dispatched by Button blocks in renderer mode.
  // Using refs so the listener is registered only once but always calls the
  // latest version of each handler.
  const openCollectionRef = useRef(handleOpenCollection)
  openCollectionRef.current = handleOpenCollection
  const openContentRef = useRef(handleOpenContent)
  openContentRef.current = handleOpenContent

  useEffect(() => {
    const onOpenCollection = (e: Event) => {
      const { slug, name } = (e as CustomEvent<{ slug: string; name: string }>).detail
      openCollectionRef.current(slug, name)
    }
    const onOpenContent = (e: Event) => {
      const { id, title } = (e as CustomEvent<{ id: string; title: string }>).detail
      openContentRef.current(id, title)
    }
    window.addEventListener('bn-button-open-collection', onOpenCollection)
    window.addEventListener('bn-button-open-content', onOpenContent)
    return () => {
      window.removeEventListener('bn-button-open-collection', onOpenCollection)
      window.removeEventListener('bn-button-open-content', onOpenContent)
    }
  }, [])

  async function fetchResumePdfBlob(): Promise<Blob | null> {
    const resumePdfId = await getLinkedPdfId('resume', null)
    if (!resumePdfId) return null
    const { data } = await supabase.from('custom_pdfs').select('file_url').eq('id', resumePdfId).single()
    if (!data?.file_url) return null
    try {
      const res = await fetch(data.file_url)
      if (!res.ok) return null
      return res.blob()
    } catch {
      return null
    }
  }

  async function mergePdfs(mainBlob: Blob, resumeBlob: Blob): Promise<Blob> {
    const { PDFDocument } = await import('pdf-lib')
    const [mainBytes, resumeBytes] = await Promise.all([
      mainBlob.arrayBuffer(),
      resumeBlob.arrayBuffer(),
    ])
    // Resume goes first, content follows
    const resumeDoc = await PDFDocument.load(resumeBytes)
    const mainDoc = await PDFDocument.load(mainBytes)
    const copiedPages = await resumeDoc.copyPages(mainDoc, mainDoc.getPageIndices())
    copiedPages.forEach(page => resumeDoc.addPage(page))
    const mergedBytes = await resumeDoc.save()
    return new Blob([mergedBytes.buffer as ArrayBuffer], { type: 'application/pdf' })
  }

  async function handleDownload(target: 'resume' | 'content' | 'collection', includeResume = false) {
    const { generateArticlePDF, generateCollectionPDF } = await import('@/lib/pdf-generator')
    const downloadBlob = (blob: Blob, name: string) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }

    if (target === 'content') {
      const contentId = currentContentId
      if (!contentId) {
        throw new Error('No content selected')
      }
      const { data, error } = await supabase
        .from('content')
        .select('id, title, type, download_enabled, download_source, external_download_url, custom_pdf_id, image_url, video_url, audio_url')
        .eq('id', contentId)
        .single()
      if (error || !data) {
        throw new Error('Failed to load content download settings')
      }
      if (!data.download_enabled) {
        alert('Downloads are disabled for this content.')
        return
      }

      const resolvedSource =
        data.download_source ||
        (data.custom_pdf_id ? 'custom' : data.external_download_url ? 'external' : 'generated')

      if (resolvedSource === 'external') {
        if (!data.external_download_url) {
          alert('External download link is missing.')
          return
        }
        window.open(data.external_download_url, '_blank')
        return
      }

      if (resolvedSource === 'custom') {
        const customPdfId = data.custom_pdf_id || null
        const linkedPdfId = customPdfId || (await getLinkedPdfId('content', contentId))
        if (!linkedPdfId) {
          alert('Custom PDF is not set.')
          return
        }
        if (includeResume) {
          const { data: customPdf } = await supabase.from('custom_pdfs').select('file_url, file_name').eq('id', linkedPdfId).single()
          if (customPdf?.file_url) {
            const [mainRes, resumeBlob] = await Promise.all([fetch(customPdf.file_url), fetchResumePdfBlob()])
            if (mainRes.ok && resumeBlob) {
              const merged = await mergePdfs(await mainRes.blob(), resumeBlob)
              const safeName = (data.title || 'content').replace(/[^a-z0-9]/gi, '_')
              downloadBlob(merged, `AndreyBeregovskiy_${safeName}_with_resume.pdf`)
              return
            }
          }
        }
        const didDownload = await downloadCustomPdfById(linkedPdfId)
        if (!didDownload) {
          throw new Error('Custom PDF not found')
        }
        return
      }

      if (data.type === 'article') {
        const blob = await generateArticlePDF(contentId)
        const safeName = (data.title || 'content').replace(/[^a-z0-9]/gi, '_')
        if (includeResume) {
          const resumeBlob = await fetchResumePdfBlob()
          if (resumeBlob) {
            const merged = await mergePdfs(blob, resumeBlob)
            downloadBlob(merged, `AndreyBeregovskiy_${safeName}_with_resume.pdf`)
            return
          }
        }
        downloadBlob(blob, `AndreyBeregovskiy_${safeName}.pdf`)
        return
      }

      const mediaUrl = data.image_url || data.video_url || data.audio_url
      if (mediaUrl) {
        const link = document.createElement('a')
        link.href = mediaUrl
        link.download = data.title || 'content'
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
      return
    }

    if (target === 'resume') {
      const safeName = 'AndreyBeregovskiy_Resume'
      const resumePdfId = await getLinkedPdfId('resume', null)
      if (resumePdfId) {
        const didDownload = await downloadCustomPdfById(resumePdfId)
        if (didDownload) return
      }
      const placeholder = new Blob(
        ['Resume PDF generation is not implemented yet.'],
        { type: 'application/pdf' }
      )
      downloadBlob(placeholder, `${safeName}.pdf`)
      return
    }

    if (target === 'collection') {
      const collSlug = activeCollection?.slug || portfolioCollectionSlug
      const collDisplayName = activeCollection?.name || portfolioCollectionName
      if (!collSlug) {
        throw new Error('No collection selected')
      }
      const { data: collectionData, error: collectionError } = await supabase
        .from('collections')
        .select('id, name')
        .eq('slug', collSlug)
        .single()
      if (collectionError || !collectionData) {
        throw new Error('Collection not found')
      }
      const linkedPdfId = await getLinkedPdfId('collection', collectionData.id)
      if (linkedPdfId) {
        if (includeResume) {
          const { data: customPdf } = await supabase.from('custom_pdfs').select('file_url').eq('id', linkedPdfId).single()
          if (customPdf?.file_url) {
            const [mainRes, resumeBlob] = await Promise.all([fetch(customPdf.file_url), fetchResumePdfBlob()])
            if (mainRes.ok && resumeBlob) {
              const collectionName = collectionData.name || collDisplayName || 'Collection'
              const safeName = collectionName.replace(/[^a-z0-9]/gi, '_') || 'Collection'
              const merged = await mergePdfs(await mainRes.blob(), resumeBlob)
              downloadBlob(merged, `AndreyBeregovskiy_${safeName}_with_resume.pdf`)
              return
            }
          }
        }
        const didDownload = await downloadCustomPdfById(linkedPdfId)
        if (didDownload) return
      }
      const collectionName = collectionData.name || collDisplayName || 'Collection'
      const safeName = collectionName.replace(/[^a-z0-9]/gi, '_') || 'Collection'
      const blob = await generateCollectionPDF(collSlug)
      if (includeResume) {
        const resumeBlob = await fetchResumePdfBlob()
        if (resumeBlob) {
          const merged = await mergePdfs(blob, resumeBlob)
          downloadBlob(merged, `AndreyBeregovskiy_${safeName}_with_resume.pdf`)
          return
        }
      }
      downloadBlob(blob, `AndreyBeregovskiy_${safeName}.pdf`)
      return
    }
  }

  async function getLinkedPdfId(targetType: 'content' | 'collection' | 'resume', targetId: string | null) {
    const query = supabase
      .from('custom_pdf_links')
      .select('pdf_id')
      .eq('target_type', targetType)
      .limit(1)
    if (targetId) {
      query.eq('target_id', targetId)
    } else {
      query.is('target_id', null)
    }
    const { data, error } = await query
    if (error) {
      if (error.code === '42P01') {
        return null
      }
      console.error('Failed to load custom PDF link', error)
      return null
    }
    return data?.[0]?.pdf_id || null
  }

  async function downloadCustomPdfById(pdfId: string) {
    const { data: customPdf, error } = await supabase
      .from('custom_pdfs')
      .select('file_url, file_name')
      .eq('id', pdfId)
      .single()
    if (error || !customPdf) {
      return false
    }
    const link = document.createElement('a')
    link.href = customPdf.file_url
    link.download = customPdf.file_name
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    return true
  }

  const isPortfolioOrCollection = activeTab === 'portfolio' || (!['portfolio', 'resume'].includes(activeTab) && !activeContents.find(c => c.id === activeTab))

  const renderContent = () => {
    switch (activeTab) {
      case 'resume':
        return (
          <ResumeTab
            onOpenCollection={handleOpenCollection}
            onOpenContent={handleOpenContent}
            profileHeight={profileHeight}
            onNowMarkerInViewChange={setResumeNowMarkerVisible}
            onSideEntryExpandedChange={setResumeHasExpandedSideEntry}
            focusEntryId={resumeFocusEntryId}
          />
        )

      case 'portfolio':
      default:
        return (
          <PortfolioContent
            activeTab={activeTab}
            activeCollections={activeCollections}
            activeContents={activeContents}
            onCollectionClick={handleCollectionClick}
            profileHeight={profileHeight}
            onDownloadContextChange={handleDownloadContextChange}
            onMenuExpandedChange={setPortfolioMenuExpanded}
            selectedContentIdFromResume={selectedContentId}
            onContentSelectedFromResume={() => setSelectedContentId(null)}
            externalActiveContentId={externalMenuContentId}
            externalActiveCollectionSlug={externalMenuCollectionSlug}
            savedMenuState={savedPortfolioMenuState.pageState}
            savedSelectedContentId={savedPortfolioMenuState.contentId}
            savedSelectedCategoryId={savedPortfolioMenuState.categoryId}
            savedSelectedSubcategoryId={savedPortfolioMenuState.subcategoryId}
            onSaveMenuState={(state) => {
              setSavedPortfolioMenuState(state)
            }}
            portfolioToggleTrigger={portfolioToggleTrigger}
            portfolioExpandTrigger={portfolioExpandTrigger}
            externalMenuCardSelect={externalMenuCardSelect}
            onExternalMenuCardSelectConsumed={() => setExternalMenuCardSelect(null)}
            onExternalContentConsumed={() => setExternalMenuContentId(null)}
            onExternalCollectionConsumed={() => setExternalMenuCollectionSlug(null)}
            isProfileExpanded={isProfileExpanded}
          />
        )
    }
  }

  const handleIntroDone = useCallback(() => {
    sessionStorage.setItem('intro_seen', '1')
    setShowIntro(false)
  }, [])

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: 'var(--bg-main)' }}>
      {showIntro && !isMobile && (
        <LoadingState onDone={handleIntroDone} />
      )}
      <Profile
        ref={profileRef}
        onHeightChange={setProfileHeight}
        onOpenCollection={handleOpenCollection}
        condensedMode={shouldCondenseProfile}
        onExpandedChange={setIsProfileExpanded}
        onSwitchToPortfolio={handleSwitchToPortfolio}
        onSwitchToResume={(entryId?: string) => { setResumeFocusEntryId(entryId ?? null); handleTabChange('resume') }}
        onCardSelect={!isMobile ? (id, type) => { setActiveTab('portfolio'); setExternalMenuCardSelect({ id, type }) } : undefined}
      />
      {/* Covers the 1-frame gap that appears between the profile bottom and the
          collapsed menu top during the condensing animation. The ResizeObserver
          chain lags ~1 frame behind Framer Motion's DOM updates, so the page
          background briefly shows through. This div sits below both (z-29) and
          fills that strip with the profile's own background color. */}
      {!isMobile && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            height: profileHeight || 0,
            backgroundColor: '#121212',
            zIndex: 29,
            pointerEvents: 'none',
          }}
        />
      )}

      {isPortfolioOrCollection ? (
        renderContent()
      ) : (
        <div className="flex-1 flex" style={{ paddingBottom: '96px' }}>
          <div className="w-full p-8">
            {renderContent()}
          </div>
        </div>
      )}

      <BottomTabBar
        activeTab={activeTab}
        collections={activeCollections}
        contentTabs={activeContents}
        onTabChange={handleTabChange}
        currentContentTitle={currentContentTitle}
        currentContentType={portfolioContentType}
        currentContentId={currentContentId}
        currentContentDownloadEnabled={portfolioContentDownloadEnabled}
        currentContentDesc={portfolioContentDesc}
        currentContentYear={portfolioContentYear}
        currentContentThumbnail={portfolioContentThumbnail}
        currentCollectionName={activeCollection?.name || portfolioCollectionName || null}
        currentCollectionSlug={activeCollection?.slug || portfolioCollectionSlug || null}
        currentCollectionDesc={portfolioCollectionDesc}
        currentCollectionThumbnails={portfolioCollectionThumbnails}
        resumeAvailable={resumeAvailable}
        onDownload={handleDownload}
        isMenuExpanded={portfolioMenuExpanded}
        isProfileExpanded={isProfileExpanded}
      />

      <MobileBanner />
    </div>
  )
}
