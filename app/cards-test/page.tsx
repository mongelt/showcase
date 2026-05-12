'use client'

/**
 * Card visual reference page — /cards-test
 *
 * All card types and states from the live dynamic menu, organized by row.
 * Hover each card to verify transitions and animations.
 *
 * Row 1 — NavCard · Categories
 * Row 2 — NavCard + PeriSolo + PeriPair · Subcategories (layout="nav")
 * Row 3 — CollectionCard · Collections (bottom row)
 * Row 4 — SubheaderCard
 * Row 5 — ThumbCard + PeriSolo + PeriPair · Content (layout="content")
 * Score Spectrum (0.01 → 1.00)
 * Interactive plane demos (CategoryPlane, ContentPlane, CollectionPlane)
 */

import React, { useState, useRef } from 'react'
import { motion } from 'framer-motion'
import { useReducedMotion, dmTransition } from '@/lib/animations'
import { interpolateMenuScore, borderColorFromScore } from '@/lib/menu/scoreSpectrum'
import { ThumbnailStack } from '@/components/dynamic-menu/cards/ThumbnailStack'
import { NavCard } from '@/components/dynamic-menu/cards/NavCard'
import { ThumbCard } from '@/components/dynamic-menu/cards/ThumbCard'
import { PeriSolo } from '@/components/dynamic-menu/cards/PeriSolo'
import { PeriPair } from '@/components/dynamic-menu/cards/PeriPair'
import { SubheaderCard } from '@/components/dynamic-menu/cards/SubheaderCard'
import { CollectionCard } from '@/components/dynamic-menu/cards/CollectionCard'
import { CategoryPlane, ScoredCategory } from '@/components/dynamic-menu/CategoryPlane'
import { ScoredSubcategory } from '@/lib/menu/subcategoryLayout'
import { ContentPlane } from '@/components/dynamic-menu/ContentPlane'
import { ContentColumn, ScoredContentItem } from '@/lib/menu/columnLayout'
import { CollectionPlane } from '@/components/dynamic-menu/CollectionPlane'
import { ScoredCollection } from '@/lib/menu/collectionLayout'
import { DownloadCard } from '@/components/dynamic-menu/cards/DownloadCard'
import { PlaneResumeCard, type ProfileResumeCard } from '@/components/ProfilePlanes'

// ---------------------------------------------------------------------------
// Score spectrum data
// ---------------------------------------------------------------------------

const SPECTRUM_CARDS = [
  { score: 1.00, title: 'AI Agents in Integration',     meta: 'Axway Blog · 2024',       desc: 'Agentic workflows in B2B data pipelines.' },
  { score: 0.89, title: 'AI in B2B Sales',              meta: 'Medium · 2024',            desc: 'Pipeline automation and AI-driven lead scoring.' },
  { score: 0.78, title: 'GEO for Journalists',          meta: 'Self-published · 2024',    desc: 'Generative engine optimization guide.' },
  { score: 0.67, title: 'Digital Propaganda Patterns',  meta: 'Academic · 2024',          desc: 'AI-driven disinformation study.' },
  { score: 0.56, title: 'LinkedIn Thought Leadership',  meta: 'LinkedIn · 2024',          desc: 'Building executive presence online.' },
  { score: 0.45, title: 'Balkan Media Landscape',       meta: 'Feature · 2022',           desc: 'Press freedom challenges across the region.' },
  { score: 0.34, title: 'CNN Panel: Balkans',           meta: 'CNN · 2023',               desc: 'Regional politics discussion panel.' },
  { score: 0.23, title: 'Belgrade Architecture',        meta: 'Photo essay · 2022',       desc: 'Brutalist and modern architecture.' },
  { score: 0.12, title: 'Documentary: Belgrade',        meta: 'YouTube · 2023',           desc: 'City culture mini-documentary.' },
  { score: 0.01, title: 'Reuters Feature',              meta: 'Reuters · 2023',           desc: 'Syndicated political analysis piece.' },
]

// ---------------------------------------------------------------------------
// Shared styles
// ---------------------------------------------------------------------------

const pageStyle: React.CSSProperties = {
  background: '#0B0A0A',
  minHeight: '100vh',
  padding: '40px 30px',
  fontFamily: 'var(--font-ui, Space Grotesk, sans-serif)',
  color: '#c0c0c0',
}

const sectionTitle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  textTransform: 'uppercase',
  letterSpacing: '0.08em',
  color: '#A85A5A',
  marginBottom: 14,
  paddingBottom: 6,
  borderBottom: '1px solid #2a2222',
}

const row: React.CSSProperties = {
  display: 'flex',
  gap: 24,
  marginBottom: 40,
  flexWrap: 'wrap',
  alignItems: 'flex-start',
}

const col: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
}

const label: React.CSSProperties = {
  fontSize: 9,
  fontWeight: 500,
  textTransform: 'uppercase',
  letterSpacing: '0.06em',
  color: '#888',
}

const divider: React.CSSProperties = {
  border: 'none',
  borderTop: '1px solid #2a2222',
  margin: '10px 0 24px',
}

// ---------------------------------------------------------------------------
// Stage 8 — CategoryPlane test data
// ---------------------------------------------------------------------------

const TEST_CATEGORIES: ScoredCategory[] = [
  { id: 'cat-1', name: 'Analysis',  shortDesc: 'Policy · AI · Geopolitics', desc: 'In-depth analysis across policy, AI governance, and international affairs.',     score: 1.00, classification: 'active' },
  { id: 'cat-2', name: 'Research',  shortDesc: 'Academic · Reports',         desc: 'Academic papers, white papers, and policy reports spanning technology and law.', score: 0.80, classification: 'focus'  },
  { id: 'cat-3', name: 'Creative',  shortDesc: 'Writing · Narrative',         desc: 'Long-form narrative writing, essays, and creative non-fiction.',                 score: 0.35, classification: 'related' },
]

const TEST_SUBCATEGORIES: ScoredSubcategory[] = [
  { id: 'sub-1', category_id: 'cat-1', name: 'EU Integration',    shortDesc: 'Accession · Balkans',    desc: 'European Union accession politics in Southeast Europe.',       collectionIds: ['col-1'], score: 1.00, classification: 'active',  pairingRole: 'none' },
  { id: 'sub-2', category_id: 'cat-1', name: 'AI Policy',         shortDesc: 'Governance · Regulation', desc: 'Policy and regulatory frameworks for artificial intelligence.', collectionIds: ['col-1', 'col-2'], score: 0.85, classification: 'focus',   pairingRole: 'none' },
  { id: 'sub-3', category_id: 'cat-1', name: 'Media Studies',     shortDesc: 'Press · Disinformation',  desc: 'Press freedom, media ecosystems, and disinformation research.', collectionIds: ['col-2'], score: 0.70, classification: 'focus',   pairingRole: 'none' },
  { id: 'sub-4', category_id: 'cat-2', name: 'ML Research',       shortDesc: 'Machine learning',        desc: 'Applied machine learning research and technical publications.',   collectionIds: ['col-1'], score: 0.45, classification: 'related', pairingRole: 'none' },
  { id: 'sub-5', category_id: 'cat-2', name: 'Policy Reports',    shortDesc: 'Institutional',           desc: 'Institutional policy reports and white papers.',                 collectionIds: ['col-2'], score: 0.40, classification: 'related', pairingRole: 'none' },
]

const TEST_SUBCATEGORIES_LARGE: ScoredSubcategory[] = [
  ...TEST_SUBCATEGORIES,
  { id: 'sub-6', category_id: 'cat-3', name: 'Feature Writing',   shortTitle: 'Features',  shortDesc: 'Long-form',   desc: 'Long-form feature writing and narrative journalism.', collectionIds: ['col-1'], score: 0.30, classification: 'related', pairingRole: 'left',  pairWithId: 'sub-7' },
  { id: 'sub-7', category_id: 'cat-3', name: 'Photo Essays',       shortTitle: 'Photo',     shortDesc: 'Visual work', desc: 'Documentary photography and visual storytelling.',    collectionIds: ['col-1'], score: 0.25, classification: 'related', pairingRole: 'right' },
]

// ---------------------------------------------------------------------------
// CategoryPlane interactive wrapper
// ---------------------------------------------------------------------------

function CategoryPlaneDemo() {
  const [activeCategoryId, setActiveCategoryId]       = useState<string | null>('cat-1')
  const [activeSubcategoryId, setActiveSubcategoryId] = useState<string | null>('sub-1')
  const [isCollapsed, setIsCollapsed]                 = useState(false)
  const [useLargeList, setUseLargeList]               = useState(false)

  const subcategories = useLargeList ? TEST_SUBCATEGORIES_LARGE : TEST_SUBCATEGORIES

  const btnBase: React.CSSProperties = {
    fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 3,
    border: '1px solid #3a3030', cursor: 'pointer', letterSpacing: '0.05em',
    textTransform: 'uppercase',
  }
  const btnActive: React.CSSProperties   = { ...btnBase, background: '#6B2A2A', color: '#e0ccc8', border: '1px solid #8a3a3a' }
  const btnInactive: React.CSSProperties = { ...btnBase, background: '#1a1818', color: '#888' }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
        <button style={isCollapsed ? btnInactive : btnActive} onClick={() => setIsCollapsed(false)}>
          Expanded
        </button>
        <button style={isCollapsed ? btnActive : btnInactive} onClick={() => setIsCollapsed(true)}>
          Collapsed (hover plane to test overlay)
        </button>
        <div style={{ width: 1, background: '#2a2222', margin: '0 4px' }} />
        <button style={useLargeList ? btnActive : btnInactive} onClick={() => setUseLargeList(v => !v)}>
          7 subcategories (peri-pair threshold)
        </button>
        <div style={{ width: 1, background: '#2a2222', margin: '0 4px' }} />
        <button style={activeCategoryId ? btnInactive : btnActive} onClick={() => { setActiveCategoryId(null); setActiveSubcategoryId(null) }}>
          No category (subcol hidden)
        </button>
      </div>

      <div style={{ fontSize: 10, color: '#555', marginBottom: 16, fontFamily: 'monospace' }}>
        category: {activeCategoryId ?? 'null'} &nbsp;|&nbsp;
        subcategory: {activeSubcategoryId ?? 'null'} &nbsp;|&nbsp;
        collapsed: {String(isCollapsed)}
      </div>

      <div style={{ position: 'relative', display: 'inline-flex', minHeight: 300 }}>
        <CategoryPlane
          categories={TEST_CATEGORIES}
          subcategories={activeCategoryId ? subcategories.filter(s => s.category_id === activeCategoryId || s.classification === 'related') : []}
          activeCategoryId={activeCategoryId}
          activeSubcategoryId={activeSubcategoryId}
          isCollapsed={isCollapsed}
          onCategoryClick={(id) => {
            setActiveCategoryId(id)
            setActiveSubcategoryId(null)
          }}
          onSubcategoryClick={(id) => setActiveSubcategoryId(id)}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stage 9 — ContentPlane test data + demo
// ---------------------------------------------------------------------------

function makeItem(
  id: string,
  name: string,
  shortTitle: string,
  score: number,
  classification: ScoredContentItem['classification'],
  pairingRole: ScoredContentItem['pairingRole'],
  collectionIds: string[],
  pairWithId?: string,
): ScoredContentItem {
  return {
    id,
    name,
    shortTitle,
    shortDesc: `Short desc for ${shortTitle}`,
    desc: `Extended description for ${name}. Provides additional context on hover.`,
    publication: 'Report',
    year: 2024,
    order_index: 0,
    collectionIds,
    thumbnail: undefined,
    score,
    classification,
    pairingRole,
    pairWithId,
    overflowsViewport: false,
  }
}

const COL_1: ContentColumn = {
  collectionId: 'col-eu',
  collectionName: 'EU Integration',
  isActiveCollection: false,
  isContinuation: false,
  subheaderSpansTwo: false,
  items: [
    makeItem('c1',  'Serbia EU Accession Analysis',       'Serbia EU',         1.00, 'active',  'none', ['col-eu']),
    makeItem('c2',  'Balkan Reform Tracker 2024',         'Reform Tracker',    0.85, 'focus',   'none', ['col-eu']),
    makeItem('c3',  'Croatia Post-Accession Review',      'Croatia Review',    0.72, 'focus',   'none', ['col-eu']),
    makeItem('c4',  'Enlargement Policy Brief',           'Policy Brief',      0.45, 'related', 'left', ['col-eu'], 'c5'),
    makeItem('c5',  'European Integration Studies Q3',    'EU Studies Q3',     0.38, 'related', 'right',['col-eu']),
    makeItem('c6',  'Balkan Press Freedom Index',         'Press Freedom',     0.30, 'related', 'solo', ['col-eu']),
  ],
}

const COL_2: ContentColumn = {
  isContinuation: false,
  subheaderSpansTwo: false,
  collectionId: 'col-ai',
  collectionName: 'AI & Technology',
  isActiveCollection: false,
  items: [
    makeItem('d1', 'AI Agents in Integration Pipelines', 'AI Agents',         0.88, 'focus',   'none', ['col-ai']),
    makeItem('d2', 'GEO Training Materials',             'GEO Guide',         0.74, 'focus',   'none', ['col-ai']),
    makeItem('d3', 'ML in Policy Analysis',              'ML Policy',         0.60, 'focus',   'none', ['col-ai']),
    makeItem('d4', 'LCB Dispatch #14',                   'Dispatch #14',      0.35, 'related', 'none', ['col-ai']),
  ],
}

const COL_3: ContentColumn = {
  collectionId: null,
  collectionName: null,
  isActiveCollection: false,
  isContinuation: false,
  subheaderSpansTwo: false,
  items: [
    makeItem('e1', 'Belgrade Architecture Photo Essay',  'Beograd Arch',      0.55, 'focus',   'none', []),
    makeItem('e2', 'Documentary: Belgrade',              'Documentary',       0.42, 'related', 'none', []),
  ],
}

const COL_2_ACTIVE: ContentColumn = { ...COL_2, isActiveCollection: true }

function ContentPlaneDemo() {
  const [activeContentId, setActiveContentId] = useState<string | null>(null)
  const [colCount, setColCount]               = useState<1 | 2 | 3>(2)
  const [col2Active, setCol2Active]           = useState(false)

  const columns: ContentColumn[] = [
    COL_1,
    ...(colCount >= 2 ? [col2Active ? COL_2_ACTIVE : COL_2] : []),
    ...(colCount >= 3 ? [COL_3] : []),
  ]

  const btnBase: React.CSSProperties = {
    fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 3,
    border: '1px solid #3a3030', cursor: 'pointer', letterSpacing: '0.05em',
    textTransform: 'uppercase',
  }
  const btnOn: React.CSSProperties  = { ...btnBase, background: '#6B2A2A', color: '#e0ccc8', border: '1px solid #8a3a3a' }
  const btnOff: React.CSSProperties = { ...btnBase, background: '#1a1818', color: '#888' }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        {([1, 2, 3] as const).map(n => (
          <button key={n} style={colCount === n ? btnOn : btnOff} onClick={() => setColCount(n)}>
            {n} column{n > 1 ? 's' : ''}
          </button>
        ))}
        <div style={{ width: 1, background: '#2a2222', margin: '0 4px' }} />
        <button style={col2Active ? btnOn : btnOff} onClick={() => setCol2Active(v => !v)}>
          Col 2 active (no subheader)
        </button>
        <div style={{ width: 1, background: '#2a2222', margin: '0 4px' }} />
        <button style={btnOff} onClick={() => setActiveContentId(null)}>
          Clear active item
        </button>
      </div>

      <div style={{ fontSize: 10, color: '#555', marginBottom: 16, fontFamily: 'monospace' }}>
        active item: {activeContentId ?? 'null'}
      </div>

      <div style={{ height: 380, overflow: 'hidden', display: 'flex' }}>
        <ContentPlane
          columns={columns}
          activeContentId={activeContentId}
          onContentClick={setActiveContentId}
          onSubheaderClick={(colId) => alert(`onSubheaderClick → ${colId}`)}
        />
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Stage 10 — CollectionPlane test data + demo
// ---------------------------------------------------------------------------

function makeCollection(
  id: string,
  name: string,
  shortTitle: string,
  score: number,
  isActive: boolean,
  featured: boolean,
): ScoredCollection {
  return {
    id,
    name,
    shortTitle,
    shortDesc: `${shortTitle} · collection`,
    desc: `Extended description for the ${name} collection. Hover to reveal.`,
    featured,
    order_index: 0,
    thumbnails: [],
    score,
    isActive,
  }
}

const LEFT_ZONE: ScoredCollection[] = [
  makeCollection('col-a', 'Eastern Europe Analysis', 'E. Europe',   1.0,  true,  true),
  makeCollection('col-b', 'AI & Technology',          'AI / Tech',  0.88, false, true),
  makeCollection('col-c', 'Policy Reports',           'Policy',     0.72, false, true),
  makeCollection('col-d', 'Media Studies',            'Media',      0.55, false, true),
]

const RIGHT_ZONE: ScoredCollection[] = [
  makeCollection('col-e', 'International Development', "Int'l Dev", 0.40, false, false),
  makeCollection('col-f', 'Creative Writing',          'Creative',  0.22, false, false),
]

function CollectionPlaneDemo() {
  const [activeId, setActiveId] = useState<string | null>('col-a')

  const leftZone  = LEFT_ZONE.map(c  => ({ ...c,  isActive: c.id  === activeId }))
  const rightZone = RIGHT_ZONE.map(c => ({ ...c, isActive: c.id === activeId }))

  const btnBase: React.CSSProperties = {
    fontSize: 10, fontWeight: 600, padding: '4px 10px', borderRadius: 3,
    border: '1px solid #3a3030', cursor: 'pointer', letterSpacing: '0.05em',
    textTransform: 'uppercase',
  }
  const btnOn: React.CSSProperties  = { ...btnBase, background: '#6B2A2A', color: '#e0ccc8', border: '1px solid #8a3a3a' }
  const btnOff: React.CSSProperties = { ...btnBase, background: '#1a1818', color: '#888' }

  return (
    <div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
        <button style={activeId ? btnOff : btnOn} onClick={() => setActiveId(null)}>
          No active
        </button>
        {[...LEFT_ZONE, ...RIGHT_ZONE].map(c => (
          <button
            key={c.id}
            style={activeId === c.id ? btnOn : btnOff}
            onClick={() => setActiveId(c.id)}
          >
            {c.shortTitle}
          </button>
        ))}
      </div>

      <div style={{ fontSize: 10, color: '#555', marginBottom: 16, fontFamily: 'monospace' }}>
        active: {activeId ?? 'null'} &nbsp;|&nbsp;
        left zone: {leftZone.length} &nbsp;|&nbsp;
        right zone: {rightZone.length}
      </div>

      <CollectionPlane
        leftZone={leftZone}
        rightZone={rightZone}
        onCollectionClick={(id) => setActiveId(id)}
        onCollectionDismiss={() => setActiveId(null)}
      />

      <div style={{ fontSize: 10, color: '#555', marginTop: 12, lineHeight: 1.6 }}>
        Left zone (featured): E. Europe (active), AI / Tech, Policy, Media &nbsp;·&nbsp;
        Right zone (non-featured): Int&apos;l Dev, Creative &nbsp;·&nbsp;
        Hover any card to expand. × button appears only on active card.
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// PeriTriad — three PeriPair-style cards with coordinated hover
// ---------------------------------------------------------------------------

type TriadCard = {
  name: string
  shortTitle?: string
  shortDesc?: string
  desc?: string
}

// Test page placeholder — live environment sources icons from the resume_asset_icons
// table in admin (icon_key field on resume_assets → joined icon_url).
const ASSET_ICON_URL = 'https://www.iconpacks.net/icons/1/free-document-icon-901-thumb.png'

function PeriTriad({ cards }: { cards: TriadCard[] }) {
  const [hovered, setHovered] = useState<number | null>(null)
  // Debounce hover-leave to prevent the rightmost card from flickering when
  // the layout shift during animation briefly moves the card out from under the cursor.
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const reduced = useReducedMotion()
  const DUR = '0.28s cubic-bezier(0.4,0,0.2,1)'

  const handleEnter = (i: number) => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current)
    setHovered(i)
  }
  const handleLeave = () => {
    leaveTimer.current = setTimeout(() => setHovered(null), 150)
  }

  return (
    <div style={{ display: 'flex', gap: 4, alignItems: 'flex-start' }}>
      {cards.map((card, i) => {
        const isHovered = hovered === i
        const isCondensed = hovered !== null && hovered !== i

        return (
          <motion.div
            key={i}
            animate={{ width: isCondensed ? 10 : isHovered ? 290 : 150 }}
            transition={dmTransition(reduced)}
            onMouseEnter={() => handleEnter(i)}
            onMouseLeave={handleLeave}
            style={{
              display: 'flex',
              flexDirection: 'column',
              borderRadius: 3,
              border: isHovered ? '0.5px solid #1c1818' : '0.5px solid rgba(26,26,26,0.35)',
              background: isCondensed ? '#9a9994' : '#c7c7c2',
              flexShrink: 0,
              overflow: isCondensed ? 'hidden' : 'visible',
              cursor: 'pointer',
            }}
          >
            <div style={{ opacity: isCondensed ? 0 : 1, transition: 'opacity 0.2s', display: 'flex', flexDirection: 'column' }}>
              <div style={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', height: 72, width: '100%' }}>
                {isHovered && (
                  <div style={{
                    width: 104, height: '100%', flexShrink: 0,
                    background: '#b8b4b0', marginLeft: 6, borderRadius: 2,
                    overflow: 'hidden', position: 'relative', top: -10,
                    boxShadow: '2px 4px 8px rgba(0,0,0,0.14)',
                    transform: 'perspective(280px) rotateY(10deg)',
                    transformOrigin: 'left center',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span style={{ fontSize: 9, color: '#8a8480', textAlign: 'center', padding: 8 }}>No img</span>
                  </div>
                )}
                {!isHovered && (
                  <img
                    src={ASSET_ICON_URL}
                    alt=""
                    style={{ width: 20, height: 20, margin: '10px 0 0 8px', flexShrink: 0, objectFit: 'contain' }}
                  />
                )}
                <div style={{
                  flex: 1, padding: '1px 8px 6px', display: 'flex', flexDirection: 'column',
                  justifyContent: 'flex-start', textAlign: 'right', minWidth: 0, overflow: 'hidden',
                }}>
                  {!isHovered && (
                    <div style={{ fontSize: 12, fontWeight: 500, color: '#1a1a1a', marginTop: 5, lineHeight: 1.5, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
                      {card.shortTitle || card.name}
                    </div>
                  )}
                  {isHovered && (
                    <div style={{ fontSize: 13, fontWeight: 500, color: '#1a1a1a', lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', maxWidth: '24ch', marginLeft: 'auto' } as React.CSSProperties}>
                      {card.name}
                    </div>
                  )}
                  {!isHovered && (
                    // Peri description — sourced from peri_description field in admin.
                    // Force-clamped at 22 chars (matching nav/thumb peri card behaviour). TODO: implement clamp.
                    <div style={{ fontSize: 12, color: '#303030', marginTop: 23, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {card.shortDesc}
                    </div>
                  )}
                </div>
              </div>
              <div style={{
                textAlign: 'right', padding: isHovered ? '2px 12px 8px' : '0 12px',
                fontSize: 12, lineHeight: 1.45, textIndent: 98, color: '#363030',
                maxHeight: isHovered ? 64 : 0, overflow: 'hidden',
                marginTop: isHovered ? -15 : 0,
                transition: `max-height ${DUR}, margin-top ${DUR}`,
                display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical',
              } as React.CSSProperties}>
                {card.desc}
              </div>
            </div>
          </motion.div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default function CardsTestPage() {
  return (
    <div style={pageStyle}>
      <h1 style={{ fontSize: 18, fontWeight: 600, color: '#e0e0e0', marginBottom: 6 }}>
        Card Components — Visual Reference
      </h1>
      <p style={{ fontSize: 12, color: '#888', marginBottom: 30, lineHeight: 1.6 }}>
        All card types and states from the live dynamic menu. Hover each card to test transitions.
      </p>

      {/* ── Row 1: NavCard — Categories ───────────────────────────── */}
      <div style={sectionTitle}>Row 1 — NavCard · Categories</div>
      <p style={{ fontSize: 11, color: '#555', marginBottom: 16, lineHeight: 1.6 }}>
        Categories always render as NavCard. Expanded variant: 300px always, shortDesc at rest, desc + ThumbnailStack on hover.
        Collapsed variant: 90px at rest → 300px on individual hover. Hover-overlay: plane-wide 300px, shortDesc at rest, desc on individual hover.
        Note: categories have no peri card state — only NavCard in all states.
      </p>
      <div style={row}>

        <div style={col}>
          <div style={label}>Active (selected)</div>
          <NavCard
            variant="expanded"
            name="Analysis"
            shortDesc="Policy · AI · Geopolitics"
            desc="In-depth analysis across policy, AI governance, and international affairs. Ground-level reporting from Eastern Europe."
            score={1.0}
            isActive={true}
            thumbnails={[]}
            onClick={() => {}}
          />
        </div>

        <div style={col}>
          <div style={label}>Collapsed — hover to expand (90→300px)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 90 }}>
            <NavCard
              variant="collapsed"
              name="Analysis"
              shortDesc="Policy · AI · Geopolitics"
              desc="In-depth analysis across policy, AI governance, and international affairs."
              score={1.0}
              isActive={true}
              thumbnails={[]}
              onClick={() => {}}
            />
            <NavCard
              variant="collapsed"
              name="Research"
              shortDesc="Academic · Reports"
              desc="Academic papers, white papers, and policy reports spanning technology and law."
              score={0.80}
              isActive={false}
              thumbnails={[]}
              onClick={() => {}}
            />
            <NavCard
              variant="collapsed"
              name="Creative"
              shortDesc="Writing · Narrative"
              desc="Long-form narrative writing, essays, and creative non-fiction."
              score={0.25}
              isActive={false}
              thumbnails={[]}
              onClick={() => {}}
            />
          </div>
        </div>

        <div style={col}>
          <div style={label}>Hover-overlay mode (isHoverOverlay=true) — plane-wide 300px, shortDesc at rest</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <NavCard
              variant="collapsed"
              isHoverOverlay={true}
              name="Analysis"
              shortDesc="Policy · AI · Geopolitics"
              desc="In-depth analysis across policy, AI governance, and international affairs."
              score={1.0}
              isActive={true}
              thumbnails={[]}
              onClick={() => {}}
            />
            <NavCard
              variant="collapsed"
              isHoverOverlay={true}
              name="Research"
              shortDesc="Academic · Reports"
              desc="Academic papers, white papers, and policy reports."
              score={0.80}
              isActive={false}
              thumbnails={[]}
              onClick={() => {}}
            />
            <NavCard
              variant="collapsed"
              isHoverOverlay={true}
              name="Creative"
              shortDesc="Writing · Narrative"
              desc="Long-form narrative writing and creative non-fiction."
              score={0.25}
              isActive={false}
              thumbnails={[]}
              onClick={() => {}}
            />
          </div>
        </div>

        <div style={col}>
          <div style={label}>Focus (score 0.80) — expanded variant</div>
          <NavCard
            variant="expanded"
            name="Research"
            shortDesc="Academic · Reports"
            desc="Academic papers, white papers, and policy reports spanning technology, international law, and political economy."
            score={0.80}
            isActive={false}
            thumbnails={[]}
            onClick={() => {}}
          />
        </div>

        <div style={col}>
          <div style={label}>Related (score 0.25) — expanded variant</div>
          <NavCard
            variant="expanded"
            name="Creative"
            shortDesc="Writing · Narrative"
            desc="Long-form narrative writing, essays, and creative non-fiction exploring contemporary issues."
            score={0.25}
            isActive={false}
            thumbnails={[]}
            onClick={() => {}}
          />
        </div>

      </div>
      <hr style={divider} />

      {/* ── Row 2: NavCard + Peri — Subcategories ─────────────────── */}
      <div style={sectionTitle}>Row 2 — NavCard + PeriSolo + PeriPair · Subcategories (layout=&quot;nav&quot;)</div>
      <p style={{ fontSize: 11, color: '#555', marginBottom: 16, lineHeight: 1.6 }}>
        Active/focus subcategories: NavCard (same as categories). Related subcategories with &gt;5 items in list: PeriSolo (isolated) or PeriPair (paired).
        PeriSolo/PeriPair layout=&quot;nav&quot;: text left, ThumbnailStack right, 150px rest → 300px hover.
        Note: score 0.28 is in the related zone (below 0.50 seam) — title color is #b0b0b0 grey, not #1a1a1a dark.
      </p>
      <div style={row}>

        <div style={col}>
          <div style={label}>Active (selected)</div>
          <NavCard
            variant="expanded"
            name="EU Integration"
            shortDesc="Accession · Balkans"
            desc="European Union accession politics in Southeast Europe — tracking reforms and diplomatic milestones."
            score={1.0}
            isActive={true}
            thumbnails={[]}
            onClick={() => {}}
          />
        </div>

        <div style={col}>
          <div style={label}>Collapsed — hover to expand (90→300px)</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, width: 90 }}>
            <NavCard
              variant="collapsed"
              name="EU Integration"
              desc="European Union accession politics in Southeast Europe."
              score={1.0}
              isActive={true}
              thumbnails={[]}
              onClick={() => {}}
            />
            <NavCard
              variant="collapsed"
              name="AI Policy"
              desc="Policy frameworks for artificial intelligence governance."
              score={0.85}
              isActive={false}
              thumbnails={[]}
              onClick={() => {}}
            />
            <NavCard
              variant="collapsed"
              name="Media Studies"
              desc="Press freedom, media ecosystems, and disinformation."
              score={0.70}
              isActive={false}
              thumbnails={[]}
              onClick={() => {}}
            />
          </div>
        </div>

        <div style={col}>
          <div style={label}>Focus (score 1.00)</div>
          <NavCard
            variant="expanded"
            name="EU Integration"
            shortDesc="Accession · Balkans"
            desc="European Union accession politics in Southeast Europe — tracking reforms and diplomatic milestones."
            score={1.00}
            isActive={false}
            thumbnails={[]}
            onClick={() => {}}
          />
        </div>

        <div style={col}>
          <div style={label}>Focus (score 0.70)</div>
          <NavCard
            variant="expanded"
            name="Media Studies"
            shortDesc="Press · Disinformation"
            desc="Press freedom, media ecosystems, and disinformation research across Southeastern Europe."
            score={0.70}
            isActive={false}
            thumbnails={[]}
            onClick={() => {}}
          />
        </div>

        <div style={col}>
          <div style={label}>Related (score 0.28) — below 0.50 seam, grey title</div>
          <NavCard
            variant="expanded"
            name="Photo Essays"
            shortDesc="Visual storytelling"
            desc="Documentary photography and visual storytelling for editorial platforms."
            score={0.28}
            isActive={false}
            thumbnails={[]}
            onClick={() => {}}
          />
        </div>

        <div style={col}>
          <div style={label}>PeriSolo nav — 150px rest → 300px hover, ThumbnailStack right</div>
          <PeriSolo
            layout="nav"
            name="Feature Writing and Narrative Journalism"
            shortTitle="Feature Writing"
            shortDesc="Long-form narrative"
            desc="Long-form feature writing, narrative journalism, and investigative reporting techniques."
            thumbnails={[]}
            onClick={() => {}}
          />
        </div>

        <div style={col}>
          <div style={label}>PeriPair nav — hover one, partner collapses; ThumbnailStack right</div>
          <PeriPair
            layout="nav"
            left={{
              name: 'Feature Writing and Narrative Journalism',
              shortTitle: 'Feature Writing',
              shortDesc: 'Long-form',
              desc: 'Long-form feature writing and narrative journalism techniques.',
              thumbnails: [],
            }}
            right={{
              name: 'Photo Essays and Visual Storytelling',
              shortTitle: 'Photo Essays',
              shortDesc: 'Visual work',
              desc: 'Documentary photography and visual storytelling for editorial platforms.',
              thumbnails: [],
            }}
            onLeftClick={() => {}}
            onRightClick={() => {}}
          />
        </div>

      </div>
      <hr style={divider} />

      {/* ── Row 3: CollectionCard ──────────────────────────────────── */}
      <div style={sectionTitle}>Row 3 — CollectionCard · Collections (bottom row)</div>
      <p style={{ fontSize: 11, color: '#555', marginBottom: 16, lineHeight: 1.6 }}>
        140px at rest (160px when active) → 290px on hover. Cards grow upward (CollectionPlane uses overflow:visible + alignItems:flex-end).
        Active: red left border + dismiss (×) button. Focus: light bg at rest. Related: dark bg at rest → #b4b0ac on hover.
        Hover any card to expand: name goes uppercase, desc reveals, ThumbnailStack slides in from right.
      </p>
      <div style={{ ...row, alignItems: 'flex-end' }}>

        <div style={col}>
          <div style={label}>Active — red left border, × dismiss</div>
          <CollectionCard
            name="Eastern Europe Analysis"
            shortTitle="E. Europe"
            shortDesc="Regional reports and dispatches"
            desc="In-depth analysis of Eastern European politics, economics, and society."
            score={1.0}
            isActive={true}
            thumbnails={[]}
            onClick={() => {}}
            onDismiss={() => alert('dismissed')}
          />
        </div>

        <div style={col}>
          <div style={label}>Focus (score 1.00) — light bg at rest</div>
          <CollectionCard
            name="AI & Technology"
            shortTitle="AI / Tech"
            shortDesc="Machine learning and policy"
            desc="Coverage of AI policy, machine learning research, and technology governance."
            score={1.00}
            isActive={false}
            thumbnails={[]}
            onClick={() => {}}
          />
        </div>

        <div style={col}>
          <div style={label}>Focus (score 0.52) — just above 0.50 seam</div>
          <CollectionCard
            name="Policy Reports"
            shortTitle="Policy"
            shortDesc="Institutional · White papers"
            desc="Institutional policy reports and white papers spanning technology and governance."
            score={0.52}
            isActive={false}
            thumbnails={[]}
            onClick={() => {}}
          />
        </div>

        <div style={col}>
          <div style={label}>Related (score 0.28) — dark bg at rest</div>
          <CollectionCard
            name="Media Studies"
            shortTitle="Media"
            shortDesc="Press · Disinformation"
            desc="Press freedom, media ecosystems, and disinformation research."
            score={0.28}
            isActive={false}
            thumbnails={[]}
            onClick={() => {}}
          />
        </div>

        <div style={col}>
          <div style={label}>Related (score 0.05) — deep related, dark bg</div>
          <CollectionCard
            name="Creative Writing"
            shortTitle="Creative"
            shortDesc="Essays · Fiction"
            desc="Long-form creative writing, essays, and literary non-fiction."
            score={0.05}
            isActive={false}
            thumbnails={[]}
            onClick={() => {}}
          />
        </div>

      </div>
      <hr style={divider} />

      {/* ── Row 4: SubheaderCard ───────────────────────────────────── */}
      <div style={sectionTitle}>Row 4 — SubheaderCard (content plane column header)</div>
      <p style={{ fontSize: 11, color: '#555', marginBottom: 16, lineHeight: 1.6 }}>
        300px (columns=1) or 608px (columns=2, spanning a split PeriPair column). 42px at rest → 72px on hover.
        Dark bg #0d0a0a → #c7c7c2 on hover. shortDesc slides out, full desc slides in. ThumbnailStack fades in on hover.
        isCollectionActive=true: name shifts to #A85A5A, border to #6B2A2A (collection is selected but subheader is still visible because
        the column belongs to a non-active collection).
      </p>
      <div style={row}>

        <div style={col}>
          <div style={label}>At rest — hover to see expanded + desc + thumbnails</div>
          <SubheaderCard
            name="Politics & Society"
            shortDesc="Geopolitics, policy analysis, international relations"
            desc="Geopolitics, policy analysis, and international relations — exploring EU dynamics, Balkan politics, and global power shifts through in-depth ground-level reporting and analysis."
            itemCount={12}
            thumbnails={[]}
            isCollectionActive={false}
            onClick={() => {}}
          />
        </div>

        <div style={col}>
          <div style={label}>Collection active (name #A85A5A, border #6B2A2A) — IGNORE, NOT IN USE</div>
          <SubheaderCard
            name="Technology & AI"
            shortDesc="Machine learning, AI policy, future of work"
            desc="Exploring the intersection of artificial intelligence, policy, and society — from governance frameworks to frontier research."
            itemCount={8}
            thumbnails={[]}
            isCollectionActive={true}
            onClick={() => {}}
          />
        </div>

        <div style={col}>
          <div style={label}>Wide (columns=2, 608px) — spans a PeriPair split column</div>
          <SubheaderCard
            name="Eastern Europe"
            shortDesc="Politics, economics, and society across the region"
            desc="In-depth reporting on Eastern European politics, economics, and society — EU accession, press freedom, and regional development."
            itemCount={10}
            thumbnails={[]}
            isCollectionActive={false}
            columns={2}
            onClick={() => {}}
          />
        </div>

      </div>
      <hr style={divider} />

      {/* ── Row 5: ThumbCard + Peri — Content ─────────────────────── */}
      <div style={sectionTitle}>Row 5 — ThumbCard + PeriSolo + PeriPair · Content (layout=&quot;content&quot;)</div>
      <p style={{ fontSize: 11, color: '#555', marginBottom: 16, lineHeight: 1.6 }}>
        ThumbCard: 300px wide, focus/active content items. Active: desc always visible, thumbnail always lifted, red left border.
        Focus/related: score-driven colors at rest → #c7c7c2 bg + desc expands + thumbnail lifts on hover.
        PeriSolo/PeriPair layout=&quot;content&quot;: text right-aligned, single thumbnail lifts from left with 3D perspective, 150px rest → 300px hover.
      </p>
      <div style={row}>

        <div style={col}>
          <div style={label}>Active (selected) — desc always visible, thumbnail always lifted</div>
          <ThumbCard
            name="Serbia EU Accession Analysis"
            shortDesc="Accession policy analysis"
            desc="Comprehensive accession policy analysis and strategic overview for southeastern European EU integration tactics."
            publication="Report"
            year={2023}
            score={1.0}
            isActive={true}
            onClick={() => {}}
          />
        </div>

        <div style={col}>
          <div style={label}>Focus (score 1.00) — hover: desc expands, thumbnail lifts</div>
          <ThumbCard
            name="AI Agents in Integration"
            shortDesc="Agentic workflows in pipelines"
            desc="Agentic workflows and architecture in modern data pipelines — implementation patterns and case studies."
            publication="White paper"
            year={2024}
            score={1.0}
            isActive={false}
            onClick={() => {}}
          />
        </div>

        <div style={col}>
          <div style={label}>Focus (score 0.70)</div>
          <ThumbCard
            name="GEO for Journalists"
            shortDesc="Generative engine optimization"
            desc="Optimization strategies for journalists navigating AI-driven search engines and content discovery platforms."
            publication="Guide"
            year={2024}
            score={0.70}
            isActive={false}
            onClick={() => {}}
          />
        </div>

        <div style={col}>
          <div style={label}>Focus (score 0.52) — just above 0.50 seam</div>
          <ThumbCard
            name="Machine Learning in Policy Analysis"
            shortDesc="ML pipelines for policy"
            desc="How machine learning transforms evidence-based policy development and international affairs research."
            publication="Article"
            year={2024}
            score={0.52}
            isActive={false}
            onClick={() => {}}
          />
        </div>

        <div style={col}>
          <div style={label}>Related (score 0.28) — below 0.50 seam, grey title</div>
          <ThumbCard
            name="LCB Dispatch #14"
            shortDesc="Eastern Europe"
            desc="Weekly geopolitical briefing from Eastern Europe covering politics, economics, and regional developments."
            publication="Newsletter"
            year={2023}
            score={0.28}
            isActive={false}
            onClick={() => {}}
          />
        </div>

        <div style={col}>
          <div style={label}>PeriSolo content — 150px rest → 300px hover, thumbnail left (3D lift)</div>
          <PeriSolo
            name="GEO Training Materials for Journalists"
            shortTitle="GEO for Journalists"
            shortDesc="Generative engines"
            desc="Optimization strategies for journalists navigating AI-driven search engines and content discovery platforms."
            publication="Guide"
            year={2024}
            onClick={() => {}}
          />
        </div>

        <div style={col}>
          <div style={label}>PeriPair content — hover one, partner collapses to sliver; thumbnail left</div>
          <PeriPair
            left={{
              name: 'Ethical governance frameworks for enterprises',
              shortTitle: 'Op-Ed: Tech Ethics',
              shortDesc: 'Responsible AI use',
              desc: 'Ethical AI governance frameworks for enterprise AI deployment and ethical decision-making.',
              publication: 'Op-ed',
              year: 2024,
            }}
            right={{
              name: 'LCB Dispatch #14',
              shortTitle: 'LCB Dispatch #14',
              shortDesc: 'Eastern Europe',
              desc: 'Weekly geopolitical briefing from Eastern Europe covering politics, economics, and regional developments.',
              publication: 'Newsletter',
              year: 2023,
            }}
            onLeftClick={() => {}}
            onRightClick={() => {}}
          />
        </div>

      </div>
      <hr style={divider} />

      {/* ── Score Spectrum ─────────────────────────────────────────── */}
      <div style={sectionTitle}>Score Spectrum (0.01 → 1.00)</div>
      <p style={{ fontSize: 11, color: '#555', marginBottom: 20, lineHeight: 1.7, maxWidth: 560 }}>
        Ten cards scored 0.01 → 1.00. Score drives background, title color, and description color continuously.
        Two gradients meet at the 0.50 seam: gradient A (dark bg, #b0b0b0 title, #989898 desc) and gradient B (light bg, #1a1a1a title, #303030 desc).
      </p>

      {/* Active reference */}
      <div style={{ marginBottom: 24 }}>
        <div style={{ ...label, marginBottom: 8 }}>Active state (fixed reference — accent colors, outside spectrum)</div>
        <div style={{
          width: 300, borderRadius: 3, padding: '8px 12px',
          background: '#d2c8c8', border: '0.5px solid #6B2A2A', borderLeft: '2px solid #fc5454',
          display: 'flex', flexDirection: 'column', gap: 2,
        }}>
          <div style={{ fontSize: 13, fontWeight: 500, color: '#6b2a2a', lineHeight: 1.4 }}>Serbia&apos;s EU Path</div>
          <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.03em', color: '#8a5050', marginTop: 1 }}>Reuters · 2023</div>
          <div style={{ fontSize: 12, lineHeight: 1.45, color: '#8a5050', marginTop: 3 }}>Accession policy analysis and the road to membership.</div>
        </div>
      </div>

      {/* Spectrum rows */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 40 }}>
        {SPECTRUM_CARDS.map((card, i) => {
          const colors = interpolateMenuScore(card.score)
          const borderColor = borderColorFromScore(card.score)
          const prevCard = SPECTRUM_CARDS[i - 1]
          const showSeam = prevCard && prevCard.score >= 0.50 && card.score < 0.50
          return (
            <div key={card.score}>
              {showSeam && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '4px 0 4px 50px' }}>
                  <div style={{ width: 300, height: 1, background: '#fc545430' }} />
                  <div style={{ fontSize: 9, color: '#fc545460', whiteSpace: 'nowrap' }}>← text switches to #b0b0b0 + desc to #989898 below seam 0.50</div>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ fontSize: 10, color: '#555', width: 36, textAlign: 'right', flexShrink: 0, fontVariantNumeric: 'tabular-nums' } as React.CSSProperties}>
                  {card.score.toFixed(2)}
                </div>
                <div style={{
                  borderRadius: 3, padding: '8px 12px', width: 300, flexShrink: 0,
                  display: 'flex', flexDirection: 'column', gap: 2,
                  background: colors.background, border: `0.5px solid ${borderColor}`,
                }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: colors.color, lineHeight: 1.4 }}>{card.title}</div>
                  <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '0.03em', color: colors.color, marginTop: 1 }}>{card.meta}</div>
                  <div style={{ fontSize: 12, lineHeight: 1.45, color: colors.descColor, marginTop: 3 }}>{card.desc}</div>
                </div>
                <div style={{ width: 60, height: 4, background: '#1a1616', borderRadius: 2, overflow: 'hidden', flexShrink: 0 }}>
                  <div style={{ height: '100%', background: '#6B2A2A', borderRadius: 2, width: `${card.score * 100}%` }} />
                </div>
              </div>
            </div>
          )
        })}
      </div>

      <hr style={divider} />

      {/* ── ThumbnailStack ─────────────────────────────────────────── */}
      <div style={sectionTitle}>ThumbnailStack — standalone (isVisible=true)</div>
      <div style={row}>
        <div style={col}>
          <div style={label}>Empty (no thumbnails)</div>
          <div style={{ height: 80, position: 'relative', background: '#1a1818', borderRadius: 4, padding: 4 }}>
            <ThumbnailStack thumbnails={[]} isVisible={true} parentHovered={false} />
          </div>
        </div>
        <div style={col}>
          <div style={label}>isVisible=false (opacity 0)</div>
          <div style={{ height: 80, position: 'relative', background: '#1a1818', borderRadius: 4, padding: 4 }}>
            <ThumbnailStack thumbnails={[]} isVisible={false} parentHovered={false} />
          </div>
        </div>
      </div>

      <hr style={divider} />

      {/* ── CategoryPlane ──────────────────────────────────────────── */}
      <div style={{ ...sectionTitle, color: '#5a8aA8' }}>CategoryPlane — interactive demo</div>
      <p style={{ fontSize: 11, color: '#555', marginBottom: 20, lineHeight: 1.7, maxWidth: 600 }}>
        Toggle <strong style={{ color: '#888' }}>Expanded / Collapsed</strong> to test layout animation.
        In Collapsed mode, hover the plane to trigger <strong style={{ color: '#888' }}>hover-overlay</strong> (dark bg + shadow, all cards 300px).
        In all modes, hovering an individual card switches it to focus colors (#c7c7c2).
        Enable <strong style={{ color: '#888' }}>7 subcategories</strong> to see PeriPair layout=&quot;nav&quot; — ThumbnailStack right, text left — for related subcategories.
        Related subcategory peri cards only appear when items actually overflow the viewport.
      </p>
      <CategoryPlaneDemo />

      <hr style={divider} />

      {/* ── ContentPlane ───────────────────────────────────────────── */}
      <div style={{ ...sectionTitle, color: '#5a8aA8' }}>ContentPlane — interactive demo</div>
      <p style={{ fontSize: 11, color: '#555', marginBottom: 20, lineHeight: 1.7, maxWidth: 600 }}>
        Tests 1–3 columns with SubheaderCard, ThumbCard, PeriSolo, PeriPair (layout=&quot;content&quot;).
        Pairing only fires when items overflow the unscrolled viewport — 5 items in a no-subheader column all render as full ThumbCards.
        Toggle <strong style={{ color: '#888' }}>active collection</strong> to remove the subheader.
        Click an item to set it active (red accent). Hover ThumbCards to test focus-color transition.
      </p>
      <ContentPlaneDemo />

      <hr style={divider} />

      {/* ── CollectionPlane ────────────────────────────────────────── */}
      <div style={{ ...sectionTitle, color: '#5a8aA8' }}>CollectionPlane — interactive demo</div>
      <p style={{ fontSize: 11, color: '#555', marginBottom: 20, lineHeight: 1.7, maxWidth: 600 }}>
        Single horizontal row pinned to bottom. Container is height:36 + overflow:visible so expanding cards grow upward without shifting layout above.
        Click a card to set it active (red left border + × dismiss button). Click × to dismiss.
        Hover to expand to 290px — description expands inline below name, ThumbnailStack slides in from right.
        Left zone = featured, right zone = non-featured (no visible divider).
      </p>
      <CollectionPlaneDemo />

      <hr style={divider} />

      {/* ── Download Card ──────────────────────────────────────────── */}
      <div style={sectionTitle}>DownloadCard — Phase 11 Stage 1</div>
      <p style={{ fontSize: 11, color: '#555', marginBottom: 20, lineHeight: 1.7, maxWidth: 560 }}>
        At-rest state mirrors ThumbCard focus at score 1.00 on-hover: #c7c7c2 bg, thumbnail permanently lifted,
        description always visible. Hover to expand 20px downward and reveal the &quot;Include Resume&quot; zone.
        Two click zones: main body logs a download action; &quot;Include Resume&quot; logs a separate toggle action.
      </p>
      <div style={row}>

        <div style={col}>
          <div style={label}>No thumbnail — hover to test expand + Include Resume zone</div>
          <DownloadCard
            name="AI Agents in Integration Pipelines"
            desc="Agentic workflows and architecture in modern B2B data pipelines — implementation patterns and case studies."
            publication="White paper"
            year={2024}
            onDownload={(incl) => console.log('[DownloadCard] Download: AI Agents in Integration Pipelines, includeResume:', incl)}
          />
        </div>

        <div style={col}>
          <div style={label}>Short title + short desc</div>
          <DownloadCard
            name="GEO for Journalists"
            desc="Optimization strategies for journalists navigating AI-driven search and content discovery."
            publication="Guide"
            year={2024}
            onDownload={(incl) => console.log('[DownloadCard] Download: GEO for Journalists, includeResume:', incl)}
          />
        </div>

        <div style={col}>
          <div style={label}>Long title — truncates at 2 lines</div>
          <DownloadCard
            name="Comprehensive EU Accession Policy Analysis and Strategic Integration Overview for Southeast Europe"
            desc="Policy analysis and strategic overview for southeastern European EU integration tactics — a full assessment of the reform landscape."
            publication="Report"
            year={2023}
            onDownload={(incl) => console.log('[DownloadCard] Download: EU Accession Policy Analysis, includeResume:', incl)}
          />
        </div>

      </div>

      <hr style={divider} />

      {/* ── Profile Plane — Resume Cards ───────────────────────────── */}
      <div style={sectionTitle}>Profile Plane — Resume Cards (Phase 12)</div>
      <p style={{ fontSize: 11, color: '#555', marginBottom: 20, lineHeight: 1.7, maxWidth: 560 }}>
        Cards rendered on the resume overlay plane. Date on one line (10px, uppercase, white-space:nowrap — sized to fit longest
        &ldquo;September 2020 — September 2022&rdquo;). Company/title prominent (serif 1rem). Subtitle below. Optional
        plane_description (2 lines max via -webkit-line-clamp). No description fallback — field must be set in admin.
      </p>
      <div style={row}>

        <div style={col}>
          <div style={label}>With plane_description — 2 lines</div>
          <PlaneResumeCard
            card={{ id: 'r1', title: 'Axway', subtitle: 'Senior Content Strategist', dateStart: '2022-09-01', dateEnd: null, shortDescription: null, planeDescription: 'Leading content and go-to-market strategy for a global integration platform serving 11,000+ customers.' }}
            index={0}
            planeHovered={false}
          />
        </div>

        <div style={col}>
          <div style={label}>No description — title + subtitle only</div>
          <PlaneResumeCard
            card={{ id: 'r2', title: 'Reuters', subtitle: 'Staff Reporter', dateStart: '2020-09-01', dateEnd: '2022-08-01', shortDescription: null, planeDescription: null }}
            index={1}
            planeHovered={false}
          />
        </div>

        <div style={col}>
          <div style={label}>planeHovered=true — parallax + shadow active</div>
          <PlaneResumeCard
            card={{ id: 'r3', title: 'Johns Hopkins University', subtitle: 'Graduate Researcher', dateStart: '2018-09-01', dateEnd: '2023-05-01', shortDescription: null, planeDescription: 'M.A. research on digital media ecosystems and political communication in post-socialist states.' }}
            index={0}
            planeHovered={true}
          />
        </div>

        <div style={col}>
          <div style={label}>Longest date range — fits one line at 10px</div>
          <PlaneResumeCard
            card={{ id: 'r4', title: 'Company Name Here', subtitle: 'Job Title', dateStart: '2020-09-01', dateEnd: '2022-09-01', shortDescription: null, planeDescription: null }}
            index={0}
            planeHovered={false}
          />
        </div>

      </div>

      <hr style={divider} />

      {/* ── Asset Cards ───── */}
      <div style={sectionTitle}>PeriPair Asset Cards</div>
      <p style={{ fontSize: 11, color: '#555', marginBottom: 20, lineHeight: 1.7, maxWidth: 560 }}>
        PeriPair layout=&ldquo;content&rdquo; at score 1.00 (focus), extended to a triad. Hover one card → the other two
        condense to a 10px sliver. Shared hover state is coordinated across all three cards via <code>PeriTriad</code>.
        150px at rest → 290px on hover; thumbnail placeholder lifts with 3D perspective.{' '}
        <strong style={{ color: '#888' }}>Icons</strong> on collapsed cards are sourced from the <code>resume_asset_icons</code> table
        in admin (joined via <code>icon_key</code> on each asset); the URL used here is a test placeholder.{' '}
        <strong style={{ color: '#888' }}>Peri descriptions</strong> come from the <code>peri_description</code> field in admin
        and will be force-clamped at 22 chars to match nav/thumb peri card behaviour (TODO: implement clamp in live component).
      </p>
      <div style={row}>

        <div style={col}>
          <div style={label}>Triad — hover one card to condense the other two</div>
          <PeriTriad
            cards={[
              {
                name: 'Axway — Senior Content Strategist',
                shortTitle: 'Axway',
                shortDesc: 'Content & GTM Strategy',
                desc: 'Leading content and go-to-market strategy for a global integration platform serving 11,000+ customers.',
              },
              {
                name: 'Reuters — Staff Reporter',
                shortTitle: 'Reuters',
                shortDesc: 'Investigative Reporting',
                desc: 'Staff reporter covering Eastern European politics, EU integration, and regional security affairs.',
              },
              {
                name: 'Johns Hopkins SAIS — Graduate Researcher',
                shortTitle: 'Johns Hopkins',
                shortDesc: 'Digital Media Research',
                desc: 'M.A. research on digital media ecosystems and political communication in post-socialist states.',
              },
            ]}
          />
        </div>

      </div>
    </div>
  )
}
