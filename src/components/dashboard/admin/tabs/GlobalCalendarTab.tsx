"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Edit3, Trash2, Clock, ArrowRight } from "lucide-react";
import { GlobalProfile } from "@/lib/messaging-service";
import { cn } from "@/lib/utils";

interface GlobalCalendarTabProps {
    agendaView: "nutricionistas" | "historial";
    onAgendaViewChange: (view: "nutricionistas" | "historial") => void;
    activeNutris: GlobalProfile[];
    assignments: Record<string, string[]>;
    allAppointments: any[];
    todayStr: string;
    todayAppts: any[];
    onOpenAgendaDialog: (nutriId: string) => void;
    onEditAppointment: (apt: any) => void;
    onDeleteAppointment: (id: string) => void;
    getAppointmentStatus: (status: string, date: string, startTime: string) => { label: string; className: string };
}

export function GlobalCalendarTab({
    agendaView,
    onAgendaViewChange,
    activeNutris,
    assignments,
    allAppointments,
    todayStr,
    todayAppts,
    onOpenAgendaDialog,
    onEditAppointment,
    onDeleteAppointment,
    getAppointmentStatus
}: GlobalCalendarTabProps) {
    return (
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-8">
            <div className="xl:col-span-3 space-y-6">
                {/* Toggle View */}
                <div className="flex bg-white/5 p-1 rounded-2xl w-fit border border-white/5">
                    <button
                        onClick={() => onAgendaViewChange("nutricionistas")}
                        className={cn(
                            "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            agendaView === "nutricionistas" ? "bg-nutri-brand text-nutri-base shadow-lg shadow-nutri-brand/20" : "text-slate-500 hover:text-white"
                        )}
                    >
                        Nutricionistas
                    </button>
                    <button
                        onClick={() => onAgendaViewChange("historial")}
                        className={cn(
                            "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                            agendaView === "historial" ? "bg-nutri-brand text-nutri-base shadow-lg shadow-nutri-brand/20" : "text-slate-500 hover:text-white"
                        )}
                    >
                        Historial
                    </button>
                </div>

                {agendaView === "nutricionistas" ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {activeNutris.map(n => {
                            const count = Object.values(assignments).filter(nids => nids.includes(n.id)).length;
                            const apptsToday = allAppointments.filter(a => 
                                a.nutritionistId === n.id && 
                                a.date === todayStr
                            ).length;

                            return (
                                <Card key={n.id} className="relative bg-slate-900/40 border border-white/5 group hover:border-nutri-brand/30 transition-all duration-500 rounded-[2.5rem] overflow-hidden cursor-pointer"
                                    onClick={() => onOpenAgendaDialog(n.id)}
                                >
                                    <div className="absolute inset-0 bg-gradient-to-br from-nutri-brand/5 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                    <div className="p-8 flex flex-col items-center text-center space-y-6 relative">
                                        <div className="relative">
                                            <div className="absolute inset-0 bg-nutri-brand/20 blur-2xl rounded-full scale-0 group-hover:scale-110 transition-transform duration-700" />
                                            <Avatar className="h-24 w-24 border-2 border-white/10 shadow-2xl relative">
                                                <AvatarFallback className="bg-white/5 text-white font-black text-3xl uppercase italic">
                                                    {n.name[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="absolute -bottom-1 -right-1 h-7 w-7 bg-green-500 border-4 border-slate-950 rounded-full shadow-lg" />
                                        </div>
                                        
                                        <div>
                                            <h4 className="font-black text-white text-xl tracking-tight uppercase italic group-hover:text-nutri-brand transition-colors">{n.name}</h4>
                                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mt-2">{count} Pacientes Activos</p>
                                        </div>

                                        <div className="w-full flex items-center justify-between bg-white/[0.03] p-4 rounded-2xl border border-white/5 group-hover:border-white/10 transition-colors">
                                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Citas Hoy</span>
                                            <div className="flex items-center gap-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-nutri-brand animate-pulse" />
                                                <span className="text-lg font-black text-white">{apptsToday}</span>
                                            </div>
                                        </div>
                                    </div>
                                </Card>
                            );
                        })}
                    </div>
                ) : (
                    /* Historial View */
                    <Card className="bg-slate-900/40 border-white/5 rounded-[2.5rem] overflow-hidden border">
                        <CardHeader className="border-b border-white/5 py-8 px-10">
                            <div className="flex items-center justify-between">
                                <CardTitle className="font-black text-xl text-white uppercase tracking-tight">Historial de Citas</CardTitle>
                                <Badge className="bg-white/5 text-slate-400 border-white/5 font-black uppercase text-[10px] px-3 py-1 rounded-lg">
                                    {allAppointments.length} Registros
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <ScrollArea className="h-[600px]">
                                <div className="divide-y divide-white/5">
                                    {[...allAppointments]
                                        .sort((a,b) => (b.date + 'T' + b.startTime).localeCompare(a.date + 'T' + a.startTime))
                                        .map((apt) => (
                                        <div key={apt.id} className="p-8 hover:bg-white/[0.02] transition-all group">
                                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                                                <div className="flex items-center gap-5">
                                                    <Avatar className="h-12 w-12 border-2 border-white/10 shadow-xl">
                                                        <AvatarFallback className="bg-nutri-brand text-nutri-base font-black uppercase">
                                                            {apt.patientName?.[0] || 'P'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="space-y-1">
                                                        <div className="flex items-center gap-3">
                                                            <h4 className="font-black text-white text-base uppercase tracking-tight italic">{apt.patientName}</h4>
                                                            {(() => {
                                                                const { label, className } = getAppointmentStatus(apt.status, apt.date, apt.startTime);
                                                                return (
                                                                    <Badge className={cn("text-[8px] font-black uppercase border-none px-2 py-0.5", className)}>
                                                                        {label}
                                                                    </Badge>
                                                                );
                                                            })()}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-slate-400">
                                                            <span className="text-[10px] font-bold uppercase tracking-widest">Con: <span className="text-nutri-brand/80">{apt.nutritionistName}</span></span>
                                                            <div className="h-1 w-1 rounded-full bg-slate-700" />
                                                            <span className="text-[10px] font-bold uppercase tracking-widest">{apt.type}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center justify-between md:justify-end gap-10 w-full md:w-auto border-t md:border-none border-white/5 pt-4 md:pt-0">
                                                    <div className="flex items-center gap-6">
                                                        <div className="flex flex-col">
                                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Fecha</span>
                                                            <span className="text-[11px] font-black text-white italic">{apt.date?.split('-').reverse().join('/')}</span>
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Hora</span>
                                                            <span className="text-[11px] font-black text-white italic">{apt.startTime?.substring(0, 5)}</span>
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex items-center gap-2">
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-10 w-10 rounded-xl text-slate-500 hover:text-nutri-brand hover:bg-nutri-brand/10 transition-all font-tech"
                                                            onClick={() => onEditAppointment(apt)}
                                                        >
                                                            <Edit3 className="h-4 w-4" />
                                                        </Button>
                                                        <Button 
                                                            variant="ghost" 
                                                            size="icon" 
                                                            className="h-10 w-10 rounded-xl text-slate-500 hover:text-red-500 hover:bg-red-500/10 transition-all font-tech"
                                                            onClick={() => onDeleteAppointment(apt.id)}
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="space-y-8">
                {/* Global Today's Appointments List */}
                <Card className="rounded-[2.5rem] border-white/10 bg-slate-950/60 backdrop-blur-3xl shadow-[0_30px_100px_rgba(0,0,0,0.6)] overflow-hidden border flex flex-col h-[650px] sticky top-24">
                    <div className="px-8 py-10 pb-8 relative shrink-0">
                        <div className="absolute top-0 right-0 p-8">
                            <div className="h-14 w-14 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 rotate-12 group-hover:rotate-0 transition-all duration-500 shadow-xl">
                                <div className="h-7 w-7 text-nutri-brand font-black text-xl flex items-center justify-center italic">!</div>
                            </div>
                        </div>
                        <h3 className="text-3xl font-black text-white uppercase italic tracking-tighter">Agenda Hoy</h3>
                        <div className="flex flex-col gap-1 mt-2">
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">
                                {new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                            </p>
                            <div className="flex items-center gap-2 mt-4">
                                <Badge className="bg-nutri-brand/20 text-nutri-brand border-none font-black text-[9px] px-3 py-1 uppercase tracking-widest">
                                    {todayAppts.length} Globales
                                </Badge>
                                <div className="h-1 w-1 rounded-full bg-slate-700" />
                                <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Sincronizado</span>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-4 flex-1 overflow-hidden">
                        {todayAppts.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-center py-20 px-8 border-2 border-dashed border-white/5 rounded-[2.5rem] bg-white/[0.01]">
                                <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-6 opacity-40">
                                    <Clock className="h-8 w-8 text-slate-500" />
                                </div>
                                <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] max-w-[150px] mx-auto leading-relaxed">Sin consultas programadas para este momento</p>
                            </div>
                        ) : (
                            <ScrollArea className="h-full pr-4">
                                <div className="space-y-4 pb-10">
                                    {[...todayAppts]
                                        .sort((a,b) => a.startTime.localeCompare(b.startTime))
                                        .map((apt) => (
                                        <div key={apt.id} className="relative group p-5 rounded-[2rem] bg-white/[0.02] border border-white/5 hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300">
                                            <div className="flex items-center gap-3 mb-4">
                                                <div className="h-10 w-10 rounded-xl bg-slate-900 border border-white/10 flex items-center justify-center font-black text-xs text-white shrink-0">
                                                    {apt.patientName[0]}
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-black text-white uppercase tracking-tight break-words">{apt.patientName}</p>
                                                    <div className="flex items-center gap-2 mt-0.5">
                                                        <span className="text-[9px] font-bold text-slate-500 uppercase">Con: {apt.nutritionistName}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col gap-3">
                                                <div className="flex items-center justify-between gap-4">
                                                    <div className="flex items-center gap-2 min-w-0">
                                                    <div className="flex items-center gap-3 font-tech">
                                                        <div className="px-3 py-1.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2">
                                                            <span className="text-[10px] font-black text-white">
                                                                {apt.startTime.substring(0, 5)} - {apt.type === "virtual" ? 'VIRTUAL' : 'PRESENCIAL'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center justify-start">
                                                    {(() => {
                                                        const { label, className } = getAppointmentStatus(apt.status, apt.date, apt.startTime);
                                                        return (
                                                            <Badge className={cn("text-[8px] font-black uppercase border-none px-2.5 py-1 rounded-lg", className)}>
                                                                {label}
                                                            </Badge>
                                                        );
                                                    })()}
                                                </div>
                                            </div>
                                            
                                            {/* Indicator bar */}
                                            <div className={cn(
                                                "absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 rounded-r-full",
                                                apt.type === "virtual" ? "bg-sky-500" : "bg-orange-500"
                                            )} />
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}
