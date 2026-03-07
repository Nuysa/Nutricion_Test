"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Loader2, Mail, Lock, User, Stethoscope, UserCheck, Check } from "lucide-react";
import { cn } from "@/lib/utils";

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

            setSuccess(true);
        } catch {
            setError("Ocurrió un error inesperado. Intenta de nuevo.");
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="text-center space-y-6 animate-in zoom-in-95 duration-500">
                <div className="mx-auto h-24 w-24 rounded-[2.5rem] bg-nutri-brand/10 border border-nutri-brand/20 flex items-center justify-center p-6 shadow-[0_0_50px_rgba(255,122,0,0.1)]">
                    <UserCheck className="h-full w-full text-nutri-brand" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-3xl font-black text-white italic uppercase tracking-tighter">¡Casí listo!</h2>
                    <p className="text-slate-400 font-bold text-sm leading-relaxed px-4">
                        Hemos enviado un enlace de confirmación a <span className="text-white">{email}</span>. Únete a la revolución nutricional.
                    </p>
                </div>
                <Button
                    onClick={() => router.push("/login")}
                    className="w-full h-14 bg-white text-nutri-base font-tech font-black uppercase tracking-widest rounded-2xl hover:bg-nutri-brand hover:text-white transition-all"
                >
                    Ir a Iniciar Sesión
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="space-y-2 text-center lg:text-left">
                <h2 className="text-3xl font-black text-white tracking-tight uppercase italic flex items-center justify-center lg:justify-start gap-3">
                    <div className="h-2 w-8 bg-nutri-brand hidden lg:block" />
                    Nueva Cuenta
                </h2>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">
                    Define tu perfil e inicia tu transformación
                </p>
            </div>

            <form onSubmit={handleRegister} className="space-y-6">
                {error && (
                    <div className="p-4 rounded-2xl bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20">
                        {error}
                    </div>
                )}

                {/* Role selection - Premium Style */}
                <div className="space-y-3">
                    <Label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Elegir Rol</Label>
                    <div className="grid grid-cols-2 gap-4">
                        {[
                            { id: "paciente", label: "Paciente", icon: User },
                            { id: "nutricionista", label: "Especialista", icon: Stethoscope },
                        ].map((r) => (
                            <button
                                key={r.id}
                                type="button"
                                onClick={() => setRole(r.id as any)}
                                className={cn(
                                    "flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all relative overflow-hidden group",
                                    role === r.id
                                        ? "border-nutri-brand bg-nutri-brand/10 text-white"
                                        : "border-white/5 bg-white/5 text-slate-500 hover:border-white/10"
                                )}
                            >
                                <r.icon className={cn(
                                    "h-6 w-6 transition-transform group-hover:scale-110",
                                    role === r.id ? "text-nutri-brand" : "text-slate-600"
                                )} />
                                <span className="text-[10px] font-black uppercase tracking-widest">{r.label}</span>
                                {role === r.id && <div className="absolute top-0 right-0 h-6 w-6 bg-nutri-brand flex items-center justify-center rounded-bl-xl"><Check className="h-3 w-3 text-nutri-base" /></div>}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="fullName" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Nombre</Label>
                            <Input
                                id="fullName"
                                placeholder="Nombre completo"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="h-12 bg-white/5 border-white/10 rounded-xl text-white font-bold placeholder:text-slate-600 focus:ring-nutri-brand/20 focus:border-nutri-brand transition-all"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="tu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="h-12 bg-white/5 border-white/10 rounded-xl text-white font-bold placeholder:text-slate-600 focus:ring-nutri-brand/20 focus:border-nutri-brand transition-all"
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="password" exports-ignore className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Contraseña</Label>
                            <Input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                placeholder="Mínimo 6"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="h-12 bg-white/5 border-white/10 rounded-xl text-white font-bold placeholder:text-slate-600 focus:ring-nutri-brand/20 focus:border-nutri-brand transition-all"
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" exports-ignore className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Repetir</Label>
                            <Input
                                id="confirmPassword"
                                type="password"
                                placeholder="Validar"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="h-12 bg-white/5 border-white/10 rounded-xl text-white font-bold placeholder:text-slate-600 focus:ring-nutri-brand/20 focus:border-nutri-brand transition-all"
                                required
                            />
                        </div>
                    </div>
                </div>

                <Button
                    type="submit"
                    className="w-full h-14 bg-nutri-brand hover:bg-white text-nutri-base font-tech font-black text-sm uppercase tracking-widest rounded-2xl transition-all shadow-[0_10px_30px_rgba(255,122,0,0.2)]"
                    disabled={loading}
                >
                    {loading ? (
                        <>
                            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                            Creando...
                        </>
                    ) : (
                        "Registrarme"
                    )}
                </Button>
            </form>

            <div className="text-center pt-4 border-t border-white/5">
                <p className="text-slate-500 text-xs font-bold uppercase tracking-widest">
                    ¿Ya eres miembro? {" "}
                    <Link href="/login" className="text-white hover:text-nutri-brand font-black transition-colors ml-1">
                        Inicia Sesión
                    </Link>
                </p>
            </div>
        </div>
    );
}
