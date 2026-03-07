"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Pencil, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditableTextProps {
    value: string;
    onSave: (newValue: string) => Promise<void>;
    label?: string;
    className?: string;
    multiline?: boolean;
    children?: React.ReactNode;
}

export function EditableText({ value, onSave, label, className, multiline, children }: EditableTextProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value);
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setTempValue(value);
    }, [value]);

    const handleSave = async () => {
        if (tempValue === value) {
            setIsEditing(false);
            return;
        }
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
        <div className={cn("relative group/item flex items-start gap-2", className)}>
            {children ? (
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
            ) : (
                <>
                    <div className="flex-1 whitespace-pre-wrap">
                        {value}
                    </div>

                    <button
                        onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            setIsEditing(true);
                        }}
                        className="opacity-0 group-hover/item:opacity-100 transition-opacity p-1.5 bg-nutri-brand text-nutri-base rounded-full shadow-lg hover:scale-110 cursor-pointer relative z-[60]"
                        title={`Editar ${label || "texto"}`}
                    >
                        <Pencil className="h-3 w-3" />
                    </button>
                </>
            )}

            {isEditing && mounted && createPortal(
                <div
                    className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 sm:p-6"
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                >
                    <div
                        className="bg-[#0f172a] border border-white/10 p-8 md:p-10 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] max-w-3xl w-full animate-in zoom-in-95 duration-200 relative overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Decorative background blur */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-nutri-brand/10 blur-[100px] pointer-events-none" />

                        <h3 className="text-white font-tech font-bold text-3xl mb-8 flex items-center gap-4">
                            <div className="p-4 bg-nutri-brand/20 rounded-[1.25rem] shadow-inner">
                                <Pencil className="text-nutri-brand h-8 w-8" />
                            </div>
                            <span className="tracking-tight">Editar {label || "Texto"}</span>
                        </h3>

                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase text-slate-400 mb-2 block tracking-[0.2em] ml-1 opacity-60">
                                    CONTENIDO DEL TEXTO
                                </label>
                                {multiline ? (
                                    <textarea
                                        className="w-full bg-[#1e293b] border-2 border-white/5 rounded-2xl p-6 text-white outline-none focus:border-nutri-brand/50 focus:ring-4 focus:ring-nutri-brand/10 transition-all font-sans text-xl shadow-inner min-h-[250px] leading-relaxed"
                                        value={tempValue}
                                        onChange={(e) => setTempValue(e.target.value)}
                                        autoFocus
                                    />
                                ) : (
                                    <input
                                        type="text"
                                        className="w-full bg-[#1e293b] border-2 border-white/5 rounded-2xl py-5 px-6 text-white outline-none focus:border-nutri-brand/50 focus:ring-4 focus:ring-nutri-brand/10 transition-all font-sans text-xl shadow-inner"
                                        value={tempValue}
                                        onChange={(e) => setTempValue(e.target.value)}
                                        autoFocus
                                    />
                                )}
                            </div>

                            <div className="flex justify-end gap-4 pt-6">
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setIsEditing(false);
                                    }}
                                    className="px-8 py-4 rounded-2xl border border-white/10 text-slate-400 font-tech font-bold hover:bg-white/5 hover:text-white transition-all text-lg"
                                    disabled={loading}
                                >
                                    <X className="h-6 w-6 mr-2 inline" /> Cancelar
                                </button>
                                <button
                                    onClick={(e) => {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleSave();
                                    }}
                                    className="px-10 py-4 rounded-2xl bg-nutri-brand text-nutri-base font-tech font-bold hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center gap-3 shadow-[0_20px_40px_rgba(255,122,0,0.2)] text-lg"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <div className="h-6 w-6 border-3 border-nutri-base border-t-transparent animate-spin rounded-full" />
                                    ) : (
                                        <>
                                            <Check className="h-6 w-6 stroke-[3px]" /> Guardar Cambios
                                        </>
                                    )}
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
