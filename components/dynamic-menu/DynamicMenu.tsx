'use client'

/**
 * Stage 11 — DynamicMenu Assembly
 *
 * Wires CategoryPlane, ContentPlane, and CollectionPlane into one component.
 * Manages its own navigation state via useMenuState.
 * Calls onContentSelect when a content item is selected (triggers the reader).
 *
 * Rendered on desktop only. PortfolioContent.tsx controls that condition.
 *
 * Layout:
 *   Fixed container (same footprint as old portfolio-menu-bar)
 *   ├── Row 1 (flex: 1) — CategoryPlane | ContentPlane
 *   └── Row 2 (flex-shrink: 0) — CollectionPlane
 */

import { useMemo, useCallback, useEffect, useRef, useState } from 'react'
import { animate } from 'framer-motion'
import { useReducedMotion } from '@/lib/animations'
import {
  useMenuState,
} from '@/lib/menu/useMenuState'
import {
  CollapsedMenuBar,
  BarSubcategoryData,
  BarContentData,
  BarCollectionData,
} from './CollapsedMenuBar'
import {
  scoreAllEntities,
  AnchorState,
  AnyEntity,
  ContentScoringEntity,
  SubcategoryScoringEntity,
  CollectionScoringEntity,
  CategoryScoringEntity,
} from '@/lib/menu/scoring'
import {
  computeContentColumns,
  ContentItemForLayout,
  CollectionInfo,
} from '@/lib/menu/columnLayout'
import {
  computeSubcategoryColumn,
  SubcategoryForLayout,
} from '@/lib/menu/subcategoryLayout'
import {
  computeCollectionPlane,
  CollectionForLayout,
} from '@/lib/menu/collectionLayout'
import { CategoryPlane, ScoredCategory } from './CategoryPlane'
import { ContentPlane } from './ContentPlane'
import { CollectionPlane } from './CollectionPlane'

// ---------------------------------------------------------------------------
// Prop types — minimal interfaces matching PortfolioContent's local types
// ---------------------------------------------------------------------------

export interface DmCategory {
  id: string
  name: string
  order_index: number
  short_title?: string | null
  short_desc?: string | null
  desc?: string | null
}

export interface DmSubcategory {
  id: string
  category_id: string
  name: string
  order_index: number
  short_title?: string | null
  short_desc?: string | null
  peri_desc?: string | null
  desc?: string | null
}

/** Minimal shape of ContentItem from PortfolioContent that DynamicMenu needs */
export interface DmContent {
  id: string
  category_id: string
  subcategory_id: string
  title: string
  sidebar_title: string | null
  publication_name?: string
  publication_year?: number | null
  order_index?: number
  image_url?: string
  menu_thumbnail_url?: string | null
  collection_slugs?: string[]
  short_title?: string | null
  short_desc?: string | null
  peri_desc?: string | null
  desc?: string | null
}

export interface DmCollection {
  id: string
  slug: string
  name: string
  featured: boolean
  order_index: number
  short_title?: string | null
  short_desc?: string | null
  desc?: string | null
}

export interface DynamicMenuProps {
  categories: DmCategory[]
  subcategories: DmSubcategory[]
  /** All content (not featured-only — Stage 2 wired the non-featured query) */
  content: DmContent[]
  collections: DmCollection[]
  profileHeight: number
  /**
   * Called when the user selects a content item. Triggers PortfolioContent to
   * open the reader and set pageState → 'collapsed-reader'.
   * Typed as `any` so PortfolioContent's richer ContentItem passes through.
   */
  onContentSelect: (content: any) => void
  /**
   * True when pageState='collapsed-reader' in PortfolioContent.
   * Switches from full menu to the thin CollapsedMenuBar.
   */
  isCollapsed?: boolean
  /**
   * Expand the menu back to full view. Called by CollapsedMenuBar on click.
   * In PortfolioContent this is handleMainMenuClick (sets pageState → 'expanded-empty').
   */
  onExpand?: () => void
  /**
   * Content ID activated from outside the menu (BlockNote buttons, resume side cards,
   * shared URLs). When this changes the menu selects that content and triggers the reader,
   * exactly as if the user had clicked the item inside the menu.
   */
  externalActiveContentId?: string | null
  /**
   * Collection slug activated from outside the menu (BlockNote pills, shared URLs).
   * When this changes the menu selects that collection and expands.
   */
  externalActiveCollectionSlug?: string | null
  /** Called when any collection becomes active (user click or external trigger). */
  onCollectionSelect?: (collection: DmCollection, thumbnails: string[]) => void
  /** Called when the active collection is dismissed. */
  onCollectionDismiss?: () => void
  /** Called after external content ID is consumed so parent can clear it. */
  onExternalContentConsumed?: () => void
  /** Called after external collection slug is consumed so parent can clear it. */
  onExternalCollectionConsumed?: () => void
  /**
   * Triggers a full reset + pre-selection from the profile plane cards (Scenario 3).
   * Resets all active IDs then selects the card's category / subcategory / collection.
   */
  externalMenuCardSelect?: { id: string; type: 'category' | 'subcategory' | 'collection' } | null
  /** Called after externalMenuCardSelect is consumed so parent can clear it. */
  onExternalMenuCardSelectConsumed?: () => void
  /** True while the profile overlay is expanded. Used to trigger intro animations when profile collapses. */
  isProfileExpanded?: boolean
}

// ---------------------------------------------------------------------------
// DynamicMenu
// ---------------------------------------------------------------------------

export function DynamicMenu({
  categories,
  subcategories,
  content,
  collections,
  profileHeight,
  onContentSelect,
  isCollapsed = false,
  onExpand,
  externalActiveContentId,
  externalActiveCollectionSlug,
  onCollectionSelect,
  onCollectionDismiss,
  onExternalContentConsumed,
  onExternalCollectionConsumed,
  externalMenuCardSelect,
  onExternalMenuCardSelectConsumed,
  isProfileExpanded = false,
}: DynamicMenuProps) {
  // -------------------------------------------------------------------------
  // Intro animation — fires each time the profile overlay collapses
  // -------------------------------------------------------------------------

  const reduced = useReducedMotion()
  const prevExpandedRef = useRef(isProfileExpanded)
  const categoryRef = useRef<HTMLDivElement>(null)
  const collectionRef = useRef<HTMLDivElement>(null)
  const contentRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!isProfileExpanded && prevExpandedRef.current) {
      prevExpandedRef.current = isProfileExpanded
      if (reduced) return

      // Phase 1 (t=0): Pre-position elements at their start state IMMEDIATELY,
      // while they are still hidden behind the profile overlay's solid background.
      // This prevents the "flash at final position" glitch caused by the overlay's
      // planes becoming transparent (~200ms in) before the animation starts.
      if (categoryRef.current) animate(categoryRef.current, { x: -60, opacity: 0 }, { duration: 0 })
      if (collectionRef.current) animate(collectionRef.current, { y: 20, opacity: 0 }, { duration: 0 })
      if (contentRef.current) animate(contentRef.current, { opacity: 0 }, { duration: 0 })

      // Phase 2 (t=500ms): Animate to final position as the overlay unmounts.
      const t = setTimeout(() => {
        if (categoryRef.current) {
          animate(categoryRef.current, { x: 0, opacity: 1 }, { duration: 0.4, ease: [0.4, 0, 0.2, 1] })
        }
        if (collectionRef.current) {
          animate(collectionRef.current, { y: 0, opacity: 1 }, { duration: 0.4, ease: [0.4, 0, 0.2, 1], delay: 0.1 })
        }
        if (contentRef.current) {
          animate(contentRef.current, { opacity: 1 }, { duration: 0.35, ease: 'easeOut', delay: 0.2 })
        }
      }, 500)
      return () => clearTimeout(t)
    }
    prevExpandedRef.current = isProfileExpanded
  }, [isProfileExpanded, reduced])

  // -------------------------------------------------------------------------
  // Stable ID arrays (for useMenuState validation)
  // -------------------------------------------------------------------------

  const allCategoryIds = useMemo(() => categories.map(c => c.id), [categories])
  const allSubcategoryIds = useMemo(() => subcategories.map(s => s.id), [subcategories])
  const allCollectionIds = useMemo(() => collections.map(c => c.id), [collections])
  const allContentIds = useMemo(() => content.map(c => c.id), [content])

  // -------------------------------------------------------------------------
  // Navigation state
  // -------------------------------------------------------------------------

  // Tracks which external content ID has already been activated, so the effect
  // doesn't double-fire when content data loads after the prop is set.
  const externalContentTriggeredRef = useRef<string | null>(null)
  // Tracks which card select key has already been processed.
  const externalCardSelectRef = useRef<string | null>(null)

  const {
    state: menuState,
    navState,
    selectCategory,
    selectSubcategory,
    selectCollection,
    dismissCollection,
    selectContent,
    clearContent,
    resetAll,
  } = useMenuState({
    allCategoryIds,
    allSubcategoryIds,
    allCollectionIds,
    allContentIds,
    allSubcategories: subcategories,
  })

  const triggerSelectCollection = useCallback((collectionId: string) => {
    selectCollection(collectionId)
    if (onCollectionSelect) {
      const col = collections.find(c => c.id === collectionId)
      if (col) {
        const thumbnails = content
          .filter(c => c.collection_slugs?.includes(col.slug) && (c.menu_thumbnail_url || c.image_url))
          .slice(0, 5)
          .map(c => (c.menu_thumbnail_url ?? c.image_url)!)
        onCollectionSelect(col, thumbnails)
      }
    }
  }, [selectCollection, collections, content, onCollectionSelect])

  const triggerDismissCollection = useCallback(() => {
    dismissCollection()
    onCollectionDismiss?.()
  }, [dismissCollection, onCollectionDismiss])

  // -------------------------------------------------------------------------
  // Build scoring entities
  // -------------------------------------------------------------------------

  /** Map from collection slug → collection id (to resolve content.collection_slugs) */
  const slugToId = useMemo(() => {
    const map = new Map<string, string>()
    for (const c of collections) map.set(c.slug, c.id)
    return map
  }, [collections])

  /** Content items enriched with collection IDs (converted from slugs) */
  const contentWithCollectionIds = useMemo(
    () =>
      content.map(item => ({
        ...item,
        collectionIds: (item.collection_slugs ?? [])
          .map(slug => slugToId.get(slug))
          .filter((id): id is string => id !== undefined),
      })),
    [content, slugToId],
  )

  /** Map: subcategoryId → Set<collectionId> (derived from content memberships) */
  const subcategoryCollectionIds = useMemo(() => {
    const map = new Map<string, Set<string>>()
    for (const item of contentWithCollectionIds) {
      if (!item.subcategory_id) continue
      if (!map.has(item.subcategory_id)) map.set(item.subcategory_id, new Set())
      for (const cid of item.collectionIds) map.get(item.subcategory_id)!.add(cid)
    }
    return map
  }, [contentWithCollectionIds])

  /** Full entity array for the scoring engine */
  const entities = useMemo((): AnyEntity[] => {
    const result: AnyEntity[] = []

    for (const item of contentWithCollectionIds) {
      result.push({
        id: item.id,
        type: 'content',
        tags: [],
        subcategoryId: item.subcategory_id ?? '',
        categoryId: item.category_id,
        collectionIds: item.collectionIds,
      } as ContentScoringEntity)
    }

    for (const sub of subcategories) {
      result.push({
        id: sub.id,
        type: 'subcategory',
        tags: [],
        categoryId: sub.category_id,
        collectionIds: Array.from(subcategoryCollectionIds.get(sub.id) ?? []),
      } as SubcategoryScoringEntity)
    }

    for (const cat of categories) {
      result.push({
        id: cat.id,
        type: 'category',
        tags: [],
        subcategoryIds: subcategories
          .filter(s => s.category_id === cat.id)
          .map(s => s.id),
      } as CategoryScoringEntity)
    }

    for (const col of collections) {
      result.push({
        id: col.id,
        type: 'collection',
        tags: [],
        contentIds: contentWithCollectionIds
          .filter(item => item.collectionIds.includes(col.id))
          .map(item => item.id),
      } as CollectionScoringEntity)
    }

    return result
  }, [contentWithCollectionIds, subcategories, categories, collections, subcategoryCollectionIds])

  // -------------------------------------------------------------------------
  // Anchor state (maps navState → AnchorState for scoring engine)
  //
  // State 1 — no anchor
  // State 2 — category as primary
  // State 3 — subcategory as primary
  // State 4 — content item active; anchor = content's parent subcategory
  // State 5 — collection as primary
  // State 6 — collection (primary) + subcategory (secondary)
  // -------------------------------------------------------------------------

  const anchor = useMemo((): AnchorState => {
    const { activeCategoryId, activeSubcategoryId, activeCollectionId, activeContentId } =
      menuState

    if (navState === 6) {
      return {
        primary: activeCollectionId ? { type: 'collection', id: activeCollectionId } : null,
        secondary: activeSubcategoryId ? { type: 'subcategory', id: activeSubcategoryId } : null,
      }
    }
    if (navState === 5) {
      return {
        primary: activeCollectionId ? { type: 'collection', id: activeCollectionId } : null,
        secondary: null,
      }
    }
    if (navState === 4) {
      // Anchor = active content's parent subcategory (spec §State 4)
      const contentItem = content.find(c => c.id === activeContentId)
      const subcatId = contentItem?.subcategory_id ?? activeSubcategoryId
      return {
        primary: subcatId ? { type: 'subcategory', id: subcatId } : null,
        secondary: null,
      }
    }
    if (navState === 3) {
      return {
        primary: activeSubcategoryId ? { type: 'subcategory', id: activeSubcategoryId } : null,
        secondary: null,
      }
    }
    if (navState === 2) {
      return {
        primary: activeCategoryId ? { type: 'category', id: activeCategoryId } : null,
        secondary: null,
      }
    }
    // State 1: no anchor
    return { primary: null, secondary: null }
  }, [menuState, navState, content])

  // -------------------------------------------------------------------------
  // Scoring
  // -------------------------------------------------------------------------

  const scores = useMemo(
    () => scoreAllEntities(entities, anchor, []),
    [entities, anchor],
  )

  const scoreMap = useMemo(
    () => new Map(scores.map(s => [s.entityId, s])),
    [scores],
  )

  // -------------------------------------------------------------------------
  // Category plane data
  // -------------------------------------------------------------------------

  const scoredCategories = useMemo((): ScoredCategory[] => {
    // category_id on DmContent is derived from a subcategory join and may be ''
    // if the join returns null. subcategory_id is a direct DB column — always reliable.
    // Build a map from categoryId → Set<subcategoryId> using the subcategories prop.
    const catToSubcatIds = new Map<string, Set<string>>()
    for (const sub of subcategories) {
      if (!catToSubcatIds.has(sub.category_id)) catToSubcatIds.set(sub.category_id, new Set())
      catToSubcatIds.get(sub.category_id)!.add(sub.id)
    }

    return [...categories]
      .sort((a, b) => a.order_index - b.order_index)
      .map(cat => {
        const sr = scoreMap.get(cat.id)
        const subcatIds = catToSubcatIds.get(cat.id) ?? new Set<string>()
        // Thumbnails: up to 5 from content in this category, preferring menu_thumbnail_url.
        // Filter by subcategory_id (direct DB column) — more reliable than category_id.
        const thumbnails = content
          .filter(c => subcatIds.has(c.subcategory_id ?? '') && (c.menu_thumbnail_url || c.image_url))
          .slice(0, 5)
          .map(c => (c.menu_thumbnail_url ?? c.image_url)!)
        return {
          id: cat.id,
          name: cat.name,
          shortDesc: cat.short_desc ?? undefined,
          desc: cat.desc ?? undefined,
          thumbnails,
          score: sr?.score ?? 1.0,
          classification: (sr?.classification ?? 'focus') as ScoredCategory['classification'],
        }
      })
  }, [categories, subcategories, scoreMap, content])

  // -------------------------------------------------------------------------
  // Subcategory column data
  // -------------------------------------------------------------------------

  const subcategoryLayoutItems = useMemo((): SubcategoryForLayout[] => {
    return subcategories.map(sub => ({
      id: sub.id,
      category_id: sub.category_id,
      name: sub.name,
      shortTitle: sub.short_title ?? undefined,
      shortDesc: sub.short_desc ?? undefined,
      periDesc: sub.peri_desc ?? undefined,
      desc: sub.desc ?? undefined,
      collectionIds: Array.from(subcategoryCollectionIds.get(sub.id) ?? []),
      thumbnails: contentWithCollectionIds
        .filter(c => c.subcategory_id === sub.id && (c.menu_thumbnail_url || c.image_url))
        .slice(0, 5)
        .map(c => (c.menu_thumbnail_url ?? c.image_url)!),
    }))
  }, [subcategories, subcategoryCollectionIds, contentWithCollectionIds])

  /** Only computed when a category is active */
  const scoredSubcategories = useMemo(() => {
    if (!menuState.activeCategoryId) return []
    return computeSubcategoryColumn(
      subcategoryLayoutItems,
      menuState.activeCategoryId,
      scores,
    )
  }, [subcategoryLayoutItems, menuState.activeCategoryId, scores])

  // -------------------------------------------------------------------------
  // Content plane data (only for navState ≥ 3)
  // -------------------------------------------------------------------------

  const contentLayoutItems = useMemo((): ContentItemForLayout[] => {
    return contentWithCollectionIds.map(item => ({
      id: item.id,
      name: item.sidebar_title || item.title,
      shortTitle: item.short_title ?? undefined,
      shortDesc: item.short_desc ?? undefined,
      periDesc: item.peri_desc ?? undefined,
      desc: item.desc ?? undefined,
      thumbnail: item.menu_thumbnail_url ?? item.image_url,
      publication: item.publication_name,
      year: item.publication_year ?? undefined,
      order_index: item.order_index ?? 0,
      collectionIds: item.collectionIds,
    }))
  }, [contentWithCollectionIds])

  const collectionInfo = useMemo((): CollectionInfo[] => {
    return collections.map(c => ({
      id: c.id,
      name: c.name,
      shortDesc: c.short_desc ?? undefined,
      desc: c.desc ?? undefined,
    }))
  }, [collections])

  const contentColumns = useMemo(() => {
    if (navState < 3) return []
    return computeContentColumns(
      contentLayoutItems,
      collectionInfo,
      scores,
      menuState.activeCollectionId,
    )
  }, [navState, contentLayoutItems, collectionInfo, scores, menuState.activeCollectionId])

  // -------------------------------------------------------------------------
  // Collection plane data
  // -------------------------------------------------------------------------

  /** Collections that currently have a subheader in the content plane */
  const contentPlaneCollectionIds = useMemo(
    () =>
      contentColumns
        .filter(col => !col.isActiveCollection && col.collectionId !== null)
        .map(col => col.collectionId!),
    [contentColumns],
  )

  const collectionLayoutItems = useMemo((): CollectionForLayout[] => {
    return collections.map(c => ({
      id: c.id,
      name: c.name,
      shortTitle: c.short_title ?? undefined,
      shortDesc: c.short_desc ?? undefined,
      desc: c.desc ?? undefined,
      featured: c.featured,
      order_index: c.order_index,
      thumbnails: contentWithCollectionIds
        .filter(item => item.collectionIds.includes(c.id) && (item.menu_thumbnail_url || item.image_url))
        .slice(0, 5)
        .map(item => (item.menu_thumbnail_url ?? item.image_url)!),
    }))
  }, [collections, contentWithCollectionIds])

  const { leftZone, rightZone } = useMemo(
    () =>
      computeCollectionPlane(
        collectionLayoutItems,
        contentPlaneCollectionIds,
        menuState.activeCollectionId,
        scores,
        navState > 1, // hasAnchor: false only in State 1
      ),
    [
      collectionLayoutItems,
      contentPlaneCollectionIds,
      menuState.activeCollectionId,
      scores,
      navState,
    ],
  )

  // -------------------------------------------------------------------------
  // Handlers
  // -------------------------------------------------------------------------

  const handleContentClick = useCallback(
    (id: string) => {
      const item = content.find(c => c.id === id)
      if (!item) return
      // Always anchor to the item's subcategory+category so the menu opens
      // in the correct state when expanded after content selection (State 3 anchor).
      selectSubcategory(item.subcategory_id)
      selectContent(id)
      onContentSelect(item)
    },
    [content, selectSubcategory, selectContent, onContentSelect],
  )

  const handleSubheaderClick = useCallback(
    (collectionId: string) => {
      triggerSelectCollection(collectionId)
    },
    [triggerSelectCollection],
  )

  // -------------------------------------------------------------------------
  // External activation (Stage 18)
  // Triggered when content/collection is opened from outside the menu:
  // BlockNote buttons, resume side cards, shared URLs.
  // -------------------------------------------------------------------------

  useEffect(() => {
    if (!externalActiveContentId) {
      externalContentTriggeredRef.current = null
      return
    }
    // Guard: if we already activated this ID, don't re-fire when content array re-renders
    if (externalContentTriggeredRef.current === externalActiveContentId) return
    const item = content.find(c => c.id === externalActiveContentId)
    // Content data may not be loaded yet — the effect will re-run when content changes
    if (!item) return
    externalContentTriggeredRef.current = externalActiveContentId
    selectSubcategory(item.subcategory_id)
    selectContent(externalActiveContentId)
    onContentSelect(item)
    onExternalContentConsumed?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalActiveContentId, content])

  useEffect(() => {
    if (!externalActiveCollectionSlug) return
    const col = collections.find(c => c.slug === externalActiveCollectionSlug)
    if (!col) return
    triggerSelectCollection(col.id)
    onExpand?.()
    onExternalCollectionConsumed?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalActiveCollectionSlug, collections])

  useEffect(() => {
    if (!externalMenuCardSelect) {
      externalCardSelectRef.current = null
      return
    }
    const key = `${externalMenuCardSelect.type}:${externalMenuCardSelect.id}`
    if (externalCardSelectRef.current === key) return
    externalCardSelectRef.current = key
    resetAll()
    if (externalMenuCardSelect.type === 'category') {
      selectCategory(externalMenuCardSelect.id)
    } else if (externalMenuCardSelect.type === 'subcategory') {
      selectSubcategory(externalMenuCardSelect.id)
    } else if (externalMenuCardSelect.type === 'collection') {
      triggerSelectCollection(externalMenuCardSelect.id)
    }
    onExternalMenuCardSelectConsumed?.()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalMenuCardSelect])

  // -------------------------------------------------------------------------
  // Collapsed bar data (Stage 13)
  // -------------------------------------------------------------------------

  /** Category shown in the collapsed breadcrumb.
   *  Falls back to the active content's parent category when no category is
   *  explicitly selected — covers the case where content was opened externally. */
  const collapsedCategoryData = useMemo(() => {
    let id = menuState.activeCategoryId
    if (!id && menuState.activeContentId) {
      const item = content.find(c => c.id === menuState.activeContentId)
      if (item?.subcategory_id) {
        const sub = subcategories.find(s => s.id === item.subcategory_id)
        id = sub?.category_id ?? null
      }
    }
    if (!id) return null
    return scoredCategories.find(c => c.id === id) ?? null
  }, [menuState.activeCategoryId, menuState.activeContentId, content, subcategories, scoredCategories])

  /** Subcategory shown in the collapsed breadcrumb.
   *  Falls back to the active content's subcategory when none is explicitly selected. */
  const collapsedSubcategoryData = useMemo((): BarSubcategoryData | null => {
    let id = menuState.activeSubcategoryId
    if (!id && menuState.activeContentId) {
      const item = content.find(c => c.id === menuState.activeContentId)
      id = item?.subcategory_id ?? null
    }
    if (!id) return null
    // scoredSubcategories is only computed when activeCategoryId is set
    const scored = scoredSubcategories.find(s => s.id === id)
    if (scored) return {
      id: scored.id,
      name: scored.name,
      shortDesc: scored.shortDesc,
      desc: scored.desc,
      score: scored.score,
      thumbnails: scored.thumbnails ?? [],
    }
    // Fallback to raw subcategory — derive thumbnails from content
    const raw = subcategories.find(s => s.id === id)
    if (!raw) return null
    const thumbnails = contentWithCollectionIds
      .filter(c => c.subcategory_id === id && (c.menu_thumbnail_url || c.image_url))
      .slice(0, 5)
      .map(c => (c.menu_thumbnail_url ?? c.image_url)!)
    return { id: raw.id, name: raw.name, score: 0.8, thumbnails }
  }, [menuState.activeSubcategoryId, menuState.activeContentId, content, subcategories, scoredSubcategories, contentWithCollectionIds])

  /** Active content item shown in the collapsed breadcrumb */
  const collapsedContentData = useMemo((): BarContentData | null => {
    const id = menuState.activeContentId
    if (!id) return null
    const item = contentLayoutItems.find(c => c.id === id)
    if (!item) return null
    const sr = scoreMap.get(id)
    return {
      id: item.id,
      name: item.name,
      thumbnail: item.thumbnail,
      publication: item.publication,
      year: item.year,
      score: sr?.score ?? 1.0,
    }
  }, [menuState.activeContentId, contentLayoutItems, scoreMap])

  /**
   * First collection the active content belongs to, shown as a pill.
   * Uses raw collections + scoreMap so it works regardless of nav state.
   */
  const collapsedCollectionData = useMemo((): BarCollectionData | null => {
    const contentId = menuState.activeContentId
    if (!contentId) return null
    const contentItem = contentWithCollectionIds.find(c => c.id === contentId)
    if (!contentItem || contentItem.collectionIds.length === 0) return null
    const collectionId = contentItem.collectionIds[0]
    const collection = collections.find(c => c.id === collectionId)
    if (!collection) return null
    const sr = scoreMap.get(collectionId)
    const thumbnails = contentWithCollectionIds
      .filter(c => c.collectionIds.includes(collectionId) && (c.menu_thumbnail_url || c.image_url))
      .slice(0, 5)
      .map(c => (c.menu_thumbnail_url ?? c.image_url)!)
    return {
      id: collectionId,
      name: collection.name,
      shortTitle: collection.short_title ?? undefined,
      score: sr?.score ?? 0.5,
      thumbnails,
    }
  }, [menuState.activeContentId, contentWithCollectionIds, collections, scoreMap])

  // Collapsed bar click handlers (pre-select then expand)

  const handleCollapsedCategoryClick = useCallback(() => {
    if (menuState.activeCategoryId) selectCategory(menuState.activeCategoryId)
    onExpand?.()
  }, [menuState.activeCategoryId, selectCategory, onExpand])

  const handleCollapsedSubcategoryClick = useCallback(() => {
    if (menuState.activeSubcategoryId) selectSubcategory(menuState.activeSubcategoryId)
    onExpand?.()
  }, [menuState.activeSubcategoryId, selectSubcategory, onExpand])

  const handleCollapsedContentClick = useCallback(() => {
    // Open at State 3 — clear active content, keep subcategory as anchor
    if (menuState.activeSubcategoryId) {
      selectSubcategory(menuState.activeSubcategoryId) // also clears content
    } else {
      clearContent()
    }
    onExpand?.()
  }, [menuState.activeSubcategoryId, selectSubcategory, clearContent, onExpand])

  const handleCollapsedCollectionClick = useCallback(() => {
    if (collapsedCollectionData) triggerSelectCollection(collapsedCollectionData.id)
    onExpand?.()
  }, [collapsedCollectionData, triggerSelectCollection, onExpand])

  // -------------------------------------------------------------------------
  // Derived layout flags
  // -------------------------------------------------------------------------

  /** Category plane collapses to nav-cards when content plane is active (State 3–6) */
  const isCategoryCollapsed = navState >= 3

  const showContentPlane = navState >= 3 && contentColumns.length > 0

  /**
   * Collapsed footprint of the category panel (used by the spacer div).
   * When collapsed, CategoryPlane is position:absolute and this spacer holds its
   * visual space in the flex row so the ContentPlane never shifts on hover.
   * 90px category col + 8px gap + 90px subcategory col (if a category is active).
   */
  const collapsedPanelWidth =
    isCategoryCollapsed
      ? menuState.activeCategoryId !== null
        ? 90 + 8 + 90  // categories + gap + subcategories
        : 90            // categories only
      : 0

  // -------------------------------------------------------------------------
  // Column max-height for CategoryPlane (viewport-units calc since CategoryPlane
  // can be position:absolute and height:100% won't resolve against the flex flow)
  // -------------------------------------------------------------------------

  const colMaxHeight = `calc(100vh - ${profileHeight || 200}px - 64px - 88px)`

  // -------------------------------------------------------------------------
  // Render
  // -------------------------------------------------------------------------

  // Collapsed state: render thin bar instead of full menu
  if (isCollapsed) {
    return (
      <CollapsedMenuBar
        profileHeight={profileHeight}
        activeCategoryData={collapsedCategoryData}
        activeSubcategoryData={collapsedSubcategoryData}
        activeContentData={collapsedContentData}
        activeCollectionData={collapsedCollectionData}
        onCategoryClick={handleCollapsedCategoryClick}
        onSubcategoryClick={handleCollapsedSubcategoryClick}
        onContentClick={handleCollapsedContentClick}
        onCollectionClick={handleCollapsedCollectionClick}
        onExpand={onExpand ?? (() => {})}
      />
    )
  }

  return (
    <div
      className="fixed z-30 bg-bg-menu-bar border-t-2 border-accent-light"
      style={{
        top: profileHeight ? `${profileHeight}px` : '200px',
        left: 0,
        width: '100%',
        bottom: '64px',
        overflow: 'visible',
        display: 'flex',
        flexDirection: 'column',
        padding: '8px',
        gap: '8px',
      }}
    >
      {/* ------------------------------------------------------------------ */}
      {/* Row 1 — CategoryPlane + ContentPlane                                 */}
      {/* ------------------------------------------------------------------ */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'row',
          gap: '8px',
          // No overflow:hidden — CategoryPlane expands beyond its collapsed width
          // on hover and must visually overlay the content plane without clipping.
          overflow: 'visible',
          position: 'relative', // positioning context for the absolute CategoryPlane
        }}
      >
        {/* Spacer: holds CategoryPlane's collapsed footprint so ContentPlane
            never shifts when the panel expands on hover (always absolute when collapsed). */}
        {isCategoryCollapsed && (
          <div
            aria-hidden="true"
            style={{ width: collapsedPanelWidth, flexShrink: 0 }}
          />
        )}

        {/* Plain div wrapper so the imperative animate doesn't conflict with
            CategoryPlane's own motion.div animate prop. When CategoryPlane is
            collapsed (position:absolute) it breaks out of this static wrapper
            and positions relative to Row 1 — no layout impact. */}
        <div ref={categoryRef} style={{ flexShrink: 0 }}>
          <CategoryPlane
            categories={scoredCategories}
            subcategories={scoredSubcategories}
            activeCategoryId={menuState.activeCategoryId}
            activeSubcategoryId={menuState.activeSubcategoryId}
            isCollapsed={isCategoryCollapsed}
            colMaxHeight={colMaxHeight}
            onCategoryClick={selectCategory}
            onSubcategoryClick={selectSubcategory}
          />
        </div>

        {showContentPlane && (
          <div
            ref={contentRef}
            className="dm-content-wrapper"
            style={{
              flex: 1,
              overflow: 'visible',
              minHeight: 0,
            }}
          >
            <ContentPlane
              columns={contentColumns}
              activeContentId={menuState.activeContentId}
              onContentClick={handleContentClick}
              onSubheaderClick={handleSubheaderClick}
              colMaxHeight={colMaxHeight}
            />
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Row 2 — CollectionPlane (pinned to bottom)                           */}
      {/* ------------------------------------------------------------------ */}
      <div ref={collectionRef} style={{ flexShrink: 0 }}>
        <CollectionPlane
          leftZone={leftZone}
          rightZone={rightZone}
          onCollectionClick={triggerSelectCollection}
          onCollectionDismiss={triggerDismissCollection}
        />
      </div>
    </div>
  )
}
