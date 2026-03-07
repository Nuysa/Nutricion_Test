
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { mockMacros } from "@/lib/nutrition-utils";

export async function GET() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // Trial with anon, ideally service role

    const supabase = createClient(supabaseUrl, supabaseKey);

    // We try to update meals for the first patient found
    const { data: patient } = await supabase.from("patients").select("id").limit(1).single();

    if (!patient) {
        return NextResponse.json({ error: "No patient found" }, { status: 404 });
    }

    const updates = [];
    for (const [name, macros] of Object.entries(mockMacros)) {
        const promise = supabase
            .from("meals")
            .update({
                carbs_g: macros.carbs,
                protein_g: macros.protein,
                fats_g: macros.fats
            })
            .eq("patient_id", patient.id)
            .eq("name", name);
        updates.push(promise);
    }

    const results = await Promise.all(updates);
    const errors = results.filter(r => r.error).map(r => r.error);

    if (errors.length > 0) {
        return NextResponse.json({
            message: "Some updates failed (might be RLS)",
            errors: errors.slice(0, 3)
        }, { status: 207 });
    }

    return NextResponse.json({ message: "Macros updated successfully in DB" });
}
