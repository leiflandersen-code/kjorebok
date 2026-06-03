'use client'

import { useTripStore } from '@/store/tripStore'
import { useSync } from '@/hooks/useSync'
import { useLang } from '@/store/langStore'
import { Wifi, AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SyncBadge() {
  useSync()
  const { syncStatus, pendingCount } = useTripStore()
  const { t } = useLang()

  const config = {
    synced: { icon: CheckCircle2, label: t.sync.synced, color: 'text-green-400' },
    pending: { icon: Wifi, label: `${t.sync.pending} (${pendingCount})`, color: 'text-yellow-400' },
    error: { icon: AlertCircle, label: t.sync.error, color: 'text-red-400' },
  }[syncStatus]

  const Icon = config.icon

  return (
    <div className={cn('flex items-center gap-1 text-xs', config.color)}>
      <Icon size={12} />
      <span>{config.label}</span>
    </div>
  )
}
