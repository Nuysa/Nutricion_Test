
const { Client } = require('pg');

async function main() {
    const client = new Client({
        connectionString: 'postgresql://postgres:31n6KMAdVmATTZYz@db.uuewqkcbhgtwpgjaznif.supabase.co:5432/postgres'
    });

    try {
        await client.connect();

        console.log("Limpiando correos...");
        await client.query("DELETE FROM auth.users WHERE email IN ('admin@gmail.com', 'staff@gmail.com')");

        console.log("Insertando Admin...");
        const adminRes = await client.query(`
            INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
            VALUES ($1, crypt($2, gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Admin Root"}', 'authenticated', 'authenticated')
            RETURNING id
        `, ['admin@gmail.com', 'Edwars']);

        const adminId = adminRes.rows[0].id;
        await client.query("INSERT INTO public.profiles (user_id, full_name, role) VALUES ($1, $2, $3)", [adminId, 'Admin Root', 'administrador']);

        console.log("Insertando Staff...");
        const staffRes = await client.query(`
            INSERT INTO auth.users (email, encrypted_password, email_confirmed_at, confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role)
            VALUES ($1, crypt($2, gen_salt('bf')), now(), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Staff User"}', 'authenticated', 'authenticated')
            RETURNING id
        `, ['staff@gmail.com', 'Edwars']);

        const staffId = staffRes.rows[0].id;
        await client.query("INSERT INTO public.profiles (user_id, full_name, role) VALUES ($1, $2, $3)", [staffId, 'Staff User', 'staff']);

        console.log("Proceso completado con éxito");
    } catch (err) {
        console.error("Error detallado:", err);
    } finally {
        await client.end();
    }
}

main();
