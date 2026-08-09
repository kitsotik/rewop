import type { Orden } from '@/types'

export function badgeVariant(nombre: string | undefined | null) {
  const n = (nombre || '').toLowerCase()
  if (n.includes('rechaz') || n.includes('descartad') || n.includes('sin reparaci')) return 'destructive'
  if (n.includes('retirado') || n.includes('reparado') || n.includes('confirmad')) return 'success'
  if (n.includes('listo para retirar') || n.includes('esperando') || n.includes('depósito') || n.includes('deposito') || n.includes('a derivar')) return 'warning'
  if (n.includes('recibido') || n.includes('en diagnóstico') || n.includes('en diagnostico')) return 'outline'
  return 'default'
}

export function fillTemplate(tpl: string | null | undefined, orden: Orden) {
  if (!tpl) return ''
  return tpl
    .replaceAll('{cliente_nombre}', orden.cliente_nombre || '')
    .replaceAll('{numero}', String(orden.numero || ''))
    .replaceAll('{presupuesto_monto}', String(orden.presupuesto_monto ?? ''))
}

export const RECORDATORIO_TEMPLATES: Record<string, string> = {
  'Recordatorio 1 (1 mes)':
    'Hola {cliente_nombre}! Te recordamos que tu equipo (orden #{numero}) está listo para retirar hace un mes. Te esperamos cuando puedas.',
  'Recordatorio 2 (2 meses)':
    'Hola {cliente_nombre}! Tu equipo (orden #{numero}) sigue esperando que lo retires, ya hace 2 meses que está listo. Por favor contactanos para coordinar el retiro.',
  'Recordatorio 3 (3 meses)':
    'Hola {cliente_nombre}! Último aviso: tu equipo (orden #{numero}) lleva 3 meses listo para retirar. Si no tenemos respuesta pasará a depósito.',
}

export function waLink(tel: string | null | undefined, texto: string) {
  return `https://wa.me/${(tel || '').replace(/\D/g, '')}?text=${encodeURIComponent(texto)}`
}

export function fmtFecha(iso: string) {
  const d = new Date(iso)
  return (
    d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' }) +
    ' ' +
    d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
  )
}

export function matchesOrderSearch(o: Orden, q: string) {
  if (!q) return true
  const hay = [
    o.cliente_nombre,
    o.cliente_telefono,
    o.trabajo,
    o.modelo,
    o.numero_serie,
    o.tipo_equipo?.nombre,
    o.marca?.nombre,
    o.estado_admin?.nombre,
    o.estado_tecnico?.nombre,
    o.ubicacion_actual?.nombre,
    o.accesorios,
    o.observaciones,
    o.tecnico?.full_name,
    String(o.numero),
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return hay.includes(q)
}
