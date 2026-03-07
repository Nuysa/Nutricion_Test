-- Fix RLS for meals table to allow nutritionists to save plans
-- The previous 'FOR ALL' policy might be failing for UPSERT operations 
-- due to lack of explicit WITH CHECK or visibility issues.

-- Drop existing potentially problematic policy
DROP POLICY IF EXISTS "Meals by owner" ON public.meals;

-- 1. SELECT: Users can see their own meals or those of their assigned patients
CREATE POLICY "Meals Select" ON public.meals
    FOR SELECT
    TO authenticated
    USING (
        patient_id IN (
            SELECT id FROM public.patients 
            WHERE profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
        )
        OR EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('nutricionista', 'staff', 'administrador')
        )
    );

-- 2. INSERT: Nutritionists or owners can insert
CREATE POLICY "Meals Insert" ON public.meals
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('nutricionista', 'staff', 'administrador')
        )
        OR 
        patient_id IN (
            SELECT id FROM public.patients 
            WHERE profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
        )
    );

-- 3. UPDATE: Nutritionists or owners can update
CREATE POLICY "Meals Update" ON public.meals
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('nutricionista', 'staff', 'administrador')
        )
        OR 
        patient_id IN (
            SELECT id FROM public.patients 
            WHERE profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('nutricionista', 'staff', 'administrador')
        )
        OR 
        patient_id IN (
            SELECT id FROM public.patients 
            WHERE profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
        )
    );

-- 4. DELETE: Nutritionists or owners can delete
CREATE POLICY "Meals Delete" ON public.meals
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE user_id = auth.uid() 
            AND role IN ('nutricionista', 'staff', 'administrador')
        )
        OR 
        patient_id IN (
            SELECT id FROM public.patients 
            WHERE profile_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
        )
    );
