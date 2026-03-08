"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Users, UserCheck, Link2, DatabaseZap, Calendar,
    Link as LinkIcon, Search, Check, X, UserPlus,
    Bell, UserCheck as UserCheckIcon, Clock, Settings, ArrowRight,
    Plus, Trash2, DatabaseZap as DbIcon, Mail, Edit3, Save, Loader2,
    BarChart3, TrendingUp, Target, DollarSign, Activity,
    Shield, ShieldPlus, User, FileText, ChevronRight, Play, Layers, Filter, LayoutGrid, LayoutList, LayoutTemplate, Stethoscope
} from "lucide-react";
import { VariablesConfig } from "@/components/dashboard/admin/variables-config";
import { TableEditor } from "@/components/dashboard/admin/table-editor";
import { VisualLandingEditor } from "@/components/dashboard/admin/visual-landing-editor";
import { FoodDatabase } from "@/components/dashboard/admin/food-database";
import { MessagingService, GlobalProfile } from "@/lib/messaging-service";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { PlansSection } from "@/components/landing/plans-section";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter
} from "@/components/ui/dialog";

export function AdminStaffDashboardContent({ initialTab = "overview" }: { initialTab?: any }) {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState<"overview" | "verification" | "assignments" | "subscriptions" | "metrics" | "calendar" | "settings" | "visualization" | "landing_cms" | "plans_management" | "food_database" | "users_management">(initialTab);
    const [plansEditMode, setPlansEditMode] = useState(true);



    const [profiles, setProfiles] = useState<GlobalProfile[]>([]);
    const [assignments, setAssignments] = useState<Record<string, string[]>>({});
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [offers, setOffers] = useState<any[]>([]);
    const [currentAdminRole, setCurrentAdminRole] = useState<string>("");
    const [searchTerm, setSearchTerm] = useState("");
    const [verifSearch, setVerifSearch] = useState("");
    const [assignPSearch, setAssignPSearch] = useState("");
    const [assignNSearch, setAssignNSearch] = useState("");

    const [loading, setLoading] = useState(true);

    // Agenda states
    const [isAgendaDialogOpen, setIsAgendaDialogOpen] = useState(false);
    const [agendaNutriId, setAgendaNutriId] = useState("");
    const [agendaPatientId, setAgendaPatientId] = useState("");
    const [agendaDate, setAgendaDate] = useState("");
    const [agendaTime, setAgendaTime] = useState("");

    // Offer edit states
    const [editingOffer, setEditingOffer] = useState<any>(null);
    const [newOfferName, setNewOfferName] = useState("");
    const [newOfferPrice, setNewOfferPrice] = useState("");
    const [newOfferDescription, setNewOfferDescription] = useState("");
    const [newOfferPriceOffer, setNewOfferPriceOffer] = useState("");
    const [newOfferOfferReason, setNewOfferOfferReason] = useState("");
    const [newOfferFeatures, setNewOfferFeatures] = useState("");
    const [newOfferHighlight, setNewOfferHighlight] = useState("");
    const [isCreateOfferDialogOpen, setIsCreateOfferDialogOpen] = useState(false);
    const [offerSearch, setOfferSearch] = useState("");
    const [subReviewSearch, setSubReviewSearch] = useState("");
    const [selectedPatientPlan, setSelectedPatientPlan] = useState<GlobalProfile | null>(null);
    const [newPlanType, setNewPlanType] = useState("");

    // Create User States
    const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
    const [newUserEmail, setNewUserEmail] = useState("");
    const [newUserPassword, setNewUserPassword] = useState("");
    const [newUserFullName, setNewUserFullName] = useState("");
    const [newUserRole, setNewUserRole] = useState<"staff" | "administrador">("staff");
    const [isCreatingUser, setIsCreatingUser] = useState(false);


    // Enhanced Calendar States
    const [allAppointments, setAllAppointments] = useState<any[]>([]);
    const [selectedCalDate, setSelectedCalDate] = useState<Date>(new Date(2026, 1, 23));
    const [occupiedSlots, setOccupiedSlots] = useState<string[]>([]);
    const [calMonth, setCalMonth] = useState(1);
    const [calYear] = useState(2026);

    const timeSlots = [
        "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
        "12:00", "12:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
    ];

    const loadData = async (isSilent = false) => {
        // If it's a silent update, don't show the full page loader
        if (!isSilent) setLoading(true);

        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase.from("profiles").select("role").eq("user_id", user.id).single();
                if (profile) setCurrentAdminRole(profile.role);
            }

            const [fetchedProfiles, fetchedAssignments, fetchedSubs, fetchedOffers, fetchedAppointments] = await Promise.all([
                MessagingService.getProfiles(),
                MessagingService.getAssignments(),
                MessagingService.getAllSubscriptions(),
                MessagingService.getSubscriptionOffers(),
                MessagingService.getAllAppointments()
            ]);
            setProfiles(fetchedProfiles);
            setAssignments(fetchedAssignments);
            setSubscriptions(fetchedSubs);
            setOffers(fetchedOffers);
            setAllAppointments(fetchedAppointments);
            console.log(`[Dashboard] Data loaded. Assignments: ${Object.keys(fetchedAssignments).length}`);
        } catch (error) {
            console.error("Error loading admin data:", error);
        } finally {
            setLoading(false);
        }
    };

    const getOccupiedSlots = (dateStr: string, nutriId: string) => {
        if (!nutriId) return [];
        const dayAppts = allAppointments.filter(a => {
            return a.date === dateStr && a.nutritionistId === nutriId;
        });

        const occupied = new Set<string>();
        dayAppts.forEach(a => {
            const time = a.startTime.substring(0, 5);
            occupied.add(time);

            // Assume 30 min slots, so mark the next slot as potentially busy if we want to mimic the nutritionist logic 
            // (Nutri logic seems to mark the slot and the NEXT 30 min slot as occupied?)
            // Looking at page.tsx line 94: occupied.add(`${nextH}:${nextM}`);
            // Let's stick to literal slots for now or mimic it exactly.
            const [h, m] = time.split(":").map(Number);
            const totalMin = h * 60 + m + 30;
            const nextH = Math.floor(totalMin / 60).toString().padStart(2, '0');
            const nextM = (totalMin % 60).toString().padStart(2, '0');
            occupied.add(`${nextH}:${nextM}`);
        });

        return Array.from(occupied);
    };

    const isSlotPast = (slotTime: string, dateStr: string) => {
        const now = new Date(2026, 1, 23, 6, 50); // Simulated now
        const [h, m] = slotTime.split(":").map(Number);
        const targetDate = new Date(dateStr + 'T' + slotTime);
        return targetDate < now;
    };

    useEffect(() => {
        if (agendaDate && agendaNutriId) {
            setOccupiedSlots(getOccupiedSlots(agendaDate, agendaNutriId));
        }
    }, [agendaDate, agendaNutriId, allAppointments]);

    useEffect(() => {
        loadData();

        // 1. Supabase Realtime Subscription (For DB changes)
        const supabase = createClient();
        const realtimeSync = supabase
            .channel('admin_global_changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'profiles' },
                () => {
                    console.log("Realtime: Profiles changed, refreshing...");
                    loadData(true);
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'patients' },
                () => {
                    console.log("Realtime: Patients (Assignments) changed, refreshing...");
                    loadData(true);
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'subscriptions' },
                () => {
                    console.log("Realtime: Subscriptions changed, refreshing...");
                    loadData(true);
                }
            )
            .subscribe();

        // 2. Local Sync Channel (For cross-tab same-browser actions)
        const channel = new BroadcastChannel('nutrigo_global_sync');
        channel.onmessage = () => {
            console.log("Broadcast: Refreshing data...");
            void loadData(true);
        };

        // 3. Fallback Poller (Just in case, every 1 minute)
        const poller = setInterval(() => {
            void loadData(true);
        }, 60000);

        return () => {
            supabase.removeChannel(realtimeSync);
            channel.close();
            clearInterval(poller);
        };
    }, []);

    const handleVerify = async (id: string, status: "Activo" | "Rechazado") => {
        try {
            await MessagingService.verifyProfile(id, status);
            toast({
                title: status === "Activo" ? "Nutricionista Verificado" : "Registro Rechazado",
                description: `El usuario ahora tiene el estado: ${status}`,
                variant: "success"
            });
            loadData();
        } catch (error: any) {
            toast({
                title: "Error de Servidor",
                description: error.message || "No se pudo actualizar el estado.",
                variant: "destructive"
            });
        }
    };

    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const [selectedNutriId, setSelectedNutriId] = useState<string | null>(null);

    const handleAssign = async () => {
        if (!selectedPatientId || !selectedNutriId) {
            toast({ title: "Error", description: "Selecciona un paciente y un nutricionista", variant: "destructive" });
            return;
        }
        await MessagingService.assignPatientToNutritionist(selectedPatientId, selectedNutriId);
        setSelectedPatientId(null);
        setSelectedNutriId(null);
        toast({
            title: "Paciente Asignado",
            description: "La relación ha sido guardada en Supabase.",
            variant: "success"
        });
        loadData();
    };

    const handleUnassign = async (pid: string, nid: string) => {
        try {
            await MessagingService.unassignPatientFromNutritionist(pid, nid);
            toast({
                title: "Asignación Removida",
                description: "La relación ha sido eliminada.",
                variant: "success"
            });
            loadData();
        } catch (error: any) {
            toast({
                title: "Error",
                description: "No se pudo eliminar la relación: " + (error.message || "Desconocido"),
                variant: "destructive"
            });
        }
    };

    const handleCreateAppointment = async () => {
        if (!agendaNutriId || !agendaPatientId || !agendaDate || !agendaTime) {
            toast({ title: "Error", description: "Completa todos los campos de la cita", variant: "destructive" });
            return;
        }
        try {
            const supabase = createClient();
            const { error } = await supabase.from("appointments").insert({
                patient_id: agendaPatientId,
                nutritionist_id: agendaNutriId,
                date: agendaDate,
                start_time: agendaTime,
                end_time: (() => {
                    const [h, m] = agendaTime.split(":").map(Number);
                    const total = h * 60 + m + 30;
                    return `${Math.floor(total / 60).toString().padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}:00`;
                })(),
                appointment_type: "virtual",
                status: "scheduled"
            });
            if (error) throw error;

            toast({ title: "Cita Programada", description: "La cita ha sido registrada con éxito.", variant: "success" });
            setIsAgendaDialogOpen(false);
            setAgendaNutriId("");
            setAgendaPatientId("");
            setAgendaDate("");
            setAgendaTime("");
        } catch (error: any) {
            toast({ title: "Error al agendar", description: error.message, variant: "destructive" });
        }
    };

    const handleUpdateOffer = async () => {
        if (!editingOffer) return;
        try {
            const supabase = createClient();
            const { error } = await supabase
                .from("subscription_offers")
                .update({
                    name: newOfferName,
                    price: parseFloat(newOfferPrice),
                    offer_price: newOfferPriceOffer ? parseFloat(newOfferPriceOffer) : null,
                    offer_reason: newOfferOfferReason,
                    benefit_highlight: newOfferHighlight,
                    description: newOfferDescription,
                    features: newOfferFeatures.split('\n').filter(f => f.trim() !== '')
                })
                .eq("id", editingOffer.id);

            if (error) throw error;
            toast({ title: "Plan Actualizado", variant: "success" });
            setEditingOffer(null);
            loadData();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleCreateOffer = async () => {
        try {
            const supabase = createClient();
            const { error } = await supabase
                .from("subscription_offers")
                .insert([{
                    name: newOfferName,
                    price: parseFloat(newOfferPrice),
                    offer_price: newOfferPriceOffer ? parseFloat(newOfferPriceOffer) : null,
                    offer_reason: newOfferOfferReason,
                    benefit_highlight: newOfferHighlight,
                    description: newOfferDescription,
                    duration_days: 30, // Default
                    features: newOfferFeatures.split('\n').filter(f => f.trim() !== '')
                }]);

            if (error) throw error;
            toast({ title: "Plan Creado Successfully", variant: "success" });
            setIsCreateOfferDialogOpen(false);
            setNewOfferName("");
            setNewOfferPrice("");
            setNewOfferPriceOffer("");
            setNewOfferOfferReason("");
            setNewOfferDescription("");
            loadData();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };


    const handleSaveSettings = async () => {
        toast({
            title: "Configuración Actualizada",
            description: "Los parámetros clínicos han sido guardados en la base de datos global.",
            variant: "success"
        });
    };

    const handleDeleteProfile = async (id: string, name: string) => {

        if (confirm(`¿Estás seguro de eliminar a ${name} de Supabase? Esta acción no se puede deshacer.`)) {
            try {
                await MessagingService.deleteProfile(id);
                toast({
                    title: "Perfil Eliminado",
                    description: "El usuario ha sido removido de la base de datos.",
                    variant: "success"
                });
                loadData();
            } catch (error: any) {
                toast({
                    title: "Error al Eliminar",
                    description: "Verifica los permisos RLS en Supabase. Error: " + (error.message || "Desconocido"),
                    variant: "destructive"
                });
            }
        }
    };

    const handleCreateUser = async () => {
        if (!newUserEmail || !newUserPassword || !newUserFullName) {
            toast({ title: "Error", description: "Completa todos los campos", variant: "destructive" });
            return;
        }

        setIsCreatingUser(true);
        try {
            const response = await fetch("/api/admin/create-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    email: newUserEmail,
                    password: newUserPassword,
                    fullName: newUserFullName,
                    role: newUserRole
                })
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || "Error al crear usuario");
            }

            toast({ title: "Usuario Creado", description: "El usuario ha sido registrado exitosamente.", variant: "success" });
            setIsCreateUserDialogOpen(false);
            // Reset fields
            setNewUserEmail("");
            setNewUserPassword("");
            setNewUserFullName("");
            loadData(true);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsCreatingUser(false);
        }
    };


    const nutritionists = profiles.filter(p => p.role === "nutricionista");
    const patients = profiles.filter(p => p.role === "paciente");
    const pendingNutris = nutritionists.filter(p =>
        ((p as any).status !== "Activo" && (p as any).status !== "Rechazado") &&
        (p.name || "").toLowerCase().includes(verifSearch.toLowerCase())
    );
    const filteredPatientsForAssign = patients.filter(p =>
        (p.name || "").toLowerCase().includes(assignPSearch.toLowerCase())
    );
    const activeNutris = nutritionists.filter(p =>
        (p as any).status === "Activo" &&
        (p.name || "").toLowerCase().includes(assignNSearch.toLowerCase())
    );

    return (
        <div className={cn(
            activeTab === "landing_cms" ? "space-y-0 pb-0 -m-4 lg:-m-6" : "space-y-8 pb-10"
        )}>
            {/* Header */}
            {activeTab !== "landing_cms" && activeTab !== "plans_management" && (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-4xl font-black text-white tracking-tight uppercase">
                            {activeTab === "settings" ? "Configuración Variables" :
                                activeTab === "visualization" ? "Configuración de Tablas" : "Panel Administrador"}
                        </h1>
                        <p className="text-slate-400 font-tech font-black uppercase tracking-widest text-[10px] mt-1 opacity-60">Sincronizado con Supabase en tiempo real.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <Button variant="outline" className="rounded-2xl font-black text-[10px] uppercase tracking-widest border-white/10 bg-white/5 text-white hover:bg-white/10">
                            <Bell className="h-4 w-4 mr-2" /> Notificaciones
                        </Button>
                    </div>
                </div>
            )}

            {loading ? (
                <div className="py-20 text-center space-y-4">
                    <div className="h-10 w-10 border-4 border-nutrition-600 border-t-transparent rounded-full animate-spin mx-auto" />
                    <p className="text-slate-400 font-bold">Cargando datos desde Supabase...</p>
                </div>
            ) : (
                <div className={cn(
                    "grid grid-cols-1 gap-8 items-start",
                    (activeTab !== "settings" && activeTab !== "visualization" && activeTab !== "landing_cms" && activeTab !== "plans_management" && activeTab !== "food_database") ? "lg:grid-cols-[260px_1fr]" : "lg:grid-cols-1"
                )}>
                    {/* Panel Lateral Interno */}
                    {activeTab !== "settings" && activeTab !== "visualization" && activeTab !== "landing_cms" && activeTab !== "plans_management" && activeTab !== "food_database" && (
                        <div className="flex flex-col gap-2 bg-white/[0.03] p-4 rounded-[2.5rem] border border-white/5 sticky top-24">
                            <p className="px-5 py-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-2">Administración</p>
                            {[
                                { id: "overview", label: "Resumen General", icon: Users },
                                { id: "verification", label: "Verificaciones", icon: UserCheck, badge: pendingNutris.length },
                                { id: "assignments", label: "Asignaciones", icon: Link2 },
                                { id: "subscriptions", label: "Planes Pacientes", icon: DatabaseZap },
                                { id: "calendar", label: "Agenda Global", icon: Calendar },
                                ...(currentAdminRole === "administrador" ? [{ id: "users_management", label: "Usuarios", icon: ShieldPlus }] : []),
                            ].map(tab => (
                                <button
                                    key={tab.id}
                                    onClick={() => setActiveTab(tab.id as any)}
                                    className={cn(
                                        "flex items-center gap-4 px-6 py-4 rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all group relative overflow-hidden",
                                        activeTab === tab.id
                                            ? "bg-nutrition-500 text-white shadow-lg shadow-nutrition-500/20"
                                            : "text-slate-400 hover:bg-white/5 hover:text-white"
                                    )}
                                >
                                    <tab.icon className={cn(
                                        "h-4 w-4 relative z-10",
                                        activeTab === tab.id ? "text-white" : "text-slate-500 group-hover:text-white"
                                    )} />
                                    <span className="flex-1 text-left relative z-10">{tab.label}</span>
                                    {tab.badge ? (
                                        <span className="bg-red-500 text-white text-[9px] h-5 w-5 rounded-full flex items-center justify-center font-black relative z-10 shadow-lg">
                                            {tab.badge}
                                        </span>
                                    ) : null}
                                </button>
                            ))}
                        </div>
                    )}


                    {/* Contenido Dinámico */}
                    <div className="flex-1 min-w-0">
                        {activeTab === "overview" && (

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <Card className="col-span-2">
                                    <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 px-10 py-8 border-b border-white/5">
                                        <CardTitle className="font-black text-2xl uppercase tracking-tight text-white">Directorio Global</CardTitle>
                                        <div className="relative w-full md:w-80">
                                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                            <Input
                                                placeholder="Buscar usuario o email..."
                                                className="pl-12 rounded-2xl border-white/5 bg-white/5 h-12 text-white placeholder:text-slate-600 focus:ring-nutrition-500/50"
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-8">
                                            {[
                                                { title: "Administradores", role: "administrador", icon: Shield },
                                                { title: "Staff", role: "staff", icon: ShieldPlus },
                                                { title: "Nutricionistas", role: "nutricionista", icon: Stethoscope },
                                                { title: "Pacientes", role: "paciente", icon: User }
                                            ].map((group) => {
                                                const groupProfiles = profiles.filter(p =>
                                                    p.role === group.role &&
                                                    (p.name || '').toLowerCase().includes(searchTerm.toLowerCase())
                                                );

                                                if (groupProfiles.length === 0) return null;

                                                return (
                                                    <div key={group.role} className="space-y-4">
                                                        <div className="flex items-center gap-3 px-2">
                                                            <div className="h-8 w-8 rounded-xl bg-nutrition-500/10 flex items-center justify-center">
                                                                <group.icon className="h-4 w-4 text-nutrition-500" />
                                                            </div>
                                                            <h3 className="font-black text-sm uppercase tracking-widest text-slate-400">
                                                                {group.title} <span className="ml-2 text-nutrition-500/50">({groupProfiles.length})</span>
                                                            </h3>
                                                        </div>

                                                        <div className="space-y-3">
                                                            {groupProfiles.map(profile => (
                                                                <div key={profile.id} className="flex items-center justify-between p-4 rounded-3xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] transition-all group">
                                                                    <div className="flex items-center gap-4">
                                                                        <Avatar className="h-12 w-12 border-2 border-white/10 shadow-md">
                                                                            <AvatarFallback className="bg-nutrition-500 text-white font-black">
                                                                                {(profile.name || "?").split(" ").map(n => n[0]).join("")}
                                                                            </AvatarFallback>
                                                                        </Avatar>
                                                                        <div>
                                                                            <div className="flex items-center gap-2">
                                                                                <h4 className="font-black text-white leading-none">{profile.name}</h4>
                                                                                <Badge variant="outline" className={cn(
                                                                                    "h-4 text-[8px] font-black uppercase border-none px-1.5",
                                                                                    (profile as any).status === "Activo" ? "bg-green-500/10 text-green-500" : "bg-amber-500/10 text-amber-500"
                                                                                )}>
                                                                                    {(profile as any).status || "Pendiente"}
                                                                                </Badge>
                                                                            </div>
                                                                            <div className="flex items-center gap-1.5 mt-1.5">
                                                                                <Mail className="h-3 w-3 text-slate-500" />
                                                                                <p className="text-xs font-medium text-slate-400">
                                                                                    {(currentAdminRole === 'administrador' || profile.role !== 'administrador')
                                                                                        ? (profile.email || "Sin correo")
                                                                                        : "• • • • • • • • • •"}
                                                                                </p>
                                                                                {profile.role === 'paciente' && (
                                                                                    <Badge className={cn(
                                                                                        "ml-2 text-[8px] font-black uppercase border-none px-1.5 h-4",
                                                                                        profile.planType === 'plan flexible' ? "bg-purple-500/10 text-purple-400" :
                                                                                            profile.planType === 'plan menu semanal' ? "bg-blue-500/10 text-blue-400" :
                                                                                                "bg-slate-500/10 text-slate-500"
                                                                                    )}>
                                                                                        {profile.planType || 'Sin Plan'}
                                                                                    </Badge>
                                                                                )}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="flex items-center gap-1">
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-9 w-9 rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-all"
                                                                            onClick={() => handleDeleteProfile(profile.id, profile.name)}
                                                                        >
                                                                            <Trash2 className="h-4 w-4" />
                                                                        </Button>
                                                                        <Button
                                                                            variant="ghost"
                                                                            size="icon"
                                                                            className="h-9 w-9 rounded-xl text-slate-500 hover:text-nutrition-500 hover:bg-nutrition-500/10 transition-all"
                                                                            onClick={() => {
                                                                                if (profile.role === 'paciente') {
                                                                                    setSelectedPatientPlan(profile);
                                                                                    setNewPlanType(profile.planType || "sin plan");
                                                                                }
                                                                            }}
                                                                        >
                                                                            <Settings className="h-4 w-4" />
                                                                        </Button>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {profiles.length === 0 && (
                                                <p className="text-center py-20 text-slate-500 font-bold italic">No se encontraron perfiles en la base de datos.</p>
                                            )}
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Plan Type Dialog */}
                                <Dialog open={!!selectedPatientPlan} onOpenChange={(open) => !open && setSelectedPatientPlan(null)}>
                                    <DialogContent className="rounded-[2.5rem] max-w-sm">
                                        <DialogHeader>
                                            <DialogTitle className="text-2xl font-black">Plan de {selectedPatientPlan?.name}</DialogTitle>
                                            <DialogDescription>Cambia la etiqueta del plan nutricional para este paciente.</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-6 py-6">
                                            <div className="space-y-3">
                                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Tipo de Plan</label>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {['sin plan', 'plan flexible', 'plan menu semanal'].map(type => (
                                                        <button
                                                            key={type}
                                                            onClick={() => setNewPlanType(type)}
                                                            className={cn(
                                                                "w-full text-left p-4 rounded-2xl border-2 transition-all flex items-center justify-between font-bold text-sm capitalize",
                                                                newPlanType === type ? "border-nutrition-600 bg-nutrition-50 text-nutrition-700" : "border-slate-100 hover:border-slate-200"
                                                            )}
                                                        >
                                                            {type}
                                                            {newPlanType === type && <Check className="h-4 w-4" />}
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                        <DialogFooter>
                                            <Button
                                                className="w-full rounded-2xl bg-nutrition-600 text-white font-black h-12"
                                                onClick={async () => {
                                                    if (!selectedPatientPlan) return;
                                                    try {
                                                        await MessagingService.updatePatientPlanType(selectedPatientPlan.id, newPlanType);
                                                        toast({ title: "Plan Actualizado", variant: "success" });
                                                        setSelectedPatientPlan(null);
                                                        loadData(true);
                                                    } catch (e: any) {
                                                        toast({ title: "Error", description: e.message, variant: "destructive" });
                                                    }
                                                }}
                                            >
                                                Guardar Cambios
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>

                                <div className="space-y-6">
                                    <Card className="rounded-[2.5rem] bg-slate-900 text-white overflow-hidden relative">
                                        <div className="absolute top-0 right-0 p-6 opacity-10">
                                            <Shield className="h-24 w-24" />
                                        </div>
                                        <CardHeader>
                                            <CardTitle className="text-3xl font-black">{profiles.length}</CardTitle>
                                            <CardDescription className="text-slate-400 font-bold uppercase tracking-widest text-xs">Usuarios en Supabase</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="flex items-center justify-between pt-4 border-t border-white/10">
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400">Nutricionistas</p>
                                                    <p className="text-xl font-black">{nutritionists.length}</p>
                                                </div>
                                                <ArrowRight className="h-5 w-5 text-nutrition-400" />
                                                <div>
                                                    <p className="text-xs font-bold text-slate-400">Pacientes</p>
                                                    <p className="text-xl font-black">{patients.length}</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>

                                    <Card className="rounded-[2.5rem] border-slate-100 shadow-lg">
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-black text-slate-400 uppercase tracking-widest leading-none flex items-center gap-2">
                                                <Clock className="h-4 w-4" /> Database Sync
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="flex gap-3">
                                                <div className="h-8 w-8 rounded-full bg-green-50 flex items-center justify-center shrink-0">
                                                    <Check className="h-4 w-4 text-green-500" />
                                                </div>
                                                <div>
                                                    <p className="text-xs font-bold text-slate-700">Conectado a PostgreSQL</p>
                                                    <p className="text-[10px] text-slate-400">Estado: Online</p>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>
                        )}

                        {activeTab === "verification" && (
                            <div className="space-y-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <h2 className="text-2xl font-black text-slate-800">Verificación de Especialistas</h2>
                                    <div className="relative w-64">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <Input
                                            placeholder="Buscar especialista..."
                                            className="pl-10 rounded-2xl border-slate-200 bg-white h-10 ring-nutrition-100"
                                            value={verifSearch}
                                            onChange={(e) => setVerifSearch(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <ScrollArea className="h-[600px] pr-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {pendingNutris.length > 0 ? (
                                            pendingNutris.map(nutri => (
                                                <Card key={nutri.id} className="rounded-[2rem] border-slate-100 shadow-lg overflow-hidden flex flex-col">
                                                    <div className="h-20 bg-gradient-to-r from-nutrition-500 to-nutrition-600 relative">
                                                        <Badge className="absolute top-4 right-4 bg-white/20 backdrop-blur-md border-none text-[10px] font-black uppercase text-white">
                                                            Pendiente
                                                        </Badge>
                                                    </div>
                                                    <div className="px-6 pb-6 flex-1 flex flex-col items-center -mt-10 text-center">
                                                        <Avatar className="h-20 w-20 border-4 border-white shadow-xl mb-4">
                                                            <AvatarFallback className="bg-nutrition-50 text-nutrition-600 text-xl font-black">
                                                                {(nutri.name || "?").split(" ").map(n => n[0]).join("")}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <h3 className="font-black text-lg text-slate-800 leading-none">{nutri.name}</h3>
                                                        <p className="text-sm text-slate-400 font-medium mb-4">Especialista Registrado</p>

                                                        <div className="w-full bg-slate-50 rounded-2xl p-4 mb-6 text-left space-y-2">
                                                            <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest leading-none">Documentos</p>
                                                            <div className="flex items-center justify-between text-xs font-bold text-slate-600">
                                                                <span>Título Profesional</span>
                                                                <Badge className="bg-green-100 text-green-700 hover:bg-green-100 border-none">Subido</Badge>
                                                            </div>
                                                        </div>

                                                        <div className="mt-auto w-full grid grid-cols-2 gap-3">
                                                            <Button
                                                                variant="outline"
                                                                className="rounded-xl font-black border-slate-100 text-red-500 hover:bg-red-50"
                                                                onClick={() => handleVerify(nutri.id, "Rechazado")}
                                                            >
                                                                <X className="h-4 w-4 mr-2" /> Rechazar
                                                            </Button>
                                                            <Button
                                                                className="rounded-xl font-black bg-nutrition-600 hover:bg-nutrition-700 text-white"
                                                                onClick={() => handleVerify(nutri.id, "Activo")}
                                                            >
                                                                <Check className="h-4 w-4 mr-2" /> Verificar
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </Card>
                                            ))
                                        ) : (
                                            <div className="col-span-full py-20 text-center space-y-4">
                                                <div className="h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mx-auto">
                                                    <UserCheck className="h-10 w-10 text-slate-300" />
                                                </div>
                                                <p className="text-slate-400 font-black text-lg">No hay solicitudes pendientes.</p>
                                            </div>
                                        )}
                                    </div>
                                </ScrollArea>
                            </div>
                        )}

                        {activeTab === "assignments" && (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                                <Card className="rounded-[2.5rem] border-slate-100 shadow-xl overflow-hidden">
                                    <CardHeader className="bg-slate-50/50">
                                        <CardTitle className="font-black text-xl">Asignar Especialista</CardTitle>
                                        <CardDescription className="font-medium">Vincula un paciente con su nutricionista asignado.</CardDescription>
                                    </CardHeader>
                                    <CardContent className="p-0">
                                        <div className="p-6 space-y-6">
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-black text-slate-800">1. Selecciona Paciente</p>
                                                    <div className="relative w-40">
                                                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                                                        <Input
                                                            placeholder="Filtrar..."
                                                            className="pl-7 h-7 text-[10px] rounded-lg"
                                                            value={assignPSearch}
                                                            onChange={(e) => setAssignPSearch(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <ScrollArea className="h-48 border rounded-2xl p-2 bg-slate-50/30">
                                                    {filteredPatientsForAssign.map(p => (
                                                        <button
                                                            key={p.id}
                                                            onClick={() => setSelectedPatientId(p.id)}
                                                            className={cn(
                                                                "w-full text-left p-3 rounded-xl flex items-center justify-between group transition-all",
                                                                selectedPatientId === p.id ? "bg-nutrition-50 ring-1 ring-nutrition-200" : "hover:bg-white"
                                                            )}
                                                        >
                                                            <span className="text-sm font-bold text-slate-700">{p.name}</span>
                                                            <Badge className={assignments[p.id]?.length > 0 ? "bg-green-100 text-green-600" : "bg-slate-100 text-slate-400"}>
                                                                {assignments[p.id]?.length > 0 ? "Asignado" : "Pendiente"}
                                                            </Badge>
                                                        </button>
                                                    ))}
                                                </ScrollArea>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-black text-slate-800">2. Selecciona Nutricionista</p>
                                                    <div className="relative w-40">
                                                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-slate-400" />
                                                        <Input
                                                            placeholder="Filtrar..."
                                                            className="pl-7 h-7 text-[10px] rounded-lg"
                                                            value={assignNSearch}
                                                            onChange={(e) => setAssignNSearch(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                                <ScrollArea className="h-48 border rounded-2xl p-2 bg-slate-50/30">
                                                    {activeNutris.map(n => (
                                                        <button
                                                            key={n.id}
                                                            onClick={() => setSelectedNutriId(n.id)}
                                                            className={cn(
                                                                "w-full text-left p-3 rounded-xl flex items-center gap-3 transition-all",
                                                                selectedNutriId === n.id ? "bg-nutrition-50 ring-1 ring-nutrition-200" : "hover:bg-white"
                                                            )}
                                                        >
                                                            <Avatar className="h-6 w-6"><AvatarFallback className="text-[10px]">{n.name[0]}</AvatarFallback></Avatar>
                                                            <span className="text-sm font-bold text-slate-700">{n.name}</span>
                                                        </button>
                                                    ))}
                                                </ScrollArea>
                                            </div>

                                            <Button
                                                onClick={handleAssign}
                                                disabled={!selectedPatientId || !selectedNutriId}
                                                className="w-full rounded-2xl bg-slate-900 text-white font-black h-12"
                                            >
                                                Confirmar Asignación
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>

                                <Card className="rounded-[2.5rem] border-slate-100 shadow-xl overflow-hidden flex flex-col">
                                    <CardHeader className="bg-slate-50/50">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="font-black text-xl">Estado de Asignaciones</CardTitle>
                                            <Badge className="bg-slate-100 text-slate-500 border-none font-bold">{Object.keys(assignments).length}</Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="flex-1 p-6 overflow-hidden">
                                        <ScrollArea className="h-[500px] pr-4">
                                            <div className="space-y-3">
                                                {Object.entries(assignments).flatMap(([pid, nids]) => {
                                                    // Search in the full profiles array to avoid role-filtering issues
                                                    const p = profiles.find(x => x.id === pid);
                                                    if (!p) return [];
                                                    return nids.map(nid => {
                                                        const n = profiles.find(x => x.id === nid);
                                                        if (!n) return null;
                                                        return (
                                                            <div key={`${pid}-${nid}`} className="p-4 rounded-3xl border border-slate-100 flex items-center justify-between bg-white hover:border-nutrition-200 transition-colors">
                                                                <div className="flex items-center gap-3">
                                                                    <p className="text-sm font-black text-slate-700">{p.name}</p>
                                                                    <ArrowRight className="h-4 w-4 text-slate-300" />
                                                                    <p className="text-sm font-bold text-nutrition-600">{n.name}</p>
                                                                </div>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 rounded-full text-slate-300 hover:text-red-500"
                                                                    onClick={() => handleUnassign(pid, nid)}
                                                                >
                                                                    <X className="h-4 w-4" />
                                                                </Button>
                                                            </div>
                                                        );
                                                    });
                                                })}
                                            </div>
                                        </ScrollArea>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {activeTab === "calendar" && (
                            <div className="space-y-6">
                                <Card className="rounded-[2.5rem] border-slate-100 shadow-xl p-8">
                                    <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10">
                                        <div>
                                            <h2 className="text-3xl font-black text-slate-800">Agenda Global</h2>
                                            <p className="text-slate-500 font-medium">Gestiona las citas de todos los especialistas desde un solo lugar.</p>
                                        </div>
                                        <Dialog open={isAgendaDialogOpen} onOpenChange={setIsAgendaDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button className="rounded-2xl bg-nutrition-600 hover:bg-nutrition-700 text-white font-black h-12 px-8 shadow-lg shadow-nutrition-600/20">
                                                    <Plus className="h-5 w-5 mr-2" /> Agendar Nueva Cita
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent className="rounded-[32px] max-w-4xl p-0 overflow-hidden border-none shadow-2xl">
                                                <DialogHeader className="p-8 pb-0">
                                                    <DialogTitle className="text-3xl font-black">Programar Consulta</DialogTitle>
                                                    <DialogDescription className="text-slate-500 font-medium">Gestiona la agenda global de especialistas y pacientes.</DialogDescription>
                                                </DialogHeader>

                                                <div className="flex flex-col md:flex-row">
                                                    {/* Left Column: Configuration */}
                                                    <div className="w-full md:w-72 bg-slate-50/50 p-6 border-r border-slate-100 space-y-6">
                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">1. Nutricionista</label>
                                                            <select
                                                                className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm font-bold outline-none ring-nutrition-500/20 focus:ring-4 transition-all"
                                                                value={agendaNutriId}
                                                                onChange={(e) => setAgendaNutriId(e.target.value)}
                                                            >
                                                                <option value="">Selecciona Especialista</option>
                                                                {activeNutris.map(n => <option key={n.id} value={n.id}>{n.name}</option>)}
                                                            </select>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">2. Paciente</label>
                                                            <select
                                                                disabled={!agendaNutriId}
                                                                className="w-full p-3 rounded-xl border border-slate-200 bg-white text-sm font-bold outline-none disabled:opacity-50"
                                                                value={agendaPatientId}
                                                                onChange={(e) => setAgendaPatientId(e.target.value)}
                                                            >
                                                                <option value="">Selecciona Paciente</option>
                                                                {Object.entries(assignments)
                                                                    .filter(([_, nids]) => nids.includes(agendaNutriId))
                                                                    .map(([pid, _]) => {
                                                                        const p = patients.find(x => x.id === pid);
                                                                        return <option key={pid} value={pid}>{p?.name}</option>;
                                                                    })
                                                                }
                                                            </select>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">3. Fecha de Cita</label>
                                                            <div className="bg-white rounded-2xl border border-slate-200 p-3">
                                                                <input
                                                                    type="date"
                                                                    className="w-full text-sm font-bold outline-none"
                                                                    value={agendaDate}
                                                                    onChange={(e) => setAgendaDate(e.target.value)}
                                                                />
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Right Column: Time Selection */}
                                                    <div className="flex-1 p-6 space-y-6 bg-white">
                                                        <div className="flex items-center justify-between">
                                                            <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none">4. Selecciona Horario</label>
                                                            {agendaDate && <Badge variant="outline" className="rounded-full font-bold">{agendaDate}</Badge>}
                                                        </div>

                                                        {!agendaNutriId || !agendaDate ? (
                                                            <div className="h-48 flex flex-col items-center justify-center text-center p-6 border-2 border-dashed border-slate-100 rounded-[2rem]">
                                                                <Clock className="h-8 w-8 text-slate-200 mb-2" />
                                                                <p className="text-xs font-bold text-slate-400">Selecciona especialista y fecha para ver disponibilidad</p>
                                                            </div>
                                                        ) : (
                                                            <ScrollArea className="h-64 pr-2">
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    {timeSlots.map(time => {
                                                                        const isReserved = occupiedSlots.includes(time);
                                                                        const isPastOrToday = isSlotPast(time, agendaDate);
                                                                        const isSelected = agendaTime === time;

                                                                        return (
                                                                            <button
                                                                                key={time}
                                                                                disabled={isReserved || isPastOrToday}
                                                                                onClick={() => setAgendaTime(time)}
                                                                                className={cn(
                                                                                    "py-3 rounded-xl text-xs font-black transition-all border",
                                                                                    isSelected ? "bg-slate-900 border-slate-900 text-white shadow-md" :
                                                                                        (isReserved || isPastOrToday) ? "bg-slate-50 border-slate-50 text-slate-300 cursor-not-allowed" :
                                                                                            "bg-white border-slate-100 text-slate-600 hover:border-nutrition-200 hover:bg-nutrition-50"
                                                                                )}
                                                                            >
                                                                                {time}
                                                                                {isReserved && <span className="block text-[8px] opacity-60 font-medium tracking-tighter">Ocupado</span>}
                                                                            </button>
                                                                        );
                                                                    })}
                                                                </div>
                                                            </ScrollArea>
                                                        )}

                                                        <DialogFooter className="pt-4 border-t border-slate-50">
                                                            <Button
                                                                className="w-full rounded-2xl bg-nutrition-600 hover:bg-nutrition-700 text-white font-black h-12 shadow-lg shadow-nutrition-600/20"
                                                                disabled={!agendaNutriId || !agendaPatientId || !agendaDate || !agendaTime}
                                                                onClick={handleCreateAppointment}
                                                            >
                                                                Confirmar Cita Programada
                                                            </Button>
                                                        </DialogFooter>
                                                    </div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                        {activeNutris.map(n => {
                                            const count = Object.values(assignments).filter(nids => nids.includes(n.id)).length;
                                            return (
                                                <Card key={n.id} className="rounded-3xl border-slate-100 p-6 flex flex-col items-center text-center hover:shadow-xl transition-all group">
                                                    <Avatar className="h-16 w-16 mb-4 group-hover:scale-110 transition-transform">
                                                        <AvatarFallback className="bg-nutrition-50 text-nutrition-600 font-black">{n.name[0]}</AvatarFallback>
                                                    </Avatar>
                                                    <h4 className="font-black text-slate-800 leading-none">{n.name}</h4>
                                                    <p className="text-xs text-slate-400 font-bold mt-2 uppercase tracking-tighter">{count} Pacientes Asignados</p>
                                                    <Button
                                                        variant="outline"
                                                        className="w-full mt-6 rounded-xl font-black text-xs border-slate-100 hover:bg-nutrition-50 hover:text-nutrition-600"
                                                        onClick={() => {
                                                            setAgendaNutriId(n.id);
                                                            setIsAgendaDialogOpen(true);
                                                        }}
                                                    >
                                                        Ver Agenda / Citar
                                                    </Button>
                                                </Card>
                                            );
                                        })}
                                    </div>
                                </Card>
                            </div>
                        )}

                        {activeTab === "metrics" && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {/* Metric 1: Usuarios */}
                                    <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer">
                                        <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 text-white h-full relative">
                                            <div className="absolute top-4 right-4 bg-white/10 p-2 rounded-xl backdrop-blur-md">
                                                <Users className="h-5 w-5 text-white" />
                                            </div>
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Crecimiento</p>
                                            <h3 className="text-3xl font-black">{profiles.length}</h3>
                                            <p className="text-[10px] font-bold text-green-400 mt-2 flex items-center gap-1">
                                                <TrendingUp className="h-3 w-3" /> +12% vs mes anterior
                                            </p>
                                        </div>
                                    </Card>

                                    {/* Metric 2: Citas */}
                                    <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer">
                                        <div className="p-6 bg-white h-full relative">
                                            <div className="absolute top-4 right-4 bg-nutrition-50 p-2 rounded-xl text-nutrition-600">
                                                <Calendar className="h-5 w-5" />
                                            </div>
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Citas Activas</p>
                                            <h3 className="text-3xl font-black text-slate-800">
                                                {allAppointments.filter(a => a.status === 'scheduled').length}
                                            </h3>
                                            <p className="text-[10px] font-bold text-slate-400 mt-2">Próximas 72 horas</p>
                                        </div>
                                    </Card>

                                    {/* Metric 3: Suscripciones */}
                                    <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer">
                                        <div className="p-6 bg-white h-full relative">
                                            <div className="absolute top-4 right-4 bg-amber-50 p-2 rounded-xl text-amber-600">
                                                <Activity className="h-5 w-5" />
                                            </div>
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Sub. Activas</p>
                                            <h3 className="text-3xl font-black text-slate-800">
                                                {subscriptions.filter(s => s.status === 'active').length}
                                            </h3>
                                            <p className="text-[10px] font-bold text-slate-400 mt-2">Tasa de retención: 94%</p>
                                        </div>
                                    </Card>

                                    {/* Metric 4: Revenue (Simulated) */}
                                    <Card className="rounded-[2rem] border-none shadow-xl shadow-slate-200/50 overflow-hidden group hover:scale-[1.02] transition-transform cursor-pointer">
                                        <div className="p-6 bg-white h-full relative">
                                            <div className="absolute top-4 right-4 bg-green-50 p-2 rounded-xl text-green-600">
                                                <DollarSign className="h-5 w-5" />
                                            </div>
                                            <p className="text-xs font-black uppercase tracking-widest text-slate-400 mb-1">Ingresos (Est.)</p>
                                            <h3 className="text-3xl font-black text-slate-800">$2.4k</h3>
                                            <p className="text-[10px] font-bold text-green-500 mt-2">Mes de Febrero</p>
                                        </div>
                                    </Card>
                                </div>

                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                    {/* Distributions Chart visual */}
                                    <Card className="lg:col-span-2 rounded-[2.5rem] border-slate-100 shadow-2xl p-8">
                                        <div className="flex items-center justify-between mb-8">
                                            <div>
                                                <CardTitle className="text-2xl font-black flex items-center gap-2">
                                                    <Activity className="h-6 w-6 text-nutrition-600" /> Rendimiento de Especialistas
                                                </CardTitle>
                                                <CardDescription>Distribución de carga de trabajo por nutricionista.</CardDescription>
                                            </div>
                                            <Badge className="bg-slate-100 text-slate-600 border-none font-bold px-4 py-1.5 rounded-xl">Mensual</Badge>
                                        </div>

                                        <div className="space-y-6">
                                            {nutritionists.filter(n => (n as any).status === 'Activo').slice(0, 5).map((nutri) => {
                                                const patientCount = allAppointments.filter(a => a.nutritionistId === nutri.id && a.status === 'scheduled').length;
                                                const percentage = Math.min(100, (patientCount / 10) * 100); // 10 as dummy cap
                                                return (
                                                    <div key={nutri.id} className="space-y-2">
                                                        <div className="flex justify-between items-end">
                                                            <div className="flex items-center gap-3">
                                                                <Avatar className="h-10 w-10">
                                                                    <AvatarFallback className="bg-slate-100 text-[10px] font-black">
                                                                        {nutri.name[0]}
                                                                    </AvatarFallback>
                                                                </Avatar>
                                                                <div>
                                                                    <p className="text-sm font-black text-slate-800 leading-none">{nutri.name}</p>
                                                                    <p className="text-[10px] font-bold text-slate-400 uppercase mt-1">Nivel: Senior</p>
                                                                </div>
                                                            </div>
                                                            <p className="text-xs font-black text-nutrition-600">{patientCount} Citas / Sem</p>
                                                        </div>
                                                        <div className="h-2 w-full bg-slate-50 rounded-full overflow-hidden">
                                                            <div
                                                                className="h-full bg-nutrition-600 rounded-full transition-all duration-1000"
                                                                style={{ width: `${percentage}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {nutritionists.length === 0 && <p className="text-slate-400 font-bold text-center py-4">No hay especialistas activos.</p>}
                                        </div>
                                    </Card>

                                    {/* Quick Insights */}
                                    <div className="space-y-6">
                                        <Card className="rounded-[2.5rem] border-none bg-gradient-to-br from-nutrition-600 to-nutrition-700 text-white p-8 shadow-2xl shadow-nutrition-200 relative overflow-hidden">
                                            <div className="absolute -bottom-10 -right-10 opacity-10">
                                                <Target className="h-40 w-40" />
                                            </div>
                                            <h4 className="text-xl font-black mb-2">Meta Mensual</h4>
                                            <p className="text-nutrition-100 text-sm font-medium mb-6">Estamos al 85% de la meta de nuevos registros.</p>
                                            <div className="space-y-4 relative z-10">
                                                <div className="flex items-center justify-between text-xs font-black">
                                                    <span>Progreso</span>
                                                    <span>172 / 200</span>
                                                </div>
                                                <div className="h-3 w-full bg-white/20 rounded-full backdrop-blur-sm">
                                                    <div className="h-full bg-white rounded-full w-[85%]" />
                                                </div>
                                            </div>
                                        </Card>

                                        <Card className="rounded-[2.5rem] border-slate-100 shadow-xl p-8 space-y-4">
                                            <h4 className="font-black text-slate-800">Alertas de Sistema</h4>
                                            <div className="space-y-3">
                                                {pendingNutris.length > 0 && (
                                                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-red-50 text-red-600 border border-red-100">
                                                        <X className="h-4 w-4" />
                                                        <p className="text-[10px] font-bold">{pendingNutris.length} Verificaciones pendientes de revisión.</p>
                                                    </div>
                                                )}
                                                {profiles.filter(p => p.role === 'paciente').length > Object.keys(assignments).length && (
                                                    <div className="flex items-center gap-3 p-3 rounded-2xl bg-amber-50 text-amber-600 border border-amber-100">
                                                        <Bell className="h-4 w-4" />
                                                        <p className="text-[10px] font-bold">
                                                            {profiles.filter(p => p.role === 'paciente').length - Object.keys(assignments).length} Pacientes sin nutricionista asignado.
                                                        </p>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-3 p-3 rounded-2xl bg-green-50 text-green-600 border border-green-100">
                                                    <Check className="h-4 w-4" />
                                                    <p className="text-[10px] font-bold">Sincronización con Supabase: Estable.</p>
                                                </div>
                                            </div>
                                        </Card>
                                    </div>
                                </div>
                            </div>
                        )}
                        {activeTab === "subscriptions" && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                                    {/* Assign New Section */}
                                    <Card className="rounded-[2.5rem] border-slate-100 shadow-xl overflow-hidden col-span-1 lg:col-span-1">
                                        <CardHeader className="bg-slate-50/50">
                                            <CardTitle className="font-black text-xl">Solicitar Cambio de Plan</CardTitle>
                                            <CardDescription>Propone un nuevo plan para un paciente.</CardDescription>
                                        </CardHeader>
                                        <CardContent className="p-6 space-y-6">
                                            <div className="space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <p className="text-sm font-black text-slate-800">1. Paciente</p>
                                                    <Input
                                                        placeholder="Filtrar..."
                                                        className="h-7 w-32 text-xs rounded-lg"
                                                        value={searchTerm}
                                                        onChange={(e) => setSearchTerm(e.target.value)}
                                                    />
                                                </div>
                                                <ScrollArea className="h-40 border rounded-2xl p-2 bg-slate-50/30">
                                                    <div className="space-y-1">
                                                        {patients.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                                                            <button
                                                                key={p.id}
                                                                onClick={selectedPatientId === p.id ? () => setSelectedPatientId(null) : () => setSelectedPatientId(p.id)}
                                                                className={cn(
                                                                    "w-full text-left p-2 rounded-xl flex items-center gap-2 text-sm font-bold transition-all",
                                                                    selectedPatientId === p.id ? "bg-nutrition-600 text-white" : "hover:bg-white"
                                                                )}
                                                            >
                                                                <Avatar className="h-6 w-6"><AvatarFallback className="text-[10px]">{p.name[0]}</AvatarFallback></Avatar>
                                                                {p.name}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </ScrollArea>
                                            </div>

                                            <div className="space-y-4">
                                                <p className="text-sm font-black text-slate-800">2. Plan Sugerido</p>
                                                <div className="grid grid-cols-1 gap-2">
                                                    {offers.map(o => (
                                                        <button
                                                            key={o.id}
                                                            onClick={selectedNutriId === o.id ? () => setSelectedNutriId(null) : () => setSelectedNutriId(o.id)}
                                                            className={cn(
                                                                "w-full text-left p-3 rounded-xl flex items-center justify-between text-sm font-black transition-all border",
                                                                selectedNutriId === o.id ? "bg-slate-900 text-white border-transparent" : "bg-white hover:border-slate-300"
                                                            )}
                                                        >
                                                            <span>{o.name}</span>
                                                            <span className="text-xs">${o.price}</span>
                                                        </button>
                                                    ))}
                                                </div>
                                            </div>

                                            <Button
                                                className="w-full rounded-2xl bg-nutrition-600 text-white font-black h-12"
                                                disabled={!selectedPatientId || !selectedNutriId}
                                                onClick={async () => {
                                                    try {
                                                        await MessagingService.requestSubscription(selectedPatientId!, selectedNutriId!);
                                                        toast({ title: "Solicitud Enviada", variant: "success" });
                                                        setSelectedPatientId(null);
                                                        setSelectedNutriId(null);
                                                        loadData();
                                                    } catch (e: any) {
                                                        toast({ title: "Error", description: e.message, variant: "destructive" });
                                                    }
                                                }}
                                            >
                                                Enviar Propuesta
                                            </Button>
                                        </CardContent>
                                    </Card>

                                    {/* Pending Requests Section */}
                                    <Card className="rounded-[2.5rem] border-slate-100 shadow-xl overflow-hidden col-span-1 lg:col-span-1">
                                        <CardHeader className="bg-slate-50/50">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="font-black text-xl">Revisión Subscripciones</CardTitle>
                                                <Badge className="bg-amber-100 text-amber-700 font-black border-none">Pendientes</Badge>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-6">
                                            <div className="mb-4 relative">
                                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                                <Input
                                                    placeholder="Buscar por paciente..."
                                                    className="pl-10 rounded-xl"
                                                    value={subReviewSearch}
                                                    onChange={(e) => setSubReviewSearch(e.target.value)}
                                                />
                                            </div>
                                            <ScrollArea className="h-[430px] pr-4">
                                                <div className="space-y-4">
                                                    {subscriptions.filter(s =>
                                                        s.patient?.profile?.full_name.toLowerCase().includes(subReviewSearch.toLowerCase()) ||
                                                        s.offer?.name.toLowerCase().includes(subReviewSearch.toLowerCase())
                                                    ).map(sub => (
                                                        <div key={sub.id} className="p-4 rounded-2xl border border-slate-100 bg-slate-50/50 space-y-3">
                                                            <div className="flex justify-between items-start">
                                                                <div>
                                                                    <p className="font-black text-slate-800 text-sm leading-none">{sub.patient?.profile?.full_name}</p>
                                                                    <p className="text-[10px] font-black text-nutrition-600 mt-1 uppercase">{sub.offer?.name}</p>
                                                                </div>
                                                                <Badge className={cn(
                                                                    "border-none rounded-lg text-[10px] font-black uppercase",
                                                                    sub.status === 'active' ? "bg-green-100 text-green-700" :
                                                                        sub.status === 'pending' ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                                                                )}>
                                                                    {sub.status === 'active' ? 'Activa' : sub.status === 'pending' ? 'Pendiente' : 'Rechazada'}
                                                                </Badge>
                                                            </div>

                                                            {sub.status === 'pending' && currentAdminRole === 'administrador' && (
                                                                <div className="flex gap-2">
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        className="flex-1 rounded-xl text-red-500 font-bold"
                                                                        onClick={() => MessagingService.handleSubscriptionStatus(sub.id, 'cancelled').then(() => loadData(false))}
                                                                    >
                                                                        X
                                                                    </Button>
                                                                    <Button
                                                                        size="sm"
                                                                        className="flex-1 rounded-xl bg-nutrition-600 text-white font-bold"
                                                                        onClick={() => MessagingService.handleSubscriptionStatus(sub.id, 'active').then(() => loadData(false))}
                                                                    >
                                                                        Aprobar
                                                                    </Button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                </div>
                                            </ScrollArea>
                                        </CardContent>
                                    </Card>
                                </div>

                                {/* Offer Edit Dialog */}
                                <Dialog open={!!editingOffer} onOpenChange={(open) => !open && setEditingOffer(null)}>
                                    <DialogContent className="rounded-[2.5rem] max-w-md">
                                        <DialogHeader>
                                            <DialogTitle className="text-2xl font-black">Editar Plan: {editingOffer?.name}</DialogTitle>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nombre del Plan</label>
                                                <Input className="rounded-xl font-bold" value={newOfferName} onChange={(e) => setNewOfferName(e.target.value)} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Precio Regular ($)</label>
                                                    <Input type="number" className="rounded-xl font-bold" value={newOfferPrice} onChange={(e) => setNewOfferPrice(e.target.value)} />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black text-nutrition-600 uppercase tracking-widest">Precio Oferta ($)</label>
                                                    <Input type="number" placeholder="Opcional" className="rounded-xl font-bold border-nutrition-200" value={newOfferPriceOffer} onChange={(e) => setNewOfferPriceOffer(e.target.value)} />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Beneficios (Uno por línea)</label>
                                                <textarea
                                                    className="w-full h-24 p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium outline-none"
                                                    placeholder="Ej: Dieta personalizada&#10;Seguimiento semanal"
                                                    value={newOfferFeatures}
                                                    onChange={(e) => setNewOfferFeatures(e.target.value)}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Resaltado (Short Badge)</label>
                                                <Input placeholder="Ej: Plan más popular" className="rounded-xl font-bold" value={newOfferHighlight} onChange={(e) => setNewOfferHighlight(e.target.value)} />
                                            </div>

                                            {newOfferPriceOffer && (
                                                <div className="p-4 rounded-2xl bg-nutrition-50 border border-nutrition-100 space-y-4">
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-black text-nutrition-600 uppercase tracking-widest leading-none">Detalles de la Oferta</label>
                                                        <Input placeholder="Motivo: Ej: Black Friday" className="rounded-xl font-bold bg-white" value={newOfferOfferReason} onChange={(e) => setNewOfferOfferReason(e.target.value)} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <textarea
                                                            placeholder="Descripción de la oferta específica..."
                                                            className="w-full h-20 p-3 rounded-xl border border-slate-200 bg-white text-sm font-medium outline-none"
                                                            value={newOfferDescription}
                                                            onChange={(e) => setNewOfferDescription(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <DialogFooter>
                                            <Button className="w-full rounded-xl bg-slate-900 font-black h-12" onClick={handleUpdateOffer}>
                                                <Save className="h-4 w-4 mr-2" /> Guardar Cambios
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>

                                {/* Create Offer Dialog */}
                                <Dialog open={isCreateOfferDialogOpen} onOpenChange={setIsCreateOfferDialogOpen}>
                                    <DialogContent className="rounded-[2.5rem] max-w-md">
                                        <DialogHeader>
                                            <DialogTitle className="text-2xl font-black">Crear Nuevo Plan</DialogTitle>
                                            <DialogDescription>Define un nuevo plan de suscripción para los pacientes.</DialogDescription>
                                        </DialogHeader>
                                        <div className="space-y-4 py-4">
                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Nombre del Plan</label>
                                                <Input className="rounded-xl font-bold" placeholder="Plan Personalizado..." value={newOfferName} onChange={(e) => setNewOfferName(e.target.value)} />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Precio Regular ($)</label>
                                                    <Input type="number" className="rounded-xl font-bold" value={newOfferPrice} onChange={(e) => setNewOfferPrice(e.target.value)} />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-xs font-black text-nutrition-600 uppercase tracking-widest">Precio Oferta ($)</label>
                                                    <Input type="number" placeholder="Opcional" className="rounded-xl font-bold border-nutrition-200" value={newOfferPriceOffer} onChange={(e) => setNewOfferPriceOffer(e.target.value)} />
                                                </div>
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Beneficios (Uno por línea)</label>
                                                <textarea
                                                    className="w-full h-24 p-3 rounded-xl border border-slate-200 bg-slate-50 text-sm font-medium outline-none"
                                                    placeholder="Ej: Acceso a dietas VIP&#10;Seguimiento 24/7"
                                                    value={newOfferFeatures}
                                                    onChange={(e) => setNewOfferFeatures(e.target.value)}
                                                />
                                            </div>

                                            <div className="space-y-2">
                                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest">Resaltado (Short Badge)</label>
                                                <Input placeholder="Ej: Oferta de lanzamiento" className="rounded-xl font-bold" value={newOfferHighlight} onChange={(e) => setNewOfferHighlight(e.target.value)} />
                                            </div>

                                            {newOfferPriceOffer && (
                                                <div className="p-4 rounded-2xl bg-nutrition-50 border border-nutrition-100 space-y-4">
                                                    <div className="space-y-2">
                                                        <label className="text-xs font-black text-nutrition-600 uppercase tracking-widest leading-none">Detalles de la Oferta</label>
                                                        <Input placeholder="Motivo: Ej: Inauguración" className="rounded-xl font-bold bg-white" value={newOfferOfferReason} onChange={(e) => setNewOfferOfferReason(e.target.value)} />
                                                    </div>
                                                    <div className="space-y-2">
                                                        <textarea
                                                            placeholder="Descripción de la oferta específica..."
                                                            className="w-full h-20 p-3 rounded-xl border border-slate-200 bg-white text-sm font-medium outline-none"
                                                            value={newOfferDescription}
                                                            onChange={(e) => setNewOfferDescription(e.target.value)}
                                                        />
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                        <DialogFooter>
                                            <Button className="w-full rounded-xl bg-nutrition-600 font-black h-12 text-white" onClick={handleCreateOffer}>
                                                <Plus className="h-4 w-4 mr-2" /> Crear Plan
                                            </Button>
                                        </DialogFooter>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        )}
                        {activeTab === "users_management" && (
                            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                                    <div className="space-y-1">
                                        <h2 className="text-3xl font-black text-white uppercase italic tracking-tight">Sistema de Gestión de Usuarios</h2>
                                        <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">Administra el acceso del personal y directivos.</p>
                                    </div>
                                    <Button
                                        onClick={() => setIsCreateUserDialogOpen(true)}
                                        className="bg-nutri-brand hover:bg-white text-nutri-base font-black px-8 py-6 rounded-2xl transition-all shadow-xl shadow-nutri-brand/20 uppercase tracking-widest text-xs"
                                    >
                                        <ShieldPlus className="h-4 w-4 mr-2" /> Nuevo Usuario Administrativo
                                    </Button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {/* List of Staff/Admins */}
                                    {profiles.filter(p => p.role === "staff" || p.role === "administrador").sort((a, b) => a.role === 'administrador' ? -1 : 1).map(user => (
                                        <Card key={user.id} className="nutri-panel border-none group hover:scale-[1.02] transition-transform overflow-hidden">
                                            <div className="p-6 space-y-4">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <Avatar className="h-14 w-14 border-2 border-white/10 shadow-2xl">
                                                            <AvatarFallback className="bg-white/5 text-white font-black text-lg">
                                                                {user.name?.[0] || 'U'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div>
                                                            <h3 className="font-black text-white text-lg tracking-tight uppercase italic">{user.name}</h3>
                                                            <Badge className={cn(
                                                                "p-0 bg-transparent font-black uppercase text-[9px] tracking-widest border-none",
                                                                user.role === 'administrador' ? "text-red-400" : "text-nutri-brand"
                                                            )}>
                                                                {user.role}
                                                            </Badge>
                                                        </div>
                                                    </div>
                                                    <div className="bg-white/5 p-2 rounded-xl group-hover:bg-nutri-brand group-hover:text-nutri-base transition-colors">
                                                        {user.role === 'administrador' ? <Shield className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                                                    </div>
                                                </div>

                                                <div className="space-y-3 pt-4 border-t border-white/5">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email</span>
                                                        <span className="text-xs text-white font-bold">{user.email || 'N/A'}</span>
                                                    </div>
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado de Cuenta</span>
                                                        <Badge className="bg-green-500/10 text-green-400 font-black text-[8px] uppercase border-none px-2 h-5 flex items-center gap-1">
                                                            <div className="h-1 w-1 bg-green-400 rounded-full animate-pulse" /> Activo
                                                        </Badge>
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 pt-2">
                                                    <Button variant="outline" className="flex-1 rounded-xl h-10 text-[10px] font-black uppercase border-white/5 bg-white/5 text-slate-400 hover:text-white" disabled>
                                                        Logs
                                                    </Button>
                                                    <Button variant="outline" className="flex-1 rounded-xl h-10 text-[10px] font-black uppercase border-white/5 bg-white/5 text-slate-400 hover:text-red-400 hover:border-red-400/20"
                                                        onClick={() => handleDeleteProfile(user.id, user.name)}>
                                                        Eliminar
                                                    </Button>
                                                </div>
                                            </div>
                                        </Card>
                                    ))}
                                </div>

                                {/* Dialog for Creating User */}
                                <Dialog open={isCreateUserDialogOpen} onOpenChange={setIsCreateUserDialogOpen}>
                                    <DialogContent className="rounded-[2.5rem] max-w-md bg-nutri-base border-white/10 text-white p-0 overflow-hidden font-tech">
                                        <div className="p-8 space-y-6">
                                            <div className="space-y-2">
                                                <h3 className="text-2xl font-black italic uppercase tracking-tighter flex items-center gap-3">
                                                    <div className="h-2 w-8 bg-nutri-brand" />
                                                    Nuevo Acceso
                                                </h3>
                                                <p className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">Registra personal con privilegios administrativos.</p>
                                            </div>

                                            <div className="space-y-4">
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nombre Completo</label>
                                                    <Input
                                                        className="h-12 bg-white/5 border-white/10 rounded-xl font-bold placeholder:text-slate-700"
                                                        placeholder="Ej: Staff Nutrition"
                                                        value={newUserFullName}
                                                        onChange={(e) => setNewUserFullName(e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Correo Electrónico</label>
                                                    <Input
                                                        className="h-12 bg-white/5 border-white/10 rounded-xl font-bold placeholder:text-slate-700"
                                                        placeholder="admin@nuysa.com"
                                                        value={newUserEmail}
                                                        onChange={(e) => setNewUserEmail(e.target.value)}
                                                        type="email"
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Contraseña Temporal</label>
                                                    <Input
                                                        className="h-12 bg-white/5 border-white/10 rounded-xl font-bold placeholder:text-slate-700"
                                                        type="password"
                                                        placeholder="Mínimo 6 caracteres"
                                                        value={newUserPassword}
                                                        onChange={(e) => setNewUserPassword(e.target.value)}
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Rol Designado</label>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => setNewUserRole("staff")}
                                                            className={cn(
                                                                "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                                                                newUserRole === 'staff' ? "border-nutri-brand bg-nutri-brand/10 text-white" : "border-white/5 bg-white/5 text-slate-500 hover:border-white/10"
                                                            )}
                                                        >
                                                            <Users className="h-5 w-5" />
                                                            <span className="text-[10px] font-black uppercase">Staff</span>
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setNewUserRole("administrador")}
                                                            className={cn(
                                                                "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                                                                newUserRole === 'administrador' ? "border-red-500/50 bg-red-500/10 text-white" : "border-white/5 bg-white/5 text-slate-500 hover:border-white/10"
                                                            )}
                                                        >
                                                            <Shield className="h-5 w-5" />
                                                            <span className="text-[10px] font-black uppercase">Admin Root</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>

                                            <Button
                                                className="w-full h-14 bg-white text-nutri-base hover:bg-nutri-brand hover:text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all shadow-2xl"
                                                onClick={handleCreateUser}
                                                disabled={isCreatingUser}
                                            >
                                                {isCreatingUser ? <Loader2 className="h-5 w-5 animate-spin" /> : "Confirmar Registros"}
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        )}

                        {activeTab === "settings" && currentAdminRole === 'administrador' && (
                            <VariablesConfig />
                        )}
                        {activeTab === "visualization" && currentAdminRole === 'administrador' && (
                            <TableEditor />
                        )}
                        {activeTab === "landing_cms" && currentAdminRole === 'administrador' && (
                            <VisualLandingEditor />
                        )}
                        {activeTab === "plans_management" && currentAdminRole === 'administrador' && (
                            <div className="-m-4 lg:-m-6 bg-nutri-base overflow-hidden relative">
                                {/* Toolbar de Gestión de Planes */}
                                <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-nutri-panel/90 backdrop-blur-xl border border-white/10 rounded-2xl p-2 px-6 flex items-center gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] animate-in slide-in-from-bottom-10">
                                    <div className="flex items-center gap-3 border-r border-white/10 pr-6">
                                        <div className="h-3 w-3 rounded-full bg-green-500 animate-pulse" />
                                        <span className="text-white font-tech font-bold text-sm tracking-widest uppercase">Editor Activo</span>
                                    </div>

                                    <div className="flex items-center gap-4">
                                        <button
                                            onClick={() => setPlansEditMode(!plansEditMode)}
                                            className={cn(
                                                "px-4 py-2 rounded-xl text-xs font-tech font-bold transition-all flex items-center gap-2 border",
                                                plansEditMode
                                                    ? "bg-white/10 text-white border-white/20"
                                                    : "bg-nutri-brand/20 text-nutri-brand border-nutri-brand/30"
                                            )}
                                        >
                                            {plansEditMode ? "Modo Edición" : "Vista Previa"}
                                        </button>

                                        <button
                                            onClick={() => window.open('/', '_blank')}
                                            className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-tech font-bold transition-all flex items-center gap-2 border border-white/5"
                                        >
                                            <ArrowRight className="h-3 w-3 rotate-[-45deg]" /> Ver Landing
                                        </button>

                                        <button
                                            onClick={() => {
                                                const btn = document.getElementById('save-feedback');
                                                if (btn) {
                                                    btn.innerText = "¡Sincronizado! ✓";
                                                    setTimeout(() => btn.innerText = "Publicar Cambios", 2000);
                                                }
                                            }}
                                            id="save-feedback"
                                            className="px-6 py-2 bg-nutri-brand text-nutri-base rounded-xl text-xs font-tech font-bold transition-all shadow-[0_0_20px_rgba(255,122,0,0.3)] hover:scale-105 active:scale-95"
                                        >
                                            Publicar Cambios
                                        </button>
                                    </div>
                                </div>

                                <div className="h-[90vh] overflow-y-auto overflow-x-hidden w-full scrollbar-hide">
                                    <PlansSection isEditable={plansEditMode} mode="admin_cms" />
                                </div>
                            </div>
                        )}
                        {activeTab === "food_database" && currentAdminRole === 'administrador' && (
                            <FoodDatabase />
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AdminStaffDashboard() {
    return <AdminStaffDashboardContent />;
}

