import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://uuewqkcbhgtwpgjaznif.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function inspectRLS() {
    console.log('Inspecting RLS for appointments...');
    const { data, error } = await supabase.rpc('get_policies', { table_name: 'appointments' });
    if (error) {
        // Try direct query if RPC doesn't exist
        const { data: direct, error: dError } = await supabase
            .from('pg_policies')
            .select('*')
            .eq('tablename', 'appointments');
        
        if (direct) {
            console.log('Policies (Direct):', JSON.stringify(direct, null, 2));
        } else {
            console.error('Error:', dError?.message || error.message);
        }
    } else {
        console.log('Policies (RPC):', JSON.stringify(data, null, 2));
    }

    console.log('\nChecking if RLS is enabled...');
    const { data: tableInfo, error: tError } = await supabase.rpc('check_rls_enabled', { t_name: 'appointments' });
    if (tError) {
        // Fallback to pg_tables
        const { data: pgTables } = await supabase.from('pg_tables').select('*').eq('tablename', 'appointments');
        console.log('Table Info:', pgTables);
    } else {
        console.log('RLS Enabled:', tableInfo);
    }
}

inspectRLS();
