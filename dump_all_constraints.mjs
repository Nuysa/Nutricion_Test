import pkg from 'pg';
const { Client } = pkg;

const connectionString = 'postgresql://postgres:31n6KMAdVmATTZYz@db.uuewqkcbhgtwpgjaznif.supabase.co:5432/postgres';

async function check() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        const res = await client.query(`
            SELECT
                conname,
                pg_get_constraintdef(oid)
            FROM
                pg_constraint
            WHERE
                conrelid = 'public.appointments'::regclass;
        `);
        console.log(res.rows);
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
check();
