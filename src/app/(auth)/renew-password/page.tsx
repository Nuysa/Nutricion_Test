"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import {
    KeyRound,
    Lock,
    Eye,
    EyeOff,
    CheckCircle2,
    ShieldAlert,
    Loader2,
    ArrowLeft,
    Clock,
    AlertTriangle
} from "lucide-react";
import { PasswordRequestService, PasswordRequestItem } from "@/lib/password-request-service";

function RenewPasswordContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const token = searchParams.get("token") || "";

    const [validating, setValidating] = useState(true);
    const [tokenError, setTokenError] = useState<string | null>(null);
    const [requestData, setRequestData] = useState<PasswordRequestItem | null>(null);

    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [submitting, setSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const [submitSuccess, setSubmitSuccess] = useState(false);

    useEffect(() => {
        const checkToken = async () => {
            if (!token) {
                setTokenError("No se proporcionó ningún token de renovación en el enlace.");
                setValidating(false);
                return;
            }

            try {
                const res = await PasswordRequestService.validateToken(token);
                if (!res.valid) {
                    if (res.reason === "already_used") {
                        setTokenError("Este enlace ya fue utilizado anteriormente y ha caducado por motivos de seguridad.");
                    } else if (res.reason === "expired") {
                        setTokenError("Este enlace de renovación ha caducado (límite de 48 horas). Solicita uno nuevo al administrador.");
                    } else {
                        setTokenError("El enlace de renovación es inválido o no existe en el sistema.");
                    }
                } else if (res.request) {
                    setRequestData(res.request);
                }
            } catch (err: any) {
                console.error("Error al validar token:", err);
                setTokenError("Ocurrió un error al verificar el enlace de renovación.");
            } finally {
                setValidating(false);
            }
        };

        checkToken();
    }, [token]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitError(null);

        if (newPassword.length < 6) {
            setSubmitError("La contraseña debe tener como mínimo 6 caracteres.");
            return;
        }

        if (newPassword !== confirmPassword) {
            setSubmitError("Las contraseñas no coinciden. Por favor verifícalas.");
            return;
        }

        setSubmitting(true);

        try {
            const response = await fetch("/api/auth/renew-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    token,
                    newPassword
                })
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "No se pudo actualizar la contraseña.");
            }

            setSubmitSuccess(true);
        } catch (err: any) {
            console.error("Error al renovar contraseña:", err);
            setSubmitError(err.message || "Error al actualizar la contraseña.");
        } finally {
            setSubmitting(false);
        }
    };

    if (validating) {
        return (
            <div className="py-20 text-center space-y-4">
                <Loader2 className="h-10 w-10 text-nutri-brand animate-spin mx-auto" />
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                    Verificando enlace de renovación...
                </p>
            </div>
        );
    }

    if (tokenError) {
        return (
            <div className="space-y-6 text-center animate-in zoom-in-95 duration-500">
                <div className="mx-auto h-20 w-20 rounded-[2.5rem] bg-red-500/10 border border-red-500/20 flex items-center justify-center p-5 shadow-[0_0_50px_rgba(239,68,68,0.1)]">
                    <ShieldAlert className="h-full w-full text-red-400" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tight">
                        Enlace No Válido o Caducado
                    </h2>
                    <p className="text-slate-400 font-bold text-xs leading-relaxed px-4 max-w-md mx-auto">
                        {tokenError}
                    </p>
                </div>
                <div className="pt-2">
                    <Button
                        onClick={() => router.push("/login")}
                        className="h-14 px-8 bg-white/10 hover:bg-white text-white hover:text-nutri-base font-tech font-black text-xs uppercase tracking-widest rounded-2xl transition-all"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Inicio de Sesión
                    </Button>
                </div>
            </div>
        );
    }

    if (submitSuccess) {
        return (
            <div className="space-y-6 text-center animate-in zoom-in-95 duration-500">
                <div className="mx-auto h-20 w-20 rounded-[2.5rem] bg-green-500/10 border border-green-500/20 flex items-center justify-center p-5 shadow-[0_0_50px_rgba(34,197,94,0.1)]">
                    <CheckCircle2 className="h-full w-full text-green-400" />
                </div>
                <div className="space-y-2">
                    <h2 className="text-2xl font-black text-white italic uppercase tracking-tight">
                        ¡Contraseña Renovada con Éxito!
                    </h2>
                    <p className="text-slate-400 font-bold text-xs leading-relaxed px-4 max-w-md mx-auto">
                        Tu nueva contraseña ha sido establecida y el enlace de renovación ha sido cerrado permanentemente.
                    </p>
                </div>
                <div className="pt-2">
                    <Button
                        onClick={() => router.push("/login")}
                        className="h-14 px-8 bg-nutri-brand hover:bg-white text-nutri-base font-tech font-black text-xs uppercase tracking-widest rounded-2xl transition-all shadow-lg shadow-nutri-brand/20"
                    >
                        Iniciar Sesión Ahora
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div className="space-y-2">
                <h2 className="text-3xl font-black text-white tracking-tight uppercase italic flex items-center gap-3">
                    <div className="h-2 w-8 bg-nutri-brand" />
                    Renovar Contraseña
                </h2>
                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                    Establece tu nueva contraseña segura
                </p>
            </div>

            {/* Tarjeta de información de la solicitud */}
            <div className="p-4 rounded-2xl bg-white/[0.03] border border-white/5 space-y-1">
                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">
                    Cuenta a renovar
                </span>
                <p className="text-sm font-black text-white font-mono">
                    {requestData?.email}
                </p>
                <div className="flex items-center gap-1.5 text-[10px] text-amber-400/90 font-bold pt-1">
                    <Clock className="h-3 w-3" />
                    <span>Este enlace es de uso único y caducará tras completar este formulario.</span>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-5">
                {submitError && (
                    <div className="p-4 rounded-2xl bg-red-500/10 text-red-400 text-xs font-bold border border-red-500/20 flex items-start gap-3">
                        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                        <div className="flex-1">{submitError}</div>
                    </div>
                )}

                <div className="space-y-2">
                    <Label htmlFor="new-password" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Nueva Contraseña
                    </Label>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-nutri-brand transition-colors" />
                        <Input
                            id="new-password"
                            type={showNewPassword ? "text" : "password"}
                            placeholder="Mínimo 6 caracteres"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="pl-12 pr-12 h-14 bg-white/5 border-white/10 rounded-2xl text-white font-bold placeholder:text-slate-600 focus:ring-nutri-brand/20 focus:border-nutri-brand transition-all shadow-inner"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                        >
                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="confirm-password" className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">
                        Confirmar Contraseña
                    </Label>
                    <div className="relative group">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-nutri-brand transition-colors" />
                        <Input
                            id="confirm-password"
                            type={showConfirmPassword ? "text" : "password"}
                            placeholder="Repite la contraseña"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            className="pl-12 pr-12 h-14 bg-white/5 border-white/10 rounded-2xl text-white font-bold placeholder:text-slate-600 focus:ring-nutri-brand/20 focus:border-nutri-brand transition-all shadow-inner"
                            required
                        />
                        <button
                            type="button"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                        >
                            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                    </div>
                </div>

                <Button
                    type="submit"
                    className="w-full h-14 bg-nutri-brand hover:bg-white text-nutri-base font-tech font-black text-sm uppercase tracking-widest rounded-2xl transition-all shadow-[0_10px_30px_rgba(255,122,0,0.2)] hover:scale-[1.02] active:scale-[0.98]"
                    disabled={submitting}
                >
                    {submitting ? (
                        <>
                            <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                            Guardando y Activando...
                        </>
                    ) : (
                        "Establecer Nueva Contraseña"
                    )}
                </Button>
            </form>

            <div className="text-center pt-2">
                <Link
                    href="/login"
                    className="inline-flex items-center text-xs font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                >
                    <ArrowLeft className="mr-2 h-4 w-4" /> Volver al Inicio de Sesión
                </Link>
            </div>
        </div>
    );
}

export default function RenewPasswordPage() {
    return (
        <Suspense fallback={
            <div className="py-20 text-center space-y-4">
                <Loader2 className="h-10 w-10 text-nutri-brand animate-spin mx-auto" />
                <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">
                    Cargando módulo de renovación...
                </p>
            </div>
        }>
            <RenewPasswordContent />
        </Suspense>
    );
}
