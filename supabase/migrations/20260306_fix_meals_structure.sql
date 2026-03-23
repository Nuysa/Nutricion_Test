-- Migration to support Plan Editor features
-- Adds missing columns and constraints to the meals table

DO $$ 
BEGIN
    -- 1. Ensure meal_type check constraint includes new types
    ALTER TABLE public.meals DROP CONSTRAINT IF EXISTS meals_meal_type_check;
    ALTER TABLE public.meals ADD CONSTRAINT meals_meal_type_check 
        CHECK (meal_type IN ('breakfast', 'mid-morning', 'lunch', 'mid-afternoon', 'dinner', 'snack'));

    -- 2. Add kcal column if it doesn't exist (handle renaming or duplication for compatibility)
    IF NOT EXISTS (SELECT column_name FROM information_schema.columns WHERE table_name='meals' AND column_name='kcal') THEN
        ALTER TABLE public.meals ADD COLUMN kcal NUMERIC DEFAULT 0;
    END IF;

    -- 3. Add items column for decomposed food items
    IF NOT EXISTS (SELECT column_name FROM information_schema.columns WHERE table_name='meals' AND column_name='items') THEN
        ALTER TABLE public.meals ADD COLUMN items JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- 4. Sync calories to kcal if both exist and kcal is 0
    IF EXISTS (SELECT column_name FROM information_schema.columns WHERE table_name='meals' AND column_name='calories') THEN
        UPDATE public.meals SET kcal = calories WHERE kcal = 0 OR kcal IS NULL;
    END IF;

    -- 5. Add unique constraint for upsert support
    -- We first clean up potential duplicates to avoid failure
    -- (Keep only the latest entry for each patient/date/type)
    DELETE FROM public.meals a
    USING public.meals b
    WHERE a.id < b.id
      AND a.patient_id = b.patient_id
      AND a.date = b.date
      AND a.meal_type = b.meal_type;

    IF NOT EXISTS (
        SELECT 1 
        FROM pg_constraint 
        WHERE conname = 'meals_patient_date_type_unique'
    ) THEN
        ALTER TABLE public.meals ADD CONSTRAINT meals_patient_date_type_unique UNIQUE (patient_id, date, meal_type);
    END IF;

END $$;
