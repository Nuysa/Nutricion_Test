const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://uuewqkcbhgtwpgjaznif.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1ZXdxa2NiaGd0d3BnamF6bmlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzOTY1MzUsImV4cCI6MjA4Njk3MjUzNX0.9GeHuoP2V1MYSWedHRkO9YQA39OdAt0oz0YuBA3G7Zk';

async function checkProfiles() {
    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: profiles, error } = await supabase.from('profiles').select('id, user_id, full_name, role');
    if (error) {
        console.error('Error:', error);
        return;
    }
    console.log('--- Profiles in DB ---');
    profiles.forEach(p => {
        console.log(`ID: ${p.id} | Name: ${p.full_name} | Role: ${p.role}`);
    });

    const { data: patients, error: pError } = await supabase.from('patients').select('id, profile_id');
    if (pError) {
        console.error('Error fetching patients:', pError);
        return;
    }
    console.log('--- Patients in DB ---');
    patients.forEach(p => {
        const prof = profiles.find(pr => pr.id === p.profile_id);
        console.log(`Patient ID: ${p.id} | Profile Name: ${prof ? prof.full_name : 'Unknown'}`);
    });
}

checkProfiles();
