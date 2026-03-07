"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { Pencil, Check, X, Facebook, Instagram, Youtube, Twitter, Globe, Linkedin, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

// Custom TikTok icon since Lucide doesn't have it in all versions
const TikTokIcon = ({ className }: { className?: string }) => (
    <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" />
    </svg>
);

export const SOCIAL_ICON_MAP: Record<string, React.ElementType> = {
    "facebook": Facebook,
    "instagram": Instagram,
    "tiktok": TikTokIcon,
    "youtube": Youtube,
    "twitter": Twitter,
    "linkedin": Linkedin,
    "whatsapp": Phone,
    "web": Globe,
};

const AVAILABLE_ICONS = [
    { id: "facebook", name: "Facebook", component: Facebook },
    { id: "instagram", name: "Instagram", component: Instagram },
    { id: "tiktok", name: "TikTok", component: TikTokIcon },
    { id: "youtube", name: "YouTube", component: Youtube },
    { id: "twitter", name: "Twitter / X", component: Twitter },
    { id: "linkedin", name: "LinkedIn", component: Linkedin },
    { id: "whatsapp", name: "WhatsApp", component: Phone },
    { id: "web", name: "Web / Global", component: Globe },
];

interface EditableSocialIconProps {
    value: string; // The icon ID (e.g., 'facebook', 'instagram')
    onSave: (newValue: string) => Promise<void>;
    label?: string;
    className?: string;
}

export function EditableSocialIcon({ value, onSave, label, className }: EditableSocialIconProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const handleSelect = async (iconId: string) => {
        if (iconId === value) {
            setIsEditing(false);
            return;
        }
        setLoading(true);
        try {
            await onSave(iconId);
            setIsEditing(false);
        } catch (error) {
            console.error("Save error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={cn("relative z-[60]", className)}>
            <button
                onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setIsEditing(true);
                }}
                className="p-1.5 bg-nutri-brand text-nutri-base rounded-full shadow-lg hover:scale-110 cursor-pointer transition-transform"
                title={`Cambiar ${label || "icono"}`}
            >
                <Pencil className="h-3.5 w-3.5" />
            </button>

            {isEditing && mounted && createPortal(
                <div
                    className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/85 backdrop-blur-xl p-4 sm:p-6"
                    onClick={() => setIsEditing(false)}
                >
                    <div
                        className="bg-[#0f172a] border border-white/10 p-8 md:p-10 rounded-[2.5rem] shadow-[0_0_100px_rgba(0,0,0,0.8)] max-w-2xl w-full animate-in zoom-in-95 duration-200 relative overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Decorative background blur */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-nutri-brand/10 blur-[100px] pointer-events-none" />

                        <div className="flex justify-between items-center mb-8">
                            <h3 className="text-white font-tech font-bold text-3xl flex items-center gap-4">
                                <div className="p-4 bg-nutri-brand/20 rounded-[1.25rem] shadow-inner">
                                    <Globe className="text-nutri-brand h-8 w-8" />
                                </div>
                                <span className="tracking-tight">Seleccionar Icono</span>
                            </h3>
                            <button
                                onClick={() => setIsEditing(false)}
                                className="h-10 w-10 rounded-full hover:bg-white/10 flex items-center justify-center text-slate-400 transition-colors"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {AVAILABLE_ICONS.map((icon) => (
                                <button
                                    key={icon.id}
                                    onClick={() => handleSelect(icon.id)}
                                    className={cn(
                                        "p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-3 group/icon-btn relative",
                                        value === icon.id
                                            ? "border-nutri-brand bg-nutri-brand/10 text-nutri-brand"
                                            : "border-white/5 bg-white/5 text-slate-400 hover:border-white/10 hover:bg-white/10 hover:text-white"
                                    )}
                                    disabled={loading}
                                >
                                    <icon.component className="h-8 w-8 transition-transform group-hover/icon-btn:scale-110" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">{icon.name}</span>

                                    {value === icon.id && (
                                        <div className="absolute top-2 right-2 h-4 w-4 bg-nutri-brand rounded-full flex items-center justify-center">
                                            <Check className="h-2.5 w-2.5 text-nutri-base stroke-[4px]" />
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button
                                onClick={() => setIsEditing(false)}
                                className="px-8 py-3 rounded-2xl border border-white/10 text-slate-400 font-tech font-bold hover:bg-white/5 hover:text-white transition-all"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>,
                document.body
            )}
        </div>
    );
}
