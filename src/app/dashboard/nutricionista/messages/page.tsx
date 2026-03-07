"use client";

import { useState, useEffect, useCallback } from "react";
import { ChatInterface, Contact } from "@/components/dashboard/messaging/chat-interface";
import { createClient } from "@/lib/supabase/client";

export default function SpecialistMessagesPage() {
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [currentUser, setCurrentUser] = useState<{ id: string; name: string } | null>(null);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    const loadContacts = useCallback(async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: myProfile } = await supabase
                .from("profiles")
                .select("id, full_name")
                .eq("user_id", user.id)
                .single();

            if (!myProfile) return;
            setCurrentUser({ id: myProfile.id, name: myProfile.full_name });

            const loadedContacts: Contact[] = [];

            // 2. Pacientes asignados
            const { data: assignedPatients } = await supabase
                .from("patients")
                .select("profile:profiles!profile_id(id, full_name, avatar_url)")
                .eq("nutritionist_id", myProfile.id);

            if (assignedPatients) {
                assignedPatients.forEach(ap => {
                    const p = ap.profile as any;
                    if (p) {
                        loadedContacts.push({
                            id: p.id,
                            name: p.full_name,
                            role: "Paciente Asignado",
                            avatar: p.avatar_url || "",
                            lastMessage: "Conversación del paciente",
                            time: "Hoy",
                            unread: 0,
                            online: false,
                        });
                    }
                });
            }

            // 3. Staff / Admin
            const { data: staffProfiles } = await supabase
                .from("profiles")
                .select("id, full_name, role, avatar_url")
                .in("role", ["staff", "administrador"]);

            if (staffProfiles) {
                staffProfiles.forEach(sp => {
                    const isRoot = sp.full_name.toLowerCase().includes("root") || sp.full_name.toLowerCase() === "admin";
                    if (sp.id !== myProfile.id && !isRoot) {
                        loadedContacts.push({
                            id: sp.id,
                            name: sp.full_name,
                            role: sp.role === "administrador" ? "Administrador" : "Soporte",
                            avatar: sp.avatar_url || "",
                            lastMessage: "Canal administrativo",
                            time: "Hoy",
                            unread: 0,
                            online: true,
                        });
                    }
                });
            }

            setContacts(loadedContacts);
        } catch (err) {
            console.error("Error loading specialist contacts:", err);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        loadContacts();

        // 1. Listen for new assignments (patients table)
        const channel = supabase
            .channel('nutritionist_assignment_sync')
            .on('postgres_changes', { event: '*', schema: 'public', table: 'patients' }, () => {
                loadContacts();
            })
            .subscribe();

        // 2. Broadcast sync
        const bc = new BroadcastChannel('nutrigo_global_sync');
        bc.onmessage = () => loadContacts();

        // 3. Custom event
        window.addEventListener("nutrigo-unread-refresh", loadContacts);

        return () => {
            supabase.removeChannel(channel);
            bc.close();
            window.removeEventListener("nutrigo-unread-refresh", loadContacts);
        };
    }, [loadContacts, supabase]);

    if (loading || !currentUser) return (
        <div className="h-full w-full flex items-center justify-center">
            <div className="animate-spin h-8 w-8 border-4 border-nutrition-600 border-t-transparent rounded-full" />
        </div>
    );

    return (
        <ChatInterface
            title="Chat con Pacientes / Staff"
            searchPlaceholder="Buscar paciente o staff..."
            initialContacts={contacts}
            roleLabel="paciente/staff"
            currentUserId={currentUser.id}
            currentUserName={currentUser.name}
        />
    );
}
