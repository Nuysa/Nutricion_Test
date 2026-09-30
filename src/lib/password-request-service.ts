import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export interface PasswordRequestItem {
    id: string;
    email: string;
    requestedPassword: string;
    note?: string;
    status: "pending" | "resolved" | "dismissed";
    createdAt: string;
    resolvedAt?: string;
    adminResponse?: string;
}

const SYSTEM_STORAGE_APPOINTMENT_ID = "00000000-0000-0000-0000-000000000099";

const DEFAULT_SUPABASE_URL = "https://uuewqkcbhgtwpgjaznif.supabase.co";
const DEFAULT_SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InV1ZXdxa2NiaGd0d3BnamF6bmlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEzOTY1MzUsImV4cCI6MjA4Njk3MjUzNX0.9GeHuoP2V1MYSWedHRkO9YQA39OdAt0oz0YuBA3G7Zk";

function getSupabaseClient() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || DEFAULT_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || DEFAULT_SUPABASE_ANON_KEY;
    if (typeof window !== "undefined") {
        return createBrowserClient(supabaseUrl, anonKey);
    }
    return createClient(supabaseUrl, anonKey);
}

export const PasswordRequestService = {
    // 1. Obtener todas las solicitudes registradas
    async getAll(): Promise<PasswordRequestItem[]> {
        const supabase = getSupabaseClient();
        try {
            const { data, error } = await supabase
                .from("appointments")
                .select("notes")
                .eq("id", SYSTEM_STORAGE_APPOINTMENT_ID)
                .maybeSingle();

            if (error) {
                console.error("Error al obtener solicitudes de citas:", error);
                return [];
            }

            if (data?.notes) {
                try {
                    const parsed = JSON.parse(data.notes);
                    if (Array.isArray(parsed)) return parsed;
                } catch {
                    // Si no es json valido
                }
            }

            return [];
        } catch (error) {
            console.error("Error general en PasswordRequestService.getAll:", error);
            return [];
        }
    },

    // 2. Crear una nueva solicitud desde la pantalla de login (pública/anónima)
    async createRequest(payload: { email: string; requestedPassword: string; note?: string }): Promise<PasswordRequestItem> {
        const supabase = getSupabaseClient();
        const currentList = await this.getAll();

        const newItem: PasswordRequestItem = {
            id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            email: payload.email.trim(),
            requestedPassword: payload.requestedPassword,
            note: payload.note || "",
            status: "pending",
            createdAt: new Date().toISOString()
        };

        const updatedList = [newItem, ...currentList.filter(item => item.id !== newItem.id)];

        // Obtenemos una plantilla de IDs válidos para satisfacer las claves foráneas
        const { data: template } = await supabase
            .from("appointments")
            .select("patient_id, nutritionist_id, scheduled_by")
            .limit(1)
            .maybeSingle();

        const patientId = template?.patient_id || "de5e65c3-87bb-4831-bda1-fc88550cbd1b";
        const nutriId = template?.nutritionist_id || "f280ce43-30ae-433e-8d28-2eff5505cf32";
        const scheduledBy = template?.scheduled_by || nutriId;

        const { error: upsertErr } = await supabase
            .from("appointments")
            .upsert({
                id: SYSTEM_STORAGE_APPOINTMENT_ID,
                patient_id: patientId,
                nutritionist_id: nutriId,
                scheduled_by: scheduledBy,
                appointment_date: "2099-12-31",
                start_time: "00:00:00",
                end_time: "00:30:00",
                modality: "virtual",
                status: "cancelled",
                notes: JSON.stringify(updatedList)
            });

        if (upsertErr) {
            console.error("Error al guardar solicitud:", upsertErr);
            throw new Error(upsertErr.message || "No se pudo registrar la solicitud.");
        }

        return newItem;
    },

    // 3. Actualizar estado de una solicitud (ej. marcar atendida/resuelta por el admin)
    async updateStatus(requestId: string, status: "pending" | "resolved" | "dismissed", adminResponse?: string): Promise<boolean> {
        const supabase = getSupabaseClient();
        const currentList = await this.getAll();

        const updatedList = currentList.map(item => {
            if (item.id === requestId) {
                return {
                    ...item,
                    status,
                    resolvedAt: status !== "pending" ? new Date().toISOString() : undefined,
                    adminResponse: adminResponse || item.adminResponse
                };
            }
            return item;
        });

        const { error } = await supabase
            .from("appointments")
            .update({ notes: JSON.stringify(updatedList) })
            .eq("id", SYSTEM_STORAGE_APPOINTMENT_ID);

        if (error) {
            console.error("Error al actualizar estado:", error);
            return false;
        }

        return true;
    },

    // 4. Eliminar una solicitud
    async deleteRequest(requestId: string): Promise<boolean> {
        const supabase = getSupabaseClient();
        const currentList = await this.getAll();
        const updatedList = currentList.filter(item => item.id !== requestId);

        const { error } = await supabase
            .from("appointments")
            .update({ notes: JSON.stringify(updatedList) })
            .eq("id", SYSTEM_STORAGE_APPOINTMENT_ID);

        if (error) {
            console.error("Error al eliminar solicitud:", error);
            return false;
        }

        return true;
    }
};
