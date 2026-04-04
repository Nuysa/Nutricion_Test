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
    Scale
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

    const [complianceLogs, setComplianceLogs] = useState<any>({});
    const [activeRegDay, setActiveRegDay] = useState("");
    const [activeRegMealId, setActiveRegMealId] = useState<string | null>(null);
    const [isSavingCompliance, setIsSavingCompliance] = useState(false);
    const { toast } = useToast();
    const [patientId, setPatientId] = useState<string | null>(null);
    const [patientWeight, setPatientWeight] = useState<number | null>(null);

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
                .eq("patient_id", patient.id)
                .gte("date", yearStr(monday))
                .lte("date", yearStr(sunday))
                .order("date", { ascending: true });

            // Fetch Flexible Plan (if applicable)
            const weekNum = weekOffset + 1; // Assuming 0 is week 1
            const { data: flexData } = await supabase
                .from("flexible_plans")
                .select("data")
                .eq("patient_id", patient.id)
                .eq("week_number", weekNum)
                .single();

            if (flexData && flexData.data) {
                setFlexiblePlan(flexData.data);
                const p = flexData.data;
                const activeWeight = currentPatientWeight > 0 ? currentPatientWeight : (p.peso || 0);
                
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

    const complianceDays = useMemo(() => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) + (weekOffset * 7);
        const monday = new Date(new Date(today).setDate(diff));

        return [0, 1, 2, 3, 4, 5, 6].map(offset => {
            const d = new Date(monday);
            d.setDate(monday.getDate() + offset);
            const dY = d.getFullYear();
            const dM = String(d.getMonth() + 1).padStart(2, '0');
            const dD = String(d.getDate()).padStart(2, '0');
            return {
                name: DAYS_SHORT[offset].label,
                date: `${dY}-${dM}-${dD}`,
                num: d.getDate()
            };
        });
    }, [weekOffset]);

    useEffect(() => {
        if (complianceDays.length > 0 && !activeRegDay) {
            setActiveRegDay(complianceDays[0].date);
        }
    }, [complianceDays]);

    const fetchCompliance = async () => {
        if (!patientId) return;
        const { data, error } = await supabase
            .from('flexible_plan_compliance')
            .select('*')
            .eq('patient_id', patientId);

        if (data) {
            const logs: any = {};
            data.forEach(row => {
                if (!logs[row.date]) logs[row.date] = {};
                if (!logs[row.date][row.meal_id]) logs[row.date][row.meal_id] = {};
                logs[row.date][row.meal_id][row.food_group] = row.ingredients;
            });
            setComplianceLogs(logs);
        }
    };

    useEffect(() => {
        fetchCompliance();
    }, [patientId]);

    const addIngredientToLog = (groupKey: string, ingredient: string, portion: string = "") => {
        if (!activeRegMealId || !activeRegDay || !flexiblePlan) {
            toast({
                title: "Selecciona una comida",
                description: "Haz clic en una comida del registro de cumplimiento primero.",
                variant: "destructive"
            });
            return;
        }

        const meal = flexiblePlan.meals.find((m: any) => m.id === activeRegMealId);
        if (!meal) return;

        let resolvedGroup = groupKey;

        // Smart resolution for Dairy and Proteins
        // We look for ANY group in the meal that starts with the same prefix
        if (groupKey.startsWith('lac-')) {
            const foundRow = meal.rows.find((r: any) => r.group.startsWith('lac-'));
            if (foundRow) resolvedGroup = foundRow.group;
        } else if (groupKey.startsWith('pro-')) {
            const foundRow = meal.rows.find((r: any) => r.group.startsWith('pro-'));
            if (foundRow) resolvedGroup = foundRow.group;
        }

        // Final check: does the group exist?
        const groupExists = meal.rows.some((r: any) => r.group === resolvedGroup);

        if (!groupExists) {
            toast({
                title: "Grupo no disponible",
                description: `Esta comida no incluye porciones de ${DB_PORCIONES[groupKey]?.label || groupKey}.`,
                variant: "destructive"
            });
            return;
        }

        setComplianceLogs((prev: Record<string, any>) => {
            const dayLogs = prev[activeRegDay] || {};
            const mealLogs = dayLogs[activeRegMealId] || {};
            const groupIngredients = mealLogs[resolvedGroup] || [];

            const ingredientWithPortion = portion ? `${portion} ${ingredient}` : ingredient;

            if (groupIngredients.includes(ingredientWithPortion)) {
                toast({
                    title: "Ya agregado",
                    description: `${ingredientWithPortion} ya está en la lista de ${DB_PORCIONES[resolvedGroup]?.label || resolvedGroup}.`,
                });
                return prev;
            }

            console.log("Adding to logs:", { day: activeRegDay, meal: activeRegMealId, group: resolvedGroup, item: ingredientWithPortion });

            return {
                ...prev,
                [activeRegDay]: {
                    ...dayLogs,
                    [activeRegMealId]: {
                        ...mealLogs,
                        [resolvedGroup]: [...groupIngredients, ingredientWithPortion]
                    }
                }
            };
        });

        toast({
            title: "Agregado",
            description: `${ingredient} agregado a ${DB_PORCIONES[resolvedGroup]?.label || resolvedGroup.toUpperCase()}`,
            className: "bg-[#151F32] border-[#FF7A00] text-white"
        });
    };

    const removeIngredientFromLog = (mealId: string, group: string, ingredient: string) => {
        setComplianceLogs((prev: Record<string, any>) => {
            const dayLogs = prev[activeRegDay] || {};
            const mealLogs = dayLogs[mealId] || {};
            const groupIngredients = mealLogs[group] || [];

            return {
                ...prev,
                [activeRegDay]: {
                    ...dayLogs,
                    [mealId]: {
                        ...mealLogs,
                        [group]: groupIngredients.filter((i: any) => i !== ingredient)
                    }
                }
            };
        });
    };

    const saveCompliance = async () => {
        if (!patientId || !activeRegDay) {
            console.error("Missing patientId or activeRegDay", { patientId, activeRegDay });
            toast({
                title: "Error de sesión",
                description: "No se pudo identificar al paciente o el día seleccionado.",
                variant: "destructive"
            });
            return;
        }

        setIsSavingCompliance(true);
        console.log("Saving compliance for day:", activeRegDay, "Patient:", patientId);

        try {
            const dayLogs = (complianceLogs[activeRegDay] || {}) as Record<string, any>;
            const inserts = [];

            for (const [mealId, mealGroups] of Object.entries(dayLogs)) {
                for (const [group, ingredients] of Object.entries(mealGroups as Record<string, any>)) {
                    if (ingredients && (ingredients as any[]).length > 0) {
                        inserts.push({
                            patient_id: patientId,
                            date: activeRegDay,
                            meal_id: mealId,
                            food_group: group,
                            ingredients: ingredients
                        });
                    }
                }
            }

            // Always delete current day records first to ensure a fresh save/overwrite
            const { error: deleteError } = await supabase
                .from('flexible_plan_compliance')
                .delete()
                .eq('patient_id', patientId)
                .eq('date', activeRegDay);

            if (deleteError) throw deleteError;

            if (inserts.length > 0) {
                const { error } = await supabase
                    .from('flexible_plan_compliance')
                    .insert(inserts);
                if (error) throw error;
            }

            toast({
                title: "Plan Guardado",
                description: `Registro del día ${activeRegDay} actualizado.`,
                className: "bg-[#151F32] border-emerald-500 text-white"
            });

            // Trigger global sync for sidebar
            const bc = new BroadcastChannel('nutrigo_global_sync');
            bc.postMessage('refresh');
            bc.close();
        } catch (err: any) {
            toast({
                title: "Error al guardar",
                description: err.message,
                variant: "destructive"
            });
        } finally {
            setIsSavingCompliance(false);
        }
    };

    if (loading) return (
        <div className="flex items-center justify-center p-20">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>
    );

    return (
        <div className="flex flex-col lg:flex-row gap-10 bg-[#0B1120] text-slate-100 p-2 sm:p-6 lg:p-10 min-h-screen font-sans overflow-x-hidden">
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
                        <h2 className="text-4xl font-black text-white tracking-tight mb-4 uppercase tracking-[0.2em]">Aún no tienes un plan</h2>
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
                    <div className="space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-700">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div className="flex items-center gap-6">
                                <div className="h-16 w-16 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                                    <Zap className="h-8 w-8 text-orange-500" />
                                </div>
                                <div>
                                    <h1 className="text-4xl font-black tracking-tight text-white mb-1">Plan Flexible</h1>
                                    <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">CUMPLIMIENTO DE MACROS Y PORCIONES</p>
                                        {patientWeight && (
                                            <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-lg w-fit">
                                                <Scale className="h-3 w-3 text-orange-500" />
                                                <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest">PESO CARGADO: {patientWeight}kg</span>
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

                                <div className="bg-[#151F32] rounded-2xl px-6 py-2.5 border border-white/5 shadow-2xl flex items-center gap-4">
                                    <Calendar className="h-4 w-4 text-[#FF7A00]" />
                                    <span className="text-sm font-black text-white uppercase tracking-tight">
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

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                            <Card className="bg-[#151F32] border-white/5 p-6 rounded-[2rem] shadow-2xl relative group overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 flex flex-col items-end">
                                    <Flame className="h-5 w-5 text-orange-500 mb-1" />
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">KCAL</span>
                                </div>
                                <span className="text-5xl font-tech font-black text-white block mb-1">{goals.kcal}</span>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-orange-500 w-[100%] rounded-full shadow-[0_0_10px_rgba(255,122,0,0.5)]" />
                                </div>
                                <p className="mt-3 text-[9px] font-black text-orange-500 uppercase tracking-widest">Calorías Totales</p>
                            </Card>

                            <Card className="bg-[#151F32] border-white/5 p-6 rounded-[2rem] shadow-2xl relative group overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 flex flex-col items-end">
                                    <Drumstick className="h-5 w-5 text-sky-400 mb-1" />
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">PROT</span>
                                </div>
                                <span className="text-5xl font-tech font-black text-sky-400 block mb-1">{goals.pro}g</span>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-sky-400 w-[100%] rounded-full" />
                                </div>
                                <p className="mt-3 text-[9px] font-black text-sky-400 uppercase tracking-widest">Proteínas</p>
                            </Card>

                            <Card className="bg-[#151F32] border-white/5 p-6 rounded-[2rem] shadow-2xl relative group overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 flex flex-col items-end">
                                    <Wheat className="h-5 w-5 text-yellow-500 mb-1" />
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">CHO</span>
                                </div>
                                <span className="text-5xl font-tech font-black text-yellow-500 block mb-1">{goals.car}g</span>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-yellow-500 w-[100%] rounded-full" />
                                </div>
                                <p className="mt-3 text-[9px] font-black text-yellow-500 uppercase tracking-widest">Carbohidratos</p>
                            </Card>

                            <Card className="bg-[#151F32] border-white/5 p-6 rounded-[2rem] shadow-2xl relative group overflow-hidden">
                                <div className="absolute top-0 right-0 p-4 flex flex-col items-end">
                                    <Droplets className="h-5 w-5 text-emerald-400 mb-1" />
                                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">FAT</span>
                                </div>
                                <span className="text-5xl font-tech font-black text-emerald-400 block mb-1">{goals.fat}g</span>
                                <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-emerald-400 w-[100%] rounded-full" />
                                </div>
                                <p className="mt-3 text-[9px] font-black text-emerald-400 uppercase tracking-widest">Grasas</p>
                            </Card>
                        </div>

                        {/* Flexible Plan Details */}
                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-10">
                            {/* Distribution / Plate View */}
                            <div className="xl:col-span-12 space-y-12">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
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
                                                                <AccordionTrigger className="hover:no-underline p-0 px-8 py-6">
                                                                    <div className="flex flex-col w-full pr-4 text-left gap-4">
                                                                        <div className="flex items-center justify-between w-full">
                                                                            <div className="flex items-center gap-6">
                                                                                <div className="h-12 w-12 rounded-2xl bg-[#0B1120] flex items-center justify-center border border-white/5 text-orange-500">
                                                                                    <Clock className="h-5 w-5" />
                                                                                </div>
                                                                                <span className="font-tech font-black text-sm text-white tracking-widest uppercase block">{meal.name}</span>
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
                                                                    <div className="p-8 space-y-6 bg-[#0B1120]/30">
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

                                            {/* Column Right: Empty/Tracking Cards (Placeholder) */}
                                            <div className="space-y-6">
                                                <div className="flex items-center justify-between mb-6">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-1 w-12 bg-orange-500 rounded-full" />
                                                        <h3 className="text-xs font-black text-slate-500 uppercase tracking-[0.3em]">Registro de Cumplimiento</h3>
                                                    </div>
                                                    <Button
                                                        size="sm"
                                                        onClick={saveCompliance}
                                                        disabled={isSavingCompliance}
                                                        className="bg-[#FF7A00] hover:bg-[#FF7A00]/90 text-white font-black text-[10px] uppercase tracking-widest px-6 rounded-xl border border-white/10 shadow-[0_10px_20px_rgba(255,122,0,0.2)]"
                                                    >
                                                        {isSavingCompliance ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <>
                                                                <Save className="h-4 w-4 mr-2" />
                                                                Guardar Plan
                                                            </>
                                                        )}
                                                    </Button>
                                                </div>

                                                {/* Day Toggles for Compliance */}
                                                <div className="flex items-center gap-2 overflow-x-auto pb-4 scrollbar-hide">
                                                    {complianceDays.map((d) => (
                                                        <button
                                                            key={d.date}
                                                            onClick={() => setActiveRegDay(d.date)}
                                                            className={cn(
                                                                "flex flex-col items-center justify-center min-w-[50px] p-3 rounded-2xl border transition-all",
                                                                activeRegDay === d.date
                                                                    ? "bg-orange-500 border-orange-500 text-white shadow-lg shadow-orange-500/20"
                                                                    : "bg-white/5 border-white/5 text-slate-500 hover:bg-white/10"
                                                            )}
                                                        >
                                                            <span className="text-[8px] font-black">{d.name}</span>
                                                            <span className="text-xs font-tech font-black tracking-tighter">{d.num}</span>
                                                        </button>
                                                    ))}
                                                </div>

                                                <div className="space-y-4">
                                                    {flexiblePlan.meals.filter((m: any) => m.active).map((meal: any) => {
                                                        const isSelected = activeRegMealId === meal.id;
                                                        const mealLog = complianceLogs[activeRegDay]?.[meal.id] || {};

                                                        return (
                                                            <Card
                                                                key={`empty-${meal.id}`}
                                                                onClick={() => setActiveRegMealId(meal.id)}
                                                                className={cn(
                                                                    "bg-[#151F32]/50 border-white/5 rounded-3xl overflow-hidden shadow-xl border-dashed border-2 cursor-pointer transition-all",
                                                                    isSelected ? "border-orange-500 opacity-100 ring-4 ring-orange-500/10 scale-[1.02]" : "opacity-80 hover:opacity-100 hover:border-white/10"
                                                                )}
                                                            >
                                                                <div className="p-8">
                                                                    <div className="flex items-center justify-between mb-8">
                                                                        <div className="flex items-center gap-6">
                                                                            <span className={cn(
                                                                                "font-tech font-black text-xs tracking-widest uppercase transition-colors",
                                                                                isSelected ? "text-orange-500" : "text-slate-400"
                                                                            )}>{meal.name}</span>
                                                                        </div>
                                                                        {isSelected && (
                                                                            <div className="animate-pulse flex items-center gap-2">
                                                                                <div className="h-2 w-2 rounded-full bg-orange-500" />
                                                                                <span className="text-[8px] font-black text-orange-500 uppercase tracking-widest">En edición</span>
                                                                            </div>
                                                                        )}
                                                                    </div>

                                                                    <div className="space-y-4">
                                                                        {meal.rows.map((row: any) => {
                                                                            const ingredients = mealLog[row.group] || [];
                                                                            return (
                                                                                <div key={`row-empty-${row.id}`} className="space-y-2">
                                                                                    <div className="flex items-center justify-between">
                                                                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                                                                            {DB_PORCIONES[row.group]?.label || row.group.replace('-', ' ')}
                                                                                        </span>
                                                                                        <span className="text-[10px] font-tech text-slate-600 uppercase">{row.portions} porc.</span>
                                                                                    </div>

                                                                                    <div className={cn(
                                                                                        "min-h-[3rem] w-full bg-[#0B1120]/50 rounded-xl border border-white/5 p-3 flex flex-wrap gap-2 transition-all",
                                                                                        isSelected && ingredients.length === 0 && "border-orange-500/30 bg-orange-500/5"
                                                                                    )}>
                                                                                        {ingredients.length > 0 ? (
                                                                                            ingredients.map((ing: string, idx: number) => (
                                                                                                <Badge
                                                                                                    key={idx}
                                                                                                    variant="outline"
                                                                                                    className="bg-orange-500/10 border-orange-500/20 text-orange-400 text-[9px] font-black pr-1 hover:bg-orange-500/20 group/badge transition-all"
                                                                                                >
                                                                                                    {ing}
                                                                                                    <Trash2
                                                                                                        className="h-3 w-3 ml-2 cursor-pointer text-orange-500/50 hover:text-red-500 transition-colors"
                                                                                                        onClick={(e) => {
                                                                                                            e.stopPropagation();
                                                                                                            removeIngredientFromLog(meal.id, row.group, ing);
                                                                                                        }}
                                                                                                    />
                                                                                                </Badge>
                                                                                            ))
                                                                                        ) : (
                                                                                            <span className="text-[9px] text-slate-700 font-bold uppercase tracking-widest self-center px-2">
                                                                                                {isSelected ? "Selecciona en la guía ▼" : "Vació"}
                                                                                            </span>
                                                                                        )}
                                                                                    </div>
                                                                                </div>
                                                                            );
                                                                        })}
                                                                    </div>
                                                                </div>
                                                            </Card>
                                                        );
                                                    })}
                                                </div>
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
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                            <div className="space-y-3">
                                <div className="flex items-center gap-4">
                                    <Calendar className="h-8 w-8 text-[#FF7A00]" />
                                    <h1 className="text-3xl font-black tracking-tight text-white leading-none uppercase">
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
                        <div className="flex items-center gap-4 overflow-x-auto pb-4 scrollbar-hide">
                            {weeklyPlan.map((d, idx) => {
                                const dayShort = DAYS_SHORT[idx].label;
                                const isSelected = activeDay === d.day;
                                return (
                                    <button
                                        key={d.day}
                                        onClick={() => setActiveDay(d.day)}
                                        className={cn(
                                            "flex flex-col items-center justify-center min-w-[70px] h-20 rounded-[1.5rem] transition-all relative border overflow-hidden",
                                            isSelected
                                                ? "bg-gradient-to-br from-[#FF7A00] to-[#FF9D42] text-white border-[#FF7A00] shadow-[0_10px_20px_rgba(255,122,0,0.2)] scale-110 z-10"
                                                : "bg-white/5 border-white/5 text-slate-400 hover:bg-white/10"
                                        )}
                                    >
                                        <span className="text-[10px] font-black uppercase tracking-widest">{dayShort}</span>
                                        <span className="text-xl font-tech font-black">{d.dateNum}</span>
                                        {isSelected && <div className="absolute top-0 right-0 p-1"><CheckCircle className="h-3 w-3 text-white/50" /></div>}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Active Day Banner Macros */}
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-8 px-10 bg-white/5 rounded-[2.5rem] border border-white/5">
                            <div className="flex items-center gap-4">
                                <div className="h-12 w-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                                    <Repeat className="h-6 w-6 text-orange-500" />
                                </div>
                                <h2 className="text-2xl font-black text-white tracking-tight">Menú de {activeDay}</h2>
                            </div>

                            <div className="flex flex-wrap items-center gap-4">
                                <div className="bg-orange-500 text-white px-5 py-2.5 rounded-full flex items-center gap-2 shadow-lg shadow-orange-500/10">
                                    <Flame className="h-4 w-4" />
                                    <span className="text-sm font-tech font-black">{goals.kcal} kcal</span>
                                </div>
                                <div className="bg-[#1e293b] border border-white/10 text-slate-300 px-5 py-2.5 rounded-full flex items-center gap-2">
                                    <span className="text-[9px] font-black uppercase text-slate-500">PRO:</span>
                                    <span className="text-sm font-tech font-black text-slate-300">{goals.pro}g</span>
                                </div>
                                <div className="bg-[#1e293b] border border-white/10 text-sky-400 px-5 py-2.5 rounded-full flex items-center gap-2">
                                    <span className="text-[9px] font-black uppercase text-slate-500">CAR:</span>
                                    <span className="text-sm font-tech font-black text-sky-400">{goals.car}g</span>
                                </div>
                                <div className="bg-[#1e293b] border border-white/10 text-yellow-500 px-5 py-2.5 rounded-full flex items-center gap-2">
                                    <span className="text-[9px] font-black uppercase text-slate-500">FAT:</span>
                                    <span className="text-sm font-tech font-black text-yellow-500">{goals.fat}g</span>
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
                                            <AccordionTrigger className="px-10 py-8 hover:no-underline group">
                                                <div className="flex flex-col sm:flex-row items-center w-full gap-8">
                                                    <div className="flex items-center gap-6 min-w-[240px]">
                                                        <div className="h-16 w-16 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 group-hover:bg-orange-500 group-hover:text-white transition-all duration-500 border border-orange-500/10">
                                                            <Icon className="h-8 w-8" />
                                                        </div>
                                                        <div className="text-left">
                                                            <h3 className="text-xl font-black text-white leading-tight uppercase tracking-widest">{info.label}</h3>
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
                                            <AccordionContent className="px-10 pb-10">
                                                <div className="pt-8 border-t border-white/5 grid grid-cols-1 lg:grid-cols-12 gap-10">
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
            <div className="w-full lg:w-96 space-y-8">
                {/* Hydration Card */}
                <Card className="bg-gradient-to-br from-[#1E293B] to-[#0F172A] border-white/5 rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden group">
                    <div className="absolute top-0 right-0 h-40 w-40 bg-blue-500/5 blur-[80px] rounded-full group-hover:bg-blue-500/10 transition-all" />
                    <div className="relative z-10 space-y-8">
                        <div className="flex items-center gap-3">
                            <Droplets className="h-5 w-5 text-blue-400" />
                            <h2 className="text-sm font-black text-white uppercase tracking-widest">Hidratación Diaria Recomendada</h2>
                        </div>

                        <div className="text-center space-y-1">
                            <div className="flex items-center justify-center gap-2">
                                <h3 className="text-6xl font-tech font-black text-white tracking-tighter">2,100</h3>
                                <span className="text-lg font-black text-blue-400 mt-6 ml-1">ml</span>
                            </div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest font-tech">Requerimiento Base</p>
                        </div>

                        <div className="h-px bg-white/5 w-full" />

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 rounded-2xl p-6 text-center space-y-2 border border-white/5 hover:bg-white/10 transition-colors">
                                <GlassWater className="h-5 w-5 text-blue-400 mx-auto" />
                                <div className="space-y-0">
                                    <h4 className="text-2xl font-tech font-black text-white">8.4</h4>
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Vasos (250ml)</p>
                                </div>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-6 text-center space-y-2 border border-white/5 hover:bg-white/10 transition-colors">
                                <Milk className="h-5 w-5 text-blue-500 mx-auto" />
                                <div className="space-y-0">
                                    <h4 className="text-2xl font-tech font-black text-white">4.2</h4>
                                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-tighter">Botellas (500ml)</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </Card>

                {/* Information Sections */}
                <div className="space-y-4">
                    <Accordion type="single" collapsible className="space-y-4">
                        <AccordionItem value="shopping-list" className="border-none">
                            <AccordionTrigger className="bg-white/5 hover:bg-white/10 rounded-[1.5rem] px-8 py-5 text-slate-100 hover:no-underline border border-white/5 group transition-all">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 group-hover:scale-110 transition-transform">
                                        <Repeat className="h-5 w-5 text-orange-500" />
                                    </div>
                                    <div className="text-left">
                                        <h3 className="font-black text-sm tracking-tight leading-none mb-1 uppercase">Guia de intercambio</h3>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest leading-none">Equivalencias y porciones recomendadas</p>
                                    </div>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="p-0 bg-transparent rounded-b-[1.5rem] border-none mt-4">
                                <Accordion type="multiple" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {/* ALMIDÓN */}
                                    <AccordionItem value="cat-almidon" className="border-none">
                                        <Card className="bg-[#151F32] border-white/5 rounded-2xl overflow-hidden shadow-xl">
                                            <AccordionTrigger className="px-6 py-4 hover:no-underline bg-gradient-to-r from-orange-500/10 to-transparent">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_10px_#FF7A00]" />
                                                    <span className="font-black text-xs text-white uppercase tracking-widest">Almidón</span>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="px-6 pb-6 pt-2">
                                                <div className="space-y-2 divide-y divide-white/5">
                                                    {[
                                                        { n: "Arroz cocido", p: "1/3 tz o 55g" },
                                                        { n: "Arroz crudo", p: "22g" },
                                                        { n: "Quinua cocida", p: "1/3 tz o 50g" },
                                                        { n: "Pan francés", p: "1 unid o 30g" },
                                                        { n: "Papa cocida", p: "1 unid peq o 80g" },
                                                        { n: "Camote cocido", p: "1/2 unid med o 80g" }
                                                    ].map((f, i) => (
                                                        <div
                                                            key={i}
                                                            onClick={() => addIngredientToLog('almidon', f.n, f.p)}
                                                            className="flex justify-between py-2.5 items-center group cursor-pointer hover:bg-white/[0.03] px-2 -mx-2 rounded-lg transition-all"
                                                        >
                                                            <span className="text-[11px] text-slate-400 font-medium group-hover:text-white transition-colors">{f.n}</span>
                                                            <span className="text-[10px] font-tech font-black text-orange-500/80 group-hover:scale-110 transition-transform">{f.p}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </AccordionContent>
                                        </Card>
                                    </AccordionItem>

                                    {/* FRUTAS */}
                                    <AccordionItem value="cat-frutas" className="border-none">
                                        <Card className="bg-[#151F32] border-white/5 rounded-2xl overflow-hidden shadow-xl">
                                            <AccordionTrigger className="px-6 py-4 hover:no-underline bg-gradient-to-r from-emerald-500/10 to-transparent">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_10px_#10b981]" />
                                                    <span className="font-black text-xs text-white uppercase tracking-widest">Frutas</span>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="px-6 pb-6 pt-2">
                                                <div className="space-y-2 divide-y divide-white/5">
                                                    {[
                                                        { n: "Arándanos", p: "3/4 tz o 100g" },
                                                        { n: "Manzana", p: "1 unid pq o 120g" },
                                                        { n: "Plátano seda", p: "1/2 unid o 80g" },
                                                        { n: "Papaya", p: "1 tz o 240g" },
                                                        { n: "Fresas", p: "8 unid o 180g" },
                                                        { n: "Mandarina", p: "2 unid med o 210g" }
                                                    ].map((f, i) => (
                                                        <div
                                                            key={i}
                                                            onClick={() => addIngredientToLog('fruta', f.n, f.p)}
                                                            className="flex justify-between py-2.5 items-center group cursor-pointer hover:bg-white/[0.03] px-2 -mx-2 rounded-lg transition-all"
                                                        >
                                                            <span className="text-[11px] text-slate-400 font-medium group-hover:text-white transition-colors">{f.n}</span>
                                                            <span className="text-[10px] font-tech font-black text-emerald-500/80 group-hover:scale-110 transition-transform">{f.p}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </AccordionContent>
                                        </Card>
                                    </AccordionItem>

                                    {/* LÁCTEOS */}
                                    <AccordionItem value="cat-lacteos" className="border-none">
                                        <Card className="bg-[#151F32] border-white/5 rounded-2xl overflow-hidden shadow-xl">
                                            <AccordionTrigger className="px-6 py-4 hover:no-underline bg-gradient-to-r from-blue-500/10 to-transparent">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_10px_#3b82f6]" />
                                                    <span className="font-black text-xs text-white uppercase tracking-widest">Lácteos</span>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="px-6 pb-6 pt-2">
                                                <div className="space-y-2 divide-y divide-white/5">
                                                    {[
                                                        { n: "Leche descremada", p: "1 tz o 240g" },
                                                        { n: "Yogurt griego natural", p: "150g" },
                                                        { n: "Leche de soja", p: "1 tz o 240ml" },
                                                        { n: "Queso fresco", p: "40g" }
                                                    ].map((f, i) => (
                                                        <div
                                                            key={i}
                                                            onClick={() => addIngredientToLog('lac-des', f.n, f.p)}
                                                            className="flex justify-between py-2.5 items-center group cursor-pointer hover:bg-white/[0.03] px-2 -mx-2 rounded-lg transition-all"
                                                        >
                                                            <span className="text-[11px] text-slate-400 font-medium group-hover:text-white transition-colors">{f.n}</span>
                                                            <span className="text-[10px] font-tech font-black text-blue-500/80 group-hover:scale-110 transition-transform">{f.p}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </AccordionContent>
                                        </Card>
                                    </AccordionItem>

                                    {/* PROTEÍNAS */}
                                    <AccordionItem value="cat-proteinas" className="border-none">
                                        <Card className="bg-[#151F32] border-white/5 rounded-2xl overflow-hidden shadow-xl">
                                            <AccordionTrigger className="px-6 py-4 hover:no-underline bg-gradient-to-r from-red-500/10 to-transparent">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_10px_#ef4444]" />
                                                    <span className="font-black text-xs text-white uppercase tracking-widest">Proteínas</span>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="px-6 pb-6 pt-2">
                                                <div className="space-y-2 divide-y divide-white/5">
                                                    {[
                                                        { n: "Pollo magro cocido", p: "30g" },
                                                        { n: "Pescado blanco", p: "40g" },
                                                        { n: "Huevo de gallina", p: "1 unid o 50g" },
                                                        { n: "Atún en agua", p: "1/3 lata o 30g" },
                                                        { n: "Lomo de cerdo magro", p: "30g" }
                                                    ].map((f, i) => (
                                                        <div
                                                            key={i}
                                                            onClick={() => addIngredientToLog('pro-bajo', f.n, f.p)}
                                                            className="flex justify-between py-2.5 items-center group cursor-pointer hover:bg-white/[0.03] px-2 -mx-2 rounded-lg transition-all"
                                                        >
                                                            <span className="text-[11px] text-slate-400 font-medium group-hover:text-white transition-colors">{f.n}</span>
                                                            <span className="text-[10px] font-tech font-black text-red-500/80 group-hover:scale-110 transition-transform">{f.p}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </AccordionContent>
                                        </Card>
                                    </AccordionItem>

                                    {/* GRASAS */}
                                    <AccordionItem value="cat-grasas" className="border-none">
                                        <Card className="bg-[#151F32] border-white/5 rounded-2xl overflow-hidden shadow-xl">
                                            <AccordionTrigger className="px-6 py-4 hover:no-underline bg-gradient-to-r from-yellow-500/10 to-transparent">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-2 w-2 rounded-full bg-yellow-500 shadow-[0_0_10px_#eab308]" />
                                                    <span className="font-black text-xs text-white uppercase tracking-widest">Grasas</span>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="px-6 pb-6 pt-2">
                                                <div className="space-y-2 divide-y divide-white/5">
                                                    {[
                                                        { n: "Palta (Aguacate)", p: "2 cdas o 40g" },
                                                        { n: "Aceite de Oliva", p: "1 cdta o 5g" },
                                                        { n: "Almendras", p: "10 unid o 12g" },
                                                        { n: "Mantequilla maní", p: "1 cdta o 8g" }
                                                    ].map((f, i) => (
                                                        <div
                                                            key={i}
                                                            onClick={() => addIngredientToLog('grasa', f.n, f.p)}
                                                            className="flex justify-between py-2.5 items-center group cursor-pointer hover:bg-white/[0.03] px-2 -mx-2 rounded-lg transition-all"
                                                        >
                                                            <span className="text-[11px] text-slate-400 font-medium group-hover:text-white transition-colors">{f.n}</span>
                                                            <span className="text-[10px] font-tech font-black text-yellow-500/80 group-hover:scale-110 transition-transform">{f.p}</span>
                                                        </div>
                                                    ))}
                                                </div>
                                            </AccordionContent>
                                        </Card>
                                    </AccordionItem>
                                </Accordion>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div>
            </div>
        </div>
    );
}
