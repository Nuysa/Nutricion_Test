"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ChevronLeft, ChevronRight, Clock, Video, MapPin, Info, Calendar as CalendarIcon, AlertCircle
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { es } from "date-fns/locale";

const daysOfWeek = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

interface CalendarAppointment {
    id: string;
    day: number;
    month: number;
    year: number;
    title: string;
    time: string;
    type: "virtual" | "in-person";
    status: "scheduled" | "completed" | "cancelled" | "confirmed" | "reprogrammed" | "not_confirmed";
    nutritionist?: string;
}


import { useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export default function CalendarPage() {
    const today = new Date();
    const [currentMonth, setCurrentMonth] = useState(today.getMonth());
    const [currentYear] = useState(today.getFullYear());
    const [selectedDay, setSelectedDay] = useState<number | null>(today.getDate());
    const [appointments, setAppointments] = useState<CalendarAppointment[]>([]);
    const [activeTab, setActiveTab] = useState<"calendar" | "history">("calendar");
    const [loading, setLoading] = useState(true);
    const [currentTime, setCurrentTime] = useState(new Date());
    const { toast } = useToast();
    const supabase = createClient();

    useEffect(() => {
        async function loadPatientData() {
            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
                if (!profile) return;

                const { data: patient } = await supabase.from("patients").select("id").eq("profile_id", profile.id).single();
                if (!patient) return;

                const { data: fetchedAppointments, error } = await supabase
                    .from("appointments")
                    .select("*, nutritionist:profiles!nutritionist_id(full_name)")
                    .eq("patient_id", patient.id);

                if (error) throw error;

                if (fetchedAppointments) {
                    const mapped = fetchedAppointments.map((a: any) => {
                        const d = new Date(a.appointment_date + 'T12:00:00');
                        return {
                            id: a.id,
                            day: d.getDate(),
                            month: d.getMonth(),
                            year: d.getFullYear(),
                            dateStr: a.appointment_date,
                            title: "Consulta Nutricional",
                            time: a.start_time.substring(0, 5),
                            type: a.modality,
                            status: a.status,
                            nutritionist: a.nutritionist?.full_name || "Especialista"
                        };
                    });
                    setAppointments(mapped);
                }
            } catch (err) {
                console.error("Error loading patient appointments:", err);
            } finally {
                setLoading(false);
            }
        }

        loadPatientData();

        const timer = setInterval(() => {
            setCurrentTime(new Date());
        }, 30000); 

        const channel = new BroadcastChannel('nutrigo_global_sync');
        channel.onmessage = (msg) => {
            if (msg.data.type === 'APPOINTMENTS_UPDATED') loadPatientData();
        };

        return () => {
            clearInterval(timer);
            channel.close();
        };
    }, []);

    // Derived state for real-time status updates
    // Derived state for real-time status updates (SUPER ROBUST)
    const processedAppointments = appointments.map(apt => {
        const s = (apt.status || "").toLowerCase();
        
        // Terminal statuses
        if (['completed', 'completada', 'atendida', 'cancelled', 'cancelada'].includes(s)) {
            return apt;
        }

        try {
            const [yr, mo, dy] = (apt as any).dateStr.split('-').map(Number);
            const [hr, mi] = apt.time.split(':').map(Number);
            const aptDate = new Date(yr, mo - 1, dy, hr, mi);
            
            if (aptDate < currentTime && ['scheduled', 'programada', 'programado'].includes(s)) {
                return { ...apt, status: 'not_confirmed' as any };
            }
        } catch (e) {
            console.error("Error detecting unconfirmed:", e);
        }
        
        return apt;
    });

    const updateStatus = async (id: string, newStatus: string) => {
        try {
            const { error } = await supabase
                .from("appointments")
                .update({ status: newStatus })
                .eq("id", id);

            if (error) throw error;

            // Notify all components to sync
            const channel = new BroadcastChannel('nutrigo_global_sync');
            channel.postMessage({ type: 'APPOINTMENTS_UPDATED' });
            channel.close();

            // Refresh local state
            setAppointments(prev => prev.map(a => a.id === id ? { ...a, status: newStatus as any } : a));

            if (newStatus === "reprogrammed") {
                toast({
                    title: "Solicitud enviada",
                    description: "Por favor, contacta a tu nutricionista por el chat para coordinar la nueva fecha.",
                });
            }
        } catch (err) {
            console.error("Error updating appointment status:", err);
            toast({ title: "Error", description: "No se pudo actualizar la cita", variant: "destructive" });
        }
    };

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const offset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const getAppointmentsForDay = (day: number) =>
        processedAppointments.filter((a) => {
            return Number(a.day) === Number(day) &&
                Number(a.month) === Number(currentMonth) &&
                Number(a.year) === Number(currentYear);
        });

    const selectedDayAppointments = selectedDay ? getAppointmentsForDay(selectedDay) : [];

    const prevMonth = () => setCurrentMonth((p) => (p === 0 ? 11 : p - 1));
    const nextMonth = () => setCurrentMonth((p) => (p === 11 ? 0 : p + 1));

    const isMoreThan12HoursAway = (apt: CalendarAppointment) => {
        const aptDate = new Date(apt.year, apt.month, apt.day);
        const [hours, minutes] = apt.time.split(':').map(Number);
        aptDate.setHours(hours, minutes, 0, 0);
        const now = new Date();
        const diffInMs = aptDate.getTime() - now.getTime();
        return diffInMs > 12 * 60 * 60 * 1000;
    };

    return (
        <div className="space-y-6 p-1">
            <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-black tracking-tight text-white drop-shadow-sm">Mi Calendario</h1>
                <p className="text-slate-400 font-medium">Gestiona tus consultas y horarios</p>
            </div>

            {/* Toggle Switch */}
            <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 w-fit">
                <button 
                    onClick={() => setActiveTab("calendar")}
                    className={cn(
                        "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                        activeTab === "calendar" 
                            ? "bg-nutrition-500 text-white shadow-lg shadow-nutrition-500/20" 
                            : "text-slate-400 hover:text-white"
                    )}
                >
                    Calendario
                </button>
                <button 
                    onClick={() => setActiveTab("history")}
                    className={cn(
                        "px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                        activeTab === "history" 
                            ? "bg-nutrition-500 text-white shadow-lg shadow-nutrition-500/20" 
                            : "text-slate-400 hover:text-white"
                    )}
                >
                    Historial
                </button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Main Content Area */}
                <div className="lg:col-span-8 flex flex-col gap-6">
                    {activeTab === "calendar" ? (
                        <Card className="shadow-2xl shadow-black/20 rounded-3xl overflow-hidden bio-panel border border-white/5 w-full">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 bg-white/5 pb-4 pt-5 px-6">
                                <div className="flex items-center gap-3">
                                    <div className="flex gap-1">
                                        <button onClick={prevMonth} className="p-2 rounded-xl hover:bg-nutrition-500/20 hover:text-nutrition-400 transition-all border border-white/10 bg-white/5 text-white shadow-sm">
                                            <ChevronLeft className="h-4 w-4" />
                                        </button>
                                        <button onClick={nextMonth} className="p-2 rounded-xl hover:bg-nutrition-500/20 hover:text-nutrition-400 transition-all border border-white/10 bg-white/5 text-white shadow-sm">
                                            <ChevronRight className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <CardTitle className="text-lg font-black text-white tracking-tight">
                                        {monthNames[currentMonth]} <span className="text-nutrition-500">{currentYear}</span>
                                    </CardTitle>
                                </div>
                            </CardHeader>
                            <CardContent className="p-4 md:p-6">
                                {/* Days header */}
                                <div className="grid grid-cols-7 gap-1 mb-2">
                                    {daysOfWeek.map((day) => (
                                        <div key={day} className="text-center py-1.5 text-[9px] font-black transform uppercase tracking-[0.2em] text-slate-500">
                                            {day}
                                        </div>
                                    ))}
                                </div>
                                {/* Days grid */}
                                <div className="grid grid-cols-7 gap-1.5">
                                    {Array.from({ length: offset }).map((_, i) => (
                                        <div key={`e-${i}`} className="aspect-square opacity-20" />
                                    ))}
                                    {daysArray.map((day) => {
                                        const appointments = getAppointmentsForDay(day);
                                        const isSelected = selectedDay === day;
                                        const isToday = day === new Date().getDate() && currentMonth === new Date().getMonth();

                                        return (
                                            <button
                                                key={day}
                                                onClick={() => setSelectedDay(day)}
                                                className={cn(
                                                    "aspect-square rounded-xl flex flex-col items-center justify-center gap-1 text-xs transition-all duration-300 relative group",
                                                    isSelected
                                                        ? "bg-nutrition-500 text-white shadow-xl shadow-nutrition-500/30 scale-105 z-10"
                                                        : isToday
                                                            ? "bg-white/10 text-nutrition-400 font-bold border border-nutrition-500/30"
                                                            : "hover:bg-white/5 text-slate-400 font-medium border border-transparent hover:border-white/5"
                                                )}
                                            >
                                                <span className={cn(isSelected ? "font-black" : "font-bold")}>{day}</span>
                                                {appointments.length > 0 && (
                                                    <div className="flex gap-0.5">
                                                        {appointments.map((a) => (
                                                            <span
                                                                key={a.id}
                                                                className={cn(
                                                                    "h-1 w-1 rounded-full",
                                                                    isSelected ? "bg-white" :
                                                                        a.type === "virtual" ? "bg-sky-500 shadow-[0_0_5px_rgba(14,165,233,0.4)]" : "bg-orange-500 shadow-[0_0_5px_rgba(249,115,22,0.4)]"
                                                                )}
                                                            />
                                                        ))}
                                                    </div>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>

                                {/* Legend */}
                                <div className="flex items-center gap-5 mt-6 pt-4 border-t border-white/5 text-[9px] font-black uppercase tracking-widest text-slate-500">
                                    <span className="flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-sky-500" /> Virtual
                                    </span>
                                    <span className="flex items-center gap-1.5">
                                        <span className="h-2 w-2 rounded-full bg-orange-500" /> Presencial
                                    </span>
                                </div>
                            </CardContent>
                        </Card>
                    ) : (
                        /* History View */
                        <Card className="shadow-2xl shadow-black/20 rounded-3xl overflow-hidden bio-panel border border-white/5">
                            <CardHeader className="pb-4 border-b border-white/5 bg-white/5">
                                <CardTitle className="text-xl font-black text-white tracking-tight flex items-center gap-2">
                                    <CalendarIcon className="h-5 w-5 text-nutrition-500" />
                                    Historial Completo
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-0">
                                <div className="divide-y divide-white/5">
                                    {processedAppointments.length === 0 ? (
                                        <div className="p-10 text-center text-slate-500 font-bold">No hay registros de citas</div>
                                    ) : (
                                        processedAppointments
                                            .sort((a, b) => {
                                                const dateA = new Date(a.year, a.month, a.day).getTime();
                                                const dateB = new Date(b.year, b.month, b.day).getTime();
                                                return dateB - dateA;
                                            })
                                            .map((apt) => (
                                                <div key={apt.id} className="p-6 hover:bg-white/5 transition-colors flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-4">
                                                        <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/10 flex flex-col items-center justify-center">
                                                            <span className="text-[10px] font-black text-nutrition-400 uppercase">{monthNames[apt.month].substring(0, 3)}</span>
                                                            <span className="text-lg font-black text-white leading-none">{apt.day}</span>
                                                        </div>
                                                        <div>
                                                            <h4 className="text-sm font-black text-white uppercase tracking-tight">{apt.title}</h4>
                                                            <p className="text-xs font-bold text-slate-500">{apt.nutritionist}</p>
                                                            <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-slate-400">
                                                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {apt.time}</span>
                                                                <span className="flex items-center gap-1 uppercase">{apt.type === 'virtual' ? 'Virtual' : 'Presencial'}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <Badge className={cn(
                                                        "text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-lg border-0",
                                                        (apt.status === "completed" || apt.status === "completada") ? "bg-emerald-500 text-white" :
                                                            apt.status === "confirmed" ? "bg-nutrition-500 text-white" :
                                                                apt.status === "reprogrammed" ? "bg-amber-500 text-white" : 
                                                                    apt.status === "not_confirmed" ? "bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.3)]" : "bg-slate-700 text-slate-300"
                                                    )}>
                                                        {(apt.status === "completed" || apt.status === "completada") ? "Completada" :
                                                            apt.status === "confirmed" ? "Confirmado" :
                                                                apt.status === "reprogrammed" ? "Reprogramar" : 
                                                                    apt.status === "not_confirmed" ? "No confirmado" : "Programada"}
                                                    </Badge>
                                                </div>
                                            ))
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>

                {/* Sidebar Detail Area */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                    <div className="space-y-6">
                        {/* Next Appointment Spotlight */}
                    {(() => {
                        const todaySpot = new Date(currentTime);
                        todaySpot.setHours(0, 0, 0, 0);
                        // Usar processedAppointments que ya tiene los estados actualizados en tiempo real
                        const nextOne = processedAppointments
                            .filter((a) => {
                                const apptDate = new Date(Number(a.year), Number(a.month), Number(a.day));
                                return apptDate >= todaySpot && a.status !== 'completed';
                            })
                            .sort((a, b) => {
                                const dateA = new Date(Number(a.year), Number(a.month), Number(a.day)).getTime();
                                const dateB = new Date(Number(b.year), Number(b.month), Number(b.day)).getTime();
                                if (dateA !== dateB) return dateA - dateB;
                                return a.time.localeCompare(b.time);
                            })[0];

                        if (!nextOne) return null;
                        const mNamesShort = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
                        const nextMonthIdx = nextOne.month !== undefined ? nextOne.month : 1;

                        return (
                            <Card className="border-slate-700 bg-slate-900 text-white shadow-xl overflow-hidden relative">
                                <div className="absolute top-0 right-0 w-32 h-full bg-nutrition-500/10 skew-x-12 translate-x-10" />
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-nutrition-400">Próxima Cita</CardTitle>
                                        <Badge className={cn(
                                            "text-[9px] px-2 py-0.5 min-h-0 h-5 uppercase font-black tracking-widest border-0",
                                            nextOne.status === "confirmed" ? "bg-green-500/20 text-green-400" :
                                                nextOne.status === "reprogrammed" ? "bg-amber-500/20 text-amber-400" :
                                                    nextOne.status === "not_confirmed" ? "bg-rose-500 text-white shadow-[0_0_10px_rgba(244,63,94,0.3)]" :
                                                        "bg-blue-500/20 text-blue-400"
                                        )}>
                                            {(nextOne.status === "completed" || nextOne.status === "completada") ? "Completada" :
                                                nextOne.status === "confirmed" ? "Confirmada" :
                                                nextOne.status === "reprogrammed" ? "Reprogramada" : 
                                                    nextOne.status === "not_confirmed" ? "No confirmado" : "Programada"}
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex items-center gap-4">
                                        <div className="h-14 w-14 rounded-2xl bg-white/10 flex flex-col items-center justify-center border border-white/10 backdrop-blur-sm">
                                            <span className="text-[10px] font-black uppercase text-nutrition-300">{mNamesShort[nextMonthIdx]}</span>
                                            <span className="text-2xl font-black">{nextOne.day}</span>
                                        </div>
                                        <div>
                                            <p className="text-base font-black text-white leading-tight">Consulta Profesional</p>
                                            <div className="flex flex-col gap-1 mt-1 text-slate-400">
                                                <span className="flex items-center gap-1.5 text-xs font-bold">
                                                    <Clock className="h-3 w-3 text-nutrition-400" /> {nextOne.time}
                                                </span>
                                                <span className="flex items-center gap-1.5 text-xs font-bold">
                                                    {nextOne.type === 'virtual' ? <Video className="h-3 w-3 text-nutrition-400" /> : <MapPin className="h-3 w-3 text-nutrition-400" />}
                                                    {nextOne.type === 'virtual' ? 'Virtual' : 'Presencial'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })()}

                        {selectedDay && (
                            <div className="space-y-4">
                                <div className="bg-nutrition-500/10 border border-nutrition-500/20 rounded-2xl p-4 flex items-start gap-3">
                                    <Info className="h-4 w-4 text-nutrition-400 mt-0.5" />
                                    <p className="text-[11px] font-bold text-nutrition-200 leading-tight">
                                        La reprogramación debe hacerse con 12 horas de anticipación.
                                    </p>
                                </div>

                                <Card className="shadow-2xl shadow-black/20 rounded-3xl overflow-hidden bio-panel border border-white/5">
                                    <CardHeader className="pb-4 border-b border-white/5 bg-white/5">
                                        <CardTitle className="text-lg font-black text-white tracking-tight flex items-center gap-2">
                                            <Clock className="h-5 w-5 text-nutrition-500" />
                                            Citas del {selectedDay}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="pt-6">
                                        {selectedDayAppointments.length === 0 ? (
                                            <div className="text-center py-10">
                                                <p className="text-sm font-bold text-slate-500">No hay citas para este día</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {selectedDayAppointments.map((apt) => {
                                                    const moreThan12h = isMoreThan12HoursAway(apt);
                                                    return (
                                                        <div key={apt.id} className="p-5 rounded-2xl border bg-white/5 border-white/10">
                                                            <div className="flex items-start justify-between mb-4">
                                                                <div>
                                                                    <h4 className="text-sm font-black text-white uppercase">{apt.title}</h4>
                                                                    <p className="text-[10px] font-bold text-slate-400">{apt.nutritionist}</p>
                                                                </div>
                                                                <Badge className={cn(
                                                                    "text-[9px] font-black uppercase px-2 py-0.5 rounded border-0",
                                                                    apt.status === "completed" ? "bg-emerald-500 text-white" :
                                                                        apt.status === "confirmed" ? "bg-nutrition-500 text-white" :
                                                                            apt.status === "reprogrammed" ? "bg-amber-500 text-white" : 
                                                                                apt.status === "not_confirmed" ? "bg-rose-500 text-white" : "bg-slate-700 text-slate-300"
                                                                )}>
                                                                    {(apt.status === "completed" || apt.status === "completada") ? "Completada" :
                                                                        apt.status === "confirmed" ? "Confirmado" :
                                                                            apt.status === "reprogrammed" ? "Reprogramar" : 
                                                                                apt.status === "not_confirmed" ? "No confirmado" : "Programada"}
                                                                </Badge>
                                                            </div>
                                                            <div className="flex items-center gap-3 text-[10px] text-slate-300">
                                                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {apt.time}</span>
                                                                <span className="flex items-center gap-1 uppercase">{apt.type === 'virtual' ? 'Virtual' : 'Presencial'}</span>
                                                            </div>
                                                            
                                                            {apt.status === 'scheduled' && (
                                                                <div className="mt-4 flex flex-col gap-2">
                                                                    <Button 
                                                                        size="sm" 
                                                                        className="w-full bg-nutrition-500 text-white text-[10px] font-black h-8"
                                                                        onClick={() => updateStatus(apt.id, 'confirmed')}
                                                                    >
                                                                        CONFIRMAR
                                                                    </Button>
                                                                    <Button 
                                                                        size="sm" 
                                                                        variant="outline" 
                                                                        disabled={!moreThan12h}
                                                                        className="w-full border-white/10 text-white text-[10px] font-black h-8 hover:bg-white/5"
                                                                        onClick={() => updateStatus(apt.id, 'reprogrammed')}
                                                                    >
                                                                        REPROGRAMAR
                                                                    </Button>
                                                                </div>
                                                            )}
                                                            
                                                            {apt.status === "reprogrammed" && (
                                                                <div className="mt-3 p-2 bg-amber-500/10 border border-amber-500/20 rounded-lg text-[9px] text-amber-200 font-bold leading-tight">
                                                                    Contactarse con su nutricionista para reprogramar.
                                                                </div>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
