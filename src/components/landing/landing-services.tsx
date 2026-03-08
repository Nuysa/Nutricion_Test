"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { useVisualEditor } from "@/components/dashboard/admin/visual-editor-context";
import { EditableText } from "@/components/dashboard/admin/editable-text";
import { EditableImage } from "@/components/dashboard/admin/editable-image";

export function LandingServices() {
    const { isEditable } = useVisualEditor();
    const [content, setContent] = useState({
        title: "Esto es lo que puedo hacer por ti",
        services: [
            {
                id: 1,
                title: "Nutrición Clínica",
                description: "Te ayudo a manejar y mejorar condiciones como: diabetes, resistencia a la insulina, colesterol alto, hígado graso, etc.",
                image: "/nutricion_clinica.png"
            },
            {
                id: 2,
                title: "Asesoría Nutricional",
                description: "Acompañamiento personalizado para comer simple, saludable y sostenible.",
                image: "/delia1.png"
            },
            {
                id: 3,
                title: "Nutrición para objetivos físicos",
                description: "Si buscas perder grasa, bajar de peso, reducir medidas, ganar masa muscular o lograr una recomposición corporal, te guiaremos paso a paso para lograrlo de manera consciente y adaptada a tu estilo de vida.",
                image: "/nutricion_para_objetivos_fisicos.png"
            }
        ]
    });

    useEffect(() => {
        const fetchContent = async () => {
            const supabase = createClient();
            const { data } = await supabase.from('landing_content').select('content').eq('section', 'services').single();
            if (data?.content) {
                setContent(prev => ({ ...prev, ...data.content }));
            }
        };
        fetchContent();
    }, []);

    const handleSave = async (updatedContent: any) => {
        const supabase = createClient();
        const { error } = await supabase
            .from('landing_content')
            .upsert({ section: 'services', content: updatedContent }, { onConflict: 'section' });

        if (!error) {
            setContent(updatedContent);
        } else {
            throw error;
        }
    };

    const updateService = (id: number, field: string, value: string) => {
        const newServices = content.services.map(s => s.id === id ? { ...s, [field]: value } : s);
        return handleSave({ ...content, services: newServices });
    };

    return (
        <section id="servicios" className="scroll-mt-32 py-24 relative z-10 border-y border-white/5">
            <div className="max-w-screen-2xl mx-auto px-6 lg:px-8">
                <div className="text-center mb-16 relative">
                    {isEditable ? (
                        <EditableText
                            label="Título Servicios"
                            value={content.title}
                            onSave={(val) => handleSave({ ...content, title: val })}
                            className="text-4xl lg:text-5xl font-tech font-black text-white leading-tight"
                        />
                    ) : (
                        <h3 className="text-4xl lg:text-5xl font-tech font-black text-white leading-tight">{content.title}</h3>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {content.services.map((service) => (
                        <div key={service.id} className="bg-nutri-panel border border-white/5 rounded-3xl p-8 hover:-translate-y-2 hover:border-nutri-brand/50 transition-all duration-300 group relative">
                            <div className="w-full h-81 bg-nutri-base border border-nutri-brand/30 rounded-xl flex items-center justify-center text-2xl mb-6 shadow-lg overflow-hidden relative">
                                <img src={service.image} alt={service.title} className="w-full h-full object-cover opacity-80" />
                                {isEditable && (
                                    <EditableImage
                                        label={`Imagen ${service.title}`}
                                        src={service.image}
                                        onSave={(val) => updateService(service.id, 'image', val)}
                                        className="top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 p-4"
                                    />
                                )}
                            </div>


                            {isEditable ? (
                                <>
                                    <EditableText
                                        label="Título Servicio"
                                        value={service.title}
                                        onSave={(val) => updateService(service.id, 'title', val)}
                                        className="text-2xl font-tech font-bold text-white mb-4 block"
                                    />
                                    <EditableText
                                        label="Descripción Servicio"
                                        value={service.description}
                                        onSave={(val) => updateService(service.id, 'description', val)}
                                        className="text-slate-400 font-sans text-sm leading-relaxed block"
                                        multiline
                                    />
                                </>
                            ) : (
                                <>
                                    <h4 className="text-2xl font-tech font-bold text-white mb-4">{service.title}</h4>
                                    <p className="text-slate-400 font-sans text-sm leading-relaxed text-justify">{service.description}</p>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
}
