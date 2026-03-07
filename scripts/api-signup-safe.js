
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

async function createUsers() {
    const envContent = fs.readFileSync('.env.local', 'utf8');
    const lines = envContent.split('\n');
    let supabaseUrl = '';
    let supabaseAnonKey = '';

    lines.forEach(line => {
        if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
            supabaseUrl = line.split('=')[1].trim();
        }
        if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
            supabaseAnonKey = line.split('=')[1].trim();
        }
    });

    if (!supabaseUrl || !supabaseAnonKey) {
        console.error("No se encontraron las variables en .env.local");
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    console.log(`Usando URL: ${supabaseUrl}`);
    console.log("Registrando Admin via Auth API...");
    const { data: adminAuth, error: adminError } = await supabase.auth.signUp({
        email: 'admin@gmail.com',
        password: 'Edwars'
    });

    if (adminError) console.error("Error Admin:", adminError.message);
    else console.log("Admin registrado correctamente");

    console.log("Registrando Staff via Auth API...");
    const { data: staffAuth, error: staffError } = await supabase.auth.signUp({
        email: 'staff@gmail.com',
        password: 'Edwars'
    });

    if (staffError) console.error("Error Staff:", staffError.message);
    else console.log("Staff registrado correctamente");
}

createUsers();
