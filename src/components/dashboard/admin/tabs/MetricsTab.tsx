"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
    Users, Calendar, Activity, DollarSign, TrendingUp, Target, 
    Bell, Check, X, ShieldAlert, BarChart3
} from "lucide-react";
import { GlobalProfile } from "@/lib/messaging-service";
import { cn } from "@/lib/utils";

interface MetricsTabProps {
    profiles: GlobalProfile[];
    allAppointments: any[];
    subscriptions: any[];
    nutritionists: GlobalProfile[];
    pendingNutris: GlobalProfile[];
    assignments: Record<string, string[]>;
}

export function MetricsTab({
    profiles,
    allAppointments,
    subscriptions,
    nutritionists,
    pendingNutris,
    assignments
}: MetricsTabProps) {
    const patients = profiles.filter(p => p.role === "paciente");
    const activeSubs = subscriptions.filter(s => s.status === 'activa');
    const scheduledAppts = allAppointments.filter(a => a.status === 'programada' || a.status === 'confirmada');

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* High Level KPIs */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                    { label: "Total Usuarios", value: profiles.length, sub: "+12% este mes", icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
                    { label: "Citas Activas", value: scheduledAppts.length, sub: "Próximas 72h", icon: Calendar, color: "text-nutrition-500", bg: "bg-nutrition-500/10" },
                    { label: "Sub. Activas", value: activeSubs.length, sub: "Tasa retención 94%", icon: Activity, color: "text-purple-500", bg: "bg-purple-500/10" },
                    { label: "Membresías", value: `S/.${activeSubs.length * 150}`, sub: "Ingreso estimado", icon: DollarSign, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                ].map((kpi, i) => (
                    <Card key={i} className="border-white/5 bg-slate-900/50 backdrop-blur-xl rounded-[2rem] p-6 shadow-2xl relative overflow-hidden group hover:bg-white/[0.05] transition-all">
                        <div className={cn("absolute top-6 right-6 p-3 rounded-2xl", kpi.bg)}>
                            <kpi.icon className={cn("h-5 w-5", kpi.color)} />
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">{kpi.label}</p>
                        <h3 className="text-3xl font-black text-white">{kpi.value}</h3>
                        <p className="text-[10px] font-bold text-slate-400 mt-2 flex items-center gap-1">
                             {kpi.sub}
                        </p>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Workload Distribution */}
                <Card className="lg:col-span-2 rounded-[2.5rem] border-white/5 bg-slate-900/50 backdrop-blur-xl shadow-2xl p-8">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <CardTitle className="text-2xl font-black text-white italic uppercase tracking-tighter flex items-center gap-3">
                                <BarChart3 className="h-6 w-6 text-nutrition-500" /> Rendimiento de Equipo
                            </CardTitle>
                            <CardDescription className="text-slate-500 font-tech uppercase text-[10px] tracking-widest mt-1">Carga de pacientes por especialista</CardDescription>
                        </div>
                        <Badge className="bg-white/5 text-slate-400 border-white/10 font-black px-4 py-1.5 rounded-xl text-[10px] uppercase">Mensual</Badge>
                    </div>

                    <div className="space-y-8">
                        {nutritionists.filter(n => (n as any).status === 'Activo').map((nutri) => {
                            const patientCount = (assignments[nutri.id] || []).length;
                            const percentage = Math.min(100, (patientCount / 15) * 100); 
                            return (
                                <div key={nutri.id} className="space-y-3">
                                    <div className="flex justify-between items-end">
                                        <div className="flex items-center gap-4">
                                            <Avatar className="h-10 w-10 border border-white/10 shadow-xl">
                                                <AvatarFallback className="bg-slate-800 text-[10px] font-black text-white">
                                                    {nutri.name[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-black text-white leading-none uppercase">{nutri.name}</p>
                                                <p className="text-[9px] font-bold text-slate-500 uppercase mt-1 tracking-widest">Nivel: Senior Specialist</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xs font-black text-nutrition-500 leading-none">{patientCount} Pacientes</p>
                                            <p className="text-[8px] text-slate-600 uppercase font-bold mt-1">Capacidad: {percentage.toFixed(0)}%</p>
                                        </div>
                                    </div>
                                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-nutrition-600 to-nutrition-400 rounded-full transition-all duration-1000 shadow-[0_0_10px_rgba(20,184,166,0.3)]"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                        {nutritionists.length === 0 && <p className="text-slate-600 font-black text-center py-10 uppercase text-xs tracking-widest">No hay especialistas operativos</p>}
                    </div>
                </Card>

                {/* System Alerts & Insights */}
                <div className="space-y-6">
                    <Card className="rounded-[2.5rem] border-none bg-gradient-to-br from-nutrition-600 to-nutrition-800 text-white p-8 shadow-2xl relative overflow-hidden group">
                        <div className="absolute -bottom-10 -right-10 opacity-10 group-hover:scale-110 transition-transform duration-700">
                            <Target className="h-40 w-40" />
                        </div>
                        <h4 className="text-xl font-black uppercase italic tracking-tighter mb-2">Meta de Crecimiento</h4>
                        <p className="text-white/60 text-[10px] font-black uppercase tracking-widest mb-8">Nuevos pacientes este mes</p>
                        
                        <div className="space-y-4 relative z-10">
                            <div className="flex items-center justify-between text-[11px] font-black">
                                <span className="uppercase italic">Progreso</span>
                                <span>{patients.length} / 250</span>
                            </div>
                            <div className="h-3 w-full bg-black/20 rounded-full backdrop-blur-md overflow-hidden">
                                <div 
                                    className="h-full bg-white rounded-full transition-all duration-1000" 
                                    style={{ width: `${(patients.length / 250) * 100}%` }} 
                                />
                            </div>
                            <p className="text-[9px] font-bold text-white/50 text-center uppercase tracking-tighter pt-2">Faltan {(250 - patients.length)} para el objetivo trimestral</p>
                        </div>
                    </Card>

                    <Card className="rounded-[2.5rem] border-white/5 bg-slate-900/50 backdrop-blur-xl shadow-2xl p-8 space-y-6">
                        <h4 className="font-black text-white text-xs uppercase tracking-widest flex items-center gap-2">
                            <ShieldAlert className="h-4 w-4 text-amber-500" /> Alertas Críticas
                        </h4>
                        <div className="space-y-3">
                            {pendingNutris.length > 0 && (
                                <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500">
                                    <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
                                    <p className="text-[10px] font-black uppercase tracking-tighter">{pendingNutris.length} Especialistas esperando verificación.</p>
                                </div>
                            )}
                            {patients.length > Object.values(assignments).flat().length && (
                                <div className="flex items-center gap-3 p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-500">
                                    <Bell className="h-4 w-4 animate-bounce" />
                                    <p className="text-[10px] font-black uppercase tracking-tighter">
                                        Hay pacientes sin profesional asignado.
                                    </p>
                                </div>
                            )}
                            <div className="flex items-center gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5 text-slate-500">
                                <Check className="h-4 w-4 text-nutrition-500" />
                                <p className="text-[10px] font-black uppercase tracking-tighter">Núcleo de Datos Sincronizado</p>
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        </div>
    );
}
