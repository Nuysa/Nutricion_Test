"use client";

import React from 'react';
import { SummaryItem, EditItem } from '../components/HistoryItem';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface HealthActivitySectionProps {
    isEditing: boolean;
    data: any;
    updateField: (field: string, value: any) => void;
    getYesNo: (val: any) => string;
    formatList: (val: any) => string;
}

export function HealthActivitySection({ isEditing, data, updateField, getYesNo, formatList }: HealthActivitySectionProps) {
    return (
        <div className="space-y-16">
            {/* 04: Salud */}
            <section className="space-y-8">
                <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                    <span className="w-8 h-[1px] bg-nutri-brand/30" /> 04 // ESTADO DE SALUD
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {isEditing ? (
                        <>
                            <EditItem label="Condiciones Médicas" value={formatList(data?.health_conditions)} onChange={(v) => updateField('health_conditions', v.split(',').map((s: string) => s.trim()))} type="textarea" />
                            <EditItem label="Antecedentes Familiares" value={formatList(data?.family_history)} onChange={(v) => updateField('family_history', v.split(',').map((s: string) => s.trim()))} type="textarea" />
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black text-slate-500">¿Consume Medicamentos?</Label>
                                <Select value={String(data?.takes_medication)} onValueChange={(v) => updateField('takes_medication', v === 'true')}>
                                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                        <SelectItem value="true">Sí</SelectItem>
                                        <SelectItem value="false">No</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <EditItem label="Detalles Medicamentos" value={data?.medication_details} onChange={(v) => updateField('medication_details', v)} />
                            <EditItem label="Frecuencia Medicamentos" value={data?.medication_frequency} onChange={(v) => updateField('medication_frequency', v)} />
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black text-slate-500">Exámenes Laboratorio (3 meses)</Label>
                                <Select value={String(data?.recent_lab_tests)} onValueChange={(v) => updateField('recent_lab_tests', v === 'true')}>
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
                            <SummaryItem label="Condiciones Médicas" value={formatList(data.health_conditions)} />
                            <SummaryItem label="Antecedentes Familiares" value={formatList(data.family_history)} />
                            <SummaryItem label="Medicamentos" value={getYesNo(data.takes_medication)} />
                            <SummaryItem label="Detalle Medicamentos" value={`${data.medication_details || '-'} (${data.medication_frequency || ''})`} />
                            <SummaryItem label="Análisis Recientes" value={getYesNo(data.recent_lab_tests)} />
                        </>
                    )}
                </div>
            </section>

            {/* 05: Actividad */}
            <section className="space-y-8">
                <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                    <span className="w-8 h-[1px] bg-nutri-brand/30" /> 05 // ACTIVIDAD Y EJERCICIO
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {isEditing ? (
                        <>
                            <EditItem label="Actividad Diaria" value={data?.activity_level} onChange={(v) => updateField('activity_level', v)} />
                            <EditItem label="Horario Trabajo" value={data?.work_schedule} onChange={(v) => updateField('work_schedule', v)} />
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black text-slate-500">Realiza Ejercicio</Label>
                                <Select value={String(data?.does_exercise)} onValueChange={(v) => updateField('does_exercise', v === 'true')}>
                                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                        <SelectItem value="true">Sí</SelectItem>
                                        <SelectItem value="false">No</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <EditItem label="Tiempo realizando ej." value={data?.exercise_duration} onChange={(v) => updateField('exercise_duration', v)} />
                            <EditItem label="Tipos de ejercicio" value={formatList(data?.exercise_types)} onChange={(v) => updateField('exercise_types', v.split(',').map((s: string) => s.trim()))} />
                            <EditItem label="Días de entrenamiento" value={formatList(data?.exercise_days)} onChange={(v) => updateField('exercise_days', v.split(',').map((s: string) => s.trim()))} />
                            <EditItem label="Hora entrenamiento" value={data?.exercise_time} onChange={(v) => updateField('exercise_time', v)} />
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black text-slate-500">¿Usa contador calorías?</Label>
                                <Select value={String(data?.has_calorie_tracker)} onValueChange={(v) => updateField('has_calorie_tracker', v === 'true')}>
                                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                        <SelectItem value="true">Sí</SelectItem>
                                        <SelectItem value="false">No</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <EditItem label="Detalles Gasto Calórico" value={data?.calorie_expenditure_details} onChange={(v) => updateField('calorie_expenditure_details', v)} className="lg:col-span-3" type="textarea" />
                        </>
                    ) : (
                        <>
                            <SummaryItem label="Actividad Diaria" value={data.activity_level} />
                            <SummaryItem label="Horario Trabajo" value={data.work_schedule} />
                            <SummaryItem label="Hace Ejercicio" value={getYesNo(data.does_exercise)} />
                            <SummaryItem label="Frecuencia" value={data.exercise_duration} />
                            <SummaryItem label="Tipos Ejercicio" value={formatList(data.exercise_types)} />
                            <SummaryItem label="Días" value={formatList(data.exercise_days)} />
                            <SummaryItem label="Hora" value={data.exercise_time} />
                            <SummaryItem label="Dispositivo Méd." value={getYesNo(data.has_calorie_tracker)} />
                            <SummaryItem label="Detalles Gasto" value={data.calorie_expenditure_details} className="lg:col-span-3" />
                        </>
                    )}
                </div>
            </section>
        </div>
    );
}
