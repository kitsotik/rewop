import { useCallback, useEffect, useState } from 'react'
import { sb } from '@/lib/supabase'

export function useCfgRows<T>(table: string) {
  const [rows, setRows] = useState<T[]>([])
  const reload = useCallback(async () => {
    const { data } = await sb.from(table).select('*').order('orden')
    setRows((data as T[]) || [])
  }, [table])
  useEffect(() => {
    reload()
  }, [reload])
  return [rows, reload] as const
}
