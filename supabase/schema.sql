-- =========================================================
-- Esquema de base de datos: Administrador de Ordenes de Trabajo
-- Ejecutar completo en Supabase > SQL Editor
-- =========================================================

create extension if not exists "pgcrypto";

-- =========================================================
-- TABLA: profiles
-- Un registro por usuario autenticado (se crea automaticamente
-- al registrarse). El admin asigna el "role" despues desde el
-- Table Editor de Supabase.
-- =========================================================
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  role text not null default 'cliente' check (role in ('admin', 'tecnico', 'cliente')),
  cliente_id uuid,
  created_at timestamptz not null default now()
);

-- =========================================================
-- TABLA: clientes
-- =========================================================
create table if not exists clientes (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  telefono text,
  email text,
  direccion text,
  created_at timestamptz not null default now()
);

alter table profiles
  add constraint profiles_cliente_id_fkey
  foreign key (cliente_id) references clientes (id) on delete set null;

-- =========================================================
-- TABLA: equipos
-- =========================================================
create table if not exists equipos (
  id uuid primary key default gen_random_uuid(),
  cliente_id uuid not null references clientes (id) on delete cascade,
  tipo text not null,
  marca text,
  modelo text,
  numero_serie text,
  created_at timestamptz not null default now()
);

-- =========================================================
-- TABLA: ordenes_trabajo
-- =========================================================
create table if not exists ordenes_trabajo (
  id uuid primary key default gen_random_uuid(),
  numero bigserial unique,
  cliente_id uuid not null references clientes (id),
  equipo_id uuid references equipos (id),
  tecnico_id uuid references profiles (id),
  estado text not null default 'recibido' check (
    estado in (
      'recibido', 'diagnosticado', 'presupuestado', 'aprobado',
      'en_reparacion', 'esperando_repuesto', 'listo', 'entregado', 'cancelado'
    )
  ),
  descripcion_problema text,
  diagnostico text,
  fecha_ingreso timestamptz not null default now(),
  fecha_entrega_estimada date,
  fecha_entrega_real timestamptz,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =========================================================
-- TABLA: historial_estados (timeline de cada orden)
-- =========================================================
create table if not exists historial_estados (
  id uuid primary key default gen_random_uuid(),
  orden_id uuid not null references ordenes_trabajo (id) on delete cascade,
  estado text not null,
  comentario text,
  created_by uuid references profiles (id),
  created_at timestamptz not null default now()
);

-- =========================================================
-- TABLA: presupuestos
-- =========================================================
create table if not exists presupuestos (
  id uuid primary key default gen_random_uuid(),
  orden_id uuid not null references ordenes_trabajo (id) on delete cascade,
  monto numeric(12, 2) not null,
  descripcion text,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aprobado', 'rechazado')),
  created_at timestamptz not null default now(),
  respondido_at timestamptz
);

-- =========================================================
-- TABLA: repuestos_usados
-- =========================================================
create table if not exists repuestos_usados (
  id uuid primary key default gen_random_uuid(),
  orden_id uuid not null references ordenes_trabajo (id) on delete cascade,
  nombre text not null,
  cantidad int not null default 1,
  costo_unitario numeric(12, 2),
  created_at timestamptz not null default now()
);

-- =========================================================
-- TRIGGERS
-- =========================================================

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data ->> 'full_name', 'cliente');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

create or replace function log_cambio_estado()
returns trigger as $$
begin
  if (tg_op = 'INSERT') or (new.estado is distinct from old.estado) then
    insert into historial_estados (orden_id, estado, created_by)
    values (new.id, new.estado, new.tecnico_id);
  end if;
  new.updated_at = now();
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_orden_estado_change on ordenes_trabajo;
create trigger on_orden_estado_change
  before insert or update on ordenes_trabajo
  for each row execute function log_cambio_estado();

-- =========================================================
-- FUNCIONES AUXILIARES
-- =========================================================
create or replace function current_role_app()
returns text as $$
  select role from profiles where id = auth.uid();
$$ language sql stable security definer;

create or replace function current_cliente_id()
returns uuid as $$
  select cliente_id from profiles where id = auth.uid();
$$ language sql stable security definer;

-- =========================================================
-- ROW LEVEL SECURITY
-- =========================================================
alter table profiles enable row level security;
alter table clientes enable row level security;
alter table equipos enable row level security;
alter table ordenes_trabajo enable row level security;
alter table historial_estados enable row level security;
alter table presupuestos enable row level security;
alter table repuestos_usados enable row level security;

create policy "profiles_select_own_or_admin" on profiles
  for select using (id = auth.uid() or current_role_app() = 'admin');
create policy "profiles_update_admin" on profiles
  for update using (current_role_app() = 'admin');

create policy "clientes_select" on clientes
  for select using (
    current_role_app() in ('admin', 'tecnico')
    or id = current_cliente_id()
  );
create policy "clientes_write_admin" on clientes
  for insert with check (current_role_app() = 'admin');
create policy "clientes_update_admin" on clientes
  for update using (current_role_app() = 'admin');

create policy "equipos_select" on equipos
  for select using (
    current_role_app() in ('admin', 'tecnico')
    or cliente_id = current_cliente_id()
  );
create policy "equipos_write_admin" on equipos
  for insert with check (current_role_app() in ('admin', 'tecnico'));
create policy "equipos_update_admin" on equipos
  for update using (current_role_app() in ('admin', 'tecnico'));

create policy "ordenes_select" on ordenes_trabajo
  for select using (
    current_role_app() in ('admin', 'tecnico')
    or cliente_id = current_cliente_id()
  );
create policy "ordenes_insert" on ordenes_trabajo
  for insert with check (current_role_app() in ('admin', 'tecnico'));
create policy "ordenes_update" on ordenes_trabajo
  for update using (
    current_role_app() = 'admin'
    or (current_role_app() = 'tecnico' and (tecnico_id = auth.uid() or tecnico_id is null))
  );

create policy "historial_select" on historial_estados
  for select using (
    exists (
      select 1 from ordenes_trabajo o
      where o.id = orden_id
      and (
        current_role_app() in ('admin', 'tecnico')
        or o.cliente_id = current_cliente_id()
      )
    )
  );
create policy "historial_insert" on historial_estados
  for insert with check (current_role_app() in ('admin', 'tecnico'));

create policy "presupuestos_select" on presupuestos
  for select using (
    exists (
      select 1 from ordenes_trabajo o
      where o.id = orden_id
      and (
        current_role_app() in ('admin', 'tecnico')
        or o.cliente_id = current_cliente_id()
      )
    )
  );
create policy "presupuestos_insert" on presupuestos
  for insert with check (current_role_app() in ('admin', 'tecnico'));
create policy "presupuestos_update" on presupuestos
  for update using (
    current_role_app() in ('admin', 'tecnico')
    or exists (
      select 1 from ordenes_trabajo o
      where o.id = orden_id and o.cliente_id = current_cliente_id()
    )
  );

create policy "repuestos_select" on repuestos_usados
  for select using (
    exists (
      select 1 from ordenes_trabajo o
      where o.id = orden_id
      and (
        current_role_app() in ('admin', 'tecnico')
        or o.cliente_id = current_cliente_id()
      )
    )
  );
create policy "repuestos_insert" on repuestos_usados
  for insert with check (current_role_app() in ('admin', 'tecnico'));

-- =========================================================
-- Fin del script
-- =========================================================
