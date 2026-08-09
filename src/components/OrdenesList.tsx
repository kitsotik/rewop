import { useEffect, useMemo, useState } from 'react'
import { Plus, ChevronRight } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Pagination } from '@/components/Pagination'
import { matchesOrderSearch } from '@/lib/helpers'
import { sb, ORDEN_SELECT, PAGE_SIZE } from '@/lib/supabase'
import type { AppData, Orden } from '@/types'

const GRID_COLS = { gridTemplateColumns: '48px 1fr 120px 100px 100px 110px 130px 20px' }
const RECIENTES_LIMIT = 7

export function OrdenesList({
  appData,
  openNewOrder,
  goDetail,
}: {
  appData: AppData
  openNewOrder: () => void
  goDetail: (id: string) => void
}) {
  const [recientes, setRecientes] = useState<Orden[]>([])
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    sb.from('ordenes')
      .select(ORDEN_SELECT)
      .order('numero', { ascending: false })
      .limit(RECIENTES_LIMIT)
      .then(({ data, error }) => setRecientes(error ? [] : (data as unknown as Orden[])))
  }, [])

  const isSearching = search.trim().length > 0
  const filtered = useMemo(
    () => (isSearching ? appData.ordenes.filter((o) => matchesOrderSearch(o, search.toLowerCase())) : recientes),
    [isSearching, appData.ordenes, recientes, search],
  )
  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE))
  const pageClamped = Math.min(page, totalPages)
  const list = filtered.slice((pageClamped - 1) * PAGE_SIZE, pageClamped * PAGE_SIZE)

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-5">{isSearching ? 'Resultados de la búsqueda' : `Últimas ${RECIENTES_LIMIT} órdenes`}</p>
      <div className="flex gap-3 items-center mb-3.5">
        <Input
          className="flex-1"
          placeholder="Buscar por cualquier campo de la orden (cliente, teléfono, equipo, estado...)"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value)
            setPage(1)
          }}
        />
        <Button size="icon" className="shrink-0" title="Nueva orden" onClick={openNewOrder}>
          <Plus className="w-4 h-4" />
        </Button>
      </div>
      <div className="grid gap-2.5 px-3.5 text-[11px] uppercase tracking-wide text-muted-foreground mb-1.5" style={GRID_COLS}>
        <span>#</span>
        <span>Nombre</span>
        <span>Teléfono</span>
        <span>Tipo</span>
        <span>Marca</span>
        <span>Modelo</span>
        <span>Ubicación actual</span>
        <span></span>
      </div>
      {list.length === 0 ? <p className="text-muted-foreground text-sm">No se encontraron órdenes.</p> : null}
      {list.map((o) => (
        <div
          key={o.id}
          className="grid gap-2.5 items-center px-3.5 py-3 bg-card border border-border rounded-md cursor-pointer mb-2 hover:border-muted-foreground/40"
          style={GRID_COLS}
          onClick={() => goDetail(o.id)}
        >
          <span className="font-mono text-sm">#{o.numero}</span>
          <span className="text-sm">{o.cliente_nombre}</span>
          <span className="text-sm text-muted-foreground">{o.cliente_telefono || ''}</span>
          <span className="text-sm text-muted-foreground">{o.tipo_equipo?.nombre || '—'}</span>
          <span className="text-sm text-muted-foreground">{o.marca?.nombre || '—'}</span>
          <span className="text-sm text-muted-foreground">{o.modelo || '—'}</span>
          <Badge variant="outline">{o.ubicacion_actual?.nombre || '—'}</Badge>
          <span className="text-muted-foreground">
            <ChevronRight className="w-4 h-4" />
          </span>
        </div>
      ))}
      {isSearching ? <Pagination page={pageClamped} total={filtered.length} pageSize={PAGE_SIZE} onChange={setPage} /> : null}
    </div>
  )
}
