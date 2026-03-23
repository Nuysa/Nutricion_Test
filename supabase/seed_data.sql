-- 1. Update Meals Check Constraint
ALTER TABLE public.meals DROP CONSTRAINT IF EXISTS meals_meal_type_check;
ALTER TABLE public.meals ADD CONSTRAINT meals_meal_type_check 
  CHECK (meal_type IN ('breakfast', 'mid-morning', 'lunch', 'mid-afternoon', 'dinner', 'snack'));

ALTER TABLE public.weight_records ADD COLUMN IF NOT EXISTS bmi numeric;
ALTER TABLE public.weight_records ADD COLUMN IF NOT EXISTS body_fat_percentage numeric;
ALTER TABLE public.weight_records ADD COLUMN IF NOT EXISTS waist_cm numeric;

-- 1.6 Create Progress Photos Table
CREATE TABLE IF NOT EXISTS public.progress_photos (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    patient_id uuid REFERENCES public.patients(id) ON DELETE CASCADE NOT NULL,
    image_url TEXT,
    label TEXT,
    date DATE DEFAULT CURRENT_DATE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Clear previous seed data for the trial patient
-- We use subqueries to target the first patient and nutritionist
DELETE FROM public.appointments 
WHERE patient_id = (SELECT id FROM public.patients LIMIT 1) 
AND date >= '2026-02-16' AND date <= '2026-02-22';

DELETE FROM public.meals 
WHERE patient_id = (SELECT id FROM public.patients LIMIT 1) 
AND date >= '2026-02-16' AND date <= '2026-02-22';

UPDATE public.patients 
SET nutritionist_id = (SELECT id FROM public.profiles WHERE role = 'nutritionist' LIMIT 1),
    goal_weight = 72.0,
    height_cm = 175.0,
    current_weight = 78.0
WHERE id = (SELECT id FROM public.patients LIMIT 1);

-- 3. Insert Sample Appointments
INSERT INTO public.appointments (patient_id, nutritionist_id, appointment_type, date, start_time, end_time, status, notes)
SELECT 
    p.id, 
    (SELECT id FROM public.profiles WHERE role = 'nutritionist' LIMIT 1), 
    'virtual', '2026-02-19', '10:30:00', '11:00:00', 'scheduled', 'Consulta de seguimiento mensual'
FROM public.patients p LIMIT 1;

INSERT INTO public.appointments (patient_id, nutritionist_id, appointment_type, date, start_time, end_time, status, notes)
SELECT 
    p.id, 
    (SELECT id FROM public.profiles WHERE role = 'nutritionist' LIMIT 1), 
    'in-person', '2026-02-21', '09:00:00', '09:30:00', 'scheduled', 'Pesaje presencial'
FROM public.patients p LIMIT 1;

-- 4. Insert Sample Weekly Meal Plan (Feb 16 - Feb 22)
-- Using a helper to avoid duplication of subqueries in each insert
-- Monday
INSERT INTO public.meals (patient_id, meal_type, name, calories, date)
SELECT id, 'breakfast', 'Huevos Revueltos con Espinaca', 300, '2026-02-16' FROM public.patients LIMIT 1;
INSERT INTO public.meals (patient_id, meal_type, name, calories, date)
SELECT id, 'mid-morning', 'Yogur Griego', 150, '2026-02-16' FROM public.patients LIMIT 1;
INSERT INTO public.meals (patient_id, meal_type, name, calories, date)
SELECT id, 'lunch', 'Ensalada de Pollo Grillado', 450, '2026-02-16' FROM public.patients LIMIT 1;
INSERT INTO public.meals (patient_id, meal_type, name, calories, date)
SELECT id, 'mid-afternoon', 'Puñado de Almendras', 180, '2026-02-16' FROM public.patients LIMIT 1;
INSERT INTO public.meals (patient_id, meal_type, name, calories, date)
SELECT id, 'dinner', 'Pescado con Batata', 500, '2026-02-16' FROM public.patients LIMIT 1;

-- Tuesday
INSERT INTO public.meals (patient_id, meal_type, name, calories, date)
SELECT id, 'breakfast', 'Smoothie de espinaca', 250, '2026-02-17' FROM public.patients LIMIT 1;
INSERT INTO public.meals (patient_id, meal_type, name, calories, date)
SELECT id, 'mid-morning', 'Fruta picada', 100, '2026-02-17' FROM public.patients LIMIT 1;
INSERT INTO public.meals (patient_id, meal_type, name, calories, date)
SELECT id, 'lunch', 'Salmón con brócoli', 500, '2026-02-17' FROM public.patients LIMIT 1;
INSERT INTO public.meals (patient_id, meal_type, name, calories, date)
SELECT id, 'mid-afternoon', 'Barrita de cereal', 120, '2026-02-17' FROM public.patients LIMIT 1;
INSERT INTO public.meals (patient_id, meal_type, name, calories, date)
SELECT id, 'dinner', 'Sopa de verduras', 300, '2026-02-17' FROM public.patients LIMIT 1;

-- Wednesday
INSERT INTO public.meals (patient_id, meal_type, name, calories, date)
SELECT id, 'breakfast', 'Avena con banano', 350, '2026-02-18' FROM public.patients LIMIT 1;
INSERT INTO public.meals (patient_id, meal_type, name, calories, date)
SELECT id, 'lunch', 'Tacos de pavo', 400, '2026-02-18' FROM public.patients LIMIT 1;
INSERT INTO public.meals (patient_id, meal_type, name, calories, date)
SELECT id, 'dinner', 'Bowl de garbanzos', 450, '2026-02-18' FROM public.patients LIMIT 1;

-- Thursday
INSERT INTO public.meals (patient_id, meal_type, name, calories, date)
SELECT id, 'breakfast', 'Pancakes de avena', 350, '2026-02-19' FROM public.patients LIMIT 1;
INSERT INTO public.meals (patient_id, meal_type, name, calories, date)
SELECT id, 'mid-morning', 'Nueces mixtas', 180, '2026-02-19' FROM public.patients LIMIT 1;
INSERT INTO public.meals (patient_id, meal_type, name, calories, date)
SELECT id, 'lunch', 'Pasta integral con atún', 500, '2026-02-19' FROM public.patients LIMIT 1;
INSERT INTO public.meals (patient_id, meal_type, name, calories, date)
SELECT id, 'mid-afternoon', 'Manzana con mantequilla de maní', 200, '2026-02-19' FROM public.patients LIMIT 1;
INSERT INTO public.meals (patient_id, meal_type, name, calories, date)
SELECT id, 'dinner', 'Omelette de claras', 300, '2026-02-19' FROM public.patients LIMIT 1;

-- Friday
INSERT INTO public.meals (patient_id, meal_type, name, calories, date)
SELECT id, 'breakfast', 'Tostada con aguacate', 300, '2026-02-20' FROM public.patients LIMIT 1;
INSERT INTO public.meals (patient_id, meal_type, name, calories, date)
SELECT id, 'lunch', 'Pechuga a la plancha', 400, '2026-02-20' FROM public.patients LIMIT 1;
INSERT INTO public.meals (patient_id, meal_type, name, calories, date)
SELECT id, 'dinner', 'Ensalada César ligera', 350, '2026-02-20' FROM public.patients LIMIT 1;

-- Saturday
INSERT INTO public.meals (patient_id, meal_type, name, calories, date)
SELECT id, 'breakfast', 'Waffles de proteína', 400, '2026-02-21' FROM public.patients LIMIT 1;
INSERT INTO public.meals (patient_id, meal_type, name, calories, date)
SELECT id, 'lunch', 'Parrillada de vegetales', 350, '2026-02-21' FROM public.patients LIMIT 1;
INSERT INTO public.meals (patient_id, meal_type, name, calories, date)
SELECT id, 'dinner', 'Sushi bowl', 450, '2026-02-21' FROM public.patients LIMIT 1;

-- Sunday
INSERT INTO public.meals (patient_id, meal_type, name, calories, date)
SELECT id, 'breakfast', 'Shakshuka', 350, '2026-02-22' FROM public.patients LIMIT 1;
INSERT INTO public.meals (patient_id, meal_type, name, calories, date)
SELECT id, 'lunch', 'Roast beef con espárragos', 500, '2026-02-22' FROM public.patients LIMIT 1;
INSERT INTO public.meals (patient_id, meal_type, name, calories, date)
SELECT id, 'dinner', 'Caldo de pollo', 300, '2026-02-22' FROM public.patients LIMIT 1;

-- 5. Insert Sample Weight Records (Measurements History)
DELETE FROM public.weight_records WHERE patient_id = (SELECT id FROM public.patients LIMIT 1);

INSERT INTO public.weight_records (patient_id, weight, bmi, body_fat_percentage, waist_cm, recorded_at)
SELECT id, 78.0, 28.5, 22.0, 92.0, '2026-02-18 10:00:00' FROM public.patients LIMIT 1;
INSERT INTO public.weight_records (patient_id, weight, bmi, body_fat_percentage, waist_cm, recorded_at)
SELECT id, 79.2, 29.1, 23.0, 94.0, '2026-02-04 10:00:00' FROM public.patients LIMIT 1;
INSERT INTO public.weight_records (patient_id, weight, bmi, body_fat_percentage, waist_cm, recorded_at)
SELECT id, 80.5, 29.8, 24.0, 96.0, '2026-01-21 10:00:00' FROM public.patients LIMIT 1;
INSERT INTO public.weight_records (patient_id, weight, bmi, body_fat_percentage, waist_cm, recorded_at)
SELECT id, 82.0, 30.4, 25.0, 98.0, '2026-01-07 10:00:00' FROM public.patients LIMIT 1;

-- 6. Insert Sample Progress Photos
DELETE FROM public.progress_photos WHERE patient_id = (SELECT id FROM public.patients LIMIT 1);

INSERT INTO public.progress_photos (patient_id, label, date)
SELECT id, 'Inicio', '2026-01-01' FROM public.patients LIMIT 1;
INSERT INTO public.progress_photos (patient_id, label, date)
SELECT id, 'Seguimiento', '2026-01-15' FROM public.patients LIMIT 1;
INSERT INTO public.progress_photos (patient_id, label, date)
SELECT id, 'Progreso', '2026-02-01' FROM public.patients LIMIT 1;
INSERT INTO public.progress_photos (patient_id, label, date)
SELECT id, 'Resultados', '2026-02-15' FROM public.patients LIMIT 1;
INSERT INTO public.progress_photos (patient_id, label, date)
SELECT id, 'Meta Parcial', '2026-03-01' FROM public.patients LIMIT 1;
INSERT INTO public.progress_photos (patient_id, label, date)
SELECT id, 'Constancia', '2026-03-15' FROM public.patients LIMIT 1;
INSERT INTO public.progress_photos (patient_id, label, date)
SELECT id, 'Transformación', '2026-04-01' FROM public.patients LIMIT 1;
INSERT INTO public.progress_photos (patient_id, label, date)
SELECT id, 'Estado Actual', '2026-04-15' FROM public.patients LIMIT 1;
