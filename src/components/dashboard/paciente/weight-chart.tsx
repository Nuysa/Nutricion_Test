"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoreHorizontal } from "lucide-react";
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    ResponsiveContainer,
    Tooltip,
} from "recharts";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export function WeightChart() {
    const [data, setData] = useState<any[]>([]);
    const [stats, setStats] = useState({
        current: 0,
        initial: 0,
        goal: 0
    });
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    async function fetchWeightHistory() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
            if (!profile) return;

            const { data: patientData } = await supabase
                .from("patients")
                .select("id, goal_weight, current_weight")
                .eq("profile_id", profile.id)
                .single();
            if (!patientData) return;

            const { data: records, error } = await supabase
                .from("weight_records")
                .select("date, weight")
                .eq("patient_id", patientData.id)
                .order("date", { ascending: true });

            if (error) throw error;

            if (records && records.length > 0) {
                const chartData = records.map(r => ({
                    date: new Date(r.date + 'T12:00:00').toLocaleDateString('es-ES', { month: 'short' }),
                    weight: r.weight
                }));
                setData(chartData);

                const current = records[records.length - 1].weight;
                const initial = records[0].weight || patientData.current_weight || current;

                setStats({
                    current,
                    initial,
                    goal: patientData.goal_weight || 0
                });
            } else {
                const initial = patientData.current_weight || 0;
                setStats({
                    current: initial,
                    initial: initial,
                    goal: patientData.goal_weight || 0
                });
                setData([]);
            }
        } catch (err) {
            console.error("Error fetching weight history:", err);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchWeightHistory();

        // 1. Supabase Realtime
        const channel = supabase
            .channel('patient_weight_chart_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => {
                console.log("Realtime: Patient goal changed, refreshing Weight Chart...");
                fetchWeightHistory();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'weight_records' }, () => {
                console.log("Realtime: New measurement, refreshing Weight Chart...");
                fetchWeightHistory();
            })
            .subscribe();

        // 2. Local Sync
        const sync = new BroadcastChannel('nutrigo_global_sync');
        sync.onmessage = () => fetchWeightHistory();

        return () => {
            supabase.removeChannel(channel);
            sync.close();
        };
    }, []);

    const remaining = stats.goal > 0 ? (stats.current - stats.goal).toFixed(1) : "--";

    return (
        <Card className="rounded-[2.5rem] border border-slate-300 shadow-sm overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div>
                    <CardTitle className="text-base font-semibold">Datos de Peso</CardTitle>
                </div>
                <button className="p-1 rounded-lg hover:bg-muted transition-colors">
                    <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                </button>
            </CardHeader>
            <CardContent>
                <div className="flex items-center gap-6 mb-6">
                    <div className="relative">
                        <div className="h-28 w-28 rounded-full border-[6px] border-nutrition-400 flex items-center justify-center">
                            <div className="text-center">
                                <span className="text-2xl font-bold">{stats.current || "--"}</span>
                                <span className="text-sm text-muted-foreground block">kg</span>
                            </div>
                        </div>
                    </div>
                    <div className="space-y-1">
                        <p className="text-sm text-muted-foreground">Peso Actual</p>
                        <div className="flex items-center gap-4 text-sm">
                            <span className="flex items-center gap-1">
                                <span className="h-2 w-2 rounded-full bg-nutrition-400"></span>
                                {stats.initial} <span className="text-muted-foreground">Inicio</span>
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="h-2 w-2 rounded-full bg-orange-400"></span>
                                {remaining} kg <span className="text-muted-foreground">restantes</span>
                            </span>
                            <span className="flex items-center gap-1">
                                <span className="h-2 w-2 rounded-full bg-sky-400"></span>
                                {stats.goal || "--"} <span className="text-muted-foreground">Meta</span>
                            </span>
                        </div>
                    </div>
                </div>

                <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data.length > 0 ? data : [{ date: '', weight: stats.current }]}>
                            <defs>
                                <linearGradient id="weightGradient" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                            <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9ca3af" }} />
                            <YAxis domain={['dataMin - 5', 'dataMax + 5']} axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#9ca3af" }} />
                            <Tooltip
                                contentStyle={{
                                    borderRadius: "12px",
                                    border: "none",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                    padding: "8px 12px",
                                }}
                                formatter={(value: number) => [`${value} kg`, "Peso"]}
                            />
                            <Area
                                type="monotone"
                                dataKey="weight"
                                stroke="#22c55e"
                                fill="url(#weightGradient)"
                                strokeWidth={2.5}
                                dot={{ r: 4, fill: "#22c55e", strokeWidth: 2, stroke: "#fff" }}
                                activeDot={{ r: 6, fill: "#22c55e", strokeWidth: 2, stroke: "#fff" }}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
