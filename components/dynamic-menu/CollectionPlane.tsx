'use client'

/**
 * Stage 10 — Collection Plane
 *
 * Single horizontal row pinned to the bottom of the menu.
 * Renders leftZone + rightZone as one seamless flex row — no visible divider.
 *
 * Each collection renders as a CollectionCard:
 *   - Active collection: 160px wide, close (×) button, onDismiss wired
 *   - Focus collections (score ≥ 0.50): 140px, focus colors
 *   - Related collections (score < 0.50): 140px, related colors
 *
 * The one-appearance rule is enforced upstream by computeCollectionPlane() —
 * collections with subheaders in the content plane are already excluded from
 * the input. No deduplication needed here.
 */

import { ScoredCollection } from '@/lib/menu/collectionLayout'
import { CollectionCard } from './cards/CollectionCard'

export interface CollectionPlaneProps {
  leftZone: ScoredCollection[]
  rightZone: ScoredCollection[]
  onCollectionClick: (id: string) => void
  onCollectionDismiss: () => void
}

export function CollectionPlane({
  leftZone,
  rightZone,
  onCollectionClick,
  onCollectionDismiss,
}: CollectionPlaneProps) {
  const all = [...leftZone, ...rightZone]

  if (all.length === 0) return null

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        gap: 4,
        alignItems: 'flex-end',
        flexShrink: 0,
        flexWrap: 'nowrap',
        // Fixed height pins the row so expanding cards grow upward (into the
        // content area) without pushing the content plane.
        height: 36,
        overflow: 'visible',
      }}
    >
      {all.map(collection => (
        <CollectionCard
          key={collection.id}
          name={collection.name}
          shortTitle={collection.shortTitle ?? collection.name}
          shortDesc={collection.shortDesc}
          desc={collection.desc}
          score={collection.score}
          isActive={collection.isActive}
          thumbnails={collection.thumbnails ?? []}
          onClick={() => onCollectionClick(collection.id)}
          onDismiss={collection.isActive ? onCollectionDismiss : undefined}
        />
      ))}
    </div>
  )
}
