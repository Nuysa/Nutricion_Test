import React, { useEffect } from 'react';
import { X, Check, Ruler, User, Stethoscope, Apple, Edit, Trash2, Save, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { DashboardColumn, ClinicalVariable } from "@/lib/variables-service";

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
    patientName: string;
    recordNumber: number;
    layout: DashboardColumn[];
    clinicalVariables: ClinicalVariable[];
}

export function EditConsultationModal({
    isOpen, onClose, date, setDate, editValues, setEditValues,
    extraData, setExtraData, onSave, onDelete, patientHeight, patientName, recordNumber, layout, clinicalVariables
}: EditConsultationModalProps) {

    // Prevent body scroll when open
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "auto";
        }
        return () => {
            document.body.style.overflow = "auto";
        };
    }, [isOpen]);

    if (!isOpen) return null;

    // Auto-calculate IMC
    const currentWeight = parseFloat(editValues.weight?.toString().replace(',', '.') || '0');
    const imc = (currentWeight > 0 && patientHeight > 0)
        ? (currentWeight / ((patientHeight / 100) * (patientHeight / 100))).toFixed(1)
        : "--";

    const updateExtraData = (code: string, value: string) => {
        setExtraData({ ...extraData, [code]: value });
    };

    return (
        <div className="fixed inset-0 bg-[#0B1120]/80 backdrop-blur-xl z-[100] flex justify-center items-center p-4 overflow-y-auto animate-in fade-in duration-300">
            <div className="bg-[#151F32] w-full max-w-7xl rounded-[3rem] shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-white/10 relative my-auto animate-in zoom-in-95 slide-in-from-bottom-12 duration-500 overflow-hidden">

                {/* Decorative Elements */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-nutrition-500/50 to-transparent" />
                <div className="absolute top-0 right-0 w-64 h-64 bg-nutrition-500/5 blur-[100px] -mr-32 -mt-32" />

                {/* Header */}
                <div className="px-12 py-10 flex justify-between items-center border-b border-white/5 relative z-10">
                    <div className="flex items-center gap-8">
                        <div className="h-16 w-16 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-center text-nutrition-400 shadow-inner group">
                            <Edit className="h-8 w-8 group-hover:scale-110 transition-transform" />
                        </div>
                        <div>
                            <div className="flex items-center gap-4 mb-2">
                                <h2 className="text-3xl font-black text-white tracking-tight uppercase">Editar Consulta</h2>
                                <span className="bg-nutrition-500/10 text-nutrition-400 text-[10px] font-black px-4 py-1.5 rounded-full border border-nutrition-500/20 tracking-widest uppercase">
                                    N° {recordNumber}
                                </span>
                            </div>
                            <div className="flex items-center gap-6 text-slate-400">
                                <div className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-slate-500" />
                                    <span className="text-sm font-bold text-white uppercase tracking-tight">{patientName}</span>
                                </div>
                                <div className="h-4 w-px bg-white/10" />
                                <div className="flex items-center gap-3">
                                    <Calendar className="h-4 w-4 text-slate-500" />
                                    <input
                                        type="date"
                                        value={date}
                                        onChange={e => setDate(e.target.value)}
                                        className="bg-white/5 text-white text-sm font-tech font-black px-4 py-1.5 rounded-xl border border-white/5 outline-none focus:ring-1 focus:ring-nutrition-500/50 transition-all cursor-pointer"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="h-12 w-12 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/5"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>

                <div className="p-12 max-h-[75vh] overflow-y-auto custom-scrollbar relative z-10">
                    <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                        <div className="col-span-1 flex flex-col gap-8">
                            <div className="bg-white/[0.03] p-8 rounded-[2.5rem] border border-white/5 shadow-inner focus-within:border-nutrition-500/50 transition-all group">
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 group-focus-within:text-nutrition-400 transition-colors">Peso Actual (kg)</label>
                                <input
                                    type="number" step="0.1"
                                    value={editValues.weight || ''}
                                    onChange={e => setEditValues({ ...editValues, weight: e.target.value })}
                                    className="w-full text-5xl font-tech font-black text-white focus:outline-none transition-colors bg-transparent border-none p-0"
                                />
                            </div>
                            <div className="bg-white/[0.01] p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
                                <div className="absolute top-0 right-0 w-40 h-40 bg-sky-500/5 blur-3xl -mr-20 -mt-20 group-hover:bg-sky-500/10 transition-colors" />
                                <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">IMC Bio-Calculado</label>
                                <div className="text-4xl font-tech font-black text-sky-400/40 tracking-tighter">{imc}</div>
                                <div className="mt-4 h-1 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div className="h-full bg-sky-500/30 w-1/2" />
                                </div>
                            </div>
                        </div>

                        <div className="col-span-1 bg-white/[0.03] p-8 rounded-[2.5rem] border border-white/5">
                            <h4 className="text-xs font-black text-white uppercase tracking-widest mb-8 flex items-center gap-4">
                                <div className="h-10 w-10 bg-blue-500/10 rounded-xl flex items-center justify-center"><Ruler className="h-5 w-5 text-blue-400" /></div>
                                Perímetros (cm)
                            </h4>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                {layout.filter(l => l.section === 'perimeters').map(item => {
                                    const v = clinicalVariables.find(v => v.id === item.variable_id);
                                    return (
                                        <div key={item.variable_id || item.header} className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">{item.header}</label>
                                            <input
                                                type="number"
                                                value={v ? (extraData[v.code] || '') : ''}
                                                onChange={e => v && updateExtraData(v.code, e.target.value)}
                                                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm font-tech font-black text-white focus:ring-1 focus:ring-blue-500/50 outline-none transition-all"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="col-span-1 bg-white/[0.03] p-8 rounded-[2.5rem] border border-white/5">
                            <h4 className="text-xs font-black text-white uppercase tracking-widest mb-8 flex items-center gap-4">
                                <div className="h-10 w-10 bg-purple-500/10 rounded-xl flex items-center justify-center"><User className="h-5 w-5 text-purple-400" /></div>
                                Pliegues (mm)
                            </h4>
                            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
                                {layout.filter(l => l.section === 'folds').map(item => {
                                    const v = clinicalVariables.find(v => v.id === item.variable_id);
                                    return (
                                        <div key={item.variable_id || item.header} className="space-y-2">
                                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-widest block">{item.header}</label>
                                            <input
                                                type="number"
                                                value={v ? (extraData[v.code] || '') : ''}
                                                onChange={e => v && updateExtraData(v.code, e.target.value)}
                                                className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-3 text-sm font-tech font-black text-white focus:ring-1 focus:ring-purple-500/50 outline-none transition-all"
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        <div className="col-span-1 flex flex-col gap-8">
                            {layout.filter(l => l.section === 'findings' || l.section === 'recommendations').map(item => {
                                const v = clinicalVariables.find(v => v.id === item.variable_id);
                                const isFinding = item.section === 'findings';
                                return (
                                    <div key={item.variable_id || item.header} className="bg-white/[0.03] p-8 rounded-[2.5rem] border border-white/5 flex-1 flex flex-col focus-within:border-white/10 transition-all group">
                                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-5 flex items-center gap-4 group-focus-within:text-white transition-colors">
                                            {isFinding ? (
                                                <div className="h-10 w-10 bg-amber-500/10 rounded-xl flex items-center justify-center"><Stethoscope className="h-5 w-5 text-amber-400" /></div>
                                            ) : (
                                                <div className="h-10 w-10 bg-emerald-500/10 rounded-xl flex items-center justify-center"><Apple className="h-5 w-5 text-emerald-400" /></div>
                                            )}
                                            {item.header}
                                        </label>
                                        <textarea
                                            value={v ? (extraData[v.code] || '') : ''}
                                            onChange={e => v && updateExtraData(v.code, e.target.value)}
                                            className="w-full flex-1 bg-white/5 border border-white/5 rounded-[1.5rem] p-5 text-sm text-slate-300 focus:ring-1 focus:ring-white/10 outline-none resize-none min-h-[150px] custom-scrollbar"
                                        ></textarea>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>

                {/* Footer Controls */}
                <div className="px-12 py-10 border-t border-white/5 flex justify-between items-center relative z-10 bg-white/[0.01]">
                    <button
                        onClick={onDelete}
                        className="text-red-500/50 hover:text-red-400 hover:bg-red-500/5 px-8 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 border border-transparent hover:border-red-500/20"
                    >
                        <Trash2 className="h-4 w-4" /> Eliminar Registro
                    </button>
                    <div className="flex gap-6">
                        <button
                            onClick={onClose}
                            className="px-10 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-400 hover:text-white border border-white/10 hover:bg-white/5 transition-all"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={onSave}
                            className="px-12 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest text-white bg-nutrition-500 hover:bg-nutrition-600 shadow-2xl shadow-nutrition-500/40 transition-all flex items-center gap-3 active:scale-95"
                        >
                            <Save className="h-4 w-4" /> Guardar Cambios
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
