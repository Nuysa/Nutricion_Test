"use client";

import { useEffect, useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

import { createClient } from "@/lib/supabase/client";
import { useVisualEditor } from "@/components/dashboard/admin/visual-editor-context";
import { EditableText } from "@/components/dashboard/admin/editable-text";
import { EditableImage } from "@/components/dashboard/admin/editable-image";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LandingAbout() {
    const [content, setContent] = useState({
        topTitle: "Sobre Nosotros",
        title1: "Acerca de NuySa.",
        text1: "Es un espacio creado por profesionales en nutrición humana, donde te escuchamos con atención, te acompañamos con empatía y te guiamos hacia una versión más saludable y consciente de ti. Trabajamos con alimentos reales y hábitos sostenibles, adaptados a tu estilo de vida.",
        title2: "Acerca del nutricionista.",
        text2: "¡Saludos! Soy Delia o Emilia como gustes llamarme. Soy Licenciada en Bromatología Y Nutrición Humana, dedicada a promover la salud y bienestar a través de una alimentación consciente y personalizada. Cuento con conocimiento en cineantropometría y certificación internacional ISAK I y formación continua que me permite estar actualizada en salud y nutrición clínica.",
        extraText1: "Hoy, como nutricionista, puedo acompañar a muchas personas en su camino hacia el bienestar. Lo que muchos no saben es que son ellos quienes también me sostienen; me inspiran a seguir formándome, a crecer profesionalmente, y a aplicar todo lo aprendido en mi propio cuerpo y vida. En cada consulta, en cada historia, hay un espacio sagrado que respeto profundamente.",
        extraText2: "Mi camino en la nutrición nació de mi amor por lo natural. Desde pequeña, crecí rodeada de la sabiduría de mi madre y el uso de plantas medicinales que sanaban el cuerpo de forma sencilla y amorosa. Ese vínculo, junto con el apoyo de personas cercanas, me motivó a estudiar esta ciencia, creando un enfoque donde los alimentos se convierten en aliados para transformar la salud y bienestar. Y cuando a esto le sumas movimiento, la meditación o alguna actividad física, los resultados son aún más profundos y duraderos.",
        profileUrl: "/delia.jpg"
    });

    const [isBioExpanded, setIsBioExpanded] = useState(false);
    const { isEditable } = useVisualEditor();

    const handleSave = async (field: string, newValue: string) => {
        const supabase = createClient();
        const newContent = { ...content, [field]: newValue };
        const { error } = await supabase
            .from('landing_content')
            .upsert({ section: 'about', content: newContent }, { onConflict: 'section' });

        if (!error) {
            setContent(newContent);
        } else {
            throw error;
        }
    };

    useEffect(() => {
        const fetchContent = async () => {
            const supabase = createClient();
            const { data } = await supabase.from('landing_content').select('content').eq('section', 'about').single();
            if (data?.content) {
                setContent(prev => ({
                    ...prev,
                    ...data.content
                }));
            }
        };
        fetchContent();
    }, []);
    return (
        <section id="nosotros" className="scroll-mt-32 py-24 relative z-10 bg-nutri-base/50 border-y border-white/5">
            <div className="max-w-screen-2xl mx-auto px-6 lg:px-8">
                <div className="text-center mb-16 relative">
                    {isEditable ? (
                        <EditableText
                            label="Título Sección"
                            value={content.topTitle}
                            onSave={(val) => handleSave('topTitle', val)}
                            className="text-4xl lg:text-5xl font-tech font-black text-white leading-tight"
                        />
                    ) : (
                        <h3 className="text-4xl lg:text-5xl font-tech font-black text-white leading-tight">{content.topTitle}</h3>
                    )}
                </div>
                <div className="bio-panel bio-cut p-10 md:p-14 border border-nutri-brand/20 relative overflow-hidden">
                    <div className="flex flex-col lg:flex-row gap-14 items-center relative z-10">

                        {/* Image */}
                        <div className="lg:w-2/5 group">
                            <div className="relative rounded-[2.5rem] overflow-hidden bio-cut border-2 border-white/10 shadow-2xl transform hover:scale-[1.02] transition-transform">
                                <div className="absolute inset-0 bg-nutri-brand/10 mix-blend-color z-10"></div>
                                <img src={content.profileUrl} alt="Especialista en Nutrición" className="w-full h-auto object-cover opacity-80" />
                                {isEditable && (
                                    <EditableImage
                                        label="Foto Perfil"
                                        src={content.profileUrl}
                                        onSave={(val) => handleSave('profileUrl', val)}
                                        className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4"
                                    />
                                )}
                            </div>
                        </div>

                        {/* Text Content */}
                        <div className="lg:w-3/5">
                            {isEditable ? (
                                <div className="space-y-6">
                                    <EditableText
                                        label="Título 1"
                                        value={content.title1}
                                        onSave={(val) => handleSave('title1', val)}
                                        className="text-3xl md:text-5xl font-tech font-bold text-white"
                                    />
                                    <EditableText
                                        label="Texto 1"
                                        value={content.text1}
                                        onSave={(val) => handleSave('text1', val)}
                                        className="text-base text-slate-300 font-sans leading-relaxed"
                                        multiline
                                    />
                                    <EditableText
                                        label="Título 2"
                                        value={content.title2}
                                        onSave={(val) => handleSave('title2', val)}
                                        className="text-3xl md:text-5xl font-tech font-bold text-white"
                                    />
                                    <EditableText
                                        label="Texto 2"
                                        value={content.text2}
                                        onSave={(val) => handleSave('text2', val)}
                                        className="text-base text-slate-300 font-sans leading-relaxed"
                                        multiline
                                    />
                                </div>
                            ) : (
                                <>
                                    <h3 className="text-4xl md:text-5xl font-tech font-bold text-white mb-6 leading-tight whitespace-pre-line">
                                        {content.title1.split(' ').map((word, idx, arr) => {
                                            if (idx === arr.length - 1 || (idx === arr.length - 2 && arr[arr.length - 1] === '')) {
                                                return <span key={idx} className="text-nutri-brand">{word} </span>
                                            }
                                            return word + ' '
                                        })}
                                    </h3>
                                    <p style={{ marginBottom: "6px" }} className="text-base text-slate-300 font-sans leading-relaxed mb-8 whitespace-pre-line text-justify">
                                        {content.text1}
                                    </p>
                                    <br />

                                    <h3 className="text-4xl md:text-5xl font-tech font-bold text-white mb-6 leading-tight whitespace-pre-line">
                                        {content.title2.split(' ').map((word, idx, arr) => {
                                            if (idx === arr.length - 1 || (idx === arr.length - 2 && arr[arr.length - 1] === '')) {
                                                return <span key={idx} className="text-nutri-brand">{word} </span>
                                            }
                                            return word + ' '
                                        })}
                                    </h3>
                                    <p style={{ marginBottom: "6px" }} className="text-base text-slate-300 font-sans leading-relaxed mb-4 whitespace-pre-line text-justify">
                                        {content.text2}
                                    </p>

                                    {/* Mobile Toggle Button */}
                                    {!isEditable && (
                                        <div className="lg:hidden mb-6">
                                            <button
                                                onClick={() => setIsBioExpanded(!isBioExpanded)}
                                                className="flex items-center gap-2 text-nutri-brand font-bold uppercase tracking-wider text-sm hover:opacity-80 transition-opacity"
                                            >
                                                {isBioExpanded ? (
                                                    <>Ver menos <ChevronUp className="h-4 w-4" /></>
                                                ) : (
                                                    <>Ver más <ChevronDown className="h-4 w-4" /></>
                                                )}
                                            </button>
                                        </div>
                                    )}

                                    <div className={cn(
                                        "space-y-6 transition-all duration-500 overflow-hidden",
                                        !isBioExpanded && !isEditable ? "max-h-0 lg:max-h-none opacity-0 lg:opacity-100" : "max-h-[2000px] opacity-100"
                                    )}>
                                        <p className="text-base text-slate-300 font-sans leading-relaxed whitespace-pre-line text-justify">
                                            {content.extraText1}
                                        </p>
                                        <p className="text-base text-slate-300 font-sans leading-relaxed whitespace-pre-line text-justify">
                                            <strong>¿Qué me inspiró a estudiar nutrición? </strong>
                                            <br />{content.extraText2}
                                        </p>
                                    </div>
                                </>
                            )}
                            {isEditable && (
                                <div className="mt-8 space-y-6">
                                    <EditableText
                                        label="Texto Inspiración 1"
                                        value={content.extraText1}
                                        onSave={(val) => handleSave('extraText1', val)}
                                        className="text-base text-slate-300 font-sans leading-relaxed mb-8 text-justify"
                                        multiline
                                    />
                                    <EditableText
                                        label="Texto Inspiración 2"
                                        value={content.extraText2}
                                        onSave={(val) => handleSave('extraText2', val)}
                                        className="text-base text-slate-300 font-sans leading-relaxed mb-8 text-justify"
                                        multiline
                                    />
                                </div>
                            )}
                        </div>

                    </div>
                </div>
            </div>
        </section>
    );
}
