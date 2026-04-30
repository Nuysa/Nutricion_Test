"use client";

import { useState, useEffect, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import {
    Calendar,
    ChevronLeft,
    ChevronRight,
    Wheat,
    Drumstick,
    Droplet,
    Info,
    Coffee,
    Utensils,
    Moon,
    Clock,
    Flame,
    Droplets,
    ShoppingCart,
    Repeat,
    CheckCircle,
    ArrowDown,
    Zap,
    GlassWater,
    Milk,
    AlertTriangle,
    Save,
    Loader2,
    Trash2,
    Scale,
    ArrowLeft,
    ChevronDown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { getEffectiveMacros } from "@/lib/nutrition-utils";

// --- Constants ---
const MEAL_INFO: Record<string, { icon: any, label: string, time: string }> = {
    "breakfast": { icon: Coffee, label: "Desayuno", time: "08:30 AM" },
    "mid-morning": { icon: Zap, label: "Media Mañana", time: "11:00 AM" },
    "lunch": { icon: Utensils, label: "Almuerzo", time: "02:00 PM" },
    "mid-afternoon": { icon: Coffee, label: "Media Tarde", time: "05:00 PM" },
    "dinner": { icon: Moon, label: "Cena", time: "08:30 PM" },
};

const DB_PORCIONES: Record<string, { label: string; kcal: number; cho: number; pro: number; fat: number }> = {
    'almidon': { label: 'Almidón', kcal: 80, cho: 15, pro: 2, fat: 1 },
    'fruta': { label: 'Fruta', kcal: 60, cho: 15, pro: 0, fat: 0 },
    'azucar': { label: 'Azúcares simples', kcal: 20, cho: 5, pro: 0, fat: 0 },
    'verdura': { label: 'Verduras', kcal: 25, cho: 5, pro: 1, fat: 0 },
    'lac-des': { label: 'Lácteos descremados', kcal: 72, cho: 12, pro: 6, fat: 0 },
    'lac-semi': { label: 'Lácteos semidescremados', kcal: 117, cho: 12, pro: 6, fat: 5 },
    'lac-ent': { label: 'Lácteos enteros', kcal: 144, cho: 12, pro: 6, fat: 8 },
    'pro-cero': { label: 'Alim. proteicos ceros en grasa', kcal: 24, cho: 0, pro: 6, fat: 0 },
    'pro-bajo': { label: 'Alim. proteicos bajos en grasa', kcal: 33, cho: 0, pro: 6, fat: 1 },
    'pro-mod': { label: 'Alim. proteicos c/moderada grasa', kcal: 51, cho: 0, pro: 6, fat: 3 },
    'pro-alta': { label: 'Alim. proteicos c/alta grasa', kcal: 69, cho: 0, pro: 6, fat: 5 },
    'grasa': { label: 'Grasas', kcal: 45, cho: 0, pro: 0, fat: 5 }
};

const DAYS_SHORT = [
    { id: "Lunes", label: "LUN", num: 1 },
    { id: "Martes", label: "MAR", num: 2 },
    { id: "Miércoles", label: "MIÉ", num: 3 },
    { id: "Jueves", label: "JUE", num: 4 },
    { id: "Viernes", label: "VIE", num: 5 },
    { id: "Sábado", label: "SÁB", num: 6 },
    { id: "Domingo", label: "DOM", num: 7 },
];

export function WeeklyNutritionalPlan({ overridePatientId }: { overridePatientId?: string }) {
    const [weeklyPlan, setWeeklyPlan] = useState<any[]>([]);
    const [flexiblePlan, setFlexiblePlan] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [patientPlanType, setPatientPlanType] = useState<string>("sin plan");
    const [weekOffset, setWeekOffset] = useState(0);
    const [activeDay, setActiveDay] = useState("");
    const supabase = createClient();
    const router = useRouter();

    // Macro Goal State
    const [goals, setGoals] = useState({
        kcal: 1820,
        pro: 140,
        car: 180,
        fat: 60
    });

    const { toast } = useToast();
    const [patientId, setPatientId] = useState<string | null>(null);
    const [patientWeight, setPatientWeight] = useState<string | null>(null);
    const [exchangeGuides, setExchangeGuides] = useState<any[]>([]);
    const [collapsedExchanges, setCollapsedExchanges] = useState<Record<string, boolean>>({});

    useEffect(() => {
        const today = new Date();
        const currentDayStr = DAYS_SHORT[today.getDay() === 0 ? 6 : today.getDay() - 1].id;
        setActiveDay(currentDayStr);
    }, []);

    useEffect(() => {
        async function fetchPlan() {
            setLoading(true);
            const today = new Date();
            const dayOfWeek = today.getDay();
            const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) + (weekOffset * 7);
            const monday = new Date(new Date(today).setDate(diff));
            monday.setHours(0, 0, 0, 0);

            const sunday = new Date(new Date(monday).setDate(monday.getDate() + 6));
            sunday.setHours(23, 59, 59, 999);

            let finalPatientId = overridePatientId;
            let currentPatientPlanType = "sin plan";
            let currentWeight = 0;

            if (!finalPatientId) {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;
                const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
                if (!profile) return;
                const { data: patient } = await supabase.from("patients").select("id, plan_type, current_weight").eq("profile_id", profile.id).single();
                if (!patient) return;
                finalPatientId = patient.id;
                currentPatientPlanType = patient.plan_type || "sin plan";
                currentWeight = patient.current_weight || 0;
            } else {
                const { data: patient } = await supabase.from("patients").select("id, plan_type, current_weight").eq("id", finalPatientId).single();
                if (patient) {
                    currentPatientPlanType = patient.plan_type || "sin plan";
                    currentWeight = patient.current_weight || 0;
                }
            }

            if (!finalPatientId) return;

            // Obtener el último peso registrado para cálculos más precisos
            const { data: latestRecord } = await supabase
                .from("weight_records")
                .select("weight")
                .eq("patient_id", finalPatientId)
                .order("date", { ascending: false })
                .order("created_at", { ascending: false })
                .limit(1)
                .maybeSingle();

            const activePatientWeight = latestRecord?.weight || currentWeight || 0;
            setPatientWeight(activePatientWeight);
            setPatientId(finalPatientId);
            setPatientPlanType(currentPatientPlanType);
            console.log("Patient loaded:", finalPatientId, "Type:", currentPatientPlanType);

            // Fetch Weekly Menu Plan (if applicable)
            const yearStr = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

            const { data: meals } = await supabase
                .from("meals")
                .select("*")
                .eq("patient_id", finalPatientId)
                .gte("date", yearStr(monday))
                .lte("date", yearStr(sunday))
                .order("date", { ascending: true });

            // Fetch Flexible Plan (if applicable)
            const weekNum = weekOffset + 1; // Assuming 0 is week 1
            const { data: flexData } = await supabase
                .from("flexible_plans")
                .select("data")
                .eq("patient_id", finalPatientId)
                .eq("week_number", weekNum)
                .single();

            if (flexData && flexData.data) {
                setFlexiblePlan(flexData.data);
                const p = flexData.data;
                const activeWeight = activePatientWeight > 0 ? activePatientWeight : (p.peso || 0);

                if (p.portions) {
                    let totK = 0, totC = 0, totPr = 0, totF = 0;
                    Object.entries(p.portions).forEach(([key, val]: [string, any]) => {
                        const info = DB_PORCIONES[key];
                        if (info) {
                            totK += val * info.kcal;
                            totC += val * info.cho;
                            totPr += val * info.pro;
                            totF += val * info.fat;
                        }
                    });
                    setGoals({
                        kcal: Math.round(totK),
                        pro: Math.round(totPr),
                        car: Math.round(totC),
                        fat: Math.round(totF)
                    });
                } else if (p.kcalTotales) {
                    setGoals({
                        kcal: Math.round(Number(p.kcalTotales) || 1820),
                        pro: Math.round(p.gProKg * activeWeight || 140),
                        car: Math.round(p.gChoKg * activeWeight || 180),
                        fat: Math.round((p.kcalTotales - (p.gProKg * activeWeight * 4) - (p.gChoKg * activeWeight * 4)) / 9 || 60)
                    });
                }
            } else {
                setFlexiblePlan(null);
            }

            const planByDay = DAYS_SHORT.map((day, index) => {
                const date = new Date(new Date(monday).setDate(monday.getDate() + index));
                const dY = date.getFullYear();
                const dM = String(date.getMonth() + 1).padStart(2, '0');
                const dD = String(date.getDate()).padStart(2, '0');
                const dateStr = `${dY}-${dM}-${dD}`;
                const dayMeals = meals?.filter((m: any) => m.date === dateStr) || [];

                const getMealData = (type: string) => {
                    const m = dayMeals.find((m: any) => m.meal_type === type);
                    if (!m) return { name: "-", items: [], kcal: 0, pro: 0, car: 0, fat: 0 };

                    return {
                        name: m.name,
                        items: m.items || [],
                        kcal: m.kcal || 0,
                        pro: m.protein_g || 0,
                        car: m.carbs_g || 0,
                        fat: m.fats_g || 0
                    };
                };

                return {
                    day: day.id,
                    dateNum: date.getDate(),
                    dateLabel: date.toLocaleDateString("es-ES", { day: "2-digit", month: "short" }),
                    meals: {
                        breakfast: getMealData("breakfast"),
                        "mid-morning": getMealData("mid-morning"),
                        lunch: getMealData("lunch"),
                        "mid-afternoon": getMealData("mid-afternoon"),
                        dinner: getMealData("dinner")
                    }
                };
            });

            setWeeklyPlan(planByDay);
            setLoading(false);
        }
        fetchPlan();

        // Fetch Exchange Guides
        const fetchExchanges = async () => {
            const { data, error } = await supabase
                .from('exchange_guides')
                .select('*')
                .order('order_index', { ascending: true });

            if (!error && data) {
                setExchangeGuides(data);
                // Configurar todas como contraídas por defecto
                const initialCollapsed: Record<string, boolean> = {};
                data.forEach(g => {
                    initialCollapsed[g.id] = true;
                });
                setCollapsedExchanges(initialCollapsed);
            }
        };
        fetchExchanges();
    }, [weekOffset, supabase, overridePatientId]);

    const activeDayData = useMemo(() => {
        return weeklyPlan.find(d => d.day === activeDay);
    }, [weeklyPlan, activeDay]);

    const weekRange = useMemo(() => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) + (weekOffset * 7);
        const monday = new Date(new Date(today).setDate(diff));
        const sunday = new Date(new Date(monday).setDate(monday.getDate() + 6));
        return `${monday.toLocaleDateString("es-ES", { day: "2-digit", month: "short" })} - ${sunday.toLocaleDateString("es-ES", { day: "2-digit", month: "short" })} ${sunday.getFullYear()}`;
    }, [weekOffset]);

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
    );

    return (
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-10 bg-[#0B1120] text-slate-100 p-3 sm:p-6 lg:p-10 min-h-screen font-sans overflow-x-hidden">
            {/* --- MAIN CONTENT AREA --- */}
            <div className="flex-1 space-y-12">
                {patientPlanType === "sin plan" ? (
                    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 animate-in fade-in slide-in-from-bottom-10 duration-1000">
                        <div className="relative mb-10">
                            <div className="absolute inset-0 bg-orange-500/20 blur-[60px] rounded-full scale-150 animate-pulse" />
                            <div className="relative h-32 w-32 rounded-[2.5rem] bg-gradient-to-br from-[#151F32] to-[#0B1120] border border-white/5 flex items-center justify-center shadow-2xl">
                                <AlertTriangle className="h-16 w-16 text-slate-500" />
                            </div>
                        </div>
                        <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight mb-4 uppercase tracking-[0.2em]">Aún no tienes un plan</h2>
                        <p className="text-slate-400 text-lg font-medium max-w-md mx-auto leading-relaxed mb-10">
                            Tu nutricionista está preparando tu plan personalizado. Una vez asignado, podrás verlo aquí.
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <button
                                onClick={() => router.push("/dashboard/paciente/messages")}
                                className="bg-[#FF7A00] text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-orange-500/20 hover:scale-105 transition-all"
                            >
                                Contactar Nutricionista o Staff
                            </button>
                            <button
                                onClick={() => router.push("/dashboard/paciente/subscription")}
                                className="bg-white/5 text-white px-10 py-4 rounded-2xl font-black uppercase text-xs tracking-widest border border-white/5 hover:bg-white/10 transition-all"
                            >
                                Ver Catálogo de Planes
                            </button>
                        </div>
                    </div>
                ) : patientPlanType === "plan flexible" ? (
                    <div className="space-y-6 sm:space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
                            <div className="flex items-center gap-4 sm:gap-6">
                                <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shrink-0">
                                    <Zap className="h-6 w-6 sm:h-8 sm:w-8 text-orange-500" />
                                </div>
                                <div>
                                    <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white mb-1">Plan Flexible</h1>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">CUMPLIMIENTO DE MACROS Y PORCIONES</p>
                                        {patientWeight && (
                                            <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-lg w-fit">
                                                <Scale className="h-3 w-3 text-orange-500" />
                                                <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">PESO ACTUAL: {patientWeight}kg</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Week Navigation for Flexible Plan */}
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setWeekOffset(prev => Math.max(0, prev - 1))}
                                    className="text-slate-500 hover:text-white transition-colors"
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </button>

                                <div className="bg-[#151F32] rounded-2xl px-3 sm:px-6 py-2.5 border border-white/5 shadow-2xl flex items-center gap-2 sm:gap-4">
                                    <Calendar className="h-4 w-4 text-[#FF7A00] shrink-0" />
                                    <span className="text-[10px] sm:text-sm font-black text-white uppercase tracking-tight">
                                        Semana: {weekRange}
                                    </span>
                                </div>

                                <button
                                    onClick={() => setWeekOffset(prev => prev + 1)}
                                    className="text-slate-500 hover:text-white transition-colors"
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6">
                            <Card className="bg-[#151F32] border-white/5 p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] shadow-2xl relative group overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 sm:p-4 flex flex-col items-end">
                                    <Flame className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 mb-1" />
                                    <span className="text-[8px] sm:text-[11px] font-black text-slate-500 uppercase tracking-widest">KCAL</span>
                                </div>
                                <span className="text-3xl sm:text-5xl font-tech font-black text-white block mb-1">{goals.kcal}</span>
                                <div className="h-1 sm:h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-orange-500 w-[100%] rounded-full shadow-[0_0_10px_rgba(255,122,0,0.5)]" />
                                </div>
                                <p className="mt-2 sm:mt-3 text-[8px] sm:text-[11px] font-black text-orange-500 uppercase tracking-widest">Calorías Totales</p>
                            </Card>

                            <Card className="bg-[#151F32] border-white/5 p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] shadow-2xl relative group overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 sm:p-4 flex flex-col items-end">
                                    <Drumstick className="h-4 w-4 sm:h-5 sm:w-5 text-sky-400 mb-1" />
                                    <span className="text-[8px] sm:text-[11px] font-black text-slate-500 uppercase tracking-widest">PROT</span>
                                </div>
                                <span className="text-3xl sm:text-5xl font-tech font-black text-sky-400 block mb-1">{goals.pro}g</span>
                                <div className="h-1 sm:h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-sky-400 w-[100%] rounded-full" />
                                </div>
                                <p className="mt-2 sm:mt-3 text-[8px] sm:text-[11px] font-black text-sky-400 uppercase tracking-widest">Proteínas</p>
                            </Card>

                            <Card className="bg-[#151F32] border-white/5 p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] shadow-2xl relative group overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 sm:p-4 flex flex-col items-end">
                                    <Wheat className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500 mb-1" />
                                    <span className="text-[8px] sm:text-[11px] font-black text-slate-500 uppercase tracking-widest">CHO</span>
                                </div>
                                <span className="text-3xl sm:text-5xl font-tech font-black text-yellow-500 block mb-1">{goals.car}g</span>
                                <div className="h-1 sm:h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-yellow-500 w-[100%] rounded-full" />
                                </div>
                                <p className="mt-2 sm:mt-3 text-[8px] sm:text-[11px] font-black text-yellow-500 uppercase tracking-widest">Carbohidratos</p>
                            </Card>

                            <Card className="bg-[#151F32] border-white/5 p-4 sm:p-6 rounded-2xl sm:rounded-[2rem] shadow-2xl relative group overflow-hidden">
                                <div className="absolute top-0 right-0 p-2 sm:p-4 flex flex-col items-end">
                                    <Droplets className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-400 mb-1" />
                                    <span className="text-[8px] sm:text-[11px] font-black text-slate-500 uppercase tracking-widest">GRASAS</span>
                                </div>
                                <span className="text-3xl sm:text-5xl font-tech font-black text-emerald-400 block mb-1">{goals.fat}g</span>
                                <div className="h-1 sm:h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-400 w-[100%] rounded-full" />
                                </div>
                                <p className="mt-2 sm:mt-3 text-[8px] sm:text-[11px] font-black text-emerald-400 uppercase tracking-widest">LIPIDOS</p>
                            </Card>
                        </div>

                        {/* Flexible Plan Details */}
                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 sm:gap-10">
                            {/* Distribution / Plate View */}
                            <div className="xl:col-span-12 space-y-8 sm:space-y-12">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-10">
                                    {flexiblePlan && flexiblePlan.meals ? (
                                        <>
                                            {/* Column Left: Interactive Accordions (Detailed) */}
                                            <div className="space-y-6">
                                                <div className="flex items-center gap-4 mb-6">
                                                    <div className="h-1 w-12 bg-orange-500 rounded-full" />
                                                    <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Instrucciones Detalladas</h3>
                                                </div>
                                                <Accordion type="multiple" className="space-y-4">
                                                    {flexiblePlan.meals.filter((m: any) => m.active).map((meal: any) => (
                                                        <AccordionItem key={meal.id} value={meal.id} className="border-none">
                                                            <Card className="bg-[#151F32] border-white/5 rounded-3xl overflow-hidden shadow-2xl group transition-all hover:border-orange-500/30">
                                                                <AccordionTrigger className="hover:no-underline p-0 px-4 sm:px-8 py-4 sm:py-6">
                                                                    <div className="flex flex-col w-full pr-4 text-left gap-4">
                                                                        <div className="flex items-center justify-between w-full">
                                                                            <div className="flex items-center gap-3 sm:gap-6">
                                                                                <div className="h-9 w-9 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-[#0B1120] flex items-center justify-center border border-white/5 text-orange-500 shrink-0">
                                                                                    <Clock className="h-4 w-4 sm:h-5 sm:w-5" />
                                                                                </div>
                                                                                <span className="font-tech font-black text-xs sm:text-sm text-white tracking-widest uppercase block">{meal.name}</span>
                                                                            </div>
                                                                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">{meal.time}</span>
                                                                        </div>

                                                                        <div className="flex">
                                                                            <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest bg-orange-500/10 px-4 py-2 rounded-xl border border-orange-500/20">
                                                                                {meal.title}
                                                                            </span>
                                                                        </div>
                                                                    </div>
                                                                </AccordionTrigger>
                                                                <AccordionContent className="p-0 border-t border-white/5">
                                                                    <div className="p-4 sm:p-8 space-y-4 sm:space-y-6 bg-[#0B1120]/30">
                                                                        {meal.rows.map((row: any) => (
                                                                            <div key={row.id} className="space-y-3">
                                                                                <div className="flex items-center justify-between">
                                                                                    <div className="flex items-center gap-3">
                                                                                        <div className="h-1.5 w-1.5 rounded-full bg-orange-500" />
                                                                                        <span className="text-[11px] font-black text-white uppercase tracking-widest">
                                                                                            {DB_PORCIONES[row.group]?.label || row.group.replace('-', ' ')}
                                                                                        </span>
                                                                                    </div>
                                                                                    <div className="h-7 w-12 bg-[#0B1120] border border-white/5 rounded-lg flex items-center justify-center font-tech font-black text-orange-400 text-xs">
                                                                                        {row.portions}
                                                                                    </div>
                                                                                </div>
                                                                                {row.comment && (
                                                                                    <p className="text-[11px] text-slate-400 font-medium leading-relaxed bg-white/[0.03] p-4 rounded-2xl border border-white/5 italic">
                                                                                        "{row.comment}"
                                                                                    </p>
                                                                                )}
                                                                            </div>
                                                                        ))}
                                                                    </div>
                                                                </AccordionContent>
                                                            </Card>
                                                        </AccordionItem>
                                                    ))}
                                                </Accordion>
                                            </div>

                                            <div className="space-y-6 sm:space-y-8 bg-[#0B1120]/20 p-4 sm:p-6 rounded-2xl sm:rounded-[2.5rem] border border-white/5 max-h-[500px] lg:max-h-[800px] overflow-y-auto custom-scrollbar relative">
                                                <div className="sticky top-[-24px] z-20 bg-[#0B1120]/80 backdrop-blur-md py-6 -mx-6 px-6 mb-2 border-b border-white/5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-1.5 w-12 bg-emerald-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.3)]" />
                                                        <h3 className="text-xs font-black text-slate-300 uppercase tracking-[0.3em] drop-shadow-lg">Guía de Intercambio</h3>
                                                    </div>
                                                </div>

                                                {exchangeGuides.length === 0 ? (
                                                    <div className="py-20 text-center opacity-30">
                                                        <Repeat className="h-8 w-8 mx-auto mb-2 text-slate-500" />
                                                        <p className="text-[10px] font-black uppercase tracking-widest">No hay guías disponibles</p>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-6">
                                                        {exchangeGuides.map((guide) => (
                                                            <div key={guide.id} className="bg-white/[0.02] border border-white/5 rounded-[2rem] overflow-hidden transition-all hover:bg-white/[0.04]">
                                                                <button
                                                                    onClick={() => setCollapsedExchanges(prev => ({ ...prev, [guide.id]: !prev[guide.id] }))}
                                                                    className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors"
                                                                >
                                                                    <span className="text-[11px] font-black text-white uppercase tracking-widest">{guide.title}</span>
                                                                    <div className={cn("text-slate-500 transition-transform duration-300", collapsedExchanges[guide.id] ? "rotate-180" : "")}>
                                                                        <ChevronDown className="h-4 w-4" />
                                                                    </div>
                                                                </button>

                                                                {!collapsedExchanges[guide.id] && (
                                                                    <div className="p-4 pt-0">
                                                                        {/* Horizontal scroll with 2 rows content */}
                                                                        <div className="overflow-x-auto pb-4 custom-scrollbar">
                                                                            <div className="grid grid-flow-col grid-rows-2 gap-3 min-w-max">
                                                                                {guide.cards.map((card: any, cidx: number) => (
                                                                                    <div
                                                                                        key={cidx}
                                                                                        className="w-[160px] sm:w-[180px] bg-[#0B1120] rounded-2xl border border-white/5 overflow-hidden group/card shadow-lg flex flex-col h-full"
                                                                                    >
                                                                                        <div className="h-24 sm:h-28 bg-white/5 relative overflow-hidden shrink-0">
                                                                                            {card.image_url ? (
                                                                                                <img
                                                                                                    src={card.image_url}
                                                                                                    alt={card.title}
                                                                                                    className="w-full h-full object-cover sm:object-contain transition-transform duration-500 group-hover/card:scale-105"
                                                                                                />
                                                                                            ) : (
                                                                                                <div className="w-full h-full flex items-center justify-center opacity-20">
                                                                                                    <Utensils className="h-6 w-6" />
                                                                                                </div>
                                                                                            )}
                                                                                        </div>
                                                                                        <div className="p-3 sm:p-4 flex flex-col flex-1 justify-center gap-1.5 bg-gradient-to-b from-transparent to-[#151F32]/50">
                                                                                            <p className="text-xs sm:text-[13px] font-black text-emerald-400 uppercase tracking-tight leading-snug break-words">
                                                                                                {card.description}
                                                                                            </p>
                                                                                            <p className="text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-widest leading-tight break-words">
                                                                                                {card.title}
                                                                                            </p>
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="col-span-full py-20 text-center space-y-4">
                                            <div className="h-16 w-16 bg-slate-500/10 rounded-2xl flex items-center justify-center text-slate-500 mx-auto opacity-30">
                                                <Utensils className="h-8 w-8" />
                                            </div>
                                            <p className="text-slate-500 font-black text-[10px] uppercase tracking-[0.3em]">No hay un plan flexible guardado para esta semana.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Header Section */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
                            <div className="space-y-3">
                                <div className="flex items-center gap-3 sm:gap-4">
                                    <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-[#FF7A00] shrink-0" />
                                    <h1 className="text-xl sm:text-3xl font-black tracking-tight text-white leading-none uppercase">
                                        Plan Nutricional Semanal
                                    </h1>
                                </div>
                                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] font-tech text-center sm:text-left">PLAN PERSONALIZADO POR TU NUTRICIONISTA</p>
                                    {patientWeight && (
                                        <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-lg w-fit mx-auto sm:mx-0">
                                            <Scale className="h-3 w-3 text-orange-500" />
                                            <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">PESO CARGADO: {patientWeight}kg</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Week Navigation for Weekly Menu */}
                            <div className="flex items-center gap-4 self-center sm:self-auto">
                                <button
                                    onClick={() => setWeekOffset(prev => prev - 1)}
                                    className="text-slate-500 hover:text-white transition-colors"
                                >
                                    <ChevronLeft className="h-5 w-5" />
                                </button>

                                <div className="bg-[#151F32] rounded-2xl px-6 py-2.5 border border-white/5 shadow-2xl flex items-center gap-4 relative group">
                                    <Calendar className="h-4 w-4 text-[#FF7A00]" />
                                    <span className="text-sm font-black text-white uppercase tracking-tight">
                                        Semana: {weekRange}
                                    </span>

                                    {weekOffset !== 0 && (
                                        <button
                                            onClick={() => setWeekOffset(0)}
                                            className="absolute -top-3 right-0 bg-orange-500 text-white text-[8px] font-black px-2 py-1 rounded-full transition-opacity"
                                        >
                                            HOY
                                        </button>
                                    )}
                                </div>

                                <button
                                    onClick={() => setWeekOffset(prev => prev + 1)}
                                    className="text-slate-500 hover:text-white transition-colors"
                                >
                                    <ChevronRight className="h-5 w-5" />
                                </button>
                            </div>
                        </div>

                        {/* Day selector pills */}
                        <div className="flex items-center gap-2 sm:gap-4 overflow-x-auto pb-4 scrollbar-hide">
                            {weeklyPlan.map((d, idx) => {
                                const dayShort = DAYS_SHORT[idx].label;
                                const isSelected = activeDay === d.day;
                                return (
                                    <button
                                        key={d.day}
                                        onClick={() => setActiveDay(d.day)}
                                        className={cn(
                                            "flex flex-col items-center justify-center min-w-[48px] sm:min-w-[70px] h-16 sm:h-20 rounded-xl sm:rounded-[1.5rem] transition-all relative border overflow-hidden",
                                            isSelected
                                                ? "bg-gradient-to-br from-[#FF7A00] to-[#FF9D42] text-white border-[#FF7A00] shadow-[0_10px_20px_rgba(255,122,0,0.2)] scale-110 z-10"
                                                : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
                                        )}
                                    >
                                        <span className="text-[8px] sm:text-[10px] font-black uppercase tracking-widest">{dayShort}</span>
                                        <span className="text-base sm:text-xl font-tech font-black">{d.dateNum}</span>
                                        {isSelected && <div className="absolute top-0 right-0 p-1"><CheckCircle className="h-3 w-3 text-white/50" /></div>}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Active Day Banner Macros */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 py-4 sm:py-8 px-4 sm:px-10 bg-white/5 rounded-2xl sm:rounded-[2.5rem] border border-white/5">
                            <div className="flex items-center gap-3 sm:gap-4">
                                <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl sm:rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shrink-0">
                                    <Repeat className="h-5 w-5 sm:h-6 sm:w-6 text-orange-500" />
                                </div>
                                <h2 className="text-lg sm:text-2xl font-black text-white tracking-tight">Menú de {activeDay}</h2>
                            </div>

                            <div className="flex flex-wrap items-center gap-2 sm:gap-4">
                                <div className="bg-orange-500 text-white px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full flex items-center gap-1.5 sm:gap-2 shadow-lg shadow-orange-500/10">
                                    <Flame className="h-3 w-3 sm:h-4 sm:w-4" />
                                    <span className="text-xs sm:text-sm font-tech font-black">{goals.kcal} kcal</span>
                                </div>
                                <div className="bg-[#1e293b] border border-white/10 text-slate-300 px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full flex items-center gap-1.5 sm:gap-2">
                                    <span className="text-[8px] sm:text-[9px] font-black uppercase text-slate-500">PRO:</span>
                                    <span className="text-xs sm:text-sm font-tech font-black text-slate-300">{goals.pro}g</span>
                                </div>
                                <div className="bg-[#1e293b] border border-white/10 text-sky-400 px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full flex items-center gap-1.5 sm:gap-2">
                                    <span className="text-[8px] sm:text-[9px] font-black uppercase text-slate-500">CAR:</span>
                                    <span className="text-xs sm:text-sm font-tech font-black text-sky-400">{goals.car}g</span>
                                </div>
                                <div className="bg-[#1e293b] border border-white/10 text-yellow-500 px-3 sm:px-5 py-1.5 sm:py-2.5 rounded-full flex items-center gap-1.5 sm:gap-2">
                                    <span className="text-[8px] sm:text-[9px] font-black uppercase text-slate-500">FAT:</span>
                                    <span className="text-xs sm:text-sm font-tech font-black text-yellow-500">{goals.fat}g</span>
                                </div>
                            </div>
                        </div>

                        {/* Meals Accordion */}
                        <div className="space-y-6">
                            {activeDayData && Object.entries(activeDayData.meals).map(([type, meal]: [string, any]) => {
                                const info = MEAL_INFO[type];
                                const Icon = info.icon;
                                return (
                                    <Accordion key={type} type="single" collapsible className="w-full">
                                        <AccordionItem value={type} className="border-none bg-[#151F32] rounded-[2rem] overflow-hidden shadow-xl mb-6 last:mb-0 border border-white/5 group transition-all hover:bg-[#1a263d]">
                                            <AccordionTrigger className="px-4 sm:px-10 py-5 sm:py-8 hover:no-underline group">
                                                <div className="flex flex-col sm:flex-row items-start sm:items-center w-full gap-4 sm:gap-8">
                                                    <div className="flex items-center gap-3 sm:gap-6 min-w-0 sm:min-w-[240px]">
                                                        <div className="h-12 w-12 sm:h-16 sm:w-16 rounded-xl sm:rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500 border border-orange-500/10 shrink-0">
                                                            <Icon className="h-6 w-6 sm:h-8 sm:w-8" />
                                                        </div>
                                                        <div className="text-left">
                                                            <h3 className="text-base sm:text-xl font-black text-white leading-tight uppercase tracking-widest">{info.label}</h3>
                                                            <div className="flex items-center gap-2 text-slate-500 mt-1 font-tech font-black text-xs">
                                                                <Clock className="h-3 w-3" />
                                                                {info.time}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="flex-1 text-left">
                                                        <span className="text-xs font-black text-slate-500 uppercase tracking-widest block mb-1">Tu Plato Hoy</span>
                                                        <p className="text-lg font-black text-white uppercase tracking-tight leading-snug">{meal.name}</p>
                                                    </div>

                                                    <div className="hidden xl:flex items-center gap-8 px-8 border-l border-white/5">
                                                        <div className="text-center">
                                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Calorías</span>
                                                            <span className="text-lg font-tech font-black text-white">{meal.kcal}</span>
                                                        </div>
                                                        <div className="text-center">
                                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Proteína</span>
                                                            <span className="text-lg font-tech font-black text-slate-400">{meal.pro}g</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="px-4 sm:px-10 pb-6 sm:pb-10">
                                                <div className="pt-4 sm:pt-8 border-t border-white/5 grid grid-cols-1 lg:grid-cols-12 gap-6 sm:gap-10">
                                                    <div className="lg:col-span-8 space-y-8">
                                                        <div>
                                                            <h4 className="text-[10px] font-black text-[#FF7A00] uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                                                <span className="h-1.5 w-1.5 rounded-full bg-[#FF7A00]" />
                                                                Instrucciones e Ingredientes
                                                            </h4>
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                                {meal.items.map((item: any, idx: number) => (
                                                                    <div key={idx} className="flex items-center gap-4 bg-white/[0.02] p-4 rounded-2xl border border-white/5 group-hover:bg-white/5 transition-colors">
                                                                        <div className="h-8 w-8 rounded-lg bg-[#FF7A00]/10 flex items-center justify-center text-orange-500 text-xs font-black">
                                                                            {idx + 1}
                                                                        </div>
                                                                        <span className="text-slate-300 text-sm font-medium">{item}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <div className="lg:col-span-4 bg-[#0B1120] rounded-3xl p-6 border border-white/5 space-y-6">
                                                        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest text-center border-b border-white/5 pb-4">Detalle Nutricional</h4>
                                                        <div className="space-y-4">
                                                            <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                                                                <span className="text-[10px] font-black text-slate-400">CARBOHIDRATOS</span>
                                                                <span className="text-lg font-tech font-black text-sky-400">{meal.car}g</span>
                                                            </div>
                                                            <div className="flex justify-between items-center bg-white/5 p-4 rounded-2xl">
                                                                <span className="text-[10px] font-black text-slate-400">GRASAS</span>
                                                                <span className="text-lg font-tech font-black text-yellow-500">{meal.fat}g</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    </Accordion>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>

            {/* --- RIGHT SIDEBAR --- */}
            <div className="w-full lg:w-96 space-y-6 sm:space-y-8">
                {/* Hydration Card */}
                <Card className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] border-white/5 rounded-2xl sm:rounded-[2.5rem] p-5 sm:p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 h-40 w-40 bg-blue-500/5 blur-[80px] rounded-full group-hover:bg-blue-500/10 transition-all" />
                    <div className="relative z-10 space-y-5 sm:space-y-8">
                        <div className="flex items-center gap-3">
                            <Droplets className="h-5 w-5 text-blue-400 shrink-0" />
                            <h2 className="text-xs sm:text-sm font-black text-white uppercase tracking-widest">Hidratación Diaria Recomendada</h2>
                        </div>

                        <div className="text-center space-y-1">
                            <div className="flex items-center justify-center gap-2 text-white">
                                <h3 className="text-4xl sm:text-6xl font-tech font-black tracking-tighter">
                                    {patientWeight ? (parseFloat(patientWeight) * 35).toLocaleString() : "2,100"}
                                </h3>
                                <span className="text-lg font-black text-blue-400 mt-6 ml-1">ml</span>
                            </div>
                            <p className="text-[13px] font-black text-slate-500 uppercase tracking-widest font-tech">Requerimiento Base</p>
                        </div>

                        <div className="h-px bg-white/5 w-full" />

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 rounded-2xl p-4 sm:p-6 text-center space-y-2 border border-white/5 hover:bg-white/10 transition-colors">
                                <GlassWater className="h-5 w-5 text-blue-400 mx-auto" />
                                <div className="space-y-0">
                                    <h4 className="text-2xl font-tech font-black text-white">
                                        {patientWeight ? ((parseFloat(patientWeight) * 35) / 250).toFixed(1) : "8.4"}
                                    </h4>
                                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-tighter">Vasos (250ml)</p>
                                </div>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-4 sm:p-6 text-center space-y-2 border border-white/5 hover:bg-white/10 transition-colors">
                                <Milk className="h-5 w-5 text-blue-500 mx-auto" />
                                <div className="space-y-0">
                                    <h4 className="text-2xl font-tech font-black text-white">
                                        {patientWeight ? ((parseFloat(patientWeight) * 35) / 500).toFixed(1) : "4.2"}
                                    </h4>
                                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-tighter">Botellas (500ml)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Information Sections */}
                <div className="space-y-4">
                    <Accordion type="single" collapsible className="space-y-4">
                    </Accordion>

                </div>
            </div>
        </div>
    );
}
