import { createBrowserClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";

export interface PasswordRequestItem {
    id: string;
    email: string;
    note?: string;
    status: "pending" | "link_generated" | "resolved";
    token?: string;
    tokenExpiresAt?: string;
    used?: boolean;
    createdAt: string;
    linkGeneratedAt?: string;
    resolvedAt?: string;
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

function generateSecureToken(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return `${crypto.randomUUID().replace(/-/g, "")}${Math.random().toString(36).substring(2, 10)}`;
    }
    return `tok_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
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
                console.error("Error al obtener solicitudes de contraseñas:", error);
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
    async createRequest(payload: { email: string; note?: string }): Promise<PasswordRequestItem> {
        const supabase = getSupabaseClient();
        const currentList = await this.getAll();

        const newItem: PasswordRequestItem = {
            id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            email: payload.email.trim(),
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

    // 3. Generar un enlace único de renovación (acción del Administrador Root)
    // El enlace caduca a las 48 horas y solo puede ser usado UNA vez
    async generateRenewalLink(requestId: string, origin?: string): Promise<{ url: string; token: string }> {
        const supabase = getSupabaseClient();
        const currentList = await this.getAll();

        const token = generateSecureToken();
        const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(); // 48 horas

        let found = false;
        const updatedList = currentList.map(item => {
            if (item.id === requestId) {
                found = true;
                return {
                    ...item,
                    status: "link_generated" as const,
                    token,
                    tokenExpiresAt: expiresAt,
                    used: false,
                    linkGeneratedAt: new Date().toISOString()
                };
            }
            return item;
        });

        if (!found) {
            throw new Error("No se encontró la solicitud especificada.");
        }

        const { error } = await supabase
            .from("appointments")
            .update({ notes: JSON.stringify(updatedList) })
            .eq("id", SYSTEM_STORAGE_APPOINTMENT_ID);

        if (error) {
            console.error("Error al generar enlace de renovación:", error);
            throw new Error(error.message || "No se pudo generar el enlace de renovación.");
        }

        const baseUrl = origin || (typeof window !== "undefined" ? window.location.origin : "");
        const url = `${baseUrl}/renew-password?token=${encodeURIComponent(token)}`;

        return { url, token };
    },

    // 4. Validar token para el formulario de cambio de contraseña
    async validateToken(token: string): Promise<{
        valid: boolean;
        reason?: "not_found" | "already_used" | "expired";
        request?: PasswordRequestItem;
    }> {
        if (!token) return { valid: false, reason: "not_found" };

        const currentList = await this.getAll();
        const item = currentList.find(req => req.token === token);

        if (!item) {
            return { valid: false, reason: "not_found" };
        }

        if (item.used) {
            return { valid: false, reason: "already_used", request: item };
        }

        if (item.tokenExpiresAt && new Date() > new Date(item.tokenExpiresAt)) {
            return { valid: false, reason: "expired", request: item };
        }

        return { valid: true, request: item };
    },

    // 5. Consumir token: marca el token como usado para que caduque inmediatamente
    async consumeToken(token: string): Promise<boolean> {
        const supabase = getSupabaseClient();
        const currentList = await this.getAll();

        let updated = false;
        const updatedList = currentList.map(item => {
            if (item.token === token) {
                updated = true;
                return {
                    ...item,
                    used: true,
                    status: "resolved" as const,
                    resolvedAt: new Date().toISOString()
                };
            }
            return item;
        });

        if (!updated) return false;

        const { error } = await supabase
            .from("appointments")
            .update({ notes: JSON.stringify(updatedList) })
            .eq("id", SYSTEM_STORAGE_APPOINTMENT_ID);

        if (error) {
            console.error("Error al consumir token:", error);
            return false;
        }

        return true;
    },

    // 6. Eliminar una solicitud
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
