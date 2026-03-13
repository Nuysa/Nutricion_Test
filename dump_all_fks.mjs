import pkg from 'pg';
const { Client } = pkg;

const connectionString = 'postgresql://postgres:31n6KMAdVmATTZYz@db.uuewqkcbhgtwpgjaznif.supabase.co:5432/postgres';

async function dumpAllFKs() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        const res = await client.query(`
            SELECT
                kcu.table_name, 
                kcu.column_name, 
                ccu.table_name AS foreign_table,
                ccu.column_name AS foreign_column 
            FROM 
                information_schema.key_column_usage AS kcu
                JOIN information_schema.constraint_column_usage AS ccu
                  ON ccu.constraint_name = kcu.constraint_name
            WHERE kcu.table_name = 'appointments';
        `);
        console.log('--- ALL FKs for table appointments ---');
        res.rows.forEach(row => {
            console.log(`${row.table_name}.${row.column_name} -> ${row.foreign_table}.${row.foreign_column}`);
        });
    } catch (err) {
        console.error(err);
    } finally {
        await client.end();
    }
}
dumpAllFKs();
