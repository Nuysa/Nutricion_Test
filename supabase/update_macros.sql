-- Add macros to existing meals and ensure consistency
-- We target the same patient as seed_data.sql

UPDATE public.meals
SET 
  carbs_g = CASE 
    WHEN name = 'Huevos Revueltos con Espinaca' THEN 5
    WHEN name = 'Smoothie de espinaca' THEN 25
    WHEN name = 'Avena con banano' THEN 45
    WHEN name = 'Pancakes de avena' THEN 40
    WHEN name = 'Ensalada de Pollo Grillado' THEN 10
    WHEN name = 'Salmón con brócoli' THEN 8
    WHEN name = 'Tacos de pavo' THEN 30
    WHEN name = 'Pasta integral con atún' THEN 55
    WHEN name = 'Yogur Griego' THEN 12
    WHEN name = 'Fruta picada' THEN 30
    WHEN name = 'Nueces mixtas' THEN 5
    WHEN name = 'Puñado de Almendras' THEN 6
    WHEN name = 'Barrita de cereal' THEN 22
    WHEN name = 'Manzana con mantequilla de maní' THEN 25
    WHEN name = 'Pescado con Batata' THEN 35
    WHEN name = 'Sopa de verduras' THEN 15
    WHEN name = 'Bowl de garbanzos' THEN 40
    WHEN name = 'Omelette de claras' THEN 3
    ELSE carbs_g
  END,
  protein_g = CASE 
    WHEN name = 'Huevos Revueltos con Espinaca' THEN 18
    WHEN name = 'Smoothie de espinaca' THEN 8
    WHEN name = 'Avena con banano' THEN 12
    WHEN name = 'Pancakes de avena' THEN 15
    WHEN name = 'Ensalada de Pollo Grillado' THEN 35
    WHEN name = 'Salmón con brócoli' THEN 28
    WHEN name = 'Tacos de pavo' THEN 25
    WHEN name = 'Pasta integral con atún' THEN 30
    WHEN name = 'Yogur Griego' THEN 20
    WHEN name = 'Fruta picada' THEN 1
    WHEN name = 'Nueces mixtas' THEN 6
    WHEN name = 'Puñado de Almendras' THEN 6
    WHEN name = 'Barrita de cereal' THEN 4
    WHEN name = 'Manzana con mantequilla de maní' THEN 8
    WHEN name = 'Pescado con Batata' THEN 25
    WHEN name = 'Sopa de verduras' THEN 5
    WHEN name = 'Bowl de garbanzos' THEN 15
    WHEN name = 'Omelette de claras' THEN 20
    ELSE protein_g
  END,
  fats_g = CASE 
    WHEN name = 'Huevos Revueltos con Espinaca' THEN 14
    WHEN name = 'Smoothie de espinaca' THEN 5
    WHEN name = 'Avena con banano' THEN 7
    WHEN name = 'Pancakes de avena' THEN 8
    WHEN name = 'Ensalada de Pollo Grillado' THEN 12
    WHEN name = 'Salmón con brócoli' THEN 20
    WHEN name = 'Tacos de pavo' THEN 10
    WHEN name = 'Pasta integral con atún' THEN 8
    WHEN name = 'Yogur Griego' THEN 0
    WHEN name = 'Fruta picada' THEN 0
    WHEN name = 'Nueces mixtas' THEN 22
    WHEN name = 'Puñado de Almendras' THEN 14
    WHEN name = 'Barrita de cereal' THEN 6
    WHEN name = 'Manzana con mantequilla de maní' THEN 16
    WHEN name = 'Pescado con Batata' THEN 12
    WHEN name = 'Sopa de verduras' THEN 2
    WHEN name = 'Bowl de garbanzos' THEN 10
    WHEN name = 'Omelette de claras' THEN 5
    ELSE fats_g
  END
WHERE patient_id = (SELECT id FROM public.patients LIMIT 1)
AND date >= '2026-02-16' AND date <= '2026-02-22';
