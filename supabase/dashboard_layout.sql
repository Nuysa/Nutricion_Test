-- Table for saving dashboard layouts for different roles
CREATE TABLE IF NOT EXISTS dashboard_layout (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    role VARCHAR(50) UNIQUE NOT NULL, -- 'paciente', 'nutricionista'
    columns JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE dashboard_layout ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read access for all" ON dashboard_layout
    FOR SELECT USING (true);

CREATE POLICY "Allow all access for admins" ON dashboard_layout
    FOR ALL USING (auth.jwt() ->> 'email' IN (SELECT email FROM profiles WHERE role = 'administrador'));

-- Optional: Seed default data
INSERT INTO dashboard_layout (role, columns)
VALUES 
('nutricionista', '[
    {"header": "PESO ACTUAL", "fixed_variable": "weight", "variable_id": null},
    {"header": "% GRASA", "fixed_variable": "body_fat", "variable_id": null},
    {"header": "CINTURA", "fixed_variable": "waist", "variable_id": null},
    {"header": "HALLAZGOS", "fixed_variable": "findings", "variable_id": null},
    {"header": "ACCIONES", "fixed_variable": "recommendations", "variable_id": null}
]'),
('paciente', '[
    {"header": "PESO", "fixed_variable": "weight", "variable_id": null},
    {"header": "IMC", "fixed_variable": "bmi", "variable_id": null},
    {"header": "GRASA", "fixed_variable": "body_fat", "variable_id": null},
    {"header": "ESPECIALISTA", "fixed_variable": "nutritionist", "variable_id": null}
]')
ON CONFLICT (role) DO NOTHING;
