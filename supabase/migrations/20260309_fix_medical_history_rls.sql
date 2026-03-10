-- Fix RLS for patient_medical_histories to allow staff/nutritionists to manage files
drop policy if exists "Admins and nutritionists can insert medical histories" on public.patient_medical_histories;
drop policy if exists "Admins and nutritionists can update medical histories" on public.patient_medical_histories;

create policy "Admins and nutritionists can insert medical histories"
    on public.patient_medical_histories for insert
    with check (exists (
        select 1 from public.profiles where user_id = auth.uid() and role in ('staff', 'administrador', 'nutricionista')
    ));

create policy "Admins and nutritionists can update medical histories"
    on public.patient_medical_histories for update
    using (exists (
        select 1 from public.profiles where user_id = auth.uid() and role in ('staff', 'administrador', 'nutricionista')
    ));
