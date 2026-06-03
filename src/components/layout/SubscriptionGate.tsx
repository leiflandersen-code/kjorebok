'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useSubscription } from '@/hooks/useSubscription'
import { useLang } from '@/store/langStore'
import { Crown } from 'lucide-react'

// Pages that are always accessible (even without subscription)
const PUBLIC_APP_PATHS = ['/subscribe']

export function SubscriptionGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const { status, hasAccess, daysLeft } = useSubscription()
  const { lang } = useLang()
  const no = lang === 'no'

  useEffect(() => {
    if (status === 'loading') return
    if (PUBLIC_APP_PATHS.includes(pathname)) return
    if (!hasAccess) {
      router.replace('/subscribe')
    }
  }, [status, hasAccess, pathname, router])

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-green-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!hasAccess && !PUBLIC_APP_PATHS.includes(pathname)) {
    return null // router.replace will handle redirect
  }

  return (
    <>
      {/* Trial banner */}
      {status === 'trial' && daysLeft !== null && daysLeft <= 7 && (
        <div
          className="flex items-center justify-between px-4 py-2 bg-amber-500/10 border-b border-amber-500/20 cursor-pointer"
          onClick={() => router.push('/subscribe')}
        >
          <div className="flex items-center gap-2">
            <Crown size={13} className="text-amber-400 flex-shrink-0" />
            <span className="text-amber-300 text-xs">
              {no
                ? `${daysLeft} dager igjen av prøveperioden`
                : `${daysLeft} days left in trial`}
            </span>
          </div>
          <span className="text-amber-400 text-xs font-medium">
            {no ? 'Oppgrader →' : 'Upgrade →'}
          </span>
        </div>
      )}
      {children}
    </>
  )
}
