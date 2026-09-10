-- Migration: Add allow_edit_history column to patients table
-- Controls whether the patient can edit their clinical history form
-- Default: false (nutritionist must explicitly enable it)
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS allow_edit_history boolean DEFAULT false;
