"use client";

import { useState, useEffect, useCallback } from "react";
import { ChatInterface, Contact } from "@/components/dashboard/messaging/chat-interface";
import { createClient } from "@/lib/supabase/client";

export default function PatientMessagesPage() {
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

            const { data: patientData } = await supabase
                .from("patients")
                .select("nutritionist_id, profile:profiles!nutritionist_id(id, full_name, role, avatar_url)")
                .eq("profile_id", myProfile.id)
                .single();

            const loadedContacts: Contact[] = [];
            if (patientData?.profile) {
                const nutri = patientData.profile as any;
                loadedContacts.push({
                    id: nutri.id,
                    name: `Lic. ${nutri.full_name}`,
                    role: "Tu Nutricionista",
                    avatar: nutri.avatar_url || "",
                    lastMessage: "Inicia una conversación",
                    time: "Ahora",
                    unread: 0,
                    online: false,
                });
            }

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
                            lastMessage: "Canal de soporte",
                            time: "Hoy",
                            unread: 0,
                            online: false,
                        });
                    }
                });
            }

            setContacts(loadedContacts);
        } catch (err) {
            console.error("Error loading patient contacts:", err);
        } finally {
            setLoading(false);
        }
    }, [supabase]);

    useEffect(() => {
        loadContacts();

        // 1. Listen for assignment changes (patients table)
        const channel = supabase
            .channel('patient_assignment_sync')
            .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'patients' }, () => {
                loadContacts();
            })
            .subscribe();

        // 2. Broadcast sync
        const bc = new BroadcastChannel('nutrigo_global_sync');
        bc.onmessage = () => loadContacts();

        // 3. Custom event sync
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
            title="Mis Mensajes"
            searchPlaceholder="Buscar chats..."
            initialContacts={contacts}
            roleLabel="Especialista / Soporte"
            currentUserId={currentUser.id}
            currentUserName={currentUser.name}
        />
    );
}
