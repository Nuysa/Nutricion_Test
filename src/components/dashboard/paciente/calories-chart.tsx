"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MoreHorizontal } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

import { createClient } from "@/lib/supabase/client";

export function CaloriesChart() {
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [shouldAnimate, setShouldAnimate] = useState(false);
    const [dailyData, setDailyData] = useState({
        total: 0,
        goal: 2000, // Fixed target for now
        carbs: 0,
        protein: 0,
        fats: 0
    });

    const fetchData = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
            if (!profile) return;
            const { data: patient } = await supabase.from("patients").select("id").eq("profile_id", profile.id).single();
            if (!patient) return;

            const today = new Date().toISOString().split('T')[0];
            const { data: meals } = await supabase
                .from("meals")
                .select("*")
                .eq("patient_id", patient.id)
                .eq("date", today);

            if (meals) {
                const totals = meals.reduce((acc, m) => ({
                    total: acc.total + (Number(m.calories) || 0),
                    carbs: acc.carbs + (Number(m.carbs_g) || 0),
                    protein: acc.protein + (Number(m.protein_g) || 0),
                    fats: acc.fats + (Number(m.fats_g) || 0)
                }), { total: 0, carbs: 0, protein: 0, fats: 0 });

                setDailyData({
                    ...totals,
                    goal: 2000
                });
            }
        } catch (err) {
            console.error("Error fetching calories:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!loading) {
            const timer = setTimeout(() => {
                setShouldAnimate(true);
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [loading]);

    useEffect(() => {
        fetchData();

        const channel = supabase
            .channel('patient_calories_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'meals' }, () => {
                console.log("Realtime: Meals changed, refreshing Calories...");
                fetchData();
            })
            .subscribe();

        const sync = new BroadcastChannel('nutrigo_global_sync');
        sync.onmessage = () => fetchData();

        return () => {
            supabase.removeChannel(channel);
            sync.close();
        };
    }, []);

    return (
        <div className="relative min-h-[380px]">
            {/* Skeleton Overlay */}
            <div
                className={cn(
                    "transition-opacity duration-1000 ease-in-out absolute inset-0 z-10 pointer-events-none",
                    loading ? "opacity-100" : "opacity-0"
                )}
            >
                <Card className="animate-pulse bg-slate-50 h-[380px] rounded-[2.5rem]" />
            </div>

            {/* Actual Content */}
            <div
                className={cn(
                    "transition-all duration-[2000ms] ease-out will-change-[opacity,transform]",
                    loading ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
                )}
            >
                <Card className="rounded-[2.5rem] border border-slate-300 shadow-sm overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                        <CardTitle className="text-base font-semibold">Ingesta Calórica</CardTitle>
                        <button className="p-1 rounded-lg hover:bg-muted transition-colors">
                            <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
                        </button>
                    </CardHeader>
                    <CardContent>
                        <div className="flex gap-6">
                            {/* Donut Chart */}
                            <div className="relative w-40 h-40 flex-shrink-0">
                                <ResponsiveContainer width="100%" height="100%">
                                    {shouldAnimate ? (
                                        <PieChart>
                                            <Pie
                                                data={[
                                                    { name: "Consumidas", value: dailyData.total, color: "#f97316" },
                                                    { name: "Restantes", value: Math.max(0, dailyData.goal - dailyData.total), color: "#e5e7eb" },
                                                ]}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={70}
                                                startAngle={90}
                                                endAngle={-270}
                                                dataKey="value"
                                                strokeWidth={0}
                                                animationDuration={1000}
                                                animationBegin={0}
                                                animationEasing="ease-in-out"
                                            >
                                                <Cell fill="#f97316" />
                                                <Cell fill="#e5e7eb" />
                                            </Pie>
                                        </PieChart>
                                    ) : (
                                        <div />
                                    )}
                                </ResponsiveContainer>
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="text-center">
                                        <span className="text-xl font-bold">{dailyData.total}</span>
                                        <span className="text-xs text-muted-foreground block">kcal</span>
                                    </div>
                                </div>
                            </div>

                            {/* Stats on the right */}
                            <div className="flex-1 space-y-3">
                                <div className="grid grid-cols-2 gap-3">
                                    <div className="p-3 rounded-xl bg-orange-50">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-lg">🔥</span>
                                            <span className="text-lg font-bold">{dailyData.total}</span>
                                            <span className="text-xs text-muted-foreground">kcal</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">Consumidas</p>
                                    </div>
                                    <div className="p-3 rounded-xl bg-sky-50">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-lg">🎯</span>
                                            <span className="text-lg font-bold">{dailyData.goal}</span>
                                            <span className="text-xs text-muted-foreground">kcal</span>
                                        </div>
                                        <p className="text-xs text-muted-foreground mt-0.5">Meta Diaria</p>
                                    </div>
                                </div>

                                {/* Macros breakdown */}
                                <div className="space-y-2.5">
                                    {[
                                        { name: "Carbohidratos", value: dailyData.carbs, color: "#f97316", goal: 250 },
                                        { name: "Proteínas", value: dailyData.protein, color: "#22c55e", goal: 150 },
                                        { name: "Grasas", value: dailyData.fats, color: "#a855f7", goal: 65 },
                                    ].map((macro) => {
                                        const percentage = Math.round((macro.value / macro.goal) * 100);
                                        return (
                                            <div key={macro.name} className="space-y-1">
                                                <div className="flex items-center justify-between text-sm">
                                                    <span className="text-muted-foreground">{macro.name}</span>
                                                    <span className="font-medium">{percentage}%</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <div className="flex-1 h-2 rounded-full bg-muted">
                                                        <div
                                                            className="h-full rounded-full transition-all duration-500"
                                                            style={{
                                                                width: `${Math.min(100, percentage)}%`,
                                                                backgroundColor: macro.color,
                                                            }}
                                                        />
                                                    </div>
                                                    <span className="text-xs text-muted-foreground w-12 text-right">
                                                        {macro.value}g
                                                    </span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
