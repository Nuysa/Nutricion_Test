import pkg from 'pg';
import fs from 'fs';
const { Client } = pkg;

const connectionString = 'postgresql://postgres:31n6KMAdVmATTZYz@db.uuewqkcbhgtwpgjaznif.supabase.co:5432/postgres';

async function checkColumns() {
    const client = new Client({ connectionString });
    try {
        await client.connect();
        const res = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'weight_records'
        `);
        fs.writeFileSync('weight_records_columns.txt', res.rows.map(r => r.column_name).join('\n'), 'utf8');
        console.log("Done");
    } catch (err) {
        console.error('Error during check:', err);
    } finally {
        await client.end();
    }
}
checkColumns();
