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

export default function RegisterPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const { t } = useLang()

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    const supabase = createClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    })

    if (error) {
      toast.error(error.message)
    } else {
      toast.success(t.auth.registerSuccess)
      const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
      if (!loginError) {
        router.push('/dashboard')
        router.refresh()
      }
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
        </div>

        <Card className="bg-slate-900 border-slate-700">
          <CardHeader>
            <CardTitle className="text-lg text-white">{t.auth.registerTitle}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300">{t.auth.name}</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t.auth.namePlaceholder}
                  required
                  className="bg-slate-800 border-slate-600 text-white h-12 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-300">{t.auth.email}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="bg-slate-800 border-slate-600 text-white h-12 text-base"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">{t.auth.password}</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  required
                  className="bg-slate-800 border-slate-600 text-white h-12 text-base"
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-green-500 hover:bg-green-400 text-slate-900 font-semibold text-base cursor-pointer"
              >
                {loading ? t.auth.registering : t.auth.registerBtn}
              </Button>
            </form>
            <p className="text-center text-slate-400 text-sm mt-4">
              {t.auth.hasAccount}{' '}
              <Link href="/login" className="text-green-400 hover:text-green-300 cursor-pointer">
                {t.auth.signIn}
              </Link>
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
