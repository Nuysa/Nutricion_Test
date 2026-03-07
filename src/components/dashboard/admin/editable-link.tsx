"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Link as LinkIcon, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditableLinkProps {
    url: string; // Changed from href to url to match usage in PlansSection
    onSave: (newUrl: string) => Promise<void>;
    label?: string;
    className?: string;
    children?: React.ReactNode;
}

export function EditableLink({ url, onSave, label, className, children }: EditableLinkProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [tempHref, setTempHref] = useState(url);
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        setTempHref(url);
    }, [url]);

    const handleSave = async (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();

        if (tempHref === url) {
            setIsEditing(false);
            return;
        }
        setLoading(true);
        try {
            await onSave(tempHref);
            setIsEditing(false);
        } catch (error) {
            console.error("Save error:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCancel = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setTempHref(url);
        setIsEditing(false);
    };

    return (
        <>
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
                <button
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setIsEditing(true);
                    }}
                    className={cn(
                        "relative z-[60] p-1.5 bg-nutri-brand text-nutri-base rounded-full shadow-lg hover:scale-110 transition-transform",
                        className
                    )}
                    title={`Editar ${label || "enlace"}`}
                >
                    <LinkIcon className="h-3.5 w-3.5" />
                </button>
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
                        className="bg-[#0f172a] border border-white/10 p-8 md:p-10 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] max-w-2xl w-full animate-in zoom-in-95 duration-200 relative overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Decorative background blur */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-nutri-brand/10 blur-[100px] pointer-events-none" />

                        <h3 className="text-white font-tech font-bold text-3xl mb-8 flex items-center gap-4">
                            <div className="p-4 bg-nutri-brand/20 rounded-[1.25rem] shadow-inner">
                                <LinkIcon className="text-nutri-brand h-8 w-8" />
                            </div>
                            <span className="tracking-tight">Editar {label || "Enlace"}</span>
                        </h3>

                        <div className="space-y-8">
                            <div className="space-y-3">
                                <label className="text-xs font-black uppercase text-slate-400 mb-2 block tracking-[0.2em] ml-1 opacity-60">
                                    URL DEL ENLACE / DESTINO
                                </label>
                                <div className="relative group/input">
                                    <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
                                        <LinkIcon className="h-6 w-6 text-slate-500 group-focus-within/input:text-nutri-brand transition-colors" />
                                    </div>
                                    <input
                                        type="text"
                                        className="w-full bg-[#1e293b] border-2 border-white/5 rounded-2xl py-5 pl-14 pr-6 text-white outline-none focus:border-nutri-brand/50 focus:ring-4 focus:ring-nutri-brand/10 transition-all font-sans text-xl shadow-inner placeholder:text-slate-600"
                                        value={tempHref}
                                        onChange={(e) => setTempHref(e.target.value)}
                                        placeholder="https://ejemplo.com/..."
                                        autoFocus
                                    />
                                </div>
                                <p className="text-slate-500 text-sm ml-1 italic opacity-60">Pega aquí la URL completa para el botón o enlace.</p>
                            </div>

                            <div className="flex justify-end gap-4 pt-6">
                                <button
                                    onClick={handleCancel}
                                    className="px-8 py-4 rounded-2xl border border-white/10 text-slate-400 font-tech font-bold hover:bg-white/5 hover:text-white transition-all text-lg"
                                    disabled={loading}
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleSave}
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

        </>
    );
}
