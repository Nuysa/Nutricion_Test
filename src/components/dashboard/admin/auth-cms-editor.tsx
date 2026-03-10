"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Save, ShieldCheck, Sparkles } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function AuthCMSEditor() {
    const { toast } = useToast();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [authContent, setAuthContent] = useState({
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
        loadData();
    }, []);

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
                setAuthContent(prev => ({ ...prev, ...data.content }));
            }
        } catch (error: any) {
            console.error("Error loading Auth CMS data:", error);
            toast({ title: "Error", description: "No se pudieron cargar los datos de la sección Auth.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from("landing_content")
                .upsert({ section: "auth", content: authContent }, { onConflict: 'section' });

            if (error) throw error;
            toast({ title: "Contenido Guardado", description: "Se actualizó la configuración de login/registro correctamente.", variant: "success" });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-nutri-brand" /></div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                <ShieldCheck className="h-6 w-6 text-nutri-brand" />
                CMS Login y Registro
            </h2>
            <p className="text-sm font-medium text-slate-500">Administra el contenido visual de las páginas de acceso seguro para pacientes y especialistas.</p>

            <div className="grid grid-cols-1 gap-6">
                <Card className="rounded-[2rem] border-slate-100 shadow-xl overflow-hidden">
                    <CardHeader className="bg-slate-50/50">
                        <CardTitle className="font-black flex items-center gap-2">
                            <Sparkles className="h-5 w-5 text-nutri-brand" /> Mensaje de Bienvenida
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400">Título (Parte 1)</label>
                                <Input
                                    className="font-black text-lg border-slate-200"
                                    value={authContent.title}
                                    onChange={(e) => setAuthContent({ ...authContent, title: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400 text-nutri-brand">Título Resaltado (Naranja)</label>
                                <Input
                                    className="font-black text-lg border-nutri-brand/20 text-nutri-brand"
                                    value={authContent.title_highlight}
                                    onChange={(e) => setAuthContent({ ...authContent, title_highlight: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400">Descripción Sugestiva</label>
                            <textarea
                                className="w-full h-24 p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none"
                                value={authContent.description}
                                onChange={(e) => setAuthContent({ ...authContent, description: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
                            {[
                                { id: 1, v: 'stat1_val', l: 'stat1_label', label: 'Estadística 1' },
                                { id: 2, v: 'stat2_val', l: 'stat2_label', label: 'Estadística 2' },
                                { id: 3, v: 'stat3_val', l: 'stat3_label', label: 'Estadística 3' }
                            ].map((stat) => (
                                <div key={stat.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                                    <p className="text-[10px] font-black uppercase text-slate-400">{stat.label}</p>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold uppercase text-slate-500">Valor</label>
                                        <Input
                                            className="font-black text-lg border-slate-200 bg-white"
                                            value={(authContent as any)[stat.v]}
                                            onChange={(e) => setAuthContent({ ...authContent, [stat.v]: e.target.value })}
                                        />
                                    </div>
                                    <div className="space-y-1">
                                        <label className="text-[9px] font-bold uppercase text-slate-500">Etiqueta</label>
                                        <Input
                                            className="font-bold border-slate-200 bg-white"
                                            value={(authContent as any)[stat.l]}
                                            onChange={(e) => setAuthContent({ ...authContent, [stat.l]: e.target.value })}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="space-y-1">
                            <label className="text-[10px] font-black uppercase text-slate-400">Texto de Copyright (Footer)</label>
                            <Input
                                className="font-bold border-slate-200"
                                value={authContent.footer_text}
                                onChange={(e) => setAuthContent({ ...authContent, footer_text: e.target.value })}
                            />
                        </div>

                        <Button
                            onClick={handleSave}
                            disabled={saving}
                            className="w-full bg-nutri-brand hover:bg-nutri-brand/90 text-white font-black h-12 rounded-2xl shadow-lg shadow-nutri-brand/20 transition-all active:scale-95"
                        >
                            <Save className="h-5 w-5 mr-2" /> {saving ? "Guardando..." : "Publicar Cambios en Auth Login"}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
