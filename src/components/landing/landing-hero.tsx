"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Beef, WheatOff, Droplets } from "lucide-react";
import { cn } from "@/lib/utils";
import { createClient } from "@/lib/supabase/client";
import { useVisualEditor } from "@/components/dashboard/admin/visual-editor-context";
import { EditableText } from "@/components/dashboard/admin/editable-text";
import { EditableLink } from "@/components/dashboard/admin/editable-link";

export function LandingHero() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const { isEditable } = useVisualEditor();
    const [activeCartel, setActiveCartel] = useState<"proteina" | "carbo" | "lipido" | null>("proteina");
    const [content, setContent] = useState({
        subtitle: "VE A TU PROPIO RITMO",
        title: "Listo para iniciar \ntu cambio?",
        text: "Recetas fáciles y deliciosas.\nObtén tu plan nutricional personalizado y un acompañamiento cercano durante todo tu proceso.\nNuevos hábitos se quedarán contigo.\nTu cambio empieza con una buena alimentación.",
        stat1_val: "Planes",
        stat1_label: "A tu medida",
        stat2_val: "100%",
        stat2_label: "Resultados",
        stat3_val: "Gold",
        stat3_label: "Precisión",
        cartelProteina: "Construyen y reparan músculos. Esenciales para el sistema inmunológico.",
        cartelCarbo: "Principal fuente de energía. Abastecen el cerebro y los músculos.",
        cartelLipido: "Reserva de alta densidad. Protegen órganos vitales y absorben vitaminas.",
        videoUrl: "/plato-nuysa.mp4"
    });


    const handleSave = async (field: string, newValue: string) => {
        const supabase = createClient();
        const newContent = { ...content, [field]: newValue };
        const { error } = await supabase
            .from('landing_content')
            .upsert({ section: 'hero', content: newContent }, { onConflict: 'section' });

        if (!error) {
            setContent(newContent);
        } else {
            throw error;
        }
    };

    useEffect(() => {
        const fetchContent = async () => {
            const supabase = createClient();
            try {
                const { data, error } = await supabase.from('landing_content').select('content').eq('section', 'hero').single();
                if (data?.content) {
                    setContent(prev => ({
                        ...prev,
                        ...data.content
                    }));
                }
            } catch (err) {
                console.error("Error fetching landing content:", err);
            }
        };
        fetchContent();
    }, []);

    const handleVideoSync = () => {
        const video = videoRef.current;
        if (!video) return;

        const currentTime = video.currentTime;
        const totalDuration = video.duration;
        if (!totalDuration || isNaN(totalDuration)) return;

        const tercio = totalDuration / 3;

        if (currentTime >= 0 && currentTime < tercio) {
            if (activeCartel !== "proteina") setActiveCartel("proteina");
        } else if (currentTime >= tercio && currentTime < (tercio * 2)) {
            if (activeCartel !== "carbo") setActiveCartel("carbo");
        } else if (currentTime >= (tercio * 2)) {
            if (activeCartel !== "lipido") setActiveCartel("lipido");
        }
    };

    return (
        <section id="inicio" className="relative pt-32 pb-16 md:pt-48 md:pb-32 min-h-screen flex items-center overflow-x-hidden">
            <div className="absolute inset-0 organic-grid z-0 opacity-40"></div>

            <div className="max-w-screen-2xl mx-auto px-4 md:px-8 flex flex-col md:flex-row items-center gap-12 lg:gap-20 relative z-10 w-full">

                {/* Left content: Text & Stats */}
                <div className="w-full md:w-1/2 flex flex-col items-center md:items-start text-center md:text-left z-20">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-nutri-brand/30 bg-nutri-brand/5 text-nutri-brand text-xs md:text-[15px] font-tech font-bold mb-6 tracking-widest uppercase">
                        {isEditable ? (
                            <EditableText
                                label="Subtítulo"
                                value={content.subtitle}
                                onSave={(val) => handleSave('subtitle', val)}
                            />
                        ) : content.subtitle}
                    </div>

                    <div className="w-full">
                        {isEditable ? (
                            <div className="space-y-4 w-full">
                                <EditableText
                                    label="Título Hero (Usa \n para saltos de línea)"
                                    value={content.title}
                                    onSave={(val) => handleSave('title', val)}
                                    className="text-4xl md:text-5xl lg:text-7xl font-tech font-extrabold text-white"
                                    multiline
                                />
                            </div>
                        ) : (
                            <h1 className="text-4xl md:text-5xl lg:text-7xl font-tech font-extrabold text-white leading-[1.1] mb-6 md:mb-8 tracking-tighter whitespace-pre-line">
                                {content.title.replace(/\\n/g, '\n').split(' ').map((word, idx, arr) => {
                                    if (idx === arr.length - 1 || (idx === arr.length - 2 && arr[arr.length - 1] === '')) {
                                        return <span key={idx} className="text-nutri-brand">{word} </span>
                                    }
                                    return word + ' '
                                })}
                            </h1>
                        )}
                    </div>

                    <div className="mt-4 md:mt-8 mb-2 border-l-2 md:border-l-4 border-dashed border-nutri-brand pl-6 py-2">
                        {isEditable ? (
                            <EditableText
                                label="Texto adicional"
                                value={content.text}
                                onSave={(val) => handleSave('text', val)}
                                className="text-slate-400 text-sm md:text-base font-bold leading-relaxed"
                                multiline
                            />
                        ) : (
                            <p className="text-slate-400 text-sm md:text-base font-bold leading-relaxed whitespace-pre-line text-pretty">
                                {content.text}
                            </p>
                        )}
                    </div>

                    {/* Stats Grid */}
                    <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
                        {[
                            { id: 1, val: content.stat1_val, label: content.stat1_label, fieldV: 'stat1_val', fieldL: 'stat1_label' },
                            { id: 2, val: content.stat2_val, label: content.stat2_label, fieldV: 'stat2_val', fieldL: 'stat2_label' },
                            { id: 3, val: content.stat3_val, label: content.stat3_label, fieldV: 'stat3_val', fieldL: 'stat3_label' }
                        ].map((stat) => (
                            <div key={stat.id} className="bg-white/5 backdrop-blur-md border border-white/10 p-5 rounded-2xl flex flex-col items-center text-center group hover:border-nutri-brand/40 transition-all shadow-xl">
                                {isEditable ? (
                                    <div className="space-y-1 w-full flex flex-col items-center">
                                        <EditableText
                                            value={stat.val as string}
                                            onSave={(val) => handleSave(stat.fieldV, val)}
                                            className="text-2xl font-tech font-extrabold text-white italic"
                                        />
                                        <EditableText
                                            value={stat.label as string}
                                            onSave={(val) => handleSave(stat.fieldL, val)}
                                            className="text-[10px] font-tech font-bold text-slate-500 uppercase tracking-widest"
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <div className="text-2xl font-tech font-extrabold text-white italic">{stat.val}</div>
                                        <div className="text-[10px] font-tech font-bold text-slate-500 uppercase tracking-widest">{stat.label}</div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-10 w-full sm:w-auto">
                        <Button className="w-full sm:w-auto h-14 px-10 rounded-2xl bg-nutri-brand hover:bg-orange-600 text-white font-black uppercase tracking-widest shadow-lg shadow-orange-600/20 transition-all active:scale-95">
                            Empezar ahora
                        </Button>
                    </div>
                </div>

                {/* Right content: Video & Adaptive Cards */}
                <div className="w-full md:w-1/2 flex flex-col items-center relative z-10 py-10 md:py-20 lg:py-0">
                    
                    {/* Circle Video Container */}
                    <div className="relative w-full max-w-[320px] sm:max-w-[400px] lg:max-w-[480px] aspect-square flex items-center justify-center mb-12 md:mb-0">
                        <div className="absolute -inset-4 border border-nutri-brand/20 rounded-full border-dashed pointer-events-none z-0"></div>

                        <div className="relative z-10 w-[85%] h-[85%] rounded-full overflow-hidden border-2 border-nutri-brand/40 shadow-[0_0_80px_rgba(255,122,0,0.15)] bg-nutri-base flex items-center justify-center group">
                            <video
                                ref={videoRef}
                                className="w-full h-full object-cover opacity-95 scale-[1.15]"
                                autoPlay
                                loop
                                muted
                                playsInline
                                key={content.videoUrl}
                                onTimeUpdate={handleVideoSync}
                                onLoadedMetadata={handleVideoSync}
                            >
                                <source src={content.videoUrl} type="video/mp4" />
                            </video>
                            {isEditable && (
                                <EditableLink
                                    label="Video Hero"
                                    url={content.videoUrl}
                                    onSave={(val: string) => handleSave('videoUrl', val)}
                                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4 scale-150"
                                />
                            )}
                        </div>

                        {/* DESKTOP FLOATING CARDS (md+) */}
                        <div className="hidden md:block absolute inset-0 pointer-events-none">
                            {/* Proteína */}
                            <div className={cn(
                                "cartel-base pos-proteina bg-nutri-panel border border-white/10 p-5 rounded-xl w-[260px] shadow-2xl relative group/card pointer-events-auto",
                                activeCartel === "proteina" && "cartel-active"
                            )}>
                                <div className="flex items-center gap-2 pb-2 mb-2 line-clamp-1">
                                    <Beef className="h-5 w-5 text-nutri-brand" />
                                    <h4 className="font-tech font-bold text-sm text-white uppercase tracking-wider">PROTEÍNAS</h4>
                                </div>
                                <p className="text-[11px] text-slate-300 font-sans leading-relaxed text-pretty-justify">
                                    {content.cartelProteina}
                                </p>
                            </div>

                            {/* Carbohidrato */}
                            <div className={cn(
                                "cartel-base pos-carbo bg-nutri-panel border border-white/10 p-5 rounded-xl w-[260px] shadow-2xl pointer-events-auto",
                                activeCartel === "carbo" && "cartel-active"
                            )}>
                                <div className="flex items-center gap-2 pb-2 mb-2 line-clamp-1">
                                    <WheatOff className="h-5 w-5 text-nutri-brand" />
                                    <h4 className="font-tech font-bold text-sm text-white uppercase tracking-wider">CARBOHIDRATOS</h4>
                                </div>
                                <p className="text-[11px] text-slate-300 font-sans leading-relaxed text-pretty-justify">
                                    {content.cartelCarbo}
                                </p>
                            </div>

                            {/* Lípido */}
                            <div className={cn(
                                "cartel-base pos-lipido bg-nutri-panel border border-white/10 p-5 rounded-xl w-[260px] shadow-2xl pointer-events-auto",
                                activeCartel === "lipido" && "cartel-active"
                            )}>
                                <div className="flex items-center gap-2 pb-2 mb-2 line-clamp-1">
                                    <Droplets className="h-5 w-5 text-nutri-brand" />
                                    <h4 className="font-tech font-bold text-sm text-white uppercase tracking-wider">LÍPIDOS</h4>
                                </div>
                                <p className="text-[11px] text-slate-300 font-sans leading-relaxed text-pretty-justify">
                                    {content.cartelLipido}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* MOBILE CARDS (Sequential overlay below video) */}
                    <div className="md:hidden relative w-full h-[180px] px-4 mt-4">
                        {[
                            { id: "proteina", icon: Beef, title: "Proteínas", text: content.cartelProteina },
                            { id: "carbo", icon: WheatOff, title: "Carbohidratos", text: content.cartelCarbo },
                            { id: "lipido", icon: Droplets, title: "Lípidos", text: content.cartelLipido }
                        ].map((card) => (
                            <div
                                key={card.id}
                                className={cn(
                                    "absolute inset-x-4 bg-nutri-panel/90 backdrop-blur-xl border p-6 rounded-[2rem] shadow-2xl transition-all duration-700 ease-out flex flex-col gap-3",
                                    activeCartel === card.id 
                                        ? "border-nutri-brand/50 scale-100 opacity-100 translate-y-0 z-20 pointer-events-auto" 
                                        : "border-white/5 scale-90 opacity-0 translate-y-8 z-10 pointer-events-none"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-nutri-brand/10 flex items-center justify-center">
                                        <card.icon className="h-5 w-5 text-nutri-brand" />
                                    </div>
                                    <h4 className="font-tech font-black text-sm text-white uppercase tracking-[0.2em]">{card.title}</h4>
                                </div>
                                <p className="text-xs text-slate-400 font-bold leading-relaxed italic">
                                    {card.text}
                                </p>
                                
                                {/* Progress Indicator */}
                                <div className="absolute bottom-0 left-0 h-1 bg-nutri-brand/30 transition-all duration-[5000ms]" style={{ width: activeCartel === card.id ? '100%' : '0%' }} />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}
