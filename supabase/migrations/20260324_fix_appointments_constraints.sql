-- Fix appointments modality check constraint to include 'presencial' and Spanish values
DO $$
BEGIN
    ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_modality_check;
    ALTER TABLE public.appointments ADD CONSTRAINT appointments_modality_check 
        CHECK (modality IN ('virtual', 'in-person', 'presencial', 'Virtual', 'Presencial'));
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

-- Also fix appointment_type check if it exists (for compatibility with schema.sql)
DO $$
BEGIN
    ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_appointment_type_check;
    ALTER TABLE public.appointments ADD CONSTRAINT appointments_appointment_type_check 
        CHECK (appointment_type IN ('virtual', 'in-person', 'presencial', 'Virtual', 'Presencial'));
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;
