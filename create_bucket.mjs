import pkg from 'pg';
const { Client } = pkg;
const c = new Client('postgresql://postgres:31n6KMAdVmATTZYz@db.uuewqkcbhgtwpgjaznif.supabase.co:5432/postgres');
async function run() {
    await c.connect();
    try {
        await c.query(`
            INSERT INTO storage.buckets (id, name, public) 
            VALUES ('progress-photos', 'progress-photos', true)
            ON CONFLICT (id) DO UPDATE SET public = true;
        `);
        console.log("Bucket ensured");

        // allow insert to everyone
        await c.query(`
            CREATE POLICY "Allow public uploads to progress-photos"
            ON storage.objects FOR INSERT TO public
            WITH CHECK (bucket_id = 'progress-photos');
        `);
    } catch (e) {
        console.error("error", e.message);
    }
    await c.end();
}
run();
