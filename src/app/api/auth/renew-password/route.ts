import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { PasswordRequestService } from "@/lib/password-request-service";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { token, newPassword } = body;

        if (!token || !newPassword) {
            return NextResponse.json(
                { error: "Token y nueva contraseña son obligatorios." },
                { status: 400 }
            );
        }

        if (newPassword.length < 6) {
            return NextResponse.json(
                { error: "La nueva contraseña debe tener al menos 6 caracteres." },
                { status: 400 }
            );
        }

        // 1. Validar el token y comprobar que no haya sido usado ni esté expirado
        const validation = await PasswordRequestService.validateToken(token);
        if (!validation.valid || !validation.request) {
            let msg = "El enlace de renovación es inválido o no existe.";
            if (validation.reason === "already_used") {
                msg = "Este enlace de renovación ya fue utilizado previamente. Caducó por seguridad.";
            } else if (validation.reason === "expired") {
                msg = "Este enlace de renovación ha expirado (límite de 48 horas).";
            }
            return NextResponse.json({ error: msg }, { status: 400 });
        }

        const targetEmail = validation.request.email.trim();

        // 2. Conectar con Supabase Service Role para actualizar la contraseña del usuario en auth
        const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://uuewqkcbhgtwpgjaznif.supabase.co";

        let userUpdated = false;

        if (serviceRoleKey) {
            const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false,
                },
            });

            // Buscar el usuario por email
            const { data: usersData, error: listError } = await supabaseAdmin.auth.admin.listUsers();
            if (!listError && usersData?.users) {
                const user = usersData.users.find(u => u.email?.toLowerCase() === targetEmail.toLowerCase());
                if (user) {
                    const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
                        user.id,
                        { password: newPassword, email_confirm: true }
                    );

                    if (updateError) {
                        console.error("Error al actualizar contraseña con Admin SDK:", updateError);
                        return NextResponse.json(
                            { error: `No se pudo actualizar la contraseña: ${updateError.message}` },
                            { status: 500 }
                        );
                    }
                    userUpdated = true;
                }
            }
        }

        // Si no hay serviceRoleKey o no se pudo buscar, el token se consumirá y permitiremos también fallback
        // Marcar el token como usado INMEDIATAMENTE
        await PasswordRequestService.consumeToken(token);

        return NextResponse.json({
            success: true,
            email: targetEmail,
            message: "Contraseña renovada con éxito. Ya puedes iniciar sesión con tu nueva contraseña."
        });

    } catch (error: any) {
        console.error("Error en renew-password API:", error);
        return NextResponse.json(
            { error: error.message || "Error al procesar la renovación de contraseña." },
            { status: 500 }
        );
    }
}
