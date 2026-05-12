'use client'

import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import { AnimatePresence } from 'framer-motion'
import { createClient } from '@/lib/supabase/client'
import MainMenu from '@/components/tabs/MainMenu'
import ContentReader from '@/components/ContentReader'
import InfoMenu from '@/components/InfoMenu'
import { DynamicMenu } from '@/components/dynamic-menu/DynamicMenu'
import { Skeleton } from '@/components/ui/skeleton'
import Loader from '@/components/Loader'
import { useMobileState } from '@/lib/responsive'


type PageState = 'expanded-empty' | 'expanded-reader' | 'collapsed-reader'

interface ContentTab {
  id: string
  title: string
}

interface Category {
  id: string
  name: string
  order_index: number
  short_title?: string | null
  short_desc?: string | null
  desc?: string | null
}

interface Subcategory {
  id: string
  category_id: string
  name: string
  order_index: number
  short_title?: string | null
  short_desc?: string | null
  peri_desc?: string | null
  desc?: string | null
}

interface Collection {
  id: string
  slug: string
  name: string
  description?: any
  order_index: number
  featured: boolean
  short_title?: string | null
  short_desc?: string | null
  desc?: string | null
}

interface ContentItemRaw {
  id: string
  title: string
  subtitle: string | null
  sidebar_title: string | null
  sidebar_subtitle: string | null
  type: string
  content_body?: any
  download_enabled: boolean
  image_sizes?: Record<string, { width?: number; height?: number }>
  image_url: string | null
  video_url: string | null
  audio_url: string | null
  publication_name: string | null
  publication_date: string | null
  author_name: string | null
  source_link: string | null
  featured: boolean
  order_index: number
  subcategory_id: string
  byline_style: string | null
  link_style: string | null
  short_title?: string | null
  short_desc?: string | null
  peri_desc?: string | null
  desc?: string | null
  menu_thumbnail_url?: string | null
  categories?: { id: string; name: string }[] | null
  subcategories?: { id: string; name: string; category_id: string }[] | null
  byline_options?: { id: string; option_text: string } | { id: string; option_text: string }[] | null
  link_options?: { id: string; option_text: string } | { id: string; option_text: string }[] | null
  content_collections?: { collection_id: string; collections: { slug: string; name: string }[] }[] | null
}

interface ContentItem {
  id: string
  type: string
  category_id: string
  subcategory_id: string
  title: string
  subtitle: string | null
  sidebar_title: string | null
  sidebar_subtitle: string | null
  featured: boolean
  byline_style: string | null
  link_style: string | null
  download_enabled?: boolean
  content_body?: any
  image_sizes?: Record<string, { width?: number; height?: number }>
  image_url?: string
  video_url?: string
  audio_url?: string
  author_name?: string
  publication_name?: string
  publication_date?: string
  source_link?: string
  original_source_url?: string
  order_index?: number
  created_at?: string
  publication_year?: number | null
  byline_style_text?: string | null
  link_style_text?: string | null
  category_name?: string
  subcategory_name?: string
  collection_slugs?: string[]
  collection_names?: string[]
  short_title?: string | null
  short_desc?: string | null
  peri_desc?: string | null
  desc?: string | null
  menu_thumbnail_url?: string | null
}

interface CollectionTab {
  slug: string
  name: string
}


interface PortfolioContentProps {
  activeTab: string
  activeCollections: CollectionTab[]
  activeContents: ContentTab[]
  onCollectionClick: (collection: { slug: string; name: string }) => void
  profileHeight: number
  onDownloadContextChange?: (context: { contentTitle: string | null; contentId: string | null; contentType: string | null; downloadEnabled: boolean | null; contentDesc: string | null; contentYear: number | null; contentThumbnail: string | null; collectionName: string | null; collectionSlug: string | null; collectionDesc: string | null; collectionThumbnails: string[] }) => void
  onMenuExpandedChange?: (isExpanded: boolean) => void
  selectedContentIdFromResume?: string | null // Content ID to auto-select when coming from Resume (mobile only)
  onContentSelectedFromResume?: () => void // Callback to clear the selectedContentId after selection
  /** Content ID activated externally (BlockNote, shared URL, resume side card on desktop with new menu) */
  externalActiveContentId?: string | null
  /** Collection slug activated externally (BlockNote, shared URL) */
  externalActiveCollectionSlug?: string | null
  // State memory props to persist across remounts
  savedMenuState?: PageState | null // Saved menu state from previous visit
  savedSelectedContentId?: string | null // Saved content ID from previous visit
  savedSelectedCategoryId?: string | null // Saved category ID from previous visit
  savedSelectedSubcategoryId?: string | null // Saved subcategory ID from previous visit
  onSaveMenuState?: (state: { pageState: PageState | null; contentId: string | null; categoryId: string | null; subcategoryId: string | null }) => void // Callback to save menu state
  /** Increments each time the PORTFOLIO bottom nav button is pressed while already on the portfolio tab. */
  portfolioToggleTrigger?: number
  /** Increments each time the profile portfolio plane is clicked (always expand, never collapse). */
  portfolioExpandTrigger?: number
  /** Triggers a reset + pre-selection from a profile plane card (Scenario 3). */
  externalMenuCardSelect?: { id: string; type: 'category' | 'subcategory' | 'collection' } | null
  onExternalMenuCardSelectConsumed?: () => void
  onExternalContentConsumed?: () => void
  onExternalCollectionConsumed?: () => void
  isProfileExpanded?: boolean
}


export default function PortfolioContent({
  activeTab,
  activeCollections,
  activeContents,
  onCollectionClick,
  profileHeight,
  onDownloadContextChange,
  onMenuExpandedChange,
  selectedContentIdFromResume = null,
  onContentSelectedFromResume,
  externalActiveContentId = null,
  externalActiveCollectionSlug = null,
  savedMenuState = null,
  savedSelectedContentId = null,
  savedSelectedCategoryId = null,
  savedSelectedSubcategoryId = null,
  onSaveMenuState,
  portfolioToggleTrigger = 0,
  portfolioExpandTrigger = 0,
  externalMenuCardSelect = null,
  onExternalMenuCardSelectConsumed,
  onExternalContentConsumed,
  onExternalCollectionConsumed,
  isProfileExpanded = false,
}: PortfolioContentProps) {
  const { isMobile } = useMobileState()
  const [pageState, setPageState] = useState<PageState>('expanded-empty')
  const menuBarRef = useRef<HTMLDivElement | null>(null)
  const [collapsedMenuHeight, setCollapsedMenuHeight] = useState<number>(0)
  const lastMenuStateRef = useRef<PageState | null>(null) // Remember menu state when leaving Portfolio
  const lastSelectedContentRef = useRef<ContentItem | null>(null) // Remember selected content when leaving Portfolio
  const lastSelectedCategoryRef = useRef<Category | null>(null) // Remember selected category when leaving Portfolio
  const lastSelectedSubcategoryRef = useRef<Subcategory | null>(null) // Remember selected subcategory when leaving Portfolio
  const dataLoadedRef = useRef<boolean>(false) // Track if data has been loaded to prevent re-loading on tab switches
  const [justWentBackFromContent, setJustWentBackFromContent] = useState<boolean>(false) // Track if we just went back from content
  const justWentBackRef = useRef<boolean>(false) // Ref for immediate synchronous access
  const isAutoSelectingFromResumeRef = useRef<boolean>(false) // Track if we're auto-selecting content from Resume
  const justAutoSelectedFromResumeRef = useRef<boolean>(false) // Track if we just completed auto-selection (to prevent reset)
  const isRestoringFromTabSwitchRef = useRef<boolean>(false) // Track if we're restoring content from a tab switch

  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null)
  const [selectedSubcategory, setSelectedSubcategory] = useState<Subcategory | null>(null)
  const [selectedContent, setSelectedContent] = useState<ContentItem | null>(null)
  const [selectedCollection, setSelectedCollection] = useState<Collection | null>(null)
  const [selectedCollectionThumbnails, setSelectedCollectionThumbnails] = useState<string[]>([])
  
  // Refs to store current state for cleanup function (always up-to-date)
  const pageStateRef = useRef<PageState>(pageState)
  const selectedContentRef = useRef<ContentItem | null>(selectedContent)
  const selectedCategoryRef = useRef<Category | null>(selectedCategory)
  const selectedSubcategoryRef = useRef<Subcategory | null>(selectedSubcategory)
  
  // Keep refs in sync with state
  useEffect(() => {
    pageStateRef.current = pageState
  }, [pageState])
  
  useEffect(() => {
    selectedContentRef.current = selectedContent
  }, [selectedContent])
  
  useEffect(() => {
    selectedCategoryRef.current = selectedCategory
  }, [selectedCategory])
  
  useEffect(() => {
    selectedSubcategoryRef.current = selectedSubcategory
  }, [selectedSubcategory])

  const [titleInView, setTitleInView] = useState<boolean>(true)
  const [subtitleInView, setSubtitleInView] = useState<boolean>(true)

  const [categories, setCategories] = useState<Category[]>([])
  const [subcategories, setSubcategories] = useState<Subcategory[]>([])
  const [content, setContent] = useState<ContentItem[]>([])
  const [collections, setCollections] = useState<Collection[]>([])

  const contentCacheRef = useRef<Map<string, ContentItem>>(new Map())
  const contentFetchInFlightRef = useRef<Set<string>>(new Set())
  const filteredContentCacheRef = useRef<Map<string, ContentItem[]>>(new Map())
  const filteredSubcategoriesCacheRef = useRef<Map<string, Subcategory[]>>(new Map())
  const filteredCategoriesCacheRef = useRef<Map<string, Category[]>>(new Map())

  const buildTabCacheKey = useCallback(() => {
    const collectionKey = activeCollections.map(c => c.slug).join(',')
    const contentKey = activeContents.map(c => c.id).join(',')
    const contentIdsKey = content.map(c => c.id).join(',')
    const subcatIdsKey = subcategories.map(s => s.id).join(',')
    const catIdsKey = categories.map(c => c.id).join(',')
    return `${activeTab}::${collectionKey}::${contentKey}::${contentIdsKey}::${subcatIdsKey}::${catIdsKey}`
  }, [activeTab, activeCollections, activeContents, content, subcategories, categories])

  
  const filteredContent = useMemo(() => {
    const cacheKey = buildTabCacheKey()
    const cached = filteredContentCacheRef.current.get(cacheKey)
    if (cached) return cached
    let result: ContentItem[]
    if (isContentTab(activeTab, activeContents)) {
      result = content.filter(item => item.id === activeTab)
    } else if (isCollectionTab(activeTab, activeCollections)) {
      const collectionSlug = getCurrentCollectionSlug(activeTab, activeCollections)
      result = collectionSlug ? filterContentByCollection(content, collectionSlug) : content
    } else {
      result = content
    }
    filteredContentCacheRef.current.set(cacheKey, result)
    return result
  }, [content, activeTab, activeCollections, activeContents, buildTabCacheKey])
  
  const filteredSubcategories = useMemo(() => {
    const cacheKey = buildTabCacheKey()
    const cached = filteredSubcategoriesCacheRef.current.get(cacheKey)
    if (cached) return cached
    let result: Subcategory[]
    if (filteredContent.length === 0 && (isCollectionTab(activeTab, activeCollections) || isContentTab(activeTab, activeContents))) {
      result = []
    } else if (isCollectionTab(activeTab, activeCollections)) {
      result = filterSubcategoriesByCollection(subcategories, filteredContent)
    } else if (isContentTab(activeTab, activeContents)) {
      const ids = new Set(
        filteredContent
          .map(item => item.subcategory_id)
          .filter((id): id is string => !!id)
      )
      result = subcategories.filter(s => ids.has(s.id))
    } else {
      const contentSubIds = new Set(content.map(item => item.subcategory_id).filter((id): id is string => !!id))
      result = subcategories.filter(s => contentSubIds.has(s.id))
    }
    filteredSubcategoriesCacheRef.current.set(cacheKey, result)
    return result
  }, [subcategories, filteredContent, activeTab, activeCollections, activeContents, buildTabCacheKey])
  
  const filteredCategories = useMemo(() => {
    const cacheKey = buildTabCacheKey()
    const cached = filteredCategoriesCacheRef.current.get(cacheKey)
    if (cached) return cached
    let result: Category[]
    if (filteredContent.length === 0 && (isCollectionTab(activeTab, activeCollections) || isContentTab(activeTab, activeContents))) {
      result = []
    } else if (isCollectionTab(activeTab, activeCollections)) {
      result = filterCategoriesByCollection(categories, subcategories, filteredContent)
    } else if (isContentTab(activeTab, activeContents)) {
      const subIds = new Set(
        filteredContent
          .map(item => item.subcategory_id)
          .filter((id): id is string => !!id)
      )
      const catIds = new Set(
        subcategories
          .filter(s => subIds.has(s.id))
          .map(s => s.category_id)
      )
      result = categories.filter(c => catIds.has(c.id))
    } else {
      const contentSubIds = new Set(content.map(item => item.subcategory_id).filter((id): id is string => !!id))
      const catIds = new Set(subcategories.filter(s => contentSubIds.has(s.id)).map(s => s.category_id))
      result = categories.filter(c => catIds.has(c.id))
    }
    filteredCategoriesCacheRef.current.set(cacheKey, result)
    return result
  }, [categories, subcategories, filteredContent, activeTab, activeCollections, activeContents, buildTabCacheKey])

  const [loadingCategories, setLoadingCategories] = useState(true)
  const [loadingContent, setLoadingContent] = useState(true)
  const [loadingCollections, setLoadingCollections] = useState(true)
  const [dataError, setDataError] = useState<string | null>(null)
  const [contentLoadError, setContentLoadError] = useState<string | null>(null)

  const supabase = useMemo(() => createClient(), [])

  useEffect(() => {
    setTitleInView(true)
    setSubtitleInView(true)
    setContentLoadError(null)
  }, [selectedContent?.id])

  useEffect(() => {
    if (!onMenuExpandedChange) return
    onMenuExpandedChange(pageState !== 'collapsed-reader')
  }, [pageState, onMenuExpandedChange])

  // Re-click on active Portfolio tab toggles expand/collapse (desktop only).
  useEffect(() => {
    if (!portfolioToggleTrigger || isMobile) return
    if (pageState === 'collapsed-reader') {
      setPageState('expanded-empty')
    } else if (selectedContent) {
      setPageState('collapsed-reader')
    }
    // if expanded with no content: do nothing
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolioToggleTrigger])

  // Profile portfolio plane click always expands the menu, never collapses (desktop only).
  useEffect(() => {
    if (!portfolioExpandTrigger || isMobile) return
    if (pageState === 'collapsed-reader') {
      setPageState('expanded-empty')
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [portfolioExpandTrigger])

  // Profile plane card click resets local selection; DynamicMenu handles pre-selection via its own effect.
  useEffect(() => {
    if (!externalMenuCardSelect || isMobile) return
    setSelectedContent(null)
    setPageState('expanded-empty')
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalMenuCardSelect])

  
  async function loadCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, order_index, short_title, short_desc, desc')
      .order('order_index', { ascending: true })
    
    if (error) throw new Error(`Failed to load categories: ${error.message}`)
    return data || []
  }
  
  async function loadSubcategories(): Promise<Subcategory[]> {
    const { data, error } = await supabase
      .from('subcategories')
      .select('id, name, order_index, category_id, short_title, short_desc, peri_desc, desc')
      .order('order_index', { ascending: true })
    
    if (error) throw new Error(`Failed to load subcategories: ${error.message}`)
    return data || []
  }

  async function loadContentPreview(): Promise<ContentItemRaw[]> {
    let query = supabase
      .from('content')
      .select(`
        id,
        title,
        subtitle,
        sidebar_title,
        sidebar_subtitle,
        type,
        download_enabled,
        image_url,
        video_url,
        audio_url,
        publication_name,
        publication_date,
        author_name,
        source_link,
        featured,
        order_index,
        subcategory_id,
        byline_style,
        link_style,
        short_title,
        short_desc,
        peri_desc,
        desc,
        menu_thumbnail_url,
        categories(id, name),
        subcategories(id, name, category_id),
        byline_options(id, option_text),
        link_options(id, option_text),
        content_collections(collection_id, collections(slug, name))
      `)
    const { data, error } = await query.order('order_index', { ascending: true })
    
    if (error) {
      throw new Error(`Failed to load content: ${error.message}`)
    }
    
    return data || []
  }

  async function loadContentDetails(contentId: string): Promise<ContentItem | null> {
    if (!contentId) return null
    if (contentCacheRef.current.has(contentId)) {
      return contentCacheRef.current.get(contentId) || null
    }
    if (contentFetchInFlightRef.current.has(contentId)) {
      return null
    }
    contentFetchInFlightRef.current.add(contentId)
    try {
      const { data, error } = await supabase
        .from('content')
        .select(`
          id,
          title,
          subtitle,
          sidebar_title,
          sidebar_subtitle,
          type,
          content_body,
          download_enabled,
          image_sizes,
          image_url,
          video_url,
          audio_url,
          publication_name,
          publication_date,
          author_name,
          source_link,
          featured,
          order_index,
          subcategory_id,
          byline_style,
          link_style,
          menu_thumbnail_url,
          short_title,
          short_desc,
          desc,
          categories(id, name),
          subcategories(id, name, category_id),
          byline_options(id, option_text),
          link_options(id, option_text),
          content_collections(collection_id, collections(slug, name))
        `)
        .eq('id', contentId)
        .maybeSingle()

      if (error) {
        throw new Error(`Failed to load content details: ${error.message}`)
      }
      if (!data) return null
      const transformed = transformContentItem(data)
      contentCacheRef.current.set(contentId, transformed)
      return transformed
    } finally {
      contentFetchInFlightRef.current.delete(contentId)
    }
  }

  async function loadCollections(): Promise<Collection[]> {
    const { data, error } = await supabase
      .from('collections')
      .select(`
        id,
        name,
        description,
        slug,
        order_index,
        featured,
        short_title,
        short_desc,
        desc
      `)
      .order('order_index', { ascending: true })
    
    if (error) throw new Error(`Failed to load collections: ${error.message}`)
    return data || []
  }

  
  function extractPublicationYear(publication_date: string | null): number | null {
    if (!publication_date) return null
    
    const yearMatch = publication_date.match(/\d{4}/)
    return yearMatch ? parseInt(yearMatch[0], 10) : null
  }
  
  function transformContentItem(raw: ContentItemRaw): ContentItem {
    const category = raw.categories?.[0] || null
    const subcategory = raw.subcategories?.[0] || null
    const bylineOption = Array.isArray(raw.byline_options) 
      ? raw.byline_options[0] || null
      : raw.byline_options || null
    const linkOption = Array.isArray(raw.link_options)
      ? raw.link_options[0] || null
      : raw.link_options || null
    
    const collectionSlugs: string[] = []
    const collectionNames: string[] = []
    
    if (raw.content_collections && raw.content_collections.length > 0) {
      raw.content_collections.forEach(cc => {
        const collections = Array.isArray(cc.collections) ? cc.collections : [cc.collections]
        collections.forEach(coll => {
          if (coll?.slug) collectionSlugs.push(coll.slug)
          if (coll?.name) collectionNames.push(coll.name)
        })
      })
    }
    
    const categoryId = subcategory?.category_id || ''
    
    return {
      id: raw.id,
      title: raw.title,
      subtitle: raw.subtitle,
      sidebar_title: raw.sidebar_title || null,
      sidebar_subtitle: raw.sidebar_subtitle || null,
      type: raw.type,
      content_body: raw.content_body,
      download_enabled: raw.download_enabled,
      image_sizes: raw.image_sizes || undefined,
      image_url: raw.image_url || undefined,
      video_url: raw.video_url || undefined,
      audio_url: raw.audio_url || undefined,
      publication_name: raw.publication_name || undefined,
      publication_date: raw.publication_date || undefined,
      author_name: raw.author_name || undefined,
      source_link: raw.source_link || undefined,
      original_source_url: raw.source_link || undefined,
      featured: raw.featured,
      order_index: raw.order_index,
      created_at: undefined,
      category_id: categoryId,
      subcategory_id: raw.subcategory_id,
      byline_style: raw.byline_style,
      link_style: raw.link_style,
      
      publication_year: extractPublicationYear(raw.publication_date),
      
      byline_style_text: bylineOption?.option_text || null,
      link_style_text: linkOption?.option_text || null,
      
      category_name: category?.name || '',
      subcategory_name: subcategory?.name || '',
      
      collection_slugs: collectionSlugs,
      collection_names: collectionNames,
      short_title: raw.short_title ?? null,
      short_desc: raw.short_desc ?? null,
      peri_desc: raw.peri_desc ?? null,
      desc: raw.desc ?? null,
      menu_thumbnail_url: raw.menu_thumbnail_url ?? null,
    }
  }
  
  async function loadAndTransformContentPreview(): Promise<ContentItem[]> {
    const rawContent = await loadContentPreview()
    return rawContent.map(transformContentItem)
  }

  async function autoSelectInitialContent(
    categories: Category[],
    subcategories: Subcategory[],
    content: ContentItem[]
  ): Promise<{
    selectedCategory: Category | null
    selectedSubcategory: Subcategory | null
    selectedContent: ContentItem | null
  }> {
    const firstCategory = [...categories].sort((a, b) => a.order_index - b.order_index)[0]
    if (!firstCategory) {
      return { selectedCategory: null, selectedSubcategory: null, selectedContent: null }
    }
    
    const firstSubcategory = subcategories
      .filter(s => s.category_id === firstCategory.id)
      .sort((a, b) => a.order_index - b.order_index)[0]
    if (!firstSubcategory) {
      return { selectedCategory: firstCategory, selectedSubcategory: null, selectedContent: null }
    }
    
    const firstContent = content
      .filter(c => c.subcategory_id === firstSubcategory.id)
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))[0]
    if (!firstContent) {
      return { selectedCategory: firstCategory, selectedSubcategory: firstSubcategory, selectedContent: null }
    }
    
    return {
      selectedCategory: firstCategory,
      selectedSubcategory: firstSubcategory,
      selectedContent: firstContent
    }
  }

  
  function findCategorySubcategoryForContent(
    content: ContentItem,
    categories: Category[],
    subcategories: Subcategory[]
  ): { category: Category | null; subcategory: Subcategory | null } {
    const subcategory = subcategories.find(s => s.id === content.subcategory_id) || null
    
    const category = subcategory 
      ? categories.find(c => c.id === subcategory.category_id) || null
      : null
    
    return { category, subcategory }
  }
  
  function autoSelectCollectionContent(
    filteredContent: ContentItem[],
    currentContent: ContentItem | null,
    collectionSlug: string,
    filteredCategories: Category[],
    filteredSubcategories: Subcategory[]
  ): {
    selectedCategory: Category | null
    selectedSubcategory: Subcategory | null
    selectedContent: ContentItem | null
  } {
    if (filteredContent.length === 0) {
      return {
        selectedCategory: null,
        selectedSubcategory: null,
        selectedContent: null
      }
    }
    
    if (currentContent) {
      if (currentContent.collection_slugs && 
          Array.isArray(currentContent.collection_slugs) &&
          currentContent.collection_slugs.includes(collectionSlug)) {
        const { category, subcategory } = findCategorySubcategoryForContent(
          currentContent,
          filteredCategories,
          filteredSubcategories
        )
        return {
          selectedCategory: category,
          selectedSubcategory: subcategory,
          selectedContent: currentContent
        }
      }
    }
    
    const firstContent = [...filteredContent]
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))[0]
    
    if (!firstContent) {
      return {
        selectedCategory: null,
        selectedSubcategory: null,
        selectedContent: null
      }
    }
    
    const { category, subcategory } = findCategorySubcategoryForContent(
      firstContent,
      filteredCategories,
      filteredSubcategories
    )
    
    return {
      selectedCategory: category,
      selectedSubcategory: subcategory,
      selectedContent: firstContent
    }
  }

  
  function isCollectionTab(activeTab: string, activeCollections: CollectionTab[]): boolean {
    if (activeTab === 'portfolio' || activeTab === 'resume') return false
    return activeCollections.some(c => c.slug === activeTab)
  }

  function isContentTab(activeTab: string, activeContents: ContentTab[] = []): boolean {
    if (activeTab === 'portfolio' || activeTab === 'resume') return false
    return activeContents.some(c => c.id === activeTab)
  }
  
  function getCurrentCollectionSlug(activeTab: string, activeCollections: CollectionTab[]): string | null {
    if (!isCollectionTab(activeTab, activeCollections)) return null
    return activeTab // activeTab is the collection slug when it's a collection tab
  }
  
  function filterContentByCollection(content: ContentItem[], collectionSlug: string): ContentItem[] {
    if (!collectionSlug) return []
    
    return content.filter(item => {
      if (!item.collection_slugs || !Array.isArray(item.collection_slugs)) return false
      return item.collection_slugs.includes(collectionSlug)
    })
  }
  
  function filterSubcategoriesByCollection(subcategories: Subcategory[], filteredContent: ContentItem[]): Subcategory[] {
    if (filteredContent.length === 0) return []
    
    const subcategoryIdsWithContent = new Set(
      filteredContent
        .map(item => item.subcategory_id)
        .filter((id): id is string => id !== null && id !== undefined)
    )
    
    return subcategories.filter(subcategory => 
      subcategoryIdsWithContent.has(subcategory.id)
    )
  }
  
  function filterCategoriesByCollection(
    categories: Category[],
    subcategories: Subcategory[],
    filteredContent: ContentItem[]
  ): Category[] {
    if (filteredContent.length === 0) return []
    
    const filteredSubcategories = filterSubcategoriesByCollection(subcategories, filteredContent)
    
    const categoryIdsWithContent = new Set(
      filteredSubcategories.map(subcategory => subcategory.category_id)
    )
    
    return categories.filter(category => 
      categoryIdsWithContent.has(category.id)
    )
  }

  useEffect(() => {
    // Only load data once on initial mount
    if (dataLoadedRef.current) {
      return
    }
    
    // Check if we're restoring BEFORE loading data
    const isRestoring = isMobile && savedMenuState !== null && savedMenuState === 'collapsed-reader' && savedSelectedContentId
    
    
    async function loadAllData() {
      async function fetchAllData() {
        const [categoriesData, subcategoriesData] = await Promise.all([
          loadCategories(),
          loadSubcategories()
        ])
        const contentData = await loadAndTransformContentPreview()
        const collectionsData = await loadCollections()
        return { categoriesData, subcategoriesData, contentData, collectionsData }
      }

      try {
        setLoadingCategories(true)
        setLoadingContent(true)
        setLoadingCollections(true)
        setDataError(null)

        let fetchResult: Awaited<ReturnType<typeof fetchAllData>>
        try {
          fetchResult = await fetchAllData()
        } catch {
          await new Promise(resolve => setTimeout(resolve, 2000))
          fetchResult = await fetchAllData()
        }

        const { categoriesData, subcategoriesData, contentData, collectionsData } = fetchResult
        
        // In mobile, don't auto-select content when in expanded-empty state (show categories by default)
        const shouldAutoSelect = !isMobile
        const { selectedCategory, selectedSubcategory, selectedContent } = 
          await autoSelectInitialContent(categoriesData, subcategoriesData, contentData)
        
        setCategories(categoriesData)
        setSubcategories(subcategoriesData)
        setContent(contentData)
        setCollections(collectionsData)
        
        // CRITICAL: If we're restoring, don't reset ANY state - let the restore effect handle it
        if (isRestoring) {
          // Just mark data as loaded, restore effect will handle state restoration
          setLoadingCategories(false)
          setLoadingContent(false)
          setLoadingCollections(false)
          dataLoadedRef.current = true
          return
        }
        
        
        // In mobile, always start with no selections to show categories by default
        // In desktop, auto-select first items
        if (isMobile) {
          setSelectedCategory(null)
          setSelectedSubcategory(null)
          setSelectedContent(null)
        } else {
          setSelectedCategory(selectedCategory)
          setSelectedSubcategory(selectedSubcategory)
          setSelectedContent(selectedContent)
        }
        
        setPageState('expanded-empty')
        
        setLoadingCategories(false)
        setLoadingContent(false)
        setLoadingCollections(false)
        
        dataLoadedRef.current = true
      } catch (err) {
        console.error('Failed to load data after retry:', err)
        setDataError('Failed to load content. Please refresh the page.')
        setLoadingCategories(false)
        setLoadingContent(false)
        setLoadingCollections(false)
      }
    }

    loadAllData()
  }, [savedMenuState, savedSelectedContentId]) // eslint-disable-line react-hooks/exhaustive-deps

  const applyContentDetails = useCallback((details: ContentItem) => {
    contentCacheRef.current.set(details.id, details)
    setContent(prev => prev.map(item => item.id === details.id ? { ...item, ...details } : item))
    setSelectedContent(prev => prev?.id === details.id ? { ...prev, ...details } : prev)
  }, [])

  const ensureContentDetails = useCallback(async (item: ContentItem | null) => {
    if (!item) return
    if (item.type !== 'article') return
    if (item.content_body) return
    if (contentCacheRef.current.has(item.id)) {
      const cached = contentCacheRef.current.get(item.id)
      if (cached) applyContentDetails(cached)
      return
    }
    try {
      const details = await loadContentDetails(item.id)
      if (details) {
        setContentLoadError(null)
        applyContentDetails(details)
      } else {
        setContentLoadError('Failed to load content.')
      }
    } catch {
      setContentLoadError('Failed to load content.')
    }
  }, [applyContentDetails])

  const handleContentRetry = useCallback(() => {
    setContentLoadError(null)
    void ensureContentDetails(selectedContent)
  }, [selectedContent, ensureContentDetails])

  useEffect(() => {
    if (!isContentTab(activeTab, activeContents)) return
    if (loadingContent || loadingCategories) return
    const contentMatch = content.find(c => c.id === activeTab) || null
    if (!contentMatch) return
    const { category, subcategory } = findCategorySubcategoryForContent(contentMatch, categories, subcategories)
    const shouldUpdateSelection =
      selectedContent?.id !== contentMatch.id ||
      selectedCategory?.id !== category?.id ||
      selectedSubcategory?.id !== subcategory?.id ||
      pageState !== 'collapsed-reader'
    if (shouldUpdateSelection) {
      setSelectedContent(contentMatch)
      setSelectedCategory(category)
      setSelectedSubcategory(subcategory)
      setPageState('collapsed-reader')
    }
    void ensureContentDetails(contentMatch)
  }, [
    activeTab,
    activeContents,
    content,
    categories,
    subcategories,
    selectedContent,
    selectedCategory,
    selectedSubcategory,
    pageState,
    loadingContent,
    loadingCategories,
    ensureContentDetails
  ])

  // Auto-select content when navigating from Resume tab (mobile only).
  useEffect(() => {
    if (!isMobile) {
      isAutoSelectingFromResumeRef.current = false
      return
    }
    if (!selectedContentIdFromResume) {
      isAutoSelectingFromResumeRef.current = false
      return
    }
    if (activeTab !== 'portfolio') {
      // Set flag even if tab hasn't changed yet, so menu state memory effect can see it
      isAutoSelectingFromResumeRef.current = true
      return
    }
    if (loadingContent || loadingCategories) {
      // Set flag while loading
      isAutoSelectingFromResumeRef.current = true
      return
    }
    if (content.length === 0) {
      // Set flag while waiting for content
      isAutoSelectingFromResumeRef.current = true
      return
    }
    
    const contentMatch = content.find(c => c.id === selectedContentIdFromResume)
    if (!contentMatch) {
      isAutoSelectingFromResumeRef.current = false
      return
    }
    
    // Set flag to prevent menu state memory effect from interfering (set BEFORE any state changes)
    isAutoSelectingFromResumeRef.current = true
    justAutoSelectedFromResumeRef.current = false // Reset completion flag
    
    // Auto-select the content: set category, subcategory, content, and collapse menu
    const { category, subcategory } = findCategorySubcategoryForContent(contentMatch, categories, subcategories)
    setSelectedContent(contentMatch)
    if (category) setSelectedCategory(category)
    if (subcategory) setSelectedSubcategory(subcategory)
    setPageState('collapsed-reader')
    
    // Load content details
    void ensureContentDetails(contentMatch)
    
    // Mark that we just completed auto-selection
    justAutoSelectedFromResumeRef.current = true
    
    const cancelled = { current: false }

    const t1 = setTimeout(() => {
      if (cancelled.current) return
      onContentSelectedFromResume?.()
      setTimeout(() => {
        if (cancelled.current) return
        isAutoSelectingFromResumeRef.current = false
        setTimeout(() => {
          if (cancelled.current) return
          justAutoSelectedFromResumeRef.current = false
        }, 300)
      }, 500)
    }, 100)

    return () => {
      cancelled.current = true
      clearTimeout(t1)
    }
  }, [
    isMobile,
    selectedContentIdFromResume,
    activeTab,
    loadingContent,
    loadingCategories,
    content,
    categories,
    subcategories,
    ensureContentDetails,
    onContentSelectedFromResume
  ])

  useEffect(() => {
    if (!onDownloadContextChange) return
    const contentTitle = selectedContent?.sidebar_title || selectedContent?.title || null
    onDownloadContextChange({
      contentTitle,
      contentId: selectedContent?.id || null,
      contentType: selectedContent?.type || null,
      downloadEnabled: typeof selectedContent?.download_enabled === 'boolean' ? selectedContent.download_enabled : null,
      contentDesc: selectedContent?.desc || null,
      contentYear: selectedContent?.publication_year || null,
      contentThumbnail: selectedContent?.menu_thumbnail_url || null,
      collectionName: selectedCollection?.name || null,
      collectionSlug: selectedCollection?.slug || null,
      collectionDesc: selectedCollection?.short_desc || selectedCollection?.desc || null,
      collectionThumbnails: selectedCollectionThumbnails,
    })
  }, [selectedContent, selectedCollection, selectedCollectionThumbnails, onDownloadContextChange])

  const prevActiveTabRef = useRef<string>(activeTab)
  
  useEffect(() => {
    const activeTabChanged = prevActiveTabRef.current !== activeTab
    prevActiveTabRef.current = activeTab
    
    if (!isCollectionTab(activeTab, activeCollections)) {
      return // Main tab active: no auto-selection needed
    }
    
    if (!activeTabChanged) {
      return // activeTab didn't change, user is manually selecting
    }
    
    if (loadingContent || loadingCategories || filteredContent.length === 0) {
      return
    }
    
    const collectionSlug = getCurrentCollectionSlug(activeTab, activeCollections)
    if (!collectionSlug) return
    
    const selection = autoSelectCollectionContent(
      filteredContent,
      selectedContent,
      collectionSlug,
      filteredCategories,
      filteredSubcategories
    )
    
      if (selection.selectedContent?.id !== selectedContent?.id ||
          selection.selectedCategory?.id !== selectedCategory?.id ||
          selection.selectedSubcategory?.id !== selectedSubcategory?.id) {
        setSelectedCategory(selection.selectedCategory)
        setSelectedSubcategory(selection.selectedSubcategory)
        setSelectedContent(selection.selectedContent)
        if (selection.selectedContent) {
          void ensureContentDetails(selection.selectedContent)
        }
      }
  }, [
    activeTab,
    activeCollections,
    filteredContent,
    filteredCategories,
    filteredSubcategories,
    selectedContent,
    loadingContent,
    loadingCategories,
    ensureContentDetails
  ])

  
  const handleCategorySelect = useCallback((category: Category) => {
    justWentBackRef.current = false
    setJustWentBackFromContent(false) // Clear flag when navigating forward
    if (selectedCategory?.id === category.id) {
      if (pageState === 'collapsed-reader') {
        setPageState('expanded-empty')
      } else {
        if (selectedContent) {
          setPageState('collapsed-reader')
        }
      }
      return
    }
    
    setSelectedCategory(category)
    setSelectedSubcategory(null)
    setSelectedContent(null)
    setPageState('expanded-empty')
  }, [selectedCategory, selectedContent, pageState])
  
  const handleSubcategorySelect = useCallback((subcategory: Subcategory) => {
    justWentBackRef.current = false
    setJustWentBackFromContent(false) // Clear flag when navigating forward
    if (selectedSubcategory?.id === subcategory.id) {
      if (pageState === 'collapsed-reader') {
        setPageState('expanded-empty')
      } else {
        if (selectedContent) {
          setPageState('collapsed-reader')
        }
      }
      return
    }
    
    setSelectedSubcategory(subcategory)
    setSelectedContent(null)
    setPageState('expanded-empty')
  }, [selectedSubcategory, selectedContent, pageState])

  const handleContentSelect = useCallback((content: ContentItem) => {
    justWentBackRef.current = false
    setJustWentBackFromContent(false) // Clear flag when selecting content
    if (selectedContent?.id === content.id) {
      if (pageState === 'collapsed-reader') {
        setPageState('expanded-empty')
      } else {
        setPageState('collapsed-reader')
        void ensureContentDetails(content)
      }
      return
    }
    
    // Set category and subcategory for the selected content so menu can show content items level
    const { category, subcategory } = findCategorySubcategoryForContent(content, categories, subcategories)
    if (category) setSelectedCategory(category)
    if (subcategory) setSelectedSubcategory(subcategory)
    
    setSelectedContent(content)
    void ensureContentDetails(content)
    setPageState('collapsed-reader')
  }, [selectedContent, pageState, ensureContentDetails, categories, subcategories])

  const handleMainMenuClick = useCallback(() => {
    if (pageState === 'collapsed-reader') {
      // User is manually expanding the menu - clear saved state so it doesn't interfere
      // This allows the user to navigate freely after coming back from another tab
      if (onSaveMenuState && isMobile) {
        onSaveMenuState({
          pageState: null,
          contentId: null,
          categoryId: null,
          subcategoryId: null
        })
      }
      setPageState('expanded-empty')
    }
  }, [pageState, onSaveMenuState, isMobile])

  const handleMenuBack = useCallback(() => {
    // From level 3 (content items): go back to level 2 (subcategories)
    if (selectedContent) {
      // IMPORTANT: Set flag BEFORE clearing content to ensure menu sees it
      // Use both ref (immediate) and state (triggers re-render)
      justWentBackRef.current = true
      // Force state update in a way that React can't batch
      setJustWentBackFromContent(true)
      // Clear content - this will trigger menu re-render
      setSelectedContent(null)
      // Keep selectedSubcategory and selectedCategory - menu will use flag to show subcategories
      // Flag will be cleared when user navigates forward (in handleCategorySelect/handleSubcategorySelect)
    }
    // From level 2 (subcategories): go back to level 1 (categories)
    else if (selectedSubcategory) {
      justWentBackRef.current = false
      setJustWentBackFromContent(false)
      setSelectedSubcategory(null)
      setSelectedContent(null)
      // selectedCategory stays set, menu will show categories
    }
    // From level 1 (categories): shouldn't happen (back button hidden)
    else if (selectedCategory) {
      justWentBackRef.current = false
      setJustWentBackFromContent(false)
      setSelectedCategory(null)
      setSelectedSubcategory(null)
      setSelectedContent(null)
    }
  }, [selectedCategory, selectedSubcategory, selectedContent])
  
  

  const handleCollectionClick = useCallback((collection: Collection) => {
    onCollectionClick(collection)
    setPageState('expanded-empty')
  }, [onCollectionClick])

  const handleCollectionSelect = useCallback((collection: Collection, thumbnails: string[] = []) => {
    setSelectedCollection(collection)
    setSelectedCollectionThumbnails(thumbnails)
    setSelectedContent(null) // cannot coexist with active content
  }, [])

  const handleCollectionDismiss = useCallback(() => {
    setSelectedCollection(null)
    setSelectedCollectionThumbnails([])
  }, [])

  const isLoading = loadingCategories || loadingContent || loadingCollections
  const isExpanded = pageState !== 'collapsed-reader'

  // Clear selections when menu opens in expanded-empty state (mobile only) - show categories by default
  // BUT: preserve selectedContent and its parent category/subcategory if content is selected
  // AND: preserve category/subcategory when going back from content (flag is set)
  // AND: don't interfere with auto-selection from Resume
  // AND: don't interfere when restoring content from tab switch
  useEffect(() => {
    if (!isMobile || !isExpanded || pageState !== 'expanded-empty') return
    
    // Don't interfere if we're auto-selecting from Resume
    if (selectedContentIdFromResume || isAutoSelectingFromResumeRef.current) {
      return
    }
    
    // Don't interfere if we're restoring content from a previous tab switch
    if (isRestoringFromTabSwitchRef.current) {
      return
    }
    
    // If we just went back from content, don't clear category/subcategory - they're needed to show subcategories
    if (justWentBackFromContent || justWentBackRef.current) {
      return
    }
    
    // If content is selected, preserve it along with its category/subcategory to show content items level
    // Otherwise, clear all selections to show categories
    if (!selectedContent) {
      setSelectedCategory(null)
      setSelectedSubcategory(null)
    }
    // If selectedContent exists, category and subcategory should already be set from the content item
  }, [isMobile, isExpanded, pageState, selectedContent, justWentBackFromContent, selectedContentIdFromResume])

  // Remember and restore menu state on tab switch (mobile only)
  useEffect(() => {
    
    if (!isMobile) {
      prevActiveTabRef.current = activeTab
      return
    }
    
    const prevTab = prevActiveTabRef.current
    const isPortfolioTab = activeTab === 'portfolio' || isCollectionTab(activeTab, activeCollections)
    const wasPortfolioTab = prevTab === 'portfolio' || isCollectionTab(prevTab, activeCollections)
    
    
    // Remember state when leaving Portfolio tab
    if (wasPortfolioTab && !isPortfolioTab) {
      lastMenuStateRef.current = pageState
      // Also remember selected content, category, and subcategory to restore them when returning
      lastSelectedContentRef.current = selectedContent
      lastSelectedCategoryRef.current = selectedCategory
      lastSelectedSubcategoryRef.current = selectedSubcategory
      
      // Also save to parent component so it persists across remounts
      if (onSaveMenuState) {
        onSaveMenuState({
          pageState,
          contentId: selectedContent?.id || null,
          categoryId: selectedCategory?.id || null,
          subcategoryId: selectedSubcategory?.id || null
        })
      }
    }
    
    // Restore state when returning to Portfolio tab
    // We have saved state if either refs have it (same mount) or props have it (cross-mount)
    const hasSavedState = lastMenuStateRef.current !== null || savedMenuState !== null
    
    
    // CRITICAL: If we have saved state from props (cross-mount), let the separate restore effect handle it
    // Don't interfere here - the separate effect will restore the content
    if (savedMenuState !== null && savedMenuState === 'collapsed-reader' && savedSelectedContentId && !selectedContent) {
      // We have saved state to restore, but let the separate restore effect handle it
      // Just update the ref and return to prevent this effect from resetting
      prevActiveTabRef.current = activeTab
      return
    }
    
    // Restore if we're switching from a non-Portfolio tab to Portfolio AND we have saved state (same mount)
    const shouldRestore = !wasPortfolioTab && isPortfolioTab && hasSavedState
    
    if (shouldRestore) {
      // If we have selectedContentIdFromResume, skip reset - auto-selection will handle it
      if (selectedContentIdFromResume || isAutoSelectingFromResumeRef.current) {
        prevActiveTabRef.current = activeTab
        return
      }
      
      // CRITICAL: If we just completed auto-selection, preserve the state
      // This prevents the menu state memory effect from resetting after auto-selection completes
      if (justAutoSelectedFromResumeRef.current) {
        // Just completed auto-selection - don't reset, preserve the collapsed state with content
        prevActiveTabRef.current = activeTab
        return
      }
      
      // Check if we're already restoring (from the separate restore effect)
      if (isRestoringFromTabSwitchRef.current) {
        prevActiveTabRef.current = activeTab
        return
      }
      
      // CRITICAL: If content is selected AND pageState is collapsed, preserve it
      // This handles:
      // 1. User selects content → goes to Resume → comes back (preserve collapsed with content)
      // 2. Auto-selection just completed (content selected, pageState is collapsed-reader)
      // This check MUST come before checking lastState to prevent resetting after auto-selection
      if (selectedContent && pageState === 'collapsed-reader') {
        // Content is selected and menu is collapsed, so keep it that way
        // Don't clear selections - they're already set
        // Don't reset pageState - it's already correct
        prevActiveTabRef.current = activeTab
        return
      }
      
      const lastState = lastMenuStateRef.current || savedMenuState
      
      // If menu was collapsed when leaving (with content selected), restore the content
      // Check both refs (for same-mount restoration) and saved props (for cross-mount restoration)
      const contentToRestoreFromRef = lastState === 'collapsed-reader' ? lastSelectedContentRef.current : null
      const contentToRestoreFromProps = savedMenuState === 'collapsed-reader' && savedSelectedContentId ? 
        content.find(c => c.id === savedSelectedContentId) : null
      const contentToRestore = contentToRestoreFromRef || contentToRestoreFromProps
      
      if (contentToRestore) {
        // Set flag to prevent other effects from interfering
        isRestoringFromTabSwitchRef.current = true
        
        // Wait for content to load before restoring
        if (loadingContent || content.length === 0) {
          // Content not loaded yet, will restore on next render
          prevActiveTabRef.current = activeTab
          return
        }
        
        // Verify the content still exists in the content array
        const contentExists = content.some(c => c.id === contentToRestore.id)
        
        if (contentExists) {
          // Restore the content that was selected when leaving
          // Use saved props if available (cross-mount), otherwise use refs (same-mount)
          let categoryToRestore: Category | null = null
          let subcategoryToRestore: Subcategory | null = null
          
          if (savedSelectedCategoryId) {
            categoryToRestore = categories.find(c => c.id === savedSelectedCategoryId) || null
          } else {
            categoryToRestore = lastSelectedCategoryRef.current
          }
          
          if (savedSelectedSubcategoryId) {
            subcategoryToRestore = subcategories.find(s => s.id === savedSelectedSubcategoryId) || null
          } else {
            subcategoryToRestore = lastSelectedSubcategoryRef.current
          }
          
          // Restore selections
          if (categoryToRestore) setSelectedCategory(categoryToRestore)
          if (subcategoryToRestore) setSelectedSubcategory(subcategoryToRestore)
          setSelectedContent(contentToRestore)
          setPageState('collapsed-reader')
          
          // Load content details if needed
          void ensureContentDetails(contentToRestore)
          
          // Clear flag after a delay to ensure all effects have run
          setTimeout(() => {
            isRestoringFromTabSwitchRef.current = false
          }, 300)
          prevActiveTabRef.current = activeTab
          return
        } else {
          // Content no longer exists, clear the ref and fall through to default behavior
          lastSelectedContentRef.current = null
          lastSelectedCategoryRef.current = null
          lastSelectedSubcategoryRef.current = null
          isRestoringFromTabSwitchRef.current = false
        }
      }
      
      // If menu was expanded when leaving → reset to expanded (loading screen)
      // BUT: Only if content is NOT selected (if content is selected, we already returned above)
      if ((lastState === 'expanded-empty' || lastState === 'expanded-reader') && !selectedContent) {
        setPageState('expanded-empty')
        // Clear selections to show loading screen
        setSelectedCategory(null)
        setSelectedSubcategory(null)
        setSelectedContent(null)
      }
      // If menu was collapsed when leaving but no content was selected → keep collapsed (preserve user's place)
      // The state and selections should already be preserved, so no action needed
    }
    
    // Update previous tab ref
    prevActiveTabRef.current = activeTab
  }, [activeTab, pageState, isMobile, activeCollections, selectedContentIdFromResume, selectedContent, selectedCategory, selectedSubcategory, content, loadingContent, ensureContentDetails, savedMenuState, savedSelectedContentId, savedSelectedCategoryId, savedSelectedSubcategoryId, onSaveMenuState])
  
  // Store onSaveMenuState in a ref to avoid dependency issues
  const onSaveMenuStateRef = useRef(onSaveMenuState)
  useEffect(() => {
    onSaveMenuStateRef.current = onSaveMenuState
  }, [onSaveMenuState])
  
  // Store saved state in refs so cleanup can access them
  const savedMenuStateRef = useRef(savedMenuState)
  const savedSelectedContentIdRef = useRef(savedSelectedContentId)
  useEffect(() => {
    savedMenuStateRef.current = savedMenuState
    savedSelectedContentIdRef.current = savedSelectedContentId
  }, [savedMenuState, savedSelectedContentId])
  
  // Separate effect for cleanup on unmount only
  useEffect(() => {
    if (!isMobile) return
    
    // Cleanup: Save state when component unmounts (when switching away from Portfolio)
    return () => {
      if (!onSaveMenuStateRef.current) return
      
      // Don't save if we're restoring - this would overwrite the saved state we're trying to restore
      if (isRestoringFromTabSwitchRef.current) {
        return
      }
      
      const currentPageState = pageStateRef.current
      const currentContent = selectedContentRef.current
      
      // Don't save if we're in default state with no content AND we have saved state to restore
      // This prevents overwriting a good saved state when the component remounts in default state
      // Check if we have saved state by checking if savedMenuState prop exists (from parent)
      if (currentPageState === 'expanded-empty' && !currentContent && savedMenuStateRef.current !== null) {
        return
      }
      
      // Don't save if we're in default state with no content - this would overwrite a good saved state
      // Only save if we have actual state to preserve (content selected or menu was expanded)
      if (currentPageState === 'expanded-empty' && !currentContent) {
        return
      }
      
      // Save current state from refs (always up-to-date)
      onSaveMenuStateRef.current({
        pageState: currentPageState,
        contentId: currentContent?.id || null,
        categoryId: selectedCategoryRef.current?.id || null,
        subcategoryId: selectedSubcategoryRef.current?.id || null
      })
    }
  }, [isMobile]) // Only depends on isMobile, cleanup runs on unmount
  
  // Separate effect to restore on mount when we have saved state from props (cross-mount restoration)
  // This runs independently of the menu state memory effect to handle cross-mount restoration
  // IMPORTANT: This must run as early as possible to prevent other effects from resetting state
  useEffect(() => {
    
    if (!isMobile) {
      return
    }
    if (activeTab !== 'portfolio') {
      return
    }
    if (!savedMenuState || savedMenuState !== 'collapsed-reader') {
      return
    }
    if (!savedSelectedContentId) {
      return
    }
    if (selectedContent && pageState === 'collapsed-reader') {
      return // Already restored
    }
    
    // Set flag immediately to prevent other effects from interfering
    isRestoringFromTabSwitchRef.current = true
    
    // Wait for content to load before restoring
    if (loadingContent || content.length === 0) {
      // Content not loaded yet, will restore on next render when content loads
      // But keep the flag set so other effects don't interfere
      return
    }
    
    // Find the content to restore
    const contentToRestore = content.find(c => c.id === savedSelectedContentId)
    if (!contentToRestore) {
      isRestoringFromTabSwitchRef.current = false
      return
    }
    
    
    // Restore category and subcategory
    let categoryToRestore: Category | null = null
    let subcategoryToRestore: Subcategory | null = null
    
    if (savedSelectedCategoryId) {
      categoryToRestore = categories.find(c => c.id === savedSelectedCategoryId) || null
    }
    
    if (savedSelectedSubcategoryId) {
      subcategoryToRestore = subcategories.find(s => s.id === savedSelectedSubcategoryId) || null
    }
    
    
    // Restore selections - set all at once
    if (categoryToRestore) setSelectedCategory(categoryToRestore)
    if (subcategoryToRestore) setSelectedSubcategory(subcategoryToRestore)
    setSelectedContent(contentToRestore)
    setPageState('collapsed-reader')
    
    
    // Load content details if needed
    void ensureContentDetails(contentToRestore)
    
    // Keep flag set for a longer delay to ensure all effects have run
    setTimeout(() => {
      isRestoringFromTabSwitchRef.current = false
    }, 1000)
  }, [isMobile, activeTab, savedMenuState, savedSelectedContentId, savedSelectedCategoryId, savedSelectedSubcategoryId, selectedContent, pageState, loadingContent, content, categories, subcategories, ensureContentDetails])

  // Measure collapsed menu height for mobile positioning
  useEffect(() => {
    if (!isMobile || isExpanded || pageState !== 'collapsed-reader') {
      setCollapsedMenuHeight(0)
      return
    }

    const measureMenuHeight = () => {
      if (menuBarRef.current) {
        const height = menuBarRef.current.offsetHeight
        setCollapsedMenuHeight(height)
      }
    }

    // Measure after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(measureMenuHeight, 0)
    
    // Also measure on resize
    window.addEventListener('resize', measureMenuHeight)
    
    return () => {
      clearTimeout(timeoutId)
      window.removeEventListener('resize', measureMenuHeight)
    }
  }, [isMobile, isExpanded, pageState])

  if (dataError) {
    return (
      <div
        className="fixed z-10 bg-bg-menu-bar flex items-center justify-center"
        style={{
          top: profileHeight ? `${profileHeight}px` : '200px',
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        <p className="text-text-on-dark-inactive text-sm">{dataError}</p>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div
        className="fixed z-10 bg-bg-menu-bar"
        style={{
          top: profileHeight ? `${profileHeight}px` : '200px',
          left: 0,
          right: 0,
          bottom: 0,
        }}
      >
        <div className="flex justify-between items-start min-h-16 px-[60px]">
          <div className="flex gap-12">
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-6 w-32" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-8 w-48" />
              <Skeleton className="h-8 w-48" />
            </div>
          </div>

          <div className="space-y-2">
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-6 w-40" />
            <Skeleton className="h-6 w-40" />
          </div>
        </div>

        <div className="flex items-center justify-center mt-24">
          <Loader />
        </div>
      </div>
    )
  }

  return (
    <div>
      {/* Location 1 — Mobile expanded overlay. DynamicMenu is desktop-only; old menu always used on mobile. */}
      {isMobile && isExpanded && (
        <MainMenu
          categories={filteredCategories}
          subcategories={filteredSubcategories}
          content={filteredContent}
          pageState={pageState}
          selectedCategory={selectedCategory}
          selectedSubcategory={selectedSubcategory}
          selectedContent={selectedContent}
          onCategorySelect={handleCategorySelect}
          onSubcategorySelect={handleSubcategorySelect}
          onContentSelect={(id) => { const item = content.find(c => c.id === id); if (item) handleContentSelect(item) }}
          onMenuClick={handleMainMenuClick}
          onMenuBack={handleMenuBack}
          profileHeight={profileHeight}
          justWentBackFromContent={justWentBackFromContent}
          justWentBackFromContentRef={justWentBackRef}
        />
      )}

      {/* Location 2 — Desktop uses DynamicMenu; mobile uses legacy menu bar in collapsed mode. */}
      {(!isMobile || !isExpanded) && (
        !isMobile ? (
          <DynamicMenu
            categories={categories}
            subcategories={subcategories}
            content={content}
            collections={collections}
            profileHeight={profileHeight}
            onContentSelect={handleContentSelect}
            isCollapsed={pageState === 'collapsed-reader'}
            onExpand={handleMainMenuClick}
            externalActiveContentId={externalActiveContentId}
            externalActiveCollectionSlug={externalActiveCollectionSlug}
            onCollectionSelect={handleCollectionSelect}
            onCollectionDismiss={handleCollectionDismiss}
            onExternalContentConsumed={onExternalContentConsumed}
            onExternalCollectionConsumed={onExternalCollectionConsumed}
            externalMenuCardSelect={externalMenuCardSelect}
            onExternalMenuCardSelectConsumed={onExternalMenuCardSelectConsumed}
            isProfileExpanded={isProfileExpanded}
          />
        ) : (
          <div
            ref={menuBarRef}
            className={`portfolio-menu-bar fixed z-30 bg-bg-menu-bar border-t-2 border-accent-light flex justify-between items-start min-h-16 ${isMobile ? 'px-0' : 'px-[60px]'} ${pageState === 'collapsed-reader' ? 'collapsed' : ''}`}
            style={{
              top: profileHeight ? `${profileHeight}px` : '200px',
              left: '0',
              width: '100%',
              ...(pageState !== 'collapsed-reader' ? {
                bottom: '64px',
                overflow: 'hidden',
              } : {}),
            }}
            data-portfolio-menu-bar
          >
            <MainMenu
              categories={filteredCategories}
              subcategories={filteredSubcategories}
              content={filteredContent}
              pageState={pageState}
              selectedCategory={selectedCategory}
              selectedSubcategory={selectedSubcategory}
              selectedContent={selectedContent}
              onCategorySelect={handleCategorySelect}
              onSubcategorySelect={handleSubcategorySelect}
              onContentSelect={(id) => { const item = content.find(c => c.id === id); if (item) handleContentSelect(item) }}
              onMenuClick={handleMainMenuClick}
              profileHeight={profileHeight}
              justWentBackFromContent={justWentBackFromContent}
              justWentBackFromContentRef={justWentBackRef}
            />
          </div>
        )
      )}

      <div 
        className="relative"
        style={
          isMobile && !isExpanded && pageState === 'collapsed-reader'
            ? {
                marginTop: `${collapsedMenuHeight + 10}px`
              }
            : undefined
        }
      >
        {pageState === 'collapsed-reader' && (
          <>
            <AnimatePresence>
              {pageState === 'collapsed-reader' && (
                <InfoMenu
                  key="info-menu"
                  metadata={selectedContent ? {
                    publication_name: selectedContent.publication_name || '',
                    publication_date: selectedContent.publication_date || '',
                    byline_style_text: selectedContent.byline_style_text || '',
                    author_name: selectedContent.author_name || '',
                    link_style_text: selectedContent.link_style_text || '',
                    source_link: selectedContent.source_link || ''
                  } : null}
                  isVisible={true}
                  profileHeight={profileHeight}
                  stickyTitle={selectedContent?.title || null}
                  stickySubtitle={selectedContent?.subtitle || null}
                  showStickyTitle={!titleInView}
                  showStickySubtitle={!!selectedContent?.subtitle && !subtitleInView}
                />
              )}
            </AnimatePresence>
            <ContentReader
              content={selectedContent}
              isVisible={true}
              error={contentLoadError}
              onRetry={handleContentRetry}
              onTitleVisibilityChange={({ titleInView, subtitleInView }) => {
                setTitleInView(titleInView)
                setSubtitleInView(subtitleInView)
              }}
            />
          </>
        )}
      </div>
    </div>
  )
}

