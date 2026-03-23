"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";

export const monthNamesFull = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

export const timeSlots = [
    "08:00", "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "12:00", "12:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30", "18:00", "18:30", "19:00", "19:30", "20:00"
];

export function useNutritionistCalendar() {
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

    const loadSupabaseData = useCallback(async () => {
        try {
            setLoading(true);
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase.from("profiles").select("id, full_name, role").eq("user_id", user.id).single();
            if (!profile) return;

            const { data: patientsData } = await supabase
                .from("patients")
                .select("id")
                .eq("nutritionist_id", profile.id);

            setAssignedPatientIds((patientsData || []).map(p => p.id));

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
                // Fallback attempt
                const { data: fallbackAppts } = await supabase
                    .from("appointments")
                    .select("*")
                    .eq("nutritionist_id", profile.id);
                
                if (fallbackAppts) {
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
                setLocalAppts([]);
            }
        } catch (err) {
            console.error("Error loading calendar data:", err);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        loadSupabaseData();

        const channel = supabase
            .channel('nutritionist_calendar_realtime')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
                loadSupabaseData();
            })
            .subscribe();

        const sync = new BroadcastChannel('nutrigo_global_sync');
        sync.onmessage = () => loadSupabaseData();
        
        return () => {
            supabase.removeChannel(channel);
            sync.close();
        };
    }, [loadSupabaseData, supabase]);

    const getAppts = (day: number, monthVal?: number, yearVal?: number) => {
        const m = monthVal !== undefined ? monthVal : currentMonth;
        const y = yearVal !== undefined ? yearVal : currentYear;
        return localAppts.filter((a) => a.day === day && a.month === m && a.year === y);
    };

    const getOccupiedSlots = (dateString: string) => {
        const dateObj = new Date(dateString + 'T12:00:00');
        const day = dateObj.getDate();
        const month = dateObj.getMonth();
        const year = dateObj.getFullYear();

        const dayAppts = localAppts.filter((a: any) => {
            const isSameDay = a.day === day;
            const isSameMonth = a.month === month;
            const isSameYear = a.year === year;
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

    const isSlotPastOrBuffer = (slotTime: string, dateString: string, currentStatus?: string) => {
        if (currentStatus === 'cancelada') return false;
        
        const nowInternal = new Date(); 
        const [h, m] = slotTime.split(":").map(Number);
        
        // Use ISO date part but set specific hours
        const targetDate = new Date(dateString + 'T00:00:00');
        targetDate.setHours(h, m, 0, 0);

        if (currentStatus === 'completada') {
            // Completada solo permite presente o pasado
            return targetDate > nowInternal;
        }

        // Programada requiere al menos 1 hora de diferencia hacia el futuro
        const bufferTime = new Date(nowInternal.getTime() + 60 * 60 * 1000);
        return targetDate < bufferTime;
    };

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
            const [h, m] = editValues.time.split(":").map(Number);
            const totalStart = h * 60 + m;
            const totalEnd = totalStart + 30;
            const endH = Math.floor(totalEnd / 60).toString().padStart(2, '0');
            const endM = (totalEnd % 60).toString().padStart(2, '0');
            const startTime = `${editValues.time}:00`;
            const endTime = `${endH}:${endM}:00`;

            const now = new Date();
            const targetDate = new Date(editValues.date + 'T00:00:00');
            targetDate.setHours(h, m, 0, 0);

            // Validaciones de negocio
            if (editValues.status === 'programada') {
                const minTime = new Date(now.getTime() + 60 * 60 * 1000);
                if (targetDate < minTime) {
                    throw new Error("Las citas programadas deben agendarse con al menos 1 hora de anticipación hacia el futuro.");
                }
            } else if (editValues.status === 'completada') {
                if (targetDate > now) {
                    throw new Error("No puedes marcar como completada una cita que aún no ha ocurrido (horario futuro).");
                }
            }

            const { error } = await supabase
                .from("appointments")
                .update({
                    appointment_date: editValues.date,
                    start_time: startTime,
                    end_time: endTime,
                    modality: editValues.type === 'in-person' ? 'presencial' : 'virtual',
                    status: editValues.status
                })
                .eq("id", editingAppt.id);

            if (error) throw error;

            const syncChannel = new BroadcastChannel('nutrigo_global_sync');
            syncChannel.postMessage('sync');
            syncChannel.close();

            setIsEditDialogOpen(false);
            toast({
                title: "Cita actualizada",
                description: "Los cambios se han guardado correctamente.",
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

    return {
        currentMonth, setCurrentMonth,
        currentYear, setCurrentYear,
        selectedDay, setSelectedDay,
        localAppts,
        loading,
        assignedPatientIds,
        isEditDialogOpen, setIsEditDialogOpen,
        editingAppt, setEditingAppt,
        viewMonth, setViewMonth,
        viewYear, setViewYear,
        editValues, setEditValues,
        getOccupiedSlots,
        isSlotPastOrBuffer,
        handleEditAppt,
        saveEdit,
        getAppts,
        loadSupabaseData
    };
}
