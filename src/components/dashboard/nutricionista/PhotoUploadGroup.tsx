"use client";

import React, { useState } from 'react';
import { Camera, Upload, X, Loader2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { removeBackground } from "@imgly/background-removal";

interface PhotoUploadGroupProps {
    patientId: string;
    extraData: Record<string, any>;
    setExtraData: (v: Record<string, any>) => void;
    isUploadingPhoto?: boolean;
    setIsUploadingPhoto?: (v: boolean) => void;
}

const PHOTO_TYPES = [
    { id: 'photo_front_url', label: 'De frente' },
    { id: 'photo_side1_url', label: 'De lado brazo abajo' },
    { id: 'photo_side2_url', label: 'De lado brazo arriba' },
    { id: 'photo_back_url', label: 'De espalda' }
];

export function PhotoUploadGroup({ patientId, extraData, setExtraData, isUploadingPhoto, setIsUploadingPhoto }: PhotoUploadGroupProps) {
    const { toast } = useToast();
    const supabase = createClient();
    const [uploading, setUploading] = useState<string | null>(null);
    const [statusText, setStatusText] = useState("Subiendo...");

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, typeId: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(typeId);
        if (setIsUploadingPhoto) setIsUploadingPhoto(true);
        setStatusText("Procesando silueta con IA...");
        
        try {
            // Dar tiempo al navegador para renderizar el spinner antes de bloquear el hilo principal
            await new Promise(resolve => setTimeout(resolve, 150));

            const worker = new Worker(new URL('../../../lib/workers/bg-removal.worker.ts', import.meta.url));

            const processedBlob = await new Promise<Blob>((resolve, reject) => {
                worker.onmessage = (event) => {
                    if (event.data.success) {
                        resolve(event.data.blob);
                    } else {
                        reject(new Error(event.data.error));
                    }
                    worker.terminate();
                };
                worker.onerror = (error) => {
                    reject(error);
                    worker.terminate();
                };
                worker.postMessage({ file, typeId });
            });

            const processedFile = new File([processedBlob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", { type: "image/jpeg" });

            setStatusText("Subiendo a la nube...");
            const fileExt = "jpg";
            const fileName = `${patientId}/${Date.now()}_${typeId}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('progress-photos')
                .upload(fileName, processedFile, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('progress-photos')
                .getPublicUrl(fileName);

            setExtraData({ ...extraData, [typeId]: publicUrl });
            toast({ title: "Foto subida y procesada correctamente" });
        } catch (error: any) {
            toast({ title: "Error al subir foto", description: error.message, variant: "destructive" });
        } finally {
            setUploading(null);
            if (setIsUploadingPhoto) setIsUploadingPhoto(false);
            setStatusText("Subiendo...");
        }
    };

    const handleRemove = (typeId: string) => {
        const newData = { ...extraData };
        delete newData[typeId];
        setExtraData(newData);
    };

    return (
        <div className="mt-8 col-span-1 lg:col-span-4 bg-white/[0.03] p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] border border-white/5 shadow-inner">
            <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-3">
                <div className="p-2 bg-pink-500/10 rounded-lg"><Camera className="h-4 w-4 text-pink-400" /></div>
                Registro Fotográfico
            </h4>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {PHOTO_TYPES.map((type) => {
                    const currentUrl = extraData[type.id];
                    const isUploading = uploading === type.id;

                    return (
                        <div key={type.id} className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block text-center">
                                {type.label}
                            </label>

                            <div className="relative aspect-[3/4] w-full rounded-2xl border-2 border-dashed border-white/10 bg-white/5 overflow-hidden group hover:border-pink-500/30 transition-all">
                                {isUploading ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 text-pink-400">
                                        <Loader2 className="h-6 w-6 animate-spin mb-2" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-center px-2">{statusText}</span>
                                    </div>
                                ) : currentUrl ? (
                                    <>
                                        <img src={currentUrl} alt={type.label} className="w-full h-full object-contain" />
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                                            <button
                                                type="button"
                                                onClick={() => handleRemove(type.id)}
                                                className="bg-red-500/80 hover:bg-red-500 text-white p-2 rounded-xl transition-colors shadow-lg"
                                            >
                                                <X className="h-4 w-4" />
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <label className="absolute inset-0 flex flex-col items-center justify-center cursor-pointer hover:bg-white/5 transition-colors text-slate-400 hover:text-white">
                                        <Upload className="h-6 w-6 mb-2 opacity-50 text-pink-400" />
                                        <span className="text-[9px] font-black uppercase tracking-widest px-4 text-center">Subir Foto</span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="hidden"
                                            onChange={(e) => handleUpload(e, type.id)}
                                        />
                                    </label>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
