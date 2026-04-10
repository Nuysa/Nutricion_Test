-- Migración para crear la tabla de Guía de Intercambio
CREATE TABLE IF NOT EXISTS public.exchange_guides (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title VARCHAR NOT NULL,
    cards JSONB NOT NULL DEFAULT '[]',
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS
ALTER TABLE public.exchange_guides ENABLE ROW LEVEL SECURITY;

-- Política de lectura para todos (pacientes y staff)
CREATE POLICY "Public read access for exchange_guides" 
ON public.exchange_guides FOR SELECT 
USING (true);

-- Política de acceso total para administradores (root)
CREATE POLICY "Admin full access for exchange_guides" 
ON public.exchange_guides FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'administrador'
    )
);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_exchange_guides_updated_at
    BEFORE UPDATE ON public.exchange_guides
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();
