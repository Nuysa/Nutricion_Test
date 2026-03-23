-- 1. Agregar columnas para precios y descripciones separadas por modalidad
ALTER TABLE public.landing_plans ADD COLUMN IF NOT EXISTS presential_price NUMERIC;
ALTER TABLE public.landing_plans ADD COLUMN IF NOT EXISTS virtual_description TEXT;
ALTER TABLE public.landing_plans ADD COLUMN IF NOT EXISTS presential_description TEXT;

-- 2. Inicializar los precios presenciales con el valor actual de 'price' si están nulos
UPDATE public.landing_plans 
SET presential_price = price 
WHERE presential_price IS NULL;

-- 3. Renombrar conceptualmente 'price' a 'virtual_price' aunque mantengamos el nombre físico de la columna
-- (Opcional: podríamos renombrarlo, pero para evitar romper otras partes del código si existieran, lo mantendremos como 'price' manejado como virtual_price)
