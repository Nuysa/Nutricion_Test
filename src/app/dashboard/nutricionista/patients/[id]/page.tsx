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
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";

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
    const [pendingAppointments, setPendingAppointments] = useState<any[]>([]);
    const [selectedAppointmentId, setSelectedAppointmentId] = useState<string>("");
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

            const getVId = (codes: string[], header?: string) => {
                const canonicalMap: Record<string, string[]> = {
                    "CINTURA MIN.": ["CINTURA_MINIMA", "CINTURA_MIN", "MIN_CINTURA", "CINT_MINIMA", "CINT_MIN"],
                    "CINTURA MAX.": ["CINTURA_MAXIMA", "CINTURA_MAX", "MAX_CINTURA", "CINT_MAXIMA", "CINT_MAX"],
                    "CADERA MAX.": ["CADERA_MAXIMA", "CADERA_MAX", "MAX_CADERA"],
                    "MUSLO MAX.": ["MUSLO_MAXIMO", "MUSLO_MAX", "MAX_MUSLO"],
                    "MUSLO MED.": ["MUSLO_MEDIAL", "P_MUSLO_MEDIAL", "MUSLO_MED"],
                    "PANTORRILLA": ["PANTORRILLA", "P_PANTORRILLA"]
                };

                const searchCodes = header && canonicalMap[header.toUpperCase()] 
                    ? Array.from(new Set([...codes, ...canonicalMap[header.toUpperCase()]]))
                    : codes;

                for (const c of searchCodes) {
                    const match = vars.find((v: any) => v.code?.toUpperCase() === c.toUpperCase() || v.name?.toLowerCase().includes(c.toLowerCase()));
                    if (match) return match.id;
                }
                return null;
            };

            if (formLayoutData?.columns && formLayoutData.columns.length > 10) {
                setFormLayout(formLayoutData.columns);
            } else {
                setFormLayout([
                    { id: 'f1', header: "Registro", fixed_variable: "date", variable_id: null, section: 'base' },
                    { id: 'f2', header: "Peso Actual", fixed_variable: "weight", variable_id: null, section: 'base' },
                    { id: 'f3', header: "IMC", fixed_variable: "bmi", variable_id: null, section: 'base' },

                    { id: 'f4', header: "B. Relajado", variable_id: getVId(['BRAZO_RELAJADO'], "B. Relajado"), section: 'perimeters' },
                    { id: 'f5', header: "B. Flexionado", variable_id: getVId(['BRAZO_FLEXIONADO'], "B. Flexionado"), section: 'perimeters' },
                    { id: 'f6', header: "Antebrazo", variable_id: getVId(['ANTEBRAZO_MAXIMO', 'ANTEBRAZO'], "Antebrazo"), section: 'perimeters' },
                    { id: 'f7', header: "Tórax", variable_id: getVId(['TORAX'], "Tórax"), section: 'perimeters' },
                    { id: 'f8', header: "Cintura Min.", variable_id: getVId(['CINTURA_MINIMA'], "Cintura Min."), section: 'perimeters' },
                    { id: 'f9', header: "Cintura Max.", variable_id: getVId(['CINTURA_MAXIMA'], "Cintura Max."), section: 'perimeters' },
                    { id: 'f10', header: "Cadera Max.", variable_id: getVId(['CADERA_MAXIMA'], "Cadera Max."), section: 'perimeters' },
                    { id: 'f11', header: "Muslo Max.", variable_id: getVId(['MUSLO_MAXIMO'], "Muslo Max."), section: 'perimeters' },

                    { id: 'f12', header: "Tríceps", variable_id: getVId(['P_TRICEPS', 'TRICEPS'], "Tríceps"), section: 'folds' },
                    { id: 'f13', header: "Subescapular", variable_id: getVId(['P_SUBESCAPULAR', 'SUBESCAPULAR'], "Subescapular"), section: 'folds' },
                    { id: 'f14', header: "Supraespinal", variable_id: getVId(['P_SUPRAESPINAL', 'SUPRAESPINAL'], "Supraespinal"), section: 'folds' },
                    { id: 'f15', header: "Abdominal", variable_id: getVId(['P_ABDOMINAL', 'ABDOMINAL'], "Abdominal"), section: 'folds' },
                    { id: 'f16', header: "Muslo Med.", variable_id: getVId(['P_MUSLO_MEDIAL', 'MUSLO_MEDIAL'], "Muslo Med."), section: 'folds' },
                    { id: 'f17', header: "Pantorrilla", variable_id: getVId(['P_PANTORRILLA', 'PANTORRILLA'], "Pantorrilla"), section: 'folds' },
                    { id: 'f18', header: "C. Ilíaca", variable_id: getVId(['CRESTA_ILIACA', 'C_ILIACA'], "C. Ilíaca"), section: 'folds' },
                    { id: 'f19', header: "Bíceps", variable_id: getVId(['BICEPS'], "Bíceps"), section: 'folds' },

                    { id: 'f20', header: "Principales Hallazgos", variable_id: getVId(['PRINCIPALES_HALLAZGOS', 'HALLAZGOS'], "Principales Hallazgos"), section: 'findings' },
                    { id: 'f21', header: "Recomendación", variable_id: getVId(['RECOMENDACION_NUTRICIONAL', 'RECOMENDACION', 'RECOM'], "Recomendación"), section: 'recommendations' },
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
                .select("*, appointments(appointment_date, start_time, modality)")
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
                    return ex.photo_front_url || ex.PHOTO_FRONT_URL || 
                           ex.photo_side1_url || ex.PHOTO_SIDE1_URL || 
                           ex.photo_side2_url || ex.PHOTO_SIDE2_URL || 
                           ex.photo_back_url || ex.PHOTO_BACK_URL;
                })
                .map((r: any) => {
                    const ex = getExtra(r);
                    return {
                        date: r.date,
                        photos: {
                            1: ex.PHOTO_FRONT_URL || ex.photo_front_url || null,
                            2: ex.PHOTO_SIDE1_URL || ex.photo_side1_url || null,
                            3: ex.PHOTO_SIDE2_URL || ex.photo_side2_url || null,
                            4: ex.PHOTO_BACK_URL || ex.photo_back_url || null
                        }
                    };
                });

            // Consolidación Robusta de Fotos (1:1 con mediciones)
            const photoMap = new Map();

            // 1. Cargar fotos del Historial Clínico (Perfil) - Base inicial
            (mappedHistory || []).forEach(h => {
                const dateKey = h.date.split('T')[0];
                photoMap.set(dateKey, { ...h.photos });
            });

            // 2. Cargar fotos de las Mediciones (Overwrite o Merge)
            (mappedRecords || []).forEach(r => {
                const dateKey = r.date.split('T')[0];
                const existing = photoMap.get(dateKey) || {};
                // Combinamos priorizando las fotos de la medición (que son más específicas)
                photoMap.set(dateKey, {
                    1: r.photos[1] || existing[1] || null,
                    2: r.photos[2] || existing[2] || null,
                    3: r.photos[3] || existing[3] || null,
                    4: r.photos[4] || existing[4] || null
                });
            });

            // 3. Crear el historial final basado en las mediciones
            // Si el paciente tiene mediciones, cada medición DEBE tener su grupo de fotos (fusionado con perfil)
            const finalHistory = (hData || [])
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map(record => {
                    const dateKey = record.date.split('T')[0];
                    return {
                        date: record.date,
                        photos: photoMap.get(dateKey) || { 1: null, 2: null, 3: null, 4: null }
                    };
                });

            // Fallback: si no hay mediciones pero hay fotos de perfil, mostrar el perfil
            const resultHistory = (finalHistory.length === 0 && mappedHistory.length > 0) 
                ? mappedHistory 
                : finalHistory;

            setPhotoHistory([...resultHistory].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));

            // Fetch appointments
            const { data: allApts } = await supabase
                .from("appointments")
                .select("*")
                .eq("patient_id", patientId)
                .order("appointment_date", { ascending: false });

            const todayD = new Date();
            const yyyy = todayD.getFullYear();
            const mm = String(todayD.getMonth() + 1).padStart(2, '0');
            const dd = String(todayD.getDate()).padStart(2, '0');
            const todayStr = `${yyyy}-${mm}-${dd}`;

            const linkedAptIds = new Set((hData || []).map(r => r.appointment_id).filter(id => !!id));
            
            // Todas las citas marcadas con su estado de vinculación
            const appointmentOptions = (allApts || []).map(a => ({
                ...a,
                isLinked: linkedAptIds.has(a.id)
            }));

            const availableApts = appointmentOptions.filter(a => 
                !a.isLinked && 
                a.status !== 'cancelada' && 
                a.status !== 'canceled' &&
                a.status !== 'cancelado'
            );

            const activeToday = availableApts.find(a => a.appointment_date === todayStr);
            
            setPendingAppointments(appointmentOptions); // Pasamos todas ahora
            setTodayAppointment(activeToday || null);
            if (activeToday) setSelectedAppointmentId(activeToday.id);

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
                rowData._rawSource = r; // Guardamos el original para edición
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
                if (val === undefined || val === null || val === '') return 0;
                const str = String(val).trim().replace(',', '.');
                if (str === '') return 0;
                const n = parseFloat(str);
                return isNaN(n) ? 0 : n;
            };

            const finalExtraData: Record<string, any> = {};
            const nativeExcludes = ["peso", "grasa", "cintura", "talla", "talla_cm", "edad", "imc"];
            const nativeFromExtra: Record<string, number> = {};
            
            // 1. Procesar campos basados en el Layout del Formulario (esto asegura que lo que ve el usuario se guarde)
            formLayout.forEach(item => {
                if (item.fixed_variable) return; // Se manejan después como campos nativos

                let code = "";
                let isText = false;

                if (item.variable_id) {
                    const v = clinicalVariables.find(cv => cv.id === item.variable_id);
                    if (v) {
                        code = v.code.toUpperCase();
                        isText = (v as any).data_type === 'text';
                    }
                }

                // Fallback vinculando a códigos canónicos conocidos por el dashboard de seguimiento
                if (!code) {
                    const canonicalMap: Record<string, string> = {
                        "Cintura Min.": "CINTURA_MINIMA",
                        "Cintura Max.": "CINTURA_MAXIMA",
                        "Cadera Max.": "CADERA_MAXIMA",
                        "Muslo Max.": "MUSLO_MAXIMO",
                        "Muslo Med.": "MUSLO_MEDIAL"
                    };
                    code = (canonicalMap[item.header] || item.header.toUpperCase().replace(/\./g, '').replace(/\s+/g, '_')).toUpperCase();
                }

                if (code) {
                    const rawValue = extraData[code];
                    const lowerCode = code.toLowerCase();
                    
                    // Si es un campo nativo o CINTURA_MINIMA, lo rescatamos para las columnas principales (para que aparezca en el card de CINTURA)
                    if (lowerCode === 'cintura' || lowerCode === 'cintura_minima') nativeFromExtra.waist_circumference_cm = parseNum(rawValue);
                    if (lowerCode === 'peso') nativeFromExtra.weight = parseNum(rawValue);
                    if (lowerCode === 'grasa') nativeFromExtra.body_fat_percentage = parseNum(rawValue);

                    if (!nativeExcludes.includes(lowerCode)) {
                        if (isText) {
                            finalExtraData[code] = rawValue || "";
                        } else {
                            finalExtraData[code] = parseNum(rawValue);
                        }
                    }
                }
            });

            // 2. Mantener campos que ya existían en extra_data...
            Object.keys(extraData).forEach(k => {
                const upperK = k.toUpperCase();
                if (!finalExtraData[upperK] && !nativeExcludes.includes(upperK.toLowerCase())) {
                    finalExtraData[upperK] = extraData[k];
                }
            });

            const rowData: any = {
                patient_id: patientId,
                date: editValues.date || new Date().toISOString().split('T')[0],
                weight: nativeFromExtra.weight || parseNum(editValues.weight),
                body_fat_percentage: nativeFromExtra.body_fat_percentage || parseNum(editValues.body_fat_percentage),
                waist_circumference_cm: nativeFromExtra.waist_circumference_cm || parseNum(editValues.waist_circumference_cm),
                clinical_findings: editValues.clinical_findings || "",
                nutritional_recommendations: editValues.nutritional_recommendations || "",
                appointment_id: selectedAppointmentId || null,
                extra_data: finalExtraData
            };

            const isNew = editingId === "new" || !editingId;

            const { error } = isNew
                ? await supabase.from("weight_records").insert([rowData])
                : await supabase.from("weight_records").update(rowData).eq("id", editingId);

            if (error) throw error;
            
            if (isNew && selectedAppointmentId) {
                await supabase.from("appointments").update({ status: 'completada' }).eq("id", selectedAppointmentId);
                setSelectedAppointmentId("");
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
        const h = latest?._computedInputs?.['TALLA'] || latest?._computedInputs?.['TALLA_CM'] || patient?.rawHeight || null;
        const w = latest?._computedInputs?.['PESO'] || latest?.weight || patient?.rawWeight || null;

        let imcVal = "—";
        let imcLabel = "Sin datos";
        let imcColor = "bg-white/20";
        if (h && w) {
            const n = (w / ((h / 100) * (h / 100)));
            imcVal = n.toFixed(1);
            imcLabel = getIMCCategory(imcVal);
            if (imcLabel === 'Sobrepeso') imcColor = 'bg-orange-500/40 text-white';
            else if (imcLabel.includes('Obesidad')) imcColor = 'bg-red-500/40 text-white';
            else if (imcLabel === 'Saludable') imcColor = 'bg-green-500/40 text-white';
        }

        const varDiagGrasa = clinicalVariables.find((v: any) => (v.name?.toUpperCase().includes('SUMA DE PLIEGUES') || v.code?.toUpperCase().includes('SUMA_PLIEGUES')) && (v.has_ranges || v.hasRanges));
        const varDiagMusculo = clinicalVariables.find((v: any) => v.name?.toUpperCase().includes('MUSCULO LEE') && (v.has_ranges || v.hasRanges));
        const varDiagCintura = clinicalVariables.find((v: any) => v.name?.toUpperCase().includes('CINTURA') && (v.has_ranges || v.hasRanges));

        const getDiag = (v: any) => {
            if (!v || !latest?._computedInputs) return { label: "—", color: "bg-white/10" };
            const calc = calculate(v, { gender: patient?.gender, age: patient?.age, inputs: latest._computedInputs });
            return {
                label: calc.range?.label || "Normal",
                color: calc.range?.color ? `bg-${calc.range.color}-500/20 text-${calc.range.color}-500` : "bg-white/10 text-slate-400"
            };
        };

        const fatDiag = getDiag(varDiagGrasa);
        const musDiag = getDiag(varDiagMusculo);
        const cinDiag = getDiag(varDiagCintura);

        return {
            weight: w != null ? `${w} kg` : "—",
            height: h != null ? `${h} cm` : "—",
            fat: {
                value: (latest?._computedInputs?.['GRASA_CORPORAL'] || latest?.body_fat_percentage || 0).toString(),
                diag: fatDiag.label,
                color: fatDiag.color
            },
            muscle: {
                value: (latest?._computedInputs?.['MASA_MUSCULAR_LEE'] || 0).toString(),
                diag: musDiag.label,
                color: musDiag.color
            },
            waist: {
                value: (latest?._computedInputs?.['CINTURA_MINIMA'] || latest?.waist_circumference_cm || latest?._computedInputs?.['CINTURA'] || 0).toString(),
                diag: cinDiag.label,
                color: cinDiag.color
            },
            imc: {
                value: imcVal,
                label: imcLabel,
                color: imcColor
            },
            lastVisit: latest ? new Date(latest.date + 'T12:00:00').toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }) : "Sin mediciones"
        };
    }, [records, patient, clinicalVariables, calculate]);

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
        <div className="space-y-4 sm:space-y-6 max-w-[98%] sm:max-w-[95%] mx-auto pb-20">
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

                <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <Button variant="outline" className="rounded-xl font-black text-xs h-12 border-white/10 bg-white/5 text-white hover:bg-white/10 shadow-lg w-full sm:w-auto" onClick={() => setShowBioDialog(true)}>
                        <Edit2 className="h-4 w-4 mr-2 text-nutri-brand" /> Editar Ficha
                    </Button>
                    <div className="w-full sm:w-auto">
                        <TooltipProvider>
                            <Tooltip delayDuration={0}>
                                <TooltipTrigger asChild>
                                    <div className="w-full sm:w-auto">
                                        <Button
                                            disabled={patient.subscription === "No Plan" || !patient.subscription || patient.subscription.toLowerCase().includes("sin plan") || !todayAppointment}
                                            className="rounded-xl bg-nutri-brand font-black text-xs text-white shadow-xl h-12 px-6 w-full hover:scale-105 transition-all shadow-nutri-brand/20 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
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
                                </TooltipTrigger>
                                {(patient.subscription === "No Plan" || !patient.subscription || patient.subscription.toLowerCase().includes("sin plan") || !todayAppointment) && (
                                    <TooltipContent className="bg-[#151F32] border-white/10 text-white p-4 rounded-2xl shadow-2xl max-w-xs transition-all animate-in fade-in zoom-in-95" side="top">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-center leading-relaxed">
                                            {!todayAppointment 
                                                ? "Primero debes agendar una cita para hoy para poder ingresar una nueva consulta."
                                                : "El paciente requiere un plan activo para registrar nuevas consultas."}
                                        </p>
                                    </TooltipContent>
                                )}
                            </Tooltip>
                        </TooltipProvider>
                    </div>
                </div>
            </div>

            {/* Métricas Destacadas */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <Card className={cn("border-0 text-white shadow-2xl overflow-hidden relative rounded-3xl sm:rounded-[2rem]", parseFloat(stats.imc.value) < 25 ? "bg-gradient-to-br from-nutri-brand to-emerald-600" : "bg-gradient-to-br from-orange-500 to-red-600")}>
                    <div className="absolute top-0 right-10 w-20 h-20 bg-white/10 blur-[50px] rounded-full -mr-10 -mt-10" />
                    <CardContent className="p-4 sm:p-7 relative z-10 h-full flex flex-col justify-between">
                        <div className="text-[8px] sm:text-[10px] font-black uppercase opacity-80 mb-1 sm:mb-2 tracking-widest">IMC Actual</div>
                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                            <span className="text-3xl sm:text-5xl font-black tracking-tighter text-white">{stats.imc.value}</span>
                            <Badge variant="secondary" className={cn("text-[7px] sm:text-[9px] border-0 font-black uppercase px-2 w-fit", stats.imc.color)}>{stats.imc.label}</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-[#1A253A]/60 backdrop-blur-xl shadow-2xl border-white/5 rounded-3xl sm:rounded-[2rem] overflow-hidden relative group">
                    <div className="absolute top-0 right-10 w-20 h-20 bg-orange-500/5 blur-3xl group-hover:bg-orange-500/10 transition-all opacity-0 group-hover:opacity-100" />
                    <CardContent className="p-4 sm:p-7 h-full flex flex-col justify-between">
                        <div className="text-[8px] sm:text-[10px] font-black uppercase text-orange-500 mb-1 sm:mb-2 tracking-widest">% Grasa</div>
                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                             <span className="text-2xl sm:text-4xl font-black text-white tracking-tighter">{stats.fat.value}%</span>
                             <Badge variant="secondary" className={cn("text-[7px] sm:text-[9px] border-0 font-black uppercase px-2 w-fit", stats.fat.color)}>{stats.fat.diag}</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-[#1A253A]/60 backdrop-blur-xl shadow-2xl border-white/5 rounded-3xl sm:rounded-[2rem] overflow-hidden relative group">
                    <div className="absolute top-0 right-10 w-20 h-20 bg-emerald-500/5 blur-3xl group-hover:bg-emerald-500/10 transition-all opacity-0 group-hover:opacity-100" />
                    <CardContent className="p-4 sm:p-7 h-full flex flex-col justify-between">
                        <div className="text-[8px] sm:text-[10px] font-black uppercase text-emerald-500 mb-1 sm:mb-2 tracking-widest">% Músculo</div>
                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                             <span className="text-2xl sm:text-4xl font-black text-white tracking-tighter">{stats.muscle.value}%</span>
                             <Badge variant="secondary" className={cn("text-[7px] sm:text-[9px] border-0 font-black uppercase px-2 w-fit", stats.muscle.color)}>{stats.muscle.diag}</Badge>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-[#1A253A]/60 backdrop-blur-xl shadow-2xl border-white/5 rounded-3xl sm:rounded-[2rem] overflow-hidden relative group">
                    <div className="absolute top-0 right-10 w-20 h-20 bg-indigo-500/5 blur-3xl group-hover:bg-indigo-500/10 transition-all opacity-0 group-hover:opacity-100" />
                    <CardContent className="p-4 sm:p-7 h-full flex flex-col justify-between">
                        <div className="text-[8px] sm:text-[10px] font-black uppercase text-indigo-500 mb-1 sm:mb-2 tracking-widest">Cintura</div>
                        <div className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-2">
                            <span className="text-2xl sm:text-4xl font-black text-white tracking-tighter">{stats.waist.value} cm</span>
                            <Badge variant="secondary" className={cn("text-[7px] sm:text-[9px] border-0 font-black uppercase px-2 w-fit", stats.waist.color)}>{stats.waist.diag}</Badge>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Tabs defaultValue="historial" className="w-full">
                <TabsList className="bg-[#1A253A]/80 p-1 sm:p-1.5 rounded-2xl mb-8 border border-white/5 flex flex-col sm:flex-row h-auto w-full sm:w-fit backdrop-blur-xl shadow-2xl gap-2 sm:gap-0">
                    <TabsTrigger
                        value="historial"
                        className="font-black text-[9px] sm:text-[10px] uppercase px-4 sm:px-8 py-3 flex items-center justify-center gap-2 rounded-xl data-[state=active]:bg-nutri-brand data-[state=active]:text-white text-slate-400 tracking-widest transition-all duration-300 data-[state=active]:shadow-[0_0_20px_rgba(255,102,0,0.3)] border border-transparent data-[state=active]:border-white/10 w-full sm:w-auto"
                    >
                        <ClipboardList className="h-4 w-4" /> Historial de Consultas
                    </TabsTrigger>
                    <Button
                        onClick={() => setShowChartsDialog(true)}
                        variant="ghost"
                        className="h-10 sm:h-auto px-4 py-3 rounded-xl border border-white/5 bg-white/5 text-[9px] sm:text-[10px] font-black uppercase text-slate-400 hover:text-nutri-brand transition-all tracking-widest w-full sm:w-auto sm:ml-4"
                    >
                        <History className="h-3.5 w-3.5 mr-2" /> Ver Registro
                    </Button>
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
                            pendingAppointments={pendingAppointments}
                            selectedAppointmentId={selectedAppointmentId}
                            setSelectedAppointmentId={setSelectedAppointmentId}
                        />
                    )}
                    <Card className="rounded-3xl sm:rounded-[3rem] shadow-[0_20px_50px_rgba(0,0,0,0.3)] border border-white/5 overflow-hidden bg-[#1A253A]/60 backdrop-blur-xl">
                        <div className="overflow-x-auto">
                            <table className="w-full text-left">
                                <thead className="bg-white/5 text-[10px] font-black uppercase text-slate-500 border-b border-white/5">
                                    <tr>
                                        <th className="px-3 sm:px-8 py-4 sm:py-7 tracking-widest text-center w-10 sm:w-12 text-[#8F9BB3]">Nº</th>
                                        <th className="px-3 sm:px-8 py-4 sm:py-7 tracking-widest text-center text-[#8F9BB3]">Registro</th>
                                        {layout.slice(1, 4).map((col, idx) => (
                                            <th key={idx} className="px-3 sm:px-8 py-4 sm:py-7 tracking-widest text-center text-[#8F9BB3]">
                                                {col.header}
                                            </th>
                                        ))}
                                        <th className="px-3 sm:px-8 py-4 sm:py-7 tracking-widest text-center text-[#8F9BB3]">Cita</th>
                                        <th className="px-3 sm:px-8 py-4 sm:py-7 tracking-widest text-center text-[#8F9BB3]">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {records.map((record, index) => (
                                        <tr
                                            key={record.id}
                                            className="group hover:bg-white/5 transition-all cursor-pointer"
                                            onClick={() => {
                                                setEditingId(record.id);
                                                setIsAddingMode(true);
                                                // Usamos _rawSource para tener los datos originales (incluyendo la fecha en formato ISO)
                                                setEditValues(record._rawSource);
                                                
                                                const normalized: Record<string, any> = {};
                                                if (record._rawSource.extra_data) {
                                                    Object.keys(record._rawSource.extra_data).forEach(k => {
                                                        normalized[k.toUpperCase()] = record._rawSource.extra_data[k];
                                                    });
                                                }
 
                                                // Inyectar campos nativos
                                                if (record._rawSource.waist_circumference_cm && !normalized['CINTURA_MINIMA']) normalized['CINTURA_MINIMA'] = record._rawSource.waist_circumference_cm;
                                                if (record._rawSource.waist_circumference_cm && !normalized['CINTURA']) normalized['CINTURA'] = record._rawSource.waist_circumference_cm;
                                                if (record._rawSource.weight) {
                                                    normalized['PESO'] = record._rawSource.weight;
                                                }
                                                if (record._rawSource.body_fat_percentage) normalized['GRASA'] = record._rawSource.body_fat_percentage;
 
                                                setExtraData(normalized);
                                            }}
                                        >
                                            <td className="px-3 sm:px-8 py-5 text-center font-bold text-slate-400">
                                                {records.length - index}
                                            </td>
                                            {layout.slice(0, 4).map((col, cIdx) => {
                                                let value: any = "—";
                                                let color: string | undefined = undefined;

                                                if (col.fixed_variable === 'weight') value = record.weight;
                                                else if (col.fixed_variable === 'bmi') {
                                                     const h = patient?.rawHeight || 100;
                                                     value = record.weight ? (parseFloat(record.weight) / ((h / 100) * (h / 100))).toFixed(1) : "—";
                                                }
                                                else if (col.fixed_variable === 'date') {
                                                     value = new Date(record._rawSource.date + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
                                                }
                                                else if (col.variable_id || col.fixed_variable) {
                                                    const key = `col_${col.variable_id || col.fixed_variable}`;
                                                    const colorKey = `color_${col.variable_id || col.fixed_variable}`;
                                                    if (record[key] !== undefined) {
                                                        value = record[key];
                                                        color = record[colorKey];
                                                    } else if (col.variable_id) {
                                                        const v = clinicalVariables.find(cv => cv.id === col.variable_id);
                                                        if (v && record.extra_data) {
                                                            value = record.extra_data[v.code] ?? record.extra_data[v.code.toUpperCase()] ?? "—";
                                                        }
                                                    }
                                                }

                                                return (
                                                    <td key={cIdx} className="px-3 sm:px-8 py-5 text-center">
                                                        <span className={cn("text-sm font-black", color ? "" : "text-white")} style={color ? { color } : {}}>{value}</span>
                                                    </td>
                                                );
                                            })}
                                            <td className="px-3 sm:px-8 py-5 text-center font-bold text-white italic">
                                                {record.appointments?.appointment_date 
                                                    ? new Date(record.appointments.appointment_date + 'T12:00:00').toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })
                                                    : "—"}
                                            </td>
                                            <td className="px-3 sm:px-8 py-5 text-center">
                                                <div className="flex justify-center gap-2">
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white">
                                                        <Edit2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                </TabsContent>
            </Tabs>

            {showHistoryDialog && (
                <MedicalHistoryModal
                    isOpen={showHistoryDialog}
                    onClose={() => setShowHistoryDialog(false)}
                    patientId={patientId}
                    patientName={patient.name}
                />
            )}

            {/* Modal Ficha Biográfica */}
            <Dialog open={showBioDialog} onOpenChange={setShowBioDialog}>
                <DialogContent className="rounded-3xl sm:rounded-[3rem] p-0 w-[95vw] max-w-md border-white/10 shadow-2xl bg-[#151F32] text-white overflow-hidden">
                    <div className="absolute top-0 right-10 w-32 h-32 bg-nutri-brand/10 blur-[60px] rounded-full" />

                    <div className="p-6 sm:p-8 lg:p-10 space-y-6 sm:space-y-8">
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

                        <DialogFooter className="flex flex-col sm:flex-row gap-3 pt-6 border-t border-white/5">
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
                <DialogContent className="w-[95vw] max-w-7xl h-[95vh] sm:h-[85vh] p-0 rounded-3xl sm:rounded-[3rem] border-white/10 shadow-2xl bg-[#0B1120] overflow-hidden flex flex-col">
                    <DialogHeader className="p-8 pb-4 border-b border-white/5 shrink-0 relative">
                        <div className="flex justify-between items-start">
                            <div>
                                <DialogTitle className="text-xl sm:text-2xl font-black text-white tracking-tight uppercase flex items-center gap-3">
                                    <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-nutri-brand" /> Registro de <span className="text-nutri-brand">Mediciones</span>
                                </DialogTitle>
                                <DialogDescription className="text-[10px] sm:text-xs font-medium text-slate-500 italic">
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
                    <div className="flex-1 overflow-y-auto p-4 sm:p-8 no-scrollbar">
                        {chartProps ? (
                            <div className="space-y-8">
                                <PatientHistoryCharts {...chartProps} />
                                <div className="mt-8 bg-[#151F32] p-4 sm:p-8 rounded-3xl sm:rounded-[3rem] border border-white/5 shadow-2xl">
                                    <h3 className="text-lg sm:text-xl font-black text-white tracking-tight uppercase mb-6 flex items-center gap-3">
                                        <Camera className="h-4 w-4 sm:h-5 sm:w-5 text-nutri-brand" /> Seguimiento Fotográfico
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
                date={editValues?.date || ''}
                setDate={(d: string) => setEditValues({ ...(editValues || {}), date: d })}
                editValues={editValues || {}}
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
                pendingAppointments={pendingAppointments}
                selectedAppointmentId={editValues.appointment_id || ""}
                setSelectedAppointmentId={(id: string) => setEditValues({ ...editValues, appointment_id: id })}
            />
        </div>
    );
}
