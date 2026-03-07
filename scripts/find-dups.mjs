import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uuewqkcbhgtwpgjaznif.supabase.co';
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1ZXdxa2NiaGd0d3BnamF6bmlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzOTY1MzUsImV4cCI6MjA4Njk3MjUzNX0.9GeHuoP2V1MYSWedHRkO9YQA39OdAt0oz0YuBA3G7Zk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDups() {
    const { data: allVars } = await supabase.from('clinical_variables').select('id, name, code, is_system').order('created_at', { ascending: true });
    if (!allVars) return;

    const seen = new Set();
    const toDelete = [];

    allVars.forEach(v => {
        const key = v.code + '_' + v.name;
        if (seen.has(key)) {
            toDelete.push(v);
        } else {
            seen.add(key);
        }
    });

    console.log('Total variables:', allVars.length);
    console.log('Duplicates to delete:', toDelete.length);
    for (const d of toDelete) {
        console.log(`Deleting duplicate: ${d.name} (${d.code}) ID: ${d.id}`);
        // await supabase.from('clinical_variables').delete().eq('id', d.id);
    }
}
checkDups().catch(console.error);
