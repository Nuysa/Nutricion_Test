-- ─── SUBSCRIPTION OFFERS SEEDING ───
-- First, let's clear existing offers if any (careful if already in use)
-- truncate public.subscription_offers cascade;

insert into public.subscription_offers (name, description, price, duration_days, features)
values 
('Plan Básico', 'Funciones esenciales para comenzar tu cambio.', 0, 365, '["Contador de calorias diario", "Registro de peso", "Acceso limitado al Blog", "Soporte por correo"]'),
('Premium Nutrition Plan', 'Nuestro plan más popular para resultados profesionales.', 29.99, 30, '["Plan de comidas personalizado", "Citas virtuales ilimitadas", "Seguimiento de macros avanzado", "Soporte por chat 24/7", "Acceso a recetas exclusivas"]'),
('Elite Performance', 'Máximo rendimiento y atención ultra-personalizada.', 49.99, 30, '["Todo lo de Premium", "Análisis de laboratorio trimestral", "Personal trainer asignado", "Suplementos personalizados", "Prioridad en citas"]');

-- ─── INVOICES / BILLING HISTORY ───
create table if not exists public.invoices (
  id uuid default uuid_generate_v4() primary key,
  patient_id uuid references public.patients(id) on delete cascade not null,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  amount numeric not null,
  currency text default 'USD' not null,
  status text not null default 'paid' check (status in ('paid', 'pending', 'failed', 'refunded')),
  plan_name text not null,
  payment_method text,
  paid_at timestamptz default now() not null,
  created_at timestamptz default now() not null
);

-- Enable RLS
alter table public.invoices enable row level security;

-- Policies for Invoices
create policy "Users can view their own invoices" on public.invoices
  for select using (
    patient_id in (
      select id from public.patients where profile_id in (
        select id from public.profiles where user_id = auth.uid()
      )
    )
  );

create policy "Staff can manage all invoices" on public.invoices
  for all using (
    exists (select 1 from public.profiles where user_id = auth.uid() and role in ('staff', 'admin'))
  );
