import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { ChevronLeft, Plus, MessageCircle, Trash2 } from 'lucide-react'
import { sb } from '@/lib/supabase'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { badgeVariant, fillTemplate, waLink, fmtFecha, RECORDATORIO_TEMPLATES } from '@/lib/helpers'
import type { AppData, HistorialEntry, OrdenItem } from '@/types'

const NONE = '__none__'
const fieldLabel = 'mb-1.5 block text-xs font-medium text-muted-foreground'
const CONTACTO_MOTIVOS = [
  'Llamado sin respuesta',
  'Llamado - se comunicó',
  'WhatsApp enviado',
  'SMS enviado',
  ...Object.keys(RECORDATORIO_TEMPLATES),
  'Otro',
]

export function OrderDetail({
  orderId,
  appData,
  session,
  reloadOrdenes,
  goBack,
}: {
  orderId: string
  appData: AppData
  session: Session
  reloadOrdenes: () => Promise<void>
  goBack: () => void
}) {
  const [historial, setHistorial] = useState<HistorialEntry[]>([])
  const [items, setItems] = useState<OrdenItem[]>([])
  const o = appData.ordenes.find((x) => x.id === orderId)
  const role = appData.profile?.role
  const canEditTecnico = role === 'admin' || role === 'tecnico'
  const canEditAdmin = role === 'admin' || role === 'operador'
  const [actSel, setActSel] = useState('')
  const [ubicSel, setUbicSel] = useState('')
  const [actObs, setActObs] = useState('')
  const [notaTexto, setNotaTexto] = useState('')
  const [contactoMotivo, setContactoMotivo] = useState('')
  const [contactoDetalle, setContactoDetalle] = useState('')
  const [servicioSel, setServicioSel] = useState('')
  const [matNombre, setMatNombre] = useState('')
  const [matPrecio, setMatPrecio] = useState('')
  const [itemsErr, setItemsErr] = useState('')
  const [tecnicoSel, setTecnicoSel] = useState(o?.tecnico_id || '')
  const [monto, setMonto] = useState(o?.presupuesto_monto ?? '')
  const [presEstado, setPresEstado] = useState(o?.presupuesto_estado || 'pendiente')

  useEffect(() => {
    if (!actSel) {
      setUbicSel('')
      return
    }
    const [tipo, estadoId] = actSel.split(':')
    const estado =
      tipo === 'admin'
        ? appData.estadosAdmin.find((e) => e.id === estadoId)
        : appData.estadosTecnicos.find((e) => e.id === estadoId)
    setUbicSel(estado?.ubicacion_id || '')
  }, [actSel, appData.estadosAdmin, appData.estadosTecnicos])

  const loadHist = useCallback(async () => {
    const { data, error } = await sb
      .from('historial_estados')
      .select(`*, estado_admin:estados_admin(nombre), estado_tecnico:estados_tecnicos(nombre), usuario:profiles(full_name)`)
      .eq('orden_id', orderId)
      .order('fecha', { ascending: false })
    setHistorial(error ? [] : data)
  }, [orderId])

  const loadItems = useCallback(async () => {
    const { data, error } = await sb.from('orden_items').select('*').eq('orden_id', orderId).order('created_at', { ascending: true })
    setItems(error ? [] : data)
  }, [orderId])

  useEffect(() => {
    loadHist()
    loadItems()
  }, [loadHist, loadItems])
  useEffect(() => {
    setTecnicoSel(o?.tecnico_id || '')
    setMonto(o?.presupuesto_monto ?? '')
    setPresEstado(o?.presupuesto_estado || 'pendiente')
  }, [o?.id, o?.tecnico_id, o?.presupuesto_monto, o?.presupuesto_estado])

  if (!o) return <p>Orden no encontrada.</p>

  const agregarActividad = async () => {
    if (!actSel) return
    const [tipo, estadoId] = actSel.split(':')
    const obs = actObs.trim() || null
    if (tipo === 'admin') {
      const updates: Record<string, unknown> = { estado_admin_id: estadoId, updated_at: new Date().toISOString() }
      if (ubicSel) updates.ubicacion_actual_id = ubicSel
      await sb.from('ordenes').update(updates).eq('id', orderId)
      await sb.from('historial_estados').insert({ orden_id: orderId, tipo_flujo: 'admin', estado_admin_id: estadoId, usuario_id: session.user.id, observacion: obs })
    } else {
      const estado = appData.estadosTecnicos.find((e) => e.id === estadoId)
      const updates: Record<string, unknown> = { estado_tecnico_id: estadoId, updated_at: new Date().toISOString() }
      if (estado?.dispara_estado_admin_id) updates.estado_admin_id = estado.dispara_estado_admin_id
      if (ubicSel) updates.ubicacion_actual_id = ubicSel
      await sb.from('ordenes').update(updates).eq('id', orderId)
      const inserts: Record<string, unknown>[] = [
        { orden_id: orderId, tipo_flujo: 'tecnico', estado_tecnico_id: estadoId, usuario_id: session.user.id, observacion: obs },
      ]
      if (estado?.dispara_estado_admin_id)
        inserts.push({ orden_id: orderId, tipo_flujo: 'admin', estado_admin_id: estado.dispara_estado_admin_id, usuario_id: session.user.id })
      await sb.from('historial_estados').insert(inserts)
    }
    await reloadOrdenes()
    await loadHist()
    setActSel('')
    setUbicSel('')
    setActObs('')
  }

  const agregarNota = async () => {
    if (!notaTexto.trim()) return
    await sb.from('historial_estados').insert({ orden_id: orderId, tipo_flujo: 'nota', usuario_id: session.user.id, observacion: notaTexto.trim() })
    await loadHist()
    setNotaTexto('')
  }

  const agregarContacto = async () => {
    if (!contactoMotivo) return
    const observacion = contactoDetalle.trim() ? `${contactoMotivo}: ${contactoDetalle.trim()}` : contactoMotivo
    await sb.from('historial_estados').insert({ orden_id: orderId, tipo_flujo: 'contacto', usuario_id: session.user.id, observacion })
    const tpl = RECORDATORIO_TEMPLATES[contactoMotivo]
    if (tpl) {
      const texto = fillTemplate(tpl, o)
      await sb.from('mensajes_enviados').insert({ orden_id: orderId, estado_relacionado: contactoMotivo, contenido: texto, canal: 'whatsapp' })
      window.open(waLink(o.cliente_telefono, texto), '_blank')
    }
    await loadHist()
    setContactoMotivo('')
    setContactoDetalle('')
  }

  const agregarServicio = async () => {
    const servicio = appData.servicios.find((s) => s.id === servicioSel)
    if (!servicio) return
    setItemsErr('')
    const { error } = await sb.from('orden_items').insert({
      orden_id: orderId,
      tipo: 'servicio',
      servicio_id: servicio.id,
      nombre: servicio.nombre,
      precio: servicio.precio,
      usuario_id: session.user.id,
    })
    if (error) {
      setItemsErr(error.message)
      return
    }
    await loadItems()
    setServicioSel('')
  }

  const agregarMaterial = async () => {
    if (!matNombre.trim()) return
    setItemsErr('')
    const { error } = await sb.from('orden_items').insert({
      orden_id: orderId,
      tipo: 'material',
      servicio_id: null,
      nombre: matNombre.trim(),
      precio: Number(matPrecio) || 0,
      usuario_id: session.user.id,
    })
    if (error) {
      setItemsErr(error.message)
      return
    }
    await loadItems()
    setMatNombre('')
    setMatPrecio('')
  }

  const eliminarItem = async (id: string) => {
    await sb.from('orden_items').delete().eq('id', id)
    await loadItems()
  }

  const totalItems = items.reduce((sum, it) => sum + Number(it.precio), 0)

  const guardarTecnico = async () => {
    await sb.from('ordenes').update({ tecnico_id: tecnicoSel || null, updated_at: new Date().toISOString() }).eq('id', orderId)
    await reloadOrdenes()
  }
  const guardarPresupuesto = async () => {
    await sb.from('ordenes').update({ presupuesto_monto: monto || null, presupuesto_estado: presEstado, updated_at: new Date().toISOString() }).eq('id', orderId)
    await reloadOrdenes()
  }
  const enviarWhatsapp = async () => {
    const texto = fillTemplate(o.estado_admin?.mensaje_whatsapp, o)
    await sb.from('mensajes_enviados').insert({ orden_id: orderId, estado_relacionado: o.estado_admin?.nombre, contenido: texto, canal: 'whatsapp' })
    window.open(waLink(o.cliente_telefono, texto), '_blank')
  }

  return (
    <div>
      <div className="flex items-center gap-1.5 text-sm text-muted-foreground cursor-pointer w-fit mb-3.5 hover:text-foreground" onClick={goBack}>
        <ChevronLeft className="w-4 h-4" />
        <span>Volver a órdenes de servicio</span>
      </div>
      <p className="text-sm text-muted-foreground mb-5">
        {o.cliente_nombre} · {o.cliente_telefono}
      </p>

      <div className="grid gap-5" style={{ gridTemplateColumns: '1fr 300px' }}>
        <div>
          <Card className="p-4.5 mb-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Agregar actividad</div>
            <div className="flex gap-3 items-end">
              <Select value={actSel} onValueChange={setActSel}>
                <SelectTrigger className="flex-1 w-full">
                  <SelectValue placeholder="Elegir actividad..." />
                </SelectTrigger>
                <SelectContent>
                  {canEditAdmin ? (
                    <SelectGroup>
                      <SelectLabel>Flujo administrativo</SelectLabel>
                      {appData.estadosAdmin.map((e) => (
                        <SelectItem key={e.id} value={'admin:' + e.id}>
                          {e.nombre}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ) : null}
                  {canEditTecnico ? (
                    <SelectGroup>
                      <SelectLabel>Flujo técnico</SelectLabel>
                      {appData.estadosTecnicos.map((e) => (
                        <SelectItem key={e.id} value={'tecnico:' + e.id}>
                          {e.nombre}
                        </SelectItem>
                      ))}
                    </SelectGroup>
                  ) : null}
                </SelectContent>
              </Select>
              <div className="w-40 shrink-0">
                <Select value={ubicSel || NONE} onValueChange={(v) => setUbicSel(v === NONE ? '' : v)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>Sin cambio de ubicación</SelectItem>
                    {appData.ubicaciones.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.nombre}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Button className="shrink-0" onClick={agregarActividad}>
                <Plus className="w-4 h-4" /> Agregar
              </Button>
            </div>
            <Textarea
              className="mt-3"
              rows={2}
              placeholder="Observación (opcional)"
              value={actObs}
              onChange={(e) => setActObs(e.target.value)}
            />
          </Card>

          <Card className="p-4.5 mb-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Intento de contacto</div>
            <div className="flex gap-3 items-end mb-2">
              <Select value={contactoMotivo} onValueChange={setContactoMotivo}>
                <SelectTrigger className="flex-1 w-full">
                  <SelectValue placeholder="Elegir motivo..." />
                </SelectTrigger>
                <SelectContent>
                  {CONTACTO_MOTIVOS.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button className="shrink-0" onClick={agregarContacto} disabled={!contactoMotivo}>
                <Plus className="w-4 h-4" /> Registrar
              </Button>
            </div>
            <Input
              placeholder="Detalle (opcional)"
              value={contactoDetalle}
              onChange={(e) => setContactoDetalle(e.target.value)}
            />
            {RECORDATORIO_TEMPLATES[contactoMotivo] ? (
              <p className="text-xs text-muted-foreground mt-2">Al registrar se abre WhatsApp con el mensaje del recordatorio.</p>
            ) : null}
          </Card>

          <Card className="p-4.5 mb-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Nota libre</div>
            <div className="flex gap-3 items-end">
              <Textarea
                className="flex-1"
                rows={2}
                placeholder="Escribí una nota de avance u observación..."
                value={notaTexto}
                onChange={(e) => setNotaTexto(e.target.value)}
              />
              <Button className="shrink-0" onClick={agregarNota} disabled={!notaTexto.trim()}>
                <Plus className="w-4 h-4" /> Agregar
              </Button>
            </div>
          </Card>

          <Card className="p-4.5 mb-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Servicios y materiales</div>
            {canEditTecnico ? (
              <div className="flex flex-col gap-2 mb-3">
                <div className="flex gap-3 items-end">
                  <Select value={servicioSel} onValueChange={setServicioSel}>
                    <SelectTrigger className="flex-1 w-full">
                      <SelectValue placeholder="Elegir servicio..." />
                    </SelectTrigger>
                    <SelectContent>
                      {appData.servicios.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.nombre} — ${Number(s.precio).toFixed(2)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button className="shrink-0" onClick={agregarServicio} disabled={!servicioSel}>
                    <Plus className="w-4 h-4" /> Agregar
                  </Button>
                </div>
                <div className="flex gap-3 items-end">
                  <Input
                    className="flex-1"
                    placeholder="Material (nombre)"
                    value={matNombre}
                    onChange={(e) => setMatNombre(e.target.value)}
                  />
                  <Input
                    type="number"
                    className="w-28 shrink-0"
                    placeholder="Precio"
                    value={matPrecio}
                    onChange={(e) => setMatPrecio(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') agregarMaterial()
                    }}
                  />
                  <Button variant="secondary" className="shrink-0" onClick={agregarMaterial} disabled={!matNombre.trim()}>
                    <Plus className="w-4 h-4" /> Agregar
                  </Button>
                </div>
                {itemsErr ? <p className="text-destructive text-sm">{itemsErr}</p> : null}
              </div>
            ) : null}
            {items.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin servicios ni materiales cargados.</p>
            ) : (
              <div>
                {items.map((it) => (
                  <div key={it.id} className="flex items-center justify-between gap-2 py-1.5 border-b border-border last:border-b-0">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Badge variant={it.tipo === 'servicio' ? 'default' : 'outline'}>{it.tipo === 'servicio' ? 'Servicio' : 'Material'}</Badge>
                      <span className="text-sm truncate">{it.nombre}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-mono">${Number(it.precio).toFixed(2)}</span>
                      {canEditTecnico ? (
                        <button
                          type="button"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => eliminarItem(it.id)}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-center justify-between pt-2 mt-1 border-t border-border">
              <span className="text-sm font-medium">Total</span>
              <span className="text-sm font-mono font-semibold">${totalItems.toFixed(2)}</span>
            </div>
          </Card>

          <Card className="p-4.5">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Historial de actividades</div>
            <div className="relative pl-5">
              <div className="absolute left-[5px] top-1 bottom-1 w-px bg-border" />
              {historial.length === 0 ? (
                <p className="text-sm text-muted-foreground">Sin actividad registrada.</p>
              ) : (
                historial.map((h) => (
                  <div key={h.id} className="relative pb-4.5">
                    <div className="absolute -left-5 top-0.5 w-2 h-2 rounded-full bg-primary ring-2 ring-card" />
                    <div className="text-sm font-medium">
                      {h.tipo_flujo === 'admin' || h.tipo_flujo === 'tecnico'
                        ? h.tipo_flujo === 'admin'
                          ? h.estado_admin?.nombre || ''
                          : h.estado_tecnico?.nombre || ''
                        : h.observacion || ''}
                      <Badge
                        className="ml-1.5"
                        variant={
                          h.tipo_flujo === 'admin'
                            ? 'default'
                            : h.tipo_flujo === 'tecnico'
                              ? 'outline'
                              : h.tipo_flujo === 'contacto'
                                ? 'warning'
                                : 'secondary'
                        }
                      >
                        {h.tipo_flujo === 'admin'
                          ? 'Administrativo'
                          : h.tipo_flujo === 'tecnico'
                            ? 'Técnico'
                            : h.tipo_flujo === 'contacto'
                              ? 'Intento de contacto'
                              : 'Nota'}
                      </Badge>
                    </div>
                    {(h.tipo_flujo === 'admin' || h.tipo_flujo === 'tecnico') && h.observacion ? (
                      <div className="text-sm text-muted-foreground mt-0.5">{h.observacion}</div>
                    ) : null}
                    <div className="text-xs text-muted-foreground mt-0.5">
                      {fmtFecha(h.fecha)} · {h.usuario?.full_name || 'Sistema'}
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>

        <div>
          <Card className="p-4.5 mb-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Equipo</div>
            <p className="text-sm mb-1">
              {o.tipo_equipo?.nombre || ''} {o.marca?.nombre || ''} {o.modelo || ''}
            </p>
            {o.numero_serie ? <p className="text-xs text-muted-foreground mb-1">N/S {o.numero_serie}</p> : null}
            <p className="text-sm text-muted-foreground mt-2">{o.trabajo}</p>
            {o.accesorios ? <p className="text-xs text-muted-foreground mt-2">Accesorios: {o.accesorios}</p> : null}
            {o.observaciones ? <p className="text-xs text-muted-foreground mt-2">Obs: {o.observaciones}</p> : null}
          </Card>

          <Card className="p-4.5 mb-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Estado actual</div>
            <p className="text-xs text-muted-foreground mb-1.5">Administrativo</p>
            <Badge variant={badgeVariant(o.estado_admin?.nombre)}>{o.estado_admin?.nombre || '—'}</Badge>
            <p className="text-xs text-muted-foreground mt-3 mb-1.5">Técnico</p>
            <Badge variant={badgeVariant(o.estado_tecnico?.nombre)}>{o.estado_tecnico?.nombre || '—'}</Badge>
            <p className="text-xs text-muted-foreground mt-3 mb-1.5">Ubicación actual</p>
            <Badge variant="outline">{o.ubicacion_actual?.nombre || '—'}</Badge>
            {o.estado_admin?.mensaje_whatsapp ? (
              <>
                <div className="bg-muted rounded-md p-2.5 text-sm whitespace-pre-wrap mt-3 mb-3 border border-border">
                  {fillTemplate(o.estado_admin.mensaje_whatsapp, o)}
                </div>
                <Button variant="secondary" className="w-full" onClick={enviarWhatsapp}>
                  <MessageCircle className="w-4 h-4" /> Abrir WhatsApp
                </Button>
              </>
            ) : null}
          </Card>

          <Card className="p-4.5 mb-4">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Técnico asignado</div>
            <Select value={tecnicoSel || NONE} onValueChange={(v) => setTecnicoSel(v === NONE ? '' : v)} disabled={!canEditAdmin}>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE}>Sin asignar</SelectItem>
                {appData.tecnicos.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.full_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {canEditAdmin ? (
              <Button variant="secondary" className="w-full mt-2" onClick={guardarTecnico}>
                Guardar
              </Button>
            ) : null}
          </Card>

          <Card className="p-4.5">
            <div className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Presupuesto</div>
            <div className="mb-3">
              <Label className={fieldLabel}>Monto</Label>
              <Input type="number" disabled={!canEditAdmin} value={monto} onChange={(e) => setMonto(e.target.value)} />
            </div>
            <div className="mb-3">
              <Label className={fieldLabel}>Estado</Label>
              <Select value={presEstado} onValueChange={(v) => setPresEstado(v as typeof presEstado)} disabled={!canEditAdmin}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pendiente">Pendiente</SelectItem>
                  <SelectItem value="aceptado">Aceptado</SelectItem>
                  <SelectItem value="rechazado">Rechazado</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {canEditAdmin ? (
              <Button variant="secondary" className="w-full" onClick={guardarPresupuesto}>
                Guardar presupuesto
              </Button>
            ) : null}
          </Card>
        </div>
      </div>
    </div>
  )
}
