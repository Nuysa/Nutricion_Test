"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Loader2, Mail, Lock } from "lucide-react";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        console.log("Iniciando login para:", email);

        try {
            const supabase = createClient();
            const { data, error: authError } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            console.log("Respuesta de auth:", { data, authError });

            if (authError) {
                console.error("Error de autenticación:", authError);
                setError(authError.message === "Invalid login credentials"
                    ? "Credenciales inválidas. Verifica tu email y contraseña."
                    : authError.message);
                return;
            }

            if (data?.user) {
                console.log("Usuario autenticado:", data.user.id);
                const { data: profile, error: profileError } = await supabase
                    .from("profiles")
                    .select("role")
                    .eq("user_id", data.user.id)
                    .single();

                console.log("Perfil obtenido:", { profile, profileError });

                const role = profile?.role || "paciente";
                console.log("Redirigiendo a:", `/dashboard/${role}`);
                
                // Forzar un reload en lugar de push para evitar conflictos de caché/middleware
                window.location.href = `/dashboard/${role}`;
            } else {
                console.log("No authError pero tampoco data.user");
                setError("No se pudo iniciar sesión. Verifica tu conexión.");
            }
        } catch (err) {
            console.error("Error inesperado en login:", err);
            setError("Ocurrió un error inesperado. Intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-8">
            <div className="space-y-2">
                <h2 className="text-3xl font-black text-white tracking-tight uppercase italic flex items-center gap-3">
                    <div className="h-2 w-8 bg-nutri-brand" />
                    Ingresar
                </h2>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                    Accede a tu cuenta clínica personalizada
                </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
                {error && (
                    <div className="p-4 rounded-2xl bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20 animate-in fade-in slide-in-from-top-2">
                        {error}
                    </div>
                )}

                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Email</Label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-nutri-brand transition-colors" />
                            <Input
                                id="email"
                                type="email"
                                placeholder="tu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="pl-12 h-14 bg-white/5 border-white/10 rounded-2xl text-white font-bold placeholder:text-slate-600 focus:ring-nutri-brand/20 focus:border-nutri-brand transition-all shadow-inner"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between ml-1">
                            <Label htmlFor="password" exports-ignore className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contraseña</Label>
                            <Link href="#" className="text-[10px] text-slate-500 hover:text-nutri-brand font-black uppercase tracking-widest transition-colors">
                                ¿Olvidaste?
                            </Link>
                        </div>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-nutri-brand transition-colors" />
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="pl-12 pr-12 h-14 bg-white/5 border-white/10 rounded-2xl text-white font-bold placeholder:text-slate-600 focus:ring-nutri-brand/20 focus:border-nutri-brand transition-all shadow-inner"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                            >
                                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                            </button>
                        </div>
                    </div>
                </div>

                <Button
                    type="submit"
                    className="w-full h-14 bg-nutri-brand hover:bg-white text-nutri-base font-tech font-black text-sm uppercase tracking-widest rounded-2xl transition-all shadow-[0_10px_30px_rgba(255,122,0,0.2)] hover:scale-[1.02] active:scale-[0.98]"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                            Verificando...
                        </>
                    ) : (
                        "Iniciar Sesión"
                    )}
                </Button>
            </form>

            <div className="text-center pt-6 relative">
                <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                    ¿Nuevo en NuySa? {" "}
                    <Link href="/register" className="text-white hover:text-nutri-brand font-black transition-colors ml-1">
                        Crea tu perfil
                    </Link>
                </p>
            </div>
        </div>
    );
}
