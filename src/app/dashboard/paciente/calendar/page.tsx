"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
    ChevronLeft, ChevronRight, Clock, Video, MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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
    status: "scheduled" | "completed" | "cancelled" | "confirmed" | "reprogrammed";
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
    const [loading, setLoading] = useState(true);
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
                        const d = new Date(a.date + 'T12:00:00');
                        return {
                            id: a.id,
                            day: d.getDate(),
                            month: d.getMonth(),
                            year: d.getFullYear(),
                            title: "Consulta Nutricional",
                            time: a.start_time.substring(0, 5),
                            type: a.appointment_type,
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

        // Sync channel for real-time updates across tabs
        const channel = new BroadcastChannel('nutrigo_global_sync');
        channel.onmessage = (msg) => {
            if (msg.data.type === 'APPOINTMENTS_UPDATED') loadPatientData();
        };

        return () => {
            channel.close();
        };
    }, []);

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
        appointments.filter((a) => {
            return Number(a.day) === Number(day) &&
                Number(a.month) === Number(currentMonth) &&
                Number(a.year) === Number(currentYear);
        });

    const selectedDayAppointments = selectedDay ? getAppointmentsForDay(selectedDay) : [];

    const prevMonth = () => setCurrentMonth((p) => (p === 0 ? 11 : p - 1));
    const nextMonth = () => setCurrentMonth((p) => (p === 11 ? 0 : p + 1));

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-xl font-bold">Calendario de Citas</h1>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar grid */}
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button onClick={prevMonth} className="p-1.5 rounded-lg hover:bg-muted">
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <CardTitle className="text-base min-w-[160px] text-center">
                                {monthNames[currentMonth]} {currentYear}
                            </CardTitle>
                            <button onClick={nextMonth} className="p-1.5 rounded-lg hover:bg-muted">
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {/* Days header */}
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {daysOfWeek.map((day) => (
                                <div key={day} className="text-center py-2 text-xs font-medium text-muted-foreground">
                                    {day}
                                </div>
                            ))}
                        </div>
                        {/* Days grid */}
                        <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: offset }).map((_, i) => (
                                <div key={`e-${i}`} className="aspect-square" />
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
                                            "aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 text-sm transition-all relative",
                                            isSelected
                                                ? "bg-primary text-white shadow-md"
                                                : isToday
                                                    ? "bg-primary/10 text-primary font-semibold"
                                                    : "hover:bg-muted text-foreground"
                                        )}
                                    >
                                        {day}
                                        {appointments.length > 0 && (
                                            <div className="flex gap-0.5">
                                                {appointments.map((a) => (
                                                    <span
                                                        key={a.id}
                                                        className={cn(
                                                            "h-1.5 w-1.5 rounded-full",
                                                            isSelected ? "bg-white" :
                                                                a.type === "virtual" ? "bg-sky-500" : "bg-orange-500"
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
                        <div className="flex items-center gap-4 mt-4 text-xs text-muted-foreground">
                            <span className="flex items-center gap-1.5">
                                <span className="h-2.5 w-2.5 rounded-full bg-sky-500" /> Virtual
                            </span>
                            <span className="flex items-center gap-1.5">
                                <span className="h-2.5 w-2.5 rounded-full bg-orange-500" /> Presencial
                            </span>
                        </div>
                    </CardContent>
                </Card>

                {/* Appointments for selected day */}
                <div className="space-y-6">
                    {/* Next Appointment Spotlight */}
                    {(() => {
                        const todaySpot = new Date();
                        todaySpot.setHours(0, 0, 0, 0);
                        // Filter using the same state 'appointments' which is already filtered by patient
                        const nextOne = appointments
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
                                            nextOne.status === "confirmed" ? "bg-green-500/20 text-green-400 shadow-none" :
                                                nextOne.status === "reprogrammed" ? "bg-amber-500/20 text-amber-400 shadow-none" :
                                                    "bg-blue-500/20 text-blue-400 shadow-none"
                                        )}>
                                            {nextOne.status === "confirmed" ? "Confirmada" :
                                                nextOne.status === "reprogrammed" ? "Reprogramar" : "Pendiente"}
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

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base font-bold">
                                {selectedDay
                                    ? `Citas del ${selectedDay} de ${monthNames[currentMonth]}`
                                    : "Selecciona un día"}
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {selectedDayAppointments.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No hay citas para este día</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {selectedDayAppointments.map((apt) => (
                                        <div
                                            key={apt.id}
                                            className={cn(
                                                "p-3 rounded-xl border-l-4",
                                                apt.type === "virtual"
                                                    ? "border-l-sky-500 bg-sky-50"
                                                    : "border-l-orange-500 bg-orange-50"
                                            )}
                                        >
                                            <div className="flex items-start justify-between mb-1">
                                                <h4 className="text-sm font-semibold">{apt.title}</h4>
                                                <Badge
                                                    variant={
                                                        apt.status === "completed" ? "success" :
                                                            apt.status === "confirmed" ? "success" :
                                                                apt.status === "reprogrammed" ? "warning" : "secondary"
                                                    }
                                                    className="text-[10px] font-black uppercase"
                                                >
                                                    {apt.status === "completed" ? "Completada" :
                                                        apt.status === "confirmed" ? "Confirmada" :
                                                            apt.status === "reprogrammed" ? "Reprogramada" : "Pendiente"}
                                                </Badge>
                                            </div>
                                            <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" /> {apt.time}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    {apt.type === "virtual" ? (
                                                        <Video className="h-3 w-3" />
                                                    ) : (
                                                        <MapPin className="h-3 w-3" />
                                                    )}
                                                    {apt.type === "virtual" ? "Virtual" : "Presencial"}
                                                </span>
                                            </div>
                                            {apt.nutritionist && (
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    Con {apt.nutritionist}
                                                </p>
                                            )}

                                            {apt.status === "scheduled" && (
                                                <div className="flex gap-2 mt-4">
                                                    <Button
                                                        size="sm"
                                                        className="flex-1 bg-nutrition-600 hover:bg-nutrition-700 text-white rounded-lg text-[10px] font-black"
                                                        onClick={() => updateStatus(apt.id, "confirmed")}
                                                    >
                                                        CONFIRMAR
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="flex-1 border-slate-200 text-slate-600 rounded-lg text-[10px] font-black"
                                                        onClick={() => updateStatus(apt.id, "reprogrammed")}
                                                    >
                                                        REPROGRAMAR
                                                    </Button>
                                                </div>
                                            )}

                                            {apt.status === "reprogrammed" && (
                                                <div className="mt-3 bg-amber-50 p-2 rounded-lg border border-amber-100">
                                                    <p className="text-[10px] text-amber-700 font-bold leading-tight">
                                                        Usa el chat para coordinar tu nueva fecha con el nutricionista.
                                                    </p>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
