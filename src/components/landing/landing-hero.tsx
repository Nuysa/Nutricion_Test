"use client";

import { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Beef, WheatOff, Droplets, Pencil, Play } from "lucide-react";
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
        text: "Recetas fáciles y deliciosas. \n«Reto 30 días» en un mes, nuevos hábitos se quedarán contigo. \nHidratación y bienestar total.",
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
        <section id="inicio" className="relative pt-40 pb-20 lg:pt-48 lg:pb-32 min-h-screen flex items-center">
            <div className="absolute inset-0 organic-grid z-0 opacity-40"></div>

            <div className="max-w-screen-2xl mx-auto px-6 lg:px-8 flex flex-col lg:flex-row items-center gap-12 relative z-10 w-full">

                {/* Left content */}
                <div className="lg:w-5/12 flex flex-col items-start text-left z-20">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-nutri-brand/30 bg-nutri-brand/5 text-nutri-brand text-[15px] font-tech font-bold mb-6 tracking-widest uppercase">
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
                                    className="text-4xl lg:text-6xl font-tech font-extrabold text-white"
                                    multiline
                                />
                                <div className="text-[10px] text-slate-500 font-bold italic">* La última palabra siempre será naranja automáticamente.</div>
                            </div>
                        ) : (
                            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-tech font-extrabold text-white leading-tight mb-6 sm:mb-8 tracking-tighter whitespace-pre-line">
                                {content.title.replace(/\\n/g, '\n').split(' ').map((word, idx, arr) => {
                                    if (idx === arr.length - 1 || (idx === arr.length - 2 && arr[arr.length - 1] === '')) {
                                        return <span key={idx} className="text-nutri-brand">{word} </span>
                                    }
                                    return word + ' '
                                })}
                            </h1>
                        )}
                    </div>

                    <div className="mt-12 grid grid-cols-3 gap-4 w-full">
                        {[
                            { id: 1, val: content.stat1_val, label: content.stat1_label, fieldV: 'stat1_val', fieldL: 'stat1_label' },
                            { id: 2, val: content.stat2_val, label: content.stat2_label, fieldV: 'stat2_val', fieldL: 'stat2_label' },
                            { id: 3, val: content.stat3_val, label: content.stat3_label, fieldV: 'stat3_val', fieldL: 'stat3_label' }
                        ].map((stat) => (
                            <div key={stat.id} className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl flex flex-col items-center text-center group hover:border-nutri-brand/40 transition-all">
                                {isEditable ? (
                                    <div className="space-y-1 w-full flex flex-col items-center">
                                        <EditableText
                                            value={stat.val as string}
                                            onSave={(val) => handleSave(stat.fieldV, val)}
                                            className="text-lg sm:text-2xl font-tech font-extrabold text-white italic"
                                        />
                                        <EditableText
                                            value={stat.label as string}
                                            onSave={(val) => handleSave(stat.fieldL, val)}
                                            className="text-[8px] sm:text-[10px] font-tech font-bold text-slate-500 uppercase tracking-widest"
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <div className="text-lg sm:text-2xl font-tech font-extrabold text-white italic">{stat.val}</div>
                                        <div className="text-[8px] sm:text-[10px] font-tech font-bold text-slate-500 uppercase tracking-widest">{stat.label}</div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                {/* Right content (Video & Carteles) */}
                <div className="lg:w-7/12 relative w-full flex justify-center mt-12 lg:mt-0 py-8 md:py-16">
                    <div className="relative w-full max-w-[450px] aspect-square flex items-center justify-center">

                        <div className="absolute -inset-4 border border-nutri-brand/20 rounded-full border-dashed pointer-events-none z-0"></div>

                        <div className="relative z-10 w-[85%] h-[85%] rounded-full overflow-hidden border-2 border-nutri-brand/40 shadow-[0_0_60px_rgba(255,122,0,0.1)] bg-nutri-base flex items-center justify-center group">
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
                                Tu navegador no soporta el formato de video.
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

                        {/* Cartel Proteína */}
                        <div className={cn(
                            "cartel-base pos-proteina bg-nutri-panel border border-white/10 p-5 rounded-xl w-[200px] sm:w-[260px] shadow-2xl relative group/card",
                            activeCartel === "proteina" && "cartel-active"
                        )}>
                            <div className="flex items-center gap-2 pb-2 mb-2">
                                <Beef className="h-5 w-5 text-nutri-brand" />
                                <h4 className="font-tech font-bold text-sm text-white uppercase tracking-wider">SECCIÓN: <span className="text-nutri-brand">PROTEÍNAS</span></h4>
                            </div>
                            {isEditable ? (
                                <EditableText
                                    label="Texto Proteína"
                                    value={content.cartelProteina}
                                    onSave={(val) => handleSave('cartelProteina', val)}
                                    className="text-xs text-slate-300 font-sans leading-relaxed"
                                    multiline
                                />
                            ) : (
                                <p className="text-xs text-slate-300 font-sans leading-relaxed text-pretty-justify">
                                    <strong className="text-white">Función:</strong> {content.cartelProteina}
                                </p>
                            )}
                        </div>

                        {/* Cartel Carbohidrato */}
                        <div className={cn(
                            "cartel-base pos-carbo bg-nutri-panel border border-white/10 p-5 rounded-xl w-[200px] sm:w-[260px] shadow-2xl",
                            activeCartel === "carbo" && "cartel-active"
                        )}>
                            <div className="flex items-center gap-2 pb-2 mb-2">
                                <WheatOff className="h-5 w-5 text-nutri-brand" />
                                <h4 className="font-tech font-bold text-sm text-white uppercase tracking-wider">SECCIÓN: <span className="text-nutri-brand">CARBOHIDRATOS</span></h4>
                            </div>
                            {isEditable ? (
                                <EditableText
                                    label="Texto Carbohidratos"
                                    value={content.cartelCarbo}
                                    onSave={(val) => handleSave('cartelCarbo', val)}
                                    className="text-xs text-slate-300 font-sans leading-relaxed"
                                    multiline
                                />
                            ) : (
                                <p className="text-xs text-slate-300 font-sans leading-relaxed text-pretty-justify">
                                    <strong className="text-white">Función:</strong> {content.cartelCarbo}
                                </p>
                            )}
                        </div>

                        {/* Cartel Lípido */}
                        <div className={cn(
                            "cartel-base pos-lipido bg-nutri-panel border border-white/10 p-5 rounded-xl w-[200px] sm:w-[260px] shadow-2xl",
                            activeCartel === "lipido" && "cartel-active"
                        )}>
                            <div className="flex items-center gap-2 pb-2 mb-2">
                                <Droplets className="h-5 w-5 text-nutri-brand" />
                                <h4 className="font-tech font-bold text-sm text-white uppercase tracking-wider">SECCIÓN: <span className="text-nutri-brand">LÍPIDOS</span></h4>
                            </div>
                            {isEditable ? (
                                <EditableText
                                    label="Texto Lípidos"
                                    value={content.cartelLipido}
                                    onSave={(val) => handleSave('cartelLipido', val)}
                                    className="text-xs text-slate-300 font-sans leading-relaxed"
                                    multiline
                                />
                            ) : (
                                <p className="text-xs text-slate-300 font-sans leading-relaxed text-pretty-justify">
                                    <strong className="text-white">Función:</strong> {content.cartelLipido}
                                </p>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
}
