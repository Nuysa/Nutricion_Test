import pkg from 'pg';
const { Client } = pkg;

const connectionString = 'postgresql://postgres:31n6KMAdVmATTZYz@db.uuewqkcbhgtwpgjaznif.supabase.co:5432/postgres';

async function check() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        const res = await client.query(`
            SELECT
                p.relname AS table_name,
                a.attname AS column_name,
                f.relname AS foreign_table_name,
                fa.attname AS foreign_column_name
            FROM
                pg_constraint c
                JOIN pg_namespace n ON n.oid = c.connamespace
                JOIN pg_class p ON p.oid = c.conrelid
                JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
                JOIN pg_class f ON f.oid = c.confrelid
                JOIN pg_attribute fa ON fa.attrelid = c.confrelid AND fa.attnum = ANY(c.confkey)
            WHERE
                c.contype = 'f'
                AND p.relname = 'appointments'
                AND a.attname = 'patient_id';
        `);
        console.log('RESULT:');
        console.log(JSON.stringify(res.rows, null, 2));
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
check();
