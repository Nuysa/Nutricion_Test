"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Loader2, Mail, Lock, User, Stethoscope, UserCheck } from "lucide-react";

export default function RegisterPage() {
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [role, setRole] = useState<"paciente" | "nutricionista">("paciente");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const router = useRouter();

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password !== confirmPassword) {
            setError("Las contraseñas no coinciden.");
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError("La contraseña debe tener al menos 6 caracteres.");
            setLoading(false);
            return;
        }

        try {
            const supabase = createClient();
            const { data, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        full_name: fullName,
                        role: role,
                    },
                },
            });

            if (authError) {
                setError(authError.message);
                return;
            }

            // Profile creation is handled automatically by the Supabase trigger
            // (on_auth_user_created -> handle_new_user)

            setSuccess(true);
        } catch {
            setError("Ocurrió un error inesperado. Intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <Card className="border-none shadow-none bg-transparent">
                <CardHeader className="px-0 text-center">
                    <div className="mx-auto h-16 w-16 rounded-full bg-nutrition-100 flex items-center justify-center mb-4">
                        <UserCheck className="h-8 w-8 text-nutrition-600" />
                    </div>
                    <CardTitle className="text-2xl font-bold">¡Registro exitoso!</CardTitle>
                    <CardDescription className="text-base">
                        Revisa tu correo electrónico para confirmar tu cuenta. Luego podrás iniciar sesión.
                    </CardDescription>
                </CardHeader>
                <CardContent className="px-0">
                    <Button onClick={() => router.push("/login")} className="w-full h-11">
                        Ir a Iniciar Sesión
                    </Button>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-none shadow-none bg-transparent">
            <CardHeader className="space-y-1 px-0">
                <CardTitle className="text-2xl font-bold">Crear cuenta</CardTitle>
                <CardDescription className="text-base">
                    Elige tu rol y completa tus datos para comenzar
                </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
                <form onSubmit={handleRegister} className="space-y-4">
                    {error && (
                        <div className="p-3 rounded-lg bg-destructive/10 text-destructive text-sm border border-destructive/20">
                            {error}
                        </div>
                    )}

                    {/* Role selection */}
                    <div className="space-y-2">
                        <Label>Tipo de cuenta</Label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setRole("paciente")}
                                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${role === "paciente"
                                    ? "border-primary bg-primary/5 text-primary"
                                    : "border-border hover:border-primary/30"
                                    }`}
                            >
                                <User className="h-6 w-6" />
                                <span className="text-sm font-medium">Paciente</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole("nutricionista")}
                                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${role === "nutricionista"
                                    ? "border-primary bg-primary/5 text-primary"
                                    : "border-border hover:border-primary/30"
                                    }`}
                            >
                                <Stethoscope className="h-6 w-6" />
                                <span className="text-sm font-medium">Nutricionista</span>
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="fullName">Nombre completo</Label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="fullName"
                                type="text"
                                placeholder="Juan Pérez"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="pl-10 h-11"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="email">Correo electrónico</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="tu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-10 h-11"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Contraseña</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Mínimo 6 caracteres"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-10 pr-10 h-11"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Repite tu contraseña"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="pl-10 h-11"
                                required
                            />
                        </div>
                    </div>

                    <Button type="submit" className="w-full h-11 text-base font-semibold" disabled={loading}>
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Creando cuenta...
                            </>
                        ) : (
                            "Crear Cuenta"
                        )}
                    </Button>
                </form>

                <div className="mt-6 text-center text-sm text-muted-foreground">
                    ¿Ya tienes cuenta?{" "}
                    <Link href="/login" className="text-primary hover:text-primary/80 font-semibold">
                        Inicia sesión
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
