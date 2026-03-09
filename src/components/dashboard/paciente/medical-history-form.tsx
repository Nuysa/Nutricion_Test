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
    Moon, Utensils, Camera, AlertCircle, Sparkles, CheckCircle2, Clock
} from "lucide-react";
import { cn } from "@/lib/utils";

const medicalHistorySchema = z.object({
    // Step 1: Datos Personales
    full_name: z.string().min(3, "Nombre completo requerido"),
    dni: z.string().min(8, "DNI o CE requerido"),
    email: z.string().email("Email inválido"),
    age: z.coerce.number().min(1, "Edad requerida"),
    birth_date: z.string().min(1, "Fecha de nacimiento requerida"),
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

    // Step 4: Estado de Salud
    health_conditions: z.array(z.string()).default([]),
    family_history: z.array(z.string()).default([]),
    takes_medication: z.string().min(1, "Respuesta requerida"),
    medication_details: z.string().optional(),
    medication_frequency: z.string().optional(),
    recent_lab_tests: z.string().min(1, "Respuesta requerida"),

    // Step 5: Actividad y Ejercicio
    activity_level: z.string().min(1, "Actividad diaria requerida"),
    work_schedule: z.string().optional(),
    does_exercise: z.string().min(1, "Respuesta requerida"),
    exercise_duration: z.string().optional(),
    exercise_types: z.array(z.string()).default([]),
    exercise_days: z.array(z.string()).default([]),
    exercise_time: z.string().optional(),
    has_calorie_tracker: z.string().optional(),
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
    likes_cooking: z.string().min(1, "Respuesta requerida"),
    cooking_preparations: z.string().optional(),
    food_allergies: z.string().optional(),
    food_intolerances: z.string().min(1, "Respuesta requerida"),
    intolerance_details: z.string().optional(),

    // Step 8: Lácteos y Suplementos
    dairy_consumption: z.string().min(1, "Respuesta requerida"),
    dairy_brands: z.string().optional(),
    supplements_consumption: z.string().min(1, "Respuesta requerida"),
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

export function MedicalHistoryForm() {
    const supabase = createClient();
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [patientId, setPatientId] = useState<string | null>(null);
    const totalSteps = 10;

    const form = useForm<MedicalHistoryFormValues>({
        resolver: zodResolver(medicalHistorySchema) as any,
        defaultValues: {
            full_name: "",
            dni: "",
            email: "",
            age: 0,
            birth_date: "",
            health_conditions: [],
            family_history: [],
            exercise_types: [],
            exercise_days: [],
            appetite_peak_time: [],
            available_instruments: [],
            supplement_types: [],
            previous_unhealthy_habits: [],
        } as any,
    });

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase.from('profiles').select('id, full_name, email').eq('user_id', user.id).single();
            if (profile) {
                form.setValue('full_name', profile.full_name);
                form.setValue('email', profile.email || "");

                const { data: patient } = await supabase.from('patients').select('id, height_cm, current_weight, date_of_birth').eq('profile_id', profile.id).single();
                if (patient) {
                    setPatientId(patient.id);
                    if (patient.height_cm) form.setValue('height_cm', Number(patient.height_cm));
                    if (patient.current_weight) form.setValue('weight_kg', Number(patient.current_weight));
                    if (patient.date_of_birth) form.setValue('birth_date', patient.date_of_birth);
                }
            }
        };
        fetchUserData();
    }, []);

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

    const onSubmit = async (values: MedicalHistoryFormValues) => {
        if (!patientId) {
            toast({ title: "Error", description: "No se encontró el ID del paciente.", variant: "destructive" });
            return;
        }

        setLoading(true);
        try {
            // Prepare data for database, converting types where necessary
            const dbData = {
                ...values,
                patient_id: patientId,
                // Numeric transformations: convert empty strings to null for nullable columns
                weight_kg: values.weight_kg === "" ? null : values.weight_kg,
                waist_cm: values.waist_cm === "" ? null : values.waist_cm,
                // Boolean transformations
                previous_nutrition_service: values.previous_nutrition_service?.startsWith('yes'),
                takes_medication: values.takes_medication === 'yes',
                recent_lab_tests: values.recent_lab_tests === 'yes',
                does_exercise: values.does_exercise === 'yes',
                likes_cooking: values.likes_cooking === 'yes',
                supplements_consumption: values.supplements_consumption === 'yes',
                // Array to string transformations for columns defined as text in DB
                disliked_cereals: Array.isArray(values.disliked_cereals) ? values.disliked_cereals.join(', ') : values.disliked_cereals,
                disliked_tubers: Array.isArray(values.disliked_tubers) ? values.disliked_tubers.join(', ') : values.disliked_tubers,
                disliked_legumes: Array.isArray(values.disliked_legumes) ? values.disliked_legumes.join(', ') : values.disliked_legumes,
                disliked_meats: Array.isArray(values.disliked_meats) ? values.disliked_meats.join(', ') : values.disliked_meats,
                disliked_fats: Array.isArray(values.disliked_fats) ? values.disliked_fats.join(', ') : values.disliked_fats,
            };

            const { error } = await supabase.from('patient_medical_histories').upsert(dbData);

            if (error) throw error;

            toast({ title: "¡Éxito!", description: "Tu historia clínica ha sido guardada correctamente.", variant: "success" });
            window.location.href = "/dashboard/paciente";
        } catch (error: any) {
            console.error("Error saving medical history:", error);
            toast({ title: "Error", description: error.message || "Ocurrió un error al guardar.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const nextStep = async () => {
        const fields: (keyof MedicalHistoryFormValues)[] = [];
        if (step === 1) fields.push('full_name', 'dni', 'email', 'age', 'birth_date', 'education_level', 'region', 'district', 'occupation', 'job_details');
        if (step === 2) fields.push('nutritional_goal', 'previous_nutrition_service');
        if (step === 3) fields.push('weight_kg', 'height_cm', 'waist_cm');
        if (step === 4) fields.push('takes_medication', 'recent_lab_tests');
        if (step === 5) fields.push('activity_level', 'work_schedule', 'does_exercise');
        if (step === 6) fields.push('appetite_level', 'thirst_level', 'water_intake', 'sleep_quality', 'sleep_hours', 'bowel_movements', 'bowel_frequency', 'urine_status', 'urine_color_index');

        const isStepValid = await form.trigger(fields);
        if (isStepValid) setStep(prev => Math.min(prev + 1, totalSteps));
        else toast({ title: "Campos incompletos", description: "Por favor llena todos los campos requeridos del paso actual.", variant: "destructive" });
    };

    const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

    return (
        <Card className="rounded-[3rem] shadow-2xl border-white/5 bg-[#151F32] overflow-hidden">
            <CardHeader className="p-8 lg:p-12 border-b border-white/5 relative">
                <div className="absolute top-0 right-10 w-40 h-full bg-nutri-brand/10 blur-[60px] rounded-full" />
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-3xl lg:text-4xl font-black text-white tracking-tighter uppercase mb-2">
                            Completa tu <span className="text-nutri-brand">Historia Clínica</span>
                        </CardTitle>
                        <CardDescription className="text-slate-400 font-medium italic">
                            Paso {step} de {totalSteps}: {getStepTitle(step)}
                        </CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-8 lg:p-12">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit as any)} className="space-y-8">
                        {step === 1 && <PersonalData form={form} />}

                        {step === 2 && <GoalExperience form={form} />}
                        {step === 3 && <Measurements form={form} />}
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
                                disabled={step === 1}
                                className="px-8 h-14 rounded-2xl font-black uppercase tracking-widest text-slate-500 hover:text-white"
                            >
                                <ChevronLeft className="mr-2 h-5 w-5" /> Anterior
                            </Button>

                            {step < totalSteps ? (
                                <Button
                                    type="button"
                                    onClick={nextStep}
                                    className="px-10 h-14 rounded-2xl font-black uppercase tracking-widest bg-nutri-brand text-white shadow-lg shadow-nutri-brand/20 hover:scale-105 transition-all"
                                >
                                    Siguiente <ChevronRight className="ml-2 h-5 w-5" />
                                </Button>
                            ) : (
                                <Button
                                    type="submit"
                                    disabled={loading}
                                    className="px-12 h-14 rounded-2xl font-black uppercase tracking-widest bg-emerald-500 text-white shadow-lg shadow-emerald-500/20 hover:scale-105 transition-all"
                                >
                                    {loading ? "Guardando..." : "Guardar Historia Clínica"} <Save className="ml-2 h-5 w-5" />
                                </Button>
                            )}
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
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

function Measurements({ form }: { form: any }) {
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
                <div className="flex items-start gap-4">
                    <Camera className="h-6 w-6 text-nutri-brand mt-1" />
                    <div>
                        <h4 className="font-tech font-bold text-white uppercase tracking-widest text-sm mb-2">Fotos de Progreso (Opcional)</h4>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                            {['Frente', 'Costado 1', 'Costado 2', 'Espalda'].map(label => (
                                <div key={label} className="h-24 rounded-2xl bg-white/5 border border-white/5 flex flex-col items-center justify-center gap-2 cursor-pointer hover:bg-white/10 transition-colors">
                                    <Camera className="h-5 w-5 text-slate-600" />
                                    <span className="text-[10px] uppercase font-black tracking-widest text-slate-500">{label}</span>
                                </div>
                            ))}
                        </div>
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
                    <FormLabel className="text-lg">¿Presentas algunas de estas condiciones?</FormLabel>
                    <div className="grid grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                        {conditions.map((item) => (
                            <FormField key={item} control={form.control} name="health_conditions" render={({ field }) => (
                                <FormItem className="flex items-center space-x-3 space-y-0">
                                    <FormControl>
                                        <Checkbox
                                            checked={field.value?.includes(item)}
                                            onCheckedChange={(checked: boolean) => {
                                                const current = (field.value as string[]) || [];
                                                return checked ? field.onChange([...current, item]) : field.onChange(current.filter((value: string) => value !== item));
                                            }}
                                        />
                                    </FormControl>
                                    <FormLabel className="font-medium text-slate-300">{item}</FormLabel>
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
                <FormItem><FormLabel className="text-lg">¿Cómo es tu actividad diaria?</FormLabel>
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
                <FormItem><FormLabel>¿Actualmente realizas ejercicio?</FormLabel>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-8">
                        <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="exe-yes" /><Label htmlFor="exe-yes" className="text-white">Sí</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="exe-no" /><Label htmlFor="exe-no" className="text-white">No</Label></div>
                    </RadioGroup>
                    <FormMessage /></FormItem>
            )} />
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
        </div>
    );
}

function DietCooking({ form }: { form: any }) {
    return (
        <div className="space-y-10">
            <FormField control={form.control} name="cooks_for_self" render={({ field }) => (
                <FormItem><FormLabel>¿Quién prepara tu comida?</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl><SelectTrigger className="h-12 rounded-xl bg-white/5 border-white/10 text-white"><SelectValue placeholder="Seleccionar" /></SelectTrigger></FormControl>
                        <SelectContent className="bg-[#151F32] border-white/10 text-white">
                            <SelectItem value="yo_mismo">Yo mism@</SelectItem>
                            <SelectItem value="pareja">Pareja</SelectItem>
                            <SelectItem value="mama">Mamá</SelectItem>
                            <SelectItem value="hermana">Hermana</SelectItem>
                            <SelectItem value="abuela">Abuela</SelectItem>
                            <SelectItem value="restaurante">Come en el restaurante</SelectItem>
                            <SelectItem value="concesionario">Come en el concesionario</SelectItem>
                        </SelectContent>
                    </Select>
                    <FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="likes_cooking" render={({ field }) => (
                <FormItem><FormLabel>¿Te gusta cocinar?</FormLabel>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-8">
                        <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="cook-yes" /><Label htmlFor="cook-yes" className="text-white">Sí</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="cook-no" /><Label htmlFor="cook-no" className="text-white">No</Label></div>
                    </RadioGroup>
                    <FormMessage /></FormItem>
            )} />
            <FormField control={form.control} name="food_intolerances" render={({ field }) => (
                <FormItem><FormLabel>¿Eres intolerante a algún alimento?</FormLabel>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-8">
                        <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="int-yes" /><Label htmlFor="int-yes" className="text-white">Sí</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="int-no" /><Label htmlFor="int-no" className="text-white">No</Label></div>
                    </RadioGroup>
                    <FormMessage /></FormItem>
            )} />
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
            <FormField control={form.control} name="supplements_consumption" render={({ field }) => (
                <FormItem><FormLabel>¿Consumes suplementos?</FormLabel>
                    <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-8">
                        <div className="flex items-center space-x-2"><RadioGroupItem value="yes" id="sup-yes" /><Label htmlFor="sup-yes" className="text-white">Sí</Label></div>
                        <div className="flex items-center space-x-2"><RadioGroupItem value="no" id="sup-no" /><Label htmlFor="sup-no" className="text-white">No</Label></div>
                    </RadioGroup>
                    <FormMessage /></FormItem>
            )} />
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <FormField control={form.control} name="wake_up_time" render={({ field }) => (
                    <FormItem><FormLabel>Hora despertar</FormLabel><FormControl><Input type="time" {...field} className="h-12 rounded-xl bg-white/5 border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="sleep_time" render={({ field }) => (
                    <FormItem><FormLabel>Hora dormir</FormLabel><FormControl><Input type="time" {...field} className="h-12 rounded-xl bg-white/5 border-white/10 text-white" /></FormControl><FormMessage /></FormItem>
                )} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
                <FormField control={form.control} name="prep_preference" render={({ field }) => (
                    <FormItem><FormLabel>Preferencia preparación</FormLabel>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-8">
                            <div className="flex items-center space-x-2"><RadioGroupItem value="faciles" id="p-e" /><Label htmlFor="p-e" className="text-white">Fáciles</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="dificiles" id="p-h" /><Label htmlFor="p-h" className="text-white">Difíciles</Label></div>
                        </RadioGroup>
                        <FormMessage /></FormItem>
                )} />
                <FormField control={form.control} name="taste_preference" render={({ field }) => (
                    <FormItem><FormLabel>Preferencia sabor</FormLabel>
                        <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex gap-8">
                            <div className="flex items-center space-x-2"><RadioGroupItem value="dulces" id="t-s" /><Label htmlFor="t-s" className="text-white">Dulces</Label></div>
                            <div className="flex items-center space-x-2"><RadioGroupItem value="salados" id="t-a" /><Label htmlFor="t-a" className="text-white">Salados</Label></div>
                        </RadioGroup>
                        <FormMessage /></FormItem>
                )} />
            </div>
        </div>
    );
}
