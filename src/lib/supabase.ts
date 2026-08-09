import { createClient } from '@supabase/supabase-js'

export const sb = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY,
)

export const PAGE_SIZE = 20

export const ORDEN_SELECT = `*, tipo_equipo:tipos_equipo(nombre), marca:marcas(nombre),
  estado_admin:estados_admin!ordenes_estado_admin_id_fkey(id,nombre,mensaje_whatsapp),
  estado_tecnico:estados_tecnicos!ordenes_estado_tecnico_id_fkey(id,nombre,mensaje_whatsapp,dispara_estado_admin_id,ubicacion_id),
  ubicacion_actual:ubicaciones!ordenes_ubicacion_actual_id_fkey(id,nombre),
  tecnico:profiles!ordenes_tecnico_id_fkey(full_name)`
