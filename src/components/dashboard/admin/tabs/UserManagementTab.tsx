"use client";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
    Users, Shield, ShieldPlus
} from "lucide-react";
import { GlobalProfile } from "@/lib/messaging-service";
import { cn } from "@/lib/utils";

interface UserManagementTabProps {
    profiles: GlobalProfile[];
    onOpenCreateUser: () => void;
    onDeleteProfile: (id: string, name: string) => void;
}

export function UserManagementTab({
    profiles,
    onOpenCreateUser,
    onDeleteProfile
}: UserManagementTabProps) {
    const adminStaffProfiles = profiles
        .filter(p => p.role === "staff" || p.role === "administrador")
        .sort((a, b) => a.role === 'administrador' ? -1 : 1);

    return (
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-1">
                    <h2 className="text-3xl font-black text-white uppercase italic tracking-tight">Sistema de Gestión de Usuarios</h2>
                    <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-[10px]">Administra el acceso del personal y directivos.</p>
                </div>
                <Button
                    onClick={onOpenCreateUser}
                    className="bg-nutri-brand hover:bg-white text-nutri-base font-black px-8 py-6 rounded-2xl transition-all shadow-xl shadow-nutri-brand/20 uppercase tracking-widest text-xs"
                >
                    <ShieldPlus className="h-4 w-4 mr-2" /> Nuevo Usuario Administrativo
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {adminStaffProfiles.map(user => (
                    <Card key={user.id} className="nutri-panel border-none group hover:scale-[1.02] transition-transform overflow-hidden">
                        <div className="p-6 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <Avatar className="h-14 w-14 border-2 border-white/10 shadow-2xl">
                                        <AvatarFallback className="bg-white/5 text-white font-black text-lg">
                                            {user.name?.[0] || 'U'}
                                        </AvatarFallback>
                                    </Avatar>
                                    <div>
                                        <h3 className="font-black text-white text-lg tracking-tight uppercase italic">{user.name}</h3>
                                        <Badge className={cn(
                                            "p-0 bg-transparent font-black uppercase text-[9px] tracking-widest border-none",
                                            user.role === 'administrador' ? "text-red-400" : "text-nutri-brand"
                                        )}>
                                            {user.role}
                                        </Badge>
                                    </div>
                                </div>
                                <div className="bg-white/5 p-2 rounded-xl group-hover:bg-nutri-brand group-hover:text-nutri-base transition-colors">
                                    {user.role === 'administrador' ? <Shield className="h-4 w-4" /> : <Users className="h-4 w-4" />}
                                </div>
                            </div>

                            <div className="space-y-3 pt-4 border-t border-white/5">
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Email</span>
                                    <span className="text-xs text-white font-bold">{user.email || 'N/A'}</span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Estado de Cuenta</span>
                                    <Badge className="bg-green-500/10 text-green-400 font-black text-[8px] uppercase border-none px-2 h-5 flex items-center gap-1">
                                        <div className="h-1 w-1 bg-green-400 rounded-full animate-pulse" /> Activo
                                    </Badge>
                                </div>
                            </div>

                            <div className="flex gap-2 pt-2">
                                <Button variant="outline" className="flex-1 rounded-xl h-10 text-[10px] font-black uppercase border-white/5 bg-white/5 text-slate-400 hover:text-white" disabled>
                                    Logs
                                </Button>
                                <Button variant="outline" className="flex-1 rounded-xl h-10 text-[10px] font-black uppercase border-white/5 bg-white/5 text-slate-400 hover:text-red-400 hover:border-red-400/20"
                                    onClick={() => onDeleteProfile(user.id, user.name)}>
                                    Eliminar
                                </Button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        </div>
    );
}
