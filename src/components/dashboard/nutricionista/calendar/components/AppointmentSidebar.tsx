"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar as CalendarIcon, Clock, Edit2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { monthNamesFull } from "../hooks/useNutritionistCalendar";

interface AppointmentSidebarProps {
    localAppts: any[];
    selectedDay: number | null;
    currentMonth: number;
    selectedAppts: any[];
    onEditAppt: (appt: any) => void;
}

export function AppointmentSidebar({
    localAppts,
    selectedDay,
    currentMonth,
    selectedAppts,
    onEditAppt
}: AppointmentSidebarProps) {
    const now = new Date();
    
    const getNextAppointment = () => {
        const y = now.getFullYear();
        const m = (now.getMonth() + 1).toString().padStart(2, '0');
        const d = now.getDate().toString().padStart(2, '0');
        const nowStr = `${y}-${m}-${d}`;
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        return localAppts
            .filter(a => {
                const aptDateStr = `${a.year}-${(a.month + 1).toString().padStart(2, '0')}-${a.day.toString().padStart(2, '0')}`;
                if (aptDateStr > nowStr) return a.status !== 'cancelada';
                if (aptDateStr === nowStr) {
                    const [h, min] = a.time.split(':').map(Number);
                    if (h > currentHour) return a.status !== 'cancelada';
                    if (h === currentHour && min >= currentMinute) return a.status !== 'cancelada';
                    return false;
                }
                return false;
            })
            .sort((a, b) => {
                const dateA = `${a.year}-${(a.month + 1).toString().padStart(2, '0')}-${a.day.toString().padStart(2, '0')}T${a.time}`;
                const dateB = `${b.year}-${(b.month + 1).toString().padStart(2, '0')}-${b.day.toString().padStart(2, '0')}T${b.time}`;
                return dateA.localeCompare(dateB);
            })[0];
    };

    const nextApt = getNextAppointment();

    return (
        <div className="space-y-8 h-full">
            {/* Upcoming List */}
            <Card className="rounded-[2.5rem] border-white/10 bg-white/[0.03] backdrop-blur-md shadow-2xl overflow-hidden border-none">
                <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 flex items-center gap-2">
                        <CalendarIcon className="h-3 w-3 text-nutrition-500" /> Próxima Cita
                    </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-0 space-y-6">
                    {nextApt ? (
                        <div key={nextApt.id} className="flex gap-5 group relative">
                            <div className="flex flex-col items-center">
                                <div className="h-10 w-10 rounded-[1rem] bg-white/[0.05] border border-white/10 flex flex-col items-center justify-center group-hover:bg-nutrition-500/20 group-hover:border-nutrition-500/30 transition-all">
                                    <span className="text-[9px] font-black uppercase text-nutrition-500 leading-none">{monthNamesFull[nextApt.month || 0].substring(0, 3)}</span>
                                    <span className="text-sm font-black text-white leading-none mt-1">{nextApt.day}</span>
                                </div>
                                <div className="w-px flex-1 bg-white/5 my-2" />
                            </div>
                            <div className="pb-6 flex-1">
                                <p className="text-sm font-black text-white group-hover:text-nutrition-400 transition-colors uppercase tracking-tight">{nextApt.patient}</p>
                                <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold mt-1">
                                    <span className="flex items-center gap-1.5"><Clock className="h-3 w-3 text-nutrition-500" /> {nextApt.time}</span>
                                    <span className="opacity-20">•</span>
                                    <span className="uppercase tracking-widest text-[8px]">{nextApt.type === 'virtual' ? '📹 Virtual' : '🏥 Presencial'}</span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="py-12 text-center opacity-40">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500">Sin citas próximas</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Day detail */}
            <Card className="rounded-[2.5rem] border-white/10 bg-white/[0.03] backdrop-blur-md shadow-2xl overflow-hidden border-none flex-1">
                <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-lg font-black text-white uppercase tracking-tight">
                        {selectedDay ? `${selectedDay} ${monthNamesFull[currentMonth].toLowerCase()}` : "Día seleccionado"}
                    </CardTitle>
                    {selectedAppts.length > 0 && (
                        <p className="text-[10px] font-black text-nutrition-500 uppercase tracking-widest">{selectedAppts.length} Cita(s) Programada(s)</p>
                    )}
                </CardHeader>
                <CardContent className="p-8 pt-4">
                    {selectedAppts.length === 0 ? (
                        <div className="text-center py-16 px-4">
                            <div className="h-12 w-12 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center mx-auto mb-4 opacity-40">
                                <Clock className="h-6 w-6 text-slate-500" />
                            </div>
                            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">Agenda disponible</p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {selectedAppts.map((apt) => (
                                <div 
                                    key={apt.id} 
                                    className={cn(
                                        "p-5 rounded-[1.5rem] border border-white/5 relative group/appt transition-all hover:bg-white/5",
                                        apt.type === "virtual" ? "bg-sky-500/5 hover:border-sky-500/20" : "bg-orange-500/5 hover:border-orange-500/20"
                                    )}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-8 w-8 border border-white/10 shadow-xl">
                                                <AvatarFallback className="bg-white/5 text-white text-[10px] font-black">
                                                    {apt.patient.split(" ").map((n: string) => n[0]).join("")}
                                                </AvatarFallback>
                                            </Avatar>
                                            <span className="text-xs font-black text-white uppercase tracking-tight">{apt.patient}</span>
                                        </div>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-white/5 sm:opacity-0 group-hover/appt:opacity-100 transition-all shadow-lg"
                                            onClick={() => onEditAppt(apt)}
                                        >
                                            <Edit2 className="h-3.5 w-3.5" />
                                        </Button>
                                    </div>
                                    <div className="flex items-center justify-between gap-3 mt-4">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-2">
                                                <Clock className="h-3 w-3 text-nutrition-500" />
                                                <span className="text-[10px] font-black text-slate-400">{apt.time}</span>
                                            </div>
                                            <Badge variant="outline" className="text-[8px] font-black uppercase tracking-widest border-white/5 bg-white/5 px-2 py-0.5 rounded-lg text-slate-500">
                                                {apt.type === "virtual" ? "📹 Virtual" : "🏥 Presencial"}
                                            </Badge>
                                        </div>
                                        <Badge className={cn(
                                            "text-[8px] px-2 py-0.5 rounded-lg uppercase font-black tracking-widest border-0",
                                            apt.status === "completada" ? "bg-green-500/20 text-green-400" :
                                            apt.status === "cancelada" ? "bg-red-500/20 text-red-400" :
                                            "bg-nutrition-500/20 text-nutrition-400"
                                        )}>
                                            {apt.status === "completada" ? "Completada" :
                                             apt.status === "cancelada" ? "Cancelada" : "Programada"}
                                        </Badge>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
