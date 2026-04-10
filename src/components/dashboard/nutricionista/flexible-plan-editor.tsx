"use client";

import React, { useState, useMemo, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
    ClipboardList,
    Target,
    PieChart,
    Layers,
    Save,
    Clock,
    Plus,
    Trash2,
    Sparkles,
    LayoutDashboard,
    Activity,
    User,
    Calendar,
    ChevronLeft,
    ChevronRight,
    Eye
} from "lucide-react";
import { WeeklyNutritionalPlan } from "../paciente/weekly-nutritional-plan";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { VariablesService } from "@/lib/variables-service";
import { useFormulaEngine } from "@/hooks/useFormulaEngine";

// --- CONSTANTS ---
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

interface MealRow {
    id: string;
    group: string;
    portions: number;
    comment: string;
}

interface MealBlock {
    id: string;
    name: string;
    time: string;
    active: boolean;
    title: string;
    rows: MealRow[];
}

export function FlexiblePlanEditor({ 
    patientId, 
    appointmentId,
    pendingAppointments,
    selectedAppointmentId,
    setSelectedAppointmentId
}: { 
    patientId: string; 
    appointmentId?: string;
    pendingAppointments?: any[];
    selectedAppointmentId?: string;
    setSelectedAppointmentId?: (id: string) => void;
}) {
    const [activeTab, setActiveTab] = useState<"calculos" | "resumen" | "vista-paciente">("calculos");
    const [weekOffset, setWeekOffset] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { toast } = useToast();
    const supabase = createClient();
    const { calculate } = useFormulaEngine();

    // --- BIOMETRY STATES ---
    const [genero, setGenero] = useState<"M" | "F">("M");
    const [edad, setEdad] = useState(44);
    const [talla, setTalla] = useState(166);
    const [peso, setPeso] = useState(62.0);
    const [factorActividad, setFactorActividad] = useState(1.3);
    const [gastoEntrenamiento, setGastoEntrenamiento] = useState(300);

    // --- WEEKLY ADJUSTMENT ---
    const [diasEntreno, setDiasEntreno] = useState(0);
    const [ajustePct, setAjustePct] = useState(-22);

    // --- MACRO REQ ---
    const [gChoKg, setGChoKg] = useState(2.8);
    const [gProKg, setGProKg] = useState(1.6);

    // --- PORTIONS STATE ---
    const [portions, setPortions] = useState<Record<string, number>>({
        'almidon': 5,
        'fruta': 4,
        'azucar': 1,
        'verdura': 2,
        'lac-des': 0,
        'lac-semi': 1,
        'lac-ent': 0,
        'pro-cero': 0,
        'pro-bajo': 11.5,
        'pro-mod': 0,
        'pro-alta': 1,
        'grasa': 3
    });

    // --- MEAL BLOCKS ---
    const [meals, setMeals] = useState<MealBlock[]>([
        {
            id: 'pre-entreno',
            name: 'PRE ENTRENO',
            time: '08:30',
            active: true,
            title: 'Huevos cocidos + Bowl de fruta c/ yogurt',
            rows: [
                { id: '1', group: 'lac-semi', portions: 1, comment: 'Yogurt Dan Lac (100g) o Leche light roja Eva Gloria (100g)' },
                { id: '2', group: 'pro-alta', portions: 1, comment: 'Huevos (1 unid) o Queso fresco (25g) o Hot dog San fernando vive bien (55g)' },
                { id: '3', group: 'fruta', portions: 2, comment: 'Platano de seda (80*2)=160g - 1 unid o Papaya (240g*2)=480g - 2 tz o combinar (papaya 240g + piña 180g)' },
                { id: '4', group: 'grasa', portions: 1, comment: 'Creatina + Jamaica' },
            ]
        },
        {
            id: 'desayuno',
            name: 'DESAYUNO',
            time: '10:00',
            active: true,
            title: 'Wraps de atún + Bowl de fruta',
            rows: [
                { id: '5', group: 'almidon', portions: 3, comment: 'Tostada Integral (60g)-3 Unid o Galleta salmas (3 paq) - o Rapiditas (84) - 3 unid' },
                { id: '6', group: 'pro-bajo', portions: 2, comment: 'Jamon de pavita braedt (40*2)=80g o Claras de huevo (50*2)=100g o Queso light mozzarella (18*2)=36g o Quark (45*2)=90g o Atún en agua y sal (30*2)=60g' },
                { id: '7', group: 'azucar', portions: 1, comment: 'Mermelada de fresa light campestre (40g)' },
                { id: '8', group: 'grasa', portions: 1, comment: 'Cafe' },
                { id: '9', group: 'fruta', portions: 1, comment: 'Plátano bizcochito (80g) - 3 unid' },
            ]
        },
        {
            id: 'media-manana',
            name: 'MEDIA MAÑANA',
            time: '11:30',
            active: false,
            title: 'Opciones de media mañana',
            rows: [{ id: 'mm1', group: 'fruta', portions: 1, comment: '1 fruta de estación (Manzana, Mandarina, Pera)' }]
        },
        {
            id: 'almuerzo',
            name: 'ALMUERZO',
            time: '13:00',
            active: true,
            title: 'Fideos rojos c/ verdura',
            rows: [
                { id: '10', group: 'almidon', portions: 2, comment: 'Papa amarilla (160g) o Camote (160g) o Fideos cocidos (102g)' },
                { id: '11', group: 'verdura', portions: 2, comment: 'Verdura fresca o al vapor (2 tz)' },
                { id: '12', group: 'pro-bajo', portions: 4, comment: 'Pescado Tilapia (100g) o Pollo pulpa (100g)' },
                { id: '13', group: 'grasa', portions: 2, comment: 'Palta (88g) o Aceite (10g)' },
            ]
        },
        {
            id: 'media-tarde',
            name: 'MEDIA TARDE',
            time: '17:00',
            active: false,
            title: 'Opciones de media tarde',
            rows: [{ id: 'mt1', group: 'fruta', portions: 1, comment: 'Frutos secos (15g)' }]
        },
        {
            id: 'post-entreno',
            name: 'POST ENTRENO',
            time: '18:30',
            active: false,
            title: 'Recuperación post-entrenamiento',
            rows: [{ id: 'pe1', group: 'pro-bajo', portions: 2, comment: 'Scoop de proteína o 4 claras de huevo' }]
        },
        {
            id: 'cena',
            name: 'CENA',
            time: '20:00',
            active: true,
            title: 'Fideos c/ pollo + bowl de fruta',
            rows: [
                { id: '14', group: 'almidon', portions: 1, comment: 'Fideos cocidos (51g) o Galletas salmas (1 paq)' },
                { id: '15', group: 'pro-bajo', portions: 3, comment: 'Pollo pulpa (90g) o Res (90g)' },
                { id: '16', group: 'grasa', portions: 2, comment: 'Palta (88g) o Pecanas (14g)' },
                { id: '17', group: 'fruta', portions: 1, comment: 'Mandarina (210g)' },
            ]
        }
    ]);

    // --- CALCULATIONS ---
    const bioCalculations = useMemo(() => {
        const tmb = genero === "M"
            ? 66.47 + (13.75 * peso) + (5.0 * talla) - (6.75 * edad)
            : 65.59 + (9.56 * peso) + (5.0 * talla) - (4.7 * edad);

        const gastoBase = tmb * factorActividad;
        const gastoTotal = gastoBase + gastoEntrenamiento;
        const promedio = ((gastoTotal * diasEntreno) + (gastoBase * (7 - diasEntreno))) / 7;
        const ajusteKcal = promedio * (ajustePct / 100);
        const kcalTotales = promedio + ajusteKcal;

        return {
            tmb: Math.round(tmb),
            gastoBase: Math.round(gastoBase),
            gastoTotal: Math.round(gastoTotal),
            promedio: promedio.toFixed(1),
            ajuteKcal: ajusteKcal.toFixed(1),
            kcalTotales: kcalTotales.toFixed(1),
            rawKcal: kcalTotales
        };
    }, [genero, peso, talla, edad, factorActividad, gastoEntrenamiento, diasEntreno, ajustePct]);

    const weekRange = useMemo(() => {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1) + (weekOffset * 7);
        const monday = new Date(new Date(today).setDate(diff));
        const sunday = new Date(new Date(monday).setDate(monday.getDate() + 6));
        return `${monday.toLocaleDateString("es-ES", { day: "2-digit", month: "short" })} - ${sunday.toLocaleDateString("es-ES", { day: "2-digit", month: "short" })} ${sunday.getFullYear()}`;
    }, [weekOffset]);

    const macroReq = useMemo(() => {
        const totCho = gChoKg * peso;
        const totPro = gProKg * peso;
        const kcalCho = totCho * 4;
        const kcalPro = totPro * 4;

        const kcalTotales = bioCalculations.rawKcal;
        let kcalFat = kcalTotales - kcalCho - kcalPro;
        if (kcalFat < 0) kcalFat = 0;
        const totFat = kcalFat / 9;

        return {
            cho: { g: totCho.toFixed(1), kcal: kcalCho.toFixed(1), pct: ((kcalCho / kcalTotales) * 100).toFixed(1) + "%" },
            pro: { g: totPro.toFixed(1), kcal: kcalPro.toFixed(1), pct: ((kcalPro / kcalTotales) * 100).toFixed(1) + "%" },
            fat: { g: totFat.toFixed(1), kcal: kcalFat.toFixed(1), pct: ((kcalFat / kcalTotales) * 100).toFixed(1) + "%", gKg: (totFat / peso).toFixed(1) },
            targets: { kcal: kcalTotales, cho: totCho, pro: totPro, fat: totFat }
        };
    }, [gChoKg, gProKg, peso, bioCalculations]);

    const portionTable = useMemo(() => {
        const results: Record<string, any> = {};
        let totK = 0, totC = 0, totPr = 0, totF = 0;

        Object.entries(portions).forEach(([key, p]) => {
            const d = DB_PORCIONES[key];
            const k = p * d.kcal;
            const c = d.cho !== null ? p * d.cho : 0;
            const pr = d.pro !== null ? p * d.pro : 0;
            const f = d.fat !== null ? p * d.fat : 0;

            results[key] = { k, c, pr, f };
            totK += k; totC += c; totPr += pr; totF += f;
        });

        const adequacy = (logged: number, target: number) => {
            if (target <= 0) return "0%";
            return ((logged / target) * 100).toFixed(1) + "%";
        };

        const getAdequacyColor = (logged: number, target: number) => {
            const pct = (logged / target) * 100;
            if (pct >= 95 && pct <= 105) return "text-emerald-400";
            if (pct < 95) return "text-yellow-400";
            return "text-red-400";
        };

        return {
            rows: results,
            totals: { k: totK, c: totC, pr: totPr, f: totF },
            adequacy: {
                k: adequacy(totK, macroReq.targets.kcal),
                c: adequacy(totC, macroReq.targets.cho),
                pr: adequacy(totPr, macroReq.targets.pro),
                f: adequacy(totF, macroReq.targets.fat)
            },
            colors: {
                k: getAdequacyColor(totK, macroReq.targets.kcal),
                c: getAdequacyColor(totC, macroReq.targets.cho),
                pr: getAdequacyColor(totPr, macroReq.targets.pro),
                f: getAdequacyColor(totF, macroReq.targets.fat)
            }
        };
    }, [portions, macroReq]);

    // --- HANDLERS ---
    const updatePortion = (key: string, val: number) => {
        setPortions(prev => ({ ...prev, [key]: Math.max(0, val) }));
    };

    const toggleMeal = (id: string) => {
        setMeals(prev => {
            const meal = prev.find(m => m.id === id);
            if (!meal) return prev;
            
            const newActiveState = !meal.active;
            toast({
                title: `${meal.name} ${newActiveState ? 'Activado' : 'Desactivado'}`,
                duration: 2000,
            });

            return prev.map(m => m.id === id ? { ...m, active: newActiveState } : m);
        });
    };

    const addRow = (mealId: string) => {
        setMeals(prev => prev.map(m => {
            if (m.id === mealId) {
                return {
                    ...m,
                    rows: [...m.rows, { id: Math.random().toString(), group: 'almidon', portions: 1, comment: '' }]
                };
            }
            return m;
        }));
    };

    const removeRow = (mealId: string, rowId: string) => {
        setMeals(prev => prev.map(m => {
            if (m.id === mealId) {
                return {
                    ...m,
                    rows: m.rows.filter(r => r.id !== rowId)
                };
            }
            return m;
        }));
    };

    // --- DATA PERSISTENCE ---
    const loadPlan = async (week: number) => {
        if (!patientId) return;
        setIsLoading(true);
        try {
            const { data: patient } = await supabase
                .from("patients")
                .select("id, gender, date_of_birth, height_cm, current_weight")
                .eq("id", patientId)
                .single();

            if (patient) {
                // Fetch clinical variables for calculations
                const vars = await VariablesService.getVariables();

                // Obtener el último peso registrado para cálculos más precisos
                const { data: latestRecord } = await supabase
                    .from("weight_records")
                    .select("*")
                    .eq("patient_id", patient.id)
                    .order("date", { ascending: false })
                    .order("created_at", { ascending: false })
                    .limit(1)
                    .maybeSingle();

                const currentPatientWeight = latestRecord?.weight || patient.current_weight || 0;

                // Calculate Age
                let age = 0;
                if (patient.date_of_birth) {
                    const birth = new Date(patient.date_of_birth.includes('T') ? patient.date_of_birth : `${patient.date_of_birth}T12:00:00`);
                    const now = new Date();
                    age = now.getFullYear() - birth.getFullYear();
                    const m = now.getMonth() - birth.getMonth();
                    if (m < 0 || (m === 0 && now.getDate() < birth.getDate())) age--;
                }

                // Prepare inputs for formula engine
                const inputs: Record<string, any> = {
                    ...(latestRecord?.extra_data || {}),
                    "PESO": currentPatientWeight,
                    "TALLA": patient.height_cm || 0,
                    "TALLA_CM": patient.height_cm || 0,
                    "EDAD": age,
                    "GENERO_V": patient.gender === 'masculino' || patient.gender === 'M' ? 1 : (patient.gender === 'femenino' || patient.gender === 'F' ? 2 : 0)
                };

                // Execute calculations (multiple passes for dependencies)
                let diagnosisLabel = "";
                for (let pass = 0; pass < 3; pass++) {
                    vars.forEach(v => {
                        if (v.is_calculated && v.code) {
                            const calc = calculate(v, { gender: patient.gender, age, inputs });
                            inputs[v.code.toUpperCase()] = calc.result;
                            if (v.code === 'DIAGNOSTICO_IMC') {
                                diagnosisLabel = (calc.range?.label || "").toLowerCase();
                            }
                        }
                    });
                }

                // Apply logic for loading initial weight
                let weightToLoad = currentPatientWeight;
                const diagnosis = diagnosisLabel.toLowerCase();

                if (diagnosis.includes("sobrepeso")) {
                    weightToLoad = inputs['PESO_IDEAL'] || currentPatientWeight;
                } else if (diagnosis.includes("obesidad")) {
                    weightToLoad = inputs['PESO_CORREGIDO'] || currentPatientWeight;
                } else if (diagnosis.includes("normal") || diagnosis.includes("bajo peso")) {
                    weightToLoad = currentPatientWeight;
                }

                if (patient.gender) setGenero(patient.gender === 'femenino' || patient.gender === 'F' ? 'F' : 'M');
                if (patient.height_cm) setTalla(Number(patient.height_cm));
                if (weightToLoad > 0) setPeso(Number(weightToLoad));
                setEdad(age);
            }

            const { data, error } = await supabase
                .from("flexible_plans")
                .select("data")
                .eq("patient_id", patientId)
                .eq("week_number", week)
                .single();

            if (data && data.data) {
                const p = data.data;
                // Plan data takes priority for the specific week, except if we want live sync
                // but usually the plan stores what was used for calculations
                if (p.genero) setGenero(p.genero);
                if (p.edad) setEdad(p.edad);
                if (p.talla) setTalla(p.talla);
                if (p.peso) setPeso(p.peso);
                if (p.factorActividad) setFactorActividad(p.factorActividad);
                if (p.gastoEntrenamiento) setGastoEntrenamiento(p.gastoEntrenamiento);
                if (p.diasEntreno) setDiasEntreno(p.diasEntreno);
                if (p.ajustePct) setAjustePct(p.ajustePct);
                if (p.gChoKg) setGChoKg(p.gChoKg);
                if (p.gProKg) setGProKg(p.gProKg);
                if (p.portions) setPortions(p.portions);
                if (p.meals) setMeals(p.meals);
            }
        } catch (err) {
            console.error("Error loading plan:", err);
        } finally {
            setIsLoading(false);
        }
    };

    const savePlan = async () => {
        if (!patientId) return;
        setIsSaving(true);
        const planData = {
            genero, edad, talla, peso, factorActividad, gastoEntrenamiento,
            diasEntreno, ajustePct, gChoKg, gProKg, portions, meals
        };

        try {
            const { error } = await supabase
                .from("flexible_plans")
                .upsert({
                    patient_id: patientId,
                    week_number: weekOffset + 1,
                    data: planData,
                    appointment_id: selectedAppointmentId || appointmentId || null
                }, { onConflict: 'patient_id, week_number' });

            if (error) throw error;

            const finalAptId = selectedAppointmentId || appointmentId;
            if (finalAptId) {
                const { error: aptError } = await supabase
                    .from("appointments")
                    .update({ status: 'completada' })
                    .eq("id", finalAptId);
                
                if (!aptError) {
                    if (setSelectedAppointmentId) setSelectedAppointmentId("");
                    const channel = new BroadcastChannel('nutrigo_global_sync');
                    channel.postMessage({ type: 'APPOINTMENTS_UPDATED' });
                    channel.close();
                }
            }

            toast({
                title: "Plan Guardado",
                description: `Semana actualizada correctamente.`,
                className: "bg-[#151F32] border-[#FF7A00] text-white"
            });
        } catch (err: any) {
            toast({
                title: "Error al guardar",
                description: err.message,
                variant: "destructive"
            });
        } finally {
            setIsSaving(false);
        }
    };

    useEffect(() => {
        loadPlan(weekOffset + 1);
    }, [weekOffset, patientId]);

    return (
        <div className="flex-1 overflow-hidden flex flex-col p-3 sm:p-6 animate-in fade-in duration-500">
            {/* Week and Save Navigation */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 sm:gap-6 mb-4 sm:mb-8 bg-[#0B1120]/50 p-3 sm:p-6 rounded-2xl sm:rounded-[2rem] border border-white/5">
                <div className="flex items-center gap-2 sm:gap-4">
                    <button
                        onClick={() => setWeekOffset(prev => Math.max(0, prev - 1))}
                        className="text-slate-500 hover:text-white transition-colors"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>

                    <div className="bg-[#151F32] rounded-xl sm:rounded-2xl px-3 sm:px-6 py-2 sm:py-2.5 border border-white/5 shadow-2xl flex items-center gap-2 sm:gap-4">
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

                    {pendingAppointments && pendingAppointments.length > 0 && (
                        <div className="bg-[#151F32] rounded-2xl px-6 py-2.5 border border-white/5 shadow-2xl flex items-center gap-4 ml-4">
                            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest border-r border-white/10 pr-4">Vincular Cita</span>
                            <select
                                value={selectedAppointmentId}
                                onChange={e => setSelectedAppointmentId && setSelectedAppointmentId(e.target.value)}
                                className="bg-transparent text-sm font-black text-white outline-none border-none focus:ring-0 cursor-pointer appearance-none"
                            >
                                <option value="" className="bg-[#151F32]">Ninguna</option>
                                {pendingAppointments.map(apt => (
                                    <option key={apt.id} value={apt.id} className="bg-[#151F32]">
                                        {apt.appointment_date} - {apt.start_time.substring(0, 5)}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}
                </div>

                <div className="flex items-center gap-4">
                    <Button
                        onClick={savePlan}
                        disabled={isSaving}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[9px] sm:text-[10px] uppercase tracking-widest rounded-xl px-4 sm:px-8 h-10 sm:h-12 shadow-lg shadow-emerald-600/20 w-full sm:w-auto"
                    >
                        {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                        Guardar Plan
                    </Button>
                </div>
            </div>

            {/* Tabs Selector */}
            <div className="flex bg-[#151F32] rounded-xl sm:rounded-2xl p-1 w-full sm:w-max mb-4 sm:mb-8 border border-white/5 shadow-2xl overflow-x-auto">
                <button
                    onClick={() => setActiveTab("calculos")}
                    className={cn(
                        "flex-1 sm:flex-none px-4 sm:px-8 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-all whitespace-nowrap",
                        activeTab === "calculos" ? "bg-[#FF7A00] text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                    )}
                >
                    Cálculos
                </button>
                <button
                    onClick={() => setActiveTab("resumen")}
                    className={cn(
                        "flex-1 sm:flex-none px-4 sm:px-8 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-all whitespace-nowrap",
                        activeTab === "resumen" ? "bg-[#FF7A00] text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                    )}
                >
                    Resumen
                </button>
                <button
                    onClick={() => setActiveTab("vista-paciente")}
                    className={cn(
                        "flex-1 sm:flex-none px-4 sm:px-8 py-2 sm:py-2.5 rounded-lg sm:rounded-xl font-black text-[10px] sm:text-xs uppercase tracking-[0.15em] sm:tracking-[0.2em] transition-all flex items-center justify-center gap-2 whitespace-nowrap",
                        activeTab === "vista-paciente" ? "bg-blue-600 text-white shadow-lg" : "text-slate-500 hover:text-slate-300"
                    )}
                >
                    <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                    Vista
                </button>
            </div>

            <ScrollArea className="flex-1 -mx-6 px-6">
                {activeTab === "calculos" ? (
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-8 pb-20">
                        {/* Biometría y Gasto */}
                        <div className="xl:col-span-4 space-y-6">
                            <Card className="bg-[#151F32] border-white/5 p-6 rounded-2xl shadow-xl">
                                <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-orange-500/10 flex items-center justify-center text-orange-500">
                                        <ClipboardList className="h-4 w-4" />
                                    </div>
                                    Biometría y Gasto
                                </h3>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center gap-4">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Género</label>
                                        <Select value={genero} onValueChange={(v: any) => setGenero(v)} disabled>
                                            <SelectTrigger className="w-32 bg-[#0B1120] border-white/5 rounded-xl h-9 text-xs font-bold text-white opacity-70">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                                <SelectItem value="M">Hombre</SelectItem>
                                                <SelectItem value="F">Mujer</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {[
                                        { label: 'Edad (años)', val: edad },
                                        { label: 'Talla (cm)', val: talla },
                                        { label: 'Peso (kg)', val: peso },
                                    ].map(field => (
                                        <div key={field.label} className="flex justify-between items-center gap-4">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{field.label}</label>
                                            <div className="flex items-center bg-[#0B1120]/50 rounded-xl border border-white/5 w-32 h-9 justify-center">
                                                <span className="text-white font-tech font-bold text-xs">{field.val}</span>
                                            </div>
                                        </div>
                                    ))}

                                    <div className="bg-blue-500/5 p-4 rounded-xl border border-blue-500/10 flex justify-between items-center mt-6">
                                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Metabolismo Basal</span>
                                        <span className="text-xl font-tech font-bold text-blue-400">{bioCalculations.tmb}</span>
                                    </div>

                                    <div className="pt-4 border-t border-white/5 space-y-4">
                                        <div className="flex justify-between items-center gap-4">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Factor Actividad</label>
                                            <div className="flex items-center bg-[#0B1120] rounded-xl border border-white/5 w-32 overflow-hidden">
                                                <button onClick={() => setFactorActividad(prev => Math.max(1, prev - 0.1))} className="w-9 h-9 text-slate-500 hover:text-white hover:bg-white/5">-</button>
                                                <input type="number" value={factorActividad} step="0.1" onChange={e => setFactorActividad(parseFloat(e.target.value) || 1)} className="w-full bg-transparent text-center text-white font-bold text-xs outline-none" />
                                                <button onClick={() => setFactorActividad(prev => prev + 0.1)} className="w-9 h-9 text-slate-500 hover:text-white hover:bg-white/5">+</button>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gasto s/ Ejercicio</span>
                                            <span className="text-sm font-bold text-white">{bioCalculations.gastoBase}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Calorías Entrenamiento</span>
                                            <input
                                                type="number"
                                                value={gastoEntrenamiento}
                                                onChange={e => setGastoEntrenamiento(parseInt(e.target.value) || 0)}
                                                className="w-24 bg-[#0B1120] border border-white/5 rounded-lg py-1 px-3 text-right text-xs font-bold text-slate-400 outline-none focus:border-orange-500 transition-colors"
                                            />
                                        </div>
                                        <div className="bg-white/5 p-4 rounded-xl border border-white/10 flex justify-between items-center">
                                            <span className="text-[10px] font-black text-white uppercase tracking-widest">Gasto Total (Día Activo)</span>
                                            <span className="text-xl font-tech font-bold text-white">{bioCalculations.gastoTotal}</span>
                                        </div>
                                    </div>
                                </div>
                            </Card>

                            {/* Ajuste Calórico Semanal */}
                            <Card className="bg-[#151F32] border-white/5 p-6 rounded-2xl shadow-xl">
                                <h3 className="text-xs font-black text-white uppercase tracking-[0.3em] mb-6 flex items-center gap-3">
                                    <div className="h-8 w-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-500">
                                        <Target className="h-4 w-4" />
                                    </div>
                                    Ajuste Calórico Semanal
                                </h3>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center gap-4">
                                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Días Entreno (0-7)</label>
                                        <div className="flex items-center bg-[#0B1120] rounded-xl border border-white/5 w-32 overflow-hidden">
                                            <button onClick={() => setDiasEntreno(prev => Math.max(0, prev - 1))} className="w-9 h-9 text-slate-500 hover:text-white hover:bg-white/5">-</button>
                                            <input type="number" value={diasEntreno} min="0" max="7" onChange={e => setDiasEntreno(parseInt(e.target.value) || 0)} className="w-full bg-transparent text-center text-white font-bold text-xs outline-none" />
                                            <button onClick={() => setDiasEntreno(prev => Math.min(7, prev + 1))} className="w-9 h-9 text-slate-500 hover:text-white hover:bg-white/5">+</button>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center h-10 border-b border-white/5 px-2">
                                        <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Promedio Semanal</span>
                                        <span className="text-sm font-tech font-bold text-blue-400">{bioCalculations.promedio}</span>
                                    </div>

                                    <div className="flex justify-between items-center gap-4 pt-4">
                                        <label className="text-[10px] font-black text-white uppercase tracking-widest">Ajustes (%)</label>
                                        <div className="flex items-center bg-yellow-500/5 rounded-xl border border-yellow-500/20 w-32 overflow-hidden group">
                                            <button onClick={() => setAjustePct(prev => prev - 1)} className="w-9 h-9 text-yellow-500/60 hover:text-yellow-400 hover:bg-yellow-500/10 transition-all">-</button>
                                            <div className="flex-1 flex items-center justify-center gap-1">
                                                <input type="number" value={ajustePct} onChange={e => setAjustePct(parseInt(e.target.value) || 0)} className="w-12 bg-transparent text-right text-yellow-400 font-tech font-bold text-xs outline-none" />
                                                <span className="text-[10px] text-yellow-500/60 font-black">%</span>
                                            </div>
                                            <button onClick={() => setAjustePct(prev => prev + 1)} className="w-9 h-9 text-yellow-500/60 hover:text-yellow-400 hover:bg-yellow-500/10 transition-all">+</button>
                                        </div>
                                    </div>

                                    <div className="bg-emerald-500/5 p-5 rounded-2xl border border-emerald-500/20 shadow-2xl shadow-emerald-500/5 mt-8">
                                        <div className="flex flex-col gap-1">
                                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Calorías Totales Objetivo</span>
                                            <span className="text-3xl font-tech font-black text-white leading-none mt-1">
                                                {bioCalculations.kcalTotales}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </Card>
                        </div>

                        {/* Macronutrientes y Equivalencias */}
                        <div className="xl:col-span-8 space-y-8">
                            {/* Macronutrientes */}
                            <Card className="bg-[#151F32] border-white/5 rounded-2xl shadow-xl overflow-hidden">
                                <div className="bg-gradient-to-r from-orange-500/10 to-transparent p-6 border-b border-white/5 flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 border border-orange-500/10">
                                        <PieChart className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-xs font-black text-white uppercase tracking-[0.4em]">Requerimiento de Macronutrientes</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-[#0B1120] text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                            <tr>
                                                <th className="px-8 py-4">MACRONUTRIENTE</th>
                                                <th className="px-6 py-4 text-center">G/KG</th>
                                                <th className="px-6 py-4 text-center">TOTAL (GR)</th>
                                                <th className="px-6 py-4 text-center">KCAL</th>
                                                <th className="px-6 py-4 text-center">%</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5 text-xs font-bold">
                                            {/* CHO */}
                                            <tr className="hover:bg-white/5 transition-colors">
                                                <td className="px-8 py-5 text-white">CHO (Carbohidratos)</td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center justify-center bg-[#0B1120] rounded-xl border border-white/5 w-24 mx-auto overflow-hidden">
                                                        <button onClick={() => setGChoKg(prev => Math.max(0, prev - 0.1))} className="w-7 h-7 text-slate-500 hover:text-white hover:bg-white/5">-</button>
                                                        <input value={gChoKg} step="0.1" onChange={e => setGChoKg(parseFloat(e.target.value) || 0)} className="w-10 bg-transparent text-center text-sky-400 font-tech font-bold text-xs outline-none" />
                                                        <button onClick={() => setGChoKg(prev => prev + 0.1)} className="w-7 h-7 text-slate-500 hover:text-white hover:bg-white/5">+</button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-center text-white font-tech">{macroReq.cho.g}</td>
                                                <td className="px-6 py-5 text-center text-slate-400 font-tech">{macroReq.cho.kcal}</td>
                                                <td className="px-6 py-5 text-center text-slate-500 text-[10px]">{macroReq.cho.pct}</td>
                                            </tr>
                                            {/* PRO */}
                                            <tr className="hover:bg-white/5 transition-colors">
                                                <td className="px-8 py-5 text-white">Proteína</td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center justify-center bg-[#0B1120] rounded-xl border border-white/5 w-24 mx-auto overflow-hidden">
                                                        <button onClick={() => setGProKg(prev => Math.max(0, prev - 0.1))} className="w-7 h-7 text-slate-500 hover:text-white hover:bg-white/5">-</button>
                                                        <input value={gProKg} step="0.1" onChange={e => setGProKg(parseFloat(e.target.value) || 0)} className="w-10 bg-transparent text-center text-orange-500 font-tech font-bold text-xs outline-none" />
                                                        <button onClick={() => setGProKg(prev => prev + 0.1)} className="w-7 h-7 text-slate-500 hover:text-white hover:bg-white/5">+</button>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5 text-center text-white font-tech">{macroReq.pro.g}</td>
                                                <td className="px-6 py-5 text-center text-slate-400 font-tech">{macroReq.pro.kcal}</td>
                                                <td className="px-6 py-5 text-center text-slate-500 text-[10px]">{macroReq.pro.pct}</td>
                                            </tr>
                                            {/* FAT */}
                                            <tr className="hover:bg-white/5 transition-colors">
                                                <td className="px-8 py-5 text-white">Grasa</td>
                                                <td className="px-6 py-5 text-center text-yellow-500 font-tech">{macroReq.fat.gKg}</td>
                                                <td className="px-6 py-5 text-center text-white font-tech">{macroReq.fat.g}</td>
                                                <td className="px-6 py-5 text-center text-slate-400 font-tech">{macroReq.fat.kcal}</td>
                                                <td className="px-6 py-5 text-center text-slate-500 text-[10px]">{macroReq.fat.pct}</td>
                                            </tr>
                                        </tbody>
                                    </table>
                                </div>
                            </Card>

                            {/* Equivalencias */}
                            <Card className="bg-[#151F32] border-white/5 rounded-2xl shadow-xl overflow-hidden mb-10">
                                <div className="bg-gradient-to-r from-blue-500/10 to-transparent p-6 border-b border-white/5 flex items-center gap-4">
                                    <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500 border border-blue-500/10">
                                        <Layers className="h-5 w-5" />
                                    </div>
                                    <h3 className="text-xs font-black text-white uppercase tracking-[0.4em]">Grupo de Alimentos (Equivalencias)</h3>
                                </div>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-left">
                                        <thead className="bg-[#0B1120] text-[8px] font-black text-slate-500 uppercase tracking-[0.2em]">
                                            <tr>
                                                <th className="px-8 py-3">GRUPO</th>
                                                <th className="px-6 py-3 text-center">PORC.</th>
                                                <th className="px-4 py-3 text-center">CALORÍAS</th>
                                                <th className="px-4 py-3 text-center">CHO (g)</th>
                                                <th className="px-4 py-3 text-center">PRO (g)</th>
                                                <th className="px-4 py-3 text-center">FAT (g)</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-white/5 text-[11px] font-bold">
                                            {Object.entries(DB_PORCIONES).map(([key, info]) => (
                                                <tr key={key} className="hover:bg-white/5 group transition-colors">
                                                    <td className="px-8 py-3 text-white">{info.label}</td>
                                                    <td className="px-6 py-3">
                                                        <div className="flex items-center justify-center bg-[#0B1120] rounded-xl border border-white/5 w-24 mx-auto overflow-hidden">
                                                            <button onClick={() => updatePortion(key, portions[key] - 1)} className="w-7 h-7 text-slate-500 hover:text-white hover:bg-white/5">-</button>
                                                            <input value={portions[key]} onChange={e => updatePortion(key, parseFloat(e.target.value) || 0)} className="w-10 bg-transparent text-center text-white font-tech font-bold text-xs outline-none" />
                                                            <button onClick={() => updatePortion(key, portions[key] + 1)} className="w-7 h-7 text-slate-500 hover:text-white hover:bg-white/5">+</button>
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3 text-center text-slate-400 font-tech">{portionTable.rows[key].k}</td>
                                                    <td className="px-4 py-3 text-center text-sky-500/60 font-tech">{portionTable.rows[key].c || '-'}</td>
                                                    <td className="px-4 py-3 text-center text-orange-500/60 font-tech">{portionTable.rows[key].pr || '-'}</td>
                                                    <td className="px-4 py-3 text-center text-yellow-500/60 font-tech">{portionTable.rows[key].f || '-'}</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                        <tfoot className="border-t-2 border-white/10">
                                            <tr className="bg-[#FF7A00]/5 text-xs">
                                                <td className="px-8 py-5 text-right font-black text-orange-500 tracking-widest uppercase text-[10px]">TOTALES LOGRADOS:</td>
                                                <td className="px-6 py-5"></td>
                                                <td className="px-4 py-5 text-center text-white font-tech font-black text-lg">{portionTable.totals.k}</td>
                                                <td className="px-4 py-5 text-center text-sky-400 font-tech font-black text-lg">{portionTable.totals.c.toFixed(1)}</td>
                                                <td className="px-4 py-5 text-center text-orange-500 font-tech font-black text-lg">{portionTable.totals.pr.toFixed(1)}</td>
                                                <td className="px-4 py-5 text-center text-yellow-500 font-tech font-black text-lg">{portionTable.totals.f.toFixed(1)}</td>
                                            </tr>
                                            <tr className="bg-[#0B1120] border-t border-white/5 text-[10px]">
                                                <td className="px-8 py-4 text-right font-black text-slate-500 tracking-widest uppercase">% ADECUACIÓN:</td>
                                                <td className="px-6 py-4"></td>
                                                <td className={cn("px-4 py-4 text-center font-tech font-black", portionTable.colors.k)}>{portionTable.adequacy.k}</td>
                                                <td className={cn("px-4 py-4 text-center font-tech font-black", portionTable.colors.c)}>{portionTable.adequacy.c}</td>
                                                <td className={cn("px-4 py-4 text-center font-tech font-black", portionTable.colors.pr)}>{portionTable.adequacy.pr}</td>
                                                <td className={cn("px-4 py-4 text-center font-tech font-black", portionTable.colors.f)}>{portionTable.adequacy.f}</td>
                                            </tr>
                                        </tfoot>
                                    </table>
                                </div>
                            </Card>
                        </div>
                    </div>
                ) : activeTab === "resumen" ? (
                    <div className="flex flex-col gap-4 sm:gap-8 pb-32 animate-in slide-in-from-right-10 duration-500">
                        <div className="flex flex-col md:flex-row justify-between items-center bg-[#151F32] p-4 sm:p-8 rounded-2xl sm:rounded-3xl border border-white/5 shadow-2xl relative overflow-hidden group gap-4 sm:gap-10">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-[#FF7A00]/5 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2 group-hover:bg-[#FF7A00]/10 transition-colors" />

                            <div className="flex flex-wrap items-center justify-center gap-x-16 gap-y-8 relative z-30">
                                {[
                                    { id: 'pre-entreno', label: 'PRE-ENTRENO' },
                                    { id: 'media-manana', label: 'MEDIA MAÑANA' },
                                    { id: 'media-tarde', label: 'MEDIA TARDE' },
                                    { id: 'post-entreno', label: 'POST-ENTRENO' },
                                ].map(toggle => {
                                    const mealStatus = meals.find(m => m.id === toggle.id);
                                    const isActive = mealStatus?.active || false;
                                    
                                    return (
                                        <div 
                                            key={toggle.id} 
                                            className="flex flex-col items-center gap-3 cursor-pointer group/toggle p-4 rounded-3xl hover:bg-white/5 transition-all"
                                            onClick={() => toggleMeal(toggle.id)}
                                        >
                                            <div className={cn(
                                                "w-14 h-7 rounded-full relative transition-all duration-300 border shadow-inner",
                                                isActive ? "bg-orange-600 border-orange-500 shadow-[0_0_20px_rgba(255,122,0,0.4)]" : "bg-slate-800 border-white/5"
                                            )}>
                                                <div className={cn(
                                                    "absolute top-1 left-1 h-4.5 w-4.5 rounded-full transition-all duration-300 pointer-events-none shadow-lg",
                                                    isActive ? "translate-x-7 bg-white" : "translate-x-0 bg-slate-500"
                                                )} />
                                            </div>
                                            <span className={cn(
                                                "text-[9px] font-black uppercase tracking-[0.2em] transition-colors",
                                                isActive ? "text-orange-500" : "text-slate-500 group-hover/toggle:text-slate-300"
                                            )}>
                                                {toggle.label}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="flex items-center gap-12 relative z-10">
                                <div className="h-16 w-px bg-white/5 hidden md:block" />
                                <div className="text-right flex flex-col items-end">
                                    <span className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-1">Calorías Logradas</span>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-4xl font-tech font-black text-white">{portionTable.totals.k}</p>
                                        <span className="text-xs font-black text-slate-500">KCAL</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Meal Cards */}
                        <div className="grid grid-cols-1 gap-8 max-w-6xl mx-auto w-full">
                            {meals.filter(m => m.active).sort((a, b) => a.time.localeCompare(b.time)).map(meal => (
                                <Card key={meal.id} className="bg-[#151F32] border-white/5 rounded-2xl sm:rounded-3xl flex flex-col md:flex-row overflow-hidden shadow-2xl group border-l-0">
                                    <div className="w-full md:w-56 bg-[#0B1120] p-6 sm:p-10 flex flex-col justify-center items-center border-b md:border-b-0 md:border-r border-white/5 relative shrink-0">
                                        <div className="absolute left-0 top-0 w-1.5 sm:w-2 h-full bg-[#FF7A00] shadow-[4px_0_15px_rgba(255,122,0,0.3)]" />
                                        <span className="font-tech font-black text-base sm:text-xl text-white tracking-[0.2em] text-center leading-tight">{meal.name}</span>
                                        <div className="mt-6 flex items-center gap-3 bg-[#151F32] px-4 py-2 rounded-2xl border border-white/5 shadow-inner">
                                            <Clock className="h-4 w-4 text-orange-500" />
                                            <input
                                                type="time"
                                                value={meal.time}
                                                onChange={e => setMeals(prev => prev.map(m => m.id === meal.id ? { ...m, time: e.target.value } : m))}
                                                className="bg-transparent text-white text-xs font-black outline-none w-20 text-center"
                                            />
                                        </div>
                                    </div>

                                    <div className="flex-1 flex flex-col">
                                        <div className="bg-[#FF7A00] p-4 flex items-center">
                                            <input
                                                type="text"
                                                value={meal.title}
                                                onChange={e => setMeals(prev => prev.map(m => m.id === meal.id ? { ...m, title: e.target.value } : m))}
                                                className="w-full bg-transparent text-white font-black text-center outline-none placeholder-white/50 text-xs uppercase tracking-[0.15em]"
                                                placeholder="NOMBRE DEL MENÚ O PLATO..."
                                            />
                                        </div>

                                        <div className="p-4 sm:p-8 flex flex-col gap-4 sm:gap-5">
                                            {meal.rows.map((row, idx) => (
                                                <div key={row.id} className="flex flex-col xl:flex-row items-stretch gap-4 animate-in fade-in duration-300 group/row">
                                                    <div className="flex items-center gap-2 w-full xl:w-72 shrink-0">
                                                        <Select value={row.group} onValueChange={(v) => setMeals(prev => prev.map(m => m.id === meal.id ? { ...m, rows: m.rows.map(r => r.id === row.id ? { ...r, group: v } : r) } : m))}>
                                                            <SelectTrigger className="flex-1 bg-[#0B1120] border-white/5 rounded-xl h-11 text-[10px] font-black uppercase tracking-widest text-slate-400">
                                                                <SelectValue />
                                                            </SelectTrigger>
                                                            <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                                                {Object.entries(DB_PORCIONES).map(([k, v]) => (
                                                                    <SelectItem key={k} value={k}>{v.label}</SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <div className="w-16 h-11 bg-[#0B1120] border border-white/5 rounded-xl flex items-center justify-center font-tech font-black text-white text-sm shadow-inner">
                                                            {row.portions}
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 relative flex gap-3">
                                                        <textarea
                                                            className="flex-1 bg-[#0B1120] border border-white/5 rounded-2xl py-3 px-5 text-[11px] font-medium text-slate-300 min-h-[44px] outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/20 transition-all resize-none leading-relaxed"
                                                            spellCheck="false"
                                                            value={row.comment}
                                                            onChange={e => setMeals(prev => prev.map(m => m.id === meal.id ? { ...m, rows: m.rows.map(r => r.id === row.id ? { ...r, comment: e.target.value } : r) } : m))}
                                                            placeholder="Instrucciones o ejemplos de alimentos..."
                                                        />
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeRow(meal.id, row.id)}
                                                            className="h-11 w-11 rounded-xl bg-red-500/5 text-red-500/50 hover:text-red-500 hover:bg-red-500/10 border border-white/5 opacity-0 group-hover/row:opacity-100 transition-all shrink-0"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            ))}

                                            <button
                                                onClick={() => addRow(meal.id)}
                                                className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-orange-500 hover:text-white hover:bg-orange-500/10 w-max px-4 py-2 rounded-xl transition-all"
                                            >
                                                <Plus className="h-4 w-4" />
                                                Agregar Fila de Alimento
                                            </button>
                                        </div>
                                    </div>
                                </Card>
                            ))}

                        </div>
                    </div>
                ) : (
                    <div className="pb-32 animate-in fade-in duration-700">
                        <Card className="bg-[#0B1120] border-white/5 rounded-[3rem] overflow-hidden shadow-2xl p-1 md:p-8">
                            <WeeklyNutritionalPlan overridePatientId={patientId} />
                        </Card>
                    </div>
                )}
            </ScrollArea>
        </div>
    );
}
