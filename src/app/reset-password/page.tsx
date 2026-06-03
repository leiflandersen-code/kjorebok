'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from 'sonner'
import { Car, Eye, EyeOff } from 'lucide-react'
import { useLang } from '@/store/langStore'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [showPw, setShowPw] = useState(false)
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const router = useRouter()
  const { lang } = useLang()
  const no = lang === 'no'

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    if (password !== confirm) {
      toast.error(no ? 'Passordene er ikke like' : 'Passwords do not match')
      return
    }
    if (password.length < 6) {
      toast.error(no ? 'Passordet må være minst 6 tegn' : 'Password must be at least 6 characters')
      return
    }
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      toast.error(no ? 'Noe gikk galt. Prøv igjen.' : 'Something went wrong. Try again.')
    } else {
      setDone(true)
      setTimeout(() => router.push('/dashboard'), 2000)
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
            <CardTitle className="text-lg text-white">
              {no ? 'Nytt passord' : 'New password'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {done ? (
              <div className="text-center space-y-3 py-2">
                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center mx-auto">
                  <Car size={24} className="text-green-400" />
                </div>
                <p className="text-white font-medium">
                  {no ? 'Passordet er oppdatert!' : 'Password updated!'}
                </p>
                <p className="text-slate-400 text-sm">
                  {no ? 'Du sendes til appen...' : 'Redirecting to the app...'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-slate-300">
                    {no ? 'Nytt passord' : 'New password'}
                  </Label>
                  <div className="relative">
                    <Input
                      type={showPw ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      minLength={6}
                      required
                      className="bg-slate-800 border-slate-600 text-white h-12 text-base pr-10"
                      autoComplete="new-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 cursor-pointer"
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-slate-300">
                    {no ? 'Bekreft passord' : 'Confirm password'}
                  </Label>
                  <Input
                    type={showPw ? 'text' : 'password'}
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    minLength={6}
                    required
                    className="bg-slate-800 border-slate-600 text-white h-12 text-base"
                    autoComplete="new-password"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 bg-green-500 hover:bg-green-400 text-slate-900 font-semibold text-base cursor-pointer"
                >
                  {loading
                    ? (no ? 'Lagrer...' : 'Saving...')
                    : (no ? 'Sett nytt passord' : 'Set new password')}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
