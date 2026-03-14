"use client";

import { useState, useEffect } from "react";
import { MessagingService, GlobalProfile } from "@/lib/messaging-service";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

export function useAdminDashboard(initialTab: any = "overview") {
    const { toast } = useToast();
    const [activeTab, setActiveTab] = useState(initialTab);
    const [loading, setLoading] = useState(true);

    // Data states
    const [profiles, setProfiles] = useState<GlobalProfile[]>([]);
    const [assignments, setAssignments] = useState<Record<string, string[]>>({});
    const [subscriptions, setSubscriptions] = useState<any[]>([]);
    const [offers, setOffers] = useState<any[]>([]);
    const [allAppointments, setAllAppointments] = useState<any[]>([]);
    const [currentAdminRole, setCurrentAdminRole] = useState<string>("");
    const [currentAdminId, setCurrentAdminId] = useState<string>("");

    // UI States
    const [searchTerm, setSearchTerm] = useState("");
    const [verifSearch, setVerifSearch] = useState("");
    const [assignPSearch, setAssignPSearch] = useState("");
    const [assignNSearch, setAssignNSearch] = useState("");
    const [subReviewSearch, setSubReviewSearch] = useState("");
    const [expandedGroups, setExpandedGroups] = useState<Record<string, boolean>>({
        administrador: true,
        staff: true,
        nutricionista: true,
        paciente: true
    });

    // Appointment States
    const [isAgendaDialogOpen, setIsAgendaDialogOpen] = useState(false);
    const [agendaNutriId, setAgendaNutriId] = useState<string | null>(null);
    const [agendaPatientId, setAgendaPatientId] = useState<string | null>(null);
    const [agendaDate, setAgendaDate] = useState("");
    const [agendaTime, setAgendaTime] = useState("");
    const [agendaModality, setAgendaModality] = useState<"virtual" | "presencial">("virtual");
    const [editingAppointmentId, setEditingAppointmentId] = useState<string | null>(null);
    const [occupiedSlots, setOccupiedSlots] = useState<string[]>([]);
    const [agendaView, setAgendaView] = useState<"nutricionistas" | "historial">("nutricionistas");

    // Plan Management States
    const [selectedPatientPlan, setSelectedPatientPlan] = useState<GlobalProfile | null>(null);
    const [newPlanType, setNewPlanType] = useState<'plan flexible' | 'plan menu semanal'>('plan flexible');
    
    // Subscriptions/Offers States
    const [editingOffer, setEditingOffer] = useState<any>(null);
    const [newOfferName, setNewOfferName] = useState("");
    const [newOfferPrice, setNewOfferPrice] = useState("");
    const [newOfferDescription, setNewOfferDescription] = useState("");
    const [newOfferPriceOffer, setNewOfferPriceOffer] = useState("");
    const [newOfferOfferReason, setNewOfferOfferReason] = useState("");
    const [newOfferFeatures, setNewOfferFeatures] = useState("");
    const [newOfferHighlight, setNewOfferHighlight] = useState("");
    const [isCreateOfferDialogOpen, setIsCreateOfferDialogOpen] = useState(false);
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const [selectedOfferId, setSelectedOfferId] = useState<string | null>(null);

    // User Management States
    const [isCreateUserDialogOpen, setIsCreateUserDialogOpen] = useState(false);
    const [newUserEmail, setNewUserEmail] = useState("");
    const [newUserPassword, setNewUserPassword] = useState("");
    const [newUserFullName, setNewUserFullName] = useState("");
    const [newUserRole, setNewUserRole] = useState<"staff" | "administrador">("staff");
    const [isCreatingUser, setIsCreatingUser] = useState(false);
    const [profileToDelete, setProfileToDelete] = useState<{ id: string, name: string } | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isDeletingProfile, setIsDeletingProfile] = useState(false);

    const loadData = async (isSilent = false) => {
        if (!isSilent) setLoading(true);
        try {
            const supabase = createClient();
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                const { data: profile } = await supabase.from("profiles").select("id, role").eq("user_id", user.id).single();
                if (profile) {
                    setCurrentAdminRole(profile.role);
                    setCurrentAdminId(profile.id);
                }
            }

            const [fetchedProfiles, fetchedAssignments, fetchedSubs, fetchedOffers, fetchedAppointments] = await Promise.all([
                MessagingService.getProfiles(),
                MessagingService.getAssignments(),
                MessagingService.getAllSubscriptions(),
                MessagingService.getSubscriptionOffers(),
                MessagingService.getAllAppointments()
            ]);
            setProfiles(fetchedProfiles || []);
            setAssignments(fetchedAssignments || {});
            setSubscriptions(fetchedSubs || []);
            setOffers(fetchedOffers || []);
            setAllAppointments(fetchedAppointments || []);
        } catch (error) {
            console.error("Error loading admin data:", error);
        } finally {
            setLoading(false);
        }
    };

    const getOccupiedSlots = (dateStr: string, nutriId: string) => {
        if (!nutriId) return [];
        const dayAppts = allAppointments.filter(a => a.date === dateStr && a.nutritionistId === nutriId && a.status !== 'cancelada');
        const occupied = new Set<string>();
        dayAppts.forEach(a => {
            const time = a.startTime.substring(0, 5);
            occupied.add(time);
            const [h, m] = time.split(":").map(Number);
            const totalMin = h * 60 + m + 30;
            const nextH = Math.floor(totalMin / 60).toString().padStart(2, '0');
            const nextM = (totalMin % 60).toString().padStart(2, '0');
            occupied.add(`${nextH}:${nextM}`);
        });
        return Array.from(occupied);
    };

    useEffect(() => {
        if (agendaDate && agendaNutriId) {
            setOccupiedSlots(getOccupiedSlots(agendaDate, agendaNutriId));
        }
    }, [agendaDate, agendaNutriId, allAppointments]);

    useEffect(() => {
        loadData();
        const supabase = createClient();
        const realtimeSync = supabase
            .channel('admin_global_changes')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'profiles' }, () => loadData(true))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => loadData(true))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'subscriptions' }, () => loadData(true))
            .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => loadData(true))
            .subscribe();

        const channel = new BroadcastChannel('nutrigo_global_sync');
        channel.onmessage = () => loadData(true);

        const poller = setInterval(() => loadData(true), 60000);

        return () => {
            supabase.removeChannel(realtimeSync);
            channel.close();
            clearInterval(poller);
        };
    }, []);

    // Handlers
    const handleVerify = async (id: string, status: "Activo" | "Rechazado") => {
        try {
            await MessagingService.verifyProfile(id, status);
            toast({ title: status === "Activo" ? "Verificado" : "Rechazado", variant: "success" });
            loadData(true);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleAssign = async (patientId: string | null, nutriId: string | null) => {
        if (!patientId || !nutriId) return;
        await MessagingService.assignPatientToNutritionist(patientId, nutriId);
        toast({ title: "Asignado", variant: "success" });
        loadData(true);
    };

    const handleUnassign = async (pid: string, nid: string) => {
        await MessagingService.unassignPatientFromNutritionist(pid, nid);
        toast({ title: "Removido", variant: "success" });
        loadData(true);
    };

    const handleSetPlan = async () => {
        if (!selectedPatientPlan) return;
        try {
            await MessagingService.assignPlanToPatient(selectedPatientPlan.id, newPlanType, 2);
            toast({ title: "Protocolo Actualizado", variant: "success" });
            loadData(true);
            setSelectedPatientPlan(null);
        } catch (e: any) {
            toast({ title: "Error", description: e.message, variant: "destructive" });
        }
    };

    const handleCreateAppointment = async () => {
        try {
            const supabase = createClient();
            if (!agendaPatientId || !agendaNutriId) throw new Error("Faltan datos");
            const { error } = await supabase.from("appointments").upsert({
                id: editingAppointmentId || undefined,
                patient_id: agendaPatientId,
                nutritionist_id: agendaNutriId,
                scheduled_by: currentAdminId,
                appointment_date: agendaDate,
                start_time: agendaTime,
                end_time: (() => {
                    const [h, m] = agendaTime.split(":").map(Number);
                    const total = h * 60 + m + 30;
                    return `${Math.floor(total / 60).toString().padStart(2, '0')}:${(total % 60).toString().padStart(2, '0')}:00`;
                })(),
                modality: agendaModality,
                status: "programada"
            });
            if (error) throw error;
            toast({ title: "Cita Registrada", variant: "success" });
            setIsAgendaDialogOpen(false);
            setEditingAppointmentId(null);
            loadData(true);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleDeleteAppointment = async (id: string) => {
        await MessagingService.deleteAppointment(id);
        toast({ title: "Eliminada", variant: "success" });
        loadData(true);
    };

    const handleSubscriptionStatus = async (id: string, status: string) => {
        const supabase = createClient();
        await supabase.from("subscriptions").update({ status }).eq("id", id);
        toast({ title: "Estado Actualizado", variant: "success" });
        loadData(true);
    };

    const requestSubscription = async () => {
        if (!selectedPatientId || !selectedOfferId) return;
        await MessagingService.requestSubscription(selectedPatientId, selectedOfferId);
        toast({ title: "Solicitud Enviada", variant: "success" });
        loadData(true);
        setSelectedPatientId(null);
        setSelectedOfferId(null);
    };

    const handleCreateUser = async () => {
        setIsCreatingUser(true);
        try {
            const response = await fetch("/api/admin/create-user", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ email: newUserEmail, password: newUserPassword, fullName: newUserFullName, role: newUserRole })
            });
            if (!response.ok) throw new Error("Error al crear");
            toast({ title: "Usuario Creado", variant: "success" });
            setIsCreateUserDialogOpen(false);
            loadData(true);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsCreatingUser(false);
        }
    };

    const handleConfirmDeleteProfile = async () => {
        if (!profileToDelete) return;
        setIsDeletingProfile(true);
        try {
            await MessagingService.deleteProfile(profileToDelete.id);
            toast({ title: "Perfil Eliminado", variant: "success" });
            setIsDeleteDialogOpen(false);
            loadData(true);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setIsDeletingProfile(false);
        }
    };

    const handleUpdateOffer = async () => {
        if (!editingOffer) return;
        try {
            const supabase = createClient();
            const { error } = await supabase
                .from("subscription_plans")
                .update({
                    name_es: newOfferName,
                    price_pen: parseFloat(newOfferPrice),
                    description_es: newOfferDescription,
                    included_measurements: 2
                })
                .eq("id", editingOffer.id);

            if (error) throw error;
            toast({ title: "Plan Actualizado", variant: "success" });
            setEditingOffer(null);
            loadData(true);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    const handleCreateOffer = async () => {
        try {
            const supabase = createClient();
            const { error } = await supabase
                .from("subscription_plans")
                .insert([{
                    name_es: newOfferName,
                    price_pen: parseFloat(newOfferPrice),
                    description_es: newOfferDescription,
                    duration_months: 1,
                    included_measurements: 2,
                    is_active: true
                }]);

            if (error) throw error;
            toast({ title: "Plan Creado Successfully", variant: "success" });
            setIsCreateOfferDialogOpen(false);
            setNewOfferName("");
            setNewOfferPrice("");
            setNewOfferDescription("");
            loadData(true);
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        }
    };

    return {
        activeTab, setActiveTab,
        loading,
        profiles, assignments, subscriptions, offers, allAppointments,
        currentAdminRole, currentAdminId,
        searchTerm, setSearchTerm,
        verifSearch, setVerifSearch,
        assignPSearch, setAssignPSearch,
        assignNSearch, setAssignNSearch,
        subReviewSearch, setSubReviewSearch,
        expandedGroups, setExpandedGroups,
        isAgendaDialogOpen, setIsAgendaDialogOpen,
        agendaNutriId, setAgendaNutriId,
        agendaPatientId, setAgendaPatientId,
        agendaDate, setAgendaDate,
        agendaTime, setAgendaTime,
        agendaModality, setAgendaModality,
        editingAppointmentId, setEditingAppointmentId,
        occupiedSlots, agendaView, setAgendaView,
        selectedPatientPlan, setSelectedPatientPlan,
        newPlanType, setNewPlanType,
        editingOffer, setEditingOffer,
        newOfferName, setNewOfferName,
        newOfferPrice, setNewOfferPrice,
        newOfferDescription, setNewOfferDescription,
        newOfferPriceOffer, setNewOfferPriceOffer,
        newOfferOfferReason, setNewOfferOfferReason,
        newOfferFeatures, setNewOfferFeatures,
        newOfferHighlight, setNewOfferHighlight,
        isCreateOfferDialogOpen, setIsCreateOfferDialogOpen,
        selectedPatientId, setSelectedPatientId,
        selectedOfferId, setSelectedOfferId,
        isCreateUserDialogOpen, setIsCreateUserDialogOpen,
        newUserEmail, setNewUserEmail,
        newUserPassword, setNewUserPassword,
        newUserFullName, setNewUserFullName,
        newUserRole, setNewUserRole,
        isCreatingUser,
        profileToDelete, setProfileToDelete,
        isDeleteDialogOpen, setIsDeleteDialogOpen,
        isDeletingProfile,
        handleVerify, handleAssign, handleUnassign, handleSetPlan,
        handleCreateAppointment, handleDeleteAppointment,
        handleSubscriptionStatus, requestSubscription,
        handleCreateUser, handleConfirmDeleteProfile,
        handleUpdateOffer, handleCreateOffer
    };
}
