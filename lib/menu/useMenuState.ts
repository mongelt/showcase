'use client'

/**
 * Menu State Hook
 * Manages the four active IDs, derives nav state (1–6), and persists to localStorage.
 *
 * Persistence rules:
 *   - contentId, categoryId, subcategoryId are saved together when content is selected.
 *   - collectionId is saved independently.
 *   - Category/subcategory without content are never saved.
 *   - Session expires 30 minutes after all tabs close.
 */

import { useState, useEffect, useCallback, useRef } from 'react'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface MenuState {
  activeCategoryId: string | null
  activeSubcategoryId: string | null
  activeCollectionId: string | null
  activeContentId: string | null
}

/** 1=Default, 2=Category, 3=Subcategory, 4=ActiveContent, 5=Collection, 6=DualAnchor */
export type NavState = 1 | 2 | 3 | 4 | 5 | 6

export interface UseMenuStateOptions {
  /** IDs of all currently loaded categories (used to validate stored state) */
  allCategoryIds: string[]
  /** IDs of all currently loaded subcategories */
  allSubcategoryIds: string[]
  /** IDs of all currently loaded collections */
  allCollectionIds: string[]
  /** IDs of all currently loaded content items */
  allContentIds: string[]
  /** Full subcategory list — needed for cousin-click parent resolution */
  allSubcategories: ReadonlyArray<{ id: string; category_id: string }>
}

export interface MenuStateActions {
  state: MenuState
  navState: NavState
  /** Set active category, clear subcategory and content */
  selectCategory: (id: string) => void
  /** Set active subcategory; auto-switches category on cousin click */
  selectSubcategory: (id: string) => void
  /** Set active collection, clear content */
  selectCollection: (id: string) => void
  /** Clear active collection */
  dismissCollection: () => void
  /** Set active content, clear collection */
  selectContent: (id: string) => void
  /** Clear active content */
  clearContent: () => void
  /** Reset all selections to default state */
  resetAll: () => void
}

// ---------------------------------------------------------------------------
// localStorage helpers
// ---------------------------------------------------------------------------

const STORAGE_KEY = 'dm_menu_state'
const SESSION_TTL_MS = 30 * 60 * 1000 // 30 minutes

interface StoredState {
  collectionId: string | null
  contentId: string | null
  categoryId: string | null     // saved only when contentId is set
  subcategoryId: string | null  // saved only when contentId is set
  closedAt: number | null       // timestamp of last tab close; null when session is live
}

function readStorage(): StoredState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as StoredState
    if (parsed.closedAt && Date.now() - parsed.closedAt > SESSION_TTL_MS) {
      localStorage.removeItem(STORAGE_KEY)
      return null
    }
    return parsed
  } catch {
    return null
  }
}

function writeStorage(state: MenuState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      collectionId: state.activeCollectionId,
      contentId: state.activeContentId,
      // Only persist category/subcategory when paired with a content item.
      // Standalone menu browsing is not saved.
      categoryId: state.activeContentId ? state.activeCategoryId : null,
      subcategoryId: state.activeContentId ? state.activeSubcategoryId : null,
      closedAt: null, // active tab — session is live
    }))
  } catch {
    // ignore write failures (e.g. private browsing quota)
  }
}

// Stamps closedAt on the stored state when a tab unloads.
function markClosed(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    parsed.closedAt = Date.now()
    localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
  } catch {}
}

// Clears closedAt when a tab opens — signals the session is live again.
function clearClosedAt(): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return
    const parsed = JSON.parse(raw)
    if (parsed.closedAt != null) {
      parsed.closedAt = null
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
    }
  } catch {}
}

// ---------------------------------------------------------------------------
// Nav state derivation
// ---------------------------------------------------------------------------

export function deriveNavState(state: MenuState): NavState {
  if (state.activeContentId) return 4
  if (state.activeCollectionId && state.activeSubcategoryId) return 6
  if (state.activeCollectionId) return 5
  if (state.activeSubcategoryId) return 3
  if (state.activeCategoryId) return 2
  return 1
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useMenuState(options: UseMenuStateOptions): MenuStateActions {
  // Use ref so action callbacks always see the latest options without needing
  // to be recreated on every render.
  const optionsRef = useRef(options)
  optionsRef.current = options

  const [state, setState] = useState<MenuState>({
    activeCategoryId: null,
    activeSubcategoryId: null,
    activeCollectionId: null,
    activeContentId: null,
  })

  // Guards the write effect from firing before restoration has run.
  // Set to true once data has loaded and restoration has completed (or found nothing).
  // This prevents the initial null state from overwriting valid stored data.
  const [initialized, setInitialized] = useState(false)

  // Clear closedAt on mount — this tab is now active.
  useEffect(() => {
    clearClosedAt()
  }, [])

  // Mark session closed when this tab unloads.
  useEffect(() => {
    window.addEventListener('beforeunload', markClosed)
    return () => window.removeEventListener('beforeunload', markClosed)
  }, [])

  // Restore from localStorage once data has loaded.
  // Skips if state is already set by external activation (external link, resume card, etc.)
  // so that external activation is never overwritten by stale stored state.
  useEffect(() => {
    if (initialized) return

    const { allCollectionIds, allContentIds, allCategoryIds, allSubcategoryIds } = optionsRef.current

    const hasData = allCollectionIds.length > 0 || allContentIds.length > 0
    if (!hasData) return

    const stored = readStorage()
    if (stored) {
      setState(prev => {
        // External activation already set state — don't overwrite
        if (
          prev.activeContentId ||
          prev.activeCollectionId ||
          prev.activeCategoryId ||
          prev.activeSubcategoryId
        ) {
          return prev
        }
        return {
          ...prev,
          activeCollectionId:
            stored.collectionId && allCollectionIds.includes(stored.collectionId)
              ? stored.collectionId : null,
          activeContentId:
            stored.contentId && allContentIds.includes(stored.contentId)
              ? stored.contentId : null,
          activeCategoryId:
            stored.categoryId && allCategoryIds.includes(stored.categoryId)
              ? stored.categoryId : null,
          activeSubcategoryId:
            stored.subcategoryId && allSubcategoryIds.includes(stored.subcategoryId)
              ? stored.subcategoryId : null,
        }
      })
    }

    setInitialized(true)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.allCollectionIds.length, options.allContentIds.length])

  // Persist to localStorage on every state change — but only after initialization.
  useEffect(() => {
    if (!initialized) return
    writeStorage(state)
  }, [state, initialized])

  // ---------------------------------------------------------------------------
  // Actions
  // Spec State 2-6 transition rules:
  //   - Selecting category or subcategory does NOT clear the active collection (State 6).
  //   - Selecting content clears the active collection (State 4 cannot coexist with 5).
  //   - Selecting a collection clears active content (State 5 cannot coexist with 4).
  // ---------------------------------------------------------------------------

  const selectCategory = useCallback((id: string) => {
    setState(prev => ({
      activeCategoryId: id,
      activeSubcategoryId: null,           // clear subcategory
      activeCollectionId: prev.activeCollectionId, // keep collection
      activeContentId: null,               // close reader
    }))
  }, [])

  const selectSubcategory = useCallback((id: string) => {
    setState(prev => {
      // Cousin click: auto-switch to the subcategory's parent category
      const sub = optionsRef.current.allSubcategories.find(s => s.id === id)
      const parentCategoryId = sub?.category_id ?? prev.activeCategoryId
      return {
        activeCategoryId: parentCategoryId,
        activeSubcategoryId: id,
        activeCollectionId: prev.activeCollectionId, // keep collection (State 6)
        activeContentId: null,             // close reader
      }
    })
  }, [])

  const selectCollection = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      activeCollectionId: id,
      activeContentId: null,               // cannot coexist with content (spec §State 5)
    }))
  }, [])

  const dismissCollection = useCallback(() => {
    setState(prev => ({
      ...prev,
      activeCollectionId: null,
    }))
  }, [])

  const selectContent = useCallback((id: string) => {
    setState(prev => ({
      ...prev,
      activeCollectionId: null,            // cannot coexist with collection (spec §State 4)
      activeContentId: id,
    }))
  }, [])

  const clearContent = useCallback(() => {
    setState(prev => ({
      ...prev,
      activeContentId: null,
    }))
  }, [])

  const resetAll = useCallback(() => {
    setState({
      activeCategoryId: null,
      activeSubcategoryId: null,
      activeCollectionId: null,
      activeContentId: null,
    })
  }, [])

  return {
    state,
    navState: deriveNavState(state),
    selectCategory,
    selectSubcategory,
    selectCollection,
    dismissCollection,
    selectContent,
    clearContent,
    resetAll,
  }
}
