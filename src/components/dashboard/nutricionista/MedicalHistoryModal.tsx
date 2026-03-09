"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from "@/lib/supabase/client";
import { X, ClipboardList, Sparkles, ShieldCheck, Edit, Save, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from "@/components/ui/dialog";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

interface MedicalHistoryModalProps {
    isOpen: boolean;
    onClose: () => void;
    patientId: string;
    patientName: string;
}

export function MedicalHistoryModal({ isOpen, onClose, patientId, patientName }: MedicalHistoryModalProps) {
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [historyData, setHistoryData] = useState<any>(null);
    const [editedData, setEditedData] = useState<any>(null);
    const { toast } = useToast();
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
            setEditedData(data);
        } catch (err) {
            console.error("Error fetching medical history:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const { error } = await supabase
                .from("patient_medical_histories")
                .update({
                    ...editedData,
                    updated_at: new Date().toISOString()
                })
                .eq("patient_id", patientId);

            if (error) throw error;

            setHistoryData(editedData);
            setIsEditing(false);
            toast({
                title: "Historia Clínica Actualizada",
                description: "Los cambios han sido guardados correctamente.",
            });
            new BroadcastChannel('nutrigo_global_sync').postMessage('sync');
        } catch (err: any) {
            toast({
                title: "Error al guardar",
                description: err.message,
                variant: "destructive",
            });
        } finally {
            setIsSaving(false);
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

    const updateField = (field: string, value: any) => {
        setEditedData({ ...editedData, [field]: value });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-5xl rounded-[3rem] p-0 border-white/10 shadow-2xl bg-[#0B1120] text-white overflow-hidden max-h-[90vh] flex flex-col [&>button:last-child]:z-[100] [&>button:last-child]:right-10 [&>button:last-child]:top-10 [&>button:last-child]:h-12 [&>button:last-child]:w-12 [&>button:last-child]:rounded-2xl [&>button:last-child]:bg-white/5 [&>button:last-child]:border-white/10 [&>button:last-child]:hover:bg-white/10 [&>button:last-child]:transition-all">
                <div className="absolute top-0 right-10 w-64 h-64 bg-nutri-brand/10 blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none" />

                <DialogHeader className="p-10 lg:p-12 border-b border-white/5 relative">
                    <div className="flex justify-between items-start pr-16 lg:pr-20">
                        <div>
                            <DialogTitle className="text-4xl font-black tracking-tighter uppercase italic mb-2">
                                Historia <span className="text-nutri-brand">Clínica</span>
                            </DialogTitle>
                            <DialogDescription className="text-slate-400 font-medium italic">
                                Perfil clínico y nutricional de <span className="text-white font-bold uppercase">{patientName}</span>
                            </DialogDescription>
                        </div>
                        <div className="flex items-center gap-6">
                            <div className="flex gap-4">
                                {!isEditing ? (
                                    <Button
                                        onClick={() => setIsEditing(true)}
                                        className="h-12 px-6 rounded-xl bg-nutri-brand/10 text-nutri-brand border border-nutri-brand/20 hover:bg-nutri-brand hover:text-white font-black uppercase text-[10px] tracking-widest transition-all"
                                    >
                                        <Edit className="h-4 w-4 mr-2" /> Editar Historia
                                    </Button>
                                ) : (
                                    <div className="flex gap-3">
                                        <Button
                                            onClick={() => { setIsEditing(false); setEditedData(historyData); }}
                                            variant="ghost"
                                            className="h-12 px-6 rounded-xl text-slate-400 font-black uppercase text-[10px] tracking-widest"
                                        >
                                            <RotateCcw className="h-4 w-4 mr-2" /> Cancelar
                                        </Button>
                                        <Button
                                            onClick={handleSave}
                                            disabled={isSaving}
                                            className="h-12 px-6 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20"
                                        >
                                            <Save className="h-4 w-4 mr-2" /> {isSaving ? "Guardando..." : "Guardar Cambios"}
                                        </Button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-10 lg:p-12 space-y-16 custom-scrollbar relative">
                    {loading ? (
                        <div className="py-20 text-center font-black animate-pulse text-slate-500 uppercase tracking-widest text-sm">
                            Cargando expediente clínico...
                        </div>
                    ) : !historyData && !isEditing ? (
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
                                    {isEditing ? (
                                        <>
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black text-slate-500">Género</Label>
                                                <Select value={editedData?.gender} onValueChange={(v) => updateField('gender', v)}>
                                                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                                        <SelectItem value="Masculino">Masculino</SelectItem>
                                                        <SelectItem value="Femenino">Femenino</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <EditItem label="DNI" value={editedData?.dni} onChange={(v) => updateField('dni', v)} />
                                            <EditItem label="Nivel Educativo" value={editedData?.education_level} onChange={(v) => updateField('education_level', v)} />
                                            <EditItem label="Distrito" value={editedData?.district} onChange={(v) => updateField('district', v)} />
                                            <EditItem label="Región" value={editedData?.region} onChange={(v) => updateField('region', v)} />
                                            <EditItem label="Ocupación" value={editedData?.occupation} onChange={(v) => updateField('occupation', v)} className="lg:col-span-2" />
                                        </>
                                    ) : (
                                        <>
                                            <SummaryItem label="Género" value={historyData.gender} />
                                            <SummaryItem label="DNI" value={historyData.dni} />
                                            <SummaryItem label="Nivel Educativo" value={historyData.education_level} />
                                            <SummaryItem label="Ubicación" value={`${historyData.district || ''}, ${historyData.region || ''}`} />
                                            <SummaryItem label="Ocupación" value={`${historyData.occupation || ''} (${historyData.job_details || ''})`} />
                                        </>
                                    )}
                                </div>
                            </section>

                            {/* 02: Objetivos */}
                            <section className="space-y-8">
                                <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                                    <span className="w-8 h-[1px] bg-nutri-brand/30" /> 02 // OBJETIVOS Y MEDICIONES
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {isEditing ? (
                                        <>
                                            <EditItem label="Objetivo Nutricional" value={editedData?.nutritional_goal} onChange={(v) => updateField('nutritional_goal', v)} className="lg:col-span-2" type="textarea" />
                                            <EditItem label="Talla (cm)" value={editedData?.height_cm} onChange={(v) => updateField('height_cm', v)} type="number" />
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black text-slate-500">Exp. Previa</Label>
                                                <Select value={editedData?.previous_nutrition_service} onValueChange={(v) => updateField('previous_nutrition_service', v)}>
                                                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                                        <SelectItem value="never">Nunca</SelectItem>
                                                        <SelectItem value="once">Una vez</SelectItem>
                                                        <SelectItem value="regularly">Regularmente</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <SummaryItem label="Objetivo Nutricional" value={historyData.nutritional_goal} className="lg:col-span-2" />
                                            <SummaryItem label="Talla" value={`${historyData.height_cm} cm`} />
                                            <SummaryItem label="Exp. Previa" value={historyData.previous_nutrition_service === 'never' ? 'Nunca' : 'Sí'} />
                                        </>
                                    )}
                                </div>
                            </section>

                            {/* 03: Salud */}
                            <section className="space-y-8">
                                <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                                    <span className="w-8 h-[1px] bg-nutri-brand/30" /> 03 // ESTADO DE SALUD
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {isEditing ? (
                                        <>
                                            <EditItem label="Condiciones Médicas (Separar por comas)" value={Array.isArray(editedData?.health_conditions) ? editedData.health_conditions.join(', ') : editedData?.health_conditions} onChange={(v) => updateField('health_conditions', v.split(',').map((s: string) => s.trim()))} type="textarea" />
                                            <EditItem label="Antecedentes Familiares (Separar por comas)" value={Array.isArray(editedData?.family_history) ? editedData.family_history.join(', ') : editedData?.family_history} onChange={(v) => updateField('family_history', v.split(',').map((s: string) => s.trim()))} type="textarea" />
                                            <EditItem label="Medicamentos" value={editedData?.medication_details} onChange={(v) => updateField('medication_details', v)} />
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black text-slate-500">Análisis Recientes</Label>
                                                <Select value={String(editedData?.recent_lab_tests)} onValueChange={(v) => updateField('recent_lab_tests', v === 'true')}>
                                                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                                        <SelectItem value="true">Sí</SelectItem>
                                                        <SelectItem value="false">No</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <SummaryItem label="Condiciones Médicas" value={formatList(historyData.health_conditions)} />
                                            <SummaryItem label="Antecedentes Familiares" value={formatList(historyData.family_history)} />
                                            <SummaryItem label="Medicamentos" value={historyData.takes_medication === 'yes' ? historyData.medication_details : 'No consume'} />
                                            <SummaryItem label="Análisis Recientes" value={getYesNo(historyData.recent_lab_tests)} />
                                        </>
                                    )}
                                </div>
                            </section>

                            {/* 04: Hábitos */}
                            <section className="space-y-8">
                                <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                                    <span className="w-8 h-[1px] bg-nutri-brand/30" /> 04 // ACTIVIDAD Y HÁBITOS
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {isEditing ? (
                                        <>
                                            <EditItem label="Nivel de Actividad" value={editedData?.activity_level} onChange={(v) => updateField('activity_level', v)} />
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black text-slate-500">Realiza Ejercicio</Label>
                                                <Select value={String(editedData?.does_exercise)} onValueChange={(v) => updateField('does_exercise', v === 'true')}>
                                                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                                        <SelectItem value="true">Sí</SelectItem>
                                                        <SelectItem value="false">No</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <EditItem label="Agua" value={editedData?.water_intake} onChange={(v) => updateField('water_intake', v)} />
                                            <EditItem label="Sueño (Horas)" value={editedData?.sleep_hours} onChange={(v) => updateField('sleep_hours', v)} type="number" />
                                            <EditItem label="Calidad Sueño" value={editedData?.sleep_quality} onChange={(v) => updateField('sleep_quality', v)} />
                                            <EditItem label="Apetito" value={editedData?.appetite_level} onChange={(v) => updateField('appetite_level', v)} />
                                        </>
                                    ) : (
                                        <>
                                            <SummaryItem label="Nivel de Actividad" value={historyData.activity_level} />
                                            <SummaryItem label="Realiza Ejercicio" value={getYesNo(historyData.does_exercise)} />
                                            <SummaryItem label="Sueño" value={`${historyData.sleep_hours || '-'}h (Calidad: ${historyData.sleep_quality || '-'})`} />
                                            <SummaryItem label="Consumo de Agua" value={historyData.water_intake} />
                                            <SummaryItem label="Nivel de Apetito" value={historyData.appetite_level} />
                                        </>
                                    )}
                                </div>
                            </section>

                            {/* 05: Alimentación */}
                            <section className="space-y-8">
                                <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                                    <span className="w-8 h-[1px] bg-nutri-brand/30" /> 05 // ALIMENTACIÓN Y PREFERENCIAS
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {isEditing ? (
                                        <>
                                            <EditItem label="Quién cocina" value={editedData?.cooks_for_self} onChange={(v) => updateField('cooks_for_self', v)} />
                                            <EditItem label="Lácteos" value={editedData?.dairy_consumption} onChange={(v) => updateField('dairy_consumption', v)} />
                                            <EditItem label="Suplementación" value={editedData?.supplements_consumption} onChange={(v) => updateField('supplements_consumption', v)} />
                                            <EditItem label="Aversiones (Separar por comas)" value={Array.isArray(editedData?.disliked_meats) ? editedData.disliked_meats.join(', ') : editedData?.disliked_meats} onChange={(v) => updateField('disliked_meats', v.split(',').map((s: string) => s.trim()))} className="col-span-full" type="textarea" />
                                        </>
                                    ) : (
                                        <>
                                            <SummaryItem label="Quién cocina" value={historyData.cooks_for_self} />
                                            <SummaryItem label="Lácteos" value={historyData.dairy_consumption} />
                                            <SummaryItem label="Suplementación" value={historyData.supplements_consumption} />
                                            <SummaryItem label="Aversiones y Alergias" value={formatList(historyData.disliked_meats)} className="col-span-full" />
                                        </>
                                    )}
                                </div>
                            </section>
                        </div>
                    )}
                </div>

                <div className="p-10 border-t border-white/5 bg-white/[0.02] relative flex justify-end">
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

function EditItem({ label, value, onChange, className, type = "text" }: { label: string, value: any, onChange: (v: any) => void, className?: string, type?: "text" | "number" | "textarea" }) {
    return (
        <div className={cn("space-y-2", className)}>
            <Label className="text-[10px] uppercase font-black text-slate-500 ml-2">{label}</Label>
            {type === "textarea" ? (
                <Textarea
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="bg-white/5 border-white/10 text-white rounded-xl min-h-[100px] font-bold focus:ring-nutri-brand/50"
                />
            ) : (
                <Input
                    type={type}
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold focus:ring-nutri-brand/50"
                />
            )}
        </div>
    );
}
