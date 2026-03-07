-- Migration to add plan_type to patients table
-- This allows administrators to tag patients with their subscription type (sin plan, plan flexible, plan menu semanal)

DO $$ 
BEGIN
    -- 1. Add plan_type column if it doesn't exist
    IF NOT EXISTS (SELECT column_name FROM information_schema.columns WHERE table_name='patients' AND column_name='plan_type') THEN
        ALTER TABLE public.patients ADD COLUMN plan_type TEXT DEFAULT 'sin plan';
    END IF;
END $$;
