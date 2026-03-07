
-- 1. Asegurar que existe la columna is_system
ALTER TABLE public.clinical_variables ADD COLUMN IF NOT EXISTS is_system BOOLEAN DEFAULT false;

-- 2. Insertar las variables de sistema para satisfacer la restricción FK
-- Usamos prefijos FFFFFFFF para que no colisionen con UUIDs reales generados aleatoriamente
INSERT INTO public.clinical_variables (id, name, code, data_type, is_manual, is_calculated, is_system, unit, orden)
VALUES 
    ('ffffffff-ffff-ffff-ffff-00000000000a', 'Edad (Sistema)', 'EDAD', 'number', false, false, true, 'años', 100),
    ('ffffffff-ffff-ffff-ffff-00000000000b', 'Género (Sistema)', 'GENERO', 'text', false, false, true, '', 101),
    ('ffffffff-ffff-ffff-ffff-00000000000c', 'Peso Base (Sistema)', 'PESO_BASE', 'number', false, false, true, 'kg', 102),
    ('ffffffff-ffff-ffff-ffff-00000000000d', 'Talla (Sistema)', 'TALLA_V', 'number', false, false, true, 'cm', 103),
    ('ffffffff-ffff-ffff-ffff-00000000000e', 'Nacimiento (Sistema)', 'NACIMIENTO', 'date', false, false, true, '', 104)
ON CONFLICT (id) DO UPDATE SET 
    is_system = true, 
    name = EXCLUDED.name, 
    code = EXCLUDED.code;

-- 3. Actualizar la política de RLS para asegurar que todos puedan verlas
DROP POLICY IF EXISTS "Variables viewable by all authenticated" ON public.clinical_variables;
CREATE POLICY "Variables viewable by all authenticated" ON public.clinical_variables FOR SELECT USING (true);
