"use client";

import React from 'react';
import { SummaryItem, EditItem } from '../components/HistoryItem';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ClinicalGoalSectionProps {
    isEditing: boolean;
    data: any;
    updateField: (field: string, value: any) => void;
    getYesNo: (val: any) => string;
}

export function ClinicalGoalSection({ isEditing, data, updateField, getYesNo }: ClinicalGoalSectionProps) {
    return (
        <div className="space-y-16">
            {/* 02: Objetivos y Experiencia */}
            <section className="space-y-8">
                <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                    <span className="w-8 h-[1px] bg-nutri-brand/30" /> 02 // OBJETIVO Y EXPERIENCIA PREVIA
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {isEditing ? (
                        <>
                            <EditItem label="Objetivo Nutricional" value={data?.nutritional_goal} onChange={(v) => updateField('nutritional_goal', v)} className="lg:col-span-2" type="textarea" />
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black text-slate-500">¿Se atendió antes?</Label>
                                <Select value={String(data?.previous_nutrition_service)} onValueChange={(v) => updateField('previous_nutrition_service', v)}>
                                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                        <SelectItem value="true">Sí</SelectItem>
                                        <SelectItem value="false">No</SelectItem>
                                        <SelectItem value="yes_pro">Sí, Nutricionista</SelectItem>
                                        <SelectItem value="yes_non_pro">Sí, No profesional</SelectItem>
                                        <SelectItem value="never">Nunca</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <EditItem label="Calificación Experiencia" value={data?.previous_experience_rating} onChange={(v) => updateField('previous_experience_rating', v)} />
                            <EditItem label="Tiempo siguiendo plan" value={data?.time_following_plan} onChange={(v) => updateField('time_following_plan', v)} className="lg:col-span-4" />
                        </>
                    ) : (
                        <>
                            <SummaryItem label="Objetivo Nutricional" value={data.nutritional_goal} className="lg:col-span-2" />
                            <SummaryItem label="Atención Previa" value={getYesNo(data.previous_nutrition_service)} />
                            <SummaryItem label="Calificación" value={data.previous_experience_rating} />
                            <SummaryItem label="Tiempo con planes" value={data.time_following_plan} className="lg:col-span-4" />
                        </>
                    )}
                </div>
            </section>

            {/* 03: Mediciones */}
            <section className="space-y-8">
                <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                    <span className="w-8 h-[1px] bg-nutri-brand/30" /> 03 // MEDICIONES CORPORALES
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {isEditing ? (
                        <>
                            <EditItem label="Peso (Kg)" value={data?.weight_kg} onChange={(v) => updateField('weight_kg', v)} type="number" />
                            <EditItem label="Talla (cm)" value={data?.height_cm} onChange={(v) => updateField('height_cm', v)} type="number" />
                            <EditItem label="Cintura (cm)" value={data?.waist_cm} onChange={(v) => updateField('waist_cm', v)} type="number" />
                        </>
                    ) : (
                        <>
                            <SummaryItem label="Peso" value={`${data.weight_kg} kg`} />
                            <SummaryItem label="Talla" value={`${data.height_cm} cm`} />
                            <SummaryItem label="Cintura" value={`${data.waist_cm} cm`} />
                        </>
                    )}
                </div>
            </section>
        </div>
    );
}
