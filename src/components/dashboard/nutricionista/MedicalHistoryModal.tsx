"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from "@/lib/supabase/client";
import { X, ClipboardList, Sparkles, ShieldCheck, Edit, Save, RotateCcw, Upload } from "lucide-react";
import * as XLSX from 'xlsx';
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface MedicalHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: string;
    patientName: string;
}

export function MedicalHistoryModal({ isOpen, onClose, patientId, patientName }: MedicalHistoryModalProps) {
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [historyData, setHistoryData] = useState<any>(null);
    const [editedData, setEditedData] = useState<any>(null);
    const { toast } = useToast();
    const supabase = createClient();

    useEffect(() => {
        if (isOpen && patientId) {
            fetchHistory();
        }
    }, [isOpen, patientId]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("patient_medical_histories")
                .select("*")
                .eq("patient_id", patientId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            setHistoryData(data);
            setEditedData(data);
        } catch (err) {
            console.error("Error fetching medical history:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const cleanBoolean = (val: any) => {
                if (val === null || val === undefined || val === '') return null;
                if (typeof val === 'boolean') return val;
                const s = String(val).toLowerCase().trim();
                // 'yes_pro', 'yes_non_pro', 'true', 'si', etc.
                if (s === 'true' || s === 'si' || s === 'sí' || s === 'yes' || s.startsWith('yes')) return true;
                // 'false', 'no', 'never', 'nunca'
                if (s === 'false' || s === 'no' || s === 'never' || s === 'nunca') return false;
                return val; // fallback for non-booleans
            };

            const dataToSave = { ...editedData };

            // Explicitly cast boolean fields
            const boolFields = [
                'previous_nutrition_service',
                'takes_medication',
                'recent_lab_tests',
                'does_exercise',
                'has_calorie_tracker',
                'likes_cooking',
                'food_intolerances',
                'supplements_consumption'
            ];

            boolFields.forEach(field => {
                if (dataToSave[field] !== undefined) {
                    dataToSave[field] = cleanBoolean(dataToSave[field]);
                }
            });

            // Join array fields that are stored as text in DB
            const textArrayFields = ['disliked_cereals', 'disliked_tubers', 'disliked_legumes', 'disliked_meats', 'disliked_fats'];
            textArrayFields.forEach(field => {
                if (Array.isArray(dataToSave[field])) {
                    dataToSave[field] = dataToSave[field].join(', ');
                }
            });

            // Filter out fields that don't exist in the DB schema to avoid errors
            const {
                front_photo_url,
                side_photo_1_url,
                side_photo_2_url,
                back_photo_url,
                dairy_photos,
                supplement_photos,
                ...persistenceData
            } = dataToSave;

            const { error } = await supabase
                .from("patient_medical_histories")
                .upsert({
                    ...persistenceData,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'patient_id' });

            if (error) throw error;

            setHistoryData(editedData);
            setIsEditing(false);
            toast({
                title: "Historia Clínica Actualizada",
                description: "Los cambios han sido guardados correctamente.",
            });
            new BroadcastChannel('nutrigo_global_sync').postMessage('sync');
        } catch (err: any) {
            toast({
                title: "Error al guardar",
                description: err.message,
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
        }
    };

    const formatList = (val: any) => {
        if (!val) return 'Ninguno';
        if (Array.isArray(val)) return val.length > 0 ? val.join(', ') : 'Ninguno';
        return val;
    };

    const getYesNo = (val: string | boolean) => {
        if (val === 'yes' || val === true) return 'Sí';
        if (val === 'no' || val === false) return 'No';
        return val || 'No registrado';
    };

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'No registrado';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            const d = String(date.getDate()).padStart(2, '0');
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const y = date.getFullYear();
            return `${d}/${m}/${y}`;
        } catch (e) {
            return dateStr;
        }
    };

    const calculateAge = (birthday: any) => {
        if (!birthday) return '';
        const birthDate = new Date(birthday);
        if (isNaN(birthDate.getTime())) return '';
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    const toISODate = (val: any) => {
        if (!val) return '';
        try {
            const date = (val instanceof Date) ? val : new Date(val);
            if (isNaN(date.getTime())) return '';
            const y = date.getFullYear();
            const m = String(date.getMonth() + 1).padStart(2, '0');
            const d = String(date.getDate()).padStart(2, '0');
            return `${y}-${m}-${d}`;
        } catch (e) {
            return '';
        }
    };

    const parseExcelDate = (val: any) => {
        if (!val) return null;
        if (val instanceof Date) return val;
        if (typeof val === 'number') {
            return new Date(Math.round((val - 25569) * 864e5));
        }
        if (typeof val === 'string') {
            const clean = val.trim();
            const dateParts = clean.split(' ')[0].split('/');
            if (dateParts.length === 3) {
                const [d, m, y] = dateParts.map(Number);
                if (y > 1000) return new Date(y, m - 1, d);
            }
            const date = new Date(val);
            if (!isNaN(date.getTime())) return date;
        }
        return val;
    };

    const parseExcelTime = (val: any) => {
        if (!val) return '';
        if (val instanceof Date) {
            const h = String(val.getHours()).padStart(2, '0');
            const m = String(val.getMinutes()).padStart(2, '0');
            return `${h}:${m}`;
        }
        if (typeof val === 'string') {
            const clean = val.toLowerCase().replace(/\./g, '').replace(/\s+/g, ' ').trim();
            const match = clean.match(/(\d{1,2}):(\d{2}).*(am|pm|a\s?m|p\s?m)/);
            if (match) {
                let hours = parseInt(match[1], 10);
                const minutes = match[2];
                const modifier = match[3];
                if (modifier.includes('p') && hours < 12) hours += 12;
                if (modifier.includes('a') && hours === 12) hours = 0;
                return `${String(hours).padStart(2, '0')}:${minutes}`;
            }
            const simpleMatch = clean.match(/^(\d{1,2}):(\d{2})/);
            if (simpleMatch) return `${simpleMatch[1].padStart(2, '0')}:${simpleMatch[2]}`;
        }
        return val;
    };

    const updateField = (field: string, value: any) => {
        setEditedData((prev: any) => {
            const next = { ...prev, [field]: value };
            if (field === 'birth_date') {
                next.age = calculateAge(value);
            }
            return next;
        });
    };

    const handleExcelUpload = async (file: File) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' }) as any[];

                if (jsonData.length === 0) {
                    toast({ title: "Archivo vacío", description: "El Excel no contiene datos.", variant: "destructive" });
                    return;
                }

                const row = jsonData[0];
                const mapping: Record<string, string> = {
                    "Fecha": "created_at",
                    "Nombres y Apellidos completos": "full_name",
                    "Número de DNI o Carnet de Extranjería": "dni",
                    "¿Cuál es tu correo electrónico?": "email",
                    "Edad": "age",
                    "Fecha de nacimiento": "birth_date",
                    "Sexo": "gender",
                    "Género": "gender",
                    "¿Cuál es tu Instagram?": "instagram",
                    "Grado de instrucción": "education_level",
                    "¿En qué región o estado radicas?": "region",
                    "¿En qué distrito vives?": "district",
                    "¿A qué te dedicas?": "occupation",
                    "Ocupación": "job_details",
                    "¿Cuál es tu objetivo nutricional?": "nutritional_goal",
                    "¿Te has atendido en algún servicio de nutrición?": "previous_nutrition_service",
                    "Si tu respuesta fue SÍ, ¿Cómo calificarías esa experiencia?": "previous_experience_rating",
                    "Por cuánto tiempo has estado siguiendo el plan de alimentación de tu nutricionista (cuenta el tiempo desde que lo iniciaste hasta la actualidad)": "time_following_plan",
                    "Peso (Kg)": "weight_kg",
                    "Talla (cm)": "height_cm",
                    "  Cintura (cm)\n": "waist_cm",
                    "¿Presentas algunas de las siguientes condiciones de salud? Puedes seleccionar varias alternativas.": "health_conditions",
                    "¿Tienes antecedentes familiares de alguna enfermedad? Puedes seleccionar varias alternativas.": "family_history",
                    "¿Consumes algún medicamento?": "takes_medication",
                    "¿Qué tipo de medicamento consumes?": "medication_details",
                    "¿Con qué frecuencia consumes el medicamento y en qué horarios?": "medication_frequency",
                    "¿Te haz realizado algún examen de laboratorio estos últimos 3 meses?": "recent_lab_tests",
                    "¿Cómo es tu actividad diaria?": "activity_level",
                    "¿Cuál es tu horario de trabajo? Especificar días y horas": "work_schedule",
                    "Actualmente ¿Estás realizando ejercicio?": "does_exercise",
                    "¿Desde hace cuánto tiempo realizas ejercicio?": "exercise_duration",
                    "¿Qué ejercicios realizas? Puedes marcar más de 1 alternativa.": "exercise_types",
                    "Si entrenas ¿Qué días son los que entrenas? Puedes marcar más de una alternativa.": "exercise_days",
                    "¿A qué hora entrenas frecuentemente?": "exercise_time",
                    "¿Cuentas con algún dispositivo para medir tu gasto de calorías por sesión de entrenamiento?": "has_calorie_tracker",
                    "Si cuentas con un dispositivo para medir tu gasto calórico, ¿Cuánto es el gasto calórico que marca en tus entrenamientos? (especificar en los diferentes días de entrenamientos, por ejemplo: En miembro superior gaste 300 Kcal, cuando hago HIIT unas 600 Kca": "calorie_expenditure_details",
                    "¿Cómo está actualmente tu apetito?": "appetite_level",
                    "Si tienes tu apetito aumentado ¿En qué horario del día lo sientes? Puedes marcar más de una alternativa.": "appetite_peak_time",
                    "¿Cómo está actualmente tu sed?": "thirst_level",
                    "¿Qué cantidad de agua consumes en el día?": "water_intake",
                    "¿Cómo está actualmente tu sueño?": "sleep_quality",
                    "¿Cuántas horas duermes usualmente?": "sleep_hours",
                    "¿Cómo están tus deposiciones?": "bowel_movements",
                    "¿Con qué frecuencia realizas deposiciones?": "bowel_frequency",
                    "¿Cómo está tu orina?": "urine_status",
                    "Indica que número coincide con el color de tu orina. Para este proceso tienes que ver la orina en un recipiente transparente de plástico (esto permite ver tu estado de hidratación)": "urine_color_index",
                    "¿Cuentas con algunos de estos instrumentos?": "available_instruments",
                    "¿Tienes algún tipo de alimentación \"específica\"?": "specific_diet_type",
                    "¿Quién prepara tu comida?": "cooks_for_self",
                    "¿Te gusta cocinar?": "likes_cooking",
                    "Si tu respuesta fue SI ¿Qué preparaciones realizas?": "cooking_preparations",
                    "¿Tienes alergia algún alimento?": "food_allergies",
                    "¿Eres intolerante a algún alimento?": "food_intolerances",
                    "Si tu respuesta fue si en la anterior pregunta. ¿ A qué tipo de alimento eres intolerante?": "intolerance_details",
                    "¿Qué lácteo consumes?": "dairy_consumption",
                    "Especifica la marca y tipo de los lácteos que consumes": "dairy_brands",
                    "¿Consumes algún suplemento?": "supplements_consumption",
                    "Si tu respuesta fue SI ¿Qué tipo de suplemento consumes? Puedes marcas más de una alternativa": "supplement_types",
                    "¿Qué cereales NO TE AGRADAN ?": "disliked_cereals",
                    "¿Qué tubérculos NO TE AGRADAN?": "disliked_tubers",
                    "¿Qué Menestras NO TE AGRADAN ?": "disliked_legumes",
                    "¿Qué verduras NO TE AGRADAN ?": "disliked_vegetables",
                    "¿Qué frutas NO TE AGRADAN ?": "disliked_fruits",
                    "¿Qué carnes o derivados NO TE AGRADAN ?": "disliked_meats",
                    "¿Qué grasas NO TE AGRADAN?": "disliked_fats",
                    "¿Qué preparaciones no te agradan?": "disliked_preparations",
                    "¿Qué alimentos no saludables consumías antes de iniciar tu cambio de hábitos? Puedes seleccionar más de 1 alternativa": "previous_unhealthy_habits",
                    "¿A qué hora despiertas?": "wake_up_time",
                    "¿ A qué hora duermes?": "sleep_time",
                    "¿A qué hora consumes tu desayuno?": "breakfast_time",
                    "¿Qué alimentos consumes frecuentemente y/o prefieres en tu desayuno? Detallar la respuesta": "breakfast_details",
                    "¿A qué hora consumes tu almuerzo?": "lunch_time",
                    "¿Qué alimentos consumes frecuentemente y/o prefieres en tu almuerzo? Detallar la respuesta": "lunch_details",
                    "¿A qué hora consumes tu cena?": "dinner_time",
                    "¿Qué alimentos consumes frecuentemente y/o prefieres en tu Cena? Detallar la respuesta": "dinner_details",
                    "¿Qué alimentos consumes frecuentemente y/o prefieres en tu media mañana o media tarde? Detallar respuesta": "snack_details",
                    "Foto de Frente": "front_photo_url",
                    "Foto de Costado 1": "side_photo_1_url",
                    "Foto de Costado 2": "side_photo_2_url",
                    "Foto de Espalda": "back_photo_url",
                    "Foto frontal del producto y de la información nutricional (puede ser una sola foto si entran ambos o dos fotos) (Lácteos)": "dairy_photos",
                    "Foto frontal del producto y de la información nutricional (puede ser una sola foto si entran ambos o dos fotos) (Suplementos)": "supplement_photos",
                    "¿Qué tipo de preparación prefieres? ¿Fáciles o difíciles? ": "prep_preference",
                    "¿Qué tipo de preparación prefieres? ¿Dulces o salados? ": "taste_preference"
                };

                const newData: any = { patient_id: patientId };
                const rowNormalized: Record<string, any> = {};
                Object.keys(row).forEach(k => {
                    rowNormalized[k.trim().toLowerCase()] = row[k];
                });

                Object.entries(mapping).forEach(([excelHeader, dbField]) => {
                    const normalizedHeader = excelHeader.trim().toLowerCase();
                    if (rowNormalized[normalizedHeader] !== undefined) {
                        let val = rowNormalized[normalizedHeader];

                        // Transform booleans if they come as "SI/NO" or similar
                        if (typeof val === 'string') {
                            const normalized = val.toLowerCase().trim();
                            if (normalized === 'si' || normalized === 'sí' || normalized === 'yes') val = true;
                            else if (normalized === 'no') val = false;

                            // Specific mapping for UI states
                            if (dbField === 'previous_nutrition_service' && (normalized === 'nunca' || normalized === 'never')) {
                                val = 'never';
                            }
                        }

                        // Handle special fields
                        if (['created_at', 'birth_date'].includes(dbField)) {
                            val = parseExcelDate(val);
                        }

                        const timeFields = ['wake_up_time', 'sleep_time', 'breakfast_time', 'lunch_time', 'dinner_time', 'exercise_time'];
                        if (timeFields.includes(dbField)) {
                            val = parseExcelTime(val);
                        }

                        // Handle comma separated lists for array fields
                        const arrayFields = ['health_conditions', 'family_history', 'exercise_types', 'exercise_days', 'appetite_peak_time', 'available_instruments', 'supplement_types', 'previous_unhealthy_habits', 'disliked_cereals', 'disliked_tubers', 'disliked_legumes', 'disliked_meats', 'disliked_fats'];
                        if (arrayFields.includes(dbField) && typeof val === 'string') {
                            val = val.split(',').map(s => s.trim()).filter(Boolean);
                        }

                        newData[dbField] = val;
                    }
                });

                // Numeric conversions
                if (newData.urine_color_index) newData.urine_color_index = Number(newData.urine_color_index);
                if (newData.weight_kg) newData.weight_kg = Number(newData.weight_kg);
                if (newData.height_cm) newData.height_cm = Number(newData.height_cm);
                if (newData.waist_cm) newData.waist_cm = Number(newData.waist_cm);
                if (newData.age) newData.age = Number(newData.age);

                // Convert some specific fields to match backend expectations
                if (newData.previous_nutrition_service !== undefined && typeof newData.previous_nutrition_service === 'boolean') {
                    // Stay boolean for database if that's what's expected
                }

                if (newData.birth_date) {
                    newData.age = calculateAge(newData.birth_date);
                }

                setEditedData(newData);
                setIsEditing(true);

                toast({
                    title: "Excel Importado",
                    description: "Los datos han sido cargados. Revisa y presiona Guardar para confirmar.",
                });

            } catch (error) {
                console.error("Error processing Excel:", error);
                toast({ title: "Error", description: "No se pudo procesar el archivo Excel.", variant: "destructive" });
            }
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-[95vw] max-w-5xl rounded-3xl sm:rounded-[3rem] p-0 border-white/10 shadow-2xl bg-[#0B1120] text-white overflow-hidden max-h-[95vh] flex flex-col [&>button:last-child]:z-[100] [&>button:last-child]:right-4 sm:right-10 [&>button:last-child]:top-4 sm:top-10 [&>button:last-child]:h-10 sm:h-12 [&>button:last-child]:w-10 sm:w-12 [&>button:last-child]:rounded-xl sm:rounded-2xl [&>button:last-child]:bg-white/5 [&>button:last-child]:border-white/10 [&>button:last-child]:hover:bg-white/10 [&>button:last-child]:transition-all [&>button:last-child]:flex [&>button:last-child]:items-center [&>button:last-child]:justify-center [&>button:last-child]:p-0 [&>button:last-child>svg]:h-5 sm:h-6 [&>button:last-child>svg]:w-5 sm:w-6 [&>button:last-child>svg]:text-slate-400 [&>button:last-child:hover>svg]:text-white">
                <div className="absolute top-0 right-10 w-64 h-64 bg-nutri-brand/10 blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none" />

                <DialogHeader className="p-6 sm:p-10 lg:p-12 border-b border-white/5 relative">
                    <div className="flex flex-col sm:flex-row justify-between items-start pr-12 sm:pr-16 lg:pr-20 gap-6">
                        <div>
                            <DialogTitle className="text-2xl sm:text-4xl font-black tracking-tighter uppercase italic mb-2">
                                Historia <span className="text-nutri-brand">Clínica</span>
                            </DialogTitle>
                            <DialogDescription className="text-slate-400 font-medium italic">
                                Perfil clínico y nutricional de <span className="text-white font-bold uppercase">{patientName}</span>
                            </DialogDescription>
                        </div>
                        <div className="flex items-center gap-4">
                            {!isEditing ? (
                                <div className="flex items-center gap-4">
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept=".xlsx, .xls"
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) handleExcelUpload(file);
                                            }}
                                        />
                                        <Button
                                            className="h-12 px-6 rounded-xl bg-white/5 text-slate-300 border border-white/10 hover:bg-white/10 font-black uppercase text-[10px] tracking-widest transition-all"
                                        >
                                            <Upload className="h-4 w-4 mr-2" /> Subir Historia
                                        </Button>
                                    </div>
                                    <Button
                                        onClick={() => setIsEditing(true)}
                                        className="h-12 px-6 rounded-xl bg-nutri-brand/10 text-nutri-brand border border-nutri-brand/20 hover:bg-nutri-brand hover:text-white font-black uppercase text-[10px] tracking-widest transition-all"
                                    >
                                        <Edit className="h-4 w-4 mr-2" /> Editar Historia
                                    </Button>
                                </div>
                            ) : (
                                <div className="flex flex-col sm:flex-row items-center gap-3 w-full sm:w-auto">
                                    <Button
                                        onClick={() => { setIsEditing(false); setEditedData(historyData); }}
                                        variant="ghost"
                                        className="h-10 sm:h-12 px-6 rounded-xl text-slate-400 font-black uppercase text-[10px] tracking-widest w-full sm:w-auto"
                                    >
                                        <RotateCcw className="h-4 w-4 mr-2" /> Cancelar
                                    </Button>
                                    <Button
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        className="h-10 sm:h-12 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20 w-full sm:w-auto"
                                    >
                                        <Save className="h-4 w-4 mr-2" /> {isSaving ? "Guardando..." : "Guardar Cambios"}
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 sm:p-10 lg:p-12 space-y-12 sm:space-y-16 custom-scrollbar relative">
                    {loading ? (
                        <div className="py-20 text-center font-black animate-pulse text-slate-500 uppercase tracking-widest text-sm">
                            Cargando expediente clínico...
                        </div>
                    ) : !historyData && !isEditing ? (
                        <div className="py-20 text-center space-y-4">
                            <div className="h-20 w-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto text-slate-600">
                                <ClipboardList className="h-10 w-10" />
                            </div>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No se encontró historia clínica registrada para este paciente.</p>
                        </div>
                    ) : (
                        <div className="space-y-16">
                            {/* 01: Datos Personales */}
                            <section className="space-y-8">
                                <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                                    <span className="w-8 h-[1px] bg-nutri-brand/30" /> 01 // IDENTIDAD Y DATOS PERSONALES
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {isEditing ? (
                                        <>
                                            <EditItem label="Fecha Registro" value={toISODate(editedData?.created_at)} onChange={(v) => updateField('created_at', v)} type="date" />
                                            <EditItem label="Nombre Completo" value={editedData?.full_name} onChange={(v) => updateField('full_name', v)} />
                                            <EditItem label="DNI / CE" value={editedData?.dni} onChange={(v) => updateField('dni', v)} />
                                            <EditItem label="Email" value={editedData?.email} onChange={(v) => updateField('email', v)} />
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black text-slate-500 ml-2">Edad</Label>
                                                <div className="h-12 bg-white/5 border border-white/10 text-white rounded-xl font-bold flex items-center px-4 cursor-not-allowed opacity-70">
                                                    {editedData?.age || '-'}
                                                </div>
                                            </div>
                                            <EditItem label="Fecha Nacimiento" value={toISODate(editedData?.birth_date)} onChange={(v) => updateField('birth_date', v)} type="date" />
                                            <EditItem label="Instagram" value={editedData?.instagram} onChange={(v) => updateField('instagram', v)} />
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black text-slate-500 ml-2">Género</Label>
                                                <Select value={editedData?.gender} onValueChange={(v) => updateField('gender', v)}>
                                                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                                    <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                                        <SelectItem value="Masculino">Masculino</SelectItem>
                                                        <SelectItem value="Femenino">Femenino</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black text-slate-500 ml-2">Grado Instrucción</Label>
                                                <Select value={editedData?.education_level} onValueChange={(v) => updateField('education_level', v)}>
                                                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                                    <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                                        <SelectItem value="secundaria_incompleta">Secundaria incompleta</SelectItem>
                                                        <SelectItem value="tecnico">Técnico</SelectItem>
                                                        <SelectItem value="superior_incompleta">Superior incompleta</SelectItem>
                                                        <SelectItem value="superior">Superior</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <EditItem label="Región/Estado" value={editedData?.region} onChange={(v) => updateField('region', v)} />
                                            <EditItem label="Distrito" value={editedData?.district} onChange={(v) => updateField('district', v)} />
                                            <EditItem label="A qué te dedicas" value={editedData?.occupation} onChange={(v) => updateField('occupation', v)} />
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black text-slate-500 ml-2">Ocupación Específica</Label>
                                                <Select value={editedData?.job_details} onValueChange={(v) => updateField('job_details', v)}>
                                                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                                    <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                                        <SelectItem value="presencial">Presencial</SelectItem>
                                                        <SelectItem value="remoto">Remoto</SelectItem>
                                                        <SelectItem value="casa">Labores de casa</SelectItem>
                                                        <SelectItem value="estudiante">Estudiante</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <SummaryItem label="Fecha Registro" value={formatDate(historyData.created_at)} />
                                            <SummaryItem label="Nombre Completo" value={historyData.full_name} />
                                            <SummaryItem label="DNI" value={historyData.dni} />
                                            <SummaryItem label="Email" value={historyData.email} />
                                            <SummaryItem label="Edad" value={`${historyData.age} años`} />
                                            <SummaryItem label="Nacimiento" value={formatDate(historyData.birth_date)} />
                                            <SummaryItem label="Instagram" value={historyData.instagram} />
                                            <SummaryItem label="Género" value={historyData.gender} />
                                            <SummaryItem label="Instrucción" value={historyData.education_level} />
                                            <SummaryItem label="Ubicación" value={`${historyData.district || ''}, ${historyData.region || ''}`} />
                                            <SummaryItem label="Dedicación" value={historyData.occupation} />
                                            <SummaryItem label="Tipo Trabajo" value={historyData.job_details} />
                                        </>
                                    )}
                                </div>
                            </section>

                            {/* 02: Objetivos y Experiencia */}
                            <section className="space-y-8">
                                <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                                    <span className="w-8 h-[1px] bg-nutri-brand/30" /> 02 // OBJETIVO Y EXPERIENCIA PREVIA
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {isEditing ? (
                                        <>
                                            <EditItem label="Objetivo Nutricional" value={editedData?.nutritional_goal} onChange={(v) => updateField('nutritional_goal', v)} className="lg:col-span-2" type="textarea" />
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black text-slate-500">¿Se atendió antes?</Label>
                                                <Select value={String(editedData?.previous_nutrition_service)} onValueChange={(v) => updateField('previous_nutrition_service', v)}>
                                                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold"><SelectValue /></SelectTrigger>
                                                    <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                                        <SelectItem value="true">Sí</SelectItem>
                                                        <SelectItem value="false">No</SelectItem>
                                                        <SelectItem value="yes_pro">Sí, Nutricionista</SelectItem>
                                                        <SelectItem value="yes_non_pro">Sí, No profesional</SelectItem>
                                                        <SelectItem value="never">Nunca</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <EditItem label="Calificación Experiencia" value={editedData?.previous_experience_rating} onChange={(v) => updateField('previous_experience_rating', v)} />
                                            <EditItem label="Tiempo siguiendo plan" value={editedData?.time_following_plan} onChange={(v) => updateField('time_following_plan', v)} className="lg:col-span-4" />
                                        </>
                                    ) : (
                                        <>
                                            <SummaryItem label="Objetivo Nutricional" value={historyData.nutritional_goal} className="lg:col-span-2" />
                                            <SummaryItem label="Atención Previa" value={getYesNo(historyData.previous_nutrition_service)} />
                                            <SummaryItem label="Calificación" value={historyData.previous_experience_rating} />
                                            <SummaryItem label="Tiempo con planes" value={historyData.time_following_plan} className="lg:col-span-4" />
                                        </>
                                    )}
                                </div>
                            </section>

                            {/* 03: Mediciones */}
                            <section className="space-y-8">
                                <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                                    <span className="w-8 h-[1px] bg-nutri-brand/30" /> 03 // MEDICIONES CORPORALES
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {isEditing ? (
                                        <>
                                            <EditItem label="Peso (Kg)" value={editedData?.weight_kg} onChange={(v) => updateField('weight_kg', v)} type="number" />
                                            <EditItem label="Talla (cm)" value={editedData?.height_cm} onChange={(v) => updateField('height_cm', v)} type="number" />
                                            <EditItem label="Cintura (cm)" value={editedData?.waist_cm} onChange={(v) => updateField('waist_cm', v)} type="number" />
                                        </>
                                    ) : (
                                        <>
                                            <SummaryItem label="Peso" value={`${historyData.weight_kg} kg`} />
                                            <SummaryItem label="Talla" value={`${historyData.height_cm} cm`} />
                                            <SummaryItem label="Cintura" value={`${historyData.waist_cm} cm`} />
                                        </>
                                    )}
                                </div>
                            </section>

                            {/* 04: Salud */}
                            <section className="space-y-8">
                                <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                                    <span className="w-8 h-[1px] bg-nutri-brand/30" /> 04 // ESTADO DE SALUD
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {isEditing ? (
                                        <>
                                            <EditItem label="Condiciones Médicas" value={formatList(editedData?.health_conditions)} onChange={(v) => updateField('health_conditions', v.split(',').map((s: string) => s.trim()))} type="textarea" />
                                            <EditItem label="Antecedentes Familiares" value={formatList(editedData?.family_history)} onChange={(v) => updateField('family_history', v.split(',').map((s: string) => s.trim()))} type="textarea" />
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black text-slate-500">¿Consume Medicamentos?</Label>
                                                <Select value={String(editedData?.takes_medication)} onValueChange={(v) => updateField('takes_medication', v === 'true')}>
                                                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold"><SelectValue /></SelectTrigger>
                                                    <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                                        <SelectItem value="true">Sí</SelectItem>
                                                        <SelectItem value="false">No</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <EditItem label="Detalles Medicamentos" value={editedData?.medication_details} onChange={(v) => updateField('medication_details', v)} />
                                            <EditItem label="Frecuencia Medicamentos" value={editedData?.medication_frequency} onChange={(v) => updateField('medication_frequency', v)} />
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black text-slate-500">Exámenes Laboratorio (3 meses)</Label>
                                                <Select value={String(editedData?.recent_lab_tests)} onValueChange={(v) => updateField('recent_lab_tests', v === 'true')}>
                                                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold"><SelectValue /></SelectTrigger>
                                                    <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                                        <SelectItem value="true">Sí</SelectItem>
                                                        <SelectItem value="false">No</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <SummaryItem label="Condiciones Médicas" value={formatList(historyData.health_conditions)} />
                                            <SummaryItem label="Antecedentes Familiares" value={formatList(historyData.family_history)} />
                                            <SummaryItem label="Medicamentos" value={getYesNo(historyData.takes_medication)} />
                                            <SummaryItem label="Detalle Medicamentos" value={`${historyData.medication_details || '-'} (${historyData.medication_frequency || ''})`} />
                                            <SummaryItem label="Análisis Recientes" value={getYesNo(historyData.recent_lab_tests)} />
                                        </>
                                    )}
                                </div>
                            </section>

                            {/* 05: Actividad */}
                            <section className="space-y-8">
                                <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                                    <span className="w-8 h-[1px] bg-nutri-brand/30" /> 05 // ACTIVIDAD Y EJERCICIO
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {isEditing ? (
                                        <>
                                            <EditItem label="Actividad Diaria" value={editedData?.activity_level} onChange={(v) => updateField('activity_level', v)} />
                                            <EditItem label="Horario Trabajo" value={editedData?.work_schedule} onChange={(v) => updateField('work_schedule', v)} />
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black text-slate-500">Realiza Ejercicio</Label>
                                                <Select value={String(editedData?.does_exercise)} onValueChange={(v) => updateField('does_exercise', v === 'true')}>
                                                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold"><SelectValue /></SelectTrigger>
                                                    <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                                        <SelectItem value="true">Sí</SelectItem>
                                                        <SelectItem value="false">No</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <EditItem label="Tiempo realizando ej." value={editedData?.exercise_duration} onChange={(v) => updateField('exercise_duration', v)} />
                                            <EditItem label="Tipos de ejercicio" value={formatList(editedData?.exercise_types)} onChange={(v) => updateField('exercise_types', v.split(',').map((s: string) => s.trim()))} />
                                            <EditItem label="Días de entrenamiento" value={formatList(editedData?.exercise_days)} onChange={(v) => updateField('exercise_days', v.split(',').map((s: string) => s.trim()))} />
                                            <EditItem label="Hora entrenamiento" value={editedData?.exercise_time} onChange={(v) => updateField('exercise_time', v)} />
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black text-slate-500">¿Usa contador calorías?</Label>
                                                <Select value={String(editedData?.has_calorie_tracker)} onValueChange={(v) => updateField('has_calorie_tracker', v === 'true')}>
                                                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold"><SelectValue /></SelectTrigger>
                                                    <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                                        <SelectItem value="true">Sí</SelectItem>
                                                        <SelectItem value="false">No</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <EditItem label="Detalles Gasto Calórico" value={editedData?.calorie_expenditure_details} onChange={(v) => updateField('calorie_expenditure_details', v)} className="lg:col-span-3" type="textarea" />
                                        </>
                                    ) : (
                                        <>
                                            <SummaryItem label="Actividad Diaria" value={historyData.activity_level} />
                                            <SummaryItem label="Horario Trabajo" value={historyData.work_schedule} />
                                            <SummaryItem label="Hace Ejercicio" value={getYesNo(historyData.does_exercise)} />
                                            <SummaryItem label="Frecuencia" value={historyData.exercise_duration} />
                                            <SummaryItem label="Tipos Ejercicio" value={formatList(historyData.exercise_types)} />
                                            <SummaryItem label="Días" value={formatList(historyData.exercise_days)} />
                                            <SummaryItem label="Hora" value={historyData.exercise_time} />
                                            <SummaryItem label="Dispositivo Méd." value={getYesNo(historyData.has_calorie_tracker)} />
                                            <SummaryItem label="Detalles Gasto" value={historyData.calorie_expenditure_details} className="lg:col-span-3" />
                                        </>
                                    )}
                                </div>
                            </section>

                            {/* 06: Hábitos Fisiológicos */}
                            <section className="space-y-8">
                                <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                                    <span className="w-8 h-[1px] bg-nutri-brand/30" /> 06 // HÁBITOS FISIOLÓGICOS
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {isEditing ? (
                                        <>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black text-slate-500 ml-2">Apetito</Label>
                                                <Select value={editedData?.appetite_level} onValueChange={(v) => updateField('appetite_level', v)}>
                                                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                                    <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                                        <SelectItem value="bajo">Bajo</SelectItem>
                                                        <SelectItem value="normal">Normal</SelectItem>
                                                        <SelectItem value="aumentado">Aumentado</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <EditItem label="Horario Pico Apetito" value={formatList(editedData?.appetite_peak_time)} onChange={(v) => updateField('appetite_peak_time', v.split(',').map((s: string) => s.trim()))} />
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black text-slate-500 ml-2">Nivel Sed</Label>
                                                <Select value={editedData?.thirst_level} onValueChange={(v) => updateField('thirst_level', v)}>
                                                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                                    <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                                        <SelectItem value="bajo">Bajo</SelectItem>
                                                        <SelectItem value="normal">Normal</SelectItem>
                                                        <SelectItem value="aumentado">Aumentado</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black text-slate-500 ml-2">Agua al día</Label>
                                                <Select value={editedData?.water_intake} onValueChange={(v) => updateField('water_intake', v)}>
                                                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                                    <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                                        <SelectItem value="250-500">1-2 vasos (250-500mL)</SelectItem>
                                                        <SelectItem value="750-1000">3-4 vasos (750mL-1L)</SelectItem>
                                                        <SelectItem value="1250-1500">5-6 vasos (1250-1500mL)</SelectItem>
                                                        <SelectItem value="1750-2000">7-8 vasos (1750mL-2L)</SelectItem>
                                                        <SelectItem value="2250-2500">9-10 vasos (2250-2500mL)</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black text-slate-500 ml-2">Calidad Sueño</Label>
                                                <Select value={editedData?.sleep_quality} onValueChange={(v) => updateField('sleep_quality', v)}>
                                                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                                    <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                                        <SelectItem value="disminuido">Disminuido</SelectItem>
                                                        <SelectItem value="normal">Normal</SelectItem>
                                                        <SelectItem value="aumentado">Aumentado</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <EditItem label="Horas Sueño" value={editedData?.sleep_hours} onChange={(v) => updateField('sleep_hours', v)} />
                                            <EditItem label="Deposiciones" value={editedData?.bowel_movements} onChange={(v) => updateField('bowel_movements', v)} />
                                            <EditItem label="Frec. Deposiciones" value={editedData?.bowel_frequency} onChange={(v) => updateField('bowel_frequency', v)} />
                                            <EditItem label="Estado Orina" value={editedData?.urine_status} onChange={(v) => updateField('urine_status', v)} />
                                            <div className="space-y-3 col-span-full bg-white/5 p-6 rounded-2xl border border-white/10">
                                                <Label className="text-[10px] uppercase font-black text-slate-500 ml-2">Índice de color de orina (1-8)</Label>
                                                <div className="flex flex-wrap gap-4 mt-2">
                                                    {[
                                                        { id: 1, color: "#FDF5E6" },
                                                        { id: 2, color: "#FBE7A1" },
                                                        { id: 3, color: "#F9D94A" },
                                                        { id: 4, color: "#FAD02C" },
                                                        { id: 5, color: "#F2C029" },
                                                        { id: 6, color: "#EAAC14" },
                                                        { id: 7, color: "#D99101" },
                                                        { id: 8, color: "#7C7601" }
                                                    ].map((item) => (
                                                        <div
                                                            key={item.id}
                                                            onClick={() => updateField('urine_color_index', item.id)}
                                                            className={cn(
                                                                "w-10 h-10 rounded-full cursor-pointer border-4 transition-all hover:scale-110",
                                                                editedData?.urine_color_index === item.id ? "border-nutri-brand scale-110 ring-4 ring-nutri-brand/20" : "border-white/10"
                                                            )}
                                                            style={{ backgroundColor: item.color }}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <SummaryItem label="Apetito" value={historyData.appetite_level} />
                                            <SummaryItem label="Pico Apetito" value={formatList(historyData.appetite_peak_time)} />
                                            <SummaryItem label="Sed" value={historyData.thirst_level} />
                                            <SummaryItem label="Agua" value={historyData.water_intake} />
                                            <SummaryItem label="Calidad Sueño" value={historyData.sleep_quality} />
                                            <SummaryItem label="Horas Sueño" value={`${historyData.sleep_hours}h`} />
                                            <SummaryItem label="Deposiciones" value={historyData.bowel_movements} />
                                            <SummaryItem label="Frecuencia" value={historyData.bowel_frequency} />
                                            <SummaryItem label="Orina" value={historyData.urine_status} />
                                            <div className="space-y-1.5 p-5 rounded-[1.5rem] bg-white/[0.03] border border-white/5">
                                                <p className="text-[9px] uppercase font-black tracking-[0.1em] text-slate-500">Color Orina</p>
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className="w-4 h-4 rounded-full border border-white/20"
                                                        style={{
                                                            backgroundColor: [
                                                                "", "#FDF5E6", "#FBE7A1", "#F9D94A", "#FAD02C", "#F2C029", "#EAAC14", "#D99101", "#7C7601"
                                                            ][historyData.urine_color_index || 0]
                                                        }}
                                                    />
                                                    <p className="text-slate-200 font-bold text-sm">Índice {historyData.urine_color_index || '-'}</p>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </section>

                            {/* 07: Alimentación */}
                            <section className="space-y-8">
                                <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                                    <span className="w-8 h-[1px] bg-nutri-brand/30" /> 07 // ALIMENTACIÓN Y COCINA
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {isEditing ? (
                                        <>
                                            <EditItem label="Instrumentos (Balanza, etc)" value={formatList(editedData?.available_instruments)} onChange={(v) => updateField('available_instruments', v.split(',').map((s: string) => s.trim()))} />
                                            <EditItem label="Tipo Alimentación Spec." value={editedData?.specific_diet_type} onChange={(v) => updateField('specific_diet_type', v)} />
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black text-slate-500 ml-2">Quién prepara tu comida</Label>
                                                <Select value={editedData?.cooks_for_self} onValueChange={(v) => updateField('cooks_for_self', v)}>
                                                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                                    <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                                        <SelectItem value="yo_mismo">Yo mism@</SelectItem>
                                                        <SelectItem value="pareja">Pareja</SelectItem>
                                                        <SelectItem value="mama">Mamá</SelectItem>
                                                        <SelectItem value="hermana">Hermana</SelectItem>
                                                        <SelectItem value="abuela">Abuela</SelectItem>
                                                        <SelectItem value="restaurante">Restaurante</SelectItem>
                                                        <SelectItem value="concesionario">Concesionario</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black text-slate-500 ml-2">¿Le gusta cocinar?</Label>
                                                <Select value={String(editedData?.likes_cooking)} onValueChange={(v) => updateField('likes_cooking', v === 'true')}>
                                                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold"><SelectValue /></SelectTrigger>
                                                    <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                                        <SelectItem value="true">Sí</SelectItem>
                                                        <SelectItem value="false">No</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <EditItem label="Qué preparaciones realiza" value={editedData?.cooking_preparations} onChange={(v) => updateField('cooking_preparations', v)} />
                                            <EditItem label="Alergias" value={editedData?.food_allergies} onChange={(v) => updateField('food_allergies', v)} />
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black text-slate-500">¿Intolerancias?</Label>
                                                <Select value={String(editedData?.food_intolerances)} onValueChange={(v) => updateField('food_intolerances', v === 'true')}>
                                                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold"><SelectValue /></SelectTrigger>
                                                    <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                                        <SelectItem value="true">Sí</SelectItem>
                                                        <SelectItem value="false">No</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <EditItem label="Detalles Intolerancias" value={editedData?.intolerance_details} onChange={(v) => updateField('intolerance_details', v)} />
                                        </>
                                    ) : (
                                        <>
                                            <SummaryItem label="Instrumentos" value={formatList(historyData.available_instruments)} />
                                            <SummaryItem label="Dieta Específica" value={historyData.specific_diet_type} />
                                            <SummaryItem label="Prepara" value={historyData.cooks_for_self} />
                                            <SummaryItem label="Gusta cocinar" value={getYesNo(historyData.likes_cooking)} />
                                            <SummaryItem label="Preparaciones" value={historyData.cooking_preparations} />
                                            <SummaryItem label="Alergias" value={historyData.food_allergies} />
                                            <SummaryItem label="Intolerancias" value={getYesNo(historyData.food_intolerances)} />
                                            <SummaryItem label="Detalle Intolerancia" value={historyData.intolerance_details} />
                                        </>
                                    )}
                                </div>
                            </section>

                            {/* 08: Lácteos y Suplementos */}
                            <section className="space-y-8">
                                <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                                    <span className="w-8 h-[1px] bg-nutri-brand/30" /> 08 // LÁCTEOS Y SUPLEMENTACIÓN
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {isEditing ? (
                                        <>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black text-slate-500 ml-2">Lácteos que consume</Label>
                                                <Select value={editedData?.dairy_consumption} onValueChange={(v) => updateField('dairy_consumption', v)}>
                                                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                                    <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                                        <SelectItem value="ninguno">Ninguno</SelectItem>
                                                        <SelectItem value="leche">Leche</SelectItem>
                                                        <SelectItem value="yogurt">Yogurt</SelectItem>
                                                        <SelectItem value="queso">Queso</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <EditItem label="Marcas Lácteos" value={editedData?.dairy_brands} onChange={(v) => updateField('dairy_brands', v)} />
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black text-slate-500">¿Consume Suplementos?</Label>
                                                <Select value={String(editedData?.supplements_consumption)} onValueChange={(v) => updateField('supplements_consumption', v === 'true')}>
                                                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold"><SelectValue /></SelectTrigger>
                                                    <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                                        <SelectItem value="true">Sí</SelectItem>
                                                        <SelectItem value="false">No</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <EditItem label="Tipos de suplemento" value={formatList(editedData?.supplement_types)} onChange={(v) => updateField('supplement_types', v.split(',').map((s: string) => s.trim()))} />
                                        </>
                                    ) : (
                                        <>
                                            <SummaryItem label="Lácteos" value={historyData.dairy_consumption} />
                                            <SummaryItem label="Marcas" value={historyData.dairy_brands} />
                                            <SummaryItem label="Suplementos" value={getYesNo(historyData.supplements_consumption)} />
                                            <SummaryItem label="Tipos" value={formatList(historyData.supplement_types)} />
                                        </>
                                    )}
                                </div>
                            </section>

                            {/* 09: Aversiones y Horarios */}
                            <section className="space-y-8">
                                <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                                    <span className="w-8 h-[1px] bg-nutri-brand/30" /> 09 // AVERSIONES Y ESTILO DE VIDA
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {isEditing ? (
                                        <>
                                            <EditItem label="Cereales No Agradan" value={formatList(editedData?.disliked_cereals)} onChange={(v) => updateField('disliked_cereals', v.split(',').map((s: string) => s.trim()))} />
                                            <EditItem label="Tubérculos No Agradan" value={formatList(editedData?.disliked_tubers)} onChange={(v) => updateField('disliked_tubers', v.split(',').map((s: string) => s.trim()))} />
                                            <EditItem label="Menestras No Agradan" value={formatList(editedData?.disliked_legumes)} onChange={(v) => updateField('disliked_legumes', v.split(',').map((s: string) => s.trim()))} />
                                            <EditItem label="Vegetales No Agradan" value={editedData?.disliked_vegetables} onChange={(v) => updateField('disliked_vegetables', v)} />
                                            <EditItem label="Frutas No Agradan" value={editedData?.disliked_fruits} onChange={(v) => updateField('disliked_fruits', v)} />
                                            <EditItem label="Carnes No Agradan" value={formatList(editedData?.disliked_meats)} onChange={(v) => updateField('disliked_meats', v.split(',').map((s: string) => s.trim()))} />
                                            <EditItem label="Grasas No Agradan" value={formatList(editedData?.disliked_fats)} onChange={(v) => updateField('disliked_fats', v.split(',').map((s: string) => s.trim()))} />
                                            <EditItem label="Preparaciones No Agradan" value={editedData?.disliked_preparations} onChange={(v) => updateField('disliked_preparations', v)} />
                                            <EditItem label="Hábitos Malos Pasados" value={formatList(editedData?.previous_unhealthy_habits)} onChange={(v) => updateField('previous_unhealthy_habits', v.split(',').map((s: string) => s.trim()))} />
                                            <EditItem label="Hora Despertar" value={editedData?.wake_up_time} onChange={(v) => updateField('wake_up_time', v)} type="time" />
                                            <EditItem label="Hora Dormir" value={editedData?.sleep_time} onChange={(v) => updateField('sleep_time', v)} type="time" />
                                            <EditItem label="Hora Desayuno" value={editedData?.breakfast_time} onChange={(v) => updateField('breakfast_time', v)} type="time" />
                                            <EditItem label="Detalle Desayuno" value={editedData?.breakfast_details} onChange={(v) => updateField('breakfast_details', v)} type="textarea" />
                                            <EditItem label="Hora Almuerzo" value={editedData?.lunch_time} onChange={(v) => updateField('lunch_time', v)} type="time" />
                                            <EditItem label="Detalle Almuerzo" value={editedData?.lunch_details} onChange={(v) => updateField('lunch_details', v)} type="textarea" />
                                            <EditItem label="Hora Cena" value={editedData?.dinner_time} onChange={(v) => updateField('dinner_time', v)} type="time" />
                                            <EditItem label="Detalle Cena" value={editedData?.dinner_details} onChange={(v) => updateField('dinner_details', v)} type="textarea" />
                                            <EditItem label="Detalle Snacks" value={editedData?.snack_details} onChange={(v) => updateField('snack_details', v)} type="textarea" />
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black text-slate-500 ml-2">Preferencia Preparación</Label>
                                                <Select value={editedData?.prep_preference} onValueChange={(v) => updateField('prep_preference', v)}>
                                                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                                    <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                                        <SelectItem value="faciles">Fáciles</SelectItem>
                                                        <SelectItem value="dificiles">Difíciles</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black text-slate-500 ml-2">Preferencia Sabor</Label>
                                                <Select value={editedData?.taste_preference} onValueChange={(v) => updateField('taste_preference', v)}>
                                                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                                    <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                                        <SelectItem value="dulces">Dulces</SelectItem>
                                                        <SelectItem value="salados">Salados</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <SummaryItem label="Cereales Disgusto" value={formatList(historyData.disliked_cereals)} />
                                            <SummaryItem label="Tubérculos Disgusto" value={formatList(historyData.disliked_tubers)} />
                                            <SummaryItem label="Menestras Disgusto" value={formatList(historyData.disliked_legumes)} />
                                            <SummaryItem label="Vegetales Disgusto" value={historyData.disliked_vegetables} />
                                            <SummaryItem label="Frutas Disgusto" value={historyData.disliked_fruits} />
                                            <SummaryItem label="Carnes Disgusto" value={formatList(historyData.disliked_meats)} />
                                            <SummaryItem label="Grasas Disgusto" value={formatList(historyData.disliked_fats)} />
                                            <SummaryItem label="Preparaciones Disgusto" value={historyData.disliked_preparations} />
                                            <SummaryItem label="Hábitos a cambiar" value={formatList(historyData.previous_unhealthy_habits)} />
                                            <SummaryItem label="Hora Despertar" value={historyData.wake_up_time} />
                                            <SummaryItem label="Hora Dormir" value={historyData.sleep_time} />
                                            <SummaryItem label="Desayuno" value={`${historyData.breakfast_time || '-'}: ${historyData.breakfast_details || ''}`} />
                                            <SummaryItem label="Almuerzo" value={`${historyData.lunch_time || '-'}: ${historyData.lunch_details || ''}`} />
                                            <SummaryItem label="Cena" value={`${historyData.dinner_time || '-'}: ${historyData.dinner_details || ''}`} />
                                            <SummaryItem label="Media Tarde/Mañana" value={historyData.snack_details} />
                                            <SummaryItem label="Preferencias" value={`${historyData.prep_preference || '-'} / ${historyData.taste_preference || '-'}`} />
                                        </>
                                    )}
                                </div>
                            </section>

                            {/* 10: Multimedia */}
                            <section className="space-y-8">
                                <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                                    <span className="w-8 h-[1px] bg-nutri-brand/30" /> 10 // MULTIMEDIA Y ARCHIVOS
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {isEditing ? (
                                        <>
                                            <EditItem label="Foto Frente" value={editedData?.front_photo_url} onChange={(v) => updateField('front_photo_url', v)} />
                                            <EditItem label="Foto Costado 1" value={editedData?.side_photo_1_url} onChange={(v) => updateField('side_photo_1_url', v)} />
                                            <EditItem label="Foto Costado 2" value={editedData?.side_photo_2_url} onChange={(v) => updateField('side_photo_2_url', v)} />
                                            <EditItem label="Foto Espalda" value={editedData?.back_photo_url} onChange={(v) => updateField('back_photo_url', v)} />
                                            <EditItem label="Fotos Lácteos" value={editedData?.dairy_photos} onChange={(v) => updateField('dairy_photos', v)} />
                                            <EditItem label="Fotos Suplementos" value={editedData?.supplement_photos} onChange={(v) => updateField('supplement_photos', v)} />
                                        </>
                                    ) : (
                                        <>
                                            <SummaryItem label="Foto Frente" value={historyData.front_photo_url} />
                                            <SummaryItem label="Foto Costado 1" value={historyData.side_photo_1_url} />
                                            <SummaryItem label="Foto Costado 2" value={historyData.side_photo_2_url} />
                                            <SummaryItem label="Foto Espalda" value={historyData.back_photo_url} />
                                            <SummaryItem label="Fotos Lácteos" value={historyData.dairy_photos} />
                                            <SummaryItem label="Fotos Suplementos" value={historyData.supplement_photos} />
                                        </>
                                    )}
                                </div>
                            </section>
                        </div>
                    )}
                </div>

                <div className="p-10 border-t border-white/5 bg-white/[0.02] relative flex justify-end">
                    <DialogClose asChild>
                        <button className="px-10 h-14 rounded-2xl font-black uppercase tracking-widest bg-white/5 text-slate-400 hover:text-white transition-all border border-white/10">
                            Cerrar Documento
                        </button>
                    </DialogClose>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function SummaryItem({ label, value, className }: { label: string, value: string, className?: string }) {
    return (
        <div className={cn("space-y-1.5 p-5 rounded-[1.5rem] bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors", className)}>
            <p className="text-[9px] uppercase font-black tracking-[0.1em] text-slate-500">{label}</p>
            <p className="text-slate-200 font-bold text-sm leading-relaxed">{value || 'No registrado'}</p>
        </div>
    );
}

function EditItem({ label, value, onChange, className, type = "text" }: { label: string, value: any, onChange: (v: any) => void, className?: string, type?: "text" | "number" | "textarea" | "date" | "time" }) {
    return (
        <div className={cn("space-y-2", className)}>
            <Label className="text-[10px] uppercase font-black text-slate-500 ml-2">{label}</Label>
            {type === "textarea" ? (
                <Textarea
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="bg-white/5 border-white/10 text-white rounded-xl min-h-[100px] font-bold focus:ring-nutri-brand/50"
                />
            ) : (
                <Input
                    type={type}
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold focus:ring-nutri-brand/50"
                />
            )}
        </div>
    );
}
