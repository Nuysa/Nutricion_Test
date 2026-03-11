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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useFormulaEngine } from "@/hooks/useFormulaEngine";
import { NewConsultationForm } from "@/components/dashboard/nutricionista/NewConsultationForm";
import { EditConsultationModal } from "@/components/dashboard/nutricionista/EditConsultationModal";
import { MedicalHistoryModal } from "@/components/dashboard/nutricionista/MedicalHistoryModal";
import { PatientHistoryCharts } from "@/components/dashboard/paciente/PatientHistoryCharts";
import { PhotoHistoryCarousel } from "@/components/dashboard/shared/photo-history-carousel";
import { History, Camera } from "lucide-react";

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
    const [showHistoryDialog, setShowHistoryDialog] = useState(false);
    const [bioValues, setBioValues] = useState({
        date_of_birth: "",
        height_cm: "",
        initial_weight: "",
        gender: "otro"
    });

    const [editingId, setEditingId] = useState<string | null>(null);
    const [isAddingMode, setIsAddingMode] = useState(false);
    const [editValues, setEditValues] = useState<any>({});
    const [showChartsDialog, setShowChartsDialog] = useState(false);
    const [extraData, setExtraData] = useState<Record<string, any>>({});
    const [todayAppointment, setTodayAppointment] = useState<any>(null);
    const [photoHistory, setPhotoHistory] = useState<any[]>([]);

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
                .select("id, height_cm, current_weight, date_of_birth, gender, plan_type, profile:profiles!profile_id(full_name, status)")
                .eq("id", patientId)
                .single();

            if (pError) throw pError;

            // Fetch Medical History for quick view
            const { data: mHistory } = await supabase
                .from("patient_medical_histories")
                .select("nutritional_goal, health_conditions")
                .eq("patient_id", patientId)
                .single();

            const { data: hData, error: hError } = await supabase
                .from("weight_records")
                .select("*")
                .eq("patient_id", patientId)
                .order("date", { ascending: false })
                .order("created_at", { ascending: false });

            if (hError) throw hError;

            // Fetch Medical history photos
            const { data: medHists } = await supabase
                .from("patient_medical_histories")
                .select("*")
                .eq("patient_id", patientId)
                .order("created_at", { ascending: false });
            
            let mappedHistory: any[] = [];
            if (medHists && medHists.length > 0) {
                mappedHistory = medHists
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
            
            const getExtra = (r: any) => (typeof r.extra_data === 'string' ? JSON.parse(r.extra_data) : (r.extra_data || {}));
            const mappedRecords = (hData || [])
                .filter((r: any) => {
                    const ex = getExtra(r);
                    return ex.photo_front_url || ex.photo_side1_url || ex.photo_side2_url || ex.photo_back_url;
                })
                .map((r: any) => {
                    const ex = getExtra(r);
                    return {
                        date: r.date,
                        photos: {
                            1: ex.photo_front_url || null,
                            2: ex.photo_side1_url || null,
                            3: ex.photo_side2_url || null,
                            4: ex.photo_back_url || null
                        }
                    };
                });
            const combinedHistory = [...mappedRecords, ...mappedHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
            setPhotoHistory(combinedHistory);

            // Fetch today's appointment
            const todayD = new Date();
            const yyyy = todayD.getFullYear();
            const mm = String(todayD.getMonth() + 1).padStart(2, '0');
            const dd = String(todayD.getDate()).padStart(2, '0');
            const todayStr = `${yyyy}-${mm}-${dd}`;
            
            const { data: apts } = await supabase
                .from("appointments")
                .select("*")
                .eq("patient_id", patientId)
                .eq("date", todayStr);
            
            const activeApt = apts?.find(a => a.status !== 'cancelada' && a.status !== 'completada' && a.status !== 'completado' && a.status !== 'canceled');
            setTodayAppointment(activeApt || null);

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
                status: (pData.profile as any)?.status || "Activo",
                subscription: pData.plan_type || "No Plan",
                nutritionalGoal: mHistory?.nutritional_goal || "Sin registrar",
                medicalConditions: mHistory?.health_conditions || "Ninguna"
            };

            setPatient(mappedPatient);

            // Procesar records: Paso 1, calcular inputs
            const preProcessedRecords = (hData || []).map((r: any) => {
                const rowData = { ...r };
                const inputs: Record<string, any> = {
                    ...(r.extra_data || {}),
                    "PESO_BASE": pData.current_weight != null ? Number(pData.current_weight) : 0,
                    "TALLA_BASE": pData.height_cm || 0,
                    "EDAD": age,
                    "GENERO_V": pData.gender === 'masculino' || pData.gender === 'M' ? 1 : (pData.gender === 'femenino' || pData.gender === 'F' ? 2 : 0)
                };

                // Priorizar campos nativos si tienen valor, si no mantener lo que venga de extra_data
                inputs["PESO"] = r.weight || inputs["PESO"] || 0;
                inputs["TALLA"] = pData.height_cm || inputs["TALLA"] || inputs["TALLA_CM"] || 0;
                inputs["TALLA_CM"] = inputs["TALLA"];
                inputs["CINTURA"] = r.waist_circumference_cm || inputs["CINTURA"] || 0;
                inputs["GRASA"] = r.body_fat_percentage || inputs["GRASA"] || 0;
                inputs["IMC"] = (inputs["PESO"] > 0 && inputs["TALLA"] > 0) ? Number((inputs["PESO"] / ((inputs["TALLA"] / 100) * (inputs["TALLA"] / 100))).toFixed(1)) : 0;

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
                gender: (pData.gender || "otro").toLowerCase()
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
                extra_data: { ...filteredExtraData, ...cleanedExtraData, appointment_id: todayAppointment?.id || null } // fusionar manteniendo los 0s
            };

            const isNew = editingId === "new" || !editingId;

            const { error } = isNew
                ? await supabase.from("weight_records").insert([rowData])
                : await supabase.from("weight_records").update(rowData).eq("id", editingId);

            if (error) throw error;
            
            if (isNew && todayAppointment) {
                await supabase.from("appointments").update({ status: 'completada' }).eq("id", todayAppointment.id);
            }

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
        const h = latest?._computedInputs?.['TALLA'] || patient?.rawHeight || null;
        const w = latest?._computedInputs?.['PESO'] || latest?.weight || patient?.rawWeight || null;

        let imc = "—";
        if (h && w) imc = (w / ((h / 100) * (h / 100))).toFixed(1);

        return {
            weight: w != null ? `${w} kg` : "—",
            height: h != null ? `${h} cm` : "—",
            fat: (latest?._computedInputs?.['GRASA'] || latest?._computedInputs?.['GRASA_CORPORAL'] || latest?.body_fat_percentage) ? `${latest?._computedInputs?.['GRASA'] || latest?._computedInputs?.['GRASA_CORPORAL'] || latest?.body_fat_percentage}%` : "—",
            waist: (latest?._computedInputs?.['CINTURA'] || latest?._computedInputs?.['CINTURA_MINIMA'] || latest?.waist_circumference_cm) ? `${latest?._computedInputs?.['CINTURA'] || latest?._computedInputs?.['CINTURA_MINIMA'] || latest?.waist_circumference_cm} cm` : "—",
            imc,
            lastVisit: latest ? new Date(latest.date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : "Sin mediciones"
        };
    }, [records, patient]);

    const chartProps = useMemo(() => {
        if (!records || records.length === 0) return null;

        const reversedMeasurements = [...records].reverse();
        const patientHeight = patient?.rawHeight || 100;

        const varDiagGrasa = clinicalVariables.find((v: any) => (v.name?.toUpperCase().includes('SUMA DE PLIEGUES') || v.code?.toUpperCase().includes('SUMA_PLIEGUES')) && (v.has_ranges || v.hasRanges));
        const varDiagMusculo = clinicalVariables.find((v: any) => v.name?.toUpperCase().includes('MUSCULO LEE') && (v.has_ranges || v.hasRanges));
        const varDiagCintura = clinicalVariables.find((v: any) => v.name?.toUpperCase().includes('CINTURA') && (v.has_ranges || v.hasRanges));

        const fechasHistorial = reversedMeasurements.map(r => {
            const dateObj = new Date(r.date + 'T12:00:00');
            return dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).toUpperCase();
        });

        const pesoData = reversedMeasurements.map(m => parseFloat(m.weight) || 0);

        const imcData = reversedMeasurements.map(m => {
            const w = parseFloat(m.weight) || 0;
            return w > 0 && patientHeight > 0 ? parseFloat((w / ((patientHeight / 100) * (patientHeight / 100))).toFixed(1)) : 0;
        });

        const grasaPctData = reversedMeasurements.map(m => parseFloat(m._computedInputs?.['GRASA_CORPORAL']) || 0);
        const grasaKgData = reversedMeasurements.map((m, i) => {
            const w = parseFloat(m.weight) || 0;
            const pct = grasaPctData[i];
            return parseFloat((w * (pct / 100)).toFixed(2));
        });

        const diffGrasaData = grasaKgData.map((val, i, arr) => i === 0 ? 0 : parseFloat((val - arr[i - 1]).toFixed(2)));

        const etiquetasDiagnosticoGrasa = reversedMeasurements.map(m => {
            if (varDiagGrasa) {
                const calc = calculate(varDiagGrasa, { gender: patient?.gender, age: patient?.age, inputs: m._computedInputs });
                const val = (calc.range?.label || (calc.result && calc.result.toString())) || "—";
                if (val && typeof val === 'string' && val.includes('-')) return val.split('-');
                return val;
            }
            return "—";
        });

        const musculoPctData = reversedMeasurements.map(m => parseFloat(m._computedInputs?.['MASA_MUSCULAR_LEE']) || 0);
        const musculoKgData = reversedMeasurements.map((m, i) => {
            const w = parseFloat(m.weight) || 0;
            const pct = musculoPctData[i];
            return parseFloat((w * (pct / 100)).toFixed(2));
        });

        const diffMusculoData = musculoKgData.map((val, i, arr) => i === 0 ? 0 : parseFloat((val - arr[i - 1]).toFixed(2)));

        const etiquetasDiagnosticoMusculo = reversedMeasurements.map(m => {
            if (varDiagMusculo) {
                const calc = calculate(varDiagMusculo, { gender: patient?.gender, age: patient?.age, inputs: m._computedInputs });
                const val = (calc.range?.label || (calc.result && calc.result.toString())) || "—";
                if (val && typeof val === 'string' && val.includes('-')) return val.split('-');
                return val;
            }
            return "—";
        });

        const cinturaCmData = reversedMeasurements.map(m => parseFloat(m._computedInputs?.['CINTURA_MINIMA']) || parseFloat(m.waist_circumference_cm) || parseFloat(m._computedInputs?.['CINTURA']) || 0);

        const etiquetasDiagnosticoCintura = reversedMeasurements.map(m => {
            if (varDiagCintura) {
                const calc = calculate(varDiagCintura, { gender: patient?.gender, age: patient?.age, inputs: m._computedInputs });
                const val = (calc.range?.label || (calc.result && calc.result.toString())) || "—";
                if (val && typeof val === 'string' && val.includes('-')) return val.split('-');
                return val;
            }
            return "—";
        });

        return {
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
            etiquetasDiagnosticoCintura,
            brazoRelajadoData: reversedMeasurements.map(m => parseFloat(m._computedInputs?.['BRAZO_RELAJADO']) || 0),
            brazoFlexionadoData: reversedMeasurements.map(m => parseFloat(m._computedInputs?.['BRAZO_FLEXIONADO']) || 0),
            antebrazoData: reversedMeasurements.map(m => parseFloat(m._computedInputs?.['ANTEBRAZO_MAXIMO']) || 0),
            toraxData: reversedMeasurements.map(m => parseFloat(m._computedInputs?.['TORAX']) || 0),
            cinturaMinData: reversedMeasurements.map(m => parseFloat(m._computedInputs?.['CINTURA_MINIMA']) || 0),
            cinturaMaxData: reversedMeasurements.map(m => parseFloat(m._computedInputs?.['CINTURA_MAXIMA']) || 0),
            caderaMaxData: reversedMeasurements.map(m => parseFloat(m._computedInputs?.['CADERA_MAXIMA']) || 0),
            musloMaxData: reversedMeasurements.map(m => parseFloat(m._computedInputs?.['MUSLO_MAXIMO']) || 0),
            musloMedialData: reversedMeasurements.map(m => parseFloat(m._computedInputs?.['MUSLO_MEDIAL']) || 0),
            pantorrillaPerimData: reversedMeasurements.map(m => parseFloat(m._computedInputs?.['P_PANTORRILLA_PERIMETRO']) || parseFloat(m._computedInputs?.['PANTORRILLA']) || 0),
            tricepsData: reversedMeasurements.map(m => parseFloat(m._computedInputs?.['P_TRICEPS']) || 0),
            subescapularData: reversedMeasurements.map(m => parseFloat(m._computedInputs?.['P_SUBESCAPULAR']) || 0),
            abdominalData: reversedMeasurements.map(m => parseFloat(m._computedInputs?.['P_ABDOMINAL']) || 0),
            musloMedialFoldData: reversedMeasurements.map(m => parseFloat(m._computedInputs?.['P_MUSLO_MEDIAL']) || 0),
            pantorrillaFoldData: reversedMeasurements.map(m => parseFloat(m._computedInputs?.['P_PANTORRILLA']) || 0),
            crestaIliacaData: reversedMeasurements.map(m => parseFloat(m._computedInputs?.['CRESTA_ILIACA']) || parseFloat(m._computedInputs?.['P_SUPRAESPINAL']) || 0),
            bicepsData: reversedMeasurements.map(m => parseFloat(m._computedInputs?.['BICEPS']) || 0),
            sumaPlieguesData: reversedMeasurements.map(m => {
                const val = parseFloat(m._computedInputs?.['SUMA_PLIEGUES']);
                if (val > 0) return val;
                // Fallback manual sum of ISAK 6 folds
                const isak6 = ['P_TRICEPS', 'P_SUBESCAPULAR', 'P_SUPRAESPINAL', 'P_ABDOMINAL', 'P_MUSLO_MEDIAL', 'P_PANTORRILLA'];
                let sum = isak6.reduce((acc, code) => acc + (parseFloat(m._computedInputs?.[code]) || 0), 0);
                // Si supraespinal es 0, intentar con Cresta Iliaca como alternativo para el 6to pliegue
                if ((parseFloat(m._computedInputs?.['P_SUPRAESPINAL']) || 0) === 0) {
                    sum += (parseFloat(m._computedInputs?.['CRESTA_ILIACA']) || 0);
                }
                return parseFloat(sum.toFixed(1));
            })
        };
    }, [records, patient, clinicalVariables]);

    if (loading && !patient) return <div className="p-20 text-center font-black animate-pulse text-slate-400 uppercase tracking-widest">Sincronizando...</div>;
    if (!patient) return <div className="p-20 text-center text-red-500 font-bold">Error: Paciente no encontrado</div>;

    const manualVars = clinicalVariables.filter(v => !v.is_calculated);

    return (
        <div className="space-y-6 max-w-[95%] mx-auto pb-20">
            {/* Cabecera */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" size="icon" onClick={() => router.back()} className="rounded-xl hover:bg-white/10 text-white shadow-sm border border-white/10 bg-white/5">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-3xl font-black text-white tracking-tight">{patient.name}</h1>
                            <Badge className={cn("rounded-lg text-[10px] font-black uppercase tracking-tighter shadow-sm", patient.status === 'Activo' ? "bg-emerald-500/20 text-emerald-400 border-none" : "bg-slate-500/20 text-slate-400 border-none")}>
                                {patient.status}
                            </Badge>
                            <Badge className="rounded-lg text-[10px] font-black uppercase tracking-tighter shadow-sm bg-nutrition-500/20 text-nutrition-500 border-none">
                                {patient.subscription}
                            </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-10 gap-y-4 mt-3">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Edad</span>
                                <span className="text-sm font-bold text-white">{patient.age != null ? `${patient.age} años` : "—"}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Talla</span>
                                <span className="text-sm font-bold text-white">{patient.rawHeight != null ? `${patient.rawHeight} cm` : "—"}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Género</span>
                                <span className="text-sm font-bold text-white capitalize">{patient.gender}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Objetivo Nutricional</span>
                                <span className="text-sm font-bold text-white">{patient.nutritionalGoal}</span>
                            </div>
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Condiciones Médicas</span>
                                <span className="text-sm font-bold text-white">
                                    {Array.isArray(patient.medicalConditions) ? (patient.medicalConditions.length > 0 ? patient.medicalConditions.join(', ') : 'Ninguna') : patient.medicalConditions}
                                </span>
                            </div>
                            <Button
                                onClick={() => setShowHistoryDialog(true)}
                                variant="outline"
                                size="sm"
                                className="h-9 px-4 rounded-xl border-nutri-brand/30 bg-nutri-brand/10 text-[10px] font-black uppercase text-nutri-brand hover:bg-nutri-brand hover:text-white transition-all tracking-widest shadow-lg shadow-nutri-brand/5"
                            >
                                <ClipboardList className="h-3.5 w-3.5 mr-2" /> Ver Historia Clínica
                            </Button>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button variant="outline" className="rounded-xl font-black text-xs h-12 border-white/10 bg-white/5 text-white hover:bg-white/10 shadow-lg" onClick={() => setShowBioDialog(true)}>
                        <Edit2 className="h-4 w-4 mr-2 text-nutri-brand" /> Editar Ficha
                    </Button>
                    <div title={!todayAppointment ? "Requiere una cita programada para hoy" : (patient.subscription === "No Plan" || !patient.subscription || patient.subscription.toLowerCase().includes("sin plan") ? "Requiere un plan activo" : "")}>
                        <Button
                            disabled={patient.subscription === "No Plan" || !patient.subscription || patient.subscription.toLowerCase().includes("sin plan") || !todayAppointment}
                            className="rounded-xl bg-nutri-brand font-black text-xs text-white shadow-xl h-12 px-6 hover:scale-105 transition-all shadow-nutri-brand/20 uppercase tracking-widest disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:scale-100"
                            onClick={() => {
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
            </div>

            {/* Métricas Destacadas */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className={cn("border-0 text-white shadow-2xl overflow-hidden relative rounded-[2rem]", parseFloat(stats.imc) < 25 ? "bg-gradient-to-br from-nutri-brand to-emerald-600" : "bg-gradient-to-br from-orange-500 to-red-600")}>
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <Calculator className="h-20 w-20" />
                    </div>
                    <CardContent className="p-7 relative z-10">
                        <div className="text-[10px] font-black uppercase opacity-70 mb-2 tracking-widest">IMC Actual</div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-5xl font-black tracking-tighter">{stats.imc}</span>
                            <Badge variant="secondary" className="bg-white/20 text-white text-[9px] border-0 font-black uppercase px-2">{getIMCCategory(stats.imc)}</Badge>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-[#1A253A]/60 backdrop-blur-xl shadow-2xl border-white/5 rounded-[2rem] overflow-hidden relative group">
                    <div className="absolute top-0 right-10 w-20 h-20 bg-nutri-brand/5 blur-3xl group-hover:bg-nutri-brand/10 transition-all opacity-0 group-hover:opacity-100" />
                    <CardContent className="p-7">
                        <div className="text-[10px] font-black uppercase text-nutri-brand mb-2 tracking-widest">Peso</div>
                        <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-black text-white tracking-tighter">{stats.weight}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-[#1A253A]/60 backdrop-blur-xl shadow-2xl border-white/5 rounded-[2rem] overflow-hidden relative group">
                    <div className="absolute top-0 right-10 w-20 h-20 bg-orange-500/5 blur-3xl group-hover:bg-orange-500/10 transition-all opacity-0 group-hover:opacity-100" />
                    <CardContent className="p-7">
                        <div className="text-[10px] font-black uppercase text-orange-500 mb-2 tracking-widest">% Grasa</div>
                        <span className="text-4xl font-black text-white tracking-tighter">{stats.fat}</span>
                    </CardContent>
                </Card>
                <Card className="bg-[#1A253A]/60 backdrop-blur-xl shadow-2xl border-white/5 rounded-[2rem] overflow-hidden relative group">
                    <div className="absolute top-0 right-10 w-20 h-20 bg-indigo-500/5 blur-3xl group-hover:bg-indigo-500/10 transition-all opacity-0 group-hover:opacity-100" />
                    <CardContent className="p-7">
                        <div className="text-[10px] font-black uppercase text-indigo-500 mb-2 tracking-widest">Cintura</div>
                        <span className="text-4xl font-black text-white tracking-tighter">{stats.waist}</span>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="historial">
                <TabsList className="bg-[#1A253A]/80 p-1.5 rounded-2xl mb-8 border border-white/5 inline-flex backdrop-blur-xl shadow-2xl">
                    <div className="flex items-center gap-4">
                        <TabsTrigger
                            value="historial"
                            className="font-black text-[10px] uppercase px-8 py-3 flex items-center gap-2 rounded-xl data-[state=active]:bg-nutri-brand data-[state=active]:text-white text-slate-400 tracking-widest transition-all duration-300 data-[state=active]:shadow-[0_0_20px_rgba(255,102,0,0.3)] border border-transparent data-[state=active]:border-white/10"
                        >
                            <ClipboardList className="h-4 w-4" /> Historial de Consultas
                        </TabsTrigger>
                        <Button
                            onClick={() => setShowChartsDialog(true)}
                            variant="ghost"
                            className="h-10 px-4 rounded-xl border border-white/5 bg-white/5 text-[10px] font-black uppercase text-slate-400 hover:text-nutri-brand transition-all tracking-widest"
                        >
                            <History className="h-3.5 w-3.5 mr-2" /> Ver Registro
                        </Button>
                    </div>
                </TabsList>
                <TabsContent value="historial">
                    {isAddingMode && editingId === "new" && (
                        <NewConsultationForm
                            patientId={patientId}
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
                    <Card className="rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/5 overflow-hidden bg-[#1A253A]/60 backdrop-blur-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-white/5 text-[10px] font-black uppercase text-slate-500 border-b border-white/5">
                                    <tr>
                                        <th className="px-8 py-7 tracking-widest text-center w-12 text-[#8F9BB3]">Nº</th>
                                        {layout.slice(0, 4).map((col, idx) => (
                                            <th key={idx} className="px-8 py-7 tracking-widest text-center text-[#8F9BB3]">
                                                {col.header}
                                            </th>
                                        ))}
                                        <th className="px-8 py-7 tracking-widest text-right text-[#8F9BB3]">ESTADO</th>
                                        <th className="px-8 py-7 text-right w-16 text-[#8F9BB3]">ACCIONES</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {records.map((r, rIdx) => {
                                        if (isAddingMode && editingId === r.id) return null;
                                        return (
                                            <tr key={r.id} className="group hover:bg-white/5 transition-all">
                                                <td className="px-8 py-7 text-center text-slate-600 font-bold text-sm">
                                                    {records.length - rIdx}
                                                </td>
                                                {layout.slice(0, 4).map((col, idx) => {
                                                    const targetVar = clinicalVariables.find(v => v.id === col.variable_id);
                                                    let val = "—";
                                                    let color = null;

                                                    if (col.fixed_variable === 'date') {
                                                        const dateObj = new Date(r.date + 'T12:00:00');
                                                        val = dateObj.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' }).toUpperCase();
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
                                                        <td key={idx} className="px-8 py-7 text-sm text-center">
                                                            <div className="flex items-center justify-center gap-1">
                                                                <span className={cn(
                                                                    "font-black tracking-tight",
                                                                    col.fixed_variable === 'date' ? "text-[#8F9BB3] text-[10px] tracking-widest italic" : "text-xl text-white",
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
                                                <td className="px-8 py-7 text-right font-medium text-[11px] uppercase tracking-wider">
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
                                                            <span className="text-emerald-400 bg-emerald-400/10 px-4 py-2 rounded-xl border border-emerald-400/20 shadow-sm flex items-center justify-end gap-2 w-max ml-auto text-[9px] font-black tracking-widest italic">
                                                                <Check className="h-3 w-3" /> COMPLETADO
                                                            </span>
                                                        ) : (
                                                            <span className="text-orange-400 bg-orange-400/10 px-4 py-2 rounded-xl border border-orange-400/20 shadow-sm flex items-center justify-end w-max ml-auto text-[9px] font-black tracking-widest italic">
                                                                INCOMPLETO
                                                            </span>
                                                        );
                                                    })()}
                                                </td>
                                                <td className="px-8 py-7">
                                                    <div className="flex justify-end transition-opacity">
                                                        <Button size="icon" variant="ghost" className="h-10 w-10 text-white rounded-xl bg-white/5 hover:bg-white/10 hover:text-nutri-brand transition-all border border-white/5" onClick={() => {
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

            <MedicalHistoryModal
                isOpen={showHistoryDialog}
                onClose={() => setShowHistoryDialog(false)}
                patientId={patientId}
                patientName={patient.name}
            />

            {/* Modal Ficha Biográfica */}
            <Dialog open={showBioDialog} onOpenChange={setShowBioDialog}>
                <DialogContent className="rounded-[3rem] p-0 max-w-md border-white/10 shadow-2xl bg-[#151F32] text-white overflow-hidden">
                    <div className="absolute top-0 right-10 w-32 h-32 bg-nutri-brand/10 blur-[60px] rounded-full" />

                    <div className="p-8 lg:p-10 space-y-8">
                        <DialogHeader>
                            <div className="flex justify-between items-start">
                                <DialogTitle className="text-3xl font-black tracking-tighter uppercase italic">
                                    Ficha <span className="text-nutri-brand">Biográfica</span>
                                </DialogTitle>
                                {canEditMasterFields && (
                                    <Badge className="bg-nutri-brand/20 text-nutri-brand border-none px-3 py-1 text-[9px] uppercase font-black tracking-widest">
                                        <ShieldCheck className="h-3 w-3 mr-1" /> Staff
                                    </Badge>
                                )}
                            </div>
                            <DialogDescription className="text-xs font-medium text-slate-400 italic">
                                Datos estructurales para el motor de cálculos.
                            </DialogDescription>
                        </DialogHeader>

                        <div className="space-y-6">
                            <div className="grid gap-2">
                                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Fecha de Nacimiento</Label>
                                <Input
                                    type="date"
                                    value={bioValues.date_of_birth}
                                    onChange={e => setBioValues({ ...bioValues, date_of_birth: e.target.value })}
                                    className="h-14 rounded-2xl bg-white/5 border-white/10 text-white font-bold px-6 focus:ring-nutri-brand/50"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="grid gap-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Talla (cm)</Label>
                                    <Input
                                        type="text"
                                        placeholder="175"
                                        value={bioValues.height_cm}
                                        onChange={e => setBioValues({ ...bioValues, height_cm: e.target.value })}
                                        className="h-14 rounded-2xl bg-white/5 border-white/10 text-white font-bold px-6"
                                    />
                                </div>
                                <div className="grid gap-2">
                                    <Label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Peso Base (kg)</Label>
                                    <Input
                                        type="text"
                                        placeholder="70.5"
                                        value={bioValues.initial_weight}
                                        onChange={e => setBioValues({ ...bioValues, initial_weight: e.target.value })}
                                        className="h-14 rounded-2xl bg-white/5 border-white/10 text-white font-bold px-6"
                                    />
                                </div>
                            </div>

                            <div className="grid gap-2">
                                <Label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em]">Género</Label>
                                <Select
                                    value={bioValues.gender}
                                    onValueChange={v => setBioValues({ ...bioValues, gender: v })}
                                >
                                    <SelectTrigger className="h-14 rounded-2xl bg-white/5 border-white/10 text-white font-bold px-6">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="rounded-2xl border-white/10 bg-[#151F32] text-white shadow-2xl">
                                        <SelectItem value="masculino" className="font-bold focus:bg-nutri-brand/10 focus:text-white">Masculino</SelectItem>
                                        <SelectItem value="femenino" className="font-bold focus:bg-nutri-brand/10 focus:text-white">Femenino</SelectItem>
                                        <SelectItem value="otro" className="font-bold focus:bg-nutri-brand/10 focus:text-white">Otro / No especificado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <DialogFooter className="gap-3 pt-6 border-t border-white/5">
                            <Button
                                variant="ghost"
                                className="h-14 rounded-2xl flex-1 font-black uppercase tracking-widest text-slate-500 hover:text-white hover:bg-white/5"
                                onClick={() => setShowBioDialog(false)}
                            >
                                Descartar
                            </Button>
                            <Button
                                className="h-14 bg-nutri-brand text-white font-black px-8 rounded-2xl flex-1 shadow-lg shadow-nutri-brand/20 hover:scale-105 transition-all uppercase tracking-widest"
                                onClick={handleSaveBio}
                            >
                                Aplicar Cambios
                            </Button>
                        </DialogFooter>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal Registro de Mediciones (Gráficos) */}
            <Dialog open={showChartsDialog} onOpenChange={setShowChartsDialog}>
                <DialogContent className="max-w-[90vw] w-[1200px] h-[85vh] p-0 rounded-[3rem] border-white/10 shadow-2xl bg-[#0B1120] overflow-hidden flex flex-col">
                    <DialogHeader className="p-8 pb-4 border-b border-white/5 shrink-0 relative">
                        <div className="flex justify-between items-start">
                            <div>
                                <DialogTitle className="text-2xl font-black text-white tracking-tight uppercase flex items-center gap-3">
                                    <TrendingUp className="h-6 w-6 text-nutri-brand" /> Registro de <span className="text-nutri-brand">Mediciones</span>
                                </DialogTitle>
                                <DialogDescription className="text-xs font-medium text-slate-500 italic">
                                    Evolución histórica detallada del paciente {patient.name}.
                                </DialogDescription>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setShowChartsDialog(false)}
                                className="rounded-xl hover:bg-white/10 text-slate-500 hover:text-white"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </DialogHeader>
                    <div className="flex-1 overflow-y-auto p-8 no-scrollbar">
                        {chartProps ? (
                            <div className="space-y-8">
                                <PatientHistoryCharts {...chartProps} />
                                <div className="mt-8 bg-[#151F32] p-8 rounded-[3rem] border border-white/5 shadow-2xl">
                                    <h3 className="text-xl font-black text-white tracking-tight uppercase mb-6 flex items-center gap-3">
                                        <Camera className="h-5 w-5 text-nutri-brand" /> Seguimiento Fotográfico
                                    </h3>
                                    <PhotoHistoryCarousel photoHistory={photoHistory} />
                                </div>
                            </div>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-600 gap-4">
                                <History className="h-12 w-12 opacity-20" />
                                <span className="text-xs font-black uppercase tracking-widest opacity-40">Sin datos de mediciones</span>
                            </div>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
            {/* Modal Editar Consulta */}
            <EditConsultationModal
                isOpen={isAddingMode && editingId !== 'new' && editingId !== null}
                onClose={() => { setIsAddingMode(false); setEditingId(null); }}
                patientId={patientId}
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
