import { useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { sb } from '@/lib/supabase'
import { useAppData } from '@/hooks/useAppData'
import { Login } from '@/components/Login'
import { Sidebar } from '@/components/Sidebar'
import { Header } from '@/components/Header'
import { Panel } from '@/components/Panel'
import { OrdenesList } from '@/components/OrdenesList'
import { NewOrderDialog } from '@/components/NewOrderDialog'
import { OrderDetail } from '@/components/OrderDetail'
import { ConfigSimple } from '@/components/config/ConfigSimple'
import { ConfigServicios } from '@/components/config/ConfigServicios'
import { ConfigEstadosAdmin } from '@/components/config/ConfigEstadosAdmin'
import { ConfigEstadosTecnicos } from '@/components/config/ConfigEstadosTecnicos'
import { ConfigUsuarios } from '@/components/config/ConfigUsuarios'

const VIEW_TITLES: Record<string, string> = {
  panel: 'Panel',
  ordenes: 'Órdenes de servicio',
  'cfg-tipos': 'Configuración · Tipos de equipo',
  'cfg-marcas': 'Configuración · Marcas',
  'cfg-ubicaciones': 'Configuración · Ubicaciones',
  'cfg-servicios': 'Configuración · Servicios',
  'cfg-eadmin': 'Configuración · Estados administrativos',
  'cfg-etec': 'Configuración · Estados técnicos',
  'cfg-usuarios': 'Configuración · Usuarios',
}

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [checkingSession, setCheckingSession] = useState(true)
  const [view, setView] = useState('panel')
  const [detailId, setDetailId] = useState<string | null>(null)
  const [configOpen, setConfigOpen] = useState(true)
  const [newOrderOpen, setNewOrderOpen] = useState(false)
  const { data: appData, loading, inactive, reloadOrdenes, reloadRef } = useAppData(session)

  useEffect(() => {
    sb.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setCheckingSession(false)
    })
  }, [])

  const goDetail = (id: string) => {
    setDetailId(id)
    setView('detail')
  }
  const goView = (v: string) => {
    setView(v)
    if (v !== 'detail') setDetailId(null)
  }
  const logout = async () => {
    await sb.auth.signOut()
    setSession(null)
  }

  if (checkingSession) return null
  if (!session) return <Login onLoggedIn={setSession} />
  if (inactive) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 text-center px-4">
        <p className="text-sm text-muted-foreground">Tu usuario fue desactivado. Contactá a un administrador.</p>
        <button className="text-sm text-primary underline underline-offset-2" onClick={() => setSession(null)}>
          Volver a iniciar sesión
        </button>
      </div>
    )
  }
  if (loading || !appData.profile) {
    return <div className="min-h-screen flex items-center justify-center text-muted-foreground text-sm">Cargando…</div>
  }

  const detailOrden = view === 'detail' && detailId ? appData.ordenes.find((o) => o.id === detailId) : null
  const title = view === 'detail' ? (detailOrden ? `Orden #${detailOrden.numero}` : 'Detalle de orden') : VIEW_TITLES[view] || 'ReWop'

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar view={view} setView={goView} profile={appData.profile} configOpen={configOpen} setConfigOpen={setConfigOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header title={title} profile={appData.profile} onLogout={logout} />
        <div className="flex-1 p-7 md:p-8 max-w-full overflow-y-auto">
          {view === 'panel' ? <Panel appData={appData} /> : null}
          {view === 'ordenes' ? (
            <OrdenesList appData={appData} openNewOrder={() => setNewOrderOpen(true)} goDetail={goDetail} />
          ) : null}
          {view === 'detail' && detailId ? (
            <OrderDetail orderId={detailId} appData={appData} session={session} reloadOrdenes={reloadOrdenes} goBack={() => goView('ordenes')} />
          ) : null}
          {view === 'cfg-tipos' ? (
            <ConfigSimple table="tipos_equipo" addLabel="Nuevo tipo de equipo" itemLabel="Nombre del tipo de equipo" reloadRef={reloadRef} />
          ) : null}
          {view === 'cfg-marcas' ? (
            <ConfigSimple table="marcas" addLabel="Nueva marca" itemLabel="Nombre de la marca" reloadRef={reloadRef} />
          ) : null}
          {view === 'cfg-ubicaciones' ? (
            <ConfigSimple table="ubicaciones" addLabel="Nueva ubicación" itemLabel="Nombre de la ubicación" reloadRef={reloadRef} />
          ) : null}
          {view === 'cfg-servicios' ? <ConfigServicios reloadRef={reloadRef} /> : null}
          {view === 'cfg-eadmin' ? <ConfigEstadosAdmin reloadRef={reloadRef} /> : null}
          {view === 'cfg-etec' ? <ConfigEstadosTecnicos reloadRef={reloadRef} /> : null}
          {view === 'cfg-usuarios' ? <ConfigUsuarios reloadRef={reloadRef} /> : null}
        </div>
      </div>
      <NewOrderDialog open={newOrderOpen} onOpenChange={setNewOrderOpen} appData={appData} reloadOrdenes={reloadOrdenes} session={session} goDetail={goDetail} />
    </div>
  )
}

export default App
