import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { email, password, fullName, role } = body;

        // Check for service role key
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

        if (!serviceRoleKey || !supabaseUrl) {
            return NextResponse.json(
                { error: "Configuración del servidor incompleta (Service Role Key faltante)." },
                { status: 500 }
            );
        }

        // Create a Supabase client with the service role key
        const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            },
        });

        // 1. Create the user in Auth
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
            user_metadata: {
                full_name: fullName,
                role: role,
            },
        });

        if (authError) {
            console.error("Auth Error:", authError);
            return NextResponse.json({ error: authError.message }, { status: 400 });
        }

        // 2. The profile should be created by the trigger, but let's ensure it has the correct role
        // Sometimes the trigger might need a moment or we want to be explicit
        if (authData.user) {
            const { error: profileError } = await supabaseAdmin
                .from("profiles")
                .update({ role: role, full_name: fullName })
                .eq("id", authData.user.id);

            if (profileError) {
                console.error("Profile Update Error:", profileError);
            }
        }

        return NextResponse.json({ success: true, user: authData.user });
    } catch (error: any) {
        console.error("Internal Error:", error);
        return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 });
    }
}
