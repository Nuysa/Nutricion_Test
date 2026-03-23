"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
    Search, UserCheck, Trash2, ArrowRight, User, Stethoscope, Mail
} from "lucide-react";
import { GlobalProfile } from "@/lib/messaging-service";
import { cn } from "@/lib/utils";

interface AssignmentsTabProps {
    patients: GlobalProfile[];
    nutritionists: GlobalProfile[];
    assignments: Record<string, string[]>;
    onAssign: (patientId: string | null, nutriId: string | null) => void;
    onUnassign: (pid: string, nid: string) => void;
    searchP: string;
    onSearchPChange: (val: string) => void;
    searchN: string;
    onSearchNChange: (val: string) => void;
}

export function AssignmentsTab({
    patients,
    nutritionists,
    assignments,
    onAssign,
    onUnassign,
    searchP,
    onSearchPChange,
    searchN,
    onSearchNChange
}: AssignmentsTabProps) {
    const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
    const [selectedNutriId, setSelectedNutriId] = useState<string | null>(null);

    return (
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Pacientes Selection */}
                <Card className="border-white/5 bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden">
                    <CardHeader className="p-8 border-b border-white/5 bg-white/[0.02]">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-10 w-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                                <User className="h-5 w-5 text-blue-500" />
                            </div>
                            <CardTitle className="font-black text-xl uppercase tracking-tight text-white">Seleccionar Paciente</CardTitle>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder="Filtrar pacientes..."
                                className="pl-12 rounded-2xl border-white/5 bg-white/5 h-12 text-white placeholder:text-slate-600 focus:ring-blue-500/50"
                                value={searchP}
                                onChange={(e) => onSearchPChange(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                            {patients.map(p => (
                                <button
                                    key={p.id}
                                    onClick={() => setSelectedPatientId(p.id)}
                                    className={cn(
                                        "w-full flex items-center justify-between p-4 rounded-2xl border transition-all group",
                                        selectedPatientId === p.id 
                                            ? "bg-blue-500/10 border-blue-500/50" 
                                            : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05]"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 border border-white/10">
                                            <AvatarFallback className="bg-slate-800 text-white font-bold text-xs">
                                                {p.name.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="text-left">
                                            <p className="text-sm font-black text-white">{p.name}</p>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-tighter">{p.email}</p>
                                        </div>
                                    </div>
                                    {selectedPatientId === p.id && <div className="h-2 w-2 rounded-full bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]" />}
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Nutricionistas Selection */}
                <Card className="border-white/5 bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden">
                    <CardHeader className="p-8 border-b border-white/5 bg-white/[0.02]">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-10 w-10 rounded-xl bg-nutrition-500/10 flex items-center justify-center">
                                <Stethoscope className="h-5 w-5 text-nutrition-500" />
                            </div>
                            <CardTitle className="font-black text-xl uppercase tracking-tight text-white">Asignar a Especialista</CardTitle>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder="Filtrar especialistas..."
                                className="pl-12 rounded-2xl border-white/5 bg-white/5 h-12 text-white placeholder:text-slate-600 focus:ring-nutrition-500/50"
                                value={searchN}
                                onChange={(e) => onSearchNChange(e.target.value)}
                            />
                        </div>
                    </CardHeader>
                    <CardContent className="p-4">
                        <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 no-scrollbar">
                            {nutritionists.map(n => (
                                <button
                                    key={n.id}
                                    onClick={() => setSelectedNutriId(n.id)}
                                    className={cn(
                                        "w-full flex items-center justify-between p-4 rounded-2xl border transition-all group",
                                        selectedNutriId === n.id 
                                            ? "bg-nutrition-500/10 border-nutrition-500/50" 
                                            : "bg-white/[0.02] border-white/5 hover:bg-white/[0.05]"
                                    )}
                                >
                                    <div className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10 border border-white/10">
                                            <AvatarFallback className="bg-slate-800 text-white font-bold text-xs">
                                                {n.name.substring(0, 2).toUpperCase()}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="text-left">
                                            <p className="text-sm font-black text-white">{n.name}</p>
                                            <p className="text-[10px] text-slate-500 uppercase tracking-tighter">{n.email}</p>
                                        </div>
                                    </div>
                                    {selectedNutriId === n.id && <div className="h-2 w-2 rounded-full bg-nutrition-500 shadow-[0_0_10px_rgba(20,184,166,0.5)]" />}
                                </button>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Action Tool */}
            <div className="flex justify-center py-4">
                <Button 
                    size="lg"
                    disabled={!selectedPatientId || !selectedNutriId}
                    onClick={() => {
                        onAssign(selectedPatientId, selectedNutriId);
                        setSelectedPatientId(null);
                        setSelectedNutriId(null);
                    }}
                    className="rounded-2xl px-12 h-14 font-black uppercase tracking-widest bg-nutrition-600 hover:bg-nutrition-500 transition-all shadow-xl shadow-nutrition-600/20 disabled:opacity-30"
                >
                    Confirmar Asignación <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
            </div>

            {/* Current Assignments List */}
            <Card className="border-white/5 bg-slate-900/50 backdrop-blur-xl rounded-[2.5rem] shadow-2xl overflow-hidden mt-8">
                <CardHeader className="p-8 border-b border-white/5 bg-white/[0.02]">
                    <CardTitle className="font-black text-xl uppercase tracking-tight text-white">Relaciones Activas</CardTitle>
                    <CardDescription className="text-slate-500 font-tech uppercase text-[10px] tracking-widest mt-1">Sincronizado con Supabase</CardDescription>
                </CardHeader>
                <CardContent className="p-8">
                    <div className="space-y-4">
                        {nutritionists.map(nutri => {
                            const pIds = assignments[nutri.id] || [];
                            if (pIds.length === 0) return null;
                            return (
                                <div key={nutri.id} className="p-6 rounded-[2rem] bg-white/[0.02] border border-white/5">
                                    <div className="flex items-center gap-4 mb-4 pb-4 border-b border-white/5">
                                        <Avatar className="h-10 w-10">
                                            <AvatarFallback className="bg-nutrition-500 text-white font-black text-xs">{nutri.name[0]}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                            <h4 className="text-sm font-black text-white uppercase">{nutri.name}</h4>
                                            <p className="text-[10px] text-nutrition-500 font-bold uppercase tracking-widest">Especialista Responsable</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {pIds.map(pid => {
                                            const patient = patients.find(p => p.id === pid);
                                            if (!patient) return null;
                                            return (
                                                <div key={pid} className="flex items-center justify-between p-3 rounded-xl bg-white/5 group">
                                                    <div className="flex items-center gap-3">
                                                        <Avatar className="h-8 w-8">
                                                            <AvatarFallback className="bg-slate-700 text-white text-[10px]">{patient.name[0]}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-xs font-bold text-white">{patient.name}</span>
                                                    </div>
                                                    <Button 
                                                        variant="ghost" 
                                                        size="sm"
                                                        onClick={() => onUnassign(pid, nutri.id)}
                                                        className="h-8 w-8 rounded-lg text-slate-500 hover:text-red-500 hover:bg-red-500/10"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
