-- Migration: Add show_weight column to patients table
ALTER TABLE public.patients ADD COLUMN IF NOT EXISTS show_weight boolean DEFAULT true;
