# Rewop — Órdenes de servicio

App web para gestionar órdenes de servicio de un taller técnico (electrónica, electrodomésticos, PC): recepción rápida, dos flujos de estado (administrativo y técnico) configurables, presupuestos, y generación de mensajes de WhatsApp para el cliente.

React + TypeScript + Vite, con [shadcn/ui](https://ui.shadcn.com) (Radix) para los componentes y Tailwind CSS v4. Se conecta directo a Supabase (Postgres + Auth) desde el cliente.

## Desarrollo local

```bash
npm install
cp .env.example .env   # completar VITE_SUPABASE_URL y VITE_SUPABASE_ANON_KEY
npm run dev
```

`npm run build` genera la salida estática en `dist/` (`npm run preview` para probarla localmente antes de deployar).

## Roles
- **admin**: acceso total, incluida la Configuración (tipos de equipo, marcas, estados y plantillas de mensaje).
- **operador**: gestiona el flujo administrativo (presupuestos, entregas) y arma los mensajes de WhatsApp.
- **tecnico**: gestiona el flujo técnico (diagnóstico, reparación, etc).

## Cómo crear usuarios
1. Andá al panel de Supabase de este proyecto → **Authentication → Add user**.
2. Después, en **Table Editor → profiles**, buscá ese usuario y asigná su `role` (`admin`, `operador` o `tecnico`) y su `full_name`.

## Deploy
Pendiente de migrar a un VPS propio (build estático servido con nginx). Ya no está conectado a Netlify.
