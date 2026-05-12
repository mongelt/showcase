'use client'

import { useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useMobileState } from '@/lib/responsive'
import { RiArrowLeftSLine } from 'react-icons/ri'
import { BOTTOM_NAV_HEIGHT_PX } from '@/lib/constants'
import { useReducedMotion } from '@/lib/animations'


type PageState = 'expanded-empty' | 'expanded-reader' | 'collapsed-reader'

interface Category {
  id: string
  name: string
  order_index: number
}

interface Subcategory {
  id: string
  category_id: string
  name: string
  order_index: number
}

interface ContentItem {
  id: string
  subcategory_id: string
  title: string
  sidebar_title: string | null
  sidebar_subtitle: string | null
  order_index?: number
  publication_year?: number | null
  desc?: string | null
}


interface MainMenuProps {
  categories: Category[]
  subcategories: Subcategory[]
  content: ContentItem[]
  pageState: PageState
  selectedCategory: Category | null
  selectedSubcategory: Subcategory | null
  selectedContent: ContentItem | null
  onCategorySelect: (category: Category) => void
  onSubcategorySelect: (subcategory: Subcategory) => void
  onContentSelect: (id: string) => void
  onMenuClick: () => void
  onMenuBack?: () => void
  profileHeight?: number
  justWentBackFromContent?: boolean
  justWentBackFromContentRef?: React.MutableRefObject<boolean>
}


const slideVariants = {
  enter: (dir: 'forward' | 'backward') => ({
    x: dir === 'forward' ? '100%' : '-100%',
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (dir: 'forward' | 'backward') => ({
    x: dir === 'forward' ? '-100%' : '100%',
    opacity: 0,
  }),
}

export default function MainMenu({ categories, subcategories, content, pageState, selectedCategory, selectedSubcategory, selectedContent, onCategorySelect, onSubcategorySelect, onContentSelect, onMenuClick, onMenuBack, profileHeight = 0, justWentBackFromContent = false, justWentBackFromContentRef }: MainMenuProps) {
  const { isMobile } = useMobileState()
  const reduced = useReducedMotion()
  const [direction, setDirection] = useState<'forward' | 'backward'>('forward')

  const sortedCategories = useMemo(() => {
    return [...categories].sort((a, b) => a.order_index - b.order_index)
  }, [categories])

  const displayedSubcategories = useMemo(() => {
    if (!selectedCategory) return []
    return [...subcategories]
      .filter(s => s.category_id === selectedCategory.id)
      .sort((a, b) => a.order_index - b.order_index)
  }, [subcategories, selectedCategory])

  const displayedContent = useMemo(() => {
    if (!selectedSubcategory) return []
    return [...content]
      .filter(c => c.subcategory_id === selectedSubcategory.id)
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
  }, [content, selectedSubcategory])

  const getSelectionColor = (
    itemId: string,
    itemType: 'category' | 'subcategory' | 'content'
  ): 'green' | 'gray' => {
    if (pageState === 'collapsed-reader') {
      if (itemType === 'content' && selectedContent?.id === itemId) return 'green'
      return 'gray'
    }

    if (itemType === 'category' && selectedCategory?.id === itemId) return 'green'
    if (itemType === 'subcategory' && selectedSubcategory?.id === itemId) return 'green'
    if (itemType === 'content' && selectedContent?.id === itemId) return 'green'

    if (itemType === 'category') {
      if (selectedSubcategory) {
        const subcat = subcategories.find(s => s.id === selectedSubcategory.id)
        if (subcat?.category_id === itemId) return 'green'
      }
      if (selectedContent) {
        const subcat = subcategories.find(s => s.id === selectedContent.subcategory_id)
        if (subcat?.category_id === itemId) return 'green'
      }
    }

    if (itemType === 'subcategory') {
      if (selectedContent && selectedContent.subcategory_id === itemId) return 'green'
    }

    return 'gray'
  }

  const handleItemClick = (
    item: Category | Subcategory | ContentItem,
    itemType: 'category' | 'subcategory' | 'content'
  ) => {
    if (itemType === 'category') {
      setDirection('forward')
      onCategorySelect(item as Category)
    } else if (itemType === 'subcategory') {
      setDirection('forward')
      onSubcategorySelect(item as Subcategory)
    } else {
      onContentSelect((item as ContentItem).id)
    }
  }

  const isExpanded = pageState !== 'collapsed-reader'

  // Mobile collapsed: show active content title as a tap target to re-expand
  if (!isExpanded && isMobile) {
    if (!selectedContent) return null
    return (
      <div
        onClick={onMenuClick}
        className="cursor-pointer border-b border-border-gray-800 flex items-center justify-center w-full"
        style={{ minHeight: '50px' }}
      >
        <div className="text-accent-dark text-base font-medium text-center w-full">
          {selectedContent.sidebar_title || selectedContent.title}
        </div>
      </div>
    )
  }

  // Mobile expanded: single-column three-level navigation
  if (isExpanded && isMobile) {
    const hasContent = selectedContent !== null
    const hasSubcategory = selectedSubcategory !== null
    const hasCategory = selectedCategory !== null

    // Ref checked first for immediate synchronous accuracy; state for re-render trigger
    const justWentBack = justWentBackFromContentRef?.current ?? justWentBackFromContent
    const isGoingBackFromContent = justWentBack && hasCategory && hasSubcategory && !hasContent

    const showContent = (hasSubcategory || hasContent) && !isGoingBackFromContent
    const showSubcategories = hasCategory && (!hasSubcategory || isGoingBackFromContent)
    const showCategories = !showContent && !showSubcategories
    const showBackButton = showSubcategories || showContent

    const activePanel = showContent ? 'content' : showSubcategories ? 'subcategories' : 'categories'

    return (
      <div
        className="fixed left-0 right-0 bg-bg-menu-bar overflow-y-auto px-[15px] py-4"
        style={{
          top: profileHeight ? `${profileHeight}px` : '0',
          bottom: `${BOTTOM_NAV_HEIGHT_PX}px`,
          zIndex: 20,
          overflowX: 'hidden',
        }}
      >
        {showBackButton && onMenuBack && (
          <div
            onClick={() => { setDirection('backward'); onMenuBack() }}
            className="flex items-center gap-2 text-accent-dark text-base font-semibold py-1 mb-4 border-b border-border-gray-800 cursor-pointer transition-colors hover:text-accent-emerald-300"
          >
            <RiArrowLeftSLine size={18} />
            <span>Back</span>
          </div>
        )}

        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={activePanel}
            custom={direction}
            variants={reduced ? undefined : slideVariants}
            initial={reduced ? { opacity: 0 } : 'enter'}
            animate={reduced ? { opacity: 1 } : 'center'}
            exit={reduced ? { opacity: 0 } : 'exit'}
            transition={{ duration: reduced ? 0 : 0.22, ease: [0.4, 0, 0.2, 1] }}
            className="flex flex-col gap-3 w-full"
          >
            {activePanel === 'categories' && (
              <>
                {categories.length === 0 ? (
                  <div className="text-text-on-dark-inactive">No categories</div>
                ) : (
                  sortedCategories.map(cat => {
                    const isSelected = getSelectionColor(cat.id, 'category') === 'green'
                    return (
                      <div
                        key={cat.id}
                        onClick={() => handleItemClick(cat, 'category')}
                        className={`main-menu-item ${isSelected ? 'selected text-accent-dark' : 'text-text-on-dark-inactive'} hover:text-text-on-dark cursor-pointer py-2 border-b border-border-gray-800 text-base`}
                      >
                        {cat.name}
                      </div>
                    )
                  })
                )}
              </>
            )}

            {activePanel === 'subcategories' && (
              <>
                {displayedSubcategories.length === 0 ? (
                  <div className="text-text-on-dark-inactive">No subcategories</div>
                ) : (
                  displayedSubcategories.map(sub => {
                    const isSelected = getSelectionColor(sub.id, 'subcategory') === 'green'
                    return (
                      <div
                        key={sub.id}
                        onClick={() => handleItemClick(sub, 'subcategory')}
                        className={`main-menu-item ${isSelected ? 'selected text-accent-dark' : 'text-text-on-dark-inactive'} hover:text-text-on-dark cursor-pointer py-2 border-b border-border-gray-800 text-base`}
                      >
                        {sub.name}
                      </div>
                    )
                  })
                )}
              </>
            )}

            {activePanel === 'content' && (
              <>
                {displayedContent.length === 0 ? (
                  <div className="text-text-on-dark-inactive">No content</div>
                ) : (
                  displayedContent.map(item => {
                    const isSelected = getSelectionColor(item.id, 'content') === 'green'
                    return (
                      <div
                        key={item.id}
                        onClick={() => handleItemClick(item, 'content')}
                        data-content-item="true"
                        className={`main-menu-item ${isSelected ? 'selected text-accent-dark' : 'text-text-on-dark-inactive'} hover:text-text-on-dark cursor-pointer py-2 border-b border-border-gray-800 text-base`}
                      >
                        <div>{item.sidebar_title || item.title}</div>
                        {(item.sidebar_subtitle || item.publication_year) && (
                          <div className="main-menu-content-subtitle text-text-on-dark-inactive text-sm mt-1">
                            {item.sidebar_subtitle && item.publication_year
                              ? `${item.sidebar_subtitle} / ${item.publication_year}`
                              : item.publication_year || ''
                            }
                          </div>
                        )}
                        {item.desc && (
                          <div className="text-text-on-dark-inactive text-base mt-1">{item.desc}</div>
                        )}
                      </div>
                    )
                  })
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    )
  }

  return null
}
