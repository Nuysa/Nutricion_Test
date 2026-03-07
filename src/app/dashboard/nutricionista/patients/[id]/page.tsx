"use client";

import { useParams, useRouter } from "next/navigation";
import { useState, useEffect, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import {
    ChevronLeft, Scale, Plus, X, Check,
    Activity, Trash2, Edit2, LayoutGrid, Video, MapPin, ClipboardList, ShieldCheck,
    Calculator, TrendingUp, TrendingDown
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VariablesService, DashboardColumn, ClinicalVariable } from "@/lib/variables-service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useFormulaEngine } from "@/hooks/useFormulaEngine";
import { NewConsultationForm } from "@/components/dashboard/nutricionista/NewConsultationForm";
import { EditConsultationModal } from "@/components/dashboard/nutricionista/EditConsultationModal";

export default function PatientDetailPage() {
    const params = useParams();
    const { toast } = useToast();
    const router = useRouter();
    const patientId = params.id as string;
    const supabase = createClient();
    const { calculate } = useFormulaEngine();

    // --- ESTADOS ---
    const [patient, setPatient] = useState<any>(null);
    const [records, setRecords] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);
    const [layout, setLayout] = useState<DashboardColumn[]>([]);
    const [formLayout, setFormLayout] = useState<any[]>([]);
    const [clinicalVariables, setClinicalVariables] = useState<ClinicalVariable[]>([]);

    const [showBioDialog, setShowBioDialog] = useState(false);
    const [bioValues, setBioValues] = useState({
        date_of_birth: "",
        height_cm: "",
        initial_weight: "",
        gender: "otro"
    });

    const [editingId, setEditingId] = useState<string | null>(null);
    const [isAddingMode, setIsAddingMode] = useState(false);
    const [editValues, setEditValues] = useState<any>({});
    const [extraData, setExtraData] = useState<Record<string, any>>({});

    const getIMCCategory = (val: string) => {
        if (val === "—" || !val) return "Sin datos";
        const n = parseFloat(val);
        if (n < 18.5) return "Bajo peso";
        if (n < 25) return "Saludable";
        if (n < 30) return "Sobrepeso";
        return "Obesidad";
    };

    // --- CARGA DE DATOS ---

    const fetchAllData = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).single();
                setCurrentUserRole(profile?.role || "user");
            }

            const [layoutData, formLayoutData, vars] = await Promise.all([
                VariablesService.getDashboardLayout('nutricionista'),
                VariablesService.getDashboardLayout('form_nutricionista'),
                VariablesService.getVariables()
            ]);

            if (layoutData.columns) setLayout(layoutData.columns);
            setClinicalVariables(vars);

            if (formLayoutData?.columns && formLayoutData.columns.length > 10) {
                setFormLayout(formLayoutData.columns);
            } else {
                setFormLayout([
                    { id: 'f1', header: "Fecha", fixed_variable: "date", variable_id: null, section: 'base' },
                    { id: 'f2', header: "Peso Actual", fixed_variable: "weight", variable_id: null, section: 'base' },
                    { id: 'f3', header: "IMC", fixed_variable: "bmi", variable_id: null, section: 'base' },

                    { id: 'f4', header: "B. Relajado", variable_id: vars.find((v: any) => v.code === 'BRAZO_RELAJADO')?.id || null, section: 'perimeters' },
                    { id: 'f5', header: "B. Flexionado", variable_id: vars.find((v: any) => v.code === 'BRAZO_FLEXIONADO')?.id || null, section: 'perimeters' },
                    { id: 'f6', header: "Antebrazo", variable_id: vars.find((v: any) => v.code === 'ANTEBRAZO_MAXIMO')?.id || null, section: 'perimeters' },
                    { id: 'f7', header: "Tórax", variable_id: vars.find((v: any) => v.code === 'TORAX')?.id || null, section: 'perimeters' },
                    { id: 'f8', header: "Cintura Min.", variable_id: vars.find((v: any) => v.code === 'CINTURA_MINIMA')?.id || null, section: 'perimeters' },
                    { id: 'f9', header: "Cintura Max.", variable_id: vars.find((v: any) => v.code === 'CINTURA_MAXIMA')?.id || null, section: 'perimeters' },
                    { id: 'f10', header: "Cadera Max.", variable_id: vars.find((v: any) => v.code === 'CADERA_MAXIMA')?.id || null, section: 'perimeters' },
                    { id: 'f11', header: "Muslo Max.", variable_id: vars.find((v: any) => v.code === 'MUSLO_MAXIMO')?.id || null, section: 'perimeters' },

                    { id: 'f12', header: "Tríceps", variable_id: vars.find((v: any) => v.code === 'P_TRICEPS')?.id || null, section: 'folds' },
                    { id: 'f13', header: "Subescapular", variable_id: vars.find((v: any) => v.code === 'P_SUBESCAPULAR')?.id || null, section: 'folds' },
                    { id: 'f14', header: "Supraespinal", variable_id: vars.find((v: any) => v.code === 'P_SUPRAESPINAL')?.id || null, section: 'folds' },
                    { id: 'f15', header: "Abdominal", variable_id: vars.find((v: any) => v.code === 'P_ABDOMINAL')?.id || null, section: 'folds' },
                    { id: 'f16', header: "Muslo Med.", variable_id: vars.find((v: any) => v.code === 'P_MUSLO_MEDIAL')?.id || null, section: 'folds' },
                    { id: 'f17', header: "Pantorrilla", variable_id: vars.find((v: any) => v.code === 'P_PANTORRILLA')?.id || null, section: 'folds' },
                    { id: 'f18', header: "C. Ilíaca", variable_id: vars.find((v: any) => v.code === 'CRESTA_ILIACA')?.id || null, section: 'folds' },
                    { id: 'f19', header: "Bíceps", variable_id: vars.find((v: any) => v.code === 'BICEPS')?.id || null, section: 'folds' },

                    { id: 'f20', header: "Principales Hallazgos", variable_id: vars.find((v: any) => v.code === 'PRINCIPALES_HALLAZGOS')?.id || null, section: 'findings' },
                    { id: 'f21', header: "Recomendación", variable_id: vars.find((v: any) => v.code === 'RECOMENDACION_NUTRICIONAL')?.id || null, section: 'recommendations' },
                ]);
            }

            const { data: pData, error: pError } = await supabase
                .from("patients")
                .select("id, height_cm, current_weight, date_of_birth, gender, profile:profiles!profile_id(full_name, status)")
                .eq("id", patientId)
                .single();

            if (pError) throw pError;

            const { data: hData, error: hError } = await supabase
                .from("weight_records")
                .select("*")
                .eq("patient_id", patientId)
                .order("date", { ascending: false })
                .order("created_at", { ascending: false });

            if (hError) throw hError;

            let age = 0;
            if (pData.date_of_birth) {
                // Agregar T12:00:00 evita desfases de zona horaria al parsear fechas YYYY-MM-DD
                const birthStr = pData.date_of_birth.includes('T') ? pData.date_of_birth : `${pData.date_of_birth}T12:00:00`;
                const birth = new Date(birthStr);
                const today = new Date();
                age = today.getFullYear() - birth.getFullYear();
                const m = today.getMonth() - birth.getMonth();
                if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                    age--;
                }
            }

            const mappedPatient = {
                id: pData.id,
                name: (pData.profile as any)?.full_name || "Paciente",
                age,
                gender: pData.gender || "otro",
                rawWeight: pData.current_weight != null ? parseFloat(pData.current_weight) : null,
                rawHeight: pData.height_cm != null ? parseFloat(pData.height_cm) : null,
                rawBday: pData.date_of_birth,
                status: (pData.profile as any)?.status || "Activo"
            };

            setPatient(mappedPatient);

            // Procesar records: Paso 1, calcular inputs
            const preProcessedRecords = (hData || []).map((r: any) => {
                const rowData = { ...r };
                const inputs: Record<string, any> = {
                    ...(r.extra_data || {}),
                    "PESO": r.weight || 0,
                    "TALLA": pData.height_cm || 0,
                    "TALLA_CM": pData.height_cm || 0,
                    "EDAD": age,
                    "CINTURA": r.waist_circumference_cm || 0,
                    "GRASA": r.body_fat_percentage || 0,
                    "PESO_BASE": pData.current_weight != null ? Number(pData.current_weight) : 0,
                    "GENERO_V": pData.gender === 'masculino' || pData.gender === 'M' ? 1 : (pData.gender === 'femenino' || pData.gender === 'F' ? 2 : 0),
                    "IMC": (r.weight > 0 && pData.height_cm > 0) ? Number((r.weight / ((pData.height_cm / 100) * (pData.height_cm / 100))).toFixed(1)) : 0
                };

                for (let pass = 0; pass < 3; pass++) {
                    vars.forEach(v => {
                        if (v.is_calculated && v.code) {
                            const calc = calculate(v, { gender: pData.gender, age, inputs });
                            inputs[v.code.toUpperCase()] = calc.result;
                        }
                    });
                }
                rowData._computedInputs = inputs;
                return rowData;
            });

            // Paso 2: Evaluar displays y calcular tendencias
            const processedRecords = preProcessedRecords.map((r: any, i: number) => {
                const rowData = { ...r };
                const prevRecord = i < preProcessedRecords.length - 1 ? preProcessedRecords[i + 1] : null;

                layoutData.columns?.forEach((col: DashboardColumn) => {
                    const targetVar = vars.find(v => v.id === col.variable_id);
                    let currentRawVal: number | undefined;
                    let prevRawVal: number | undefined;

                    if (targetVar) {
                        const codeUpper = targetVar.code ? targetVar.code.toUpperCase() : "";

                        // Sistema de Diferencias
                        if (targetVar.code === 'DIF_GRASA_KG') {
                            const currGrasa = r._computedInputs['GRASA_CORPORAL'] || 0;
                            const prevGrasa = prevRecord ? (prevRecord._computedInputs['GRASA_CORPORAL'] || 0) : 0;
                            rowData[`col_${targetVar.id}`] = prevRecord ? (currGrasa - prevGrasa).toFixed(2) : "0.00";
                            currentRawVal = currGrasa - prevGrasa;
                            if (prevRecord) prevRawVal = 0; // Solo para obligar a graficar tendencia >0 o <0
                        } else if (targetVar.code === 'DIF_MUSCULO_KG') {
                            const currMusculo = r._computedInputs['MASA_MUSCULAR_LEE'] || 0;
                            const prevMusculo = prevRecord ? (prevRecord._computedInputs['MASA_MUSCULAR_LEE'] || 0) : 0;
                            rowData[`col_${targetVar.id}`] = prevRecord ? (currMusculo - prevMusculo).toFixed(2) : "0.00";
                            currentRawVal = currMusculo - prevMusculo;
                            if (prevRecord) prevRawVal = 0;
                        } else if (targetVar.is_calculated) {
                            const calc = calculate(targetVar, { gender: pData.gender, age, inputs: r._computedInputs });
                            rowData[`col_${targetVar.id}`] = ((targetVar.has_ranges ?? targetVar.hasRanges) && calc.range) ? calc.range.label : calc.result;
                            rowData[`color_${targetVar.id}`] = calc.range?.color;
                            currentRawVal = calc.result;
                            if (prevRecord) {
                                const prevCalc = calculate(targetVar, { gender: pData.gender, age, inputs: prevRecord._computedInputs });
                                prevRawVal = prevCalc.result;
                            }
                        } else {
                            const fixedMapping: Record<string, string> = { "peso": "weight", "grasa": "body_fat_percentage", "cintura": "waist_circumference_cm" };
                            const field = fixedMapping[targetVar.code?.toLowerCase()] || null;
                            if (field && r[field] !== undefined) {
                                rowData[`col_${targetVar.id}`] = r[field];
                                currentRawVal = parseFloat(r[field]);
                                if (prevRecord && prevRecord[field] !== undefined) prevRawVal = parseFloat(prevRecord[field]);
                            } else {
                                rowData[`col_${targetVar.id}`] = r.extra_data?.[targetVar.code] || "—";
                                const extraVal = parseFloat(r.extra_data?.[targetVar.code]);
                                if (!isNaN(extraVal)) currentRawVal = extraVal;
                                if (prevRecord) {
                                    const prevExtraVal = parseFloat(prevRecord.extra_data?.[targetVar.code]);
                                    if (!isNaN(prevExtraVal)) prevRawVal = prevExtraVal;
                                }
                            }
                        }
                    } else if (col.fixed_variable) {
                        if (col.fixed_variable === 'bmi') {
                            const h = pData.height_cm || 100;
                            currentRawVal = r.weight ? (parseFloat(r.weight) / ((h / 100) * (h / 100))) : undefined;
                            if (prevRecord && prevRecord.weight) prevRawVal = (parseFloat(prevRecord.weight) / ((h / 100) * (h / 100)));
                        } else if (col.fixed_variable === 'weight') {
                            currentRawVal = parseFloat(r.weight);
                            if (prevRecord) prevRawVal = parseFloat(prevRecord.weight);
                        } else if (col.fixed_variable === 'body_fat') {
                            currentRawVal = parseFloat(r.body_fat_percentage);
                            if (prevRecord) prevRawVal = parseFloat(prevRecord.body_fat_percentage);
                        } else if (col.fixed_variable === 'waist') {
                            currentRawVal = parseFloat(r.waist_circumference_cm);
                            if (prevRecord) prevRawVal = parseFloat(prevRecord.waist_circumference_cm);
                        }
                    }

                    // Determinar tendencia
                    if (currentRawVal !== undefined && prevRawVal !== undefined && !isNaN(currentRawVal) && !isNaN(prevRawVal)) {
                        if (currentRawVal > prevRawVal) rowData[`trend_${col.variable_id || col.fixed_variable}`] = 'up';
                        else if (currentRawVal < prevRawVal) rowData[`trend_${col.variable_id || col.fixed_variable}`] = 'down';
                    }
                });
                return rowData;
            });

            setRecords(processedRecords);

            setBioValues({
                date_of_birth: pData.date_of_birth || "",
                height_cm: pData.height_cm != null ? pData.height_cm.toString() : "",
                initial_weight: pData.current_weight != null ? pData.current_weight.toString() : "",
                gender: pData.gender || "otro"
            });

        } catch (err: any) {
            console.error("[fetchAllData] Error:", err.message);
        } finally {
            setLoading(false);
        }
    }, [patientId, supabase, calculate]);

    useEffect(() => {
        fetchAllData();
    }, [fetchAllData]);

    const canEditMasterFields = useMemo(() => {
        return currentUserRole === "administrador" || currentUserRole === "staff";
    }, [currentUserRole]);

    // --- ACCIONES ---

    const handleSaveBio = async () => {
        try {
            const parseNum = (val: string) => {
                const clean = val.replace(',', '.').replace(/[^0-9.]/g, '');
                return clean ? parseFloat(clean) : null;
            };

            const h = parseNum(bioValues.height_cm);
            const w = parseNum(bioValues.initial_weight);

            const { error } = await supabase
                .from("patients")
                .update({
                    date_of_birth: bioValues.date_of_birth || null,
                    height_cm: h,
                    current_weight: w,
                    gender: bioValues.gender
                })
                .eq("id", patientId);

            if (error) throw error;
            toast({ title: "Ficha actualizada" });
            setShowBioDialog(false);
            new BroadcastChannel('nutrigo_global_sync').postMessage('sync');
            fetchAllData();
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    };

    const handleSaveRecord = async () => {
        try {
            const parseNum = (val: any) => {
                if (!val) return 0;
                const str = String(val).trim().replace(',', '.');
                if (str === '') return 0;
                const n = parseFloat(str);
                return isNaN(n) ? 0 : n;
            };

            // Llenar con 0s si están vacíos los campos numéricos
            const cleanedExtraData: Record<string, any> = {};
            const nativeExcludes = ["peso", "grasa", "cintura", "talla", "talla_cm", "edad", "imc"];
            clinicalVariables.forEach(v => {
                const code = v.code?.toUpperCase();
                if (code && !v.is_calculated && !nativeExcludes.includes(code.toLowerCase())) {
                    if ((v as any).data_type === 'text') {
                        cleanedExtraData[code] = extraData[code] || "";
                    } else {
                        cleanedExtraData[code] = parseNum(extraData[code] || "0");
                    }
                }
            });

            // Limpiamos los campos nativos de extraData por arrastre de bugs anteriores
            const filteredExtraData = { ...extraData };
            nativeExcludes.forEach(ex => delete filteredExtraData[ex.toUpperCase()]);

            const rowData: any = {
                patient_id: patientId,
                date: editValues.date || new Date().toISOString().split('T')[0],
                weight: parseNum(editValues.weight),
                body_fat_percentage: parseNum(editValues.body_fat_percentage),
                waist_circumference_cm: parseNum(editValues.waist_circumference_cm),
                clinical_findings: editValues.clinical_findings || "",
                nutritional_recommendations: editValues.nutritional_recommendations || "",
                extra_data: { ...filteredExtraData, ...cleanedExtraData } // fusionar manteniendo los 0s
            };

            const isNew = editingId === "new" || !editingId;

            const { error } = isNew
                ? await supabase.from("weight_records").insert([rowData])
                : await supabase.from("weight_records").update(rowData).eq("id", editingId);

            if (error) throw error;

            toast({ title: "Medición guardada" });
            setEditingId(null);
            setIsAddingMode(false);
            new BroadcastChannel('nutrigo_global_sync').postMessage('sync');
            fetchAllData();
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    };

    const handleDeleteRecord = async (id: string) => {
        if (!confirm("¿Eliminar medición?")) return;
        try {
            await supabase.from("weight_records").delete().eq("id", id);
            toast({ title: "Eliminado" });
            new BroadcastChannel('nutrigo_global_sync').postMessage('sync');
            fetchAllData();
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    };

    // --- MÉTRICAS ---

    const stats = useMemo(() => {
        const latest = records[0];
        const h = patient?.rawHeight || null;
        const w = latest?.weight || patient?.rawWeight || null;

        let imc = "—";
        if (h && w) imc = (w / ((h / 100) * (h / 100))).toFixed(1);

        return {
            weight: w != null ? `${w} kg` : "—",
            height: h != null ? `${h} cm` : "—",
            fat: latest?.body_fat_percentage != null ? `${latest.body_fat_percentage}%` : "—",
            waist: latest?.waist_circumference_cm != null ? `${latest.waist_circumference_cm} cm` : "—",
            imc,
            lastVisit: latest ? new Date(latest.date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : "Sin mediciones"
        };
    }, [records, patient]);

    if (loading && !patient) return <div className="p-20 text-center font-black animate-pulse text-slate-400 uppercase tracking-widest">Sincronizando...</div>;
    if (!patient) return <div className="p-20 text-center text-red-500 font-bold">Error: Paciente no encontrado</div>;

    const manualVars = clinicalVariables.filter(v => !v.is_calculated);

    return (
        <div className="space-y-6 max-w-[95%] mx-auto pb-20">
            {/* Cabecera */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl hover:bg-white shadow-sm border border-slate-100">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black text-slate-800 tracking-tight">{patient.name}</h1>
                            <Badge className={cn("rounded-lg text-[10px] font-black uppercase tracking-tighter", patient.status === 'Activo' ? "bg-green-100 text-green-700" : "bg-slate-100")}>
                                {patient.status}
                            </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-6 mt-3">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Edad</span>
                                <span className="text-sm font-bold text-slate-700">{patient.age != null ? `${patient.age} años` : "—"}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Talla</span>
                                <span className="text-sm font-bold text-slate-700">{patient.rawHeight != null ? `${patient.rawHeight} cm` : "—"}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Género</span>
                                <span className="text-sm font-bold text-slate-700 capitalize">{patient.gender}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button variant="outline" className="rounded-xl font-black text-xs h-12 border-slate-200" onClick={() => setShowBioDialog(true)}>
                        <Edit2 className="h-4 w-4 mr-2 text-slate-400" /> Editar Ficha
                    </Button>
                    <Button className="rounded-xl bg-slate-900 font-black text-xs text-white shadow-xl h-12 px-6 hover:scale-105 transition-transform" onClick={() => {
                        setIsAddingMode(true);
                        setEditingId("new");
                        setEditValues({
                            date: new Date().toISOString().split('T')[0],
                            weight: patient.rawWeight || "",
                            findings: "",
                            recommendations: ""
                        });
                        setExtraData({});
                    }}>
                        <Plus className="h-4 w-4 mr-2" /> Nueva Consulta
                    </Button>
                </div>
            </div>

            {/* Métricas Destacadas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className={cn("border-0 text-white shadow-xl overflow-hidden relative", parseFloat(stats.imc) < 25 ? "bg-nutrition-600" : "bg-orange-600")}>
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Calculator className="h-20 w-20" />
                    </div>
                    <CardContent className="p-6 relative z-10">
                        <div className="text-[10px] font-black uppercase opacity-70 mb-2 tracking-widest">IMC Actual</div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black tracking-tighter">{stats.imc}</span>
                            <Badge variant="secondary" className="bg-white/20 text-white text-[10px] border-0 font-black uppercase">{getIMCCategory(stats.imc)}</Badge>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white shadow-xl border-none">
                    <CardContent className="p-6">
                        <div className="text-[10px] font-black uppercase text-nutrition-600 mb-2 tracking-widest">Peso</div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-3xl font-black text-slate-800 tracking-tighter">{stats.weight}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-white shadow-xl border-none">
                    <CardContent className="p-6">
                        <div className="text-[10px] font-black uppercase text-orange-500 mb-2 tracking-widest">% Grasa</div>
                        <span className="text-3xl font-black text-slate-800 tracking-tighter">{stats.fat}</span>
                    </CardContent>
                </Card>
                <Card className="bg-white shadow-xl border-none">
                    <CardContent className="p-6">
                        <div className="text-[10px] font-black uppercase text-indigo-500 mb-2 tracking-widest">Cintura</div>
                        <span className="text-3xl font-black text-slate-800 tracking-tighter">{stats.waist}</span>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="historial">
                <TabsList className="bg-slate-100/50 p-1 rounded-2xl mb-4 border border-slate-100">
                    <TabsTrigger value="historial" className="font-black text-[10px] uppercase px-4 py-2 flex items-center gap-2 rounded-xl">
                        <ClipboardList className="h-4 w-4" /> Historial de Consultas
                    </TabsTrigger>
                </TabsList>
                <TabsContent value="historial">
                    {isAddingMode && editingId === "new" && (
                        <NewConsultationForm
                            date={editValues.date || ''}
                            setDate={(d: string) => setEditValues({ ...editValues, date: d })}
                            editValues={editValues}
                            setEditValues={setEditValues}
                            extraData={extraData}
                            setExtraData={setExtraData}
                            onSave={handleSaveRecord}
                            onCancel={() => setIsAddingMode(false)}
                            patientHeight={patient?.rawHeight || 100}
                            recordNumber={records.length + 1}
                            layout={formLayout as any[]}
                            clinicalVariables={clinicalVariables}
                        />
                    )}
                    <Card className="rounded-[2.5rem] shadow-xl border-none overflow-hidden bg-white">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-slate-50/50 text-[10px] font-black uppercase text-slate-400 border-b border-slate-100">
                                    <tr>
                                        <th className="px-8 py-6 tracking-widest text-center w-12">Nº</th>
                                        {layout.slice(0, 4).map((col, idx) => (
                                            <th key={idx} className="px-8 py-6 tracking-widest text-center">
                                                {col.header}
                                            </th>
                                        ))}
                                        <th className="px-8 py-6 tracking-widest text-right">ESTADO</th>
                                        <th className="px-8 py-6 text-right w-16">ACCIONES</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50">
                                    {records.map((r, rIdx) => {
                                        if (isAddingMode && editingId === r.id) return null;
                                        return (
                                            <tr key={r.id} className="group hover:bg-slate-50/50 transition-all">
                                                <td className="px-8 py-6 text-center text-slate-400 font-black text-sm">
                                                    {records.length - rIdx}
                                                </td>
                                                {layout.slice(0, 4).map((col, idx) => {
                                                    const targetVar = clinicalVariables.find(v => v.id === col.variable_id);
                                                    let val = "—";
                                                    let color = null;

                                                    if (col.fixed_variable === 'date') {
                                                        val = new Date(r.date + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
                                                    } else if (targetVar) {
                                                        val = r[`col_${targetVar.id}`] !== undefined ? r[`col_${targetVar.id}`] : "—";
                                                        color = r[`color_${targetVar.id}`];
                                                    } else if (col.fixed_variable) {
                                                        if (col.fixed_variable === 'bmi') {
                                                            const w = parseFloat(r.weight || patient?.rawWeight || '0');
                                                            const h = patient?.rawHeight || 100;
                                                            val = (w > 0 && h > 0) ? (w / ((h / 100) * (h / 100))).toFixed(1) : "—";
                                                        } else {
                                                            const nativeFieldMap: Record<string, string> = {
                                                                'weight': 'weight',
                                                                'body_fat': 'body_fat_percentage',
                                                                'waist': 'waist_circumference_cm'
                                                            };
                                                            const field = nativeFieldMap[col.fixed_variable];
                                                            if (field && r[field] != null) {
                                                                val = r[field];
                                                            }
                                                        }
                                                    }

                                                    return (
                                                        <td key={idx} className="px-8 py-6 text-sm text-center">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <span className={cn(
                                                                    "font-black tracking-tight",
                                                                    col.fixed_variable === 'date' ? "text-slate-400 uppercase text-[10px]" : "text-lg text-slate-700",
                                                                    (!color || color.startsWith('#')) ? undefined : color.replace('bg-', 'text-')
                                                                )} style={{ color: color?.startsWith('#') ? color : undefined }}>
                                                                    {val}
                                                                </span>
                                                                {r[`trend_${col.variable_id || col.fixed_variable}`] === 'up' && <TrendingUp className="h-[14px] w-[14px] text-emerald-500 stroke-[3]" />}
                                                                {r[`trend_${col.variable_id || col.fixed_variable}`] === 'down' && <TrendingDown className="h-[14px] w-[14px] text-rose-500 stroke-[3]" />}
                                                            </div>
                                                        </td>
                                                    );
                                                })}
                                                <td className="px-8 py-6 text-right font-medium text-[11px] uppercase tracking-wider">
                                                    {(() => {
                                                        const requiredExtraKeys = [
                                                            'BRAZO_RELAJADO', 'BRAZO_FLEXIONADO', 'ANTEBRAZO_MAXIMO', 'TORAX',
                                                            'CINTURA_MINIMA', 'CINTURA_MAXIMA', 'CADERA_MAXIMA', 'MUSLO_MAXIMO',
                                                            'P_TRICEPS', 'P_SUBESCAPULAR', 'P_SUPRAESPINAL', 'P_ABDOMINAL',
                                                            'P_MUSLO_MEDIAL', 'P_PANTORRILLA', 'CRESTA_ILIACA', 'BICEPS'
                                                        ];
                                                        const checkWeight = r.weight !== null && r.weight !== undefined && r.weight !== '';
                                                        const checkExtra = requiredExtraKeys.every(k => r.extra_data && r.extra_data[k] !== undefined && r.extra_data[k] !== null && String(r.extra_data[k]).trim() !== '');
                                                        const isComplete = checkWeight && checkExtra;

                                                        return isComplete ? (
                                                            <span className="text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200 shadow-sm flex items-center justify-end gap-1 w-max ml-auto">
                                                                <Check className="h-3 w-3" /> Registro completado
                                                            </span>
                                                        ) : (
                                                            <span className="text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 shadow-sm flex items-center justify-end w-max ml-auto">
                                                                Registro incompleto
                                                            </span>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="px-8 py-6">
                                                    <div className="flex justify-end transition-opacity">
                                                        <Button size="icon" variant="ghost" className="h-9 w-9 text-slate-400 rounded-xl bg-slate-100 hover:bg-slate-200" onClick={() => {
                                                            setEditingId(r.id);
                                                            setIsAddingMode(false);
                                                            setEditValues(r);
                                                            setExtraData(r.extra_data || {});
                                                            setIsAddingMode(true);
                                                        }}><Edit2 className="h-4 w-4" /></Button>
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Modal Ficha Biográfica */}
            <Dialog open={showBioDialog} onOpenChange={setShowBioDialog}>
                <DialogContent className="rounded-[2.5rem] p-8 max-w-md border-none shadow-2xl">
                    <DialogHeader>
                        <div className="flex justify-between items-start">
                            <DialogTitle className="text-2xl font-black tracking-tight">Ficha Biográfica</DialogTitle>
                            {canEditMasterFields && <Badge className="bg-orange-100 text-orange-700 border-none px-3 py-1 text-[9px] uppercase font-black"><ShieldCheck className="h-3 w-3 mr-1" /> Privilegiado</Badge>}
                        </div>
                        <DialogDescription className="text-xs font-medium text-slate-400">Datos estructurales para el motor de cálculos.</DialogDescription>
                    </DialogHeader>
                    <div className="space-y-6 py-4">
                        <div className="grid gap-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400">Nacimiento {!canEditMasterFields && "*"}</Label>
                            <Input type="date" value={bioValues.date_of_birth} disabled={!canEditMasterFields && !!patient?.rawBday} onChange={e => setBioValues({ ...bioValues, date_of_birth: e.target.value })} className="h-12 rounded-2xl bg-slate-50 border-none font-bold" />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="grid gap-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Talla (cm)</Label>
                                <Input type="text" placeholder="175" value={bioValues.height_cm} onChange={e => setBioValues({ ...bioValues, height_cm: e.target.value })} className="h-12 rounded-2xl bg-slate-50 border-none font-bold" />
                            </div>
                            <div className="grid gap-2">
                                <Label className="text-[10px] font-black uppercase text-slate-400">Peso Base (kg) {!canEditMasterFields && "*"}</Label>
                                <Input type="text" placeholder="70.5" value={bioValues.initial_weight} disabled={!canEditMasterFields && patient?.rawWeight != null} onChange={e => setBioValues({ ...bioValues, initial_weight: e.target.value })} className="h-12 rounded-2xl bg-slate-50 border-none font-bold" />
                            </div>
                        </div>
                        <div className="grid gap-2">
                            <Label className="text-[10px] font-black uppercase text-slate-400">Género {!canEditMasterFields && "*"}</Label>
                            <Select value={bioValues.gender} onValueChange={v => setBioValues({ ...bioValues, gender: v })} disabled={!canEditMasterFields && patient?.gender !== 'otro'}>
                                <SelectTrigger className="h-12 rounded-2xl bg-slate-50 border-none font-bold"><SelectValue /></SelectTrigger>
                                <SelectContent className="rounded-2xl border-none shadow-xl">
                                    <SelectItem value="masculino" className="font-bold">Masculino</SelectItem>
                                    <SelectItem value="femenino" className="font-bold">Femenino</SelectItem>
                                    <SelectItem value="otro" className="font-bold">Otro (No binario)</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter className="gap-3 mt-4">
                        <Button variant="ghost" className="rounded-2xl flex-1 font-bold text-slate-400" onClick={() => setShowBioDialog(false)}>Descartar</Button>
                        <Button className="bg-slate-900 text-white font-black px-8 rounded-2xl flex-1 shadow-lg hover:scale-105 transition-transform" onClick={handleSaveBio}>Aplicar Cambios</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            {/* Modal Editar Consulta */}
            <EditConsultationModal
                isOpen={isAddingMode && editingId !== 'new' && editingId !== null}
                onClose={() => { setIsAddingMode(false); setEditingId(null); }}
                date={editValues.date || ''}
                setDate={(d: string) => setEditValues({ ...editValues, date: d })}
                editValues={editValues}
                setEditValues={setEditValues}
                extraData={extraData}
                setExtraData={setExtraData}
                onSave={handleSaveRecord}
                onDelete={() => handleDeleteRecord(editingId!)}
                patientHeight={patient?.rawHeight || 100}
                patientName={patient?.name || ''}
                recordNumber={records.length - records.findIndex(r => r.id === editingId)}
                layout={formLayout as any[]}
                clinicalVariables={clinicalVariables}
            />
        </div>
    );
}
