"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
    Card, CardContent, CardHeader, CardTitle, CardDescription
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import {
    ChevronRight, ChevronLeft, Save, HeartPulse, User, Ruler, Activity,
    Moon, Utensils, Camera, AlertCircle, Sparkles, CheckCircle2, Clock,
    Loader2, Upload, X
} from "lucide-react";
import { removeBackground } from "@imgly/background-removal";
import { cn } from "@/lib/utils";

const medicalHistorySchema = z.object({
    // Step 1: Datos Personales
    full_name: z.string().min(3, "Nombre completo requerido"),
    dni: z.string().min(8, "DNI o CE requerido"),
    email: z.string().email("Email inválido"),
    age: z.coerce.number().min(1, "Edad requerida"),
    birth_date: z.string().min(1, "Fecha de nacimiento requerida"),
    gender: z.string().min(1, "Género requerido"),
    instagram: z.string().optional(),
    education_level: z.string().min(1, "Grado de instrucción requerido"),
    region: z.string().min(1, "Región/Estado requerido"),
    district: z.string().min(1, "Distrito requerido"),
    occupation: z.string().min(1, "¿A qué te dedicas? es requerido"),
    job_details: z.string().min(1, "Ocupación es requerida"),

    // Step 2: Objetivo y Experiencia
    nutritional_goal: z.string().min(1, "Objetivo requerido"),
    previous_nutrition_service: z.string().min(1, "Respuesta requerida"),
    previous_experience_rating: z.string().optional(),
    time_following_plan: z.string().optional(),

    // Step 3: Mediciones
    weight_kg: z.union([z.coerce.number().min(20, "Peso inválido"), z.literal("")]).optional(),
    height_cm: z.coerce.number().min(50, "Talla inválida"),
    waist_cm: z.union([z.coerce.number().min(30, "Medida de cintura inválida"), z.literal("")]).optional(),
    front_photo_url: z.string().optional(),
    side_photo_1_url: z.string().optional(),
    side_photo_2_url: z.string().optional(),
    back_photo_url: z.string().optional(),

    // Step 4: Estado de Salud
    health_conditions: z.array(z.string()).default([]),
    family_history: z.array(z.string()).default([]),
    takes_medication: z.preprocess((v) => typeof v === 'boolean' ? (v ? "yes" : "no") : v, z.string().min(1, "Respuesta requerida")),
    medication_details: z.string().optional(),
    medication_frequency: z.string().optional(),
    recent_lab_tests: z.preprocess((v) => typeof v === 'boolean' ? (v ? "yes" : "no") : v, z.string().min(1, "Respuesta requerida")),

    // Step 5: Actividad y Ejercicio
    activity_level: z.string().min(1, "Actividad diaria requerida"),
    work_schedule: z.string().optional(),
    does_exercise: z.preprocess((v) => typeof v === 'boolean' ? (v ? "yes" : "no") : v, z.string().min(1, "Respuesta requerida")),
    exercise_duration: z.string().optional(),
    exercise_types: z.array(z.string()).default([]),
    exercise_days: z.array(z.string()).default([]),
    exercise_time: z.string().optional(),
    has_calorie_tracker: z.preprocess((v) => typeof v === 'boolean' ? (v ? "yes" : "no") : v, z.string().optional()),
    calorie_expenditure_details: z.string().optional(),

    // Step 6: Hábitos Fisiológicos
    appetite_level: z.string().min(1, "Estado de apetito requerido"),
    appetite_peak_time: z.array(z.string()).default([]),
    thirst_level: z.string().min(1, "Estado de sed requerido"),
    water_intake: z.string().min(1, "Cantidad de agua requerida"),
    sleep_quality: z.string().min(1, "Estado de sueño requerido"),
    sleep_hours: z.string().min(1, "Horas de sueño requeridas"),
    bowel_movements: z.string().min(1, "Estado de deposiciones requerido"),
    bowel_frequency: z.string().min(1, "Frecuencia de deposiciones requerida"),
    urine_status: z.string().min(1, "Estado de orina requerido"),
    urine_color_index: z.coerce.number().min(1, "Color de orina requerido"),

    // Step 7: Alimentación
    available_instruments: z.array(z.string()).default([]),
    specific_diet_type: z.string().optional(),
    cooks_for_self: z.string().min(1, "Quién prepara tu comida es requerido"),
    likes_cooking: z.preprocess((v) => typeof v === 'boolean' ? (v ? "yes" : "no") : v, z.string().min(1, "Respuesta requerida")),
    cooking_preparations: z.string().optional(),
    food_allergies: z.string().optional(),
    food_intolerances: z.preprocess((v) => typeof v === 'boolean' ? (v ? "yes" : "no") : v, z.string().min(1, "Respuesta requerida")),
    intolerance_details: z.string().optional(),

    // Step 8: Lácteos y Suplementos
    dairy_consumption: z.string().min(1, "Respuesta requerida"),
    dairy_brands: z.string().optional(),
    supplements_consumption: z.preprocess((v) => typeof v === 'boolean' ? (v ? "yes" : "no") : v, z.string().min(1, "Respuesta requerida")),
    supplement_types: z.array(z.string()).default([]),

    // Step 9: Aversiones
    disliked_cereals: z.array(z.string()).default([]),
    disliked_tubers: z.array(z.string()).default([]),
    disliked_legumes: z.array(z.string()).default([]),
    disliked_vegetables: z.string().optional(),
    disliked_fruits: z.string().optional(),
    disliked_meats: z.array(z.string()).default([]),
    disliked_fats: z.array(z.string()).default([]),
    disliked_preparations: z.string().optional(),

    // Step 10: Estilo de Vida y Horarios
    previous_unhealthy_habits: z.array(z.string()).default([]),
    wake_up_time: z.string().min(1, "Hora de despertar requerida"),
    sleep_time: z.string().min(1, "Hora de dormir requerida"),
    breakfast_time: z.string().optional(),
    breakfast_details: z.string().optional(),
    lunch_time: z.string().optional(),
    lunch_details: z.string().optional(),
    dinner_time: z.string().optional(),
    dinner_details: z.string().optional(),
    snack_details: z.string().optional(),
    prep_preference: z.string().min(1, "Preferencia de preparación requerida"),
    taste_preference: z.string().min(1, "Preferencia de sabor requerida"),
});

type MedicalHistoryFormValues = z.infer<typeof medicalHistorySchema>;

interface MedicalHistoryFormProps {
    externalPatientId?: string;
    isNutritionistView?: boolean;
    hideWrapper?: boolean;
    onSaveSuccess?: () => void;
}

export function MedicalHistoryForm({ externalPatientId, isNutritionistView = false, hideWrapper = false, onSaveSuccess }: MedicalHistoryFormProps) {
    const supabase = createClient();
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [initialLoading, setInitialLoading] = useState(true);
    const [hasHistory, setHasHistory] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);
    const [patientId, setPatientId] = useState<string | null>(externalPatientId || null);
    const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
    const totalSteps = 10;

    const form = useForm<MedicalHistoryFormValues>({
        resolver: zodResolver(medicalHistorySchema) as any,
        defaultValues: {
            full_name: "",
            dni: "",
            email: "",
            age: 0,
            birth_date: "",
            gender: "",
            education_level: "",
            region: "",
            district: "",
            occupation: "",
            job_details: "",
            nutritional_goal: "",
            previous_nutrition_service: "",
            height_cm: 160,
            takes_medication: "no",
            recent_lab_tests: "no",
            activity_level: "sedentario",
            does_exercise: "no",
            appetite_level: "normal",
            thirst_level: "normal",
            water_intake: "1.5L - 2L",
            sleep_quality: "buena",
            sleep_hours: "7-8",
            bowel_movements: "normal",
            bowel_frequency: "diario",
            urine_status: "normal",
            urine_color_index: 1,
            cooks_for_self: "si",
            likes_cooking: "no",
            food_intolerances: "no",
            dairy_consumption: "ninguno",
            supplements_consumption: "no",
            wake_up_time: "07:00",
            sleep_time: "23:00",
            prep_preference: "faciles",
            taste_preference: "salados",
            health_conditions: [],
            family_history: [],
            exercise_types: [],
            exercise_days: [],
            appetite_peak_time: [],
            available_instruments: [],
            supplement_types: [],
            previous_unhealthy_habits: [],
            disliked_cereals: [],
            disliked_tubers: [],
            disliked_legumes: [],
            disliked_meats: [],
            disliked_fats: [],
            front_photo_url: "",
            side_photo_1_url: "",
            side_photo_2_url: "",
            back_photo_url: "",
        } as any,
    });

    useEffect(() => {
        const fetchUserData = async () => {
            try {
                let currentPatientId = externalPatientId || null;
                let currentProfile: any = null;

                if (!currentPatientId) {
                    const { data: { user } } = await supabase.auth.getUser();
                    if (!user) return;
                    const { data: profile } = await supabase.from('profiles').select('id, full_name, email').eq('user_id', user.id).single();
                    currentProfile = profile;
                } else {
                    // Si tenemos un PatientId externo, necesitamos su perfil
                    const { data: patientData } = await supabase.from('patients').select('profile:profiles!profile_id(id, full_name, email)').eq('id', currentPatientId).single();
                    currentProfile = (patientData?.profile as any);
                }

                if (currentProfile) {
                    form.setValue('full_name', currentProfile.full_name);
                    form.setValue('email', currentProfile.email || "");

                    if (!currentPatientId) {
                        const { data: patient } = await supabase.from('patients').select('id, height_cm, current_weight, date_of_birth').eq('profile_id', currentProfile.id).single();
                        currentPatientId = patient?.id || null;
                    }

                    if (currentPatientId) {
                        setPatientId(currentPatientId);
                        const { data: patient } = await supabase.from('patients').select('height_cm, current_weight, date_of_birth').eq('id', currentPatientId).single();
                        
                        if (patient) {
                            if (patient.height_cm) form.setValue('height_cm', Number(patient.height_cm));
                            if (patient.current_weight) form.setValue('weight_kg', Number(patient.current_weight));
                            if (patient.date_of_birth) form.setValue('birth_date', patient.date_of_birth);
                        }

                        // Check for existing medical history
                        const { data: history } = await supabase.from('patient_medical_histories').select('*').eq('patient_id', currentPatientId).single();
                        if (history) {
                            setHasHistory(true);
                            // Pre-fill form with existing data
                            Object.keys(history).forEach(key => {
                                if (key in medicalHistorySchema.shape) {
                                    const value = history[key];
                                    if (['health_conditions', 'family_history', 'exercise_types', 'exercise_days', 'appetite_peak_time', 'available_instruments', 'supplement_types', 'previous_unhealthy_habits', 'disliked_cereals', 'disliked_tubers', 'disliked_legumes', 'disliked_meats', 'disliked_fats'].includes(key)) {
                                        if (typeof value === 'string' && value) {
                                            form.setValue(key as any, value.split(', ').filter(Boolean));
                                        } else {
                                            form.setValue(key as any, value || []);
                                        }
                                    } else if (['previous_nutrition_service', 'takes_medication', 'recent_lab_tests', 'does_exercise', 'likes_cooking', 'supplements_consumption', 'has_calorie_tracker', 'food_intolerances'].includes(key)) {
                                        // If stored as boolean, convert to 'yes'/'no' for the form components
                                        if (value === true || value === 'si' || value === 'sí') form.setValue(key as any, 'yes');
                                        else if (value === false || value === 'no' || value === 'nunca') form.setValue(key as any, 'no');
                                        else form.setValue(key as any, value ?? "");
                                    } else {
                                        // Global safety: Many fields might come as boolean from old DB structures
                                        if (typeof value === 'boolean') {
                                            form.setValue(key as any, value ? "yes" : "no");
                                        } else {
                                            form.setValue(key as any, value ?? "");
                                        }
                                    }
                                }
                            });
                        }
                    }
                }
            } catch (error) {
                console.error("Error fetching user data:", error);
            } finally {
                setInitialLoading(false);
            }
        };
        fetchUserData();
    }, [externalPatientId]);

    const watchedBirthDate = form.watch("birth_date");

    useEffect(() => {
        if (watchedBirthDate) {
            const birth = new Date(watchedBirthDate);
            if (isNaN(birth.getTime())) return;

            const today = new Date();
            let age = today.getFullYear() - birth.getFullYear();
            const m = today.getMonth() - birth.getMonth();
            if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) {
                age--;
            }
            if (age >= 0) {
                form.setValue("age", age);
            }
        }
    }, [watchedBirthDate, form]);

    const onError = (errors: any) => {
        console.error("Form Validation Errors:", errors);
        const errorDetails = Object.entries(errors).map(([field, err]: [string, any]) => `${field}: ${err.message}`).filter(Boolean);
        if (errorDetails.length > 0) {
            toast({
                title: "Error de validación",
                description: `Por favor revisa: ${errorDetails.slice(0, 2).join(", ")}${errorDetails.length > 2 ? '...' : ''}`,
                variant: "destructive"
            });
        }
    };

    const onSubmit = async (values: MedicalHistoryFormValues) => {
        if (!patientId) {
            toast({ title: "Error", description: "No se encontró el ID del paciente.", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            // Prepare data for database, converting types where necessary
            const dbData: any = { ...values };
            dbData.patient_id = patientId;

            // Numeric transformations: convert empty strings to null for nullable columns
            if (!values.weight_kg && values.weight_kg !== 0) dbData.weight_kg = null;
            if (!values.waist_cm && values.waist_cm !== 0) dbData.waist_cm = null;
            if (!values.height_cm && values.height_cm !== 0) dbData.height_cm = null;
            if (!values.urine_color_index && values.urine_color_index !== 0) dbData.urine_color_index = null;
            if (!values.age && values.age !== 0) dbData.age = null;

            // Boolean transformations: Ensure we return true/false/null for bool columns
            const cleanBool = (v: any) => {
                if (v === null || v === undefined || v === "") return null;
                const s = String(v).toLowerCase();
                if (s === 'yes' || s === 'true' || s === 'si' || s === 'sí' || s.startsWith('yes')) return true;
                if (s === 'no' || s === 'false' || s === 'never' || s === 'nunca') return false;
                return null;
            };

            const boolFields = [
                'does_exercise', 'has_calorie_tracker', 'likes_cooking',
                'previous_nutrition_service', 'recent_lab_tests',
                'supplements_consumption', 'takes_medication'
            ];

            boolFields.forEach(field => {
                dbData[field] = cleanBool(values[field as keyof MedicalHistoryFormValues]);
            });

            // Fields that are defined as actual ARRAY (text[]) in the database
            const nativeArrayFields = [
                'health_conditions', 'family_history', 'exercise_types', 'exercise_days',
                'appetite_peak_time', 'available_instruments', 'supplement_types',
                'previous_unhealthy_habits'
            ];

            // Fields that are defined as text (standard strings) in the database but are arrays in the form
            const stringJoinedFields = [
                'disliked_cereals', 'disliked_tubers', 'disliked_legumes',
                'disliked_meats', 'disliked_fats'
            ];

            nativeArrayFields.forEach(field => {
                const val = (values as any)[field];
                dbData[field] = Array.isArray(val) ? val : [];
            });

            stringJoinedFields.forEach(field => {
                const val = (values as any)[field];
                if (Array.isArray(val)) {
                    dbData[field] = val.join(', ');
                }
            });

            // Final Cleanup: Ensure we only send fields that exist in the patient_medical_histories table
            // and have the correct types. 
            // We use a whitelist approach for maximum safety.
            const tableColumns = [
                'patient_id', 'full_name', 'dni', 'email', 'age', 'birth_date', 'instagram',
                'education_level', 'region', 'district', 'occupation', 'job_details',
                'nutritional_goal', 'previous_nutrition_service', 'previous_experience_rating',
                'time_following_plan', 'weight_kg', 'height_cm', 'waist_cm', 'health_conditions',
                'family_history', 'takes_medication', 'medication_details', 'medication_frequency',
                'recent_lab_tests', 'activity_level', 'work_schedule', 'does_exercise',
                'exercise_duration', 'exercise_types', 'exercise_days', 'exercise_time',
                'has_calorie_tracker', 'calorie_expenditure_details', 'appetite_level',
                'appetite_peak_time', 'thirst_level', 'water_intake', 'sleep_quality',
                'sleep_hours', 'bowel_movements', 'bowel_frequency', 'urine_status',
                'urine_color_index', 'available_instruments', 'specific_diet_type',
                'cooks_for_self', 'likes_cooking', 'cooking_preparations', 'food_allergies',
                'food_intolerances', 'intolerance_details', 'dairy_consumption',
                'dairy_brands', 'supplements_consumption', 'supplement_types',
                'disliked_cereals', 'disliked_tubers', 'disliked_legumes', 'disliked_vegetables',
                'disliked_fruits', 'disliked_meats', 'disliked_fats', 'disliked_preparations',
                'previous_unhealthy_habits', 'wake_up_time', 'sleep_time', 'breakfast_time',
                'breakfast_details', 'lunch_time', 'lunch_details', 'dinner_time',
                'dinner_details', 'snack_details', 'prep_preference', 'taste_preference',
                'front_photo_url', 'side_photo_1_url', 'side_photo_2_url', 'back_photo_url'
            ];

            const finalData: any = {};
            tableColumns.forEach(col => {
                if (col in dbData) {
                    finalData[col] = dbData[col];
                }
            });

            // Update medical history
            const medicalHistoryPromise = supabase
                .from('patient_medical_histories')
                .upsert(finalData, { onConflict: 'patient_id' });

            // Update basic patient data in 'patients' table
            const patientDataPromise = supabase
                .from('patients')
                .update({
                    height_cm: values.height_cm,
                    current_weight: values.weight_kg === "" ? null : values.weight_kg,
                    gender: values.gender,
                    date_of_birth: values.birth_date
                })
                .eq('id', patientId);

            const [historyRes, patientRes] = await Promise.all([medicalHistoryPromise, patientDataPromise]);

            if (historyRes.error) throw historyRes.error;
            if (patientRes.error) throw patientRes.error;

            toast({ title: "¡Éxito!", description: "Tu historia clínica y datos de perfil han sido actualizados.", variant: "success" });
            setHasHistory(true);
            setIsEditMode(false);
            setStep(1); // Reset to step 1 for future edits
            if (onSaveSuccess) onSaveSuccess();
        } catch (error: any) {
            console.error("Error saving medical history:", error);
            toast({ title: "Error", description: error.message || "Ocurrió un error al guardar.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const nextStep = async () => {
        const fields: (keyof MedicalHistoryFormValues)[] = [];
        if (step === 1) fields.push('full_name', 'dni', 'email', 'gender', 'age', 'birth_date', 'education_level', 'region', 'district', 'occupation', 'job_details');
        if (step === 2) fields.push('nutritional_goal', 'previous_nutrition_service');
        if (step === 3) fields.push('weight_kg', 'height_cm', 'waist_cm');
        if (step === 4) fields.push('takes_medication', 'recent_lab_tests');
        if (step === 5) fields.push('activity_level', 'does_exercise');
        if (step === 6) fields.push('appetite_level', 'thirst_level', 'water_intake', 'sleep_quality', 'sleep_hours', 'bowel_movements', 'bowel_frequency', 'urine_status', 'urine_color_index');
        if (step === 7) fields.push('cooks_for_self', 'likes_cooking', 'food_intolerances');
        if (step === 8) fields.push('dairy_consumption', 'supplements_consumption');
        if (step === 10) fields.push('wake_up_time', 'sleep_time', 'prep_preference', 'taste_preference');

        const isStepValid = await form.trigger(fields);
        if (isStepValid) setStep(prev => Math.min(prev + 1, totalSteps));
        else toast({ title: "Campos incompletos", description: "Por favor llena todos los campos requeridos del paso actual.", variant: "destructive" });
    };

    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

    if (initialLoading) {
        return (
            <div className={cn("flex flex-col items-center justify-center space-y-4", hideWrapper ? "py-10" : "p-20 bg-[#151F32] rounded-[3rem]")}>
                <Sparkles className="h-12 w-12 text-nutri-brand animate-pulse" />
                <p className="text-white font-tech tracking-widest uppercase animate-pulse">Cargando Historia...</p>
            </div>
        );
    }

    if (hasHistory && !isEditMode && !isNutritionistView) {
        return <MedicalHistorySummary values={form.getValues()} onEdit={() => setIsEditMode(true)} hideWrapper={hideWrapper} />;
    }

    const FormContent = (
        <>
            <div className={cn("p-8 lg:p-12 border-b border-white/5 relative", hideWrapper && "pt-0")}>
                {!hideWrapper && <div className="absolute top-0 right-10 w-40 h-full bg-nutri-brand/10 blur-[60px] rounded-full pointer-events-none" />}
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-3xl lg:text-4xl font-black text-white tracking-tighter uppercase mb-2">
                            {hasHistory ? "Editar" : "Completa la"} <span className="text-nutri-brand">Historia Clínica</span>
                        </CardTitle>
                        <CardDescription className="text-slate-400 font-medium italic">
                            Paso {step} de {totalSteps}: {getStepTitle(step)}
                        </CardDescription>
                    </div>
                    {hasHistory && !isNutritionistView && (
                        <Button variant="ghost" onClick={() => setIsEditMode(false)} className="text-slate-500 hover:text-white uppercase font-black tracking-widest text-xs">
                            Cancelar Edición
                        </Button>
                    )}
                </div>
            </div>
            <div className="p-8 lg:p-12">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit as any, onError)} className="space-y-8">
                        {step === 1 && <PersonalData form={form} />}

                        {step === 2 && <GoalExperience form={form} />}
                        {step === 3 && <Measurements form={form} patientId={patientId!} setIsUploadingPhoto={setIsUploadingPhoto} />}
                        {step === 4 && <HealthStatus form={form} />}
                        {step === 5 && <ActivityExercise form={form} />}
                        {step === 6 && <Habits form={form} />}
                        {step === 7 && <DietCooking form={form} />}
                        {step === 8 && <DairySupplements form={form} />}
                        {step === 9 && <Dislikes form={form} />}
                        {step === 10 && <Lifestyle form={form} />}

                        <div className="flex items-center justify-between pt-8 border-t border-white/5">
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={prevStep}
                                disabled={step === 1 || isUploadingPhoto}
                                className="px-8 h-14 rounded-2xl font-black uppercase tracking-widest text-slate-500 hover:text-white disabled:opacity-50"
                            >
                                <ChevronLeft className="mr-2 h-5 w-5" /> Anterior
                            </Button>

                            <div className="flex items-center gap-4">
                                {(isEditMode || isNutritionistView) && step < totalSteps && (
                                    <Button
                                        type="submit"
                                        disabled={loading || isUploadingPhoto}
                                        className="px-8 h-14 rounded-2xl font-black uppercase tracking-widest bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all text-sm disabled:opacity-50 disabled:hover:scale-100"
                                    >
                                        {loading ? "Guardando..." : "Guardar Avance"} <Save className="ml-2 h-4 w-4" />
                                    </Button>
                                )}

                                {step < totalSteps ? (
                                    <Button
                                        type="button"
                                        onClick={nextStep}
                                        disabled={isUploadingPhoto}
                                        className="px-10 h-14 rounded-2xl font-black uppercase tracking-widest bg-nutri-brand text-white shadow-lg shadow-nutri-brand/20 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                                    >
                                        Siguiente <ChevronRight className="ml-2 h-5 w-5" />
                                    </Button>
                                ) : (
                                    <Button
                                        type="submit"
                                        disabled={loading || isUploadingPhoto}
                                        className="px-12 h-14 rounded-2xl font-black uppercase tracking-widest bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all disabled:opacity-50 disabled:hover:scale-100"
                                    >
                                        {loading ? "Guardando..." : "Finalizar y Guardar"} <Save className="ml-2 h-5 w-5" />
                                    </Button>
                                )}
                            </div>
                        </div>
                    </form>
                </Form>
            </div>
        </>
    );

    if (hideWrapper) return <div className="bg-transparent">{FormContent}</div>;

    return (
        <Card className="rounded-[3rem] shadow-2xl border-white/5 bg-[#151F32] overflow-hidden">
            {FormContent}
        </Card>
    );
}

function MedicalHistorySummary({ values, onEdit, hideWrapper = false }: { values: any, onEdit: () => void, hideWrapper?: boolean }) {
    const formatList = (val: any) => {
        if (!val) return 'Ninguno';
        if (Array.isArray(val)) return val.length > 0 ? val.join(', ') : 'Ninguno';
        return val;
    };

    const getYesNo = (val: any) => {
        const s = String(val).toLowerCase();
        if (s === 'yes' || s === 'true' || s === 'si' || s === 'sí' || s.startsWith('yes')) return 'Sí';
        if (s === 'no' || s === 'false' || s === 'never' || s === 'nunca') return 'No';
        return val || 'No registrado';
    };

    const getUrineColor = (index: number) => {
        const colors: Record<number, string> = {
            1: "#FDF5E6", 2: "#FBE7A1", 3: "#F9D94A", 4: "#FAD02C",
            5: "#F2C029", 6: "#EAAC14", 7: "#D99101", 8: "#7C7601"
        };
        return colors[index] || "transparent";
    };

    const SummaryContent = (
        <>
            <div className={cn("p-8 lg:p-12 border-b border-white/5 relative", hideWrapper && "pt-0")}>
                {!hideWrapper && <div className="absolute top-0 right-10 w-40 h-full bg-nutri-brand/10 blur-[60px] rounded-full pointer-events-none" />}
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-3xl lg:text-4xl font-black text-white tracking-tighter uppercase mb-2">
                            Tu <span className="text-nutri-brand">Historia Clínica</span>
                        </CardTitle>
                        <CardDescription className="text-slate-400 font-medium italic">
                            Expediente clínico completo y detallado.
                        </CardDescription>
                    </div>
                </div>
            </div>
            <div className="p-8 lg:p-12 space-y-20 custom-scrollbar max-h-[70vh] overflow-y-auto bg-[#151F32]">
                {/* 01: Identidad */}
                <section className="space-y-8">
                    <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                        <span className="w-8 h-[1px] bg-nutri-brand/30" /> 01 // IDENTIDAD Y DATOS PERSONALES
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        <SummaryItem label="Nombre" value={values.full_name} />
                        <SummaryItem label="DNI" value={values.dni} />
                        <SummaryItem label="Email" value={values.email} />
                        <SummaryItem label="Género" value={values.gender} />
                        <SummaryItem label="Edad" value={`${values.age} años`} />
                        <SummaryItem label="Nacimiento" value={values.birth_date} />
                        <SummaryItem label="Instagram" value={values.instagram} />
                        <SummaryItem label="Educación" value={values.education_level} />
                        <SummaryItem label="Región" value={values.region} />
                        <SummaryItem label="Distrito" value={values.district} />
                        <SummaryItem label="Ocupación" value={values.occupation} />
                        <SummaryItem label="Horario Laboral" value={values.job_details} />
                    </div>
                </section>

                {/* 02: Objetivo */}
                <section className="space-y-8">
                    <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                        <span className="w-8 h-[1px] bg-nutri-brand/30" /> 02 // OBJETIVO Y EXPERIENCIA
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SummaryItem label="Objetivo Nutricional" value={values.nutritional_goal} />
                        <SummaryItem label="Exp. Previa" value={values.previous_nutrition_service === 'never' || values.previous_nutrition_service === false ? 'Nunca' : `Sí (${values.time_following_plan || 'N/A'})`} />
                        <SummaryItem label="Calificación Anterior" value={values.previous_experience_rating} />
                    </div>
                </section>

                {/* 03: Mediciones */}
                <section className="space-y-8">
                    <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                        <span className="w-8 h-[1px] bg-nutri-brand/30" /> 03 // MEDICIONES ANTROPOMÉTRICAS
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <SummaryItem label="Peso Inicial" value={values.weight_kg ? `${values.weight_kg} kg` : 'Pte.'} />
                        <SummaryItem label="Talla" value={values.height_cm ? `${values.height_cm} cm` : 'Pte.'} />
                        <SummaryItem label="Cintura" value={values.waist_cm ? `${values.waist_cm} cm` : 'Pte.'} />
                    </div>
                    {/* Fotos de Progreso Display */}
                    <div className="pt-4">
                        <h4 className="font-tech font-bold text-slate-400 uppercase tracking-widest text-[10px] mb-4">Fotos de Progreso</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {[
                                { label: 'Frente', url: values.front_photo_url },
                                { label: 'Costado 1', url: values.side_photo_1_url },
                                { label: 'Costado 2', url: values.side_photo_2_url },
                                { label: 'Espalda', url: values.back_photo_url }
                            ].map(photo => (
                                <div key={photo.label} className="flex flex-col gap-2">
                                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 text-center">{photo.label}</span>
                                    <div className="relative h-40 w-full rounded-2xl border border-white/5 bg-white/[0.02] overflow-hidden flex items-center justify-center">
                                        {photo.url && photo.url !== "" ? (
                                            <img src={photo.url} alt={photo.label} className="w-full h-full object-contain" />
                                        ) : (
                                            <Camera className="h-6 w-6 text-slate-600 opacity-50" />
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* 04: Salud */}
                <section className="space-y-8">
                    <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                        <span className="w-8 h-[1px] bg-nutri-brand/30" /> 04 // CONDICIONES DE SALUD
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SummaryItem label="Condiciones" value={formatList(values.health_conditions)} />
                        <SummaryItem label="Antecedentes" value={formatList(values.family_history)} />
                        <SummaryItem label="Medicamentos" value={getYesNo(values.takes_medication)} />
                        <SummaryItem label="Detalle Medicamento" value={`${values.medication_details || 'N/A'} (${values.medication_frequency || ''})`} />
                        <SummaryItem label="Análisis 3 meses" value={getYesNo(values.recent_lab_tests)} />
                    </div>
                </section>

                {/* 05: Actividad */}
                <section className="space-y-8">
                    <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                        <span className="w-8 h-[1px] bg-nutri-brand/30" /> 05 // ACTIVIDAD Y EJERCICIO
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <SummaryItem label="Actividad Diaria" value={values.activity_level} />
                        <SummaryItem label="Horario Trabajo" value={values.work_schedule} />
                        <SummaryItem label="Hace Ejercicio" value={getYesNo(values.does_exercise)} />
                        <SummaryItem label="Tiempo Ejercicio" value={values.exercise_duration} />
                        <SummaryItem label="Tipos Ejercicio" value={formatList(values.exercise_types)} />
                        <SummaryItem label="Días Frecuentes" value={formatList(values.exercise_days)} />
                        <SummaryItem label="Hora de Entrenamiento" value={values.exercise_time} />
                        <SummaryItem label="Contador Calorías" value={getYesNo(values.has_calorie_tracker)} />
                        <SummaryItem label="Detalle Gasto" value={values.calorie_expenditure_details} />
                    </div>
                </section>

                {/* 06: Hábitos */}
                <section className="space-y-8">
                    <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                        <span className="w-8 h-[1px] bg-nutri-brand/30" /> 06 // HÁBITOS FISIOLÓGICOS
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <SummaryItem label="Apetito" value={values.appetite_level} />
                        <SummaryItem label="Horario Apetito" value={formatList(values.appetite_peak_time)} />
                        <SummaryItem label="Sed" value={values.thirst_level} />
                        <SummaryItem label="Cantidad Agua" value={values.water_intake} />
                        <SummaryItem label="Calidad Sueño" value={values.sleep_quality} />
                        <SummaryItem label="Horas Sueño" value={values.sleep_hours} />
                        <SummaryItem label="Deposiciones" value={values.bowel_movements} />
                        <SummaryItem label="Frecuencia" value={values.bowel_frequency} />
                        <SummaryItem label="Estado Orina" value={values.urine_status} />
                        <div className="space-y-2 p-4 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-between">
                            <div>
                                <p className="text-[10px] uppercase font-black tracking-tighter text-slate-500">Color Orina</p>
                                <p className="text-white font-medium text-sm">Nivel {values.urine_color_index || '0'}</p>
                            </div>
                            <div className="w-10 h-10 rounded-full border-2 border-white/10" style={{ backgroundColor: getUrineColor(values.urine_color_index) }} />
                        </div>
                    </div>
                </section>

                {/* 07: Alimentación */}
                <section className="space-y-8">
                    <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                        <span className="w-8 h-[1px] bg-nutri-brand/30" /> 07 // ALIMENTACIÓN Y COCINA
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SummaryItem label="Instrumentos" value={formatList(values.available_instruments)} />
                        <SummaryItem label="Dieta Específica" value={values.specific_diet_type} />
                        <SummaryItem label="Prepara Comida" value={values.cooks_for_self} />
                        <SummaryItem label="Le gusta cocinar" value={getYesNo(values.likes_cooking)} />
                        <SummaryItem label="Alergias" value={values.food_allergies} />
                        <SummaryItem label="Intolerancias" value={getYesNo(values.food_intolerances)} />
                        <SummaryItem label="Detalles Intolerancia" value={values.intolerance_details} />
                    </div>
                </section>

                {/* 08: Lácteos */}
                <section className="space-y-8">
                    <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                        <span className="w-8 h-[1px] bg-nutri-brand/30" /> 08 // LÁCTEOS Y SUPLEMENTACIÓN
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <SummaryItem label="Consumo Lácteos" value={values.dairy_consumption} />
                        <SummaryItem label="Marcas Lácteos" value={values.dairy_brands} />
                        <SummaryItem label="Suplementos" value={getYesNo(values.supplements_consumption)} />
                        <SummaryItem label="Tipos de Suplemento" value={formatList(values.supplement_types)} />
                    </div>
                </section>

                {/* 09: Aversiones */}
                <section className="space-y-8">
                    <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                        <span className="w-8 h-[1px] bg-nutri-brand/30" /> 09 // AVERSIONES Y ESTILO DE VIDA
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <SummaryItem label="Cereales No" value={formatList(values.disliked_cereals)} />
                        <SummaryItem label="Tubérculos No" value={formatList(values.disliked_tubers)} />
                        <SummaryItem label="Menestras No" value={formatList(values.disliked_legumes)} />
                        <SummaryItem label="Vegetales No" value={values.disliked_vegetables} />
                        <SummaryItem label="Frutas No" value={values.disliked_fruits} />
                        <SummaryItem label="Carnes No" value={formatList(values.disliked_meats)} />
                        <SummaryItem label="Grasas No" value={formatList(values.disliked_fats)} />
                        <SummaryItem label="Preparaciones No" value={values.disliked_preparations} />
                        <SummaryItem label="Hábitos a mejorar" value={formatList(values.previous_unhealthy_habits)} className="lg:col-span-2" />
                    </div>
                </section>

                {/* 10: Horarios */}
                <section className="space-y-8">
                    <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                        <span className="w-8 h-[1px] bg-nutri-brand/30" /> 10 // HORARIOS Y LIFESTYLE
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <SummaryItem label="Despertar" value={values.wake_up_time} />
                        <SummaryItem label="Dormir" value={values.sleep_time} />
                        <SummaryItem label="Desayuno" value={values.breakfast_time ? `${values.breakfast_time} - ${values.breakfast_details || ''}` : 'N/A'} />
                        <SummaryItem label="Almuerzo" value={values.lunch_time ? `${values.lunch_time} - ${values.lunch_details || ''}` : 'N/A'} />
                        <SummaryItem label="Cena" value={values.dinner_time ? `${values.dinner_time} - ${values.dinner_details || ''}` : 'N/A'} />
                        <SummaryItem label="Snacks" value={values.snack_details} />
                        <SummaryItem label="Prep. Preferida" value={values.prep_preference} />
                        <SummaryItem label="Sabor Preferido" value={values.taste_preference} />
                    </div>
                </section>
            </div>
        </>
    );

    if (hideWrapper) return <div className="bg-[#151F32]">{SummaryContent}</div>;

    return (
        <Card className="rounded-[3rem] shadow-2xl border-white/5 bg-[#151F32] overflow-hidden">
            {SummaryContent}
        </Card>
    );
}

function SummaryItem({ label, value, className }: { label: string, value: any, className?: string }) {
    return (
        <div className={cn("space-y-2 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/[0.04] transition-all", className)}>
            <p className="text-[10px] uppercase font-black tracking-tighter text-slate-500">{label}</p>
            <p className="text-white font-medium text-sm leading-relaxed">{value || 'No registrado'}</p>
        </div>
    );
}

function getStepTitle(step: number) {
    const titles = [
        "Identidad y Datos Personales",
        "Objetivo y Experiencia Previa",
        "Mediciones Corporales",
        "Salud y Antecedentes",
        "Actividad Física",
        "Hábitos Fisiológicos",
        "Alimentación y Cocina",
        "Lácteos y Suplementación",
        "Aversiones Alimentarias",
        "Lifestyle y Horarios"
    ];
    return titles[step - 1];
}

function PersonalData({ form }: { form: any }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <FormField control={form.control} name="full_name" render={({ field }) => (
                <FormItem><FormLabel>Nombres y Apellidos</FormLabel><FormControl><Input {...field} className="h-12 rounded-xl bg-white/5 border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="dni" render={({ field }) => (
                <FormItem><FormLabel>DNI o Carnet de Extranjería</FormLabel><FormControl><Input {...field} className="h-12 rounded-xl bg-white/5 border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="email" render={({ field }) => (
                <FormItem><FormLabel>Correo Electrónico</FormLabel><FormControl><Input {...field} className="h-12 rounded-xl bg-white/5 border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="gender" render={({ field }) => (
                <FormItem><FormLabel>Género</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                        <FormControl><SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 text-white"><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                        <SelectContent className="bg-[#151F32] border-white/10 text-white">
                            <SelectItem value="Masculino">Masculino</SelectItem>
                            <SelectItem value="Femenino">Femenino</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage /></FormItem>
            )} />
            <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="age" render={({ field }) => (
                    <FormItem><FormLabel>Edad</FormLabel><FormControl><Input type="number" {...field} readOnly className="h-12 rounded-xl bg-white/5 border-white/10 text-white opacity-70 cursor-not-allowed" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="birth_date" render={({ field }) => (
                    <FormItem><FormLabel>Fecha Nacimiento</FormLabel><FormControl><Input type="date" {...field} className="h-12 rounded-xl bg-white/5 border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                )} />
            </div>
            <FormField control={form.control} name="instagram" render={({ field }) => (
                <FormItem><FormLabel>Instagram (Opcional)</FormLabel><FormControl><Input {...field} placeholder="@usuario" className="h-12 rounded-xl bg-white/5 border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="education_level" render={({ field }) => (
                <FormItem><FormLabel>Grado de Instrucción</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 text-white"><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                        <SelectContent className="bg-[#151F32] border-white/10 text-white">
                            <SelectItem value="secundaria_incompleta">Secundaria en curso o incompleta</SelectItem>
                            <SelectItem value="tecnico">Técnico</SelectItem>
                            <SelectItem value="superior_incompleta">Superior en curso o incompleta</SelectItem>
                            <SelectItem value="superior">Superior</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="region" render={({ field }) => (
                <FormItem><FormLabel>Región o Estado</FormLabel><FormControl><Input {...field} className="h-12 rounded-xl bg-white/5 border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="district" render={({ field }) => (
                <FormItem><FormLabel>Distrito</FormLabel><FormControl><Input {...field} className="h-12 rounded-xl bg-white/5 border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="occupation" render={({ field }) => (
                <FormItem><FormLabel>¿A qué te dedicas?</FormLabel><FormControl><Input {...field} placeholder="Puesto de trabajo / Empresa" className="h-12 rounded-xl bg-white/5 border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="job_details" render={({ field }) => (
                <FormItem><FormLabel>Ocupación Específica</FormLabel>
                    <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
                            <div className="flex items-center space-x-2 bg-white/5 p-3 rounded-xl border border-white/5 hover:border-nutri-brand/30 transition-colors">
                                <RadioGroupItem value="presencial" id="job-presencial" />
                                <Label htmlFor="job-presencial" className="text-white cursor-pointer">Jornada completa presencial</Label>
                            </div>
                            <div className="flex items-center space-x-2 bg-white/5 p-3 rounded-xl border border-white/5 hover:border-nutri-brand/30 transition-colors">
                                <RadioGroupItem value="remoto" id="job-remoto" />
                                <Label htmlFor="job-remoto" className="text-white cursor-pointer">Jornada completa remoto</Label>
                            </div>
                            <div className="flex items-center space-x-2 bg-white/5 p-3 rounded-xl border border-white/5 hover:border-nutri-brand/30 transition-colors">
                                <RadioGroupItem value="casa" id="job-casa" />
                                <Label htmlFor="job-casa" className="text-white cursor-pointer">Labores de casa</Label>
                            </div>
                            <div className="flex items-center space-x-2 bg-white/5 p-3 rounded-xl border border-white/5 hover:border-nutri-brand/30 transition-colors">
                                <RadioGroupItem value="estudiante" id="job-estudiante" />
                                <Label htmlFor="job-estudiante" className="text-white cursor-pointer">Estudiante</Label>
                            </div>
                        </RadioGroup>
                    </FormControl>
                    <FormMessage /></FormItem>
            )} />
        </div>
    );
}

function GoalExperience({ form }: { form: any }) {
    const goals = [
        "Reducir grasa corporal, peso y medidas",
        "Aumento de la masa muscular",
        "Recomposición Corporal (Aumento de músculo y reducir grasa)",
        "Mejorar tu salud y alimentación (diabetes, hígado graso, resistencia a la insulina, SOP, hipotiroidismo, anemía)"
    ];

    const prevServices = [
        { label: "Sí, otros nutricionistas", value: "yes_pro" },
        { label: "Sí, aunque no eran profesionales de la nutrición", value: "yes_non_pro" },
        { label: "Nunca", value: "never" }
    ];

    return (
        <div className="space-y-12">
            <FormField control={form.control} name="nutritional_goal" render={({ field }) => (
                <FormItem><FormLabel className="text-lg">¿Cuál es tu objetivo nutricional?</FormLabel>
                    <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-1 gap-4 mt-4">
                            {goals.map((goal) => (
                                <div key={goal} className="flex items-center space-x-3 bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-nutri-brand/30 transition-all cursor-pointer">
                                    <RadioGroupItem value={goal} id={goal} />
                                    <Label htmlFor={goal} className="text-white font-medium cursor-pointer leading-tight">{goal}</Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </FormControl>
                    <FormMessage /></FormItem>
            )} />

            <FormField control={form.control} name="previous_nutrition_service" render={({ field }) => (
                <FormItem><FormLabel className="text-lg">¿Te has atendido en algún servicio de nutrición?</FormLabel>
                    <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                            {prevServices.map((service) => (
                                <div key={service.value} className="flex items-center space-x-3 bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-nutri-brand/30 transition-all cursor-pointer">
                                    <RadioGroupItem value={service.value} id={service.value} />
                                    <Label htmlFor={service.value} className="text-white font-medium cursor-pointer leading-tight">{service.label}</Label>
                                </div>
                            ))}
                        </RadioGroup>
                    </FormControl>
                    <FormMessage /></FormItem>
            )} />

            {(form.watch('previous_nutrition_service') === 'yes_pro' || form.watch('previous_nutrition_service') === 'yes_non_pro') && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8 bg-nutri-brand/5 rounded-[2rem] border border-nutri-brand/10 animate-in fade-in slide-in-from-top-4 duration-500">
                    <FormField control={form.control} name="previous_experience_rating" render={({ field }) => (
                        <FormItem><FormLabel>¿Cómo calificarías esa experiencia?</FormLabel><FormControl><Input {...field} className="h-12 rounded-xl bg-white/5 border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="time_following_plan" render={({ field }) => (
                        <FormItem><FormLabel>¿Por cuánto tiempo has seguido el plan?</FormLabel><FormControl><Input {...field} className="h-12 rounded-xl bg-white/5 border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
            )}
        </div>
    );
}

function Measurements({ form, patientId, setIsUploadingPhoto }: { form: any, patientId: string, setIsUploadingPhoto: (v: boolean) => void }) {
    const supabase = createClient();
    const { toast } = useToast();
    const [uploading, setUploading] = useState<string | null>(null);
    const [statusText, setStatusText] = useState("Subiendo...");

    const PHOTO_TYPES = [
        { id: 'front_photo_url', label: 'Frente' },
        { id: 'side_photo_1_url', label: 'Costado 1' },
        { id: 'side_photo_2_url', label: 'Costado 2' },
        { id: 'back_photo_url', label: 'Espalda' }
    ];

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, typeId: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(typeId);
        setIsUploadingPhoto(true);
        setStatusText("Procesando silueta con IA...");

        try {
            // Dar tiempo al navegador para renderizar el spinner antes de bloquear el hilo principal
            await new Promise(resolve => setTimeout(resolve, 150));

            const worker = new Worker(new URL('../../../lib/workers/bg-removal.worker.ts', import.meta.url), { type: 'module' });

            const processedBlob = await new Promise<Blob>((resolve, reject) => {
                worker.onmessage = (event) => {
                    if (event.data.success) {
                        resolve(event.data.blob);
                    } else {
                        reject(new Error(event.data.error));
                    }
                    worker.terminate();
                };
                worker.onerror = (error) => {
                    reject(error);
                    worker.terminate();
                };
                worker.postMessage({ file, typeId });
            });

            const processedFile = new File([processedBlob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: "image/jpeg" });

            setStatusText("Subiendo a la nube...");
            const fileExt = "jpg";
            const fileName = `${patientId}/${Date.now()}_${typeId}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('progress-photos')
                .upload(fileName, processedFile, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('progress-photos')
                .getPublicUrl(fileName);

            form.setValue(typeId, publicUrl);
            toast({ title: "Foto subida y procesada correctamente", variant: "default" });
        } catch (error: any) {
            toast({ title: "Error al subir foto", description: error.message, variant: "destructive" });
        } finally {
            setUploading(null);
            setIsUploadingPhoto(false);
            setStatusText("Subiendo...");
        }
    };

    const handleRemove = (typeId: string) => {
        form.setValue(typeId, "");
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <FormField control={form.control} name="weight_kg" render={({ field }) => (
                <FormItem><FormLabel>Peso (Kg) (Opcional)</FormLabel><FormControl><Input type="number" step="0.1" {...field} className="h-14 text-lg font-black rounded-xl bg-white/5 border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="height_cm" render={({ field }) => (
                <FormItem><FormLabel>Talla (cm)</FormLabel><FormControl><Input type="number" {...field} className="h-14 text-lg font-black rounded-xl bg-white/5 border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="waist_cm" render={({ field }) => (
                <FormItem><FormLabel>Cintura (cm) (Opcional)</FormLabel><FormControl><Input type="number" step="0.1" {...field} className="h-14 text-lg font-black rounded-xl bg-white/5 border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
            )} />
            <div className="col-span-full bg-white/5 p-6 rounded-[2rem] border border-dashed border-white/10">
                <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-3">
                        <Camera className="h-6 w-6 text-nutri-brand" />
                        <h4 className="font-tech font-bold text-white uppercase tracking-widest text-sm">Fotos de Progreso (Opcional)</h4>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                        {PHOTO_TYPES.map(type => {
                            const currentUrl = form.watch(type.id);
                            const isUploading = uploading === type.id;

                            return (
                                <div key={type.id} className="flex flex-col gap-2">
                                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-500 text-center">{type.label}</span>
                                    <div className="relative h-40 w-full rounded-2xl border-2 border-dashed border-white/10 bg-white/5 overflow-hidden group hover:border-nutri-brand/30 transition-all flex items-center justify-center">
                                        {isUploading ? (
                                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-nutri-brand">
                                                <Loader2 className="h-6 w-6 animate-spin mb-2" />
                                                <span className="text-[9px] font-black uppercase tracking-widest text-center px-1">{statusText}</span>
                                            </div>
                                        ) : currentUrl && currentUrl !== "" ? (
                                            <>
                                                <img src={currentUrl} alt={type.label} className="w-full h-full object-contain" />
                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemove(type.id)}
                                                        className="bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-xl transition-colors shadow-lg"
                                                    >
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </>
                                        ) : (
                                            <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-colors text-slate-400">
                                                <Upload className="h-6 w-6 mb-2 text-nutri-brand opacity-80" />
                                                <span className="text-[9px] font-black uppercase tracking-widest px-4 text-center">Subir Foto</span>
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e) => handleUpload(e, type.id)}
                                                />
                                            </label>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

function HealthStatus({ form }: { form: any }) {
    const conditions = ["Anemia", "Hipotiriodismo", "Gastritis", "Estreñimiento", "SOP", "Osteoporosis", "Grasa en la sangre", "Presión alta", "Glucosa alta"];
    return (
        <div className="space-y-10">
            <FormField control={form.control} name="health_conditions" render={() => (
                <FormItem>
                    <FormLabel className="text-lg font-bold text-white uppercase tracking-widest">¿Presentas algunas de estas condiciones?</FormLabel>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                        {conditions.map((item) => (
                            <FormField key={item} control={form.control} name="health_conditions" render={({ field }) => (
                                <FormItem className="flex items-center space-x-3 space-y-0 bg-white/5 p-3 rounded-xl border border-white/5">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value?.includes(item)}
                                            onCheckedChange={(checked: boolean) => {
                                                const current = (field.value as string[]) || [];
                                                return checked ? field.onChange([...current, item]) : field.onChange(current.filter((value: string) => value !== item));
                                            }}
                                        />
                                    </FormControl>
                                    <FormLabel className="font-medium text-slate-300 cursor-pointer">{item}</FormLabel>
                                </FormItem>
                            )} />
                        ))}
                    </div>
                </FormItem>
            )} />

            <FormField control={form.control} name="family_history" render={() => (
                <FormItem>
                    <FormLabel className="text-lg font-bold text-white uppercase tracking-widest">Antecedentes Familiares (Padre, madre, abuelos)</FormLabel>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
                        {["Diabetes", "Hipertensión", "Cáncer", "Obesidad", "Enfermedades del corazón"].map((item) => (
                            <FormField key={item} control={form.control} name="family_history" render={({ field }) => (
                                <FormItem className="flex items-center space-x-3 space-y-0 bg-white/5 p-3 rounded-xl border border-white/5">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value?.includes(item)}
                                            onCheckedChange={(checked: boolean) => {
                                                const current = (field.value as string[]) || [];
                                                return checked ? field.onChange([...current, item]) : field.onChange(current.filter((value: string) => value !== item));
                                            }}
                                        />
                                    </FormControl>
                                    <FormLabel className="font-medium text-slate-300 cursor-pointer">{item}</FormLabel>
                                </FormItem>
                            )} />
                        ))}
                    </div>
                </FormItem>
            )} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <FormField control={form.control} name="takes_medication" render={({ field }) => (
                    <FormItem><FormLabel>¿Consumes algún medicamento?</FormLabel>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-8">
                            <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="med-yes" /><Label htmlFor="med-yes" className="text-white">Sí</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="med-no" /><Label htmlFor="med-no" className="text-white">No</Label></div>
                        </RadioGroup>
                        <FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="recent_lab_tests" render={({ field }) => (
                    <FormItem><FormLabel>¿Te haz realizado exámenes de laboratorio (3 meses)?</FormLabel>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-8">
                            <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="lab-yes" /><Label htmlFor="lab-yes" className="text-white">Sí</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="lab-no" /><Label htmlFor="lab-no" className="text-white">No</Label></div>
                        </RadioGroup>
                        <FormMessage /></FormItem>
                )} />
            </div>

            {form.watch('takes_medication') === 'yes' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-white/5 rounded-3xl border border-white/5">
                    <FormField control={form.control} name="medication_details" render={({ field }) => (
                        <FormItem><FormLabel>¿Qué tipo de medicamento?</FormLabel><FormControl><Input {...field} className="h-12 rounded-xl bg-white/5 border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="medication_frequency" render={({ field }) => (
                        <FormItem><FormLabel>¿Frecuencia y horarios?</FormLabel><FormControl><Input {...field} className="h-12 rounded-xl bg-white/5 border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
            )}
        </div>
    );
}

function ActivityExercise({ form }: { form: any }) {
    const days = ["L", "M", "Mi", "J", "V", "S", "D"];
    return (
        <div className="space-y-10">
            <FormField control={form.control} name="activity_level" render={({ field }) => (
                <FormItem><FormLabel className="text-lg font-bold text-white uppercase tracking-widest">¿Cómo es tu actividad diaria?</FormLabel>
                    <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="grid grid-cols-1 gap-4 mt-4">
                            <div className="flex items-center space-x-3 bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-nutri-brand/30 transition-all cursor-pointer">
                                <RadioGroupItem value="moderada" id="act-moderada" />
                                <Label htmlFor="act-moderada" className="text-white font-medium cursor-pointer">Moderada (camino 9000 pasos)</Label>
                            </div>
                            <div className="flex items-center space-x-3 bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-nutri-brand/30 transition-all cursor-pointer">
                                <RadioGroupItem value="leve" id="act-leve" />
                                <Label htmlFor="act-leve" className="text-white font-medium cursor-pointer">Leve (camino 6000 pasos)</Label>
                            </div>
                            <div className="flex items-center space-x-3 bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-nutri-brand/30 transition-all cursor-pointer">
                                <RadioGroupItem value="sedentaria" id="act-sedentaria" />
                                <Label htmlFor="act-sedentaria" className="text-white font-medium cursor-pointer">Sedentaria (menor o igual 3000 pasos)</Label>
                            </div>
                        </RadioGroup>
                    </FormControl>
                    <FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="work_schedule" render={({ field }) => (
                <FormItem><FormLabel>Horario de trabajo (Días y horas) (Opcional)</FormLabel><FormControl><Input {...field} placeholder="L-V 8am-6pm" className="h-12 rounded-xl bg-white/5 border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="does_exercise" render={({ field }) => (
                <FormItem><FormLabel className="text-lg font-bold text-white uppercase tracking-widest">¿Actualmente realizas ejercicio?</FormLabel>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-8 mt-2">
                        <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="exe-yes" /><Label htmlFor="exe-yes" className="text-white">Sí</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="exe-no" /><Label htmlFor="exe-no" className="text-white">No</Label></div>
                    </RadioGroup>
                    <FormMessage /></FormItem>
            )} />

            {form.watch('does_exercise') === 'yes' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-top-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FormField control={form.control} name="exercise_duration" render={({ field }) => (
                            <FormItem><FormLabel>¿Cuánto tiempo de ejercicio realizas?</FormLabel><FormControl><Input {...field} placeholder="Ej: 1 hora" className="h-12 rounded-xl bg-white/5 border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="exercise_time" render={({ field }) => (
                            <FormItem><FormLabel>¿A qué hora sueles entrenar?</FormLabel><FormControl><Input type="time" {...field} className="h-12 rounded-xl bg-white/5 border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>

                    <FormField control={form.control} name="exercise_types" render={() => (
                        <FormItem>
                            <FormLabel className="text-sm font-bold text-slate-400">¿Qué tipo de ejercicio realizas?</FormLabel>
                            <div className="flex flex-wrap gap-3 mt-3">
                                {["Pesas", "Funcional", "Crossfit", "Natación", "Ciclismo", "Correr", "Yoga", "Pilates"].map((item) => (
                                    <FormField key={item} control={form.control} name="exercise_types" render={({ field }) => (
                                        <FormItem className="flex items-center space-x-2 space-y-0 bg-white/5 p-3 rounded-xl border border-white/5">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value?.includes(item)}
                                                    onCheckedChange={(checked: boolean) => {
                                                        const current = (field.value as string[]) || [];
                                                        return checked ? field.onChange([...current, item]) : field.onChange(current.filter((value: string) => value !== item));
                                                    }}
                                                />
                                            </FormControl>
                                            <FormLabel className="font-medium text-slate-300 cursor-pointer">{item}</FormLabel>
                                        </FormItem>
                                    )} />
                                ))}
                            </div>
                        </FormItem>
                    )} />

                    <FormField control={form.control} name="exercise_days" render={() => (
                        <FormItem>
                            <FormLabel className="text-sm font-bold text-slate-400">¿Qué días sueles entrenar?</FormLabel>
                            <div className="flex gap-2 mt-3">
                                {["L", "Ma", "Mi", "J", "V", "S", "D"].map((item) => (
                                    <FormField key={item} control={form.control} name="exercise_days" render={({ field }) => (
                                        <FormItem className="flex-1 space-y-0">
                                            <FormControl>
                                                <div
                                                    onClick={() => {
                                                        const current = (field.value as string[]) || [];
                                                        const exists = current.includes(item);
                                                        field.onChange(exists ? current.filter(v => v !== item) : [...current, item]);
                                                    }}
                                                    className={cn(
                                                        "h-12 rounded-xl border flex items-center justify-center font-black cursor-pointer transition-all",
                                                        field.value?.includes(item) ? "bg-nutri-brand border-nutri-brand text-white" : "bg-white/5 border-white/10 text-slate-500"
                                                    )}
                                                >
                                                    {item}
                                                </div>
                                            </FormControl>
                                        </FormItem>
                                    )} />
                                ))}
                            </div>
                        </FormItem>
                    )} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FormField control={form.control} name="has_calorie_tracker" render={({ field }) => (
                            <FormItem><FormLabel>¿Cuentas con un contador de calorías?</FormLabel>
                                <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-8 mt-2">
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="cal-yes" /><Label htmlFor="cal-yes" className="text-white">Sí</Label></div>
                                    <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="cal-no" /><Label htmlFor="cal-no" className="text-white">No</Label></div>
                                </RadioGroup>
                                <FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="calorie_expenditure_details" render={({ field }) => (
                            <FormItem><FormLabel>Detalle de gasto calórico (Opcional)</FormLabel><FormControl><Input {...field} placeholder="Ej: 500 kcal por sesión" className="h-12 rounded-xl bg-white/5 border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                </div>
            )}
        </div>
    );
}

function Habits({ form }: { form: any }) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <FormField control={form.control} name="appetite_level" render={({ field }) => (
                <FormItem><FormLabel>¿Cómo está tu apetito?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 text-white"><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                        <SelectContent className="bg-[#151F32] border-white/10 text-white">
                            <SelectItem value="bajo">Bajo</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="aumentado">Aumentado</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage /></FormItem>
            )} />

            <FormField control={form.control} name="appetite_peak_time" render={() => (
                <FormItem className="col-span-full">
                    <FormLabel className="text-sm font-bold text-slate-400">¿En qué momento del día sientes más hambre?</FormLabel>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                        {["Mañana", "Tarde", "Noche", "Todo el día", "Madrugada"].map((item) => (
                            <FormField key={item} control={form.control} name="appetite_peak_time" render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0 bg-white/5 p-3 rounded-xl border border-white/5">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value?.includes(item)}
                                            onCheckedChange={(checked: boolean) => {
                                                const current = (field.value as string[]) || [];
                                                return checked ? field.onChange([...current, item]) : field.onChange(current.filter((value: string) => value !== item));
                                            }}
                                        />
                                    </FormControl>
                                    <FormLabel className="font-medium text-slate-300 cursor-pointer">{item}</FormLabel>
                                </FormItem>
                            )} />
                        ))}
                    </div>
                </FormItem>
            )} />
            <FormField control={form.control} name="thirst_level" render={({ field }) => (
                <FormItem><FormLabel>¿Cómo está tu sed?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 text-white"><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                        <SelectContent className="bg-[#151F32] border-white/10 text-white">
                            <SelectItem value="bajo">Bajo</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="aumentado">Aumentado</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="water_intake" render={({ field }) => (
                <FormItem><FormLabel>¿Qué cantidad de agua consumes en el día?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 text-white"><SelectValue placeholder="Seleccionar cantidad" /></SelectTrigger></FormControl>
                        <SelectContent className="bg-[#151F32] border-white/10 text-white">
                            <SelectItem value="250-500">1-2 vasos de agua (250-500mL)</SelectItem>
                            <SelectItem value="750-1000">3-4 vasos de agua (750mL-1L)</SelectItem>
                            <SelectItem value="1250-1500">5-6 vasos de agua (1250-1500mL)</SelectItem>
                            <SelectItem value="1750-2000">7-8 vasos de agua (1750 mL-2L)</SelectItem>
                            <SelectItem value="2250-2500">9-10 vasos de agua (2250mL-2500mL)</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="sleep_quality" render={({ field }) => (
                <FormItem><FormLabel>¿Cómo está actualmente tu sueño?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 text-white"><SelectValue placeholder="Seleccionar estado" /></SelectTrigger></FormControl>
                        <SelectContent className="bg-[#151F32] border-white/10 text-white">
                            <SelectItem value="disminuido">Disminuido</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="aumentado">Aumentado</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="sleep_hours" render={({ field }) => (
                <FormItem><FormLabel>¿Cuántas horas duermes usualmente?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 text-white"><SelectValue placeholder="Seleccionar horas" /></SelectTrigger></FormControl>
                        <SelectContent className="bg-[#151F32] border-white/10 text-white">
                            <SelectItem value="less_5">Menos de 5 horas</SelectItem>
                            <SelectItem value="5">5 horas</SelectItem>
                            <SelectItem value="6">6 horas</SelectItem>
                            <SelectItem value="7">7 horas</SelectItem>
                            <SelectItem value="8">8 horas</SelectItem>
                            <SelectItem value="9_plus">9 a más horas</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="bowel_movements" render={({ field }) => (
                <FormItem><FormLabel>¿Cómo están tus deposiciones?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 text-white"><SelectValue placeholder="Seleccionar estado" /></SelectTrigger></FormControl>
                        <SelectContent className="bg-[#151F32] border-white/10 text-white">
                            <SelectItem value="disminuido">Disminuido</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="aumentado">Aumentado</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="bowel_frequency" render={({ field }) => (
                <FormItem><FormLabel>¿Con qué frecuencia realizas deposiciones?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 text-white"><SelectValue placeholder="Seleccionar frecuencia" /></SelectTrigger></FormControl>
                        <SelectContent className="bg-[#151F32] border-white/10 text-white">
                            <SelectItem value="1_dia">1 vez en el día</SelectItem>
                            <SelectItem value="2_dia">2 veces en el día</SelectItem>
                            <SelectItem value="3_dia">3 veces en el día</SelectItem>
                            <SelectItem value="cada_2_dias">Cada 2 días</SelectItem>
                            <SelectItem value="cada_3_dias">Cada 3 días</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="urine_status" render={({ field }) => (
                <FormItem><FormLabel>¿Cómo está tu orina?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 text-white"><SelectValue placeholder="Seleccionar estado" /></SelectTrigger></FormControl>
                        <SelectContent className="bg-[#151F32] border-white/10 text-white">
                            <SelectItem value="disminuido">Disminuido</SelectItem>
                            <SelectItem value="normal">Normal</SelectItem>
                            <SelectItem value="aumentado">Aumentado</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="urine_color_index" render={({ field }) => (
                <FormItem className="col-span-full bg-white/5 p-8 rounded-[2rem] border border-white/5">
                    <FormLabel className="text-lg mb-6 block">Índice de color de orina (1-8)</FormLabel>
                    <FormControl>
                        <RadioGroup
                            onValueChange={(val) => field.onChange(parseInt(val))}
                            defaultValue={field.value?.toString()}
                            className="flex flex-wrap items-center justify-between gap-4"
                        >
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
                                <div key={item.id} className="flex flex-col items-center gap-3">
                                    <RadioGroupItem value={item.id.toString()} id={`u-${item.id}`} className="sr-only" />
                                    <Label
                                        htmlFor={`u-${item.id}`}
                                        className={cn(
                                            "w-12 h-12 rounded-full cursor-pointer border-4 transition-all hover:scale-110",
                                            field.value === item.id ? "border-nutri-brand scale-110 ring-4 ring-nutri-brand/20" : "border-white/10"
                                        )}
                                        style={{ backgroundColor: item.color }}
                                    />
                                    <span className="text-xs font-bold text-slate-500">{item.id}</span>
                                </div>
                            ))}
                        </RadioGroup>
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-white/5">
                <FormField control={form.control} name="disliked_vegetables" render={({ field }) => (
                    <FormItem><FormLabel>Vegetales que no te agradan</FormLabel><FormControl><Input {...field} placeholder="Ej: Cebolla, Brócoli" className="h-12 rounded-xl bg-white/5 border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="disliked_fruits" render={({ field }) => (
                    <FormItem><FormLabel>Frutas que no te agradan</FormLabel><FormControl><Input {...field} placeholder="Ej: Papaya, Melón" className="h-12 rounded-xl bg-white/5 border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                )} />
            </div>

            <FormField control={form.control} name="disliked_preparations" render={({ field }) => (
                <FormItem><FormLabel>Preparaciones que no te agradan</FormLabel><FormControl><Input {...field} placeholder="Ej: Guisos, Ensaladas crudas" className="h-12 rounded-xl bg-white/5 border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
            )} />
        </div>
    );
}

function DietCooking({ form }: { form: any }) {
    return (
        <div className="space-y-10">
            <FormField control={form.control} name="available_instruments" render={() => (
                <FormItem>
                    <FormLabel className="text-lg font-bold text-white uppercase tracking-widest">¿Cuentas con algunos de estos instrumentos?</FormLabel>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
                        {["Balanza de alimentos", "Balanza corporal", "Cinta métrica", "Air fryer", "Licuadora"].map((item) => (
                            <FormField key={item} control={form.control} name="available_instruments" render={({ field }) => (
                                <FormItem className="flex items-center space-x-3 space-y-0 bg-white/5 p-3 rounded-xl border border-white/5">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value?.includes(item)}
                                            onCheckedChange={(checked: boolean) => {
                                                const current = (field.value as string[]) || [];
                                                return checked ? field.onChange([...current, item]) : field.onChange(current.filter((value: string) => value !== item));
                                            }}
                                        />
                                    </FormControl>
                                    <FormLabel className="font-medium text-slate-300 cursor-pointer">{item}</FormLabel>
                                </FormItem>
                            )} />
                        ))}
                    </div>
                </FormItem>
            )} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField control={form.control} name="specific_diet_type" render={({ field }) => (
                    <FormItem><FormLabel>¿Tienes algún tipo de alimentación específica?</FormLabel><FormControl><Input {...field} placeholder="Ej: Vegano, Keto, etc." className="h-12 rounded-xl bg-white/5 border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="cooks_for_self" render={({ field }) => (
                    <FormItem><FormLabel>¿Quién prepara tu comida?</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 text-white"><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                            <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                <SelectItem value="yo_mismo">Yo mism@</SelectItem>
                                <SelectItem value="pareja">Pareja</SelectItem>
                                <SelectItem value="mama">Mamá</SelectItem>
                                <SelectItem value="restaurante">Restaurante</SelectItem>
                                <SelectItem value="otros">Otros</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage /></FormItem>
                )} />
            </div>

            <FormField control={form.control} name="likes_cooking" render={({ field }) => (
                <FormItem><FormLabel>¿Te gusta cocinar?</FormLabel>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-8 mt-2">
                        <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="cook-yes" /><Label htmlFor="cook-yes" className="text-white">Sí</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="cook-no" /><Label htmlFor="cook-no" className="text-white">No</Label></div>
                    </RadioGroup>
                    <FormMessage /></FormItem>
            )} />

            {form.watch('likes_cooking') === 'yes' && (
                <FormField control={form.control} name="cooking_preparations" render={({ field }) => (
                    <FormItem><FormLabel>¿Qué preparaciones sueles realizar?</FormLabel><FormControl><Input {...field} className="h-12 rounded-xl bg-white/5 border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                )} />
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-6 border-t border-white/5">
                <FormField control={form.control} name="food_allergies" render={({ field }) => (
                    <FormItem><FormLabel>¿Tienes alergia a algún alimento?</FormLabel><FormControl><Input {...field} placeholder="Ej: Maní, Mariscos" className="h-12 rounded-xl bg-white/5 border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="food_intolerances" render={({ field }) => (
                    <FormItem><FormLabel>¿Eres intolerante a algún alimento?</FormLabel>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-8 mt-2">
                            <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="int-yes" /><Label htmlFor="int-yes" className="text-white">Sí</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="int-no" /><Label htmlFor="int-no" className="text-white">No</Label></div>
                        </RadioGroup>
                        <FormMessage /></FormItem>
                )} />
            </div>

            {form.watch('food_intolerances') === 'yes' && (
                <FormField control={form.control} name="intolerance_details" render={({ field }) => (
                    <FormItem><FormLabel>Especifica a qué eres intolerante</FormLabel><FormControl><Input {...field} className="h-12 rounded-xl bg-white/5 border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                )} />
            )}
        </div>
    );
}

function DairySupplements({ form }: { form: any }) {
    return (
        <div className="space-y-10">
            <FormField control={form.control} name="dairy_consumption" render={({ field }) => (
                <FormItem><FormLabel>¿Qué lácteo consumes?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 text-white"><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                        <SelectContent className="bg-[#151F32] border-white/10 text-white">
                            <SelectItem value="ninguno">Ninguno</SelectItem>
                            <SelectItem value="leche">Leche</SelectItem>
                            <SelectItem value="yogurt">Yogurt</SelectItem>
                            <SelectItem value="queso">Queso</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage /></FormItem>
            )} />

            {form.watch('dairy_consumption') !== 'ninguno' && (
                <FormField control={form.control} name="dairy_brands" render={({ field }) => (
                    <FormItem><FormLabel>Especifica la marca y tipo de los lácteos</FormLabel><FormControl><Input {...field} placeholder="Ej: Gloria Light, Laive Sin Lactosa" className="h-12 rounded-xl bg-white/5 border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                )} />
            )}

            <FormField control={form.control} name="supplements_consumption" render={({ field }) => (
                <FormItem><FormLabel>¿Consumes suplementos?</FormLabel>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-8 mt-2">
                        <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="sup-yes" /><Label htmlFor="sup-yes" className="text-white">Sí</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="sup-no" /><Label htmlFor="sup-no" className="text-white">No</Label></div>
                    </RadioGroup>
                    <FormMessage /></FormItem>
            )} />

            {form.watch('supplements_consumption') === 'yes' && (
                <FormField control={form.control} name="supplement_types" render={() => (
                    <FormItem>
                        <FormLabel className="text-sm font-bold text-slate-400">¿Qué tipo de suplemento consumes?</FormLabel>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                            {["Whey Protein", "Creatina", "Multivitamínico", "Magnesio", "Omega 3", "Colágeno", "Pre-entreno", "BCAA"].map((item) => (
                                <FormField key={item} control={form.control} name="supplement_types" render={({ field }) => (
                                    <FormItem className="flex items-center space-x-2 space-y-0 bg-white/5 p-3 rounded-xl border border-white/5">
                                        <FormControl>
                                            <Checkbox
                                                checked={field.value?.includes(item)}
                                                onCheckedChange={(checked: boolean) => {
                                                    const current = (field.value as string[]) || [];
                                                    return checked ? field.onChange([...current, item]) : field.onChange(current.filter((value: string) => value !== item));
                                                }}
                                            />
                                        </FormControl>
                                        <FormLabel className="font-medium text-slate-300 cursor-pointer">{item}</FormLabel>
                                    </FormItem>
                                )} />
                            ))}
                        </div>
                    </FormItem>
                )} />
            )}
        </div>
    );
}

function Dislikes({ form }: { form: any }) {
    const categories = [
        {
            name: 'disliked_cereals',
            label: '¿Qué cereales NO TE AGRADAN?',
            options: ['Avena', 'Quinua', 'Pan', 'Trigo', 'Arroz', 'Fideos', 'Choclo', 'Me gustan todos los cereales']
        },
        {
            name: 'disliked_tubers',
            label: '¿Qué tubérculos NO TE AGRADAN?',
            options: ['Papa', 'Camote', 'Yuca', 'Olluco', 'Me gustan todos los tubérculos']
        },
        {
            name: 'disliked_legumes',
            label: '¿Qué Menestras NO TE AGRADAN?',
            options: ['Garbanzos', 'Pallares', 'Frejoles', 'Habas', 'Lentejas', 'Me gustan todas las menestras']
        },
        {
            name: 'disliked_meats',
            label: '¿Qué carnes o derivados NO TE AGRADAN?',
            options: ['Res', 'Pollo', 'Pescado', 'Pavita', 'Hígado', 'Mondongo', 'Corazón', 'No consumo Carnes']
        },
        {
            name: 'disliked_fats',
            label: '¿Qué grasas NO TE AGRADAN?',
            options: ['Aceite de oliva', 'Palta', 'Aceituna', 'Almendras', 'Nueces', 'Pecanas', 'Maní', 'Linaza', 'Chía', 'Me gustan todas las grasas']
        }
    ];

    return (
        <div className="space-y-12">
            {categories.map((cat) => (
                <FormField key={cat.name} control={form.control} name={cat.name as any} render={({ field }) => (
                    <FormItem className="space-y-4">
                        <FormLabel className="text-lg font-bold text-white uppercase tracking-wider">{cat.label}</FormLabel>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {cat.options.map((option) => (
                                <div key={option} className="flex items-center space-x-3 bg-white/5 p-3 rounded-xl border border-white/5 hover:border-nutri-brand/30 transition-all">
                                    <FormControl>
                                        <Checkbox
                                            checked={(field.value as string[] || []).includes(option)}
                                            onCheckedChange={(checked: boolean) => {
                                                const current = field.value as string[] || [];
                                                return checked
                                                    ? field.onChange([...current, option])
                                                    : field.onChange(current.filter((v: string) => v !== option));
                                            }}
                                        />
                                    </FormControl>
                                    <Label className="text-xs text-white cursor-pointer leading-tight">{option}</Label>
                                </div>
                            ))}
                        </div>
                    </FormItem>
                )} />
            ))}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/5">
                <FormField control={form.control} name="disliked_vegetables" render={({ field }) => (
                    <FormItem><FormLabel>¿QUÉ VEGETALES NO TE AGRADAN?</FormLabel><FormControl><Input {...field} className="h-12 rounded-xl bg-white/5 border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="disliked_fruits" render={({ field }) => (
                    <FormItem><FormLabel>¿QUÉ FRUTAS NO TE AGRADAN?</FormLabel><FormControl><Input {...field} className="h-12 rounded-xl bg-white/5 border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="disliked_preparations" render={({ field }) => (
                    <FormItem className="col-span-full"><FormLabel>¿QUÉ PREPARACIONES NO TE AGRADAN?</FormLabel><FormControl><Input {...field} className="h-12 rounded-xl bg-white/5 border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                )} />
            </div>
        </div>
    );
}

function Lifestyle({ form }: { form: any }) {
    return (
        <div className="space-y-10">
            <FormField control={form.control} name="previous_unhealthy_habits" render={() => (
                <FormItem>
                    <FormLabel className="text-lg font-bold text-white uppercase tracking-widest">¿Qué hábitos no saludables consumías antes?</FormLabel>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-4">
                        {["Gaseosas", "Dulces/Postres", "Alcohol", "Tabaco", "Comida rápida", "Frituras", "Exceso de sal", "Picoteo"].map((item) => (
                            <FormField key={item} control={form.control} name="previous_unhealthy_habits" render={({ field }) => (
                                <FormItem className="flex items-center space-x-2 space-y-0 bg-white/5 p-3 rounded-xl border border-white/5">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value?.includes(item)}
                                            onCheckedChange={(checked: boolean) => {
                                                const current = (field.value as string[]) || [];
                                                return checked ? field.onChange([...current, item]) : field.onChange(current.filter((value: string) => value !== item));
                                            }}
                                        />
                                    </FormControl>
                                    <FormLabel className="font-medium text-slate-300 cursor-pointer">{item}</FormLabel>
                                </FormItem>
                            )} />
                        ))}
                    </div>
                </FormItem>
            )} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-8 border-t border-white/5">
                <FormField control={form.control} name="wake_up_time" render={({ field }) => (
                    <FormItem><FormLabel>Hora despertar</FormLabel><FormControl><Input type="time" {...field} className="h-12 rounded-xl bg-white/5 border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="sleep_time" render={({ field }) => (
                    <FormItem><FormLabel>Hora dormir</FormLabel><FormControl><Input type="time" {...field} className="h-12 rounded-xl bg-white/5 border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                )} />
            </div>

            <div className="space-y-6 pt-6 border-t border-white/5">
                <h4 className="font-bold text-slate-400 uppercase tracking-widest text-xs">Detalle de Comidas Diarias</h4>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField control={form.control} name="breakfast_time" render={({ field }) => (
                        <FormItem><FormLabel>Hora Desayuno</FormLabel><FormControl><Input type="time" {...field} className="h-12 rounded-xl bg-white/5 border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="breakfast_details" render={({ field }) => (
                        <FormItem className="md:col-span-2"><FormLabel>¿Qué sueles desayunar?</FormLabel><FormControl><Input {...field} placeholder="Ej: Avena con frutas" className="h-12 rounded-xl bg-white/5 border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField control={form.control} name="lunch_time" render={({ field }) => (
                        <FormItem><FormLabel>Hora Almuerzo</FormLabel><FormControl><Input type="time" {...field} className="h-12 rounded-xl bg-white/5 border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="lunch_details" render={({ field }) => (
                        <FormItem className="md:col-span-2"><FormLabel>¿Qué sueles almorzar?</FormLabel><FormControl><Input {...field} placeholder="Ej: Pollo con arroz y ensalada" className="h-12 rounded-xl bg-white/5 border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField control={form.control} name="dinner_time" render={({ field }) => (
                        <FormItem><FormLabel>Hora Cena</FormLabel><FormControl><Input type="time" {...field} className="h-12 rounded-xl bg-white/5 border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="dinner_details" render={({ field }) => (
                        <FormItem className="md:col-span-2"><FormLabel>¿Qué sueles cenar?</FormLabel><FormControl><Input {...field} placeholder="Ej: Sopa de verduras" className="h-12 rounded-xl bg-white/5 border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>

                <FormField control={form.control} name="snack_details" render={({ field }) => (
                    <FormItem><FormLabel>Detalles de Media Mañana / Media Tarde</FormLabel><FormControl><Input {...field} placeholder="Ej: Fruta, frutos secos" className="h-12 rounded-xl bg-white/5 border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-8 border-t border-white/5">
                <FormField control={form.control} name="prep_preference" render={({ field }) => (
                    <FormItem><FormLabel>Preferencia preparación</FormLabel>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-8 mt-2">
                            <div className="flex items-center space-x-2"><RadioGroupItem value="faciles" id="p-e" /><Label htmlFor="p-e" className="text-white cursor-pointer">Fáciles</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="dificiles" id="p-h" /><Label htmlFor="p-h" className="text-white cursor-pointer">Difíciles</Label></div>
                        </RadioGroup>
                        <FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="taste_preference" render={({ field }) => (
                    <FormItem><FormLabel>Preferencia sabor</FormLabel>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-8 mt-2">
                            <div className="flex items-center space-x-2"><RadioGroupItem value="dulces" id="t-s" /><Label htmlFor="t-s" className="text-white cursor-pointer">Dulces</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="salados" id="t-a" /><Label htmlFor="t-a" className="text-white cursor-pointer">Salados</Label></div>
                        </RadioGroup>
                        <FormMessage /></FormItem>
                )} />
            </div>
        </div>
    );
}
