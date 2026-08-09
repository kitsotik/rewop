import { PanelLeft, ClipboardList, Settings, ChevronRight } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Profile } from '@/types'

const CONFIG_CHILDREN: [string, string][] = [
  ['cfg-tipos', 'Tipos de equipo'],
  ['cfg-marcas', 'Marcas'],
  ['cfg-ubicaciones', 'Ubicaciones'],
  ['cfg-servicios', 'Servicios'],
  ['cfg-eadmin', 'Estados administrativos'],
  ['cfg-etec', 'Estados técnicos'],
  ['cfg-usuarios', 'Usuarios'],
]

export function Sidebar({
  view,
  setView,
  profile,
  configOpen,
  setConfigOpen,
}: {
  view: string
  setView: (v: string) => void
  profile: Profile | null
  configOpen: boolean
  setConfigOpen: (v: boolean) => void
}) {
  const role = profile?.role || 'tecnico'
  const isAdmin = role === 'admin'
  const inConfig = view.startsWith('cfg-')

  const NavItem = ({ target, icon: ItemIcon, label }: { target: string; icon: typeof PanelLeft; label: string }) => (
    <div
      className={cn(
        'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium cursor-pointer mb-0.5',
        view === target ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
      )}
      onClick={() => setView(target)}
    >
      <ItemIcon className="w-4 h-4" />
      <span>{label}</span>
    </div>
  )

  return (
    <div className="w-56 shrink-0 bg-[hsl(var(--sidebar))] border-r border-border flex flex-col p-3">
      <div className="flex items-center gap-2 font-bold text-base px-2 pt-2 pb-5">
        <span className="w-2.5 h-2.5 rounded-sm bg-primary" />
        ReWop
      </div>
      <NavItem target="panel" icon={PanelLeft} label="Panel" />
      <NavItem target="ordenes" icon={ClipboardList} label="Órdenes de servicio" />
      {isAdmin ? (
        <>
          <div
            className={cn(
              'flex items-center gap-2.5 px-2.5 py-2 rounded-md text-sm font-medium cursor-pointer mb-0.5',
              inConfig ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
            )}
            onClick={() => setConfigOpen(!configOpen)}
          >
            <Settings className="w-4 h-4" />
            <span>Configuración</span>
            <span className={cn('ml-auto transition-transform', configOpen && 'rotate-90')}>
              <ChevronRight className="w-3.5 h-3.5" />
            </span>
          </div>
          {configOpen
            ? CONFIG_CHILDREN.map(([k, l]) => (
                <div
                  key={k}
                  className={cn(
                    'flex items-center pl-9 pr-2.5 py-1.5 rounded-md text-sm cursor-pointer mb-0.5',
                    view === k ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-accent hover:text-foreground',
                  )}
                  onClick={() => setView(k)}
                >
                  {l}
                </div>
              ))
            : null}
        </>
      ) : null}
    </div>
  )
}
