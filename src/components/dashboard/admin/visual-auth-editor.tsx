"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Eye, EyeOff, Palette, GripVertical, Maximize2, Minimize2, Sparkles, LogIn } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { VisualEditorProvider, useVisualEditor } from "./visual-editor-context";
import { EditableText } from "./editable-text";
import { ThemeEditor } from "./theme-editor";
import { cn } from "@/lib/utils";
import Link from "next/link";

function VisualAuthEditorContent() {
    const { toast } = useToast();
    const { isEditable, setEditable, theme } = useVisualEditor();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [showThemeEditor, setShowThemeEditor] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);

    const [authContent, setAuthContent] = useState<any>({
        title: "Nutrición",
        title_highlight: "Optimizada.",
        description: "Sincroniza tus metas con nutrición clínica de precisión y seguimiento en tiempo real.",
        stat1_val: "Planes",
        stat1_label: "A tu medida",
        stat2_val: "100%",
        stat2_label: "Resultados",
        stat3_val: "Gold",
        stat3_label: "Precisión",
        footer_text: "© 2026 NuySa Clinical Nutrition • Todos los derechos reservados"
    });

    useEffect(() => {
        setEditable(true);
        loadData();
    }, [setEditable]);

    const loadData = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("landing_content")
                .select("*")
                .eq("section", "auth")
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            if (data?.content) {
                setAuthContent((prev: any) => ({ ...prev, ...data.content }));
            }
        } catch (error: any) {
            console.error("Error loading Auth CMS data:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateContent = async (key: string, newValue: string) => {
        const updated = { ...authContent, [key]: newValue };
        setAuthContent(updated);

        try {
            const { error } = await supabase
                .from("landing_content")
                .upsert({ section: "auth", content: updated }, { onConflict: 'section' });

            if (error) throw error;
        } catch (error: any) {
            toast({ title: "Error al guardar", description: error.message, variant: "destructive" });
        }
    };

    if (loading) return <div className="p-20 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-nutri-brand" /></div>;

    return (
        <div className="relative min-h-[90vh] bg-nutri-base text-white overflow-hidden rounded-[2.5rem] border border-white/5 shadow-2xl">
            {/* Toolbar */}
            <div className="absolute top-6 right-6 z-[100]">
                <div className={cn(
                    "bg-slate-900/90 backdrop-blur-xl border border-white/10 shadow-2xl transition-all duration-500 overflow-hidden",
                    isMinimized ? "rounded-full p-2 w-12 h-12 flex items-center justify-center" : "rounded-[2rem] p-4 flex flex-col gap-3 min-w-[200px]"
                )}>
                    {isMinimized ? (
                        <Button variant="ghost" size="icon" onClick={() => setIsMinimized(false)} className="h-8 w-8 rounded-full bg-nutri-brand text-nutri-base">
                            <Maximize2 className="h-4 w-4" />
                        </Button>
                    ) : (
                        <>
                            <div className="flex items-center justify-between gap-3 px-2 pb-1 border-b border-white/5">
                                <div className="flex items-center gap-2">
                                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                                    <span className="text-[10px] font-black uppercase text-slate-400">Editor Auth</span>
                                </div>
                                <Button variant="ghost" size="icon" onClick={() => setIsMinimized(true)} className="h-6 w-6 text-slate-500">
                                    <Minimize2 className="h-3 w-3" />
                                </Button>
                            </div>

                            <Button onClick={() => setEditable(!isEditable)} className={cn("rounded-xl font-black h-10 px-4", isEditable ? "bg-nutri-brand text-nutri-base" : "bg-slate-800 text-white")}>
                                {isEditable ? <><Eye className="h-4 w-4 mr-2" /> Vista Previa</> : <><EyeOff className="h-4 w-4 mr-2" /> Editar</>}
                            </Button>

                            <Button onClick={() => setShowThemeEditor(!showThemeEditor)} className={cn("rounded-xl font-black h-10 px-4 border border-white/10 hover:bg-slate-700", showThemeEditor ? "bg-white text-slate-900" : "bg-slate-800/80 text-white")}>
                                <Palette className="h-4 w-4 mr-2" /> Colores
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {showThemeEditor && <ThemeEditor onClose={() => setShowThemeEditor(false)} />}

            {/* Help Badge */}
            {isEditable && (
                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-[100] bg-nutri-brand/20 backdrop-blur-md border border-nutri-brand/30 text-nutri-brand px-6 py-2 rounded-full font-black text-xs animate-in slide-in-from-bottom-5">
                    MODO EDICIÓN: Haz clic sobre los textos para personalizarlos
                </div>
            )}

            {/* PREVIEW CONTENT (Auth Layout Logic) */}
            <div className="min-h-screen flex items-center justify-center relative font-tech p-6 lg:p-12">
                <div className="absolute inset-0 organic-grid opacity-20 pointer-events-none" />

                {/* Glows scaled down for panel view */}
                <div className="absolute top-1/4 -left-20 w-64 h-64 bg-nutri-brand/10 rounded-full blur-[100px]" />
                <div className="absolute bottom-1/4 -right-20 w-64 h-64 bg-green-500/5 rounded-full blur-[100px]" />

                <div className="w-full max-w-7xl flex flex-col lg:flex-row items-center gap-12 lg:gap-20 relative z-10 py-8">

                    {/* Left: Branding */}
                    <div className="w-full lg:w-1/2 space-y-8 text-center lg:text-left">
                        <div className="inline-flex items-center gap-3 sm:gap-4">
                            <div className="h-12 w-12 sm:h-16 sm:w-16 flex items-center justify-center">
                                <img src="/logo Nuysa.png" alt="Logo" className="h-full w-full object-contain" />
                            </div>
                            <div className="text-left">
                                <span className="text-xl sm:text-3xl font-black text-white tracking-widest uppercase leading-none">NuySa</span>
                                <div className="h-1 w-full bg-gradient-to-r from-nutri-brand to-transparent rounded-full mt-1 sm:mt-2" />
                            </div>
                        </div>

                        <div className="space-y-4 sm:space-y-6">
                            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-black text-white leading-[0.9] tracking-tighter uppercase italic">
                                {isEditable ? (
                                    <div className="flex flex-col gap-2">
                                        <EditableText label="Título" value={authContent.title} onSave={(val) => handleUpdateContent('title', val)} />
                                        <span className="text-nutri-brand">
                                            <EditableText label="Título Resaltado" value={authContent.title_highlight} onSave={(val) => handleUpdateContent('title_highlight', val)} />
                                        </span>
                                    </div>
                                ) : (
                                    <>
                                        {authContent.title} <br />
                                        <span className="text-nutri-brand">{authContent.title_highlight}</span>
                                    </>
                                )}
                            </h1>
                            <p className="text-slate-400 text-lg sm:text-lg font-bold leading-relaxed max-w-lg mx-auto lg:mx-0">
                                {isEditable ? (
                                    <EditableText label="Descripción" multiline value={authContent.description} onSave={(val) => handleUpdateContent('description', val)} />
                                ) : authContent.description}
                            </p>
                        </div>

                        <div className="grid grid-cols-3 gap-3 sm:gap-6 pt-4 max-w-sm mx-auto lg:mx-0">
                            {[1, 2, 3].map((num) => (
                                <div key={num} className="bg-white/5 backdrop-blur-md border border-white/5 p-3 sm:p-4 rounded-xl sm:rounded-2xl relative">
                                    {isEditable ? (
                                        <div className="space-y-1">
                                            <EditableText label={`Valor Stat ${num}`} value={authContent[`stat${num}_val`]} onSave={(val) => handleUpdateContent(`stat${num}_val`, val)} className="text-lg font-black italic" />
                                            <EditableText label={`Etiqueta Stat ${num}`} value={authContent[`stat${num}_label`]} onSave={(val) => handleUpdateContent(`stat${num}_label`, val)} className="text-[8px] font-black text-slate-500 uppercase" />
                                        </div>
                                    ) : (
                                        <>
                                            <div className="text-lg sm:text-xl font-black text-white italic">{authContent[`stat${num}_val`]}</div>
                                            <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">{authContent[`stat${num}_label`]}</div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Right: Mock Form */}
                    <div className="w-full lg:w-[420px] shrink-0">
                        <div className="bg-slate-900/60 backdrop-blur-2xl border border-white/10 p-8 sm:p-10 rounded-[2.5rem] relative">
                            <div className="absolute -top-1 -right-1 w-12 h-12 border-t-2 border-r-2 border-nutri-brand/50 rounded-tr-3xl" />

                            <div className="space-y-6">
                                <div className="space-y-1">
                                    <h2 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-2">
                                        <LogIn className="h-5 w-5 text-nutri-brand" /> Registro Seguro
                                    </h2>
                                    <p className="text-[10px] font-black uppercase text-slate-500 tracking-widest">Inicia sesión en NuySa Pro</p>
                                </div>

                                <div className="space-y-4">
                                    <div className="h-12 w-full bg-white/5 border border-white/10 rounded-xl flex items-center px-4 text-xs font-bold text-slate-600">Email</div>
                                    <div className="h-12 w-full bg-white/5 border border-white/10 rounded-xl flex items-center px-4 text-xs font-bold text-slate-600">Password</div>
                                    <div className="h-12 w-full bg-nutri-brand rounded-xl flex items-center justify-center text-xs font-black uppercase text-nutri-base">Entrar</div>
                                </div>
                                <div className="text-center">
                                    <p className="text-[10px] font-black uppercase text-slate-400">¿No tienes cuenta? <span className="text-nutri-brand">Regístrate gratis</span></p>
                                </div>
                            </div>
                        </div>

                        <p className="mt-8 text-center text-slate-500 text-[10px] font-black uppercase tracking-[0.2em] px-4">
                            {isEditable ? (
                                <EditableText label="Texto Footer" value={authContent.footer_text} onSave={(val) => handleUpdateContent('footer_text', val)} />
                            ) : authContent.footer_text}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export function VisualAuthEditor() {
    return (
        <VisualEditorProvider>
            <VisualAuthEditorContent />
        </VisualEditorProvider>
    );
}
