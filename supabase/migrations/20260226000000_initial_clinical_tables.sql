
-- TBL: clinical_variables
create table if not exists public.clinical_variables (
    id uuid default uuid_generate_v4() primary key,
    name text not null,
    code text unique not null,
    description text,
    unit text,
    data_type text default 'number',
    is_manual boolean default true,
    is_calculated boolean default false,
    has_formula boolean default false,
    has_ranges boolean default false,
    manual_inputs text[] default '{}'::text[],
    is_active boolean default true,
    orden integer default 0,
    created_at timestamptz default now()
);

-- Asegurar que la columna existe si la tabla ya fue creada
do $$ 
begin 
    if not exists (select column_name from information_schema.columns where table_name='clinical_variables' and column_name='manual_inputs') then
        alter table public.clinical_variables add column manual_inputs text[] default '{}'::text[];
    end if;
end $$;

-- TBL: variable_logic
create table if not exists public.variable_logic (
    id uuid default uuid_generate_v4() primary key,
    variable_id uuid references public.clinical_variables(id) on delete cascade,
    condition_name text default 'General',
    type text default 'default', -- 'default', 'gender', 'age'
    condition_value text,
    tokens jsonb default '[]'::jsonb,
    created_at timestamptz default now()
);

-- TBL: variable_ranges
create table if not exists public.variable_ranges (
    id uuid default uuid_generate_v4() primary key,
    logic_id uuid references public.variable_logic(id) on delete cascade,
    label text,
    min numeric,
    max numeric,
    color text,
    created_at timestamptz default now()
);

-- TBL: dashboard_layout
create table if not exists public.dashboard_layout (
    id uuid default uuid_generate_v4() primary key,
    role text unique not null,
    columns jsonb default '[]'::jsonb,
    updated_at timestamptz default now()
);

-- TBL: card_slots_config
create table if not exists public.card_slots_config (
    id uuid default uuid_generate_v4() primary key,
    role text not null,
    slot_index integer not null,
    variable_id uuid references public.clinical_variables(id) on delete set null,
    icon text,
    color text,
    is_active boolean default true,
    created_at timestamptz default now(),
    unique(role, slot_index)
);

-- RLS
alter table public.clinical_variables enable row level security;
alter table public.variable_logic enable row level security;
alter table public.variable_ranges enable row level security;
alter table public.dashboard_layout enable row level security;
alter table public.card_slots_config enable row level security;

-- Drop existing policies if they exist to avoid errors on re-run
drop policy if exists "Variables viewable by all authenticated" on public.clinical_variables;
drop policy if exists "Logic viewable by all authenticated" on public.variable_logic;
drop policy if exists "Ranges viewable by all authenticated" on public.variable_ranges;
drop policy if exists "Layout viewable by all authenticated" on public.dashboard_layout;
drop policy if exists "Slots viewable by all authenticated" on public.card_slots_config;

drop policy if exists "Admins can manage variables" on public.clinical_variables;
drop policy if exists "Admins can manage logic" on public.variable_logic;
drop policy if exists "Admins can manage ranges" on public.variable_ranges;
drop policy if exists "Admins can manage layout" on public.dashboard_layout;
drop policy if exists "Admins can manage slots" on public.card_slots_config;

-- Create policies
create policy "Variables viewable by all authenticated" on public.clinical_variables for select using (auth.role() = 'authenticated');
create policy "Logic viewable by all authenticated" on public.variable_logic for select using (auth.role() = 'authenticated');
create policy "Ranges viewable by all authenticated" on public.variable_ranges for select using (auth.role() = 'authenticated');
create policy "Layout viewable by all authenticated" on public.dashboard_layout for select using (auth.role() = 'authenticated');
create policy "Slots viewable by all authenticated" on public.card_slots_config for select using (auth.role() = 'authenticated');

create policy "Admins can manage variables" on public.clinical_variables for all using (exists (select 1 from public.profiles where user_id = auth.uid() and role in ('staff', 'administrador')));
create policy "Admins can manage logic" on public.variable_logic for all using (exists (select 1 from public.profiles where user_id = auth.uid() and role in ('staff', 'administrador')));
create policy "Admins can manage ranges" on public.variable_ranges for all using (exists (select 1 from public.profiles where user_id = auth.uid() and role in ('staff', 'administrador')));
create policy "Admins can manage layout" on public.dashboard_layout for all using (exists (select 1 from public.profiles where user_id = auth.uid() and role in ('staff', 'administrador')));
create policy "Admins can manage slots" on public.card_slots_config for all using (exists (select 1 from public.profiles where user_id = auth.uid() and role in ('staff', 'administrador')));

-- Insert basic layout for paciente if not exists
insert into public.dashboard_layout (role, columns)
values ('paciente', '[
    {"header": "#", "fixed_variable": "index"},
    {"header": "Fecha", "fixed_variable": "date"},
    {"header": "Peso (kg)", "fixed_variable": "weight"},
    {"header": "IMC", "fixed_variable": "bmi"},
    {"header": "Grasa %", "fixed_variable": "body_fat"},
    {"header": "Cintura (cm)", "fixed_variable": "waist"}
]'::jsonb)
on conflict (role) do nothing;

-- Insert basic layout for nutricionista if not exists
insert into public.dashboard_layout (role, columns)
values ('nutricionista', '[
    {"header": "Fecha", "fixed_variable": "date"},
    {"header": "Peso", "fixed_variable": "weight"},
    {"header": "IMC", "fixed_variable": "bmi"},
    {"header": "Grasa %", "fixed_variable": "body_fat"},
    {"header": "Cintura", "fixed_variable": "waist"}
]'::jsonb)
on conflict (role) do nothing;

-- SEED: clinical_variables (Core)
insert into public.clinical_variables (id, name, code, data_type, is_manual, is_calculated, has_formula, has_ranges, unit)
values 
    ('00000000-0000-0000-0000-000000000001', 'Peso Actual', 'PESO', 'number', true, false, false, false, 'kg'),
    ('00000000-0000-0000-0000-000000000002', 'Talla', 'TALLA', 'number', true, false, false, false, 'cm'),
    ('00000000-0000-0000-0000-000000000003', 'IMC', 'IMC', 'number', false, true, true, true, 'kg/m2'),
    ('00000000-0000-0000-0000-000000000004', 'Grasa (%)', 'GRASA', 'number', true, false, false, true, '%'),
    ('00000000-0000-0000-0000-000000000005', 'Cintura', 'CINTURA', 'number', true, false, false, false, 'cm')
on conflict (code) do nothing;

-- SEED: IMC Logic Branch
insert into public.variable_logic (id, variable_id, condition_name, type, tokens)
values 
    ('00000000-0000-0000-0000-00000000000a', '00000000-0000-0000-0000-000000000003', 'General', 'default', '[
        {"id": "t1", "type": "input", "value": "PESO", "display": "Peso (kg)"},
        {"id": "t2", "type": "operator", "value": "/", "display": "/"},
        {"id": "t3", "type": "operator", "value": "(", "display": "("},
        {"id": "t4", "type": "input", "value": "TALLA", "display": "Talla (m)"},
        {"id": "t5", "type": "operator", "value": "*", "display": "*"},
        {"id": "t6", "type": "input", "value": "TALLA", "display": "Talla (m)"},
        {"id": "t7", "type": "operator", "value": ")", "display": ")"}
    ]'::jsonb)
on conflict (id) do nothing;

-- SEED: IMC Ranges
insert into public.variable_ranges (logic_id, label, min, max, color)
values 
    ('00000000-0000-0000-0000-00000000000a', 'Bajo Peso', 0, 18.5, 'bg-blue-500'),
    ('00000000-0000-0000-0000-00000000000a', 'Normal', 18.5, 25, 'bg-green-500'),
    ('00000000-0000-0000-0000-00000000000a', 'Sobrepeso', 25, 30, 'bg-yellow-500'),
    ('00000000-0000-0000-0000-00000000000a', 'Obesidad', 30, 100, 'bg-red-500')
on conflict do nothing;

-- SEED: Default Card Slots for Paciente
insert into public.card_slots_config (role, slot_index, variable_id, icon, color)
values 
    ('paciente', 0, '00000000-0000-0000-0000-000000000001', 'Scale', 'text-nutrition-600'),
    ('paciente', 1, '00000000-0000-0000-0000-000000000003', 'Activity', 'text-orange-500'),
    ('paciente', 2, '00000000-0000-0000-0000-000000000005', 'Ruler', 'text-indigo-500'),
    ('paciente', 3, null, 'Milestone', 'text-sky-500') -- Loyalty card slot
on conflict (role, slot_index) do update 
set variable_id = excluded.variable_id, icon = excluded.icon, color = excluded.color;
