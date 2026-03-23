-- Fix columns in patient_medical_histories to match the code names
alter table public.patient_medical_histories 
add column if not exists front_photo_url text,
add column if not exists side_photo_1_url text,
add column if not exists side_photo_2_url text,
add column if not exists back_photo_url text,
add column if not exists medication_names text[],
add column if not exists medication_schedule text,
add column if not exists lab_test_documents text[],
add column if not exists intolerance_types text[],
add column if not exists intolerance_details text,
add column if not exists dairy_consumption_types text[],
add column if not exists dairy_product_photos text[],
add column if not exists food_intolerances text;
