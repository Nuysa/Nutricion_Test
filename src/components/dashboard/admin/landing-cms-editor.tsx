"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Save, Sparkles, LayoutTemplate, Star } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";

interface LandingPlan {
    id: string;
    type: string;
    interval: string;
    price: number;
    is_recommended: boolean;
    virtual_features: string[];
    presential_features: string[];
}

export function LandingCMSEditor() {
    const { toast } = useToast();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const [plans, setPlans] = useState<LandingPlan[]>([]);

    // Contenido general (Hero / About)
    const [heroContent, setHeroContent] = useState({
        title: "",
        subtitle: "",
        text: "",
        stat1_val: "Planes",
        stat1_label: "A tu medida",
        stat2_val: "100%",
        stat2_label: "Resultados",
        stat3_val: "Gold",
        stat3_label: "Precisión"
    });
    const [aboutContent, setAboutContent] = useState({ title1: "", text1: "", title2: "", text2: "" });

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);
        try {
            const { data: plansData, error: plansError } = await supabase
                .from("landing_plans")
                .select("*")
                .order('price', { ascending: true });

            if (plansError) throw plansError;
            if (plansData) setPlans(plansData);

            const { data: contentData, error: contentError } = await supabase
                .from("landing_content")
                .select("*");

            if (contentError) throw contentError;
            if (contentData) {
                const hero = contentData.find(c => c.section === "hero");
                if (hero) setHeroContent(hero.content);
                const about = contentData.find(c => c.section === "about");
                if (about) setAboutContent(about.content);
            }
        } catch (error: any) {
            console.error("Error loading CMS data:", error);
            toast({ title: "Error", description: "No se pudieron cargar los datos de la Landing.", variant: "destructive" });
        } finally {
            setLoading(false);
        }
    };

    const handleSaveContent = async (section: string, contentData: any) => {
        setSaving(true);
        try {
            const { error } = await supabase
                .from("landing_content")
                .upsert({ section, content: contentData }, { onConflict: 'section' });

            if (error) throw error;
            toast({ title: "Contenido Guardado", description: `Se actualizó la sección ${section} correctamente.`, variant: "success" });
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handleUpdatePlan = async (plan: LandingPlan) => {
        setSaving(true);
        try {
            // Ensure features are arrays and clean up empty strings
            const vFeatures = plan.virtual_features.filter(f => f.trim() !== "");
            const pFeatures = plan.presential_features.filter(f => f.trim() !== "");

            const { error } = await supabase
                .from("landing_plans")
                .update({
                    price: plan.price,
                    is_recommended: plan.is_recommended,
                    virtual_features: vFeatures,
                    presential_features: pFeatures
                })
                .eq("id", plan.id);

            if (error) throw error;
            toast({ title: "Plan Guardado", description: `El plan ${plan.interval} ha sido actualizado.`, variant: "success" });
            loadData();
        } catch (error: any) {
            toast({ title: "Error", description: error.message, variant: "destructive" });
        } finally {
            setSaving(false);
        }
    };

    const handlePlanChange = (id: string, field: keyof LandingPlan, value: any) => {
        setPlans(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
    };

    const handleFeaturesChange = (id: string, mode: "virtual" | "presential", text: string) => {
        const features = text.split("\n");
        setPlans(prev => prev.map(p => {
            if (p.id === id) {
                if (mode === "virtual") return { ...p, virtual_features: features };
                return { ...p, presential_features: features };
            }
            return p;
        }));
    };

    if (loading) return <div className="p-10 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-nutri-brand" /></div>;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                <LayoutTemplate className="h-6 w-6 text-nutri-brand" />
                CMS de NuySa Landing Page
            </h2>
            <p className="text-sm font-medium text-slate-500">Administra el contenido y los planes públicos que se muestran a los visitantes de la web.</p>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                {/* Text Content Editors */}
                <div className="space-y-6">
                    <Card className="rounded-[2rem] border-slate-100 shadow-xl overflow-hidden">
                        <CardHeader className="bg-slate-50/50">
                            <CardTitle className="font-black flex items-center gap-2">
                                <Sparkles className="h-5 w-5 text-nutri-brand" /> Sección Principal (Hero)
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400">Subtítulo (Top)</label>
                                <Input
                                    className="font-bold border-slate-200"
                                    value={heroContent.subtitle}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setHeroContent({ ...heroContent, subtitle: e.target.value })}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase text-slate-400">Título Principal</label>
                                <Input
                                    className="font-black text-lg border-slate-200"
                                    value={heroContent.title}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setHeroContent({ ...heroContent, title: e.target.value })}
                                />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 py-4">
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
                                                value={(heroContent as any)[stat.v] || ""}
                                                onChange={(e) => setHeroContent({ ...heroContent, [stat.v]: e.target.value })}
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[9px] font-bold uppercase text-slate-500">Etiqueta</label>
                                            <Input
                                                className="font-bold border-slate-200 bg-white"
                                                value={(heroContent as any)[stat.l] || ""}
                                                onChange={(e) => setHeroContent({ ...heroContent, [stat.l]: e.target.value })}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Button
                                onClick={() => handleSaveContent("hero", heroContent)}
                                disabled={saving}
                                className="w-full bg-nutri-brand hover:bg-nutri-brand/90 text-white font-black"
                            >
                                <Save className="h-4 w-4 mr-2" /> Guardar Hero
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="rounded-[2rem] border-slate-100 shadow-xl overflow-hidden">
                        <CardHeader className="bg-slate-50/50">
                            <CardTitle className="font-black text-slate-800">Nosotros (About)</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-4">
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                                <Input
                                    placeholder="Título NuySa"
                                    className="font-black border-slate-200"
                                    value={aboutContent.title1}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setAboutContent({ ...aboutContent, title1: e.target.value })}
                                />
                                <textarea
                                    placeholder="Texto descriptivo de NuySa"
                                    className="w-full h-24 p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none disabled:opacity-50"
                                    value={aboutContent.text1}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setAboutContent({ ...aboutContent, text1: e.target.value })}
                                />
                            </div>
                            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3">
                                <Input
                                    placeholder="Título Nutricionista"
                                    className="font-black border-slate-200"
                                    value={aboutContent.title2}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setAboutContent({ ...aboutContent, title2: e.target.value })}
                                />
                                <textarea
                                    placeholder="Texto descriptivo del profesional"
                                    className="w-full h-24 p-3 rounded-xl border border-slate-200 text-sm font-medium outline-none disabled:opacity-50"
                                    value={aboutContent.text2}
                                    onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setAboutContent({ ...aboutContent, text2: e.target.value })}
                                />
                            </div>
                            <Button
                                onClick={() => handleSaveContent("about", aboutContent)}
                                disabled={saving}
                                className="w-full bg-nutri-brand hover:bg-nutri-brand/90 text-white font-black"
                            >
                                <Save className="h-4 w-4 mr-2" /> Guardar About
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                {/* Plans Editor */}
                <Card className="rounded-[2rem] border-slate-100 shadow-xl overflow-hidden h-fit">
                    <CardHeader className="bg-slate-900 text-white">
                        <CardTitle className="font-black text-xl flex items-center justify-between">
                            Precios y Beneficios
                            <Badge className="bg-nutri-brand text-[#0B1120] font-black border-none">{plans.length} Planes</Badge>
                        </CardTitle>
                    </CardHeader>
                    <ScrollArea className="h-[750px] p-6">
                        <div className="space-y-6">
                            {plans.map((plan) => (
                                <div key={plan.id} className="p-5 rounded-2xl border-2 border-slate-100 bg-white space-y-4 relative group">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Badge variant="outline" className="font-black uppercase tracking-widest text-[#FF7A00] border-[#FF7A00]">
                                                {plan.type}
                                            </Badge>
                                            <span className="font-black text-slate-800 uppercase text-sm">{plan.interval}</span>
                                        </div>
                                        <button
                                            onClick={() => handlePlanChange(plan.id, "is_recommended", !plan.is_recommended)}
                                            className={`p-1.5 rounded-full transition-colors ${plan.is_recommended ? 'bg-amber-100 text-amber-500' : 'bg-slate-100 text-slate-300 hover:text-amber-400'}`}
                                            title="Marcar como Recomendado"
                                        >
                                            <Star className="h-5 w-5" fill={plan.is_recommended ? "currentColor" : "none"} />
                                        </button>
                                    </div>

                                    <div className="space-y-1">
                                        <label className="text-[10px] font-black uppercase text-slate-400">Precio (S/)</label>
                                        <Input
                                            type="number"
                                            className="font-black text-lg h-12"
                                            value={plan.price}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => handlePlanChange(plan.id, "price", parseFloat(e.target.value) || 0)}
                                        />
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase text-slate-400">Beneficios (Virtual)</label>
                                            <textarea
                                                className="w-full h-32 p-3 text-xs font-medium resize-none shadow-inner rounded-xl border border-slate-200 outline-none"
                                                value={plan.virtual_features.join("\n")}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => handleFeaturesChange(plan.id, "virtual", e.target.value)}
                                                placeholder="Un beneficio por línea"
                                            />
                                        </div>
                                        <div className="space-y-1">
                                            <label className="text-[10px] font-black uppercase text-slate-400">Beneficios (Presencial)</label>
                                            <textarea
                                                className="w-full h-32 p-3 text-xs font-medium resize-none shadow-inner rounded-xl border border-slate-200 outline-none"
                                                value={plan.presential_features.join("\n")}
                                                onChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => handleFeaturesChange(plan.id, "presential", e.target.value)}
                                                placeholder="Un beneficio por línea"
                                            />
                                        </div>
                                    </div>

                                    <Button
                                        onClick={() => handleUpdatePlan(plan)}
                                        disabled={saving}
                                        className="w-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-black shadow-lg"
                                    >
                                        <Save className="h-4 w-4 mr-2" /> Actualizar este Plan
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                </Card>
            </div>
        </div>
    );
}
