"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from "@/lib/supabase/client";
import { X, ClipboardList, Sparkles, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface MedicalHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: string;
    patientName: string;
}

export function MedicalHistoryModal({ isOpen, onClose, patientId, patientName }: MedicalHistoryModalProps) {
    const [loading, setLoading] = useState(true);
    const [historyData, setHistoryData] = useState<any>(null);
    const supabase = createClient();

    useEffect(() => {
        if (isOpen && patientId) {
            fetchHistory();
        }
    }, [isOpen, patientId]);

    const fetchHistory = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("patient_medical_histories")
                .select("*")
                .eq("patient_id", patientId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            setHistoryData(data);
        } catch (err) {
            console.error("Error fetching medical history:", err);
        } finally {
            setLoading(false);
        }
    };

    const formatList = (val: any) => {
        if (!val) return 'Ninguno';
        if (Array.isArray(val)) return val.length > 0 ? val.join(', ') : 'Ninguno';
        return val;
    };

    const getYesNo = (val: string | boolean) => {
        if (val === 'yes' || val === true) return 'Sí';
        if (val === 'no' || val === false) return 'No';
        return val || 'No registrado';
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-5xl rounded-[3rem] p-0 border-white/10 shadow-2xl bg-[#0B1120] text-white overflow-hidden max-h-[90vh] flex flex-col">
                <div className="absolute top-0 right-10 w-64 h-64 bg-nutri-brand/10 blur-[100px] rounded-full -mr-32 -mt-32" />

                <DialogHeader className="p-10 lg:p-12 border-b border-white/5 relative z-10">
                    <div className="flex justify-between items-start">
                        <div>
                            <DialogTitle className="text-4xl font-black tracking-tighter uppercase italic mb-2">
                                Historia <span className="text-nutri-brand">Clínica</span>
                            </DialogTitle>
                            <DialogDescription className="text-slate-400 font-medium italic">
                                Perfil clínico y nutricional de <span className="text-white font-bold uppercase">{patientName}</span>
                            </DialogDescription>
                        </div>
                        <DialogClose asChild>
                            <button className="h-12 w-12 flex items-center justify-center text-slate-500 hover:text-white hover:bg-white/5 rounded-2xl transition-all border border-transparent hover:border-white/5">
                                <X className="h-6 w-6" />
                            </button>
                        </DialogClose>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-10 lg:p-12 space-y-16 custom-scrollbar relative z-10">
                    {loading ? (
                        <div className="py-20 text-center font-black animate-pulse text-slate-500 uppercase tracking-widest text-sm">
                            Cargando expediente clínico...
                        </div>
                    ) : !historyData ? (
                        <div className="py-20 text-center space-y-4">
                            <div className="h-20 w-20 bg-white/5 rounded-3xl flex items-center justify-center mx-auto text-slate-600">
                                <ClipboardList className="h-10 w-10" />
                            </div>
                            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No se encontró historia clínica registrada para este paciente.</p>
                        </div>
                    ) : (
                        <div className="space-y-16">
                            {/* 01: Datos Personales */}
                            <section className="space-y-8">
                                <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                                    <span className="w-8 h-[1px] bg-nutri-brand/30" /> 01 // DATOS PERSONALES
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    <SummaryItem label="Género" value={historyData.gender} />
                                    <SummaryItem label="DNI" value={historyData.dni} />
                                    <SummaryItem label="Educación" value={historyData.education_level} />
                                    <SummaryItem label="Ubicación" value={`${historyData.district || ''}, ${historyData.region || ''}`} />
                                    <SummaryItem label="Ocupación" value={`${historyData.occupation || ''} (${historyData.job_details || ''})`} />
                                </div>
                            </section>

                            {/* 02: Objetivos */}
                            <section className="space-y-8">
                                <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                                    <span className="w-8 h-[1px] bg-nutri-brand/30" /> 02 // OBJETIVOS Y MEDICIONES
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <SummaryItem label="Objetivo Nutricional" value={historyData.nutritional_goal} className="lg:col-span-2" />
                                    <SummaryItem label="Talla" value={`${historyData.height_cm} cm`} />
                                    <SummaryItem label="Exp. Previa" value={historyData.previous_nutrition_service === 'never' ? 'Nunca' : 'Sí'} />
                                </div>
                            </section>

                            {/* 03: Salud */}
                            <section className="space-y-8">
                                <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                                    <span className="w-8 h-[1px] bg-nutri-brand/30" /> 03 // ESTADO DE SALUD
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <SummaryItem label="Condiciones Médicas" value={formatList(historyData.health_conditions)} />
                                    <SummaryItem label="Antecedentes Familiares" value={formatList(historyData.family_history)} />
                                    <SummaryItem label="Medicamentos" value={historyData.takes_medication === 'yes' ? historyData.medication_details : 'No'} />
                                    <SummaryItem label="Análisis Recientes" value={getYesNo(historyData.recent_lab_tests)} />
                                </div>
                            </section>

                            {/* 04: Hábitos */}
                            <section className="space-y-8">
                                <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                                    <span className="w-8 h-[1px] bg-nutri-brand/30" /> 04 // ACTIVIDAD Y HÁBITOS
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <SummaryItem label="Actividad" value={historyData.activity_level} />
                                    <SummaryItem label="Ejercicio" value={getYesNo(historyData.does_exercise)} />
                                    <SummaryItem label="Sueño" value={`${historyData.sleep_hours || '-'}h (Calidad: ${historyData.sleep_quality || '-'})`} />
                                    <SummaryItem label="Agua" value={historyData.water_intake} />
                                    <SummaryItem label="Apetito" value={historyData.appetite_level} />
                                </div>
                            </section>

                            {/* 05: Alimentación */}
                            <section className="space-y-8">
                                <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                                    <span className="w-8 h-[1px] bg-nutri-brand/30" /> 05 // ALIMENTACIÓN
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <SummaryItem label="Cooks" value={historyData.cooks_for_self} />
                                    <SummaryItem label="Dairy" value={historyData.dairy_consumption} />
                                    <SummaryItem label="Suplements" value={historyData.supplements_consumption} />
                                    <SummaryItem label="Aversiones" value={formatList(historyData.disliked_meats)} className="col-span-full" />
                                </div>
                            </section>
                        </div>
                    )}
                </div>

                <div className="p-10 border-t border-white/5 bg-white/[0.02] relative z-10 flex justify-end">
                    <DialogClose asChild>
                        <button className="px-10 h-14 rounded-2xl font-black uppercase tracking-widest bg-white/5 text-slate-400 hover:text-white transition-all border border-white/10">
                            Cerrar Documento
                        </button>
                    </DialogClose>
                </div>
            </DialogContent>
        </Dialog>
    );
}

function SummaryItem({ label, value, className }: { label: string, value: string, className?: string }) {
    return (
        <div className={cn("space-y-1.5 p-5 rounded-[1.5rem] bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors", className)}>
            <p className="text-[9px] uppercase font-black tracking-[0.1em] text-slate-500">{label}</p>
            <p className="text-slate-200 font-bold text-sm leading-relaxed">{value || 'No registrado'}</p>
        </div>
    );
}
