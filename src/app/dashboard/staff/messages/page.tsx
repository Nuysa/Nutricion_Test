"use client";

import { ChatInterface } from "@/components/dashboard/messaging/chat-interface";
import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { MessagingService } from "@/lib/messaging-service";

const STAFF_MOCK_CONTACTS = [
    {
        id: "admin_master",
        name: "Admin Sistema",
        role: "Administración",
        avatar: "",
        lastMessage: "Bienvenido a la consola staff.",
        time: "Ahora",
        unread: 0,
        online: false
    }
];

export default function StaffMessagesPage() {
    const [contacts, setContacts] = useState<any[]>([]);
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const initialLoadDone = useRef(false);
    const supabase = createClient();

    useEffect(() => {
        const loadContacts = async () => {
            if (!initialLoadDone.current) setLoading(true);
            try {
                // 1. Get current auth user
                const { data: { user } } = await supabase.auth.getUser();
                if (!user) return;

                // 2. Get real profiles
                const [allProfiles, { data: myProfile }] = await Promise.all([
                    MessagingService.getProfiles(),
                    supabase.from("profiles").select("*").eq("user_id", user.id).single()
                ]);

                if (myProfile) {
                    setCurrentUser({
                        id: myProfile.id,
                        name: myProfile.full_name
                    });

                    // 3. Filter out myself, system root and map to Contact format
                    const otherContacts = allProfiles
                        .filter(p => {
                            const isMyself = p.id === myProfile.id;
                            const isRoot = p.name.toLowerCase().includes("root") || p.name.toLowerCase() === "admin";
                            return !isMyself && !isRoot;
                        })
                        .map(p => ({
                            id: p.id,
                            name: p.name,
                            role: p.role,
                            avatar: p.avatar || "",
                            lastMessage: "Sin mensajes recientes",
                            time: "",
                            unread: 0,
                            online: false // Placeholder for now
                        }));

                    setContacts(otherContacts);
                }
            } catch (error) {
                console.error("Error loading chat contacts:", error);
            } finally {
                setLoading(false);
                initialLoadDone.current = true;
            }
        };

        loadContacts();

        // Listen for sync
        const channel = new BroadcastChannel('nutrigo_global_sync');
        channel.onmessage = () => loadContacts();
        return () => channel.close();
    }, []);

    if (loading || !currentUser) {
        return (
            <div className="h-[600px] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-nutrition-600"></div>
            </div>
        );
    }

    return (
        <ChatInterface
            title="Soporte Staff"
            searchPlaceholder="Buscar pacientes, nutris o admins..."
            initialContacts={contacts}
            roleLabel="usuario"
            currentUserId={currentUser.id}
            currentUserName={currentUser.name}
        />
    );
}
