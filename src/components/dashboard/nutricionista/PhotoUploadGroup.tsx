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
    { id: 'photo_front_url', label: 'FRENTE' },
    { id: 'photo_side1_url', label: 'COSTADO 1' },
    { id: 'photo_side2_url', label: 'COSTADO 2' },
    { id: 'photo_back_url', label: 'ESPALDA' }
];

export function PhotoUploadGroup({ patientId, extraData, setExtraData, isUploadingPhoto, setIsUploadingPhoto }: PhotoUploadGroupProps) {
    const { toast } = useToast();
    const supabase = createClient();
    const [uploadingSlots, setUploadingSlots] = useState<Record<string, string>>({});

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, typeId: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!patientId) {
            toast({ title: "Error", description: "Cargando ID del paciente... Por favor intenta en un momento.", variant: "destructive" });
            return;
        }

        setUploadingSlots(prev => ({ ...prev, [typeId]: "Procesando silueta..." }));
        if (setIsUploadingPhoto) setIsUploadingPhoto(true);
        
        try {
            // Dar tiempo al navegador para renderizar el spinner
            await new Promise(resolve => setTimeout(resolve, 150));

            const worker = new Worker(new URL('../../../lib/workers/bg-removal.worker.ts', import.meta.url), { type: 'module' });

            const { processedBlob, isFallback } = await new Promise<{ processedBlob: Blob, isFallback: boolean }>((resolve, reject) => {
                worker.onmessage = (event) => {
                    if (event.data.success) {
                        resolve({ 
                            processedBlob: event.data.blob, 
                            isFallback: !!event.data.isFallback 
                        });
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

            const fileBaseName = file.name.split('.').slice(0, -1).join('.') || 'foto';
            const processedFile = new File([processedBlob], `${fileBaseName}.jpg`, { type: "image/jpeg" });

            setUploadingSlots(prev => ({ ...prev, [typeId]: "Subiendo..." }));
            const fileExt = "jpg";
            const fileName = `${patientId}/${Date.now()}_${typeId}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('progress-photos')
                .upload(fileName, processedFile, { upsert: true });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('progress-photos')
                .getPublicUrl(fileName);

            // Uso de actualización funcional para evitar condiciones de carrera entre cargas simultáneas
            setExtraData((prev: any) => ({ ...prev, [typeId.toUpperCase()]: publicUrl }));
            
            if (isFallback) {
                toast({ 
                    title: "Foto cargada (Sin procesar)", 
                    description: "No se pudo quitar el fondo por problemas de red, se guardó la original.",
                    variant: "default" 
                });
            } else {
                toast({ title: "Foto subida y procesada correctamente" });
            }
        } catch (error: any) {
            toast({ title: "Error al subir foto", description: error.message, variant: "destructive" });
        } finally {
            setUploadingSlots(prev => {
                const next = { ...prev };
                delete next[typeId];
                
                // Si ya no quedan procesos activos, avisamos al padre
                if (Object.keys(next).length === 0 && setIsUploadingPhoto) {
                    setIsUploadingPhoto(false);
                }
                return next;
            });
        }
    };

    const handleRemove = (typeId: string) => {
        setExtraData((prev: any) => {
            const newData = { ...prev };
            delete newData[typeId.toUpperCase()];
            return newData;
        });
    };

    return (
        <div className="mt-8 col-span-1 lg:col-span-4 bg-white/[0.03] p-6 lg:p-8 rounded-[2rem] lg:rounded-[2.5rem] border border-white/5 shadow-inner">
            <h4 className="text-xs font-black text-white uppercase tracking-widest mb-6 flex items-center gap-3">
                <div className="p-2 bg-pink-500/10 rounded-lg"><Camera className="h-4 w-4 text-pink-400" /></div>
                Fotos de Progreso
            </h4>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {PHOTO_TYPES.map((type) => {
                    const currentUrl = extraData[type.id.toUpperCase()] || extraData[type.id];
                    const slotStatus = uploadingSlots[type.id];
                    const isUploading = !!slotStatus;

                    return (
                        <div key={type.id} className="flex flex-col gap-2">
                            <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider block text-center">
                                {type.label}
                            </label>

                            <div className="relative aspect-[3/4] w-full rounded-2xl border-2 border-dashed border-white/10 bg-white/5 overflow-hidden group hover:border-pink-500/30 transition-all text-white">
                                {isUploading ? (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-[#0B1120]/80 backdrop-blur-sm text-pink-400 z-20">
                                        <Loader2 className="h-6 w-6 animate-spin mb-2" />
                                        <span className="text-[8px] font-black uppercase tracking-widest text-center px-2 leading-tight">
                                            {slotStatus}
                                        </span>
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
                                            disabled={isUploadingPhoto} 
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
