-- Table to store flexible nutritional plans
CREATE TABLE IF NOT EXISTS public.flexible_plans (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    week_number integer DEFAULT 1 NOT NULL,
    data jsonb DEFAULT '{}'::jsonb NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(patient_id, week_number)
);

-- RLS
ALTER TABLE public.flexible_plans ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Flexible plans viewable by owner, nutritionist, staff, admin" ON public.flexible_plans;
CREATE POLICY "Flexible plans viewable by owner, nutritionist, staff, admin" ON public.flexible_plans
FOR SELECT TO authenticated
USING (
    patient_id IN (SELECT id FROM public.patients WHERE profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
    OR patient_id IN (SELECT id FROM public.patients WHERE nutritionist_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
    OR EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('staff', 'administrador'))
);

DROP POLICY IF EXISTS "Nutritionists and staff can manage flexible plans" ON public.flexible_plans;
CREATE POLICY "Nutritionists and staff can manage flexible plans" ON public.flexible_plans
FOR ALL TO authenticated
USING (
    patient_id IN (SELECT id FROM public.patients WHERE nutritionist_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
    OR EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('staff', 'administrador'))
)
WITH CHECK (
    patient_id IN (SELECT id FROM public.patients WHERE nutritionist_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
    OR EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('staff', 'administrador'))
);
