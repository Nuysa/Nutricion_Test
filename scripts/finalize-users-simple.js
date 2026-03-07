
const { Client } = require('pg');

async function confirmUsers() {
    const client = new Client({
        connectionString: 'postgresql://postgres:31n6KMAdVmATTZYz@db.uuewqkcbhgtwpgjaznif.supabase.co:5432/postgres'
    });

    try {
        await client.connect();

        console.log("Confirmando correos básicos...");
        await client.query(`
            UPDATE auth.users 
            SET email_confirmed_at = now()
            WHERE email IN ('admin@gmail.com', 'staff@gmail.com')
        `);

        console.log("Creando/Actualizando perfiles...");
        await client.query(`
            INSERT INTO public.profiles (user_id, full_name, role)
            SELECT id, 'Admin Root', 'administrador' FROM auth.users WHERE email = 'admin@gmail.com'
            ON CONFLICT (user_id) DO UPDATE SET role = 'administrador'
        `);
        await client.query(`
            INSERT INTO public.profiles (user_id, full_name, role)
            SELECT id, 'Staff User', 'staff' FROM auth.users WHERE email = 'staff@gmail.com'
            ON CONFLICT (user_id) DO UPDATE SET role = 'staff'
        `);

        console.log("Proceso completado.");
    } catch (err) {
        console.error("Error:", err);
    } finally {
        await client.end();
    }
}

confirmUsers();
