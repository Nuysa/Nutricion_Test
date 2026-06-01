-- Alter TBL: card_slots_config to support custom diagnosis variables per card
alter table public.card_slots_config add column if not exists diagnostico_variable_id uuid references public.clinical_variables(id) on delete set null;
