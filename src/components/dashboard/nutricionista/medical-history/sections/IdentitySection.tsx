"use client";

import React from 'react';
import { SummaryItem, EditItem } from '../components/HistoryItem';
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface IdentitySectionProps {
    isEditing: boolean;
    data: any;
    updateField: (field: string, value: any) => void;
    formatDate: (d: string) => string;
    toISODate: (d: string) => string;
}

export function IdentitySection({ isEditing, data, updateField, formatDate, toISODate }: IdentitySectionProps) {
    if (isEditing) {
        return (
            <section className="space-y-8">
                <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                    <span className="w-8 h-[1px] bg-nutri-brand/30" /> 01 // IDENTIDAD Y DATOS PERSONALES
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                    <EditItem label="Fecha Registro" value={toISODate(data?.created_at)} onChange={(v) => updateField('created_at', v)} type="date" />
                    <EditItem label="Nombre Completo" value={data?.full_name} onChange={(v) => updateField('full_name', v)} />
                    <EditItem label="DNI / CE" value={data?.dni} onChange={(v) => updateField('dni', v)} />
                    <EditItem label="Email" value={data?.email} onChange={(v) => updateField('email', v)} />
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black text-slate-500 ml-2">Edad</Label>
                        <div className="h-12 bg-white/5 border border-white/10 text-white rounded-xl font-bold flex items-center px-4 cursor-not-allowed opacity-70">
                            {data?.age || '-'}
                        </div>
                    </div>
                    <EditItem label="Fecha Nacimiento" value={toISODate(data?.birth_date)} onChange={(v) => updateField('birth_date', v)} type="date" />
                    <EditItem label="Instagram" value={data?.instagram} onChange={(v) => updateField('instagram', v)} />
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black text-slate-500 ml-2">Género</Label>
                        <Select value={data?.gender} onValueChange={(v) => updateField('gender', v)}>
                            <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                            <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                <SelectItem value="Masculino">Masculino</SelectItem>
                                <SelectItem value="Femenino">Femenino</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black text-slate-500 ml-2">Grado Instrucción</Label>
                        <Select value={data?.education_level} onValueChange={(v) => updateField('education_level', v)}>
                            <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                            <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                <SelectItem value="secundaria_incompleta">Secundaria incompleta</SelectItem>
                                <SelectItem value="tecnico">Técnico</SelectItem>
                                <SelectItem value="superior_incompleta">Superior incompleta</SelectItem>
                                <SelectItem value="superior">Superior</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <EditItem label="Región/Estado" value={data?.region} onChange={(v) => updateField('region', v)} />
                    <EditItem label="Distrito" value={data?.district} onChange={(v) => updateField('district', v)} />
                    <EditItem label="A qué te dedicas" value={data?.occupation} onChange={(v) => updateField('occupation', v)} />
                    <div className="space-y-2">
                        <Label className="text-[10px] uppercase font-black text-slate-500 ml-2">Ocupación Específica</Label>
                        <Select value={data?.job_details} onValueChange={(v) => updateField('job_details', v)}>
                            <SelectTrigger className="h-12 bg-white/5 border-white/10 text-white rounded-xl font-bold"><SelectValue placeholder="Seleccionar" /></SelectTrigger>
                            <SelectContent className="bg-[#151F32] border-white/10 text-white">
                                <SelectItem value="presencial">Presencial</SelectItem>
                                <SelectItem value="remoto">Remoto</SelectItem>
                                <SelectItem value="casa">Labores de casa</SelectItem>
                                <SelectItem value="estudiante">Estudiante</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </section>
        );
    }

    return (
        <section className="space-y-8">
            <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                <span className="w-8 h-[1px] bg-nutri-brand/30" /> 01 // IDENTIDAD Y DATOS PERSONALES
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
                <SummaryItem label="Fecha Registro" value={formatDate(data.created_at)} />
                <SummaryItem label="Nombre Completo" value={data.full_name} />
                <SummaryItem label="DNI" value={data.dni} />
                <SummaryItem label="Email" value={data.email} />
                <SummaryItem label="Edad" value={`${data.age} años`} />
                <SummaryItem label="Nacimiento" value={formatDate(data.birth_date)} />
                <SummaryItem label="Instagram" value={data.instagram} />
                <SummaryItem label="Género" value={data.gender} />
                <SummaryItem label="Instrucción" value={data.education_level} />
                <SummaryItem label="Ubicación" value={`${data.district || ''}, ${data.region || ''}`} />
                <SummaryItem label="Dedicación" value={data.occupation} />
                <SummaryItem label="Tipo Trabajo" value={data.job_details} />
            </div>
        </section>
    );
}
