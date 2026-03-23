"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from "@/lib/supabase/client";
import { X, Upload, Edit, Save, Loader2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { MedicalHistoryForm } from "@/components/dashboard/paciente/medical-history-form";

interface MedicalHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: string;
    patientName: string;
}

export function MedicalHistoryModal({ isOpen, onClose, patientId, patientName }: MedicalHistoryModalProps) {
    const { toast } = useToast();
    const [key, setKey] = useState(0);

    useEffect(() => {
        if (isOpen && patientId) {
            setKey(prev => prev + 1);
        }
    }, [isOpen, patientId]);

    const handleExcelUpload = () => {
        toast({
            title: "Función en migración",
            description: "La carga por Excel se está integrando al nuevo formato paso a paso para asegurar la consistencia de los datos.",
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-[95vw] max-w-6xl rounded-3xl p-0 border-white/10 shadow-3xl bg-[#0B1120] text-white overflow-hidden h-[92vh] flex flex-col z-50 ring-1 ring-white/5">
                <div className="absolute top-0 right-0 w-96 h-96 bg-nutri-brand/5 blur-[120px] rounded-full pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full pointer-events-none" />

                <DialogHeader className="p-8 pb-6 border-b border-white/5 relative shrink-0 bg-[#0B1120]/80 backdrop-blur-xl">
                    <div className="flex flex-col gap-1.5">
                        <DialogTitle className="text-3xl sm:text-4xl font-black uppercase italic tracking-tighter flex items-center gap-4">
                            Expediente <span className="text-nutri-brand">Médico</span>
                            <div className="h-px flex-1 bg-gradient-to-r from-white/10 to-transparent ml-4 hidden sm:block" />
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 font-medium italic flex items-center gap-2">
                            Gestionando historia de: <span className="text-white font-bold not-italic px-2 py-0.5 bg-white/5 rounded-lg border border-white/5 shadow-inner">{patientName || 'Paciente'}</span>
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <div id="medical-history-scroll-container" className="flex-1 overflow-y-auto bg-transparent custom-scrollbar">
                    <div className="p-4 sm:p-8 lg:p-12">
                        <MedicalHistoryForm 
                            key={key}
                            externalPatientId={patientId} 
                            isNutritionistView={true} 
                            hideWrapper={true}
                            onSaveSuccess={() => {
                                toast({
                                    title: "¡Guardado con éxito!",
                                    description: `La historia de ${patientName} ha sido actualizada.`,
                                    variant: "success"
                                });
                            }}
                        />
                    </div>
                </div>

                <DialogFooter className="p-6 border-t border-white/5 bg-[#0B1120]/90 backdrop-blur-xl shrink-0 flex flex-row justify-between items-center gap-4">
                    <Button 
                        variant="ghost" 
                        onClick={onClose} 
                        className="px-8 h-12 rounded-xl text-slate-500 hover:text-white border border-white/5 hover:bg-white/5 font-black uppercase text-[10px] tracking-widest transition-all"
                    >
                        Cerrar Panel
                    </Button>

                    <div className="flex gap-3">
                        <Button 
                            variant="outline" 
                            onClick={handleExcelUpload}
                            className="h-12 px-6 rounded-xl border-white/10 bg-white/5 text-slate-400 hover:text-white font-black text-[10px] uppercase tracking-widest transition-all hover:bg-white/10"
                        >
                            <Upload className="h-4 w-4 mr-2" /> Importar Excel
                        </Button>
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
