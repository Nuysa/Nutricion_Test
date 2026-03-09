import pkg from 'pg';
import fs from 'fs';
const { Client } = pkg;
const connectionString = 'postgresql://postgres:31n6KMAdVmATTZYz@db.uuewqkcbhgtwpgjaznif.supabase.co:5432/postgres';

async function run() {
    console.log("Connecting to Supabase...");
    const client = new Client({ connectionString });
    await client.connect();

    console.log("Reading medical history migration SQL...");
    const sql = fs.readFileSync('c:/Users/Sistema/Documents/Nutricion_Test/supabase/migrations/20260308_medical_history.sql', 'utf8');

    console.log("Running migration...");
    try {
        await client.query(sql);
        console.log("Migration applied successfully! Table public.patient_medical_histories created.");
    } catch (err) {
        console.error("Error applying migration:", err);
    } finally {
        await client.end();
    }
}

run();
