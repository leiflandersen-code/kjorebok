'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import Link from 'next/link'
import { Car, ArrowLeft } from 'lucide-react'
import { useLang } from '@/store/langStore'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [showForgot, setShowForgot] = useState(false)
  const [resetSent, setResetSent] = useState(false)
  const [resetLoading, setResetLoading] = useState(false)
  const router = useRouter()
  const { t, lang } = useLang()
  const no = lang === 'no'

  // Detect Supabase password-reset token in URL hash and forward to /reset-password
  useEffect(() => {
    if (typeof window === 'undefined') return
    const hash = window.location.hash
    if (hash.includes('access_token') && hash.includes('type=recovery')) {
      router.replace('/reset-password' + hash)
    }
  }, [])

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
      const supabase = createClient()
      await supabase.auth.signInWithPassword({ email, password })
      router.push('/dashboard')
      router.refresh()
    }
    setLoading(false)
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()
    if (!email.trim()) {
      toast.error(no ? 'Skriv inn e-postadressen din' : 'Enter your email address')
      return
    }
    setResetLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    if (error) {
      toast.error(no ? 'Noe gikk galt. Prøv igjen.' : 'Something went wrong. Try again.')
    } else {
      setResetSent(true)
    }
    setResetLoading(false)
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

        {showForgot ? (
          <Card className="bg-slate-900 border-slate-700">
            <CardHeader>
              <CardTitle className="text-lg text-white">
                {no ? 'Tilbakestill passord' : 'Reset password'}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {resetSent ? (
                <div className="text-center space-y-4">
                  <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                    <Car size={24} className="text-green-400" />
                  </div>
                  <p className="text-white font-medium">
                    {no ? 'Sjekk e-posten din!' : 'Check your email!'}
                  </p>
                  <p className="text-slate-400 text-sm">
                    {no
                      ? `Vi har sendt en lenke til ${email}. Klikk på lenken for å sette nytt passord.`
                      : `We sent a link to ${email}. Click it to set a new password.`}
                  </p>
                  <button
                    onClick={() => { setShowForgot(false); setResetSent(false) }}
                    className="text-green-400 text-sm hover:text-green-300 cursor-pointer"
                  >
                    {no ? 'Tilbake til innlogging' : 'Back to login'}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <p className="text-slate-400 text-sm">
                    {no
                      ? 'Skriv inn e-postadressen din så sender vi en lenke for å sette nytt passord.'
                      : 'Enter your email and we\'ll send a link to reset your password.'}
                  </p>
                  <div className="space-y-2">
                    <Label htmlFor="reset-email" className="text-slate-300">
                      {t.auth.email}
                    </Label>
                    <Input
                      id="reset-email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="din@epost.no"
                      required
                      className="bg-slate-800 border-slate-600 text-white h-12 text-base"
                      autoComplete="email"
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={resetLoading}
                    className="w-full h-12 bg-green-500 hover:bg-green-400 text-slate-900 font-semibold text-base cursor-pointer"
                  >
                    {resetLoading
                      ? (no ? 'Sender...' : 'Sending...')
                      : (no ? 'Send tilbakestillingslenke' : 'Send reset link')}
                  </Button>
                  <button
                    type="button"
                    onClick={() => setShowForgot(false)}
                    className="w-full flex items-center justify-center gap-1 text-slate-400 text-sm hover:text-slate-300 cursor-pointer py-1"
                  >
                    <ArrowLeft size={14} />
                    {no ? 'Tilbake' : 'Back'}
                  </button>
                </form>
              )}
            </CardContent>
          </Card>
        ) : (
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
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password" className="text-slate-300">{t.auth.password}</Label>
                    <button
                      type="button"
                      onClick={() => setShowForgot(true)}
                      className="text-slate-500 text-xs hover:text-green-400 cursor-pointer transition-colors"
                    >
                      {no ? 'Glemt passord?' : 'Forgot password?'}
                    </button>
                  </div>
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
        )}
      </div>
    </div>
  )
}
