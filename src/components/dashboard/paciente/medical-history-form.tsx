"use client";

import { useState, useEffect, useCallback } from "react";
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
    Loader2, Upload, X, Plus, Download, Check
} from "lucide-react";
import Cropper from 'react-easy-crop';
import { getCroppedImg } from "@/lib/utils/crop-image";
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
    education_level: z.string().optional(),
    region: z.string().optional(),
    district: z.string().optional(),
    occupation: z.string().optional(),
    job_details: z.string().optional(),

    // Step 2: Objetivo y Experiencia
    nutritional_goal: z.string().optional(),
    previous_nutrition_service: z.string().optional(),
    previous_experience_rating: z.string().optional(),
    time_following_plan: z.string().optional(),

    // Step 3: Mediciones
    weight_kg: z.union([z.coerce.number().min(20, "Peso inválido"), z.literal("")]).optional(),
    height_cm: z.union([z.coerce.number().min(50, "Talla inválida"), z.literal("")]).optional(),
    waist_cm: z.union([z.coerce.number().min(30, "Medida de cintura inválida"), z.literal("")]).optional(),
    front_photo_url: z.string().optional(),
    side_photo_1_url: z.string().optional(),
    side_photo_2_url: z.string().optional(),
    back_photo_url: z.string().optional(),

    // Step 4: Estado de Salud
    health_conditions: z.preprocess((v) => Array.isArray(v) ? v : [], z.array(z.string()).default([])),
    family_history: z.preprocess((v) => Array.isArray(v) ? v : [], z.array(z.string()).default([])),
    takes_medication: z.preprocess((v) => typeof v === 'boolean' ? (v ? "yes" : "no") : v, z.string().optional()),
    medication_names: z.preprocess((v) => Array.isArray(v) ? v : (typeof v === 'string' && v.trim() !== "" ? v.split(', ').filter(Boolean) : []), z.array(z.string()).default([])),
    medication_details: z.string().optional(),
    medication_frequency: z.string().optional(),
    medication_schedule: z.string().optional(),
    recent_lab_tests: z.preprocess((v) => typeof v === 'boolean' ? (v ? "yes" : "no") : v, z.string().optional()),
    lab_test_documents: z.preprocess((v) => Array.isArray(v) ? v : [], z.array(z.string()).default([])),

    // Step 5: Actividad y Ejercicio
    activity_level: z.string().optional(),
    work_schedule: z.string().optional(),
    does_exercise: z.preprocess((v) => typeof v === 'boolean' ? (v ? "yes" : "no") : v, z.string().optional()),
    exercise_start_time: z.string().optional(), 
    exercise_duration: z.string().optional(),
    exercise_per_session: z.string().optional(),
    exercise_types: z.preprocess((v) => Array.isArray(v) ? v : [], z.array(z.string()).default([])),
    exercise_days: z.preprocess((v) => Array.isArray(v) ? v : [], z.array(z.string()).default([])),
    exercise_time: z.string().optional(),
    exercise_days_other: z.string().optional(),
    has_calorie_tracker: z.preprocess((v) => typeof v === 'boolean' ? (v ? "yes" : "no") : v, z.string().optional()),
    calorie_expenditure_details: z.string().optional(),

    // Step 6: Hábitos Fisiológicos
    appetite_level: z.string().optional(),
    appetite_peak_time: z.preprocess((v) => Array.isArray(v) ? v : [], z.array(z.string()).default([])),
    thirst_level: z.string().optional(),
    water_intake: z.string().optional(),
    sleep_quality: z.string().optional(),
    sleep_hours: z.string().optional(),
    bowel_movements: z.string().optional(),
    bowel_frequency: z.string().optional(),
    urine_status: z.string().optional(),
    urine_color_index: z.coerce.number().optional().nullable(),

    // Step 7: Alimentación
    available_instruments: z.preprocess((v) => Array.isArray(v) ? v : [], z.array(z.string()).default([])),
    specific_diet_type: z.string().optional(),
    cooks_for_self: z.string().optional(),
    likes_cooking: z.preprocess((v) => typeof v === 'boolean' ? (v ? "yes" : "no") : v, z.string().optional()),
    cooking_preparations: z.string().optional(),
    food_allergies: z.preprocess((v) => Array.isArray(v) ? v : (typeof v === 'string' && v.trim() !== "" ? v.split(', ').filter(Boolean) : []), z.array(z.string()).default([])),
    food_intolerances: z.preprocess((v) => typeof v === 'boolean' ? (v ? "yes" : "no") : v, z.string().optional()),
    intolerance_types: z.preprocess((v) => Array.isArray(v) ? v : [], z.array(z.string()).default([])),
    intolerance_details: z.string().optional(),

    // Step 8: Lácteos y Suplementos
    dairy_consumption: z.preprocess((v) => typeof v === 'boolean' ? (v ? "yes" : "no") : v, z.string().optional()),
    dairy_consumption_types: z.preprocess((v) => Array.isArray(v) ? v : [], z.array(z.string()).default([])),
    dairy_brands: z.string().optional(),
    dairy_product_photos: z.preprocess((v) => Array.isArray(v) ? v : [], z.array(z.string()).default([])),
    supplements_consumption: z.preprocess((v) => typeof v === 'boolean' ? (v ? "yes" : "no") : v, z.string().optional()),
    supplement_types: z.preprocess((v) => Array.isArray(v) ? v : [], z.array(z.string()).default([])),

    // Step 9: Restricciones
    disliked_cereals: z.preprocess((v) => Array.isArray(v) ? v : [], z.array(z.string()).default([])),
    disliked_tubers: z.preprocess((v) => Array.isArray(v) ? v : [], z.array(z.string()).default([])),
    disliked_legumes: z.preprocess((v) => Array.isArray(v) ? v : [], z.array(z.string()).default([])),
    disliked_vegetables: z.preprocess((v) => Array.isArray(v) ? v : [], z.array(z.string()).default([])),
    disliked_vegetables_other: z.string().optional(),
    disliked_fruits: z.preprocess((v) => Array.isArray(v) ? v : [], z.array(z.string()).default([])),
    disliked_fruits_other: z.string().optional(),
    disliked_meats: z.preprocess((v) => Array.isArray(v) ? v : [], z.array(z.string()).default([])),
    disliked_fats: z.preprocess((v) => Array.isArray(v) ? v : [], z.array(z.string()).default([])),
    disliked_preparations: z.preprocess((v) => Array.isArray(v) ? v : [], z.array(z.string()).default([])),
    disliked_preparations_other: z.string().optional(),

    // Step 10: Estilo de Vida y Horarios
    previous_unhealthy_habits: z.preprocess((v) => Array.isArray(v) ? v : [], z.array(z.string()).default([])),
    wake_up_time: z.string().optional().nullable(),
    sleep_time: z.string().optional().nullable(),
    breakfast_time: z.string().optional().nullable(),
    breakfast_details: z.string().optional().nullable(),
    lunch_time: z.string().optional().nullable(),
    lunch_details: z.string().optional().nullable(),
    dinner_time: z.string().optional().nullable(),
    dinner_details: z.string().optional().nullable(),
    snack_details: z.string().optional().nullable(),
    prep_preference: z.string().optional().nullable(),
    taste_preference: z.string().optional().nullable(),
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
    const [showExerciseOther, setShowExerciseOther] = useState(false);
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
            medication_names: [],
            lab_test_documents: [],
            exercise_types: [],
            exercise_days: [],
            appetite_peak_time: [],
            available_instruments: [],
            food_allergies: [],
            intolerance_types: [],
            dairy_consumption_types: [],
            dairy_product_photos: [],
            supplement_types: [],
            disliked_cereals: [],
            disliked_tubers: [],
            disliked_legumes: [],
            disliked_meats: [],
            disliked_fats: [],
            disliked_vegetables: [],
            disliked_vegetables_other: "",
            disliked_fruits: [],
            disliked_fruits_other: "",
            disliked_preparations: [],
            disliked_preparations_other: "",
            previous_unhealthy_habits: [],
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
                    const { data: patientData, error: pError } = await supabase.from('patients').select('profile:profiles!profile_id(id, full_name, email)').eq('id', currentPatientId).single();
                    if (pError) throw pError;
                    
                    const profileData = patientData?.profile;
                    currentProfile = Array.isArray(profileData) ? profileData[0] : profileData;
                }

                if (currentProfile) {
                    form.setValue('full_name', currentProfile.full_name || "");
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
                                const photoMap: Record<string, string> = {
                                    'photo_front_url': 'front_photo_url',
                                    'photo_side1_url': 'side_photo_1_url',
                                    'photo_side2_url': 'side_photo_2_url',
                                    'photo_back_url': 'back_photo_url'
                                };
                                const formKey = (photoMap[key] || key) as any;

                                if (formKey in medicalHistorySchema.shape) {
                                    const value = history[key];
                                    const arrayFields = [
                                        'health_conditions', 'family_history', 'exercise_types', 'exercise_days', 
                                        'appetite_peak_time', 'available_instruments', 'supplement_types', 
                                        'previous_unhealthy_habits', 'medication_names', 'food_allergies', 
                                        'intolerance_types', 'dairy_consumption_types', 'dairy_product_photos',
                                        'lab_test_documents',
                                        'disliked_cereals', 'disliked_tubers', 'disliked_legumes', 
                                        'disliked_meats', 'disliked_fats', 'disliked_vegetables', 
                                        'disliked_fruits', 'disliked_preparations'
                                    ];
                                    if (arrayFields.includes(formKey)) {
                                        if (typeof value === 'string' && value) {
                                            form.setValue(formKey, value.split(', ').filter(Boolean));
                                        } else {
                                            form.setValue(formKey, Array.isArray(value) ? value : []);
                                        }
                                    } else if (['previous_nutrition_service', 'takes_medication', 'recent_lab_tests', 'does_exercise', 'likes_cooking', 'supplements_consumption', 'has_calorie_tracker', 'food_intolerances'].includes(formKey)) {
                                        // If stored as boolean, convert to 'yes'/'no' for the form components
                                        if (value === true || value === 'si' || value === 'Sí') form.setValue(formKey, 'yes');
                                        else if (value === false || value === 'no' || value === 'nunca') form.setValue(formKey, 'no');
                                        else form.setValue(formKey, value ?? "");
                                    } else {
                                        // Global safety: Many fields might come as boolean from old DB structures
                                        if (typeof value === 'boolean') {
                                            form.setValue(formKey, value ? "yes" : "no");
                                        } else {
                                            form.setValue(formKey, value ?? "");
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

    useEffect(() => {
        const scrollToTop = () => {
            const modalContainer = document.getElementById('medical-history-scroll-container');
            if (modalContainer) {
                modalContainer.scrollTo({ top: 0, behavior: 'smooth' });
                return;
            }
            const scrollableDiv = document.querySelector('.overflow-y-auto');
            if (scrollableDiv) {
                scrollableDiv.scrollTo({ top: 0, behavior: 'smooth' });
            } else {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            }
        };
        const timer = setTimeout(scrollToTop, 100);
        return () => clearTimeout(timer);
    }, [step]);

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
                if (s === 'yes' || s === 'true' || s === 'si' || s === 'Sí' || s.startsWith('yes')) return true;
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
                'previous_unhealthy_habits', 'medication_names', 'lab_test_documents',
                'intolerance_types', 'dairy_consumption_types', 'dairy_product_photos',
                'food_allergies'
            ];

            // Fields that are defined as text (standard strings) in the database but are arrays in the form
            const stringJoinedFields = [
                'disliked_cereals', 'disliked_tubers', 'disliked_legumes',
                'disliked_meats', 'disliked_fats', 'disliked_vegetables',
                'disliked_fruits', 'disliked_preparations'
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

            // Mapeo dinámico basado en el esquema real del usuario
            const finalData: any = {};
            
            // Whitelist de campos que Sí existen en la tabla según el esquema compartido
            const validColumns = [
                'patient_id', 'full_name', 'dni', 'email', 'age', 'birth_date', 'instagram',
                'education_level', 'region', 'district', 'occupation', 'job_details',
                'nutritional_goal', 'previous_nutrition_service', 'previous_experience_rating',
                'time_following_plan', 'weight_kg', 'height_cm', 'waist_cm', 'health_conditions',
                'family_history', 'takes_medication', 'medication_names', 'medication_details', 
                'medication_frequency', 'medication_schedule', 'recent_lab_tests', 'lab_test_documents',
                'activity_level', 'work_schedule', 'does_exercise', 'exercise_duration', 
                'exercise_types', 'exercise_days', 'exercise_time',
                'has_calorie_tracker', 'calorie_expenditure_details', 'appetite_level',
                'appetite_peak_time', 'thirst_level', 'water_intake', 'sleep_quality',
                'sleep_hours', 'bowel_movements', 'bowel_frequency', 'urine_status',
                'urine_color_index', 'available_instruments', 'specific_diet_type',
                'cooks_for_self', 'likes_cooking', 'cooking_preparations', 'food_allergies',
                'food_intolerances', 'intolerance_types', 'intolerance_details', 'dairy_consumption',
                'dairy_consumption_types', 'dairy_brands', 'supplements_consumption', 
                'supplement_types', 'disliked_cereals', 'disliked_tubers', 'disliked_legumes', 
                'disliked_vegetables', 'disliked_fruits', 'disliked_meats', 'disliked_fats', 
                'disliked_preparations', 'previous_unhealthy_habits', 'wake_up_time', 'sleep_time', 
                'breakfast_time', 'breakfast_details', 'lunch_time', 'lunch_details', 'dinner_time',
                'dinner_details', 'snack_details', 'prep_preference', 'taste_preference',
                'gender', 'photo_front_url', 'photo_side1_url', 'photo_side2_url', 'photo_back_url',
                'front_photo_url', 'side_photo_1_url', 'side_photo_2_url', 'back_photo_url'
            ];

            validColumns.forEach(col => {
                if (col in dbData) {
                    finalData[col] = dbData[col];
                }
            });

            // Mapeos manuales para campos que tienen nombres distintos en el formulario vs base de datos
            finalData.photo_front_url = values.front_photo_url || "";
            finalData.photo_side1_url = values.side_photo_1_url || "";
            finalData.photo_side2_url = values.side_photo_2_url || "";
            finalData.photo_back_url = values.back_photo_url || "";
            
            // Evitamos enviar dairy_photos ya que NO existe en el esquema del usuario
            delete finalData.dairy_photos;
            delete finalData.supplement_photos;

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

            toast({ title: "¡Exito!", description: "Tu Historia Clínica y datos de perfil han sido actualizados.", variant: "success" });
            setHasHistory(true);
            setIsEditMode(false);
            // No reseteamos el paso al inicio para que el usuario pueda seguir navegando o visualizar su cambio
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
        if (step === 8) fields.push('supplements_consumption');
        // Step 9 is NOT mandatory for progression
        if (step === 10) fields.push('wake_up_time', 'sleep_time', 'prep_preference', 'taste_preference');

        const isStepValid = await form.trigger(fields);
        if (isStepValid) {
            if (step < totalSteps) {
                setStep(prev => prev + 1);
            }
        } else {
            toast({ title: "Campos incompletos", description: "Por favor llena todos los campos requeridos del paso actual.", variant: "destructive" });
        }
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
                        {step === 4 && <HealthStatus form={form} patientId={patientId!} />}
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
                                className="px-6 h-12 rounded-xl font-black uppercase tracking-widest text-slate-500 hover:text-white disabled:opacity-50 text-[10px]"
                            >
                                <ChevronLeft className="mr-1 h-4 w-4" /> Anterior
                            </Button>

                            {/* Mini Step Selector in Footer */}
                            <div className="flex items-center gap-1 overflow-x-auto no-scrollbar px-2 h-10 rounded-xl bg-white/[0.02] border border-white/5 mx-2">
                                {Array.from({ length: totalSteps }, (_, i) => i + 1).map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setStep(s)}
                                        className={cn(
                                            "w-7 h-7 min-w-[1.75rem] rounded-lg flex items-center justify-center font-black transition-all text-[10px]",
                                            step === s 
                                                ? "bg-nutri-brand text-white shadow-md shadow-nutri-brand/30" 
                                                : "bg-transparent text-slate-600 hover:text-white hover:bg-white/5"
                                        )}
                                    >
                                        {s}
                                    </button>
                                ))}
                            </div>

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
        if (s === 'yes' || s === 'true' || s === 'si' || s === 'Sí' || s.startsWith('yes')) return 'Sí';
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
                        <SummaryItem label="Calidad sueño" value={values.sleep_quality} />
                        <SummaryItem label="Horas sueño" value={values.sleep_hours} />
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
                        <span className="w-8 h-[1px] bg-nutri-brand/30" /> 09 // AVERSIONES Y Estilo de Vida
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
        "Restricciones Alimentarias",
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
        "Mejorar tu salud y Alimentación (diabetes, hígado graso, resistencia a la insulina, SOP, hipotiroidismo, anemía)"
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
                        <FormItem><FormLabel>¿Cómo calificarías esa experiencia?</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                <FormControl><SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 text-white"><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                                <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                    <SelectItem value="Buena experiencia">Buena experiencia</SelectItem>
                                    <SelectItem value="Mala experiencia">Mala experiencia</SelectItem>
                                    <SelectItem value="Ni buena ni mala experiencia">Ni buena ni mala experiencia</SelectItem>
                                    <SelectItem value="No tuve resultados">No tuve resultados</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="time_following_plan" render={({ field }) => (
                        <FormItem><FormLabel>¿Por cuánto tiempo has seguido el plan?</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                <FormControl><SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 text-white"><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                                <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                    <SelectItem value="1 mes">1 mes</SelectItem>
                                    <SelectItem value="2 meses">2 meses</SelectItem>
                                    <SelectItem value="3 meses">3 meses</SelectItem>
                                    <SelectItem value="Más de 3 meses">Más de 3 meses</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage /></FormItem>
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
    
    // Estados para el recorte
    const [croppingSlot, setCroppingSlot] = useState<string | null>(null);
    const [tempImage, setTempImage] = useState<string | null>(null);
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);

    const onCropComplete = useCallback((_area: any, pixels: any) => {
        setCroppedAreaPixels(pixels);
    }, []);

    const PHOTO_TYPES = [
        { id: 'front_photo_url', label: 'FRENTE' },
        { id: 'side_photo_1_url', label: 'COSTADO 1' },
        { id: 'side_photo_2_url', label: 'COSTADO 2' },
        { id: 'back_photo_url', label: 'ESPALDA' }
    ];

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, typeId: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!patientId) {
            toast({ title: "Error", description: "Cargando datos del paciente...", variant: "destructive" });
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setTempImage(reader.result as string);
            setCroppingSlot(typeId);
        };
        reader.readAsDataURL(file);
    };

    const handleConfirmCrop = async () => {
        if (!croppingSlot || !tempImage || !croppedAreaPixels) return;

        const typeId = croppingSlot;
        setUploading(typeId);
        setIsUploadingPhoto(true);
        setStatusText("Guardando...");

        const currentTempImage = tempImage;
        const currentPixels = croppedAreaPixels;
        
        setCroppingSlot(null);
        setTempImage(null);

        try {
            const croppedBlob = await getCroppedImg(currentTempImage, currentPixels);
            const fileName = `${patientId}/${Date.now()}_${typeId}.jpg`;

            const { error: uploadError } = await supabase.storage
                .from('progress-photos')
                .upload(fileName, croppedBlob, { upsert: true, contentType: 'image/jpeg' });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('progress-photos')
                .getPublicUrl(fileName);

            form.setValue(typeId, publicUrl);
            toast({ title: "Foto guardada correctamente" });
        } catch (error: any) {
            toast({ title: "Error al guardar foto", description: error.message, variant: "destructive" });
        } finally {
            setUploading(null);
            setIsUploadingPhoto(false);
            setStatusText("Subiendo...");
        }
    };

    const handleCancelCrop = () => {
        setCroppingSlot(null);
        setTempImage(null);
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
                        <h4 className="font-tech font-bold text-white uppercase tracking-widest text-sm">Fotos de Progreso</h4>
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
                                        ) : croppingSlot === type.id && tempImage ? (
                                            <div className="absolute inset-0 z-30 bg-black flex flex-col">
                                                <div className="relative flex-1">
                                                    <Cropper
                                                        image={tempImage}
                                                        crop={crop}
                                                        zoom={zoom}
                                                        aspect={3 / 4}
                                                        onCropChange={setCrop}
                                                        onZoomChange={setZoom}
                                                        onCropComplete={onCropComplete}
                                                    />
                                                </div>
                                                <div className="h-10 bg-black/90 flex items-center justify-around border-t border-white/10">
                                                    <button type="button" onClick={handleCancelCrop} className="p-2 text-red-400 hover:text-red-300 transition-colors">
                                                        <X className="h-5 w-5" />
                                                    </button>
                                                    <button type="button" onClick={handleConfirmCrop} className="p-2 text-emerald-400 hover:text-emerald-300 transition-colors">
                                                        <Check className="h-5 w-5" />
                                                    </button>
                                                </div>
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
                                                    onChange={(e) => handleFileSelect(e, type.id)}
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

function HealthStatus({ form, patientId }: { form: any, patientId: string }) {
    const { toast } = useToast();
    const supabase = createClient();
    const [uploading, setUploading] = useState<string | null>(null);

    const conditions = [
        "No padezco ninguna enfermedad",
        "Diabetes mellitus",
        "Dislipidemia (colesterol o trigliceridos altos)",
        "Hígado graso",
        "Enfermedad cardiovascular",
        "Hipertensión arterial (HTA)",
        "Obesidad",
        "Anemia",
        "Hipotiroidismo",
        "Resistencia a la insulina",
        "Síndrome de ovario poliquístico",
        "Estreñimiento",
        "Gastritis / Reflujo"
    ];

    const familyOptions = [
        "Ninguno",
        "Diabetes mellitus",
        "Dislipidemia (colesterol o trigliceridos altos)",
        "Hígado graso",
        "Enfermedad cardiovascular",
        "Hipertensión arterial (HTA)",
        "Obesidad",
        "Migraña",
        "Anemia",
        "Hipotiroidismo",
        "Resistencia a la insulina",
        "Síndrome de ovario poliquístico",
        "Estreñimiento",
        "Gastritis / Reflujo"
    ];

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: string) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading(fieldName);
        try {
            const file = files[0];
            const fileExt = file.name.split('.').pop() || 'file';
            const fileName = `${patientId || 'unknown'}/doc_${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('lab-results')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('lab-results')
                .getPublicUrl(fileName);

            const current = form.getValues(fieldName) || [];
            form.setValue(fieldName, [...current, publicUrl]);
            toast({ title: "Documento subido con éxito", variant: "default" });
        } catch (error: any) {
            console.error("Document upload error:", error);
            let msg = error.message || "Error desconocido";
            if (msg.includes("Bucket not found")) {
                msg = "ERROR: El bucket 'lab-results' no existe en Supabase. Debes crearlo como almacenamiento público.";
            }
            toast({ title: "Error al subir documento", description: msg, variant: "destructive" });
        } finally {
            setUploading(null);
        }
    };

    return (
        <div className="space-y-12">
            <FormField control={form.control} name="health_conditions" render={() => (
                <FormItem>
                    <FormLabel className="text-xl font-black text-white uppercase tracking-tighter">¿Presentas algunas de estas condiciones?</FormLabel>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
                        {conditions.map((item) => (
                            <FormField key={item} control={form.control} name="health_conditions" render={({ field }) => (
                                <FormItem className="flex items-center space-x-3 space-y-0 bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-nutri-brand/30 transition-all cursor-pointer group">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value?.includes(item)}
                                            onCheckedChange={(checked: boolean) => {
                                                const current = (field.value as string[]) || [];
                                                if (item === "No padezco ninguna enfermedad") {
                                                    return checked ? field.onChange([item]) : field.onChange([]);
                                                }
                                                const withoutNone = current.filter(v => v !== "No padezco ninguna enfermedad");
                                                return checked ? field.onChange([...withoutNone, item]) : field.onChange(withoutNone.filter(v => v !== item));
                                            }}
                                        />
                                    </FormControl>
                                    <FormLabel className="font-bold text-slate-300 group-hover:text-white cursor-pointer transition-colors leading-tight">{item}</FormLabel>
                                </FormItem>
                            )} />
                        ))}
                    </div>
                </FormItem>
            )} />

            <FormField control={form.control} name="family_history" render={() => (
                <FormItem>
                    <FormLabel className="text-xl font-black text-white uppercase tracking-tighter">Antecedentes Familiares (Padre, madre, abuelos)</FormLabel>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
                        {familyOptions.map((item) => (
                            <FormField key={item} control={form.control} name="family_history" render={({ field }) => (
                                <FormItem className="flex items-center space-x-3 space-y-0 bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-nutri-brand/30 transition-all cursor-pointer group">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value?.includes(item)}
                                            onCheckedChange={(checked: boolean) => {
                                                const current = (field.value as string[]) || [];
                                                if (item === "Ninguno") {
                                                    return checked ? field.onChange([item]) : field.onChange([]);
                                                }
                                                const withoutNone = current.filter(v => v !== "Ninguno");
                                                return checked ? field.onChange([...withoutNone, item]) : field.onChange(withoutNone.filter(v => v !== item));
                                            }}
                                        />
                                    </FormControl>
                                    <FormLabel className="font-bold text-slate-300 group-hover:text-white cursor-pointer transition-colors leading-tight">{item}</FormLabel>
                                </FormItem>
                            )} />
                        ))}
                    </div>
                </FormItem>
            )} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <FormField control={form.control} name="takes_medication" render={({ field }) => (
                    <FormItem className="p-6 bg-white/5 rounded-3xl border border-white/5">
                        <FormLabel className="text-lg font-bold">¿Consumes algún medicamento?</FormLabel>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} value={field.value} className="flex gap-8 mt-4">
                            <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="med-yes" /><Label htmlFor="med-yes" className="text-white cursor-pointer">Sí</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="med-no" /><Label htmlFor="med-no" className="text-white cursor-pointer">No</Label></div>
                        </RadioGroup>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="recent_lab_tests" render={({ field }) => (
                    <FormItem className="p-6 bg-white/5 rounded-3xl border border-white/5">
                        <FormLabel className="text-lg font-bold">¿Te haz realizado exámenes de laboratorio (3 meses)?</FormLabel>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} value={field.value} className="flex gap-8 mt-4">
                            <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="lab-yes" /><Label htmlFor="lab-yes" className="text-white cursor-pointer">Sí</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="lab-no" /><Label htmlFor="lab-no" className="text-white cursor-pointer">No</Label></div>
                        </RadioGroup>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>

            {form.watch('takes_medication') === 'yes' && (
                <div className="space-y-8 p-8 bg-nutri-brand/5 rounded-[2.5rem] border border-nutri-brand/10 animate-in fade-in slide-in-from-top-4">
                    <FormField control={form.control} name="medication_names" render={() => (
                        <FormItem>
                            <FormLabel className="text-white font-black uppercase tracking-widest text-xs">Tipo de medicamento (Selección múltiple)</FormLabel>
                            <div className="grid grid-cols-1 gap-3 mt-4">
                                {[
                                    "Antiácidos: omeprazol, esomeprazol, pantoprazol, u otros para la gastritis.",
                                    "Antidiabéticos: Metformina, insulina y otros.",
                                    "Anticonceptivos y hormonas femeninas.",
                                    "Antibióticos: para hongos, bacterias o parásitos.",
                                    "Estatinas: para bajar el colesterol o triglicéridos.",
                                    "Para el acné.",
                                    "Para tratar la obesidad."
                                ].map((item) => (
                                    <FormField key={item} control={form.control} name="medication_names" render={({ field }) => (
                                        <FormItem className="flex items-center space-x-3 space-y-0 bg-white/5 p-4 rounded-xl border border-white/10">
                                            <FormControl><Checkbox checked={field.value?.includes(item)} onCheckedChange={(checked) => {
                                                const current = field.value || [];
                                                return checked ? field.onChange([...current, item]) : field.onChange(current.filter((v: string) => v !== item));
                                            }} /></FormControl>
                                            <FormLabel className="text-slate-300 font-medium cursor-pointer leading-tight">{item}</FormLabel>
                                        </FormItem>
                                    )} />
                                ))}
                            </div>
                        </FormItem>
                    )} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <FormField control={form.control} name="medication_frequency" render={({ field }) => (
                            <FormItem>
                                <FormLabel>Frecuencia de consumo</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value}>
                                    <FormControl><SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl"><SelectValue placeholder="Seleccionar frecuencia" /></SelectTrigger></FormControl>
                                    <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                        <SelectItem value="con_comida">Con la comida</SelectItem>
                                        <SelectItem value="ayunas">En ayunas</SelectItem>
                                        <SelectItem value="antes_dormir">Antes de dormir</SelectItem>
                                        <SelectItem value="cada_8_horas">Cada 8 horas</SelectItem>
                                        <SelectItem value="cada_12_horas">Cada 12 horas</SelectItem>
                                        <SelectItem value="cada_24_horas">Una vez al día (cada 24h)</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="medication_schedule" render={({ field }) => (
                            <FormItem><FormLabel>Horario específico (HH:mm)</FormLabel><FormControl><Input type="time" {...field} className="h-12 rounded-xl bg-white/5 border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                    <FormField control={form.control} name="medication_details" render={({ field }) => (
                        <FormItem><FormLabel>Otros detalles o nombres de medicamentos</FormLabel><FormControl><Textarea {...field} className="bg-white/5 border-white/10 rounded-xl" /></FormControl><FormMessage /></FormItem>
                    )} />
                </div>
            )}

            {form.watch('recent_lab_tests') === 'yes' && (
                <div className="p-8 bg-emerald-500/5 rounded-[2.5rem] border border-emerald-500/10 space-y-6">
                    <div className="flex items-center gap-3">
                        <Upload className="h-6 w-6 text-emerald-500" />
                        <h4 className="font-tech font-bold text-white uppercase tracking-widest text-sm">Cargar Exámenes de Laboratorio</h4>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {(form.watch('lab_test_documents') || []).map((url: string, idx: number) => (
                            <div key={idx} className="relative aspect-video rounded-xl bg-white/5 border border-white/10 overflow-hidden flex flex-col items-center justify-center gap-2 p-2">
                                <span className="text-[10px] text-slate-500 font-bold uppercase truncate w-full text-center">Documento {idx + 1}</span>
                                <div className="flex gap-2">
                                    <Button asChild size="sm" variant="outline" className="h-7 px-3 bg-white/5 border-white/10 text-emerald-400 hover:bg-emerald-500 hover:text-white transition-all text-[10px] font-black uppercase">
                                        <a href={url} target="_blank" rel="noopener noreferrer">
                                            <Download className="h-3 w-3 mr-1.5" /> Descargar
                                        </a>
                                    </Button>
                                    <Button size="icon" variant="destructive" className="h-7 w-7 rounded-lg" onClick={() => {
                                        const current = form.getValues('lab_test_documents');
                                        form.setValue('lab_test_documents', current.filter((_: any, i: number) => i !== idx));
                                    }}><X className="h-3 w-3" /></Button>
                                </div>
                            </div>
                        ))}
                        <label className="aspect-video flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/10 bg-white/5 cursor-pointer hover:border-emerald-500/50 transition-all">
                            {uploading === 'lab_test_documents' ? <Loader2 className="h-6 w-6 animate-spin text-emerald-500" /> : <><Plus className="h-6 w-6 text-emerald-500 mb-2" /><span className="text-[10px] font-black uppercase text-slate-500">Subir Documento</span></>}
                            <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, 'lab_test_documents')} />
                        </label>
                    </div>
                </div>
            )}
        </div>
    );
}

function ActivityExercise({ form }: { form: any }) {
    const startOptions = [
        "Recientemente (hace pocos dias)",
        "1 mes",
        "2 meses",
        "Más de 3 meses",
        "Más de 1 año"
    ];

    const durOptions = [
        "Menos de 1 hora",
        "1 hora",
        "2 horas",
        "Más de 3 horas"
    ];

    const exeTypes = [
        "Entrenamiento con pesas",
        "Aeróbicos de baja intensidad: baile, full body, etc.",
        "Aeróbicos de alta intensidad: HIIT, Power training, funcional",
        "Crossfit",
        "Natación",
        "Ciclismo",
        "Correr",
        "Yoga",
        "Pilates"
    ];

    return (
        <div className="space-y-12">
            <FormField control={form.control} name="does_exercise" render={({ field }) => (
                <FormItem className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5">
                    <FormLabel className="text-xl font-black text-white uppercase tracking-tighter block mb-4">¿Haces ejercicio?</FormLabel>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} value={field.value} className="flex gap-10 mt-2">
                        <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="exe-yes" /><Label htmlFor="exe-yes" className="text-white text-lg font-bold cursor-pointer">Sí</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="exe-no" /><Label htmlFor="exe-no" className="text-white text-lg font-bold cursor-pointer">No</Label></div>
                    </RadioGroup>
                    <FormMessage />
                </FormItem>
            )} />

            {form.watch('does_exercise') === 'yes' && (
                <div className="space-y-10 animate-in fade-in slide-in-from-top-4">
                    <FormField control={form.control} name="exercise_duration" render={({ field }) => (
                        <FormItem><FormLabel>¿Cuánto tiempo realizas la actividad física?</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-2xl"><SelectValue placeholder="Seleccionar duración" /></SelectTrigger></FormControl>
                                <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                    {durOptions.map((opt: string) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage /></FormItem>
                    )} />

                    <FormField control={form.control} name="exercise_types" render={() => (
                        <FormItem>
                            <FormLabel className="text-xl font-black text-white uppercase tracking-tighter">¿Tipos de ejercicios que realizas de manera frecuente?</FormLabel>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-6">
                                {exeTypes.map((item: string) => (
                                    <FormField key={item} control={form.control} name="exercise_types" render={({ field }) => (
                                        <FormItem className="flex items-center space-x-3 space-y-0 bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-nutri-brand/30 transition-all cursor-pointer group">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value?.includes(item)}
                                                    onCheckedChange={(checked: boolean) => {
                                                        const current = (field.value as string[]) || [];
                                                        return checked ? field.onChange([...current, item]) : field.onChange(current.filter((v: string) => v !== item));
                                                    }}
                                                />
                                            </FormControl>
                                            <FormLabel className="font-bold text-slate-300 group-hover:text-white cursor-pointer transition-colors leading-tight">{item}</FormLabel>
                                        </FormItem>
                                    )} />
                                ))}
                            </div>
                        </FormItem>
                    )} />

                    <FormField control={form.control} name="time_practicing" render={({ field }) => (
                        <FormItem><FormLabel>¿Hace cuánto tiempo iniciaste a realizar actividad física?</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                                <FormControl><SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-2xl text-white"><SelectValue placeholder="Seleccionar tiempo" /></SelectTrigger></FormControl>
                                <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                    {startOptions.map((opt: string) => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                </SelectContent>
                            </Select>
                            <FormMessage /></FormItem>
                    )} />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-4">
                        <FormField control={form.control} name="exercise_time" render={({ field }) => (
                            <FormItem><FormLabel>¿A qué hora sueles entrenar?</FormLabel><FormControl><Input type="time" {...field} className="h-14 bg-white/5 border-white/10 rounded-2xl text-white font-bold" /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={form.control} name="exercise_days" render={() => (
                            <FormItem>
                                <FormLabel>¿Qué días sueles entrenar?</FormLabel>
                                <div className="flex flex-wrap gap-2 mt-4">
                                    {["L", "Ma", "Mi", "J", "V", "S", "D"].map((day: string) => (
                                        <FormField key={day} control={form.control} name="exercise_days" render={({ field }) => (
                                            <div
                                                onClick={() => {
                                                    const current = field.value || [];
                                                    field.onChange(current.includes(day) ? current.filter((v: string) => v !== day) : [...current, day]);
                                                }}
                                                className={cn(
                                                    "w-12 h-12 rounded-xl border flex items-center justify-center font-black cursor-pointer transition-all shadow-lg",
                                                    field.value?.includes(day) ? "bg-nutri-brand border-nutri-brand text-white shadow-lg shadow-nutri-brand/20 scale-110" : "bg-white/5 border-white/10 text-slate-500 hover:border-white/20"
                                                )}
                                            >{day}</div>
                                        )} />
                                    ))}
                                    <FormField key="Otros" control={form.control} name="exercise_days" render={({ field }) => (
                                        <div
                                            onClick={() => {
                                                const current = field.value || [];
                                                field.onChange(current.includes("Otros") ? current.filter((v: string) => v !== "Otros") : [...current, "Otros"]);
                                            }}
                                            className={cn(
                                                "px-4 h-12 rounded-xl border flex items-center justify-center font-black cursor-pointer transition-all shadow-lg",
                                                field.value?.includes("Otros") ? "bg-nutri-brand border-nutri-brand text-white shadow-lg shadow-nutri-brand/20 scale-105" : "bg-white/5 border-white/10 text-slate-500 hover:border-white/20"
                                            )}
                                        >Otros</div>
                                    )} />
                                </div>
                                {form.watch("exercise_days")?.includes("Otros") && (
                                    <FormField control={form.control} name="exercise_days_other" render={({ field }) => (
                                        <FormItem className="mt-4 animate-in fade-in slide-in-from-top-2">
                                            <FormControl>
                                                <Input {...field} placeholder="Especificar otros días..." className="h-12 bg-white/5 border-white/10 rounded-xl" />
                                            </FormControl>
                                        </FormItem>
                                    )} />
                                )}
                            </FormItem>
                        )} />
                    </div>
                </div>
            )}

            <FormField control={form.control} name="activity_level" render={({ field }) => (
                <FormItem className="pt-10 border-t border-white/20">
                    <FormLabel className="text-xl font-black text-white uppercase tracking-tighter">¿Cómo es tu actividad diaria (Trabajo/Estudios)?</FormLabel>
                    <FormControl>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} value={field.value} className="grid grid-cols-1 gap-4 mt-6">
                            <div className="flex items-center space-x-3 bg-white/5 p-5 rounded-2xl border border-white/5 hover:border-nutri-brand/30 transition-all cursor-pointer group">
                                <RadioGroupItem value="moderada" id="act-moderada" />
                                <Label htmlFor="act-moderada" className="text-white font-bold cursor-pointer group-hover:text-nutri-brand">Moderada (camino 9000 pasos)</Label>
                            </div>
                            <div className="flex items-center space-x-3 bg-white/5 p-5 rounded-2xl border border-white/5 hover:border-nutri-brand/30 transition-all cursor-pointer group">
                                <RadioGroupItem value="leve" id="act-leve" />
                                <Label htmlFor="act-leve" className="text-white font-bold cursor-pointer group-hover:text-nutri-brand">Leve (camino 6000 pasos)</Label>
                            </div>
                            <div className="flex items-center space-x-3 bg-white/5 p-5 rounded-2xl border border-white/5 hover:border-nutri-brand/30 transition-all cursor-pointer group">
                                <RadioGroupItem value="sedentaria" id="act-sedentaria" />
                                <Label htmlFor="act-sedentaria" className="text-white font-bold cursor-pointer group-hover:text-nutri-brand">Sedentaria (menor o igual 3000 pasos)</Label>
                            </div>
                        </RadioGroup>
                    </FormControl>
                    <FormMessage />
                </FormItem>
            )} />

            <FormField control={form.control} name="work_schedule" render={({ field }) => (
                <FormItem><FormLabel>Horario de trabajo (Días y horas) (Opcional)</FormLabel><FormControl><Input {...field} placeholder="Días y rango horario" className="h-12 rounded-xl bg-white/5 border-white/10 text-white font-bold" /></FormControl><FormMessage /></FormItem>
            )} />
        </div>
    );
}

function Habits({ form }: { form: any }) {
    return (
        <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <FormField control={form.control} name="appetite_level" render={({ field }) => (
                    <FormItem><FormLabel className="text-lg font-bold">Estado de apetito</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger className="h-14 bg-white/5 border-white/10 rounded-2xl"><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                            <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                <SelectItem value="muy_alto">Muy Alto</SelectItem>
                                <SelectItem value="alto">Alto</SelectItem>
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="bajo">Bajo</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="appetite_peak_time" render={() => (
                    <FormItem>
                        <FormLabel className="text-lg font-bold">¿En qué momento del día sientes más hambre?</FormLabel>
                        <div className="flex flex-wrap gap-3 mt-4">
                            {["Mañana", "Tarde", "Noche", "Madrugada", "Todo el día"].map((time: string) => (
                                <FormField key={time} control={form.control} name="appetite_peak_time" render={({ field }) => (
                                    <div 
                                        onClick={() => {
                                            const current = field.value || [];
                                            field.onChange(current.includes(time) ? current.filter((v: string) => v !== time) : [...current, time]);
                                        }}
                                        className={cn(
                                            "px-6 py-3 rounded-xl border font-bold cursor-pointer transition-all",
                                            field.value?.includes(time) ? "bg-nutri-brand border-nutri-brand text-white" : "bg-white/5 border-white/10 text-slate-400"
                                        )}
                                    >{time}</div>
                                )} />
                            ))}
                        </div>
                    </FormItem>
                )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <FormField control={form.control} name="thirst_level" render={({ field }) => (
                    <FormItem><FormLabel>Nivel de Sed</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl"><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                            <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="aumentada">Aumentada</SelectItem>
                                <SelectItem value="disminuida">Disminuida</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="water_intake" render={({ field }) => (
                    <FormItem><FormLabel>¿Cuánta agua consumes al día?</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl"><SelectValue placeholder="Seleccionar cantidad" /></SelectTrigger></FormControl>
                            <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                <SelectItem value="menos_1">Menos de 1 litro</SelectItem>
                                <SelectItem value="1_litro">1 litro</SelectItem>
                                <SelectItem value="1_5_litros">1.5 litros</SelectItem>
                                <SelectItem value="2_litros">2 litros</SelectItem>
                                <SelectItem value="mas_2">Más de 2 litros</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="sleep_quality" render={({ field }) => (
                    <FormItem><FormLabel>Calidad de sueño</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl"><SelectValue placeholder="Seleccionar calidad" /></SelectTrigger></FormControl>
                            <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                <SelectItem value="reparador">Reparador</SelectItem>
                                <SelectItem value="no_reparador">No reparador</SelectItem>
                                <SelectItem value="insomnio">Sufro de Insomnio</SelectItem>
                                <SelectItem value="interrumpido">Sueño interrumpido</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage /></FormItem>
                )} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <FormField control={form.control} name="sleep_hours" render={({ field }) => (
                    <FormItem><FormLabel>Horas de sueño diarias</FormLabel><FormControl><Input {...field} placeholder="Ej: 7 u 8 horas" className="h-12 rounded-xl bg-white/5 border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="bowel_movements" render={({ field }) => (
                    <FormItem><FormLabel>Estado de deposiciones</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl"><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                            <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                <SelectItem value="normal">Normal</SelectItem>
                                <SelectItem value="estreñimiento">Estreñimiento</SelectItem>
                                <SelectItem value="diarrea">Diarrea</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="bowel_frequency" render={({ field }) => (
                    <FormItem><FormLabel>Frecuencia de deposiciones</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl><SelectTrigger className="h-12 bg-white/5 border-white/10 rounded-xl"><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                            <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                <SelectItem value="diario">Diario</SelectItem>
                                <SelectItem value="interdiario">Interdiario</SelectItem>
                                <SelectItem value="2_veces_semana">2 veces por semana</SelectItem>
                                <SelectItem value="más_semana">1 vez o más por semana</SelectItem>
                            </SelectContent>
                        </Select>
                        <FormMessage /></FormItem>
                )} />
            </div>

            <div className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10">
                <FormField control={form.control} name="urine_color_index" render={({ field }) => (
                    <FormItem>
                        <FormLabel className="text-lg font-black text-white uppercase tracking-tighter block mb-6">Indicar qué número coincide con el color de tu orina</FormLabel>
                        <FormControl>
                            <div className="flex flex-col gap-6">
                                <div className="flex justify-between items-center gap-2">
                                    {[1, 2, 3, 4, 5, 6, 7, 8].map((idx: number) => {
                                        const colors: Record<number, string> = {
                                            1: "#FDF5E6", 2: "#FBE7A1", 3: "#F9D94A", 4: "#FAD02C", 5: "#F2C029", 6: "#EAAC14", 7: "#D99101", 8: "#7C7601"
                                        };
                                        return (
                                            <div 
                                                key={idx}
                                                onClick={() => field.onChange(idx)}
                                                className={cn(
                                                    "flex-1 h-14 rounded-lg cursor-pointer transition-all border-2 flex items-center justify-center font-black",
                                                    field.value === idx ? "scale-110 border-white shadow-xl shadow-white/20 z-10" : "border-transparent opacity-60 hover:opacity-100"
                                                )}
                                                style={{ backgroundColor: colors[idx], color: idx > 4 ? 'white' : 'black' }}
                                            >{idx}</div>
                                        );
                                    })}
                                </div>
                                <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-500 px-1">
                                    <span>Hidratado</span>
                                    <span>Deshidratado</span>
                                </div>
                            </div>
                        </FormControl>
                        <FormMessage />
                    </FormItem>
                )} />
            </div>
        </div>
    );
}

function DietCooking({ form }: { form: any }) {
    const instruments = ["Balanza gramera de alimentos", "Taza medidora", "Cuchara medidora", "Ninguna"];
    const dietTypes = [
        "No", 
        "Vegetariano: ovovegetariano (consumes huevo)", 
        "Vegetariano: lactovegetariano (consumes lacteos)", 
        "Ovolacteovegetariano (consumes lacteos y huevos)", 
        "Vegana"
    ];
    const allergyOptions = ["Ninguna", "Mani", "Naranja", "Pescado", "Huevos", "Mariscos", "Fresa"];
    const intoleranceOptions = ["Lactosa", "Gluten", "Otros"];

    return (
        <div className="space-y-12">
            <FormField control={form.control} name="available_instruments" render={() => (
                <FormItem>
                    <FormLabel className="text-xl font-black text-white uppercase tracking-tighter">¿Cuentas con algunos de estos instrumentos?</FormLabel>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
                        {instruments.map((item: string) => (
                            <FormField key={item} control={form.control} name="available_instruments" render={({ field }) => (
                                <FormItem className="flex items-center space-x-3 space-y-0 bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-nutri-brand/30 transition-all cursor-pointer">
                                    <FormControl><Checkbox checked={field.value?.includes(item)} onCheckedChange={(checked: boolean) => {
                                        const current = field.value || [];
                                        if (item === "Ninguna") return checked ? field.onChange(["Ninguna"]) : field.onChange([]);
                                        const withoutNone = current.filter((v: string) => v !== "Ninguna");
                                        return checked ? field.onChange([...withoutNone, item]) : field.onChange(withoutNone.filter((v: string) => v !== item));
                                    }} /></FormControl>
                                    <Label htmlFor={item} className="font-bold text-slate-300 cursor-pointer">{item}</Label>
                                </FormItem>
                            )} />
                        ))}
                    </div>
                </FormItem>
            )} />

            <FormField control={form.control} name="specific_diet_type" render={({ field }) => (
                <FormItem className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5">
                    <FormLabel className="text-xl font-black text-white uppercase tracking-tighter mb-6 block">¿Presentas algún tipo de Alimentación especial?</FormLabel>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} value={field.value} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {dietTypes.map((type: string) => (
                            <div key={type} className="flex items-center space-x-3 bg-white/5 p-4 rounded-xl border border-white/10 hover:border-nutri-brand/30 transition-all cursor-pointer group">
                                <RadioGroupItem value={type} id={type} />
                                <Label htmlFor={type} className="text-white font-medium cursor-pointer leading-tight group-hover:text-nutri-brand transition-colors">{type}</Label>
                            </div>
                        ))}
                    </RadioGroup>
                </FormItem>
            )} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <FormField control={form.control} name="cooks_for_self" render={({ field }) => (
                    <FormItem>
                        <FormLabel>¿Quién cocina o prepara tus comidas?</FormLabel>
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-4">
                            {["Yo mismo", "Pareja", "Mamá", "Hermana", "Abuela", "En restaurante", "En concesionario"].map((opt) => (
                                <div
                                    key={opt}
                                    onClick={() => field.onChange(opt)}
                                    className={cn(
                                        "p-4 rounded-xl border flex items-center justify-center font-bold cursor-pointer transition-all text-[10px] uppercase tracking-widest text-center",
                                        field.value === opt ? "bg-nutri-brand border-nutri-brand text-white shadow-lg shadow-nutri-brand/20" : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"
                                    )}
                                >
                                    {opt}
                                </div>
                            ))}
                        </div>
                        <FormMessage />
                    </FormItem>
                )} />
                <FormField control={form.control} name="likes_cooking" render={({ field }) => (
                    <FormItem><FormLabel>¿Te agrada cocinar?</FormLabel>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-8 mt-4">
                            <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="cook-yes" /><Label htmlFor="cook-yes" className="text-white cursor-pointer">Sí</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="cook-no" /><Label htmlFor="cook-no" className="text-white cursor-pointer">No</Label></div>
                        </RadioGroup>
                        <FormMessage /></FormItem>
                )} />
            </div>

            <FormField control={form.control} name="food_allergies" render={() => (
                <FormItem>
                    <FormLabel className="text-xl font-black text-white uppercase tracking-tighter">¿Presentas alguna alergia alimentaria?</FormLabel>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mt-6">
                        {allergyOptions.map((opt: string) => (
                            <FormField key={opt} control={form.control} name="food_allergies" render={({ field }) => (
                                <FormItem className="flex items-center space-x-3 bg-white/5 p-4 rounded-xl border border-white/10 hover:border-nutri-brand/30 transition-all cursor-pointer group">
                                    <FormControl><Checkbox checked={field.value?.includes(opt)} onCheckedChange={(checked: boolean) => {
                                        const current = field.value || [];
                                        if (opt === "Ninguna") return checked ? field.onChange(["Ninguna"]) : field.onChange([]);
                                        const filtered = current.filter((v: string) => v !== "Ninguna");
                                        return checked ? field.onChange([...filtered, opt]) : field.onChange(filtered.filter((v: string) => v !== opt));
                                    }} /></FormControl>
                                    <Label className="text-slate-300 font-bold group-hover:text-white cursor-pointer uppercase text-xs tracking-widest">{opt}</Label>
                                </FormItem>
                            )} />
                        ))}
                        <FormField key="Otros" control={form.control} name="food_allergies" render={({ field }) => (
                            <FormItem className="flex items-center space-x-3 bg-white/5 p-4 rounded-xl border border-white/10 hover:border-nutri-brand/30 transition-all cursor-pointer group">
                                <FormControl><Checkbox checked={field.value?.includes("Otros")} onCheckedChange={(checked: boolean) => {
                                    const current = field.value || [];
                                    const filtered = current.filter((v: string) => v !== "Ninguna");
                                    return checked ? field.onChange([...filtered, "Otros"]) : field.onChange(filtered.filter((v: string) => v !== "Otros"));
                                }} /></FormControl>
                                <Label className="text-slate-300 font-bold group-hover:text-white cursor-pointer uppercase text-xs tracking-widest">Otros</Label>
                            </FormItem>
                        )} />
                    </div>
                    {form.watch("food_allergies")?.includes("Otros") && (
                        <FormField control={form.control} name="food_allergies_other" render={({ field }) => (
                            <FormItem className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <FormControl><Input {...field} placeholder="Especificar otras alergias..." className="h-12 bg-white/5 border-white/10 rounded-xl" /></FormControl>
                            </FormItem>
                        )} />
                    )}
                </FormItem>
            )} />

            <div className="space-y-6">
                <FormField control={form.control} name="food_intolerances" render={({ field }) => (
                    <FormItem className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5">
                        <FormLabel className="text-xl font-black text-white uppercase tracking-tighter">¿Eres intolerante a algún alimento?</FormLabel>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-10 mt-6">
                            <div className="flex items-center space-x-3"><RadioGroupItem value="yes" id="int-yes" /><Label htmlFor="int-yes" className="text-white text-lg cursor-pointer">Sí</Label></div>
                            <div className="flex items-center space-x-3"><RadioGroupItem value="no" id="int-no" /><Label htmlFor="int-no" className="text-white text-lg cursor-pointer">No</Label></div>
                        </RadioGroup>
                    </FormItem>
                )} />

                {form.watch('food_intolerances') === 'yes' && (
                    <div className="p-8 bg-nutri-brand/5 rounded-[2.5rem] border border-nutri-brand/10 space-y-8 animate-in fade-in slide-in-from-top-4">
                        <FormField control={form.control} name="intolerance_types" render={() => (
                            <FormItem>
                                <FormLabel className="text-sm font-black uppercase tracking-widest text-slate-500">¿A qué eres intolerante? (selección múltiple)</FormLabel>
                                <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-4">
                                    {intoleranceOptions.map(opt => (
                                        <FormField key={opt} control={form.control} name="intolerance_types" render={({ field }) => (
                                            <FormItem className="flex items-center space-x-3 bg-white/5 p-4 rounded-xl border border-white/10 hover:border-nutri-brand/30 transition-all cursor-pointer">
                                                <FormControl><Checkbox checked={field.value?.includes(opt)} onCheckedChange={(checked) => {
                                                    const current = field.value || [];
                                                    return checked ? field.onChange([...current, opt]) : field.onChange(current.filter((v: string) => v !== opt));
                                                }} /></FormControl>
                                                <Label className="text-slate-300 font-bold cursor-pointer uppercase text-[10px] tracking-widest">{opt}</Label>
                                            </FormItem>
                                        )} />
                                    ))}
                                </div>
                            </FormItem>
                        )} />
                        <FormField control={form.control} name="intolerance_details" render={({ field }) => (
                            <FormItem><FormLabel>Especificar más detalles (en caso de elegir otros)</FormLabel><FormControl><Textarea {...field} className="bg-white/5 border-white/10 rounded-xl" /></FormControl></FormItem>
                        )} />
                    </div>
                )}
            </div>
        </div>
    );
}

function DairySupplements({ form }: { form: any }) {
    const { toast } = useToast();
    const supabase = createClient();
    const [uploading, setUploading] = useState<string | null>(null);

    const dairyTypes = ["Leche de Vaca", "Leche de Soya", "Leche de Almendras", "Yogurt Natural", "Yogurt Griego", "Queso Fresco", "Queso Paria", "Otros"];
    const supplements = ["Suplementos de proteína", "Suplementos de vitaminas y minerales", "Creatina", "Colágeno", "Otros"];

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        setUploading('dairy');
        try {
            const file = files[0];
            const fileExt = file.name.split('.').pop();
            const fileName = `${form.getValues('patient_id')}/product_${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('progress-photos')
                .upload(fileName, file);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('progress-photos')
                .getPublicUrl(fileName);

            const current = form.getValues('dairy_product_photos') || [];
            form.setValue('dairy_product_photos', [...current, publicUrl]);
            toast({ title: "Foto de producto subida" });
        } catch (error: any) {
            toast({ title: "Error al subir", description: error.message, variant: "destructive" });
        } finally {
            setUploading(null);
        }
    };

    return (
        <div className="space-y-12">
            <FormField control={form.control} name="dairy_consumption" render={({ field }) => (
                <FormItem className="p-8 bg-white/5 rounded-[2.5rem] border border-white/10">
                    <FormLabel className="text-xl font-black text-white uppercase tracking-tighter mb-6 block">¿Consumes Lácteos regularmente?</FormLabel>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} value={field.value} className="flex gap-10">
                        <div className="flex items-center space-x-3"><RadioGroupItem value="yes" id="dairy-yes" /><Label htmlFor="dairy-yes" className="text-white text-lg cursor-pointer">Sí</Label></div>
                        <div className="flex items-center space-x-3"><RadioGroupItem value="no" id="dairy-no" /><Label htmlFor="dairy-no" className="text-white text-lg cursor-pointer">No</Label></div>
                    </RadioGroup>
                </FormItem>
            )} />

            {form.watch('dairy_consumption') === 'yes' && (
                <div className="p-8 bg-nutri-brand/5 rounded-[2.5rem] border border-nutri-brand/10 space-y-10 animate-in fade-in slide-in-from-top-4">
                    <FormField control={form.control} name="dairy_consumption_types" render={() => (
                        <FormItem>
                            <FormLabel className="text-sm font-black uppercase tracking-widest text-slate-500 mb-6 block">¿Qué Lácteos consumes? (selección múltiple)</FormLabel>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {dairyTypes.map(opt => (
                                    <FormField key={opt} control={form.control} name="dairy_consumption_types" render={({ field }) => (
                                        <FormItem className="flex items-center space-x-3 bg-white/5 p-4 rounded-xl border border-white/10 hover:border-nutri-brand/30 transition-all cursor-pointer group">
                                            <FormControl><Checkbox checked={field.value?.includes(opt)} onCheckedChange={(checked) => {
                                                const current = field.value || [];
                                                return checked ? field.onChange([...current, opt]) : field.onChange(current.filter((v: string) => v !== opt));
                                            }} /></FormControl>
                                            <Label className="text-slate-300 group-hover:text-white font-bold cursor-pointer text-[10px] tracking-widest">{opt}</Label>
                                        </FormItem>
                                    )} />
                                ))}
                            </div>
                        </FormItem>
                    )} />

                    <div className="space-y-6">
                        <FormField control={form.control} name="dairy_brands" render={({ field }) => (
                            <FormItem><FormLabel>Especifica la marca y tipo de los Lácteos</FormLabel><FormControl><Input {...field} placeholder="Ej: Gloria Light, Laive Bio, etc." className="h-12 bg-white/5 border-white/10 rounded-xl text-white" /></FormControl></FormItem>
                        )} />
                        
                        <div className="space-y-4">
                            <Label className="text-[10px] uppercase font-black text-slate-500 tracking-widest">Sube fotos de tus productos (opcional)</Label>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                {(form.watch('dairy_product_photos') || []).map((url: string, idx: number) => (
                                    <div key={idx} className="relative aspect-square rounded-xl bg-white/5 border border-white/10 overflow-hidden group">
                                        <img src={url} className="w-full h-full object-cover" />
                                        <Button size="icon" variant="destructive" className="absolute top-2 right-2 h-6 w-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => {
                                            const current = form.getValues('dairy_product_photos');
                                            form.setValue('dairy_product_photos', current.filter((_: any, i: number) => i !== idx));
                                        }}><X className="h-3 w-3" /></Button>
                                    </div>
                                ))}
                                <label className="aspect-square flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-white/10 bg-white/5 cursor-pointer hover:border-nutri-brand/50 transition-all">
                                    {uploading === 'dairy' ? <Loader2 className="h-6 w-6 animate-spin text-nutri-brand" /> : <Plus className="h-6 w-6 text-nutri-brand" />}
                                    <input type="file" accept="image/*" className="hidden" onChange={handleFileUpload} />
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <FormField control={form.control} name="supplements_consumption" render={({ field }) => (
                <FormItem className="p-8 bg-white/5 rounded-[2.5rem] border border-white/5">
                    <FormLabel className="text-xl font-black text-white uppercase tracking-tighter">¿Consumes suplementos vitamínicos?</FormLabel>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} value={field.value} className="flex gap-10 mt-6">
                        <div className="flex items-center space-x-3"><RadioGroupItem value="yes" id="sup-yes" /><Label htmlFor="sup-yes" className="text-white text-lg cursor-pointer">Sí</Label></div>
                        <div className="flex items-center space-x-3"><RadioGroupItem value="no" id="sup-no" /><Label htmlFor="sup-no" className="text-white text-lg cursor-pointer">No</Label></div>
                    </RadioGroup>
                </FormItem>
            )} />

            {form.watch('supplements_consumption') === 'yes' && (
                <FormField control={form.control} name="supplement_types" render={() => (
                    <FormItem className="p-8 bg-nutri-brand/5 rounded-[2.5rem] border border-nutri-brand/10 animate-in fade-in slide-in-from-top-4">
                        <FormLabel className="text-xs font-black uppercase tracking-widest text-slate-500 block mb-6">Suplementos que consumes (selección múltiple)</FormLabel>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {supplements.map((item) => (
                                <FormField key={item} control={form.control} name="supplement_types" render={({ field }) => (
                                    <FormItem className="flex items-center space-x-3 bg-white/5 p-4 rounded-xl border border-white/10 hover:border-nutri-brand/30 transition-all cursor-pointer group">
                                        <FormControl><Checkbox checked={field.value?.includes(item)} onCheckedChange={(checked) => {
                                            const current = field.value || [];
                                            return checked ? field.onChange([...current, item]) : field.onChange(current.filter((v: string) => v !== item));
                                        }} /></FormControl>
                                        <Label className="text-slate-300 group-hover:text-white font-bold cursor-pointer text-[10px] tracking-widest">{item}</Label>
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
    const options = {
        veg: ["Todas me agradan", "Cebolla", "Brócoli", "Tomate", "Pepino", "Zanahoria", "Lechuga", "Espinaca", "Ajo", "Betarraga", "Otros"],
        fruit: ["Todas me agradan", "Papaya", "Melón", "Sandía", "Plátano", "Manzana", "Naranja", "Fresa", "Mango", "Piña", "Otros"],
        prep: ["Todas me agradan", "Guisos", "Ensaladas crudas", "Sopas", "Frituras", "Ceviches", "Pastas", "Otros"]
    };

    return (
        <div className="space-y-12">
            <FormField control={form.control} name="disliked_vegetables" render={() => (
                <FormItem>
                    <FormLabel className="text-xl font-black text-white uppercase tracking-tighter">Verduras que no te agradan</FormLabel>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
                        {options.veg.map(opt => (
                            <FormField key={opt} control={form.control} name="disliked_vegetables" render={({ field }) => (
                                <FormItem className="flex items-center space-x-3 bg-white/5 p-4 rounded-xl border border-white/10 hover:border-nutri-brand/30 transition-all cursor-pointer">
                                    <FormControl><Checkbox checked={field.value?.includes(opt)} onCheckedChange={(checked) => {
                                        const current = field.value || [];
                                        if (opt === "Todas me agradan") return checked ? field.onChange(["Todas me agradan"]) : field.onChange([]);
                                        const filtered = current.filter((v: string) => v !== "Todas me agradan");
                                        return checked ? field.onChange([...filtered, opt]) : field.onChange(filtered.filter((v: string) => v !== opt));
                                    }} /></FormControl>
                                    <Label className="text-slate-300 font-bold cursor-pointer text-[10px] tracking-widest">{opt}</Label>
                                </FormItem>
                            )} />
                        ))}
                    </div>
                    {form.watch("disliked_vegetables")?.includes("Otros") && (
                        <FormField control={form.control} name="disliked_vegetables_other" render={({ field }) => (
                            <FormItem className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <FormControl><Input {...field} placeholder="Especificar otros vegetales..." className="h-12 bg-white/5 border-white/10 rounded-xl text-white" /></FormControl>
                            </FormItem>
                        )} />
                    )}
                </FormItem>
            )} />

            <FormField control={form.control} name="disliked_fruits" render={() => (
                <FormItem>
                    <FormLabel className="text-xl font-black text-white uppercase tracking-tighter">Frutas que no te agradan</FormLabel>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6">
                        {options.fruit.map(opt => (
                            <FormField key={opt} control={form.control} name="disliked_fruits" render={({ field }) => (
                                <FormItem className="flex items-center space-x-3 bg-white/5 p-4 rounded-xl border border-white/10 hover:border-nutri-brand/30 transition-all cursor-pointer">
                                    <FormControl><Checkbox checked={field.value?.includes(opt)} onCheckedChange={(checked) => {
                                        const current = field.value || [];
                                        if (opt === "Todas me agradan") return checked ? field.onChange(["Todas me agradan"]) : field.onChange([]);
                                        const filtered = current.filter((v: string) => v !== "Todas me agradan");
                                        return checked ? field.onChange([...filtered, opt]) : field.onChange(filtered.filter((v: string) => v !== opt));
                                    }} /></FormControl>
                                    <Label className="text-slate-300 font-bold cursor-pointer text-[10px] tracking-widest">{opt}</Label>
                                </FormItem>
                            )} />
                        ))}
                    </div>
                    {form.watch("disliked_fruits")?.includes("Otros") && (
                        <FormField control={form.control} name="disliked_fruits_other" render={({ field }) => (
                            <FormItem className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <FormControl><Input {...field} placeholder="Especificar otras frutas..." className="h-12 bg-white/5 border-white/10 rounded-xl text-white" /></FormControl>
                            </FormItem>
                        )} />
                    )}
                </FormItem>
            )} />

            <FormField control={form.control} name="disliked_preparations" render={() => (
                <FormItem>
                    <FormLabel className="text-xl font-black text-white uppercase tracking-tighter">Preparaciones que no te agradan</FormLabel>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                        {options.prep.map(opt => (
                            <FormField key={opt} control={form.control} name="disliked_preparations" render={({ field }) => (
                                <FormItem className="flex items-center space-x-3 bg-white/5 p-4 rounded-xl border border-white/10 hover:border-nutri-brand/30 transition-all cursor-pointer">
                                    <FormControl><Checkbox checked={field.value?.includes(opt)} onCheckedChange={(checked) => {
                                        const current = field.value || [];
                                        if (opt === "Todas me agradan") return checked ? field.onChange(["Todas me agradan"]) : field.onChange([]);
                                        const filtered = current.filter((v: string) => v !== "Todas me agradan");
                                        return checked ? field.onChange([...filtered, opt]) : field.onChange(filtered.filter((v: string) => v !== opt));
                                    }} /></FormControl>
                                    <Label className="text-slate-300 font-bold cursor-pointer text-[10px] tracking-widest">{opt}</Label>
                                </FormItem>
                            )} />
                        ))}
                    </div>
                    {form.watch("disliked_preparations")?.includes("Otros") && (
                        <FormField control={form.control} name="disliked_preparations_other" render={({ field }) => (
                            <FormItem className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                <FormControl><Input {...field} placeholder="Especificar otras preparaciones..." className="h-12 bg-white/5 border-white/10 rounded-xl text-white" /></FormControl>
                            </FormItem>
                        )} />
                    )}
                </FormItem>
            )} />
        </div>
    );
}

function Lifestyle({ form }: { form: any }) {
    const habits = ["Gaseosas", "Dulces/Postres", "Alcohol", "Tabaco", "Comida rápida", "Frituras", "Exceso de sal", "Picoteo", "Pocas frutas", "Pocas verduras"];

    return (
        <div className="space-y-12">
            <FormField control={form.control} name="previous_unhealthy_habits" render={() => (
                <FormItem>
                    <FormLabel className="text-xl font-black text-white uppercase tracking-tighter">¿qué Hábitos no saludables sueles o solías tener?</FormLabel>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
                        {habits.map((item) => (
                            <FormField key={item} control={form.control} name="previous_unhealthy_habits" render={({ field }) => (
                                <FormItem className="flex items-center space-x-3 bg-white/5 p-4 rounded-xl border border-white/10 hover:border-nutri-brand/30 transition-all cursor-pointer group">
                                    <FormControl><Checkbox checked={field.value?.includes(item)} onCheckedChange={(checked) => {
                                        const current = field.value || [];
                                        return checked ? field.onChange([...current, item]) : field.onChange(current.filter((v: string) => v !== item));
                                    }} /></FormControl>
                                    <Label className="text-slate-300 group-hover:text-white font-bold cursor-pointer text-[10px] tracking-widest">{item}</Label>
                                </FormItem>
                            )} />
                        ))}
                    </div>
                </FormItem>
            )} />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-white/5">
                <FormField control={form.control} name="wake_up_time" render={({ field }) => (
                    <FormItem><FormLabel>Hora despertar</FormLabel><FormControl><Input type="time" {...field} className="h-12 bg-white/5 border-white/10 rounded-xl text-white" /></FormControl></FormItem>
                )} />
                <FormField control={form.control} name="sleep_time" render={({ field }) => (
                    <FormItem><FormLabel>Hora dormir</FormLabel><FormControl><Input type="time" {...field} className="h-12 bg-white/5 border-white/10 rounded-xl text-white" /></FormControl></FormItem>
                )} />
            </div>

            <div className="space-y-8 pt-10 border-t border-white/5">
                <h4 className="text-sm font-black text-slate-500 uppercase tracking-widest">Detalle de Comidas Diarias</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <FormField control={form.control} name="breakfast_time" render={({ field }) => (
                        <FormItem><FormLabel>Hora Desayuno</FormLabel><FormControl><Input type="time" {...field} className="h-12 bg-white/5 border-white/10 rounded-xl text-white" /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="breakfast_details" render={({ field }) => (
                        <FormItem className="md:col-span-2"><FormLabel>¿qué sueles desayunar?</FormLabel><FormControl><Input {...field} placeholder="Ej: Avena con frutas" className="h-12 bg-white/5 border-white/10 rounded-xl text-white" /></FormControl></FormItem>
                    )} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <FormField control={form.control} name="lunch_time" render={({ field }) => (
                        <FormItem><FormLabel>Hora Almuerzo</FormLabel><FormControl><Input type="time" {...field} className="h-12 bg-white/5 border-white/10 rounded-xl text-white" /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="lunch_details" render={({ field }) => (
                        <FormItem className="md:col-span-2"><FormLabel>¿qué sueles almorzar?</FormLabel><FormControl><Input {...field} placeholder="Ej: Pollo con arroz" className="h-12 bg-white/5 border-white/10 rounded-xl text-white" /></FormControl></FormItem>
                    )} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <FormField control={form.control} name="dinner_time" render={({ field }) => (
                        <FormItem><FormLabel>Hora Cena</FormLabel><FormControl><Input type="time" {...field} className="h-12 bg-white/5 border-white/10 rounded-xl text-white" /></FormControl></FormItem>
                    )} />
                    <FormField control={form.control} name="dinner_details" render={({ field }) => (
                        <FormItem className="md:col-span-2"><FormLabel>¿qué sueles cenar?</FormLabel><FormControl><Input {...field} placeholder="Ej: Sopa o ensalada" className="h-12 bg-white/5 border-white/10 rounded-xl text-white" /></FormControl></FormItem>
                    )} />
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-10 pt-10 border-t border-white/5">
                <FormField control={form.control} name="prep_preference" render={({ field }) => (
                    <FormItem><FormLabel>Preferencia de preparación</FormLabel>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} value={field.value} className="flex gap-8 mt-4">
                            <div className="flex items-center space-x-2"><RadioGroupItem value="faciles" id="p-f" /><Label htmlFor="p-f" className="text-white cursor-pointer">Fáciles</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="dificiles" id="p-d" /><Label htmlFor="p-d" className="text-white cursor-pointer">Complejas</Label></div>
                        </RadioGroup>
                    </FormItem>
                )} />
                <FormField control={form.control} name="taste_preference" render={({ field }) => (
                    <FormItem><FormLabel>Preferencia de sabor</FormLabel>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} value={field.value} className="flex gap-8 mt-4">
                            <div className="flex items-center space-x-2"><RadioGroupItem value="dulces" id="t-d" /><Label htmlFor="t-d" className="text-white cursor-pointer">Dulces</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="salados" id="t-s" /><Label htmlFor="t-s" className="text-white cursor-pointer">Salados</Label></div>
                        </RadioGroup>
                    </FormItem>
                )} />
            </div>
        </div>
    );
}
