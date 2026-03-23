"use client";

import React from "react";
import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter,
    DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
    Select, 
    SelectContent, 
    SelectItem, 
    SelectTrigger, 
    SelectValue 
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";
import { cn } from "@/lib/utils";
import { monthNamesFull, timeSlots } from "../hooks/useNutritionistCalendar";

interface EditAppointmentDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    editingAppt: any;
    editValues: any;
    setEditValues: (v: any) => void;
    viewMonth: number;
    setViewMonth: (m: number) => void;
    viewYear: number;
    setViewYear: (y: number) => void;
    getOccupiedSlots: (date: string) => string[];
    isSlotPastOrBuffer: (slot: string, date: string, currentStatus?: string) => boolean;
    onSave: () => void;
}

export function EditAppointmentDialog({
    isOpen,
    onOpenChange,
    editingAppt,
    editValues,
    setEditValues,
    viewMonth,
    setViewMonth,
    viewYear,
    setViewYear,
    getOccupiedSlots,
    isSlotPastOrBuffer,
    onSave
}: EditAppointmentDialogProps) {
    const nowLocal = new Date();
    
    const nextMonth = () => {
        if (viewMonth === 11) { setViewMonth(0); setViewYear(viewYear + 1); }
        else setViewMonth(viewMonth + 1);
    };

    const prevMonth = () => {
        if (viewMonth === 0) { setViewMonth(11); setViewYear(viewYear - 1); }
        else setViewMonth(viewMonth - 1);
    };

    const occupiedSlots = getOccupiedSlots(editValues.date);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="w-[95vw] lg:max-w-4xl p-0 overflow-hidden border-none bg-slate-900/95 backdrop-blur-xl shadow-2xl h-auto max-h-[95vh] lg:h-[90vh] flex flex-col rounded-[2rem] sm:rounded-[2.5rem]">
                <DialogHeader className="p-6 sm:p-8 border-b border-white/5 shrink-0">
                    <DialogTitle className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">Editar Cita</DialogTitle>
                    <DialogDescription className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">
                        Ajustando detalles para <span className="text-nutrition-500">{editingAppt?.patient}</span>
                    </DialogDescription>
                </DialogHeader>

                <ScrollArea className="flex-1 overflow-y-auto">
                    <div className="flex flex-col lg:flex-row h-full">
                        {/* Left Side: MINI CALENDAR */}
                        <div className="flex-1 p-6 sm:p-8 lg:border-r border-white/5 bg-white/[0.02]">
                            <div className="flex items-center justify-between mb-8">
                                <div>
                                    <h3 className="text-lg font-black text-white uppercase tracking-tight">Selecciona Fecha</h3>
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1">Modificar día de la consulta</p>
                                </div>
                                <div className="flex items-center gap-2 bg-white/5 p-1.5 rounded-xl border border-white/10">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/10" 
                                        onClick={prevMonth}>
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <span className="text-[10px] font-black text-white uppercase tracking-widest min-w-[80px] text-center">{monthNamesFull[viewMonth]} {viewYear}</span>
                                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg text-slate-400 hover:text-white hover:bg-white/10"
                                        onClick={nextMonth}>
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>

                            <div className="grid grid-cols-7 gap-1 mb-2">
                                {["Lun", "Mar", "Mié", "Jue", "Vie", "Sáb", "Dom"].map(d => (
                                    <div key={d} className="text-center text-[9px] font-black text-slate-600 uppercase py-2 tracking-widest">{d}</div>
                                ))}
                            </div>
                            <div className="grid grid-cols-7 gap-1">
                                {(() => {
                                    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
                                    const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
                                    const offset = firstDay === 0 ? 6 : firstDay - 1;
                                    const cells = [];
                                    for (let i = 0; i < offset; i++) cells.push(<div key={`empty-${i}`} />);
                                    for (let d = 1; d <= daysInMonth; d++) {
                                        const dateStr = `${viewYear}-${String(viewMonth + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
                                        const isSelected = editValues.date === dateStr;
                                        const isToday = nowLocal.toISOString().split('T')[0] === dateStr;
                                        const todayStart = new Date(new Date().setHours(0,0,0,0));
                                        const targetDay = new Date(viewYear, viewMonth, d);
                                        let isPast = false;
                                        if (editValues.status === "programada") {
                                            isPast = targetDay < todayStart;
                                        } else if (editValues.status === "completada") {
                                            isPast = targetDay > todayStart;
                                        }
                                        
                                        cells.push(
                                            <button
                                                key={d}
                                                disabled={isPast}
                                                onClick={() => setEditValues({...editValues, date: dateStr})}
                                                className={cn(
                                                    "h-10 w-full rounded-xl text-xs font-black transition-all flex items-center justify-center relative group",
                                                    isSelected ? "bg-nutrition-500 text-white shadow-lg shadow-nutrition-500/20" : 
                                                    isToday ? "bg-nutrition-500/10 text-nutrition-400 border border-nutrition-500/20" :
                                                    isPast ? "text-slate-700 cursor-not-allowed opacity-20" : "text-slate-400 hover:bg-white/5 hover:text-white"
                                                )}
                                            >
                                                {d}
                                                {isSelected && <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white animate-in zoom-in" />}
                                            </button>
                                        );
                                    }
                                    return cells;
                                })()}
                            </div>

                            <div className="mt-8 space-y-4 pt-4 border-t border-white/5">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Modalidad</label>
                                        <Select value={editValues.type} onValueChange={(v: any) => setEditValues({ ...editValues, type: v })}>
                                            <SelectTrigger className="h-10 rounded-xl border-white/10 bg-white/5 text-white text-[10px] font-black uppercase tracking-widest">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-slate-900 border-white/10">
                                                <SelectItem value="virtual" className="text-[10px] font-black uppercase text-white">📹 Virtual</SelectItem>
                                                <SelectItem value="in-person" className="text-[10px] font-black uppercase text-white">🏥 Presencial</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Right Side: TIME SLOTS */}
                        <div className="w-full lg:w-[320px] p-6 sm:p-8 bg-slate-900/50 lg:bg-slate-900 border-t lg:border-t-0 lg:border-l border-white/5 flex flex-col lg:h-full">
                            <div className="mb-6 bg-white/5 p-4 rounded-2xl border border-white/5">
                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 block">Estado de la Cita</label>
                                <Select value={editValues.status} onValueChange={(v: any) => setEditValues({ ...editValues, status: v })}>
                                    <SelectTrigger className="h-10 rounded-xl border-white/10 bg-transparent text-white text-[10px] font-black uppercase tracking-widest">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent className="bg-slate-900 border-white/10">
                                        <SelectItem value="programada" className="text-[10px] font-black uppercase text-blue-400">Programar</SelectItem>
                                        <SelectItem value="completada" className="text-[10px] font-black uppercase text-green-400">Finalizado</SelectItem>
                                        <SelectItem value="cancelada" className="text-[10px] font-black uppercase text-red-400">Cancelada</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="mb-6">
                                <h3 className="text-lg font-black text-white uppercase tracking-tight">Horario</h3>
                                <p className="text-[11px] font-black text-slate-500 uppercase tracking-widest mt-1">Disponibilidad para {editValues.date}</p>
                            </div>

                            <div className="h-full flex flex-col">
                                <div className="grid grid-cols-2 gap-2 pb-8">
                                    {timeSlots.map(time => {
                                        const isReserved = occupiedSlots.includes(time);
                                        const isPastOrBuffer = isSlotPastOrBuffer(time, editValues.date, editValues.status);
                                        const isSelected = editValues.time === time;

                                        return (
                                            <button
                                                key={time}
                                                disabled={isReserved || isPastOrBuffer}
                                                className={cn(
                                                    "py-3 rounded-xl text-[10px] font-black transition-all border uppercase tracking-widest",
                                                    isSelected ? "bg-nutrition-500 border-nutrition-500 text-white shadow-xl shadow-white/10" :
                                                    (isReserved || isPastOrBuffer) ? "bg-white/[0.02] border-white/5 text-slate-700 cursor-not-allowed" :
                                                    "bg-white/5 border-white/5 text-slate-400 hover:border-nutrition-500/30 hover:bg-nutrition-500/5 hover:text-nutrition-400"
                                                )}
                                                onClick={() => setEditValues({ ...editValues, time })}
                                            >
                                                {time}
                                                {isReserved && <span className="block text-[7px] opacity-40 mt-0.5 uppercase">Ocupado</span>}
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter className="p-6 sm:p-8 bg-slate-900 border-t border-white/5 flex flex-row gap-3">
                    <Button 
                        variant="ghost" 
                        className="flex-1 h-12 rounded-xl font-black text-[10px] uppercase tracking-widest border border-white/5 hover:bg-white/5 text-slate-400" 
                        onClick={() => onOpenChange(false)}
                    >
                        Cancelar
                    </Button>
                    <Button 
                        className="flex-1 h-12 rounded-xl bg-green-600 hover:bg-green-700 text-white font-black uppercase tracking-widest text-[10px] gap-2 shadow-lg shadow-green-600/20" 
                        onClick={onSave}
                    >
                        <Save className="h-4 w-4" /> Guardar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
