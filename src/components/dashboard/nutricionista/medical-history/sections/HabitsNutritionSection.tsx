"use client";

import React from 'react';
import { SummaryItem, EditItem } from '../components/HistoryItem';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";

interface HabitsNutritionSectionProps {
    isEditing: boolean;
    data: any;
    updateField: (field: string, value: any) => void;
    getYesNo: (val: any) => string;
    formatList: (val: any) => string;
}

export function HabitsNutritionSection({ isEditing, data, updateField, getYesNo, formatList }: HabitsNutritionSectionProps) {
    return (
        <div className="space-y-16">
            {/* 06: Hábitos Fisiológicos */}
            <section className="space-y-8">
                <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                    <span className="w-8 h-[1px] bg-nutri-brand/30" /> 06 // HÁBITOS FISIOLÓGICOS
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {isEditing ? (
                        <>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black text-slate-500 ml-2">Apetito</Label>
                                <Select value={data?.appetite_level} onValueChange={(v) => updateField('appetite_level', v)}>
                                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                    <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                        <SelectItem value="bajo">Bajo</SelectItem>
                                        <SelectItem value="normal">Normal</SelectItem>
                                        <SelectItem value="aumentado">Aumentado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <EditItem label="Horario Pico Apetito" value={formatList(data?.appetite_peak_time)} onChange={(v) => updateField('appetite_peak_time', v.split(',').map((s: string) => s.trim()))} />
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black text-slate-500 ml-2">Nivel Sed</Label>
                                <Select value={data?.thirst_level} onValueChange={(v) => updateField('thirst_level', v)}>
                                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                    <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                        <SelectItem value="bajo">Bajo</SelectItem>
                                        <SelectItem value="normal">Normal</SelectItem>
                                        <SelectItem value="aumentado">Aumentado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black text-slate-500 ml-2">Agua al día</Label>
                                <Select value={data?.water_intake} onValueChange={(v) => updateField('water_intake', v)}>
                                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                    <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                        <SelectItem value="250-500">1-2 vasos (250-500mL)</SelectItem>
                                        <SelectItem value="750-1000">3-4 vasos (750mL-1L)</SelectItem>
                                        <SelectItem value="1250-1500">5-6 vasos (1250-1500mL)</SelectItem>
                                        <SelectItem value="1750-2000">7-8 vasos (1750mL-2L)</SelectItem>
                                        <SelectItem value="2250-2500">9-10 vasos (2250-2500mL)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black text-slate-500 ml-2">Calidad Sueño</Label>
                                <Select value={data?.sleep_quality} onValueChange={(v) => updateField('sleep_quality', v)}>
                                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                    <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                        <SelectItem value="disminuido">Disminuido</SelectItem>
                                        <SelectItem value="normal">Normal</SelectItem>
                                        <SelectItem value="aumentado">Aumentado</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <EditItem label="Horas Sueño" value={data?.sleep_hours} onChange={(v) => updateField('sleep_hours', v)} />
                            <EditItem label="Deposiciones" value={data?.bowel_movements} onChange={(v) => updateField('bowel_movements', v)} />
                            <EditItem label="Frec. Deposiciones" value={data?.bowel_frequency} onChange={(v) => updateField('bowel_frequency', v)} />
                            <EditItem label="Estado Orina" value={data?.urine_status} onChange={(v) => updateField('urine_status', v)} />
                            <div className="space-y-3 col-span-full bg-white/5 p-6 rounded-2xl border border-white/10">
                                <Label className="text-[10px] uppercase font-black text-slate-500 ml-2">Índice de color de orina (1-8)</Label>
                                <div className="flex flex-wrap gap-4 mt-2">
                                    {[
                                        { id: 1, color: "#FDF5E6" }, { id: 2, color: "#FBE7A1" },
                                        { id: 3, color: "#F9D94A" }, { id: 4, color: "#FAD02C" },
                                        { id: 5, color: "#F2C029" }, { id: 6, color: "#EAAC14" },
                                        { id: 7, color: "#D99101" }, { id: 8, color: "#7C7601" }
                                    ].map((item) => (
                                        <div
                                            key={item.id}
                                            onClick={() => updateField('urine_color_index', item.id)}
                                            className={cn(
                                                "w-10 h-10 rounded-full cursor-pointer border-4 transition-all hover:scale-110",
                                                data?.urine_color_index === item.id ? "border-nutri-brand scale-110 ring-4 ring-nutri-brand/20" : "border-white/10"
                                            )}
                                            style={{ backgroundColor: item.color }}
                                        />
                                    ))}
                                </div>
                            </div>
                        </>
                    ) : (
                        <>
                            <SummaryItem label="Apetito" value={data.appetite_level} />
                            <SummaryItem label="Pico Apetito" value={formatList(data.appetite_peak_time)} />
                            <SummaryItem label="Sed" value={data.thirst_level} />
                            <SummaryItem label="Agua" value={data.water_intake} />
                            <SummaryItem label="Calidad Sueño" value={data.sleep_quality} />
                            <SummaryItem label="Horas Sueño" value={`${data.sleep_hours}h`} />
                            <SummaryItem label="Deposiciones" value={data.bowel_movements} />
                            <SummaryItem label="Frecuencia" value={data.bowel_frequency} />
                            <SummaryItem label="Orina" value={data.urine_status} />
                            <div className="space-y-1.5 p-5 rounded-[1.5rem] bg-white/[0.03] border border-white/5">
                                <p className="text-[9px] uppercase font-black tracking-[0.1em] text-slate-500">Color Orina</p>
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-4 h-4 rounded-full border border-white/20"
                                        style={{
                                            backgroundColor: [
                                                "", "#FDF5E6", "#FBE7A1", "#F9D94A", "#FAD02C", "#F2C029", "#EAAC14", "#D99101", "#7C7601"
                                            ][data.urine_color_index || 0]
                                        }}
                                    />
                                    <p className="text-slate-200 font-bold text-sm">Índice {data.urine_color_index || '-'}</p>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </section>

            {/* 07: Alimentación */}
            <section className="space-y-8">
                <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                    <span className="w-8 h-[1px] bg-nutri-brand/30" /> 07 // ALIMENTACIÓN Y COCINA
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {isEditing ? (
                        <>
                            <EditItem label="Instrumentos (Balanza, etc)" value={formatList(data?.available_instruments)} onChange={(v) => updateField('available_instruments', v.split(',').map((s: string) => s.trim()))} />
                            <EditItem label="Tipo Alimentación Spec." value={data?.specific_diet_type} onChange={(v) => updateField('specific_diet_type', v)} />
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black text-slate-500 ml-2">Quién prepara tu comida</Label>
                                <Select value={data?.cooks_for_self} onValueChange={(v) => updateField('cooks_for_self', v)}>
                                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                    <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                        <SelectItem value="yo_mismo">Yo mism@</SelectItem>
                                        <SelectItem value="pareja">Pareja</SelectItem>
                                        <SelectItem value="mama">Mamá</SelectItem>
                                        <SelectItem value="hermana">Hermana</SelectItem>
                                        <SelectItem value="abuela">Abuela</SelectItem>
                                        <SelectItem value="restaurante">Restaurante</SelectItem>
                                        <SelectItem value="concesionario">Concesionario</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black text-slate-500 ml-2">¿Le gusta cocinar?</Label>
                                <Select value={String(data?.likes_cooking)} onValueChange={(v) => updateField('likes_cooking', v === 'true')}>
                                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                        <SelectItem value="true">Sí</SelectItem>
                                        <SelectItem value="false">No</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <EditItem label="Qué preparaciones realiza" value={data?.cooking_preparations} onChange={(v) => updateField('cooking_preparations', v)} />
                            <EditItem label="Alergias" value={data?.food_allergies} onChange={(v) => updateField('food_allergies', v)} />
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black text-slate-500">¿Intolerancias?</Label>
                                <Select value={String(data?.food_intolerances)} onValueChange={(v) => updateField('food_intolerances', v === 'true')}>
                                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                        <SelectItem value="true">Sí</SelectItem>
                                        <SelectItem value="false">No</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <EditItem label="Detalles Intolerancias" value={data?.intolerance_details} onChange={(v) => updateField('intolerance_details', v)} />
                        </>
                    ) : (
                        <>
                            <SummaryItem label="Instrumentos" value={formatList(data.available_instruments)} />
                            <SummaryItem label="Dieta Específica" value={data.specific_diet_type} />
                            <SummaryItem label="Prepara" value={data.cooks_for_self} />
                            <SummaryItem label="Gusta cocinar" value={getYesNo(data.likes_cooking)} />
                            <SummaryItem label="Preparaciones" value={data.cooking_preparations} />
                            <SummaryItem label="Alergias" value={data.food_allergies} />
                            <SummaryItem label="Intolerancias" value={getYesNo(data.food_intolerances)} />
                            <SummaryItem label="Detalle Intolerancia" value={data.intolerance_details} />
                        </>
                    )}
                </div>
            </section>

            {/* 08: Lácteos y Suplementos */}
            <section className="space-y-8">
                <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                    <span className="w-8 h-[1px] bg-nutri-brand/30" /> 08 // LÁCTEOS Y SUPLEMENTACIÓN
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {isEditing ? (
                        <>
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black text-slate-500 ml-2">Lácteos que consume</Label>
                                <Select value={data?.dairy_consumption} onValueChange={(v) => updateField('dairy_consumption', v)}>
                                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                                    <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                        <SelectItem value="ninguno">Ninguno</SelectItem>
                                        <SelectItem value="leche">Leche</SelectItem>
                                        <SelectItem value="yogurt">Yogurt</SelectItem>
                                        <SelectItem value="queso">Queso</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <EditItem label="Marcas Lácteos" value={data?.dairy_brands} onChange={(v) => updateField('dairy_brands', v)} />
                            <div className="space-y-2">
                                <Label className="text-[10px] uppercase font-black text-slate-500">¿Consume Suplementos?</Label>
                                <Select value={String(data?.supplements_consumption)} onValueChange={(v) => updateField('supplements_consumption', v === 'true')}>
                                    <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold"><SelectValue /></SelectTrigger>
                                    <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                        <SelectItem value="true">Sí</SelectItem>
                                        <SelectItem value="false">No</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <EditItem label="Tipos de suplemento" value={formatList(data?.supplement_types)} onChange={(v) => updateField('supplement_types', v.split(',').map((s: string) => s.trim()))} />
                        </>
                    ) : (
                        <>
                            <SummaryItem label="Lácteos" value={data.dairy_consumption} />
                            <SummaryItem label="Marcas" value={data.dairy_brands} />
                            <SummaryItem label="Suplementos" value={getYesNo(data.supplements_consumption)} />
                            <SummaryItem label="Tipos" value={formatList(data.supplement_types)} />
                        </>
                    )}
                </div>
            </section>
        </div>
    );
}
