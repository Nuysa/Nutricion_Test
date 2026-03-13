import React, { useEffect } from 'react';
import { X, Check, Ruler, User, Stethoscope, Apple, Edit, Trash2, Save, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardColumn, ClinicalVariable } from "@/lib/variables-service";
import { PhotoUploadGroup } from "./PhotoUploadGroup";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
    DialogDescription
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface EditConsultationModalProps {
    isOpen: boolean;
    onClose: () => void;
    date: string;
    setDate: (d: string) => void;
    editValues: any;
    setEditValues: (v: any) => void;
    extraData: Record<string, any>;
    setExtraData: (v: Record<string, any>) => void;
    onSave: () => void;
    onDelete: () => void;
    patientHeight: number;
    patientId: string;
    patientName: string;
    recordNumber: number;
    layout: DashboardColumn[];
    clinicalVariables: ClinicalVariable[];
}

export function EditConsultationModal({
    isOpen, onClose, date, setDate, editValues, setEditValues,
    extraData, setExtraData, onSave, onDelete, patientId, patientHeight, patientName, recordNumber, layout, clinicalVariables
}: EditConsultationModalProps) {
    const [isUploadingPhoto, setIsUploadingPhoto] = React.useState(false);

    // Auto-calculate IMC
    const currentWeight = parseFloat(editValues.weight?.toString().replace(',', '.') || '0');
    const imc = (currentWeight > 0 && patientHeight > 0)
        ? (currentWeight / ((patientHeight / 100) * (patientHeight / 100))).toFixed(1)
        : "--";

    const updateExtraData = (code: string, value: string) => {
        setExtraData({ ...extraData, [code]: value });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-[95vw] max-w-7xl p-0 overflow-hidden border-none bg-slate-900/95 backdrop-blur-xl shadow-2xl h-[95vh] sm:h-auto sm:max-h-[90vh] flex flex-col rounded-[2rem] sm:rounded-[3rem]">
                <DialogHeader className="p-6 sm:p-10 border-b border-white/5 relative shrink-0">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 pr-12">
                        <div className="flex items-center gap-4 sm:gap-6">
                            <div className="h-12 w-12 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-center text-nutrition-400">
                                <Edit className="h-6 w-6" />
                            </div>
                            <div>
                                <div className="flex items-center gap-3 mb-1">
                                    <DialogTitle className="text-xl sm:text-2xl font-black text-white uppercase tracking-tight">
                                        Editar Consulta
                                    </DialogTitle>
                                    <Badge className="bg-nutrition-500/10 text-nutrition-400 text-[10px] font-black border-none px-3 h-5 uppercase tracking-widest">
                                        N° {recordNumber}
                                    </Badge>
                                </div>
                                <DialogDescription className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                                    Paciente: <span className="text-white">{patientName}</span>
                                </DialogDescription>
                            </div>
                        </div>
                        
                        <div className="flex items-center gap-3 bg-white/5 px-4 py-2 rounded-xl border border-white/5">
                            <Calendar className="h-4 w-4 text-slate-500" />
                            <input
                                type="date"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                className="bg-transparent text-white text-xs font-tech font-black outline-none focus:ring-0 cursor-pointer"
                            />
                        </div>
                    </div>
                </DialogHeader>

                <ScrollArea className="flex-1">
                    <div className="p-6 sm:p-10 lg:p-12">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {/* Column 1: Peso e IMC */}
                            <div className="col-span-1 flex flex-col gap-6">
                                <div className="bg-white/[0.03] p-6 rounded-[2rem] border border-white/5 shadow-inner focus-within:border-nutrition-500/50 transition-all group">
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 group-focus-within:text-nutrition-400 transition-colors">Peso Actual (kg)</label>
                                    <input
                                        type="number" step="0.1"
                                        value={editValues.weight || ''}
                                        onChange={e => setEditValues({ ...editValues, weight: e.target.value })}
                                        className="w-full text-4xl font-tech font-black text-white focus:outline-none transition-colors bg-transparent border-none p-0"
                                    />
                                </div>
                                <div className="bg-white/[0.01] p-6 rounded-[2rem] border border-white/5 relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 blur-3xl -mr-16 -mt-16 group-hover:bg-sky-500/10 transition-colors" />
                                    <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">IMC Bio-Calculado</label>
                                    <div className="text-3xl font-tech font-black text-sky-400/40 tracking-tighter">{imc}</div>
                                    <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-sky-500/30 w-1/2" />
                                    </div>
                                </div>
                            </div>

                            {/* Column 2: Perímetros */}
                            <div className="col-span-1 bg-white/[0.03] p-8 rounded-[2rem] border border-white/5">
                                <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-3">
                                    <div className="p-2 bg-blue-500/10 rounded-lg"><Ruler className="h-4 w-4 text-blue-400" /></div>
                                    Perímetros (cm)
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {layout.filter(l => l.section === 'perimeters').map(item => {
                                        const v = clinicalVariables.find(v => v.id === item.variable_id);
                                        return (
                                            <div key={item.variable_id || item.header} className="space-y-1">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-tight block">{item.header}</label>
                                                <input
                                                    type="number"
                                                    value={v ? (extraData[v.code] || '') : ''}
                                                    onChange={e => v && updateExtraData(v.code, e.target.value)}
                                                    className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-sm font-tech font-black text-white focus:ring-1 focus:ring-blue-500/50 outline-none transition-all"
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Column 3: Pliegues */}
                            <div className="col-span-1 bg-white/[0.03] p-8 rounded-[2rem] border border-white/5">
                                <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-3">
                                    <div className="p-2 bg-purple-500/10 rounded-lg"><User className="h-4 w-4 text-purple-400" /></div>
                                    Pliegues (mm)
                                </h4>
                                <div className="grid grid-cols-2 gap-4">
                                    {layout.filter(l => l.section === 'folds').map(item => {
                                        const v = clinicalVariables.find(v => v.id === item.variable_id);
                                        return (
                                            <div key={item.variable_id || item.header} className="space-y-1">
                                                <label className="text-[9px] font-black text-slate-500 uppercase tracking-tight block">{item.header}</label>
                                                <input
                                                    type="number"
                                                    value={v ? (extraData[v.code] || '') : ''}
                                                    onChange={e => v && updateExtraData(v.code, e.target.value)}
                                                    className="w-full bg-white/5 border border-white/5 rounded-xl px-3 py-2 text-sm font-tech font-black text-white focus:ring-1 focus:ring-purple-500/50 outline-none transition-all"
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Column 4: Hallazgos y Sugerencias */}
                            <div className="col-span-1 flex flex-col gap-6">
                                {layout.filter(l => l.section === 'findings' || l.section === 'recommendations').map(item => {
                                    const v = clinicalVariables.find(v => v.id === item.variable_id);
                                    const isFinding = item.section === 'findings';
                                    return (
                                        <div key={item.variable_id || item.header} className="bg-white/[0.03] p-6 rounded-[2rem] border border-white/5 flex-1 flex flex-col focus-within:border-white/10 transition-all group">
                                            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-4 flex items-center gap-3 group-focus-within:text-white transition-colors">
                                                {isFinding ? (
                                                    <div className="p-2 bg-amber-500/10 rounded-lg"><Stethoscope className="h-4 w-4 text-amber-400" /></div>
                                                ) : (
                                                    <div className="p-2 bg-emerald-500/10 rounded-lg"><Apple className="h-4 w-4 text-emerald-400" /></div>
                                                )}
                                                {item.header}
                                            </label>
                                            <textarea
                                                value={v ? (extraData[v.code] || '') : ''}
                                                onChange={e => v && updateExtraData(v.code, e.target.value)}
                                                className="w-full flex-1 bg-white/5 border border-white/5 rounded-2xl p-4 text-sm text-slate-300 focus:ring-1 focus:ring-white/10 outline-none resize-none min-h-[120px] custom-scrollbar"
                                            ></textarea>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Registro Fotográfico */}
                            <div className="col-span-1 lg:col-span-4 mt-4">
                                <PhotoUploadGroup patientId={patientId} extraData={extraData} setExtraData={setExtraData} isUploadingPhoto={isUploadingPhoto} setIsUploadingPhoto={setIsUploadingPhoto} />
                            </div>
                        </div>
                    </div>
                </ScrollArea>

                <DialogFooter className="p-6 sm:p-10 bg-slate-900 border-t border-white/5 flex flex-col sm:flex-row justify-between items-center gap-6 shrink-0">
                    <Button
                        variant="ghost"
                        onClick={onDelete}
                        className="w-full sm:w-auto text-red-500 hover:text-white hover:bg-red-500 px-8 h-12 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all border border-transparent hover:border-red-500/20"
                    >
                        <Trash2 className="h-4 w-4 mr-2" /> Eliminar Registro
                    </Button>
                    <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
                        <Button
                            variant="ghost"
                            onClick={onClose}
                            className="w-full sm:w-auto px-10 h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-white border border-white/10 hover:bg-white/5 transition-all"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={onSave}
                            disabled={isUploadingPhoto}
                            className={cn(
                                "w-full sm:w-auto px-12 h-12 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white transition-all flex items-center justify-center gap-3",
                                isUploadingPhoto
                                    ? "bg-slate-700 text-slate-400 cursor-not-allowed opacity-50"
                                    : "bg-nutrition-500 hover:bg-nutrition-600 shadow-2xl shadow-nutrition-500/40"
                            )}
                        >
                            <Save className="h-4 w-4" /> {isUploadingPhoto ? "Subiendo..." : "Guardar Cambios"}
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
