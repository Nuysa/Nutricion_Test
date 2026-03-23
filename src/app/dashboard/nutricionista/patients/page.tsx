"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, ArrowUpRight, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Video, MapPin, Save, Clock } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { usePresence } from "@/components/providers/presence-provider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EditAppointmentDialog } from "@/components/dashboard/nutricionista/calendar/components/EditAppointmentDialog";
import { useNutritionistCalendar } from "@/components/dashboard/nutricionista/calendar/hooks/useNutritionistCalendar";

const supabase = createClient();

export default function PatientsPage() {
    const { toast } = useToast();
    const { isOnline } = usePresence();
    const [searchTerm, setSearchTerm] = useState("");
    const [filterSubscription, setFilterSubscription] = useState("all");
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const {
        isEditDialogOpen, setIsEditDialogOpen,
        editingAppt, setEditingAppt,
        viewMonth, setViewMonth,
        viewYear, setViewYear,
        editValues, setEditValues,
        getOccupiedSlots,
        isSlotPastOrBuffer,
        loadSupabaseData
    } = useNutritionistCalendar();

    const monthNames = ["Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio", "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"];
    const timeSlots = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"];

    const loadPatients = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase.from("profiles").select("id, full_name, role").eq("user_id", user.id).single();
            if (!profile) return;

            let query = supabase
                .from("patients")
                .select(`
                    id, 
                    plan_type,
                    goal_weight, 
                    current_weight,
                    profile:profiles!profile_id(id, full_name, role, status, avatar_url, created_at)
                `);
            
            // Si no es admin, filtrar solo por sus pacientes asignados
            if (profile.role !== 'admin') {
                query = query.eq("nutritionist_id", profile.id);
            }

            const { data: assignedPatients, error } = await query;

            console.log("[PatientsPage] Assigned patients raw:", assignedPatients);
            if (error) throw error;

            if (assignedPatients) {
                setPatients(assignedPatients.map(p => {
                    const profileData = Array.isArray(p.profile) ? p.profile[0] : (p.profile || {});
                    return {
                        id: p.id,
                        name: profileData.full_name || "Paciente",
                        status: profileData.status || "Activo",
                        subscription: p.plan_type || "No Plan",
                        progress: 0,
                        lastVisit: "Por programar",
                        nextVisit: "Sin programar",
                        nextVisitStatus: "",
                        currentMediciones: 0,
                        totalMediciones: 4,
                        startDate: profileData.created_at ? new Date(profileData.created_at).toLocaleDateString() : "N/A",
                        profileId: profileData.id
                    };
                }));
            }
        } catch (err) {
            console.error("Error loading patients:", err);
        } finally {
            setLoading(false);
        }
    }, []);


    useEffect(() => {
        loadPatients();
        loadSupabaseData();

        const channel = supabase
            .channel('nutritionist_patients_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => {
                console.log("Realtime: Patients table changed, refreshing...");
                loadPatients();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => {
                console.log("Realtime: Profiles table changed, refreshing patients list...");
                loadPatients();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
                console.log("Realtime: Appointments table changed, refreshing availability...");
                loadSupabaseData();
            })
            .subscribe();

        // Broadcast Sync
        const bc = new BroadcastChannel('nutrigo_global_sync');
        bc.onmessage = () => {
            loadPatients();
            loadSupabaseData();
        };

        return () => {
            supabase.removeChannel(channel);
            bc.close();
        };
    }, [loadPatients, loadSupabaseData]);


    const handleOpenSchedule = (patient: any) => {
        const now = new Date();
        const dateStr = now.toISOString().split('T')[0];
        
        setEditingAppt({
            id: 'new', // Flag for new appointment
            patient: patient.name,
            patientId: patient.id
        });

        setEditValues({
            date: dateStr,
            time: "09:00",
            type: "virtual",
            status: "programada"
        });

        setViewMonth(now.getMonth());
        setViewYear(now.getFullYear());
        setIsEditDialogOpen(true);
    };

    const handleSaveSchedule = async () => {
        if (!editingAppt || !editValues.time) {
            toast({ title: "Error", description: "Selecciona una hora para la cita", variant: "destructive" });
            return;
        }

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
            if (!profile) return;

            const [h, m] = editValues.time.split(":").map(Number);
            const totalStart = h * 60 + m;
            const totalEnd = totalStart + 30;
            const endH = Math.floor(totalEnd / 60).toString().padStart(2, '0');
            const endM = (totalEnd % 60).toString().padStart(2, '0');
            const endTime = `${endH}:${endM}:00`;
            const startTime = `${editValues.time}:00`;

            const now = new Date();
            const targetDate = new Date(editValues.date + 'T00:00:00');
            targetDate.setHours(h, m, 0, 0);

            // Validaciones de negocio estandarizadas
            if (editValues.status === 'programada') {
                const minTime = new Date(now.getTime() + 60 * 60 * 1000);
                if (targetDate < minTime) {
                    throw new Error("Las citas programadas deben agendarse con al menos 1 hora de anticipación hacia el futuro.");
                }
            } else if (editValues.status === 'completada') {
                if (targetDate > now) {
                    throw new Error("No puedes marcar como completada una cita que aún no ha ocurrido.");
                }
            }

            const { error } = await supabase.from("appointments").insert({
                patient_id: editingAppt.patientId,
                nutritionist_id: profile.id,
                scheduled_by: profile.id,
                modality: editValues.type === 'in-person' ? 'presencial' : 'virtual',
                appointment_date: editValues.date,
                start_time: startTime,
                end_time: endTime,
                status: editValues.status
            });

            if (error) throw error;

            toast({
                title: "Cita guardada",
                description: `Cita registrada para ${editingAppt.patient} el ${editValues.date} a las ${editValues.time}.`,
                variant: "success",
            });

            const syncChannel = new BroadcastChannel('nutrigo_global_sync');
            syncChannel.postMessage('sync');
            syncChannel.close();

            setIsEditDialogOpen(false);
            loadSupabaseData();
        } catch (err: any) {
            console.error("Error saving appointment:", err);
            toast({
                title: "Error",
                description: err.message || "No se pudo guardar la cita.",
                variant: "destructive",
            });
        }
    };

    const filteredPatients = patients.filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());

        let matchesFilter = true;
        if (filterSubscription !== "all") {
            const sub = (p.subscription || "").toLowerCase();
            if (filterSubscription === "sin plan") {
                matchesFilter = sub === "no plan" || sub === "" || sub.includes("sin plan");
            } else if (filterSubscription === "flexible") {
                matchesFilter = sub.includes("flexible");
            } else if (filterSubscription === "menu") {
                matchesFilter = sub.includes("menú") || sub.includes("menu") || sub.includes("semanal");
            }
        }

        return matchesSearch && matchesFilter;
    });

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 animate-in fade-in duration-500">
            <div className="relative h-16 w-16">
                <div className="absolute inset-0 rounded-full border-4 border-nutrition-500/20" />
                <div className="absolute inset-0 rounded-full border-4 border-nutrition-500 border-t-transparent animate-spin" />
            </div>
            <p className="font-black text-xs text-nutrition-500 uppercase tracking-[0.2em] animate-pulse">Cargando pacientes...</p>
        </div>
    );

    return (
        <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-700">
            <div className="flex flex-col space-y-2">
                <h1 className="text-3xl font-black text-white uppercase tracking-tight">Mis Pacientes</h1>
                <p className="text-slate-400 font-bold text-sm uppercase tracking-widest opacity-60">Gestiona y realiza seguimiento a tus pacientes asignados en Supabase.</p>
            </div>

            <Card className="rounded-[2.5rem] border-white/10 bg-white/[0.03] backdrop-blur-md shadow-2xl overflow-hidden">
                <CardHeader className="border-b border-white/5 p-10">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                        <CardTitle className="text-lg text-nutrition-500 font-black uppercase tracking-[0.2em]">Listado de Pacientes</CardTitle>
                        <div className="flex flex-col sm:flex-row items-center gap-4">
                            <div className="relative w-full sm:w-80">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                <Input
                                    placeholder="Buscar por nombre..."
                                    className="pl-12 h-12 rounded-[1rem] border-white/5 bg-white/5 text-white placeholder:text-slate-600 focus:ring-nutrition-500/50 transition-all"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <select
                                value={filterSubscription}
                                onChange={(e) => setFilterSubscription(e.target.value)}
                                className="h-12 px-6 rounded-[1rem] border border-white/5 bg-white/5 text-xs font-black uppercase tracking-widest text-slate-400 focus:ring-2 focus:ring-nutrition-500/20 focus:border-nutrition-500/50 transition-all outline-none appearance-none cursor-pointer hover:bg-white/10"
                            >
                                <option value="all" className="bg-slate-900 text-white">Todas las suscripciones</option>
                                <option value="sin plan" className="bg-slate-900 text-white">Sin plan</option>
                                <option value="flexible" className="bg-slate-900 text-white">Plan flexible</option>
                                <option value="menu" className="bg-slate-900 text-white">Plan con menú semanal</option>
                            </select>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.02]">
                                    <th className="text-left py-6 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Paciente</th>
                                    <th className="text-left py-6 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Fecha Inicio</th>
                                    <th className="text-left py-6 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Estado</th>
                                    <th className="text-left py-6 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Suscripción</th>
                                    <th className="text-left py-6 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Siguiente Visita</th>
                                    <th className="py-6 px-10"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {filteredPatients.map((patient) => (
                                    <tr key={patient.id} className="group hover:bg-white/[0.03] transition-all duration-300">
                                        <td className="py-6 px-10">
                                            <div className="flex items-center gap-4">
                                                <Avatar className="h-12 w-12 border-2 border-white/10 shadow-xl group-hover:border-nutrition-500/50 transition-all">
                                                    <AvatarFallback className="bg-nutrition-500/20 text-nutrition-400 font-bold text-xs uppercase">
                                                        {patient.name.split(" ").map((n: string) => n[0]).join("")}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-sm font-black text-white group-hover:text-nutrition-400 transition-colors uppercase tracking-tight">{patient.name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-6 px-4">
                                            <Badge variant="outline" className="text-[10px] font-black text-slate-400 border-white/5 bg-white/5 px-3 py-1 rounded-lg uppercase">
                                                {patient.startDate}
                                            </Badge>
                                        </td>
                                        <td className="py-6 px-4">
                                            <div className="flex items-center gap-2">
                                                {isOnline(patient.profileId) ? (
                                                    <>
                                                        <div className="h-2 w-2 rounded-full shadow-[0_0_8px] bg-green-500 shadow-green-500/50 animate-pulse" />
                                                        <span className="text-[10px] font-black text-green-400 uppercase tracking-widest">Activo</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <div className="h-2 w-2 rounded-full shadow-[0_0_8px] bg-slate-500 shadow-slate-500/50" />
                                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Desconectado</span>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-6 px-4">
                                            <Badge variant="outline" className="text-[10px] font-black text-nutrition-400 border-nutrition-500/20 bg-nutrition-500/5 px-3 py-1 rounded-lg uppercase">
                                                {patient.subscription}
                                            </Badge>
                                        </td>
                                        <td className="py-6 px-4">
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
                                                {patient.nextVisit}
                                            </span>
                                        </td>
                                        <td className="py-6 px-10 text-right">
                                            <div className="flex items-center justify-end gap-3 opacity-60 group-hover:opacity-100 transition-all">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleOpenSchedule(patient)}
                                                    disabled={patient.subscription === "No Plan" || !patient.subscription || patient.subscription.toLowerCase().includes("sin plan")}
                                                    className="h-10 gap-2 text-slate-400 hover:text-white hover:bg-white/10 font-black bg-white/5 rounded-xl px-4 border border-white/5 transition-all uppercase tracking-widest text-[10px] disabled:opacity-20 disabled:cursor-not-allowed disabled:hover:bg-white/5 disabled:hover:text-slate-400"
                                                >
                                                    <CalendarIcon className="h-3.5 w-3.5" />
                                                    Citar
                                                </Button>
                                                <Link href={`/dashboard/nutricionista/patients/${patient.id}`}>
                                                    <Button variant="ghost" size="sm" className="h-10 gap-2 text-nutrition-500 hover:text-white hover:bg-nutrition-500 font-black bg-nutrition-500/10 rounded-xl px-4 border border-nutrition-500/20 transition-all uppercase tracking-widest text-[10px]">
                                                        Ver Ficha
                                                        <ArrowUpRight className="h-3.5 w-3.5" />
                                                    </Button>
                                                </Link>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredPatients.length === 0 && (
                        <div className="py-32 text-center animate-in zoom-in duration-500">
                            <div className="inline-flex items-center justify-center h-20 w-20 rounded-[2rem] bg-white/5 border border-white/5 mb-6">
                                <Search className="h-8 w-8 text-slate-600" />
                            </div>
                            <h3 className="text-xl font-black text-white uppercase tracking-tight">No se encontraron pacientes</h3>
                            <p className="text-slate-500 max-w-xs mx-auto mt-2 text-xs font-bold uppercase tracking-widest leading-relaxed opacity-60">
                                Solo verás pacientes que hayan sido vinculados a tu cuenta en Supabase.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <EditAppointmentDialog
                isOpen={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                editingAppt={editingAppt}
                editValues={editValues}
                setEditValues={setEditValues}
                viewMonth={viewMonth}
                setViewMonth={setViewMonth}
                viewYear={viewYear}
                setViewYear={setViewYear}
                getOccupiedSlots={getOccupiedSlots}
                isSlotPastOrBuffer={isSlotPastOrBuffer}
                onSave={handleSaveSchedule}
            />
        </div>
    );
}
