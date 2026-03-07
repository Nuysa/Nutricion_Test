import { createClient } from "@supabase/supabase-js";

// Dummy script to check profile join structure
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || "", process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "");

async function check() {
    const { data, error } = await supabase
        .from("profiles")
        .select("*, patients(plan_type)")
        .limit(5);

    console.log(JSON.stringify(data, null, 2));
}
check();
