"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { useEffect, Suspense } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Clock, Ban, LogOut, RefreshCcw } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

function PendingApprovalContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const status = searchParams.get("status") || "Pendiente";
    const supabase = createClient();

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
    };

    const checkStatus = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
            .from("profiles")
            .select("role, status")
            .eq("user_id", user.id)
            .single();

        if (profile?.status === "Activo") {
            router.push(`/dashboard/${profile.role}`);
        }
    };

    // Auto-check on mount
    useEffect(() => {
        checkStatus();
    }, []);

    const handleRefresh = async () => {
        await checkStatus();
        // If still not active, we can reload to refresh any URL params or UI
        window.location.reload();
    };

    return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 lg:p-8">
            <Card className="max-w-md w-full rounded-[2.5rem] border-none shadow-2xl overflow-hidden">
                <div className={`h-2 ${status === 'Rechazado' ? 'bg-red-500' : 'bg-amber-500'}`} />
                <CardHeader className="pt-10 pb-6 text-center">
                    <div className={`h-20 w-20 rounded-3xl mx-auto flex items-center justify-center mb-6 shadow-lg ${status === 'Rechazado' ? 'bg-red-50 text-red-500' : 'bg-amber-50 text-amber-500'}`}>
                        {status === 'Rechazado' ? <Ban className="h-10 w-10" /> : <Clock className="h-10 w-10 animate-pulse" />}
                    </div>
                    <CardTitle className="text-2xl font-black text-slate-800 tracking-tight">
                        {status === 'Rechazado' ? 'Cuenta Rechazada' : 'Aprobación Pendiente'}
                    </CardTitle>
                </CardHeader>
                <CardContent className="px-8 pb-10 space-y-8 text-center">
                    <p className="text-slate-500 font-medium leading-relaxed">
                        {status === 'Rechazado'
                            ? 'Lo sentimos, tu solicitud para unirte como nutricionista ha sido rechazada por nuestro equipo administrativo.'
                            : '¡Gracias por registrarte! Tu cuenta de nutricionista está siendo revisada por nuestro equipo. Te notificaremos cuando puedas acceder a todas las funciones.'}
                    </p>

                    <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Estado de tu cuenta</p>
                        <p className={`font-black uppercase tracking-widest ${status === 'Rechazado' ? 'text-red-600' : 'text-amber-600'}`}>
                            {status}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-3 pt-4">
                        {status !== 'Rechazado' && (
                            <Button
                                onClick={handleRefresh}
                                className="h-12 rounded-2xl bg-slate-900 text-white font-black hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center gap-2"
                            >
                                <RefreshCcw className="h-4 w-4" /> Verificar estado ahora
                            </Button>
                        )}
                        <Button
                            variant="ghost"
                            onClick={handleLogout}
                            className="h-12 rounded-2xl text-slate-500 font-black hover:bg-slate-100 flex items-center justify-center gap-2"
                        >
                            <LogOut className="h-4 w-4" /> Cerrar Sesión
                        </Button>
                    </div>

                    <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest pt-4">
                        Sistema de Nutrición IA v1.0
                    </p>
                </CardContent>
            </Card>
        </div>
    );
}

export default function PendingApprovalPage() {
    return (
        <Suspense fallback={<div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 lg:p-8"><div className="h-10 w-10 border-4 border-nutrition-600 border-t-transparent rounded-full animate-spin" /></div>}>
            <PendingApprovalContent />
        </Suspense>
    );
}
