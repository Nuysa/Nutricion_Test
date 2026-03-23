"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { 
    Search, Trash2, Settings, Shield, ShieldPlus, User, Mail, ChevronUp, ChevronDown, Stethoscope,
    TrendingUp, Activity, Target
} from "lucide-react";
import { GlobalProfile } from "@/lib/messaging-service";
import { cn } from "@/lib/utils";

interface OverviewTabProps {
    profiles: GlobalProfile[];
    searchTerm: string;
    onSearchTermChange: (value: string) => void;
    expandedGroups: Record<string, boolean>;
    onExpandedGroupsChange: (groups: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
    currentAdminRole: string;
    onDeleteProfile: (id: string, name: string) => void;
    onSetSelectedPatientPlan: (profile: GlobalProfile | null) => void;
}

export function OverviewTab({
    profiles,
    searchTerm,
    onSearchTermChange,
    expandedGroups,
    onExpandedGroupsChange,
    currentAdminRole,
    onDeleteProfile,
    onSetSelectedPatientPlan
}: OverviewTabProps) {

    const nutritionistsCount = profiles.filter(p => p.role === "nutricionista").length;
    const patientsCount = profiles.filter(p => p.role === "paciente").length;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <Card className="col-span-2 border-white/5 bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] overflow-hidden shadow-2xl">
                <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 px-10 py-8 border-b border-white/5 bg-white/[0.02]">
                    <div>
                        <CardTitle className="font-black text-2xl uppercase tracking-tight text-white">Directorio Global</CardTitle>
                        <CardDescription className="text-slate-500 font-tech uppercase text-[10px] tracking-widest mt-1">Gestión centralizada de identidades</CardDescription>
                    </div>
                    <div className="relative w-full md:w-80">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                        <Input
                            placeholder="Buscar usuario o email..."
                            className="pl-12 rounded-2xl border-white/5 bg-white/5 h-12 text-white placeholder:text-slate-600 focus:ring-nutrition-500/50 transition-all focus:bg-white/10"
                            value={searchTerm}
                            onChange={(e) => onSearchTermChange(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="space-y-6">
                        {[
                            { title: "Administradores", role: "administrador", icon: Shield, color: "text-red-500" },
                            { title: "Staff Operativo", role: "staff", icon: ShieldPlus, color: "text-amber-500" },
                            { title: "Especialistas", role: "nutricionista", icon: Stethoscope, color: "text-nutrition-500" },
                            { title: "Comunidad de Pacientes", role: "paciente", icon: User, color: "text-blue-500" }
                        ].map((group) => {
                            const groupProfiles = profiles.filter(p =>
                                p.role === group.role &&
                                (p.name || '').toLowerCase().includes(searchTerm.toLowerCase())
                            );

                            if (groupProfiles.length === 0 && searchTerm === "") return null;

                            const isExpanded = expandedGroups[group.role];

                            return (
                                <div key={group.role} className="space-y-4">
                                    <button
                                        onClick={() => onExpandedGroupsChange((prev: any) => ({ ...prev, [group.role]: !prev[group.role] }))}
                                        className="w-full flex items-center justify-between gap-3 px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all group/header"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center bg-white/5", group.color)}>
                                                <group.icon className="h-5 w-5" />
                                            </div>
                                            <div className="text-left">
                                                <h3 className="font-black text-xs uppercase tracking-widest text-white leading-none">
                                                    {group.title}
                                                </h3>
                                                <span className="text-[10px] font-tech text-slate-500 uppercase tracking-tighter mt-1 block">
                                                    {groupProfiles.length} registros encontrados
                                                </span>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <Badge variant="outline" className="h-5 border-white/10 text-slate-500 text-[10px] font-black">{groupProfiles.length}</Badge>
                                            {isExpanded ? (
                                                <ChevronUp className="h-4 w-4 text-slate-500 group-hover/header:text-white transition-colors" />
                                            ) : (
                                                <ChevronDown className="h-4 w-4 text-slate-500 group-hover/header:text-white transition-colors" />
                                            )}
                                        </div>
                                    </button>

                                    {isExpanded && (
                                        <div className="grid grid-cols-1 gap-3 animate-in fade-in slide-in-from-top-2 duration-300 px-2">
                                            {groupProfiles.map(profile => (
                                                <div key={profile.id} className="flex items-center justify-between p-4 rounded-3xl border border-white/5 bg-slate-900/30 hover:bg-white/[0.05] transition-all group/item shadow-sm">
                                                    <div className="flex items-center gap-4">
                                                        <div className="relative">
                                                            <Avatar className="h-12 w-12 border-2 border-white/10 shadow-xl group-hover/item:border-nutrition-500/50 transition-colors">
                                                                <AvatarFallback className="bg-gradient-to-br from-slate-800 to-slate-900 text-white font-black">
                                                                    {(profile.name || "?").split(" ").map(n => n[0]).join("")}
                                                                </AvatarFallback>
                                                            </Avatar>
                                                            <div className={cn(
                                                                "absolute -bottom-1 -right-1 h-4 w-4 rounded-full border-2 border-slate-900",
                                                                (profile as any).status === "Activo" ? "bg-green-500" : "bg-amber-500"
                                                            )} />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <h4 className="font-black text-white text-sm tracking-tight">{profile.name}</h4>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <Mail className="h-3 w-3 text-slate-600" />
                                                                <p className="text-[11px] font-medium text-slate-500 truncate max-w-[180px]">
                                                                    {(currentAdminRole === 'administrador' || profile.role !== 'administrador')
                                                                        ? (profile.email || "Sin correo")
                                                                        : "• • • • • • • •"}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2">
                                                        {profile.role === 'paciente' && (
                                                            <Badge className={cn(
                                                                "text-[9px] font-black uppercase border-none px-2 h-5",
                                                                profile.planType === 'plan flexible' ? "bg-purple-500/20 text-purple-400" :
                                                                profile.planType === 'plan menu semanal' ? "bg-blue-500/20 text-blue-400" :
                                                                "bg-slate-500/20 text-slate-500"
                                                            )}>
                                                                {profile.planType || 'Sin Plan'}
                                                            </Badge>
                                                        )}
                                                        <div className="flex items-center bg-white/5 rounded-2xl p-1 opacity-0 group-hover/item:opacity-100 transition-all transform translate-x-2 group-hover/item:translate-x-0">
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 rounded-xl text-slate-500 hover:text-white hover:bg-white/10"
                                                                onClick={() => onSetSelectedPatientPlan(profile)}
                                                            >
                                                                <Settings className="h-4 w-4" />
                                                            </Button>
                                                            <Button
                                                                variant="ghost"
                                                                size="sm"
                                                                className="h-8 w-8 rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-500/10"
                                                                onClick={() => onDeleteProfile(profile.id, profile.name)}
                                                            >
                                                                <Trash2 className="h-4 w-4" />
                                                            </Button>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            <div className="space-y-6">
                <Card className="border-white/5 bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-2xl relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                        <TrendingUp className="h-24 w-24 text-white" />
                    </div>
                    <h3 className="font-black text-xs uppercase tracking-widest text-slate-500 mb-6">Resumen de Actividad</h3>
                    <div className="space-y-8">
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black text-white uppercase tracking-tighter">Especialistas</span>
                                <span className="text-xl font-black text-nutrition-500">{nutritionistsCount}</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-nutrition-500 rounded-full" style={{ width: `${(nutritionistsCount / (nutritionistsCount + patientsCount || 1)) * 100}%` }} />
                            </div>
                        </div>
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-[10px] font-black text-white uppercase tracking-tighter">Pacientes Activos</span>
                                <span className="text-xl font-black text-blue-500">{patientsCount}</span>
                            </div>
                            <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-blue-500 rounded-full" style={{ width: `${(patientsCount / (nutritionistsCount + patientsCount || 1)) * 100}%` }} />
                            </div>
                        </div>
                    </div>
                </Card>

                <Card className="border-white/5 bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] p-8 shadow-2xl">
                    <h3 className="font-black text-xs uppercase tracking-widest text-slate-500 mb-6">KPI Rápidos</h3>
                    <div className="space-y-4">
                        {[
                            { label: "Tasa de Retención", value: "94.2%", icon: Target, color: "text-emerald-500" },
                            { label: "Citas esta Semana", value: "128", icon: Activity, color: "text-purple-500" },
                        ].map((kpi, i) => (
                            <div key={i} className="flex items-center gap-4 p-4 rounded-3xl bg-white/[0.02] border border-white/5">
                                <div className={cn("h-10 w-10 rounded-2xl flex items-center justify-center bg-white/5", kpi.color)}>
                                    <kpi.icon className="h-5 w-5" />
                                </div>
                                <div>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter leading-none mb-1">{kpi.label}</p>
                                    <p className="text-lg font-black text-white leading-none">{kpi.value}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
        </div>
    );
}
