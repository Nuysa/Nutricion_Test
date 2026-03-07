
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uuewqkcbhgtwpgjaznif.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1ZXdxa2NiaGd0d3BnamF6bmlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzOTY1MzUsImV4cCI6MjA4Njk3MjUzNX0.9GeHuoP2V1MYSWedHRkO9YQA39OdAt0oz0YuBA3G7Zk';

const mockMacros = {
    "Huevos Revueltos con Espinaca": { carbs: 5, protein: 18, fats: 14 },
    "Smoothie de espinaca": { carbs: 25, protein: 8, fats: 5 },
    "Avena con banano": { carbs: 45, protein: 12, fats: 7 },
    "Avena con frutas": { carbs: 40, protein: 10, fats: 5 },
    "Pancakes de avena": { carbs: 40, protein: 15, fats: 8 },
    "Ensalada de Pollo Grillado": { carbs: 10, protein: 35, fats: 12 },
    "Salmón con brócoli": { carbs: 8, protein: 28, fats: 20 },
    "Tacos de pavo": { carbs: 30, protein: 25, fats: 10 },
    "Pasta integral con atún": { carbs: 55, protein: 30, fats: 8 },
    "Yogur Griego": { carbs: 12, protein: 20, fats: 1 },
    "Yogur con nueces": { carbs: 15, protein: 8, fats: 6 },
    "Fruta picada": { carbs: 30, protein: 1, fats: 0 },
    "Nueces mixtas": { carbs: 5, protein: 6, fats: 22 },
    "Puñado de Almendras": { carbs: 6, protein: 6, fats: 14 },
    "Barrita de cereal": { carbs: 22, protein: 4, fats: 6 },
    "Manzana con mantequilla de maní": { carbs: 25, protein: 8, fats: 16 },
    "Pescado con Batata": { carbs: 35, protein: 25, fats: 12 },
    "Sopa de verduras": { carbs: 15, protein: 5, fats: 2 },
    "Bowl de garbanzos": { carbs: 40, protein: 15, fats: 10 },
    "Omelette de claras": { carbs: 3, protein: 20, fats: 5 },
    "Pollo con arroz": { carbs: 50, protein: 35, fats: 12 },
    "Tostada con aguacate": { carbs: 25, protein: 8, fats: 15 },
    "Pechuga a la plancha": { carbs: 5, protein: 35, fats: 8 },
    "Ensalada César ligera": { carbs: 12, protein: 25, fats: 18 },
    "Waffles de proteína": { carbs: 30, protein: 30, fats: 10 },
    "Parrillada de vegetales": { carbs: 20, protein: 5, fats: 8 },
    "Sushi bowl": { carbs: 55, protein: 25, fats: 12 },
    "Shakshuka": { carbs: 15, protein: 18, fats: 12 },
    "Roast beef con espárragos": { carbs: 10, protein: 38, fats: 15 },
    "Caldo de pollo": { carbs: 10, protein: 15, fats: 5 }
};

async function run() {
    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: patient, error: pError } = await supabase.from('patients').select('id').limit(1).single();
    if (pError) {
        console.error('Error fetching patient:', pError);
        return;
    }
    console.log('Targeting patient:', patient.id);

    for (const [name, macros] of Object.entries(mockMacros)) {
        const { error } = await supabase
            .from('meals')
            .update({
                carbs_g: macros.carbs,
                protein_g: macros.protein,
                fats_g: macros.fats
            })
            .eq('patient_id', patient.id)
            .eq('name', name);

        if (error) {
            console.error(`Failed to update ${name}:`, error.message);
        } else {
            console.log(`Updated ${name}`);
        }
    }
}

run();
