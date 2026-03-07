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
                    .select('*, offer:subscription_offers(*)')
                    .eq('patient_id', patient.id)
                    .eq('status', 'active')
                    .maybeSingle();

                if (sub && sub.offer) {
                    setPlanData({
                        name: sub.offer.name,
                        price: `$${sub.offer.price}`,
                        period: sub.offer.duration_days === 365 ? "Por año" : "Por mes",
                        benefits: Array.isArray(sub.offer.features) ? sub.offer.features : [],
                        status: "Activa"
                    });
                } else {
                    // Fallback to basic info if nothing found
                    setPlanData({
                        name: "Sin Plan Activo",
                        price: "$0",
                        period: "N/A",
                        benefits: ["Contáctanos para activar un plan"],
                        status: "Pendiente"
                    });
                }
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
                            isPremium ? "text-nutrition-300" : "text-slate-400"
                        )}>
                            Membresía {planData.name}
                        </span>
                    </div>
                    <Badge variant="outline" className={cn(
                        "text-[10px] px-3 border-none",
                        isPremium
                            ? "bg-nutrition-500/10 text-nutrition-300"
                            : "bg-white/5 text-slate-400 border border-white/10"
                    )}>
                        {planData.status || "Activa"}
                    </Badge>
                </div>

                <div className="space-y-1">
                    <CardTitle className="text-2xl font-black tracking-tight text-white">{planData.name}</CardTitle>
                    <div className="flex items-baseline gap-2">
                        <span className={cn(
                            "font-black text-lg",
                            isPremium ? "text-nutrition-400" : "text-nutrition-500"
                        )}>{planData.price}</span>
                        <span className="text-[10px] text-slate-500 font-black uppercase tracking-widest">{planData.period}</span>
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
                    <div className="flex -space-x-2">
                        {[1, 2, 3].map(i => (
                            <div key={i} className={cn(
                                "h-8 w-8 rounded-full border-2 bg-slate-900 flex items-center justify-center text-[10px] font-black",
                                isPremium ? "border-[#0a1a15]" : "border-nutri-base"
                            )}>
                                {i}
                            </div>
                        ))}
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
