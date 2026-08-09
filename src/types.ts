export interface Profile {
  id: string
  full_name: string
  email: string | null
  role: 'admin' | 'operador' | 'tecnico'
  activo: boolean
}

export interface TipoEquipo {
  id: string
  nombre: string
  activo: boolean
  orden: number
}

export interface Marca {
  id: string
  nombre: string
  activo: boolean
  orden: number
}

export interface Ubicacion {
  id: string
  nombre: string
  activo: boolean
  orden: number
}

export interface EstadoAdmin {
  id: string
  nombre: string
  activo: boolean
  orden: number
  mensaje_whatsapp: string | null
  ubicacion_id: string | null
}

export interface EstadoTecnico {
  id: string
  nombre: string
  activo: boolean
  orden: number
  mensaje_whatsapp: string | null
  dispara_estado_admin_id: string | null
  ubicacion_id: string | null
}

export interface Orden {
  id: string
  numero: number
  cliente_nombre: string
  cliente_telefono: string | null
  trabajo: string
  modelo: string | null
  numero_serie: string | null
  accesorios: string | null
  observaciones: string | null
  tipo_equipo_id: string
  marca_id: string
  estado_admin_id: string
  estado_tecnico_id: string
  ubicacion_actual_id: string | null
  tecnico_id: string | null
  presupuesto_monto: number | string | null
  presupuesto_estado: 'pendiente' | 'aceptado' | 'rechazado'
  usuario_recepciono_id: string
  updated_at: string
  tipo_equipo: { nombre: string } | null
  marca: { nombre: string } | null
  estado_admin: { id: string; nombre: string; mensaje_whatsapp: string | null } | null
  estado_tecnico: {
    id: string
    nombre: string
    mensaje_whatsapp: string | null
    dispara_estado_admin_id: string | null
    ubicacion_id: string | null
  } | null
  ubicacion_actual: { id: string; nombre: string } | null
  tecnico: { full_name: string } | null
}

export interface HistorialEntry {
  id: string
  orden_id: string
  tipo_flujo: 'admin' | 'tecnico' | 'contacto' | 'nota'
  estado_admin_id: string | null
  estado_tecnico_id: string | null
  usuario_id: string
  fecha: string
  observacion: string | null
  estado_admin: { nombre: string } | null
  estado_tecnico: { nombre: string } | null
  usuario: { full_name: string } | null
}

export interface Servicio {
  id: string
  nombre: string
  precio: number
  activo: boolean
  orden: number
}

export interface OrdenItem {
  id: string
  orden_id: string
  tipo: 'servicio' | 'material'
  servicio_id: string | null
  nombre: string
  precio: number
  usuario_id: string | null
  created_at: string
}

export interface AppData {
  profile: Profile | null
  tiposEquipo: TipoEquipo[]
  marcas: Marca[]
  estadosAdmin: EstadoAdmin[]
  estadosTecnicos: EstadoTecnico[]
  ubicaciones: Ubicacion[]
  servicios: Servicio[]
  tecnicos: Profile[]
  ordenes: Orden[]
}
