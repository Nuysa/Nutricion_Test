-- Add appointment_id column to clinical data tables
ALTER TABLE public.weight_records ADD COLUMN IF NOT EXISTS appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL;
ALTER TABLE public.flexible_plans ADD COLUMN IF NOT EXISTS appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL;
ALTER TABLE public.meals ADD COLUMN IF NOT EXISTS appointment_id uuid REFERENCES public.appointments(id) ON DELETE SET NULL;

-- Fix appointments status check constraint to match codebase (if it exists)
DO $$
BEGIN
    ALTER TABLE public.appointments DROP CONSTRAINT IF EXISTS appointments_status_check;
    ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check 
        CHECK (status IN ('scheduled', 'completed', 'cancelled', 'no-show', 'programada', 'completada', 'cancelada', 'no_confirmado'));
EXCEPTION
    WHEN OTHERS THEN
        NULL;
END $$;

