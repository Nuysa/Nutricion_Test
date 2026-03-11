import pkg from 'pg';
const { Client } = pkg;
const c = new Client('postgresql://postgres:31n6KMAdVmATTZYz@db.uuewqkcbhgtwpgjaznif.supabase.co:5432/postgres');
async function run() {
    await c.connect();
    // Enable RLS and insert policy for progress-photos bucket
    try {
        await c.query(`
            CREATE POLICY "Allow public uploads to progress-photos"
            ON storage.objects FOR INSERT TO public
            WITH CHECK (bucket_id = 'progress-photos');
        `);
        console.log("INSERT policy created successfully");
    } catch (e) {
        console.error("Error creating INSERT policy", e.message);
    }
    
    try {
        await c.query(`
            CREATE POLICY "Allow authenticated uploads to progress-photos"
            ON storage.objects FOR INSERT TO authenticated
            WITH CHECK (bucket_id = 'progress-photos');
        `);
        console.log("Authenticated INSERT policy created successfully");
    } catch (e) {
        console.error("Error creating authenticated INSERT policy", e.message);
    }
    
    try {
        await c.query(`
            CREATE POLICY "Allow update for progress-photos"
            ON storage.objects FOR UPDATE TO authenticated, public
            WITH CHECK (bucket_id = 'progress-photos');
        `);
        console.log("UPDATE policy created successfully");
    } catch (e) {
        console.error("Error creating UPDATE policy", e.message);
    }

    try {
        await c.query(`
            CREATE POLICY "Allow select for progress-photos"
            ON storage.objects FOR SELECT TO authenticated, public
            USING (bucket_id = 'progress-photos');
        `);
        console.log("SELECT policy created successfully");
    } catch (e) {
        console.error("Error creating SELECT policy", e.message);
    }
    
    try {
        await c.query(`
            CREATE POLICY "Allow delete for progress-photos"
            ON storage.objects FOR DELETE TO authenticated, public
            USING (bucket_id = 'progress-photos');
        `);
        console.log("DELETE policy created successfully");
    } catch (e) {
        console.error("Error creating DELETE policy", e.message);
    }

    await c.end();
}
run();
