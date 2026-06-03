'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, List, Users, FileText, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useLang } from '@/store/langStore'

export function BottomNav() {
  const pathname = usePathname()
  const { t } = useLang()

  const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: t.nav.home },
    { href: '/trips', icon: List, label: t.nav.trips },
    { href: '/customers', icon: Users, label: t.nav.customers },
    { href: '/reports', icon: FileText, label: t.nav.reports },
    { href: '/settings', icon: Settings, label: t.nav.settings },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-slate-900 border-t border-slate-700 pb-safe">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto px-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 px-3 py-2 rounded-xl transition-colors cursor-pointer min-w-[44px] min-h-[44px] justify-center',
                active ? 'text-green-400' : 'text-slate-400 hover:text-slate-200'
              )}
            >
              <Icon size={20} strokeWidth={active ? 2.5 : 1.5} />
              <span className="text-[10px] font-medium">{label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
