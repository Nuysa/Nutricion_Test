import React, { useState } from 'react';
import { X, Check, Ruler, User, Stethoscope, Apple, Camera } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { DashboardColumn, ClinicalVariable } from "@/lib/variables-service";
import { PhotoUploadGroup } from "./PhotoUploadGroup";

interface NewConsultationFormProps {
    date: string;
    setDate: (d: string) => void;
    editValues: any;
    setEditValues: (v: any) => void;
    extraData: Record<string, any>;
    setExtraData: (v: Record<string, any>) => void;
    onSave: () => void;
    onCancel: () => void;
    patientId: string;
    patientHeight: number;
    recordNumber: number;
    layout: DashboardColumn[];
    clinicalVariables: ClinicalVariable[];
    pendingAppointments?: any[];
    selectedAppointmentId?: string;
    setSelectedAppointmentId?: (id: string) => void;
}

export function NewConsultationForm({
    date, setDate, editValues, setEditValues, extraData, setExtraData, onSave, onCancel, patientId, patientHeight, recordNumber, layout, clinicalVariables,
    pendingAppointments, selectedAppointmentId, setSelectedAppointmentId
}: NewConsultationFormProps) {
    const [isUploadingPhoto, setIsUploadingPhoto] = React.useState(false);

    // Auto-calculate IMC
    const currentWeight = parseFloat((editValues.weight || '0').toString().replace(',', '.'));
    const imc = (currentWeight > 0 && patientHeight > 0)
        ? (currentWeight / ((patientHeight / 100) * (patientHeight / 100))).toFixed(1)
        : "--";

    const updateExtraData = (code: string, value: string) => {
        setExtraData({ ...extraData, [code.toUpperCase()]: value });
    };

    return (
        <div className="bg-[#151F32] border border-white/10 rounded-2xl sm:rounded-3xl p-4 sm:p-8 mb-8 relative overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-4">
            <div className="absolute top-0 right-0 bg-nutrition-500 text-white text-[8px] sm:text-[10px] font-black px-4 sm:px-6 py-1 sm:py-2 rounded-bl-2xl sm:rounded-bl-3xl tracking-widest uppercase">
                Nueva Medición N° {recordNumber}
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-6 mb-8 gap-4 sm:gap-6 border-b border-white/5 pb-8">
                <div className="flex items-center gap-3 sm:gap-4 bg-white/5 px-4 sm:px-6 py-2 sm:py-3 rounded-xl sm:rounded-2xl border border-white/5 w-full sm:w-auto">
                    <p className="text-slate-400 font-black text-[10px] sm:text-xs uppercase tracking-widest">Cita / Fecha:</p>
                    <select
                        value={selectedAppointmentId || ""}
                        onChange={e => {
                            const val = e.target.value;
                            if (val === "") {
                                setSelectedAppointmentId?.("");
                            } else {
                                const apt = pendingAppointments?.find(a => a.id === val);
                                if (apt) {
                                    setSelectedAppointmentId?.(apt.id);
                                    setDate(apt.appointment_date);
                                }
                            }
                        }}
                        className="bg-transparent text-white font-tech font-black border-none outline-none focus:ring-0 text-sm sm:text-base cursor-pointer flex-1 sm:flex-none appearance-none"
                    >
                        <option value="" className="bg-[#151F32]">Seleccionar Cita...</option>
                        {pendingAppointments?.map(apt => (
                            <option 
                                key={apt.id} 
                                value={apt.id} 
                                disabled={apt.isLinked}
                                className={cn("bg-[#151F32]", apt.isLinked ? "text-slate-600" : "text-white")}
                            >
                                {apt.appointment_date} - {apt.start_time.substring(0, 5)} {apt.isLinked ? "(Ya vinculada)" : `(${apt.modality})`}
                            </option>
                        ))}
                    </select>

                    {(!selectedAppointmentId || selectedAppointmentId === "") && (
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="text-nutrition-400 font-tech font-black bg-white/5 rounded-lg px-2 py-1 border-none outline-none focus:ring-0 text-xs sm:text-sm cursor-pointer ml-2"
                        />
                    )}
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <button
                        onClick={onCancel}
                        className="flex-1 md:flex-none text-slate-400 hover:text-white hover:bg-white/5 px-4 sm:px-6 py-3 rounded-xl sm:rounded-2xl transition-all font-black text-[10px] sm:text-xs uppercase tracking-widest border border-white/5"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onSave}
                        disabled={isUploadingPhoto}
                        className={cn(
                            "flex-1 md:flex-none px-6 sm:px-8 py-3 rounded-xl sm:rounded-2xl font-black text-[10px] sm:text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2 sm:gap-3 shadow-lg",
                            isUploadingPhoto
                                ? "bg-slate-700 text-slate-400 cursor-not-allowed opacity-50"
                                : "bg-nutrition-500 hover:bg-nutrition-600 text-white shadow-nutrition-500/20"
                        )}
                    >
                        <Check className="h-4 w-4" /> Guardar Registro
                    </button>
                </div>
            </div>

            <Tabs defaultValue="mediciones" className="w-full">
                <TabsList className="bg-white/5 p-1 rounded-2xl mb-4 border border-white/5 flex w-full max-w-md mx-auto shadow-2xl">
                    <TabsTrigger
                        value="mediciones"
                        className="flex-1 font-black text-[10px] uppercase tracking-widest py-3 rounded-xl data-[state=active]:bg-nutrition-500 data-[state=active]:text-white text-slate-400 transition-all"
                    >
                        <Ruler className="h-4 w-4 mr-2" /> Mediciones
                    </TabsTrigger>
                    <TabsTrigger
                        value="fotos"
                        className="flex-1 font-black text-[10px] uppercase tracking-widest py-3 rounded-xl data-[state=active]:bg-nutrition-500 data-[state=active]:text-white text-slate-400 transition-all"
                    >
                        <Camera className="h-4 w-4 mr-2" /> Fotos de Progreso
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="mediciones" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none">
                    <ScrollArea className="max-h-[700px]">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 pb-16 pr-6">
                            {/* Column 1: Peso e IMC */}
                            <div className="col-span-1 flex flex-col gap-4 sm:gap-6">
                                <div className="bg-white/[0.03] p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-white/5 shadow-inner focus-within:border-nutrition-500/50 transition-all group">
                                    <label className="block text-[8px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 sm:mb-2 group-focus-within:text-nutrition-400 transition-colors">Peso Actual (kg)</label>
                                    <input
                                        type="number" step="0.1" placeholder="0.0"
                                        value={editValues.weight || ''}
                                        onChange={e => setEditValues({ ...editValues, weight: e.target.value })}
                                        className="w-full text-3xl sm:text-4xl font-tech font-black text-white focus:outline-none transition-colors bg-transparent placeholder:text-white/10"
                                    />
                                </div>
                                <div className="bg-white/[0.01] p-4 sm:p-6 rounded-[1.5rem] sm:rounded-[2rem] border border-white/5 opacity-50 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 blur-3xl -mr-16 -mt-16" />
                                    <label className="block text-[8px] sm:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 sm:mb-2">IMC Auto-calculado</label>
                                    <div className="text-2xl sm:text-3xl font-tech font-black text-sky-400/60">{imc}</div>
                                </div>
                            </div>

                            {/* Column 2: Perímetros */}
                            <div className="col-span-1 bg-white/[0.03] p-6 rounded-[2rem] border border-white/5">
                                <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/10 rounded-lg"><Ruler className="h-4 w-4 text-blue-400" /></div>
                                    Perímetros
                                </h4>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                                    {layout.filter(l => l.section === 'perimeters').map(item => {
                                        const v = clinicalVariables.find(v => v.id === item.variable_id);
                                        const canonicalMap: Record<string, string> = {
                                            "Cintura Min.": "CINTURA_MINIMA",
                                            "Cintura Max.": "CINTURA_MAXIMA",
                                            "Cadera Max.": "CADERA_MAXIMA",
                                            "Muslo Max.": "MUSLO_MAXIMO"
                                        };
                                        const code = (v?.code || canonicalMap[item.header] || item.header.toUpperCase().replace(/\./g, '').replace(/\s+/g, '_')).toUpperCase();
                                        return (
                                            <div key={item.variable_id || item.header} className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">{item.header}</label>
                                                <input
                                                    type="number" placeholder="0.0"
                                                    value={extraData[code] || ''}
                                                    onChange={e => updateExtraData(code, e.target.value)}
                                                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-sm font-tech font-black text-white focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder:text-white/5"
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Column 3: Pliegues */}
                            <div className="col-span-1 bg-white/[0.03] p-6 rounded-[2rem] border border-white/5">
                                <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-3">
                                    <div className="p-2 bg-purple-500/10 rounded-lg"><User className="h-4 w-4 text-purple-400" /></div>
                                    Pliegues
                                </h4>
                                <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                                    {layout.filter(l => l.section === 'folds').map(item => {
                                        const v = clinicalVariables.find(v => v.id === item.variable_id);
                                        const canonicalMap: Record<string, string> = {
                                            "Muslo Med.": "MUSLO_MEDIAL"
                                        };
                                        const code = (v?.code || canonicalMap[item.header] || item.header.toUpperCase().replace(/\./g, '').replace(/\s+/g, '_')).toUpperCase();
                                        return (
                                            <div key={item.variable_id || item.header} className="space-y-1">
                                                <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">{item.header}</label>
                                                <input
                                                    type="number" placeholder="0.0"
                                                    value={extraData[code] || ''}
                                                    onChange={e => updateExtraData(code, e.target.value)}
                                                    className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-sm font-tech font-black text-white focus:ring-1 focus:ring-purple-500/50 outline-none transition-all placeholder:text-white/5"
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="col-span-1 flex flex-col gap-6">
                                {layout.filter(l => l.section === 'findings' || l.section === 'recommendations').map(item => {
                                    const v = clinicalVariables.find(v => v.id === item.variable_id);
                                    const isFinding = item.section === 'findings';
                                    const code = (v?.code || item.header.toUpperCase().replace(/\./g, '').replace(/\s+/g, '_')).toUpperCase();
                                    return (
                                        <div key={item.variable_id || item.header} className="bg-white/[0.03] p-6 rounded-[2rem] border border-white/5 flex-1 flex flex-col focus-within:border-white/10 transition-all group">
                                            <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-3 group-focus-within:text-white transition-colors">
                                                {isFinding ? (
                                                    <div className="p-2 bg-amber-500/10 rounded-lg"><Stethoscope className="h-4 w-4 text-amber-400" /></div>
                                                ) : (
                                                    <div className="p-2 bg-emerald-500/10 rounded-lg"><Apple className="h-4 w-4 text-emerald-400" /></div>
                                                )}
                                                {item.header}
                                            </label>
                                            <textarea
                                                placeholder={isFinding ? "Ej. Porcentaje de grasa elevado..." : "Ej. Realizar 5000 pasos diarios..."}
                                                value={extraData[code] || ''}
                                                onChange={e => updateExtraData(code, e.target.value)}
                                                className="w-full flex-1 bg-white/5 border border-white/5 rounded-2xl p-4 text-sm text-slate-300 focus:ring-1 focus:ring-white/10 outline-none resize-none min-h-[100px] placeholder:text-white/5"
                                            ></textarea>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </ScrollArea>
                </TabsContent>

                <TabsContent value="fotos" className="mt-0 animate-in fade-in slide-in-from-bottom-4 duration-500 outline-none">
                    <ScrollArea className="max-h-[700px]">
                        <div className="max-w-4xl mx-auto py-2 pb-20 pr-6">
                            <h3 className="text-xl font-black text-white uppercase tracking-tight mb-8">Registro Fotográfico de Consulta</h3>
                            <PhotoUploadGroup patientId={patientId} extraData={extraData} setExtraData={setExtraData} isUploadingPhoto={isUploadingPhoto} setIsUploadingPhoto={setIsUploadingPhoto} />
                        </div>
                    </ScrollArea>
                </TabsContent>
            </Tabs>
        </div>
    );
}
