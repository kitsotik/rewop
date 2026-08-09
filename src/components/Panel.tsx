import { Card } from '@/components/ui/card'
import type { AppData } from '@/types'

export function Panel({ appData }: { appData: AppData }) {
  const { ordenes } = appData
  const abiertos = ordenes.filter((o) => !['RETIRADO', 'DESCARTADO'].includes(o.estado_admin?.nombre || '')).length
  const paraInformar = ordenes.filter((o) => (o.estado_admin?.nombre || '') === 'PRESUPUESTADO').length
  const enReparacion = ordenes.filter((o) => (o.estado_tecnico?.nombre || '') === 'EN REPARACIÓN').length

  return (
    <div>
      <p className="text-sm text-muted-foreground mb-5">Reportes, estados y resultados de automatizaciones</p>
      <div className="grid gap-2.5" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))' }}>
        <Card className="p-3.5">
          <div className="text-2xl font-bold">{ordenes.length}</div>
          <div className="text-xs text-muted-foreground">Total órdenes</div>
        </Card>
        <Card className="p-3.5">
          <div className="text-2xl font-bold">{abiertos}</div>
          <div className="text-xs text-muted-foreground">Abiertas</div>
        </Card>
        <Card className="p-3.5">
          <div className="text-2xl font-bold">{paraInformar}</div>
          <div className="text-xs text-muted-foreground">Para informar</div>
        </Card>
        <Card className="p-3.5">
          <div className="text-2xl font-bold">{enReparacion}</div>
          <div className="text-xs text-muted-foreground">En reparación</div>
        </Card>
      </div>
    </div>
  )
}
