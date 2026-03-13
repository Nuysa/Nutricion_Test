"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Check, Flame, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";

// Calendar
const daysOfWeek = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];

function MiniCalendar({ selectedDate, onDateSelect }: { selectedDate: Date; onDateSelect: (date: Date) => void }) {
    const [viewDate, setViewDate] = useState(new Date(selectedDate));
    const today = new Date();

    const daysInMonth = new Date(
        viewDate.getFullYear(),
        viewDate.getMonth() + 1,
        0
    ).getDate();

    const firstDayOfMonth = new Date(
        viewDate.getFullYear(),
        viewDate.getMonth(),
        1
    ).getDay();

    const offset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const monthName = viewDate.toLocaleDateString("es-ES", {
        month: "long",
        year: "numeric",
    });

    const prevMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
    const nextMonth = () => setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));

    return (
        <Card className="rounded-[2.5rem] border border-white/5 bg-nutri-panel shadow-sm overflow-hidden">
            <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle className="text-sm font-tech font-bold text-white capitalize">{monthName}</CardTitle>
                <div className="flex gap-1">
                    <button onClick={prevMonth} className="p-1 rounded-md hover:bg-white/5 transition-colors text-slate-400">
                        <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button onClick={nextMonth} className="p-1 rounded-md hover:bg-white/5 transition-colors text-slate-400">
                        <ChevronRight className="h-4 w-4" />
                    </button>
                </div>
            </CardHeader>
            <CardContent className="pb-4">
                <div className="grid grid-cols-7 gap-1 text-center mb-2">
                    {daysOfWeek.map((day) => (
                        <div key={day} className="text-[10px] text-slate-500 font-tech font-black uppercase tracking-widest py-1">
                            {day}
                        </div>
                    ))}
                </div>
                <div className="grid grid-cols-7 gap-1 text-center font-tech">
                    {Array.from({ length: offset }).map((_, i) => (
                        <div key={`empty-${i}`} />
                    ))}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                        const day = i + 1;
                        const date = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
                        const isToday = date.toDateString() === today.toDateString();
                        const isSelected = date.toDateString() === selectedDate.toDateString();

                        return (
                            <button
                                key={day}
                                onClick={() => onDateSelect(date)}
                                className={cn(
                                    "h-8 w-8 mx-auto rounded-lg text-xs font-bold transition-all",
                                    isSelected
                                        ? "bg-nutri-brand text-white shadow-lg shadow-nutri-brand/20 scale-110"
                                        : isToday
                                            ? "border-2 border-nutri-brand/20 text-nutri-brand"
                                            : "hover:bg-white/5 text-slate-400"
                                )}
                            >
                                {day}
                            </button>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

// Meals Timeline
const mealTypeLabels: Record<string, string> = {
    breakfast: "Desayuno",
    "mid-morning": "Media Mañana",
    lunch: "Almuerzo",
    "mid-afternoon": "Media Tarde",
    dinner: "Cena",
    snack: "Snack",
    desayuno: "Desayuno",
    almuerzo: "Almuerzo",
    cena: "Cena",
    "pre-entreno": "Pre-Entreno",
    "post-entreno": "Post-Entreno"
};

const mealTypeColors: Record<string, string> = {
    breakfast: "bg-nutri-brand",
    "mid-morning": "bg-sky-400",
    lunch: "bg-orange-400",
    "mid-afternoon": "bg-amber-400",
    dinner: "bg-purple-400",
    snack: "bg-slate-400",
    desayuno: "bg-nutri-brand",
    almuerzo: "bg-orange-400",
    cena: "bg-purple-400",
    "pre-entreno": "bg-amber-500",
    "post-entreno": "bg-emerald-500"
};

function MealsTimeline({ date, patientId, planType, version }: { date: Date, patientId?: string, planType?: string, version?: number }) {
    const [meals, setMeals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        if (!patientId) return;
        async function fetchData() {
            setLoading(true);
            // Use local date values for consistent YYYY-MM-DD formatting
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;

            if (planType === "plan flexible") {
                // For Flexible Plan, we show the compliance logs (what they ate)
                const { data: compliance, error: compError } = await supabase
                    .from("flexible_plan_compliance")
                    .select("*")
                    .eq("patient_id", patientId)
                    .eq("date", dateStr);

                // We also need the meal names from the flexible plan to show the structure
                const { data: flexPlan } = await supabase
                    .from("flexible_plans")
                    .select("data")
                    .eq("patient_id", patientId)
                    .order('created_at', { ascending: false })
                    .limit(1)
                    .maybeSingle();

                if (flexPlan?.data?.meals) {
                    const activeMeals = flexPlan.data.meals.filter((m: any) => m.active);
                    const formattedMeals = activeMeals.map((m: any) => {
                        const mealCompliance = compliance?.filter((c: any) => c.meal_id === m.id) || [];
                        // Join all ingredients from all groups for this meal
                        const ingredients = mealCompliance.flatMap((c: any) => c.ingredients || []);

                        return {
                            id: m.id,
                            name: m.name,
                            meal_type: m.id, // Using the id as type
                            items: ingredients,
                            checked: ingredients.length > 0,
                            calories: 0 // We'd need a calculator here, showing 0 for now as per the placeholder
                        };
                    });
                    setMeals(formattedMeals);
                } else {
                    setMeals([]);
                }
            } else {
                // Default: Plan Menú Semanal
                const { data, error } = await supabase
                    .from("meals")
                    .select("*")
                    .eq("patient_id", patientId)
                    .eq("date", dateStr);

                if (data && !error) {
                    const mealOrder = ["breakfast", "mid-morning", "lunch", "mid-afternoon", "dinner", "snack"];
                    const sortedMeals = data.sort((a, b) => mealOrder.indexOf(a.meal_type) - mealOrder.indexOf(b.meal_type));
                    setMeals(sortedMeals);
                } else {
                    setMeals([]);
                }
            }
            setLoading(false);
        }
        fetchData();
    }, [date, patientId, planType, version]);


    return (
        <Card className="rounded-[2.5rem] border border-white/5 bg-nutri-panel shadow-sm overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-tech font-bold text-white">Plan de Comidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {loading ? (
                    <div className="py-8 text-center text-xs text-slate-500 animate-pulse font-tech">Cargando...</div>
                ) : meals.length > 0 ? (
                    meals.map((meal, idx) => (
                        <div key={idx} className="flex gap-3">
                            <div className="flex flex-col items-center">
                                <div className={cn("h-6 w-6 rounded-full flex items-center justify-center flex-shrink-0 transition-all", meal.checked ? "bg-nutri-brand" : "border-2 border-white/5")}>
                                    {meal.checked && <Check className="h-3.5 w-3.5 text-white" />}
                                </div>
                                {idx < meals.length - 1 && <div className="w-px flex-1 bg-white/5 mt-1" />}
                            </div>
                            <div className="pb-4 flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-0.5">
                                    <span className={cn("h-2 w-2 rounded-full", mealTypeColors[meal.meal_type] || "bg-slate-400")} />
                                    <span className="text-[10px] font-tech font-black uppercase tracking-widest text-slate-500">{mealTypeLabels[meal.meal_type] || meal.name}</span>
                                    <span className="text-xs text-white/40 flex items-center gap-0.5 ml-auto font-tech font-bold">
                                        <Flame className="h-3 w-3 text-nutri-brand" />
                                        {meal.calories || 0}
                                    </span>
                                </div>
                                <div className="space-y-1">
                                    {Array.isArray(meal.items) && meal.items.length > 0 ? (
                                        meal.items.map((item: string, i: number) => (
                                            <p key={i} className="text-[10px] font-bold text-white leading-tight opacity-90">
                                                • {item}
                                            </p>
                                        ))
                                    ) : (
                                        <p className="text-xs font-bold text-white leading-tight mb-1.5">
                                            {meal.name || "-"}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-6 text-center">
                        <p className="text-xs text-slate-500 italic font-tech">No hay comidas asignadas.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

const getAppointmentStatus = (status: string, date: string, time: string) => {
    const lowerStatus = (status || '').toLowerCase();
    const normalizedTime = time.includes(':') ? time : '00:00';
    const aptDate = new Date(`${date}T${normalizedTime}`);
    const now = new Date();
    
    if (['programada', 'scheduled', 'programado'].includes(lowerStatus)) {
        if (now > aptDate) return { label: 'no confirmado', className: "bg-red-500/20 text-red-500 border-red-500/20" };
        return { label: 'programada', className: "bg-blue-500/20 text-blue-400 border-blue-500/20" };
    }
    
    if (['completada', 'completed', 'atendida'].includes(lowerStatus)) {
        return { label: 'completada', className: "bg-green-500/20 text-green-500 border-green-500/20" };
    }
    
    if (['confirmada', 'confirmed'].includes(lowerStatus)) {
        return { label: 'confirmada', className: "bg-emerald-500/20 text-emerald-500 border-emerald-500/20" };
    }

    if (['cancelada', 'cancelled', 'cancelado'].includes(lowerStatus)) {
        return { label: 'cancelada', className: "bg-slate-500/20 text-slate-500 border-slate-500/20" };
    }

    return { label: status, className: "bg-white/5 text-slate-400 border-white/10" };
};

function ScheduledAppointments({ date, patientId, version }: { date: Date, patientId?: string, version?: number }) {
    const [apts, setApts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        if (!patientId) return;
        async function fetchAppointments() {
            setLoading(true);
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const dateStr = `${year}-${month}-${day}`;

            const { data, error } = await supabase
                .from("appointments")
                .select("*, nutritionist:profiles!nutritionist_id(full_name)")
                .eq("patient_id", patientId)
                .eq("appointment_date", dateStr);

            if (data && !error) {
                setApts(data);
            } else {
                setApts([]);
            }
            setLoading(false);
        }
        fetchAppointments();
    }, [date, patientId, version]);


    return (
        <Card className="rounded-[2.5rem] border border-white/5 bg-nutri-panel shadow-sm overflow-hidden">
            <CardHeader className="pb-2">
                <CardTitle className="text-sm font-tech font-bold text-white">Citas para este día</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                {loading ? (
                    <div className="py-6 text-center text-xs text-slate-500 animate-pulse font-tech">Cargando...</div>
                ) : apts.length > 0 ? (
                    apts.map((apt, i) => (
                        <div key={i} className="flex gap-3 group">
                            <div className="flex flex-col items-center">
                                <span className="text-xl h-10 w-10 flex items-center justify-center bg-white/5 rounded-full">
                                    {apt.modality === "virtual" ? "📹" : "🏥"}
                                </span>
                                {i < apts.length - 1 && <div className="w-px flex-1 bg-white/5 mt-2" />}
                            </div>
                            <div className="pb-4 flex-1 min-w-0">
                                <div className="flex justify-between items-start mb-0.5">
                                    <p className="text-xs font-tech font-bold text-white">
                                        {apt.start_time.substring(0, 5)} - {apt.modality === "virtual" ? "Virtual" : "Presencial"}
                                    </p>
                                    {(() => {
                                        const { label, className } = getAppointmentStatus(apt.status, apt.appointment_date, apt.start_time);
                                        return (
                                            <Badge className={cn("text-[8px] px-2 py-0.5 uppercase font-tech font-black tracking-tighter rounded-full border-none", className)}>
                                                {label}
                                            </Badge>
                                        );
                                    })()}
                                </div>
                                <p className="text-xs text-slate-500 font-medium">
                                    {apt.nutritionist?.full_name || "Especialista"}
                                </p>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="py-4 text-center">
                        <p className="text-xs text-slate-500 italic font-tech">Sin eventos registrados.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

function NextAppointment({ patientId, profileId, version }: { patientId?: string; profileId?: string; version?: number }) {
    const [nextAppt, setNextAppt] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [planStats, setPlanStats] = useState({ used: 0, limit: 0, isActive: false });
    const supabase = createClient();

    useEffect(() => {
        if (!patientId) return;
        async function fetchNext() {
            setLoading(true);
            const todayStr = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD

            // 1. Fetch Next Appointment
            const { data: appt } = await supabase
                .from("appointments")
                .select("*, nutritionist:profiles!nutritionist_id(full_name)")
                .eq("patient_id", patientId)
                .gte("appointment_date", todayStr)
                .neq("status", "completed")
                .order("appointment_date", { ascending: true })
                .order("start_time", { ascending: true })
                .limit(1)
                .maybeSingle();

            setNextAppt(appt);

            // 2. Fetch Plan Stats
            const { data: sub } = await supabase
                .from('subscriptions')
                .select('*, plan:subscription_plans(included_measurements)')
                .eq('patient_id', profileId)
                .eq('status', 'activa')
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (sub) {
                const limit = sub.plan?.included_measurements || sub.metadata?.measurements_limit || 0;
                const { count } = await supabase
                    .from('weight_records')
                    .select('*', { count: 'exact', head: true })
                    .eq('patient_id', patientId)
                    .gte('created_at', sub.created_at);

                setPlanStats({ used: count || 0, limit, isActive: true });
            } else {
                setPlanStats({ used: 0, limit: 0, isActive: false });
            }

            setLoading(false);
        }
        fetchNext();
    }, [patientId, version]);

    if (loading) return (
        <Card className="rounded-[2.5rem] bg-nutri-panel border border-white/5 h-24 animate-pulse shadow-xl" />
    );

    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const d = nextAppt ? new Date(nextAppt.appointment_date + 'T12:00:00') : null;

    return (
        <Card className="rounded-[2.5rem] bg-nutri-base text-white shadow-xl overflow-hidden relative group border border-nutri-brand/10">
            <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                    <CardTitle className="text-[10px] font-tech font-black uppercase tracking-[0.2em] text-nutri-brand">Próxima Cita</CardTitle>
                    <Badge variant="outline" className={cn(
                        "text-[10px] border-none font-black px-3 py-1 rounded-lg",
                        (!planStats.isActive || planStats.used >= planStats.limit)
                            ? "bg-red-500/10 text-red-500"
                            : "bg-nutrition-500/10 text-nutrition-400"
                    )}>
                        {(!planStats.isActive || planStats.used >= planStats.limit)
                            ? "0 Mediciones Restantes"
                            : `${planStats.limit - planStats.used} Mediciones Restantes`}
                    </Badge>
                </div>
            </CardHeader>
            <CardContent>
                {nextAppt && d ? (
                    <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-2xl bg-white/5 flex flex-col items-center justify-center border border-white/10">
                            <span className="text-[10px] font-tech font-black uppercase text-nutri-brand leading-none">{monthNames[d.getMonth()]}</span>
                            <span className="text-xl font-tech font-black leading-none mt-1">{d.getDate()}</span>
                        </div>
                        <div className="flex-1">
                            <div className="flex items-center justify-between">
                                <p className="text-sm font-bold text-white leading-tight">Consulta</p>
                                {(() => {
                                    const { label, className } = getAppointmentStatus(nextAppt.status, nextAppt.appointment_date, nextAppt.start_time);
                                    return (
                                        <Badge className={cn("text-[8px] px-2 py-0.5 uppercase font-tech font-black tracking-tighter rounded-full border-none", className)}>
                                            {label}
                                        </Badge>
                                    );
                                })()}
                            </div>
                            <div className="flex items-center gap-3 mt-1 text-slate-500">
                                <span className="flex items-center gap-1.5 text-[10px] font-tech font-bold">
                                    {nextAppt.start_time.substring(0, 5)}
                                </span>
                                <span className="flex items-center gap-1.5 text-[10px] font-tech font-bold">
                                    {nextAppt.modality === 'virtual' ? '📹 Virtual' : '🏥 Presencial'}
                                </span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="py-2 text-center">
                        <p className="text-xs text-slate-500 italic font-tech">No tienes citas programadas.</p>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export function RightSidebar() {
    const [selectedDate, setSelectedDate] = useState(new Date());
    const [patientId, setPatientId] = useState<string>();
    const [profileId, setProfileId] = useState<string>();
    const [planType, setPlanType] = useState<string>();
    const [version, setVersion] = useState(0);
    const supabase = createClient();

    useEffect(() => {
        async function getPatient() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
            if (!profile) return;
            setProfileId(profile.id);
            const { data: patient } = await supabase.from("patients").select("id, plan_type").eq("profile_id", profile.id).single();
            if (patient) {
                setPatientId(patient.id);
                setPlanType(patient.plan_type);
                // Increment version to trigger refreshes in child components
                setVersion(v => v + 1);
            }
        }
        getPatient();

        // Realtime sync for the whole sidebar
        const channel = supabase
            .channel('patient_sidebar_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => getPatient())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'meals' }, () => getPatient())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => getPatient())
            .on('postgres_changes', { event: '*', schema: 'public', table: 'flexible_plan_compliance' }, () => getPatient())
            .subscribe();

        const bc = new BroadcastChannel('nutrigo_global_sync');
        bc.onmessage = () => getPatient();

        return () => {
            supabase.removeChannel(channel);
            bc.close();
        };
    }, []);

    return (
        <div className="space-y-4 sticky top-24 h-[calc(100vh-7rem)] overflow-y-auto pr-2 custom-scrollbar">
            <MiniCalendar selectedDate={selectedDate} onDateSelect={setSelectedDate} />
            <NextAppointment patientId={patientId} profileId={profileId} version={version} />
            <MealsTimeline date={selectedDate} patientId={patientId} planType={planType} version={version} />
            <ScheduledAppointments date={selectedDate} patientId={patientId} version={version} />
        </div>
    );
}
