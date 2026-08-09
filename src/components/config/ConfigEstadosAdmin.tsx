import { useEffect, useState } from 'react'
import { sb } from '@/lib/supabase'
import { useCfgRows } from '@/hooks/useCfgRows'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Pagination } from '@/components/Pagination'
import { NewItemDialog } from '@/components/NewItemDialog'
import { ConfigToolbar } from '@/components/config/ConfigToolbar'
import { PAGE_SIZE } from '@/lib/supabase'
import type { EstadoAdmin, Ubicacion } from '@/types'

const NONE = '__none__'

export function ConfigEstadosAdmin({ reloadRef }: { reloadRef: () => Promise<void> }) {
  const [rows, reload] = useCfgRows<EstadoAdmin>('estados_admin')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [addOpen, setAddOpen] = useState(false)

  const [ubicacionesAll, setUbicacionesAll] = useState<Ubicacion[]>([])
  useEffect(() => {
    sb.from('ubicaciones')
      .select('*')
      .order('orden')
      .then(({ data }) => setUbicacionesAll(data || []))
  }, [])

  const filtered = rows.filter((r) => !search || r.nombre.toLowerCase().includes(search.toLowerCase()))
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageClamped = Math.min(page, totalPages)
  const list = filtered.slice((pageClamped - 1) * PAGE_SIZE, pageClamped * PAGE_SIZE)

  const saveField = async (id: string, field: string, value: unknown) => {
    await sb.from('estados_admin').update({ [field]: value }).eq('id', id)
    await reload()
    await reloadRef()
  }
  const toggle = async (id: string, activo: boolean) => {
    await sb.from('estados_admin').update({ activo: !activo }).eq('id', id)
    await reload()
    await reloadRef()
  }
  const add = async (nombre: string) => {
    await sb.from('estados_admin').insert({ nombre })
    await reload()
    await reloadRef()
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-5">
        Definen el flujo administrativo, el mensaje de WhatsApp y la ubicación que quedan al aplicar cada uno.
      </p>
      <ConfigToolbar
        search={search}
        setSearch={(v) => {
          setSearch(v)
          setPage(1)
        }}
        onOpenAdd={() => setAddOpen(true)}
      />
      <div
        className="grid gap-2.5 px-3.5 text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5"
        style={{ gridTemplateColumns: '140px 1fr 140px 60px' }}
      >
        <span>Nombre</span>
        <span>Mensaje WhatsApp</span>
        <span>Ubicación</span>
        <span>Activo</span>
      </div>
      {list.length === 0 ? <p className="text-sm text-muted-foreground">Sin resultados.</p> : null}
      {list.map((e) => (
        <div key={e.id} className="grid gap-2.5 items-start px-3.5 py-2.5 bg-card border border-border rounded-md mb-2" style={{ gridTemplateColumns: '140px 1fr 140px 60px' }}>
          <Input
            className="border-transparent bg-transparent shadow-none h-8"
            defaultValue={e.nombre}
            onBlur={(ev) => ev.target.value !== e.nombre && saveField(e.id, 'nombre', ev.target.value)}
          />
          <Textarea
            className="border-transparent bg-transparent shadow-none text-xs"
            rows={2}
            defaultValue={e.mensaje_whatsapp || ''}
            onBlur={(ev) => ev.target.value !== (e.mensaje_whatsapp || '') && saveField(e.id, 'mensaje_whatsapp', ev.target.value)}
          />
          <Select defaultValue={e.ubicacion_id || NONE} onValueChange={(v) => saveField(e.id, 'ubicacion_id', v === NONE ? null : v)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NONE}>Sin cambio</SelectItem>
              {ubicacionesAll.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.nombre}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Switch checked={e.activo} onCheckedChange={() => toggle(e.id, e.activo)} />
        </div>
      ))}
      <Pagination page={pageClamped} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
      <NewItemDialog open={addOpen} onOpenChange={setAddOpen} title="Nuevo estado administrativo" label="Nombre" placeholder="Nombre del estado" onSubmit={add} />
    </div>
  )
}
