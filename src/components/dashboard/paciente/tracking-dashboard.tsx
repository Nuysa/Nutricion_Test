"use client";

import { useState, useEffect } from "react";
import { Calendar, TrendingDown, TrendingUp, History, Scale, FileText, CheckCircle2, Users, Camera, ChevronRight, ChevronDown } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { VariablesService, DashboardColumn, ClinicalVariable } from "@/lib/variables-service";
import { useFormulaEngine } from "@/hooks/useFormulaEngine";
import { PatientHistoryCharts } from "./PatientHistoryCharts";

export function TrackingDashboard() {
    const [measurements, setMeasurements] = useState<any[]>([]);
    const [stats, setStats] = useState<any>({
        totalLost: "0.0",
        goalWeight: "--",
        targetWeight: "--",
        specialistsCount: 0,
        reportStatus: "Pendiente"
    });
    const [loading, setLoading] = useState(true);
    const [layout, setLayout] = useState<DashboardColumn[]>([]);
    const [clinicalVariables, setClinicalVariables] = useState<ClinicalVariable[]>([]);
    const [chartProps, setChartProps] = useState<any>(null);
    const [photoHistory, setPhotoHistory] = useState<any[]>([]);
    const supabase = createClient();
    const { calculate } = useFormulaEngine();

    async function fetchData() {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            // 1. Cargar Configuración
            const [layoutData, vars] = await Promise.all([
                VariablesService.getDashboardLayout('paciente'),
                VariablesService.getVariables()
            ]);

            if (layoutData.columns) setLayout(layoutData.columns);
            setClinicalVariables(vars);

            // 2. Cargar Datos del Paciente
            const { data: profile, error: profError } = await supabase.from("profiles").select("id").eq("user_id", user.id).maybeSingle();
            if (profError || !profile) {
                throw new Error("Profile no encontrado: " + profError?.message);
            }

            let { data: patientData, error: patError } = await supabase
                .from("patients")
                .select("*, nutritionist:profiles!nutritionist_id(full_name)")
                .eq("profile_id", profile.id)
                .maybeSingle();

            if (patError || !patientData) {
                // Let's try to just select "*" in case the join fails, as a fallback calculation
                console.warn("Could not fetch nutritionist details", patError);
                const { data: fallbackData, error: fbError } = await supabase
                    .from("patients")
                    .select("*")
                    .eq("profile_id", profile.id)
                    .maybeSingle();

                if (fbError || !fallbackData) {
                    throw new Error("Datos de paciente no encontrados: " + (patError?.message || fbError?.message));
                }

                patientData = { ...fallbackData, nutritionist: { full_name: "Asignado" } } as any;
            }

            // 3. Cargar Registros
            const { data: records, error } = await supabase
                .from("weight_records")
                .select("*")
                .eq("patient_id", patientData.id)
                .order("date", { ascending: false })
                .order("created_at", { ascending: false });

            if (error) throw error;

            // Calcular edad básica
            let age = 0;
            if (patientData.date_of_birth) {
                // Agregar T12:00:00 evita desfases de zona horaria al parsear fechas YYYY-MM-DD
                const birthStr = patientData.date_of_birth.includes('T') ? patientData.date_of_birth : `${patientData.date_of_birth}T12:00:00`;
                const birth = new Date(birthStr);
                const today = new Date();
                age = today.getFullYear() - birth.getFullYear();
                const m = today.getMonth() - birth.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                    age--;
                }
            }

            const h = parseFloat(patientData.height_cm?.toString() || "0");
            const idealWeight = h > 0 ? (22 * (h / 100) * (h / 100)).toFixed(1) : "--";

            if (records && records.length > 0) {
                // Procesar cada fila dinámicamente
                const preProcessedRecords = records.map((m: any, index: number) => {
                    const rowData: Record<string, any> = {
                        id: m.id,
                        num: records.length - index,
                        date: new Date(m.date + 'T12:00:00').toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" }),
                        nutritionist: patientData.nutritionist?.full_name || "Asignado"
                    };

                    const inputs: Record<string, number> = {
                        ...(m.extra_data || {}),
                        "PESO": m.weight || 0,
                        "TALLA": h,
                        "TALLA_CM": h,
                        "EDAD": age,
                        "CINTURA": m.waist_circumference_cm || 0,
                        "GRASA": m.body_fat_percentage || 0,
                        "PESO_BASE": patientData.current_weight != null ? Number(patientData.current_weight) : 0,
                        "GENERO_V": patientData.gender === 'masculino' || patientData.gender === 'M' ? 1 : (patientData.gender === 'femenino' || patientData.gender === 'F' ? 2 : 0),
                        "IMC": m.weight > 0 && h > 0 ? Number((m.weight / ((h / 100) * (h / 100))).toFixed(1)) : 0
                    };

                    for (let pass = 0; pass < 3; pass++) {
                        vars.forEach(v => {
                            if (v.is_calculated && v.code) {
                                const calc = calculate(v, { gender: patientData.gender, age, inputs });
                                inputs[v.code.toUpperCase()] = calc.result;
                            }
                        });
                    }
                    rowData._computedInputs = inputs;
                    rowData._rawSource = m;
                    return rowData;
                });

                const formatted = preProcessedRecords.map((r: any, i: number) => {
                    const rowData = { ...r };
                    const prevRecord = i < preProcessedRecords.length - 1 ? preProcessedRecords[i + 1] : null;

                    layoutData.columns?.forEach((col: DashboardColumn, colIdx: number) => {
                        const targetVar = vars.find(v => v.id === col.variable_id);
                        let val = "—";
                        let rangeColor = null;
                        let currentRawVal: number | undefined;
                        let prevRawVal: number | undefined;

                        if (targetVar) {
                            if (targetVar.code === 'DIF_GRASA_KG') {
                                const currGrasa = r._computedInputs['GRASA_CORPORAL'] || 0;
                                const prevGrasa = prevRecord ? (prevRecord._computedInputs['GRASA_CORPORAL'] || 0) : 0;
                                val = prevRecord ? (currGrasa - prevGrasa).toFixed(2) : "0.00";
                                currentRawVal = currGrasa - prevGrasa;
                                if (prevRecord) prevRawVal = 0;
                            } else if (targetVar.code === 'DIF_MUSCULO_KG') {
                                const currMusculo = r._computedInputs['MASA_MUSCULAR_LEE'] || 0;
                                const prevMusculo = prevRecord ? (prevRecord._computedInputs['MASA_MUSCULAR_LEE'] || 0) : 0;
                                val = prevRecord ? (currMusculo - prevMusculo).toFixed(2) : "0.00";
                                currentRawVal = currMusculo - prevMusculo;
                                if (prevRecord) prevRawVal = 0;
                            } else if (targetVar.is_calculated) {
                                const calc = calculate(targetVar, { gender: patientData.gender, age, inputs: r._computedInputs });
                                val = ((targetVar.has_ranges ?? targetVar.hasRanges) && calc.range) ? calc.range.label : calc.result.toString();
                                rangeColor = calc.range?.color;
                                currentRawVal = calc.result;
                                if (prevRecord) {
                                    const prevCalc = calculate(targetVar, { gender: patientData.gender, age, inputs: prevRecord._computedInputs });
                                    prevRawVal = prevCalc.result;
                                }
                            } else {
                                const fixedMapping: Record<string, string> = { "peso": "weight", "grasa": "body_fat_percentage", "cintura": "waist_circumference_cm", "musculo": "muscle_mass_percentage" };
                                const field = fixedMapping[targetVar.code?.toLowerCase()] || null;
                                if (field && r._rawSource[field] !== undefined) {
                                    val = r._rawSource[field]?.toString() || "—";
                                    currentRawVal = parseFloat(r._rawSource[field]);
                                    if (prevRecord && prevRecord._rawSource[field] !== undefined) prevRawVal = parseFloat(prevRecord._rawSource[field]);
                                } else {
                                    const codeUpper = targetVar.code?.toUpperCase() || "";
                                    val = r._rawSource.extra_data?.[codeUpper] !== undefined ? r._rawSource.extra_data[codeUpper] : "—";
                                    const extraVal = parseFloat(r._rawSource.extra_data?.[codeUpper]);
                                    if (!isNaN(extraVal)) currentRawVal = extraVal;
                                    if (prevRecord) {
                                        const prevExtraVal = parseFloat(prevRecord._rawSource.extra_data?.[codeUpper]);
                                        if (!isNaN(prevExtraVal)) prevRawVal = prevExtraVal;
                                    }
                                }
                            }
                        } else if (col.fixed_variable) {
                            const fixedMapping: Record<string, any> = {
                                "weight": r._rawSource.weight,
                                "body_fat": r._rawSource.body_fat_percentage,
                                "waist": r._rawSource.waist_circumference_cm,
                                "bmi": (r._rawSource.weight > 0 && h > 0) ? (r._rawSource.weight / ((h / 100) * (h / 100))).toFixed(1) : "0",
                                "index": r.num,
                                "date": r.date
                            };
                            val = fixedMapping[col.fixed_variable] !== undefined ? fixedMapping[col.fixed_variable] : "—";
                            if (col.fixed_variable === 'bmi') {
                                currentRawVal = r._rawSource.weight ? (parseFloat(r._rawSource.weight) / ((h / 100) * (h / 100))) : undefined;
                                if (prevRecord && prevRecord._rawSource.weight) prevRawVal = (parseFloat(prevRecord._rawSource.weight) / ((h / 100) * (h / 100)));
                            } else if (col.fixed_variable === 'weight') {
                                currentRawVal = parseFloat(r._rawSource.weight);
                                if (prevRecord) prevRawVal = parseFloat(prevRecord._rawSource.weight);
                            } else if (col.fixed_variable === 'body_fat') {
                                currentRawVal = parseFloat(r._rawSource.body_fat_percentage);
                                if (prevRecord) prevRawVal = parseFloat(prevRecord._rawSource.body_fat_percentage);
                            } else if (col.fixed_variable === 'waist') {
                                currentRawVal = parseFloat(r._rawSource.waist_circumference_cm);
                                if (prevRecord) prevRawVal = parseFloat(prevRecord._rawSource.waist_circumference_cm);
                            }
                        }

                        const colKey = col.variable_id || col.fixed_variable || `idx_${colIdx}`;
                        rowData[`col_${colKey}`] = val;
                        rowData[`color_${colKey}`] = rangeColor;

                        // Determinar tendencia
                        if (currentRawVal !== undefined && prevRawVal !== undefined && !isNaN(currentRawVal) && !isNaN(prevRawVal)) {
                            if (currentRawVal > prevRawVal) rowData[`trend_${colKey}`] = 'up';
                            else if (currentRawVal < prevRawVal) rowData[`trend_${colKey}`] = 'down';
                        }
                    });

                    return rowData;
                });

                setMeasurements(formatted);

                const latestWeight = records[0].weight || patientData.current_weight || 0;
                const h = parseFloat(patientData.height_cm?.toString() || "0");

                // Buscar Peso Ideal en la última medición
                let pesoIdealActual = formatted[0]?._computedInputs?.['PESO_IDEAL'] || idealWeight;
                if (typeof pesoIdealActual === 'number') pesoIdealActual = pesoIdealActual.toFixed(1);

                const targetWeight = h > 0 ? Math.max(latestWeight - 2, parseFloat(String(pesoIdealActual || "0"))).toFixed(1) : "--";

                const oldestWeight = records[records.length - 1].weight || patientData.current_weight || latestWeight;
                const totalLost = (oldestWeight - latestWeight).toFixed(1);

                // Determinar si la última medición está completa basada en las columnas del layout
                let isComplete = true;
                layoutData.columns?.forEach((col: DashboardColumn, colIdx: number) => {
                    if (col.fixed_variable === 'index' || col.fixed_variable === 'date') return;

                    const targetVar = vars.find(v => v.id === col.variable_id);
                    if (targetVar?.is_system) return;

                    const colKey = col.variable_id || col.fixed_variable || `idx_${colIdx}`;
                    const val = formatted[0][`col_${colKey}`];
                    const valStr = String(val).trim();
                    if (!val || valStr === "—" || valStr === "0" || valStr === "0.0") {
                        isComplete = false;
                    }
                });

                setStats({
                    totalLost,
                    goalWeight: pesoIdealActual,
                    targetWeight: targetWeight,
                    specialistsCount: patientData.nutritionist_id ? 1 : 0,
                    reportStatus: isComplete ? "Evaluación Completa" : "Evaluación Pendiente"
                });

                const varDiagGrasa = vars.find(v => (v.name?.toUpperCase().includes('SUMA DE PLIEGUES') || v.code?.toUpperCase().includes('SUMA_PLIEGUES')) && (v.has_ranges || v.hasRanges));
                const varDiagMusculo = vars.find(v => v.name?.toUpperCase().includes('MUSCULO LEE') && (v.has_ranges || v.hasRanges));
                const varDiagCintura = vars.find(v => v.name?.toUpperCase().includes('CINTURA') && (v.has_ranges || v.hasRanges));

                const reversedMeasurements = [...formatted].reverse();

                const fechasHistorial = reversedMeasurements.map(m => {
                    const parts = m.date.split(' ');
                    return parts.length >= 2 ? `${parts[0]} ${parts[1]}` : m.date;
                });

                const pesoData = reversedMeasurements.map(m => parseFloat(m._rawSource?.weight) || 0);

                const imcData = reversedMeasurements.map(m => {
                    const w = parseFloat(m._rawSource?.weight) || 0;
                    return w > 0 && h > 0 ? parseFloat((w / ((h / 100) * (h / 100))).toFixed(1)) : 0;
                });

                const grasaPctData = reversedMeasurements.map(m => parseFloat(m._computedInputs?.['GRASA_CORPORAL']) || 0);
                const grasaKgData = reversedMeasurements.map((m, i) => {
                    const w = parseFloat(m._rawSource?.weight) || 0;
                    const pct = grasaPctData[i];
                    return parseFloat((w * (pct / 100)).toFixed(2));
                });

                const diffGrasaData = grasaKgData.map((val, i, arr) => i === 0 ? 0 : parseFloat((val - arr[i - 1]).toFixed(2)));

                const etiquetasDiagnosticoGrasa = reversedMeasurements.map(m => {
                    if (varDiagGrasa) {
                        const val = m[`col_${varDiagGrasa.id}`];
                        if (val && typeof val === 'string' && val.includes('-')) return val.split('-');
                        return val || "—";
                    }
                    return "—";
                });

                const musculoPctData = reversedMeasurements.map(m => parseFloat(m._computedInputs?.['MASA_MUSCULAR_LEE']) || 0);
                const musculoKgData = reversedMeasurements.map((m, i) => {
                    const w = parseFloat(m._rawSource?.weight) || 0;
                    const pct = musculoPctData[i];
                    return parseFloat((w * (pct / 100)).toFixed(2));
                });

                const diffMusculoData = musculoKgData.map((val, i, arr) => i === 0 ? 0 : parseFloat((val - arr[i - 1]).toFixed(2)));

                const etiquetasDiagnosticoMusculo = reversedMeasurements.map(m => {
                    if (varDiagMusculo) {
                        const val = m[`col_${varDiagMusculo.id}`];
                        if (val && typeof val === 'string' && val.includes('-')) return val.split('-');
                        return val || "—";
                    }
                    return "—";
                });

                const cinturaCmData = reversedMeasurements.map(m => parseFloat(m._computedInputs?.['CINTURA_MINIMA']) || parseFloat(m._rawSource?.waist_circumference_cm) || parseFloat(m._computedInputs?.['CINTURA']) || 0);

                const etiquetasDiagnosticoCintura = reversedMeasurements.map(m => {
                    if (varDiagCintura) {
                        const val = m[`col_${varDiagCintura.id}`];
                        if (val && typeof val === 'string' && val.includes('-')) return val.split('-');
                        return val || "—";
                    }
                    return "—";
                });

                setChartProps({
                    fechasHistorial,
                    pesoData,
                    imcData,
                    grasaPctData,
                    grasaKgData,
                    etiquetasDiagnosticoGrasa,
                    diffGrasaData,
                    musculoPctData,
                    musculoKgData,
                    etiquetasDiagnosticoMusculo,
                    diffMusculoData,
                    cinturaCmData,
                    etiquetasDiagnosticoCintura
                });

                // 4. Cargar Seguimiento Fotográfico (desde mediciones en histories y records)
                const { data: medHistory, error: historyError } = await supabase
                    .from("patient_medical_histories")
                    .select("created_at, photo_front_url, photo_side1_url, photo_side2_url, photo_back_url")
                    .eq("patient_id", patientData.id)
                    .order("created_at", { ascending: false });

                let mappedHistory: any[] = [];
                if (!historyError && medHistory) {
                    mappedHistory = medHistory
                        .filter(h => h.photo_front_url || h.photo_side1_url || h.photo_side2_url || h.photo_back_url)
                        .map(h => ({
                            date: h.created_at.split('T')[0],
                            photos: {
                                1: h.photo_front_url,
                                2: h.photo_side1_url,
                                3: h.photo_side2_url,
                                4: h.photo_back_url
                            }
                        }));
                }

                // Add records from extra_data in weight_records
                const mappedRecords = records
                    .filter((r: any) => r.extra_data?.photo_front_url || r.extra_data?.photo_side1_url || r.extra_data?.photo_side2_url || r.extra_data?.photo_back_url)
                    .map((r: any) => ({
                        date: r.date,
                        photos: {
                            1: r.extra_data.photo_front_url || null,
                            2: r.extra_data.photo_side1_url || null,
                            3: r.extra_data.photo_side2_url || null,
                            4: r.extra_data.photo_back_url || null
                        }
                    }));

                // Combine and sort by date descending
                const combinedHistory = [...mappedRecords, ...mappedHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                setPhotoHistory(combinedHistory);

            } else {
                setMeasurements([]);

                // Verificar si tiene datos básicos
                const hasBasicData = Boolean(patientData?.height_cm && patientData?.current_weight && patientData?.date_of_birth);
                const currentWeightNum = parseFloat(patientData.current_weight?.toString() || "0");

                // Intentar calcular peso ideal con la formula de la variable si existe
                let calculatedIdeal = idealWeight;
                const pesoIdealVar = vars.find(v => v.code === "PESO_IDEAL");
                if (pesoIdealVar && h > 0) {
                    const inputs = { "PESO": currentWeightNum, "TALLA": h, "TALLA_CM": h, "EDAD": age };
                    const calc = calculate(pesoIdealVar, { gender: patientData.gender, age, inputs });
                    if (calc && calc.result > 0) {
                        calculatedIdeal = calc.result.toFixed(1);
                    }
                }

                const targetW = h > 0 ? (currentWeightNum > 0 ? Math.max(currentWeightNum - 2, parseFloat(String(calculatedIdeal))).toFixed(1) : "--") : "--";

                setStats({
                    totalLost: "0.0",
                    goalWeight: calculatedIdeal,
                    targetWeight: targetW,
                    specialistsCount: patientData.nutritionist_id ? 1 : 0,
                    reportStatus: hasBasicData ? "Evaluación Inicial" : "Pendiente Datos Básicos"
                });
            }
        } catch (err: any) {
            console.error("Tracking Dashboard fetch error:", err);
            setStats({
                totalLost: "0.0",
                goalWeight: 0,
                specialistsCount: 0,
                reportStatus: "ERROR: " + err?.message
            });
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        fetchData();

        const recordsChannel = supabase.channel("realtime-tracking-records")
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "weight_records" },
                () => fetchData()
            )
            .on(
                "postgres_changes",
                { event: "*", schema: "public", table: "patients" },
                () => fetchData()
            )
            .subscribe();

        const syncChannel = new BroadcastChannel('nutrigo_global_sync');
        syncChannel.onmessage = () => fetchData();

        return () => {
            supabase.removeChannel(recordsChannel);
            syncChannel.close();
        };
    }, []);


    return (
        <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className="bg-[#151F32] rounded-[2.5rem] animated-border-card group border-white/5 shadow-2XL overflow-hidden" style={{ '--border-glow-color': '#4ade80' } as any}>
                    <div className="animated-border-inner bg-[#151F32]" />
                    <CardContent className="p-6 relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <div className="h-10 w-10 rounded-xl bg-white/[0.03] flex items-center justify-center text-nutrition-400 border border-white/5 shadow-inner group-hover:scale-110 transition-transform">
                                <FileText className="h-5 w-5" />
                            </div>
                            <span className="text-[10px] font-black text-nutrition-400 uppercase tracking-widest bg-nutrition-500/10 px-3 py-1 rounded-full border border-nutrition-500/20">Estado</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Módulo Clínico</p>
                            <h3 className="text-xl font-black text-white tracking-tight leading-none">{stats.reportStatus}</h3>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-[#151F32] rounded-[2.5rem] animated-border-card group border-white/5 shadow-2XL overflow-hidden" style={{ '--border-glow-color': '#f97316' } as any}>
                    <div className="animated-border-inner bg-[#151F32]" />
                    <CardContent className="p-6 relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <div className="h-10 w-10 rounded-xl bg-white/[0.03] flex items-center justify-center text-orange-400 border border-white/5 shadow-inner group-hover:scale-110 transition-transform">
                                <TrendingDown className="h-5 w-5" />
                            </div>
                            <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">Meta</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Peso Objetivo</p>
                            <div className="flex items-baseline gap-1">
                                <h3 className="text-4xl font-tech font-black text-white tracking-tight">
                                    {stats.targetWeight}
                                </h3>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">kg</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-[#151F32] rounded-[2.5rem] animated-border-card group border-white/5 shadow-2XL overflow-hidden" style={{ '--border-glow-color': '#0ea5e9' } as any}>
                    <div className="animated-border-inner bg-[#151F32]" />
                    <CardContent className="p-6 relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <div className="h-10 w-10 rounded-xl bg-white/[0.03] flex items-center justify-center text-sky-400 border border-white/5 shadow-inner group-hover:scale-110 transition-transform">
                                <Scale className="h-5 w-5" />
                            </div>
                            <span className="text-[10px] font-black text-sky-400 uppercase tracking-widest bg-sky-500/10 px-3 py-1 rounded-full border border-sky-500/20">Peso</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Peso Ideal</p>
                            <div className="flex items-baseline gap-1">
                                <h3 className="text-4xl font-tech font-black text-white tracking-tight">{stats.goalWeight}</h3>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">kg</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-[#151F32] rounded-[2.5rem] animated-border-card group border-white/5 shadow-2XL overflow-hidden" style={{ '--border-glow-color': '#ec4899' } as any}>
                    <div className="animated-border-inner bg-[#151F32]" />
                    <CardContent className="p-6 relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <div className="h-10 w-10 rounded-xl bg-white/[0.03] flex items-center justify-center text-pink-400 border border-white/5 shadow-inner group-hover:scale-110 transition-transform">
                                <Users className="h-5 w-5" />
                            </div>
                            <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest bg-pink-500/10 px-3 py-1 rounded-full border border-pink-500/20">Equipo</span>
                        </div>
                        <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Seguimiento</p>
                            <h3 className="text-xl font-black text-white tracking-tight leading-none">{stats.specialistsCount} Profesional</h3>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Card className="rounded-[3rem] shadow-2xl border-white/5 overflow-hidden bg-[#151F32]">
                <CardHeader className="p-10 border-b border-white/5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20">
                                    <History className="h-5 w-5 text-orange-500" />
                                </div>
                                <CardTitle className="text-3xl font-black text-white tracking-tight uppercase">Historial de Mediciones</CardTitle>
                            </div>
                            <CardDescription className="text-slate-400 font-medium italic text-sm">Explora tu progreso a lo largo del tiempo con análisis detallado.</CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    {chartProps && measurements.length > 0 ? (
                        <div className="w-full">
                            <PatientHistoryCharts {...chartProps} />
                        </div>
                    ) : null}
                    {measurements.length === 0 && !loading && (
                        <div className="p-20 text-center">
                            <History className="h-12 w-12 text-slate-500/20 mx-auto mb-4" />
                            <h3 className="text-lg font-black text-white/40 uppercase tracking-widest">Sin Mediciones</h3>
                            <p className="text-slate-500 max-w-xs mx-auto text-sm italic">Empieza tu camino hoy mismo.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* SECCIÓN DE SEGUIMIENTO FOTOGRÁFICO */}
            <Card className="rounded-[3rem] shadow-2xl border-white/5 overflow-hidden bg-[#151F32]">
                <CardHeader className="p-10 border-b border-white/5">
                    <div className="flex items-center gap-4">
                        <div className="h-10 w-10 rounded-xl bg-nutri-brand/10 flex items-center justify-center border border-nutri-brand/20">
                            <Camera className="h-5 w-5 text-nutri-brand" />
                        </div>
                        <CardTitle className="text-3xl font-black text-white tracking-tight uppercase">Seguimiento Fotográfico</CardTitle>
                    </div>
                    <CardDescription className="text-slate-400 font-medium italic text-sm mt-2">Registros visuales de tu transformación física.</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                    {photoHistory.length > 0 ? (
                        <Accordion type="single" collapsible className="w-full space-y-4">
                            {photoHistory.map((group, idx) => (
                                <AccordionItem
                                    key={`${group.date}-${idx}`}
                                    value={`item-${idx}`}
                                    className="border border-white/5 bg-white/[0.02] rounded-[2rem] px-8 overflow-hidden transition-all data-[state=open]:bg-white/[0.04] data-[state=open]:border-nutri-brand/20"
                                >
                                    <AccordionTrigger className="hover:no-underline py-6">
                                        <div className="flex items-center gap-4 text-left">
                                            <div className="h-10 w-10 rounded-xl bg-white/5 flex items-center justify-center">
                                                <Calendar className="h-4 w-4 text-slate-400" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] font-black text-nutri-brand uppercase tracking-widest">Medición</p>
                                                <p className="text-lg font-tech font-black text-white uppercase">
                                                    {new Date(group.date + 'T12:00:00').toLocaleDateString("es-ES", { day: "2-digit", month: "long", year: "numeric" })}
                                                </p>
                                            </div>
                                        </div>
                                    </AccordionTrigger>
                                    <AccordionContent className="pb-8 pt-4">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                            {[
                                                { id: 1, label: "De frente" },
                                                { id: 2, label: "De lado brazo abajo" },
                                                { id: 3, label: "De lado brazo arriba" },
                                                { id: 4, label: "De espalda" }
                                            ].map((type) => (
                                                <div key={type.id} className="space-y-4 group/photo">
                                                    <div className="aspect-[3/4] rounded-3xl bg-white/5 border border-white/5 overflow-hidden relative shadow-inner group-hover/photo:border-nutri-brand/30 transition-all duration-500">
                                                        {group.photos[type.id] ? (
                                                            <img
                                                                src={group.photos[type.id]}
                                                                alt={type.label}
                                                                className="w-full h-full object-cover transition-transform duration-700 group-hover/photo:scale-110"
                                                            />
                                                        ) : (
                                                            <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-slate-600 grayscale opacity-20 group-hover/photo:opacity-40 transition-opacity">
                                                                <Camera className="h-12 w-12" />
                                                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Sin Imagen</span>
                                                            </div>
                                                        )}
                                                        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent pointer-events-none" />
                                                        <div className="absolute bottom-4 left-4 right-4 bg-white/5 backdrop-blur-md rounded-xl p-3 border border-white/10 opacity-0 transform translate-y-2 group-hover/photo:opacity-100 group-hover/photo:translate-y-0 transition-all duration-500">
                                                            <p className="text-[9px] font-black text-white uppercase tracking-tighter text-center">{type.label}</p>
                                                        </div>
                                                    </div>
                                                    <div className="text-center space-y-1">
                                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.15em] group-hover/photo:text-nutri-brand transition-colors italic">{type.label}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </AccordionContent>
                                </AccordionItem>
                            ))}
                        </Accordion>
                    ) : (
                        <div className="p-20 text-center bg-white/[0.02] rounded-[3rem] border border-white/5 border-dashed">
                            <Camera className="h-12 w-12 text-slate-500/20 mx-auto mb-4" />
                            <h3 className="text-lg font-black text-white/40 uppercase tracking-widest">Sin Registro Visual</h3>
                            <p className="text-slate-500 max-w-xs mx-auto text-sm italic">Tu nutricionista cargará tus fotos en tu próxima sesión.</p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
