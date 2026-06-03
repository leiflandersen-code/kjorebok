'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { toast } from 'sonner'
import type { Customer } from '@/types'
import { Plus, Pencil, Users } from 'lucide-react'

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [form, setForm] = useState({ name: '', contact: '', notes: '' })
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    const supabase = createClient()
    const { data } = await supabase.from('customers').select('*').order('name')
    setCustomers(data ?? [])
  }

  function openNew() {
    setEditing(null)
    setForm({ name: '', contact: '', notes: '' })
    setOpen(true)
  }

  function openEdit(c: Customer) {
    setEditing(c)
    setForm({ name: c.name, contact: c.contact ?? '', notes: c.notes ?? '' })
    setOpen(true)
  }

  async function handleSave() {
    if (!form.name.trim()) return
    setSaving(true)
    const supabase = createClient()

    if (editing) {
      const { error } = await supabase.from('customers').update(form).eq('id', editing.id)
      if (error) toast.error('Feil ved lagring')
      else toast.success('Kunde oppdatert')
    } else {
      const { data: { user } } = await supabase.auth.getUser()
      const { error } = await supabase.from('customers').insert({ ...form, created_by: user?.id })
      if (error) toast.error('Feil ved lagring')
      else toast.success('Kunde lagt til')
    }

    setOpen(false)
    load()
    setSaving(false)
  }

  return (
    <div className="min-h-screen p-4 max-w-md mx-auto">
      <div className="flex items-center justify-between mb-6 pt-2">
        <h1 className="text-xl font-bold text-white">Kunder</h1>
        <Button
          onClick={openNew}
          size="sm"
          className="bg-green-500 hover:bg-green-400 text-slate-900 font-semibold cursor-pointer"
        >
          <Plus size={16} className="mr-1" />
          Ny kunde
        </Button>
      </div>

      {customers.length === 0 ? (
        <div className="text-center py-16">
          <Users size={40} className="text-slate-600 mx-auto mb-3" />
          <p className="text-slate-400">Ingen kunder ennå</p>
        </div>
      ) : (
        <div className="space-y-3">
          {customers.map((c) => (
            <Card key={c.id} className="bg-slate-900 border-slate-700">
              <CardContent className="p-4 flex items-center justify-between">
                <div>
                  <p className="text-white font-medium">{c.name}</p>
                  {c.contact && <p className="text-slate-400 text-sm">{c.contact}</p>}
                  {c.notes && <p className="text-slate-500 text-xs mt-1">{c.notes}</p>}
                </div>
                <button
                  onClick={() => openEdit(c)}
                  className="p-2 rounded-xl hover:bg-slate-800 cursor-pointer transition-colors"
                >
                  <Pencil size={16} className="text-slate-400" />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="bg-slate-900 border-slate-700 text-white max-w-sm mx-auto">
          <DialogHeader>
            <DialogTitle>{editing ? 'Rediger kunde' : 'Ny kunde'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label className="text-slate-300 mb-2 block">Navn *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-slate-800 border-slate-600 text-white h-12 text-base"
                autoFocus
              />
            </div>
            <div>
              <Label className="text-slate-300 mb-2 block">Kontakt / e-post</Label>
              <Input
                value={form.contact}
                onChange={(e) => setForm({ ...form, contact: e.target.value })}
                className="bg-slate-800 border-slate-600 text-white h-12 text-base"
              />
            </div>
            <div>
              <Label className="text-slate-300 mb-2 block">Notater</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="bg-slate-800 border-slate-600 text-white resize-none"
                rows={3}
              />
            </div>
            <Button
              onClick={handleSave}
              disabled={saving || !form.name.trim()}
              className="w-full h-12 bg-green-500 hover:bg-green-400 text-slate-900 font-semibold cursor-pointer"
            >
              {saving ? 'Lagrer...' : 'Lagre'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
