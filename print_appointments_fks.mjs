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
                a.attname as local_column,
                confrelid::regclass as foreign_table,
                af.attname as foreign_column
            FROM
                pg_constraint c
                JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
                JOIN pg_attribute af ON af.attrelid = c.confrelid AND af.attnum = ANY(c.confkey)
            WHERE
                conrelid = 'public.appointments'::regclass
                AND contype = 'f';
        `);
        res.rows.forEach(r => {
            console.log(`${r.conname}: ${r.local_column} -> ${r.foreign_table}(${r.foreign_column})`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
dump();
