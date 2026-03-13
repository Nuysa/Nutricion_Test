"use client";

import { createClient } from "@/lib/supabase/client";

// Types
export interface GlobalMessage {
    id: string;
    senderId: string;
    receiverId: string;
    senderName?: string;
    content: string;
    time: string;
    type: "text" | "image" | "document";
    status: "sent" | "delivered" | "read";
}

export interface GlobalProfile {
    id: string;
    name: string;
    role: "paciente" | "nutricionista" | "staff" | "administrador";
    avatar?: string;
    status?: string;
    email?: string;
    planType?: string;
    patientId?: string;
}

const supabase = createClient();

// Evolution to real database (Supabase)
export const MessagingService = {
    // 1. Clear everything (keep for legacy cleanup)
    masterReset: () => {
        if (typeof window === "undefined") return;
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith("nutrigo_")) {
                localStorage.removeItem(key);
            }
        });
        console.log("Master Reset: LocalStorage cleared.");
    },

    // 2. Get messages for a specific interaction
    getMessages: async (userId1: string, userId2: string): Promise<GlobalMessage[]> => {
        const { data, error } = await supabase
            .from("messages")
            .select("*, sender:profiles!sender_id(full_name)")
            .or(`and(sender_id.eq.${userId1},receiver_id.eq.${userId2}),and(sender_id.eq.${userId2},receiver_id.eq.${userId1})`)
            .order("created_at", { ascending: true });

        if (error) {
            console.error("Error fetching messages:", error);
            return [];
        }

        return data.map(m => ({
            id: m.id,
            senderId: m.sender_id,
            receiverId: m.receiver_id,
            senderName: m.sender?.full_name || "Usuario",
            content: m.content,
            time: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            type: "text",
            status: m.is_read ? "read" : "sent"
        }));
    },

    // 3. Send a message
    sendMessage: async (msg: Omit<GlobalMessage, "id" | "time" | "status">) => {
        const { data, error } = await supabase
            .from("messages")
            .insert({
                sender_id: msg.senderId,
                receiver_id: msg.receiverId,
                content: msg.content
            })
            .select()
            .single();

        if (error) {
            console.error("Error sending message:", error);
            throw error;
        }

        const newMessage: GlobalMessage = {
            ...msg,
            id: data.id,
            time: new Date(data.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            status: "sent"
        };

        // Sync via BroadcastChannel (still useful for UI update in other tabs)
        const channel = new BroadcastChannel('nutrigo_global_sync');
        channel.postMessage({ type: 'NEW_MESSAGE', message: newMessage });
        channel.close();

        return newMessage;
    },

    // 4. Profiles Management
    saveProfile: async (profile: GlobalProfile) => {
        const { error } = await supabase
            .from("profiles")
            .upsert({
                id: profile.id, // This is profiles.id, usually derived from user_id if we want them to match
                full_name: profile.name,
                role: profile.role,
                avatar_url: profile.avatar,
                plan_type: profile.planType
            });

        if (error) console.error("Error saving profile:", error);
    },

    getProfiles: async (): Promise<GlobalProfile[]> => {
        // We use patients!profile_id to resolve ambiguity between multiple FKs
        const { data, error } = await supabase
            .from("profiles")
            .select(`
                *,
                patients!profile_id (
                    id,
                    plan_type
                )
            `);

        if (error) {
            console.error("[MessagingService] Error fetching profiles:", error);
            // Fallback: try to fetch without join if the join failed (e.g. schema/RLS issues)
            const { data: simpleData, error: simpleError } = await supabase
                .from("profiles")
                .select("*");

            if (simpleError) {
                console.error("[MessagingService] Critical error fetching profiles:", simpleError);
                return [];
            }
            return simpleData.map(p => ({
                id: p.id,
                name: p.full_name,
                role: p.role as any,
                avatar: p.avatar_url,
                status: p.status,
                email: p.email,
                planType: 'sin plan'
            }));
        }

        return data.map(p => {
            const patientData = Array.isArray(p.patients) ? p.patients[0] : p.patients;
            return {
                id: p.id,
                name: p.full_name,
                role: p.role as any,
                avatar: p.avatar_url,
                status: p.status,
                email: p.email,
                planType: patientData?.plan_type || 'sin plan',
                patientId: patientData?.id
            };
        });
    },

    deleteProfile: async (id: string) => {
        const { error } = await supabase.rpc('delete_user_by_admin', {
            target_profile_id: id
        });

        if (error) {
            console.error("Error deleting profile:", error);
            throw error;
        }

        // Sync
        const channel = new BroadcastChannel('nutrigo_global_sync');
        channel.postMessage({ type: 'PROFILE_UPDATED' });
        channel.close();
    },

    // 5. Mark as read
    markMessagesAsRead: async (myId: string, otherId: string) => {
        const { error } = await supabase
            .from("messages")
            .update({ is_read: true })
            .eq("sender_id", otherId)
            .eq("receiver_id", myId)
            .eq("is_read", false);

        if (error) console.error("Error marking as read:", error);

        const channel = new BroadcastChannel('nutrigo_global_sync');
        channel.postMessage({ type: 'STATUS_UPDATED' });
        channel.close();
    },

    // 6. Verification System (for Admin)
    verifyProfile: async (id: string, status: "Activo" | "Rechazado") => {
        const { error } = await supabase
            .from("profiles")
            .update({ status: status })
            .eq("id", id);

        if (error) {
            console.error("Error verifying profile:", error);
            throw error;
        }

        // Sync
        const channel = new BroadcastChannel('nutrigo_global_sync');
        channel.postMessage({ type: 'PROFILE_UPDATED' });
        channel.close();
    },

    // 7. Assignment System
    assignPatientToNutritionist: async (patientProfileId: string, nutritionistProfileId: string) => {

        // Update new junction table (multiple assignments)
        const { error: relError } = await supabase
            .from("patient_nutritionists")
            .upsert({
                patient_profile_id: patientProfileId,
                nutritionist_profile_id: nutritionistProfileId
            }, { onConflict: 'patient_profile_id,nutritionist_profile_id' });

        // Fallback for single assignment view (retro-compatibility)
        const { data: patientData } = await supabase
            .from("patients")
            .select("id")
            .eq("profile_id", patientProfileId)
            .maybeSingle();

        if (patientData) {
            await supabase
                .from("patients")
                .update({ nutritionist_id: nutritionistProfileId })
                .eq("id", patientData.id);
        } else {
            await supabase
                .from("patients")
                .insert({
                    profile_id: patientProfileId,
                    nutritionist_id: nutritionistProfileId
                });
        }

        const channel = new BroadcastChannel('nutrigo_global_sync');
        channel.postMessage({ type: 'ASSIGNMENT_UPDATED' });
        channel.close();
    },

    unassignPatientFromNutritionist: async (patientProfileId: string, nutritionistProfileId: string) => {
        // Delete from junction table
        await supabase
            .from("patient_nutritionists")
            .delete()
            .match({ patient_profile_id: patientProfileId, nutritionist_profile_id: nutritionistProfileId });

        // Also remove if it's the primary one
        await supabase
            .from("patients")
            .update({ nutritionist_id: null })
            .match({ profile_id: patientProfileId, nutritionist_id: nutritionistProfileId });

        const channel = new BroadcastChannel('nutrigo_global_sync');
        channel.postMessage({ type: 'ASSIGNMENT_UPDATED' });
        channel.close();
    },

    getAssignments: async (): Promise<Record<string, string[]>> => {
        console.log("[MessagingService] Fetching assignments...");
        const map: Record<string, string[]> = {};

        const { data, error } = await supabase
            .from("patients")
            .select("profile_id, nutritionist_id")
            .not("nutritionist_id", "is", null);

        if (data) {
            data.forEach(p => {
                if (p.profile_id && p.nutritionist_id) {
                    if (!map[p.profile_id]) map[p.profile_id] = [];
                    map[p.profile_id].push(p.nutritionist_id);
                }
            });
        }

        // Obtener relaciones múltiples desde la nueva tabla (si existe)
        const { data: relData, error: relError } = await supabase
            .from("patient_nutritionists")
            .select("patient_profile_id, nutritionist_profile_id");

        if (relData && !relError) {
            relData.forEach(r => {
                const pid = r.patient_profile_id;
                const nid = r.nutritionist_profile_id;
                if (pid && nid) {
                    if (!map[pid]) map[pid] = [];
                    if (!map[pid].includes(nid)) {
                        map[pid].push(nid);
                    }
                }
            });
        }

        return map;
    },

    // 8. Appointments
    saveAppointment: async (appt: any) => {
        // Encontrar IDs reales de pacientes (basado en profile_id si appt los trae así)
        // Por ahora asumimos que appt ya viene con patient_id (id de tabla patients)
        const { error } = await supabase
            .from("appointments")
            .upsert({
                id: appt.id && !appt.id.startsWith("appt_") ? appt.id : undefined,
                patient_id: appt.patientId,
                nutritionist_id: appt.nutritionistId,
                scheduled_by: appt.scheduledBy || appt.nutritionistId, // Add mandatory field
                appointment_date: appt.date,
                start_time: appt.startTime,
                end_time: appt.endTime,
                modality: appt.type || 'virtual',
                status: appt.status || 'programada',
                notes: appt.notes
            });

        if (error) console.error("Error saving appointment:", error);

        const channel = new BroadcastChannel('nutrigo_global_sync');
        channel.postMessage({ type: 'APPOINTMENTS_UPDATED' });
        channel.close();
    },

    getAllAppointments: async (): Promise<any[]> => {
        const { data, error } = await supabase
            .from("appointments")
            .select(`
                *,
                patient:patients!patient_id(
                    profiles!profile_id(full_name)
                ),
                nutritionist:profiles!nutritionist_id(full_name)
            `);

        if (error) {
            console.error("[MessagingService] Error fetching appointments:", error);
            return [];
        }

        return data.map(a => {
            const patientObj = (a.patient as any);
            const patientName = patientObj?.profiles?.full_name || "Paciente";
            const nutriName = (a.nutritionist as any)?.full_name || "Nutricionista";

            return {
                id: a.id,
                patientId: a.patient_id,
                patientName: patientName,
                nutritionistId: a.nutritionist_id,
                nutritionistName: nutriName,
                date: a.appointment_date,
                startTime: a.start_time,
                endTime: a.end_time,
                status: a.status,
                type: a.modality
            };
        });
    },

    deleteAppointment: async (id: string) => {
        const { error } = await supabase.from("appointments").delete().eq("id", id);
        if (error) throw error;

        const channel = new BroadcastChannel('nutrigo_global_sync');
        channel.postMessage({ type: 'APPOINTMENTS_UPDATED' });
        channel.close();
    },

    updateAppointmentStatus: async (id: string, status: string) => {
        const { error } = await supabase
            .from("appointments")
            .update({ status })
            .eq("id", id);
        
        if (error) throw error;

        const channel = new BroadcastChannel('nutrigo_global_sync');
        channel.postMessage({ type: 'APPOINTMENTS_UPDATED' });
        channel.close();
    },

    // 9. Subscription Management
    getSubscriptionOffers: async () => {
        const { data, error } = await supabase.from("subscription_plans").select("*").eq("is_active", true);
        return error ? [] : data.map(p => ({
            ...p,
            name: p.name_es,
            price: p.price_pen,
            duration_days: p.duration_months * 30
        }));
    },

    getAllSubscriptions: async () => {
        const { data, error } = await supabase
            .from("subscriptions")
            .select(`
                *,
                profile:profiles(full_name),
                plan:subscription_plans(name_es, price_pen, included_measurements)
            `)
            .order("created_at", { ascending: false });
        // Map profile to patient structure expected by UI
        const mappedData = data?.map(sub => ({
            ...sub,
            patient: { profile: sub.profile }
        }));
        return error ? [] : mappedData;
    },

    requestSubscription: async (patientProfileId: string, offerId: string) => {
        // Find patient first
        const { data: patient } = await supabase.from("patients").select("id").eq("profile_id", patientProfileId).single();
        if (!patient) throw new Error("Patient not found");

        // Get plan price for required fields
        const { data: planData } = await supabase.from("subscription_plans").select("price_pen").eq("id", offerId).single();
        const price = planData?.price_pen || 0;

        const { error } = await supabase.from("subscriptions").insert({
            patient_id: patientProfileId,
            plan_id: offerId,
            start_date: new Date().toISOString().split('T')[0],
            end_date: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            status: "pendiente",
            original_price: price,
            final_price: price
        });
        if (error) throw error;

        const channel = new BroadcastChannel('nutrigo_global_sync');
        channel.postMessage({ type: 'SUBSCRIPTION_UPDATED' });
        channel.close();
    },

    handleSubscriptionStatus: async (subscriptionId: string, status: "activa" | "cancelada") => {
        const { error } = await supabase
            .from("subscriptions")
            .update({
                status: status
            })
            .eq("id", subscriptionId);

        if (error) throw error;

        const channel = new BroadcastChannel('nutrigo_global_sync');
        channel.postMessage({ type: 'SUBSCRIPTION_UPDATED' });
        channel.close();
    },

    updatePatientPlanType: async (profileId: string, planType: string) => {
        // Use upsert to handle cases where the patient record might not exist yet
        const { error } = await supabase
            .from("patients")
            .upsert(
                { profile_id: profileId, plan_type: planType },
                { onConflict: 'profile_id' }
            );

        if (error) {
            console.error("Error updating plan type:", error);
            throw error;
        }

        const channel = new BroadcastChannel('nutrigo_global_sync');
        channel.postMessage({ type: 'PROFILE_UPDATED' });
        channel.close();
    },

    assignPlanToPatient: async (patientProfileId: string, planType: string, measurements: number = 2) => {
        // 1. Get real patient ID or create if missing
        let pId: string;
        const { data: pData, error: findError } = await supabase.from("patients").select("id").eq("profile_id", patientProfileId).maybeSingle();

        if (findError) {
            console.error("[assignPlanToPatient] RLS or DB error finding patient:", findError);
            throw findError;
        }

        if (pData) {
            pId = pData.id;
        } else {
            // Create record if missing for this profile
            console.log("[assignPlanToPatient] Missing patient record for profile, creating...");
            const { data: createdPatient, error: createError } = await supabase
                .from("patients")
                .insert({
                    profile_id: patientProfileId,
                    plan_type: planType
                })
                .select("id")
                .single();

            if (createError) throw createError;
            pId = createdPatient.id;
        }

        // 2. Update current plan type in patients table
        const { error: updateError } = await supabase.from("patients").update({
            plan_type: planType,
        }).eq("id", pId);

        if (updateError) throw updateError;

        // 3. Create entry in subscriptions history if not 'sin plan'
        if (planType && planType !== "sin plan") {
            let properPlanName = "Flexible Mensual";
            const baseName = planType === 'plan menu semanal' ? 'Menú Semanal' : 'Flexible';

            if (measurements === 2) properPlanName = `${baseName} Mensual`;
            else if (measurements === 4) properPlanName = `${baseName} Bimestral`;
            else if (measurements === 6) properPlanName = `${baseName} Trimestral`;

            // Find a corresponding plan_id in subscription_plans
            const { data: planData } = await supabase
                .from("subscription_plans")
                .select("id, price_pen, duration_months")
                .ilike('name_es', properPlanName)
                .eq('is_active', true)
                .limit(1)
                .maybeSingle();

            // Fallback to any active plan if no name match
            let planId = planData?.id;
            let price = planData?.price_pen || 0;
            let duration = planData?.duration_months || 1;

            if (!planId) {
                const { data: fallbackPlan } = await supabase
                    .from("subscription_plans")
                    .select("id, price_pen, duration_months")
                    .eq('is_active', true)
                    .limit(1)
                    .maybeSingle();
                planId = fallbackPlan?.id;
                price = fallbackPlan?.price_pen || 0;
                duration = fallbackPlan?.duration_months || 1;
            }

            const startDate = new Date();
            const endDate = new Date(startDate);
            endDate.setMonth(startDate.getMonth() + duration);

            const { error: insertError } = await supabase.from("subscriptions").insert({
                patient_id: patientProfileId,
                plan_id: planId,
                status: 'activa',
                start_date: startDate.toISOString().split('T')[0],
                end_date: endDate.toISOString().split('T')[0],
                original_price: price,
                final_price: price
            });

            if (insertError) {
                console.error("Error inserting subscription history:", insertError);
                throw insertError;
            }
        }

        const channel = new BroadcastChannel('nutrigo_global_sync');
        channel.postMessage({ type: 'PLAN_ASSIGNED' });
        channel.close();
    },

    getPatientPlanHistory: async (patientProfileId: string) => {

        const { data, error } = await supabase
            .from("subscriptions")
            .select(`*, plan:subscription_plans(name_es, price_pen, included_measurements)`)
            .eq("patient_id", patientProfileId)
            .order("created_at", { ascending: false });

        return error ? [] : data;
    },

    deleteSubscription: async (subscriptionId: string) => {
        const { data: subData } = await supabase.from("subscriptions").select("patient_id").eq("id", subscriptionId).maybeSingle();

        const { error } = await supabase.from("subscriptions").delete().eq("id", subscriptionId);
        if (error) throw error;

        if (subData?.patient_id) {
            const { count } = await supabase
                .from("subscriptions")
                .select("*", { count: 'exact', head: true })
                .eq("patient_id", subData.patient_id)
                .eq("status", "activa");

            if (count === 0) {
                await supabase.from("patients").update({ plan_type: "sin plan" }).eq("profile_id", subData.patient_id);
            }
        }

        const channel = new BroadcastChannel('nutrigo_global_sync');
        channel.postMessage({ type: 'SUBSCRIPTION_DELETED' });
        channel.close();
    }
};
