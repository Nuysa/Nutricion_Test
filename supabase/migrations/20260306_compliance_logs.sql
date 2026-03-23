-- Table to store patient daily compliance/logs for flexible plans
CREATE TABLE IF NOT EXISTS public.flexible_plan_compliance (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    date date NOT NULL,
    meal_id text NOT NULL,
    food_group text NOT NULL,
    ingredients text[] DEFAULT '{}'::text[] NOT NULL,
    created_at timestamptz DEFAULT now() NOT NULL,
    UNIQUE(patient_id, date, meal_id, food_group)
);

-- RLS
ALTER TABLE public.flexible_plan_compliance ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Patients can manage their own compliance" ON public.flexible_plan_compliance
FOR ALL TO authenticated
USING (patient_id IN (SELECT id FROM public.patients WHERE profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())))
WITH CHECK (patient_id IN (SELECT id FROM public.patients WHERE profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())));

CREATE POLICY "Nutritionists and staff can view patient compliance" ON public.flexible_plan_compliance
FOR SELECT TO authenticated
USING (
    patient_id IN (SELECT id FROM public.patients WHERE nutritionist_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid()))
    OR EXISTS (SELECT 1 FROM public.profiles WHERE user_id = auth.uid() AND role IN ('staff', 'administrador'))
);
