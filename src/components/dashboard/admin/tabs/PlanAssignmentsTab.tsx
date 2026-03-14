"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, Flame, Layout, Briefcase, Zap } from "lucide-react";
import { GlobalProfile } from "@/lib/messaging-service";
import { cn } from "@/lib/utils";

interface PlanAssignmentsTabProps {
    patients: GlobalProfile[];
    searchTerm: string;
    onSearchTermChange: (value: string) => void;
    selectedPatientPlan: string | null;
    onSelectedPatientPlanChange: (id: string | null) => void;
    newPlanType: 'plan flexible' | 'plan menu semanal';
    onNewPlanTypeChange: (type: 'plan flexible' | 'plan menu semanal') => void;
    onSetPlan: () => void;
}

export function PlanAssignmentsTab({
    patients,
    searchTerm,
    onSearchTermChange,
    selectedPatientPlan,
    onSelectedPatientPlanChange,
    newPlanType,
    onNewPlanTypeChange,
    onSetPlan
}: PlanAssignmentsTabProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <Card className="lg:col-span-2 rounded-[2.5rem] border-white/5 bg-white/[0.02] shadow-xl overflow-hidden h-[750px] flex flex-col">
                <CardHeader className="bg-white/5 py-8 border-b border-white/5 shrink-0 px-10">
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="font-black text-3xl uppercase tracking-tighter text-white italic">Motor de Protocolos</CardTitle>
                            <CardDescription className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Define la experiencia y herramientas de cada paciente.</CardDescription>
                        </div>
                        <div className="h-12 w-12 rounded-2xl bg-nutrition-500/10 flex items-center justify-center">
                            <Zap className="h-6 w-6 text-nutrition-500 animate-pulse" />
                        </div>
                    </div>
                    <div className="mt-8 relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-500" />
                        <Input
                            placeholder="Buscar paciente para configurar..."
                            className="h-14 bg-white/5 border-white/10 rounded-2xl font-bold placeholder:text-slate-700 pl-12 text-white"
                            value={searchTerm}
                            onChange={(e) => onSearchTermChange(e.target.value)}
                        />
                    </div>
                </CardHeader>
                <CardContent className="p-0 flex-1 min-h-0">
                    <ScrollArea className="h-full">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-10">
                            {patients.filter(p => !searchTerm || p.name.toLowerCase().includes(searchTerm.toLowerCase())).map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => onSelectedPatientPlanChange(selectedPatientPlan === p.id ? null : p.id)}
                                    className={cn(
                                        "w-full text-left p-6 rounded-[2rem] flex items-center justify-between transition-all border group relative overflow-hidden",
                                        selectedPatientPlan === p.id 
                                            ? "bg-white border-white text-slate-900 shadow-[0_20px_40px_rgba(255,255,255,0.1)] scale-[1.02] z-10" 
                                            : "bg-white/5 border-white/5 hover:border-white/10 text-slate-400"
                                    )}
                                >
                                    <div className="flex items-center gap-5">
                                        <Avatar className="h-14 w-14 border-2 border-white/10 shadow-lg">
                                            <AvatarFallback className={cn("text-lg font-black", selectedPatientPlan === p.id ? "bg-slate-900 text-white" : "bg-white/5")}>
                                                {p.name[0]}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="min-w-0">
                                            <p className="text-sm font-black uppercase italic tracking-tight">{p.name}</p>
                                            <Badge className={cn(
                                                "mt-2 text-[8px] font-black uppercase border-none px-2",
                                                p.planType === 'plan flexible' ? "bg-purple-500/10 text-purple-600" :
                                                    p.planType === 'plan menu semanal' ? "bg-blue-500/10 text-blue-600" :
                                                        "bg-slate-500/10 text-slate-500"
                                            )}>
                                                {p.planType || 'Sin Plan'}
                                            </Badge>
                                        </div>
                                    </div>
                                    <div className={cn(
                                        "h-3 w-3 rounded-full",
                                        selectedPatientPlan === p.id ? "bg-nutrition-600 animate-pulse" : "bg-white/5"
                                    )} />
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                </CardContent>
            </Card>

            <div className="space-y-8">
                <Card className="rounded-[2.5rem] border-white/5 bg-slate-900/50 backdrop-blur-xl shadow-2xl overflow-hidden border">
                    <CardHeader className="p-8">
                        <CardTitle className="font-black text-xl text-white uppercase italic tracking-tight">Acción de Plan</CardTitle>
                        <CardDescription className="text-slate-500 font-bold uppercase tracking-widest text-[9px]">Selecciona el nuevo protocolo de trabajo.</CardDescription>
                    </CardHeader>
                    <CardContent className="p-8 pt-0 space-y-6">
                        <div className="grid grid-cols-1 gap-4">
                            <button
                                onClick={() => onNewPlanTypeChange('plan flexible')}
                                className={cn(
                                    "p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-4 text-center",
                                    newPlanType === 'plan flexible' 
                                        ? "border-purple-500 bg-purple-500/10 text-white shadow-lg shadow-purple-500/20" 
                                        : "border-white/5 bg-white/5 text-slate-500 hover:border-white/10"
                                )}
                            >
                                <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center", newPlanType === 'plan flexible' ? "bg-purple-500/20" : "bg-white/5")}>
                                    <Flame className={cn("h-7 w-7", newPlanType === 'plan flexible' ? "text-purple-400" : "text-slate-600")} />
                                </div>
                                <div>
                                    <h4 className="font-black text-sm uppercase italic tracking-widest">Plan Flexible</h4>
                                    <p className="text-[10px] font-bold opacity-50 mt-1 uppercase">Libertad y Macronutrientes</p>
                                </div>
                            </button>

                            <button
                                onClick={() => onNewPlanTypeChange('plan menu semanal')}
                                className={cn(
                                    "p-6 rounded-3xl border-2 transition-all flex flex-col items-center gap-4 text-center",
                                    newPlanType === 'plan menu semanal' 
                                        ? "border-blue-500 bg-blue-500/10 text-white shadow-lg shadow-blue-500/20" 
                                        : "border-white/5 bg-white/5 text-slate-500 hover:border-white/10"
                                )}
                            >
                                <div className={cn("h-14 w-14 rounded-2xl flex items-center justify-center", newPlanType === 'plan menu semanal' ? "bg-blue-500/20" : "bg-white/5")}>
                                    <Layout className={cn("h-7 w-7", newPlanType === 'plan menu semanal' ? "text-blue-400" : "text-slate-600")} />
                                </div>
                                <div>
                                    <h4 className="font-black text-sm uppercase italic tracking-widest">Plan Menú Semanal</h4>
                                    <p className="text-[10px] font-bold opacity-50 mt-1 uppercase">Estructura y Comidas Fijas</p>
                                </div>
                            </button>
                        </div>

                        <Button
                            className="w-full h-16 rounded-[2rem] bg-nutrition-600 text-white font-black uppercase tracking-[0.3em] text-[10px] shadow-2xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-20 mt-4 group"
                            disabled={!selectedPatientPlan}
                            onClick={onSetPlan}
                        >
                            Actualizar Protocolo <Briefcase className="ml-3 h-4 w-4 group-hover:rotate-12 transition-transform" />
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
