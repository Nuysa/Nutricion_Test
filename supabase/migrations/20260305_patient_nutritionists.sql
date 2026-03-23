-- ─── PATIENT NUTRITIONISTS (Multiple Assignments) ───
CREATE TABLE IF NOT EXISTS public.patient_nutritionists (
  id uuid default uuid_generate_v4() primary key,
  patient_profile_id uuid references public.profiles(id) on delete cascade not null,
  nutritionist_profile_id uuid references public.profiles(id) on delete cascade not null,
  created_at timestamptz default now() not null,
  unique(patient_profile_id, nutritionist_profile_id)
);

ALTER TABLE public.patient_nutritionists ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patient_nutritionists viewable by all" ON public.patient_nutritionists
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Patient_nutritionists manageable by staff" ON public.patient_nutritionists
  FOR ALL USING (
    exists (select 1 from public.profiles where user_id = auth.uid() and role in ('staff', 'administrador'))
  );

-- Migrate existing 1:1 assignments
INSERT INTO public.patient_nutritionists (patient_profile_id, nutritionist_profile_id)
SELECT profile_id, nutritionist_id FROM public.patients WHERE nutritionist_id IS NOT NULL
ON CONFLICT DO NOTHING;
