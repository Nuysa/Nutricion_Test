"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
    ChevronLeft, 
    ChevronRight, 
    Calendar as CalendarIcon, 
    Clock, 
    Edit2, 
    Save 
} from "lucide-react";
import { cn } from "@/lib/utils";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter,
    DialogDescription 
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";

const monthNamesFull = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export default function NutritionistCalendarPage() {
    const supabase = createClient();
    const { toast } = useToast();
    const nowLocal = new Date();
    const [currentMonth, setCurrentMonth] = useState(nowLocal.getMonth());
    const [currentYear, setCurrentYear] = useState(nowLocal.getFullYear());
    const [selectedDay, setSelectedDay] = useState<number | null>(nowLocal.getDate());
    const [localAppts, setLocalAppts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [assignedPatientIds, setAssignedPatientIds] = useState<string[]>([]);

    // Edit/Schedule State
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [editingAppt, setEditingAppt] = useState<any>(null);
    const [viewMonth, setViewMonth] = useState(nowLocal.getMonth());
    const [viewYear, setViewYear] = useState(nowLocal.getFullYear());
    const [editValues, setEditValues] = useState({
        date: nowLocal.toISOString().split('T')[0],
        time: "09:00",
        type: "virtual" as "virtual" | "in-person",
        status: "programada"
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
            const isSameMonth = a.month === month;
            const isSameYear = a.year === year;
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
        const nowInternal = new Date(); 
        const [h, m] = slotTime.split(":").map(Number);
        const targetDate = new Date(dateString + 'T12:00:00');
        targetDate.setHours(h, m, 0, 0);
        const bufferTime = new Date(nowInternal.getTime() + 60 * 60 * 1000);
        return targetDate < bufferTime;
    };

    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(v => v + 1); }
        else setViewMonth(v => v + 1);
    };

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(v => v - 1); }
        else setViewMonth(v => v - 1);
    };

    const loadSupabaseData = async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                console.warn("Calendar: No auth user found");
                return;
            }

            const { data: profile } = await supabase.from("profiles").select("id, full_name, role").eq("user_id", user.id).single();
            if (!profile) {
                console.warn("Calendar: No profile found for user", user.id);
                return;
            }

            console.log("Calendar: Fetching appointments for nutritionist:", profile.full_name, "(ID:", profile.id, ")");

            const { data: patientsData } = await supabase
                .from("patients")
                .select("id")
                .eq("nutritionist_id", profile.id);

            setAssignedPatientIds((patientsData || []).map(p => p.id));

            // Query with explicit joins and no Aliases for first level to reach profiles
            const { data: dbAppts, error: dbError } = await supabase
                .from("appointments")
                .select(`
                    *,
                    patient:patients!patient_id(
                        profiles!profile_id(full_name)
                    )
                `)
                .eq("nutritionist_id", profile.id)
                .neq("status", "cancelada");

            if (dbError) {
                console.error("Calendar Query Error:", dbError);
                // Fallback attempt
                const { data: fallbackAppts } = await supabase
                    .from("appointments")
                    .select("*")
                    .eq("nutritionist_id", profile.id);
                
                if (fallbackAppts) {
                    console.log("Calendar: Loaded using fallback (no join):", fallbackAppts.length);
                    const mapped = fallbackAppts.map(apt => {
                        const [y, m, d] = apt.appointment_date.split('-').map(Number);
                        return {
                            id: apt.id,
                            patientId: apt.patient_id,
                            day: d, month: m - 1, year: y,
                            patient: "Paciente",
                            time: apt.start_time.substring(0, 5),
                            type: apt.modality,
                            status: apt.status
                        };
                    });
                    setLocalAppts(mapped);
                }
                return;
            }

            if (dbAppts) {
                console.log("Calendar: Raw DB appointments found:", dbAppts.length);
                const mappedAppts = dbAppts.map(apt => {
                    const [y, m, d] = apt.appointment_date.split('-').map(Number);
                    const patientName = (apt.patient as any)?.profiles?.full_name || "Paciente";
                    return {
                        id: apt.id,
                        patientId: apt.patient_id,
                        day: d,
                        month: m - 1,
                        year: y,
                        patient: patientName,
                        time: apt.start_time.substring(0, 5),
                        type: apt.modality,
                        status: apt.status
                    };
                });
                setLocalAppts(mappedAppts);
            } else {
                console.log("Calendar: No appointments returned from query.");
                setLocalAppts([]);
            }
        } catch (err) {
            console.error("Error loading calendar data:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadSupabaseData();

        // Real-time synchronization
        const channel = supabase
            .channel('nutritionist_calendar_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
                console.log("Realtime: Appointments changed, refreshing calendar...");
                loadSupabaseData();
            })
            .subscribe();

        const sync = new BroadcastChannel('nutrigo_global_sync');
        sync.onmessage = () => loadSupabaseData();
        
        return () => {
            supabase.removeChannel(channel);
            sync.close();
        };
    }, []);

    const handleEditAppt = (appt: any) => {
        setEditingAppt(appt);
        const aMonth = appt.month !== undefined ? appt.month : nowLocal.getMonth();
        const aYear = appt.year !== undefined ? appt.year : nowLocal.getFullYear();
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

    const saveEdit = async () => {
        if (!editingAppt) return;

        try {
            // Calculate end time
            const [h, m] = editValues.time.split(":").map(Number);
            const totalStart = h * 60 + m;
            const totalEnd = totalStart + 30;
            const endH = Math.floor(totalEnd / 60).toString().padStart(2, '0');
            const endM = (totalEnd % 60).toString().padStart(2, '0');
            const startTime = `${editValues.time}:00`;
            const endTime = `${endH}:${endM}:00`;

            const { error } = await supabase
                .from("appointments")
                .update({
                    appointment_date: editValues.date,
                    start_time: startTime,
                    end_time: endTime,
                    modality: editValues.type,
                    status: editValues.status
                })
                .eq("id", editingAppt.id);

            if (error) throw error;

            // Sync other tabs/components
            const syncChannel = new BroadcastChannel('nutrigo_global_sync');
            syncChannel.postMessage('sync');
            syncChannel.close();

            setIsEditDialogOpen(false);
            toast({
                title: "Cita actualizada",
                description: "Los cambios se han guardado correctamente en la base de datos.",
                variant: "success"
            });
            loadSupabaseData();
        } catch (err: any) {
            console.error("Error updating appointment:", err);
            toast({
                title: "Error",
                description: err.message || "No se pudo actualizar la cita.",
                variant: "destructive"
            });
        }
    };

    const occupiedSlots = getOccupiedSlots(editValues.date);

    const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
    const firstDayOfMonth = new Date(currentYear, currentMonth, 1).getDay();
    const offset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;
    const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

    const getAppts = (day: number) => localAppts.filter((a) => {
        return a.day === day && a.month === currentMonth && a.year === currentYear;
    });
    
    const selected = selectedDay ? getAppts(selectedDay) : [];

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-in fade-in duration-500">
            <div className="relative h-16 w-16">
                <div className="absolute inset-0 rounded-full border-4 border-nutrition-500/20" />
                <div className="absolute inset-0 rounded-full border-4 border-nutrition-500 border-t-transparent animate-spin" />
            </div>
            <p className="font-black text-xs text-nutrition-500 uppercase tracking-[0.2em] animate-pulse">Sincronizando agenda...</p>
        </div>
    );

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col space-y-2">
                <h1 className="text-3xl font-black text-white uppercase tracking-tight">Mi Agenda</h1>
                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest opacity-60">Control total de tus consultas y disponibilidad en tiempo real.</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                {/* Calendar */}
                <Card className="lg:col-span-2 rounded-[2.5rem] border-white/10 bg-white/[0.03] backdrop-blur-md shadow-2xl overflow-hidden">
                    <CardHeader className="border-b border-white/5 p-8 flex flex-row items-center justify-between">
                        <div className="flex items-center gap-6">
                            <CardTitle className="text-lg text-nutrition-500 font-black uppercase tracking-[0.2em]">Calendario Global</CardTitle>
                            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-xl border border-white/10">
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => {
                                        if (currentMonth === 0) { setCurrentMonth(11); setCurrentYear(currentYear - 1); }
                                        else setCurrentMonth(currentMonth - 1);
                                    }} 
                                    className="h-8 w-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <span className="text-[10px] font-black text-white uppercase tracking-widest min-w-[120px] text-center">
                                    {monthNamesFull[currentMonth]} {currentYear}
                                </span>
                                <Button 
                                    variant="ghost" 
                                    size="icon" 
                                    onClick={() => {
                                        if (currentMonth === 11) { setCurrentMonth(0); setCurrentYear(currentYear + 1); }
                                        else setCurrentMonth(currentMonth + 1);
                                    }} 
                                    className="h-8 w-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                        <div className="hidden sm:flex items-center gap-4">
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
                                <div className="h-2 w-2 rounded-full bg-sky-500 shadow-[0_0_8px_rgba(14,165,233,0.5)]" />
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Virtual</span>
                            </div>
                            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/5">
                                <div className="h-2 w-2 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" />
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Presencial</span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-8">
                        <div className="grid grid-cols-7 gap-2 mb-4">
                            {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map((d) => (
                                <div key={d} className="text-center py-2 text-[10px] font-black text-slate-500 uppercase tracking-widest">{d}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-2">
                            {Array.from({ length: offset }).map((_, i) => <div key={`e-${i}`} className="aspect-square" />)}
                            {daysArray.map((day) => {
                                const appts = getAppts(day);
                                const isSelected = selectedDay === day;
                                const isToday = day === nowLocal.getDate() && currentMonth === nowLocal.getMonth() && currentYear === nowLocal.getFullYear();
                                
                                return (
                                    <button 
                                        key={day} 
                                        onClick={() => setSelectedDay(day)}
                                        className={cn(
                                            "aspect-square rounded-[1.2rem] flex flex-col items-center justify-center gap-1.5 text-xs transition-all relative group",
                                            isSelected ? "bg-nutrition-500 text-white shadow-xl shadow-nutrition-500/30 scale-105 z-10" : 
                                            isToday ? "bg-nutrition-500/10 text-nutrition-400 border border-nutrition-500/20 font-black" : 
                                            "bg-white/[0.02] border border-white/5 text-slate-400 hover:bg-white/5 hover:border-white/10 hover:text-white"
                                        )}
                                    >
                                        <span className="relative z-10 font-bold">{day}</span>
                                        {appts.length > 0 && (
                                            <div className="flex gap-1 relative z-10">
                                                {appts.slice(0, 3).map((a) => (
                                                    <span 
                                                        key={a.id} 
                                                        className={cn(
                                                            "h-1 w-1 rounded-full", 
                                                            isSelected ? "bg-white" : a.type === "virtual" ? "bg-sky-500" : "bg-orange-500"
                                                        )} 
                                                    />
                                                ))}
                                            </div>
                                        )}
                                        {isSelected && (
                                            <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white] animate-in zoom-in" />
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    </CardContent>
                </Card>

                {/* Sidebar: Upcoming & Day Detail */}
                <div className="space-y-8 h-full">
                    {/* Upcoming List */}
                    <Card className="rounded-[2.5rem] border-white/10 bg-white/[0.03] backdrop-blur-md shadow-2xl overflow-hidden border-none">
                        <CardHeader className="p-8 pb-4">
                            <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                                <CalendarIcon className="h-3 w-3 text-nutrition-500" /> Próxima Cita
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-0 space-y-6">
                            {(() => {
                                const now = new Date();
                                const y = now.getFullYear();
                                const m = (now.getMonth() + 1).toString().padStart(2, '0');
                                const d = now.getDate().toString().padStart(2, '0');
                                const nowStr = `${y}-${m}-${d}`;
                                
                                const currentHour = now.getHours();
                                const currentMinute = now.getMinutes();
                                
                                const nextAppts = localAppts
                                    .filter(a => {
                                        const aptDateStr = `${a.year}-${(a.month + 1).toString().padStart(2, '0')}-${a.day.toString().padStart(2, '0')}`;
                                        if (aptDateStr > nowStr) return a.status !== 'cancelada';
                                        if (aptDateStr === nowStr) {
                                            const [h, min] = a.time.split(':').map(Number);
                                            if (h > currentHour) return a.status !== 'cancelada';
                                            if (h === currentHour && min >= currentMinute) return a.status !== 'cancelada';
                                            return false;
                                        }
                                        return false;
                                    })
                                    .sort((a, b) => {
                                        const dateA = `${a.year}-${(a.month + 1).toString().padStart(2, '0')}-${a.day.toString().padStart(2, '0')}T${a.time}`;
                                        const dateB = `${b.year}-${(b.month + 1).toString().padStart(2, '0')}-${b.day.toString().padStart(2, '0')}T${b.time}`;
                                        return dateA.localeCompare(dateB);
                                    })
                                    .slice(0, 1);

                                if (nextAppts.length === 0) return (
                                    <div className="py-12 text-center opacity-40">
                                        <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Sin citas próximas</p>
                                    </div>
                                );

                                return nextAppts.map(apt => (
                                    <div key={apt.id} className="flex gap-5 group relative">
                                        <div className="flex flex-col items-center">
                                            <div className="h-10 w-10 rounded-[1rem] bg-white/[0.05] border border-white/10 flex flex-col items-center justify-center group-hover:bg-nutrition-500/20 group-hover:border-nutrition-500/30 transition-all">
                                                <span className="text-[9px] font-black uppercase text-nutrition-500 leading-none">{monthNamesFull[apt.month || 0].substring(0, 3)}</span>
                                                <span className="text-sm font-black text-white leading-none mt-1">{apt.day}</span>
                                            </div>
                                            <div className="w-px flex-1 bg-white/5 my-2" />
                                        </div>
                                        <div className="pb-6 flex-1">
                                            <p className="text-sm font-black text-white group-hover:text-nutrition-400 transition-colors uppercase tracking-tight">{apt.patient}</p>
                                            <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold mt-1">
                                                <span className="flex items-center gap-1.5"><Clock className="h-3 w-3 text-nutrition-500" /> {apt.time}</span>
                                                <span className="opacity-20">•</span>
                                                <span className="uppercase tracking-widest text-[8px]">{apt.type === 'virtual' ? '📹 Virtual' : '🏥 Presencial'}</span>
                                            </div>
                                        </div>
                                    </div>
                                ));
                            })()}
                        </CardContent>
                    </Card>

                    {/* Day detail */}
                    <Card className="rounded-[2.5rem] border-white/10 bg-white/[0.03] backdrop-blur-md shadow-2xl overflow-hidden border-none flex-1">
                        <CardHeader className="p-8 pb-4">
                            <CardTitle className="text-lg font-black text-white uppercase tracking-tight">
                                {selectedDay ? `${selectedDay} ${monthNamesFull[currentMonth].toLowerCase()}` : "Día seleccionado"}
                            </CardTitle>
                            {selected.length > 0 && (
                                <p className="text-[10px] font-black text-nutrition-500 uppercase tracking-widest">{selected.length} Cita(s) Programada(s)</p>
                            )}
                        </CardHeader>
                        <CardContent className="p-8 pt-4">
                            {selected.length === 0 ? (
                                <div className="text-center py-16 px-4">
                                    <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center mx-auto mb-4 opacity-40">
                                        <Clock className="h-6 w-6 text-slate-500" />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Agenda disponible</p>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {selected.map((apt) => (
                                        <div 
                                            key={apt.id} 
                                            className={cn(
                                                "p-5 rounded-[1.5rem] border border-white/5 relative group/appt transition-all hover:bg-white/5",
                                                apt.type === "virtual" ? "bg-sky-500/5 hover:border-sky-500/20" : "bg-orange-500/5 hover:border-orange-500/20"
                                            )}
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-8 w-8 border border-white/10 shadow-xl">
                                                        <AvatarFallback className="bg-white/5 text-white text-[10px] font-black">
                                                            {apt.patient.split(" ").map((n: string) => n[0]).join("")}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <span className="text-xs font-black text-white uppercase tracking-tight">{apt.patient}</span>
                                                </div>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-8 w-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 opacity-0 group-hover/appt:opacity-100 transition-all shadow-lg"
                                                    onClick={() => handleEditAppt(apt)}
                                                >
                                                    <Edit2 className="h-3.5 w-3.5" />
                                                </Button>
                                            </div>
                                            <div className="flex items-center justify-between gap-3 mt-4">
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-2">
                                                        <Clock className="h-3 w-3 text-nutrition-500" />
                                                        <span className="text-[10px] font-black text-slate-400">{apt.time}</span>
                                                    </div>
                                                    <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-white/5 bg-white/5 px-2 py-0.5 rounded-lg text-slate-500">
                                                        {apt.type === "virtual" ? "📹 Virtual" : "🏥 Presencial"}
                                                    </Badge>
                                                </div>
                                                <Badge className={cn(
                                                    "text-[8px] px-2 py-0.5 rounded-lg uppercase font-black tracking-widest border-0",
                                                    apt.status === "completada" ? "bg-green-500/20 text-green-400" :
                                                    apt.status === "cancelada" ? "bg-red-500/20 text-red-400" :
                                                    "bg-nutrition-500/20 text-nutrition-400"
                                                )}>
                                                    {apt.status === "completada" ? "Completada" :
                                                     apt.status === "cancelada" ? "Cancelada" : "Programada"}
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

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="w-[95vw] lg:max-w-4xl p-0 overflow-hidden border-none bg-slate-900/95 backdrop-blur-xl shadow-2xl h-[95vh] sm:h-auto sm:max-h-[90vh] flex flex-col rounded-[2rem] sm:rounded-[2.5rem]">
                    <DialogHeader className="p-6 sm:p-8 border-b border-white/5">
                        <DialogTitle className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">Editar Cita</DialogTitle>
                        <DialogDescription className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                            Ajustando detalles para <span className="text-nutrition-500">{editingAppt?.patient}</span>
                        </DialogDescription>
                    </DialogHeader>

                    <ScrollArea className="flex-1">
                        <div className="flex flex-col lg:flex-row h-full">
                            {/* Left Side: MINI CALENDAR */}
                            <div className="flex-1 p-6 sm:p-8 lg:border-r border-white/5 bg-white/[0.02]">
                                <div className="flex items-center justify-between mb-8">
                                    <div>
                                        <h3 className="text-lg font-black text-white uppercase tracking-tight">Selección de Fecha</h3>
                                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Modificar día de la consulta</p>
                                    </div>
                                    <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-xl border border-white/10">
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/10" 
                                            onClick={prevMonth}>
                                            <ChevronLeft className="h-4 w-4" />
                                        </Button>
                                        <span className="text-[10px] font-black text-white uppercase tracking-widest min-w-[120px] text-center">{monthNamesFull[viewMonth]} {viewYear}</span>
                                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                                            onClick={nextMonth}>
                                            <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>

                                <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                                    {["L", "M", "X", "J", "V", "S", "D"].map(d => (
                                        <div key={d} className="text-[9px] font-black text-slate-600 uppercase py-2 tracking-widest">{d}</div>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 gap-1">
                                    {(() => {
                                        const firstDay = new Date(viewYear, viewMonth, 1).getDay();
                                        const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
                                        const offset = firstDay === 0 ? 6 : firstDay - 1;
                                        const cells = [];
                                        for (let i = 0; i < offset; i++) cells.push(<div key={`empty-${i}`} />);
                                        for (let d = 1; d <= daysInMonth; d++) {
                                            const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                                            const isSelected = editValues.date === dateStr;
                                            const isToday = nowLocal.toISOString().split('T')[0] === dateStr;
                                            const isPast = new Date(viewYear, viewMonth, d) < new Date(new Date().setHours(0,0,0,0));
                                            
                                            cells.push(
                                                <button
                                                    key={d}
                                                    disabled={isPast}
                                                    onClick={() => setEditValues({...editValues, date: dateStr})}
                                                    className={cn(
                                                        "h-10 w-full rounded-xl text-[10px] font-black transition-all flex items-center justify-center relative",
                                                        isSelected ? "bg-nutrition-500 text-white shadow-xl shadow-nutrition-500/20" : 
                                                        isToday ? "bg-nutrition-500/10 text-nutrition-400 border border-nutrition-500/20" :
                                                        isPast ? "text-slate-700 cursor-not-allowed opacity-20" : "text-slate-400 hover:bg-white/5 hover:text-white"
                                                    )}
                                                >
                                                    {d}
                                                    {isSelected && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white animate-in zoom-in" />}
                                                </button>
                                            );
                                        }
                                        return cells;
                                    })()}
                                </div>

                                <div className="mt-8 space-y-4 pt-4 border-t border-white/5">
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Modalidad</label>
                                            <Select value={editValues.type} onValueChange={(v: any) => setEditValues({ ...editValues, type: v })}>
                                                <SelectTrigger className="h-10 rounded-xl border-white/10 bg-white/5 text-white text-[10px] font-black uppercase tracking-widest">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-900 border-white/10">
                                                    <SelectItem value="virtual" className="text-[10px] font-black uppercase text-white">📹 Virtual</SelectItem>
                                                    <SelectItem value="in-person" className="text-[10px] font-black uppercase text-white">🏥 Presencial</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Estado</label>
                                            <Select value={editValues.status} onValueChange={(v: any) => setEditValues({ ...editValues, status: v })}>
                                                <SelectTrigger className="h-10 rounded-xl border-white/10 bg-white/5 text-white text-[10px] font-black uppercase tracking-widest">
                                                    <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent className="bg-slate-900 border-white/10">
                                                    <SelectItem value="programada" className="text-[10px] font-black uppercase text-blue-400">Programada</SelectItem>
                                                    <SelectItem value="completada" className="text-[10px] font-black uppercase text-green-400">Completada</SelectItem>
                                                    <SelectItem value="cancelada" className="text-[10px] font-black uppercase text-red-400">Cancelada</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Right Side: TIME SLOTS */}
                            <div className="w-full lg:w-[320px] p-6 sm:p-8 bg-slate-900/50 lg:bg-slate-900 border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col">
                                <div className="mb-6">
                                    <h3 className="text-lg font-black text-white uppercase tracking-tight">Horario</h3>
                                    <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mt-1">Disponibilidad para {editValues.date}</p>
                                </div>

                                <ScrollArea className="h-60 sm:h-72 lg:h-[400px] pr-4">
                                    <div className="grid grid-cols-2 gap-2 pb-6">
                                        {timeSlots.map(time => {
                                            const isReserved = occupiedSlots.includes(time);
                                            const isPastDay = new Date(editValues.date + 'T12:00:00') < new Date(new Date().setHours(0,0,0,0));
                                            const isPastOrBuffer = isPastDay || isSlotPastOrBuffer(time, editValues.date);
                                            const isSelected = editValues.time === time;

                                            return (
                                                <button
                                                    key={time}
                                                    disabled={isReserved || isPastOrBuffer}
                                                    className={cn(
                                                        "py-3 rounded-xl text-[10px] font-black transition-all border uppercase tracking-widest",
                                                        isSelected ? "bg-nutrition-500 border-nutrition-500 text-white shadow-xl shadow-white/10" :
                                                        (isReserved || isPastOrBuffer) ? "bg-white/[0.02] border-white/5 text-slate-700 cursor-not-allowed" :
                                                        "bg-white/5 border-white/5 text-slate-400 hover:border-nutrition-500/30 hover:bg-nutrition-500/5 hover:text-nutrition-400"
                                                    )}
                                                    onClick={() => setEditValues({ ...editValues, time })}
                                                >
                                                    {time}
                                                    {isReserved && <span className="block text-[7px] opacity-40 mt-0.5 uppercase">Ocupado</span>}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </ScrollArea>
                            </div>
                        </div>
                    </ScrollArea>

                    <DialogFooter className="p-6 sm:p-8 bg-slate-900 border-t border-white/5 flex flex-row gap-3">
                        <Button 
                            variant="ghost" 
                            className="flex-1 h-12 rounded-xl font-black text-[10px] uppercase tracking-widest border border-white/5 hover:bg-white/5 text-slate-400" 
                            onClick={() => setIsEditDialogOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button 
                            className="flex-1 h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black uppercase tracking-widest text-[10px] gap-2 shadow-lg shadow-green-600/20" 
                            onClick={saveEdit}
                        >
                            <Save className="h-4 w-4" /> Guardar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
