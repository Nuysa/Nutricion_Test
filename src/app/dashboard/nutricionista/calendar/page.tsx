// Nutritionist calendar re-exports the shared calendar component with different data
// In a real app, this would pull nutritionist-specific appointments

"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
    ChevronLeft, ChevronRight, Clock, Video, MapPin, Edit2, Calendar as CalendarIcon, Save
} from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

const daysOfWeek = ["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"];
const monthNames = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

interface NutritionistAppointment {
    id: string;
    day: number;
    patient: string;
    time: string;
    type: "virtual" | "in-person";
    status: "scheduled" | "completed";
}

const appointments: any[] = [];

import { useEffect } from "react";

export default function NutritionistCalendarPage() {
    const supabase = createClient();
    const { toast } = useToast();
    const [currentMonth, setCurrentMonth] = useState(1);
    const [currentYear] = useState(2026);
    const [selectedDay, setSelectedDay] = useState<number | null>(new Date().getDate());
    const [localAppts, setLocalAppts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [assignedPatientIds, setAssignedPatientIds] = useState<string[]>([]);

    // Edit/Schedule State
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingAppt, setEditingAppt] = useState<any>(null);
    const [viewMonth, setViewMonth] = useState(1); // Feb
    const [viewYear, setViewYear] = useState(2026);
    const [editValues, setEditValues] = useState({
        date: "2026-02-23",
        time: "09:00",
        type: "virtual" as "virtual" | "in-person",
        status: "scheduled"
    });

    const timeSlots = [
        "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
        "12:00", "12:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
    ];

    const getOccupiedSlots = (dateString: string) => {
        const dateObj = new Date(dateString + 'T12:00:00');
        const day = dateObj.getDate();
        const month = dateObj.getMonth();
        const year = dateObj.getFullYear();

        // Use localAppts as the source
        const dayAppts = localAppts.filter((a: any) => {
            const isSameDay = a.day === day;
            const isSameMonth = a.month !== undefined ? a.month === month : month === 1;
            const isSameYear = a.year !== undefined ? a.year === year : year === 2026;
            // Don't count the appointment being edited as "occupied" for itself
            const isDifferentAppt = editingAppt ? a.id !== editingAppt.id : true;
            return isSameDay && isSameMonth && isSameYear && isDifferentAppt;
        });

        const occupied = new Set<string>();
        dayAppts.forEach((a: any) => {
            occupied.add(a.time);
            const [h, m] = a.time.split(":").map(Number);
            const totalMin = h * 60 + m + 30;
            const nextH = Math.floor(totalMin / 60).toString().padStart(2, '0');
            const nextM = (totalMin % 60).toString().padStart(2, '0');
            occupied.add(`${nextH}:${nextM}`);
        });

        return Array.from(occupied);
    };

    const isSlotPastOrBuffer = (slotTime: string, dateString: string) => {
        const now = new Date(2026, 1, 23, 6, 50); // Simulated now
        const [h, m] = slotTime.split(":").map(Number);
        const targetDate = new Date(dateString + 'T12:00:00');
        targetDate.setHours(h, m, 0, 0);
        const bufferTime = new Date(now.getTime() + 60 * 60 * 1000);
        return targetDate < bufferTime;
    };

    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(v => v + 1); }
        else setViewMonth(v => v + 1);
    };

    const prevMonth = () => {
        if (viewYear === 2026 && viewMonth <= 1) return;
        if (viewMonth === 0) { setViewMonth(11); setViewYear(v => v - 1); }
        else setViewMonth(v => v - 1);
    };

    useEffect(() => {
        const loadSupabaseData = async () => {
            setLoading(true);
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // 1. Get nutritionist profile
                const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
                if (!profile) return;

                // 2. Load assigned patients to filter appointments
                const { data: patients } = await supabase
                    .from("patients")
                    .select("id")
                    .eq("nutritionist_id", profile.id);

                const patientIds = (patients || []).map(p => p.id);
                setAssignedPatientIds(patientIds);

                // 3. Load appointments for this nutritionist
                // Join with patient profiles to get names
                const { data: dbAppts } = await supabase
                    .from("appointments")
                    .select(`
                        *,
                        patient:patients(
                            id,
                            profile:profiles(full_name)
                        )
                    `)
                    .eq("nutritionist_id", profile.id);

                if (dbAppts) {
                    const mappedAppts = dbAppts.map(apt => {
                        const d = new Date(apt.appointment_date + 'T12:00:00');
                        return {
                            id: apt.id,
                            patientId: apt.patient_id,
                            day: d.getDate(),
                            month: d.getMonth(),
                            year: d.getFullYear(),
                            patient: (apt.patient as any)?.profile?.full_name || "Paciente",
                            time: apt.start_time.substring(0, 5),
                            type: apt.modality,
                            status: apt.status
                        };
                    });
                    setLocalAppts(mappedAppts);
                }
            } catch (err) {
                console.error("Error loading calendar data:", err);
            } finally {
                setLoading(false);
            }
        };

        loadSupabaseData();

        const sync = new BroadcastChannel('nutrigo_global_sync');
        sync.onmessage = () => loadSupabaseData();
        return () => sync.close();
    }, []);

    const handleEditAppt = (appt: any) => {
        setEditingAppt(appt);
        const aMonth = appt.month !== undefined ? appt.month : 1;
        const aYear = appt.year !== undefined ? appt.year : 2026;
        const dateStr = `${aYear}-${(aMonth + 1).toString().padStart(2, '0')}-${appt.day.toString().padStart(2, '0')}`;

        setEditValues({
            date: dateStr,
            time: appt.time,
            type: appt.type,
            status: appt.status
        });
        setViewMonth(aMonth);
        setViewYear(aYear);
        setIsEditDialogOpen(true);
    };

    const saveEdit = () => {
        if (!editingAppt) return;

        const dateObj = new Date(editValues.date + 'T12:00:00');
        const day = dateObj.getDate();
        const month = dateObj.getMonth();
        const year = dateObj.getFullYear();

        const stored = JSON.parse(localStorage.getItem("nutrigo_appointments") || "[]");
        const updated = stored.map((a: any) => {
            if (a.id === editingAppt.id) {
                return {
                    ...a,
                    day: day,
                    month: month,
                    year: year,
                    time: editValues.time,
                    type: editValues.type,
                    status: editValues.status
                };
            }
            return a;
        });

        localStorage.setItem("nutrigo_appointments", JSON.stringify(updated));
        window.dispatchEvent(new Event("nutrigo-sync-appointments"));
        setIsEditDialogOpen(false);
        toast({
            title: "Cita actualizada",
            description: "Los cambios se han guardado correctamente.",
            variant: "success"
        });
    };

    const occupiedSlots = getOccupiedSlots(editValues.date);

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const offset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const getAppts = (day: number) => localAppts.filter((a) => {
        const aMonth = a.month !== undefined ? a.month : 1;
        const aYear = a.year !== undefined ? a.year : 2026;

        // Only show appointments for patients currently in the nutritionist's list (by ID)
        const isPatientAssigned = assignedPatientIds.includes(String(a.patientId));

        return a.day === day && aMonth === currentMonth && aYear === currentYear && isPatientAssigned;
    });
    const selected = selectedDay ? getAppts(selectedDay) : [];

    if (loading) return <div className="p-20 text-center animate-pulse text-slate-400 font-bold">Cargando agenda...</div>;

    return (
        <div className="space-y-6">
            <h1 className="text-xl font-bold">Mi Calendario</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Calendar */}
                <Card className="lg:col-span-2">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div className="flex items-center gap-3">
                            <button onClick={() => setCurrentMonth((p) => (p === 0 ? 11 : p - 1))} className="p-1.5 rounded-lg hover:bg-muted">
                                <ChevronLeft className="h-5 w-5" />
                            </button>
                            <CardTitle className="text-base min-w-[160px] text-center">
                                {monthNames[currentMonth]} {currentYear}
                            </CardTitle>
                            <button onClick={() => setCurrentMonth((p) => (p === 11 ? 0 : p + 1))} className="p-1.5 rounded-lg hover:bg-muted">
                                <ChevronRight className="h-5 w-5" />
                            </button>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-7 gap-1 mb-2">
                            {daysOfWeek.map((d) => (
                                <div key={d} className="text-center py-2 text-xs font-medium text-muted-foreground">{d}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {Array.from({ length: offset }).map((_, i) => <div key={`e-${i}`} className="aspect-square" />)}
                            {daysArray.map((day) => {
                                const appts = getAppts(day);
                                const isSelected = selectedDay === day;
                                return (
                                    <button key={day} onClick={() => setSelectedDay(day)}
                                        className={cn("aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 text-sm transition-all",
                                            isSelected ? "bg-primary text-white shadow-md" : day === 23 ? "bg-primary/10 text-primary font-bold ring-2 ring-primary/20" : "hover:bg-muted"
                                        )}>
                                        {day}
                                        {appts.length > 0 && (
                                            <div className="flex gap-0.5">
                                                {appts.slice(0, 3).map((a) => (
                                                    <span key={a.id} className={cn("h-1.5 w-1.5 rounded-full", isSelected ? "bg-white" : a.type === "virtual" ? "bg-sky-500" : "bg-orange-500")} />
                                                ))}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Sidebar: Upcoming & Day Detail */}
                <div className="space-y-6">
                    {/* Upcoming List */}
                    <Card className="bg-slate-50/50 shadow-none border-slate-200">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Próximas en la Agenda</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {(() => {
                                const todayDate = new Date(2026, 1, 23);
                                const nextAppts = localAppts
                                    .filter(a => {
                                        const m = a.month !== undefined ? a.month : 1;
                                        const y = a.year !== undefined ? a.year : 2026;
                                        const apptDate = new Date(y, m, a.day);
                                        const isAssigned = assignedPatientIds.includes(String(a.patientId));
                                        return apptDate >= todayDate && a.status !== 'completed' && isAssigned;
                                    })
                                    .sort((a, b) => {
                                        const m1 = a.month !== undefined ? a.month : 1;
                                        const m2 = b.month !== undefined ? b.month : 1;
                                        if (m1 !== m2) return m1 - m2;
                                        if (a.day !== b.day) return a.day - b.day;
                                        return a.time.localeCompare(b.time);
                                    })
                                    .slice(0, 3);

                                if (nextAppts.length === 0) return (
                                    <p className="text-xs text-muted-foreground italic text-center py-4">No hay más citas próximas.</p>
                                );

                                return nextAppts.map(apt => (
                                    <div key={apt.id} className="flex gap-3 group">
                                        <div className="flex flex-col items-center">
                                            <div className="h-8 w-8 rounded-xl bg-white shadow-sm border border-slate-100 flex flex-col items-center justify-center">
                                                <span className="text-[8px] font-black uppercase text-nutrition-600 leading-none">{monthNames[apt.month || 1].substring(0, 3)}</span>
                                                <span className="text-sm font-black text-slate-800 leading-none mt-0.5">{apt.day}</span>
                                            </div>
                                            <div className="w-px flex-1 bg-slate-200 mt-2" />
                                        </div>
                                        <div className="pb-4 flex-1">
                                            <p className="text-xs font-black text-slate-800 mb-0.5">{apt.patient}</p>
                                            <div className="flex items-center gap-2 text-[10px] text-slate-500 font-bold">
                                                <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {apt.time}</span>
                                                <span>•</span>
                                                <span className="capitalize">{apt.type === 'virtual' ? '📹 Virtual' : '🏥 Presencial'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ));
                            })()}
                        </CardContent>
                    </Card>

                    {/* Day detail */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-base">
                                {selectedDay ? `${selectedDay} de ${monthNames[currentMonth]}` : "Selecciona un día"}
                            </CardTitle>
                            {selected.length > 0 && (
                                <p className="text-sm text-muted-foreground">{selected.length} citas programadas</p>
                            )}
                        </CardHeader>
                        <CardContent>
                            {selected.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">Sin citas</p>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {selected.map((apt) => (
                                        <div key={apt.id} className={cn("p-3 rounded-xl border-l-4 shadow-sm relative group/appt", apt.type === "virtual" ? "border-l-sky-500 bg-sky-50" : "border-l-orange-500 bg-orange-50")}>
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6 border-2 border-white shadow-sm">
                                                        <AvatarFallback className="bg-white text-slate-700 text-[10px] font-bold">
                                                            {apt.patient.split(" ").map((n: string) => n[0]).join("")}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-sm font-black text-slate-800">{apt.patient}</span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-6 w-6 rounded-lg opacity-0 group-hover/appt:opacity-100 transition-opacity"
                                                    onClick={() => handleEditAppt(apt)}
                                                >
                                                    <Edit2 className="h-3.3 w-3.3 text-slate-400" />
                                                </Button>
                                            </div>
                                            <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground mt-2">
                                                <div className="flex items-center gap-3">
                                                    <span className="flex items-center gap-1 font-bold"><Clock className="h-3 w-3 text-slate-400" /> {apt.time}</span>
                                                    <span className="flex items-center gap-1 font-bold uppercase text-[9px] tracking-widest px-2 py-0.5 rounded-full bg-white/50 border border-white">
                                                        {apt.type === "virtual" ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}
                                                        {apt.type === "virtual" ? "Virtual" : "Presencial"}
                                                    </span>
                                                </div>
                                                <Badge className={cn(
                                                    "text-[8px] px-1.5 py-0 min-h-0 h-4 uppercase font-black tracking-tighter border-0",
                                                    apt.status === "confirmed" ? "bg-green-100 text-green-700 shadow-none hover:bg-green-100" :
                                                        apt.status === "reprogrammed" ? "bg-amber-100 text-amber-700 shadow-none hover:bg-amber-100" :
                                                            "bg-blue-100 text-blue-700 shadow-none hover:bg-blue-100"
                                                )}>
                                                    {apt.status === "confirmed" ? "Confirmada" :
                                                        apt.status === "reprogrammed" ? "Reprogramar" : "Pendiente"}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Enhanced Edit Appointment Dialog */}
            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[600px] rounded-[2rem] p-0 overflow-hidden border-0 shadow-2xl">
                    <div className="flex flex-col md:flex-row h-full">
                        {/* Left Side: MINI CALENDAR */}
                        <div className="w-full md:w-64 bg-slate-50 p-6 border-r border-slate-100 flex flex-col">
                            <h3 className="text-xs font-black uppercase tracking-widest text-slate-800 mb-6 flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4 text-nutrition-500" /> Editar Cita
                            </h3>

                            <div className="flex items-center justify-between mb-4">
                                <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                                    {monthNames[viewMonth]} {viewYear}
                                </h4>
                                <div className="flex gap-1">
                                    <button onClick={prevMonth} className="p-1 rounded-md hover:bg-slate-200 text-slate-400 disabled:opacity-30" disabled={viewYear === 2026 && viewMonth === 1}>
                                        <ChevronLeft className="h-3 w-3" />
                                    </button>
                                    <button onClick={nextMonth} className="p-1 rounded-md hover:bg-slate-200 text-slate-400">
                                        <ChevronRight className="h-3 w-3" />
                                    </button>
                                </div>
                            </div>

                            <div className="grid grid-cols-7 gap-1 text-center mb-2">
                                {["L", "M", "X", "J", "V", "S", "D"].map(d => (
                                    <span key={d} className="text-[10px] font-bold text-slate-300">{d}</span>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                                {(() => {
                                    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
                                    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
                                    const offset = firstDay === 0 ? 6 : firstDay - 1;

                                    const days = [];
                                    for (let i = 0; i < offset; i++) days.push(<div key={`e-${i}`} />);

                                    for (let day = 1; day <= daysInMonth; day++) {
                                        const dateStr = `${viewYear}-${(viewMonth + 1).toString().padStart(2, '0')}-${day.toString().padStart(2, '0')}`;
                                        const isSelected = editValues.date === dateStr;
                                        const dayObj = new Date(viewYear, viewMonth, day);
                                        const now = new Date(2026, 1, 23);
                                        const isPastDay = dayObj < now;
                                        const isToday = day === 23 && viewMonth === 1 && viewYear === 2026;

                                        days.push(
                                            <button
                                                key={day}
                                                disabled={isPastDay}
                                                className={cn(
                                                    "h-7 w-7 rounded-lg text-[10px] font-bold transition-all relative",
                                                    isSelected ? "bg-nutrition-600 text-white shadow-lg shadow-nutrition-100" :
                                                        isToday ? "bg-nutrition-100 text-nutrition-700" :
                                                            isPastDay ? "text-slate-200 cursor-not-allowed" : "hover:bg-white text-slate-600 shadow-sm"
                                                )}
                                                onClick={() => setEditValues({ ...editValues, date: dateStr })}
                                            >
                                                {day}
                                            </button>
                                        );
                                    }
                                    return days;
                                })()}
                            </div>

                            <div className="mt-8 space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Modalidad</label>
                                    <Select value={editValues.type} onValueChange={(v: any) => setEditValues({ ...editValues, type: v })}>
                                        <SelectTrigger className="rounded-xl border-slate-200">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-0 shadow-xl">
                                            <SelectItem value="virtual" className="rounded-lg">📹 Virtual</SelectItem>
                                            <SelectItem value="in-person" className="rounded-lg">🏥 Presencial</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Estado</label>
                                    <Select value={editValues.status} onValueChange={(v: any) => setEditValues({ ...editValues, status: v })}>
                                        <SelectTrigger className="rounded-xl border-slate-200">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="rounded-xl border-0 shadow-xl">
                                            <SelectItem value="scheduled" className="rounded-lg text-blue-600 font-bold">Pendiente</SelectItem>
                                            <SelectItem value="confirmed" className="rounded-lg text-green-600 font-bold">Confirmada</SelectItem>
                                            <SelectItem value="reprogrammed" className="rounded-lg text-amber-600 font-bold">Reprogramar</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: TIME SLOTS */}
                        <div className="flex-1 bg-white p-6 flex flex-col">
                            <DialogHeader className="mb-6">
                                <DialogTitle className="text-xl font-black text-slate-800">Horarios para {editingAppt?.patient}</DialogTitle>
                                <DialogDescription className="text-xs font-medium">Selecciona un bloque de disponibilidad</DialogDescription>
                            </DialogHeader>

                            <div className="grid grid-cols-2 gap-2 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                                {timeSlots.map(time => {
                                    const isReserved = occupiedSlots.includes(time);
                                    const isPastOrBuffer = isSlotPastOrBuffer(time, editValues.date);
                                    const isSelected = editValues.time === time;

                                    return (
                                        <button
                                            key={time}
                                            disabled={isReserved || isPastOrBuffer}
                                            className={cn(
                                                "py-3 rounded-xl text-xs font-black transition-all border",
                                                isSelected ? "bg-slate-900 border-slate-900 text-white shadow-md shadow-slate-200 scale-[0.98]" :
                                                    (isReserved || isPastOrBuffer) ? "bg-slate-50 border-slate-50 text-slate-300 cursor-not-allowed" :
                                                        "bg-white border-slate-100 text-slate-600 hover:border-nutrition-200 hover:bg-nutrition-50"
                                            )}
                                            onClick={() => setEditValues({ ...editValues, time })}
                                        >
                                            {time}
                                            {isReserved && <span className="block text-[8px] opacity-60 font-medium">Ocupado</span>}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="mt-auto pt-6 flex gap-2">
                                <Button variant="ghost" className="flex-1 rounded-xl font-bold" onClick={() => setIsEditDialogOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button className="flex-1 rounded-xl bg-nutrition-600 hover:bg-nutrition-700 text-white font-black gap-2" onClick={saveEdit}>
                                    <Save className="h-4 w-4" /> Actualizar
                                </Button>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
