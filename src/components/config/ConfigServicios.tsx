import { useEffect, useState } from 'react'
import { sb } from '@/lib/supabase'
import { useCfgRows } from '@/hooks/useCfgRows'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Pagination } from '@/components/Pagination'
import { ConfigToolbar } from '@/components/config/ConfigToolbar'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { PAGE_SIZE } from '@/lib/supabase'
import type { Servicio } from '@/types'

const fieldLabel = 'mb-1.5 block text-xs font-medium text-muted-foreground'

export function ConfigServicios({ reloadRef }: { reloadRef: () => Promise<void> }) {
  const [rows, reload] = useCfgRows<Servicio>('servicios')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [addOpen, setAddOpen] = useState(false)
  const [nombre, setNombre] = useState('')
  const [precio, setPrecio] = useState('')
  const [saving, setSaving] = useState(false)
  const [err, setErr] = useState('')

  useEffect(() => {
    if (addOpen) {
      setNombre('')
      setPrecio('')
      setErr('')
      setSaving(false)
    }
  }, [addOpen])

  const filtered = rows.filter((r) => !search || r.nombre.toLowerCase().includes(search.toLowerCase()))
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageClamped = Math.min(page, totalPages)
  const list = filtered.slice((pageClamped - 1) * PAGE_SIZE, pageClamped * PAGE_SIZE)

  const saveField = async (id: string, field: string, value: unknown) => {
    await sb.from('servicios').update({ [field]: value }).eq('id', id)
    await reload()
    await reloadRef()
  }
  const toggle = async (id: string, activo: boolean) => {
    await sb.from('servicios').update({ activo: !activo }).eq('id', id)
    await reload()
    await reloadRef()
  }
  const add = async () => {
    if (!nombre.trim() || saving) return
    setSaving(true)
    setErr('')
    const { error } = await sb.from('servicios').insert({ nombre: nombre.trim(), precio: Number(precio) || 0 })
    if (error) {
      setErr(error.message)
      setSaving(false)
      return
    }
    await reload()
    await reloadRef()
    setSaving(false)
    setAddOpen(false)
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-5">
        Mano de obra que el técnico puede agregar a una orden con precio fijo. Los materiales se cargan aparte, a mano, en cada orden.
      </p>
      <ConfigToolbar
        search={search}
        setSearch={(v) => {
          setSearch(v)
          setPage(1)
        }}
        onOpenAdd={() => setAddOpen(true)}
      />
      <div className="grid gap-2.5 px-3.5 text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5" style={{ gridTemplateColumns: '1fr 120px 60px' }}>
        <span>Nombre</span>
        <span>Precio</span>
        <span>Activo</span>
      </div>
      {list.length === 0 ? <p className="text-sm text-muted-foreground">Sin resultados.</p> : null}
      {list.map((r) => (
        <div key={r.id} className="grid gap-2.5 items-center px-3.5 py-2.5 bg-card border border-border rounded-md mb-2" style={{ gridTemplateColumns: '1fr 120px 60px' }}>
          <Input
            className="border-transparent bg-transparent shadow-none h-8"
            defaultValue={r.nombre}
            onBlur={(e) => e.target.value !== r.nombre && saveField(r.id, 'nombre', e.target.value)}
          />
          <Input
            type="number"
            className="border-transparent bg-transparent shadow-none h-8"
            defaultValue={r.precio}
            onBlur={(e) => Number(e.target.value) !== r.precio && saveField(r.id, 'precio', Number(e.target.value) || 0)}
          />
          <Switch checked={r.activo} onCheckedChange={() => toggle(r.id, r.activo)} />
        </div>
      ))}
      <Pagination page={pageClamped} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />

      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo servicio</DialogTitle>
          </DialogHeader>
          <div className="mb-3">
            <Label className={fieldLabel}>Nombre</Label>
            <Input placeholder="Cambio de pantalla" value={nombre} onChange={(e) => setNombre(e.target.value)} />
          </div>
          <div className="mb-1">
            <Label className={fieldLabel}>Precio</Label>
            <Input
              type="number"
              placeholder="0"
              value={precio}
              onChange={(e) => setPrecio(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') add()
              }}
            />
          </div>
          <Button className="w-full mt-3" disabled={!nombre.trim() || saving} onClick={add}>
            Guardar
          </Button>
          {err ? <p className="text-destructive text-sm mt-2">{err}</p> : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
