import { useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { sb } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const fieldLabel = 'mb-1.5 block text-xs font-medium text-muted-foreground'

export function Login({ onLoggedIn }: { onLoggedIn: (session: Session) => void }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [err, setErr] = useState('')

  const submit = async () => {
    setErr('')
    const { data, error } = await sb.auth.signInWithPassword({ email, password })
    if (error || !data.session) {
      setErr('No pudimos iniciar sesión. Revisá el email y la contraseña.')
      return
    }
    onLoggedIn(data.session)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Card className="w-80 p-6">
        <div className="flex items-center gap-2 font-bold text-base mb-1">
          <span className="w-2.5 h-2.5 rounded-sm bg-primary" />
          ReWop
        </div>
        <p className="text-sm text-muted-foreground mb-5">Iniciá sesión para continuar</p>
        <div className="mb-3">
          <Label className={fieldLabel}>Email</Label>
          <Input type="email" placeholder="tu@email.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>
        <div className="mb-4">
          <Label className={fieldLabel}>Contraseña</Label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') submit()
            }}
          />
        </div>
        <Button className="w-full" onClick={submit}>
          Ingresar
        </Button>
        {err ? <p className="text-destructive text-sm mt-2">{err}</p> : null}
      </Card>
    </div>
  )
}
