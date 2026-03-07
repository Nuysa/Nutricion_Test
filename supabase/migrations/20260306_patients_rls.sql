-- Ensure staff and administrators can update patient records including plan_type
-- This policy covers the upsert/insert/update operations

ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Policy for staff and administrators to MANAGE all patient records
DROP POLICY IF EXISTS "Staff and admins can manage patients" ON public.patients;
CREATE POLICY "Staff and admins can manage patients" ON public.patients
FOR ALL 
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('staff', 'administrador')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
    AND profiles.role IN ('staff', 'administrador')
  )
);

-- Policy for patients to READ their own record
DROP POLICY IF EXISTS "Patients can read their own record" ON public.patients;
CREATE POLICY "Patients can read their own record" ON public.patients
FOR SELECT
TO authenticated
USING (
  profile_id IN (
    SELECT id FROM public.profiles WHERE user_id = auth.uid()
  )
);
