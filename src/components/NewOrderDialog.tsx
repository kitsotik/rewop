import { useEffect, useState, type ChangeEvent } from 'react'
import type { Session } from '@supabase/supabase-js'
import { sb } from '@/lib/supabase'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Button } from '@/components/ui/button'
import type { AppData } from '@/types'

const fieldLabel = 'mb-1.5 block text-xs font-medium text-muted-foreground'

const EMPTY_FORM = {
  nombre: '',
  tel: '',
  trabajo: '',
  tipo: '',
  marca: '',
  modelo: '',
  serie: '',
  accesorios: '',
  obs: '',
}

export function NewOrderDialog({
  open,
  onOpenChange,
  appData,
  reloadOrdenes,
  session,
  goDetail,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  appData: AppData
  reloadOrdenes: () => Promise<void>
  session: Session
  goDetail: (id: string) => void
}) {
  const [form, setForm] = useState(EMPTY_FORM)
  const [err, setErr] = useState('')
  const set = (k: keyof typeof EMPTY_FORM) => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    if (open) {
      setForm({ ...EMPTY_FORM, tipo: appData.tiposEquipo[0]?.id || '', marca: appData.marcas[0]?.id || '' })
      setErr('')
    }
  }, [open, appData.tiposEquipo, appData.marcas])

  const submit = async () => {
    if (!form.nombre.trim() || !form.tel.trim() || !form.trabajo.trim()) {
      setErr('Completá nombre, teléfono y trabajo.')
      return
    }
    const estadoAdminInicial = appData.estadosAdmin[0]?.id
    const estadoTecInicial = appData.estadosTecnicos[0]?.id
    const payload = {
      cliente_nombre: form.nombre.trim(),
      cliente_telefono: form.tel.trim(),
      trabajo: form.trabajo.trim(),
      tipo_equipo_id: form.tipo,
      marca_id: form.marca,
      modelo: form.modelo || null,
      numero_serie: form.serie || null,
      accesorios: form.accesorios || null,
      observaciones: form.obs || null,
      estado_admin_id: estadoAdminInicial,
      estado_tecnico_id: estadoTecInicial,
      usuario_recepciono_id: session.user.id,
    }
    const { data, error } = await sb.from('ordenes').insert(payload).select().single()
    if (error) {
      setErr('No se pudo crear la orden.')
      console.error(error)
      return
    }
    await sb.from('historial_estados').insert([
      { orden_id: data.id, tipo_flujo: 'admin', estado_admin_id: estadoAdminInicial, usuario_id: session.user.id },
      { orden_id: data.id, tipo_flujo: 'tecnico', estado_tecnico_id: estadoTecInicial, usuario_id: session.user.id },
    ])
    await reloadOrdenes()
    onOpenChange(false)
    goDetail(data.id)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nueva orden</DialogTitle>
          <DialogDescription>Recepción de un equipo</DialogDescription>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <Label className={fieldLabel}>Nombre del cliente</Label>
            <Input placeholder="Juan Pérez" value={form.nombre} onChange={set('nombre')} />
          </div>
          <div>
            <Label className={fieldLabel}>Teléfono</Label>
            <Input placeholder="11 2345 6789" value={form.tel} onChange={set('tel')} />
          </div>
        </div>
        <div className="mb-3">
          <Label className={fieldLabel}>Trabajo a realizar</Label>
          <Input placeholder="No enciende, pantalla rota, etc." value={form.trabajo} onChange={set('trabajo')} />
        </div>
        <div className="grid grid-cols-6 gap-3 mb-3">
          <div className="col-span-1">
            <Label className={fieldLabel}>Tipo</Label>
            <Select value={form.tipo} onValueChange={(v) => setForm((f) => ({ ...f, tipo: v }))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {appData.tiposEquipo.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-1">
            <Label className={fieldLabel}>Marca</Label>
            <Select value={form.marca} onValueChange={(v) => setForm((f) => ({ ...f, marca: v }))}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {appData.marcas.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.nombre}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label className={fieldLabel}>Modelo</Label>
            <Input value={form.modelo} onChange={set('modelo')} />
          </div>
          <div className="col-span-2">
            <Label className={fieldLabel}>N.º de serie</Label>
            <Input value={form.serie} onChange={set('serie')} />
          </div>
        </div>
        <div className="mb-3">
          <Label className={fieldLabel}>Accesorios que dejó</Label>
          <Input value={form.accesorios} onChange={set('accesorios')} />
        </div>
        <div className="mb-4">
          <Label className={fieldLabel}>Observaciones</Label>
          <Textarea rows={2} value={form.obs} onChange={set('obs')} />
        </div>
        <Button className="w-full" onClick={submit}>
          Guardar
        </Button>
        {err ? <p className="text-destructive text-sm mt-2">{err}</p> : null}
      </DialogContent>
    </Dialog>
  )
}
