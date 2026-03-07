
const { createClient } = require('@supabase/supabase-js');

async function createUsers() {
    const supabaseUrl = 'https://uuewqkcbhgtwpgjaznif.supabase.co';
    const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1ZXdxa2NiaGd0d3BnamF6bmlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDAzNTI1MzV9.9GeHuoP2V1MYSWedHRkO9YQA39OdAt0oz0YuBA3G7Zkk';

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    console.log("Registrando Admin via Auth API...");
    const { data: adminAuth, error: adminError } = await supabase.auth.signUp({
        email: 'admin@gmail.com',
        password: 'Edwars',
        options: {
            data: { full_name: 'Admin Root' }
        }
    });

    if (adminError) console.error("Error Admin:", adminError.message);
    else console.log("Admin registrado (pendiente confirmación)");

    console.log("Registrando Staff via Auth API...");
    const { data: staffAuth, error: staffError } = await supabase.auth.signUp({
        email: 'staff@gmail.com',
        password: 'Edwars',
        options: {
            data: { full_name: 'Staff User' }
        }
    });

    if (staffError) console.error("Error Staff:", staffError.message);
    else console.log("Staff registrado (pendiente confirmación)");
}

createUsers();
