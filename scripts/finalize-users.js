
const { Client } = require('pg');

async function confirmUsers() {
    const client = new Client({
        connectionString: 'postgresql://postgres:31n6KMAdVmATTZYz@db.uuewqkcbhgtwpgjaznif.supabase.co:5432/postgres'
    });

    try {
        await client.connect();

        console.log("Confirmando correos en Auth...");
        await client.query(`
            UPDATE auth.users 
            SET email_confirmed_at = now(), 
                confirmed_at = now(),
                last_sign_in_at = now()
            WHERE email IN ('admin@gmail.com', 'staff@gmail.com')
        `);

        console.log("Asignando roles en Public.Profiles...");

        // Admin
        await client.query(`
            UPDATE public.profiles 
            SET role = 'administrador' 
            WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'admin@gmail.com')
        `);

        // Staff
        await client.query(`
            UPDATE public.profiles 
            SET role = 'staff' 
            WHERE user_id IN (SELECT id FROM auth.users WHERE email = 'staff@gmail.com')
        `);

        // Verificar si existen perfiles. Si no existen (porque falló el trigger), los creamos.
        const res = await client.query("SELECT p.role, au.email FROM public.profiles p JOIN auth.users au ON p.user_id = au.id WHERE au.email IN ('admin@gmail.com', 'staff@gmail.com')");
        console.log("Estado actual de perfiles:", res.rows);

        if (res.rows.length < 2) {
            console.log("Creando perfiles faltantes...");
            await client.query(`
                INSERT INTO public.profiles (user_id, full_name, role)
                SELECT id, 'Admin Root', 'administrador' FROM auth.users WHERE email = 'admin@gmail.com'
                ON CONFLICT (user_id) DO NOTHING
            `);
            await client.query(`
                INSERT INTO public.profiles (user_id, full_name, role)
                SELECT id, 'Staff User', 'staff' FROM auth.users WHERE email = 'staff@gmail.com'
                ON CONFLICT (user_id) DO NOTHING
            `);
        }

        console.log("Proceso de confirmación completado.");
    } catch (err) {
        console.error("Error confirmando:", err);
    } finally {
        await client.end();
    }
}

confirmUsers();
