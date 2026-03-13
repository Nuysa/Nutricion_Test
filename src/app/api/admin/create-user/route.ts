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

        // 2. Ensure profile exists and has correct data.
        // We use upsert to avoid race conditions with triggers and ensure data is correct.
        if (authData.user) {
            const { error: profileError } = await supabaseAdmin
                .from("profiles")
                .upsert({ 
                    id: authData.user.id,
                    user_id: authData.user.id,
                    role: role, 
                    full_name: fullName,
                    email: email,
                    status: 'Activo'
                }, { onConflict: 'id' });

            if (profileError) {
                console.error("Profile Upsert Error:", profileError);
                // We don't fail the whole request because the user is already created in Auth
            }
        }

        return NextResponse.json({ success: true, user: authData.user });
    } catch (error: any) {
        console.error("Internal Error:", error);
        return NextResponse.json({ error: error.message || "Error interno del servidor" }, { status: 500 });
    }
}
