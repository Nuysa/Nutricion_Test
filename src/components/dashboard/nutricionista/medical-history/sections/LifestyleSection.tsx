"use client";

import React from 'react';
import { SummaryItem, EditItem } from '../components/HistoryItem';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface LifestyleSectionProps {
    isEditing: boolean;
    data: any;
    updateField: (field: string, value: any) => void;
    formatList: (val: any) => string;
}

export function LifestyleSection({ isEditing, data, updateField, formatList }: LifestyleSectionProps) {
    return (
        <section className="space-y-8">
            <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                <span className="w-8 h-[1px] bg-nutri-brand/30" /> 09 // AVERSIONES Y ESTILO DE VIDA
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isEditing ? (
                    <>
                        <EditItem label="Cereales No Agradan" value={formatList(data?.disliked_cereals)} onChange={(v) => updateField('disliked_cereals', v.split(',').map((s: string) => s.trim()))} />
                        <EditItem label="Tubérculos No Agradan" value={formatList(data?.disliked_tubers)} onChange={(v) => updateField('disliked_tubers', v.split(',').map((s: string) => s.trim()))} />
                        <EditItem label="Menestras No Agradan" value={formatList(data?.disliked_legumes)} onChange={(v) => updateField('disliked_legumes', v.split(',').map((s: string) => s.trim()))} />
                        <EditItem label="Vegetales No Agradan" value={data?.disliked_vegetables} onChange={(v) => updateField('disliked_vegetables', v)} />
                        <EditItem label="Frutas No Agradan" value={data?.disliked_fruits} onChange={(v) => updateField('disliked_fruits', v)} />
                        <EditItem label="Carnes No Agradan" value={formatList(data?.disliked_meats)} onChange={(v) => updateField('disliked_meats', v.split(',').map((s: string) => s.trim()))} />
                        <EditItem label="Grasas No Agradan" value={formatList(data?.disliked_fats)} onChange={(v) => updateField('disliked_fats', v.split(',').map((s: string) => s.trim()))} />
                        <EditItem label="Preparaciones No Agradan" value={data?.disliked_preparations} onChange={(v) => updateField('disliked_preparations', v)} />
                        <EditItem label="Hábitos Malos Pasados" value={formatList(data?.previous_unhealthy_habits)} onChange={(v) => updateField('previous_unhealthy_habits', v.split(',').map((s: string) => s.trim()))} />
                        <EditItem label="Hora Despertar" value={data?.wake_up_time} onChange={(v) => updateField('wake_up_time', v)} type="time" />
                        <EditItem label="Hora Dormir" value={data?.sleep_time} onChange={(v) => updateField('sleep_time', v)} type="time" />
                        <EditItem label="Hora Desayuno" value={data?.breakfast_time} onChange={(v) => updateField('breakfast_time', v)} type="time" />
                        <EditItem label="Detalle Desayuno" value={data?.breakfast_details} onChange={(v) => updateField('breakfast_details', v)} type="textarea" />
                        <EditItem label="Hora Almuerzo" value={data?.lunch_time} onChange={(v) => updateField('lunch_time', v)} type="time" />
                        <EditItem label="Detalle Almuerzo" value={data?.lunch_details} onChange={(v) => updateField('lunch_details', v)} type="textarea" />
                        <EditItem label="Hora Cena" value={data?.dinner_time} onChange={(v) => updateField('dinner_time', v)} type="time" />
                        <EditItem label="Detalle Cena" value={data?.dinner_details} onChange={(v) => updateField('dinner_details', v)} type="textarea" />
                        <EditItem label="Detalle Snacks" value={data?.snack_details} onChange={(v) => updateField('snack_details', v)} type="textarea" />
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black text-slate-500 ml-2">Preferencia Preparación</Label>
                            <Select value={data?.prep_preference} onValueChange={(v) => updateField('prep_preference', v)}>
                                <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                    <SelectItem value="faciles">Fáciles</SelectItem>
                                    <SelectItem value="dificiles">Difíciles</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label className="text-[10px] uppercase font-black text-slate-500 ml-2">Preferencia Sabor</Label>
                            <Select value={data?.taste_preference} onValueChange={(v) => updateField('taste_preference', v)}>
                                <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                    <SelectItem value="dulces">Dulces</SelectItem>
                                    <SelectItem value="salados">Salados</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </>
                ) : (
                    <>
                        <SummaryItem label="Cereales Disgusto" value={formatList(data.disliked_cereals)} />
                        <SummaryItem label="Tubérculos Disgusto" value={formatList(data.disliked_tubers)} />
                        <SummaryItem label="Menestras Disgusto" value={formatList(data.disliked_legumes)} />
                        <SummaryItem label="Vegetales Disgusto" value={data.disliked_vegetables} />
                        <SummaryItem label="Frutas Disgusto" value={data.disliked_fruits} />
                        <SummaryItem label="Carnes Disgusto" value={formatList(data.disliked_meats)} />
                        <SummaryItem label="Grasas Disgusto" value={formatList(data.disliked_fats)} />
                        <SummaryItem label="Preparaciones Disgusto" value={data.disliked_preparations} />
                        <SummaryItem label="Hábitos a cambiar" value={formatList(data.previous_unhealthy_habits)} />
                        <SummaryItem label="Hora Despertar" value={data.wake_up_time} />
                        <SummaryItem label="Hora Dormir" value={data.sleep_time} />
                        <SummaryItem label="Desayuno" value={`${data.breakfast_time || '-'}: ${data.breakfast_details || ''}`} />
                        <SummaryItem label="Almuerzo" value={`${data.lunch_time || '-'}: ${data.lunch_details || ''}`} />
                        <SummaryItem label="Cena" value={`${data.dinner_time || '-'}: ${data.dinner_details || ''}`} />
                        <SummaryItem label="Media Tarde/Mañana" value={data.snack_details} />
                        <SummaryItem label="Preferencias" value={`${data.prep_preference || '-'} / ${data.taste_preference || '-'}`} />
                    </>
                )}
            </div>
        </section>
    );
}
