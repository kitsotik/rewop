import { Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function ConfigToolbar({
  search,
  setSearch,
  onOpenAdd,
}: {
  search: string
  setSearch: (v: string) => void
  onOpenAdd: () => void
}) {
  return (
    <div className="flex gap-3 mb-3.5 items-center">
      <Input className="flex-1" placeholder="Buscar por nombre" value={search} onChange={(e) => setSearch(e.target.value)} />
      <Button className="shrink-0" onClick={onOpenAdd}>
        <Plus className="w-4 h-4" /> Nuevo
      </Button>
    </div>
  )
}
