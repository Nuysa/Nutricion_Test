import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uuewqkcbhgtwpgjaznif.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1ZXdxa2NiaGd0d3BnamF6bmlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzOTY1MzUsImV4cCI6MjA4Njk3MjUzNX0.9GeHuoP2V1MYSWedHRkO9YQA39OdAt0oz0YuBA3G7Zk';
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
    const { data, error } = await supabase.rpc('get_table_info', { table_name: 'clinical_variables' }).catch(() => ({}));
    if (error) console.log("RPC Error:", error.message);

    // Fallback info via select
    const { data: testRec, error: testErr } = await supabase.from('clinical_variables').select('*').limit(1);
    console.log("Record:", testRec ? Object.keys(testRec[0]) : testErr);
}
run();
