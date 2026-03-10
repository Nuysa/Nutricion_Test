import pkg from 'pg';
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
        console.log("COLUMNS:");
        console.log(JSON.stringify(res.rows.map(r => r.column_name)));
    } catch (err) {
        console.error('Error during check:', err);
    } finally {
        await client.end();
    }
}
checkColumns();
