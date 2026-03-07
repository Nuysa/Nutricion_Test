-- ══════════════════════════════════════════════════════
-- Nutrición IA – Full Database Schema
-- Run this in your Supabase SQL Editor
-- ══════════════════════════════════════════════════════

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- ─── PROFILES ───
create table public.profiles (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  role text not null default 'paciente' check (role in ('paciente', 'nutricionista', 'staff', 'administrador')),
  full_name text not null,
  avatar_url text,
  phone text,
  email text,
  status text not null default 'Pendiente',
  created_at timestamptz default now() not null
);

-- ─── PATIENTS ───
create table public.patients (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null unique,
  height_cm numeric,
  current_weight numeric,
  goal_weight numeric,
  date_of_birth date,
  gender text default 'otro',
  nutritionist_id uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null
);

-- ─── PATIENT NUTRITIONISTS (Multiple Assignments) ───
create table public.patient_nutritionists (
  patient_profile_id uuid references public.profiles(id) on delete cascade not null,
  nutritionist_profile_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  primary key (patient_profile_id, nutritionist_profile_id)
);

-- ─── WEIGHT RECORDS ───
create table public.weight_records (
  id uuid default uuid_generate_v4() primary key,
  patient_id uuid references public.patients(id) on delete cascade not null,
  weight numeric not null,
  height numeric,
  body_fat_percentage numeric,
  waist_circumference_cm numeric,
  clinical_findings text,
  nutritional_recommendations text,
  date date default CURRENT_DATE not null,
  created_at timestamptz default now() not null
);

-- ─── MEALS ───
create table public.meals (
  id uuid default uuid_generate_v4() primary key,
  patient_id uuid references public.patients(id) on delete set null,
  meal_type text not null check (meal_type in ('breakfast', 'lunch', 'dinner', 'snack')),
  name text not null,
  description text,
  calories numeric not null default 0,
  carbs_g numeric not null default 0,
  protein_g numeric not null default 0,
  fats_g numeric not null default 0,
  image_url text,
  date date default current_date not null
);

-- ─── APPOINTMENTS ───
create table public.appointments (
  id uuid default uuid_generate_v4() primary key,
  patient_id uuid references public.patients(id) on delete cascade not null,
  nutritionist_id uuid references public.profiles(id) on delete cascade not null,
  appointment_type text not null check (appointment_type in ('virtual', 'in-person')),
  date date not null,
  start_time time not null,
  end_time time not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'completed', 'cancelled', 'no-show')),
  notes text,
  created_at timestamptz default now() not null
);

-- ─── SUBSCRIPTION OFFERS ───
create table public.subscription_offers (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  price numeric not null,
  duration_days integer not null,
  features jsonb default '[]'::jsonb,
  is_active boolean default true,
  offer_price numeric,
  offer_reason text,
  benefit_highlight text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz default now() not null
);

-- ─── SUBSCRIPTIONS ───
create table public.subscriptions (
  id uuid default uuid_generate_v4() primary key,
  patient_id uuid references public.patients(id) on delete cascade not null,
  offer_id uuid references public.subscription_offers(id) on delete set null,
  start_date date not null,
  end_date date not null,
  status text not null default 'pending' check (status in ('active', 'expired', 'cancelled', 'pending')),
  payment_status text not null default 'pending' check (payment_status in ('paid', 'pending', 'failed', 'refunded')),
  created_at timestamptz default now() not null
);

-- ─── EXERCISES ───
create table public.exercises (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  description text,
  calories_burned numeric not null default 0,
  duration_min integer not null default 0,
  difficulty text not null default 'beginner' check (difficulty in ('beginner', 'intermediate', 'hard')),
  image_url text
);

-- ─── ACTIVITY LOG ───
create table public.activity_log (
  id uuid default uuid_generate_v4() primary key,
  profile_id uuid references public.profiles(id) on delete cascade not null,
  action text not null,
  description text not null,
  created_at timestamptz default now() not null
);

-- ═══════════════════════════════
-- Row Level Security Policies
-- ═══════════════════════════════

alter table public.profiles enable row level security;
alter table public.patients enable row level security;
alter table public.patient_nutritionists enable row level security;
alter table public.weight_records enable row level security;
alter table public.meals enable row level security;
alter table public.appointments enable row level security;
alter table public.subscription_offers enable row level security;
alter table public.subscriptions enable row level security;
alter table public.exercises enable row level security;
alter table public.activity_log enable row level security;

-- Profiles: users can read all profiles, update own
create policy "Public profiles are viewable by all authenticated" on public.profiles
  for select using (auth.role() = 'authenticated');

create policy "Users can update own profile" on public.profiles
  for update using (auth.uid() = user_id);

create policy "Users can insert own profile" on public.profiles
  for insert with check (auth.uid() = user_id);

create policy "Admins can update all profiles" on public.profiles
  for update using (
    exists (select 1 from public.profiles where user_id = auth.uid() and role in ('staff', 'administrador'))
  );

create policy "Admins can delete profiles" on public.profiles
  for delete using (
    exists (select 1 from public.profiles where user_id = auth.uid() and role in ('staff', 'administrador'))
  );

-- Patients: viewable by assigned nutritionist and own
create policy "Patients viewable by self or nutritionist" on public.patients
  for select using (
    profile_id in (select id from public.profiles where user_id = auth.uid())
    or nutritionist_id in (select id from public.profiles where user_id = auth.uid())
    or exists (select 1 from public.profiles where user_id = auth.uid() and role in ('staff', 'administrador'))
  );

create policy "Patients can insert own record" on public.patients
  for insert with check (
    profile_id in (select id from public.profiles where user_id = auth.uid())
  );

create policy "Patients can update own record" on public.patients
  for update using (
    profile_id in (select id from public.profiles where user_id = auth.uid())
    or exists (select 1 from public.profiles where user_id = auth.uid() and role in ('staff', 'administrador', 'nutricionista'))
  );

-- Patient_nutritionists (Multiple assignments)
create policy "Patient_nutritionists viewable by all" on public.patient_nutritionists
  for select using (auth.role() = 'authenticated');

create policy "Staff can manage patient_nutritionists" on public.patient_nutritionists
  for all using (
    exists (select 1 from public.profiles where user_id = auth.uid() and role in ('staff', 'administrador'))
  );

-- Subscription offers: readable by all, writable by staff/admin
create policy "Subscription offers viewable by all" on public.subscription_offers
  for select using (auth.role() = 'authenticated');

create policy "Staff can manage subscription offers" on public.subscription_offers
  for all using (
    exists (select 1 from public.profiles where user_id = auth.uid() and role in ('staff', 'administrador'))
  );

-- Exercises: readable by all
create policy "Exercises viewable by all" on public.exercises
  for select using (auth.role() = 'authenticated');

create policy "Staff can manage exercises" on public.exercises
  for all using (
    exists (select 1 from public.profiles where user_id = auth.uid() and role in ('staff', 'administrador'))
  );

-- Weight records: owner and nutritionist
create policy "Weight records by owner" on public.weight_records
  for all using (
    patient_id in (
      select id from public.patients where profile_id in (
        select id from public.profiles where user_id = auth.uid()
      )
    )
    or exists (select 1 from public.profiles where user_id = auth.uid() and role in ('nutricionista', 'staff', 'administrador'))
  );

-- Meals: owner and nutritionist
create policy "Meals by owner" on public.meals
  for all using (
    patient_id in (
      select id from public.patients where profile_id in (
        select id from public.profiles where user_id = auth.uid()
      )
    )
    or exists (select 1 from public.profiles where user_id = auth.uid() and role in ('nutricionista', 'staff', 'administrador'))
  );

-- Appointments: involved parties
create policy "Appointments by involved parties" on public.appointments
  for all using (
    patient_id in (
      select id from public.patients where profile_id in (
        select id from public.profiles where user_id = auth.uid()
      )
    )
    or nutritionist_id in (select id from public.profiles where user_id = auth.uid())
    or exists (select 1 from public.profiles where user_id = auth.uid() and role in ('staff', 'administrador'))
  );

-- Subscriptions
create policy "Subscriptions by owner or staff" on public.subscriptions
  for all using (
    patient_id in (
      select id from public.patients where profile_id in (
        select id from public.profiles where user_id = auth.uid()
      )
    )
    or exists (select 1 from public.profiles where user_id = auth.uid() and role in ('staff', 'administrador'))
  );

-- Activity log: own entries
create policy "Activity log by owner" on public.activity_log
  for all using (
    profile_id in (select id from public.profiles where user_id = auth.uid())
    or exists (select 1 from public.profiles where user_id = auth.uid() and role in ('staff', 'administrador'))
  );

-- ═══════════════════════════════
-- Function: Auto-create profile on signup
-- ═══════════════════════════════
create or replace function public.handle_new_user()
returns trigger as $$
declare
  new_profile_id uuid;
  new_patient_id uuid;
  basic_offer_id uuid;
begin
  insert into public.profiles (user_id, full_name, email, role, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    new.email,
    coalesce(new.raw_user_meta_data->>'role', 'paciente'),
    case 
      when coalesce(new.raw_user_meta_data->>'role', 'paciente') = 'nutricionista' then 'Pendiente'
      else 'Activo'
    end
  ) returning id into new_profile_id;
  
  -- If role is paciente, also create patient record and basic subscription
  if coalesce(new.raw_user_meta_data->>'role', 'paciente') = 'paciente' then
    insert into public.patients (profile_id)
    values (new_profile_id)
    returning id into new_patient_id;
    
    -- Assign default Basic Plan (Price 0)
    select id into basic_offer_id from public.subscription_offers where price = 0 limit 1;
    if basic_offer_id is not null then
      insert into public.subscriptions (patient_id, offer_id, start_date, end_date, status, payment_status)
      values (new_patient_id, basic_offer_id, current_date, current_date + interval '1 year', 'active', 'paid');
    end if;
  end if;
  
  return new;
end;
$$ language plpgsql security definer;

-- Trigger on auth.users insert
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ═══════════════════════════════
-- Function: Securely delete user from auth AND profile
-- ═══════════════════════════════
create or replace function public.delete_user_by_admin(target_profile_id uuid)
returns void as $$
declare
  target_user_id uuid;
begin
  -- Control de seguridad: Verificar que el que llama sea administrador o staff en la tabla de perfiles
  if not exists (
    select 1 from public.profiles 
    where user_id = auth.uid() 
    and role in ('staff', 'administrador')
  ) then
    raise exception 'No tienes permisos para realizar esta acción.';
  end if;

  -- Obtener el user_id vinculado al perfil
  select user_id into target_user_id from public.profiles where id = target_profile_id;

  -- Eliminar de la tabla de autenticación (esto borrará en cascada perfiles y demás tablas)
  if target_user_id is not null then
    delete from auth.users where id = target_user_id;
  end if;
end;
$$ language plpgsql security definer;

-- ─── SEED DATA ───
INSERT INTO public.subscription_offers (name, description, price, duration_days, features)
VALUES 
  ('Básico', 'Plan ideal para comenzar. Incluye seguimiento básico.', 0, 365, '["Seguimiento de peso", "Acceso a recetas básicas"]'),
  ('Premium', 'Acceso total a especialistas y planes personalizados.', 49.99, 30, '["Chat 24/7", "Planes de comida personalizados", "Consultas ilimitadas"]'),
  ('Especializado', 'Plan enfocado en patologías específicas.', 79.99, 30, '["Control médico", "Suplementación", "Análisis de laboratorio"]');
