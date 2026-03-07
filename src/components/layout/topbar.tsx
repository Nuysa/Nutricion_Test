"use client";

import { Bell, MessageSquare, Newspaper, Calendar, Check, Trash2, Info, Clock } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { useState, useEffect } from "react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { createClient } from "@/lib/supabase/client";

interface Notification {
    id: string;
    title: string;
    description: string;
    time: string;
    unread: boolean;
    type: 'message' | 'appointment' | 'blog' | 'system';
}

interface TopbarProps {
    userName?: string;
    userAvatar?: string;
    userRole?: string;
    currentUserId?: string;
    planType?: string;
}

const roleMap: Record<string, string> = {
    paciente: "Paciente",
    nutricionista: "Nutricionista",
    staff: "Personal",
    administrador: "Administrador",
};

export function Topbar({ userName: initialUserName = "Usuario", userAvatar: initialAvatar, userRole = "paciente", currentUserId = "", planType: initialPlanType }: TopbarProps) {
    const [userName, setUserName] = useState(initialUserName);
    const [userAvatar, setUserAvatar] = useState(initialAvatar);
    const [planType, setPlanType] = useState(initialPlanType);
    const searchParams = useSearchParams();
    const router = useRouter();
    const pathname = usePathname();
    const currentView = searchParams.get("view") || "resumen";

    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadNotifCount, setUnreadNotifCount] = useState(0);

    // Initial load and hydration
    useEffect(() => {
        if (!currentUserId) return;

        const notifKey = `nutrigo_notifications_${currentUserId}`;
        const stored = localStorage.getItem(notifKey);
        const unreadMsgCount = parseInt(localStorage.getItem("nutrigo_total_unread") || "0");

        if (stored) {
            const parsed = JSON.parse(stored);
            setNotifications(parsed);
            setUnreadNotifCount(parsed.filter((n: Notification) => n.unread).length);
        } else {
            // Realistic default notifications
            const defaults: Notification[] = [
                {
                    id: "sys-01",
                    type: 'system',
                    title: "¡Bienvenido a NuySa!",
                    description: "Tu espacio de nutrición inteligente ya está activo.",
                    time: "Hace 10 min",
                    unread: true
                }
            ];

            // If there are real messages unread, add a real notification for them
            if (unreadMsgCount > 0) {
                defaults.unshift({
                    id: "msg-init",
                    type: 'message',
                    title: "Mensajes Pendientes",
                    description: `Tienes ${unreadMsgCount} mensajes sin leer en tu chat.`,
                    time: "Ahora",
                    unread: true
                });
            }

            setNotifications(defaults);
            setUnreadNotifCount(defaults.filter(n => n.unread).length);
            localStorage.setItem(notifKey, JSON.stringify(defaults));
        }
    }, [currentUserId]);

    // Notification Handlers
    const addNotification = (title: string, description: string, type: Notification['type']) => {
        const newNotif: Notification = {
            id: Date.now().toString(),
            title,
            description,
            type,
            time: "Ahora",
            unread: true
        };
        setNotifications(prev => {
            const updated = [newNotif, ...prev].slice(0, 20); // Keep last 20
            if (currentUserId) {
                localStorage.setItem(`nutrigo_notifications_${currentUserId}`, JSON.stringify(updated));
            }
            setUnreadNotifCount(updated.filter(n => n.unread).length);
            return updated;
        });
    };

    const markAsRead = (id: string) => {
        setNotifications(prev => {
            const updated = prev.map(n => n.id === id ? { ...n, unread: false } : n);
            if (currentUserId) {
                localStorage.setItem(`nutrigo_notifications_${currentUserId}`, JSON.stringify(updated));
            }
            setUnreadNotifCount(updated.filter(n => n.unread).length);
            return updated;
        });
    };

    const markAllAsRead = () => {
        setNotifications(prev => {
            const updated = prev.map(n => ({ ...n, unread: false }));
            if (currentUserId) {
                localStorage.setItem(`nutrigo_notifications_${currentUserId}`, JSON.stringify(updated));
            }
            setUnreadNotifCount(0);
            return updated;
        });
    };

    const clearAll = () => {
        setNotifications([]);
        setUnreadNotifCount(0);
        if (currentUserId) {
            localStorage.setItem(`nutrigo_notifications_${currentUserId}`, JSON.stringify([]));
        }
    };

    // Listeners for real events
    useEffect(() => {
        // HARD RESET: Clear all old nutrigo_ keys once to move to clean V8 data
        const resetKey = "nutrigo_hard_reset_v8";
        if (!localStorage.getItem(resetKey)) {
            Object.keys(localStorage).forEach(key => {
                if (key.startsWith("nutrigo_")) {
                    localStorage.removeItem(key);
                }
            });
            localStorage.setItem(resetKey, "true");
            // Reload to ensure all components see the clean state
            window.location.reload();
            return;
        }

        // 1. Blog events
        const blogChannel = new BroadcastChannel('nutrigo_blog_sync');
        blogChannel.onmessage = (event) => {
            if (event.data.type === 'BLOG_UPDATED') {
                addNotification("Blog Actualizado", "Hay nuevo contenido disponible en la sección de Blog.", "blog");
            }
        };

        // 2. Global Chat Sync Events (Notifications + Real-time counts)
        const globalChannel = new BroadcastChannel('nutrigo_global_sync');

        // Supabase Realtime for global multi-device sync
        const supabase = createClient();
        const msgSync = supabase
            .channel('global_notifications_realtime')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${currentUserId}`
                },
                async (payload) => {
                    const newMsg = payload.new;
                    if (newMsg.sender_id === currentUserId) return;

                    // Fetch sender name for better notification
                    const { data: senderProfile } = await supabase
                        .from("profiles")
                        .select("full_name")
                        .eq("id", newMsg.sender_id)
                        .single();

                    addNotification(
                        `Nuevo Mensaje de ${senderProfile?.full_name || "Usuario"}`,
                        newMsg.content || "Has recibido un archivo.",
                        "message"
                    );

                    // Trigger Sidebar Refresh
                    window.dispatchEvent(new CustomEvent("nutrigo-unread-refresh"));
                    // Global Broadcast for Chat UI
                    window.dispatchEvent(new CustomEvent("nutrigo-chat-refresh", { detail: newMsg }));
                }
            )
            .subscribe();

        // 3. Profile events (Real-time Name/Avatar)
        const profileSync = supabase
            .channel('topbar_profile_realtime')
            .on(
                'postgres_changes',
                {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'profiles',
                    filter: `id=eq.${currentUserId}`
                },
                (payload) => {
                    const newProfile = payload.new;
                    console.log("Realtime: Profile updated", newProfile);
                    setUserName(newProfile.full_name);
                    setUserAvatar(newProfile.avatar_url);
                    if (newProfile.role === 'paciente') {
                        // We need to fetch plan_type from patients table as it's not in profiles
                        void (async () => {
                            const { data } = await supabase.from("patients").select("plan_type").eq("profile_id", currentUserId).single();
                            if (data) setPlanType(data.plan_type);
                        })();
                    }
                }
            )
            .subscribe();

        return () => {
            blogChannel.close();
            globalChannel.close();
            supabase.removeChannel(msgSync);
            supabase.removeChannel(profileSync);
        };
    }, [currentUserId]); // Removed pathname and presence logic

    const setView = (view: string) => {
        router.push(`/dashboard/paciente?view=${view}`);
    };

    const initials = userName
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    return (
        <header className="sticky top-0 z-30 bg-nutri-panel/80 backdrop-blur-xl border-b border-white/5">
            <div className="flex items-center justify-between h-20 px-4 lg:px-8">
                {/* Left: Greeting */}
                <div className="hidden sm:block">
                    <h1 className="text-xl font-tech font-bold text-white tracking-tight">
                        Hola, {pathname.startsWith("/dashboard/nutricionista") ? `Lic. ${userName}` : userName.split(" ")[0]}! 👋
                    </h1>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                        Panel de {roleMap[userRole] || "Miembro"} <span className="mx-2 text-white/10">|</span> <span className="text-nutri-brand">NuySa Premium</span>
                    </p>
                </div>

                {/* Center: View Switcher Buttons (Only for Pacientes on Dashboard) */}
                {userRole === "paciente" && pathname === "/dashboard/paciente" && (
                    <div className="flex items-center bg-nutri-base/50 p-1 rounded-2xl mx-4 sm:mx-8 border border-white/5 shadow-inner">
                        <button
                            onClick={() => setView("resumen")}
                            className={cn(
                                "px-8 py-2.5 text-xs font-tech font-bold uppercase tracking-widest rounded-xl transition-all duration-300",
                                pathname === "/dashboard/paciente" && currentView === "resumen"
                                    ? "bg-nutri-brand text-white shadow-[0_0_20px_rgba(255,122,0,0.4)]"
                                    : "text-slate-500 hover:text-white hover:bg-white/5"
                            )}
                        >
                            Resumen
                        </button>
                        <button
                            onClick={() => setView("seguimiento")}
                            className={cn(
                                "px-8 py-2.5 text-xs font-tech font-bold uppercase tracking-widest rounded-xl transition-all duration-300",
                                pathname === "/dashboard/paciente" && currentView === "seguimiento"
                                    ? "bg-nutri-brand text-white shadow-[0_0_20px_rgba(255,122,0,0.4)]"
                                    : "text-slate-500 hover:text-white hover:bg-white/5"
                            )}
                        >
                            Seguimiento
                        </button>
                    </div>
                )}

                {/* Right: Notification + Avatar */}
                <div className="flex items-center gap-4">
                    <Popover>
                        <PopoverTrigger asChild>
                            <button className="relative p-2.5 rounded-xl hover:bg-white/5 transition-colors group border border-white/5">
                                <Bell className={cn("h-5 w-5 transition-all", unreadNotifCount > 0 ? "text-nutri-brand animate-swing" : "text-slate-400")} />
                                {unreadNotifCount > 0 && (
                                    <span className="absolute top-2 right-2 h-4 w-4 rounded-full bg-nutri-brand border-2 border-nutri-panel text-[8px] flex items-center justify-center font-black text-white">
                                        {unreadNotifCount}
                                    </span>
                                )}
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-[380px] p-0 rounded-3xl overflow-hidden border border-white/10 bg-nutri-panel shadow-2xl shadow-black/50" align="end">
                            <div className="p-5 bg-nutri-base/50 border-b border-white/5 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Bell className="h-4 w-4 text-nutri-brand" />
                                    <h4 className="font-tech font-bold text-sm uppercase tracking-widest text-white">Notificaciones</h4>
                                </div>
                                <div className="flex gap-2">
                                    <Button variant="ghost" size="sm" onClick={markAllAsRead} className="h-8 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:text-nutri-brand hover:bg-white/5">
                                        <Check className="h-3 w-3 mr-1.5" /> Todo Leído
                                    </Button>
                                    <Button variant="ghost" size="sm" onClick={clearAll} className="h-8 w-8 p-0 text-slate-500 hover:text-red-500 hover:bg-white/5">
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                            <ScrollArea className="h-[450px] bg-nutri-panel/50">
                                {notifications.length > 0 ? (
                                    <div className="divide-y divide-white/5">
                                        {notifications.map((notif) => (
                                            <div
                                                key={notif.id}
                                                className={cn(
                                                    "p-5 transition-colors cursor-pointer relative group/notif",
                                                    notif.unread ? "bg-white/5" : "bg-transparent opacity-60"
                                                )}
                                                onClick={() => markAsRead(notif.id)}
                                            >
                                                {notif.unread && (
                                                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-nutri-brand shadow-[0_0_10px_rgba(255,122,0,0.5)]" />
                                                )}
                                                <div className="flex gap-4">
                                                    <div className={cn(
                                                        "h-12 w-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform group-hover/notif:scale-105 border border-white/5",
                                                        notif.type === 'message' && "bg-blue-500/10 text-blue-400",
                                                        notif.type === 'blog' && "bg-nutri-brand/10 text-nutri-brand",
                                                        notif.type === 'appointment' && "bg-emerald-500/10 text-emerald-400",
                                                        notif.type === 'system' && "bg-slate-500/10 text-slate-400"
                                                    )}>
                                                        {notif.type === 'message' && <MessageSquare className="h-5 w-5" />}
                                                        {notif.type === 'blog' && <Newspaper className="h-5 w-5" />}
                                                        {notif.type === 'appointment' && <Calendar className="h-5 w-5" />}
                                                        {notif.type === 'system' && <Info className="h-5 w-5" />}
                                                    </div>
                                                    <div className="flex-1 space-y-1.5">
                                                        <div className="flex items-center justify-between">
                                                            <p className={cn("text-xs font-tech font-bold uppercase tracking-tight", notif.unread ? "text-white" : "text-slate-400")}>
                                                                {notif.title}
                                                            </p>
                                                            <span className="text-[10px] font-medium text-slate-500 flex items-center gap-1">
                                                                <Clock className="h-3 w-3" />
                                                                {notif.time}
                                                            </span>
                                                        </div>
                                                        <p className="text-xs text-slate-400 font-medium leading-relaxed">
                                                            {notif.description}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="h-full flex flex-col items-center justify-center p-12 text-center opacity-30">
                                        <Bell className="h-16 w-16 mb-6 text-slate-500" />
                                        <p className="text-sm font-tech font-bold text-white uppercase tracking-widest">Sin Notificaciones</p>
                                        <p className="text-xs font-medium text-slate-500 mt-2">Todo en orden por aquí.</p>
                                    </div>
                                )}
                            </ScrollArea>
                            {notifications.length > 0 && (
                                <div className="p-4 bg-nutri-base/50 border-t border-white/5 text-center">
                                    <Button variant="ghost" className="w-full text-[10px] font-tech font-bold uppercase tracking-widest text-slate-500 hover:text-white h-9 hover:bg-white/5">
                                        Ver Historial Completo
                                    </Button>
                                </div>
                            )}
                        </PopoverContent>
                    </Popover>

                    <div className="flex items-center gap-4 pl-4 border-l border-white/10">
                        <div className="hidden md:block text-right">
                            <div className="text-sm font-tech font-bold text-white flex items-center gap-2 justify-end">
                                {userName}
                                <Badge variant="outline" className="text-[10px] py-0.5 px-2 uppercase font-tech font-black tracking-tighter border-nutri-brand/30 text-nutri-brand bg-nutri-brand/10">
                                    {roleMap[userRole] || userRole}
                                </Badge>
                                {userRole === 'paciente' && (
                                    <Badge className={cn(
                                        "text-[10px] py-0.5 px-2 uppercase font-tech font-black tracking-tighter border-none",
                                        planType === 'plan flexible' ? "bg-purple-500/20 text-purple-400" :
                                            planType === 'plan menu semanal' ? "bg-blue-500/20 text-blue-400" :
                                                "bg-white/10 text-slate-400"
                                    )}>
                                        {planType || 'Sin Plan'}
                                    </Badge>
                                )}
                            </div>
                            <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold mt-0.5">
                                {pathname.startsWith("/dashboard/nutricionista") ? "Especialista Nutrición" : "Activa v7.0"}
                            </p>
                        </div>
                        <Avatar className="h-11 w-11 border-2 border-white/10 shadow-[0_0_20px_rgba(0,0,0,0.3)] ring-2 ring-nutri-brand/20">
                            <AvatarImage src={userAvatar} alt={userName} className="object-cover" />
                            <AvatarFallback className="bg-nutri-brand text-white text-base font-tech font-black">
                                {initials}
                            </AvatarFallback>
                        </Avatar>
                    </div>
                </div>
            </div>
        </header>
    );
}
