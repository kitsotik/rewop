import { useCallback, useEffect, useState } from 'react'
import type { Session } from '@supabase/supabase-js'
import { sb, ORDEN_SELECT } from '@/lib/supabase'
import type { AppData } from '@/types'

const EMPTY: AppData = {
  profile: null,
  tiposEquipo: [],
  marcas: [],
  estadosAdmin: [],
  estadosTecnicos: [],
  ubicaciones: [],
  servicios: [],
  tecnicos: [],
  ordenes: [],
}

export function useAppData(session: Session | null) {
  const [data, setData] = useState<AppData>(EMPTY)
  const [loading, setLoading] = useState(true)
  const [inactive, setInactive] = useState(false)

  const reloadOrdenes = useCallback(async () => {
    const { data: rows, error } = await sb.from('ordenes').select(ORDEN_SELECT).order('numero', { ascending: false })
    setData((d) => ({ ...d, ordenes: error ? [] : (rows as unknown as AppData['ordenes']) }))
  }, [])

  const reloadRef = useCallback(async () => {
    const [te, ma, ea, et, ub, se, tec] = await Promise.all([
      sb.from('tipos_equipo').select('*').eq('activo', true).order('orden'),
      sb.from('marcas').select('*').eq('activo', true).order('orden'),
      sb.from('estados_admin').select('*').eq('activo', true).order('orden'),
      sb.from('estados_tecnicos').select('*').eq('activo', true).order('orden'),
      sb.from('ubicaciones').select('*').eq('activo', true).order('orden'),
      sb.from('servicios').select('*').eq('activo', true).order('orden'),
      sb.from('profiles').select('*').eq('role', 'tecnico').eq('activo', true),
    ])
    setData((d) => ({
      ...d,
      tiposEquipo: te.data || [],
      marcas: ma.data || [],
      estadosAdmin: ea.data || [],
      estadosTecnicos: et.data || [],
      ubicaciones: ub.data || [],
      servicios: se.data || [],
      tecnicos: tec.data || [],
    }))
  }, [])

  useEffect(() => {
    if (!session) {
      setLoading(false)
      return
    }
    ;(async () => {
      setLoading(true)
      setInactive(false)
      const { data: prof } = await sb.from('profiles').select('*').eq('id', session.user.id).single()
      if (prof && !prof.activo) {
        await sb.auth.signOut()
        setData(EMPTY)
        setInactive(true)
        setLoading(false)
        return
      }
      setData((d) => ({ ...d, profile: prof }))
      await reloadRef()
      await reloadOrdenes()
      setLoading(false)
    })()
  }, [session, reloadRef, reloadOrdenes])

  return { data, setData, loading, inactive, reloadOrdenes, reloadRef }
}
