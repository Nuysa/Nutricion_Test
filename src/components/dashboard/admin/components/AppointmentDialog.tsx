"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Calendar } from "@/components/ui/calendar";
import { 
    Clock, Video, UserCheck, ShieldCheck, ArrowRight, X, User
} from "lucide-react";
import { GlobalProfile } from "@/lib/messaging-service";
import { cn } from "@/lib/utils";

interface AppointmentDialogProps {
    isOpen: boolean;
    onOpenChange: (open: boolean) => void;
    nutritionists: GlobalProfile[];
    patients: GlobalProfile[];
    agendaNutriId: string | null;
    onAgendaNutriIdChange: (id: string | null) => void;
    agendaPatientId: string | null;
    onAgendaPatientIdChange: (id: string | null) => void;
    agendaDate: string;
    onAgendaDateChange: (date: string) => void;
    agendaTime: string;
    onAgendaTimeChange: (time: string) => void;
    agendaModality: 'presencial' | 'virtual';
    onAgendaModalityChange: (modality: 'presencial' | 'virtual') => void;
    timeSlots: string[];
    occupiedSlots: string[];
    isSlotPast: (time: string, date: string) => boolean;
    onConfirm: () => void;
    editingAppointmentId: string | null;
}

export function AppointmentDialog({
    isOpen,
    onOpenChange,
    nutritionists,
    patients,
    agendaNutriId,
    onAgendaNutriIdChange,
    agendaPatientId,
    onAgendaPatientIdChange,
    agendaDate,
    onAgendaDateChange,
    agendaTime,
    onAgendaTimeChange,
    agendaModality,
    onAgendaModalityChange,
    timeSlots,
    occupiedSlots,
    isSlotPast,
    onConfirm,
    editingAppointmentId
}: AppointmentDialogProps) {
    const selectedNutri = nutritionists.find(n => n.id === agendaNutriId);

    return (
        <Dialog open={isOpen} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-[100vw] h-[100vh] lg:max-w-6xl lg:h-[85vh] p-0 gap-0 overflow-hidden border-none bg-slate-950/95 backdrop-blur-2xl rounded-none lg:rounded-[3rem] shadow-[0_50px_100px_rgba(0,0,0,0.8)] font-tech">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-nutri-brand to-transparent opacity-50" />
                
                <DialogHeader className="p-6 lg:p-10 border-b border-white/5 bg-slate-950/50 backdrop-blur-md shrink-0 flex flex-row items-center justify-between">
                    <div className="space-y-1">
                        <DialogTitle className="text-3xl lg:text-4xl font-black text-white italic uppercase tracking-tighter flex items-center gap-4">
                            <div className="h-2 w-12 bg-nutri-brand rounded-full" />
                            {editingAppointmentId ? 'Editar Sesión' : 'Agendar Cita'}
                        </DialogTitle>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] ml-16">Sistema de Sincronización de Agenda Pro</p>
                    </div>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => onOpenChange(false)}
                        className="h-12 w-12 rounded-2xl bg-white/5 hover:bg-red-500/20 text-slate-500 hover:text-red-500 transition-all border border-white/5"
                    >
                        <X className="h-5 w-5" />
                    </Button>
                </DialogHeader>

                <ScrollArea className="flex-1 overflow-y-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-12 h-full lg:divide-x lg:divide-white/5">
                        {/* Sidebar: Configuración */}
                        <div className="lg:col-span-3 p-6 lg:p-8 space-y-8 bg-black/20">
                            {/* Nutricionista Select */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Especialista</label>
                                <div className="space-y-2">
                                    {nutritionists.map(n => (
                                        <button
                                            key={n.id}
                                            onClick={() => onAgendaNutriIdChange(n.id)}
                                            className={cn(
                                                "w-full p-4 rounded-2xl text-left border transition-all flex items-center gap-4 group",
                                                agendaNutriId === n.id 
                                                    ? "bg-white border-white text-nutri-base shadow-xl" 
                                                    : "bg-white/5 border-white/5 text-slate-400 hover:border-white/10"
                                            )}
                                        >
                                            <Avatar className="h-10 w-10 border border-white/10">
                                                <AvatarFallback className={cn("font-black text-xs", agendaNutriId === n.id ? "bg-slate-900 text-white" : "bg-white/5")}>
                                                    {n.name[0]}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div className="min-w-0">
                                                <p className="text-xs font-black uppercase italic truncate">{n.name}</p>
                                                <p className={cn("text-[8px] font-bold uppercase", agendaNutriId === n.id ? "text-slate-500" : "text-slate-600")}>Activo</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Paciente Select */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Paciente</label>
                                <ScrollArea className="h-48 rounded-2xl border border-white/5 bg-black/20 p-2">
                                    <div className="space-y-1">
                                        {patients.map(p => (
                                            <button
                                                key={p.id}
                                                onClick={() => onAgendaPatientIdChange(p.id)}
                                                className={cn(
                                                    "w-full p-3 rounded-xl text-left transition-all flex items-center gap-3",
                                                    agendaPatientId === p.id 
                                                        ? "bg-nutri-brand/10 text-nutri-brand border border-nutri-brand/30" 
                                                        : "hover:bg-white/5 text-slate-500"
                                                )}
                                            >
                                                <div className={cn("h-6 w-6 rounded-lg flex items-center justify-center text-[10px] font-black", agendaPatientId === p.id ? "bg-nutri-brand text-white" : "bg-white/5")}>
                                                    {p.name[0]}
                                                </div>
                                                <span className="text-[11px] font-black uppercase truncate">{p.name}</span>
                                            </button>
                                        ))}
                                    </div>
                                </ScrollArea>
                            </div>

                            {/* Modalidad */}
                            <div className="space-y-4">
                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Modalidad</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button
                                        onClick={() => onAgendaModalityChange('virtual')}
                                        className={cn(
                                            "flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all",
                                            agendaModality === 'virtual' ? "bg-nutri-brand text-nutri-base border-nutri-brand shadow-lg shadow-nutri-brand/20" : "bg-white/5 border-white/5 text-slate-500"
                                        )}
                                    >
                                        <Video className="h-5 w-5" />
                                        <span className="text-[8px] font-black uppercase">Virtual</span>
                                    </button>
                                    <button
                                        onClick={() => onAgendaModalityChange('presencial')}
                                        className={cn(
                                            "flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all",
                                            agendaModality === 'presencial' ? "bg-nutri-brand text-nutri-base border-nutri-brand shadow-lg shadow-nutri-brand/20" : "bg-white/5 border-white/5 text-slate-500"
                                        )}
                                    >
                                        <UserCheck className="h-5 w-5" />
                                        <span className="text-[8px] font-black uppercase">Presencial</span>
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Main Content: Calendar and Slots */}
                        <div className="lg:col-span-9 p-6 lg:p-10 flex flex-col items-center lg:items-start lg:flex-row gap-10 lg:gap-16">
                            {/* Calendar Section */}
                            <div className="w-full lg:w-auto flex flex-col items-center space-y-6">
                                <div className="flex flex-col items-center">
                                    <span className="text-[10px] font-black text-nutri-brand uppercase tracking-[0.3em] mb-4">Paso 1: Seleccionar Día</span>
                                    <Card className="p-8 bg-white/[0.03] border-white/10 rounded-[2.5rem] shadow-2xl backdrop-blur-md">
                                        <Calendar
                                            mode="single"
                                            selected={agendaDate ? new Date(agendaDate + 'T12:00:00') : undefined}
                                            onSelect={(d: Date | undefined) => {
                                                if (!d) return;
                                                const year = d.getFullYear();
                                                const month = String(d.getMonth() + 1).padStart(2, '0');
                                                const day = String(d.getDate()).padStart(2, '0');
                                                onAgendaDateChange(`${year}-${month}-${day}`);
                                            }}
                                            className="rounded-none font-tech"
                                            disabled={(date: Date) => {
                                                const today = new Date();
                                                today.setHours(0, 0, 0, 0);
                                                return date < today;
                                            }}
                                        />
                                    </Card>
                                </div>
                            </div>

                            {/* Slots Section */}
                            <div className="flex-1 w-full space-y-8">
                                <div className="flex flex-col">
                                    <span className="text-[10px] font-black text-nutri-brand uppercase tracking-[0.3em] mb-4">Paso 2: Elegir Turno</span>
                                    {!agendaDate ? (
                                        <div className="h-[410px] flex flex-col items-center justify-center text-center p-10 border-2 border-dashed border-white/5 rounded-[2.5rem] bg-white/[0.01]">
                                            <div className="h-16 w-16 rounded-full bg-white/5 flex items-center justify-center mb-6 opacity-20">
                                                <Clock className="h-8 w-8 text-white" />
                                            </div>
                                            <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.4em] max-w-[140px] leading-relaxed">
                                                Seleccione un día en el calendario para ver disponibilidad
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="h-[410px] flex flex-col bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-6 shadow-2xl relative">
                                            <div className="flex items-center justify-between mb-6">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none">Turnos</span>
                                                    <span className="text-sm font-black text-white italic">{agendaDate.split('-').reverse().join('/')}</span>
                                                </div>
                                                <Badge className="bg-nutri-brand/20 text-nutri-brand border-none px-3 py-1 rounded-full font-black text-[9px]">
                                                    {timeSlots.length - occupiedSlots.length} Libres
                                                </Badge>
                                            </div>

                                            <ScrollArea className="flex-1 pr-3 -mr-3">
                                                <div className="grid grid-cols-2 gap-3 pb-2">
                                                    {timeSlots.map(time => {
                                                        const isReserved = occupiedSlots.includes(time);
                                                        const isPastOrToday = isSlotPast(time, agendaDate);
                                                        const isSelected = agendaTime === time;
                                                        const [h] = time.split(':');

                                                        return (
                                                            <button
                                                                key={time}
                                                                disabled={isReserved || isPastOrToday}
                                                                onClick={() => onAgendaTimeChange(time)}
                                                                className={cn(
                                                                    "p-3.5 rounded-xl text-xs font-black transition-all border group relative overflow-hidden flex items-center justify-between",
                                                                    isSelected 
                                                                        ? "bg-white text-nutri-base border-white shadow-[0_10px_20px_rgba(255,255,255,0.1)] scale-[1.03] z-10" 
                                                                        : (isReserved || isPastOrToday) 
                                                                            ? "bg-white/[0.01] border-white/5 text-slate-700 cursor-not-allowed grayscale" 
                                                                            : "bg-white/5 border-white/5 text-slate-300 hover:border-nutri-brand/40 hover:bg-nutri-brand/10"
                                                                )}
                                                            >
                                                                <div className="flex flex-col items-start">
                                                                    <span className="leading-none">{time}</span>
                                                                    <span className={cn(
                                                                        "text-[7px] font-bold uppercase tracking-widest mt-1",
                                                                        isSelected ? "text-slate-500" : "text-slate-600"
                                                                    )}>
                                                                        {parseInt(h) < 12 ? 'MAÑANA' : 'TARDE'}
                                                                    </span>
                                                                </div>
                                                                {isReserved ? (
                                                                    <Badge className="bg-red-500/10 text-red-500 border-none text-[7px] tracking-widest px-1.5 py-0">OCUPADO</Badge>
                                                                ) : (
                                                                    <div className={cn("h-1.5 w-1.5 rounded-full", isSelected ? "bg-nutri-brand" : "bg-green-500/50")} />
                                                                )}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            </ScrollArea>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter className="p-6 border-t border-white/10 bg-slate-950/50 backdrop-blur-xl flex flex-row shrink-0 gap-4">
                    <div className="hidden lg:flex items-center gap-3 flex-1">
                        <div className="h-9 w-9 rounded-xl bg-white/5 flex items-center justify-center">
                            <ShieldCheck className="h-4 w-4 text-green-500" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[9px] font-black text-white uppercase tracking-widest leading-none">Cita Protegida</span>
                            <span className="text-[7px] font-bold text-slate-500 uppercase tracking-widest mt-1">Sincronización Cloud</span>
                        </div>
                    </div>
                    
                    <div className="flex items-center gap-3 w-full lg:w-auto">
                        <Button
                            variant="ghost"
                            onClick={() => onOpenChange(false)}
                            className="h-14 lg:h-16 px-8 rounded-2xl text-slate-400 font-black uppercase text-[10px] tracking-widest border border-white/5 hover:bg-white/5"
                        >
                            Cancelar
                        </Button>
                        <Button
                            className="flex-1 lg:flex-none h-14 lg:h-16 px-10 bg-nutri-brand text-nutri-base hover:bg-white transition-all font-black uppercase tracking-[0.3em] text-[11px] rounded-2xl shadow-[0_10px_30px_rgba(255,122,0,0.3)] hover:scale-[1.03] active:scale-95 disabled:opacity-20 group"
                            disabled={!agendaNutriId || !agendaPatientId || !agendaDate || !agendaTime}
                            onClick={onConfirm}
                        >
                            Confirmar Cita <ArrowRight className="h-4 w-4 ml-3 group-hover:translate-x-1.5 transition-transform" />
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
