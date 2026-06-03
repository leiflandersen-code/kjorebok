import { BottomNav } from '@/components/layout/BottomNav'
import { SubscriptionGate } from '@/components/layout/SubscriptionGate'

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <SubscriptionGate>
      <div className="flex flex-col min-h-screen">
        <main className="flex-1 pb-20">{children}</main>
        <BottomNav />
      </div>
    </SubscriptionGate>
  )
}
