-- Creación de la tabla landing_plans para la gestión de Planes de Suscripción en el Landing
CREATE TABLE public.landing_plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    type VARCHAR NOT NULL CHECK (type IN ('flexible', 'menu')),
    interval VARCHAR NOT NULL CHECK (interval IN ('mensual', 'bimestral', 'trimestral')),
    price NUMERIC NOT NULL,
    is_recommended BOOLEAN DEFAULT false,
    virtual_features JSONB NOT NULL DEFAULT '[]',
    presential_features JSONB NOT NULL DEFAULT '[]',
    virtual_link VARCHAR,
    presential_link VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Creación de la tabla landing_content para la configuración del Landing Page como CMS
CREATE TABLE public.landing_content (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    section VARCHAR NOT NULL UNIQUE,
    content JSONB NOT NULL DEFAULT '{}',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index para la búsqueda rápida de la sección de CMS
CREATE INDEX idx_landing_content_section ON public.landing_content(section);

-- Configuración de Subscripciones (RLS)
ALTER TABLE public.landing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.landing_content ENABLE ROW LEVEL SECURITY;

-- Políticas de lectura públicas (cualquiera puede ver los planes y el contenido)
CREATE POLICY "Public read access for landing_plans" ON public.landing_plans FOR SELECT USING (true);
CREATE POLICY "Public read access for landing_content" ON public.landing_content FOR SELECT USING (true);

-- Llenamos los datos iniciales de planes (basados en el test web.html)
INSERT INTO public.landing_plans (type, interval, price, is_recommended, virtual_features, presential_features, virtual_link, presential_link) VALUES
('flexible', 'mensual', 149, false, 
 '["2 planes personalizados", "Guía de intercambio de alimentos.", "Seguimiento vía Web, Gmail o WhatsApp.", "Reunión vía Google Meet (45 min).", "Suplementación específica, si lo requiere."]',
 '["2 planes personalizados", "Guía de intercambio de alimentos.", "Evaluación física (Medición ISAK I).", "Consulta en consultorio (60 min).", "Suplementación específica, si lo requiere."]',
 'https://wa.me/51946759718?text=Hola!,%20quisiera%20reservar%20el%20Servicio%20flexible,%20plan%20mensual,%20de%20manera%20virtual.%20', 'https://wa.me/51946759718?text=Hola!,%20quisiera%20reservar%20el%20Servicio%20flexible,%20plan%20mensual,%20de%20manera%20presencial.%20'),

('flexible', 'bimestral', 259, true, 
 '["4 planes personalizados", "Guía de intercambio de alimentos.", "Seguimiento vía Web, Gmail o WhatsApp.", "Reunión vía Google Meet (45 min).", "Suplementación específica, si lo requiere.", "Productos recomendados."]',
 '["4 planes personalizados", "Guía de intercambio de alimentos.", "Seguimiento vía Web, Gmail o WhatsApp.", "Evaluación física (Medición ISAK I).", "Consulta en consultorio (60 min).", "Suplementación específica, si lo requiere.", "Productos recomendados."]',
 'https://wa.me/51946759718?text=Hola!,%20quisiera%20reservar%20el%20Servicio%20flexible,%20plan%20bimestral,%20de%20manera%20virtual.%20', 'https://wa.me/51946759718?text=Hola!,%20quisiera%20reservar%20el%20Servicio%20flexible,%20plan%20bimestral,%20de%20manera%20presencial.%20'),

('flexible', 'trimestral', 400, false, 
 '["6 planes personalizados", "Guía de intercambio de alimentos.", "Seguimiento vía Web, Gmail o WhatsApp.", "Reunión vía Google Meet (45 min).", "Suplementación específica, si lo requiere.", "Productos recomendados."]',
 '["6 planes personalizados", "Guía de intercambio de alimentos.", "Seguimiento vía Web, Gmail o WhatsApp.", "Evaluación física (Medición ISAK I).", "Consulta en consultorio (60 min).", "Suplementación específica, si lo requiere.", "Productos recomendados."]',
 'https://wa.me/51946759718?text=Hola!,%20quisiera%20reservar%20el%20Servicio%20flexible,%20plan%20trimestral,%20de%20manera%20virtual.%20', 'https://wa.me/51946759718?text=Hola!,%20quisiera%20reservar%20el%20Servicio%20flexible,%20plan%20trimestral,%20de%20manera%20presencial.%20'),

('menu', 'mensual', 180, false,
 '["2 planes personalizados", "Plan personalizado con 7 menús completos.", "Seguimiento vía Web, Gmail o WhatsApp.", "Recetas fáciles y detalladas.", "Suplementación específica si lo requiere.", "Reunión vía Google Meet (50-60 min).", "Productos recomendados."]',
 '["2 planes personalizados", "Plan personalizado con 7 menús completos.", "Seguimiento vía Web, Gmail o WhatsApp.", "Evaluación física (Medición ISAK I).", "Recetas fáciles y detalladas.", "Suplementación específica si lo requiere.", "Consulta en consultorio (50-60 min).", "Productos recomendados."]',
 'https://wa.me/51946759718?text=Hola!,%20quisiera%20reservar%20el%20Servicio%20men%C3%BA%20semanal,%20plan%20mensual,%20de%20manera%20virtual.%20', 'https://wa.me/51946759718?text=Hola!,%20quisiera%20reservar%20el%20Servicio%20men%C3%BA%20semanal,%20plan%20mensual,%20de%20manera%20presencial.%20'),

('menu', 'bimestral', 300, true,
 '["4 planes personalizados", "Plan personalizado con 7 menús completos.", "Seguimiento vía Web, Gmail o WhatsApp.", "Recetas fáciles y detalladas.", "Suplementación específica si lo requiere.", "Reunión vía Google Meet (50-60 min).", "Productos recomendados."]',
 '["4 planes personalizados", "Plan personalizado con 7 menús completos.", "Seguimiento vía Web, Gmail o WhatsApp.", "Evaluación física (Medición ISAK I).", "Recetas fáciles y detalladas.", "Suplementación específica si lo requiere.", "Consulta en consultorio (50-60 min).", "Productos recomendados."]',
 'https://wa.me/51946759718?text=Hola!,%20quisiera%20reservar%20el%20Servicio%20men%C3%BA%20semanal,%20plan%20bimestral,%20de%20manera%20virtual.%20', 'https://wa.me/51946759718?text=Hola!,%20quisiera%20reservar%20el%20Servicio%20men%C3%BA%20semanal,%20plan%20bimestral,%20de%20manera%20presencial.%20'),

('menu', 'trimestral', 449, false,
 '["6 planes personalizados", "Plan personalizado con 7 menús completos.", "Seguimiento vía Web, Gmail o WhatsApp.", "Recetas fáciles y detalladas.", "Suplementación específica si lo requiere.", "Reunión vía Google Meet (50-60 min).", "Productos recomendados."]',
 '["6 planes personalizados", "Plan personalizado con 7 menús completos.", "Seguimiento vía Web, Gmail o WhatsApp.", "Evaluación física (Medición ISAK I).", "Recetas fáciles y detalladas.", "Suplementación específica si lo requiere.", "Consulta en consultorio (50-60 min).", "Productos recomendados."]',
 'https://wa.me/51946759718?text=Hola!,%20quisiera%20reservar%20el%20Servicio%20men%C3%BA%20semanal,%20plan%20trimestral,%20de%20manera%20virtual.%20', 'https://wa.me/51946759718?text=Hola!,%20quisiera%20reservar%20el%20Servicio%20men%C3%BA%20semanal,%20plan%20trimestral,%20de%20manera%20presencial.%20');

-- Opcionalmente Llenamos el contenido inicial básico.
INSERT INTO public.landing_content (section, content) VALUES
('hero', '{"title": "Listo para iniciar tu cambio?", "subtitle": "VE A TU PROPIO RITMO", "text": "Recetas fáciles y deliciosas. \\n «Reto 30 días» en un mes, nuevos hábitos se quedarán contigo. \\n Hidratación y bienestar total."}'),
('about', '{"title1": "Acerca de NuySa.", "text1": "Es un espacio creado por profesionales...", "title2": "Acerca del nutricionista.", "text2": "¡Saludos! Soy Delia..."}');
