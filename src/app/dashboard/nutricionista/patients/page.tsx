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

const supabase = createClient();

export default function PatientsPage() {
    const { toast } = useToast();
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState("all");
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    // Schedule Dialog State
    const [showScheduleDialog, setShowScheduleDialog] = useState(false);
    const [selectedPatient, setSelectedPatient] = useState<any>(null);
    const [viewMonth, setViewMonth] = useState(new Date().getMonth());
    const [viewYear, setViewYear] = useState(new Date().getFullYear());
    const [scheduleValues, setScheduleValues] = useState({
        date: new Date().toISOString().split('T')[0],
        time: "09:00",
        type: "virtual" as "virtual" | "in-person"
    });

    const monthNames = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];
    const timeSlots = ["08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00", "12:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"];

    const loadPatients = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase.from("profiles").select("id, full_name").eq("user_id", user.id).single();
            if (!profile) {
                console.error("[PatientsPage] Profile not found");
                return;
            }
            console.log("[PatientsPage] Nutri Profile:", profile.id, profile.full_name);

            const { data: assignedPatients, error } = await supabase
                .from("patients")
                .select(`
                    id, 
                    goal_weight, 
                    current_weight,
                    profile:profiles!profile_id(id, full_name, role, status, avatar_url, created_at)
                `)
                .eq("nutritionist_id", profile.id);

            console.log("[PatientsPage] Assigned patients raw:", assignedPatients);
            if (error) throw error;

            if (assignedPatients) {
                setPatients(assignedPatients.map(p => {
                    const profileData = (p.profile as any) || {};
                    return {
                        id: p.id,
                        name: profileData.full_name || "Paciente",
                        status: profileData.status || "Activo",
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
            .subscribe();

        // Broadcast Sync
        const bc = new BroadcastChannel('nutrigo_global_sync');
        bc.onmessage = () => loadPatients();

        return () => {
            supabase.removeChannel(channel);
            bc.close();
        };
    }, [loadPatients]);

    const handleOpenSchedule = (patient: any) => {
        setSelectedPatient(patient);
        setScheduleValues({
            date: new Date().toISOString().split('T')[0],
            time: "09:00",
            type: "virtual"
        });
        setShowScheduleDialog(true);
    };

    const handleSaveSchedule = async () => {
        if (!selectedPatient) return;

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase.from("profiles").select("id").eq("user_id", user.id).single();
            if (!profile) return;

            const { error } = await supabase.from("appointments").insert({
                patient_id: selectedPatient.id,
                nutritionist_id: profile.id,
                appointment_type: scheduleValues.type,
                date: scheduleValues.date,
                start_time: scheduleValues.time,
                end_time: "10:00", // Default 1 hour
                status: "scheduled"
            });

            if (error) throw error;

            toast({
                title: "Cita agendada",
                description: `Cita confirmada para ${selectedPatient.name} el ${scheduleValues.date} a las ${scheduleValues.time}.`,
                variant: "success",
            });

            // Sync other tabs/components
            const syncChannel = new BroadcastChannel('nutrigo_global_sync');
            syncChannel.postMessage('sync');
            syncChannel.close();

            setShowScheduleDialog(false);
        } catch (err) {
            console.error("Error scheduling appointment:", err);
            toast({
                title: "Error al agendar",
                description: "No se pudo guardar la cita en Supabase.",
                variant: "destructive",
            });
        }
    };

    const filteredPatients = patients.filter((p) => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesFilter = filterStatus === "all" || p.status?.toLowerCase() === filterStatus.toLowerCase();
        return matchesSearch && matchesFilter;
    });

    if (loading) return <div className="p-8 text-center text-muted-foreground">Cargando pacientes...</div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Mis Pacientes</h1>
                    <p className="text-muted-foreground">Gestiona y realiza seguimiento a tus pacientes asignados en Supabase.</p>
                </div>
            </div>

            <Card>
                <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <CardTitle className="text-base text-nutrition-700 font-black uppercase tracking-widest">Listado de Pacientes</CardTitle>
                    <div className="flex items-center gap-2">
                        <div className="relative flex-1 sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Buscar por nombre..."
                                className="pl-10 h-10 rounded-xl border-slate-200 focus:border-nutrition-300 focus:ring-nutrition-100"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value)}
                            className="h-10 px-4 rounded-xl border border-slate-200 text-sm bg-background focus:ring-2 focus:ring-nutrition-100 focus:border-nutrition-300 transition-all outline-none"
                        >
                            <option value="all">Todos los estados</option>
                            <option value="activo">Activos</option>
                            <option value="pausado">Pausados</option>
                            <option value="inactivo">Inactivos</option>
                        </select>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b bg-slate-50/50">
                                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-500 uppercase tracking-wider">Paciente</th>
                                    <th className="text-left py-4 px-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Fecha Inicio</th>
                                    <th className="text-left py-4 px-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Estado</th>
                                    <th className="text-left py-4 px-2 text-xs font-bold text-slate-500 uppercase tracking-wider">Siguiente Visita</th>
                                    <th className="py-4 px-6"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {filteredPatients.map((patient) => (
                                    <tr key={patient.id} className="group hover:bg-slate-50/50 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <Avatar className="h-10 w-10 border-2 border-white shadow-sm ring-1 ring-slate-100">
                                                    <AvatarFallback className="bg-nutrition-100 text-nutrition-700 font-bold text-xs uppercase">
                                                        {patient.name.split(" ").map((n: string) => n[0]).join("")}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{patient.name}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-4 px-2">
                                            <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-1 rounded-md">{patient.startDate}</span>
                                        </td>
                                        <td className="py-4 px-2">
                                            <div className="flex items-center gap-1.5">
                                                <div className={cn(
                                                    "h-2 w-2 rounded-full",
                                                    patient.status === "Activo" ? "bg-green-500" :
                                                        patient.status === "Pausado" ? "bg-amber-500" : "bg-slate-300"
                                                )} />
                                                <span className="text-xs font-bold text-slate-700">{patient.status}</span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-2">
                                            <span className="text-xs font-bold text-slate-600">{patient.nextVisit}</span>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleOpenSchedule(patient)}
                                                    className="h-9 gap-1.5 text-slate-500 hover:text-nutrition-600 hover:bg-nutrition-50 font-black bg-slate-50/50 rounded-xl px-4 border border-slate-100 hover:border-nutrition-100 transition-all"
                                                >
                                                    <CalendarIcon className="h-4 w-4" />
                                                    Citar
                                                </Button>
                                                <Link href={`/dashboard/nutricionista/patients/${patient.id}`}>
                                                    <Button variant="ghost" size="sm" className="h-9 gap-1.5 text-nutrition-600 hover:text-nutrition-700 hover:bg-nutrition-50 font-black bg-nutrition-50/30 rounded-xl px-4 border border-transparent hover:border-nutrition-100 transition-all">
                                                        Ver Ficha
                                                        <ArrowUpRight className="h-4 w-4" />
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
                        <div className="py-20 text-center">
                            <h3 className="text-lg font-bold text-slate-900">No se encontraron pacientes asignados</h3>
                            <p className="text-slate-500 max-w-xs mx-auto mt-1">Solo verás pacientes que hayan sido vinculados a tu cuenta en Supabase.</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Agendar Cita</DialogTitle>
                        <DialogDescription>Programar cita para {selectedPatient?.name}</DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <Input type="date" value={scheduleValues.date} onChange={(e) => setScheduleValues({ ...scheduleValues, date: e.target.value })} />
                        <select className="w-full text-sm border p-2 rounded-md" value={scheduleValues.time} onChange={(e) => setScheduleValues({ ...scheduleValues, time: e.target.value })}>
                            {timeSlots.map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                    </div>
                    <DialogFooter>
                        <Button onClick={handleSaveSchedule}>Guardar Cita</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
