const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uuewqkcbhgtwpgjaznif.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1ZXdxa2NiaGd0d3BnamF6bmlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzOTY1MzUsImV4cCI6MjA4Njk3MjUzNX0.9GeHuoP2V1MYSWedHRkO9YQA39OdAt0oz0YuBA3G7Zk';

async function checkPatients() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: patients, error } = await supabase.from('patients').select('*');
    if (error) {
        console.error('Error:', error);
        return;
    }
    console.log('--- Patients in DB ---');
    patients.forEach(p => {
        console.log(`ID: ${p.id} | Name: ${p.name}`);
    });
}

checkPatients();
