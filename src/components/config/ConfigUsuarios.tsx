import { useCallback, useEffect, useState } from 'react'
import { sb } from '@/lib/supabase'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ConfigToolbar } from '@/components/config/ConfigToolbar'
import type { Profile } from '@/types'

const fieldLabel = 'mb-1.5 block text-xs font-medium text-muted-foreground'
const ROLES: { value: Profile['role']; label: string }[] = [
  { value: 'admin', label: 'Administrador' },
  { value: 'operador', label: 'Operador' },
  { value: 'tecnico', label: 'Técnico' },
]

function randomPassword() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789'
  return Array.from({ length: 12 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

function NuevoUsuarioDialog({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreated: () => Promise<void>
}) {
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [role, setRole] = useState<Profile['role']>('tecnico')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (open) {
      setFullName('')
      setEmail('')
      setPassword(randomPassword())
      setRole('tecnico')
      setErr('')
    }
  }, [open])

  const submit = async () => {
    if (!fullName.trim() || !email.trim() || password.length < 8 || saving) return
    setSaving(true)
    setErr('')
    const { data, error } = await sb.functions.invoke('create-user', {
      body: { email: email.trim(), password, full_name: fullName.trim(), role },
    })
    setSaving(false)
    if (error || data?.error) {
      setErr(data?.error || error?.message || 'No se pudo crear el usuario.')
      return
    }
    await onCreated()
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nuevo usuario</DialogTitle>
        </DialogHeader>
        <div className="mb-3">
          <Label className={fieldLabel}>Nombre</Label>
          <Input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Nombre y apellido" />
        </div>
        <div className="mb-3">
          <Label className={fieldLabel}>Email</Label>
          <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="usuario@email.com" />
        </div>
        <div className="mb-3">
          <Label className={fieldLabel}>Rol</Label>
          <Select value={role} onValueChange={(v) => setRole(v as Profile['role'])}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="mb-1">
          <Label className={fieldLabel}>Contraseña inicial</Label>
          <div className="flex gap-2">
            <Input value={password} onChange={(e) => setPassword(e.target.value)} />
            <Button type="button" variant="secondary" className="shrink-0" onClick={() => setPassword(randomPassword())}>
              Generar
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-1.5">
            Comunicásela al usuario por otro medio — no se envía por email automáticamente.
          </p>
        </div>
        {err ? <p className="text-destructive text-sm mt-2">{err}</p> : null}
        <Button className="w-full mt-2" disabled={!fullName.trim() || !email.trim() || password.length < 8 || saving} onClick={submit}>
          {saving ? 'Creando…' : 'Crear usuario'}
        </Button>
      </DialogContent>
    </Dialog>
  )
}

export function ConfigUsuarios({ reloadRef }: { reloadRef: () => Promise<void> }) {
  const [rows, setRows] = useState<Profile[]>([])
  const [search, setSearch] = useState('')
  const [addOpen, setAddOpen] = useState(false)

  const load = useCallback(async () => {
    const { data } = await sb.from('profiles').select('*').order('full_name')
    setRows((data as Profile[]) || [])
  }, [])
  useEffect(() => {
    load()
  }, [load])

  const filtered = rows.filter(
    (r) => !search || r.full_name?.toLowerCase().includes(search.toLowerCase()) || r.email?.toLowerCase().includes(search.toLowerCase()),
  )

  const saveNombre = async (id: string, full_name: string) => {
    await sb.from('profiles').update({ full_name }).eq('id', id)
    await load()
    await reloadRef()
  }
  const saveRole = async (id: string, role: Profile['role']) => {
    await sb.from('profiles').update({ role }).eq('id', id)
    await load()
    await reloadRef()
  }
  const toggleActivo = async (id: string, activo: boolean) => {
    await sb.from('profiles').update({ activo: !activo }).eq('id', id)
    await load()
    await reloadRef()
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-5">
        No se pueden eliminar — se desactivan. Un usuario desactivado no puede iniciar sesión.
      </p>
      <ConfigToolbar search={search} setSearch={setSearch} onOpenAdd={() => setAddOpen(true)} />
      <div
        className="grid gap-2.5 px-3.5 text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5"
        style={{ gridTemplateColumns: '1fr 1fr 160px 60px' }}
      >
        <span>Nombre</span>
        <span>Email</span>
        <span>Rol</span>
        <span>Activo</span>
      </div>
      {filtered.length === 0 ? <p className="text-sm text-muted-foreground">Sin resultados.</p> : null}
      {filtered.map((r) => (
        <div
          key={r.id}
          className="grid gap-2.5 items-center px-3.5 py-2.5 bg-card border border-border rounded-md mb-2"
          style={{ gridTemplateColumns: '1fr 1fr 160px 60px' }}
        >
          <Input
            className="border-transparent bg-transparent shadow-none h-8"
            defaultValue={r.full_name}
            onBlur={(e) => e.target.value !== r.full_name && saveNombre(r.id, e.target.value)}
          />
          <span className="text-sm text-muted-foreground truncate">{r.email || '—'}</span>
          <Select value={r.role} onValueChange={(v) => saveRole(r.id, v as Profile['role'])}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((rl) => (
                <SelectItem key={rl.value} value={rl.value}>
                  {rl.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Switch checked={r.activo} onCheckedChange={() => toggleActivo(r.id, r.activo)} />
        </div>
      ))}
      <NuevoUsuarioDialog open={addOpen} onOpenChange={setAddOpen} onCreated={async () => { await load(); await reloadRef() }} />
    </div>
  )
}
