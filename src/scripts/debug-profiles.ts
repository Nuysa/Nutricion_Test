import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error("Missing Supabase env vars");
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testQuery() {
    const { data, error } = await supabase
        .from("profiles")
        .select("*, patients(plan_type)")
        .limit(1);

    if (error) {
        console.error("QUERY ERROR:", error);
    } else {
        console.log("QUERY SUCCESS, DATA LENGTH:", data?.length);
        console.log("SAMPLE DATA:", JSON.stringify(data[0], null, 2));
    }
}

testQuery();
