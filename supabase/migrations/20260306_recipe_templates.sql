-- Migration to create recipe templates table
CREATE TABLE IF NOT EXISTS public.recipe_templates (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    meal_types TEXT[] NOT NULL, -- ['breakfast', 'lunch', etc]
    slots JSONB NOT NULL, -- Array of { type: string, ratio: number, macro: 'P'|'C'|'F' }
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Enable RLS
ALTER TABLE public.recipe_templates ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Allow authenticated full access to recipe_templates" 
ON public.recipe_templates FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);
