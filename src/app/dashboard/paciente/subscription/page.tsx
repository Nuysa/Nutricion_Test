"use client";

import { SUBSCRIPTION_PLANS, CURRENT_SUBSCRIPTION_ID } from "@/constants/subscription-data";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Check, Crown, Zap, ShieldCheck, CreditCard, Calendar, ArrowRight, Loader2, Sparkles, Receipt } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { PlansSection } from "@/components/landing/plans-section";

import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface BillItem {
    id: string;
    date: string;
    amount: string;
    status: string;
    plan: string;
}

export default function SubscriptionPage() {
    const supabase = createClient();
    const { toast } = useToast();

    const [currentPlanId, setCurrentPlanId] = useState<string>("");
    const [currentPlanName, setCurrentPlanName] = useState<string>("");

    const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);
    const [selectedUIPlanId, setSelectedUIPlanId] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [isHistoryOpen, setIsHistoryOpen] = useState(false);
    const [isInitialLoading, setIsInitialLoading] = useState(true);
    const [history, setHistory] = useState<BillItem[]>([]);
    const [offers, setOffers] = useState<any[]>([]);

    useEffect(() => {
        const loadData = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) {
                    setIsInitialLoading(false);
                    return;
                }

                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id, patients(id)')
                    .eq('user_id', user.id)
                    .single();

                const patientId = profile?.patients?.[0]?.id;

                if (patientId) {
                    const { data: sub } = await supabase
                        .from('subscriptions')
                        .select('*, plan:subscription_plans(*)')
                        .eq('patient_id', patientId)
                        .eq('status', 'active')
                        .maybeSingle();

                    if (sub) {
                        setCurrentPlanId(sub.plan_id || "manual");
                        setCurrentPlanName(sub.plan?.name_es || "Plan Activo");
                        setSelectedUIPlanId(sub.plan_id || "manual");
                    } else {
                        setCurrentPlanName("Sin Plan Activo");
                        setCurrentPlanId("none");
                    }
                }

                if (patientId) {
                    const { data: invoices } = await supabase
                        .from('invoices')
                        .select('*')
                        .eq('patient_id', patientId)
                        .order('created_at', { ascending: false });

                    if (invoices && invoices.length > 0) {
                        setHistory(invoices.map(inv => ({
                            id: inv.id.slice(0, 8).toUpperCase(),
                            date: new Date(inv.paid_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' }),
                            amount: `S/${inv.amount}`,
                            status: inv.status === 'paid' ? 'Pagado' : inv.status,
                            plan: inv.plan_name
                        })));
                    }
                }

                const { data: availableOffers } = await supabase
                    .from('subscription_plans')
                    .select('*')
                    .eq('is_active', true)
                    .order('price_pen', { ascending: true });

                if (availableOffers && availableOffers.length > 0) {
                    setOffers(availableOffers.map(p => ({
                        ...p,
                        name: p.name_es,
                        price: p.price_pen
                    })));
                } else {
                    setOffers(SUBSCRIPTION_PLANS.map(p => ({
                        id: p.id,
                        name: p.name,
                        price: parseFloat(p.price.replace('S/', '')),
                        features: p.benefits,
                        benefit_highlight: p.id === 'premium' ? "Plan más popular" : ""
                    })));
                }
            } catch (err) {
                console.error("Error loading data:", err);
            } finally {
                setIsInitialLoading(false);
            }
        };

        loadData();
    }, [supabase]);

    useEffect(() => {
        setSelectedUIPlanId(currentPlanId);
    }, [currentPlanId]);

    const handlePlanSelect = (plan: any) => {
        setSelectedUIPlanId(plan.id);
        if (plan.id === currentPlanId) return;
        setSelectedPlan(plan);
        setIsPaymentModalOpen(true);
    };

    const confirmPayment = async () => {
        setIsProcessing(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            let patientId = null;
            if (user) {
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('id, patients(id)')
                    .eq('user_id', user.id)
                    .single();
                patientId = profile?.patients?.[0]?.id;
            }

            if (patientId) {
                await supabase.from('invoices').insert([{
                    patient_id: patientId,
                    amount: typeof selectedPlan.price === 'string' ? parseFloat(selectedPlan.price.replace('S/', '')) : selectedPlan.price,
                    plan_name: selectedPlan.name,
                    payment_method: 'Card •••• 4242',
                    status: 'paid'
                }]);

                await supabase.from('subscriptions').update({ status: 'cancelada' }).eq('patient_id', patientId).eq('status', 'activa');
                const price = typeof selectedPlan.price === 'string' ? parseFloat(selectedPlan.price.replace('S/', '')) : selectedPlan.price;
                await supabase.from('subscriptions').insert([{
                    patient_id: patientId,
                    plan_id: selectedPlan.id,
                    start_date: new Date().toISOString().split('T')[0],
                    end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                    status: 'activa',
                    original_price: price,
                    final_price: price
                }]);
            }

            setCurrentPlanId(selectedPlan.id);
            setIsPaymentModalOpen(false);
            window.dispatchEvent(new CustomEvent("nutrigo-plan-updated", { detail: selectedPlan.id }));

            toast({
                title: "¡Suscripción exitosa!",
                description: `Tu plan ha sido actualizado a ${selectedPlan.name} correctamente.`,
                variant: "success",
            });
            window.location.reload();
        } catch (err: any) {
            toast({
                title: "Error en el pago",
                description: err.message || "No se pudo procesar tu solicitud. Inténtalo de nuevo.",
                variant: "destructive",
            });
        } finally {
            setIsProcessing(false);
        }
    };

    const currentPlan = SUBSCRIPTION_PLANS.find(p => p.id === currentPlanId) || SUBSCRIPTION_PLANS[0];
    const isPremium = currentPlanName.toLowerCase().includes('premium') || currentPlanName.toLowerCase().includes('elite') || currentPlanId === 'premium';

    if (isInitialLoading) {
        return (
            <div className="h-[60vh] flex flex-col items-center justify-center gap-6">
                <div className="h-16 w-16 border-4 border-nutrition-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest animate-pulse">Consultando Membresía...</p>
            </div>
        );
    }

    return (
        <div className="space-y-12 pb-32 max-w-7xl mx-auto overflow-hidden relative">
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-nutrition-500/5 blur-[120px] pointer-events-none -z-10" />

            {/* Page Header */}
            <div className="flex flex-col items-center md:items-start gap-4">
                <div className="flex items-center gap-3 bg-white/5 border border-white/5 px-4 py-2 rounded-2xl">
                    <Crown className="h-4 w-4 text-nutrition-500" />
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Estatus de Usuario</span>
                </div>
                <h1 className="text-5xl md:text-6xl font-black text-white tracking-tighter uppercase leading-none">
                    Centro de <span className="text-nutrition-500">Privilegios</span>
                </h1>
                <p className="text-slate-500 font-medium text-lg italic max-w-2xl text-center md:text-left">
                    Gestiona tu experiencia VIP y accede a las herramientas más avanzadas de salud.
                </p>
            </div>

            {/* Current Active Plan Detail */}
            <div className={cn(
                "relative overflow-hidden rounded-[3.5rem] p-10 lg:p-16 shadow-[0_0_60px_rgba(0,0,0,0.4)] border border-white/5 transition-all duration-1000",
                isPremium ? "bg-[#151F32]" : "bg-[#151F32]/60"
            )}>
                {isPremium && (
                    <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-nutrition-500/10 via-transparent to-transparent pointer-events-none" />
                )}
                <div className="absolute -bottom-24 -right-24 w-80 h-80 bg-nutrition-500/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="relative z-10 flex flex-col lg:flex-row gap-16 items-start">
                    <div className="flex-1 space-y-10">
                        <div className="flex items-center gap-6">
                            <div className={cn(
                                "h-16 w-16 rounded-[1.5rem] flex items-center justify-center shadow-2xl transition-all duration-700",
                                isPremium ? "bg-nutrition-500 text-white animate-pulse" : "bg-white/5 text-slate-600 border border-white/5"
                            )}>
                                <ShieldCheck className="h-8 w-8" />
                            </div>
                            <div>
                                <Badge className={cn(
                                    "font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-xl text-[9px]",
                                    isPremium ? "bg-nutrition-500/20 text-nutrition-400 border-nutrition-500/30" : "bg-white/5 text-slate-500 border-white/10"
                                )}>
                                    {isPremium ? "Socio Elite NutriGo" : "Estatus: Pendiente de Activación"}
                                </Badge>
                                <h2 className="text-4xl md:text-6xl font-black text-white uppercase tracking-tighter mt-3">
                                    {currentPlanName === "Sin Plan Activo" ? "Acceso Básico" : currentPlanName}
                                </h2>
                            </div>
                        </div>

                        <p className="text-xl text-slate-400 max-w-2xl font-medium leading-relaxed italic">
                            {isPremium
                                ? "Tu metabolismo está operando bajo supervisión de élite. Tienes acceso sin restricciones a todos los módulos avanzados."
                                : "Actualmente te encuentras en una zona de acceso limitado. Para desbloquear el potencial completo de tu nutrición inteligente, activa uno de nuestros planes recomendados."}
                        </p>


                    </div>

                    <div className="w-full lg:w-80 space-y-8 bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-10 backdrop-blur-xl">
                        <h4 className="text-[10px] font-black uppercase text-nutrition-500 tracking-[0.3em]">Beneficios VIP</h4>
                        <div className="space-y-6">
                            {(isPremium ? currentPlan.benefits : ["Acceso a Dashboard", "Perfil de Salud", "Blog Público"]).map((benefit, i) => (
                                <div key={i} className="flex items-center gap-4 group">
                                    <div className="h-6 w-6 rounded-lg bg-nutrition-500/10 flex items-center justify-center border border-nutrition-500/20 group-hover:bg-nutrition-500/30 transition-all">
                                        <Check className="h-4 w-4 text-nutrition-500" />
                                    </div>
                                    <span className="text-sm font-black text-slate-300 uppercase tracking-tight">{benefit}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Upgrade Section */}
            <div className="bg-[#151F32]/60 rounded-[4rem] p-10 lg:p-20 border border-white/5 relative overflow-hidden shadow-2xl">
                <div className="absolute inset-0 bg-gradient-to-br from-nutrition-500/5 to-transparent pointer-events-none" />
                <div className="text-center space-y-4 mb-20 relative z-10">
                    <h3 className="text-4xl lg:text-5xl font-black text-white uppercase tracking-tighter">Eleva tu <span className="text-nutrition-500">Rendimiento</span></h3>
                    <p className="text-slate-500 font-bold text-lg max-w-2xl mx-auto italic">Selecciona el protocolo que mejor se adapte a tu meta de transformación.</p>
                </div>

                <div className="relative z-10">
                    <PlansSection mode="dashboard" onPlanSelect={handlePlanSelect} currentPlanId={currentPlanId} />
                </div>
            </div>

            {/* Billing Management */}
            <div className="bg-[#151F32] border border-white/5 p-12 rounded-[3.5rem] shadow-2xl flex flex-col md:flex-row items-center justify-between gap-10">
                <div className="flex items-center gap-8">
                    <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 shadow-inner">
                        <Receipt className="h-10 w-10 text-nutrition-500" />
                    </div>
                    <div>
                        <h4 className="text-2xl font-black text-white uppercase tracking-tighter">Expedientes de Pago</h4>
                        <p className="text-slate-500 font-medium italic mt-1">Consulta tus facturas y movimientos históricos.</p>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                    className="group bg-white/5 text-white border border-white/10 rounded-2xl px-12 py-8 font-black uppercase tracking-widest gap-4 hover:bg-white/10 transition-all"
                >
                    {isHistoryOpen ? "Cerrar Archivos" : "Ver Historial"}
                    <ArrowRight className={cn("h-5 w-5 transition-transform duration-500", isHistoryOpen && "rotate-90", "group-hover:translate-x-2")} />
                </Button>
            </div>

            {/* History Table Overlay/Section */}
            {isHistoryOpen && (
                <div className="bg-[#151F32] border border-white/5 rounded-[3rem] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-8 duration-700">
                    <div className="p-10 border-b border-white/5 bg-white/[0.01]">
                        <h4 className="text-[10px] font-black uppercase text-slate-500 tracking-[0.4em]">Registro de Transacciones Recientes</h4>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-white/[0.02]">
                                <tr>
                                    <th className="px-10 py-6 text-[9px] font-black uppercase text-slate-500 tracking-[0.2em]">Referencia</th>
                                    <th className="px-10 py-6 text-[9px] font-black uppercase text-slate-500 tracking-[0.2em]">Fecha</th>
                                    <th className="px-10 py-6 text-[9px] font-black uppercase text-slate-500 tracking-[0.2em]">Protocolo</th>
                                    <th className="px-10 py-6 text-[9px] font-black uppercase text-slate-500 tracking-[0.2em]">Inversión</th>
                                    <th className="px-10 py-6 text-[9px] font-black uppercase text-slate-500 tracking-[0.2em]">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {history.length > 0 ? history.map((bill) => (
                                    <tr key={bill.id} className="hover:bg-white/[0.03] transition-all">
                                        <td className="px-10 py-7 text-sm font-black text-white font-tech">{bill.id}</td>
                                        <td className="px-10 py-7 text-xs font-bold text-slate-500 uppercase">{bill.date}</td>
                                        <td className="px-10 py-7 text-sm font-black text-slate-200 uppercase">{bill.plan}</td>
                                        <td className="px-10 py-7 text-lg font-black text-nutrition-500">{bill.amount}</td>
                                        <td className="px-10 py-7">
                                            <Badge className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-3 py-1 font-black uppercase text-[9px] tracking-widest rounded-lg">
                                                {bill.status}
                                            </Badge>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr>
                                        <td colSpan={5} className="px-10 py-20 text-center text-slate-600 font-bold uppercase tracking-widest italic">
                                            No se han detectado transacciones previas
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Payment Modal */}
            <Dialog open={isPaymentModalOpen} onOpenChange={setIsPaymentModalOpen}>
                <DialogContent className="sm:max-w-md rounded-[3rem] overflow-hidden p-0 border-white/10 bg-[#0F172A] shadow-[0_0_100px_rgba(0,0,0,0.8)]">
                    <div className="bg-[#151F32] p-10 text-white relative border-b border-white/5">
                        <div className="absolute top-0 right-0 w-40 h-full bg-nutrition-500/10 blur-[60px] rounded-full pointer-events-none" />
                        <DialogHeader>
                            <DialogTitle className="text-3xl font-black mb-2 flex items-center gap-4 uppercase tracking-tighter">
                                <CreditCard className="h-8 w-8 text-nutrition-500" />
                                Protocolo Pago
                            </DialogTitle>
                            <DialogDescription className="text-slate-500 font-medium italic text-lg leading-tight">
                                Estás activando el programa <span className="text-white font-black not-italic">{selectedPlan?.name}</span>.
                            </DialogDescription>
                        </DialogHeader>
                    </div>

                    <div className="p-10 space-y-8 bg-transparent">
                        <div className="space-y-6">
                            <div className="space-y-3">
                                <Label htmlFor="card" className="text-[10px] font-black uppercase text-slate-600 tracking-[0.3em]">Canal de Débito</Label>
                                <div className="relative">
                                    <Input id="card" defaultValue="•••• •••• •••• 4242" disabled className="rounded-2xl border-white/5 bg-white/5 text-white font-tech font-black h-14" />
                                    <div className="absolute right-5 top-1/2 -translate-y-1/2 flex gap-3">
                                        <div className="w-10 h-6 bg-blue-600 rounded shadow-md" />
                                        <div className="w-10 h-6 bg-orange-500 rounded shadow-md" />
                                    </div>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase text-slate-600 tracking-[0.3em]">Vencimiento</Label>
                                    <Input defaultValue="12/28" disabled className="rounded-2xl border-white/5 bg-white/5 text-white font-tech font-black h-14" />
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-[10px] font-black uppercase text-slate-600 tracking-[0.3em]">Código Seg</Label>
                                    <Input defaultValue="•••" disabled className="rounded-2xl border-white/5 bg-white/5 text-white font-tech font-black h-14" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white/5 p-6 rounded-[2rem] border border-white/5 shadow-inner">
                            <div className="flex justify-between items-center">
                                <span className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Total Transacción</span>
                                <span className="text-4xl font-black text-white font-tech underline decoration-nutrition-500 underline-offset-8 decoration-4">S/ {selectedPlan?.precioMensual || selectedPlan?.price}</span>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="p-10 pt-4 flex-col sm:flex-col gap-4">
                        <Button
                            onClick={confirmPayment}
                            disabled={isProcessing}
                            className="w-full bg-nutrition-500 hover:bg-nutrition-400 text-white font-black uppercase tracking-[0.3em] h-18 py-8 rounded-[2rem] shadow-[0_0_30px_rgba(16,185,129,0.3)] transition-all active:scale-95"
                        >
                            {isProcessing ? (
                                <Loader2 className="h-6 w-6 animate-spin" />
                            ) : (
                                "Confirmar Activación"
                            )}
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setIsPaymentModalOpen(false)}
                            className="w-full font-black text-[10px] uppercase tracking-widest text-slate-600 hover:text-white"
                        >
                            Abortar Proceso
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
