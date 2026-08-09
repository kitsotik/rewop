import { useState } from 'react'
import { sb } from '@/lib/supabase'
import { useCfgRows } from '@/hooks/useCfgRows'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Pagination } from '@/components/Pagination'
import { NewItemDialog } from '@/components/NewItemDialog'
import { ConfigToolbar } from '@/components/config/ConfigToolbar'
import { PAGE_SIZE } from '@/lib/supabase'

interface SimpleRow {
  id: string
  nombre: string
  activo: boolean
}

export function ConfigSimple({
  table,
  addLabel,
  itemLabel,
  reloadRef,
}: {
  table: string
  addLabel: string
  itemLabel: string
  reloadRef: () => Promise<void>
}) {
  const [rows, reload] = useCfgRows<SimpleRow>(table)
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [addOpen, setAddOpen] = useState(false)

  const filtered = rows.filter((r) => !search || r.nombre.toLowerCase().includes(search.toLowerCase()))
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageClamped = Math.min(page, totalPages)
  const list = filtered.slice((pageClamped - 1) * PAGE_SIZE, pageClamped * PAGE_SIZE)

  const save = async (id: string, nombre: string) => {
    await sb.from(table).update({ nombre }).eq('id', id)
    await reload()
    await reloadRef()
  }
  const toggle = async (id: string, activo: boolean) => {
    await sb.from(table).update({ activo: !activo }).eq('id', id)
    await reload()
    await reloadRef()
  }
  const add = async (nombre: string) => {
    await sb.from(table).insert({ nombre })
    await reload()
    await reloadRef()
  }

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-5">
        No se pueden eliminar porque están vinculados a órdenes existentes — se activan o desactivan.
      </p>
      <ConfigToolbar
        search={search}
        setSearch={(v) => {
          setSearch(v)
          setPage(1)
        }}
        onOpenAdd={() => setAddOpen(true)}
      />
      <div className="grid gap-2.5 px-3.5 text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5" style={{ gridTemplateColumns: '1fr 60px' }}>
        <span>Nombre</span>
        <span>Activo</span>
      </div>
      {list.length === 0 ? <p className="text-sm text-muted-foreground">Sin resultados.</p> : null}
      {list.map((r) => (
        <div key={r.id} className="grid gap-2.5 items-center px-3.5 py-2.5 bg-card border border-border rounded-md mb-2" style={{ gridTemplateColumns: '1fr 60px' }}>
          <Input
            className="border-transparent bg-transparent shadow-none h-8"
            defaultValue={r.nombre}
            onBlur={(e) => e.target.value !== r.nombre && save(r.id, e.target.value)}
          />
          <Switch checked={r.activo} onCheckedChange={() => toggle(r.id, r.activo)} />
        </div>
      ))}
      <Pagination page={pageClamped} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} />
      <NewItemDialog open={addOpen} onOpenChange={setAddOpen} title={addLabel} label="Nombre" placeholder={itemLabel} onSubmit={add} />
    </div>
  )
}
