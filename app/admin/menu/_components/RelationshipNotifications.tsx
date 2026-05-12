'use client'

/**
 * Stage 14f — Relationship Notifications
 * Shows last 5 auto-detected relationship change notifications.
 * Accept → marks as accepted. Override → opens override modal.
 */

import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import type { PageData, Notification } from '../page'

function getEntityName(data: PageData, type: string, id: string): string {
  if (type === 'category') return data.categories.find(c => c.id === id)?.name || id
  if (type === 'subcategory') {
    const s = data.subcategories.find(s => s.id === id)
    if (!s) return id
    return `${data.categories.find(c => c.id === s.category_id)?.name || '?'} / ${s.name}`
  }
  if (type === 'collection') return data.collections.find(c => c.id === id)?.name || id
  if (type === 'content') return data.content.find(c => c.id === id)?.title || id
  return id
}

// ---------------------------------------------------------------------------
// Single notification row
// ---------------------------------------------------------------------------

function NotificationRow({
  notif,
  entityAName,
  entityBName,
  onAccept,
  onOverride,
}: {
  notif: Notification
  entityAName: string
  entityBName: string
  onAccept: () => void
  onOverride: () => void
}) {
  const isPending = notif.admin_action === 'pending'

  const actionColor =
    notif.admin_action === 'accepted'
      ? 'text-green-400'
      : notif.admin_action === 'overridden'
        ? 'text-blue-400'
        : 'text-yellow-400'

  const changeColor = notif.change_type.toLowerCase().includes('added')
    ? 'bg-green-900/40 text-green-300'
    : 'bg-red-900/40 text-red-300'

  return (
    <div
      className={`rounded-lg p-4 border ${
        isPending
          ? 'bg-gray-800 border-gray-700'
          : 'bg-gray-900 border-gray-800 opacity-60'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${changeColor}`}>
              {notif.change_type.replace(/_/g, ' ')}
            </span>
            <span className={`text-xs ${actionColor}`}>{notif.admin_action}</span>
          </div>

          <p className="text-white text-sm">
            <span className="text-gray-400 text-xs">[{notif.entity_a_type}] </span>
            <span className="text-gray-200">{entityAName}</span>
            <span className="text-gray-500 mx-2">↔</span>
            <span className="text-gray-400 text-xs">[{notif.entity_b_type}] </span>
            <span className="text-gray-200">{entityBName}</span>
          </p>

          {notif.reason && (
            <p className="text-gray-400 text-xs mt-1">{notif.reason}</p>
          )}

          <p className="text-gray-600 text-xs mt-1.5">
            {new Date(notif.created_at).toLocaleString()}
          </p>
        </div>

        {isPending && (
          <div className="flex gap-2 shrink-0">
            <Button
              size="sm"
              onClick={onAccept}
              className="bg-green-700 hover:bg-green-600 text-white text-xs px-3 h-7"
            >
              Accept
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={onOverride}
              className="text-xs px-3 h-7"
            >
              Override
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export default function RelationshipNotifications({
  data,
  onDataChange,
  onOpenOverrideModal,
}: {
  data: PageData
  onDataChange: () => void
  onOpenOverrideModal: () => void
}) {
  const supabase = createClient()

  async function acceptNotification(id: string) {
    const { error } = await supabase
      .from('menu_relationship_notifications')
      .update({ admin_action: 'accepted' })
      .eq('id', id)
    if (error) {
      alert('Error: ' + error.message)
      return
    }
    onDataChange()
  }

  async function markOverridden(id: string) {
    await supabase
      .from('menu_relationship_notifications')
      .update({ admin_action: 'overridden' })
      .eq('id', id)
    onOpenOverrideModal()
  }

  return (
    <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-white mb-1">Relationship Notifications</h2>
      <p className="text-gray-400 text-sm mb-4">
        Auto-detected relationship changes (last 5). Written by the system when content
        collection membership changes.
      </p>

      {data.notifications.length === 0 ? (
        <p className="text-gray-500 text-sm py-8 text-center">No notifications.</p>
      ) : (
        <div className="space-y-3">
          {data.notifications.map(notif => (
            <NotificationRow
              key={notif.id}
              notif={notif}
              entityAName={getEntityName(data, notif.entity_a_type, notif.entity_a_id)}
              entityBName={getEntityName(data, notif.entity_b_type, notif.entity_b_id)}
              onAccept={() => acceptNotification(notif.id)}
              onOverride={() => markOverridden(notif.id)}
            />
          ))}
        </div>
      )}

      <div className="mt-6 pt-4 border-t border-gray-800">
        <p className="text-xs text-gray-500">
          Automatic notifications require the{' '}
          <code className="text-gray-400 bg-gray-800 px-1 rounded">
            content_collections_relationship_trigger
          </code>{' '}
          Supabase trigger. Apply{' '}
          <code className="text-gray-400 bg-gray-800 px-1 rounded">
            scripts/menu_relationship_trigger.sql
          </code>{' '}
          via the Supabase SQL editor to enable it.
        </p>
      </div>
    </div>
  )
}
