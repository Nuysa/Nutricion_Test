"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Check, ArrowRight, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";

export function SubscriptionInfo() {
    const supabase = createClient();
    const [planData, setPlanData] = useState<{
        name: string;
        price: string;
        period: string;
        benefits: string[];
        status: string;
    } | null>(null);
    const [loading, setLoading] = useState(true);
    const [subscriptionsCount, setSubscriptionsCount] = useState(0);
    const [measurementsLimit, setMeasurementsLimit] = useState<number | null>(null);
    const [measurementsUsed, setMeasurementsUsed] = useState(0);

    useEffect(() => {
        const fetchPlan = async () => {
            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id')
                    .eq('user_id', user.id)
                    .single();

                if (!profile) return;

                const { data: patient } = await supabase
                    .from('patients')
                    .select('id')
                    .eq('profile_id', profile.id)
                    .single();

                if (!patient) return;

                const { data: sub } = await supabase
                    .from('subscriptions')
                    .select('*, plan:subscription_plans(*)')
                    .eq('patient_id', profile.id)
                    .eq('status', 'activa')
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                let currentLimit = null;
                let subStartDate = null;

                if (sub) {
                    currentLimit = sub.plan?.included_measurements || null;
                    subStartDate = sub.created_at;

                    const planName = sub.plan?.name_es || "Plan Activo";
                    const planPrice = sub.plan?.price_pen || "0";
                    const isYearly = sub.plan?.duration_months === 12;

                    setPlanData({
                        name: planName,
                        price: `S/${planPrice}`,
                        period: isYearly ? "Por año" : "Por mes",
                        benefits: sub.plan?.benefits || [],
                        status: "Activa"
                    });
                } else {
                    setPlanData({
                        name: "Sin Plan Activo",
                        price: "S/0",
                        period: "N/A",
                        benefits: ["Contáctanos para activar un plan"],
                        status: "Pendiente"
                    });
                }

                setMeasurementsLimit(currentLimit);

                const { count: totalSubs } = await supabase
                    .from('subscriptions')
                    .select('*', { count: 'exact', head: true })
                    .eq('patient_id', profile.id);

                setSubscriptionsCount(totalSubs || 0);

                // Count measurements since sub start
                let mQuery = supabase
                    .from('weight_records')
                    .select('*', { count: 'exact', head: true })
                    .eq('patient_id', patient.id);

                if (subStartDate) {
                    mQuery = mQuery.gte('created_at', subStartDate);
                }

                const { count: mCount } = await mQuery;
                setMeasurementsUsed(mCount || 0);

                // If limit reached, we should ideally handle the "Sin Plan" label
                // But for now we just show the count.
            } catch (err) {
                console.error("Error fetching subscription:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchPlan();

        // 1. Supabase Realtime
        const channel = supabase
            .channel('patient_subscription_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions' }, () => {
                console.log("Realtime: Subscription changed, refreshing...");
                fetchPlan();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'subscription_offers' }, () => {
                console.log("Realtime: Offers changed, refreshing...");
                fetchPlan();
            })
            .subscribe();

        // 2. Local Sync
        const bc = new BroadcastChannel('nutrigo_global_sync');
        bc.onmessage = (msg) => {
            if (msg.data.type === 'SUBSCRIPTION_UPDATED') fetchPlan();
            else fetchPlan(); // General sync
        };

        return () => {
            supabase.removeChannel(channel);
            bc.close();
        };
    }, []);

    if (loading) return <Card className="h-64 animate-pulse bg-white/5 border border-white/10 rounded-[2.5rem]" />;
    if (!planData) return null;

    const currentPlanData = planData;
    const isPremium = planData.name.toLowerCase().includes('premium') || planData.name.toLowerCase().includes('elite');

    return (
        <Card className={cn(
            "flex flex-col h-full relative group overflow-hidden transition-all duration-500 rounded-[2.5rem] border shadow-2xl",
            isPremium
                ? "bg-nutri-panel text-white border-white/10 shadow-nutrition-500/10"
                : "bg-nutri-base text-white border-white/5"
        )}>
            {/* Professional Background Pattern */}
            <div className="absolute inset-0 opacity-10 pointer-events-none overflow-hidden">
                <div className={cn(
                    "absolute -top-24 -right-24 w-64 h-64 rounded-full blur-[100px]",
                    isPremium ? "bg-nutrition-400" : "bg-nutrition-200"
                )} />
                <div className={cn(
                    "absolute -bottom-24 -left-24 w-64 h-64 rounded-full blur-[100px]",
                    isPremium ? "bg-nutrition-600" : "bg-nutrition-300"
                )} />
            </div>

            <CardHeader className={cn(
                "relative pb-4 space-y-4 mx-6 px-0 border-b",
                isPremium ? "border-white/10" : "border-white/5"
            )}>
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                        <div className={cn(
                            "p-1.5 rounded-lg",
                            isPremium ? "bg-nutrition-500" : "bg-white/5 border border-white/10"
                        )}>
                            <Crown className={cn(
                                "h-4 w-4",
                                isPremium ? "text-white fill-white" : "text-slate-400"
                            )} />
                        </div>
                        <span className={cn(
                            "text-[10px] uppercase font-black tracking-[0.3em]",
                            (isPremium && (measurementsLimit === null || measurementsUsed < measurementsLimit)) ? "text-nutrition-300" : "text-slate-400"
                        )}>
                            Membresía {(measurementsLimit !== null && measurementsUsed >= measurementsLimit) ? "Plan Agotado" : planData.name}
                        </span>
                    </div>
                    <Badge variant="outline" className={cn(
                        "text-[10px] px-3 border-none",
                        (isPremium && (measurementsLimit === null || measurementsUsed < measurementsLimit))
                            ? "bg-nutrition-500/10 text-nutrition-300"
                            : "bg-white/5 text-slate-400 border border-white/10"
                    )}>
                        {(measurementsLimit !== null && measurementsUsed >= measurementsLimit) ? "Vencido" : (planData.status || "Activa")}
                    </Badge>
                </div>

                <div className="space-y-1">
                    <CardTitle className="text-2xl font-black tracking-tight text-white">
                        {(measurementsLimit !== null && measurementsUsed >= measurementsLimit) ? "Sin Plan Activo" : planData.name}
                    </CardTitle>
                    <div className="flex items-center justify-between">
                        <div className="flex items-baseline gap-2">
                            <span className={cn(
                                "font-black text-lg",
                                (isPremium && (measurementsLimit === null || measurementsUsed < measurementsLimit)) ? "text-nutrition-400" : "text-nutrition-500"
                            )}>{(measurementsLimit !== null && measurementsUsed >= measurementsLimit) ? "S/0" : planData.price}</span>
                            <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{(measurementsLimit !== null && measurementsUsed >= measurementsLimit) ? "N/A" : planData.period}</span>
                        </div>
                        {measurementsLimit !== null ? (
                            <Badge className={cn(
                                "border-none font-black text-[10px] px-3",
                                measurementsUsed >= measurementsLimit ? "bg-red-500/10 text-red-500" : "bg-nutrition-500/10 text-nutrition-400"
                            )}>
                                {measurementsUsed} de {measurementsLimit} Mediciones
                            </Badge>
                        ) : (
                            <Badge className="bg-white/5 text-slate-500 border-none font-black text-[10px] px-3">
                                0 / 0 Mediciones
                            </Badge>
                        )}
                    </div>
                </div>
            </CardHeader>

            <CardContent className="relative flex-1 flex flex-col py-6 px-6">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-6">Privilegios del Plan</p>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-y-4 gap-x-6 mb-8">
                    {planData.benefits.map((benefit, i) => (
                        <div key={i} className="flex items-start gap-3 group/item">
                            <div className={cn(
                                "mt-0.5 h-4 w-4 rounded-full flex items-center justify-center flex-shrink-0 transition-colors",
                                isPremium ? "bg-nutrition-500/20" : "bg-white/5 border border-white/10"
                            )}>
                                <Check className={cn(
                                    "h-2.5 w-2.5",
                                    isPremium ? "text-nutrition-400 group-hover/item:text-white" : "text-slate-500"
                                )} />
                            </div>
                            <span className={cn(
                                "text-sm font-bold transition-colors leading-tight",
                                isPremium ? "text-slate-300 group-hover/item:text-white" : "text-slate-600"
                            )}>
                                {benefit}
                            </span>
                        </div>
                    ))}
                </div>

                <div className={cn(
                    "mt-auto pt-6 border-t flex items-center justify-between",
                    isPremium ? "border-white/10" : "border-white/5"
                )}>
                    <div className="flex items-center gap-3">
                        <div className="flex -space-x-4">
                            {[...Array(Math.min(subscriptionsCount, 3))].map((_, i) => (
                                <div key={i} className={cn(
                                    "h-10 w-10 rounded-full border-2 bg-gradient-to-br flex items-center justify-center text-[10px] font-black shadow-xl transition-transform hover:translate-y-[-2px]",
                                    isPremium
                                        ? "from-nutrition-500 to-nutrition-600 border-[#0a1a15] text-white"
                                        : "from-slate-700 to-slate-900 border-nutri-base text-slate-300"
                                )}>
                                    {i + 1}
                                </div>
                            ))}
                            {subscriptionsCount > 3 && (
                                <div className={cn(
                                    "h-10 w-10 rounded-full border-2 bg-slate-800 flex items-center justify-center text-[10px] font-black border-nutri-base text-nutrition-400 shadow-xl",
                                    isPremium ? "border-[#0a1a15]" : ""
                                )}>
                                    +{subscriptionsCount - 3}
                                </div>
                            )}
                            {subscriptionsCount === 0 && (
                                <div className="h-10 w-10 rounded-full border-2 border-dashed border-white/10 flex items-center justify-center text-[8px] font-black text-slate-600">
                                    0
                                </div>
                            )}
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[10px] font-black text-white leading-none">{subscriptionsCount}</span>
                            <span className="text-[8px] font-bold text-slate-500 uppercase tracking-tighter">Planes Activados</span>
                        </div>
                    </div>
                    <Link href="/dashboard/paciente/subscription">
                        <button className={cn(
                            "flex items-center gap-2 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest transition-all shadow-lg active:scale-95",
                            isPremium
                                ? "bg-white text-black hover:bg-nutrition-50"
                                : "bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10"
                        )}>
                            Gestionar Plan
                            <ArrowRight className="h-3 w-3" />
                        </button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
