# Rewop — Órdenes de servicio

App web para gestionar órdenes de servicio de un taller técnico (electrónica, electrodomésticos, PC): recepción rápida, dos flujos de estado (administrativo y técnico) configurables, presupuestos, y generación de mensajes de WhatsApp para el cliente.

Es un único archivo estático (`index.html`) que se conecta directo a Supabase (Postgres + Auth). No requiere build ni Node — se publica tal cual en Netlify.

## Roles
- **admin**: acceso total, incluida la Configuración (tipos de equipo, marcas, estados y plantillas de mensaje).
- **operador**: gestiona el flujo administrativo (presupuestos, entregas) y arma los mensajes de WhatsApp.
- **tecnico**: gestiona el flujo técnico (diagnóstico, reparación, etc).

## Cómo crear usuarios
1. Andá al panel de Supabase de este proyecto → **Authentication → Add user**.
2. Después, en **Table Editor → profiles**, buscá ese usuario y asigná su `role` (`admin`, `operador` o `tecnico`) y su `full_name`.

## Deploy
Conectado a Netlify: cualquier cambio en `main` se publica solo en https://rewop.netlify.app/
