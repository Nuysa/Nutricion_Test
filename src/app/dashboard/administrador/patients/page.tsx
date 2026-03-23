"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Search, ArrowUpRight, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Video, MapPin, Save, Clock, Trash2, Stethoscope, FileX } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { createClient } from "@/lib/supabase/client";
import { usePresence } from "@/components/providers/presence-provider";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const supabase = createClient();

export default function AdminPatientsPage() {
    const { toast } = useToast();
    const { isOnline } = usePresence();
    const [searchTerm, setSearchTerm] = useState("");
    const [filterSubscription, setFilterSubscription] = useState("all");
    const [patients, setPatients] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

    const loadPatients = useCallback(async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase.from("profiles").select("id, full_name, role").eq("user_id", user.id).single();
            if (!profile) return;
            setCurrentUserRole(profile.role);

            // Admin ve TODOS los pacientes. Nutricionista solo los suyos.
            let query = supabase
                .from("patients")
                .select(`
                    id, 
                    plan_type,
                    profile:profiles!profile_id(id, full_name, role, status, avatar_url, created_at)
                `);
            
            if (profile.role !== 'admin' && profile.role !== 'administrador') {
                query = query.eq("nutritionist_id", profile.id);
            }

            const { data: assignedPatients, error } = await query;
            if (error) throw error;

            if (assignedPatients) {
                setPatients(assignedPatients.map(p => {
                    const profileData = Array.isArray(p.profile) ? p.profile[0] : (p.profile || {});
                    return {
                        id: p.id,
                        name: profileData.full_name || "Paciente",
                        status: profileData.status || "Activo",
                        subscription: p.plan_type || "No Plan",
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
    }, [loadPatients]);

    const handleDeletePatient = async (patientId: string, profileId: string, patientName: string) => {
        if (!confirm(`¿Estás seguro de que deseas eliminar permanentemente a ${patientName}? Se borrará todo su historial clínico.`)) {
            return;
        }

        try {
            // RLS should handle permissions
            const { error } = await supabase.from("profiles").delete().eq("id", profileId);
            if (error) throw error;

            toast({ title: "Paciente eliminado", description: "El registro ha sido borrado correctamente.", variant: "success" });
            loadPatients();
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        }
    };

    const handleDeleteHistory = async (patientId: string, patientName: string) => {
        if (!confirm(`¿Estás seguro de que deseas borrar el historial clínico de ${patientName}? Los datos biográficos y el perfil se mantendrán, pero todo el historial médico será eliminado.`)) {
            return;
        }

        try {
            const { error } = await supabase.from("patient_medical_histories").delete().eq("patient_id", patientId);
            if (error) throw error;

            toast({ title: "Historial eliminado", description: `El historial médico de ${patientName} ha sido borrado.`, variant: "success" });
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
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
                matchesFilter = sub.includes("menú") || sub.includes("menu");
            }
        }
        return matchesSearch && matchesFilter;
    });

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <div className="h-12 w-12 rounded-full border-4 border-nutri-brand border-t-transparent animate-spin" />
            <p className="font-black text-xs text-nutri-brand uppercase tracking-[0.2em]">Cargando Control Central...</p>
        </div>
    );

    return (
        <div className="p-4 lg:p-10 space-y-10 min-h-screen bg-nutri-base text-white font-tech animate-in fade-in duration-700">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-4xl font-black italic uppercase tracking-tighter flex items-center gap-4">
                        <div className="h-3 w-12 bg-nutri-brand" />
                        Gestión de Pacientes
                    </h1>
                    <p className="text-slate-500 font-bold text-xs uppercase tracking-widest opacity-80">Panel de Administración de Registros Clínicos</p>
                </div>
                
                <div className="flex items-center gap-4">
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="FILTRAR PACIENTE..."
                            className="pl-12 h-14 rounded-2xl border-white/5 bg-white/5 text-white placeholder:text-slate-700 italic font-bold focus:ring-nutri-brand/50"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
            </div>

            <Card className="rounded-[2.5rem] border-white/5 bg-[#151F32]/60 backdrop-blur-xl shadow-2xl overflow-hidden">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="border-b border-white/5 bg-white/[0.02]">
                                    <th className="text-left py-8 px-8 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] font-tech italic">Identidad</th>
                                    <th className="text-left py-8 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] font-tech italic">Estado</th>
                                    <th className="text-left py-8 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] font-tech italic">Plan</th>
                                    <th className="text-left py-8 px-4 text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] font-tech italic">Registro</th>
                                    <th className="py-8 px-8"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/[0.03]">
                                {filteredPatients.map((patient) => (
                                    <tr key={patient.id} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="py-6 px-8">
                                            <div className="flex items-center gap-5">
                                                <Avatar className="h-14 w-14 border-2 border-white/10 group-hover:border-nutri-brand/50 transition-all shadow-2xl">
                                                    <AvatarFallback className="bg-slate-800 text-white font-black italic">
                                                        {patient.name[0]}
                                                    </AvatarFallback>
                                                </Avatar>
                                                <div className="flex flex-col">
                                                    <span className="text-lg font-black text-white italic uppercase tracking-tighter">{patient.name}</span>
                                                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest mt-1">ID: {patient.id.substring(0,8)}</span>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-6 px-4">
                                            <div className="flex items-center gap-2">
                                                <div className={cn("h-2 w-2 rounded-full", isOnline(patient.profileId) ? "bg-green-500 animate-pulse" : "bg-slate-600")} />
                                                <span className="text-[10px] font-black uppercase italic tracking-widest text-slate-400">
                                                    {isOnline(patient.profileId) ? "ACTIVE" : "OFFLINE"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-6 px-4">
                                            <Badge className="bg-nutri-brand/10 text-nutri-brand border-none px-4 py-1.5 rounded-xl font-black italic uppercase text-[9px]">
                                                {patient.subscription}
                                            </Badge>
                                        </td>
                                        <td className="py-6 px-4 italic text-slate-500 font-bold text-xs uppercase">
                                            {patient.startDate}
                                        </td>
                                        <td className="py-6 px-8 text-right">
                                            <div className="flex items-center justify-end gap-3 group-hover:opacity-100 transition-all duration-300">
                                                <Link href={`/dashboard/nutricionista/patients/${patient.id}`}>
                                                    <Button className="h-10 bg-white text-nutri-base hover:bg-nutri-brand hover:text-white font-black italic uppercase text-[10px] rounded-xl px-6 transition-all border-none">
                                                        VER FICHA
                                                    </Button>
                                                </Link>
                                                                                                {(currentUserRole === 'admin' || currentUserRole === 'administrador') && (
                                                    <>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon"
                                                            onClick={() => handleDeleteHistory(patient.id, patient.name)}
                                                            title="Borrar Historial Clínico"
                                                            className="h-10 w-10 bg-amber-500/10 text-amber-500 hover:bg-amber-500 hover:text-white rounded-xl transition-all"
                                                        >
                                                            <div className="relative">
                                                                <Stethoscope className="h-4 w-4" />
                                                                <FileX className="h-2 w-2 absolute -bottom-1 -right-1" />
                                                            </div>
                                                        </Button>

                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon"
                                                            onClick={() => handleDeletePatient(patient.id, patient.profileId, patient.name)}
                                                            title="Eliminar Perfil Completo"
                                                            className="h-10 w-10 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {filteredPatients.length === 0 && (
                        <div className="py-32 text-center">
                            <h3 className="text-2xl font-black text-slate-700 italic uppercase">Sin resultados en la base</h3>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
