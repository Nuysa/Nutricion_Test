const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uuewqkcbhgtwpgjaznif.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1ZXdxa2NiaGd0d3BnamF6bmlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzOTY1MzUsImV4cCI6MjA4Njk3MjUzNX0.9GeHuoP2V1MYSWedHRkO9YQA39OdAt0oz0YuBA3G7Zk';

async function createJuan() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    console.log('--- Intentando crear cuenta de Juan Pérez ---');

    /*
        const { data, error } = await supabase.auth.signUp({
            email: 'juan.perez.nutrigo@gmail.com',
            password: 'Password123!',
            options: {
                data: {
                    full_name: 'Juan Pérez',
                    role: 'patient'
                }
            }
        });
    
        if (error) {
            if (error.message.includes('User already registered')) {
                console.log('✅ El usuario ya existe en Auth.');
            } else {
                console.error('❌ Error en SignUp:', error.message);
                return;
            }
        } else {
            console.log('✅ Usuario creado en Auth:', data.user.id);
        }
    */

    // Sign in to get session
    const { data: signData, error: signErr } = await supabase.auth.signInWithPassword({
        email: 'juan.perez.nutrigo@gmail.com',
        password: 'Password123!',
    });

    if (signErr) {
        console.error('❌ Error al iniciar sesión:', signErr.message);
        return;
    }
    console.log('✅ Sesión iniciada para Juan.');

    // Ahora verificamos si el trigger creó el paciente
    const { data: profiles, error: profErr } = await supabase.from('profiles').select('*');
    if (profErr) console.error('Error fetching profiles:', profErr);
    console.log('Perfiles encontrados:', profiles);

    if (profiles && profiles.length > 0) {
        const juanProf = profiles.find(p => p.full_name && p.full_name.includes('Juan'));
        if (juanProf) {
            const { data: patients } = await supabase.from('patients').select('*').eq('profile_id', juanProf.id);
            console.log('Pacientes encontrados:', patients);
            if (patients && patients.length > 0) {
                console.log('--- DATOS PARA EL CÓDIGO ---');
                console.log('Copia este UUID para Juan Pérez:', patients[0].id);
            }
        }
    }
}

createJuan();
