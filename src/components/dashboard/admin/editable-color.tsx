"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Palette, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditableColorProps {
    value: string;
    onSave: (newValue: string) => Promise<void>;
    label?: string;
    children?: React.ReactNode;
}

const PRESET_COLORS = [
    { name: "NuySa Brand", value: "#FF7A00" },
    { name: "Lime", value: "#A3E635" },
    { name: "Mint", value: "#A7F3D0" },
    { name: "Base", value: "#0B1120" },
    { name: "Panel", value: "#151F32" },
    { name: "White", value: "#FFFFFF" },
    { name: "Black", value: "#000000" },
    { name: "Slate", value: "#64748b" },
];

export function EditableColor({ value, onSave, label, children }: EditableColorProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value);
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        // If the value is a tailwind class, we might need to handle it or just default to black if it's not a hex
        if (value.startsWith('#')) {
            setTempValue(value);
        }
    }, [value]);

    const handleSave = async () => {
        setLoading(true);
        try {
            await onSave(tempValue);
            setIsEditing(false);
        } catch (error) {
            console.error("Save error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="relative group/color-item">
            <div
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsEditing(true);
                }}
                className="cursor-pointer"
            >
                {children}
            </div>

            {isEditing && mounted && createPortal(
                <div
                    className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 sm:p-6"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                >
                    <div
                        className="bg-[#0f172a] border border-white/10 p-8 md:p-10 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] max-w-md w-full animate-in zoom-in-95 duration-200 relative overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Decorative background blur */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-nutri-brand/10 blur-[100px] pointer-events-none" />

                        <h3 className="text-white font-tech font-bold text-2xl mb-8 flex items-center gap-4">
                            <div className="p-3 bg-nutri-brand/20 rounded-[1.25rem]">
                                <Palette className="text-nutri-brand h-6 w-6" />
                            </div>
                            <span>Editar {label || "Color"}</span>
                        </h3>

                        <div className="space-y-8">
                            <div className="space-y-4">
                                <label className="text-xs font-black uppercase text-slate-400 block tracking-[0.2em] opacity-60">
                                    PALETA DE COLORES
                                </label>
                                <div className="grid grid-cols-4 gap-3">
                                    {PRESET_COLORS.map((color) => (
                                        <button
                                            key={color.value}
                                            onClick={() => setTempValue(color.value)}
                                            className={cn(
                                                "w-full aspect-square rounded-xl border-2 transition-all hover:scale-105 active:scale-95",
                                                tempValue === color.value ? "border-nutri-brand" : "border-white/10"
                                            )}
                                            style={{ backgroundColor: color.value }}
                                            title={color.name}
                                        />
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-4">
                                <label className="text-xs font-black uppercase text-slate-400 block tracking-[0.2em] opacity-60">
                                    COLOR PERSONALIZADO
                                </label>
                                <div className="flex items-center gap-4">
                                    <input
                                        type="color"
                                        className="h-14 w-28 bg-transparent border-none cursor-pointer rounded-lg overflow-hidden"
                                        value={tempValue.startsWith('#') ? tempValue : "#000000"}
                                        onChange={(e) => setTempValue(e.target.value)}
                                    />
                                    <input
                                        type="text"
                                        className="flex-1 bg-[#1e293b] border-2 border-white/5 rounded-2xl py-3 px-4 text-white uppercase font-mono text-center outline-none focus:border-nutri-brand/50 transition-all"
                                        value={tempValue}
                                        onChange={(e) => setTempValue(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    onClick={() => setIsEditing(false)}
                                    className="px-6 py-3 rounded-xl border border-white/10 text-slate-400 font-tech font-bold hover:bg-white/5 transition-all"
                                    disabled={loading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
                                    className="px-8 py-3 rounded-xl bg-nutri-brand text-nutri-base font-tech font-bold flex items-center gap-2 shadow-lg"
                                    disabled={loading}
                                >
                                    {loading ? <div className="h-5 w-5 border-2 border-nutri-base border-t-transparent animate-spin rounded-full" /> : <Check className="h-5 w-5" />}
                                    Guardar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
