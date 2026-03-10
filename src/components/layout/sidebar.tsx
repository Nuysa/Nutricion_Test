"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Leaf,
    LayoutDashboard,
    Calendar,
    MessageSquare,
    BookOpen,
    Users,
    CreditCard,
    BarChart3,
    Settings,
    LogOut,
    Shield,
    Briefcase,
    Menu,
    X,
    LayoutGrid,
    LayoutTemplate,
    Salad,
    UtensilsCrossed,
    ChefHat
} from "lucide-react";
import { useState, useEffect } from "react";
import { MessagingService } from "@/lib/messaging-service";

interface NavItem {
    label: string;
    href: string;
    icon: React.ElementType;
    badge?: number;
}

const patientNav: NavItem[] = [
    { label: "Dashboard", href: "/dashboard/paciente", icon: LayoutDashboard },
    { label: "Historia Clínica", href: "/dashboard/paciente/medical-history", icon: Shield },
    { label: "Calendario", href: "/dashboard/paciente/calendar", icon: Calendar },
    { label: "Plan Nutricional", href: "/dashboard/paciente/meal-plan", icon: Salad as any },
    { label: "Mensajes", href: "/dashboard/paciente/messages", icon: MessageSquare },
    { label: "Blog", href: "/dashboard/paciente/blog", icon: BookOpen },
    { label: "Suscripción", href: "/dashboard/paciente/subscription", icon: CreditCard },
];

const nutritionistNav: NavItem[] = [
    { label: "Dashboard", href: "/dashboard/nutricionista", icon: LayoutDashboard },
    { label: "Mis Pacientes", href: "/dashboard/nutricionista/patients", icon: Users },
    { label: "Calendario", href: "/dashboard/nutricionista/calendar", icon: Calendar },
    { label: "Mensajes", href: "/dashboard/nutricionista/messages", icon: MessageSquare },
    { label: "Planes", href: "/dashboard/nutricionista/plans", icon: UtensilsCrossed as any },
    { label: "Blog", href: "/dashboard/nutricionista/blog", icon: BookOpen },
];

const staffNav: NavItem[] = [
    { label: "Dashboard", href: "/dashboard/staff", icon: LayoutDashboard },
    { label: "Métricas", href: "/dashboard/staff/metrics", icon: BarChart3 },
    { label: "Mensajes", href: "/dashboard/staff/messages", icon: MessageSquare },
];



const adminNav: NavItem[] = [
    { label: "Dashboard", href: "/dashboard/administrador", icon: LayoutDashboard },
    { label: "Métricas", href: "/dashboard/administrador/metrics", icon: BarChart3 },
    { label: "Mensajes", href: "/dashboard/administrador/messages", icon: MessageSquare },
    { label: "Gestión de Planes", href: "/dashboard/administrador/gestion-planes", icon: CreditCard },
    { label: "Gestión Web Pública", href: "/dashboard/administrador/planes", icon: LayoutTemplate },
    { label: "Gestión Web Login", href: "/dashboard/administrador/auth-cms", icon: Shield },
    { label: "Base de Alimentos", href: "/dashboard/administrador/food-database", icon: Salad as any },
    { label: "Plantilla Recetas", href: "/dashboard/administrador/recipe-templates", icon: ChefHat },
    { label: "Configuración Variables", href: "/dashboard/administrador/settings", icon: Settings },
    { label: "Configuración Tablas", href: "/dashboard/administrador/visualization", icon: LayoutGrid },
];


function getNavItems(pathname: string): NavItem[] {
    if (pathname.startsWith("/dashboard/nutricionista")) return nutritionistNav;
    if (pathname.startsWith("/dashboard/staff")) return staffNav;
    if (pathname.startsWith("/dashboard/administrador")) return adminNav;
    return patientNav;
}

export function Sidebar({ currentUserId: propUserId }: { currentUserId?: string }) {
    const pathname = usePathname();
    const router = useRouter();
    const [mobileOpen, setMobileOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const supabase = createClient();

    const [currentUserId, setCurrentUserId] = useState<string>(propUserId || "");

    useEffect(() => {
        if (propUserId) {
            setCurrentUserId(propUserId);
        } else {
            supabase.auth.getUser().then(({ data }) => {
                if (data.user) setCurrentUserId(data.user.id);
            });
        }
    }, [propUserId]);

    const refreshUnreadCount = async () => {
        if (!currentUserId) return;

        try {
            const { count, error } = await supabase
                .from("messages")
                .select("*", { count: 'exact', head: true })
                .eq("receiver_id", currentUserId)
                .eq("is_read", false);

            if (error) throw error;
            setUnreadCount(count || 0);
        } catch (err) {
            console.error("Error refreshing unread count:", err);
        }
    };

    useEffect(() => {
        if (!currentUserId) return;
        refreshUnreadCount();

        const globalChannel = new BroadcastChannel('nutrigo_global_sync');
        globalChannel.onmessage = () => refreshUnreadCount();

        // Supabase Realtime for instant badge update
        const msgSync = supabase
            .channel('sidebar_unread_realtime')
            .on(
                'postgres_changes',
                {
                    event: '*',
                    schema: 'public',
                    table: 'messages',
                    filter: `receiver_id=eq.${currentUserId}`
                },
                () => {
                    refreshUnreadCount();
                }
            )
            .subscribe();

        const poller = setInterval(refreshUnreadCount, 30000);

        return () => {
            globalChannel.close();
            supabase.removeChannel(msgSync);
            clearInterval(poller);
        };
    }, [currentUserId]);

    const navItems = getNavItems(pathname).map(item =>
        item.label === "Mensajes" ? { ...item, badge: unreadCount } : item
    );

    const handleLogout = async () => {
        await supabase.auth.signOut();
        router.push("/login");
        router.refresh();
    };

    const sidebarContent = (
        <div className="flex flex-col h-full bg-nutri-panel">
            <Link href="/" className="px-6 py-8 flex items-center gap-3 hover:opacity-80 transition-opacity border-b border-white/5">
                <div className="h-10 w-10 flex items-center justify-center">
                    <img src="/logo Nuysa.png" alt="NuySa Logo" className="h-full w-full object-contain" />
                </div>
                <span className="text-2xl font-black font-tech text-white tracking-tighter">Nuy<span className="text-nutri-brand">Sa</span></span>
            </Link>

            <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
                {navItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                                "flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-tech font-bold transition-all duration-300 border-l-4",
                                isActive
                                    ? "bg-nutri-brand/10 text-nutri-brand border-nutri-brand shadow-[0_0_20px_rgba(255,122,0,0.1)]"
                                    : "text-slate-400 border-transparent hover:bg-white/5 hover:text-white"
                            )}
                        >
                            <item.icon className={cn("h-5 w-5 flex-shrink-0", isActive ? "text-nutri-brand" : "text-slate-500")} />
                            <span>{item.label}</span>
                            {Boolean(item.badge && item.badge > 0) && (
                                <span
                                    className={cn(
                                        "ml-auto text-[10px] px-2 py-0.5 rounded-full font-black",
                                        isActive
                                            ? "bg-nutri-brand text-white"
                                            : "bg-red-500 text-white animate-pulse"
                                    )}
                                >
                                    {item.badge}
                                </span>
                            )}
                        </Link>
                    );
                })}

                <div className="pt-4 mt-4 border-t border-white/5">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-tech font-bold text-slate-500 hover:bg-red-500/10 hover:text-red-500 transition-all w-full border-l-4 border-transparent"
                    >
                        <LogOut className="h-5 w-5" />
                        <span>Cerrar Sesión</span>
                    </button>
                </div>
            </nav>
        </div>
    );

    return (
        <>
            <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-nutri-panel shadow-xl border border-white/10 text-white"
            >
                <Menu className="h-5 w-5" />
            </button>

            {mobileOpen && (
                <div
                    className="lg:hidden fixed inset-0 bg-black/80 backdrop-blur-sm z-40"
                    onClick={() => setMobileOpen(false)}
                />
            )}

            <aside
                className={cn(
                    "lg:hidden fixed top-0 left-0 z-50 h-screen w-64 bg-nutri-panel border-r border-white/5 transform transition-transform duration-300 no-print shadow-2xl",
                    mobileOpen ? "translate-x-0" : "-translate-x-full"
                )}
            >
                <button
                    onClick={() => setMobileOpen(false)}
                    className="absolute top-4 right-4 p-2 rounded-lg hover:bg-white/5 text-slate-400"
                >
                    <X className="h-5 w-5" />
                </button>
                {sidebarContent}
            </aside>

            <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-nutri-panel border-r border-white/5 no-print shadow-xl">
                {sidebarContent}
            </aside>
        </>
    );
}
