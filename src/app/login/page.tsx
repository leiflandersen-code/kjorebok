'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'
import { Car } from 'lucide-react'
import { useLang } from '@/store/langStore'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { t } = useLang()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    })

    if (res.status === 429) {
      const data = await res.json()
      toast.error(`For mange forsøk. Vent ${Math.ceil(data.retryAfter / 60)} min.`)
    } else if (!res.ok) {
      toast.error(t.auth.loginError)
    } else {
      // Logg inn klientsiden også for å sette session cookie
      const supabase = createClient()
      await supabase.auth.signInWithPassword({ email, password })
      router.push('/dashboard')
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center gap-3 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-green-500/20 flex items-center justify-center">
            <Car size={32} className="text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Kjørebok</h1>
          <p className="text-slate-400 text-sm text-center">Kjørelogg for Spania</p>
        </div>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg text-white">{t.auth.loginTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">{t.auth.email}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="din@epost.no"
                  required
                  className="bg-slate-800 border-slate-600 text-white h-12 text-base"
                  autoComplete="email"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">{t.auth.password}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="bg-slate-800 border-slate-600 text-white h-12 text-base"
                  autoComplete="current-password"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-green-500 hover:bg-green-400 text-slate-900 font-semibold text-base cursor-pointer"
              >
                {loading ? t.auth.loggingIn : t.auth.loginBtn}
              </Button>
            </form>
            <p className="text-center text-slate-400 text-sm mt-4">
              {t.auth.noAccount}{' '}
              <Link href="/register" className="text-green-400 hover:text-green-300 cursor-pointer">
                {t.auth.signUp}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
