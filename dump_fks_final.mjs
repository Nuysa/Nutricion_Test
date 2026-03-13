import pkg from 'pg';
const { Client } = pkg;

const connectionString = 'postgresql://postgres:31n6KMAdVmATTZYz@db.uuewqkcbhgtwpgjaznif.supabase.co:5432/postgres';

async function dump() {
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
                conrelid = 'public.appointments'::regclass
                AND contype = 'f';
        `);
        res.rows.forEach(r => {
            console.log(`${r.conname}: ${r.pg_get_constraintdef}`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
dump();
