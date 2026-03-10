"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    Users, Calendar, Activity, TrendingUp, Target, DollarSign, BarChart3, Loader2
} from "lucide-react";
import { MessagingService, GlobalProfile } from "@/lib/messaging-service";

export function MetricsView() {
    const [loading, setLoading] = useState(true);
    const [profiles, setProfiles] = useState<GlobalProfile[]>([]);
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [allAppointments, setAllAppointments] = useState<any[]>([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const [fetchedProfiles, fetchedSubs, fetchedAppointments] = await Promise.all([
                    MessagingService.getProfiles(),
                    MessagingService.getAllSubscriptions(),
                    MessagingService.getAllAppointments()
                ]);
                setProfiles(fetchedProfiles || []);
                setSubscriptions(fetchedSubs || []);
                setAllAppointments(fetchedAppointments || []);
            } catch (error) {
                console.error("Error loading metrics data:", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    if (loading) {
        return (
            <div className="py-20 text-center space-y-4">
                <Loader2 className="h-10 w-10 text-nutrition-600 animate-spin mx-auto" />
                <p className="text-slate-400 font-bold tracking-tight">Cargando métricas en tiempo real...</p>
            </div>
        );
    }

    const nutritionists = profiles.filter(p => p.role === 'nutricionista');
    const patients = profiles.filter(p => p.role === 'paciente');

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col gap-2">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight">Panel de Métricas Avanzadas</h2>
                <p className="text-slate-500 font-medium italic">Análisis en tiempo real del crecimiento y rendimiento de la plataforma.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Metric 1: Usuarios */}
                <Card className="rounded-[2.5rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer">
                    <div className="p-7 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-800 text-white h-full relative">
                        <div className="absolute top-5 right-5 bg-white/10 p-2.5 rounded-2xl backdrop-blur-md border border-white/5">
                            <Users className="h-5 w-5 text-white" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Total Usuarios</p>
                        <h3 className="text-4xl font-black">{profiles.length}</h3>
                        <div className="mt-4 flex items-center gap-2">
                            <span className="text-[10px] font-black bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" /> +12%
                            </span>
                            <span className="text-[10px] font-bold text-slate-500">vs mes anterior</span>
                        </div>
                    </div>
                </Card>

                {/* Metric 2: Citas */}
                <Card className="rounded-[2.5rem] border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer">
                    <div className="p-7 bg-white h-full relative">
                        <div className="absolute top-5 right-5 bg-nutrition-50 p-2.5 rounded-2xl text-nutrition-600 border border-nutrition-100/50">
                            <Calendar className="h-5 w-5" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Citas Activas</p>
                        <h3 className="text-4xl font-black text-slate-900">
                            {allAppointments.filter(a => a.status === 'scheduled').length}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 mt-4 flex items-center gap-1.5">
                            <Activity className="h-3 w-3 text-nutrition-500" /> Próximos seguimientos
                        </p>
                    </div>
                </Card>

                {/* Metric 3: Suscripciones */}
                <Card className="rounded-[2.5rem] border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer">
                    <div className="p-7 bg-white h-full relative">
                        <div className="absolute top-5 right-5 bg-amber-50 p-2.5 rounded-2xl text-amber-600 border border-amber-100/50">
                            <Target className="h-5 w-5" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Sub. Activas</p>
                        <h3 className="text-4xl font-black text-slate-900">
                            {subscriptions.filter(s => s.status === 'active').length}
                        </h3>
                        <p className="text-[10px] font-bold text-slate-400 mt-4">Tasa de retención: 94%</p>
                    </div>
                </Card>

                {/* Metric 4: Revenue (Simulated) */}
                <Card className="rounded-[2.5rem] border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer">
                    <div className="p-7 bg-white h-full relative">
                        <div className="absolute top-5 right-5 bg-green-50 p-2.5 rounded-2xl text-green-600 border border-green-100/50">
                            <DollarSign className="h-5 w-5" />
                        </div>
                        <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400 mb-2">Ingresos (Est.)</p>
                        <h3 className="text-4xl font-black text-slate-900">$2.4k</h3>
                        <p className="text-[10px] font-bold text-green-500 mt-4 font-black">Ciclo: Febrero 2024</p>
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Distributions Chart visual */}
                <Card className="lg:col-span-2 rounded-[3rem] border-slate-100 shadow-2xl p-10 bg-white">
                    <div className="flex items-center justify-between mb-10">
                        <div className="space-y-1">
                            <CardTitle className="text-2xl font-black flex items-center gap-3 text-slate-900">
                                <Activity className="h-7 w-7 text-nutrition-600" /> Rendimiento de Especialistas
                            </CardTitle>
                            <CardDescription className="text-slate-400 font-medium">Distribución de carga de trabajo por nutricionista activo.</CardDescription>
                        </div>
                        <Badge className="bg-slate-100 text-slate-600 border-none font-bold px-5 py-2 rounded-2xl">Métrica Semanal</Badge>
                    </div>

                    <div className="space-y-8">
                        {nutritionists.filter(n => (n as any).status === 'Activo').slice(0, 5).map((nutri) => {
                            const patientCount = allAppointments.filter(a => a.nutritionistId === nutri.id && a.status === 'scheduled').length;
                            const percentage = Math.min(100, (patientCount / 10) * 100);
                            return (
                                <div key={nutri.id} className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-12 w-12 border-2 border-slate-50">
                                                <AvatarFallback className="bg-slate-100 text-slate-600 font-black">
                                                    {nutri.name[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-base font-black text-slate-800 leading-none">{nutri.name}</p>
                                                <p className="text-xs font-bold text-slate-400 uppercase mt-1 tracking-wider">Especialista Senior</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-black text-nutrition-600">{patientCount}</p>
                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Citas / Sem</p>
                                        </div>
                                    </div>
                                    <div className="h-2.5 w-full bg-slate-50 rounded-full overflow-hidden border border-slate-100/50">
                                        <div
                                            className="h-full bg-nutrition-600 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(34,197,94,0.3)]"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                        {nutritionists.length === 0 && (
                            <div className="text-center py-10">
                                <Users className="h-10 w-10 text-slate-200 mx-auto mb-3" />
                                <p className="text-slate-400 font-bold">No hay especialistas registrados.</p>
                            </div>
                        )}
                    </div>
                </Card>

                {/* Growth Insights */}
                <Card className="rounded-[3rem] border-none bg-slate-900 text-white p-10 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                    <div className="absolute -bottom-20 -right-20 opacity-10">
                        <BarChart3 className="h-80 w-80" />
                    </div>

                    <div className="relative z-10">
                        <div className="h-14 w-14 rounded-3xl bg-nutrition-600 flex items-center justify-center mb-8 shadow-xl shadow-nutrition-600/20">
                            <TrendingUp className="h-7 w-7 text-white" />
                        </div>
                        <h4 className="text-3xl font-black mb-4 leading-tight">Insight de Crecimiento</h4>
                        <p className="text-slate-400 text-lg font-medium leading-relaxed">
                            El volumen de nuevos pacientes ha aumentado un <span className="text-white font-black">24%</span> en las últimas dos semanas gracias a las promociones de verano.
                        </p>
                    </div>

                    <div className="relative z-10 pt-10 border-t border-white/10 mt-10">
                        <div className="flex items-center justify-between text-sm font-black mb-4">
                            <span>Objetivo Mensual</span>
                            <span className="text-nutrition-500">85%</span>
                        </div>
                        <div className="h-3 w-full bg-white/10 rounded-full overflow-hidden overflow-hidden">
                            <div className="h-full bg-nutrition-600 rounded-full w-[85%] shadow-[0_0_20px_rgba(34,197,94,0.5)]" />
                        </div>
                    </div>
                </Card>
            </div>
        </div>
    );
}
