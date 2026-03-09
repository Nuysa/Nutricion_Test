-- Create medical histories table
create table if not exists public.patient_medical_histories (
    id uuid default uuid_generate_v4() primary key,
    patient_id uuid references public.patients(id) on delete cascade not null unique,
    full_name text,
    dni text,
    email text,
    age integer,
    birth_date date,
    instagram text,
    education_level text,
    region text,
    district text,
    occupation text,
    job_details text,
    nutritional_goal text,
    previous_nutrition_service boolean,
    previous_experience_rating text,
    time_following_plan text,
    weight_kg numeric,
    height_cm numeric,
    waist_cm numeric,
    health_conditions text[],
    family_history text[],
    takes_medication boolean,
    medication_details text,
    medication_frequency text,
    recent_lab_tests boolean,
    activity_level text,
    work_schedule text,
    does_exercise boolean,
    exercise_duration text,
    exercise_types text[],
    exercise_days text[],
    exercise_time text,
    has_calorie_tracker boolean,
    calorie_expenditure_details text,
    appetite_level text,
    appetite_peak_time text[],
    thirst_level text,
    water_intake text,
    sleep_quality text,
    sleep_hours text,
    bowel_movements text,
    bowel_frequency text,
    urine_status text,
    urine_color_index integer,
    available_instruments text[],
    specific_diet_type text,
    cooks_for_self text,
    likes_cooking boolean,
    cooking_preparations text,
    food_allergies text,
    food_intolerances text,
    intolerance_details text,
    dairy_consumption text,
    dairy_brands text,
    supplements_consumption boolean,
    supplement_types text[],
    disliked_cereals text,
    disliked_tubers text,
    disliked_legumes text,
    disliked_vegetables text,
    disliked_fruits text,
    disliked_meats text,
    disliked_fats text,
    disliked_preparations text,
    previous_unhealthy_habits text[],
    wake_up_time text,
    sleep_time text,
    breakfast_time text,
    breakfast_details text,
    lunch_time text,
    lunch_details text,
    dinner_time text,
    dinner_details text,
    snack_details text,
    prep_preference text, -- easy/hard
    taste_preference text, -- sweet/salty
    photo_front_url text,
    photo_side1_url text,
    photo_side2_url text,
    photo_back_url text,
    dairy_product_photo_url text,
    dairy_info_photo_url text,
    supplement_product_photo_url text,
    supplement_info_photo_url text,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null
);

-- Enable RLS
alter table public.patient_medical_histories enable row level security;

-- Policies
create policy "Users can view their own medical history"
    on public.patient_medical_histories for select
    using (patient_id in (
        select id from public.patients where profile_id in (
            select id from public.profiles where user_id = auth.uid()
        )
    ));

create policy "Users can insert their own medical history"
    on public.patient_medical_histories for insert
    with check (patient_id in (
        select id from public.patients where profile_id in (
            select id from public.profiles where user_id = auth.uid()
        )
    ));

create policy "Users can update their own medical history"
    on public.patient_medical_histories for update
    using (patient_id in (
        select id from public.patients where profile_id in (
            select id from public.profiles where user_id = auth.uid()
        )
    ));

create policy "Admins and nutritionists can view all medical histories"
    on public.patient_medical_histories for select
    using (exists (
        select 1 from public.profiles where user_id = auth.uid() and role in ('staff', 'administrador', 'nutricionista')
    ));
