"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Eye,
    EyeOff,
    Loader2,
    Mail,
    Lock,
    ShieldAlert,
    CheckCircle2,
    Send,
    HelpCircle,
    KeyRound,
    ArrowLeft
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { PasswordRequestService } from "@/lib/password-request-service";

export default function LoginPage() {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    // Modal de Recuperación / Solicitud a Admin Root
    const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
    const [recoveryMode, setRecoveryMode] = useState<"standard" | "admin_request">("standard");
    const [recoveryEmail, setRecoveryEmail] = useState("");
    const [recoveryNote, setRecoveryNote] = useState("");
    const [recoveryLoading, setRecoveryLoading] = useState(false);
    const [recoveryStatus, setRecoveryStatus] = useState<{
        type: "success" | "error";
        message: string;
    } | null>(null);

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

    // Envío de correo de recuperación estándar de Supabase
    const handleSendStandardRecovery = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!recoveryEmail) return;

        setRecoveryLoading(true);
        setRecoveryStatus(null);

        try {
            const supabase = createClient();
            const { error: resetErr } = await supabase.auth.resetPasswordForEmail(recoveryEmail, {
                redirectTo: `${window.location.origin}/dashboard`
            });

            if (resetErr) {
                throw resetErr;
            }

            setRecoveryStatus({
                type: "success",
                message: `Se ha enviado el enlace de restablecimiento a ${recoveryEmail}. Revisa tu bandeja de entrada.`
            });
        } catch (err: any) {
            setRecoveryStatus({
                type: "error",
                message: err.message || "No se pudo enviar el correo de recuperación."
            });
        } finally {
            setRecoveryLoading(false);
        }
    };

    // Envío de solicitud directa al Administrador Root (cuenta con correo ficticio)
    const handleSendAdminRequest = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!recoveryEmail) {
            setRecoveryStatus({
                type: "error",
                message: "Por favor indica tu correo ficticio o registrado."
            });
            return;
        }

        setRecoveryLoading(true);
        setRecoveryStatus(null);

        try {
            await PasswordRequestService.createRequest({
                email: recoveryEmail,
                note: recoveryNote
            });

            setRecoveryStatus({
                type: "success",
                message: "¡Solicitud enviada con éxito! El Administrador Root generará un enlace único con el que podrás ingresar y renovar tu contraseña de forma segura."
            });
        } catch (err: any) {
            console.error("Error al enviar solicitud al admin:", err);
            setRecoveryStatus({
                type: "error",
                message: err.message || "No se pudo enviar la solicitud. Intenta nuevamente."
            });
        } finally {
            setRecoveryLoading(false);
        }
    };

    const openRecoveryModal = () => {
        setRecoveryEmail(email || "");
        setRecoveryNote("");
        setRecoveryStatus(null);
        setRecoveryMode("standard");
        setIsForgotModalOpen(true);
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
                            <Label htmlFor="password" className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Contraseña</Label>
                            <button
                                type="button"
                                onClick={openRecoveryModal}
                                className="text-[10px] text-slate-500 hover:text-nutri-brand font-black uppercase tracking-widest transition-colors cursor-pointer"
                            >
                                ¿Olvidaste tu contraseña?
                            </button>
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

            {/* MODAL RECUPERACIÓN / SOLICITUD A ADMIN ROOT */}
            <Dialog open={isForgotModalOpen} onOpenChange={setIsForgotModalOpen}>
                <DialogContent className="rounded-[2.5rem] max-w-lg bg-nutri-base border border-white/10 text-white p-0 overflow-hidden font-tech shadow-2xl">
                    <div className="p-8 space-y-6">
                        <DialogHeader className="space-y-2 text-left">
                            <div className="flex items-center justify-between">
                                <DialogTitle className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                                    <div className="h-2 w-8 bg-nutri-brand" />
                                    {recoveryMode === "standard" ? "Recuperar Contraseña" : "Solicitud a Admin Root"}
                                </DialogTitle>
                            </div>
                            <DialogDescription className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                {recoveryMode === "standard"
                                    ? "Recibe instrucciones en tu correo o contacta al administrador"
                                    : "Para cuentas registradas con correo ficticio o de prueba"}
                            </DialogDescription>
                        </DialogHeader>

                        {/* Mensajes de Estado */}
                        {recoveryStatus && (
                            <div className={`p-4 rounded-2xl text-xs font-bold border flex items-start gap-3 ${
                                recoveryStatus.type === "success"
                                    ? "bg-green-500/10 text-green-400 border-green-500/20"
                                    : "bg-red-500/10 text-red-400 border-red-500/20"
                            }`}>
                                {recoveryStatus.type === "success" ? (
                                    <CheckCircle2 className="h-5 w-5 shrink-0 mt-0.5 text-green-400" />
                                ) : (
                                    <ShieldAlert className="h-5 w-5 shrink-0 mt-0.5 text-red-400" />
                                )}
                                <div className="flex-1 leading-relaxed">
                                    {recoveryStatus.message}
                                </div>
                            </div>
                        )}

                        {recoveryMode === "standard" ? (
                            <form onSubmit={handleSendStandardRecovery} className="space-y-5">
                                <div className="space-y-2">
                                    <Label htmlFor="recovery-email" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                        Correo Electrónico de tu cuenta
                                    </Label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-nutri-brand transition-colors" />
                                        <Input
                                            id="recovery-email"
                                            type="email"
                                            placeholder="tu@email.com"
                                            value={recoveryEmail}
                                            onChange={(e) => setRecoveryEmail(e.target.value)}
                                            className="pl-12 h-14 bg-white/5 border-white/10 rounded-2xl text-white font-bold placeholder:text-slate-600 focus:ring-nutri-brand/20 focus:border-nutri-brand transition-all"
                                            required
                                        />
                                    </div>
                                    <p className="text-[10px] text-slate-500 font-bold ml-1">
                                        Te enviaremos un correo con el enlace para restablecer tu contraseña.
                                    </p>
                                </div>

                                <Button
                                    type="submit"
                                    className="w-full h-14 bg-nutri-brand hover:bg-white text-nutri-base font-tech font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg"
                                    disabled={recoveryLoading}
                                >
                                    {recoveryLoading ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Enviando correo...
                                        </>
                                    ) : (
                                        <>
                                            <Send className="mr-2 h-4 w-4" /> Enviar Enlace a mi Correo
                                        </>
                                    )}
                                </Button>

                                {/* Banner para usuarios con correo ficticio */}
                                <div className="mt-4 p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-3">
                                    <div className="flex items-start gap-3">
                                        <HelpCircle className="h-5 w-5 text-nutri-brand shrink-0 mt-0.5" />
                                        <div>
                                            <h4 className="text-xs font-black uppercase text-white">¿Creaste tu cuenta con un correo ficticio?</h4>
                                            <p className="text-[10px] text-slate-400 font-bold leading-relaxed mt-1">
                                                Si no tienes acceso a la bandeja de entrada o creaste tu cuenta con un correo temporal/ficticio, puedes enviar una solicitud directa al Administrador Root con la contraseña deseada para que te la brinde.
                                            </p>
                                        </div>
                                    </div>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setRecoveryMode("admin_request");
                                            setRecoveryStatus(null);
                                        }}
                                        className="w-full rounded-xl border-nutri-brand/30 bg-nutri-brand/10 text-nutri-brand hover:bg-nutri-brand hover:text-nutri-base text-[10px] font-black uppercase tracking-widest h-11 transition-all"
                                    >
                                        <KeyRound className="mr-2 h-4 w-4" />
                                        Solicitar Enlace de Renovación al Administrador Root
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            /* Modo: Solicitud directa al Administrador Root */
                            <form onSubmit={handleSendAdminRequest} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="admin-req-email" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                        Correo Ficticio / Usuario Registrado
                                    </Label>
                                    <div className="relative group">
                                        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-nutri-brand transition-colors" />
                                        <Input
                                            id="admin-req-email"
                                            type="text"
                                            placeholder="ej: usuario@ficticio.com"
                                            value={recoveryEmail}
                                            onChange={(e) => setRecoveryEmail(e.target.value)}
                                            className="pl-12 h-14 bg-white/5 border-white/10 rounded-2xl text-white font-bold placeholder:text-slate-600 focus:ring-nutri-brand/20 focus:border-nutri-brand transition-all"
                                            required
                                        />
                                    </div>
                                </div>

                                <div className="p-3 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                                    <p className="text-[11px] text-slate-300 font-bold leading-relaxed">
                                        Al enviar esta solicitud, el <strong className="text-white">Administrador Root</strong> generará un <strong className="text-nutri-brand">enlace único e intransferible</strong> para ti, con el que podrás ingresar directamente y establecer tu nueva contraseña.
                                    </p>
                                    <p className="text-[10px] text-slate-500 font-bold">
                                        El enlace solo funcionará una única vez y caducará tras su uso.
                                    </p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="recovery-note" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                                        Nota o Nombre de Identificación (Opcional)
                                    </Label>
                                    <Input
                                        id="recovery-note"
                                        type="text"
                                        placeholder="Ej: Soy Juan Pérez, perdí acceso a mi cuenta"
                                        value={recoveryNote}
                                        onChange={(e) => setRecoveryNote(e.target.value)}
                                        className="h-12 bg-white/5 border-white/10 rounded-xl text-white font-bold placeholder:text-slate-600"
                                    />
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => {
                                            setRecoveryMode("standard");
                                            setRecoveryStatus(null);
                                        }}
                                        className="h-14 px-5 rounded-2xl border-white/10 bg-white/5 text-slate-400 hover:text-white text-xs font-black uppercase tracking-widest"
                                    >
                                        <ArrowLeft className="h-4 w-4 mr-2" /> Volver
                                    </Button>

                                    <Button
                                        type="submit"
                                        className="flex-1 h-14 bg-nutri-brand hover:bg-white text-nutri-base font-tech font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg"
                                        disabled={recoveryLoading}
                                    >
                                        {recoveryLoading ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Enviando al Admin Root...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="mr-2 h-4 w-4" /> Enviar al Admin Root
                                            </>
                                        )}
                                    </Button>
                                </div>
                            </form>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
