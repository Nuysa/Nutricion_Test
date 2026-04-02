"use client";

import React, { useState, useRef } from 'react';
import { Camera, Upload, X, Loader2, Check } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { getCroppedImg, getPixelCrop } from "@/lib/utils/crop-image";
import { cn } from "@/lib/utils";

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
    
    // Estados para el recorte
    const [croppingSlot, setCroppingSlot] = useState<string | null>(null);
    const [tempImage, setTempImage] = useState<string | null>(null);
    const [crop, setCrop] = useState<Crop>({
        unit: '%',
        x: 10,
        y: 10,
        width: 80,
        height: 80,
    });
    const imgRef = useRef<HTMLImageElement | null>(null);

    const onImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
        const { width, height } = e.currentTarget;
        imgRef.current = e.currentTarget;
        const initialCrop = centerCrop(
            { unit: '%', width: 90, height: 90 },
            width,
            height
        );
        setCrop(initialCrop);
    };

    const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>, typeId: string) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!patientId) {
            toast({ title: "Error", description: "Cargando ID del paciente... Por favor intenta en un momento.", variant: "destructive" });
            return;
        }

        const reader = new FileReader();
        reader.onload = () => {
            setTempImage(reader.result as string);
            setCroppingSlot(typeId);
        };
        reader.readAsDataURL(file);
    };

    const handleConfirmCrop = async () => {
        if (!croppingSlot || !tempImage || !crop || !imgRef.current) return;

        const typeId = croppingSlot;
        setUploadingSlots(prev => ({ ...prev, [typeId]: "Guardando..." }));
        if (setIsUploadingPhoto) setIsUploadingPhoto(true);

        const currentTempImage = tempImage;
        const currentCrop = crop;
        const currentImg = imgRef.current;
        
        // Reset crop view immediately
        setCroppingSlot(null);
        setTempImage(null);

        try {
            const pixelCrop = getPixelCrop(currentImg, currentCrop);
            const croppedBlob = await getCroppedImg(currentTempImage, pixelCrop);
            const fileName = `${patientId}/${Date.now()}_${typeId}.jpg`;

            const { error: uploadError } = await supabase.storage
                .from('progress-photos')
                .upload(fileName, croppedBlob, { upsert: true, contentType: 'image/jpeg' });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('progress-photos')
                .getPublicUrl(fileName);

            setExtraData((prev: any) => ({ ...prev, [typeId.toUpperCase()]: publicUrl }));
            toast({ title: "Foto guardada correctamente" });
        } catch (error: any) {
            toast({ title: "Error al guardar foto", description: error.message, variant: "destructive" });
        } finally {
            setUploadingSlots(prev => {
                const next = { ...prev };
                delete next[typeId];
                if (Object.keys(next).length === 0 && setIsUploadingPhoto) {
                    setIsUploadingPhoto(false);
                }
                return next;
            });
        }
    };

    const handleCancelCrop = () => {
        setCroppingSlot(null);
        setTempImage(null);
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
                Registro Fotográfico
            </h4>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {PHOTO_TYPES.map((type) => {
                    const currentUrl = extraData[type.id.toUpperCase()] || extraData[type.id];
                    const slotStatus = uploadingSlots[type.id];
                    const isUploading = !!slotStatus;
                    const isCropping = croppingSlot === type.id;

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
                                ) : isCropping && tempImage ? (
                                    <div className="absolute inset-0 z-30 bg-[#0B1120] flex flex-col items-center">
                                        <div className="w-full h-[calc(100%-48px)] flex items-center justify-center p-4">
                                            <ReactCrop
                                                crop={crop}
                                                onChange={c => setCrop(c)}
                                                className="max-w-full max-h-full overflow-visible"
                                            >
                                                <img 
                                                    src={tempImage} 
                                                    alt="Crop view" 
                                                    onLoad={onImageLoad}
                                                    ref={imgRef}
                                                    className="max-w-full max-h-full object-contain"
                                                />
                                            </ReactCrop>
                                        </div>
                                        <div className="w-full h-12 bg-black/90 flex items-center justify-around border-t border-white/10 mt-auto">
                                            <button onClick={handleCancelCrop} className="p-2 text-red-400 hover:text-red-300 transition-colors">
                                                <X className="h-6 w-6" />
                                            </button>
                                            <button onClick={handleConfirmCrop} className="p-2 text-emerald-400 hover:text-emerald-300 transition-colors">
                                                <Check className="h-6 w-6" />
                                            </button>
                                        </div>
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
                                            onChange={(e) => handleFileSelect(e, type.id)}
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
