-- ══════════════════════════════════════════════════════
-- Motor de Configuración de Negocio – Database Schema
-- ══════════════════════════════════════════════════════

-- Extensiones necesarias (ya habilitadas en schema.sql, pero por seguridad)
create extension if not exists "uuid-ossp";

-- 1. TABLA: configuracion_campos
-- Almacena la definición de cada variable clínica (manual o calculada)
create table if not exists public.clinical_variables (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    code text not null unique,
    description text,
    data_type text not null default 'number' check (data_type in ('number', 'text', 'date', 'boolean')),
    is_manual boolean default true,
    is_calculated boolean default false,
    has_formula boolean default false,
    has_ranges boolean default false,
    manual_inputs jsonb default '[]'::jsonb,
    visibility jsonb default '{"paciente": true, "nutricionista": true}'::jsonb,
    orden integer default 0,
    is_active boolean default true,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- 2. TABLA: variable_logic (Ramas/Branches)
-- Almacena la lógica de cálculo por ramas (General, Varones, Mujeres, etc)
create table if not exists public.variable_logic (
    id uuid default uuid_generate_v4() primary key,
    variable_id uuid references public.clinical_variables(id) on delete cascade not null,
    condition_name text not null default 'General',
    type text not null default 'default' check (type in ('default', 'gender', 'age')),
    condition_value text, -- 'M', 'F' o número para edad
    tokens jsonb default '[]'::jsonb,
    created_at timestamptz default now() not null
);

-- 3. TABLA: variable_ranges (Semáforo)
-- Almacena los rangos de interpretación (Bajo peso, Normal, etc) para cada rama de lógica
create table if not exists public.variable_ranges (
    id uuid default uuid_generate_v4() primary key,
    logic_id uuid references public.variable_logic(id) on delete cascade not null,
    label text not null,
    min numeric not null,
    max numeric not null,
    color text not null, -- clases de Tailwind o HEX
    created_at timestamptz default now() not null
);

-- 4. TABLA: card_slots_config
-- Configura qué variables se muestran en los slots de tarjetas de resumen
create table if not exists public.card_slots_config (
    id uuid default uuid_generate_v4() primary key,
    role text not null check (role in ('paciente', 'nutricionista')),
    slot_index integer not null,
    variable_id uuid references public.clinical_variables(id) on delete set null,
    icon text,
    color text,
    is_active boolean default true,
    unique(role, slot_index)
);

-- 5. MODIFICAR weight_records
-- Agregar soporte para datos dinámicos (variables creadas por admin que no tienen columna propia)
do $$
begin
    if not exists (select 1 from INFORMATION_SCHEMA.COLUMNS where TABLE_NAME = 'weight_records' and COLUMN_NAME = 'extra_data') then
        alter table public.weight_records add column extra_data jsonb default '{}'::jsonb;
    end if;
end $$;

-- ═══════════════════════════════
-- Row Level Security (RLS)
-- ═══════════════════════════════

alter table public.clinical_variables enable row level security;
alter table public.variable_logic enable row level security;
alter table public.variable_ranges enable row level security;
alter table public.card_slots_config enable row level security;

-- Lectura: Todos los autenticados pueden ver la configuración
create policy "Allow read access for all auth" on public.clinical_variables for select using (auth.role() = 'authenticated');
create policy "Allow read access for all auth" on public.variable_logic for select using (auth.role() = 'authenticated');
create policy "Allow read access for all auth" on public.variable_ranges for select using (auth.role() = 'authenticated');
create policy "Allow read access for all auth" on public.card_slots_config for select using (auth.role() = 'authenticated');

-- Escritura: Solo administradores
create policy "Allow internal manage for admins" on public.clinical_variables
  for all using (exists (select 1 from public.profiles where user_id = auth.uid() and role = 'administrador'));

create policy "Allow internal manage for admins" on public.variable_logic
  for all using (exists (select 1 from public.profiles where user_id = auth.uid() and role = 'administrador'));

create policy "Allow internal manage for admins" on public.variable_ranges
  for all using (exists (select 1 from public.profiles where user_id = auth.uid() and role = 'administrador'));

create policy "Allow internal manage for admins" on public.card_slots_config
  for all using (exists (select 1 from public.profiles where user_id = auth.uid() and role = 'administrador'));

-- ═══════════════════════════════
-- SEED DATA: Variables Iniciales
-- ═══════════════════════════════

with 
  v_date as (insert into public.clinical_variables (name, code, data_type, is_manual, orden) values ('Fecha', 'FECHA', 'date', true, 1) returning id),
  v_weight as (insert into public.clinical_variables (name, code, is_manual, orden) values ('Peso Actual', 'PESO', true, 2) returning id),
  v_imc as (insert into public.clinical_variables (name, code, is_manual, is_calculated, has_formula, has_ranges, orden, manual_inputs) 
            values ('Índice de Masa Corporal (IMC)', 'IMC', false, true, true, true, 3, '["Peso (kg)", "Talla (m)"]') returning id),
  v_waist as (insert into public.clinical_variables (name, code, is_manual, orden) values ('Cintura', 'CINTURA', true, 4) returning id),
  v_fat as (insert into public.clinical_variables (name, code, is_manual, orden) values ('Grasa (%)', 'GRASA', true, 5) returning id),
  v_musc as (insert into public.clinical_variables (name, code, is_manual, orden) values ('Musculo', 'MUSCULO', true, 6) returning id),
  v_findings as (insert into public.clinical_variables (name, code, data_type, is_manual, orden) values ('Hallazgos Especialista', 'HALLAZGOS', 'text', true, 7) returning id),
  v_recom as (insert into public.clinical_variables (name, code, data_type, is_manual, orden) values ('Recomendaciones', 'RECOMENDACIONES', 'text', true, 8) returning id)

-- Lógica y Rangos para IMC
insert into public.variable_logic (variable_id, condition_name, tokens)
select id, 'General', '[
    {"id": "t1", "type": "input", "value": "PESO", "display": "Peso (kg)"},
    {"id": "t2", "type": "operator", "value": "/", "display": "/"},
    {"id": "t3", "type": "operator", "value": "(", "display": "("},
    {"id": "t4", "type": "input", "value": "TALLA", "display": "Talla (m)"},
    {"id": "t5", "type": "operator", "value": "*", "display": "*"},
    {"id": "t6", "type": "input", "value": "TALLA", "display": "Talla (m)"},
    {"id": "t7", "type": "operator", "value": ")", "display": ")"}
]'::jsonb from v_imc;

with logic_imc as (select id from public.variable_logic where variable_id = (select id from public.clinical_variables where code = 'IMC'))
insert into public.variable_ranges (logic_id, label, min, max, color)
values 
  ((select id from logic_imc), 'Bajo Peso', 0, 18.5, 'bg-blue-500'),
  ((select id from logic_imc), 'Saludable', 18.5, 25, 'bg-nutrition-500'),
  ((select id from logic_imc), 'Sobrepeso', 25, 30, 'bg-yellow-500'),
  ((select id from logic_imc), 'Obesidad', 30, 100, 'bg-red-500');

-- Slots de Tarjetas Default (Paciente)
insert into public.card_slots_config (role, slot_index, variable_id, icon, color)
values 
  ('paciente', 0, (select id from public.clinical_variables where code = 'PESO'), 'Scale', 'text-nutrition-600'),
  ('paciente', 1, (select id from public.clinical_variables where code = 'GRASA'), 'Activity', 'text-orange-500'),
  ('paciente', 2, (select id from public.clinical_variables where code = 'CINTURA'), 'Ruler', 'text-indigo-500'),
  ('paciente', 3, null, 'Milestone', 'text-sky-500'); -- Slot especial para Loyalty
