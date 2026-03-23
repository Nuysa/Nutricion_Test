"use client";

import React from 'react';
import { SummaryItem, EditItem } from '../components/HistoryItem';

interface MultimediaSectionProps {
    isEditing: boolean;
    data: any;
    updateField: (field: string, value: any) => void;
}

export function MultimediaSection({ isEditing, data, updateField }: MultimediaSectionProps) {
    return (
        <section className="space-y-8">
            <h3 className="text-nutri-brand font-tech uppercase tracking-[0.3em] text-xs font-black flex items-center gap-3">
                <span className="w-8 h-[1px] bg-nutri-brand/30" /> 10 // MULTIMEDIA Y ARCHIVOS
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isEditing ? (
                    <>
                        <EditItem label="Foto Frente" value={data?.front_photo_url} onChange={(v) => updateField('front_photo_url', v)} />
                        <EditItem label="Foto Costado 1" value={data?.side_photo_1_url} onChange={(v) => updateField('side_photo_1_url', v)} />
                        <EditItem label="Foto Costado 2" value={data?.side_photo_2_url} onChange={(v) => updateField('side_photo_2_url', v)} />
                        <EditItem label="Foto Espalda" value={data?.back_photo_url} onChange={(v) => updateField('back_photo_url', v)} />
                        <EditItem label="Fotos Lácteos" value={data?.dairy_photos} onChange={(v) => updateField('dairy_photos', v)} />
                        <EditItem label="Fotos Suplementos" value={data?.supplement_photos} onChange={(v) => updateField('supplement_photos', v)} />
                    </>
                ) : (
                    <>
                        <SummaryItem label="Foto Frente" value={data.front_photo_url} />
                        <SummaryItem label="Foto Costado 1" value={data.side_photo_1_url} />
                        <SummaryItem label="Foto Costado 2" value={data.side_photo_2_url} />
                        <SummaryItem label="Foto Espalda" value={data.back_photo_url} />
                        <SummaryItem label="Fotos Lácteos" value={data.dairy_photos} />
                        <SummaryItem label="Fotos Suplementos" value={data.supplement_photos} />
                    </>
                )}
            </div>
        </section>
    );
}
