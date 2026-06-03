'use client'

import { useTripStore } from '@/store/tripStore'
import { useSync } from '@/hooks/useSync'
import { Wifi, WifiOff, AlertCircle, CheckCircle2 } from 'lucide-react'
import { cn } from '@/lib/utils'

export function SyncBadge() {
  useSync()
  const { syncStatus, pendingCount } = useTripStore()

  const config = {
    synced: { icon: CheckCircle2, label: 'Synkronisert', color: 'text-green-400' },
    pending: { icon: Wifi, label: `Venter på synk (${pendingCount})`, color: 'text-yellow-400' },
    error: { icon: AlertCircle, label: 'Synk-feil', color: 'text-red-400' },
  }[syncStatus]

  const Icon = config.icon

  return (
    <div className={cn('flex items-center gap-1 text-xs', config.color)}>
      <Icon size={12} />
      <span>{config.label}</span>
    </div>
  )
}
