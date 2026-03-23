"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface PresenceContextType {
    onlineUsers: Set<string>;
    isOnline: (userId: string) => boolean;
}

const PresenceContext = createContext<PresenceContextType>({
    onlineUsers: new Set(),
    isOnline: () => false,
});

export const usePresence = () => useContext(PresenceContext);

export function PresenceProvider({
    children,
    currentUserId
}: {
    children: React.ReactNode;
    currentUserId: string;
}) {
    const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
    const supabase = createClient();

    useEffect(() => {
        if (!currentUserId) return;

        const channel = supabase.channel("global-presence-v2", {
            config: {
                presence: {
                    key: currentUserId,
                },
            },
        });

        const handleSync = () => {
            const state = channel.presenceState();
            console.log("Presence Provider: Syncing state", state);
            const activeIds = new Set<string>(Object.keys(state));
            setOnlineUsers(activeIds);
        };

        channel
            .on("presence", { event: "sync" }, handleSync)
            .on("presence", { event: "join" }, ({ key }) => {
                console.log("Presence Provider: User joined", key);
                handleSync();
            })
            .on("presence", { event: "leave" }, ({ key }) => {
                console.log("Presence Provider: User left", key);
                handleSync();
            })
            .subscribe(async (status) => {
                if (status === "SUBSCRIBED") {
                    console.log("Presence Provider: Subscribed, tracking", currentUserId);
                    await channel.track({
                        online_at: new Date().toISOString(),
                    });
                }
            });

        // Heartbeat to keep presence alive
        const interval = setInterval(async () => {
            if (channel.state === 'joined') {
                await channel.track({
                    online_at: new Date().toISOString(),
                });
            }
        }, 30000);

        return () => {
            clearInterval(interval);
            supabase.removeChannel(channel);
        };
    }, [currentUserId]);

    const isOnline = (userId: string) => onlineUsers.has(userId);

    return (
        <PresenceContext.Provider value={{ onlineUsers, isOnline }}>
            {children}
        </PresenceContext.Provider>
    );
}
