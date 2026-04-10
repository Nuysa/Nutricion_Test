"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
    Users, CalendarDays, ClipboardList, TrendingUp,
    ArrowUpRight,
} from "lucide-react";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    ResponsiveContainer, Tooltip, LineChart, Line,
} from "recharts";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function NutritionistDashboard() {
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalPatients: 0,
        dailyAppointments: 0,
        activePlans: 0,
        avgProgress: 0
    });
    const supabase = createClient();

    const loadData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Obtener perfil de nutricionista
            const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
            if (!profile) return;

            // 2. Traer pacientes asignados
            const { data: assignedPatients } = await supabase
                .from("patients")
                .select("*, profile:profiles!profile_id(*)")
                .eq("nutritionist_id", profile.id);

            if (assignedPatients) {
                // 3. Traer citas de hoy
                const today = new Date().toISOString().split('T')[0];
                const { count: dailyAppts } = await supabase
                    .from("appointments")
                    .select("*", { count: 'exact', head: true })
                    .eq("nutritionist_id", profile.id)
                    .eq("appointment_date", today);

                setPatients(assignedPatients);
                setStats({
                    totalPatients: assignedPatients.length,
                    dailyAppointments: dailyAppts || 0,
                    activePlans: assignedPatients.filter(p => p.profile?.status === "Activo").length,
                    avgProgress: 0
                });
            }
        } catch (error) {
            console.error("Error loading nutritionist data:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();

        // 1. Supabase Realtime
        const channel = supabase
            .channel('nutritionist_dashboard_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => {
                console.log("Realtime: Patients changed, refreshing...");
                loadData();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
                console.log("Realtime: Appointments changed, refreshing...");
                loadData();
            })
            .subscribe();

        // 2. Local Sync
        const sync = new BroadcastChannel('nutrigo_global_sync');
        sync.onmessage = () => loadData();

        return () => {
            supabase.removeChannel(channel);
            sync.close();
        };
    }, []);

    const statsCards = [
        { label: "Total Pacientes", value: stats.totalPatients.toString(), change: "Asignados en Supabase", icon: Users, color: "bg-nutrition-50 text-nutrition-600" },
        { label: "Citas Hoy", value: stats.dailyAppointments.toString(), change: "Sincronizado", icon: CalendarDays, color: "bg-orange-50 text-orange-500" },
        { label: "Planes Activos", value: stats.activePlans.toString(), change: "Cumplimiento Real", icon: ClipboardList, color: "bg-sky-50 text-sky-500" },
        { label: "Progreso Promedio", value: `${stats.avgProgress}%`, change: "Meta Estimada", icon: TrendingUp, color: "bg-purple-50 text-purple-500" },
    ];

    if (loading) return (
        <div className="h-96 flex items-center justify-center">
            <div className="animate-spin h-10 w-10 border-4 border-nutrition-600 border-t-transparent rounded-full" />
        </div>
    );

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                {statsCards.map((stat) => (
                    <Card key={stat.label} className="card-hover">
                        <CardContent className="p-3 sm:p-4">
                            <div className="flex items-start justify-between">
                                <div className="min-w-0">
                                    <p className="text-[10px] sm:text-sm text-muted-foreground truncate">{stat.label}</p>
                                    <p className="text-xl sm:text-2xl font-bold mt-1">{stat.value}</p>
                                    <span className="text-[9px] sm:text-xs text-nutrition-600 font-medium flex items-center gap-0.5 mt-1">
                                        <ArrowUpRight className="h-3 w-3" /> {stat.change}
                                    </span>
                                </div>
                                <div className={`p-2 rounded-xl ${stat.color}`}>
                                    <stat.icon className="h-5 w-5" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-bold text-slate-700">Citas de la Semana</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-52">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={[{ day: "Hoy", count: stats.dailyAppointments }]}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                    <XAxis dataKey="day" axisLine={false} tickLine={false} />
                                    <YAxis allowDecimals={false} axisLine={false} tickLine={false} />
                                    <Tooltip />
                                    <Bar dataKey="count" fill="#22c55e" radius={[6, 6, 0, 0]} barSize={32} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle className="text-base font-bold text-slate-700">Progreso Clínico Global</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-52">
                            <ResponsiveContainer width="100%" height="100%">
                                <LineChart data={[{ week: "Actual", avg: stats.avgProgress }]}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                    <XAxis dataKey="week" axisLine={false} tickLine={false} />
                                    <YAxis domain={[0, 100]} axisLine={false} tickLine={false} />
                                    <Tooltip />
                                    <Line type="monotone" dataKey="avg" stroke="#f97316" strokeWidth={3} />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="shadow-lg bg-gradient-to-br from-nutrition-600 to-nutrition-700 text-white overflow-hidden relative group">
                <CardContent className="p-4 sm:p-8 relative z-10 sm:text-left flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-8">
                    <div className="space-y-2">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white text-[10px] font-black uppercase tracking-widest">
                            Base de Datos Real
                        </div>
                        <h3 className="text-xl sm:text-2xl font-black tracking-tight">Gestión de Pacientes</h3>
                        <p className="text-nutrition-50 text-sm max-w-lg font-medium opacity-90 leading-relaxed">
                            Ahora todos los pacientes mostrados aquí están vinculados directamente a tu ID de nutricionista en Supabase.
                        </p>
                    </div>
                    <Link href="/dashboard/nutricionista/patients">
                        <Button className="bg-white text-nutrition-700 hover:bg-slate-50 border-none px-6 sm:px-10 py-5 sm:py-7 rounded-xl sm:rounded-2xl font-black text-sm sm:text-lg shadow-2xl shadow-black/20 group-hover:scale-105 transition-transform w-full sm:w-auto">
                            Acceder al Listado
                            <ArrowUpRight className="ml-2 h-6 w-6" />
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    );
}
