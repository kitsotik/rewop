# Rewop

App web para administrar ordenes de trabajo de un taller tecnico: clientes, equipos,
ordenes con estados, presupuestos, repuestos usados y un portal para que los clientes
consulten el estado de su equipo. Roles: **admin**, **tecnico**, **cliente**.

Stack: React + Vite + Supabase (Postgres, Auth, Row Level Security). Costo: $0 mientras
el uso sea chico (ver plan gratuito de Supabase y Vercel).

## 1. Crear el proyecto en Supabase

1. Anda a https://supabase.com y crea una cuenta (gratis, sin tarjeta).
2. Creá un nuevo proyecto (elegí una región cercana, ej. South America).
3. Cuando el proyecto este listo, anda a **SQL Editor**, pega el contenido completo de
   `supabase/schema.sql` (esta en esta misma carpeta) y ejecutalo. Esto crea todas las
   tablas, triggers y las politicas de seguridad (RLS) por rol.
4. Anda a **Project Settings > API** y copia:
   - `Project URL`
   - `anon public key`

## 2. Configurar la app localmente

Requisitos: Node.js 18 o superior.

```bash
cd ordenes-taller
npm install
cp .env.example .env
```

Editá `.env` y pegá los valores de Supabase:

```
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=tu-anon-key
```

Corré la app en modo desarrollo:

```bash
npm run dev
```

Abrí la URL que te muestra la terminal (por defecto http://localhost:5173).

## 3. Crear el primer usuario administrador

1. En la app, hace click en "Registrate" y creá una cuenta con tu email.
2. Por defecto, todo usuario nuevo se crea con rol `cliente`. Para convertirte en
   `admin`: anda al panel de Supabase, **Table Editor > profiles**, buscá tu usuario
   (por id o full_name) y cambia la columna `role` a `admin`.
3. Volve a iniciar sesion en la app (o refresca la pagina) y ya vas a ver el panel
   completo de ordenes.

Para crear tecnicos: pediles que se registren igual que un cliente, y despues cambiales
el `role` a `tecnico` desde la misma tabla `profiles`.

Para vincular un usuario cliente a un registro de `clientes` existente (asi ve sus
propias ordenes): en `profiles`, completa la columna `cliente_id` con el `id` del
registro correspondiente en la tabla `clientes`.

## 4. Publicar en Vercel (gratis)

1. Subi esta carpeta a un repositorio de GitHub (o GitLab/Bitbucket).
2. Anda a https://vercel.com, crea una cuenta gratis y conecta el repositorio.
3. Vercel detecta automaticamente que es un proyecto Vite. En **Environment
   Variables**, agrega:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy. En un par de minutos tenes la app publicada con una URL propia
   (`https://tu-proyecto.vercel.app`).

## Estados de una orden

`recibido` -> `diagnosticado` -> `presupuestado` -> `aprobado` -> `en_reparacion` ->
`esperando_repuesto` (opcional) -> `listo` -> `entregado` (o `cancelado` en cualquier
momento).

## Que hace cada rol

- **admin**: ve y edita todo, crea ordenes, asigna tecnicos, carga presupuestos.
- **tecnico**: ve las ordenes, puede tomar/actualizar las que tiene asignadas, cambia
  estados, carga diagnostico y repuestos.
- **cliente**: ve unicamente sus propias ordenes y su historial, y puede aprobar o
  rechazar presupuestos.

## Proximos pasos sugeridos (no incluidos en esta primera version)

- Subida de fotos antes/despues (Supabase Storage).
- Notificaciones automaticas por email cuando cambia el estado (Supabase Edge
  Functions + un servicio de email).
- Generacion de PDF de la orden/factura.
- Dashboard con metricas (tiempo promedio de reparacion, ordenes por tecnico).

## Nota

Este codigo fue escrito a mano en un entorno sin acceso a internet para instalar
dependencias, por lo que no se pudo correr `npm install` / `npm run build` antes de
entregarlo. Se revisaron manualmente sintaxis y balance de llaves en cada archivo.
Si al correr `npm install && npm run dev` aparece algun error, mandamelo y lo
corregimos al toque.
