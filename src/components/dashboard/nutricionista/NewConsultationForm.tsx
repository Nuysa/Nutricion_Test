import React from 'react';
import { X, Check, Ruler, User, Stethoscope, Apple } from "lucide-react";
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
}

export function NewConsultationForm({
    date, setDate, editValues, setEditValues, extraData, setExtraData, onSave, onCancel, patientId, patientHeight, recordNumber, layout, clinicalVariables
}: NewConsultationFormProps) {

    // Auto-calculate IMC
    const currentWeight = parseFloat(editValues.weight?.toString().replace(',', '.') || '0');
    const imc = (currentWeight > 0 && patientHeight > 0)
        ? (currentWeight / ((patientHeight / 100) * (patientHeight / 100))).toFixed(1)
        : "--";

    const updateExtraData = (code: string, value: string) => {
        setExtraData({ ...extraData, [code]: value });
    };

    return (
        <div className="bg-[#151F32] border border-white/10 rounded-3xl p-8 mb-8 relative overflow-hidden shadow-2xl animate-in fade-in slide-in-from-top-4">
            <div className="absolute top-0 right-0 bg-nutrition-500 text-white text-[10px] font-black px-6 py-2 rounded-bl-3xl tracking-widest uppercase">
                Nueva Medición N° {recordNumber}
            </div>

            <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-6 mb-8 gap-6 border-b border-white/5 pb-8">
                <div className="flex items-center gap-4 bg-white/5 px-6 py-3 rounded-2xl border border-white/5">
                    <p className="text-slate-400 font-black text-xs uppercase tracking-widest">Fecha Registro:</p>
                    <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="text-white font-tech font-black bg-transparent border-none outline-none focus:ring-0 text-lg cursor-pointer"
                    />
                </div>
                <div className="flex gap-4 w-full md:w-auto">
                    <button
                        onClick={onCancel}
                        className="flex-1 md:flex-none text-slate-400 hover:text-white hover:bg-white/5 px-6 py-3 rounded-2xl transition-all font-black text-xs uppercase tracking-widest border border-white/5"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onSave}
                        className="flex-1 md:flex-none bg-nutrition-500 hover:bg-nutrition-600 text-white px-8 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-3 shadow-lg shadow-nutrition-500/20"
                    >
                        <Check className="h-4 w-4" /> Guardar Registro
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                <div className="col-span-1 flex flex-col gap-6">
                    <div className="bg-white/[0.03] p-6 rounded-[2rem] border border-white/5 shadow-inner focus-within:border-nutrition-500/50 transition-all group">
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 group-focus-within:text-nutrition-400 transition-colors">Peso Actual (kg)</label>
                        <input
                            type="number" step="0.1" placeholder="0.0"
                            value={editValues.weight || ''}
                            onChange={e => setEditValues({ ...editValues, weight: e.target.value })}
                            className="w-full text-4xl font-tech font-black text-white focus:outline-none transition-colors bg-transparent placeholder:text-white/10"
                        />
                    </div>
                    <div className="bg-white/[0.01] p-6 rounded-[2rem] border border-white/5 opacity-50 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-sky-500/5 blur-3xl -mr-16 -mt-16" />
                        <label className="block text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">IMC Auto-calculado</label>
                        <div className="text-3xl font-tech font-black text-sky-400/60">{imc}</div>
                    </div>
                </div>

                <div className="col-span-1 bg-white/[0.03] p-6 rounded-[2rem] border border-white/5">
                    <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg"><Ruler className="h-4 w-4 text-blue-400" /></div>
                        Perímetros
                    </h4>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                        {layout.filter(l => l.section === 'perimeters').map(item => {
                            const v = clinicalVariables.find(v => v.id === item.variable_id);
                            return (
                                <div key={item.variable_id || item.header} className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">{item.header}</label>
                                    <input
                                        type="number" placeholder="0.0"
                                        value={v ? (extraData[v.code] || '') : ''}
                                        onChange={e => v && updateExtraData(v.code, e.target.value)}
                                        className="w-full bg-white/5 border border-white/5 rounded-xl px-4 py-2 text-sm font-tech font-black text-white focus:ring-1 focus:ring-blue-500/50 outline-none transition-all placeholder:text-white/5"
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="col-span-1 bg-white/[0.03] p-6 rounded-[2rem] border border-white/5">
                    <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-3">
                        <div className="p-2 bg-purple-500/10 rounded-lg"><User className="h-4 w-4 text-purple-400" /></div>
                        Pliegues
                    </h4>
                    <div className="grid grid-cols-2 gap-x-6 gap-y-5">
                        {layout.filter(l => l.section === 'folds').map(item => {
                            const v = clinicalVariables.find(v => v.id === item.variable_id);
                            return (
                                <div key={item.variable_id || item.header} className="space-y-1">
                                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">{item.header}</label>
                                    <input
                                        type="number" placeholder="0.0"
                                        value={v ? (extraData[v.code] || '') : ''}
                                        onChange={e => v && updateExtraData(v.code, e.target.value)}
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
                                    value={v ? (extraData[v.code] || '') : ''}
                                    onChange={e => v && updateExtraData(v.code, e.target.value)}
                                    className="w-full flex-1 bg-white/5 border border-white/5 rounded-2xl p-4 text-sm text-slate-300 focus:ring-1 focus:ring-white/10 outline-none resize-none min-h-[100px] placeholder:text-white/5"
                                ></textarea>
                            </div>
                        );
                    })}
                </div>

                {/* Registro Fotográfico */}
                <PhotoUploadGroup patientId={patientId} extraData={extraData} setExtraData={setExtraData} />
            </div>
        </div>
    );
}
