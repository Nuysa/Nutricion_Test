"use client";

import React, { useEffect, useState } from 'react';
import { createClient } from "@/lib/supabase/client";
import { X, ClipboardList, Sparkles, ShieldCheck, Edit, Save, RotateCcw, Upload, Plus, Camera, Loader2 } from "lucide-react";
import * as XLSX from 'xlsx';
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose, DialogFooter } from "@/components/ui/dialog";
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
    const [uploadingSlots, setUploadingSlots] = useState<Record<string, string>>({});
    const { toast } = useToast();
    const supabase = createClient();

    useEffect(() => {
        if (isOpen && patientId) {
            console.log("[MedicalHistoryModal] Cargando historia para:", patientId);
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
                .maybeSingle();

            if (error) throw error;
            
            setHistoryData(data);
            setEditedData(data);
        } catch (err: any) {
            console.error("[MedicalHistoryModal] Error:", err);
            toast({
                title: "Error de conexión",
                description: "No se pudo cargar la historia clínica.",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            const cleanBoolean = (val: any) => {
                if (val === null || val === undefined || val === '') return null;
                if (typeof val === 'boolean') return val;
                const s = String(val).toLowerCase().trim();
                if (s === 'true' || s === 'si' || s === 'sí' || s === 'yes' || s.startsWith('yes')) return true;
                if (s === 'false' || s === 'no' || s === 'never' || s === 'nunca') return false;
                return val;
            };

            const dataToSave = { ...editedData };
            const boolFields = [
                'previous_nutrition_service', 'takes_medication', 'recent_lab_tests', 
                'does_exercise', 'has_calorie_tracker', 'likes_cooking', 
                'food_intolerances', 'supplements_consumption'
            ];

            boolFields.forEach(field => {
                if (dataToSave[field] !== undefined) {
                    dataToSave[field] = cleanBoolean(dataToSave[field]);
                }
            });

            const { updated_at, ...persistenceData } = dataToSave;

            const { error } = await supabase
                .from("patient_medical_histories")
                .upsert({
                    ...persistenceData,
                    updated_at: new Date().toISOString()
                }, { onConflict: 'patient_id' });

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

    const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>, field: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploadingSlots(prev => ({ ...prev, [field]: "Procesando..." }));
        try {
            await new Promise(resolve => setTimeout(resolve, 150));
            const worker = new Worker(new URL('../../../lib/workers/bg-removal.worker.ts', import.meta.url));

            const processedBlob = await new Promise<Blob>((resolve, reject) => {
                worker.onmessage = (event) => {
                    if (event.data.success) resolve(event.data.blob);
                    else reject(new Error(event.data.error));
                    worker.terminate();
                };
                worker.onerror = (error) => { reject(error); worker.terminate(); };
                worker.postMessage({ file, typeId: field });
            });

            const processedFile = new File([processedBlob], `${field}.jpg`, { type: "image/jpeg" });
            setUploadingSlots(prev => ({ ...prev, [field]: "Subiendo..." }));
            const fileName = `${patientId}/history_${Date.now()}_${field}.jpg`;

            const { error: uploadError } = await supabase.storage
                .from('progress-photos')
                .upload(fileName, processedFile, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('progress-photos')
                .getPublicUrl(fileName);

            updateField(field, publicUrl);
            toast({ title: "Foto actualizada" });
        } catch (error: any) {
            toast({ title: "Error al subir", description: error.message, variant: "destructive" });
        } finally {
            setUploadingSlots(prev => {
                const next = { ...prev };
                delete next[field];
                return next;
            });
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

    const formatDate = (dateStr: string) => {
        if (!dateStr) return 'No registrado';
        try {
            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return dateStr;
            return date.toLocaleDateString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric' });
        } catch (e) { return dateStr; }
    };

    const calculateAge = (birthday: any) => {
        if (!birthday) return '';
        const birthDate = new Date(birthday);
        if (isNaN(birthDate.getTime())) return '';
        const today = new Date();
        let age = today.getFullYear() - birthDate.getFullYear();
        const m = today.getMonth() - birthDate.getMonth();
        if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
        return age;
    };

    const toISODate = (val: any) => {
        if (!val) return '';
        try {
            const date = (val instanceof Date) ? val : new Date(val);
            if (isNaN(date.getTime())) return '';
            return date.toISOString().split('T')[0];
        } catch (e) { return ''; }
    };

    const updateField = (field: string, value: any) => {
        setEditedData((prev: any) => {
            const next = { ...prev, [field]: value };
            if (field === 'birth_date') next.age = calculateAge(value);
            return next;
        });
    };

    const handleExcelUpload = async (file: File) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            try {
                const data = new Uint8Array(e.target?.result as ArrayBuffer);
                const workbook = XLSX.read(data, { type: 'array', cellDates: true });
                const worksheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' }) as any[];
                if (jsonData.length === 0) return;
                const row = jsonData[0];
                const mapping: Record<string, string> = {
                    "Fecha": "created_at", "Nombres y Apellidos completos": "full_name",
                    "Número de DNI": "dni", "Edad": "age", "Fecha de nacimiento": "birth_date",
                    "Sexo": "gender", "Ocupación": "occupation", "Peso (Kg)": "weight_kg",
                    "Talla (cm)": "height_cm", "Cintura (cm)": "waist_cm"
                };
                const newData: any = { patient_id: patientId };
                Object.entries(mapping).forEach(([excelHeader, dbField]) => {
                    if (row[excelHeader]) newData[dbField] = row[excelHeader];
                });
                if (newData.birth_date) newData.age = calculateAge(newData.birth_date);
                setEditedData(newData);
                setIsEditing(true);
            } catch (error) { console.error("Excel Error:", error); }
        };
        reader.readAsArrayBuffer(file);
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="w-[95vw] max-w-6xl rounded-2xl p-0 border-white/10 shadow-3xl bg-[#0B1120] text-white overflow-hidden h-[92vh] flex flex-col z-[9999]">
                <div className="absolute top-0 right-0 w-64 h-64 bg-nutri-brand/5 blur-[120px] rounded-full pointer-events-none" />

                <DialogHeader className="p-6 sm:p-8 border-b border-white/5 relative shrink-0">
                    <div className="flex flex-col gap-1">
                        <DialogTitle className="text-2xl sm:text-3xl font-black uppercase italic tracking-tight">
                            Historia <span className="text-nutri-brand">Clínica</span>
                        </DialogTitle>
                        <DialogDescription className="text-slate-400 font-medium italic">
                            Paciente: <span className="text-white font-bold">{patientName || 'Paciente'}</span>
                        </DialogDescription>
                    </div>
                </DialogHeader>

                <div className="flex-1 overflow-y-auto p-6 sm:p-10 space-y-20 bg-[#0B1120] custom-scrollbar">
                    {loading ? (
                        <div className="h-full flex flex-col items-center justify-center space-y-4">
                            <div className="w-12 h-12 border-4 border-nutri-brand/30 border-t-nutri-brand rounded-full animate-spin" />
                            <p className="font-black text-slate-500 uppercase tracking-widest text-[10px]">Consultando expediente...</p>
                        </div>
                    ) : (!historyData && !isEditing) ? (
                        <div className="py-20 text-center space-y-6">
                            <div className="h-20 w-20 bg-white/5 rounded-2xl flex items-center justify-center mx-auto text-slate-600">
                                <ClipboardList className="h-10 w-10" />
                            </div>
                            <div className="space-y-1">
                                <p className="text-slate-500 font-bold uppercase tracking-widest text-[10px]">Sin registro previo</p>
                                <p className="text-slate-400 text-sm italic">Inicia el expediente para este paciente.</p>
                            </div>
                            <Button 
                                onClick={() => {
                                    setEditedData({ 
                                        patient_id: patientId,
                                        created_at: new Date().toISOString(),
                                        full_name: patientName || ''
                                    });
                                    setIsEditing(true);
                                }}
                                className="bg-nutri-brand hover:bg-nutri-brand/90 text-white font-black uppercase tracking-widest px-8 rounded-xl h-12 shadow-lg"
                            >
                                <Plus className="h-4 w-4 mr-2" /> Iniciar Historia
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-20 pb-10">
                            {/* 01: DATOS PERSONALES */}
                            <section className="space-y-8">
                                <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                                    <span className="w-8 h-[1px] bg-nutri-brand/30" /> 01 // IDENTIDAD Y DATOS PERSONALES
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                                    {isEditing ? (
                                        <>
                                            <EditItem label="Nombre Completo" value={editedData?.full_name} onChange={(v) => updateField('full_name', v)} />
                                            <EditItem label="DNI" value={editedData?.dni} onChange={(v) => updateField('dni', v)} />
                                            <EditItem label="Email" value={editedData?.email} onChange={(v) => updateField('email', v)} />
                                            <EditItem label="Edad" value={editedData?.age} onChange={(v) => updateField('age', v)} type="number" />
                                            <EditItem label="Fecha Nacimiento" value={toISODate(editedData?.birth_date)} onChange={(v) => updateField('birth_date', v)} type="date" />
                                            <EditItem label="Instagram" value={editedData?.instagram} onChange={(v) => updateField('instagram', v)} />
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black text-slate-500 ml-2">Género</Label>
                                                <Select value={editedData?.gender} onValueChange={(v) => updateField('gender', v)}>
                                                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                                    <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                                        <SelectItem value="Masculino">Masculino</SelectItem>
                                                        <SelectItem value="Femenino">Femenino</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <EditItem label="Región/Estado" value={editedData?.region} onChange={(v) => updateField('region', v)} />
                                            <EditItem label="Distrito" value={editedData?.district} onChange={(v) => updateField('district', v)} />
                                            <EditItem label="Profesión/Ocupación" value={editedData?.occupation} onChange={(v) => updateField('occupation', v)} />
                                        </>
                                    ) : (
                                        <>
                                            <SummaryItem label="Nombre" value={historyData.full_name} />
                                            <SummaryItem label="DNI" value={historyData.dni} />
                                            <SummaryItem label="Email" value={historyData.email} />
                                            <SummaryItem label="Edad" value={`${historyData.age} años`} />
                                            <SummaryItem label="Nacimiento" value={formatDate(historyData.birth_date)} />
                                            <SummaryItem label="Instagram" value={historyData.instagram} />
                                            <SummaryItem label="Género" value={historyData.gender} />
                                            <SummaryItem label="Ubicación" value={`${historyData.district || '-'}, ${historyData.region || '-'}`} />
                                            <SummaryItem label="Ocupación" value={historyData.occupation} />
                                        </>
                                    )}
                                </div>
                            </section>

                            {/* 02: OBJETIVO Y EXPERIENCIA */}
                            <section className="space-y-8">
                                <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                                    <span className="w-8 h-[1px] bg-nutri-brand/30" /> 02 // OBJETIVO Y EXPERIENCIA
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {isEditing ? (
                                        <>
                                            <EditItem label="Objetivo Nutricional" value={editedData?.nutritional_goal} onChange={(v) => updateField('nutritional_goal', v)} type="textarea" />
                                            <EditItem label="Tiempo siguiendo planes" value={editedData?.time_following_plan} onChange={(v) => updateField('time_following_plan', v)} type="textarea" />
                                        </>
                                    ) : (
                                        <>
                                            <SummaryItem label="Objetivo" value={historyData.nutritional_goal} />
                                            <SummaryItem label="Experiencia previa" value={historyData.time_following_plan} />
                                        </>
                                    )}
                                </div>
                            </section>

                            {/* 03: MEDICIONES */}
                            <section className="space-y-8">
                                <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                                    <span className="w-8 h-[1px] bg-nutri-brand/30" /> 03 // MEDICIONES CORPORALES
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    {isEditing ? (
                                        <>
                                            <EditItem label="Peso (Kg)" value={editedData?.weight_kg} onChange={(v) => updateField('weight_kg', v)} type="number" />
                                            <EditItem label="Talla (cm)" value={editedData?.height_cm} onChange={(v) => updateField('height_cm', v)} type="number" />
                                            <EditItem label="Cintura (cm)" value={editedData?.waist_cm} onChange={(v) => updateField('waist_cm', v)} type="number" />
                                        </>
                                    ) : (
                                        <>
                                            <SummaryItem label="Peso" value={`${historyData.weight_kg} kg`} />
                                            <SummaryItem label="Talla" value={`${historyData.height_cm} cm`} />
                                            <SummaryItem label="Cintura" value={`${historyData.waist_cm} cm`} />
                                        </>
                                    )}
                                </div>
                            </section>

                            {/* 04: SALUD */}
                            <section className="space-y-8">
                                <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                                    <span className="w-8 h-[1px] bg-nutri-brand/30" /> 04 // ESTADO DE SALUD
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {isEditing ? (
                                        <>
                                            <EditItem label="Condiciones Médicas" value={formatList(editedData?.health_conditions)} onChange={(v) => updateField('health_conditions', Array.isArray(v) ? v : v.split(',').map((sValue: string) => sValue.trim()))} type="textarea" />
                                            <EditItem label="Medicación Actual" value={editedData?.medication_details} onChange={(v) => updateField('medication_details', v)} type="textarea" />
                                        </>
                                    ) : (
                                        <>
                                            <SummaryItem label="Condiciones" value={formatList(historyData.health_conditions)} />
                                            <SummaryItem label="Medicamentos" value={historyData.medication_details} />
                                        </>
                                    )}
                                </div>
                            </section>

                            {/* 05: ACTIVIDAD */}
                            <section className="space-y-8">
                                <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                                    <span className="w-8 h-[1px] bg-nutri-brand/30" /> 05 // ACTIVIDAD Y EJERCICIO
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {isEditing ? (
                                        <>
                                            <EditItem label="Actividad Diaria" value={editedData?.activity_level} onChange={(v) => updateField('activity_level', v)} />
                                            <EditItem label="Días de Deporte/semana" value={formatList(editedData?.exercise_days)} onChange={(v) => updateField('exercise_days', Array.isArray(v) ? v : v.split(',').map((s: string) => s.trim()))} />
                                            <EditItem label="Tipos de Ejercicio" value={formatList(editedData?.exercise_types)} onChange={(v) => updateField('exercise_types', Array.isArray(v) ? v : v.split(',').map((s: string) => s.trim()))} />
                                        </>
                                    ) : (
                                        <>
                                            <SummaryItem label="Nivel Actividad" value={historyData.activity_level} />
                                            <SummaryItem label="Frecuencia Deporte" value={formatList(historyData.exercise_days)} />
                                            <SummaryItem label="Tipos Deporte" value={formatList(historyData.exercise_types)} />
                                        </>
                                    )}
                                </div>
                            </section>

                            {/* 06: FISIOLÓGICOS */}
                            <section className="space-y-8">
                                <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                                    <span className="w-8 h-[1px] bg-nutri-brand/30" /> 06 // HÁBITOS FISIOLÓGICOS
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {isEditing ? (
                                        <>
                                            <EditItem label="Apetito" value={editedData?.appetite_level} onChange={(v) => updateField('appetite_level', v)} />
                                            <EditItem label="Sed (litros/día)" value={editedData?.water_intake} onChange={(v) => updateField('water_intake', v)} />
                                            <EditItem label="Calidad Sueño" value={editedData?.sleep_quality} onChange={(v) => updateField('sleep_quality', v)} />
                                            <EditItem label="Horas Sueño" value={editedData?.sleep_hours} onChange={(v) => updateField('sleep_hours', v)} type="number" />
                                        </>
                                    ) : (
                                        <>
                                            <SummaryItem label="Apetito" value={historyData.appetite_level} />
                                            <SummaryItem label="Ingesta Agua" value={historyData.water_intake} />
                                            <SummaryItem label="Sueño" value={historyData.sleep_quality} />
                                            <SummaryItem label="Horas" value={`${historyData.sleep_hours}h`} />
                                        </>
                                    )}
                                </div>
                            </section>

                            {/* 07: ALIMENTACIÓN */}
                            <section className="space-y-8">
                                <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                                    <span className="w-8 h-[1px] bg-nutri-brand/30" /> 07 // ALIMENTACIÓN Y COCINA
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {isEditing ? (
                                        <>
                                            <EditItem label="Alergias Alimentarias" value={editedData?.food_allergies} onChange={(v) => updateField('food_allergies', v)} type="textarea" />
                                            <EditItem label="Intolerancias" value={editedData?.intolerance_details} onChange={(v) => updateField('intolerance_details', v)} type="textarea" />
                                            <EditItem label="Quién cocina" value={editedData?.cooks_for_self} onChange={(v) => updateField('cooks_for_self', v)} />
                                            <div className="space-y-2">
                                                <Label className="text-[10px] uppercase font-black text-slate-500 ml-2">¿Le gusta cocinar?</Label>
                                                <Select value={String(editedData?.likes_cooking)} onValueChange={(v) => updateField('likes_cooking', v === 'true')}>
                                                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold"><SelectValue /></SelectTrigger>
                                                    <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                                        <SelectItem value="true">Sí</SelectItem>
                                                        <SelectItem value="false">No</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </>
                                    ) : (
                                        <>
                                            <SummaryItem label="Alergias" value={historyData.food_allergies} />
                                            <SummaryItem label="Intolerancias" value={historyData.intolerance_details} />
                                            <SummaryItem label="Responsable Cocina" value={historyData.cooks_for_self} />
                                            <SummaryItem label="Le gusta cocinar" value={getYesNo(historyData.likes_cooking)} />
                                        </>
                                    )}
                                </div>
                            </section>

                            {/* 08: LÁCTEOS */}
                            <section className="space-y-8">
                                <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                                    <span className="w-8 h-[1px] bg-nutri-brand/30" /> 08 // LÁCTEOS Y SUPLEMENTOS
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {isEditing ? (
                                        <>
                                            <EditItem label="Lácteos frecuentes" value={editedData?.dairy_consumption} onChange={(v) => updateField('dairy_consumption', v)} />
                                            <EditItem label="Suplementos" value={formatList(editedData?.supplement_types)} onChange={(v) => updateField('supplement_types', Array.isArray(v) ? v : v.split(',').map((s: string) => s.trim()))} />
                                        </>
                                    ) : (
                                        <>
                                            <SummaryItem label="Consumo Lácteos" value={historyData.dairy_consumption} />
                                            <SummaryItem label="Suplementación" value={formatList(historyData.supplement_types)} />
                                        </>
                                    )}
                                </div>
                            </section>

                            {/* 09: AVERSIONES */}
                            <section className="space-y-8">
                                <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                                    <span className="w-8 h-[1px] bg-nutri-brand/30" /> 09 // AVERSIONES Y HORARIOS
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {isEditing ? (
                                        <>
                                            <EditItem label="Alimentos que NO gustan" value={editedData?.disliked_preparations} onChange={(v) => updateField('disliked_preparations', v)} type="textarea" className="lg:col-span-3" />
                                            <EditItem label="Hábitos a cambiar" value={formatList(editedData?.previous_unhealthy_habits)} onChange={(v) => updateField('previous_unhealthy_habits', Array.isArray(v) ? v : v.split(',').map((s: string) => s.trim()))} type="textarea" className="lg:col-span-3" />
                                            <EditItem label="Hora Despertar" value={editedData?.wake_up_time} onChange={(v) => updateField('wake_up_time', v)} type="time" />
                                            <EditItem label="Hora Dormir" value={editedData?.sleep_time} onChange={(v) => updateField('sleep_time', v)} type="time" />
                                            <EditItem label="Hora Desayuno" value={editedData?.breakfast_time} onChange={(v) => updateField('breakfast_time', v)} type="time" />
                                        </>
                                    ) : (
                                        <>
                                            <SummaryItem label="Alimentos Disgusto" value={historyData.disliked_preparations} className="lg:col-span-3" />
                                            <SummaryItem label="Hábitos mal realizados" value={formatList(historyData.previous_unhealthy_habits)} className="lg:col-span-3" />
                                            <SummaryItem label="Despertar" value={historyData.wake_up_time} />
                                            <SummaryItem label="Dormir" value={historyData.sleep_time} />
                                            <SummaryItem label="Desayuno" value={historyData.breakfast_time} />
                                        </>
                                    )}
                                </div>
                            </section>

                            {/* 10: MULTIMEDIA */}
                            <section className="space-y-8">
                                <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                                    <span className="w-8 h-[1px] bg-nutri-brand/30" /> 10 // MULTIMEDIA Y ARCHIVOS
                                </h3>
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                                    {[
                                        { id: 'front_photo_url', label: 'Frente' },
                                        { id: 'side_photo_1_url', label: 'Costado 1' },
                                        { id: 'side_photo_2_url', label: 'Costado 2' },
                                        { id: 'back_photo_url', label: 'Espalda' }
                                    ].map((photo) => {
                                        const currentUrl = (isEditing ? editedData : historyData)?.[photo.id];
                                        const slotStatus = uploadingSlots[photo.id];
                                        const isUploading = !!slotStatus;

                                        return (
                                            <div key={photo.id} className="flex flex-col gap-3">
                                                <p className="text-[10px] uppercase font-black text-slate-500 tracking-widest text-center">{photo.label}</p>
                                                <div className="relative aspect-[3/4] rounded-2xl bg-white/5 border-2 border-dashed border-white/10 flex items-center justify-center overflow-hidden group hover:border-nutri-brand/50 transition-all">
                                                    {isUploading ? (
                                                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0B1120]/90 backdrop-blur-sm z-20 text-nutri-brand">
                                                            <Loader2 className="h-8 w-8 animate-spin mb-2" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest">{slotStatus}</span>
                                                        </div>
                                                    ) : currentUrl ? (
                                                        <>
                                                            <img src={currentUrl} alt={photo.label} className="w-full h-full object-cover" />
                                                            {isEditing && (
                                                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                                                                    <label className="bg-nutri-brand hover:bg-nutri-brand/90 text-white p-3 rounded-full cursor-pointer shadow-xl transform scale-90 group-hover:scale-100 transition-all">
                                                                        <Upload className="h-5 w-5" />
                                                                        <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, photo.id)} />
                                                                    </label>
                                                                </div>
                                                            )}
                                                        </>
                                                    ) : (
                                                        <label className={cn(
                                                            "absolute inset-0 flex flex-col items-center justify-center transition-colors px-4",
                                                            isEditing ? "cursor-pointer hover:bg-white/5" : "cursor-default"
                                                        )}>
                                                            <Camera className="h-10 w-10 mb-3 opacity-20" />
                                                            <span className="text-[10px] font-black uppercase tracking-widest opacity-40 text-center">
                                                                {isEditing ? "Subir Foto" : "Sin registro"}
                                                            </span>
                                                            {isEditing && <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, photo.id)} />}
                                                        </label>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </section>
                        </div>
                    )}
                </div>

                <DialogFooter className="p-6 border-t border-white/5 bg-slate-900/50 backdrop-blur-md shrink-0 flex flex-row justify-between items-center gap-4">
                    <Button variant="ghost" onClick={isEditing ? () => setIsEditing(false) : onClose} className="px-6 h-12 rounded-xl text-slate-400 border border-white/10 hover:bg-white/5 font-black uppercase text-[10px] tracking-widest">
                        {isEditing ? "Cancelar" : "Cerrar"}
                    </Button>

                    <div className="flex gap-3">
                        {!isEditing ? (
                            <div className="flex gap-3">
                                <div className="relative">
                                    <input type="file" accept=".xlsx,.xls" className="absolute inset-0 opacity-0 cursor-pointer" onChange={(e)=>e.target.files?.[0] && handleExcelUpload(e.target.files[0])} />
                                    <Button variant="outline" className="h-12 px-6 rounded-xl border-white/10 text-slate-400 font-black text-[10px] uppercase tracking-widest">
                                        <Upload className="h-4 w-4 mr-2" /> Excel
                                    </Button>
                                </div>
                                <Button onClick={() => setIsEditing(true)} className="bg-nutri-brand hover:bg-nutri-brand/90 text-white font-black px-8 h-12 rounded-xl shadow-lg shadow-nutri-brand/20 uppercase text-[10px] tracking-widest">
                                    <Edit className="h-4 w-4 mr-2" /> Editar Historia
                                </Button>
                            </div>
                        ) : (
                            <Button onClick={handleSave} disabled={isSaving} className="h-12 px-8 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl shadow-lg shadow-emerald-500/20 uppercase text-[10px] tracking-widest">
                                {isSaving ? "Guardando..." : <><Save className="h-4 w-4 mr-2" /> Guardar Todo</>}
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function SummaryItem({ label, value, className }: { label: string, value: string, className?: string }) {
    return (
        <div className={cn("space-y-1.5 p-5 rounded-2xl bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors", className)}>
            <p className="text-[9px] uppercase font-black tracking-widest text-slate-500">{label}</p>
            <p className="text-slate-200 font-bold text-sm leading-relaxed">{value || 'No registrado'}</p>
        </div>
    );
}

function EditItem({ label, value, onChange, className, type = "text" }: { label: string, value: any, onChange: (v: any) => void, className?: string, type?: string }) {
    return (
        <div className={cn("space-y-2", className)}>
            <Label className="text-[10px] uppercase font-black text-slate-500 ml-2">{label}</Label>
            {type === "textarea" ? (
                <Textarea 
                    value={value || ''} 
                    onChange={(e) => onChange(e.target.value)} 
                    className="bg-white/5 border-white/10 text-white rounded-xl min-h-[100px] font-bold focus:ring-nutri-brand"
                />
            ) : (
                <Input
                    type={type}
                    value={value || ''}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold focus:ring-nutri-brand"
                />
            )}
        </div>
    );
}
