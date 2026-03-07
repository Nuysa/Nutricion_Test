require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
async function run() {
    const { data } = await supabase.from('weight_records').select('*').limit(1).order('created_at', { ascending: false });
    console.log(JSON.stringify(data?.[0]?.extra_data || {}, null, 2));
}
run();
