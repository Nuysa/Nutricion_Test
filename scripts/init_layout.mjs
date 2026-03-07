import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://uuewqkcbhgtwpgjaznif.supabase.co';
// The anon key obtained from .env.local
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1ZXdxa2NiaGd0d3BnamF6bmlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzOTY1MzUsImV4cCI6MjA4Njk3MjUzNX0.9GeHuoP2V1MYSWedHRkO9YQA39OdAt0oz0YuBA3G7Zk';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function run() {
    const { data: vars } = await supabase.from('clinical_variables').select('*');
    if (!vars) { console.error("No vars found"); return; }

    console.log("Found vars:", vars.length);
    const defaults = [
        { id: 'f1', header: "Fecha", fixed_variable: "date", variable_id: null, section: 'base' },
        { id: 'f2', header: "Peso Actual", fixed_variable: "weight", variable_id: null, section: 'base' },
        { id: 'f3', header: "IMC", fixed_variable: "bmi", variable_id: null, section: 'base' },

        { id: 'f4', header: "B. Relajado", variable_id: vars.find(v => v.code === 'BRAZO_RELAJADO')?.id || null, section: 'perimeters' },
        { id: 'f5', header: "B. Flexionado", variable_id: vars.find(v => v.code === 'BRAZO_FLEXIONADO')?.id || null, section: 'perimeters' },
        { id: 'f6', header: "Antebrazo", variable_id: vars.find(v => v.code === 'ANTEBRAZO_MAXIMO')?.id || null, section: 'perimeters' },
        { id: 'f7', header: "Tórax", variable_id: vars.find(v => v.code === 'TORAX')?.id || null, section: 'perimeters' },
        { id: 'f8', header: "Cintura Min.", variable_id: vars.find(v => v.code === 'CINTURA_MINIMA')?.id || null, section: 'perimeters' },
        { id: 'f9', header: "Cintura Max.", variable_id: vars.find(v => v.code === 'CINTURA_MAXIMA')?.id || null, section: 'perimeters' },
        { id: 'f10', header: "Cadera Max.", variable_id: vars.find(v => v.code === 'CADERA_MAXIMA')?.id || null, section: 'perimeters' },
        { id: 'f11', header: "Muslo Max.", variable_id: vars.find(v => v.code === 'MUSLO_MAXIMO')?.id || null, section: 'perimeters' },

        { id: 'f12', header: "Tríceps", variable_id: vars.find(v => v.code === 'P_TRICEPS')?.id || null, section: 'folds' },
        { id: 'f13', header: "Subescapular", variable_id: vars.find(v => v.code === 'P_SUBESCAPULAR')?.id || null, section: 'folds' },
        { id: 'f14', header: "Supraespinal", variable_id: vars.find(v => v.code === 'P_SUPRAESPINAL')?.id || null, section: 'folds' },
        { id: 'f15', header: "Abdominal", variable_id: vars.find(v => v.code === 'P_ABDOMINAL')?.id || null, section: 'folds' },
        { id: 'f16', header: "Muslo Med.", variable_id: vars.find(v => v.code === 'P_MUSLO_MEDIAL')?.id || null, section: 'folds' },
        { id: 'f17', header: "Pantorrilla", variable_id: vars.find(v => v.code === 'P_PANTORRILLA')?.id || null, section: 'folds' },
        { id: 'f18', header: "C. Ilíaca", variable_id: vars.find(v => v.code === 'CRESTA_ILIACA')?.id || null, section: 'folds' },
        { id: 'f19', header: "Bíceps", variable_id: vars.find(v => v.code === 'BICEPS')?.id || null, section: 'folds' },

        { id: 'f20', header: "Principales Hallazgos", variable_id: vars.find(v => v.code === 'PRINCIPALES_HALLAZGOS')?.id || null, section: 'findings' },
        { id: 'f21', header: "Recomendación", variable_id: vars.find(v => v.code === 'RECOMENDACION_NUTRICIONAL')?.id || null, section: 'recommendations' },
    ];

    console.log("Sending layout of length:", defaults.length);
    const { error } = await supabase.from('dashboard_layout').upsert({
        role: 'form_nutricionista',
        columns: defaults,
        updated_at: new Date().toISOString()
    }, { onConflict: 'role' });

    if (error) {
        console.error("Error saving:", error);
    } else {
        console.log("Successfully initialized form_nutricionista layout!");
    }
}
run();
